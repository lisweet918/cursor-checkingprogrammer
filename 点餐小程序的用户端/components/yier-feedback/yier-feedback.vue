<template>
	<view class="yier-feedback" :class="['yier-feedback--' + kind, 'yier-feedback--scene-' + artScene, { 'yier-feedback--compact': compact }]">
		<view class="yier-feedback__picture" aria-hidden="true">
			<text class="yier-feedback__spark yier-feedback__spark--left">✦</text>
			<view class="yier-feedback__portrait">
				<YierArt :character="artCharacter || 'bubu'" :size="artSize || 166" :radius="artCharacter === 'pair' ? 32 : ''" />
			</view>
			<text class="yier-feedback__spark yier-feedback__spark--right">♥</text>
			<text v-if="kind === 'loading'" class="yier-feedback__thought">···</text>
			<view v-if="kind === 'success'" class="yier-feedback__badge">
				<view class="yier-feedback__check"></view>
			</view>
		</view>
		<view class="yier-feedback__copy">
			<text v-if="!compact" class="yier-feedback__caption">{{ sceneCaption }}</text>
			<text v-if="title" class="yier-feedback__title">{{ title }}</text>
			<text v-if="description" class="yier-feedback__description">{{ description }}</text>
			<view v-if="kind === 'loading'" class="yier-feedback__dots" aria-hidden="true">
				<view class="yier-feedback__dot"></view>
				<view class="yier-feedback__dot"></view>
				<view class="yier-feedback__dot"></view>
			</view>
		</view>
	</view>
</template>

<script>
import YierArt from '@/components/yier-art/yier-art.vue';

export default {
	name: 'YierFeedback',
	components: { YierArt },
	props: {
		kind: { type: String, default: 'empty' },
		title: { type: String, default: '' },
		description: { type: String, default: '' },
		compact: { type: Boolean, default: false },
		scene: { type: String, default: '' }
	},
	computed: {
		artScene() {
			return this.scene || (this.kind === 'success' ? 'celebrate' : this.kind === 'loading' ? 'waiting' : this.compact ? 'choosing' : 'empty');
		},
		artCharacter() { return this.artScene === 'celebrate' ? 'pair' : this.artScene === 'choosing' ? 'peek' : 'bubu'; },
		artSize() { return this.compact ? 110 : this.artCharacter === 'pair' ? 260 : 166; },
		sceneCaption() {
			return { celebrate: '一二布布 · 开心碰杯', waiting: '布布的等待时间', choosing: '一二陪你选美味', empty: '你的饭搭子一直在' }[this.artScene] || '一二布布的小食堂';
		}
	}
};
</script>

<style scoped lang="scss">
.yier-feedback {
	box-sizing: border-box;
	display: flex;
	flex-direction: column;
	align-items: center;
	width: 100%;
	max-width: 100%;
	min-width: 0;
	padding: 36rpx 28rpx 30rpx;
	border: 2rpx solid #f0dfcc;
	border-radius: 32rpx;
	background: #fffaf2;
	color: #70503e;
	text-align: center;
	pointer-events: none;
	animation: yier-feedback-appear 320ms ease-out both;

	&__picture {
		position: relative;
		flex-shrink: 0;
		margin: 4rpx 18rpx 22rpx;
	}
	&__portrait { transform: rotate(-5deg); }
	&--scene-celebrate &__portrait { transform: rotate(3deg); animation: yier-feedback-cheer 420ms ease-out both; }
	&--scene-waiting &__portrait { transform: rotate(-3deg); }
	&__caption {
		display: block;
		margin-bottom: 10rpx;
		font-size: 20rpx;
		letter-spacing: 3rpx;
		color: #a2795b;
	}
	&__thought {
		position: absolute;
		top: -8rpx;
		right: -28rpx;
		padding: 0 14rpx 6rpx;
		border: 2rpx solid #ead8c4;
		border-radius: 24rpx 24rpx 24rpx 4rpx;
		background: #fff;
		color: #9e7659;
		font-size: 28rpx;
		line-height: 1;
	}
	&--scene-waiting &__spark--right { display: none; }

	&__spark {
		position: absolute;
		z-index: 1;
		line-height: 1;
		font-size: 28rpx;
	}

	&__spark--left {
		top: 12rpx;
		left: -24rpx;
		color: #daa451;
		transform: rotate(-12deg);
	}

	&__spark--right {
		top: -6rpx;
		right: -18rpx;
		color: #d88e87;
		transform: rotate(15deg);
	}

	&__copy {
		min-width: 0;
		max-width: 100%;
	}

	&__title,
	&__description {
		display: block;
		white-space: normal;
		word-break: break-word;
	}

	&__title {
		font-size: 28rpx;
		font-weight: 600;
		line-height: 1.5;
		letter-spacing: 1rpx;
	}

	&__description {
		margin-top: 10rpx;
		color: #8c6d58;
		font-size: 24rpx;
		line-height: 1.65;
	}

	&__badge {
		position: absolute;
		right: -8rpx;
		bottom: -6rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		box-sizing: border-box;
		width: 46rpx;
		height: 46rpx;
		border: 4rpx solid #fffaf2;
		border-radius: 50%;
		background: #648775;
	}

	&__check {
		width: 10rpx;
		height: 18rpx;
		margin-top: -4rpx;
		border-right: 4rpx solid #fff;
		border-bottom: 4rpx solid #fff;
		transform: rotate(45deg);
	}

	&__dots {
		display: flex;
		justify-content: center;
		align-items: center;
		height: 22rpx;
		margin-top: 14rpx;
	}

	&__dot {
		width: 10rpx;
		height: 10rpx;
		margin: 0 5rpx;
		border-radius: 50%;
		background: #c59475;
		animation: yier-feedback-dot 1.2s ease-in-out infinite;

		&:nth-child(2) {
			animation-delay: 160ms;
		}

		&:nth-child(3) {
			animation-delay: 320ms;
		}
	}

	&--compact {
		flex-direction: row;
		padding: 24rpx;
		border-radius: 24rpx;
		text-align: left;

		.yier-feedback__picture {
			margin: 4rpx 28rpx 4rpx 10rpx;
		}

		.yier-feedback__copy {
			flex: 1;
		}

		.yier-feedback__title {
			font-size: 26rpx;
		}

		.yier-feedback__description {
			margin-top: 6rpx;
		}

		.yier-feedback__spark {
			font-size: 22rpx;
		}

		.yier-feedback__spark--left {
			left: -15rpx;
		}

		.yier-feedback__spark--right {
			right: -12rpx;
		}

		.yier-feedback__dots {
			justify-content: flex-start;
		}
	}
}

@keyframes yier-feedback-appear {
	from { opacity: 0; transform: translateY(8rpx); }
	to { opacity: 1; transform: translateY(0); }
}

@keyframes yier-feedback-cheer {
	0% { transform: rotate(-4deg) scale(0.94); }
	65% { transform: rotate(5deg) scale(1.03); }
	100% { transform: rotate(3deg) scale(1); }
}

@keyframes yier-feedback-dot {
	0%, 60%, 100% { opacity: 0.45; transform: translateY(0); }
	30% { opacity: 1; transform: translateY(-5rpx); }
}

@media (prefers-reduced-motion: reduce) {
	.yier-feedback,
	.yier-feedback__dot,
	.yier-feedback--scene-celebrate .yier-feedback__portrait {
		animation: none;
	}
}
</style>
