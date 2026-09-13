<template>
	<view class="container glass-menu">
		<u-navbar :border-bottom="false">
			<u-search placeholder="搜索" disabled @tap="showSearch = true" :show-action="false"></u-search>
		</u-navbar>
		<view class="header">
			<!-- 搜索栏 end -->
			<view class="center">
				<view class="store">
					<view class="title">
						<view class="address">{{ storeName }}</view>
						<view class="business">营业时间：{{ businessHours }}</view>
						<view class="companion-tip">一二布布陪你慢慢选，今天也要好好吃饭～</view>
						<view class="table-tag" v-if="orderType == 'takein' && tableInfo.tableNumber">
							<text>桌号 {{ tableInfo.tableNumber }}</text>
							<text v-if="tableInfo.diningCount"> · {{ tableInfo.diningCount }}人就餐</text>
						</view>
					</view>
					<view class="buttons">
						<button type="default" class="button" :class="{active: orderType == 'takein'}" plain
							hover-class="none" @tap="switchOrderType">
							自取
						</button>
						<button type="default" class="button" :class="{active: orderType == 'takeout'}" plain
							hover-class="none" @tap="switchOrderType">
							外卖
						</button>
					</view>
				</view>
			</view>
			<view v-if="!loading && !cart.length && filterCategories.length" class="cart-companion">
				<yier-feedback compact title="布布等你加点好吃的" description="购物车空空的，点菜旁的 ＋ 一起装满它" />
			</view>
		</view>
		<view v-if="loading" class="menu-companion">
			<yier-feedback kind="loading" title="美味正在集合" description="一二和布布陪你等一小会儿…" />
		</view>
		<view v-else-if="filterCategories.length === 0" class="empty-menu">
			<yier-feedback title="这边的餐桌还空着" description="该模式下暂无可售商品，换个方式看看吧" />
			<view class="empty-menu__switch" @tap="switchOrderType">切换{{ orderType == 'takein' ? '外卖' : '自取' }}试试</view>
		</view>
		<view v-else class="main">
			<scroll-view class="menu-bar" scroll-y scroll-with-animation>
				<view class="wrapper">
					<view class="menu-item" @tap="handleMenuSelected(category.id)"
						:class="{active: currentCategoryId == category.id}"
						v-for="(category, index) in filterCategories" :key="index">
						<image :src="category.category_image_url" class="image" mode="widthFix"
							v-if="category.category_image_url"></image>
						<view class="title">{{ category.name }}</view>
					</view>
				</view>
			</scroll-view>

			<scroll-view class="product-section" scroll-y scroll-with-animation :scroll-top="productsScrollTop"
				@scroll="productsScroll">
				<view class="wrapper">
					<view id="ads" v-if="ads1 && ads1.length > 0">
						<swiper class="ads1" :indicator-dots="ads1.length > 1" :autoplay="ads1.length > 1" :interval="3000" :duration="1000"
							circular :style="{ height: swiperHeight || '320rpx' }" @change="onSwiperChange">
							<swiper-item v-for="(ad, index) in ads1" :key="index">
								<image :src="ad" class="w-100 banner-image" mode="widthFix" @load="onBannerImgLoad($event, index)"></image>
							</swiper-item>
						</swiper>
					</view>

					<view class="products-list" v-for="(category, index) in filterCategories" :key="index"
						:id="`products-${category.id}`">
						<view class="category-name">{{ category.name }}</view>
						<view class="products">
							<view class="product" v-for="(product, key) in category.products" :key="key"
								@tap="showProductDetailModal(product)">
								<view>
									<image :src="product.images[0].url" mode="widthFix" class="image"></image>
								</view>
								<view class="content">
									<view class="name">{{ product.name }}</view>
									<view class="sold">已售{{ product.sold }}</view>
									<view class="labels" v-if="product.labels.length > 0">
										<view class="label"
											:style="{color: label.label_color, background: util.hexToRgba(label.label_color, 0.2)}"
											v-for="label in product.labels" :key="label.id">{{ label.name }}</view>
									</view>
									<view class="price">
										<view class="prices">
											<text>￥</text>
											<text>{{ product.price }}</text>
										</view>
										<actions :materials-btn="!product.is_single"
											@materials="showProductDetailModal(product)"
											:number="productCartNum(product.id)" @add="handleAddToCart(product)"
											@minus="handleMinusFromCart(product)" />
									</view>
								</view>
							</view>
						</view>
					</view>
				</view>
			</scroll-view>
		</view>
		<product-modal :product="product" :visible="productModalVisible" @cancel="closeProductDetailModal"
			@add-to-cart="handleAddToCartInModal" :order-type="orderType" />
		<cart-bar :cart="cart" @add="handleAddToCart" @minus="handleMinusFromCart" @clear="clearCart" @pay="pay" />
		<search :show="showSearch" :categories="filterCategories" @hide="showSearch=false"
			@choose="showProductDetailModal">
		</search>
	</view>
