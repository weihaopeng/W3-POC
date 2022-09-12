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
    return this.afw === false
  }

  canWitness(height) {
    return height === this.height + 1
  }

  goNextEpochAfterTwoStageMint() { // @see design/w3-node-activies-and-messages.png
    this.nextEpochTimer || (this.nextEpochTimer = setTimeout(() => {
      delete this.nextEpochTimer
      this.afw = false
      this.height = this.node.chain.height

      // release resources
      Chain.pruneCommonHeadBlocks(this.node.network.config.UNCONFIRMED_BLOCKS_HEIGHT)
      this.node.localFacts.drainPools()

      this.constructor.detectEpochHeightDifference() // use in dev. for observe the epoch height difference
      this.node.askForWitnessAndMintWhenProper()
    }, this.node.network.config.TWO_STAGE_MINT_INTERVAL))
  }

  get tailHash() {
    return this.node.chain.getBlockAtHeight(this.height)?.hash || 'genesis'
  }
}

export { Epoch }
