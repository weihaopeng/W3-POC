import _ from 'lodash'
import { util } from '../util.js'
import { W3Node } from './w3.node.js'

import EventEmitter2 from 'eventemitter2'
import { Transaction } from '../core/entities/transaction.js'

import { config as defaultConfig } from './config.default.js'
import { w3Algorithm } from './w3.algorithm.js'

import Debug from 'debug'
import { Chain } from '../core/entities/chain.js'
import { Epoch } from '../core/node/epoch/epoch.js'
const debug = Debug('w3:poc:network')

/**
 * local swarm, network within a webpage
 */
class W3Swarm extends EventEmitter2 {
  constructor (config) {
    super()
    this.config = {...defaultConfig, ...config }
    this.setMaxListeners(0) // to supass MaxListenersExceededWarning https://nodejs.org/docs/latest/api/events.html#events_emitter_setmaxlisteners_n
    this.sta = { collectors: [], witnesses: [] }
    // this.debug = {witnesses: [], invalidWitness: []}
  }

  async init (nodesAmount = this.config.NODES_AMOUNT, network) {
    nodesAmount = this.config.SINGLE_NODE_MODE? 1 : nodesAmount
    this.nodes = [...new Array(nodesAmount)].map(i => new W3Node(this, this.config.SINGLE_NODE_MODE))

    this.config.W3_EVENTS_ON && (this.events = new EventEmitter2({ wildcard: true }))
    this.distanceFn = w3Algorithm.simpleNHashDistance(nodesAmount)
    this.initPreBlockValue = 'genuesis'

    // TODO：add network connect/disconnect periodicEmitBlockMessage/stop observer
    await Promise.all(this.nodes.map(node => node.connect()))

    // TODO: wire the network @Jian-ru
    // if (network) {
    //   await network.init(this)
    //   this.network = network
    // }
  }

  reset(height=0) {
    this.config.W3_EVENTS_ON && this.events.removeAllListeners()
    this.nodes.forEach(node => node.reset(height))
    Chain.reset()
  }

  destroy () {
    this.nodes = null
    this.removeAllListeners()
    Chain.reset()
    Epoch.destroy()
  }

  listen (event, cb, target) {
    this.on(event, ({ origin, data }) => {
      // node calls back immediately in its own event in single node mode to make two-stages-mint move forward
      if (this.config.SINGLE_NODE_MODE) this._listenCb(cb, data, origin, target, event)

      // simulate of msg propagation, may lose in the way
      const arrivalRatio = this.config.MSG_ARRIVAL_RATIO
      // simulate the network jitter, latency may randomly as Gauss distribution
      const latency = util.gaussRandom(this.config.LATENCY_LOWER_BOUND, this.config.LATENCY_UPPER_BOUND)
      // debug('***** arrivalRatio: %s, latency: %s', arrivalRatio, latency)

      if (Math.random() < arrivalRatio && target !== origin) {
        // setTimeout(() => this._listenCb(cb, data, origin, target, event), 0)
        setTimeout(() => this._listenCb(cb, data, origin, target, event), latency)
      }
    })
  }

  _listenCb (cb, data, origin, target, event) {
    cb(data, origin)
    this.config.W3_EVENTS_ON && this.emitW3EventMsgArrival({ origin, target, event, data })
  }

  broadcast (event, data, origin) {
    this.emit(event, { origin, data}) // use the origin to prevent origin's listen
    this.config.W3_EVENTS_ON && this.emitW3EventMsgDeparture({ origin, target: null, event, data })
  }

