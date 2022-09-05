import chai from 'chai'
chai.should()

import { PocNetwork, PocNode } from '../../src/w3/poc/index.js'
import { util } from '../../src/w3/util.js'

import Debug from 'debug'
const debug = Debug('w3:test')

describe('Poc test  @issue#2', () => {
  const nodeAmounts = 5
  PocNode.TX_COUNT = 5
  PocNode.setNodeAmount(nodeAmounts)
  let w3 = new PocNetwork()

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
    await w3.sendFakeTxs(10, 100) // only two block to drive the single node mode dev.
    w3.showCollectorsStatistic()
    w3.showWitnessesStatistic()
    w3.nodes.should.have.length(5)
  }).timeout(0)

})

describe('w3.events  @issue#8', () => {
  const nodeAmounts = 5
  PocNode.TX_COUNT = 5
  PocNode.setNodeAmount(nodeAmounts)
  let w3 = new PocNetwork(true)

  before(async function (){
    this.timeout(0)
    await w3.init()
  })

  after(() => w3.destroy())


  it('`network.msg` messages are collected and sent', async () => {
    PocNode.isSingleNodeMode = false
    w3.events.on('network.msg.*', function (data) {
      debug(`--- ${this.event}: %o`, { from: data.from.i, to: data.to?.i, type: data.type, departureTime: data.departureTime, arrivalTime: data.arrivalTime })
    })
    await w3.sendFakeTxs(10, 1000) // only two block to driven the signle node mode dev.
    w3.showCollectorsStatistic()
    w3.showWitnessesStatistic()
    w3.nodes.should.have.length(5)
  }).timeout(0)

})
