<template>
	<view class="container">
		<view v-if="!dataList.length" style="padding: 40rpx; text-align: center;">还没有收货地址，添加一个吧</view>
		<view v-for="(item,index) in dataList" :key="item.id" class="address-item" @click="chooseAddress(item)">
			<view class="address-info">
				{{ item.address }} {{item.house_number}}
			</view>
			<view class="address-bottom">
				<view class="address-user">
					<view>{{ item.name }}</view>
					<view>{{ item.phone }}</view>
				</view>
				<view class="address-actions">
					<view @click.stop="edit(item)">编辑</view>
					<view @click.stop="remove(item)">删除</view>
				</view>
			</view>
		</view>

		<view class="container__footer" @tap="add">
			+ 添加地址
		</view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				dataList: [], storageKey: ''
			}
		},
		onShow() {
			const user = uni.getStorageSync('userInfo') || {}
			this.storageKey = 'addresses:' + (user.openid || 'guest')
			this.dataList = uni.getStorageSync(this.storageKey) || []
		},
		methods: {
			edit(item) { uni.navigateTo({ url: '/subpackageMy/myAddress/add-address?id=' + encodeURIComponent(item.id) }) },
			remove(item) {
				uni.showModal({ title: '删除地址', content: '确定删除这个地址吗？', success: res => {
					if (!res.confirm) return
					this.dataList = this.dataList.filter(a => a.id !== item.id)
					uni.setStorageSync(this.storageKey, this.dataList)
					if (this.$store.state.addressInfo.id === item.id) this.$store.commit('SET_ADDRESS', {})
				} })
			},
			add() {
				uni.navigateTo({
					url: `/subpackageMy/myAddress/add-address`
				})
			},
			chooseAddress(item) {
				this.$store.commit('SET_ADDRESS', { ...item });
				uni.navigateBack();
			}
		}
	}
</script>

<style lang="scss" scoped>
	.address-item {
		margin: 0 20rpx 20rpx 20rpx;
		padding: 20rpx;
		background-color: #fff;
		border-radius: 8rpx;
		margin-top: 20rpx;

		.address-info {
			color: #333333;
			font-size: 30rpx;
			font-weight: bold;
			margin-bottom: 20rpx;
		}

		.address-bottom {
			display: flex;
			justify-content: space-between;
			align-items: center;
		}

		.address-user {
			display: flex;
			align-items: center;
			font-size: 24rpx;
			color: $u-type-info;

			view:nth-child(1) {
				margin-right: 20rpx;
			}
		}

		.address-actions {
			display: flex;
			align-items: center;
			font-size: 24rpx;

			view:nth-child(1) {
				padding-right: 15rpx;
				margin-right: 15rpx;
				border-right: 1px solid $u-type-info;
			}
		}
	}

	.container__footer {
		padding: 30rpx;
		position: fixed;
		bottom: 30rpx;
		left: 0;
		right: 0;
		width: 80%;
		margin: 0 auto;
		border-radius: 18rpx;
		text-align: center;
		padding: 30rpx 0;
		background-color: #0A3D28;
		color: white;
		font-size: 30rpx;
	}
</style>
