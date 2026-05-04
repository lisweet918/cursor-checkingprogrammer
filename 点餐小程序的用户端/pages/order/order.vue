<template>
	<view class="wrap">
		<view class="wrap__tabs">
			<u-tabs :list="tabsList" :is-scroll="false" v-model="current" @change="change" active-color="#0A3D28"
				bar-width="100" duration="0" inactive-color="#9A9A9A"></u-tabs>
		</view>

		<view v-if="current === 0">
			<view v-for="(item,index) in pickupList" :key="item.id" class="wrap__list" @click="orderDetail(item)">
				<view class="wrap__list__top">
					<view>{{ storeName }}</view>
					<view>{{item.status == '0' ? '待付款' : item.status == '1' ? '已付款' : '已退款'}}</view>
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
				<view class="wrap__list__prices">
					共{{item.shop_num}}件商品，合计：
					<text>￥</text>
					<text>{{item.price}}</text>
				</view>
				<view class='wrap__list__bottom'>
					<view>再来一单</view>
				</view>
			</view>
		</view>

		<view v-else-if="current === 1">
			<view v-for="(item,index) in takeoutList" :key="item.id" class="wrap__list" @click="orderDetail(item)">
				<view class="wrap__list__top">
					<view>{{ storeName }}</view>
					<view>
						{{item.orderstatus == 2 ? '已退款' : item.delivery_status == 0 ? '商家已接单' : item.delivery_status == 1 ? '配送中' : '已完成'}}
					</view>
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
				<view class="wrap__list__prices">
					共{{item.shop_num}}件商品，合计：
					<text>￥</text>
					<text>{{item.price}}</text>
				</view>
				<view class='wrap__list__bottom'>
					<view>再来一单</view>
				</view>
			</view>
		</view>

		<view v-else>
			<view v-for="(item,index) in couponList" :key="item.id" class="wrap__list">
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
					<view v-if="item.status == '0'" @click="checkCoupon(item)">查看劵码</view>
					<view>删除订单</view>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
	const db = uniCloud.database()

	export default {
		data() {
			return {
				current: 0,
				storeName: '',
				tabsList: [
					{ name: '自取订单' },
					{ name: '外卖订单' },
					{ name: '劵码订单' }
				],
				pickupList: [],
				takeoutList: [],
				couponList: [],
				loading: false
			}
		},
		onShow() {
			this.loadStoreSettings()
			this.loadOrders()
		},
		methods: {
			async loadStoreSettings() {
				try {
					const db = uniCloud.database()
					const res = await db.collection('store_settings').get()
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
				uni.showLoading({ title: '加载中...' })
				try {
					// 仅演示，实际项目可能需要根据用户ID (user_id) 过滤
					const res = await db.collection('order').orderBy('createTime', 'desc').get()
					const allOrders = res.result.data || []
					
					this.pickupList = allOrders.filter(o => o.type === 'takein')
					this.takeoutList = allOrders.filter(o => o.type === 'takeout')
					this.couponList = [] // 优惠券订单逻辑如果有可在此处理
					
				} catch (e) {
					console.error(e)
					uni.showToast({ title: '加载失败', icon: 'none' })
				} finally {
					this.loading = false
					uni.hideLoading()
				}
			},
			orderDetail(item) {
				const type = this.current == 0 ? 'takein' : 'takeout'
				// 跳转到订单详情页面
				uni.navigateTo({
					url: `/subpackageOrder/order/order-detail?id=${item._id}&type=${type}`
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
</style>