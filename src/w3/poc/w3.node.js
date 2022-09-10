import { Node } from '../core/node/node.js'

import Debug from 'debug'
import { w3Algorithm } from './w3.algorithm.js'
import { util } from '../util.js'

const debug = Debug('w3:poc:node')

class W3Node extends Node {
  static index = 0

  constructor (network, isSingleNode = false) {
    const account = util.getEthereumAccount()
    super({ account, network, isSingleNode })
    this.i = this.constructor.index++
  }

  get briefObj () {
    return { i: this.i, address: this.account.addressString }
  }

  _isCollector (publicKeyString) {
    const preBlock = this.chain.tailHash || this.network.initPreBlockValue // !CAUSION: everty node should have the same preBlockValue
    return w3Algorithm.isRandomSelected(this.network.distanceFn, preBlock, publicKeyString, this.network.config.COLLECTORS_AMOUNT)
  }

  _isWitness (bp, publicKeyString) {
    return w3Algorithm.isRandomSelected(this.network.distanceFn, bp, publicKeyString, this.network.config.WITNESSES_AMOUNT)
  }
}

export { W3Node }
