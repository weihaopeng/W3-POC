class Transaction {
  constructor ({ i, to, from, value, sig='sig' }) { // we ignore sig for now
    Object.assign(this, { i, to, from, value, sig })
  }

  async isValid() {
    return this.to && this.from && this.value && this.sig && await this.isValidSig()
  }

  async isValidSig() {
    return true
  }

  addHash() {
    this.hash = 'hash-' + i // TODO
  }

  static sort (a, b) {
    // const r = a.from.compareTo(b.from)
    // return r !== 0 ? r : a.to.compareTo(b.to)
    return a.i - b.i // TODO only for theory test
  }

  toString() {
    return `< i: ${this.i}, from: ${this.from.i}, to: ${this.to.i}, value: ${this.value} >`
  }
}

export { Transaction }
