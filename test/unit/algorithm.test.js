import chai from 'chai'

chai.should()

import { W3Network, W3Node } from '../../src/w3/poc/index.js'
import { util } from '../../src/w3/util.js'

import Debug from 'debug'
import { w3Algorithm } from '../../src/w3/poc/w3.algorithm.js'

const debug = Debug('w3:test')

import { blake2b } from 'ethereum-cryptography/blake2b.js'
import { BlockProposal } from '../../src/w3/basic/block-proposal.js'

describe('Key points of Protocol', () => {
  // let w3 = new W3Network({TX_COUNT: 5, NODES_AMOUNT: 8})
  //
  // before(async function () {
  //   this.timeout(0)
  //   await w3.init()
  // })
  //
  // after(() => w3.destroy())
  describe('Algorithems used in verification of BP in the 2 stages', () => {

    it('bp changed a little and the distance changes', async () => {
      /**
       * 分步原理验证，distanceFn(bp, pk) === distanceFn(bp.clone(), pk)
       */
      let distanceFn = w3Algorithm.NHashDistance(100) // nodes amount 1000
      let bp = { id: 'bp', txs: ['1','2']} // fake bp
      let bpReceived = {...bp}
      let publicKeyString = '123345566'
      let distance = distanceFn(bp, publicKeyString)
      let recalcalutedDistance = distanceFn(bpReceived, publicKeyString)
      debug('distance: %s, recalcalutedDistance: %s', distance, recalcalutedDistance)
      distance.should.equal(recalcalutedDistance)
      const d1 = distance

      bp = { id: 'bp1', txs: ['1','2']} // fake bp
      bpReceived = {...bp}
      publicKeyString = '123345566'
      distance = distanceFn(bp, publicKeyString)
      recalcalutedDistance = distanceFn(bpReceived, publicKeyString)
      debug('distance: %s, recalcalutedDistance: %s', distance, recalcalutedDistance)
      distance.should.equal(recalcalutedDistance)
      d1.should.not.equal(distance)
    })
  })
})

/**
 * 需要检验和实现
 * 1. tx.nonce 不合法，超过了当前账户的nonce + 1
 * 2. tx.nonce 不合法，小于了当前账户的nonce
 * 3. tx.nonce 不合法，等于当前账户的nonce
 *
 * 4. block冲突, tx不同, 但tx本身不冲突
 * 5. block冲突, tx不同, 但tx本身冲突，双花
 *
 * node.state !== 'ready'时，接受消息，但不参与witness和collect，
 * 当其ready时，tx-pool能否追上，成为合法collector？
 *
 */


