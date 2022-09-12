import _ from 'lodash'

import Debug from 'debug'

const debug = Debug('w3:chain')

class Chain {

  static chains = []
  static commonHeadBlocks = []

  static async create (node, blocks) {
    // mint a chain instance by local stored data and chain data given.
    const chain = new this(node, blocks)
    this.chains.push(chain)
    return chain
  }

  static pruneCommonHeadBlocks (unconfirmedBlocksHeight = 0) {
    // move the common part of chains to this.commonHeadBlocks
    // and remove the common part from chains
    if (this.chains.length > 1) {
      let length = this.commonHeadBlocks.length
      let shortestChain = _.minBy(this.chains, 'height')
      for (let i = 0; i < shortestChain._blocks.length - unconfirmedBlocksHeight; i++) {
        let block = shortestChain._blocks[i]
        if (this.chains.every(chain => chain._blocks[i]?.hash === block.hash )) {
          this.commonHeadBlocks.push(block)
        } else {
          break
        }
      }
      this.chains.forEach(chain => chain._blocks.splice(0, this.commonHeadBlocks.length - length))
    }
  }

  static reset () {
    this.chains = []
    this.commonHeadBlocks = []
  }

  constructor (node, blocks = []) {
    this.node = node
    this._blocks = blocks
    this.debug = { blocks: [] }
  }

  reset () {
    this._blocks = []
  }

  addOrReplaceBlock (block, caller) {
    if (block.height === this.height + 1 && block.preHash === this.tailHash) {
      this._blocks.push(block)
      this.node.localFacts.updateTxsState(block.txs, 'chain')
      // this.node.epoch.proceedNextEpoch()
      this.debug.blocks.push({ node: this.node.i, caller, action: 'add', block: block.superBrief, time: Date.now() })
    } else if (block.height === this.height && block.preHash === this.getTailHash(1)) {
      let txOnChain, txUnused, tail = this.tail
      if (block.lt(tail)) {
        debug('--- WARN: use block %s to replace tail %s', block.superBrief, tail.superBrief)
        this._blocks.pop() && this._blocks.push(block)
        txOnChain = block.txs
        txUnused = _.differenceBy(tail.txs, block.txs, 'hash')
        this.debug.blocks.push({
          node: this.node.i,
          caller,
          action: 'lt & replace',
          block: block.superBrief,
          time: Date.now()
        })
      } else {
        txOnChain = null // already on chain
        txUnused = _.differenceBy(block.txs, tail.txs, 'hash')
        this.debug.blocks.push({
          node: this.node.i,
          caller,
          action: 'not lt',
          block: block.superBrief,
          time: Date.now()
        })
      }
      txOnChain && this.node.localFacts.updateTxsState(txOnChain, 'chain')
      this.node.localFacts.updateTxsState(txUnused, 'tx')
    } else {
      debug('--- WARN: invalid block, should not add to chain, chain height: %s, block height: %s, block: ', this.height, block.height, block.superBrief)
    }
    debug('--- SHOW chain: %s ', this.superBrief)
  }

  get blocks() {
    return this.constructor.commonHeadBlocks.concat(this._blocks)
  }

  get height () {
    return this.blocks.length
  }

  get tail () {
    return this._blocks.slice(-1)[0]
  }

  get tailHash () {
    return this.getTailHash(0)
  }

  getTailHash (n = 0) {
    const i = this.blocks.length - 1 - n
    return i >= 0 ? this.blocks[i].hash : 'genesis'
  }

  get brief () {
    return `height: ${this.height}, tailHash: ${this.tailHash}, blocks: ${this.blocks.map(b => b.brief)}`
  }

  get superBrief () {
    return `height: ${this.height}, ${this.blocks.map(b => b.superBrief).join(' -> ')}`
  }

  equals (other) {
    return this.height === other.height && this.tailHash === other.tailHash
  }

  getBlockAtHeight (height) {
    return this.blocks[height - 1]
  }
}

export { Chain }
