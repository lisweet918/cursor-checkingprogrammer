<template>
	<uni-popup ref="popup" type="bottom" @change="change">
		<view class="cart-popup">
			<view class="bag-handle" aria-hidden="true"></view>
			<view class="bag-greeting"><yier-art character="peek" :size="86" :radius="18" /><view class="bag-copy"><view class="bag-title">小熊餐袋 · 装好啦</view><view class="bag-caption">共 {{ totalCount }} 份喜欢的味道，口味都记在下面</view></view></view>
			<view class="header">
				<view class="order-type">
					<view class="font-weight-bold">已加购商品</view>
				</view>
				<view class="d-flex align-items-center" @tap="clear">
					<u-icon size="23" name="trash"></u-icon>
					<view>清空</view>
				</view>
			</view>
			<scroll-view scroll-y class="content">
				<view class="wrapper">
					<view class="list">
						<view class="item" v-for="(item, index) in cart" :key="index">
							<view class="left">
								<image :src="item.image" mode="widthFix" class="image"></image>
							</view>
							<view class="right">
								<view class="name-and-materials">
									<view class="name">{{ item.name }}</view>
									<view class="materials" v-if="item.materials_text">{{ item.materials_text }}</view>
								</view>
								<view class="price-and-actions">
									<view class="prices">
										<text>￥</text>
										<text>{{ item.price }}</text>
									</view>
									<actions :number="item.number" @add="add(item)" @minus="minus(item)"></actions>
								</view>
							</view>
						</view>
					</view>
				</view>
			</scroll-view>
		</view>
	</uni-popup>
</template>

<script>
	import uniPopup from '@/components/uni-popup/uni-popup.vue'
	import actions from '@/components/actions/actions.vue'
	import YierArt from '@/components/yier-art/yier-art.vue'

	export default {
		components: {
			YierArt,
			uniPopup,
			actions
		},
		props: {
			cart: {
				type: Array,
				default: () => []
			}
		},
		computed: {
			totalCount() { return this.cart.reduce((total, item) => total + Number(item.number || 0), 0) }
		},
		methods: {
			open() {
				this.$refs['popup'].open()
			},
			close() {
				this.$refs['popup'].close()
			},
			change({
				show
			}) {
				this.$emit('change', show)
			},
			add(item) {
				this.$emit('add', item)
			},
			minus(item) {
				this.$emit('minus', item)
			},
			clear() {
				this.$emit('clear')
			}
		}
	};
</script>

<style lang="scss" scoped>
	.cart-popup {
		background-color: $bg-color-white;
		padding-bottom: 100rpx;
	}

	.header {
		padding: 20rpx 30rpx;
		display: flex;
		justify-content: space-between;
		align-items: center;
		border-bottom: 1rpx solid #F5F5F5;
		font-size: $font-size-sm;
		color: $text-color-assist;

		.order-type {
			font-size: $font-size-sm;
			color: $text-color-base;
		}

		// .delete-btn {
		// 	width: 46rpx;
		// 	height: 46rpx;
		// }
	}

	.content {
		max-height: calc(100vh - 600rpx);

		.wrapper {
			width: 100%;
			height: 100%;
			padding: 0 30rpx;
		}

		.list {
			display: flex;
			flex-direction: column;
			margin-bottom: 30rpx;

			.item {
				display: flex;
				align-items: stretch;
				padding-top: 30rpx;
				position: relative;

				&:after {
					content: ' ';
					position: absolute;
					bottom: 0;
					left: 180rpx;
					right: 0;
					// border-bottom: 1rpx solid rgba($color: $border-color, $alpha: 0.6);
				}

				.left {
					flex-shrink: 0;
					display: flex;
					align-items: center;

					.image {
						width: 180rpx;
						height: 135rpx;
						margin-right: 20rpx;
						border-radius: 8rpx;
					}
				}

				.right {
					flex: 1;
					display: flex;
					flex-direction: column;
					justify-content: space-between;
					font-size: $font-size-medium;
					color: $text-color-base;

					.name-and-materials {
						display: flex;
						flex-direction: column;
						margin-bottom: 20rpx;

						.name {
							font-weight: bold;
						}

						.materials {
							font-size: $font-size-sm;
							color: $text-color-assist;
						}
					}

					.price-and-actions {
						display: flex;
						justify-content: space-between;

						.prices{
							display: flex;
							align-items: baseline;
							color: #FF362D;
							font-weight: bold;
							
							text:nth-child(1){
								font-size: 20rpx;
								margin-right: 5rpx;
							}
							
							text:nth-child(2){
								font-size: 30rpx;
							}
						}
					}
				}
			}
		}
	}
</style>

<style lang="scss" scoped>
.cart-popup { background: #fcf7ed; border-radius: 34rpx 34rpx 0 0; padding-bottom: calc(120rpx + env(safe-area-inset-bottom)); overflow: hidden; }
.bag-handle { width: 70rpx; height: 8rpx; margin: 18rpx auto; border-radius: 8rpx; background: #e3d0b8; pointer-events: none; }
.bag-greeting { display: flex; align-items: center; padding: 12rpx 30rpx 22rpx; }
.bag-copy { flex: 1; min-width: 0; margin-left: 20rpx; }
.bag-title { font-size: 30rpx; font-weight: 600; color: #745039; }
.bag-caption { margin-top: 8rpx; font-size: 22rpx; line-height: 1.6; color: #9f856f; }
.cart-popup .header { padding: 20rpx 30rpx; border-top: 2rpx dashed #e7d8c4; border-bottom: 0; color: #a58c76; }
.cart-popup .header .order-type { color: #87694f; }
.cart-popup .content { max-height: 45vh; }
.cart-popup .content .wrapper { padding: 0 24rpx; box-sizing: border-box; }
.cart-popup .content .list .item { background: #fffdf8; margin-bottom: 16rpx; padding: 22rpx; border: 2rpx solid #efe1cf; border-radius: 24rpx; }
.cart-popup .content .list .item .left .image { width: 110rpx; height: 110rpx; border-radius: 20rpx; }
.cart-popup .content .list .item .right { min-width: 0; color: #684c38; }
.cart-popup .content .list .item .right .name-and-materials .name { font-size: 26rpx; line-height: 1.5; word-break: break-all; }
.cart-popup .content .list .item .right .name-and-materials .materials { font-size: 22rpx; line-height: 1.6; color: #a28266; margin-top: 6rpx; word-break: break-all; }
.cart-popup .content .list .item .right .price-and-actions .prices { color: #b07555; }

@import '@/common/scss/liquid-glass.scss';

.cart-popup {
	@include glass-panel(.84, 18px);
}
.cart-popup .bag-handle {
	background: rgba(135, 110, 91, .32);
	box-shadow: 0 2rpx 0 rgba(255, 255, 255, .8);
}
.cart-popup .bag-title { color: #654d3f; }
.cart-popup .bag-caption { color: #867164; }
.cart-popup .header {
	border-top: 2rpx solid rgba(255, 255, 255, .78);
	color: #826f63;
}
.cart-popup .content .list .item {
	@include glass-inset;
	background: rgba(255, 253, 250, .87);
	border-color: rgba(255, 255, 255, .94);
}
.cart-popup .content .list .item .right .name-and-materials .materials {
	color: #856c5a;
}
</style>
