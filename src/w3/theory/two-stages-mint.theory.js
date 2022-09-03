import { EventEmitter } from 'node:events'
import _ from 'lodash'
import Wallet from 'ethereumjs-wallet'
import { Account, Node } from '../basic/node.js'
import { util } from '../util.js'


import Debug from 'debug'
const debug = Debug('w3:theory')

const getEthereumAccount = () => {
  const EthWallet = Wallet.default.generate()
  const publicKey = EthWallet.getPublicKey() // Buffer(64)
  const privateKey = EthWallet.getPrivateKey() // Buffer(32)
  const address = EthWallet.getAddress()
  const publicKeyString = EthWallet.getPublicKeyString() // Buffer(64)
  const privateKeyString = EthWallet.getPrivateKeyString() // Buffer(32)
  const addressString = EthWallet.getAddressString()
  return new Account({ address, publicKey, privateKey, addressString, publicKeyString, privateKeyString })
}

class TheoryNode extends Node {
  static NODES_AMOUNT = 3000
  static COLLECTORS_AMOUNT = 5
  static WITNESSES_AMOUNT = 5
  static WITNESS_ROUNDS_AMOUNT = 3
  static TX_COUNT = 100
  static INIT_CHAIN_INTERVAL = 10000 // 10秒
  static setNodeAmount (nodesAmount) {
    this.NODES_AMOUNT = nodesAmount
    this.distanceFn = util.NHashDistance(this.NODES_AMOUNT)
  }

  static distanceFn = util.NHashDistance(TheoryNode.NODES_AMOUNT)

  static initPreBlockValue = Math.floor(Math.random() * this.NODES_AMOUNT)

  constructor (network) {
    const account = getEthereumAccount()
    super({
      account, network,
      txCount: TheoryNode.TX_COUNT,
      initChainInterval: TheoryNode.INIT_CHAIN_INTERVAL,
      witnessRounds: TheoryNode.WITNESS_ROUNDS_AMOUNT
    })
  }

  isCollector () {
    const preBlock = this.chain.tailHash || this.constructor.initPreBlockValue
    const distance = this.constructor.distanceFn(preBlock.toString(), this.account.publicKey)
    // debug('is collector,distance:', distance)
    return distance < this.constructor.COLLECTORS_AMOUNT
  }

  isWitness (blockProposal) {
    return this.constructor.distanceFn(blockProposal.toString(), this.account.publicKey) < this.constructor.WITNESSES_AMOUNT
  }
}

class W3Network extends EventEmitter {
  static events = ['tx', 'block-proposal', 'new-block', 'fork-wins', 'query']

  static MSG_ARRIVAL_RATIO = 1 // the ratio is always 1 in a P2P network using TCP as transportation protocol
  static LATENCY_LOWER_BOUND = 0
  static LATENCY_UPPER_BOUND = 10 // 100 milliseconds

  constructor () {
    super()
    this.setMaxListeners(0) // to supass MaxListenersExceededWarning https://nodejs.org/docs/latest/api/events.html#events_emitter_setmaxlisteners_n
    this.sta = { collectors: [], witnesses: []}
  }

  async init (nodesAmount=TheoryNode.NODES_AMOUNT) {
    this.nodes = [...new Array(nodesAmount)].map(i => new TheoryNode(this))
    await Promise.all(this.nodes.map(node => node.start()))
  }

  destroy () {
    this.nodes = null
    this.removeAllListeners()
  }

  listen (event, cb, target) {
    this.on(event, ({ origin, data }) => {
      if (Math.random() < this.constructor.MSG_ARRIVAL_RATIO && target !== origin) { // simulate of msg propagation, may lose in the way
        // simulate the
        setTimeout(() => cb(data), util.gaussRandom(this.constructor.LATENCY_LOWER_BOUND, this.constructor.LATENCY_UPPER_BOUND))
      }
    })
  }

  broadcast (event, data, origin) {
    this.emit(event, { origin, data }) // use the origin to prevent origin's listen
  }

  async sendFakeTxs (n, interval) {
    const lamda = 1000 / interval // average msg per second, is the lamda of the Poisson Distribution
    this.fakeTxs = n
    for (let i = 0; i < n; i++) {
      await new Promise((r, j) => setTimeout(() => r('ok'), util.exponentialRandom(lamda)))
      this.sendFakeTx(i)
    }
  }

  sendFakeTx (i) {
    const tx = this.createFakeTx(i)
    // debug('---send tx:', tx)
    this.emit('tx', { data: tx })
  }

  createFakeTx (i) {
    const from = _.sample(this.nodes).account
    const to = _.sample(this.nodes).account
    return {i, from, to, value: 10000 * Math.random() }
  }

  recordCollector(tx, node) {
    this.sta.collectors.push({tx, node})
  }

  showCollectorsStatistic() {
    let sta = _.groupBy(this.sta.collectors, ({tx, node}) => tx.i)
    sta = Object.values(sta)
    sta.map(s => debug('tx %s has %d collectors', s[0].tx.i, s.length))
    debug('--- send %d txs, and %d collected, with avg. %d collectors/tx', this.fakeTxs, sta.length, sta.reduce((p, s) => p + s.length, 0) / sta.length)
  }

  recordWitness(bp, node) {
    this.sta.witnesses.push({bp, node})
  }

  showWitnessesStatistic() {
    let sta = _.groupBy(this.sta.witnesses, ({bp, node}) => bp.brief)
    sta = Object.values(sta)
    sta.map(s => debug('bp %s has %d witnesses', s[0].bp.brief, s.length))
    debug('--- %d bps witnessed with avg. %d witnesses/tx', sta.length, sta.reduce((p, s) => p + s.length, 0) / sta.length)
  }
}
//
// const network = new W3Network()
// const n1 = new TheoryNode(network)
//
// const n2 = new TheoryNode(network)
//
// const d = util.NHashDistance(200000)
// debug(d('afa', 'dsfdsf'))
// debug(d('afa', 'dsfdsf'))
// debug(d('afa', 'dsfb12123213f'))

export { TheoryNode, W3Network }
