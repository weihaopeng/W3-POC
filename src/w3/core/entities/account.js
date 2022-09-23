import { Chain } from './chain.js'
import { LocalFacts } from '../node/local-facts.js'
import { Transaction } from './transaction.js'
import { Block } from './block.js'
import { Fork } from './fork.js'
import { BlockProposal } from './block-proposal.js'

import Debug from 'debug'
import _ from 'lodash'
const debug = Debug('w3:account')

class Account {
  static index = 0 // TODO: currently only used for theory test
  static isValidPublicKeyString(pkString) {
    return pkString?.length === 130 && pkString.startsWith('0x')
  }

  constructor ({i, address, publicKey, privateKey, addressString, publicKeyString, privateKeyString }) {
    Object.assign(this, { address, publicKey, privateKey, addressString, publicKeyString, privateKeyString })
    this.i = i !== undefined ? parseInt(i) : this.constructor.index++ // TODO: currently only used for theory test
    this.nonce = 0
  }

  compareTo (other) {
    return this.eq(other) ? 0 : this.gt(other) ? 1 : -1
  }

  equals(other) {
    return this.address === other.address
  }

  lt(other) {
    return this.address < other.address
  }

  gt(other) {
    return this.address > other.address
  }

  eq(other) {
    return this.address === other.address
  }

  // toJSON() {
  //   return _.omit(this, 'nonce') // 注意！这里必须要omit nonce，否则会导致verifyWitness时，同一account，其nonce不同，导致验证失败。
  // }
}


export { Account }
