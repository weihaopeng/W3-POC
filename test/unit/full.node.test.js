import chai from 'chai'
import chaiString from 'chai-string'
import fs from 'fs-extra'


chai.use(chaiString)
const should = chai.should()

import { W3Swarm, W3Node } from '../../src/w3/poc/index.js'
import { util } from '../../src/w3/util.js'

import Debug from 'debug'
import { config } from '../../src/w3/poc/config.default.js'
// Debug.enable('w3:test')
const debug = Debug('w3:test')
describe('Full(Normal) Network Mode @issue#2', () => {
  let NODES_AMOUNT = 16, TX_COUNT = 10, w3 = new W3Swarm({TX_COUNT, NODES_AMOUNT})
  const tps = TX_COUNT / (10 * config.WITNESS_AND_MINT_LATENCY / 1000) // @see design/w3-node-activies-and-messages.png


    before(async function () {
    this.timeout(0)
    await fs.remove('./test/results')
    await w3.init()
  })

  after(() => w3.destroy())

  it('work normal to create _blocks', async () => {
    await w3.sendFakeTxs(Math.ceil(100 * tps), tps)
    await util.wait(config.WITNESS_AND_MINT_LATENCY)
    // await util.wait(1000)
    w3.showCollectorsStatistic()
    w3.showWitnessesStatistic()
    w3.nodes.should.have.length(NODES_AMOUNT)
    const heights = w3.nodes.map(node => node.chain.height)
    debug('--- heights: %o', heights)

    const chains = w3.nodes.map(node => {
      node.chain.blocks.splice(-1, 1) // remove the last block which may be replaced in the last epoch, which is still runing now.
      return {node: node.i, chain: node.chain.superBrief.replace(/^height.+,/, '').replace(/ -> /g, ' -> \n')}
    })
    const chain = chains[0].chain
    debug('--- final chains: %O', chains)

    for (let c of chains) {
      const valid = (c.chain.length > chain.length && c.chain.startsWith(chain)) || chain.startsWith(c.chain)
      if (!valid) {
        await fs.ensureFile(`./test/results/${c.node}.chain`)
        await fs.ensureFile(`./test/results/0.chain`)
        await fs.writeFile(`./test/results/${c.node}.chain`, c.chain)
        await fs.writeFile(`./test/results/0.chain`, chain)
        should.fail(`node ${c.node} chain is not the same as node 0 chain`)
      }
    }
    debug('end')
  }).timeout(0)
})

