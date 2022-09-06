import { Transaction } from './transaction.js'

class TransactionsPool {
  constructor (txCount) {
    this.txCount = txCount
    this.txs = []
  }

  add (tx) {
    this.txs.push(tx)
  }

  pickEnough (tx) {
    if (this.txs.length === this.txCount) {
      return this.txs.splice(0, this.txCount).sort(Transaction.sort)
    }
  }

  /**
   * Illegal txs
   * 2. txs with invalid nonce
   * 3. txs with invalid value
   * 4. txs with invalid fee
   * 5. txs with invalid gasPrice
   * 5. txs with invalid from
   * 6. txs with invalid to
   * 9. txs with invalid timestamp
   */
  async verifyAndAdd (tx) {
    // TODO: using traditional tx verification algorithem verify against local fact,
    //  find double spend txs add apply the Universal Rule

    // 1. added, 2. replaced, 3. reject
    this.add(tx)
    return { res: 'add', tx }
  }
}

export { TransactionsPool }
