<template lang="pug">
.chain-info
  .info-label W3 chain height
  .info-value {{ Math.round(chainHeight).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') }}
  ADivider.info-divider(type="vertical")
  .info-label Total transactions
  .info-value {{ Math.round(totalTransactions).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') }}
</template>

<script>
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'ChainInfo',
  props: {
    chainHeight: Number,
    totalTransactions: Number
  }
})
</script>

<style scoped lang="scss">
.chain-info {
  position: relative;
  width: 100%;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  & > * {
    margin: 0 1vw;
  }
  .info-label {
    font-size: 1vw;
  }
  .info-value {
    font-size: 1.77vw;
    color: #3c7bfd;
  }
  .info-divider {
    height: 80%;
    border-width: 2px;
    border-color: #d0d0d0;
    margin: 0 1.3vw;
  }
}
</style>
