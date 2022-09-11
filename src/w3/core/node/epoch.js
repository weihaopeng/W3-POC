import _ from 'lodash'

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
    this.twoStagesMintLatency = 8 * this.node.network.config.LATENCY_UPPER_BOUND     // @see design/w3-node-activies-and-messages.png

    // this.twoStagesMintLatency = 4 * (this.node.network.config.LATENCY_UPPER_BOUND +    // @see design/w3-node-activies-and-messages.png
    //   this.node.network.config.LOCAL_COMPUTATION_LATENCY)
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
      this.constructor.detectEpochHeightDifference() // use in dev. for observe the epoch height difference
      this.node.askForWitnessAndMintWhenProper()
    }, this.twoStagesMintLatency))
  }

  get tailHash() {
    return this.node.chain.getBlockAtHeight(this.height)?.hash || 'genesis'
  }
}

export { Epoch }
