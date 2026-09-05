<template>
	<view class="wrap">
		<view class="wrap__safe" :style="{ height: statusBarHeight + 'px' }"></view>
		<view class="wrap__brand">
			<view class="wrap__brand__mark">♡</view>
			<text>一二布布 · 饭饭日常</text>
		</view>
		<view class="wrap__greeting">
			<view class="wrap__greeting__title">一起好好吃饭呀 <text>♡</text></view>
			<view class="wrap__greeting__subtitle">把小日子，过得软乎乎的</view>
		</view>

		<view class="wrap__hero">
			<u-swiper :list="swiperList" height="470" border-radius="28" mode="none"></u-swiper>
			<view class="wrap__hero__label">今日份可爱已送达</view>
		</view>

		<view class="wrap__userinfo" @click="handleLogin">
			<view class="wrap__userinfo__left">
				<view class="wrap__userinfo__avatar">
					<u-image v-if="userinfo.avatar" :src="displayAvatar" width="68" height="68" border-radius="50%" lazy-load></u-image>
					<yier-art v-else character="yier" :size="68" />
				</view>
				<view class="wrap__userinfo__left__nickname">
					<view>{{userinfo.nickname || '你好呀，饭饭搭子'}}</view>
					<text>今天的快乐，从吃饱开始</text>
				</view>
			</view>
			<view class="wrap__userinfo__right" v-if="!userinfo.nickname">
				<view>去登录 ›</view>
			</view>
			<text v-else class="wrap__userinfo__heart">♡</text>
		</view>

		<view v-if="tableInfo.tableNumber" class="wrap__tablecard">
			<view class="wrap__tablecard__label">当前桌号</view>
			<view class="wrap__tablecard__value">{{ tableInfo.tableNumber }}</view>
			<view class="wrap__tablecard__desc">
				{{ tableInfo.diningCount ? `${tableInfo.diningCount}人就餐` : '请选择就餐人数后开始点餐' }}
			</view>
		</view>

		<view class="wrap__section"><text>今天想怎么吃？</text><text>HAPPY MEAL</text></view>
		<view class="wrap__menu">
			<view class="wrap__menu__box wrap__menu__box--dine" hover-class="wrap__menu__box--pressed" @click="handlePointSingle('takein')">
				<view class="wrap__menu__box__art"><yier-art character="yier" :size="104" /></view>
				<view class="wrap__menu__box__name">门店堂食</view>
				<view class="wrap__menu__box__desc">一二陪你，慢慢吃</view>
				<view class="wrap__menu__box__action">到店吃饭 <text>↗</text></view>
			</view>

			<view class="wrap__menu__box wrap__menu__box--delivery" hover-class="wrap__menu__box--pressed" @click="handlePointSingle('takeout')">
				<view class="wrap__menu__box__art"><yier-art character="bubu" :size="104" /></view>
				<view class="wrap__menu__box__name">外卖配送</view>
				<view class="wrap__menu__box__desc">布布陪你，宅家吃</view>
				<view class="wrap__menu__box__action">送到身边 <text>↗</text></view>
			</view>
		</view>

		<view class="wrap__bottom-background">
			<view class="wrap__bottom-background__note">♡ 和你一起，吃什么都开心 ♡</view>
			<yier-art character="pair" :size="630" />
		</view>


		<view v-if="tablePopupVisible" class="wrap__popup">
			<view class="wrap__popup__mask" @click="closeTablePopup"></view>
			<view class="wrap__popup__panel">
				<view class="wrap__popup__art"><yier-art character="pair" :size="210" /></view>
				<view class="wrap__popup__title">欢迎入座</view>
				<view class="wrap__popup__table">当前桌号 {{ currentTableNumber }}</view>
				<view class="wrap__popup__subtitle">请选择本桌就餐人数</view>
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
					<view class="wrap__popup__button wrap__popup__button--ghost" @click="closeTablePopup">稍后选择</view>
					<view class="wrap__popup__button" @click="confirmTableInfo">开始点餐</view>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
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
		components: { YierArt },
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
			...mapState(['tableInfo'])
		},
		onLoad(options) {
			this.statusBarHeight = uni.getSystemInfoSync().statusBarHeight || 20;
			this.initTableScene(options);
		},
		onShow() {
			// The original banner is local so it stays visible without network access.
			const userInfo = uni.getStorageSync('userInfo');
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
			handlePointSingle(type) {
				if (type === ORDER_TYPE.TAKE_IN && this.tableInfo.tableNumber && !this.tableInfo.diningCount) {
					this.tablePopupVisible = true;
					this.currentTableNumber = this.tableInfo.tableNumber;
					return;
				}

				this.SET_ORDER_TYPE(type);
				uni.navigateTo({
					url: `/subpackageHome/pointSingle/point-single`
				});
			},

			initTableScene(options = {}) {
				const tableNumber = this.getTableNumberFromOptions(options);
				if (!tableNumber) {
					return;
				}

				this.currentTableNumber = tableNumber;
				this.selectedDiningCount = this.tableInfo.tableNumber === tableNumber ? this.tableInfo.diningCount : 0;
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
					url: `/subpackageHome/pointSingle/point-single`
				});
			}
		}
	};
</script>

<style lang="scss">
	@import '@/common/scss/home/home.scss';
</style>
