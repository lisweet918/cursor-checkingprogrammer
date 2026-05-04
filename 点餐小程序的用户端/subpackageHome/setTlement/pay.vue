<template>
	<view class="container">
		<view v-if="orderType == 'takeout'" class="container__addressbox">
			<view v-if="hasAddress" class="container__addressbox__addressinfo" @click="addressManage">
				<view class="container__addressbox__addressinfo__info">
					<view class="container__addressbox__addressinfo__info__top">
						{{ addressInfo.address }}
						{{ addressInfo.house_number }}
					</view>
					<view class="container__addressbox__addressinfo__info__bottom">
						<view>{{ addressInfo.name }}</view>
						<view>{{ addressInfo.phone }}</view>
					</view>
				</view>
				<view>
					<u-icon name="arrow-right" color="#909399"></u-icon>
				</view>
			</view>
			<view v-else class="container__addressbox__add-address" @click="addressManage">
				<u-icon name="plus" size="30" class="mr-10"></u-icon>
				请选择收货地址
			</view>

			<view v-if="orderType == 'takeout' && hasAddress" class="delivery-options">
				<view class="delivery-option" :class="{ 'delivery-option--active': deliveryType === 'immediately' }"
					@click="selectDeliveryType('immediately')">
					<view>立即送</view>
					<view class="delivery-option__right">
						<view>马上配送</view>
					</view>
				</view>

				<view class="delivery-option" :class="{ 'delivery-option--active': deliveryType === 'reservation' }"
					@click="selectDeliveryType('reservation')">
					<view>预约送</view>
					<view class="delivery-option__right">
						<view v-if="reservationTime">{{ reservationTime }}</view>
						<view v-else>选择时间</view>
						<view>
							<u-icon name="arrow-right" :color="deliveryType === 'reservation' ? '#FFFFFF' : '#909399'"></u-icon>
						</view>
					</view>
				</view>
			</view>
		</view>

		<view v-if="showReservationPicker">
			<time-picker :isShow.sync="showReservationPicker" :isBtn="false" :isFast="false" :isAutoClose="true"
				title="选择预计送达时间" subTitle="请选择您方便的送达时间" @change="pickerChange" :minHour="6" :maxHour="18"
				dayRange="7"></time-picker>
		</view>

		<view class="bg-white pt-30 mb-20">
			<view class="font-size-medium font-weight-bold pl-30">商品列表</view>
			<view v-for="(item, index) in cart" :key="index" class="container__shopbox">
				<view class="container__shopbox__left">
					<view>
						<u-image :src="item.image" border-radius="18" width="100" height="100"></u-image>
					</view>
					<view class="container__shopbox__left__info">
						<view>{{ item.name }}</view>
						<view>{{ item.materials_text }}</view>
						<view>x{{ item.number }}</view>
					</view>
				</view>
				<view class="container__shopbox__right">
					<text>￥</text>
					<text>{{ item.price }}</text>
				</view>
			</view>
			<list-cell arrow>
				<view class="w-100 d-flex align-items-center justify-content-between overflow-hidden">
					<view class="flex-shrink-0">备注</view>
					<view>
						<u-input placeholder="请填写您的要求" disabled v-model="remark" @click="addRemark" input-align="right"></u-input>
					</view>
				</view>
			</list-cell>
			<list-cell v-if="orderType == 'takein'">
				<view class="w-100 d-flex align-items-center justify-content-between overflow-hidden">
					<view class="flex-shrink-0">联系人/桌号</view>
					<view>
						<u-input placeholder="请输入怎么称呼您或您的桌号" v-model="contactName" input-align="right"></u-input>
					</view>
				</view>
			</list-cell>
			<list-cell last>
				<view class="w-100 d-flex justify-content-end align-items-center">
					<text class="font-size-sm">共{{ cartNum }}件商品，小计</text>
					<view class="price">
						<text>￥</text>
						<text>{{ cartAmount }}</text>
					</view>
				</view>
			</list-cell>
		</view>
		<list-cell last>
			<view class="w-100 d-flex align-items-center justify-content-between">
				<view>下单方式</view>
				<view class="d-flex align-items-center">
					<view>一键下单</view>
				</view>
			</view>
		</list-cell>
		<view class="footer">
			<view class="mr-30 total">
				<text>合计：</text>
				<text>￥</text>
				<text>{{ cartAmount }}</text>
			</view>
			<button type="primary" @click="handlePay">确认下单</button>
		</view>
	</view>
</template>

