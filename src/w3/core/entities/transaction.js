import Debug from 'debug'
const debug = Debug('w3:tx')

class Transaction {
  static createFake ({ i, from, to, value, nonce }) {
    nonce = nonce || from.nonce++
    return new this({ i, from, to, value, nonce })
  }

  constructor ({ i, to, from, nonce, value, sig='sig' }) { // we ignore sig for now
    Object.assign(this, { i, to, from, nonce, value, sig })
    this.hash = 'hash-' + i // TODO
  }

  get brief() {
    return `${this.i}:(${this.from?.i}#${this.nonce}(${this.value})=>${this.to?.i})`
  }


  /**
   * TODO: using traditional tx verification algorithm verify against local fact
   * Illegal txPool
   * 2. txPool with invalid nonce
   * 3. txPool with invalid value
   * 4. txPool with invalid fee
   * 5. txPool with invalid gasPrice
   * 5. txPool with invalid from
   * 6. txPool with invalid to
   * 9. txPool with invalid timestamp
   *
   * TODO: find double spend txPool verifyThenUpdateOrAddTx apply the Universal Rule
   *
   * results: 1. added, 2. replaced, 3. rejected
   */
  verify() {
    const valid = this.to && this.from && typeof this.nonce === 'number' && this.nonce >= 0 && this.value && this.sig && this.verifySig()
    if (!valid) debug('--- FATAL: tx is invalid', this.brief)
    return valid
  }

  verifySig() {
    return true
  }

  static sort (a, b) {
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

  lt(other) {
    return this.i < other.i

    return this.from.lt(other.from) ? true : this.from.gt(other.from) ? false :
      this.from.nonce < other.from.nonce ? true : this.from.nonce > other.from.nonce ? false :
      this.to.lt(other.to)
  }

  gt(other) {
    return this.i > other.i

    return this.from.gt(other.from) ? true : this.from.lt(other.from) ? false :
      this.from.nonce > other.from.nonce ? true : this.from.nonce < other.from.nonce ? false :
        this.to.gt(other.to)
  }

  resolveDoubleSpending (other) {
    return this.to.lt(other.to) ? this : this.to.gt(other.to) ? other :
      this.value <= other.value ? this : other
  }

  compareTo(other) {
    return this.i - other.i

    return this.lt(other) ? -1 : this.gt(other) ? 1 : 0
  }

  isDoubleSpend(other) {
    return this.from.equals(other.from) && this.nonce === other.nonce
  }
}

export { Transaction }
