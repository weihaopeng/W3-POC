import { Account, Transaction, BlockProposal, Block, Chain, Fork } from '../entities/index.js'
import { LocalFacts } from './local-facts.js'
import _ from 'lodash'

import Debug from 'debug'
import { Epoch } from './epoch/epoch.js'
const debug = Debug('w3:node')

class Node {
  static index = 0
  constructor ({ account, swarm, isSingleNode=false }) {
    if (!account || !swarm) throw new Error(`can't create a node, check the params`)
    account = account instanceof Account ? account : new Account(account)
    this.i = this.constructor.index++ // sequence number used in dev and debug
    this.account = account
    this.swarm = swarm
    this.localFacts = new LocalFacts()
    this.isSingleNode = isSingleNode // is the only node in the swarm, used to separate the concern of two-stages-mint and the collaborations among nodes.
    this.startAnswerQuery()
  }

  toJSON() {
    _.omit(this, ['swarm', 'localFacts', 'epoch', 'chain'])
  }


  reset(height) {
    this.epoch.reset(height)
    this.localFacts.reset()
    this.chain.reset()
  }

  async destroy() {
    // abstract, may use to release resources
  }

  async syncChain () {
    // TODO: sync chain info from swarm
    // const chain = await this.swarm.queryPeers?.({})
    // return chain ? chain : new Promise((r, j) => setTimeout(() => r(this.initChain()), this.swarm.config.INIT_CHAIN_INTERVAL))

    // local swarm swarm, never disconnected
    this.chain = await Chain.create(this)
    this.epoch = Epoch.create(this)
    this.localFacts.init(this.chain)
  }

  async boot () { //
    // this.chain = await Chain.create()
    // const block = new Block(null, 'FIRST_BLOCK')
    // this.swarm.broadcast('block', block, this) //this used in theory test to avoid of react on its own message
  }

  onConnected() {
    this.syncChain().then(_ => this.start()) // start() is the fsm transition
  }

  onDisconnected() {
    this.epoch.stop()
    // abstract
  }

  onReady () {
    this.startTwoStagesBlockGeneration()
  }

  onLeaveReady() {
    this.stopTwoStagesBlockGeneration()

  }

  startAnswerQuery () { // answers only by adjacent peers
    this.swarm.listen('query', async (msg, ack) => {
      if (msg.event === 'query') {
        const res = await this.query(msg.query)
        ack(res)
      }
    }, this)
  }

  startTwoStagesBlockGeneration () {
    this.swarm.listen('tx', (tx) => this.handleTx(tx), this) // this is the target used in theory test to avoid of react on its own message

    this.swarm.listen('bp', (bp) => this.handleWitness(bp), this)

    this.swarm.listen('block',  (block, origin) => this.handleNewBlock(block, origin), this)

    this.swarm.listen('fork',  (fork) => this.handleForkWins(fork), this)

    this.epoch.on('stage',  async ({ stage }) => {
      if (stage === 'witness-and-mint') { // updatedState, replaced, rejected means the count of txPool in the pool is not change
        const txs = this.localFacts.pickTxsForBp()
        if (txs.length >= 1) {
          this.isCollector() && await this.askForWitnessAndMint(txs)
        } else {
          console.log('--- FATAL: no enough txs for bp')
        }
      }
    })

    this.epoch.start()
  }

  async handleTx (tx) {
    tx = new Transaction(tx)
    const { valid, txRes } = await this.localFacts.verifyAndAddTx(tx)
    this.swarm.emitW3Event('node.verify', {type: 'tx', data: tx, node: this, valid})
    // debug('--- txRes: ', txRes)
    valid && this.isCollector() && await this.collect(tx) // TODO: only for debug, may remove in future
  }

  async handleWitness (bp) {
    bp = new BlockProposal(bp)
    let epoch = this.getEpoch(bp)
    const { valid } = await this.localFacts.verifyBpAndAddTxs(bp, this, epoch)
    this.swarm.emitW3Event('node.verify', {type: 'bp', data: bp, node: this, valid})
    if (valid) {
      if (!this.epoch.canWitness(bp.height))
        return debug('--- FATAL: receive invalid bp height: %s, not for this epoch %s', bp.height, this.epoch.height, bp.brief)
      this.isWitness(bp) && await this.witnessAndMint(bp)
    }
  }

