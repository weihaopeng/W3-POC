import { blake2b } from 'ethereum-cryptography/blake2b.js'
import Wallet from 'ethereumjs-wallet'
import { Account } from './core/entities/account.js'

const util = {

  gaussRandom (min, max, skew = 1) {
    let u = 0, v = 0
    while (u === 0) u = Math.random() //Converting [0,1) to (0,1)
    while (v === 0) v = Math.random()
    let num = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v)

    num = num / 10.0 + 0.5 // Translate to 0 -> 1
    if (num > 1 || num < 0) { // resample between 0 and 1 if out of range
      num = this.gaussRandom(min, max, skew)
    } else {
      num = Math.pow(num, skew) // Skew
      num *= max - min // Stretch to fill range
      num += min // offset to min
    }
    return num
  },

  exponentialRandom(lamda) {
    return -Math.log(1 - Math.random()) / lamda
  },

  wait(ms){
    return new Promise(r => setTimeout(r, ms ))
  },

  getEthereumAccount() {
    const EthWallet = Wallet.default.generate()
    const publicKey = EthWallet.getPublicKey() // Buffer(64)
    const privateKey = EthWallet.getPrivateKey() // Buffer(32)
    const address = EthWallet.getAddress()
    const publicKeyString = EthWallet.getPublicKeyString() // Buffer(64)
    const privateKeyString = EthWallet.getPrivateKeyString() // Buffer(32)
    const addressString = EthWallet.getAddressString()
    return new Account({ address, publicKey, privateKey, addressString, publicKeyString, privateKeyString })
  }


}

export { util }
