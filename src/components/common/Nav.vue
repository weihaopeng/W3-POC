<template lang="pug">
ALayout
  ALayoutHeader.layout-header
    .logo(@click="goHome")
      span W
      span 3
      span POC Testnet
    AMenu(
      mode="horizontal"
      v-model:selectedKeys="selectedRoute"
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
      // router.push({ name: 'Benchmark' })
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
  background: #3d3f50

  &-header
    display: flex
    align-items: center
    line-height: unset
    height: 90px
    background: #ffffff
    box-shadow: 0px 1px 8px 0px rgba(0,0,0,0.15)
    padding: 0 30px

    .logo
      display: inline-block
      font-size: 30px
      margin-right: 312px
      user-select: none
      // cursor: pointer
      font-weight: bolder
      span:first-child
        background: linear-gradient(180deg,#1acd57 7%, #0093c2 83%)
        background-clip: text
        -webkit-background-clip: text
        color: transparent
      span:last-child
        font-weight: normal
        margin-left: 12px

    .ant-menu
      flex-grow: 1
      line-height: 90px
      color: rgba(0, 0, 0, 0.5)
      font-size: 20px
      :deep .ant-menu-item
        padding: 0
        font-weight: 400
        transition: all 0.3s
        .ant-menu-title-content
          padding: 0 60px
        &:after
          border-bottom-width: 8px
          border-color: transparent
          left: 0
          right: 0
        &-selected
          color: #000
          font-weight: normal
          &::after
            border-image: linear-gradient(90deg,#1acd57 3%, #0093c2 96%) 1
        &:hover
          color: #000
          &:after
            border-color: transparent

  &-content
    flex-grow: 1

</style>
  