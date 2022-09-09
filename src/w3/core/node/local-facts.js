import { Transaction } from '../entities/transaction.js'

import Debug from 'debug'
import EventEmitter2 from 'eventemitter2'

const debug = Debug('w3:TxsPool')

class LocalFacts extends EventEmitter2{
  constructor (txCount) {
    super()
    this.txCount = txCount
    this.txPool = [] // { tx, state } state: tx | bp | block | chain
  }

  reset () {
    this.txPool = []
  }

  add (tx, state) {
    let found = false, replaced = null
    for (let _tx of this.txPool) {
      if (_tx.tx.equals(tx)) {
        found = true
        _tx.state = state
        break
      }

      if (_tx.tx.isDoubleSpend(tx)) {
        found = true
        const winner = _tx.tx.resolveDoubleSpending(tx)
        replaced = !_tx.tx.equals(winner)
        replaced && (_tx.tx = winner)
        _tx.state = state
        // if (_tx.state === 'chain') 链上块错误，发送查询消息获取正确块，发送fork消息 // TODO: not implemented
        // _tx.state 'tx', 'bp', 'block'阶段，直接替换，不需要发送消息，由其它节点自行分辨问题

        // TODO: may also check current chain
        break
      }

    }

    found || this.txPool.push({ tx, state })
    const res = !found ? 'added' : replaced === null ? 'updatedState' : replaced ? 'replaced' : 'rejected'
    this.emit('tx-added', {tx, state, res})
    return res
  }

  updateTxsState (txs, state) {
    txs.map(tx => this.updateState(tx, state))
  }

  updateState (tx, state) {
    const _tx = this.txPool.find(_tx => _tx.tx.equals(tx))
    _tx && (_tx.state = state)
  }

  pickEnoughForBp (txCount = this.txCount) {
    const txs = this.txPool.filter(({ state }) => state === 'tx')
    if (txs.length === txCount) {
      // debug('--- SHOW: this.txPool.length: ', this.txPool.length)
      txs.map(tx => tx.state = 'bp')
      return txs.map(({ tx }) => tx).sort(Transaction.sort)
    }
  }

  async verifyAndUpdate(type, data, node) {
    return type === 'tx' ? this.verifyAndAddTx(data) :
      type === 'bp' ? this.verifyBpAndAddTxs(data, node) :
        type === 'block' ? this.verifyBlockAndAddTxs(data, node) :
          this.verifyForkAndAddTx(data, node)
  }

  async verifyAndAddTx (tx, state = 'tx') {
    if (!await tx.verify()) return { valid: false, txRes: 'rejected' }
    /**
     * TODO: using traditional tx verification algorithem verify against local fact
     * Illegal txPool
     * 2. txPool with invalid nonce
     * 3. txPool with invalid value
     * 4. txPool with invalid fee
     * 5. txPool with invalid gasPrice
     * 5. txPool with invalid from
     * 6. txPool with invalid to
     * 9. txPool with invalid timestamp
     *
     * TODO: find double spend txPool add apply the Universal Rule
     *
     * results: 1. added, 2. replaced, 3. rejected
     */
    const txRes = this.add(tx, state)
    return { valid: true, txRes}
  }

  async verifyBpAndAddTxs (bp, node) {
    let valid = await bp.verify(node)
    if (!valid) debug('--- FATAL: verifyBpAndAddTxs: bp is invalid, should not happen', bp.brief)
    let { allTxValid } = await this._verifyAndUpdateTxs(bp.txs, valid ? 'bp' : 'tx')
    return { valid: valid && allTxValid }
  }

  async _verifyAndUpdateTxs (txs, state) {
    let allTxValid = true
    for (let tx of txs) {
      // bp 中的tx需要更新到本地
      let { valid: txValid, txRes } = await this.verifyAndAddTx(tx, state)
      if (!txValid || txRes === 'rejected') allTxValid = false
      // 'updatedState' means the tx is be found, and no double spending problem, only update its state
      // 'rejected' means the tx is be found double spending and lose in the conflict resolving, and that make the containing bp/block invalid
      // 'replaced' means the tx is be found double spending and win in the conflict resolving, the bp/block valid
      // 'added' means the tx is new
    }
    return { allTxValid }
  }

  async verifyBlockAndAddTxs (block, node) { // TODO: not tested in single node mode
    let valid = await block.verify(node)
    if (!valid) debug('--- FATAL: verifyBlockAndAddTxs: block is invalid, should not happen', block.brief)
    let { allTxValid } = await this._verifyAndUpdateTxs(block.txs, valid ? 'chain' : 'tx') // valid block add to chain
    return { valid: valid && allTxValid }
  }

  async verifyForkAndAddTx (data, node) {
    return 'not implemented yet.'
  }
}

export { LocalFacts }
