/**
 * Syncs nodes in block minting.
 * @see design/w3-node-activities-and-messages.png
 */
import Debug from 'debug'
import _ from 'lodash'
const debug = Debug('w3:epoch')

import EventEmitter2 from 'eventemitter2'

class ResetableEpoch extends EventEmitter2 {
  static epoches = []
  static differenceEmitter = new EventEmitter2()

  static create(node, conf) {
    const epoch = new this(node, conf)
    this.epoches.push(epoch)
    return epoch
  }

  static startAllEpoches() {
    this.epoches.forEach(epoch => epoch.start())
  }

  static stopAllEpoches() {
    this.epoches.forEach(epoch => epoch.stop())
  }

  static clear() {
    this.epoches = []
    this.differenceEmitter.removeAllListeners()
  }

  static destroy() {
    this.stopAllEpoches()
    this.clear()
  }

  static detectEpochHeightDifference() {
    const epochHeights = _.map(this.epoches, 'height')
    const min = _.min(epochHeights)
    const max = _.max(epochHeights)
    const dif = max - min
    this.differenceEmitter.emit('difference', { min, max, dif, epochHeights })
    return {min, max, dif, epochHeights }
  }

  constructor (node, { collectTime, witnessAndMintTime } = {}) {
    super()
    this.node = node
    this.collectTime = collectTime || node.swarm.config.EPOCH_COLLECTING_TIME
    this.witnessAndMintTime = witnessAndMintTime || node.swarm.config.EPOCH_WITNESS_AND_MINT_TIME
    this.time = collectTime && witnessAndMintTime ? collectTime + witnessAndMintTime : node.swarm.config.EPOCH_TIME
  }

  start(height) {
    this.goEpoch(height)
  }

  goEpoch(height) {
    this.stage = 'collect' // null | collect | witnessAndMint
    this.emit('stage', { stage: this.stage })
    this.height = this.node.chain ? this.node.chain.height :
      height !== undefined ? height : this.height !== undefined ? this.height + 1: 0 // for test

    clearTimeout(this.nextEpochTimer)
    clearTimeout(this.collectTimeOverTimer)

    this.collectTimeOverTimer = setTimeout(() => {
      this.stage = 'witness-and-mint'
      this.emit('stage', { stage: this.stage })
      this.nextEpochTimer = setTimeout(() => {
        this.goEpoch()
      }, this.witnessAndMintTime)

      debug('--- ResetableEpoch witnesses and mints at %s, height: %s ', Date.now(), this.height)
    }, this.collectTime)

    this.constructor.detectEpochHeightDifference() // use in dev. for observe the epoch height difference
    debug('--- ResetableEpoch collects at %s, height: %s ', Date.now(), this.height)
  }

  reset() {
    this.goEpoch(this.height)
  }

  resetOn(source, event, predicate =_ => true) {
    (source.on || source.listen).bind(source)(event, (data) => {
      predicate(data) && this.reset()
    }, this)
  }

  stop() {
    clearTimeout(this.nextEpochTimer)
    clearTimeout(this.collectTimeOverTimer)
    this.removeAllListeners()
  }

  immediatelyNextEpoch () {
    this.goEpoch()
  }
}

export { ResetableEpoch }
