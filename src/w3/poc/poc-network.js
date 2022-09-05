import { EventEmitter } from 'node:events'
import _ from 'lodash'
import { util } from '../util.js'
import { PocNode} from './poc-node.js'

import Debug from 'debug'
const debug = Debug('w3:poc:network')

class PocNetwork extends EventEmitter {
  static events = ['tx', 'block-proposal', 'new-block', 'fork-wins', 'query']

  static MSG_ARRIVAL_RATIO = 1 // the ratio is always 1 in a P2P network using TCP as transportation protocol
  static LATENCY_LOWER_BOUND = 0
  static LATENCY_UPPER_BOUND = 10 // 100 milliseconds

  constructor () {
    super()
    this.setMaxListeners(0) // to supass MaxListenersExceededWarning https://nodejs.org/docs/latest/api/events.html#events_emitter_setmaxlisteners_n
    this.sta = { collectors: [], witnesses: []}
  }

  async init (nodesAmount=PocNode.NODES_AMOUNT) {
    this.nodes = [...new Array(nodesAmount)].map(i => new PocNode(this))
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

export { PocNetwork }
