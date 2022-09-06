class BlockProposal {
  static index = 0 // TODO: currently only used for theory test
  constructor ({height, tailHash, txs, collector, witnessRecords=[]}) {
    Object.assign(this, {height, tailHash, collector, txs, witnessRecords})
    this.i = this.constructor.index++  // TODO: currently only used for theory test
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
    return typeof this.height === 'number' && this.txs && this.witnessRecords.every(wr => this.verifyWitnessRecord(wr))
    && (this.height === 1 || this.tailHash) // height bigger than 1, must have tailHash
  }

  verifyWitnessRecord() {
    // TODO: check witness record with sig
    return true
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

  get superBrief() {
    return this.txs.map(tx => tx.i).join('-')
  }

  get brief() {
    return 'height:' + this.height + ', txs:' + this.superBrief
  }

  toString() {
    return JSON.stringify(this)
  }
}

export { BlockProposal }
