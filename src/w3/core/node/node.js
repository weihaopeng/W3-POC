import { Chain } from '../entities/chain.js'
import { TransactionsPool } from './transactions-pool.js'
import { Transaction } from '../entities/transaction.js'
import { Block } from '../entities/block.js'
import { Fork } from '../entities/fork.js'
import { BlockProposal } from '../entities/block-proposal.js'

import Debug from 'debug'
import _ from 'lodash'
const debug = Debug('w3:node')

class Node {
  constructor ({ account, network, isSingleNode=false }) {
    if (!account || !network) throw new Error(`can't create node, check the params`)
    this.account = account
    this.network = network
    this.txPool = new TransactionsPool(this.network.config.TX_COUNT)
    this.isSingleNode = isSingleNode // is the only node in the network, used to separate the concern of two-stages-mint and the collaborations among nodes.
  }

  async init () {
    // const chain = await this.initChain() // TODO bypass in theory test
    // this.chain = await Chain.create(chain)
    this.chain = await Chain.create()
  }

  reset() {
    this.txPool.reset()
    this.chain.reset()
  }

  async destroy() {
    // abstract, may use to release resources
  }

  async initChain () {
    const chain = await this.network.queryPeers?.({})
    return chain ? chain : new Promise((r, j) => setTimeout(() => r(this.initChain()), this.network.config.INIT_CHAIN_INTERVAL))
  }

  async boot () { //
    // this.chain = await Chain.create()
    // const block = new Block(null, 'FIRST_BLOCK')
    // this.network.broadcast('block', block, this) //this used in theory test to aviod of react on its own message
  }

  async start () {
    debug('--- starting: %s', this.account.i)
    await this.init()
    this.startAnswerQuery()
    this.startTwoStagesBlockGeneration()
    debug('--- started: %s', this.account.i)
  }

  startAnswerQuery () { // answers only by adjacent peers
    this.network.listen('query', async (msg, ack) => {
      if (msg.event === 'query') {
        const res = await this.query(msg.query)
        ack(res)
      }
    }, this)
  }

  startTwoStagesBlockGeneration () {
    this.network.listen('tx', (tx) => this.handleTx(tx), this) // this is the target used in theory test to aviod of react on its own message

    this.network.listen('bp', (bp) => this.handleWitness(bp), this)

    this.network.listen('block',  (block, origin) => this.handleNewBlock(block, origin), this)

    this.network.listen('fork',  (fork) => this.handleForkWins(fork), this)

    this.txPool.on('tx-added', async ({tx, state, res}) => {
      if (res === 'added') { // updatedState, replaced, rejected means the count of txs in the pool is not change
        const txs = this.txPool.pickEnoughForBp()
        txs && await this.askForWitnessAndMint(txs)
      }
    })
  }

  async handleTx (tx) {
    tx = new Transaction(tx)
    const isTxAdded = await this.updateLocalFact({ tx })
    debug('--- isTxAdded: ', isTxAdded)
    isTxAdded && this.isCollector() && await this.collect(tx)
  }

  async handleWitness (bp) {
    bp = new BlockProposal(bp)
    const isValid = await this.updateLocalFact({ bp })
    isValid && this.isWitness(bp) && await this.witnessAndMint(bp)
  }

  async handleNewBlock (block, origin) {
    block = new Block(block)
    const isValid = await this.updateLocalFact({ bp })
    if (!isValid) debug('--- FATAL: receive invalid block', block.brief)
    // TODO: 按 design/handle-block.png 算法处理
    isValid && (this === origin || this.chain.addBlock(block, this)) // in single node mode, the block msg also comes from itself, so we need to check the origin
  }

  async handleForkWins (fork) { // { blocks }
    fork = new Fork(fork)
    const isValid = await this.verifyFork(fork)
    if (!isValid) {
      debug('fork is invalid, skip it', fork)
      return this.network.events.emit('node.verify', {type: 'fork', data: fork, node: this, valid: isValid})
    }
    await this.updateLocalFact({ block })
    // TODO: 按其中的消息，检查chain
  }

  isCollector (pks = this.account.publicKeyString) {
    return this.isSingleNode || this._isCollector(pks)
  }

  _isCollector (pks) {
    // abstract now
  }

  isWitness (bp, pks = this.account.publicKeyString) {
    return this.isSingleNode || this._isWitness(bp, pks)
  }

  _isWitness (bp, pks) {
    // abstract now
  }

  async collect (tx) {
    debug('--- node %s collect tx %s ', this.account.i, tx)
    this.network.recordCollector(tx, this)
    // the tx is not only collected from tx messages, but also colected from bp, block, fork messages containing valid txs
    // therefore refator the ASF logic to the txPool's tx-added event handler
    // const txs = this.txPool.pickEnoughForBp()
    // txs && addwait this.askForWitnessAndMint(txs)
  }

  async witnessAndMint (bp) {
    debug('--- node %s witness bp %s ', this.account.publicKeyString, bp.brief)
    this.network.recordWitness(bp, this)
    // this.network.debug.witnesses.push({bp, node: this})
    await bp.witness(this.account)
    this.isNeedMoreRoundOfWitness(bp) ? await this.continueWitnessAndMint(bp) :
      await this.mintBlock(bp)
  }

  async askForWitnessAndMint (txs) {
    const bp = this.createBlockProposal(txs)
    this.network.broadcast('bp', bp, this) //this used in theory test to aviod of react on its own message
  }

  createBlockProposal (txs) {
    const bp = new BlockProposal({
      height: this.chain.height + 1, tailHash: this.chain.tailHash, txs, collector: this.account.publicKeyString
    })
    bp.askForWitness(this.account)
    return bp
  }

  async verifyBlock (block) {
    // verify block according to local facts, include the chain, fork, txPools
    return true // TODO
  }

  async verifyFork (fork) {
    // verify fork according to local facts, include the chain, fork, txPools
    return true // TODO
  }

  isNeedMoreRoundOfWitness (bp) {
    return bp.witnessRecords.length < this.network.config.WITNESS_ROUNDS_AMOUNT
  }

  async continueWitnessAndMint (bp) {
    bp.askForWitness(this.account)
    this.network.broadcast('bp', bp, this) //this used in theory test to aviod of react on its own message
  }

  async mintBlock (bp) {
    const block = Block.mint(bp, this.chain)
    this.chain.addBlock(block, this) // add to local chain before broadcast
    this.txPool.update(block.txs, 'chain')
    this.network.broadcast('block', block, this) //this used in theory test to aviod of react on its own message
  }

  async query (query) {
    // TODO: sophisticated query
    return { chain: this.chain }
  }

  async updateLocalFact ({ tx, bp, block, fork }) {
    // TODO: 根据bp、block、fork消息中的height，来判定当前node是否需要stop(退出ready)
    if (tx) {
      const { valid, txRes } = await this.txPool.verifyAndAddTx(tx)
      this.network.emitW3Event('node.verify', {type: 'tx', data: tx, node: this, valid})
      return txRes === 'added' // replaced or rejected tx will not cause the txs in txPool count up, and no need to make a block proposal
    } else if (bp) {
      const { valid } = await this.txPool.verifyBpAndAddTxs(bp, this)
      this.network.emitW3Event('node.verify', {type: 'bp', data: bp, node: this, valid})
      return valid
    } else if (block) {
      const { valid } = await this.txPool.verifyBlockAndAddTxs(bp, this)
      this.network.emitW3Event('node.verify', {type: 'block', data: block, node: this, valid})
      return valid
    } else { // fork
      throw new Error('not implemented')
    }
    // TODO:
  }
}

export { Node }
