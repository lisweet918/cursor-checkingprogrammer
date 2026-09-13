<template>
	<view>
		<uni-transition glass :mode-class="['slide-bottom']" :show="!!cartNum" :styles="cartBarStyles">
			<view class="left">
				<view class="detail-action" @tap="details">
					<yier-art character="bubu" :size="80" />
					<view class="badge">{{ cartNum }}</view>
				</view>
				<view class="price">
					<text>￥</text>
					<text>{{ cartPrice }}</text>
				</view>
			</view>
			<button class="right" @tap="pay">去结算 ›</button>
		</uni-transition>
		<cart-popup :cart="cart" ref="cartPopup" @add="add" @minus="minus" @clear="clear"></cart-popup>
	</view>
</template>

<script>
	import uniTransition from "@/components/uni-transition/uni-transition.vue"
	import cartPopup from "@/components/cart-popup/cart-popup.vue"
	import YierArt from "@/components/yier-art/yier-art.vue"

	export default {
		name: "CartBar",
		components: {
			YierArt,
			uniTransition,
			cartPopup
		},
		props: {
			cart: {
				type: Array,
				default: () => []
			}
		},
		computed: {
			cartNum() {
				return this.cart.reduce((acc, cur) => acc + cur.number, 0)
			},
			cartPrice() {
				const originalTotal = this.cart.reduce((acc, cur) => acc + cur.number * cur.price, 0);
				const fixedTotal = Math.floor(originalTotal * 100) / 100;
				return fixedTotal;
			}
		},
		data() {
			return {
				cartBarStyles: {
					"position": "fixed",
					"bottom": 0,
					// #ifdef H5
					"bottom": "var(--window-bottom)",
					// #endif
					"width": "100%",
					"z-index": "995",
					"height": "calc(112rpx + env(safe-area-inset-bottom))",
					"padding-bottom": "env(safe-area-inset-bottom)",
					"display": "flex",
					"justify-content": "space-between",
					"align-items": "stretch",
				}
			}
		},
		methods: {
			details() {
				this.$refs["cartPopup"].open()
			},
			add(product) {
				this.$emit("add", {
					...product,
					number: 1
				})
			},
			minus(product) {
				this.$emit("minus", product)
			},
			clear() {
				this.$emit("clear")
			},
			pay() {
				this.$emit("pay")
			}
		},
		watch: {
			cartNum(val) {
				if (!val) {
					this.$refs["cartPopup"].close()
				}
			}
		}
	};
</script>

<style lang="scss" scoped>
	.left {
		display: flex;
		align-items: center;

		.detail-action {
			height: 100%;
			border-radius: 100%;
			background-color: #ffffff;
			box-shadow: 0 8rpx 20rpx rgba(125, 83, 60, 0.14);
			position: relative;
			display: flex;
			align-items: center;
			justify-content: center;
			width: 100rpx;
			height: 100rpx;
			margin-top: -20rpx;
			margin-right: 20rpx;
			margin-left: 20rpx;

			.badge {
				background-color: #E65A4B;
				font-size: 22rpx;
				color: #FFFFFF;
				line-height: 32rpx;
				min-width: 32rpx;
				height: 32rpx;
				padding: 0 8rpx;
				text-align: center;
				border-radius: 16rpx;
				position: absolute;
				right: -6rpx;
				top: -4rpx;
				font-weight: 700;
				border: 2rpx solid #FFFFFF;
			}
		}

		.price {
			display: flex;
			align-items: baseline;
			color: #C25648;
			font-weight: 800;

			text:nth-child(1) {
				font-size: 26rpx;
				margin-right: 5rpx;
			}

			text:nth-child(2) {
				font-size: 40rpx;
			}
		}
	}

	.right {
		display: flex;
		justify-content: center;
		align-items: center;
		padding: 0 46rpx;
		margin: 14rpx 24rpx 14rpx 0;
		border-radius: 44rpx !important;
		font-size: 29rpx;
		font-weight: 700;
		background-color: #7D533C;
		color: #FFFDF9;
		box-shadow: 0 6rpx 18rpx rgba(125, 83, 60, 0.24);
		transition: transform 0.15s ease;

		&:active {
			transform: scale(0.96);
		}
	}

	@import '@/common/scss/liquid-glass.scss';

	.left .detail-action {
		@include glass-inset;
		background: rgba(255, 255, 255, .8);
		box-shadow: inset 0 2rpx 0 rgba(255, 255, 255, 1), 0 8rpx 24rpx rgba(107, 85, 68, .14);
	}
	.left .detail-action .badge {
		background: linear-gradient(145deg, #e58f7d, #c86556);
		border-color: #fffaf4;
		box-shadow: inset 0 2rpx 0 rgba(255, 255, 255, .32);
	}
	.left .price { color: #ac614a; }
	.right {
		@include glass-button;
	}
</style>
