<template>
	<modal :show="visible" custom transparent padding="0" width="100%" radius="36rpx 36rpx 0 0" @cancel="$emit('cancel')">
		<view class="dish-sheet">
			<view class="dish-header">
				<view><text class="dish-eyebrow">一二布布 · 点菜小卡</text><view class="dish-heading">选成你喜欢的样子</view></view>
				<button class="dish-close" aria-label="关闭商品详情" @tap="$emit('cancel')">×</button>
			</view>
			<scroll-view scroll-y class="dish-scroll">
				<view class="dish-body">
					<swiper v-if="productData.images.length" class="dish-photos" :indicator-dots="productData.images.length > 1" :autoplay="false">
						<swiper-item v-for="(image, index) in productData.images" :key="index">
							<image :src="image.url" class="dish-photo" mode="aspectFit" />
						</swiper-item>
					</swiper>
					<view class="dish-intro">
						<view class="dish-intro-copy"><view class="dish-name">{{ productData.name }}</view><view class="dish-description" v-if="productData.description">{{ productData.description }}</view></view>
						<view class="dish-sticker" aria-hidden="true"><yier-art character="peek" :size="90" :radius="18" /></view>
					</view>
					<view class="dish-labels" v-if="productData.labels.length">
						<text class="dish-label" v-for="(label, index) in productData.labels" :key="index">{{ label.name }}</text>
					</view>
					<view class="dish-group" v-for="(material, index) in productData.materials" :key="index">
						<view class="dish-group-heading"><text>{{ material.group_name }}</text><text class="dish-group-hint">{{ isMultiple(material) ? '可多选' : '选一项' }}</text></view>
						<view class="dish-options">
							<button class="dish-option" :class="{ 'dish-option--selected': value.is_selected }" :aria-label="material.group_name + '：' + value.name + (value.is_selected ? '，已选' : '')" @tap="changeMaterialSelected(index, key)" v-for="(value, key) in material.values" :key="key">
								<text>{{ value.name }}</text><text class="dish-check" v-if="value.is_selected">✓</text>
							</button>
						</view>
					</view>
					<view class="dish-tip">{{ productData.materials.length ? '口味偏好已记好，价格按商品标价计算 ♡' : '原味也很棒，给今天加一点小开心 ♡' }}</view>
				</view>
			</scroll-view>
			<view class="dish-bottom">
				<view class="dish-summary"><view class="dish-summary-copy"><view class="dish-price">￥{{ currentPrice }}<text class="dish-unit"> / 份</text></view><view class="dish-selected">{{ getProductSelectedMaterials || '原味 / 默认规格' }}</view></view><actions :number="productData.number || 1" @add="add" @minus="minus" /></view>
				<button class="dish-submit" hover-class="dish-submit--pressed" @tap="addToCart">选好啦 · 加入购物袋</button>
			</view>
		</view>
	</modal>
</template>

<script>
import Modal from '@/components/modal/modal.vue'
import Actions from '@/components/actions/actions.vue'
import YierArt from '@/components/yier-art/yier-art.vue'
import { prepareProduct, selectedMaterials } from '@/common/product-preferences.js'

export default {
	name: 'ProductModal',
	components: { Modal, Actions, YierArt },
	props: {
		visible: { type: Boolean, default: false },
		product: { type: Object, default: () => ({}) },
		orderType: { type: String, default: 'takein' }
	},
	data() { return { productData: { images: [], labels: [], materials: [], number: 1 } } },
	watch: {
		product: { immediate: true, handler(value) { this.productData = prepareProduct(value) } }
	},
	computed: {
		getProductSelectedMaterials() { return selectedMaterials(this.productData) },
		currentPrice() { return this.productData.price || '0.00' }
	},
	methods: {
		isMultiple(group) { return group.values.some(value => value.is_exclusive) },
		changeMaterialSelected(index, key) {
			const group = this.productData.materials[index]
			if (!group || !group.values[key]) return
			const value = group.values[key]
			if (value.is_exclusive) {
				this.$set(value, 'is_selected', value.is_selected ? 0 : 1)
			} else {
				group.values.forEach((option, i) => this.$set(option, 'is_selected', i === key ? 1 : 0))
			}
		},
		add() { if (this.productData.number < 99) this.productData.number += 1 },
		minus() { if (this.productData.number > 1) this.productData.number -= 1 },
		addToCart() {
			if (!this.productData.id) return
			this.$emit('add-to-cart', { ...this.productData, materials_text: this.getProductSelectedMaterials })
		}
	}
}
</script>

