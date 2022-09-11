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

  addBlock(block) {
    debug('--- node: %s verifyThenUpdateOrAddTx block to its chain: ', this.node.i, block.brief)
    this.blocks.push(block)
    this.node.localFacts.updateTxsState(block.txs, 'chain')
    this.node.epoch.nextEpoch(this.node.network.config.LATENCY_UPPER_BOUND)
    debug('--- SHOW chain: %s ', this.superBrief)
  }

  get height() {
    return this.blocks.length
  }

  get tailHash() {
    return this.blocks.slice(-1)[0]?.hash
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
}

export { Chain }
