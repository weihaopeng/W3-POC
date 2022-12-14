<template lang="pug">
.map-cvs-wrapper
  .map-cvs(ref="networkContainerRef")
</template>

<script>
import { defineComponent, onMounted, ref, watch } from 'vue'
import * as echarts from 'echarts'
import 'echarts-gl'
import axios from 'axios'
import controller from "@/pages/network/composition/controller.js";

export default defineComponent({
  name: 'WorldNetwork',
  props: {
    config: Object
  },
  setup: (props) => {
    const networkContainerRef = ref(null)

    async function registerMap() {
      const {data: worldGeoJson} = await Promise.race([
        new Promise(resolve => axios.get('https://ghproxy.com/https://raw.githubusercontent.com/apache/echarts/29a4fe91f7cf59ea347e066bb241346f0b1bde75/test/data/map/json/world.json').then(resolve).catch(/*do nothing*/)),
        new Promise(resolve => axios.get('https://raw.githubusercontent.com/apache/echarts/29a4fe91f7cf59ea347e066bb241346f0b1bde75/test/data/map/json/world.json').then(resolve).catch(/*do nothing*/))
      ])
      echarts.registerMap('worldCustom', worldGeoJson)
      return true
    }

    async function showNetwork() {
      const networkChart = echarts.init(networkContainerRef.value)
      networkChart.setOption({
        geo3D: {
          map: 'worldCustom',
          shading: 'color',
          silent: true,
          realisticMaterial: {
            roughness: 0.8,
            metalness: 0,
          },
          postEffect: {
            enable: false,
          },
          groundPlane: {
            show: false,
          },
          light: {
            main: {
              intensity: 1,
              alpha: 30,
            },
            ambient: {
              intensity: 0,
            },
          },
          viewControl: {
            distance: 70,
            alpha: 89,
            panMouseButton: 'left',
            rotateMouseButton: 'right',
            zoomSensitivity: 0,
            panSensitivity: 0,
          },
          itemStyle: {
            color: 'rgb(38, 40, 54)',
            borderWidth: 0
          },
          regionHeight: 0.5,
        },
        series: [
          {
            id: 'tx',
            type: 'lines3D',
            coordinateSystem: 'geo3D',
            effect: {
              show: true,
              trailWidth: 2,
              trailOpacity: 1,
              trailLength: 0.2,
              constantSpeed: 5,
              // period: 1
            },
            blendMode: 'lighter',
            lineStyle: {
              // width: 0.2,
              opacity: 0,
            },
            silent: true,
            data: [],
          },
        ],
      })

      watch(() => props.config.tps, () => {
        let tps = Number.parseInt(props.config.tps)
        // console.log(Math.log2(tps))
        networkChart.setOption({
          series: [
            {
              effect: {
                show: true,
                trailWidth: 2,
                trailOpacity: 1,
                trailLength: 0.2,
                constantSpeed: Math.max(1, Math.ceil(Math.log10(tps) * 10))
              },
            }
          ]
        })
      })

      return networkChart
    }

    onMounted(async () => {
      await registerMap()
      const networkChart = await showNetwork()
      controller.initChart({ networkChart })
    })

    return {
      networkContainerRef,
      registerMap,
      showNetwork,
    }
  }
})
</script>

<style lang="scss" scoped>
  .map-cvs-wrapper {
    width: 100%;
    display: flex;
    align-items: center;
    .map-cvs {
      width: 100%;
      aspect-ratio: 1.6;
    }
  }
</style>
