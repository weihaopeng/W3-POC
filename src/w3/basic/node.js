import { Chain } from './chain.js'
import { TransactionsPool } from './transactions-pool.js'
import { Transaction } from './transaction.js'
import { Block } from './block.js'
import { BlockProposal } from './block-proposal.js'

import Debug from 'debug'

const debug = Debug('w3:node')

class Account {
  constructor ({ address, publicKey, privateKey, addressString, publicKeyString, privateKeyString }) {
    Object.assign(this, { address, publicKey, privateKey, addressString, publicKeyString, privateKeyString })
  }

  compareTo (other) {
    return this.address === other.address ? 0 : this.address > other.address ? 1 : -1
  }
}

class Node {
  constructor ({ account, network, txCount, initChainInterval, witnessRounds }) {
    if (!account || !network || !txCount || !initChainInterval || !witnessRounds) throw new Error(`can't create node, check the params`)
    this.account = account
    this.initChainInterval = initChainInterval
    this.witnessRounds = witnessRounds
    this.network = network
    this.txPool = new TransactionsPool(txCount)
  }

  async init () {
    // const chain = await this.initChain() // TODO bypass in theory test
    // this.chain = await Chain.create(chain)
    this.chain = await Chain.create()
  }

  async initChain () {
    const chain = await this.network.queryPeers?.({})
    return chain ? chain : new Promise((r, j) => setTimeout(() => r(this.initChain()), this.initChainInterval))
  }

  async boot () { //
    this.chain = await Chain.create()
    const block = new Block(null, 'FIRST_BLOCK')
    this.network.broadcast('new-block', block, this) //this used in theory test to aviod of react on its own message
  }

  async start () {
    debug('--- starting: %s', this.account.addressString)
    await this.init()
    this.startAnswerQuery()
    this.startTwoStagesBlockGeneration()
    debug('--- started: %s', this.account.addressString)
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
    this.network.listen('tx', async (tx) => {
      await this.updateLocalFact({ tx })
      await this.handleTx(tx)
    }, this) // this is the target used in theory test to aviod of react on its own message

    this.network.listen('block-proposal', async (bp) => {
      await this.updateLocalFact({ bp })
      await this.handleWitness(bp)
    }, this)

    this.network.listen('new-block', async (block) => {
      await this.updateLocalFact({ block })
      await this.handleNewBlock(block)
    }, this)

    this.network.listen('fork-wins', async (fork) => {
      await this.updateLocalFact({ block })
      await this.handleForkWins(fork)
    }, this)

  }

  async handleWitness (bp) {
    this.isWitness(bp) && await this.witnessAndMint(bp)
  }

  async handleTx (tx) {
    this.isCollector() && await this.collect(tx)
  }

  isCollector () {
    // abstract now
  }

  isWitness () {
    // abstract now
  }

  async collect (tx) {
    debug('---node %s collect tx %o ', this.account.addressString, tx)
    this.network.recordCollector(tx, this)
    tx = new Transaction(tx)
    const isValid = await this.verifyTx(tx)
    if (!isValid) return debug('tx is invalid, skip it', tx)
    const txs = this.txPool.addAndPickTxs(tx)
    txs && await this.askForWitnessAndMint(txs)
  }

  async witnessAndMint (bp) {
    bp = new BlockProposal(bp)
    const isValid = await this.verifyBp(bp)
    if (!isValid) return debug('bp is invalid, skip it', bp)
    debug('---node %s witness bp %o ', this.account.addressString, bp)
    this.network.recordWitness(bp, this)
    await bp.witness(this.account)
    this.isNeedMoreRoundOfWitness(bp) ? await this.continueWitnessAndMint(bp) :
      await this.mintBlock(bp)
  }

  async handleNewBlock (block) {
    // TODO: 按 design/handle-new-block.png 算法处理
    this.chain.addBlock(block)
  }

  async handleForkWins (forkBlocks) { // { forkPoint, blocksAfter }
    // TODO: 按其中的消息，检查chain
  }

  async askForWitnessAndMint (txs) {
    const bp = this.createBlockProposal(txs)
    bp.askForWitness(this.account)
    this.network.broadcast('block-proposal', bp, this) //this used in theory test to aviod of react on its own message
  }

  createBlockProposal (txs) {
    const bp = new BlockProposal({
      height: this.chain.height + 1, tailHash: this.chain.tailHash, txs, collector: this.account.publicKeyString
    })
    return bp
  }

  async verifyTx (tx) {
    // verify transaction according to local facts, include the chain, fork, txPools
    return true // TODO
  }

  async verifyBp (bp) {
    // verify bp according to local facts, include the chain, fork, txPools
    return true // TODO
  }

  isNeedMoreRoundOfWitness (bp) {
    return bp.witnessRecords.length < this.witnessRounds
  }

  async continueWitnessAndMint (bp) {
    bp.askForWitness(this)
    this.network.broadcast('block-proposal', bp, this) //this used in theory test to aviod of react on its own message
  }

  async mintBlock (bp) {
    const block = Block.mint(bp, this.chain)
    this.network.broadcast('new-block', block, this) //this used in theory test to aviod of react on its own message
  }

  async query (query) {
    // TODO: sophisticated query
    return { chain: this.chain }
  }

  async updateLocalFact ({ tx, block, bp, fork }) {
    // TODO:
  }
}

export { Account, Node }
