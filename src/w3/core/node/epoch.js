class Epoch {
  constructor(height) {
    this.height = height
    this.afw = false
  }

  reset(height) {
    this.height =height
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
      this.height++
    }, latencyUpperbound)
  }
}

export { Epoch }
