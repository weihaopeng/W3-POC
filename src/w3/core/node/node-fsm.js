import { FSM } from '../../../../lib/fsm/index.js'

import Debug from 'debug'

const debug = Debug('w3:peer:fsm')

/**
 * @see design/w3-node-activies-and-messages.png
 */
const fsm = {
  init: 'pending',
  transitions: [
    { name: 'connect', from: ['pending', 'disconnected'], to: 'connected' }, // libp2p.connect & start
    { name: 'disconnect', from: ['connected', 'ready'], to: 'disconnected' }, //
    { name: 'start', from: 'connected', to: 'ready' }, // latency <= threshold && chain.height + 1 >= block.height
    { name: 'stop', from: 'ready', to: 'connected' },  // latency >  threshold || chain.height + 1 <  block.height

    { name: 'goto', from: '*', to: function (s) {
        // debug('--- goto: %s, this: %o', s, this)
        return s
      }
    }
  ],

  methods: {
    onEnterReady () {
      debug('--- Peer %s is ready', this.i)
    },

    onLeaveReady () {
      debug('--- Peer %s is not ready', this.i)
    }
  }
}

const createFsm = FSM.createFactory(fsm )

export { createFsm, fsm }
