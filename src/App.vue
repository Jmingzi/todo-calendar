<template>
  <div id="app">
    <router-view v-if="!isMobile" />
    <p v-else class="not-support">暂不支持手机版，即将跳转至博客<br>
      <a href="https://iming.work">https://iming.work</a>
    </p>
  </div>
</template>

<script>
export default {
  name: 'app',
  data() {
    return {
      isMobile: /iphone|android/i.test(navigator.appVersion)
    }
  },
  created() {
    if (this.isMobile) {
      setTimeout(() => {
        location.href = 'https://iming.work'
      }, 3000)
    }
  }
}
</script>

<style lang="stylus">
body
  margin 0
  padding 0
#app
  font-family: "Helvetica Neue",Helvetica,"PingFang SC","Hiragino Sans GB","Microsoft YaHei","微软雅黑",Arial,sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  font-size 14px
.not-support
  text-align center
  color #999
  padding-top 100px
</style>
