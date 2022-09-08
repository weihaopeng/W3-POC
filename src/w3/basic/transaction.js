import Debug from 'debug'
const debug = Debug('w3:tx')

class Transaction {
  static createFake ({ i, from, to, value, nonce }) {
    nonce = nonce || from.nonce++
    return new this({ i, from, to, value, nonce })
  }

  constructor ({ i, to, from, nonce, value, sig='sig' }) { // we ignore sig for now
    Object.assign(this, { i, to, from, nonce, value, sig })
  }

  get brief() {
    return `${this.i}:(${this.from?.i}#${this.nonce}(${this.value})=>${this.to?.i})`
  }

  async verify() {
    const valid = this.to && this.from && typeof this.nonce === 'number' && this.nonce >= 0 && this.value && this.sig && await this.verifySig()
    if (!valid) debug('--- FATAL: tx is invalid', this.brief)
    return valid
  }

  async verifySig() {
    return true
  }

  addHash() {
    this.hash = 'hash-' + i // TODO
  }

  static sort (a, b) {
    // const r = a.from.compareTo(b.from)
    // return r !== 0 ? r : a.to.compareTo(b.to)
    // return a.i - b.i // TODO only for theory test
    return a.compareTo(b)
  }

  toString() {
    return `< i: ${this.i}, from: ${this.from.i}, to: ${this.to.i}, value: ${this.value} >`
  }

  equals(other) {
    return this.from.equals(other.from) && this.to.equals(other.to) && this.value === other.value && this.nonce === other.nonce
  }

  compare(other) {
    return this.from.lt(other.from) ? this : this.from.gt(other.from) ? other :
      this.from.nonce < other.from.nonce ? this : this.from.nonce > other.from.nonce ? other :
        this.resolveDoubleSpending(other)
  }

  resolveDoubleSpending (other) {
    return this.to.lt(other.to) ? this : this.to.gt(other.to) ? other :
      this.value <= other.value ? this : other
  }

  compareTo(other) {
    return this.compare(other) === this ? -1 : 1
  }

  isDoubleSpend(other) {
    return this.from.equals(other.from) && this.nonce === other.nonce
  }
}

export { Transaction }
