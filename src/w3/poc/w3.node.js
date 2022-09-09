import Wallet from 'ethereumjs-wallet'
import { Node } from '../core/node/node.js'
import { Account } from '../core/entities/account.js'

import Debug from 'debug'
import { w3Algorithm } from './w3.algorithm.js'

const debug = Debug('w3:poc:node')

const getEthereumAccount = () => {
  const EthWallet = Wallet.default.generate()
  const publicKey = EthWallet.getPublicKey() // Buffer(64)
  const privateKey = EthWallet.getPrivateKey() // Buffer(32)
  const address = EthWallet.getAddress()
  const publicKeyString = EthWallet.getPublicKeyString() // Buffer(64)
  const privateKeyString = EthWallet.getPrivateKeyString() // Buffer(32)
  const addressString = EthWallet.getAddressString()
  return new Account({ address, publicKey, privateKey, addressString, publicKeyString, privateKeyString })
}

class W3Node extends Node {
  static index = 0

  constructor (network, isSingleNode = false) {
    const account = getEthereumAccount()
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

export { W3Node, getEthereumAccount }