  async sendFakeTxs (n, tps = 1, badTx= 0) { // transaction per second, is the lamda of the Poisson Distribution
    this.fakeTxs = n
    let time = Date.now()
    const possionLatencies = new Array(n).fill(0).map(() => util.exponentialRandom(tps / 1000))
    debug('*********** tps: %s, avg possionLatencies: %s', tps, possionLatencies.reduce((a, b) => a + b) / possionLatencies.length)
    const badIndexs = _.sampleSize([...new Array(n)].map((_, i) => i), badTx)
    for (let i = 0; i < n; i++) {
      i % 100 === 0 && console.log('---send %s fake txs, time used: %s ms', i, Date.now() - time)
      const possionLatency = util.exponentialRandom(tps / 1000)
      // debug('--- sendFakeTx latency: %s ms', possionLatency)
      await util.wait(possionLatency)
      this.sendFakeTx(i, badIndexs.includes(i))
    }
    await util.wait(2 * this.config.LATENCY_UPPER_BOUND) // wait for all txPool to be collected
  }

  sendFakeTx (i, bad) {
    const tx = this.createFakeTx(i, bad)
    this._sendFakeTx(tx)
  }

  _sendFakeTx (tx) {
    const origin = _.sample(this.nodes) // simulating where the tx from
    // origin.handleTx(tx)
    debug('---node %s broadcast tx %s ', origin.i, tx)
    this.broadcast('tx', tx, origin)
  }

  sendFakeDoubleSpendingTxs (first = 'lowerScore', i=0) {
    const [txa, txb] = this.createFakeDoubleSpendingTxs(first, i)
    this._sendFakeTx(txa)
    this._sendFakeTx(txb)
    return [txa, txb]
  }

  createFakeTx (i, bad = false) {
    const [from, to] = [util.getEthereumAccount(), util.getEthereumAccount()]
    return  Transaction.createFake({ i, from, to, value: 10000 * Math.random(), nonce: bad ? -1 : null })
  }

  createFakeDoubleSpendingTxs (first, i) {
    const from = util.getEthereumAccount()
    let [low, high] = [util.getEthereumAccount(), util.getEthereumAccount()].sort((a, b) => a.compareTo(b))
    low =  Transaction.createFake({ i, from, to: low, nonce: 1,  value: 10000 * Math.random() })
    high =  Transaction.createFake({ i: i + 1, from, to: high, nonce: 1, value: 10000 * Math.random() })
    return first === 'lowerScore' ? [low, high] : [high, low]
  }

  sendFakeBp (bp) {
    this.broadcast('bp', bp,  _.sample(this.nodes))
  }

  sendFakeBlock (block) {
    this.broadcast('block', block,  _.sample(this.nodes))
  }

  recordCollector (tx, node) {
    this.sta.collectors.push({ tx, node })
  }

  showCollectorsStatistic () {
    let sta = _.groupBy(this.sta.collectors, ({ tx, node }) => tx.i)
    sta = Object.values(sta)
    sta.map(s => debug('tx %s has %d collectors', s[0].tx.i, s.length))
    debug('--- send %d txPool, and %d collected, with avg. %d collectors/tx', this.fakeTxs, sta.length, sta.reduce((p, s) => p + s.length, 0) / sta.length)
  }

  recordWitness (bp, node) {
    this.sta.witnesses.push({ bp, node })
  }

  showWitnessesStatistic () {
    let sta = _.groupBy(this.sta.witnesses, ({ bp, node }) => bp.brief)
    sta = Object.values(sta)
    sta.map(s => debug('bp %s has %d witnesses', s[0].bp.brief, s.length))
    debug('--- %d bps witnessed with avg. %d witnesses/tx', sta.length, sta.reduce((p, s) => p + s.length, 0) / sta.length)
  }

  emitW3EventMsgDeparture ({ origin, target, event, data }) {
    this.emitW3Event('network.msg.departure', {
      from: origin.briefObj,
      to: target?.briefObj, // target null for broadcast
      type: event, data, departureTime: new Date()
    })
  }

  emitW3EventMsgArrival ({ origin, target, event, data }) {
    this.emitW3Event('network.msg.arrival', {
      from: origin.briefObj,
      to: target.briefObj,
      type: event, data, arrivalTime: new Date()
    })
  }

  emitW3Event(event, data) {
    this.events?.emit(event, data)
  }
}

export { W3Swarm }
