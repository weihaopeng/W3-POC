<template lang="pug">
Nav
  router-view(:key="getRoute($route)")
</template>

<script>
import { defineComponent } from 'vue'
import Nav from '@/components/common/Nav.vue'
const routeMap = {
  benchmark: 'network',

}

export default defineComponent({
  name: 'App',
  components: { Nav },
  setup: () => {
    const getRoute = (route) => {
      if (route.name === 'benchmark') return 'network'
      if (route.name === 'security') return 'network'
      return route.fullPath
    }
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
