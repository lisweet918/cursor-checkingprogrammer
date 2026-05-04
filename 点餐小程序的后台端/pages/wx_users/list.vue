<template>
	<view>
		<view class="uni-header">
			<view class="uni-group">
				<view class="uni-title">会员用户管理</view>
				<view class="uni-sub-title">可以查看授权用户的微信头像、昵称，以及他们的剩余积分。在这里也可以为主顾手动修改积分。</view>
			</view>
			<view class="uni-group">
				<button class="uni-button" type="default" size="mini" @click="loadData">刷新</button>
			</view>
		</view>
		<view class="uni-container">
			<uni-table ref="table" :loading="loading" border stripe emptyText="暂无用户数据">
				<uni-tr>
					<uni-th align="center">头像</uni-th>
					<uni-th align="center">昵称</uni-th>
					<uni-th align="center">会员积分</uni-th>
					<uni-th align="center">授权时间</uni-th>
					<uni-th align="center">操作</uni-th>
				</uni-tr>
				<uni-tr v-for="(item, index) in tableData" :key="index">
					<uni-td align="center">
						<image :src="item.avatar || '/static/logo.jpg'" style="width:40px;height:40px;border-radius:50%"></image>
					</uni-td>
					<uni-td align="center">{{item.nickname || '微信用户'}}</uni-td>
					<uni-td align="center">
						<text style="color:#0A3D28;font-weight:bold">{{item.points || 0}}</text>
					</uni-td>
					<uni-td align="center">{{formatDate(item.createTime)}}</uni-td>
					<uni-td align="center">
						<view class="uni-group">
							<button class="uni-button" size="mini" type="primary" @click="editPoints(item)">修改积分</button>
						</view>
					</uni-td>
				</uni-tr>
			</uni-table>
		</view>

		<uni-popup ref="pointsPopup" type="dialog">
			<uni-popup-dialog mode="input" title="修改会员积分" type="info" placeholder="请输入新的积分数字"
				@confirm="confirmEditPoints"></uni-popup-dialog>
		</uni-popup>
	</view>
</template>

<script>
	const db = uniCloud.database()
	export default {
		data() {
			return {
				loading: false,
				tableData: [],
				currentEditId: ''
			}
		},
		onShow() {
			this.loadData()
		},
		methods: {
			async loadData() {
				this.loading = true
				try {
					const res = await db.collection('wx_users').orderBy('createTime', 'desc').get()
					this.tableData = res.result.data || []
				} catch (e) {
					uni.showToast({ title: '加载失败', icon: 'none' })
				} finally {
					this.loading = false
				}
			},
			formatDate(timestamp) {
				if (!timestamp) return '-';
				const d = new Date(timestamp);
				return `${d.getFullYear()}-${(d.getMonth()+1).toString().padStart(2,'0')}-${d.getDate().toString().padStart(2,'0')} ${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`;
			},
			editPoints(item) {
				this.currentEditId = item._id;
				this.$refs.pointsPopup.open();
			},
			async confirmEditPoints(value) {
				const points = parseInt(value);
				if (isNaN(points)) {
					uni.showToast({ title: '请输入有效的数字', icon: 'none' });
					return;
				}
				uni.showLoading({ title: '更新中...' });
				try {
					await db.collection('wx_users').doc(this.currentEditId).update({
						points: points
					});
					uni.showToast({ title: '积分更新成功', icon: 'success' });
					this.$refs.pointsPopup.close();
					this.loadData();
				} catch (e) {
					uni.showToast({ title: '更新失败', icon: 'none' });
				} finally {
					uni.hideLoading();
				}
			}
		}
	}
</script>

<style>
</style>