</template>

<script>
	import {
		mapState,
		mapMutations
	} from 'vuex'
	import Actions from '@/components/actions/actions.vue'
	import CartBar from '@/components/cartbar/cartbar.vue'
	import ProductModal from '@/components/product-modal/product-modal.vue'
	import cartPopup from '@/components/cart-popup/cart-popup.vue'
	import Search from '@/components/search/search.vue'
	import util from '@/common/util.js'
	import YierFeedback from '@/components/yier-feedback/yier-feedback.vue'
	import { prepareProduct } from '@/common/product-preferences.js'

	export default {
		components: {
			YierFeedback,
			Actions,
			CartBar,
			ProductModal,
			cartPopup,
			Search
		},
		data() {
			return {
				storeName: '',
				businessHours: '',
				util,
				categories: [],
				cart: [],
				product: {},
				currentCategoryId: 0,
				ads1: [],
				swiperHeight: '',
				bannerHeights: [],
				currentSwiperIndex: 0,
				productModalVisible: false,
				cartPopupShow: false,
				productsScrollTop: 0,
				showSearch: false,
				loading: true
			}
		},
		computed: {
			...mapState(['orderType', 'tableInfo']),
			productCartNum() {
				return id => this.cart.reduce((acc, cur) => {
					if (cur.id === id) {
						return acc += cur.number
					}
					return acc
				}, 0)
			},
			filterCategories() {
				return this.categories.map(category => {
					const filterProducts = category.products.filter(product => {
						if (this.orderType === 'takein') {
							return product.is_pickup === 1;
						} else {
							return product.is_takeout === 1;
						}
					});
					return {
						...category,
						products: filterProducts.map(product => prepareProduct(product, category.name))
					};
				}).filter(category => {
					return category.products.length > 0;
				});
			}
		},
		watch: {
			filterCategories: {
				handler(newVal) {
					if (newVal.length > 0) {
						const exists = newVal.some(cat => cat.id === this.currentCategoryId);
						if (!exists) {
							this.currentCategoryId = newVal[0].id;
							this.$nextTick(async () => {
								await this.calcSize();
								const targetCategory = this.categories.find(item => item.id === this
									.currentCategoryId);
								if (targetCategory && targetCategory.top !== undefined) {
									this.productsScrollTop = targetCategory.top;
								}
							});
						}
					}
				},
				immediate: true,
				deep: true
			}
		},
		async onLoad() {
			const res = await this.$api('menu');
			this.categories = res;
			this.loading = false;
			await this.$nextTick(async () => await this.calcSize())
			this.currentCategoryId = this.filterCategories.length && this.filterCategories[0].id
			this.loadAds();
			this.loadStoreSettings();
		},
		methods: {
			...mapMutations(['SET_ORDER_TYPE']),
			async loadAds() {
				try {
					const db = uniCloud.database();
					const res = await db.collection('menu_banner').where({ is_show: true }).orderBy('sort', 'asc').get();
					if (res.result.data && res.result.data.length > 0) {
						const fileList = res.result.data.map(item => item.image).filter(Boolean);
						if (fileList.length > 0) {
							const urlRes = await uniCloud.getTempFileURL({ fileList });
							this.ads1 = res.result.data.map(item => {
								const fileInfo = urlRes.fileList.find(f => f.fileID === item.image) || {};
								return fileInfo.tempFileURL || fileInfo.download_url || item.image;
							});
							this.$nextTick(async () => {
								await this.calcSize();
							});
						}
					}
				} catch (e) {
					console.error('Failed to load menu banners:', e);
				}
			},
			async loadStoreSettings() {
				try {
					const db = uniCloud.database();
					const res = await db.collection('store_settings').field('store_name,business_hours,packing_fee,delivery_fee,free_delivery_threshold,min_order_amount').get();
					if (res.result.data && res.result.data.length > 0) {
						this.storeName = res.result.data[0].store_name || '七香嫂包子铺';
						this.businessHours = res.result.data[0].business_hours || '早5:00 - 晚18:00';
					}
				} catch (e) {
					console.error('Failed to load store settings:', e);
				}
			},
			switchOrderType() {
				if (this.cart.length != 0) {
					uni.showModal({
						title: '温馨提示',
						content: '切换购买方式后，购物车中的商品将被清空，是否确认继续操作？',
						success: (res) => {
							if (res.confirm) {
								this.cart = [];
								if (this.cart.length == 0) {
									this.switchOrderChange();
									return;
								}
								this.$u.toast('切换失败')
							}
						}
					})
					return;
				}

				this.switchOrderChange();
			},
			switchOrderChange() {
				if (this.orderType === 'takein') {
					this.SET_ORDER_TYPE('takeout')
				} else {
					this.SET_ORDER_TYPE('takein')
				}

				this.$nextTick(async () => await this.calcSize())
			},
			handleAddToCart(product) {
				// A menu product must choose its options first; cart rows already have image/notes.
				if (!product.is_single && product.images && !product.materials_text) {
					this.showProductDetailModal(product)
					return
				}
				const index = this.cart.findIndex(item => {
					return item.id == product.id && (item.materials_text || '') === (product.materials_text || '')
				})

				if (index > -1) {
					this.cart[index].number += (product.number || 1)
					return
				}

				this.cart.push({
					id: product.id,
					cate_id: product.category_id,
					name: product.name,
					price: product.price,
					number: product.number || 1,
					image: product.image || (product.images && product.images[0] ? product.images[0].url : ''),
					is_single: product.is_single,
					materials_text: product.materials_text || ''
				})
			},
			handleMinusFromCart(product) {
				const index = this.cart.findIndex(item => item.id == product.id &&
					(item.materials_text || '') === (product.materials_text || ''))
				if (index < 0) return
				this.cart[index].number -= 1
				if (this.cart[index].number <= 0) {
					this.cart.splice(index, 1)
				}
			},
			showProductDetailModal(product) {
				const category = this.categories.find(item => item.id == product.category_id) || {}
				this.product = prepareProduct(product, category.name)
				this.productModalVisible = true
			},
			handleAddToCartInModal(product) {
				// Details may legitimately have no optional add-ons selected.
				this.handleAddToCart({ ...product, images: undefined, image: product.images && product.images[0] ? product.images[0].url : '' })
				this.closeProductDetailModal()
			},
			closeProductDetailModal() {
				this.productModalVisible = false
				this.product = {}
			},
			openCartDetailsPopup() {
				this.$refs['cartPopup'].open()
			},
			clearCart() {
				this.cart = []
			},
			handleMenuSelected(id) {
				this.$nextTick(() => {
					const targetCategory = this.categories.find(item => item.id === id)
					if (targetCategory && targetCategory.top !== undefined) {
						this.productsScrollTop = targetCategory.top
					}
					this.currentCategoryId = id
				})
			},
			productsScroll({
				detail
			}) {
				const {
					scrollTop
				} = detail
				let tabs = this.categories.filter(item => item.top <= scrollTop).reverse()
				if (tabs.length > 0) {
					this.currentCategoryId = tabs[0].id
				}
			},
			async calcSize() {
				if (this.filterCategories.length === 0) return;

				let h = 0
				const adsData = await new Promise(resolve => {
					uni.createSelectorQuery().in(this).select('#ads')
						.fields({
							size: true
						}, data => resolve(data))
						.exec()
				})
				if (adsData) {
					h += Math.floor(adsData.height)
				}

				for (const filterItem of this.filterCategories) {
					const originalItem = this.categories.find(item => item.id === filterItem.id)
					if (!originalItem) continue;

					const productData = await new Promise(resolve => {
						uni.createSelectorQuery().in(this).select(`#products-${filterItem.id}`)
							.fields({
								size: true
							}, data => resolve(data))
							.exec()
					})

					if (productData) {
						originalItem.top = h
						h += Math.floor(productData.height)
						originalItem.bottom = h
					}
				}
			},
			pay() {
				uni.setStorageSync('cart', this.cart);
				uni.navigateTo({
					url: '/subpackageHome/setTlement/pay'
				})
			},
			onBannerImgLoad(e, index) {
				const { width, height } = (e && e.detail) || {};
				if (!width || !height) return;
				const ratio = height / width;
				const rpxHeight = Math.round(540 * ratio) + 'rpx';

				uni.createSelectorQuery().in(this).select('#ads').boundingClientRect(rect => {
					const finalHeight = (rect && rect.width) ? Math.round(rect.width * ratio) + 'px' : rpxHeight;
					this.$set(this.bannerHeights, index, finalHeight);
					if (index === this.currentSwiperIndex || !this.swiperHeight) {
						this.swiperHeight = finalHeight;
						this.$nextTick(async () => {
							await this.calcSize();
						});
					}
				}).exec();

				if (!this.swiperHeight || index === this.currentSwiperIndex) {
					this.swiperHeight = rpxHeight;
					this.$set(this.bannerHeights, index, rpxHeight);
					this.$nextTick(async () => {
						await this.calcSize();
					});
				}
			},
			onSwiperChange(e) {
				const current = (e && e.detail && e.detail.current) || 0;
				this.currentSwiperIndex = current;
				if (this.bannerHeights[current]) {
					this.swiperHeight = this.bannerHeights[current];
					this.$nextTick(async () => {
						await this.calcSize();
					});
				}
			}
		}
	}
