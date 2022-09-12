import chai from 'chai'

const should = chai.should()


import Debug from 'debug'
import { Chain } from '../../src/w3/core/entities/chain.js'

const debug = Debug('w3:test')


describe('Test Chain @issue#2', () => {
  afterEach(() => Chain.reset())

  it('store common head chain', async () => {
    const chains = [
      await Chain.create({ i: 1 }, [{ hash: 1 }, { hash: 2 }, { hash: 3 }, { hash: 4 }, { hash: 5 }]),
      await Chain.create({ i: 1 }, [{ hash: 1 }, { hash: 2 }, { hash: 3 }, { hash: 4 }, { hash: 5 }]),
      await Chain.create({ i: 1 }, [{ hash: 1 }, { hash: 2 }, { hash: 3 }]),
    ]

    Chain.pruneCommonHeadBlocks()
    Chain.commonHeadBlocks.should.eqls([{ hash: 1 }, { hash: 2 }, { hash: 3 }])
    chains[0]._blocks.should.eqls([{ hash: 4 }, { hash: 5 }])
    chains[1]._blocks.should.eqls([{ hash: 4 }, { hash: 5 }])
    chains[2]._blocks.should.eqls([])
  })

  it('store common head chain, unconfirmed _blocks height 1', async () => {
    const UNCONFIRMED_BLOCKS_HEIGHT = 1
    const chains = [
      await Chain.create({ i: 1 }, [{ hash: 1 }, { hash: 2 }, { hash: 3 }, { hash: 4 }, { hash: 5 }]),
      await Chain.create({ i: 1 }, [{ hash: 1 }, { hash: 2 }, { hash: 3 }, { hash: 4 }, { hash: 5 }]),
      await Chain.create({ i: 1 }, [{ hash: 1 }, { hash: 2 }, { hash: 3 }]),
    ]

    Chain.pruneCommonHeadBlocks(UNCONFIRMED_BLOCKS_HEIGHT)
    Chain.commonHeadBlocks.should.eqls([{ hash: 1 }, { hash: 2 }])
    chains[0]._blocks.should.eqls([{ hash: 3 }, { hash: 4 }, { hash: 5 }])
    chains[1]._blocks.should.eqls([{ hash: 3 }, { hash: 4 }, { hash: 5 }])
    chains[2]._blocks.should.eqls([{ hash: 3 }, ])
  })

})


