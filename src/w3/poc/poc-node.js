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
  static NODES_AMOUNT = 3000
  static COLLECTORS_AMOUNT = 5
  static WITNESSES_AMOUNT = 5
  static WITNESS_ROUNDS_AMOUNT = 3
  static TX_COUNT = 100
  static INIT_CHAIN_INTERVAL = 10000 // 10秒
  static setNodeAmount (nodesAmount) {
    this.NODES_AMOUNT = nodesAmount
    this.distanceFn = util.NHashDistance(this.NODES_AMOUNT)
  }

  static distanceFn = util.NHashDistance(PocNode.NODES_AMOUNT)

  static initPreBlockValue = Math.floor(Math.random() * this.NODES_AMOUNT)

  /**
   * true means in single node network mode, when only the node (i === 0) solely collect, witness and mint
   * by set Node in singleNodeMode, we can easly write and debug the fundamental block building logics without
   * disturbing from collaboration logics
   */
  static isSingleNodeMode = false

  static index = 0

  constructor (network) {
    const account = getEthereumAccount()
    super({
      account, network,
      txCount: PocNode.TX_COUNT,
      initChainInterval: PocNode.INIT_CHAIN_INTERVAL,
      witnessRounds: PocNode.WITNESS_ROUNDS_AMOUNT
    })
    this.i = this.constructor.index++
  }

  get briefObj() {
    return {i: this.i, address: this.account.addressString}
  }

  isCollector () {
    return this.constructor.isSingleNodeMode ? this.isSingleNode() : this._isCollector()
  }

  _isCollector () {
    const preBlock = this.chain.tailHash || this.constructor.initPreBlockValue
    const distance = this.constructor.distanceFn(preBlock.toString(), this.account.publicKey)
    // debug('is collector,distance:', distance)
    return distance < this.constructor.COLLECTORS_AMOUNT
  }

  isWitness (blockProposal) {
    return this.constructor.isSingleNodeMode ? this.isSingleNode() : this._isWitness(blockProposal)
  }

  _isWitness (blockProposal) {
    return this.constructor.distanceFn(blockProposal.toString(), this.account.publicKey) < this.constructor.WITNESSES_AMOUNT
  }

  isSingleNode() {
    return this.constructor.isSingleNodeMode && this.i === 0
  }


  async askForWitnessAndMint(txs) {
    // singleNodeMode, directly witnessAndMint
    return this.constructor.isSingleNodeMode ? this.witnessAndMint(this.createBlockProposal(txs)) : super.askForWitnessAndMint(txs)
  }

  async continueWitnessAndMint (bp) {
    bp.askForWitness(this)
    // this.network.broadcast('block-proposal', bp, this) //this used in theory test to aviod of react on its own message
    // singleNodeMode, directly witnessAndMint
    return this.witnessAndMint(bp)
  }

}


export { PocNode }
