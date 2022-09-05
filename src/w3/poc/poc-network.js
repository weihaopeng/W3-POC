import { EventEmitter } from 'node:events'
import _ from 'lodash'
import { util } from '../util.js'
import { PocNode } from './poc-node.js'

import Debug from 'debug'
import EventEmitter2 from 'eventemitter2'
import { Transaction } from '../basic/transaction.js'

const debug = Debug('w3:poc:network')

class PocNetwork extends EventEmitter2 {
  static events = ['tx', 'block-proposal', 'new-block', 'fork-wins', 'query']

  static MSG_ARRIVAL_RATIO = 1 // the ratio is always 1 in a P2P network using TCP as transportation protocol
  static LATENCY_LOWER_BOUND = 0
  static LATENCY_UPPER_BOUND = 100 // 100 milliseconds

  constructor (w3EventsOn = false) {
    super()
    this.setMaxListeners(0) // to supass MaxListenersExceededWarning https://nodejs.org/docs/latest/api/events.html#events_emitter_setmaxlisteners_n
    this.sta = { collectors: [], witnesses: [] }
    this.w3EventsOn = w3EventsOn
    w3EventsOn && (this.events = new EventEmitter2({ wildcard: true }))
  }

  async init (nodesAmount = PocNode.NODES_AMOUNT) {
    this.nodes = [...new Array(nodesAmount)].map(i => new PocNode(this))
    await Promise.all(this.nodes.map(node => node.start()))
  }

  destroy () {
    this.nodes = null
    this.removeAllListeners()
  }

  listen (event, cb, target) {
    this.on(event, ({ origin, data }) => {
      if (this.nodes?.[0].constructor.isSingleNodeMode)
        return this._listenCb(cb, data, origin, target, event)

      // simulate of msg propagation, may lose in the way
      const arrivalRatio = this.constructor.MSG_ARRIVAL_RATIO
      // simulate the network jitter, latency may randomly as Gauss distribution
      const latency = util.gaussRandom(this.constructor.LATENCY_LOWER_BOUND, this.constructor.LATENCY_UPPER_BOUND)
      // debug('***** arrivalRatio: %s, latency: %s', arrivalRatio, latency)

      if (Math.random() < arrivalRatio && target !== origin) {
        setTimeout(() => this._listenCb(cb, data, origin, target, event), latency)
      }
    })
  }

  _listenCb (cb, data, origin, target, event) {
    cb(data)
    this.w3EventsOn && this.emitW3EventMsgArrival({ origin, target, event, data })
  }

  broadcast (event, data, origin) {
    this.emit(event, { origin, data}) // use the origin to prevent origin's listen
    this.w3EventsOn && this.emitW3EventMsgDeparture({ origin, target: null, event, data })
  }

  async sendFakeTxs (n, tps = 1) { // transaction per second, is the lamda of the Poisson Distribution
    this.fakeTxs = n
    for (let i = 0; i < n; i++) {
      const latency = util.exponentialRandom(tps / 1000)
      debug('--- sendFakeTx latency: %s ms', latency)
      await util.wait(latency)
      this.sendFakeTx(i)
    }
    await util.wait(2 * this.constructor.LATENCY_UPPER_BOUND) // wait for all txs to be collected
  }

  sendFakeTx (i) {
    const tx = this.createFakeTx(i)
    // debug('---send tx:', tx)
    this.broadcast('tx', tx,  _.sample(this.nodes))
  }

  createFakeTx (i) {
    const from = _.sample(this.nodes).account
    const to = _.sample(this.nodes).account
    return new Transaction({ i, from, to, value: 10000 * Math.random() })
  }

  recordCollector (tx, node) {
    this.sta.collectors.push({ tx, node })
  }

  showCollectorsStatistic () {
    let sta = _.groupBy(this.sta.collectors, ({ tx, node }) => tx.i)
    sta = Object.values(sta)
    sta.map(s => debug('tx %s has %d collectors', s[0].tx.i, s.length))
    debug('--- send %d txs, and %d collected, with avg. %d collectors/tx', this.fakeTxs, sta.length, sta.reduce((p, s) => p + s.length, 0) / sta.length)
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
    this.events.emit('network.msg.departure', {
      from: origin.briefObj,
      to: target?.briefObj, // target null for broadcast
      type: event, data, departureTime: new Date()
    })
  }

  emitW3EventMsgArrival ({ origin, target, event, data }) {
    this.events.emit('network.msg.arrival', {
      from: origin.briefObj,
      to: target.briefObj,
      type: event, data, arrivalTime: new Date()
    })
  }

}

export { PocNetwork }
