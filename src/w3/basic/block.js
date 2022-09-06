import { BlockProposal } from './block-proposal.js'

class Block {
  static index = 0 // TODO: currently only used for theory test
  static mint (blockProposal, chain) {
    return new this({ preHash: chain.tailHash, bp: blockProposal })
  }

  constructor ({ preHash, bp, i, hash }) { // TODO: currently only used for theory test
    this.preHash = preHash
    this.bp = bp instanceof BlockProposal ? bp : new BlockProposal(bp)
    this.i = i !== undefined ? i : this.constructor.index++ // TODO: currently only used for theory test
    // this.hash = (preHash ? preHash + '-h' : 'h') + this.i // make debug easy in theory test
    this.hash = hash !== undefined ? hash : 'h' + this.i // make debug easy in theory test
  }

  async verify () {
    return this.preHash && this.bp && this.hash
  }

  get txs() {
    return this.bp.txs
  }

  get brief() {
    return `Block ${this.i} [preHash: ${this.preHash}, hash: ${this.hash}, bp: ${this.bp.brief}]`
  }

  get superBrief() {
    return `[${this.bp.superBrief}]:${this.hash}`
  }

}

export { Block }
