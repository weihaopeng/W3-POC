import chai from 'chai'
chai.should()

import { PocNetwork, PocNode } from '../../src/w3/poc/index.js'

import Debug from 'debug'
const debug = Debug('w3:test')

const wait = ms => new Promise(r => setTimeout(r, ms ))

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
    await wait(1000)
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
    await w3.sendFakeTxs(10, 100) // only two block to driven the signle node mode dev.
    w3.events.on('network.msg', data => debug('--- network.msg: %o', data))
    w3.showCollectorsStatistic()
    w3.showWitnessesStatistic()
    w3.nodes.should.have.length(5)
  }).timeout(0)

})
