<template lang="pug">
div.libp2p
  header
    h1#status Starting libp2p...
  table#output
    thead
      tr
        th Found Peers
        th Connected Peers
    tbody
      tr
        td.found-peers {{ foundPeers }}
        td.connected-peers {{ connectedPeers }}

  button(type="button" @click="sendMsg") Send Msg
</template>

<script>
import { defineComponent, inject, toRefs } from 'vue'

export default defineComponent({
  name: 'Libp2pExample',
  setup: () => {
    const { state } = inject('w3.store')
    return {
      ...toRefs(state),
      sendMsg () {
        this.network.broadcast('w3:node:online', this.network.libp2p.peerId.toString())
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

</style>
