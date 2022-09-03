import  chai  from 'chai'
chai.should()
import { Node } from '../../src/w3/basic/node.js'

import Debug from 'debug'
const debug = Debug('w3:test')

describe('Architecture W3 POC  @issue#1', () => {
  // let node = new Node({})
  before(async function (){
    this.timeout(0)
  })

  it('testing OK', async () => {
    debug('--- testing Ok')
  }).timeout(0)

})
