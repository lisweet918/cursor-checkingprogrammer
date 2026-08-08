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

		<view v-if="orderType == 'takein' && tableInfo.tableNumber" class="container__tablebar">
			<view class="container__tablebar__item">
				<view class="container__tablebar__item__label">桌号</view>
				<view class="container__tablebar__item__value">{{ tableInfo.tableNumber }}</view>
			</view>
			<view class="container__tablebar__divider"></view>
			<view class="container__tablebar__item">
				<view class="container__tablebar__item__label">就餐人数</view>
				<view class="container__tablebar__item__value">{{ tableInfo.diningCount || 1 }}人</view>
			</view>
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
			<list-cell v-if="packingFee > 0">
				<view class="w-100 d-flex align-items-center justify-content-between">
					<view class="flex-shrink-0">打包费</view>
					<view class="price">
						<text>￥</text>
						<text>{{ packingFee }}</text>
					</view>
				</view>
			</list-cell>
			<list-cell v-if="orderType == 'takeout'">
				<view class="w-100 d-flex align-items-center justify-content-between">
					<view class="flex-shrink-0">配送费</view>
					<view class="price">
						<text v-if="deliveryFee > 0">￥</text>
						<text>{{ deliveryFee > 0 ? deliveryFee : '免配送费' }}</text>
					</view>
				</view>
			</list-cell>
			<list-cell arrow>
				<view class="w-100 d-flex align-items-center justify-content-between" @click="openCouponPicker">
					<view class="flex-shrink-0">优惠券</view>
					<view class="coupon-cell">
						<text v-if="selectedCoupon" class="coupon-cell__deduct">-￥{{ selectedCoupon.amount }}</text>
						<text v-else-if="availableCoupons.length" class="coupon-cell__hint">{{ availableCoupons.length }}张可用</text>
						<text v-else class="coupon-cell__none">暂无可用</text>
					</view>
				</view>
			</list-cell>
			<list-cell v-if="couponDeduct > 0">
				<view class="w-100 d-flex align-items-center justify-content-between">
					<view class="flex-shrink-0">优惠券抵扣</view>
					<view class="price">
						<text>-￥</text>
						<text>{{ couponDeduct }}</text>
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
		<view v-if="couponPickerVisible" class="coupon-picker">
			<view class="coupon-picker__mask" @click="couponPickerVisible = false"></view>
			<view class="coupon-picker__panel">
				<view class="coupon-picker__head">
					<text>选择优惠券</text>
					<text class="coupon-picker__close" @click="couponPickerVisible = false">✕</text>
				</view>
				<scroll-view scroll-y class="coupon-picker__body">
					<view class="coupon-picker__item" :class="{ 'coupon-picker__item--active': !selectedCoupon }"
						@click="chooseCoupon(null)">
						<text>不使用优惠券</text>
						<text v-if="!selectedCoupon" class="coupon-picker__check">✓</text>
					</view>
					<view v-for="c in availableCoupons" :key="c._id" class="coupon-picker__item"
						:class="{ 'coupon-picker__item--active': selectedCoupon && selectedCoupon._id === c._id }"
						@click="chooseCoupon(c)">
						<view class="coupon-picker__item__left">
							<view class="coupon-picker__item__amount">￥{{ c.amount }}</view>
							<view class="coupon-picker__item__name">{{ c.name }}（满{{ c.threshold }}可用）</view>
						</view>
						<text v-if="selectedCoupon && selectedCoupon._id === c._id" class="coupon-picker__check">✓</text>
					</view>
					<view v-if="!availableCoupons.length" class="coupon-picker__empty">
						当前订单没有可用优惠券
					</view>
				</scroll-view>
			</view>
		</view>

		<view class="footer">
			<view class="mr-30 total">
				<text>合计：</text>
				<text>￥</text>
				<text>{{ payAmount }}</text>
			</view>
			<button v-if="orderType == 'takeout' && cartAmount < minOrderAmount" class="footer__disabled" disabled>
				还差￥{{ (minOrderAmount - cartAmount).toFixed(2) }}起送
			</button>
			<button v-else type="primary" @click="handlePay">确认下单</button>
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
				contactName: '',
				packingFee: 0,
				baseDeliveryFee: 0,
				freeDeliveryThreshold: 0,
				minOrderAmount: 0,
				coupons: [],
				selectedCoupon: null,
				couponPickerVisible: false
			}
		},
		computed: {
			...mapState(['orderType', 'addressInfo', 'remark', 'tableInfo']),
			hasAddress() {
				return !!(this.addressInfo && this.addressInfo.address)
			},
			cartNum() {
				return this.cart.reduce((acc, cur) => acc + cur.number, 0)
			},
			cartAmount() {
				const total = this.cart.reduce((acc, cur) => acc + cur.number * cur.price, 0)
				return Math.floor(total * 100) / 100
			},
			deliveryFee() {
				if (this.orderType !== 'takeout') return 0
				if (this.freeDeliveryThreshold > 0 && this.cartAmount >= this.freeDeliveryThreshold) return 0
				return this.baseDeliveryFee
			},
			availableCoupons() {
				const now = Date.now()
				return this.coupons.filter(c => {
					if (c.status !== 0) return false
					if (c.expire_time && Number(c.expire_time) < now) return false
					return this.cartAmount >= (Number(c.threshold) || 0)
				})
			},
			couponDeduct() {
				if (!this.selectedCoupon) return 0
				const amount = Number(this.selectedCoupon.amount) || 0
				return Math.min(amount, this.cartAmount)
			},
			payAmount() {
				const total = this.cartAmount + this.packingFee + this.deliveryFee - this.couponDeduct
				return Math.max(0, Math.floor(total * 100) / 100)
			}
		},
		onShow() {
			// 每次页面展示时重新读取购物车（含从备注页返回）
			this.loadCart()
			const userInfo = uni.getStorageSync('userInfo')
			if (userInfo && !this.contactName) {
				this.contactName = userInfo.nickname
			}
		},
		onLoad() {
			this.loadFeeSettings()
			this.loadCoupons()
		},
		onUnload() {
			this.$store.commit('SET_REMARK', '')
		},
		methods: {
			async loadFeeSettings() {
				try {
					const db = uniCloud.database()
					const res = await db.collection('store_settings').get()
					if (res.result.data && res.result.data.length > 0) {
						const s = res.result.data[0]
						this.packingFee = Number(s.packing_fee) || 0
						this.baseDeliveryFee = Number(s.delivery_fee) || 0
						this.freeDeliveryThreshold = Number(s.free_delivery_threshold) || 0
						this.minOrderAmount = Number(s.min_order_amount) || 0
					}
				} catch (e) {
					console.error('Failed to load fee settings:', e)
				}
			},
			async loadCoupons() {
				const userInfo = uni.getStorageSync('userInfo')
				if (!userInfo || !userInfo.openid) return
				try {
					const db = uniCloud.database()
					const res = await db.collection('user_coupons')
						.where(`user_id == "${userInfo.openid}" && status == 0`)
						.get()
					this.coupons = res.result.data || []
				} catch (e) {
					console.error('Failed to load coupons:', e)
				}
			},
			openCouponPicker() {
				this.couponPickerVisible = true
			},
			chooseCoupon(coupon) {
				this.selectedCoupon = coupon
				this.couponPickerVisible = false
			},
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
				if (this.orderType === 'takeout' && this.minOrderAmount > 0 && this.cartAmount < this.minOrderAmount) {
					uni.showToast({ title: `满￥${this.minOrderAmount}起送`, icon: 'none' })
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
						tableNumber: this.orderType === 'takein' ? (this.tableInfo.tableNumber || '') : '',
						diningCount: this.orderType === 'takein' ? (this.tableInfo.diningCount || 0) : 0,
						shop_num: this.cartNum,
						goods_amount: this.cartAmount,
						packing_fee: this.packingFee,
						delivery_fee: this.deliveryFee,
						coupon_deduct: this.couponDeduct,
						coupon_id: this.selectedCoupon ? this.selectedCoupon._id : '',
						price: this.payAmount,
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

					const userInfo = uni.getStorageSync('userInfo')
					if (userInfo && userInfo.openid) {
						orderData.user_id = userInfo.openid
					}

					const addRes = await db.collection('order').add(orderData)
					const newOrderId = addRes.result.id

					// 核销已使用的优惠券
					if (this.selectedCoupon && this.selectedCoupon._id) {
						try {
							await db.collection('user_coupons').doc(this.selectedCoupon._id).update({
								status: 1,
								used_order_id: newOrderId || '',
								used_time: Date.now()
							})
						} catch (err) {
							console.error('优惠券核销失败', err)
						}
					}

					// 增加会员积分
					if (userInfo && userInfo._id) {
						try {
							const userRes = await db.collection('wx_users').doc(userInfo._id).get()
							if (userRes.result.data && userRes.result.data.length > 0) {
								const currentPoints = userRes.result.data[0].points || 0
								const newPoints = currentPoints + 10
								await db.collection('wx_users').doc(userInfo._id).update({
									points: newPoints
								})
								userInfo.points = newPoints
								uni.setStorageSync('userInfo', userInfo)
							}
						} catch(err) {
							console.error('积分更新失败', err)
						}
					}
					
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
