<template lang="pug">
ALayout
  ALayoutHeader.layout-header
    .layout-header--left
      .logo(@click="goHome")
        img(:src="Logo")
      AMenu(
        mode="horizontal"
        v-model:selectedKeys="selectedRoute"
        @click="linkToRoute"
      )
        AMenuItem(key="benchmark") Benchmark
        AMenuItem(key="simulation") Simulation
        AMenuItem(key="security") Security
        AMenuItem(key="libp2p") Libp2p
    .layout-header--right
      .eth-global-logo(@click="goToEthProject")
        img(:src="EthGlobalLogo")
      .github-logo(@click="goToGithubCodeRepo")
        img(:src="GithubLogo")

  ALayoutContent
    slot
</template>

<script>
import { ref, defineComponent, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Logo from '@/assets/logo.png'
import EthGlobalLogo from '@/assets/ethglobal.png'
import GithubLogo from '@/assets/github.png'

export default defineComponent({
  name: 'Nav',
  setup: () => {
    const route = useRoute()
    const router = useRouter()

    const selectedRoute = ref([String(route.name)])

    watch(
      () => route.name,
      () => {
        if (route.name) {
          selectedRoute.value = [String(route.name)]
        }
      }
    )

    const linkToRoute = ({ key }) => {
      if (key !== String(route.name)) router.push({ name: key })
    }

    const goHome = () => {
      // router.push({ name: 'Benchmark' })
    }

    const goToEthProject = () => {
      window.open('https://ethglobal.com/showcase/w3-poc-nbhee')
    }

    const goToGithubCodeRepo = () => {
      window.open('https://github.com/weihaopeng/W3-POC')
    }

    return {
      route,
      selectedRoute,
      Logo,
      EthGlobalLogo,
      GithubLogo,
      goHome,
      linkToRoute,
      goToEthProject,
      goToGithubCodeRepo
    }
  }
})
</script>

<style lang="sass" scoped>
.ant-layout
  height: 100%
  background: #3d3f50

  .layout-header
    display: flex
    align-items: center
    justify-content: space-between
    line-height: unset
    height: 90px
    background: #ffffff
    box-shadow: 0px 1px 8px 0px rgba(0,0,0,0.15)
    padding: 0 27px 0 0

    &--left, &--right
      display: flex
      align-items: center
      height: 100%

    .logo
      display: inline-block
      font-size: 30px
      margin-right: 282px
      user-select: none
      height: 100%
      img
        max-height: 100%

    .eth-global-logo, .github-logo
      cursor: pointer
      user-select: none
      height: 40px
      margin-left: 18px
      img
        max-height: 100%

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
  