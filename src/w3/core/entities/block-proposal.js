import { Transaction } from './transaction.js'

import _ from 'lodash'
import { Account } from './account.js'

import Debug from 'debug'
const debug = Debug('w3:bp')

class BlockProposal {
  static index = 0 // TODO: currently only used for theory test
  constructor ({i, height, tailHash, txs, collector, witnessRecords = [] }) { // collector : {publicKeyString, i}
    if (_.isNil(height) || !tailHash || !txs || !collector) throw new Error(`can't create a BlockProposal, check the params`)
    height = parseInt(height)
    txs = txs.map(tx => tx instanceof Transaction ? tx : new Transaction(tx))
    Object.assign(this, { height, tailHash, collector, txs, witnessRecords: [...witnessRecords] })
    this.i = i !== undefined ? parseInt(i) : this.constructor.index++  // TODO: currently only used for theory test
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

  async verify (node, epoch) {
    let valid = Account.isValidPublicKeyString(this.collector.publicKeyString)
      && typeof this.height === 'number' && this.txs?.length > 0
      && (this.height === 1 || this.tailHash === epoch.tailHash ) // height bigger than 1, must have tailHash // TODO: tailHash should eqls node.
      && this.height === epoch.height + 1
    if (!valid) return !!debug('--- bp height invalid, node.epoch.height: %s, bp height: %s ', node.epoch.height, this.height)


    valid = valid && node.isCollector(this.collector.publicKeyString, this.tailHash)
    if (!valid) return !!debug('--- FATAL: bp collector invalid, node.isCollector(this.collector): ', node.isCollector(this.collector.publicKeyString))

    valid = valid && this.verifyWitnessRecords(node)
    if (!valid) return !!debug('--- FATAL: bp witnessRecords invalid: %O', this.witnessRecords)
    return true
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
      // node.swarm.debug.invalidWitness.push({ node: wr.witness, bp: bpAskForWitness })
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
    return this.witnessRecords.length === node.swarm.config.WITNESS_ROUNDS_AMOUNT && this.witnessRecords.every(wr => wr.wr.witness)
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


  /**
   * W3 Universal Rules  for comparing two bp/block
   * compare txs sequence, this smaller, shorter one is lower, and the winner
   */

  lt(other) {
    if (this.height !== other.height) debug('--- WARN: should only compare other with same height')
    for (let i = 0; i < this.txs.length; i++) {
      if (this.txs[i].lt(other.txs[i])) return true
      if (this.txs[i].gt(other.txs[i])) return false
    }

    return this.txs.length < other.txs.length   // shorter one is lower and less than, same length means equal
  }

  gt(other) {
    if (this.height !== other.height) debug('--- WARN: should only compare other with same height')
    for (let i = 0; i < this.txs.length; i++) {
      if (this.txs[i].gt(other.txs[i])) return true
      if (this.txs[i].lt(other.txs[i])) return false
    }
    return  false  // longer one is higher and great than, same length means equal
    // return  this.txs.length > other.txs.length  // the expression is ALWAYS TRUE here! longer one is higher and great than, same length means equal
  }
}

export { BlockProposal }
