<template>
	<view class="wrap glass-detail">
		<view v-if="type && orderData._id">
			<view class="meal-progress">
				<view class="meal-progress__art" aria-hidden="true"><yier-art :character="orderStatus === 3 ? 'pair' : 'peek'" :size="orderStatus === 3 ? 200 : 120" :radius="24" /></view>
				<view class="meal-progress__eyebrow">一二布布 · 开饭进度卡</view>
				<view class="meal-progress__title">
					{{ getStatusText(orderData.status) }}
				</view>
				<view class="meal-progress__caption">{{ progressCaption }}</view>
				<view v-if="orderData.type === 'takein' && orderData.torder && progressIndex >= 0" class="meal-progress__ticket">取餐号 · {{ orderData.torder }}</view>
				<view v-if="progressIndex >= 0" class="meal-progress__steps">
					<view v-for="(step, index) in ['已提交', '已接单', '已完成']" :key="index" class="meal-progress__step" :class="{ 'meal-progress__step--done': index <= progressIndex }"><view class="meal-progress__dot">{{ index < progressIndex ? '✓' : index + 1 }}</view><text>{{ step }}</text></view>
				</view>
			</view>

			<view class="wrap__list">
				<view class="wrap__list__title">商品信息</view>
				<view class="wrap__list__shopinfo" v-for="(item,index) in orderData.commodity_list" :key="index">
					<view class="wrap__list__shopinfo__left">
						<view class="wrap__list__shopinfo__left__image">
							<u-image :src="item.image" width="180" height="140" border-radius="8"></u-image>
						</view>
						<view class="wrap__list__shopinfo__left__desc">
							<view>
								<view class="wrap__list__shopinfo__left__desc__shopname">{{item.name}}</view>
								<view class="wrap__list__shopinfo__left__desc__content" v-if="item.materials_text">
									{{item.materials_text}}
								</view>
							</view>
							<view class="wrap__list__shopinfo__left__desc__price">
								<text>￥</text>
								<text>{{item.price}}</text>
							</view>
						</view>
					</view>
					<view class="wrap__list__shopinfo__right">x{{item.number}}</view>
				</view>
				<view class="wrap__fee" v-if="orderData.packing_fee > 0 || orderData.delivery_fee > 0 || orderData.coupon_deduct > 0">
					<view class="wrap__fee__row">
						<text>商品小计</text>
						<text>￥{{ orderData.goods_amount != null ? orderData.goods_amount : orderData.price }}</text>
					</view>
					<view class="wrap__fee__row" v-if="orderData.packing_fee > 0">
						<text>打包费</text>
						<text>￥{{ orderData.packing_fee }}</text>
					</view>
					<view class="wrap__fee__row" v-if="orderData.type == 'takeout'">
						<text>配送费</text>
						<text>{{ orderData.delivery_fee > 0 ? '￥' + orderData.delivery_fee : '免配送费' }}</text>
					</view>
					<view class="wrap__fee__row" v-if="orderData.coupon_deduct > 0">
						<text>优惠券抵扣</text>
						<text style="color:#FF362D;">-￥{{ orderData.coupon_deduct }}</text>
					</view>
				</view>
				<view class="wrap__list__prices">
					共{{orderData.shop_num}}件商品，合计：
					<text>￥</text>
					<text>{{orderData.price}}</text>
				</view>
			</view>

			<view class="wrap__orderinfo">
				<view class="wrap__orderinfo__title">订单信息</view>
				<view v-if="type == 'takein' && orderData.tableNumber" class="wrap__orderinfo__cell">
					<view>桌号</view>
					<view>{{ orderData.tableNumber }}{{ orderData.diningCount ? '（' + orderData.diningCount + '人就餐）' : '' }}</view>
				</view>
				<view v-if="type == 'takeout'">
					<view class="wrap__orderinfo__cell">
						<view>收货人/联系方式</view>
						<view>{{orderData.name}}/{{orderData.phone}}</view>
					</view>
					<view class="wrap__orderinfo__cell">
						<view>配送地址</view>
						<view>{{orderData.address}} {{orderData.house_number}}</view>
					</view>
				</view>
				<view class="wrap__orderinfo__cell">
					<view>备注</view>
					<view>{{orderData.remark ? orderData.remark : '无'}}</view>
				</view>
				<view class="wrap__orderinfo__cell">
					<view>订单号</view>
					<view>{{orderData.out_trade_no}}</view>
				</view>
				<view class="wrap__orderinfo__cell">
					<view>交易单号</view>
					<view>{{orderData.transaction_id}}</view>
				</view>
				<view class="wrap__orderinfo__cell">
					<view>支付时间</view>
					<view>{{orderData.payment_time_text}}</view>
				</view>
			</view>

			<!-- 底部按钮 -->
			<view class="wrap__bottom">
				<button class="share-btn" open-type="share">分享订单</button>
				<view @click="moreOrder">再来一单</view>
			</view>

			<!-- 间隔槽 -->
			<u-gap height="130"></u-gap>
		</view>
	</view>