  async handleNewBlock (block, origin) {
    debug('*************** WARN: node %s receive new block %s from %s', this.i, block.superBrief, origin.i)
    block = new Block(block)

    let epoch = this.getEpoch(block)
    if (epoch !== this.epoch) this.epoch.reset() // the block from previous epoch, reset the epoch @see design/w3-node-activities-and-messages.png

    const { valid } = await this.localFacts.verifyBlockAndAddTxs(block, this,epoch)
    if (!valid) debug('--- FATAL: receive invalid block', block.brief)
    this.swarm.emitW3Event('node.verify', {type: 'block', data: block, node: this, valid})

    if (valid && (this !== origin || this.isSingleNode)) {
      this.chain.addOrReplaceBlock(block, 'handleNewBlock')
    }
  }

  getEpoch (obj) {
    if (obj.height === this.epoch.height) {
      if (this.epoch.stage === 'collect') {
        return this.epoch.previous
      } else {
        debug('*************** FATAL: receive old block/bp, but epoch is not in collect state')
        return this.epoch
      }
    }
    return this.epoch
  }

  async handleForkWins (fork) { // { _blocks }
    fork = new Fork(fork)
    const { valid } = await this.localFacts.verifyForkAndAddTx(fork, this)
    this.swarm.events.emit('node.verify', {type: 'fork', data: fork, node: this, valid})

    if (!valid) {
      debug('fork is invalid, skip it', fork)
    }
    // TODO: 按其中的消息，检查chain
  }

  isCollector (pks = this.account.publicKeyString, tailHash=this.epoch.tailHash) {
    return this._isCollector(pks, tailHash)
    // return this.isSingleNode || this._isCollector(pks)
  }

  _isCollector (pks, tailHash) {
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
    this.swarm.recordCollector(tx, this)
    // the tx is not only collected from tx messages, but also collected from bp, block, fork messages containing valid txPool
    // therefore refactor the ASF logic to the localFacts' tx-added event handler
  }

  async witnessAndMint (bp) {
    debug('--- node %s witness bp %s ', this.i, bp.brief)
    this.swarm.recordWitness(bp, this)
    // this.swarm.debug.witnesses.push({bp, node: this})
    await bp.witness(this)
    this.isNeedMoreRoundOfWitness(bp) ? await this.continueWitnessAndMint(bp) :
      await this.mintBlock(bp)
  }

  async askForWitnessAndMint (txs) {
    const bp = this.createBlockProposal(txs)
    this.localFacts.updateTxsState(txs, 'bp')
    this.swarm.broadcast('bp', bp, this) //this used in theory test to avoid of react on its own message
  }

  createBlockProposal (txs) {
    const bp = new BlockProposal({
      // height: this.chain.height + 1, tailHash: this.epoch.tailHash, txs, collector: this.i //  i is better for dev debug
      height: this.chain.height + 1, tailHash: this.epoch.tailHash, txs, collector: {i: this.i, publicKeyString: this.account.publicKeyString}
    })
    bp.askForWitness(this)
    return bp
  }

  isNeedMoreRoundOfWitness (bp) {
    return bp.witnessRecords.length < this.swarm.config.WITNESS_ROUNDS_AMOUNT
  }

  async continueWitnessAndMint (bp) {
    bp.askForWitness(this)
    this.swarm.broadcast('bp', bp, this) //this used in theory test to avoid of react on its own message
  }

  async mintBlock (bp) {
    const block = Block.mint(bp, this.epoch.tailHash)

    // debug('--- WARN: node %s mint block %s ', this.i, block.superBrief)
    if (!this.isSingleNode) this.chain.addOrReplaceBlock(block, 'mintBlock')// verifyThenUpdateOrAddTx to local chain before broadcast, singleNodeMode will verifyThenUpdateOrAddTx it in handleNewBlock
    this.swarm.broadcast('block', block, this) //this used in theory test to avoid of react on its own message
  }

  async query (query) {
    // TODO: sophisticated query
    return { chain: this.chain }
  }

  stopTwoStagesBlockGeneration () {
    this.epoch.stop()
  }
}

export { Node }
