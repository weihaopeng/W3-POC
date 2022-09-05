import chai from 'chai'
chai.should()

import { PocNetwork, PocNode } from '../../src/w3/poc/index.js'


import Debug from 'debug'
const debug = Debug('w3:test')

describe('theory test  @issue#2', () => {
  const nodeAmounts = 5
  PocNode.TX_COUNT = 5
  PocNode.setNodeAmount(nodeAmounts)
  let w3 = new PocNetwork(1)

  before(async function (){
    this.timeout(0)
    await w3.init()
  })

  after(() => w3.destroy())


  it('work normal to create blocks', async () => {
    await w3.sendFakeTxs(100, 100)
    w3.showCollectorsStatistic()
    w3.showWitnessesStatistic()
    w3.nodes.should.have.length(5)
  }).timeout(0)

  it('single node (network) mode', async () => {
    PocNode.isSingleNodeMode = true
    await w3.sendFakeTxs(10, 100) // only two block to driven the signle node mode dev.
    w3.showCollectorsStatistic()
    w3.showWitnessesStatistic()
    w3.nodes.should.have.length(5)
  }).timeout(0)

})
