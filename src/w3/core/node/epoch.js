class Epoch {
  constructor(node) {
    this.node = node
    this.afw = false
  }

  get height () {
    return  this.node.chain.height
  }

  reset(height) {
    this.afw = false
  }

  canAskForWitness() {
    return this.afw === false
  }

  canWitness(height) {
    return height === this.height + 1
  }

  nextEpoch(latencyUpperbound) {
    setTimeout(() => {
      this.afw = false
      this.node.askForWitnessAndMintWhenProper()
    }, latencyUpperbound)
  }
}

export { Epoch }
