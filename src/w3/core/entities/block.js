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
    this.preHash = bp.height === 1 ? 'genesis' : preHash
    this.bp = bp instanceof BlockProposal ? bp : new BlockProposal(bp)
    this.i = i !== undefined ? i : this.constructor.index++ // TODO: currently only used for theory test
    // this.hash = hash !== undefined ? hash : 'h' + this.i // make debug easy in theory test
    this.hash = w3Algorithm.hash(this)
  }

  async verify (node) {
    return this.preHash === node.epoch.tailHash && this.bp && this.hash
      && await this.bp.verify(node)
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
    return `[${this.bp.superBrief}]:${this.hash}`
  }

  toJSON() {
    /**
     * remove unnecessary properties, especially when calculating hash, collector and witnessRecords will be removed,
     * by this means the block mint by different nodes with same txPool and prehash will have the same hash.
     */
    return _.omit(this.bp, ['i', 'collector', 'witnessRecords'])
  }

  lt(block) {
    if (this.height !== block.height) debug('--- WARN: should only compare block with same height')
    for (let i = 0; i < this.txs.length; i++) {
      if (this.txs[i].lt(block.txs[i])) return true
      if (this.txs[i].gt(block.txs[i])) return false
    }
    return false // equals
  }

  gt(block) {
    if (this.height !== block.height) debug('--- WARN: should only compare block with same height')
    for (let i = 0; i < this.txs.length; i++) {
      if (this.txs[i].gt(block.txs[i])) return true
      if (this.txs[i].lt(block.txs[i])) return false
    }
    return false // equals
  }

}

export { Block }
