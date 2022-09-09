import chai from 'chai'
chai.should()
import { FSM } from '../../lib/fsm/index.js'
const { checkStateRoute } = FSM
import Debug from 'debug'
const debug = Debug('w3:test:peer.fsm')

import { createFsm } from '../../src/w3/core/node/node-fsm.js'

describe('Peer Status test', () => {
  class Peer  {
    constructor (i) {
      this.i =i
      createFsm(this)
    }
  }
  const peer = new Peer(1)

  before(async () => {})

  afterEach(() => peer.goto('none'))

  describe('check valid routes', () => {
    it('normal initial & serve', async () => {
      await checkStateRoute(peer, `pending -> connected -> ready -> disconnected -> connected `)
      await checkStateRoute(peer, `pending -> connected -> disconnected -> connected -> ready  `)
    })


  })

  describe('check invalid routes ', () => {
    it('wrong routes', async () => {
      await checkStateRoute(peer, `pending -> disconnected `, true)
    })

  })
})
