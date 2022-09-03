class BlockProposal {
  static count = 0 // TODO: currently only used for theory test
  constructor ({height, tailHash, txs, collector, witnessRecords=[]}) {
    Object.assign(this, {height, tailHash, txs, witnessRecords})
    this.i = this.constructor.count++  // TODO: currently only used for theory test
  }

  askForWitness({ publicKey, privateKey }) {
    // const askForWitness = { publicKey, witnessOriginPoint: this.wopHash(this, publicKey)}
    const askForWitness = { asker: publicKey } // use distanceFn directly using bp as input insteadof wop
    this.witnessRecords.push({askForWitness, sig: this.sig(privateKey)})
  }

  async witness({ publicKey, privateKey }) {
    const afw = this.witnessRecords.find(record => !record.witness)
    afw.witness = this.witnessHash(this, publicKey)
    afw.sig = this.sig(privateKey)
  }

  async verify () {
    return undefined
  }

  witnessHash (blockProposal, publicKey) {
    return 'WITNESS HASH TODO' // TODO
  }

  sig (privateKey) {
    return 'SIG TODO' // TODO
  }

  equals(other) {
    // return this.height === other.height && this.txs.every((tx, j) => tx.i === other.txs[j].i)
    return this.brief() === other.brief()
  }

  get brief() {
    return 'height:' + this.height + ', txs:' + this.txs.map(tx => tx.i).join('-')
  }

  toString() {
    return JSON.stringify(this)
  }
}

export { BlockProposal }
