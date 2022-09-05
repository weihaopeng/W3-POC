import { FSM } from '../../../lib/fsm/index.js'

import Debug from 'debug'

const debug = Debug('w3:peer:fsm')

/**
 * @see design/w3-node-activies-and-messages.png
 */
const fsm = {
  init: 'pending',
  transitions: [
    { name: 'start', from: 'pending', to: 'connected' },
    { name: 'disconnect', from: ['connected', 'ready'], to: 'disconnected' },
    { name: 'connect', from: 'disconnected', to: 'connected' },
    { name: 'withLatencyThreshold', from: 'connected', to: 'ready' },
    { name: 'overLatencyThreshold', from: 'ready', to: 'connected' },
    { name: 'goto', from: '*', to: function (s) {
        debug('--- goto: %s, this: %o', s, this)
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
