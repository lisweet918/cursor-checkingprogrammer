<template>
	<view>
		<view class="uni-header">
			<view class="uni-group">
				<view class="uni-title">我的页面菜单管理</view>
				<view class="uni-sub-title">可管理用户端“我的”页面的功能列表，包括新增、编辑、排序和显示隐藏</view>
			</view>
			<view class="uni-group">
				<button class="uni-button" type="primary" size="mini" @click="addMenu">新增功能</button>
				<button class="uni-button" type="default" size="mini" @click="loadData">刷新</button>
			</view>
		</view>
		<view class="uni-container">
			<uni-table ref="table" :loading="loading" border stripe emptyText="暂无数据">
				<uni-tr>
					<uni-th align="center">排序</uni-th>
					<uni-th align="center">菜单名称</uni-th>
					<uni-th align="center">页面路径</uni-th>
					<uni-th align="center">是否显示</uni-th>
					<uni-th align="center">操作</uni-th>
				</uni-tr>
				<uni-tr v-for="(item, index) in tableData" :key="index">
					<uni-td align="center">{{item.sort}}</uni-td>
					<uni-td align="center">{{item.title}}</uni-td>
					<uni-td align="center">{{item.page_path}}</uni-td>
					<uni-td align="center">
						<switch :checked="item.is_show" @change="switchChange($event, item._id)" />
					</uni-td>
					<uni-td align="center">
						<view class="uni-group">
							<button class="uni-button" size="mini" type="primary" @click="editMenu(item._id)">编辑</button>
							<button class="uni-button" size="mini" type="warn" @click="deleteMenu(item._id)">删除</button>
						</view>
					</uni-td>
				</uni-tr>
			</uni-table>
		</view>
	</view>
</template>

<script>
	const db = uniCloud.database()
	export default {
		data() {
			return {
				loading: false,
				tableData: []
			}
		},
		onShow() {
			this.loadData()
		},
		methods: {
			async loadData() {
				this.loading = true
				try {
					const res = await db.collection('my_menus').orderBy('sort', 'asc').get()
					this.tableData = res.result.data || []
				} catch (e) {
					uni.showToast({ title: '加载失败', icon: 'none' })
				} finally {
					this.loading = false
				}
			},
			async switchChange(e, id) {
				uni.showLoading({ title: '更新中...' })
				try {
					await db.collection('my_menus').doc(id).update({
						is_show: e.detail.value
					})
					uni.showToast({ title: '更新成功', icon: 'success' })
				} catch (err) {
					uni.showToast({ title: '更新失败', icon: 'none' })
					this.loadData()
				} finally {
					uni.hideLoading()
				}
			},
			addMenu() {
				uni.navigateTo({ url: '/pages/my_menus/edit' })
			},
			editMenu(id) {
				uni.navigateTo({ url: `/pages/my_menus/edit?id=${id}` })
			},
			deleteMenu(id) {
				uni.showModal({
					title: '提示',
					content: '确认删除该菜单吗？',
					success: async (res) => {
						if (res.confirm) {
							uni.showLoading({ title: '删除中...' })
							try {
								await db.collection('my_menus').doc(id).remove()
								uni.showToast({ title: '删除成功', icon: 'success' })
								this.loadData()
							} catch (e) {
								uni.showToast({ title: '删除失败', icon: 'none' })
							} finally {
								uni.hideLoading()
							}
						}
					}
				})
			}
		}
	}
</script>

<style>
</style>
