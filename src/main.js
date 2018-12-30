import Vue from 'vue';
import App from './App.vue';
import router from './router';
import store from './store';
import './plugins/element.js'

import { MessageBox, Message, Loading } from 'element-ui'

Vue.config.productionTip = false;
Vue.prototype.$confirm = MessageBox.confirm
Vue.prototype.$message = Message
Vue.prototype.$loading = {
  ins: null,
  open() {
    this.ins = Loading.service({
      background: 'rgba(0, 0, 0, 0.5)',
      text: '加载中'
    })
  },
  close() {
    this.ins.close()
  }
}

new Vue({
  router,
  store,
  render: h => h(App),
}).$mount('#app');
