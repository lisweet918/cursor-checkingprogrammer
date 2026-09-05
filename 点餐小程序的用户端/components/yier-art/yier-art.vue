<template>
	<view class="yier-art" :class="'yier-art--' + character" :style="frameStyle" aria-hidden="true">
		<image class="yier-art__image" src="/static/img/backgrounds/yier-bubu-original-bg.jpg"
			mode="scaleToFill" :style="imageStyle"></image>
	</view>
</template>

<script>
// Display windows reuse the original illustration without changing the source image.
export default {
	name: 'YierArt',
	props: {
		character: { type: String, default: 'pair' },
		size: { type: Number, default: 240 }
	},
	computed: {
		frameStyle() {
			// WeChat requires a serialized style string for computed style bindings.
			return `width:${this.size}rpx;height:${this.size * (this.character === 'pair' ? 0.5 : 1)}rpx;`;
		},
		imageStyle() {
			const scale = this.character === 'pair' ? this.size / 700 : this.size / 350;
			const left = this.character === 'bubu' ? -350 * scale : 0;
			return `width:${700 * scale}rpx;height:${1515 * scale}rpx;top:${-930 * scale}rpx;left:${left}rpx;`;
		}
	}
};
</script>

<style scoped lang="scss">
.yier-art {
	position: relative;
	flex-shrink: 0;
	overflow: hidden;
	background: #B2F1FA;
	border-radius: 28rpx;
	pointer-events: none;
	&--yier, &--bubu { border-radius: 50%; }
	&__image { position: absolute; max-width: none; }
}
</style>
