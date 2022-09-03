import { Transaction } from './transaction.js'

class TransactionsPool {
  constructor (txCount) {
    this.txCount = txCount
    this.txs = []
  }


  addAndPickTxs (tx) {
    this.txs.push(tx)
    if (this.txs.length === this.config.txCount) {
      return this.txs.splice(0, this.txCount).sort(Transaction.sort)
    }
  }
}

export { TransactionsPool }
