import { Node } from '../core/node/node.js'

import Debug from 'debug'
import { w3Algorithm } from './w3.algorithm.js'
import { createFsm } from '../core/node/node-fsm.js'
import { util } from '../util.js'
import _ from 'lodash'

const debug = Debug('w3:poc:node')

class W3Node extends Node {

  constructor (swarm, isSingleNode = false) {
    const account = util.getEthereumAccount()
    super({ account, swarm, isSingleNode })
    createFsm(this)
  }

  get briefObj () {
    return { i: this.i, address: this.account.addressString, publicKeyString: this.account.publicKeyString }
  }

  _isCollector (publicKeyString, tailHash) {
    tailHash = tailHash ? tailHash : this.epoch.tailHash
    return w3Algorithm.isRandomSelected(this.swarm.distanceFn, tailHash, publicKeyString, this.swarm.config.COLLECTORS_AMOUNT)
  }

  _isWitness (bp, publicKeyString) {
    return w3Algorithm.isRandomSelected(this.swarm.distanceFn, bp, publicKeyString, this.swarm.config.WITNESSES_AMOUNT)
  }

  toJSON() {
    // return this.briefObj
    return _.omit(super.toJSON(), [])
  }
}

export { W3Node }
