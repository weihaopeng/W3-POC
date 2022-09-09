<template lang="pug">
Nav
  router-view(:key="$route.fullPath")
</template>
  
<script>
import { defineComponent } from 'vue'
import Nav from '@/components/common/Nav.vue'

export default defineComponent({
  name: 'App',
  components: { Nav }
})
</script>

<style>
html,
body {
  overflow-y: hidden;
}

#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  height: 100%;
}
</style>