</template>

<script>
import { userDatabase } from '@/common/user-api.js'
import YierArt from '@/components/yier-art/yier-art.vue'
	const db = userDatabase()

	export default {
		components: { YierArt },
		computed: {
			orderStatus() { const value = this.orderData.status; return value == null || value === '' ? -1 : Number(value) },
			progressIndex() { return [0, 1, 3].indexOf(this.orderStatus) },
			progressCaption() {
				return { 0: '餐单已递出，等小厨房接单呀', 1: '小厨房已接单，请留意后续状态', 2: '这次的餐单先收好，下次再一起开饭', 3: '这一餐圆满收尾，好好吃饭的一天 ♡' }[this.orderStatus] || '请以订单最新状态为准';
			}
		},
		data() {
			return {
				type: '',
				orderId: '',
				orderData: {}
			}
		},
		onLoad(param) {
			this.type = param.type;
			this.orderId = param.id;
			if (this.orderId) {
				this.loadOrderDetail()
			}
		},
		onShareAppMessage() {
			return {
				title: '我的点餐订单',
				path: `/subpackageOrder/order/order-detail?id=${this.orderId}&type=${this.type}`,
			}
		},
		methods: {
			getStatusText(status) {
				const s = status == null || status === '' ? -1 : Number(status);
				switch (s) {
					case 0: return '待接单';
					case 1: return '已接单';
					case 2: return '已退款';
					case 3: return '已完成';
					default: return '状态更新中';
				}
			},
			async loadOrderDetail() {
				uni.showLoading({ title: '加载中...' })
				try {
					const res = await db.collection('order').doc(this.orderId).get()
					if (res.result.data && res.result.data.length > 0) {
						const data = res.result.data[0]
						const userInfo = uni.getStorageSync('userInfo') || {}
						const isAdmin = false
						
						// 权限校验：如果订单被隐藏，或者非本人/非管理员访问
						// 注意：is_show !== false 表示默认显示
						if (data.is_show === false && !isAdmin) {
							uni.showModal({
								title: '提示',
								content: '该订单已被管理员隐藏',
								showCancel: false,
								success: () => uni.navigateBack()
							})
							return
						}
						
						if (!isAdmin && data.user_id && data.user_id !== userInfo.openid) {
							uni.showModal({
								title: '权限提示',
								content: '您无权查看此订单',
								showCancel: false,
								success: () => uni.navigateBack()
							})
							return
						}
						
						this.orderData = data
					} else {
						uni.showToast({ title: '订单不存在', icon: 'none' })
					}
				} catch (e) {
					console.error('Failed to load order:', e)
					uni.showToast({ title: '加载失败', icon: 'none' })
				} finally {
					uni.hideLoading()
				}
			},
			moreOrder() {
				const cart = (this.orderData.commodity_list || []).map(c => ({
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
					uni.switchTab({ url: '/pages/home/home' })
					return
				}
				uni.setStorageSync('cart', cart)
				this.$store.commit('SET_ORDER_TYPE', this.orderData.type || 'takein')
				uni.navigateTo({ url: '/subpackageHome/setTlement/pay' })
			}
		}
	}
</script>

<style lang="scss" scoped>
	.wrap {

		&__takein {
			background-color: white;
			margin: 20rpx 20rpx 0 20rpx;
			padding: 20rpx;
			text-align: center;
			border-radius: 18rpx;

			view:nth-child(1) {
				font-size: 38rpx;
				color: #333;
				font-weight: bold;
			}

			view:nth-child(2) {
				font-size: 24rpx;
				color: $u-type-info;
				margin-top: 10rpx;
			}
		}

		&__takeout {
			background-color: white;
			margin: 20rpx 20rpx 0 20rpx;
			padding: 20rpx;
			border-radius: 18rpx;

			&__title {
				font-size: 38rpx;
				color: #333;
				font-weight: bold;
			}

			&__person {
				display: flex;
				justify-content: space-between;
				align-items: center;
				margin: 20rpx 0;

				view:nth-child(1) {
					font-size: 24rpx;
					color: #333;
				}

				view:nth-child(2) {
					background-color: #0A3D28;
					color: white;
					border-radius: 30rpx;
					padding: 5rpx 20rpx;
					font-size: 20rpx;
				}
			}

			&__liveshooting {
				display: flex;
				justify-content: space-between;
				align-items: flex-start;

				view:nth-child(1) {
					font-size: 24rpx;
					color: #333;
				}
			}
		}

		&__list {
			margin: 20rpx 20rpx 0 20rpx;
			background-color: white;
			border-radius: 18rpx;
			padding: 20rpx;

			&__title {
				font-size: 30rpx;
				color: #333;
				font-weight: bold;
			}

			&__shopinfo {
				width: 100%;
				display: flex;
				justify-content: space-between;
				align-items: flex-end;
				margin: 20rpx 0;

				&__left {
					display: flex;

					&__image {
						margin-right: 20rpx;
					}

					&__desc {
						display: flex;
						flex-direction: column;
						justify-content: space-around;

						&__shopname {
							font-weight: bold;
							color: #333;
							font-size: 28rpx;
						}

						&__content {
							font-size: 20rpx;
							color: $u-type-info;
							margin-top: 8rpx;
						}

						&__price {
							display: flex;
							align-items: baseline;
							font-weight: bold;
							color: #333;
							margin-top: 20rpx;

							text:nth-child(1) {
								font-size: 20rpx;
								margin-right: 5rpx;
							}

							text:nth-child(2) {
								font-size: 30rpx;
							}
						}
					}
				}

				&__right {
					font-size: 24rpx;
					color: $u-type-info;
				}
			}

			&__prices {
				display: flex;
				justify-content: flex-end;
				font-size: 24rpx;
				color: #333333;
				align-items: baseline;
				margin-bottom: 20rpx;

				text {
					color: #FF362D;
					font-weight: bold;
				}

				text:nth-child(1) {
					font-size: 20rpx;
					margin-right: 5rpx;
				}

				text:nth-child(2) {
					font-size: 30rpx;
				}
			}
		}

		&__fee {
			border-top: 1rpx solid #f0f0f0;
			padding: 20rpx 0;
			margin-bottom: 10rpx;

			&__row {
				display: flex;
				justify-content: space-between;
				font-size: 24rpx;
				color: #666;
				margin-top: 14rpx;

				&:first-child {
					margin-top: 0;
				}
			}
		}

		&__orderinfo {
			margin: 20rpx 20rpx 0 20rpx;
			background-color: white;
			border-radius: 18rpx;
			padding: 20rpx;

			&__title {
				font-size: 30rpx;
				color: #333;
				font-weight: bold;
			}

			&__cell {
				display: flex;
				justify-content: space-between;
				align-items: center;
				margin-top: 30rpx;
				width: 100%;

				view:nth-child(1) {
					color: $u-type-info;
					width: 32%;
				}

				view:nth-child(2) {
					color: #333;
					width: 68%;
					text-align: right;
				}
			}
		}

		&__bottom {
			background-color: white;
			display: flex;
			justify-content: flex-end;
			align-items: center;
			padding: 20rpx 20rpx;
			position: fixed;
			bottom: 0;
			left: 0;
			width: 100%;
			box-shadow: 0 -2rpx 10rpx rgba(0,0,0,0.05);

			view {
				width: 160rpx;
				text-align: center;
				border: 1px solid $u-type-info;
				color: $u-type-info;
				border-radius: 30rpx;
				padding: 10rpx 0;
				font-size: 26rpx;
				margin-right: 20rpx;
			}
			.share-btn {
				background-color: transparent;
				border: 1px solid #0A3D28;
				color: #0A3D28;
				border-radius: 30rpx;
				padding: 0;
				margin: 0;
				margin-right: 20rpx;
				font-size: 26rpx;
				width: 160rpx;
				height: 56rpx;
				line-height: 54rpx;
			}
			.share-btn::after {
				border: none;
			}
		}
	}
</style>

<style lang="scss" scoped>
.meal-progress { background: #fffaf1; border: 2rpx solid #eedfca; border-radius: 28rpx; margin: 24rpx; padding: 30rpx 24rpx; text-align: center; color: #735139; }
.meal-progress__art { display: flex; justify-content: center; transform: rotate(-4deg); pointer-events: none; margin-bottom: 18rpx; }
.meal-progress__eyebrow { font-size: 20rpx; letter-spacing: 3rpx; color: #aa886c; }
.meal-progress__title { font-size: 38rpx; font-weight: 700; margin-top: 10rpx; }
.meal-progress__caption { margin-top: 12rpx; font-size: 24rpx; color: #9b7d63; line-height: 1.7; }
.meal-progress__ticket { display: inline-block; margin-top: 20rpx; padding: 12rpx 26rpx; background: #f3e5ce; border-radius: 14rpx; color: #795333; font-size: 27rpx; font-weight: 600; }
.meal-progress__steps { display: flex; margin-top: 28rpx; padding-top: 24rpx; border-top: 2rpx dashed #e8d8c0; }
.meal-progress__step { flex: 1; font-size: 22rpx; color: #b4a18e; }
.meal-progress__dot { display: flex; align-items: center; justify-content: center; width: 44rpx; height: 44rpx; border-radius: 50%; margin: 0 auto 12rpx; background: #efe7db; color: #af9c85; }
.meal-progress__step--done { color: #876142; }
.meal-progress__step--done .meal-progress__dot { background: #a87956; color: #fffaf1; }
@import '@/common/scss/liquid-glass-pages.scss';
@include glass-detail-page;
</style>
