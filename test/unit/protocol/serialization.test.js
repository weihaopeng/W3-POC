import chai from 'chai'

const should = chai.should()

import Debug from 'debug'
import { Account, Transaction, BlockProposal, Block, Chain, Fork } from '../../../src/w3/core/entities/index.js'
import { W3Swarm } from '../../../src/w3/poc/index.js'
import { util } from '../../../src/w3/util.js'

const debug = Debug('w3:test')


describe('Serialization @issue#20', () => {

  it('new Account ser/deser', () => {
    let account = new Account({ i: 1, publicKeyString: 'xxxxxx' })
    let account2 = new Account(JSON.parse(JSON.stringify(account)))
    account.should.eqls(account2)
  })

  it('new Account ser/deser', () => {
    let account = util.getEthereumAccount()
    let account2 = new Account(JSON.parse(JSON.stringify(account)))
    account.should.eqls(account2)
  })

  it('new Transaction ser/deser', () => {
    let [from, to] = [util.getEthereumAccount(), util.getEthereumAccount()]
    let transaction = new Transaction({ i: 1, from, to, amount: 1000 })
    let transaction2 = new Transaction(JSON.parse(JSON.stringify(transaction)))
    transaction.should.eqls(transaction2)
  })

  it('createFakeTx ser/deser', () => {
    let transaction = W3Swarm.prototype.createFakeTx(1)
    let transaction2 = new Transaction(JSON.parse(JSON.stringify(transaction)))
    transaction.should.eqls(transaction2)
  })

  it('new BlockProposal ser/deser', () => {
    let [from, to] = [util.getEthereumAccount(), util.getEthereumAccount()]
    let transaction = new Transaction({ i: 1, from, to, amount: 1000 })
    let bp = new BlockProposal({ i: 1, height: 0, tailHash: 'xxx', txs: [transaction], collector: {publicKeyString: 'xxxx'} })
    let bp2 = new BlockProposal(JSON.parse(JSON.stringify(bp)))
    bp.should.eqls(bp2)
  })

  it('new Block ser/deser', () => {
    let [from, to] = [util.getEthereumAccount(), util.getEthereumAccount()]
    let transaction = new Transaction({ i: 1, from, to, amount: 1000 })
    let bp = new BlockProposal({ i: 1, height: 0, tailHash: 'xxx', txs: [transaction], collector: {publicKeyString: 'xxxx'} })
    let block = new Block({ i: 1, preHash: 'xxx', bp})
    let block2 = new Block(JSON.parse(JSON.stringify(block)))
    delete block.i
    delete block2.i // i is not serialized
    block.should.eqls(block2)
    block2.bp.should.be.instanceOf(BlockProposal)
    block2.txs[0].should.be.instanceOf(Transaction)
    block2.txs[0].from.should.be.instanceOf(Account)
  })

})


