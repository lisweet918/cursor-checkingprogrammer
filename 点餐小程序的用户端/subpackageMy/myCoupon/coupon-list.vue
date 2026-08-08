<template>

	<view class="wrap">

		<view class="wrap__tabs">

			<u-tabs :list="tabsList" :is-scroll="false" v-model="current" @change="change" active-color="#0A3D28"

				bar-width="100" duration="0" inactive-color="#9A9A9A"></u-tabs>

		</view>



		<view class="wrap__banner" @click="claimNewbie">

			<view class="wrap__banner__left">

				<view class="wrap__banner__left__title">新人专享券</view>

				<view class="wrap__banner__left__desc">满20减5，首次可领</view>

			</view>

			<view class="wrap__banner__btn">立即领取</view>

		</view>



		<view class="wrap__list">

			<view v-for="(item, index) in currentList" :key="index" class="coupon"

				:class="{ 'coupon--disabled': current !== 0 }">

				<view class="coupon__amount">

					<view class="coupon__amount__num"><text>￥</text>{{ item.amount }}</view>

					<view class="coupon__amount__cond">满{{ item.threshold }}可用</view>

				</view>

				<view class="coupon__info">

					<view class="coupon__info__name">{{ item.name }}</view>

					<view class="coupon__info__time">有效期至 {{ formatDate(item.expire_time) }}</view>

				</view>

				<view class="coupon__tag">

					<text v-if="current === 0">可用</text>

					<text v-else-if="current === 1">已使用</text>

					<text v-else>已过期</text>

				</view>

			</view>



			<view v-if="!currentList.length" class="wrap__empty">

				<view class="wrap__empty__text">暂无{{ tabsList[current].name }}</view>

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

				tabsList: [

					{ name: '可使用' },

					{ name: '已使用' },

					{ name: '已过期' }

				],

				availableList: [],

				usedList: [],

				expiredList: []

			}

		},

		computed: {

			currentList() {

				if (this.current === 0) return this.availableList

				if (this.current === 1) return this.usedList

				return this.expiredList

			}

		},

		onShow() {

			this.loadCoupons()

		},

		methods: {

			change(index) {

				this.current = index

			},

			formatDate(ts) {

				if (!ts) return '长期有效'

				const d = new Date(Number(ts))

				if (isNaN(d.getTime())) return '长期有效'

				const pad = n => (n < 10 ? '0' + n : '' + n)

				return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

			},

			async loadCoupons() {

				const userInfo = uni.getStorageSync('userInfo')

				if (!userInfo || !userInfo.openid) {

					this.availableList = []

					this.usedList = []

					this.expiredList = []

					return

				}

				uni.showLoading({ title: '加载中...' })

				try {

					const res = await db.collection('user_coupons')

						.where(`user_id == "${userInfo.openid}"`)

						.orderBy('create_time', 'desc')

						.get()

					const all = res.result.data || []

					const now = Date.now()

					this.availableList = []

					this.usedList = []

					this.expiredList = []

					all.forEach(c => {

						if (c.status === 1) {

							this.usedList.push(c)

						} else if (c.expire_time && Number(c.expire_time) < now) {

							this.expiredList.push(c)

						} else {

							this.availableList.push(c)

						}

					})

				} catch (e) {

					console.error('加载优惠券失败', e)

					uni.showToast({ title: '加载失败', icon: 'none' })

				} finally {

					uni.hideLoading()

				}

			},

			async claimNewbie() {

				const userInfo = uni.getStorageSync('userInfo')

				if (!userInfo || !userInfo.openid) {

					uni.showToast({ title: '请先登录', icon: 'none' })

					setTimeout(() => uni.navigateTo({ url: '/pages/login/login' }), 800)

					return

				}

				uni.showLoading({ title: '领取中...' })

				try {

					const exist = await db.collection('user_coupons')

						.where(`user_id == "${userInfo.openid}" && source == "newbie"`)

						.count()

					if (exist.result.total > 0) {

						uni.hideLoading()

						uni.showToast({ title: '新人券已领取过', icon: 'none' })

						return

					}

					await db.collection('user_coupons').add({

						user_id: userInfo.openid,

						name: '新人专享券',

						threshold: 20,

						amount: 5,

						status: 0,

						source: 'newbie',

						create_time: Date.now(),

						expire_time: Date.now() + 30 * 24 * 60 * 60 * 1000

					})

					uni.hideLoading()

					uni.showToast({ title: '领取成功', icon: 'success' })

					this.current = 0

					this.loadCoupons()

				} catch (e) {

					uni.hideLoading()

					uni.showToast({ title: '领取失败', icon: 'none' })

				}

			}

		}

	}

</script>



<style lang="scss" scoped>

	.wrap {

		background-color: #F5F5F5;

		min-height: 100vh;



		&__tabs {

			position: relative;

			z-index: 9;

			background-color: #fff;

		}



		&__banner {

			display: flex;

			align-items: center;

			justify-content: space-between;

			margin: 24rpx 30rpx;

			padding: 30rpx 40rpx;

			border-radius: 18rpx;

			background: linear-gradient(135deg, #EE520C 0%, #ff8a3d 100%);

			color: #fff;



			&__left {

				&__title {

					font-size: 32rpx;

					font-weight: bold;

				}



				&__desc {

					font-size: 22rpx;

					opacity: 0.9;

					margin-top: 8rpx;

				}

			}



			&__btn {

				background-color: #fff;

				color: #EE520C;

				font-size: 24rpx;

				font-weight: bold;

				padding: 12rpx 28rpx;

				border-radius: 40rpx;

			}

		}



		&__list {

			padding: 0 30rpx;

		}



		&__empty {

			padding-top: 160rpx;

			text-align: center;



			&__text {

				font-size: 26rpx;

				color: #999;

			}

		}

	}



	.coupon {

		display: flex;

		align-items: center;

		background-color: #fff;

		border-radius: 18rpx;

		margin-bottom: 20rpx;

		overflow: hidden;



		&--disabled {

			opacity: 0.55;

		}



		&__amount {

			width: 220rpx;

			flex-shrink: 0;

			display: flex;

			flex-direction: column;

			align-items: center;

			justify-content: center;

			padding: 40rpx 0;

			color: #EE520C;

			border-right: 2rpx dashed #eee;



			&__num {

				font-size: 56rpx;

				font-weight: bold;



				text {

					font-size: 26rpx;

				}

			}



			&__cond {

				font-size: 22rpx;

				color: #999;

				margin-top: 8rpx;

			}

		}



		&__info {

			flex: 1;

			padding: 0 30rpx;



			&__name {

				font-size: 30rpx;

				color: #333;

				font-weight: bold;

			}



			&__time {

				font-size: 22rpx;

				color: #999;

				margin-top: 14rpx;

			}

		}



		&__tag {

			padding-right: 30rpx;

			font-size: 24rpx;

			color: #0A3D28;

		}

	}

</style>

