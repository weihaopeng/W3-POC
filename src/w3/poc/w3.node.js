import { Node } from '../core/node/node.js'

import Debug from 'debug'
import { w3Algorithm } from './w3.algorithm.js'
import { createFsm } from '../core/node/node-fsm.js'
import { util } from '../util.js'
import _ from 'lodash'

const debug = Debug('w3:poc:node')

class W3Node extends Node {

  constructor (network, isSingleNode = false) {
    const account = util.getEthereumAccount()
    super({ account, network, isSingleNode })
    createFsm(this)
  }

  get briefObj () {
    return { i: this.i, address: this.account.addressString }
  }

  _isCollector (publicKeyString, tailHash) {
    tailHash = tailHash ? tailHash : this.epoch.tailHash
    return w3Algorithm.isRandomSelected(this.network.distanceFn, tailHash, publicKeyString, this.network.config.COLLECTORS_AMOUNT)
  }

  _isWitness (bp, publicKeyString) {
    return w3Algorithm.isRandomSelected(this.network.distanceFn, bp, publicKeyString, this.network.config.WITNESSES_AMOUNT)
  }

  toJSON() {
    _.omit(this, ['network', 'localFacts', '_fsm'])
  }
}

export { W3Node }
