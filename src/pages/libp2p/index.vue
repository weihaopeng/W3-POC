<template lang="pug">
div.libp2p
  header
    h1 {{ status }}
  table#output
    thead
      tr
        th Found Peers
        th Connected Peers
        th Connected Swarms
    tbody
      tr
        td.found-peers {{ foundPeers }}
        td.connected-peers {{ connectedPeers }}
        td.connected-peers {{ remoteSwarms.length }}

  //button(type="button" @click="startListenPubsub") Start Listen
  button(type="button" @click="sendMsg" :class="{ connected }") Send Msg
  button(type="button" @click="toggleTwoStagesMint" :class="{ mint, connected }") {{ mint ? 'Stop' : 'Start'}} two stage mint
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
        if (this.connected) {
          const data = { origin:  network.libp2p.peerId.toString(), event: 'libp2p:online'}
          network.broadcast('libp2p:online', data)
        }
      },

      toggleTwoStagesMint() {
        if (this.connected) {
          this.mint ? stopTwoStagesMint(): startTwoStagesMint()
        }
      },
    }
  },

  computed: {
    connected () {
      return this.remoteSwarms.length > 0
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
  background-color: #8c8c8c; /* Gray */
}

.libp2p button.connected {
  background-color: #4CAF50; /* Green */
}

.libp2p button.mint {
  background-color: #f44336; /* Red */
}

</style>
