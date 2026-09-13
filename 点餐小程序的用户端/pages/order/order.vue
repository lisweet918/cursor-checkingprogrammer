	<template>
	<view class="wrap glass-orders">
		<glass-tabbar ref="glassTabbar" :selected="1" class="page-glass-nav" />
			<view class="wrap__theme">
				<view class="wrap__theme__copy">
					<view class="wrap__theme__eyebrow">
						<text class="wrap__theme__eyebrow__dot"></text>
						一二布布 · 美味小餐单
					</view>
					<view class="wrap__theme__title">吃饱是头等大事</view>
					<view class="wrap__theme__subtitle">记录舌尖上的每一个治愈瞬间 ~</view>
				</view>
				<view class="wrap__theme__sticker">
					<yier-art character="pair" :size="180" radius="24" />
				</view>
			</view>

			<view class="wrap__tabs">
				<view v-for="(tab, index) in tabsList" :key="tab.name" class="wrap__tabs__item"
					:class="{ 'wrap__tabs__item--active': current === index }" @click="change(index)">
					<text>{{ tab.name }}</text>
					<text v-if="current === index" class="wrap__tabs__item__dot"></text>
				</view>
			</view>

		<view v-if="loading" class="wrap__feedback">
			<yier-feedback kind="loading" title="一起翻翻小餐单" description="一二和布布正在找你的美味记录…" />
		</view>
		<view v-else-if="current === 0" class="wrap__content">
				<view v-for="(item,index) in pickupList" :key="item._id" class="wrap__list" @click="orderDetail(item)">
					<view class="wrap__list__top">
						<view class="wrap__list__store">
							<text class="wrap__list__store__name">{{ storeName || '我的小餐桌' }}</text>
							<text v-if="item.name" class="wrap__list__store__customer">下单用户：{{item.name}} {{item.phone || ''}}</text>
						</view>
						<view :class="'status-' + item.status">{{ getStatusText(item.status) }}</view>
				</view>
				<view class="wrap__list__shopinfo" v-for="(itemt,indext) in item.commodity_list" :key="indext">
					<view class="wrap__list__shopinfo__left">
						<view class="wrap__list__shopinfo__left__image">
							<u-image :src="itemt.image" width="180" height="140" border-radius="8"></u-image>
						</view>
						<view class="wrap__list__shopinfo__left__desc">
							<view>
								<view class="wrap__list__shopinfo__left__desc__shopname">{{itemt.name}}</view>
								<view class="wrap__list__shopinfo__left__desc__content" v-if="itemt.materials_text">
									{{itemt.materials_text}}
								</view>
							</view>
							<view class="wrap__list__shopinfo__left__desc__price">
								<text>￥</text>
								<text>{{itemt.price}}</text>
							</view>
						</view>
					</view>
					<view class="wrap__list__shopinfo__right">x{{itemt.number}}</view>
				</view>
					<view class="wrap__list__time" v-if="item.createTime">
						<u-icon name="clock" size="22" color="#A98D81"></u-icon>
						<text>{{ formatTime(item.createTime) }}</text>
					</view>
				<view class="wrap__list__prices">
					共{{item.shop_num}}件商品，合计：
					<text>￥</text>
					<text>{{item.price}}</text>
				</view>
					<view class="wrap__list__remark" v-if="item.remark">
						<text>备注：{{item.remark}}</text>
				</view>
				<view class='wrap__list__bottom'>
					<view class="wrap__list__bottom__delete" @click.stop="deleteOrder(item)">删除订单</view>
					<view v-if="item.status == 0" class="wrap__list__bottom__cancel" @click.stop="cancelOrder(item)">取消订单</view>
					<view @click.stop="reorder(item)">再来一单</view>
				</view>
				</view>
				<view v-if="!pickupList.length" class="wrap__empty">
					<yier-feedback style="width: 100%;" title="小餐单还是空白的呀" description="还没有自取订单，选份喜欢的，一起等开饭" />
					<view class="wrap__empty__btn" @click="goOrder">去点餐</view>
				</view>
		</view>

		<view v-else-if="current === 1" class="wrap__content">
				<view v-for="(item,index) in takeoutList" :key="item._id" class="wrap__list" @click="orderDetail(item)">
					<view class="wrap__list__top">
						<view class="wrap__list__store">
							<text class="wrap__list__store__name">{{ storeName || '我的小餐桌' }}</text>
							<text v-if="item.name" class="wrap__list__store__customer">下单用户：{{item.name}} {{item.phone || ''}}</text>
						</view>
						<view :class="'status-' + item.status">{{ getStatusText(item.status) }}</view>
				</view>
				<view class="wrap__list__shopinfo" v-for="(itemt,indext) in item.commodity_list" :key="indext">
					<view class="wrap__list__shopinfo__left">
						<view class="wrap__list__shopinfo__left__image">
							<u-image :src="itemt.image" width="180" height="140" border-radius="8"></u-image>
						</view>
						<view class="wrap__list__shopinfo__left__desc">
							<view>
								<view class="wrap__list__shopinfo__left__desc__shopname">{{itemt.name}}</view>
								<view class="wrap__list__shopinfo__left__desc__content" v-if="itemt.materials_text">
									{{itemt.materials_text}}
								</view>
							</view>
							<view class="wrap__list__shopinfo__left__desc__price">
								<text>￥</text>
								<text>{{itemt.price}}</text>
							</view>
						</view>
					</view>
					<view class="wrap__list__shopinfo__right">x{{itemt.number}}</view>
				</view>
					<view class="wrap__list__time" v-if="item.createTime">
						<u-icon name="clock" size="22" color="#A98D81"></u-icon>
						<text>{{ formatTime(item.createTime) }}</text>
					</view>
				<view class="wrap__list__prices">
					共{{item.shop_num}}件商品，合计：
					<text>￥</text>
					<text>{{item.price}}</text>
				</view>
					<view class="wrap__list__remark" v-if="item.remark">
						<text>备注：{{item.remark}}</text>
				</view>
				<view class='wrap__list__bottom'>
					<view class="wrap__list__bottom__delete" @click.stop="deleteOrder(item)">删除订单</view>
					<view v-if="item.status == 0" class="wrap__list__bottom__cancel" @click.stop="cancelOrder(item)">取消订单</view>
					<view @click.stop="reorder(item)">再来一单</view>
				</view>
				</view>
				<view v-if="!takeoutList.length" class="wrap__empty">
					<yier-feedback style="width: 100%;" title="今天的美味还没出发呢" description="还没有外卖订单，布布陪你选一份好吃的" />
					<view class="wrap__empty__btn" @click="goOrder">去点餐</view>
				</view>
		</view>

		<view v-else class="wrap__content">
			<view v-for="(item,index) in couponList" :key="item._id" class="wrap__list">
				<view class="wrap__list__top">
					<view>{{ storeName }}</view>
					<view>{{item.status == '0' ? '待核销' : '已核销'}}</view>
				</view>
				<view class="wrap__list__shopinfo">
					<view class="wrap__list__shopinfo__left">
						<view class="wrap__list__shopinfo__left__image">
							<u-image :src="item.image" width="180" height="140"></u-image>
						</view>
						<view class="wrap__list__shopinfo__left__desc">
							<view class="wrap__list__shopinfo__left__desc__shopname">{{item.name}}</view>
							<view class="wrap__list__shopinfo__left__desc__price">
								<text>￥</text>
								<text>{{item.price}}</text>
							</view>
						</view>
					</view>
					<view class="wrap__list__shopinfo__right">x1</view>
				</view>
				<view class="wrap__list__prices">
					共1件商品，合计：
					<text>￥</text>
					<text>{{item.price}}</text>
				</view>
					<view class="wrap__list__couponBottom">
						<view v-if="item.status == '0'" @click="checkCoupon(item)">查看券码</view>
						<view class="wrap__list__bottom__delete" @click.stop="deleteOrder(item)">删除订单</view>
					</view>
				</view>
				<view v-if="!couponList.length" class="wrap__empty wrap__empty--coupon">
					<yier-feedback style="width: 100%;" title="这页小本本还空着" description="暂无券码记录，券码订单功能还在准备中" />
					<view class="wrap__empty__btn wrap__empty__btn--soft" @click="goOrder">回首页看看</view>
				</view>
			</view>
	</view>
