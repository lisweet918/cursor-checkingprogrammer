<template>
	<view class="uni-container">
		<uni-forms ref="form" :model="formData" :rules="rules" validateTrigger="bind" label-width="100px">
			<uni-forms-item name="title" label="菜单名称" required>
				<uni-easyinput v-model="formData.title" placeholder="请输入菜单名称，例如：骑手中心" />
			</uni-forms-item>
			<uni-forms-item name="page_path" label="页面路径">
				<uni-easyinput v-model="formData.page_path" placeholder="请输入页面路径，例如：/subpackageMy/riderCenter/rider-center" />
			</uni-forms-item>
			<uni-forms-item name="is_show" label="是否显示">
				<switch :checked="formData.is_show" @change="binddata('is_show', $event.detail.value)" />
			</uni-forms-item>
			<uni-forms-item name="sort" label="排序">
				<uni-easyinput type="number" v-model="formData.sort" placeholder="排序值，越小越靠前" />
			</uni-forms-item>
			
			<view class="uni-button-group">
				<button type="primary" class="uni-button" style="width: 100px;" @click="submit">提交</button>
				<navigator open-type="navigateBack" style="margin-left: 15px;">
					<button class="uni-button" style="width: 100px;">返回</button>
				</navigator>
			</view>
		</uni-forms>
	</view>
</template>

<script>
	const db = uniCloud.database()
	export default {
		data() {
			return {
				menuId: '',
				formData: {
					title: '',
					page_path: '',
					is_show: true,
					sort: 100
				},
				rules: {
					title: {
						rules: [{ required: true, errorMessage: '菜单名称不能为空' }]
					}
				}
			}
		},
		onLoad(options) {
			if (options.id) {
				this.menuId = options.id
				this.loadData()
			}
		},
		methods: {
			async loadData() {
				uni.showLoading({ title: '加载中...' })
				try {
					const res = await db.collection('my_menus').doc(this.menuId).get()
					if (res.result.data && res.result.data.length > 0) {
						const data = res.result.data[0]
						this.formData = {
							title: data.title,
							page_path: data.page_path || '',
							is_show: data.is_show !== false,
							sort: data.sort || 100
						}
					}
				} catch (e) {
					uni.showToast({ title: '获取数据失败', icon: 'none' })
				} finally {
					uni.hideLoading()
				}
			},
			binddata(name, value) {
				this.formData[name] = value
			},
			submit() {
				this.$refs.form.validate().then(async (res) => {
					uni.showLoading({ title: '保存中...' })
					const submitData = {
						...this.formData,
						sort: parseInt(this.formData.sort) || 100
					}
					try {
						if (this.menuId) {
							await db.collection('my_menus').doc(this.menuId).update(submitData)
						} else {
							await db.collection('my_menus').add(submitData)
						}
						uni.showToast({ title: '保存成功', icon: 'success' })
						setTimeout(() => {
							uni.navigateBack()
						}, 1000)
					} catch (e) {
						uni.showToast({ title: '保存失败', icon: 'none' })
					} finally {
						uni.hideLoading()
					}
				}).catch(err => {
					console.log('表单错误信息：', err);
				})
			}
		}
	}
</script>

<style>
	.uni-container {
		padding: 15px;
	}
</style>
