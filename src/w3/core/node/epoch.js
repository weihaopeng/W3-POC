import _ from 'lodash'
import { Chain } from '../entities/chain.js'

class Epoch {
  static epoches = []

  static create(node) {
    const epoch = new Epoch(node)
    this.epoches.push(epoch)
    return epoch
  }

  static detectEpochHeightDifference() {
    const epochHeights = _.map(this.epoches, 'height')
    const min = _.min(epochHeights)
    const max = _.max(epochHeights)
    const dif = max - min
    if (dif > 1) {
      console.log('--- WARN: epoch height difference: %s ( > 1 )', dif)
      console.log('--- WARN: epochHeights: %s', epochHeights)
    }
  }

  constructor(node) {
    this.node = node
    this.afw = false
    this.height = this.node.chain.height
  }

  reset(height=this.node.chain.height) {
    this.height = height
    this.afw = false
  }

  canAskForWitness() {
    return this.height === this.node.chain.height && this.afw === false
  }

  canWitness(height) {
    return height === this.height + 1
  }

  goNextEpochAfterTwoStageMint() { // @see design/w3-node-activies-and-messages.png
    this.afw = true
    this.nextEpochTimer || (this.nextEpochTimer = setTimeout(() => {
      this.proceedNextEpoch()
    }, this.node.network.config.TWO_STAGE_MINT_INTERVAL))
  }

  get tailHash() {
    return this.node.chain.getBlockAtHeight(this.height)?.hash || 'genesis'
  }

  proceedNextEpoch () {
    delete this.nextEpochTimer
    this.afw = false
    this.height = this.node.chain.height

    // release resources
    // 注意！这里有问题，drainPools之后，会导致双花判定不准，还有已上链的tx再出现被当做是新的tx，导致重复上链！~！暂停不用，优化时再说。
    // Chain.pruneCommonHeadBlocks(this.node.network.config.UNCONFIRMED_BLOCKS_HEIGHT)
    // this.node.localFacts.drainPools()

    this.constructor.detectEpochHeightDifference() // use in dev. for observe the epoch height difference
    this.node.askForWitnessAndMintWhenProper()
  }
}

export { Epoch }
