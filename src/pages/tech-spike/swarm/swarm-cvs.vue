<template lang="pug">
.swarm-cvs-container
  #swarm-node-cvs(ref="cvs")
  #swarm-tooltip-container
    .swarm-tooltip-legend
      div Legend
      div TX → Transaction
      div BP → Block Proposal
      div Bk → Block
      div Fk → Chain forked
</template>

<script>
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'SwarmCvs',
  
  setup: () => {

  }
})

</script>

<style lang="scss">

</style>