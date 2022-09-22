<template lang="pug">
.swarm-node(:style="{ top: `${node.y}px`, left: `${node.x}px` }")
  .swarm-node-content
    .swarm-node-content__name
      span.number No.{{ node.number }} 
      span.addr {{ node.name }}
    .swarm-node-content__role(v-if="haveRole") {{ node.rolePrefix ? node.rolePrefix + ' ' : '' }}{{ node.role }}
  .swarm-node-symbol
    img(:src="symbolImg")
  .swarm-node-tooltip-wrapper(:style="tooltipWrapperStyle")
    .swarm-node-tooltip(v-for="tooltip in node.tooltips" :key="tooltip.id" :class="getTooltipClass(tooltip)")
      .swarm-node-tooltip__title {{ tooltip.data.title }}
      .swarm-node-tooltip__content
        div(v-if="tooltip.data.from")
          span From: 
          span {{ tooltip.data.from }}
        div(v-if="tooltip.data.to")
          span To: 
          span {{ tooltip.data.to }}
</template>

<script>
import { computed, defineComponent, onBeforeMount, onMounted, ref } from 'vue'
import defaultNodeImg from '@/assets/default-node.png'
import highlightNodeImg from '@/assets/highlight-node.png'
import collectorImg from '@/assets/collector.png'
import witnessImg from '@/assets/witness.png'

export default defineComponent({
  name: 'SwarmNode',
  props: {
    node: {
      type: Object,
      required: true
    }
  },
  setup: (props) => {
    const symbolImg = computed(() => {
      if (props.node.role === 'default') return defaultNodeImg
      if (props.node.role === 'sender') return highlightNodeImg
      if (props.node.role === 'Collector') return collectorImg
      if (props.node.role === 'Witness') return witnessImg
    })

    const getTooltipClass = (tooltip) => {
      const classList = []
      classList.push(tooltip.type)
      if (tooltip.valid) classList.push('valid')
      if (tooltip.toRemove) classList.push('to-remove')
      if (tooltip.valid === false) classList.push('invalid')
      return classList
    }

    const tooltipWrapperStyle = computed(() => {
      const obj = {}
      if (props.node.tooltipPos === 'left') {
        obj.right = 'calc(100% + 14px)'
        // obj.alignItems = 'flex-end'
      } else {
        obj.left = 'calc(100% + 14px)'
        obj.flexDirection = 'row-reverse'
      }
      return obj
    })

    const haveRole = computed(() => {
      return props.node.role === 'Collector' || props.node.role === 'Witness'
    })

    return {
      symbolImg,
      tooltipWrapperStyle,
      haveRole,
      getTooltipClass
    }
  }
})
</script>
  
<style lang="scss" scoped>
@use 'sass:map';
$tooltip-bg-map: (
  'tx': #436fcb,
  'bp': #af8e2e,
  'block': #902399,
  'fork': #f759ab,
  'invalid': #8c8c8c
);

$tooltip-valid-bg-map: (
  'tx': #5b8ff9,
  'bp': #dfa517,
  'block': #ba5cc2,
  'fork': #f759ab,
  'invalid': #8c8c8c
);

@mixin tooltip-bg($selectors...) {
  @for $i from 0 to length($selectors) {
    $type: nth($selectors, $i + 1);
    &.#{$type} {
      background-color: rgba(map.get($tooltip-bg-map, #{$type}), 0.6);
      &.valid {
        background-color: map.get($tooltip-valid-bg-map, #{$type});
      }
    }
  }
}
.swarm-node {
  position: absolute;
  &-content {
    position: absolute;
    bottom: calc(100% + 8px);
    display: flex;
    flex-direction: column;
    color: #fff;
    font-size: 20px;
    font-weight: 900;
    white-space: nowrap;
    line-height: 23px;
    &__name .addr {
      margin-left: 4px;
      font-size: 16px;
    }
  }
  &-symbol {
    width: 44px;
    height: 44px;
    img {
      width: 100%;
    }
  }
  &-tooltip-wrapper {
    position: absolute;
    top: 0;
    display: flex;
    .swarm-node-tooltip {
      height: fit-content;
      margin: 0 4px;
      padding: 10px 12px;
      font-size: 12px;
      color: #fff;
      border-radius: 4px;
      position: relative;
      @include tooltip-bg('tx', 'bp', 'block', 'fork', 'invalid');
      &.valid::before {
        content: '';
        position: absolute;
        right: -10px;
        top: -10px;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: #1acd57;
      }
      &.valid::after {
        content: '';
        position: absolute;
        right: -5px;
        top: -5px;
        width: 10px;
        height: 7px;
        border-bottom: solid 2px #fff;
        border-left: solid 2px #fff;
        transform: rotate(-45deg);
      }
      &.to-remove {
        opacity: 0;
        transition: opacity 0.3s ease-in-out;
      }
      &__title {
        font-weight: 900;
      }
      &__content div {
        max-width: 100px;
        text-overflow: ellipsis;
        overflow: hidden;
        white-space: pre;
      }
    }
  }
}
</style>
