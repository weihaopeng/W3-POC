import chai from 'chai'

chai.should()

import { PocNetwork, PocNode } from '../../src/w3/poc/index.js'
import { util } from '../../src/w3/util.js'

import Debug from 'debug'

const debug = Debug('w3:test')

describe('w3.events  @issue#8', () => {
  let w3 = new PocNetwork({ W3_EVENTS_ON: true, TX_COUNT: 5, NODES_AMOUNT: 5 })

  before(async function () {
    this.timeout(0)
    await w3.init()
  })

  after(() => w3.destroy())

  it('`network.msg` messages are collected and sent', async () => {
    PocNode.isSingleNodeMode = false
    w3.events.on('network.msg.*', function (data) {
      debug(`--- ${this.event}: %o`, {
        from: data.from.i,
        to: data.to?.i,
        type: data.type,
        departureTime: data.departureTime,
        arrivalTime: data.arrivalTime
      })
    })
    await w3.sendFakeTxs(10, 1000) // only two block to driven the signle node mode dev.
    w3.showCollectorsStatistic()
    w3.showWitnessesStatistic()
    w3.nodes.should.have.length(5)
  }).timeout(0)

})
