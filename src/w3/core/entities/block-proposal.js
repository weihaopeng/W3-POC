import { Transaction } from './transaction.js'

import _ from 'lodash'
import { Account } from './account.js'

import Debug from 'debug'
const debug = Debug('w3:bp')

class BlockProposal {
  static index = 0 // TODO: currently only used for theory test
  constructor ({i, height, tailHash, txs, collector, witnessRecords = [] }) { // collector : {publicKeyString, i}
    txs = txs.map(tx => tx instanceof Transaction ? tx : new Transaction(tx))
    Object.assign(this, { height, tailHash, collector, txs, witnessRecords: [...witnessRecords] })
    this.i = i !== undefined ? i : this.constructor.index++  // TODO: currently only used for theory test
  }

  askForWitness (node) {
    const { publicKeyString, privateKey } = node.account
    this.witnessRecords.push({ asker: {publicKeyString, i: node.i }, askerSig: this.sig(privateKey) })
  }

  async witness (node) {
    const { publicKeyString, privateKey } = node.account
    const i = this.witnessRecords.findIndex(record => !record.witness)
    this.witnessRecords[i] = {...this.witnessRecords[i], witness: { publicKeyString, i: node.i }, witnessSig: this.sig(privateKey) }
  }

  async verify (node, isForPreivousEpoch) {
    let valid = Account.isValidPublicKeyString(this.collector.publicKeyString)
      && typeof this.height === 'number' && this.txs?.length > 0
      && this.verifyHeight(node, isForPreivousEpoch)
    if (!valid) return !!debug('--- bp height invalid, node.epoch.height: %s, bp height: %s ', node.epoch.height, this.height)


    valid = valid && node.isCollector(this.collector.publicKeyString, this.tailHash)
    if (!valid) return !!debug('--- FATAL: bp collector invalid, node.isCollector(this.collector): ', node.isCollector(this.collector.publicKeyString))

    valid = valid && this.verifyWitnessRecords(node)
    if (!valid) return !!debug('--- FATAL: bp witnessRecords invalid: %O', this.witnessRecords)
    return true
  }

  verifyHeight (node, isForPreivousEpoch) { // TODO: 待优化
    // undefined means verify a bp directly, it both valid for current epoch and previous epoch, to make create block go ahead, even for previous epoach.
    return isForPreivousEpoch !== undefined ? this._verifyHeight(node, true) || this._verifyHeight(node, false)
      : this._verifyHeight(node, isForPreivousEpoch) // this is called from block
    // return this._verifyHeight(isForPreivousEpoch, node)
  }

  _verifyHeight (node, isForPreivousEpoch) {
    const epochHeight = isForPreivousEpoch ? node.epoch.height - 1 : node.epoch.height
    const epochTailHash = isForPreivousEpoch ? node.epoch.previousTailHash : node.epoch.tailHash
    return (this.height === 1 || this.tailHash === epochTailHash ) // height bigger than 1, must have tailHash // TODO: tailHash should eqls node.
      && this.height === epochHeight + 1
  }

  verifyWitnessRecords (node) {
    let asker = this.collector, length = this.witnessRecords.length
    for (let i = 0; i < length; i++) {
      const wr = this.witnessRecords[i]
      if (i !== length - 1 && !wr.witness) return false // if not the last record, must have witness
      if (!this.verifyWitnessRecord(i, wr, asker, node)) return false
      // asker must be the witness of the previous record
      asker = wr.witness
    }
    return true
  }

  verifyWitnessRecord (i, wr, asker, node) {
    if (!Account.isValidPublicKeyString(asker.publicKeyString) || wr.asker.i !== asker.i || wr.asker.publicKeyString !== asker.publicKeyString) return false

    const bpAskForWitness = this.getBpAskForWitness(i, wr)
    if (!bpAskForWitness.verifySig(wr.asker, wr.askerSig)) return false

    if (!wr.witness) return true // last record may not witnessed yet

    const isValidWitness = Account.isValidPublicKeyString(wr.witness.publicKeyString) && node.isWitness(bpAskForWitness, wr.witness.publicKeyString)
    if (!isValidWitness) {
      debug('--- FATAL: not valid witness: %s', wr.witness)
      // node.network.debug.invalidWitness.push({ node: wr.witness, bp: bpAskForWitness })
      return false
    }

    // bpAskForWitness.witnessRecords.push(_.pick(wr, ['asker', 'askerSig']))
    return bpAskForWitness.verifySig(wr.witness.publicKeyString, wr.witnessSig)

  }

  getBpAskForWitness (i, wr) {
    const res = this.shallowCopy()
    res.witnessRecords = this.witnessRecords.slice(0, i)
    res.witnessRecords.push(_.pick(wr, ['asker', 'askerSig']))
    return res
  }

  isAllWitnessed (node) {
    return this.witnessRecords.length === node.network.config.WITNESS_ROUNDS_AMOUNT && this.witnessRecords.every(wr => wr.wr.witness)
  }

  sig (privateKeyString) {
    // TODO: degist this object, than sign
    return 'SIG TODO'
  }

  verifySig (publicKeyString, sig) {
    // TODO: real sig check
    return publicKeyString && sig
  }

  equals (other) {
    // return this.height === other.height && this.txPool.every((tx, j) => tx.i === other.txPool[j].i)
    return this.brief() === other.brief()
  }

  get superBrief () {
    return this.txs.map(tx => tx.i).join('-')
  }

  get brief () {
    return 'height:' + this.height + ', txs:' + this.superBrief
  }

  toString () {
    return JSON.stringify(this)
  }

  shallowCopy () {
    return new BlockProposal(this)
  }

  toJSON () { // make distanceFn has same results for different bp instances transferred by network
    return _.omit(this, 'i')
  }
}

export { BlockProposal }
