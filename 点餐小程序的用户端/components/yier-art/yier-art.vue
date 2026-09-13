<template>
	<view class="yier-art" :class="'yier-art--' + character" :style="frameStyle" aria-hidden="true">
		<image class="yier-art__image" :src="character === 'peek' ? '/static/img/home/yier-bubu-banner.jpg' : '/static/img/backgrounds/yier-bubu-original-bg.jpg'"
			mode="scaleToFill" :style="imageStyle"></image>
	</view>
</template>

<script>
export default {
	name: 'YierArt',
	props: {
		character: { type: String, default: 'pair' },
		size: { type: Number, default: 240 },
		radius: { type: [Number, String], default: '' }
	},
	computed: {
		frameStyle() {
			const isPair = this.character === 'pair';
			const h = isPair ? this.size * 0.56 : this.size;
			const r = this.radius !== '' ? `${this.radius}rpx` : (isPair ? '32rpx' : '50%');
			return `width:${this.size}rpx;height:${h}rpx;border-radius:${r};`;
		},
		imageStyle() {
			// Reuse the original eager-expression artwork without changing the image.
			if (this.character === 'peek') return `width:${this.size}rpx;height:${this.size * 1022 / 981}rpx;top:0;left:0;`;
			const scale = this.character === 'pair' ? this.size / 700 : this.size / 350;
			// In original image: Left half is Bubu (white bear), Right half is Yier (brown bear)
			const left = this.character === 'yier' ? -350 * scale : 0;
			const top = this.character === 'pair' ? -910 * scale : -920 * scale;
			return `width:${700 * scale}rpx;height:${1515 * scale}rpx;top:${top}rpx;left:${left}rpx;`;
		}
	}
};
</script>

<style scoped lang="scss">
.yier-art {
	position: relative;
	flex-shrink: 0;
	overflow: hidden;
	background: #8ED6EF;
	pointer-events: none;
	box-shadow: 0 6rpx 16rpx rgba(125, 83, 60, 0.08);

	&--pair {
		border: 4rpx solid #FFFFFF;
	}

	&--yier,
	&--bubu,
	&--peek {
		border: 4rpx solid #FFFFFF;
	}

	&__image {
		position: absolute;
		max-width: none;
	}
}
</style>
