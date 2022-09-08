import { blake2b } from 'ethereum-cryptography/blake2b.js'

import Debug from 'debug'
const debug = Debug('w3:algorithm')

const w3Algorithm = {

  /**
   * Generate a hash function mapping two arbitrary values into the domain [0, n],
   * and then return a distance function calculating distance based on the hashed value.
   * @param n
   * @constructor
   */
  NHashDistance (n) {
    if (n >= 2 ** 32) throw new Error(`n should less than 2 ** 32`)
    if (!this.isPowerOf2(n)) throw new Error(`n should be a power of 2`)
    const bits = n.toString(2).length
    const bytes = 4
    const hash = (v) => {
      const uint8Array = blake2b(Buffer.from(JSON.stringify(v)), bytes)
      // debug('unit8Array', uint8Array)
      this.fitToN(uint8Array, bytes, bits - 1)
      const n = this.bufferToNumber(uint8Array)
      debug('hash n: ', n)
      return n
    }

    return (v1, v2) => Math.abs(hash(v1) - hash(v2))
  },

  isPowerOf2 (n) {
    return (n & (n - 1)) === 0
  },

  bufferToNumber (uint8Arr) {
    const buffer = Buffer.from(uint8Arr)
    return buffer.readUInt32BE(0)
  },

  fitToN (uint8Array, bytes, bits) { // padding left with zero
    const paddingBytes = bytes - Math.ceil(bits / 8)
    for (let i = 0; i < paddingBytes; i++) uint8Array[i] = 0
    uint8Array[paddingBytes] = uint8Array[paddingBytes] >> 8 - bits % 8
  },

  /**
   * randomly selected
   * @param distanceFn
   * @param pointOfInteresting
   * @param candidateIdentity
   * @param candidatesAmount
   * @returns {boolean}
   */
  isRandomSelected (distanceFn, pointOfInteresting, candidateIdentity, candidatesAmount) {
    const distance = distanceFn(pointOfInteresting, candidateIdentity)
    // if (pointOfInteresting.witnessRecords) debug('bp.witnessRecords: %O', pointOfInteresting)
    // debug('--- is random selected %s selected,distance: %s', distance <= candidatesAmount, distance)
    return distance <= candidatesAmount
  },

  hash (v) {
    return Buffer.from(
      blake2b(Buffer.from(JSON.stringify(v)), 8))  // 8位便于开发，生产用32位
      .toString('hex')
  },

  universalRuleTx(txa, txb) {
    return txa.from.lt(txb.from) ? txa : txa.from.gt(txb.from) ? txb :
      txa.from.nonce < txb.from.nonce ? txa : txa.from.nonce > txb.from.nonce ? txb :
        txa.to.lt(txb.to) ? txa : txa.to.gt(txb.to) ? txb :
          txa.value < txb.value ? txa : txb
  }
}

export { w3Algorithm }
