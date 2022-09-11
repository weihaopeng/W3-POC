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
  }

  reset () {
    this.blocks = []
  }

  addOrReplaceBlock(block) {
    if (block.height === this.height + 1 && block.preHash === this.tailHash) {
      this.blocks.push(block)
      this.node.localFacts.updateTxsState(block.txs, 'chain')
    } else if (block.height === this.height && block.preHash === this.getTailHash(1)) {
      const tail = this.tail
      block.lt(tail) && this.blocks.pop() && this.blocks.push(block)
      const txsNotUsed = _.differenceBy(tail.txs, block.txs, 'hash')
      this.node.localFacts.updateTxsState(block.txs, 'chain')
      this.node.localFacts.updateTxsState(txsNotUsed, 'tx')
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
    return i >= 0 ? this.blocks[i].hash : 'genuesis'
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
