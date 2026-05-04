<template>
	<view class="wrap">

		<view v-if="swiperList.length">
			<u-swiper :list="swiperList" height="600" border-radius="0" mode="none"></u-swiper>
		</view>

		<view class="wrap__userinfo" @click="handleLogin">
			<view class="wrap__userinfo__left">
				<view>
					<u-image src="/static/logo.jpg" width="60" height="60" border-radius="50%" lazy-load></u-image>
				</view>
				<view class="wrap__userinfo__left__nickname">
					尊敬的用户
				</view>
			</view>
			<view class="wrap__userinfo__right">
				<view>注册/登录</view>
			</view>
		</view>

		<view v-if="tableInfo.tableNumber" class="wrap__tablecard">
			<view class="wrap__tablecard__label">当前桌号</view>
			<view class="wrap__tablecard__value">{{ tableInfo.tableNumber }}</view>
			<view class="wrap__tablecard__desc">
				{{ tableInfo.diningCount ? `${tableInfo.diningCount}人就餐` : '请选择就餐人数后开始点餐' }}
			</view>
		</view>

		<view class="wrap__menu">
			<view class="wrap__menu__box" @click="handlePointSingle('takein')">
				<view>
					<u-image src="/static/img/home/icon-1.jpg" width="180" height="180" lazy-load></u-image>
				</view>
				<view class="wrap__menu__box__name">门店堂食</view>
				<view class="wrap__menu__box__desc">提前点免排队</view>
			</view>

			<view class="wrap__menu__group"></view>

			<view class="wrap__menu__box" @click="handlePointSingle('takeout')">
				<view>
					<u-image src="/static/img/home/icon-2.jpg" width="180" height="180" lazy-load></u-image>
				</view>
				<view class="wrap__menu__box__name">外卖配送</view>
				<view class="wrap__menu__box__desc">外卖及时送达</view>
			</view>
		</view>

		<view class="wrap__pointsmall" @click="handleMyPromotion">
			<view>
				<u-image src="/static/img/home/promotion.png" width="180" height="180" lazy-load></u-image>
			</view>
			<view>
				<view class="wrap__pointsmall__mypoint">我的推广</view>
				<view class="wrap__pointsmall__pointdesc">
					推广奖励实时到账，支持余额提现
					<u-icon name="arrow-right" size="24"></u-icon>
				</view>
			</view>
		</view>

		<view v-if="tablePopupVisible" class="wrap__popup">
			<view class="wrap__popup__mask" @click="closeTablePopup"></view>
			<view class="wrap__popup__panel">
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
	import {
		mapMutations,
		mapState
	} from 'vuex';

	const ORDER_TYPE = {
		TAKE_IN: 'takein',
		TAKE_OUT: 'takeout'
	};

	export default {
		data() {
			return {
				userinfo: {},
				swiperList: [],
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
			this.initTableScene(options);
		},
		onShow() {
			this.loadBanners();
		},
		methods: {
			...mapMutations(['SET_ORDER_TYPE', 'SET_TABLE_INFO']),
			async loadBanners() {
				try {
					const db = uniCloud.database();
					const res = await db.collection('banner').where({ is_show: true }).orderBy('sort', 'asc').get();
					if (res.result.data && res.result.data.length > 0) {
						// 提取所有的 fileID
						const fileList = res.result.data.map(item => item.image).filter(Boolean);
						if (fileList.length > 0) {
							// 将 fileID 统一转换为真实的 https 网络图片地址
							const urlRes = await uniCloud.getTempFileURL({ fileList });
							
							this.swiperList = res.result.data.map((item, index) => {
								const fileInfo = urlRes.fileList.find(f => f.fileID === item.image) || {};
								const realUrl = fileInfo.tempFileURL || fileInfo.download_url || item.image;
								return { image: realUrl };
							});
						}
					}
				} catch (e) {
					console.error('Failed to load banners:', e);
				}
			},
			handleLogin() {
				uni.navigateTo({
					url: `/pages/login/login`
				});
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
			handleMyPromotion() {
				uni.navigateTo({
					url: `/subpackageHome/pointsMall/points-mall`
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
