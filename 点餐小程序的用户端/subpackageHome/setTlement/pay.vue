<template>
	<view class="container receipt-checkout glass-checkout">
		<view v-if="orderSucceeded" class="order-celebration">
			<yier-feedback kind="success" title="耶！餐单递出去啦" description="下单成功，带你去看看小餐单…" />
		</view>
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

		<view v-if="orderType == 'takein' && tableInfo && tableInfo.tableNumber" class="container__tablebar">
			<view class="container__tablebar__item">
				<view class="container__tablebar__item__label">桌号</view>
				<view class="container__tablebar__item__value">{{ tableInfo.tableNumber }}</view>
			</view>
			<view class="container__tablebar__divider"></view>
			<view class="container__tablebar__item">
				<view class="container__tablebar__item__label">就餐人数</view>
				<view class="container__tablebar__item__value">{{ (tableInfo && tableInfo.diningCount) || 1 }}人</view>
			</view>
		</view>

		<view class="receipt-paper">
			<view class="receipt-tape" aria-hidden="true"></view>
			<view class="receipt-heading">
				<view class="receipt-heading__copy">
					<view class="receipt-brand">一二布布食堂</view>
					<view class="receipt-title">今天的小餐单</view>
					<view class="receipt-caption">把喜欢的味道，装进小票里</view>
				</view>
				<view class="receipt-sticker" aria-hidden="true">
					<yier-art character="peek" :size="138" :radius="20" />
					<text class="receipt-sticker__note">好好吃饭呀</text>
				</view>
			</view>
			<view class="receipt-section-head">
				<text class="receipt-section-title">商品列表</text>
				<text class="receipt-mode">{{ orderType == 'takeout' ? '外卖配送' : '堂食 / 自取' }}</text>
			</view>
			<view v-if="!cart.length && !orderSucceeded" class="receipt-empty">
				<text class="receipt-empty__mark" aria-hidden="true">♡</text>
				<text>小餐单还空着，等你选点喜欢的</text>
			</view>
			<view v-for="(item, index) in cart" :key="index" class="container__shopbox">
				<view class="container__shopbox__left">
					<view class="receipt-product-image">
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
			<view class="receipt-details-label"><text>小小叮嘱与费用</text><text aria-hidden="true">♡</text></view>
			<list-cell arrow bgcolor="#FFFDF7" color="#604637">
				<view class="w-100 d-flex align-items-center justify-content-between overflow-hidden">
					<view class="flex-shrink-0">备注</view>
					<view class="receipt-input-wrap">
						<u-input placeholder="请填写您的要求" disabled :value="remark" @click="addRemark" input-align="right"></u-input>
					</view>
				</view>
			</list-cell>
			<list-cell v-if="orderType == 'takein'" bgcolor="#FFFDF7" color="#604637">
				<view class="w-100 d-flex align-items-center justify-content-between overflow-hidden">
					<view class="flex-shrink-0">联系人/桌号</view>
					<view class="receipt-input-wrap">
						<u-input placeholder="请输入怎么称呼您或您的桌号" v-model="contactName" input-align="right"></u-input>
					</view>
				</view>
			</list-cell>
			<list-cell v-if="packingFee > 0" bgcolor="#FFFDF7" color="#604637">
				<view class="w-100 d-flex align-items-center justify-content-between">
					<view class="flex-shrink-0">打包费</view>
					<view class="price">
						<text>￥</text>
						<text>{{ packingFee }}</text>
					</view>
				</view>
			</list-cell>
			<list-cell v-if="orderType == 'takeout'" bgcolor="#FFFDF7" color="#604637">
				<view class="w-100 d-flex align-items-center justify-content-between">
					<view class="flex-shrink-0">配送费</view>
					<view class="price">
						<text v-if="deliveryFee > 0">￥</text>
						<text>{{ deliveryFee > 0 ? deliveryFee : '免配送费' }}</text>
					</view>
				</view>
			</list-cell>
			<list-cell arrow bgcolor="#FFFDF7" color="#604637">
				<view class="w-100 d-flex align-items-center justify-content-between" @click="openCouponPicker">
					<view class="flex-shrink-0">优惠券</view>
					<view class="coupon-cell">
						<text v-if="selectedCoupon" class="coupon-cell__deduct">-￥{{ selectedCoupon.amount }}</text>
						<text v-else-if="availableCoupons.length" class="coupon-cell__hint">{{ availableCoupons.length }}张可用</text>
						<text v-else class="coupon-cell__none">暂无可用</text>
					</view>
				</view>
			</list-cell>
			<list-cell v-if="couponDeduct > 0" bgcolor="#FFFDF7" color="#604637">
				<view class="w-100 d-flex align-items-center justify-content-between">
					<view class="flex-shrink-0">优惠券抵扣</view>
					<view class="price">
						<text>-￥</text>
						<text>{{ couponDeduct }}</text>
					</view>
				</view>
			</list-cell>
			<list-cell last bgcolor="#FFFDF7" color="#604637">
				<view class="w-100 d-flex justify-content-end align-items-center receipt-subtotal">
					<text class="font-size-sm">共{{ cartNum }}件商品，小计</text>
					<view class="price">
						<text>￥</text>
						<text>{{ cartAmount }}</text>
					</view>
				</view>
			</list-cell>
			<view class="receipt-tear-line" aria-hidden="true"></view>
			<view class="receipt-thanks">
				<view class="receipt-thanks__stars" aria-hidden="true">· ♡ ·</view>
				<text>谢谢你，认真对待每一顿饭</text>
				<text class="receipt-thanks__small">一二布布陪你，把日子吃得甜一点</text>
			</view>
			<view class="receipt-scallops" aria-hidden="true"></view>
		</view>
		<view class="receipt-order-method">
		<list-cell last bgcolor="transparent" color="#856756" padding="22rpx 26rpx">
			<view class="w-100 d-flex align-items-center justify-content-between">
				<view>下单方式</view>
				<view class="d-flex align-items-center">
					<view>一键下单</view>
				</view>
			</view>
		</list-cell>
		</view>
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

		<view class="footer receipt-footer">
			<view class="mr-30 total">
				<text>合计：</text>
				<text>￥</text>
				<text>{{ payAmount }}</text>
			</view>
			<button v-if="orderType == 'takeout' && cartAmount < minOrderAmount" class="footer__disabled receipt-submit" disabled>
				还差￥{{ (minOrderAmount - cartAmount).toFixed(2) }}起送
			</button>
			<button v-else type="primary" class="receipt-submit" @click="handlePay">确认下单</button>
		</view>
	</view>
