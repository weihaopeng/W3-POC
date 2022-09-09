<template lang="pug">
ALayout
  ALayoutHeader
    .logo(@click="goHome") W3 POC Testnet
    AMenu(
      theme="dark"
      mode="horizontal"
      v-model:selectedKeys="selectedRoute"
      :style="{ lineHeight: '64px', marginLeft: '16px' }"
      @click="linkToRoute"
    )
      AMenuItem(key="benchmark") Benchmark
      AMenuItem(key="swarm") Swarm
      AMenuItem(key="security") Security
      AMenuItem(key="libp2p") Libp2p

  ALayoutContent
    slot
</template>

<script lang="ts">
import { ref, defineComponent, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

export default defineComponent({
  name: 'Nav',
  setup: () => {
    const route = useRoute()
    const router = useRouter()

    const selectedRoute = ref<string[]>([String(route.name)])

    watch(
      () => route.name,
      () => {
        if (route.name) {
          selectedRoute.value = [String(route.name)]
        }
      }
    )

    const linkToRoute = ({ key }: { key: string }) => {
      if (key !== String(route.name)) router.push({ name: key })
    }

    const goHome = () => {
      router.push({ name: 'Benchmark' })
    }

    return {
      route,
      selectedRoute,
      goHome,
      linkToRoute
    }
  }
})
</script>

<style lang="sass" scoped>
.ant-layout
  height: 100%

  &-header
    display: flex
    align-items: center
    line-height: unset

    .logo
      display: inline-block
      color: #fff
      font-size: 32px
      margin-right: 48px
      user-select: none
      cursor: pointer

    .ant-menu
      flex-grow: 1

  &-content
    height: calc(100% - 80px - 64px)
    margin: 16px 50px
    background-color: #fff
    position: relative

</style>
  