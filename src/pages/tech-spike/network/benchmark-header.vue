<template lang="pug">
.title-container
  .title-sub1 W3 chain height
  .title-sub2 {{ Math.round(chainHeight).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') }}
  ADivider.title-divider(type="vertical")
  .title-sub3 Total transactions
  .title-sub4 {{ Math.round(totalTransactions).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') }}
</template>

<script>
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'BenchmarkHeader',
  props: {
    chainHeight: Number,
    totalTransactions: Number
  }
})
</script>

<style scoped lang="scss">
.title-container {
  position: relative;
  width: 100%;
  border-radius: 4px;
  .title-sub1, .title-sub3 {
    font-size: 1vw;
  }
  .title-sub2, .title-sub4 {
    font-size: 1.7vw;
  }
  .title-sub1 {
    position: relative;
    left: 4%;
    width: 22%;
    margin: auto 0;
  }
  .title-sub2 {
    position: relative;
    left: 3%;
    width: 14%;
    margin: auto 0;
    color: #3c7bfd;
  }
  .title-sub3 {
    position: relative;
    left: 10%;
    width: 22%;
    margin: auto 0;
  }
  .title-sub4 {
    position: relative;
    left: 10%;
    width: 22%;
    margin: auto 0;
    color: #3c7bfd;
  }
  .title-divider {
    position: relative;
    left: 4%;
    z-index: 1;
    height: 80%;
    top: 10%
  }
}
</style>
