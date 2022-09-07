import { BlockProposal } from './block-proposal.js'
import { w3Algorithm } from '../poc/w3.algorithm.js'
import _ from 'lodash'

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
    // this.hash = hash !== undefined ? hash : 'h' + this.i // make debug easy in theory test
    this.hash = w3Algorithm.hash(this)
  }

  async verify (node) {
    return this.preHash && this.bp && this.hash
      && this.bp.verify(node)
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

  toJSON() {
    return _.omit(this.bp, ['i', 'collector', 'witnessRecords']) // toJSON时，去掉不必要的属性，特别是计算hash时，会去掉collector和witnessRecords
  }

}

export { Block }
