import chai from 'chai'

chai.should()

import { PocNetwork, PocNode } from '../../src/w3/poc/index.js'
import { util } from '../../src/w3/util.js'

import Debug from 'debug'

const debug = Debug('w3:test')

describe('Single Node Network Mode', () => {
  PocNetwork.TX_COUNT = 5
  let w3 = new PocNetwork({ singleNodeMode: true })

  before(async function () {
    this.timeout(0)
    await w3.init()
  })

  after(() => w3.destroy())

  it('single node (network) mode', async () => {
    await w3.sendFakeTxs(10, 100) // only two block to drive the single node mode dev.
    w3.showCollectorsStatistic()
    w3.showWitnessesStatistic()
    w3.nodes.should.have.length(1)
    w3.nodes[0].chain.blocks.should.have.length(2) // 2 blocks are appended to the chain
  }).timeout(0)

})

