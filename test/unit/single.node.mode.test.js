import chai from 'chai'

chai.should()

import { W3Swarm, W3Node, w3Algorithm } from '../../src/w3/poc/index.js'
import { util } from '../../src/w3/util.js'

import Debug from 'debug'
import { BlockProposal } from '../../src/w3/core/entities/block-proposal.js'
import { Account } from '../../src/w3/core/entities/account.js'
import { Block } from '../../src/w3/core/entities/block.js'
import { config } from '../../src/w3/poc/config.default.js'

const debug = Debug('w3:test')

describe('Single Node Network Mode @issue#2', () => {
  let w3 = new W3Swarm({ SINGLE_NODE_MODE: true, TX_COUNT: 5, LATENCY_UPPER_BOUND: 0 })

  before(async function () {
    this.timeout(0)
    await w3.init()
  })

  afterEach(() => w3.reset())
  after(() => w3.destroy())

  describe('normal creation & bad tx ', () => {
    it('normal creation of blocks', async () => {
      await w3.sendFakeTxs(10, 100) // only two block to drive the single node mode dev.
      await util.wait(1 * config.EPOCH_TIME)
      w3.showCollectorsStatistic()
      w3.showWitnessesStatistic()
      w3.nodes.should.have.length(1)
      w3.nodes[0].chain.blocks.should.have.length(1) // 2 _blocks are appended to the chain
      w3.nodes[0].localFacts.txPool.forEach(({ state }) => state.should.equal('chain'))
    }).timeout(0)

    it('drop a bad tx', async () => {
      await w3.sendFakeTxs(10, 100, 1) // only two block to drive the single node mode dev.
      await util.wait(config.WITNESS_AND_MINT_LATENCY)
      w3.showCollectorsStatistic()
      w3.showWitnessesStatistic()
      w3.nodes.should.have.length(1)
      w3.nodes[0].chain.blocks.should.have.length(0)
      w3.nodes[0].localFacts.txPool.should.have.length(9)
      w3.nodes[0].localFacts.txPool.filter(({ state }) => state === 'tx').should.have.length(9)
    })

  })

  describe('bad bp message', () => {
    it('drop a bad bp which has an invalid tx', async () => {
      const badBp = new BlockProposal({
        height: 3,
        collector: {publicKeyString: util.getEthereumAccount().publicKeyString, i: 0},
        tailHash: w3.nodes[0].chain.tailHash,
        txs: [1, 2, 3, 4].map(i => w3.createFakeTx(i))
      })
      badBp.txs.push = 'bad tx'
      w3.sendFakeBp()
      await util.wait(config.WITNESS_AND_MINT_LATENCY)
      w3.nodes[0].localFacts.txPool.should.have.length(0)
    })

    it('drop a bad bp which has an invalid collector', async () => {
      await w3.sendFakeBp(new BlockProposal({
        height: 1,
        collector: { publicKeyString: 'illPublicKeyString', i: 0 },
        tailHash: 'fakeHash',
        txs: [1, 2, 3, 4, 5].map(i => w3.createFakeTx(i))
      }))
      await util.wait(config.WITNESS_AND_MINT_LATENCY)
      w3.nodes[0].chain.height.should.equals(0)
    })

    it('drop a bad bp which has an invalid witness', async () => {
      await w3.sendFakeBp(new BlockProposal({
        height: 1,
        collector: {publicKeyString: util.getEthereumAccount().publicKeyString, i: 0},
        tailHash: 'fakeHash',
        txs: [1, 2, 3, 4, 5].map(i => w3.createFakeTx(i)),
        witnessRecords: [
          { asker: 'bad-witness', witness: 'bad-witness', signature: 'bad-witness' }
        ]
      }))
      await util.wait(config.WITNESS_AND_MINT_LATENCY)
      w3.nodes[0].chain.height.should.equals(0)

    })
  })

  describe('bad block message', () => {
    it('drop a bad block which has an invalid tx', async () => {
      const badBp = new BlockProposal({
        height: 3,
        collector: {publicKeyString: util.getEthereumAccount().publicKeyString, i: 0},
        tailHash: w3.nodes[0].chain.tailHash,
        txs: [1, 2, 3, 4].map(i => w3.createFakeTx(i))
      })
      badBp.txs.push = 'bad tx'
      w3.sendFakeBlock(new Block({
        preHash: 'fakeHash',
        height: 1,
        bp: badBp
      }))
      await util.wait(config.WITNESS_AND_MINT_LATENCY)
      w3.nodes[0].localFacts.txPool.should.have.length(4)
      w3.nodes[0].chain.height.should.equals(0)
    })

    it('drop a bad block which has an invalid collector', async () => {
      w3.sendFakeBlock(new Block({
        preHash: 'fakeHash',
        height: 1,
        bp: new BlockProposal({
          height: 3,
          tailHash: w3.nodes[0].chain.tailHash,
          txs: [1, 2, 3, 4, 5].map(i => w3.createFakeTx(i)),
          collector: { publicKeyString: 'illPublicKeyString', i: 0 }
        })
      }))
      await util.wait(config.WITNESS_AND_MINT_LATENCY)
      w3.nodes[0].chain.height.should.equals(0)
    })

    it('drop a bad block which has an invalid witness', async () => {
      w3.sendFakeBlock(new Block({
        preHash: 'fakeHash',
        height: 1,
        bp: new BlockProposal({
          height: 3,
          tailHash: w3.nodes[0].chain.tailHash,
          txs: [1, 2, 3, 4, 5].map(i => w3.createFakeTx(i)),
          collector: { publicKeyString: util.getPublicKeyString(), i: 0 },
          witnessRecords: [
            { asker: 'bad-witness', witness: 'bad-witness', signature: 'bad-witness' }
          ]
        })
      }))
      await util.wait(config.WITNESS_AND_MINT_LATENCY)
      w3.nodes[0].chain.height.should.equals(0)
    })
  })

  describe('verifyThenUpdateOrAddTx double spending txPool, only lower score one added', () => {

    it('lower one first, higher one rejected', async () => {
      const [low, high] = await w3.sendFakeDoubleSpendingTxs('lowerScore')
      await util.wait(config.WITNESS_AND_MINT_LATENCY)
      w3.nodes[0].localFacts.txPool.should.have.length(1)
      w3.nodes[0].localFacts.txPool[0].tx.equals(low).should.true
    })

    it('higher one first, lower one replaced', async () => {
      const [high, low] = await w3.sendFakeDoubleSpendingTxs('higherScore')
      await util.wait(config.WITNESS_AND_MINT_LATENCY)
      w3.nodes[0].localFacts.txPool.should.have.length(1)
      w3.nodes[0].localFacts.txPool[0].tx.equals(low).should.true
    })

  })
})

