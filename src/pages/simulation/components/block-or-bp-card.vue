<template lang="pug">
.data-card(:class="dataCardClass")
  ASpace.data-info.data-info__round-count(v-if="type === 'bp'")
    span Witness Round
    span {{ witnessRound }}
  ASpace
    .data-info.data-info__i
      span i
      span {{ data.data.i }}
    .data-info.data-info__height
      span height
      span {{ data.data.height }}
  .data-info.data-info__hash {{ data.data.hash || data.data.tailHash }}
  ASpace.data-info.data-info__departure-time
    span Departure at: 
    span {{ getDepartureTime(data) }}
  ASpace.data-info.data-info__arrive-time
    span Departure at: 
    span {{ getArrivalTime(data) }}

  .data-info.data-info__tx-links
    span Txs({{ txs.length }}): 
    APopover(v-for="tx in txs" :title="`tx_${tx.i}`" trigger="click")
      template(#content)
        .tx-info__hash {{ tx.hash }}
        ASpace.tx-info__from
          span from:
          .node-link {{ tx.from.account.addressString }}
        ASpace.tx-info__to
          span to:
          .node-link {{ tx.to.account.addressString }}
      .tx-link tx_{{ tx.i }}

  ASpace.bp-info.nodes(v-if="type === 'bp'" v-for="(node, index) in nodes")
    span(v-if="index === 0") Collector: 
    span(v-else) Witness{{ index + 1 }}: 
    .node-link {{ getNodeLabel(node) }}
  ASpace.block-info.node-links(v-else)
    span Nodes({{nodes.length}}): 
    .node-link(v-for="node in nodes") {{ node.account.addressString }}

  ASpace.block-info.mint-node(v-if="type === 'block'")
    span Mint Node: 
    .node-link {{ mintNodeAddr }}

</template>

<script>
import { computed, defineComponent, onBeforeMount, onMounted, ref } from 'vue'
export default defineComponent({
  name: 'BlockOrBpCard',
  props: {
    data: {
      type: Object,
      required: true
    },
    selectedHash: {
      type: String,
      default: ''
    }
  },
  setup: (props, { emit }) => {
    const highlight = computed(() => {
      return props.data.highlight
    })
    const selected = computed(() => {
      return props.data.data.hash === props.selectedHash || props.data.data.tailHash === props.selectedHash
    })
    const type = computed(() => {
      return props.data.type
    })
    const txs = computed(() => {
      return []
    })
    const getNodeLabel = (node) => {
      return `No.${1} ${node.publicKeyString}`
    }

    const dataCardClass = computed(() => {
      const list = []
      if (highlight.value) list.push('highlight')
      if (selected.value) list.push('selected')
      list.push(`${type.value}-card`)
      return []
    })
    return {
      dataCardClass,
      type,
      txs
    }
  }
})
</script>

<style lang="scss" scoped>
@use 'sass:map';
// @use 'sass:meta';
$block-selected-bg-color-map: (
  'chain': #a9eabf,
  'block': #d9a9ea,
  'bp': #ead9a9
);
$block-selected-border-color-map: (
  'chain': #1acd57,
  'block': #c229cf,
  'bp': #dfa517
);
$block-selected-shadow-color-map: (
  'chain': rgba(18,136,58,0.60),
  'block': rgba(114, 18, 136,0.60),
  'bp': rgba(136,102,18,0.60)
);
$block-hover-bg-color-map: (
  'chain': #e3f4e8,
  'block': #f3e6f8,
  'bp': #f7efd6
);

@mixin card($types...) {
  @for $i from 0 to length($types) {
    $type: nth($types, $i + 1);

    .#{$type}-card {
      border: solid 1px #dcdcdc;
      border-radius: 4px;
      margin: 6px 10px 12px;
      padding: 15px 18px;
      position: relative;
      cursor: pointer;
      font-size: 12px;
      background: #eff0f9;
      box-sizing: border-box;
      box-shadow: 0px 2px 6px 0px rgba(0,0,0,0.20);
      border: solid 2px #eff0f9;
      &:hover {
        background-color: map.get($block-hover-bg-color-map, #{$type});
        border-color: map.get($block-hover-bg-color-map, #{$type});
      }
      &.highlight, &.selected {
        background-color: map.get($block-selected-bg-color-map, #{$type});
        border-color: map.get($block-selected-border-color-map, #{$type});
        box-shadow: 0 2px 8px 0 map.get($block-selected-shadow-color-map, #{$type});
      }
    }
    .#{$type}-type {
      margin-right: 8px;
      color: #666;
      width: 4em;
      display: inline-block;
    }
  }
}

@include card('chain', 'block', 'bp');
</style>