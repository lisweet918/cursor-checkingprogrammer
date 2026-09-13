<template>
	<view class="container">
		<u-form :model="form">
			<u-form-item label="联系人" prop="name" label-position="top">
				<u-input v-model="form.name" placeholder="请输入联系人" />
			</u-form-item>
			<u-form-item label="手机号" prop="phone" label-position="top">
				<u-input v-model="form.phone" placeholder="请输入手机号" type="number" maxlength="11" />
			</u-form-item>
			<u-form-item label="详细地址" prop="address" label-position="top">
				<u-input v-model="form.address" placeholder="请输入详细地址" />
			</u-form-item>
			<u-form-item label="门牌号（例:1号楼2单元301）" prop="house_number" label-position="top">
				<u-input v-model="form.house_number" placeholder="请输入门牌号" />
			</u-form-item>
		</u-form>

		<view class="container__btn" @click="save">保存</view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				storageKey: '', editId: '',
				form: {
					name: '',
					phone: '',
					address: '',
					longitude: '',
					latitude: '',
					house_number: ''
				}
			}
		},
		onLoad(options) {
			const user = uni.getStorageSync('userInfo') || {}
			this.storageKey = 'addresses:' + (user.openid || 'guest')
			this.editId = options.id || ''
			const item = (uni.getStorageSync(this.storageKey) || []).find(a => a.id === this.editId)
			if (item) this.form = { ...item }
		},
		methods: {
			save() {
				const item = { ...this.form, name: this.form.name.trim(), phone: this.form.phone.trim(), address: this.form.address.trim() }
				if (!item.name || !item.address || !/^1\d{10}$/.test(item.phone)) {
					uni.showToast({ title: '请填写联系人、详细地址和有效手机号', icon: 'none' }); return
				}
				const list = uni.getStorageSync(this.storageKey) || []
				item.id = this.editId || Date.now() + '-' + Math.random().toString(36).slice(2)
				const index = list.findIndex(a => a.id === item.id)
				if (index >= 0) list.splice(index, 1, item); else list.push(item)
				uni.setStorageSync(this.storageKey, list)
				this.$store.commit('SET_ADDRESS', item)
				uni.navigateBack()
			}
		}
	}
</script>

<style lang="scss" scoped>
	.container {
		padding: 30rpx;

		&__btn {
			background-color: #0A3D28;
			color: white;
			border-radius: 18rpx;
			text-align: center;
			padding: 20rpx 0;
			position: fixed;
			bottom: 30rpx;
			left: 0;
			right: 0;
			width: 80%;
			margin: 0 auto;
			font-size: 30rpx;
		}
	}
</style>
