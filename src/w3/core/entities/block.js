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
    this.hash = hash !== undefined ? hash : 'h-' + bp.superBrief // make debug easy in theory test
    // this.hash = w3Algorithm.hash(this)
  }

  async verify (node, isForPreivousEpoch=false) {
    const preHash = isForPreivousEpoch ? node.chain.getTailHash(1) : node.epoch.tailHash
    const res = this.preHash === preHash && this.bp && this.hash
      && await this.bp.verify(node, isForPreivousEpoch)
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

  toJSON() {
    /**
     * remove unnecessary properties, especially when calculating hash, collector and witnessRecords will be removed,
     * by this means the block mint by different nodes with same txPool and prehash will have the same hash.
     */
    return _.omit(this.bp, ['i', 'collector', 'witnessRecords'])
  }

  lt(other) {
    if (this.height !== other.height) debug('--- WARN: should only compare other with same height')
    for (let i = 0; i < this.txs.length; i++) {
      if (!this.txs[i] || this.txs[i].lt(other.txs[i])) return true
      if (!other.txs[i] || this.txs[i].gt(other.txs[i])) return false
    }

    return this.txs.length < other.txs.length   // equals or length bigger value bigger
  }

  gt(other) {
    if (this.height !== other.height) debug('--- WARN: should only compare other with same height')
    for (let i = 0; i < this.txs.length; i++) {
      if (!other.txs[i] || this.txs[i].gt(other.txs[i])) return true
      if (!this.txs[i] || this.txs[i].lt(other.txs[i])) return false
    }
    return  this.txs.length === other.txs.length  // equals
  }

  equals(other) {
    return this.i === other.i || this.hash === other.hash
  }


}

export { Block }