</script>

<style lang="scss">
	@import './index.scss';
	.cart-companion { margin: 0 24rpx 18rpx; pointer-events: none; }
	.menu-companion { margin: 30rpx 24rpx; }

	.container {
		background: #FCF9F2;
		color: #5A3F33;
	}

	.header {
		background: linear-gradient(180deg, #FFFFFF 0%, #FAF5ED 100%);
		border-bottom: 2rpx solid #F5ECE0;

		.center {
			padding-top: 18rpx;
			padding-bottom: 18rpx;

			.store {
				.title {
					.address {
						color: #5A3F33;
						font-size: 34rpx;
						font-weight: 800;
						letter-spacing: 1rpx;
					}

					.business {
						margin-top: 6rpx;
						color: #9C8276;
						font-size: 21rpx;
					}

					.companion-tip {
						align-self: flex-start;
						max-width: 100%;
						margin-top: 10rpx;
						padding: 6rpx 16rpx;
						border-radius: 18rpx;
						background: #FFF2DF;
						color: #9C661D;
						font-weight: 600;
						font-size: 21rpx;
						line-height: 1.5;
						overflow: hidden;
						text-overflow: ellipsis;
						white-space: nowrap;
						box-sizing: border-box;
					}

					.table-tag {
						background: #FFF7EB;
						border: 1rpx solid #F7E4C4;
						color: #6E4733;
						font-weight: 700;
						border-radius: 16rpx;
					}
				}

				.buttons {
					background: #FFFFFF;
					border-color: #F0E2D4;
					border-radius: 36rpx;
					box-shadow: 0 6rpx 16rpx rgba(125, 83, 60, 0.08);

					.button {
						color: #7D533C !important;
						font-weight: 600;

						&.active {
							background: #7D533C;
							color: #FFFDF9 !important;
							border-radius: 30rpx;
							font-weight: 700;
						}
					}
				}
			}
		}
	}

	.main {
		background: #FCF9F2;
	}

	.menu-bar {
		background: #F8F3EC;

		.wrapper .menu-item {
			color: #9E8579;
			font-weight: 500;

			.image {
				border-radius: 14rpx;
			}

			&.active {
				background: #FCF9F2;
				border-left-color: #F5A623;
				color: #5A3F33;
				font-weight: 800 !important;
			}
		}
	}

	.product-section {
		background: #FCF9F2;

		.ads1 {
			margin: 16rpx 0 10rpx;
			border-radius: 28rpx;
			overflow: hidden;
			box-shadow: 0 8rpx 24rpx rgba(125, 83, 60, 0.06);

			.banner-image {
				width: 100%;
				display: block;
			}
		}

		.products-list {
			.category-name {
				display: flex;
				align-items: center;
				color: #5A3F33;
				font-size: 28rpx;
				font-weight: 800;

				&::before {
					content: '';
					width: 8rpx;
					height: 28rpx;
					margin-right: 12rpx;
					border-radius: 8rpx;
					background: #F5A623;
				}
			}

			.product {
				box-sizing: border-box;
				margin-bottom: 20rpx;
				padding: 20rpx;
				border: 2rpx solid #FAF6F0;
				border-radius: 28rpx;
				background: #FFFFFF;
				box-shadow: 0 8rpx 24rpx rgba(125, 83, 60, 0.05);

				.image {
					border-radius: 20rpx;
				}

				.content {
					.name {
						color: #5A3F33;
						font-weight: 700;
					}

					.sold {
						color: #A89185;
					}

					.labels .label {
						border-radius: 12rpx;
						font-weight: 600;
					}

					.price .prices {
						color: #C25648;
						font-weight: 800;
					}
				}
			}
		}
	}

	.empty-menu {
		background: #FFFFFF;
		border-radius: 36rpx;
		margin: 30rpx;
		padding: 60rpx 40rpx;

		&__text {
			color: #9E8579;
		}

		&__switch {
			background: #7D533C;
			box-shadow: 0 8rpx 20rpx rgba(125, 83, 60, 0.22);
			border-radius: 36rpx;
			font-weight: 700;
			color: #FFFDF9;
		}
	}
	@import '@/common/scss/liquid-glass-pages.scss';
	@include glass-menu-page;
</style>
