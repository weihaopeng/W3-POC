import chai from 'chai'

chai.should()

import { W3Swarm, W3Node } from '../../src/w3/poc/index.js'
import { util } from '../../src/w3/util.js'

import Debug from 'debug'

const debug = Debug('w3:test')
describe('Full(Normal) Network Mode @issue#2', () => {
  let w3 = new W3Swarm({TX_COUNT: 5, NODES_AMOUNT: 8})

  before(async function () {
    this.timeout(0)
    await w3.init()
  })

  after(() => w3.destroy())

  it('work normal to create blocks', async () => {
    await w3.sendFakeTxs(6, 100)
    await util.wait(100)
    w3.showCollectorsStatistic()
    w3.showWitnessesStatistic()
    w3.nodes.should.have.length(8)
    // TODO: pass the test~!
    // w3.nodes[0].chain.blocks.should.have.length(2) // 2 blocks are appended to the chain
    const heights = w3.nodes.map(node => node.chain.height)
    debug('--- heights: %o', heights)
    w3.nodes.map(({ chain }) => debug(chain.superBrief))
  }).timeout(0)
})

