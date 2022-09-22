<template lang="pug">
div.libp2p
  header
    h1 {{ status }}
  table#output
    thead
      tr
        th Found Peers
        th Connected Peers
    tbody
      tr
        td.found-peers {{ foundPeers }}
        td.connected-peers {{ connectedPeers }}

  button(type="button" @click="startListenPubsub") Start Listen
  button(type="button" @click="sendMsg") Send Msg
  button(type="button" @click="startTwoStagesMint") Start two stage mint
  button(type="button" @click="stopTwoStagesMint") Stop two stage mint
</template>

<script>
import { defineComponent, inject, toRefs } from 'vue'

export default defineComponent({
  name: 'Libp2pExample',
  setup: () => {
    const { state, network, startTwoStagesMint, stopTwoStagesMint } = inject('w3.store')
    return {
      ...toRefs(state),
      startListen() {
        network.startListen()
      },

      sendMsg () {
        const data = { origin:  network.libp2p.peerId.toString(), event: 'node:online'}
        network.broadcast('node:online', data)
      },

      startTwoStagesMint() {
        startTwoStagesMint()
      },

      stopTwoStagesMint() {
        stopTwoStagesMint()
      }
    }
  }
})
</script>

<style>
.libp2p {
  color: white;
}
.libp2p h1 {
  color: white;
}

.libp2p button {
  background-color: #4CAF50; /* Green */
}

</style>
