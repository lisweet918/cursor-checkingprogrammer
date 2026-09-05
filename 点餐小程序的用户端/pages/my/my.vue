<template>
	<view class="wrap">
		<view class="wrap__background">
			<view class="wrap__background__bubble wrap__background__bubble--one"></view>
			<view class="wrap__background__bubble wrap__background__bubble--two"></view>
			<view class="wrap__background__bubble wrap__background__bubble--three"></view>
		</view>

		<!-- 自定义导航栏：u-navbar 保留顶部安全区 -->
		<view class="wrap__nav">
			<u-navbar :background="background" :border-bottom="false" :is-back="false"></u-navbar>
		</view>

		<view class="wrap__content">
			<!-- 我的小窝主题头 -->
			<view class="wrap__hero">
				<view class="wrap__hero__copy">
					<view class="wrap__hero__eyebrow">YIER · BUBU</view>
					<view class="wrap__hero__title">我的快乐小窝</view>
					<view class="wrap__hero__subtitle">把好吃的和好心情都收进来</view>
				</view>
				<view class="wrap__hero__art">
					<yier-art character="pair" :size="250" />
				</view>
			</view>

			<!-- 用户会员卡 -->
			<view class="wrap__userinfo" @click="handleUserInfo">
				<view class="wrap__userinfo__avatar">
					<u-avatar :src="displayAvatar" size="108"></u-avatar>
					<view class="wrap__userinfo__avatar__badge">♥</view>
				</view>
				<view class="wrap__userinfo__main">
					<view class="wrap__userinfo__hello">{{ userinfo.nickname ? '欢迎回来' : '你好呀，新朋友' }}</view>
					<view class="wrap__userinfo__name">{{ userinfo.nickname || '点击登录快乐小窝' }}</view>
					<view class="wrap__userinfo__tag">
						<text class="wrap__userinfo__tag__dot"></text>
						<text>{{ userinfo.nickname ? '快乐小窝会员' : '登录后查看会员权益' }}</text>
					</view>
				</view>
				<view class="wrap__userinfo__arrow">
					<u-icon name="arrow-right" size="28" color="#815B49"></u-icon>
				</view>
			</view>

			<!-- 积分和优惠券小票 -->
			<view class="wrap__myasset">
				<view class="wrap__myasset__stamp wrap__myasset__stamp--left"></view>
				<view class="wrap__myasset__points">
					<view class="wrap__myasset__label">
						<view class="wrap__myasset__icon wrap__myasset__icon--points">★</view>
						<text>会员积分</text>
					</view>
					<view class="wrap__myasset__value">
						<text>{{ userinfo.points || 0 }}</text>
						<text>分</text>
					</view>
				</view>
				<view class="wrap__myasset__group">
					<view class="wrap__myasset__group__notch wrap__myasset__group__notch--top"></view>
					<view class="wrap__myasset__group__line"></view>
					<view class="wrap__myasset__group__notch wrap__myasset__group__notch--bottom"></view>
				</view>
				<view class="wrap__myasset__coupon" @click.stop="handleMyCoupon">
					<view class="wrap__myasset__label">
						<view class="wrap__myasset__icon wrap__myasset__icon--coupon">♥</view>
						<text>优惠券</text>
					</view>
					<view class="wrap__myasset__value">
						<text>{{ couponCount }}</text>
						<text>张</text>
					</view>
				</view>
				<view class="wrap__myasset__stamp wrap__myasset__stamp--right"></view>
			</view>

			<!-- 订单快捷入口 -->
			<view class="wrap__order">
				<view class="wrap__order__head">
					<view>
						<view class="wrap__order__head__title">我的订单</view>
						<view class="wrap__order__head__caption">ORDER NOTES</view>
					</view>
					<view class="wrap__order__head__more" @click="goOrderList">
						<text>全部订单</text>
						<u-icon name="arrow-right" size="24" color="#815B49"></u-icon>
					</view>
				</view>
				<view class="wrap__order__grid">
					<view class="wrap__order__grid__item" @click="goOrderList">
						<view class="wrap__order__grid__icon wrap__order__grid__icon--blue">
							<u-icon name="clock" size="42" color="#65483D"></u-icon>
						</view>
						<view>待接单</view>
					</view>
					<view class="wrap__order__grid__item" @click="goOrderList">
						<view class="wrap__order__grid__icon wrap__order__grid__icon--pink">
							<u-icon name="car" size="42" color="#65483D"></u-icon>
						</view>
						<view>进行中</view>
					</view>
					<view class="wrap__order__grid__item" @click="goOrderList">
						<view class="wrap__order__grid__icon wrap__order__grid__icon--cream">
							<u-icon name="checkmark-circle" size="42" color="#65483D"></u-icon>
						</view>
						<view>已完成</view>
					</view>
					<view class="wrap__order__grid__item" @click="handleMyCoupon">
						<view class="wrap__order__grid__icon wrap__order__grid__icon--brown">
							<u-icon name="coupon" size="42" color="#FFFDF7"></u-icon>
						</view>
						<view>优惠券</view>
					</view>
				</view>
			</view>

			<!-- 动态工具入口 -->
			<view class="wrap__cell" v-if="dynamicMenus.length || userinfo.nickname">
				<view class="wrap__cell__head">
					<text class="wrap__cell__head__title">小窝工具箱</text>
					<text class="wrap__cell__head__caption">MY TOOLS</text>
				</view>
				<view class="wrap__cell__item" v-for="(item, index) in dynamicMenus" :key="index"
					@click="handleDynamicMenu(item.page_path)">
					<view class="wrap__cell__item__icon">
						<u-icon name="grid" size="30" color="#815B49"></u-icon>
					</view>
					<text class="wrap__cell__item__title">{{ item.title }}</text>
					<u-icon name="arrow-right" size="25" color="#B99F94"></u-icon>
				</view>
				<view class="wrap__cell__item wrap__cell__item--logout" v-if="userinfo.nickname" @click="logout">
					<view class="wrap__cell__item__icon wrap__cell__item__icon--pink">
						<u-icon name="minus-circle" size="30" color="#815B49"></u-icon>
					</view>
					<text class="wrap__cell__item__title">退出登录</text>
					<u-icon name="arrow-right" size="25" color="#B99F94"></u-icon>
				</view>
			</view>

			<!-- 底部角色寄语 -->
			<view class="wrap__footer">
				<view class="wrap__footer__art">
					<yier-art character="pair" :size="300" />
				</view>
				<view class="wrap__footer__message">
					<text>今天也要和一二布布</text>
					<text>一起好好吃饭呀 ♥</text>
				</view>
				<view class="wrap__footer__dots">· · ·</view>
			</view>
		</view>
	</view>
