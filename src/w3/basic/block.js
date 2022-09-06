class Block {
  static index = 0 // TODO: currently only used for theory test
  static mint (blockProposal, chain) {
    return new Block(chain.tailHash, blockProposal)
  }

  constructor (preHash, bp) { // TODO: currently only used for theory test
    this.preHash = preHash
    this.bp = bp
    this.i = this.constructor.index++ // TODO: currently only used for theory test
    // this.hash = (preHash ? preHash + '-h' : 'h') + this.i // make debug easy in theory test
    this.hash = 'h' + this.i // make debug easy in theory test
  }

  get brief() {
    return `Block ${this.i} [preHash: ${this.preHash}, hash: ${this.hash}, bp: ${this.bp.brief}]`
  }

  get superBrief() {
    return `[${this.bp.superBrief}]:${this.hash}`
  }

}

export { Block }
