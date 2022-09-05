import { Chain } from './chain.js'
import { TransactionsPool } from './transactions-pool.js'
import { Transaction } from './transaction.js'
import { Block } from './block.js'
import { BlockProposal } from './block-proposal.js'

import Debug from 'debug'
const debug = Debug('w3:node')

class Account {
  static index = 0 // TODO: currently only used for theory test
  constructor ({ address, publicKey, privateKey, addressString, publicKeyString, privateKeyString }) {
    Object.assign(this, { address, publicKey, privateKey, addressString, publicKeyString, privateKeyString })
    this.i = this.constructor.index++ // TODO: currently only used for theory test
  }

  compareTo (other) {
    return this.address === other.address ? 0 : this.address > other.address ? 1 : -1
  }
}

class Node {
  constructor ({ account, network, txCount, initChainInterval, witnessRounds, isSingleNode=false }) {
    if (!account || !network || !txCount || !initChainInterval || !witnessRounds) throw new Error(`can't create node, check the params`)
    this.account = account
    this.initChainInterval = initChainInterval
    this.witnessRounds = witnessRounds
    this.network = network
    this.txPool = new TransactionsPool(txCount)
    this.isSingleNode = isSingleNode // is the only node in the network, used to separate the concern of two-stages-mint and the collaborations among nodes.
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

    this.network.listen('block-proposal', (bp) => this.handleWitness(bp), this)

    this.network.listen('new-block',  (block, origin) => this.handleNewBlock(block, origin), this)

    this.network.listen('fork-wins',  (fork) => this.handleForkWins(fork), this)

  }

  async handleTx (tx) {
    await this.updateLocalFact({ tx })
    this.isCollector() && await this.collect(tx)
  }

  async handleWitness (bp) {
    await this.updateLocalFact({ bp })
    this.isWitness(bp) && await this.witnessAndMint(bp)
  }

  async handleNewBlock (block, origin) {
    // TODO: 按 design/handle-new-block.png 算法处理
    await this.updateLocalFact({ block })
    this === origin || this.chain.addBlock(block, this) // in single node mode, the new-block msg also comes from itself, so we need to check the origin
  }

  async handleForkWins (forkBlocks) { // { forkPoint, blocksAfter }
    await this.updateLocalFact({ block })
    // TODO: 按其中的消息，检查chain
  }

  isCollector () {
    return this.isSingleNode || this._isCollector()
  }

  _isCollector () {
    // abstract now
  }

  isWitness () {
    return this.isSingleNode || this._isWitness()
  }

  _isWitness () {
    // abstract now
  }

  async collect (tx) {
    debug('---node %s collect tx %s ', this.account.i, tx)
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
    debug('---node %s witness bp %s ', this.account.i, bp.brief)
    this.network.recordWitness(bp, this)
    await bp.witness(this.account)
    this.isNeedMoreRoundOfWitness(bp) ? await this.continueWitnessAndMint(bp) :
      await this.mintBlock(bp)
  }

  async askForWitnessAndMint (txs) {
    const bp = this.createBlockProposal(txs)
    this.network.broadcast('block-proposal', bp, this) //this used in theory test to aviod of react on its own message
  }

  createBlockProposal (txs) {
    const bp = new BlockProposal({
      height: this.chain.height + 1, tailHash: this.chain.tailHash, txs, collector: this.account.publicKeyString
    })
    bp.askForWitness(this.account)
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
    this.chain.addBlock(block, this) // add to local chain before broadcast
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