</template>



<script>
	import YierArt from '@/components/yier-art/yier-art.vue';

		// 定义订单状态常量，方便维护

	const ORDER_STATUS = {

		ALL: 0,

		UNPAID: 1,

		UNSHIPPED: 2,

		UNRECEIVED: 3,

		REFUND: 4

	};



		export default {
			components: {
				YierArt
			},

			data() {

			return {

				userinfo: {},

				displayAvatar: '/static/logo.jpg',
				couponCount: 0,

				dynamicMenus: [],

					background: {

						backgroundColor: '#F5FCFC'

				},

				titleStyle: {

					fontSize: '29rpx',

						color: '#65483D'

				}

			}

		},

		onShow() {

			const userInfo = uni.getStorageSync('userInfo');

			if (userInfo) {

				this.userinfo = userInfo;

				this.resolveAvatar();

				this.syncLatestPoints();
				this.loadCouponCount();

			} else {

				this.userinfo = {};

				this.displayAvatar = '/static/logo.jpg';
				this.couponCount = 0;

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



			async loadCouponCount() {
				if (!this.userinfo.openid) { this.couponCount = 0; return; }
				try {
					const db = uniCloud.database();
					const now = Date.now();
					const res = await db.collection('user_coupons')
						.where(`user_id == "${this.userinfo.openid}" && status == 0 && expire_time > ${now}`)
						.count();
					this.couponCount = res.result.total || 0;
				} catch (e) {
					this.couponCount = 0;
				}
			},
			goOrderList() {
				uni.switchTab({ url: '/pages/order/order' });
			},
			handleMyCoupon() {
				uni.navigateTo({ url: '/subpackageMy/myCoupon/coupon-list' });
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
