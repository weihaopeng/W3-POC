import { FSM } from '@mq/fsm'

import Debug from 'debug'

const debug = Debug('w3:peer:fsm')

/**
 * @see design/w3-node-activities-and-messages.png
 */
const fsm = {
  init: 'pending',
  transitions: [
    { name: 'connect', from: ['pending', 'disconnected'], to: 'connected' }, // libp2p.connect & periodicEmitBlockMessage
    { name: 'disconnect', from: ['connected', 'ready'], to: 'disconnected' }, //
    { name: 'start', from: 'connected', to: 'ready' }, // latency <= threshold && chain.height + 1 >= block.height
    { name: 'stop', from: 'ready', to: 'connected' },  // latency >  threshold || chain.height + 1 <  block.height

    { name: 'goto', from: '*', to: function (s) {
        // debug('--- goto: %s, this: %o', s, this)
        return s
      }
    }
  ]
}

const createFsm = FSM.createFactory(fsm )

export { createFsm, fsm }