</template>

	<script>
import GlassTabbar from '@/components/glass-tabbar/glass-tabbar.vue';
import { userDatabase } from '@/common/user-api.js'
		import YierArt from '@/components/yier-art/yier-art.vue'
		import YierFeedback from '@/components/yier-feedback/yier-feedback.vue'

		const db = userDatabase()

		export default {
			components: {
				GlassTabbar,
				YierFeedback,
				YierArt
			},
			data() {
			return {
				current: 0,
				storeName: '',
				tabsList: [
					{ name: '自取订单' },
					{ name: '外卖订单' },
						{ name: '券码订单' }
				],
				pickupList: [],
				takeoutList: [],
				couponList: [],
				loading: false
			}
		},
		onShow() {
			this.$nextTick(() => { if (this.$refs.glassTabbar) this.$refs.glassTabbar.reveal(); });
			this.loadStoreSettings()
			this.loadOrders()
		},
		async onPullDownRefresh() {
			await this.loadOrders()
			uni.stopPullDownRefresh()
		},
		methods: {
			getStatusText(status) {
				const s = parseInt(status);
				switch (s) {
					case 0: return '待接单';
					case 1: return '已接单';
					case 2: return '已退款';
					case 3: return '已完成';
					default: return '已支付';
				}
			},
			formatTime(ts) {
				if (!ts) return ''
				const d = new Date(Number(ts))
				if (isNaN(d.getTime())) return ''
				const pad = n => (n < 10 ? '0' + n : '' + n)
				return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
			},
			async loadStoreSettings() {
				try {
					const db = userDatabase()
					const res = await db.collection('store_settings').field('store_name,business_hours,packing_fee,delivery_fee,free_delivery_threshold,min_order_amount').get()
					if (res.result.data && res.result.data.length > 0) {
						this.storeName = res.result.data[0].store_name || '七香嫂包子铺'
					}
				} catch (e) {
					console.error('Failed to load store settings:', e)
				}
			},
			change(index) {
				this.current = index;
			},
			async loadOrders() {
				this.loading = true
				try {


					const userInfo = uni.getStorageSync('userInfo')
					if (!userInfo || !uni.getStorageSync('sessionToken')) {
 this.pickupList = []; this.takeoutList = []; this.couponList = []; return
}
const whereStr = { user_id: userInfo.openid }

					
					const res = await db.collection('order')
						.where(whereStr)
						.orderBy('createTime', 'desc')
						.get()
					const allOrders = res.result.data || []
					
					this.pickupList = allOrders.filter(o => o.type === 'takein')
					this.takeoutList = allOrders.filter(o => o.type === 'takeout')
					this.couponList = [] // 优惠券订单逻辑如果有可在此处理
					
				} catch (e) {
					console.error(e)
					uni.showToast({ title: '加载失败', icon: 'none' })
				} finally {
					this.loading = false
				}
			},
			orderDetail(item) {
				const type = this.current == 0 ? 'takein' : 'takeout'
				// 跳转到订单详情页面
				uni.navigateTo({
					url: `/subpackageOrder/order/order-detail?id=${item._id}&type=${type}`
				})
			},
			goOrder() {
				uni.switchTab({ url: '/pages/home/home' })
			},
			reorder(item) {
				const cart = (item.commodity_list || []).map(c => ({
					id: c.id,
					cate_id: c.cate_id || '',
					name: c.name,
					price: c.price,
					number: c.number,
					image: c.image,
					is_single: c.is_single !== false,
					materials_text: c.materials_text || ''
				}))
				if (!cart.length) {
					uni.showToast({ title: '该订单无可购买商品', icon: 'none' })
					return
				}
				uni.setStorageSync('cart', cart)
				this.$store.commit('SET_ORDER_TYPE', item.type || 'takein')
				uni.navigateTo({ url: '/subpackageHome/setTlement/pay' })
			},
			cancelOrder(item) {
				uni.showModal({
					title: '取消订单',
					content: '确定要取消该订单吗？',
					success: async (res) => {
						if (!res.confirm) return
						uni.showLoading({ title: '处理中...' })
						try {
							await db.collection('order').doc(item._id).update({ status: 2 })
							uni.hideLoading()
							uni.showToast({ title: '已取消', icon: 'none' })
							this.loadOrders()
						} catch (e) {
							uni.hideLoading()
							uni.showToast({ title: '取消失败', icon: 'none' })
						}
					}
				})
			},
			deleteOrder(item) {
				uni.showModal({
					title: '删除订单',
					content: '从您的订单列表中移除此记录？商家订单仍会保留。',
					confirmText: '删除',
					confirmColor: '#D9534F',
					cancelText: '取消',
					success: async (res) => {
						if (!res.confirm) return
						uni.showLoading({ title: '正在删除...' })
						try {
							await db.collection('order').doc(item._id).remove()
							uni.hideLoading()
							uni.showToast({ title: '已成功删除', icon: 'success' })
							this.loadOrders()
						} catch (e) {
							console.error('Delete order error:', e)
							uni.hideLoading()
							uni.showToast({ title: e.message || '删除失败', icon: 'none' })
						}
					}
				})
			},
			checkCoupon(param) {
				uni.navigateTo({
					url: `/subpackageOrder/order/coupon-detail?id=${param.id}`
				})
			}
		}
	}
</script>

<style lang="scss" scoped>
	@import '@/common/scss/order/order.scss';
	@import '@/common/scss/liquid-glass-pages.scss';
	@include glass-orders-page;
	.wrap__feedback { margin: 28rpx 24rpx; }
	.wrap__empty {
		min-height: 0;
		padding: 0 0 32rpx;
		background: transparent;
		box-shadow: none;
	}
</style>
