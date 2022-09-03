import chai from 'chai'
chai.should()

import { W3Network, TheoryNode } from '../../src/w3/theory/two-stages-mint.theory.js'


import Debug from 'debug'
const debug = Debug('w3:test')

describe('theory test  @issue#2', () => {
  const nodeAmounts = 100
  TheoryNode.TX_COUNT = 5
  TheoryNode.setNodeAmount(nodeAmounts)
  let w3 = new W3Network(1)

  before(async function (){
    this.timeout(0)
    await w3.init()
  })

  after(() => w3.destroy())


  it('work normal to create blocks', async () => {
    await w3.sendFakeTxs(100, 100)
    w3.showCollectorsStatistic()
    w3.showWitnessesStatistic()
    w3.nodes.should.have.length(100)
  }).timeout(0)

})
