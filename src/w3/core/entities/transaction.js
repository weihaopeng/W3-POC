import Debug from 'debug'
import { Account } from './account.js'
const debug = Debug('w3:tx')

class Transaction {
  static createFake ({ i, from, to, value, nonce }) {
    nonce = nonce || from.nonce++
    return new this({ i, from, to, value, nonce })
  }

  static sort (a, b) {
    return a.compareTo(b)
  }

  constructor ({ i, to, from, nonce, value, sig='sig' }) { // we ignore sig for now
    to = to instanceof Account ? to : new Account(to)
    from = from instanceof Account ? from: new Account(from)
    Object.assign(this, { i, to, from, nonce, value, sig })
    this.hash = 'hash-' + i // for simplify debugging, use in dev only
  }

  get brief() {
    return `${this.i}:(${this.from?.i}#${this.nonce}(${this.value})=>${this.to?.i})`
  }

  toString() {
    return `< i: ${this.i}, from: ${this.from.i}, nonce: ${this.nonce}, to: ${this.to.i}, value: ${this.value} >`
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

  /**
   * W3 Universal Rules  for comparing two transactions
   * compare by the precedence of from, nonce, to, value , the lower one wins
   */

  equals(other) {
    return this.i === other.i // for simplify debugging, use in dev only

    return this.from.equals(other.from) && this.nonce === other.nonce && this.to.equals(other.to) && this.value === other.value
  }

  lt(other) {
    return this.i < other?.i // for simplify debugging, use in dev only

    return this.from.lt(other.from) ? true : this.from.gt(other.from) ? false :
      this.from.nonce < other.from.nonce ? true : this.from.nonce > other.from.nonce ? false :
        this.to.lt(other.to)
  }

  gt(other) {
    return !other || this.i > other.i // for simplify debugging, use in dev only

    return this.from.gt(other.from) ? true : this.from.lt(other.from) ? false :
      this.from.nonce > other.from.nonce ? true : this.from.nonce < other.from.nonce ? false :
        this.to.gt(other.to)
  }

  compareTo(other) {
    return this.lt(other) ? -1 : this.gt(other) ? 1 : 0
  }

  isDoubleSpend(other) {
    return this.from.equals(other.from) && this.nonce === other.nonce
  }

  resolveDoubleSpending (other) {
    return this.compareTo(other) <= 0 ? this : other // for simplify debugging, use in dev only

    return this.to.lt(other.to) ? this : this.to.gt(other.to) ? other :
      this.value <= other.value ? this : other
  }
}

export { Transaction }
