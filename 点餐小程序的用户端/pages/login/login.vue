<template>
	<view class="wrap">
		<view class="wrap__image">
			<button class="avatar-wrapper" open-type="chooseAvatar" @chooseavatar="onChooseAvatar">
				<u-image :src="avatarUrl" width="150" height="150" border-radius="500"></u-image>
			</button>
		</view>
		<view class="wrap__title" style="font-size:24rpx;color:#999;margin-top:20rpx">点击头像更换</view>
		<view class="wrap__input">
			<input type="nickname" class="nickname-input" placeholder="点击输入您的微信昵称" :value="nickname" @blur="onNicknameBlur"/>
		</view>
		<view class="wrap__btn" @click="signup" style="margin-top: 60rpx;">确认授权登录</view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				avatarUrl: '/static/logo.jpg',
				nickname: ''
			}
		},
		methods: {
			onChooseAvatar(e) {
				this.avatarUrl = e.detail.avatarUrl;
			},
			onNicknameBlur(e) {
				this.nickname = e.detail.value;
			},
			async signup() {
				if (!this.nickname) {
					uni.showToast({ title: '请输入昵称', icon: 'none' });
					return;
				}
				uni.showLoading({ title: '登录中...' });
				try {
					const loginRes = await new Promise((resolve, reject) => {
						uni.login({
							provider: 'weixin',
							success: res => resolve(res),
							fail: err => reject(err)
						});
					});
					
					const res = await uniCloud.callFunction({
						name: 'wx-login',
						data: {
							code: loginRes.code,
							nickname: this.nickname,
							avatar: this.avatarUrl
						}
					});
					
					if (res.result && res.result.success) {
						uni.setStorageSync('userInfo', res.result.user);
						uni.showToast({ title: '登录成功' });
						setTimeout(() => {
							uni.navigateBack();
						}, 1000);
					} else {
						throw new Error(res.result.msg || '登录失败');
					}
				} catch (e) {
					console.error(e);
					uni.showToast({ title: e.message || '登录异常', icon: 'none' });
				} finally {
					uni.hideLoading();
				}
			}
		}
	}
</script>

<style lang="scss" scoped>
	@import '@/common/scss/login/login.scss';
	.avatar-wrapper {
		padding: 0;
		width: 150rpx;
		height: 150rpx;
		border-radius: 500rpx;
		border: none;
		background: none;
	}
	.avatar-wrapper::after {
		border: none;
	}
	.wrap__input {
		margin-top: 40rpx;
		display: flex;
		justify-content: center;
	}
	.nickname-input {
		border-bottom: 1px solid #eee;
		text-align: center;
		padding: 10rpx;
		width: 60%;
		font-size: 32rpx;
	}
</style>