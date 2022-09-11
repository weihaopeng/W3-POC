import chai from 'chai'

chai.should()

import { W3Swarm, W3Node } from '../../src/w3/poc/index.js'
import { util } from '../../src/w3/util.js'

import Debug from 'debug'

const debug = Debug('w3:test')
describe('Full(Normal) Network Mode @issue#2', () => {
  let w3 = new W3Swarm({TX_COUNT: 5, NODES_AMOUNT: 8})

  before(async function () {
    this.timeout(0)
    await w3.init()
  })

  after(() => w3.destroy())

  it('work normal to create blocks', async () => {
    await w3.sendFakeTxs(100, 100)
    await util.wait(100)
    w3.showCollectorsStatistic()
    w3.showWitnessesStatistic()
    w3.nodes.should.have.length(8)
    // TODO: pass the test~!
    // w3.nodes[0].chain.blocks.should.have.length(2) // 2 blocks are appended to the chain
    const heights = w3.nodes.map(node => node.chain.height)
    debug('--- heights: %o', heights)
    const chains = w3.nodes.map(node => ({node: node.i, chain: node.chain.superBrief}))
    const chain = chains[0].chain
    chains.forEach(c => { // 各个节点的chain可能最后一个block不一样（有可能还未完成），但是前面的block都是一样的
      if (c.chain.length > chain.length) {
        c.chain.startsWith(chain).should.equals(true)
      } else {
        chain.startsWith(c.chain).should.equals(true)
      }
    })
    debug('--- final chains: %O', chains)
    // w3.nodes.map((node) => debug(node.debug.blocks.length))
    // w3.nodes.map((node) => {
    //   node.debug.blocks.should.have.length(w3.nodes[0].debug.blocks.length)
    // })
    //
    // const blockOnChainDebug = w3.nodes.map(node => node.chain.debug.blocks)
    // w3.nodes.map((node) => {
    //   node.chain.
    // })
    debug('end')
  }).timeout(0)
})

