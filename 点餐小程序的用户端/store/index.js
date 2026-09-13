import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

const store = new Vuex.Store({
	state: {
		orderType: 'takein',
		addressInfo: {},
		remark: '',
		tableInfo: {
			tableNumber: '',
			diningCount: 0
		}
	},
	mutations: {
		SET_ORDER_TYPE(state, orderType) {
			state.orderType = orderType
		},
		SET_ADDRESS(state, addressInfo) {
			state.addressInfo = addressInfo
		},
		SET_REMARK(state, remark) {
			state.remark = remark
		},
		SET_TABLE_INFO(state, tableInfo) {
			state.tableInfo = {
				...state.tableInfo,
				...tableInfo
			}
		},
		CLEAR_TABLE_INFO(state) {
			state.tableInfo = {
				tableNumber: '',
				diningCount: 0
			}
		}
	}
})

// 必须保证这行存在！！！
export default store
