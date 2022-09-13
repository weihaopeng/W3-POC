/**
 * Syncs nodes in block minting.
 * @see design/w3-node-activities-and-messages.png
 */
import Debug from 'debug'
import _ from 'lodash'
const debug = Debug('w3:TxsPool')

import EventEmitter2 from 'eventemitter2'

class Epoch {
  static epoches = []
  static differenceEmitter = new EventEmitter2()

  static create(node, conf) {
    const epoch = new Epoch(node, conf)
    this.epoches.push(epoch)
    return epoch
  }

  static stopAllEpoches() {
    this.epoches.forEach(epoch => epoch.stop())
  }

  static clear() {
    this.epoches = []
    this.differenceEmitter.removeAllListeners()
  }

  static detectEpochHeightDifference() {
    const epochHeights = _.map(this.epoches, 'height')
    const min = _.min(epochHeights)
    const max = _.max(epochHeights)
    const dif = max - min
    this.differenceEmitter.emit('difference', { min, max, dif, epochHeights })
  }

  constructor (node, { collectTime = 1000, witnessAndMintTime = 1000 } = {}) {
    this.node = node
    this.collectTime = collectTime || node.network.config.EPOCH_COLLECTING_TIME
    this.witnessAndMintTime = witnessAndMintTime || node.network.config.EPOCH_WITNESS_AND_MINT_TIME
    this.time = collectTime && witnessAndMintTime ? collectTime + witnessAndMintTime : node.network.config.EPOCH_TIME
  }

  start(height) {
    this.stage = 'collect' // null | collect | witnessAndMint
    this.height = this.node.chain ? this.node.chain.height :
      height !== undefined ? height : this.height !== undefined ? this.height + 1: 0 // for test

    if (this.nextEpochTimer) clearTimeout(this.nextEpochTimer)
    if (this.collectTimeOverTimer) clearTimeout(this.collectTimeOverTimer)

    this.collectTimeOverTimer = setTimeout(() => {
      delete this.collectTimeOverTimer
      this.stage = 'witnessAndMint'
      this.nextEpochTimer = setTimeout(() => {
        delete this.nextEpochTimer
        this.start()
      }, this.witnessAndMintTime)

      debug('--- Epoch witnesses and mints at %s, height: %s ', Date.now(), this.height)
    }, this.collectTime)

    this.constructor.detectEpochHeightDifference() // use in dev. for observe the epoch height difference
    debug('--- Epoch collects at %s, height: %s ', Date.now(), this.height)
  }

  reset() {
    this.start(this.height)
  }

  stop() {
    clearTimeout(this.nextEpochTimer)
    clearTimeout(this.collectTimeOverTimer)
    delete this.nextEpochTimer
    delete this.collectTimeOverTimer
  }
}

export { Epoch }
