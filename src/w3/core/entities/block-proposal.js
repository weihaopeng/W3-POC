import { Transaction } from './transaction.js'

import Debug from 'debug'
import _ from 'lodash'

const debug = Debug('w3:bp')

class BlockProposal {
  static index = 0 // TODO: currently only used for theory test
  constructor ({i, height, tailHash, txs, collector, witnessRecords = [] }) {
    txs = txs.map(tx => tx instanceof Transaction ? tx : new Transaction(tx))
    Object.assign(this, { height, tailHash, collector, txs, witnessRecords })
    this.i = i !== undefined ? i : this.constructor.index++  // TODO: currently only used for theory test
  }

  askForWitness ({ publicKeyString, privateKey }) {
    this.witnessRecords.push({ asker: publicKeyString, askerSig: this.sig(privateKey) })
  }

  async witness ({ publicKeyString, privateKey }) {
    const afw = this.witnessRecords.find(record => !record.witness)
    Object.assign(afw, { witness: publicKeyString, witnessSig: this.sig(privateKey) })
  }

  async verify (node) {
    let valid = typeof this.height === 'number' && this.txs?.length === node.network.config.TX_COUNT
      && (this.height === 1 || this.tailHash === node.chain.tailHash) // height bigger than 1, must have tailHash // TODO: tailHash should eqls node.
      && node.chain.height + 1 === this.height
    if (!valid) return !!debug('--- bp height invalid, node.chain.height: %s, bp height: %s ', node.chain.height, this.height)


    valid = valid && node.isCollector(this.collector)
    if (!valid) return !!debug('--- FATAL: bp collector invalid, node.isCollector(this.collector): ', node.isCollector(this.collector))

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
      asker = wr.witness // asker must be the witness of the previous record
    }
    return true
  }

  verifyWitnessRecord (i, wr, asker, node) {
    if (wr.asker !== asker) return false

    const bpAskForWitness = this.getBpAskForWitness(i, wr)
    if (!bpAskForWitness.verifySig(wr.asker, wr.askerSig)) return false

    if (!wr.witness) return true // last record may not witnessed yet

    const isValidWitness = node.isWitness(bpAskForWitness, wr.witness)
    if (!isValidWitness) {
      debug('--- FATAL: not valid witness: %s', wr.witness)
      // node.network.debug.invalidWitness.push({ node: wr.witness, bp: bpAskForWitness })
      return false
    }

    // bpAskForWitness.witnessRecords.push(_.pick(wr, ['asker', 'askerSig']))
    return bpAskForWitness.verifySig(wr.witness, wr.witnessSig)

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
