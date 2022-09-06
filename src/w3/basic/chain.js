import Debug from 'debug'
const debug = Debug('w3:chain')

class Chain {

  static async create (data) {
    // mint a chain instance by local stored data and chain data given.
    return new this(data)
  }

  constructor () {
    this.blocks = []
  }

  addBlock(block, node) {
    debug('--- node: %s add block to its chain: ', node.i, block.brief)
    this.blocks.push(block)
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
}

export { Chain }