<script>
	import { mapState } from 'vuex'
	import ListCell from '@/components/list-cell/list-cell.vue'
	import TimePicker from '@/uni_modules/hbxw-timepicker/components/hbxw-timepicker/hbxw-timepicker.vue'

	export default {
		components: {
			ListCell,
			TimePicker
		},
		data() {
			return {
				cart: [],
				deliveryType: 'immediately',
				reservationTime: '',
				showReservationPicker: false,
				contactName: ''
			}
		},
		computed: {
			...mapState(['orderType', 'addressInfo', 'remark']),
			hasAddress() {
				return !!(this.addressInfo && this.addressInfo.address)
			},
			cartNum() {
				return this.cart.reduce((acc, cur) => acc + cur.number, 0)
			},
			cartAmount() {
				const total = this.cart.reduce((acc, cur) => acc + cur.number * cur.price, 0)
				return Math.floor(total * 100) / 100
			}
		},
		onShow() {
			// 每次页面展示时重新读取购物车（含从备注页返回）
			this.loadCart()
		},
		onUnload() {
			this.$store.commit('SET_REMARK', '')
		},
		methods: {
			loadCart() {
				const cartData = (uni.getStorageSync('cart') || []).map(item => ({
					...item,
					is_refund: 0
				}))
				this.cart = cartData
			},
			selectDeliveryType(type) {
				if (type === 'immediately') {
					this.deliveryType = 'immediately'
					this.reservationTime = ''
				} else {
					this.showReservationPicker = true
				}
			},
			pickerChange(event) {
				const { result, form } = event
				if (form === 'hour' || form === 'sure') {
					if (result) {
						if (result.displayText) {
							this.reservationTime = `${result.displayText} ${result.hoursStr}`
						} else {
							const date = new Date(result.year, result.month - 1, result.day)
							const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
							const weekDay = weekDays[date.getDay()]
							this.reservationTime = `${result.month}月${result.day}日（${weekDay}） ${result.hoursStr}`
						}
						this.deliveryType = 'reservation'
						this.showReservationPicker = false
					}
				}
				if (form === 'close') {
					this.showReservationPicker = false
				}
			},
			addRemark() {
				uni.navigateTo({
					url: `/subpackageHome/setTlement/remark`
				})
			},
			addressManage() {
				uni.navigateTo({
					url: `/subpackageMy/myAddress/address-manage?methods=pay`
				})
			},
			async handlePay() {
				if (this.orderType === 'takeout' && !this.hasAddress) {
					uni.showToast({ title: '请选择收货地址', icon: 'none' })
					return
				}
				if (!this.cart || this.cart.length === 0) {
					uni.showToast({ title: '购物车为空', icon: 'none' })
					return
				}

				uni.showLoading({ title: '正在提交订单...' })

				try {
					const db = uniCloud.database()
					const orderData = {
						createTime: Date.now(),
						out_trade_no: 'WX' + Date.now() + Math.floor(Math.random() * 1000),
						type: this.orderType,
						status: 0, // 0=待接单
						torder: 'T' + Math.floor(Math.random() * 100),
						tableNumber: '', 
						shop_num: this.cartNum,
						price: this.cartAmount,
						remark: this.remark || '',
						payment_time_text: new Date().toLocaleString(),
						commodity_list: this.cart.map(item => ({
							id: item.id,
							name: item.name,
							price: item.price,
							number: item.number,
							image: item.image,
							is_single: item.is_single !== false,
							materials_text: item.materials_text || ''
						}))
					}

					if (this.orderType === 'takeout') {
						orderData.name = this.addressInfo.name
						orderData.phone = this.addressInfo.phone
						orderData.address = this.addressInfo.address
						orderData.house_number = this.addressInfo.house_number || ''
						orderData.orderstatus = 0
						orderData.delivery_status = 0
					} else {
						// 堂食/自取 时保存用户填写的联系人/桌号
						orderData.name = this.contactName || '顾客'
					}

					await db.collection('order').add(orderData)
					
					// 调用云函数发送老板接单提醒
					uniCloud.callFunction({
						name: 'push-order-notification',
						data: { orderData }
					}).catch(err => console.error('Push notification failed:', err))

					// 清空购物车
					uni.removeStorageSync('cart')
					this.$store.commit('SET_REMARK', '')
					this.cart = []

					uni.hideLoading()
					uni.showToast({ title: '下单成功！', icon: 'success' })
					
					setTimeout(() => {
						uni.switchTab({
							url: '/pages/order/order'
						})
					}, 1500)
				} catch (e) {
					uni.hideLoading()
					uni.showModal({ title: '下单失败', content: e.message || '网络错误，请重试', showCancel: false })
				}
			}
		}
	}
</script>

<style lang="scss" scoped>
	@import '@/common/scss/home/pay.scss';
</style>
