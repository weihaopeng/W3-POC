import chai from 'chai'

const should = chai.should()

import Debug from 'debug'
import { Epoch } from '../../../src/w3/core/protocol/epoch.js'
import { util } from '../../../src/w3/util.js'
import EventEmitter2 from 'eventemitter2'

const debug = Debug('w3:test')

const blockEventEmitter = new EventEmitter2()

describe('Epoch sync mechanism @issue#11', () => {

  beforeEach(() => {
    Epoch.differenceEmitter.on('difference', ({dif, min, max, epochHeights}) => {
      if (dif > 1) {
        console.log('--- WARN: epoch height difference: %s ( > 1 )', dif)
        console.log('--- WARN: epochHeights: %s', epochHeights)
      } else if (dif === 0) {
        console.log('--- SHOW: all epoches on the same height: %s', min)
        console.log('--- SHOW: epochHeights: %s', epochHeights)
      }
    })
  })

  afterEach(() => {
    blockEventEmitter.removeAllListeners()
    Epoch.clear()
  })

  const latencyUpperBound = 100
  const witnessAndMintTime = 4 * latencyUpperBound
  const collectTime = 3 * witnessAndMintTime + latencyUpperBound
  const epochTime = collectTime + witnessAndMintTime
  const epochCount = 10

  it('without reset, unsync with height difference converge to 3~4', async () => {
    for (let i = 0; i < epochCount; i++) {
      const epoch =  Epoch.create(i, { collectTime, witnessAndMintTime })
      const possionLatency = util.exponentialRandom(epochCount / (collectTime * 5)) // show error
      // const possionLatency = util.exponentialRandom(epochCount / collectTime )
      debug('--- periodicEmitBlockMessage epoch latency: %s ms', possionLatency)
      await util.wait(possionLatency)
      epoch.start()
    }

    await util.wait(10 * epochTime)
    Epoch.stopAllEpoches()

  }).timeout(0)

  it('periodic emit block message, sync with height difference converge to 0', async () => {
    for (let i = 0; i < epochCount; i++) {
      const epoch =  Epoch.create(i, { collectTime, witnessAndMintTime })

      // Try to sync with height difference converge to 0
      blockEventEmitter.on('block', ({ height }) => {
        if (epoch.height > height) epoch.reset()
      })

      epoch.on('stage', (async ({ stage }) => {
        if (stage === 'witnessAndMint') {
          const guassLatency = util.gaussRandom(collectTime, collectTime + witnessAndMintTime)
          await util.wait(guassLatency)
          debug('----  block event emit block height: %s, with witnessAndMintTime: %s', epoch.height, guassLatency)
          blockEventEmitter.emit('block', { height: epoch.height })
          epoch.immediatelyNextEpoch()
        }
      }))

      const possionLatency = util.exponentialRandom(epochCount / (collectTime * 5)) // show error
      // const possionLatency = util.exponentialRandom(epochCount / collectTime )
      debug('--- start epoch latency: %s ms', possionLatency)
      await util.wait(possionLatency)
      epoch.start()
    }

    await util.wait(10 * epochTime)
    Epoch.stopAllEpoches()

  }).timeout(0)
})


