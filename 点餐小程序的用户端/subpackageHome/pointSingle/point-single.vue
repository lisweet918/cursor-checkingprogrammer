<template>
	<view class="container">
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
		</view>
		<view v-if="!loading && filterCategories.length === 0" class="empty-menu">
			<image src="/static/img/home/icon_shopping_bag.png" class="empty-menu__icon"></image>
			<view class="empty-menu__text">该模式下暂无可售商品</view>
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
					<view id="ads">
						<swiper class="ads1" :indicator-dots="true" :autoplay="true" :interval="3000" :duration="1000"
							circular>
							<swiper-item v-for="(ad, index) in ads1" :key="index">
								<image :src="ad" class="w-100" mode="widthFix"></image>
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

	export default {
		components: {
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
						products: filterProducts
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
						}
					}
				} catch (e) {
					console.error('Failed to load menu banners:', e);
				}
			},
			async loadStoreSettings() {
				try {
					const db = uniCloud.database();
					const res = await db.collection('store_settings').get();
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
				const index = this.cart.findIndex(item => {
					if (!product.is_single) {
						return (item.id == product.id) && (item.materials_text == product.materials_text)
					} else {
						return item.id === product.id
					}
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
					image: product.images[0].url,
					is_single: product.is_single,
					materials_text: product.materials_text || ''
				})
			},
			handleMinusFromCart(product) {
				let index
				if (product.is_single) {
					index = this.cart.findIndex(item => item.id == product.id)
				} else {
					index = this.cart.findIndex(item => (item.id == product.id) && (item.materials_text == product
						.materials_text))
				}
				this.cart[index].number -= 1
				if (this.cart[index].number <= 0) {
					this.cart.splice(index, 1)
				}
			},
			showProductDetailModal(product) {
				product.materials = product.materials || [];

				if (product.materials && product.materials.length > 0) {
					product.materials.forEach(group => {
						if (group.values && group.values.length > 0) {
							group.values.forEach((val, idx) => {
								if (idx === 0) {
									val.is_selected = 1;
								} else {
									val.is_selected = 0;
								}

								if (val.is_exclusive === undefined) {
									val.is_exclusive = 0;
								}
							});
						}
					});
				}

				this.product = product
				this.productModalVisible = true
			},
			handleAddToCartInModal(product) {
				const price = product.price;
				this.handleAddToCart(product)
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
			}
		}
	}
</script>

<style lang="scss">
	@import './index.scss';

	.container {
		background: #FFFDF7;
		color: #65483D;
	}

	.header {
		background: linear-gradient(180deg, #FFFDF7 0%, #EAF8FA 100%);
		border-bottom: 1rpx solid rgba(101, 72, 61, 0.08);

		.center {
			padding-top: 18rpx;
			padding-bottom: 18rpx;

			.store {
				.title {
					.address {
						color: #65483D;
						font-size: 34rpx;
						letter-spacing: 1rpx;
					}

					.business {
						margin-top: 5rpx;
						color: #9A7D70;
					}

					.companion-tip {
						align-self: flex-start;
						max-width: 100%;
						margin-top: 10rpx;
						padding: 5rpx 14rpx;
						border-radius: 18rpx;
						background: #F9DFDA;
						color: #815B49;
						font-size: 20rpx;
						line-height: 1.5;
						overflow: hidden;
						text-overflow: ellipsis;
						white-space: nowrap;
						box-sizing: border-box;
					}

					.table-tag {
						background: #FFFFFF;
						border: 1rpx solid #CDECF0;
						color: #65483D;
					}
				}

				.buttons {
					background: rgba(255, 255, 255, 0.85);
					border-color: #EADBD3;
					box-shadow: 0 4rpx 14rpx rgba(101, 72, 61, 0.08);

					.button {
						color: #815B49 !important;

						&.active {
							background: #815B49;
							color: #FFFFFF !important;
						}
					}
				}
			}
		}
	}

	.main {
		background: #FFFDF7;
	}

	.menu-bar {
		background: #F8EFEA;

		.wrapper .menu-item {
			color: #9A7D70;

			.image {
				border-radius: 14rpx;
			}

			&.active {
				background: #FFFDF7;
				border-left-color: #ECAEA4;
				color: #65483D;
				font-weight: 600 !important;
			}
		}
	}

	.product-section {
		background: #FFFDF7;

		.ads1 {
			margin: 16rpx 0 10rpx;
			border-radius: 24rpx;
			overflow: hidden;
			box-shadow: 0 8rpx 24rpx rgba(101, 72, 61, 0.08);
		}

		.products-list {
			.category-name {
				display: flex;
				align-items: center;
				color: #65483D;
				font-size: 28rpx;
				font-weight: 700;

				&::before {
					content: '';
					width: 8rpx;
					height: 28rpx;
					margin-right: 12rpx;
					border-radius: 8rpx;
					background: #F2B7AD;
				}
			}

			.product {
				box-sizing: border-box;
				margin-bottom: 20rpx;
				padding: 18rpx;
				border: 1rpx solid rgba(101, 72, 61, 0.08);
				border-radius: 24rpx;
				background: #FFFFFF;
				box-shadow: 0 8rpx 22rpx rgba(101, 72, 61, 0.06);

				.image {
					border-radius: 18rpx;
				}

				.content {
					.name {
						color: #65483D;
					}

					.sold {
						color: #A88E82;
					}

					.labels .label {
						border-radius: 10rpx;
					}

					.price .prices {
						color: #C9655B;
					}
				}
			}
		}
	}

	.empty-menu {
		background: #FFFDF7;

		&__text {
			color: #9A7D70;
		}

		&__switch {
			background: #815B49;
			box-shadow: 0 8rpx 20rpx rgba(129, 91, 73, 0.18);
		}
	}
</style>
