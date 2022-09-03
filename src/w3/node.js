import { Network } from './network.js'
import { Chain } from './chain.js'
import { TransactionsPool } from './transactions-pool.js'
import { Transaction } from './transaction.js'
import { Block } from './block.js'
import { BlockProposal } from './block-proposal.js'

import Debug from 'debug'
const debug = Debug('w3:node')

class Node {
  constructor({ network, txCount, publicKey, privateKey, initChainInterval, witnessRounds }) {
    if (!network || !txCount || !publicKey || !initChainInterval) throw new Error(`can't create node, check the params`)
    this.publicKey = publicKey
    this.initChainInterval = initChainInterval
    this.witnessRounds = witnessRounds
    this.network = new Network(network)
    this.txPool = new TransactionsPool(txCount)
  }

  async init() {
    await this.network.init()
    const chain = await this.initChain()
    this.chain = await Chain.create(chain)
  }

  async initChain() {
    const chain = await this.network.queryPeers({})
    return chain ? chain : new Promise((r, j) => setTimeout(() => r(this.initChain()), this.initChainInterval))
  }

  async boot() { //
    this.chain = await Chain.create()
  }

  async start() {
    this.startAnswerQuery()
    this.startTwoStagesBlockGeneration()
  }

  startAnswerQuery() { // answers only by adjacent peers
    this.network.listen(async (msg, ack) => {
      if (msg.event === 'query') {
        const res = await this.query(msg.query)
        ack(res)
      }
    })
  }

  startTwoStagesBlockGeneration () {
    this.network.listen('tx', async (tx) => {
      await this.collect(tx)
      await this.checkAndUpdateChain({ tx })
    })

    this.network.listen('block-proposal', async (bp) => {
      await this.checkAndUpdateChain({ bp })
      await this.witnessAndMint(bp)
    })

    this.network.listen('new-block', async (block) => {
      await this.checkAndUpdateChain({ block })
      await this.handleNewBlock(block)
    })

    this.network.listen('fork-wins', async (fork) => {
      await this.checkAndUpdateChain({ fork })
      await this.handleForkWins(fork)
    })

  }

  async collect(tx) {
    tx = new Transaction(tx)
    const isValid = await this.verifyTx(tx)
    if (!isValid) return debug('tx is invalid, skip it', tx)
    const txs = this.txPool.addAndPickTxs(tx)
    txs && await this.askForWitneesAndMint(txs)
  }

  async witnessAndMint(bp) {
    bp = new BlockProposal(bp)
    const isValid = await this.verifyBp(bp)
    if (!isValid) return debug('bp is invalid, skip it', bp)
    bp.witness(this.publicKey)
    this.isNeedMoreRoundOfWitness(bp) ? await this.continueWitnessAndMint(bp) :
      await this.mintBlock(bp)
  }

  async handleNewBlock(block) {
    // TODO: 按 design/handle-new-block.png 算法处理
  }

  async handleForkWins(forkBlocks) { // { forkPoint, blocksAfter }
    // TODO: 按其中的消息，检查chain
  }

  async askForWitneesAndMint(txs) {
    const bp = new BlockProposal({
      height: this.chain.height + 1, tailHash:  this.chain.tailHash, txs
    })
    bp.askForWitness(this)
    this.network.broadcast({ event: 'block-proposal', bp })
  }


  async verifyTx(tx) {
    // verify transaction according to all local information, include the chain, fork, txPools
  }

  async verifyBp(bp) {
    // verify bp according to all local information, include the chain, fork, txPools

  }

  isNeedMoreRoundOfWitness (bp) {
    return bp.askForWitnessRecords.length < this.witnessRounds
  }

  async continueWitnessAndMint (bp) {
    bp.askForWitness(this)
    this.network.broadcast({ event: 'block-proposal', bp: bp })
  }

  async mintBlock (bp) {
    const block = Block.mint(bp, this.chain)
    this.network.broadcast({ event: 'new-block', block })
  }

  async query(query) {
    // TODO: sophisticated query
    return { chain: this.chain }
  }

  async checkAndUpdateChain ({ tx, block, bp, fork }) {
    // TODO
  }
}

export { Node }
