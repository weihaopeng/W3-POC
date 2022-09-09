import { BlockProposal } from './block-proposal.js'
import { w3Algorithm } from '../../poc/w3.algorithm.js'
import _ from 'lodash'

class Block {
  static index = 0 // TODO: currently only used for theory test
  static mint (blockProposal, chain) {
    return new this({ preHash: chain.tailHash, bp: blockProposal })
  }

  constructor ({ preHash, bp, i, hash }) { // TODO: currently only used for theory test
    this.preHash = bp.height === 1 ? 'genuesis' : preHash
    this.bp = bp instanceof BlockProposal ? bp : new BlockProposal(bp)
    this.i = i !== undefined ? i : this.constructor.index++ // TODO: currently only used for theory test
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
    /**
     * remove unnecessary properties, especially when calculating hash, collector and witnessRecords will be removed,
     * by this means the block mint by different nodes with same txPool and prehash will have the same hash.
     */
    return _.omit(this.bp, ['i', 'collector', 'witnessRecords'])
  }

}

export { Block }