<style lang="scss" scoped>
.dish-sheet { height: 85vh; display: flex; flex-direction: column; overflow: hidden; background: #fffaf2; border-radius: 36rpx 36rpx 0 0; color: #604637; }
.dish-header { flex-shrink: 0; display: flex; justify-content: space-between; align-items: center; padding: 26rpx 30rpx 20rpx; border-bottom: 2rpx dashed #eedfcb; }
.dish-eyebrow { font-size: 20rpx; color: #a58369; letter-spacing: 2rpx; }
.dish-heading { font-size: 30rpx; font-weight: 600; margin-top: 6rpx; }
.dish-close { flex-shrink: 0; padding: 0; margin: 0 0 0 20rpx; width: 64rpx; height: 64rpx; line-height: 60rpx; border-radius: 50%; background: #f2e6d5; color: #88644a; font-size: 40rpx; }
.dish-close::after, .dish-option::after, .dish-submit::after { border: none; }
.dish-scroll { flex: 1; height: 0; min-height: 0; }
.dish-body { padding: 24rpx 30rpx 28rpx; box-sizing: border-box; }
.dish-photos { height: 260rpx; border-radius: 24rpx; overflow: hidden; background: #f7efdf; }
.dish-photo { width: 100%; height: 100%; }
.dish-intro { display: flex; align-items: center; margin-top: 24rpx; }
.dish-intro-copy { flex: 1; min-width: 0; }
.dish-name { font-size: 34rpx; font-weight: 700; line-height: 1.5; word-break: break-all; }
.dish-description { font-size: 23rpx; line-height: 1.7; color: #9c816c; margin-top: 10rpx; }
.dish-sticker { flex-shrink: 0; margin-left: 20rpx; transform: rotate(6deg); pointer-events: none; }
.dish-labels { display: flex; flex-wrap: wrap; margin-top: 14rpx; }
.dish-label { font-size: 20rpx; background: #f3e8d7; border-radius: 10rpx; margin: 0 12rpx 10rpx 0; padding: 6rpx 14rpx; color: #967255; }
.dish-group { margin-top: 24rpx; }
.dish-group-heading { display: flex; align-items: center; font-size: 27rpx; font-weight: 600; margin-bottom: 16rpx; }
.dish-group-hint { font-size: 20rpx; font-weight: 400; color: #a28c78; margin-left: 14rpx; }
.dish-options { display: flex; flex-wrap: wrap; }
.dish-option { box-sizing: border-box; display: flex; align-items: center; justify-content: center; margin: 0 14rpx 14rpx 0; padding: 16rpx 22rpx; min-height: 76rpx; max-width: 100%; background: #fffdf8; border: 2rpx solid #eaddcb; border-radius: 20rpx; color: #896f58; font-size: 25rpx; line-height: 1.5; word-break: break-all; }
.dish-option--selected { border-color: #a87956; background: #f3e0c8; color: #704d35; font-weight: 600; }
.dish-check { margin-left: 12rpx; font-size: 23rpx; }
.dish-tip { font-size: 21rpx; color: #a48c75; line-height: 1.7; margin-top: 10rpx; }
.dish-bottom { flex-shrink: 0; padding: 20rpx 30rpx calc(20rpx + env(safe-area-inset-bottom)); background: #fffdf8; border-top: 2rpx solid #efe2d0; }
.dish-summary { display: flex; align-items: center; justify-content: space-between; margin-bottom: 18rpx; }
.dish-summary-copy { flex: 1; min-width: 0; margin-right: 24rpx; }
.dish-price { color: #b57454; font-size: 34rpx; font-weight: 700; }
.dish-unit { font-size: 21rpx; color: #a48c75; font-weight: 400; }
.dish-selected { font-size: 22rpx; color: #977e69; margin-top: 6rpx; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.dish-submit { background: #895d42; color: #fffaf2; border-radius: 44rpx; font-size: 28rpx; line-height: 88rpx; margin: 0; box-shadow: 0 6rpx 12rpx #895d4220; }
.dish-submit--pressed { opacity: .85; }

@import '@/common/scss/liquid-glass.scss';

.dish-sheet {
	@include glass-panel(.76, 18px);
	color: #594a43;
}
.dish-sheet .dish-header {
	background: rgba(255, 255, 255, .18);
	border-bottom: 2rpx solid rgba(255, 255, 255, .72);
}
.dish-sheet .dish-eyebrow { color: #876f62; }
.dish-sheet .dish-close {
	@include glass-inset;
	color: #765644;
}
.dish-sheet .dish-photos {
	background: rgba(255, 255, 255, .68);
	box-shadow: inset 0 0 0 2rpx rgba(255, 255, 255, .9);
}
.dish-sheet .dish-description,
.dish-sheet .dish-group-hint,
.dish-sheet .dish-tip,
.dish-sheet .dish-selected { color: #816e64; }
.dish-sheet .dish-label {
	background: rgba(249, 239, 226, .86);
	color: #82604b;
	box-shadow: inset 0 2rpx 0 rgba(255, 255, 255, .92);
}
.dish-sheet .dish-option {
	@include glass-inset;
	border-color: rgba(164, 132, 113, .25);
	color: #765f51;
}
.dish-sheet .dish-option--selected {
	background: linear-gradient(145deg, #fbebd9, #ebd1b5);
	border-color: #a57b5d;
	color: #603e29;
	box-shadow: inset 0 2rpx 0 rgba(255, 255, 255, .95), 0 4rpx 10rpx rgba(127, 89, 64, .10);
}
.dish-sheet .dish-bottom {
	background: rgba(255, 253, 249, .9);
	border-top: 2rpx solid rgba(255, 255, 255, .9);
	box-shadow: 0 -8rpx 24rpx rgba(109, 90, 73, .04);
}
.dish-sheet .dish-submit { @include glass-button; }
</style>
