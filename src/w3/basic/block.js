class Block {
  static count = 0 // TODO: currently only used for theory test
  static mint (blockProposal, chain) {
    return new Block(chain.tailHash, blockProposal)
  }

  constructor (preHash, bp) { // TODO: currently only used for theory test
    this.preHash = preHash
    this.bp = bp
    this.hash = preHash ? preHash + '-h' : 'h' // make debug easy in theory test
    this.i = this.constructor.count++ // TODO: currently only used for theory test
  }
}

export { Block }
