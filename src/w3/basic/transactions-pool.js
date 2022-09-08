import { Transaction } from './transaction.js'

import Debug from 'debug'

const debug = Debug('w3:TxsPool')

class TransactionsPool {
  constructor (txCount) {
    this.txCount = txCount
    this.txs = [] // { tx, state } state: tx | bp | block | chain
  }

  reset () {
    this.txs = []
  }

  add (tx, state) {
    let found = false
    for (let _tx of this.txs) {
      if (_tx.tx.equals(tx)) {
        found = true
        _tx.state = state
        break
      }
    }
    found || this.txs.push({ tx, state })
  }

  update (txs, state) {
    txs.map(tx => this.updateState(tx, state))
  }

  updateState (tx, state) {
    const _tx = this.txs.find(_tx => _tx.tx.equals(tx))
    _tx && (_tx.state = state)
  }

  pickEnoughForBp (txCount = this.txCount) {
    const txs = this.txs.filter(({ state }) => state === 'tx')
    if (txs.length === txCount) {
      // debug('--- SHOW: this.txs.length: ', this.txs.length)
      txs.map(tx => tx.state = 'bp')
      return txs.map(({ tx }) => tx).sort(Transaction.sort)
    }
  }

  async verifyAndAddTx (tx, state = 'tx') {
    if (!await tx.verify()) return { valid: false, isTxAdd: false }
    /**
     * TODO: using traditional tx verification algorithem verify against local fact
     * Illegal txs
     * 2. txs with invalid nonce
     * 3. txs with invalid value
     * 4. txs with invalid fee
     * 5. txs with invalid gasPrice
     * 5. txs with invalid from
     * 6. txs with invalid to
     * 9. txs with invalid timestamp
     *
     * TODO: find double spend txs add apply the Universal Rule
     *
     * results: 1. added, 2. replaced, 3. reject
     */
    this.add(tx, state)
    return { valid: true, isTxAdd: true }
  }

  async verifyBpAndAddTxs (bp, node) {
    let valid = await bp.verify(node)
    if (!valid) debug('--- FATAL: verifyBpAndAddTxs: bp is invalid, should not happen', bp.brief)
    let { allTxValid, isTxAdd } = await this._verifyAndUpdateTxs(bp.txs, valid ? 'bp' : 'tx')
    return { valid: valid && allTxValid, isTxAdd }
  }

  async _verifyAndUpdateTxs (txs, state) {
    let allTxValid = true, isTxAdd = false
    for (let tx of txs) {
      // bp 中的tx需要更新到本地
      let { valid: txValid, isTxAdd: txAdd } = await this.verifyAndAddTx(tx, state)
      if (!txValid) allTxValid = false
      if (txAdd) isTxAdd = true
    }
    return { allTxValid, isTxAdd }
  }

  async verifyBlockAndAddTxs (block, node) { // TODO: not tested in single node mode
    let valid = await block.verify(node)
    if (!valid) debug('--- FATAL: verifyBlockAndAddTxs: block is invalid, should not happen', block.brief)
    let { allTxValid, isTxAdd } = await this._verifyAndUpdateTxs(block.txs, valid ? 'block' : 'tx')
    return { valid: valid && allTxValid, isTxAdd }
  }

}

export { TransactionsPool }
