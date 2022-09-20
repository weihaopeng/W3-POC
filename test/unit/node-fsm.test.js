import chai from 'chai'

chai.should()
import { FSM } from '@mq/fsm'

const { checkStateRoute } = FSM

import Debug from 'debug'

Debug.enable('w3*,fsm*')
const debug = Debug('w3:test:peer.fsm')

import { createFsm } from '../../src/w3/core/node/node-fsm.js'

describe('Node FSM test', () => {
  class Node {
    constructor (i) {
      this.i = i
      createFsm(this)
    }
  }

  const node = new Node(1)

  before(async () => {})

  afterEach(() => node.goto('none'))

  describe('check valid routes', () => {
    it('normal initial & serve', async () => {
      await checkStateRoute(node, `pending -> connected -> ready -> disconnected -> connected `)
      await checkStateRoute(node, `pending -> connected -> disconnected -> connected -> ready  `)
    })

  })

  describe('check invalid routes ', () => {
    it('wrong routes', async () => {
      await checkStateRoute(node, `pending -> disconnected `, true)
    })

  })
})
