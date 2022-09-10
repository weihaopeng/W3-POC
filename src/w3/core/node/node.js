import { Chain } from '../entities/chain.js'
import { LocalFacts } from './local-facts.js'
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
    this.localFacts = new LocalFacts(this.network.config.TX_COUNT)
    this.isSingleNode = isSingleNode // is the only node in the network, used to separate the concern of two-stages-mint and the collaborations among nodes.
  }

  async init () {
    // const chain = await this.initChain() // TODO bypass in theory test
    // this.chain = await Chain.create(chain)
    this.chain = await Chain.create()
    this.localFacts.init(this.chain)
  }

  reset() {
    this.localFacts.reset()
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

    this.localFacts.on('tx-updated-or-added', async ({tx, state, res}) => {
      if (res === 'added') { // updatedState, replaced, rejected means the count of txPool in the pool is not change
        const txs = this.localFacts.pickEnoughTxsForBp()
        txs && await this.askForWitnessAndMint(txs)
      }
    })
  }

  async handleTx (tx) {
    tx = new Transaction(tx)
    const isTxAdded = await this.updateLocalFact('tx', tx)
    debug('--- isTxAdded: ', isTxAdded)
    isTxAdded && this.isCollector() && await this.collect(tx)
  }

  async handleWitness (bp) {
    bp = new BlockProposal(bp)
    const isValid = await this.updateLocalFact('bp', bp)
    isValid && this.isWitness(bp) && await this.witnessAndMint(bp)
  }

  async handleNewBlock (block, origin) {
    block = new Block(block)
    const isValid = await this.updateLocalFact('block', block)
    if (!isValid) debug('--- FATAL: receive invalid block', block.brief)
    // TODO: 按 design/handle-block.png 算法处理
    isValid && ((this === origin && !this.isSingleNode) || this.chain.addBlock(block, this))
  }

  async handleForkWins (fork) { // { blocks }
    fork = new Fork(fork)
    const isValid = await this.verifyFork(fork)
    if (!isValid) {
      debug('fork is invalid, skip it', fork)
      return this.network.events.emit('node.verify', {type: 'fork', data: fork, node: this, valid: isValid})
    }
    await this.updateLocalFact('fork', fork)
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
    // the tx is not only collected from tx messages, but also colected from bp, block, fork messages containing valid txPool
    // therefore refator the ASF logic to the localFacts's tx-added event handler
    // const txPool = this.localFacts.pickEnoughTxsForBp()
    // txPool && addwait this.askForWitnessAndMint(txPool)
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

  isNeedMoreRoundOfWitness (bp) {
    return bp.witnessRecords.length < this.network.config.WITNESS_ROUNDS_AMOUNT
  }

  async continueWitnessAndMint (bp) {
    bp.askForWitness(this.account)
    this.network.broadcast('bp', bp, this) //this used in theory test to aviod of react on its own message
  }

  async mintBlock (bp) {
    const block = Block.mint(bp, this.chain)
    if (!this.isSingleNode) this.chain.addBlock(block, this) // verifyThenUpdateOrAddTx to local chain before broadcast, singleNodeMode will verifyThenUpdateOrAddTx it in handleNewBlock
    this.localFacts.updateTxsState(block.txs, 'chain')
    this.network.broadcast('block', block, this) //this used in theory test to aviod of react on its own message
  }

  async query (query) {
    // TODO: sophisticated query
    return { chain: this.chain }
  }

  async updateLocalFact (type, data) { // type: tx, bp, block, fork
    // TODO: 根据bp、block、fork消息中的height，来判定当前node是否需要stop(退出ready)
    const node = this
    const valid = await this.localFacts.verifyAndUpdate(type, data, node)
    this.network.emitW3Event('node.verify', {type, data, node, valid})
    return valid
  }
}

export { Node }
