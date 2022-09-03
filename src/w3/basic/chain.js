class Chain {

  static async create (data) {
    // mint a chain instance by local stored data and chain data given.
    return new this(data)
  }

  constructor () {
    this.blocks = []
  }

  get height() {
    return this.blocks.length
  }

  get tailHash() {
    return this.blocks.slice(-1)[0]?.hash
  }
}

export { Chain }
