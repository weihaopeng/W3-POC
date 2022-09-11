class Epoch {
  constructor(node) {
    this.node = node
    this.afw = false
    this.height = this.node.chain.height
    this.twoStagesMintLatency = 6 * this.node.network.config.LATENCY_UPPER_BOUND     // @see design/w3-node-activies-and-messages.png

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
      this.node.askForWitnessAndMintWhenProper()
    }, this.twoStagesMintLatency))
  }

  get tailHash() {
    return this.node.chain.getBlockAtHeight(this.height)?.hash || 'genesis'
  }
}

export { Epoch }
