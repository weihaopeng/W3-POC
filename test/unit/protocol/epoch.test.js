import chai from 'chai'

const should = chai.should()

import Debug from 'debug'
import { Epoch } from '../../../src/w3/core/protocol/epoch.js'
import { util } from '../../../src/w3/util.js'

const debug = Debug('w3:test')

describe('Epoch sync mechanism @issue#11', () => {

  afterEach(() => Epoch.clear())

  it('sync epochs start at different time within 2 epochs', async () => {
    const latencyUpperBound = 100
    const witnessAndMintTime = 4 * latencyUpperBound
    const collectTime = 3 * witnessAndMintTime + latencyUpperBound
    const epochTime = collectTime + witnessAndMintTime
    const epochCount = 10

    for (let i = 0; i < epochCount; i++) {
      const epoch =  Epoch.create(i, { collectTime, witnessAndMintTime })

      const possionLatency = util.exponentialRandom(epochCount / (collectTime * 5)) // show error
      // const possionLatency = util.exponentialRandom(epochCount / collectTime )
      debug('--- start epoch latency: %s ms', possionLatency)
      await util.wait(possionLatency)
      epoch.start()
    }

    Epoch.differenceEmitter.on('difference', ({dif, min, max, epochHeights}) => {
      if (dif > 1) {
        console.log('--- WARN: epoch height difference: %s ( > 1 )', dif)
        console.log('--- WARN: epochHeights: %s', epochHeights)
      }
    })
    await util.wait(10 * epochTime)
    Epoch.stopAllEpoches()

  }).timeout(0)
})


