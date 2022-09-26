<template lang="pug">
.data-card(ref="card" :class="dataCardClass" @click="handleClick")
  div(style="display: flex;" :style="{ 'flex-direction': type === 'bp' ? 'column' : 'column-reverse'}")
    ASpace(:size="8")
      .data-info.data-info__round-count(v-if="type === 'bp'")
        span.wide-label Witness Round
        span.thin-label W
        span {{ witnessRound }}
      ASpace
        ASpace.data-info.data-info__i
          span i: 
          span {{ data.data.i }}
        ASpace.data-info.data-info__height
          span height: 
          span {{ data.data.height }}
    ASpace.data-info.data-info__hash(style="display: flex;")
      span Hash: 
      span {{ data.data.hash || data.data.tailHash }}
  //- ASpace.data-info.data-info__departure-time(v-if="type === 'bp'")
  //-   span Departure at: 
  //-   span {{ getDepartureTime(data) }}
  //- ASpace.data-info.data-info__arrive-time(v-if="type === 'bp'")
  //-   span Arrival at: 
  //-   span {{ getArrivalTime(data) }}

  .data-info.data-info__tx-links
    span Txs({{ txs.length }}): 
    APopover(v-for="tx in txs" trigger="hover" color="#fff7e6" arrowPointAtCenter)
      template(#content)
        .tx-info__hash {{ tx.hash }}
        ASpace.tx-info__from
          span from:
          .node-info {{ tx.from.addressString }}
        ASpace.tx-info__to
          span to:
          .node-info {{ tx.to.addressString }}
      .tx-link tx{{ tx.i }}

  .bp-info.nodes(v-if="type === 'bp'")
    ASpace(v-for="(node, index) in participants")
      span(v-if="index === 0") Collector: 
      span(v-else) Witness{{ index }}: 
      .node-info {{ getNodeAddr(node) }}
  .block-info.nodes(v-else)
    span Nodes({{participants.length}}): 
    ATooltip(v-for="(node, index) in participants" placement="bottomLeft" :overlayStyle="{ 'white-space': 'nowrap', 'max-width': 'unset' }" arrowPointAtCenter)
      template(#title)
        span {{ getNodeAddr(node, false) }}
      span.node-link(v-if="index === 0" style="white-space: nowrap;") C
      span.node-link(v-else) W{{ index }}

</template>

<script>
import { computed, defineComponent, onBeforeMount, onMounted, ref, watch } from 'vue'
export default defineComponent({
  name: 'BlockOrBpCard',
  props: {
    data: {
      type: Object,
      required: true
    },
    selectedBpI: {
      type: Number,
      default: -1
    },
    nodes: {
      type: Array,
      required: true
    }
  },
  setup: (props, { emit }) => {
    const card = ref(null)
    const highlight = computed(() => {
      return !!props.data.highlight
    })
    const selected = computed(() => {
      if (type.value === 'bp') return props.data.data.i === props.selectedBpI
      return props.data.data.bp.i === props.selectedBpI
      // return props.data.data.hash === props.selectedHash || props.data.data.tailHash === props.selectedHash
    })
    const type = computed(() => {
      return props.data.type
    })
    const txs = computed(() => {
      return props.data.data.txs || props.data.data.bp?.txs || []
    })
    const getNodeAddr = (node, brief = true) => {
      const index = props.nodes.findIndex((nodeItem) => nodeItem.publicKey === node.publicKeyString)
      let address = props.nodes[index].address
      address = brief ? address.substring(0, 6) + '...' : address
      return `No.${index + 1}: ${address}`
    }

    const participants = computed(() => {
      let records
      if (type.value === 'bp') records = props.data.data.witnessRecords
      else records = props.data.data.bp.witnessRecords
      const list = []
      list.push(records[0].asker)
      for (const record of records) {
        if (record.witness) list.push(record.witness)
        else list.push(props.data.to)
      }
      return list
    })

    const witnessRound = computed(() => {
      return props.data.data.witnessRecords.length
    })

    const dataCardClass = computed(() => {
      const list = []
      if (highlight.value) list.push('highlight')
      if (selected.value) list.push('selected')
      list.push(`${type.value}-card`)
      return list
    })

    const getDepartureTime = () => {
      return '2022-09-22'
    }

    const getArrivalTime = () => {
      return '2022-09-22'
    }

    const handleClick = () => {
      if (selected.value) emit('unselect')
      else emit('select', props.data)
    }

    watch(() => selected.value, (val) => {
      if (val) card.value.scrollIntoViewIfNeeded()
    })

    return {
      dataCardClass,
      type,
      txs,
      participants,
      witnessRound,
      card,
      getDepartureTime,
      getArrivalTime,
      getNodeAddr,
      handleClick
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
.data-card > * {
  margin-bottom: 2px;
}
.data-info__round-count {
  .thin-label {
    display: none;
  }
  display: inline-flex;
}
.tx-info__from, .tx-info__to {
  display: flex;
}
.node-info {
  max-width: 150px;
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
}
.tx-link, .node-link {
  display: inline-block;
  color: #1890ff;
  border-bottom: solid 1px #1890ff;
  margin: 0 4px;
  padding: 0 2px;
  line-height: 1em;
  &:hover {
    color: #40a9ff;
    border-bottom-color: #40a9ff;
  }
}
</style>

<style lang="scss" scoped>

@media only screen and (min-width: 1100px) and (max-width: 1400px) {
  .data-card {
    overflow: hidden;
    padding: 8px;
    .data-info {
      overflow: hidden;
      text-overflow: ellipsis;
      &__hash span {
        white-space: nowrap;
      }
      .thin-label {
        display: block;
      }
      .wide-label {
        display: none;
      }
    }
  }
}
</style>