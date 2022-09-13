import chai from 'chai'
import chaiString from 'chai-string'
import fs from 'fs-extra'

chai.use(chaiString)
const should = chai.should()

import { W3Swarm, W3Node } from '../../src/w3/poc/index.js'
import { util } from '../../src/w3/util.js'

import Debug from 'debug'
import { config } from '../../src/w3/poc/config.default.js'
Debug.enable('w3:test')
const debug = Debug('w3:test')
describe('Full(Normal) Network Mode @issue#2', () => {
  let NODES_AMOUNT = 16, TX_COUNT = 10,   COLLECTORS_AMOUNT = 2, WITNESSES_AMOUNT = 2

  const w3 = new W3Swarm({ TX_COUNT, NODES_AMOUNT })
  const tps = TX_COUNT / (10 * config.WITNESS_AND_MINT_LATENCY / 1000) // @see design/w3-node-activities-and-messages.png
  const txAmount = Math.ceil(100 * tps)

  before(async function () {
    this.timeout(0)
    await fs.remove('./test/results')
    await w3.init()
  })

  after(() => w3.destroy())

  it('work normal to create blocks', async () => {
    debug('---- periodicEmitBlockMessage to %s send fake txs in %s tps, will create %s blocks, may end in %s s----', txAmount, tps, txAmount/TX_COUNT, txAmount / tps)
    await w3.sendFakeTxs(txAmount, tps)
    await util.wait((TX_COUNT / tps) * 100 + config.WITNESS_AND_MINT_LATENCY)
    w3.showCollectorsStatistic()
    w3.showWitnessesStatistic()
    w3.nodes.should.have.length(NODES_AMOUNT)
    const heights = w3.nodes.map(node => node.chain.height)
    debug('--- heights: %o', heights)

    const chains = w3.nodes.map(node => {
      node.chain.blocks.splice(-1, 1) // remove the last block which may be replaced in the last epoch, which is still runing now.
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

