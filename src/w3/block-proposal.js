class BlockProposal {

  constructor ({height, tailHash, txs, askForWitnessRecords=[]}) {
    Object.assign(this, {height, tailHash, txs, askForWitnessRecords})
  }

  askForWitness({ publicKey, privateKey }) {
    const askForWitness = { publicKey, witnessOriginPoint: this.wopHash(this, publicKey)}
    this.askForWitnessRecords.push({askForWitness, sig: this.sig(privateKey)})
  }

  async witness({ publicKey, privateKey }) {
    const afw = this.askForWitnessRecords.find(record => !record.witness)
    afw.witness = this.witnessHash(this, publicKey)
    afw.sig = this.sig(privateKey)
  }

  async verify () {
    return undefined
  }

}

export { BlockProposal }