</template>

<script>
import { userDatabase, getSessionUser } from '@/common/user-api.js'
	import { mapState } from 'vuex'
	import ListCell from '@/components/list-cell/list-cell.vue'
	import TimePicker from '@/uni_modules/hbxw-timepicker/components/hbxw-timepicker/hbxw-timepicker.vue'
	import YierFeedback from '@/components/yier-feedback/yier-feedback.vue'
	import YierArt from '@/components/yier-art/yier-art.vue'

	export default {
		components: {
			YierFeedback,
			YierArt,
			ListCell,
			TimePicker
		},
		data() {
			return {
				cart: [],
				orderSucceeded: false,
 submitting: false,
 requestId: '',
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
				return (this.cart || []).reduce((acc, cur) => acc + (Number(cur.number) || 0), 0)
			},
			cartAmount() {
				const totalCents = (this.cart || []).reduce((acc, cur) => acc + (Number(cur.number) || 0) * Math.round((Number(cur.price) || 0) * 100), 0)
				return totalCents / 100
			},
			deliveryFee() {
				if (this.orderType !== 'takeout') return 0
				if (this.freeDeliveryThreshold > 0 && this.cartAmount >= this.freeDeliveryThreshold) return 0
				return this.baseDeliveryFee
			},
			availableCoupons() {
				const now = Date.now()
				return (this.coupons || []).filter(c => {
					if (!c || c.status !== 0) return false
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
				const totalCents = Math.round(this.cartAmount * 100) + Math.round(this.packingFee * 100) + Math.round(this.deliveryFee * 100) - Math.round(this.couponDeduct * 100)
				return Math.max(0, totalCents) / 100
			}
		},
		onShow() {
			this.orderSucceeded = false
			// 每次页面展示时重新读取购物车（含从备注页返回）
			this.loadCart()
			const userInfo = uni.getStorageSync('userInfo')
			if (userInfo && !this.contactName) {
				this.contactName = userInfo.nickname
			}
		},
		onLoad() {
			this.loadCart()
			this.loadFeeSettings()
			this.loadCoupons()
		},
		onUnload() {
			this.$store.commit('SET_REMARK', '')
		},
		methods: {
			async loadFeeSettings() {
				try {
					const db = userDatabase()
					const res = await db.collection('store_settings').field('store_name,business_hours,packing_fee,delivery_fee,free_delivery_threshold,min_order_amount').get()
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
					const db = userDatabase()
					const res = await db.collection('user_coupons')
						.where({ status: 0 })
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
					number: Number(item.number) || 1,
					price: Number(item.price) || 0,
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
 if (this.submitting) return
 if (!getSessionUser()) { uni.navigateTo({ url: '/pages/login/login' }); return }
 if (this.selectedCoupon && !this.availableCoupons.some(c => c._id === this.selectedCoupon._id)) {
  this.selectedCoupon = null; uni.showToast({ title: '优惠券已失效，请重新选择', icon: 'none' }); return
 }

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

				this.submitting = true
 if (!this.requestId) this.requestId = Date.now() + '-' + Math.random().toString(36).slice(2)
 uni.showLoading({ title: '正在提交订单...', mask: true })

				try {
					const db = userDatabase()
					const orderData = {
						createTime: Date.now(),
 request_id: this.requestId,
 delivery_type: this.deliveryType,
 reservation_time: this.reservationTime,
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
							id: String(item.id),
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

					// 优惠券核销、积分和通知由云端下单服务处理。

					// 清空购物车
					uni.removeStorageSync('cart')
					this.$store.commit('SET_REMARK', '')
					this.cart = []

					uni.hideLoading()
					this.orderSucceeded = true
					
					setTimeout(() => {
						uni.switchTab({
							url: '/pages/order/order'
						})
					}, 1500)
				} catch (e) {
					uni.hideLoading()
					uni.showModal({ title: '下单失败', content: e.message || '网络错误，请重试', showCancel: false })
				} finally { this.submitting = false }
			}
		}
	}
</script>

<style lang="scss" scoped>
	@import '@/common/scss/home/pay.scss';
	@import './receipt-checkout.scss';
	@import '@/common/scss/liquid-glass-pages.scss';
	@include glass-checkout-page;
	.order-celebration {
		position: fixed;
		top: 24vh;
		left: 50%;
		transform: translateX(-50%);
		width: 620rpx;
		max-width: 88vw;
		z-index: 1100;
		pointer-events: none;
		border-radius: 36rpx;
		box-shadow: 0 18rpx 72rpx rgba(90, 63, 51, 0.18);
	}
</style>
