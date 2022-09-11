import _ from 'lodash'

import Debug from 'debug'
const debug = Debug('w3:chain')

class Chain {

  static async create (node, blocks) {
    // mint a chain instance by local stored data and chain data given.
    return new this(node, blocks)
  }

  constructor (node, blocks = [] ) {
    this.node = node
    this.blocks = blocks
    this.debug = {blocks: []}
  }

  reset () {
    this.blocks = []
  }

  addOrReplaceBlock(block, caller) {
    if (block.height === this.height + 1 && block.preHash === this.tailHash) {
      this.blocks.push(block)
      this.node.localFacts.updateTxsState(block.txs, 'chain')
      this.debug.blocks.push({node: this.node.i, caller, action: 'add', block: block.superBrief, time: Date.now()})
    } else if (block.height === this.height && block.preHash === this.getTailHash(1)) {
      let txOnChain, txUnused, tail = this.tail
      if (block.lt(tail)) {
        debug('--- WARN: use block %s to replace tail %s', block.superBrief, tail.superBrief)
        this.blocks.pop() && this.blocks.push(block)
        txOnChain = block.txs
        txUnused = _.differenceBy(tail.txs, block.txs, 'hash')
        this.debug.blocks.push({node: this.node.i, caller, action: 'lt & replace', block: block.superBrief, time: Date.now()})
      } else {
        txOnChain = null // already on chain
        txUnused = _.differenceBy(block.txs, tail.txs, 'hash')
        this.debug.blocks.push({node: this.node.i, caller, action: 'not lt', block: block.superBrief, time: Date.now()})
      }
      txOnChain && this.node.localFacts.updateTxsState(txOnChain, 'chain')
      this.node.localFacts.updateTxsState(txUnused, 'tx')
    } else {
      debug('--- WARN: invalid block, should not add to chain, chain height: %s, block height: %s, block: ', this.height, block.height, block.superBrief)
    }
    debug('--- SHOW chain: %s ', this.superBrief)
  }

  get height() {
    return this.blocks.length
  }

  get tail() {
    return this.blocks.slice(-1)[0]
  }

  get tailHash() {
    return this.getTailHash(0)
  }

  getTailHash(n=0) {
    const i = this.blocks.length - 1 - n
    return i >= 0 ? this.blocks[i].hash : 'genesis'
  }

  get brief() {
    return `height: ${this.height}, tailHash: ${this.tailHash}, blocks: ${this.blocks.map(b => b.brief)}`
  }

  get superBrief() {
    return `height: ${this.height}, ${this.blocks.map(b => b.superBrief).join(' -> ')}`
  }

  equals(other) {
    return this.tailHash === other.tailHash
  }

  getBlockAtHeight(height) {
    return this.blocks[height - 1]
  }
}

export { Chain }
