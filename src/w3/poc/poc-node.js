import { EventEmitter } from 'node:events'
import _ from 'lodash'
import Wallet from 'ethereumjs-wallet'
import { Account, Node } from '../basic/node.js'
import { util } from '../util.js'


import Debug from 'debug'
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

class PocNode extends Node {
  static setDistanceFn (nodesAmount) {
    this.distanceFn = util.NHashDistance(nodesAmount)
    this.initPreBlockValue = Math.floor(Math.random() * nodesAmount) // TODO: use a better way to init preBlockValue
  }

  static index = 0

  constructor (network, isSingleNode=false) {
    const account = getEthereumAccount()
    super({
      account, network,
      txCount: network.config.TX_COUNT,
      initChainInterval: network.config.INIT_CHAIN_INTERVAL,
      witnessRounds: network.config.WITNESS_ROUNDS_AMOUNT,
      isSingleNode
    })
    this.i = this.constructor.index++
  }

  get briefObj() {
    return {i: this.i, address: this.account.addressString}
  }

  _isCollector () {
    const preBlock = this.chain.tailHash || this.constructor.initPreBlockValue
    const distance = this.constructor.distanceFn(preBlock.toString(), this.account.publicKey)
    // debug('is collector,distance:', distance)
    return distance < this.constructor.COLLECTORS_AMOUNT
  }

  _isWitness (blockProposal) {
    return this.constructor.distanceFn(blockProposal.toString(), this.account.publicKey) < this.constructor.WITNESSES_AMOUNT
  }

  async continueWitnessAndMint (bp) {
    bp.askForWitness(this)
    // this.network.broadcast('block-proposal', bp, this) //this used in theory test to aviod of react on its own message
    // singleNodeMode, directly witnessAndMint
    return this.witnessAndMint(bp)
  }

}


export { PocNode }
