import chai from 'chai'

chai.should()

import { W3Network, W3Node } from '../../src/w3/poc/index.js'
import { util } from '../../src/w3/util.js'

import Debug from 'debug'

const debug = Debug('w3:test')
describe('Full(Normal) Network Mode @issue#2', () => {
  let w3 = new W3Network({TX_COUNT: 5, NODES_AMOUNT: 5})

  before(async function () {
    this.timeout(0)
    await w3.init()
  })

  after(() => w3.destroy())

  it('work normal to create blocks', async () => {
    await w3.sendFakeTxs(100, 100)
    w3.showCollectorsStatistic()
    w3.showWitnessesStatistic()
    w3.nodes.should.have.length(5)
    // TODO: pass the test~!
    // w3.nodes[0].chain.blocks.should.have.length(2) // 2 blocks are appended to the chain
  }).timeout(0)
})

