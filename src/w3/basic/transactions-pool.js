import { Transaction } from './transaction.js'

import Debug from 'debug'
const debug = Debug('w3:TxsPool')

class TransactionsPool {
  constructor (txCount) {
    this.txCount = txCount
    this.txs = []
  }

  add (tx) {
    this.txs.some( _tx => _tx.equals(tx)) || this.txs.push(tx)
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
  async verifyAndAddTx (tx) {

    // this.add(tx)
    // return { res: 'add', tx }
    if (!await tx.verify()) return { valid: false, isTxAdd: false }
    // TODO: using traditional tx verification algorithem verify against local fact,
    //  find double spend txs add apply the Universal Rule
    // results: 1. added, 2. replaced, 3. reject
    this.add(tx)
    return { valid: true, isTxAdd: true }
  }

  async verifyBpAndAddTxs (bp) {
    let valid = await bp.verify()
    debug('--- FATAL: verifyBpAndAddTxs: bp is invalid, should not happen', bp.brief)
    let allTxValid = true, isTxAdd = false
    for (let tx of bp.txs) {
      // bp 中的tx需要更新到本地
      let { valid: txValid, isTxAdd: txAdd } = await this.verifyAndAddTx(tx)
      if (!txValid) allTxValid = false
      if (txAdd) isTxAdd = true
    }
    return { valid: valid && allTxValid, isTxAdd }
  }
}

export { TransactionsPool }
