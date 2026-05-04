<template>
	<view class="wrap">
		<!-- 自定义导航栏 -->
		<u-navbar :background="background" :border-bottom="false" :is-back="false"></u-navbar>

		<!-- 用户信息 -->
		<view class="wrap__userinfo">
			<view class="wrap__userinfo__login" @click="handleUserInfo">
				<view>尊敬的顾客，</view>
				<view>{{ userinfo.nickname || '点击这里授权登录' }}</view>
			</view>

			<view @click="handleUserInfo">
				<u-avatar :src="displayAvatar" size="77"></u-avatar>
			</view>
		</view>

		<view class="wrap__myasset">
			<view class="wrap__myasset__points">
				<view>会员积分</view>
				<view>
					<text>{{ userinfo.points || 0 }}</text>
					<text>分</text>
				</view>
			</view>
			<view class="wrap__myasset__group"></view>
			<view class="wrap__myasset__coupon" @click="handleMyCoupon">
				<view>优惠券</view>
				<view>
					<text>0</text>
					<text>元</text>
				</view>
			</view>
		</view>

		<view class="wrap__cell">
			<u-cell-group :border="false">
				<u-cell-item v-for="(item, index) in dynamicMenus" :key="index"
					:title="item.title" hover-class="none" :title-style="titleStyle" :border-bottom="false"
					@click="handleDynamicMenu(item.page_path)">
				</u-cell-item>
				
				<u-cell-item v-if="userinfo.nickname" title="退出登录" hover-class="none" :title-style="titleStyle" :border-bottom="false"
					@click="logout"></u-cell-item>
			</u-cell-group>
		</view>
	</view>
</template>

<script>
	// 定义订单状态常量，方便维护
	const ORDER_STATUS = {
		ALL: 0,
		UNPAID: 1,
		UNSHIPPED: 2,
		UNRECEIVED: 3,
		REFUND: 4
	};

	export default {
		data() {
			return {
				userinfo: {},
				displayAvatar: '/static/logo.jpg',
				dynamicMenus: [],
				background: {
					backgroundColor: '#F5F5F5'
				},
				titleStyle: {
					fontSize: '29rpx',
					color: '#333333'
				}
			}
		},
		onShow() {
			const userInfo = uni.getStorageSync('userInfo');
			if (userInfo) {
				this.userinfo = userInfo;
				this.resolveAvatar();
				this.syncLatestPoints();
			} else {
				this.userinfo = {};
				this.displayAvatar = '/static/logo.jpg';
			}
			this.loadDynamicMenus();
		},
		methods: {
			async resolveAvatar() {
				if (this.userinfo.avatar && this.userinfo.avatar.startsWith('cloud://')) {
					try {
						const res = await uniCloud.getTempFileURL({
							fileList: [this.userinfo.avatar]
						});
						if (res.fileList && res.fileList[0] && (res.fileList[0].tempFileURL || res.fileList[0].download_url)) {
							this.displayAvatar = res.fileList[0].tempFileURL || res.fileList[0].download_url;
						}
					} catch (e) {
						this.displayAvatar = '/static/logo.jpg';
					}
				} else {
					this.displayAvatar = this.userinfo.avatar || '/static/logo.jpg';
				}
			},
			async syncLatestPoints() {
				if (!this.userinfo._id) return;
				try {
					const db = uniCloud.database();
					const res = await db.collection('wx_users').doc(this.userinfo._id).get();
					if (res.result.data && res.result.data.length > 0) {
						this.userinfo.points = res.result.data[0].points || 0;
						// 更新本地缓存
						uni.setStorageSync('userInfo', this.userinfo);
					}
				} catch (e) {
					// 静默失败即可
				}
			},
			async loadDynamicMenus() {
				try {
					const db = uniCloud.database();
					const res = await db.collection('my_menus').where({ is_show: true }).orderBy('sort', 'asc').get();
					this.dynamicMenus = res.result.data || [];
				} catch (e) {
					console.error('加载菜单失败', e);
				}
			},
			handleDynamicMenu(path) {
				if (path) {
					uni.navigateTo({ url: path });
				} else {
					uni.showToast({ title: '敬请期待', icon: 'none' });
				}
			},
			handleAddress() {
				uni.navigateTo({
					url: `/subpackageMy/myAddress/address-manage?methods=my`
				});
			},

			handleUserInfo() {
				if (!this.userinfo.nickname) {
					uni.navigateTo({
						url: `/pages/login/login`
					});
				} else {
					// 已登录时可以跳转到个人资料设置页
					uni.navigateTo({
						url: `/subpackageMy/infoSet/set`
					});
				}
			},

			logout() {
				uni.showModal({
					title: '提示',
					content: '确定要退出登录吗？',
					success: (res) => {
						if (res.confirm) {
							uni.removeStorageSync('userInfo');
							this.userinfo = {};
							uni.showToast({ title: '已退出登录', icon: 'none' });
						}
					}
				});
			},

			handleMyOrder(status) {
				uni.navigateTo({
					url: `/subpackageMy/myOrder/my-order?status=${status}`
				});
			}
		}
	}
</script>

<style lang="scss" scoped>
	@import '@/common/scss/my/my.scss';
</style>