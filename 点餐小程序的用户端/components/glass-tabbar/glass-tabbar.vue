<template>
	<view v-if="visible" class="glass-dock-space">
		<view class="glass-dock glass-motion glass-touch-dock" :class="{ 'glass-motion--pressed': glassPressed('dock') }" :style="glassStyles.dock" @touchstart="glassStart('dock', $event)" @touchmove="glassMove('dock', $event)" @touchend="glassEnd('dock')" @touchcancel="glassEnd('dock')" role="navigation" aria-label="主导航">
			<view class="glass-dock__lens" :style="{ transform: 'translateX(' + active * 100 + '%)' }" aria-hidden="true"><view class="glass-dock__bubble"></view></view>
			<view class="glass-shimmer" aria-hidden="true"></view>
			<button v-for="(tab, index) in tabs" :key="tab.url" class="glass-dock__tab" :class="{ 'glass-dock__tab--active': active === index }" :aria-label="tab.text + (active === index ? '，当前页面' : '')" hover-class="glass-dock__tab--pressed" @tap="go(index)">
				<image class="glass-dock__icon" :src="active === index ? tab.selectedIcon : tab.icon" mode="aspectFit" />
				<text class="glass-dock__label">{{ tab.text }}</text>
			</button>
		</view>
	</view>
</template>

<script>
import glassMotion from '@/common/glass-motion.js'
export default {
	name: 'GlassTabbar',
	mixins: [glassMotion],
	props: { selected: { type: Number, default: 0 } },
	data() {
		return {
			visible: false, active: this.selected, navigating: false,
			tabs: [
				{ text: '首页', url: '/pages/home/home', icon: '/static/tabbar/home.png', selectedIcon: '/static/tabbar/select-home.png' },
				{ text: '订单', url: '/pages/order/order', icon: '/static/tabbar/order.png', selectedIcon: '/static/tabbar/select-order.png' },
				{ text: '我的', url: '/pages/my/my', icon: '/static/tabbar/my.png', selectedIcon: '/static/tabbar/select-my.png' }
			]
		}
	},
	mounted() { this.reveal() },
	methods: {
		reveal() {
			this.glassReset()
			this.active = this.selected
			this.navigating = false
			// Keep native tab routes; only replace the visible navigation surface.
			uni.hideTabBar({ animation: false, success: () => { this.visible = true }, fail: () => { this.visible = false; uni.showTabBar({ animation: false }) } })
		},
		go(index) {
			if (this.navigating || index === this.selected || !this.tabs[index]) return
			this.active = index
			this.navigating = true
			uni.switchTab({
				url: this.tabs[index].url,
				fail: () => { this.active = this.selected; uni.showToast({ title: '暂时没打开，再试一次吧', icon: 'none' }) },
				complete: () => { this.navigating = false }
			})
		}
	}
}
</script>

<style lang="scss" scoped>
@import '@/common/scss/liquid-glass.scss';
.glass-dock-space { height: 0; }
.glass-dock {
	@include glass-clear;
	position: fixed; z-index: 900; left: 40rpx; right: 40rpx;
	bottom: calc(16rpx + env(safe-area-inset-bottom));
	height: 112rpx; border-radius: 70rpx; padding: 8rpx;
	display: flex; box-sizing: border-box;
}
.glass-dock__lens {
	position: absolute; left: 8rpx; top: 8rpx; bottom: 8rpx;
	width: calc((100% - 16rpx) / 3); border-radius: 56rpx;
	transition: transform .32s cubic-bezier(.2,.8,.25,1); pointer-events: none;
}
.glass-dock__bubble {
	width: 100%; height: 100%; border-radius: inherit;
	background: linear-gradient(140deg, rgba(255,255,255,.88), rgba(255,255,255,.23) 52%, rgba(222,241,238,.45));
	box-shadow: inset 0 2rpx 1rpx #fff, inset 0 -2rpx 3rpx rgba(98,125,120,.12), 0 3rpx 9rpx rgba(61,89,85,.08);
	transition: transform .58s cubic-bezier(.18, 1.4, .3, 1);
}
.glass-dock.glass-motion--pressed .glass-dock__bubble { transform: scaleX(1.025) scaleY(.96); }
.glass-dock__tab { position: relative; flex: 1; min-width: 0; margin: 0; padding: 10rpx 0 8rpx; display: flex; flex-direction: column; align-items: center; justify-content: center; border-radius: 56rpx; background: transparent; color: #6d7976; line-height: 1.3; transition: transform .2s ease; }
.glass-dock__tab::after { border: 0; }
.glass-dock__tab--active { color: #345f56; font-weight: 700; }
.glass-dock__tab--pressed { transform: scale(.91); }
.glass-dock__icon { width: 42rpx; height: 42rpx; margin-bottom: 5rpx; }
.glass-dock__label { font-size: 22rpx; }
@media (prefers-reduced-motion: reduce) { .glass-dock__lens, .glass-dock__tab { transition: none; } .glass-dock__tab--pressed { transform: none; } }
@import '@/common/scss/glass-motion.scss';
.glass-dock.glass-motion { @include glass-touch-motion; }
.glass-dock.glass-motion--pressed { transform: scale(.985); }
.glass-dock__tab { z-index: 1; }
.glass-dock__lens { transition: transform .58s cubic-bezier(.18, 1.4, .3, 1); }
@media (prefers-reduced-motion: reduce) {
	.glass-dock.glass-motion--pressed { transform: none; }
	.glass-dock__lens { transition: none; }
	.glass-dock.glass-motion--pressed .glass-dock__bubble { transform: none; }
	.glass-dock__bubble { transition: none; }
}
</style>
