import { blake2b } from 'ethereum-cryptography/blake2b.js'

const util = {

  /**
   * Generate a hash function mapping two arbitrary values into the domain [0, n],
   * and then return a distance function calculating distance based on the hashed value.
   * @param n
   * @constructor
   */
  NHashDistance (n) {
    if (n >= 2 ** 32) throw new Error(`n should less than 2 ** 32`)
    const bits = n.toString(2).length
    const bytes = 4
    const hash = (v) => {
      v = typeof v === 'string' ? Buffer.from(v) : v
      const uint8Array = blake2b(v, bytes)
      this.fitToN(uint8Array, bytes, bits)
      const n = this.bufferToNumber(uint8Array)
      // debug('hash n: ', n)
      return n
    }

    return (v1, v2) => Math.abs(hash(v1) - hash(v2))
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
  }

}

export { util }
