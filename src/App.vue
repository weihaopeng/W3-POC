<template lang="pug">
Nav
  router-view(:key="getRoute($route)")
</template>

<script>
import { defineComponent, provide } from 'vue'
import Nav from '@/components/common/Nav.vue'
import store from './store/w3.network.store.js'

export default defineComponent({
  name: 'App',
  components: { Nav },
  setup: () => {
    const getRoute = (route) => {
      if (route.name === 'benchmark') return 'network'
      if (route.name === 'security') return 'network'
      return route.fullPath
    }

    provide("w3.store", store)

    return {
      getRoute
    }
  }
})
</script>

<style>
html,
body {
  overflow-y: hidden;
  font-family: ArialMT, Arial, Helvetica, sans-serif;
}

#app {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  height: 100%;
}
</style>
