import chai from 'chai'

chai.should()

import { W3Network, W3Node } from '../../src/w3/poc/index.js'
import { util } from '../../src/w3/util.js'

import Debug from 'debug'
import { BlockProposal } from '../../src/w3/basic/block-proposal.js'

const debug = Debug('w3:test')

describe('Single Node Network Mode', () => {
  let w3 = new W3Network({ SINGLE_NODE_MODE: true, TX_COUNT: 5 })

  before(async function () {
    this.timeout(0)
    await w3.init()
  })

  afterEach(() => w3.reset())
  after(() => w3.destroy())

  it('normal creation of blocks', async () => {
    await w3.sendFakeTxs(10, 100) // only two block to drive the single node mode dev.
    w3.showCollectorsStatistic()
    w3.showWitnessesStatistic()
    w3.nodes.should.have.length(1)
    w3.nodes[0].chain.blocks.should.have.length(2) // 2 blocks are appended to the chain
    w3.nodes[0].txPool.txs.forEach(({state}) => state.should.equal('chain'))
  })

  it('drop a bad tx', async () => {
    await w3.sendFakeTxs(10, 100, 1) // only two block to drive the single node mode dev.
    w3.showCollectorsStatistic()
    w3.showWitnessesStatistic()
    w3.nodes.should.have.length(1)
    w3.nodes[0].chain.blocks.should.have.length(1) // only 1 blocks are appended to the chain
    w3.nodes[0].txPool.txs.should.have.length(9)
    w3.nodes[0].txPool.txs.filter(({state}) => state === 'chain').should.have.length(5)
    w3.nodes[0].txPool.txs.filter(({state}) => state === 'tx').should.have.length(4)
  })

  it('drop a bad bp which has an invalid tx', async () => {
    await w3.sendFakeTxs(10, 100) // only two block to drive the single node mode dev.
    w3.nodes.should.have.length(1)
    w3.nodes[0].chain.blocks.should.have.length(2) // 2 blocks are appended to the chain
    w3.nodes[0].txPool.txs.forEach(({state}) => state.should.equal('chain'))

    const txs = w3.nodes[0].txPool.txs.map(({tx}) => tx).slice(0, 4).concat('bad-tx')
    w3.sendFakeBp(new BlockProposal({height: 3, tailHash: w3.nodes[0].chain.tailHash, txs}))

  })

  // TODO:
  //  1. tx-pool中的添加时，去重
  //  2. results: 1. added, 2. replaced, 3. reject
  //  3. tx-pool的双花查找
  //  4. tx-pool中tx的状态更新？valid bp ? state -> valid ? 'bp' : 'tx'
  it('drop a bad bp which has an invalid collector', async () => {})

  it('drop a bad bp which has an invalid witness', async () => {})

  it('drop a bad block which has an invalid tx', async () => {})

  it('drop a bad block which has an invalid collector', async () => {})

  it('drop a bad block which has an invalid witness', async () => {})

})

