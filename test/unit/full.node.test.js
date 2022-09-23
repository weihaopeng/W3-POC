import chai from 'chai'
import chaiString from 'chai-string'
import fs from 'fs-extra'

chai.use(chaiString)
const should = chai.should()

import { W3Swarm} from '../../src/w3/poc/index.js'

import Debug from 'debug'
import { config } from '../../src/w3/poc/config.default.js'
import { Epoch } from '../../src/w3/core/node/epoch/epoch.js'

// Debug.enable('w3:test')
const debug = Debug('w3:test')


describe('Full(Normal) Network Mode @issue#2 @issue#11', () => {
  // let NODES_AMOUNT = 16, TX_COUNT = 10,   COLLECTORS_AMOUNT = 2, WITNESSES_AMOUNT = 2 // TX_COUNT 小时，有可能会出现 --- FATAL: no enough txs for bp, TODO
  let NODES_AMOUNT = 16, TX_COUNT = 30,   COLLECTORS_AMOUNT = 2, WITNESSES_AMOUNT = 2

  const w3 = new W3Swarm({ NODES_AMOUNT })
  const tps = TX_COUNT / (config.EPOCH_TIME / 1000) // @see design/w3-node-activities-and-messages.png
  // const tps = TX_COUNT / (config.EPOCH_COLLECTING_TIME / 1000) // @see design/w3-node-activities-and-messages.png
  const txAmount = Math.ceil(100 * tps)

  beforeEach(() => {
    let height = 1
    Epoch.differenceEmitter.on('difference', ({dif, min, max, epochHeights}) => {
      if (dif > 1) {
        console.log('--- WARN: epoch height difference: %s ( > 1 )', dif)
        console.log('--- WARN: epochHeights: %s', epochHeights)
      } else if (dif === 0 && min > height) {
        console.log('--- SHOW: all epochs on the same height: %s', min)
        console.log('--- SHOW: epochHeights: %s', epochHeights)
        height = min
      }
    })
  })

  afterEach(() => {
    Epoch.stopAllEpoches()
    Epoch.clear()
  })


  before(async function () {
    this.timeout(0)
    await fs.remove('./test/results')
    await w3.init()
  })

  after(() => w3.destroy())

  it.skip('work normal to create blocks', async () => {
    debug('---- periodicEmitBlockMessage to send %s fake txs in %s tps, will create %s blocks, may end in %s s----', txAmount, tps, txAmount/TX_COUNT, txAmount / tps)
    await w3.sendFakeTxs(txAmount, 2 * tps)
    // await util.wait(Math.ceil(txAmount / TX_COUNT) * config.EPOCH_TIME)
    w3.showCollectorsStatistic()
    w3.showWitnessesStatistic()
    w3.nodes.should.have.length(NODES_AMOUNT)
    const heights = w3.nodes.map(node => node.chain.height)
    debug('--- heights: %o', heights)

    const chains = w3.nodes.map(node => {
      node.chain.blocks.splice(-1, 1) // remove the last block which may be replaced in the last epoch, which is still running now.
      return { node: node.i, chain: node.chain.superBrief.replace(/^height.+,/, '').replace(/ -> /g, ' -> \n') }
    })
    const chain = chains[0].chain
    debug('--- final chains: %O', chains)

    let valid = true
    for (let c of chains) {
      valid = (c.chain.length > chain.length && c.chain.startsWith(chain)) || chain.startsWith(c.chain)
      if (!valid) break
    }

    if (!valid) {
      for (let c of chains) {
        await fs.ensureFile(`./test/results/${c.node}.chain`)
        await fs.ensureFile(`./test/results/0.chain`)
      }
      should.fail('--- WARN: chains are not valid, see chains above.')
    }
    debug('end')
  }).timeout(0)
})

