<template>
	<view class="wrap">
		<view class="wrap__box">
			<view class="wrap__box__top">
				<button class="avatar-button" open-type="chooseAvatar" @chooseavatar="onChooseAvatar" style="padding: 0; background: none; line-height: 0; border: none; overflow: visible;">
					<view class="wrap__box__top__span" style="display: block;">
						<u-avatar :src="displayAvatar" size="140"></u-avatar>
						<view class="edit-badge" style="position: absolute; bottom: 0; right: 0; background: #0A3D28; color: #fff; padding: 4rpx 10rpx; border-radius: 20rpx; font-size: 20rpx;">修改</view>
					</view>
				</button>
			</view>
			<u-cell-group :border="false" bg-color="#fff">
				<u-cell-item title="昵称" bg-color="#fff" :value="userInfo.nickname || '未登录'" :arrow="false"></u-cell-item>
				<u-cell-item title="会员积分" bg-color="#fff" :value="userInfo.points || 0" :arrow="false"></u-cell-item>
				<u-cell-item title="授权时间" bg-color="#fff" :arrow="false" :value="formatDate(userInfo.createTime)"></u-cell-item>
			</u-cell-group>
		</view>

		<view class="history-orders">
			<view class="history-orders__title">历史订单</view>
			<view v-if="orders.length === 0" class="history-orders__empty">暂无历史订单</view>
			<view v-else class="history-orders__list">
				<view class="order-card" v-for="order in orders" :key="order._id">
					<view class="order-card__header">
						<text class="order-card__time">{{ formatTime(order.createTime) }}</text>
						<text class="order-card__status">{{ getStatusText(order.status) }}</text>
					</view>
					<view class="order-card__content">
						<view class="order-card__info">
							<text class="order-card__type">{{ order.type === 'takein' ? '堂食' : '外卖' }}</text>
							<text class="order-card__price">¥{{ order.price }}</text>
						</view>
						<view class="order-card__items">
							<text class="order-item" v-for="(item, idx) in (order.commodity_list || [])" :key="idx">
								{{ item.name }} x{{ item.number }}
							</text>
						</view>
					</view>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				userInfo: {},
				orders: [],
				displayAvatar: '/static/logo.jpg'
			}
		},
		onShow() {
			this.userInfo = uni.getStorageSync('userInfo') || {}
			this.resolveAvatar()
			if (this.userInfo && this.userInfo.openid) {
				this.loadOrders()
			}
		},
		methods: {
			async resolveAvatar() {
				if (this.userInfo.avatar && this.userInfo.avatar.startsWith('cloud://')) {
					try {
						const res = await uniCloud.getTempFileURL({
							fileList: [this.userInfo.avatar]
						});
						if (res.fileList && res.fileList[0] && (res.fileList[0].tempFileURL || res.fileList[0].download_url)) {
							this.displayAvatar = res.fileList[0].tempFileURL || res.fileList[0].download_url;
						}
					} catch (e) {
						this.displayAvatar = '/static/logo.jpg';
					}
				} else {
					this.displayAvatar = this.userInfo.avatar || '/static/logo.jpg';
				}
			},
			async onChooseAvatar(e) {
				const { avatarUrl } = e.detail;
				uni.showLoading({ title: '上传中...' });
				try {
					// 1. 上传到云存储
					const uploadRes = await uniCloud.uploadFile({
						filePath: avatarUrl,
						cloudPath: `avatar/${this.userInfo.openid}_${Date.now()}.jpg`
					});
					const newAvatar = uploadRes.fileID;
					
					// 2. 更新数据库
					const db = uniCloud.database();
					await db.collection('wx_users').doc(this.userInfo._id).update({
						avatar: newAvatar
					});
					
					// 3. 更新本地缓存
					this.userInfo.avatar = newAvatar;
					uni.setStorageSync('userInfo', this.userInfo);
					this.resolveAvatar();
					
					uni.showToast({ title: '修改成功' });
				} catch (err) {
					console.error('上传失败', err);
					uni.showToast({ title: '上传失败', icon: 'none' });
				} finally {
					uni.hideLoading();
				}
			},
			async loadOrders() {
				try {
					const db = uniCloud.database()
					const res = await db.collection('order')
						.where({ user_id: this.userInfo.openid })
						.orderBy('createTime', 'desc')
						.limit(50)
						.get()
					this.orders = res.result.data || []
				} catch (err) {
					console.error('Failed to load orders', err)
				}
			},
			formatDate(timestamp) {
				if (!timestamp) return '-';
				const d = new Date(timestamp);
				return `${d.getFullYear()}-${(d.getMonth()+1).toString().padStart(2,'0')}-${d.getDate().toString().padStart(2,'0')}`;
			},
			formatTime(timestamp) {
				if (!timestamp) return '-';
				const d = new Date(timestamp);
				return `${d.getFullYear()}-${(d.getMonth()+1).toString().padStart(2,'0')}-${d.getDate().toString().padStart(2,'0')} ${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`;
			},
			getStatusText(status) {
				switch (status) {
					case 0: return '待接单';
					case 1: return '已接单';
					case 2: return '已退款';
					case 3: return '已完成';
					default: return '已支付';
				}
			}
		}
	}
</script>

<style lang="scss">
	@import '@/common/scss/my/set.scss';

	.history-orders {
		margin-top: 20rpx;
		background-color: #fff;
		padding: 20rpx;
		border-radius: 16rpx;
		
		&__title {
			font-size: 32rpx;
			font-weight: bold;
			margin-bottom: 20rpx;
			color: #333;
			border-left: 8rpx solid #19be6b;
			padding-left: 16rpx;
		}

		&__empty {
			text-align: center;
			color: #999;
			padding: 40rpx 0;
		}

		.order-card {
			padding: 20rpx 0;
			border-bottom: 1px solid #f5f5f5;

			&:last-child {
				border-bottom: none;
			}

			&__header {
				display: flex;
				justify-content: space-between;
				font-size: 24rpx;
				color: #999;
				margin-bottom: 10rpx;
			}

			&__status {
				color: #19be6b;
			}

			&__content {
				display: flex;
				flex-direction: column;
			}

			&__info {
				display: flex;
				justify-content: space-between;
				align-items: center;
				margin-bottom: 10rpx;
			}

			&__type {
				font-size: 28rpx;
				font-weight: bold;
				color: #333;
				background-color: #f3f4f6;
				padding: 4rpx 12rpx;
				border-radius: 8rpx;
			}

			&__price {
				font-size: 32rpx;
				color: #ff3b3b;
				font-weight: bold;
			}

			&__items {
				display: flex;
				flex-wrap: wrap;
				gap: 10rpx;
				font-size: 24rpx;
				color: #666;
			}
			
			.order-item {
				background-color: #f8f8f8;
				padding: 4rpx 10rpx;
				border-radius: 6rpx;
			}
		}
	}
</style>