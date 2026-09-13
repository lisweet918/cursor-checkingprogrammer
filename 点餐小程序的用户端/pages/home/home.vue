<template>
	<view class="wrap glass-home">
		<view class="home-glass-backdrop" aria-hidden="true"><image class="home-glass-backdrop__art" src="/static/img/backgrounds/yier-bubu-original-bg.jpg" mode="aspectFill" /></view>
		<glass-tabbar ref="glassTabbar" :selected="0" class="home-glass-nav" />
		<view class="wrap__safe" :style="{ height: statusBarHeight + 'px' }"></view>

		<!-- 顶部品牌与营业状态 -->
		<view class="wrap__topbar">
			<view class="wrap__topbar__brand">
				<view class="wrap__topbar__brand__badge">小食堂</view>
				<text class="wrap__topbar__brand__name">一二布布 · 饭饭日常</text>
			</view>
			<view class="wrap__topbar__status">
				<text class="wrap__topbar__status__dot"></text>
				<text>营业中</text>
			</view>
		</view>

		<!-- 绘本画卷轮播与欢迎条 -->
		<view class="wrap__hero">
			<view class="wrap__hero__swiper">
				<u-swiper :list="swiperList" height="440" border-radius="36" mode="none"></u-swiper>
			</view>
			<view class="wrap__hero__toast">
				<text class="wrap__hero__toast__emoji">🐾</text>
				<text class="wrap__hero__toast__text">嗷呜！今天想吃点什么好吃的？</text>
			</view>
		</view>

		<!-- 用户会员名牌卡片 -->
		<view class="wrap__usercard glass-motion glass-touch-user" :class="{ 'glass-motion--pressed': glassPressed('user') }" :style="glassStyles.user" @touchstart="glassStart('user', $event)" @touchmove="glassMove('user', $event)" @touchend="glassEnd('user')" @touchcancel="glassEnd('user')" @click="handleLogin">
			<view class="glass-shimmer" aria-hidden="true"></view>
			<view class="wrap__usercard__left">
				<view class="wrap__usercard__avatar">
					<u-image v-if="userinfo.avatar" :src="displayAvatar" width="76" height="76" border-radius="50%" lazy-load></u-image>
					<yier-art v-else character="bubu" :size="76" />
				</view>
				<view class="wrap__usercard__info">
					<view class="wrap__usercard__name">
						<text>{{ userinfo.nickname || '你好呀，新来的小吃货' }}</text>
						<text class="wrap__usercard__tag">{{ userinfo.nickname ? '超级饭搭子' : '未登录' }}</text>
					</view>
					<view class="wrap__usercard__sub">一二和布布随时准备为你开饭 ~</view>
				</view>
			</view>
			<view class="wrap__usercard__btn" v-if="!userinfo.nickname">
				<text>去登录</text>
				<u-icon name="arrow-right" size="20" color="#FFFFFF"></u-icon>
			</view>
			<view class="wrap__usercard__mascot" v-else>
				<yier-art character="pair" :size="72" radius="18" />
			</view>
		</view>

		<!-- 桌号立牌卡片（扫桌码后展示） -->
		<view v-if="displayTableNumber" class="wrap__tablecard">
			<view class="wrap__tablecard__left">
				<view class="wrap__tablecard__badge">🍽️</view>
				<view class="wrap__tablecard__text">
					<view class="wrap__tablecard__title">已入座 · <text class="wrap__tablecard__number">{{ displayTableNumber }}</text> 号桌</view>
					<view class="wrap__tablecard__desc">{{ (tableInfo && tableInfo.diningCount) ? `${tableInfo.diningCount} 位小吃货就餐 · 尽情享用吧` : '点击选择就餐人数' }}</view>
				</view>
			</view>
			<view class="wrap__tablecard__action" @tap="openTablePopup">修改</view>
		</view>

		<!-- 模式选择标题 -->
		<view class="wrap__section">
			<text class="wrap__section__title">开饭方式</text>
			<text class="wrap__section__subtitle">DINING MODE</text>
		</view>

		<!-- 堂食 & 外卖 软萌双子甜品卡片 -->
		<view class="wrap__menu">
			<!-- 堂食卡片：焦糖黄油吐司色系，一二在餐桌旁 -->
			<view class="wrap__menu__card wrap__menu__card--dine glass-motion glass-touch-dine" :class="{ 'glass-motion--pressed': glassPressed('dine') }" :style="glassStyles.dine" hover-class="none" @touchstart="glassStart('dine', $event)" @touchmove="glassMove('dine', $event)" @touchend="glassEnd('dine')" @touchcancel="glassEnd('dine')" @tap="handlePointSingle('takein')">
				<view class="glass-shimmer" aria-hidden="true"></view>
				<view class="wrap__menu__card__head">
					<view class="wrap__menu__card__pill">进店现做</view>
					<view class="wrap__menu__card__mascot">
						<yier-art character="yier" :size="108" />
					</view>
				</view>
				<view class="wrap__menu__card__body">
					<view class="wrap__menu__card__title">门店堂食</view>
					<view class="wrap__menu__card__desc">一二在餐桌旁等你开饭</view>
				</view>
				<view class="wrap__menu__card__foot">
					<text>入座点单</text>
					<view class="wrap__menu__card__arrow">→</view>
				</view>
			</view>

			<!-- 外卖卡片：草莓大福柔桃粉色系，布布外卖送达 -->
			<view class="wrap__menu__card wrap__menu__card--takeout glass-motion glass-touch-takeout" :class="{ 'glass-motion--pressed': glassPressed('takeout') }" :style="glassStyles.takeout" hover-class="none" @touchstart="glassStart('takeout', $event)" @touchmove="glassMove('takeout', $event)" @touchend="glassEnd('takeout')" @touchcancel="glassEnd('takeout')" @tap="handlePointSingle('takeout')">
				<view class="glass-shimmer" aria-hidden="true"></view>
				<view class="wrap__menu__card__head">
					<view class="wrap__menu__card__pill wrap__menu__card__pill--peach">热气配送</view>
					<view class="wrap__menu__card__mascot">
						<yier-art character="bubu" :size="108" />
					</view>
				</view>
				<view class="wrap__menu__card__body">
					<view class="wrap__menu__card__title">外卖自提</view>
					<view class="wrap__menu__card__desc">布布打包便当送身边</view>
				</view>
				<view class="wrap__menu__card__foot wrap__menu__card__foot--peach">
					<text>打包送到家</text>
					<view class="wrap__menu__card__arrow">→</view>
				</view>
			</view>
		</view>

		<!-- 轻盈治愈的页脚收尾 -->
		<view class="wrap__footer">
			<view class="wrap__footer__badge">
				<yier-art character="pair" :size="110" radius="22" />
				<view class="wrap__footer__info">
					<view class="wrap__footer__name">一二布布的美食小铺</view>
					<view class="wrap__footer__sub">好好吃饭，小尾巴摇摇 🐾</view>
				</view>
			</view>
		</view>

		<!-- 就餐人数选择弹窗 -->
		<view v-if="tablePopupVisible" class="wrap__popup">
			<view class="wrap__popup__mask" @click="closeTablePopup"></view>
			<view class="wrap__popup__panel">
				<view class="wrap__popup__mascot">
					<yier-art character="pair" :size="180" radius="24" />
				</view>
				<view class="wrap__popup__title">欢迎入座小餐桌</view>
				<view class="wrap__popup__table">当前桌号：<text>{{ currentTableNumber }}</text> 号</view>
				<view class="wrap__popup__subtitle">请选择本次就餐人数</view>
				<view class="wrap__popup__options">
					<view
						v-for="item in diningCountOptions"
						:key="item"
						class="wrap__popup__option"
						:class="{ 'wrap__popup__option--active': selectedDiningCount === item }"
						@click="selectDiningCount(item)"
					>
						{{ item }}人
					</view>
				</view>
				<view class="wrap__popup__actions">
					<view class="wrap__popup__button wrap__popup__button--ghost" @click="closeTablePopup">稍后选</view>
					<view class="wrap__popup__button" @click="confirmTableInfo">开饭点餐 ➜</view>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
	import glassMotion from '@/common/glass-motion.js';
	import GlassTabbar from '@/components/glass-tabbar/glass-tabbar.vue';
	import { refreshSessionUser } from '@/common/user-api.js';
	import YierArt from '@/components/yier-art/yier-art.vue';
	import {
		mapMutations,
		mapState
	} from 'vuex';

	const ORDER_TYPE = {
		TAKE_IN: 'takein',
		TAKE_OUT: 'takeout'
	};

	export default {
		components: { YierArt, GlassTabbar },
		mixins: [glassMotion],
		data() {
			return {
				statusBarHeight: 20,
				userinfo: {},
				swiperList: [{ image: '/static/img/home/yier-bubu-banner.jpg' }],
				displayAvatar: '/static/logo.jpg',
				tablePopupVisible: false,
				currentTableNumber: '',
				selectedDiningCount: 0,
				diningCountOptions: [1, 2, 3, 4, 5, 6, 7, 8]
			};
		},
		computed: {
			...mapState(['tableInfo']),
			displayTableNumber() {
				return (this.tableInfo && this.tableInfo.tableNumber) || this.currentTableNumber || '';
			}
		},
		onLoad(options) {
			this.statusBarHeight = uni.getSystemInfoSync().statusBarHeight || 20;
			this.initTableScene(options);
		},
		async onShow() {
			this.$nextTick(() => { if (this.$refs.glassTabbar) this.$refs.glassTabbar.reveal(); });
			// The original banner is local so it stays visible without network access.
			this.userinfo = {};
			this.displayAvatar = '/static/logo.jpg';
			const userInfo = await refreshSessionUser();
			this.userinfo = userInfo || {};
			this.resolveAvatar();
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
			...mapMutations(['SET_ORDER_TYPE', 'SET_TABLE_INFO']),
			handleLogin() {
				if (!this.userinfo.nickname) {
					uni.navigateTo({
						url: `/pages/login/login`
					});
				}
			},
			openTablePopup() {
				this.currentTableNumber = this.displayTableNumber;
				this.selectedDiningCount = (this.tableInfo && this.tableInfo.diningCount) || 0;
				this.tablePopupVisible = true;
			},
			handlePointSingle(type) {
				const activeTableNumber = (this.tableInfo && this.tableInfo.tableNumber) || this.currentTableNumber || '';
				const diningCount = (this.tableInfo && this.tableInfo.diningCount) || 0;

				if (type === ORDER_TYPE.TAKE_IN && activeTableNumber && !diningCount) {
					this.currentTableNumber = activeTableNumber;
					this.tablePopupVisible = true;
					return;
				}

				this.SET_ORDER_TYPE(type);
				uni.navigateTo({
					url: `/subpackageHome/pointSingle/point-single`,
					fail: (err) => {
						console.error('跳转点餐页失败:', err);
						uni.showToast({
							title: '跳转失败: ' + (err.errMsg || ''),
							icon: 'none'
						});
					}
				});
			},

			initTableScene(options = {}) {
				const tableNumber = this.getTableNumberFromOptions(options);
				if (!tableNumber) {
					return;
				}

				this.currentTableNumber = tableNumber;
				this.selectedDiningCount = (this.tableInfo && this.tableInfo.tableNumber === tableNumber) ? this.tableInfo.diningCount : 0;
				this.tablePopupVisible = true;
			},
			getTableNumberFromOptions(options = {}) {
				if (options.tableNumber) {
					return String(options.tableNumber).trim();
				}

				if (!options.scene) {
					return '';
				}

				const scene = decodeURIComponent(options.scene);
				const queryList = scene.split('&');
				const tableItem = queryList.find(item => item.indexOf('tableNumber=') === 0);

				if (!tableItem) {
					return '';
				}

				return tableItem.split('=')[1] || '';
			},
			selectDiningCount(count) {
				this.selectedDiningCount = count;
			},
			closeTablePopup() {
				this.tablePopupVisible = false;
			},
			confirmTableInfo() {
				if (!this.selectedDiningCount) {
					uni.showToast({
						title: '请选择就餐人数',
						icon: 'none'
					});
					return;
				}

				this.SET_TABLE_INFO({
					tableNumber: this.currentTableNumber,
					diningCount: this.selectedDiningCount
				});
				this.SET_ORDER_TYPE(ORDER_TYPE.TAKE_IN);
				this.tablePopupVisible = false;
				uni.navigateTo({
					url: `/subpackageHome/pointSingle/point-single`,
					fail: (err) => {
						console.error('跳转点餐页失败:', err);
						uni.showToast({
							title: '跳转失败: ' + (err.errMsg || ''),
							icon: 'none'
						});
					}
				});
			}
		}
	};
</script>

<style lang="scss">
	@import '@/common/scss/home/home.scss';
	@import '@/common/scss/liquid-glass-pages.scss';
	@include glass-home-page;
	@import '@/common/scss/glass-motion.scss';
	.glass-home .glass-motion { @include glass-touch-motion; }
	.glass-home .wrap__menu__card__head, .glass-home .wrap__menu__card__body, .glass-home .wrap__menu__card__foot,
	.glass-home .wrap__usercard__left, .glass-home .wrap__usercard__btn, .glass-home .wrap__usercard__mascot { position: relative; z-index: 1; }
</style>
