import App from './App'
import api from './common/request'

// #ifndef VUE3
import Vue from 'vue'
import './uni.promisify.adaptor'
import uView from './uni_modules/vk-uview-ui'
import store from './store'
import util from './common/util.js'
Vue.config.productionTip = false
Vue.use(uView)
Vue.prototype.$util = util
Vue.prototype.$api = api
App.mpType = 'app'
const app = new Vue({
	store,
	...App
})
app.$mount()
// #endif

// #ifdef VUE3
import {
	createSSRApp
} from 'vue'
import uView from './uni_modules/vk-uview-ui';
import store from './store';
import util from './common/util.js';

export function createApp() {
	const app = createSSRApp(App)

	app.use(uView)
	app.use(store)
	app.config.globalProperties.$util = util
	app.config.globalProperties.$api = api;

	return {
		app
	}
}
// #endif