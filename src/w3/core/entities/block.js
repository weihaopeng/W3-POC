import { BlockProposal } from './block-proposal.js'
import { w3Algorithm } from '../../poc/index.js'
import _ from 'lodash'

import Debug from 'debug'
const debug = Debug('w3:bp')

class Block {
  static index = 0 // TODO: currently only used for theory test
  static mint (bp, preHash) {
    return new this({ preHash, bp: bp })
  }

  constructor ({ preHash, bp, i, hash }) { // TODO: currently only used for theory test
    if (!preHash || !bp) throw new Error(`can't create a Block, check the params`)
    this.preHash = bp.height === 1 ? 'genesis' : preHash
    this.bp = bp instanceof BlockProposal ? bp : new BlockProposal(bp)
    this.i = i !== undefined ? parseInt(i) : this.constructor.index++ // TODO: currently only used for theory test
    this.hash = hash !== undefined ? hash : 'h-' + bp.superBrief // make debug easy in theory test
    // this.hash = w3Algorithm.hash(this)
  }

  async verify (node, epoch) {
    const res = this.preHash === epoch.tailHash && this.bp && this.hash
      && await this.bp.verify(node, epoch)
    if (!res) debug('--- WARN: block verify failed', this.brief)
    return res
  }

  get height() {
    return this.bp.height
  }

  get txs() {
    return this.bp.txs
  }

  get brief() {
    return `Block ${this.i} [preHash: ${this.preHash}, hash: ${this.hash}, bp: ${this.bp.brief}]`
  }

  get superBrief() {
    // return `[${this.bp.superBrief}]:${this.hash}`
    return `[${this.bp.superBrief}]`
  }

  toHash() {
    /**
     * remove unnecessary properties, especially when calculating hash, collector and witnessRecords will be removed,
     * by this means the block mint by different nodes with same txPool and prehash will have the same hash.
     */
    return {...this, bp: _.omit(this.bp, ['i', 'collector', 'witnessRecords'])}
  }

  lt(other) {
    return this.bp.lt(other.bp)
  }

  gt(other) {
    return this.bp.gt(other.bp)
  }

  equals(other) {
    return this.i === other.i || this.hash === other.hash
  }


}

export { Block }
