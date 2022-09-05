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
  }

  get height() {
    return this.blocks.length
  }

  get tailHash() {
    return this.blocks.slice(-1)[0]?.hash
  }
}

export { Chain }
