<template>
	<view class="wrap">
		<view class="wrap__riderInfo">
			<view>
				<u-avatar src="/static/logo.jpg" size="80"></u-avatar>
			</view>
			<view class="wrap__riderInfo__user">
				<view class="wrap__riderInfo__user__left">
					<u-tag text="骑手" mode="dark" size="mini" />
					<view class="u-m-l-10">{{ riderInfo.nickname }}</view>
				</view>
				<view class="wrap__riderInfo__user__right">{{ riderInfo.phone }}</view>
			</view>
		</view>

		<view class="wrap__ordervolume">
			<u-grid :col="4" :border="false">
				<u-grid-item>
					<view class="wrap__ordervolume__number">{{ statistics.total_order }}</view>
					<view class="wrap__ordervolume__title">总完成(单)</view>
				</u-grid-item>
				<u-grid-item>
					<view class="wrap__ordervolume__number">{{ statistics.today_order }}</view>
					<view class="wrap__ordervolume__title">今日完成(单)</view>
				</u-grid-item>
				<u-grid-item>
					<view class="wrap__ordervolume__number">{{ statistics.yesterday_order }}</view>
					<view class="wrap__ordervolume__title">昨日完成(单)</view>
				</u-grid-item>
				<u-grid-item>
					<view class="wrap__ordervolume__number">{{ statistics.month_order }}</view>
					<view class="wrap__ordervolume__title">本月完成(单)</view>
				</u-grid-item>
			</u-grid>
		</view>

		<view>
			<u-tabs :list="tabsList" :is-scroll="false" :current="current" @change="change" active-color="#0A3D28"
				bar-width="90" duration="0" inactive-color="#9A9A9A"></u-tabs>
		</view>

		<view class="wrap__orderlist" v-for="(item,index) in currentOrderList" :key="index" @click="popupModal(item)">
			<view class="wrap__orderlist__ordertime">
				<view class="wrap__orderlist__ordertime__status">
					<view>#{{item.id}} {{item.status == '1' ? '即时单' : '预约单'}}</view>
					<view v-if="item.status != '1'">{{item.deliverytime}}</view>
				</view>
				<view class="wrap__orderlist__ordertime__time">
					{{current == 0 ? '下单时间 ' + item.createtime : '送达时间 ' + item.sendreach_time}}
				</view>
			</view>
			<view class="wrap__orderlist__address">送至：{{item.address}}{{item.house_number}}</view>
			<view class="wrap__orderlist__remark" v-if="item.remark && current == 0">顾客备注：{{item.remark}}</view>

			<view class="wrap__orderlist__btn" v-if="current == 0">
				<u-button type="info" size="mini" shape="square" plain>上报餐损</u-button>
				<view class="wrap__orderlist__btn__right">
					<u-button type="primary" size="mini" shape="square" @click.stop="navigation(item)">导航</u-button>
					<u-button type="warning" size="mini" shape="square" class="u-m-r-20 u-m-l-20"
						@click.stop="contactCustomers(item)">联系顾客</u-button>
					<u-button type="success" size="mini" shape="square"
						@click.stop="confirmDelivery(item)">我已送达</u-button>
				</view>
			</view>

			<view v-else class="wrap__orderlist__completed">
				<view class="wrap__orderlist__completed__section" v-if="item.delivery_images">
					<view class="wrap__orderlist__completed__images">
						<view v-for="(img, imgIdx) in item.delivery_images.split(',')" :key="imgIdx">
							<u-image :src="img" width="150" height="150" border-radius="8" lazy-load
								error-icon="error-circle"
								@click="previewImage(img, item.delivery_images.split(','))"></u-image>
						</view>
					</view>
				</view>
				<view class="wrap__orderlist__completed__section" v-if="item.delivery_remark">
					<view class="wrap__orderlist__completed__remark">{{ item.delivery_remark }}</view>
				</view>
			</view>
		</view>

		<u-popup v-model="popupShow" mode="bottom" height="80%" border-radius="18">
			<view class="wrap__popup" v-if="currentOrder.id">
				<view class="wrap__popup__shoplist">
					<view class="wrap__popup__header">
						<view class="wrap__popup__header__title">货品</view>
						<view class="wrap__popup__header__price">
							共{{currentOrder.shop_num}}件商品，
							<text>合计</text>
							<text>￥</text>
							<text>{{currentOrder.price || '0'}}</text>
						</view>
					</view>
					<view class="wrap__list">
						<view class="wrap__list__shopinfo"
							v-for="(shop, shopIndex) in (currentOrder.commodity_list || [])" :key="shopIndex">
							<view class="wrap__list__shopinfo__left">
								<view class="wrap__list__shopinfo__left__image">
									<u-image :src="shop.image" width="180" height="140" border-radius="8" lazy-load
										error-icon="error-circle"></u-image>
								</view>
								<view class="wrap__list__shopinfo__left__desc">
									<view>
										<view class="wrap__list__shopinfo__left__desc__shopname">{{ shop.name }}</view>
										<view class="wrap__list__shopinfo__left__desc__content"
											v-if="shop.materials_text">{{ shop.materials_text }}</view>
									</view>
									<view class="wrap__list__shopinfo__left__desc__price">
										<text>￥</text>
										<text>{{ shop.price }}</text>
									</view>
								</view>
							</view>
							<view class="wrap__list__shopinfo__right">x{{ shop.number }}</view>
						</view>
					</view>
				</view>
			</view>
			<u-gap height="1"></u-gap>
		</u-popup>

		<u-popup v-model="deliveryShow" mode="bottom" height="80%" border-radius="18" @close="resetUploadData">
			<view class="wrap__deliveryPopup">
				<view>
					<u-alert-tips type="warning" description="拍摄规范：请清晰拍摄餐品全貌及顾客门牌号 / 交接现场，作为配送凭证。"></u-alert-tips>
				</view>
				<view>
					<u-upload ref="uploadRef" :auto-upload="false" :max-count="3" :name="'file'" v-model="fileList"
						@on-list-change="onListChange" upload-text="上传送达图片"></u-upload>
				</view>
				<view>
					<u-input v-model="deliveryRemark" type="textarea" height="300" placeholder="外卖员备注（选填）" border
						maxlength="200" />
				</view>
				<view :class="{ 'btn-disabled': !canSubmit }" @click="handleSubmitDelivery">
					提交送达
				</view>
			</view>
		</u-popup>
	</view>
</template>

<script setup>
	import {
		ref
	} from 'vue';

	const current = ref(0);
	const tabsList = [{
		name: '配送中'
	}, {
		name: '已完成'
	}];
	const popupShow = ref(false);
	const deliveryShow = ref(false);

	// --- 2. 固定模拟数据 ---

	// 骑手信息
	const riderInfo = ref({
		nickname: 'Kaiyuan_Q',
		phone: '13888888888'
	});

	// 统计数据
	const statistics = ref({
		total_order: 156,
		today_order: 12,
		yesterday_order: 18,
		month_order: 142
	});

	const imgUrls = [
		'/static/img/home/icon-1.jpg',
		'/static/img/home/icon-1.jpg',
		'/static/img/home/icon-1.jpg'
	];

	const deliveringOrders = ref([{
			id: 1024,
			status: '1',
			createtime: '2026-03-31 12:30',
			address: '北京市东城区东风东路',
			house_number: '188号 嘉诚名居 3栋2单元501',
			phone: '139****1234',
			latitude: '37.445',
			longitude: '116.345',
			remark: '不要放香菜，谢谢',
			shop_num: 2,
			price: '45.00',
			commodity_list: [{
					name: '老北京炸酱面',
					price: '18.00',
					number: 1,
					image: imgUrls[0],
					materials_text: '面条, 炸酱, 黄瓜丝'
				},
				{
					name: '可口可乐',
					price: '5.00',
					number: 2,
					image: imgUrls[1],
					materials_text: ''
				}
			]
		},
		{
			id: 1025,
			status: '2',
			deliverytime: '今日 13:00 送达',
			createtime: '2026-03-31 11:00',
			address: '北京市东城区湖滨中大道',
			house_number: '123号 办公楼 10层',
			phone: '138****5678',
			latitude: '37.450',
			longitude: '116.350',
			remark: '',
			shop_num: 1,
			price: '22.00',
			commodity_list: [{
				name: '黄焖鸡米饭',
				price: '22.00',
				number: 1,
				image: imgUrls[2],
				materials_text: '鸡肉, 土豆, 青椒'
			}]
		}
	]);

	// 已完成订单列表
	const completedOrders = ref([{
		id: 1020,
		status: '1',
		sendreach_time: '2026-03-31 11:20',
		address: '北京市东城区大学西路',
		house_number: '56号 小区 1栋101',
		phone: '137****9012',
		delivery_images: imgUrls[0] + ',' + imgUrls[1],
		delivery_remark: '放在门口鞋柜上了，顾客没开门，已拍照留证。'
	}]);

	const currentOrderList = ref(deliveringOrders.value);

	const currentOrder = ref({});
	const currentDeliveryOrder = ref({});
	
	const fileList = ref([]);
	const deliveryRemark = ref('');
	const canSubmit = ref(false);

	const change = (index) => {
		current.value = index;
		currentOrderList.value = index === 0 ? deliveringOrders.value : completedOrders.value;
	};

	const previewImage = (current, urls) => {
		uni.previewImage({
			current,
			urls
		});
	};

	const navigation = (item) => {
		uni.showToast({
			title: '正在打开地图导航至: ' + item.address,
			icon: 'none'
		});
	};

	// 模拟联系顾客
	const contactCustomers = (item) => {
		uni.showToast({
			title: '正在拨打: ' + item.phone,
			icon: 'none'
		});
	};

	// 打开订单详情
	const popupModal = (item) => {
		if (item.commodity_list) {
			currentOrder.value = item;
		} else {
			currentOrder.value = {
				...item,
				shop_num: 1,
				price: '20.00',
				commodity_list: [{
					name: '随机商品',
					price: '20.00',
					number: 1,
					image: imgUrls[0],
					materials_text: ''
				}]
			};
		}
		popupShow.value = true;
	};

	const confirmDelivery = (item) => {
		currentDeliveryOrder.value = item;
		resetUploadData();
		deliveryShow.value = true;
	};

	const onListChange = (lists) => {
		canSubmit.value = lists && lists.length > 0;
	};

	const handleSubmitDelivery = () => {
		if (!canSubmit.value) {
			uni.showToast({
				title: '请至少上传一张送达图片',
				icon: 'none'
			});
			return;
		}

		uni.showLoading({
			title: '提交中...'
		});

		setTimeout(() => {
			uni.hideLoading();
			uni.showToast({
				title: '模拟送达成功！',
				icon: 'success'
			});

			const newCompleted = {
				...currentDeliveryOrder.value,
				sendreach_time: '2026-03-31 ' + new Date().getHours() + ':' + new Date().getMinutes(),
				delivery_images: imgUrls[0],
				delivery_remark: deliveryRemark.value
			};
			
			completedOrders.value.unshift(newCompleted);

			deliveryShow.value = false;
		}, 1000);
	};

	const resetUploadData = () => {
		fileList.value = [];
		deliveryRemark.value = '';
		canSubmit.value = false;
	};
</script>

<style lang="scss" scoped>
	.wrap {
		background-color: #F8F8F8;
		min-height: 100vh;

		&__riderInfo {
			display: flex;
			background-color: white;
			padding: 30rpx;
			align-items: center;

			&__user {
				flex: 1;
				margin-left: 30rpx;
				display: flex;
				justify-content: space-between;
				align-items: center;

				&__left {
					display: flex;
					align-items: center;
					font-size: 32rpx;
					color: #333;
					font-weight: bold;
				}

				&__right {
					font-size: 24rpx;
					color: $u-type-info;
				}
			}
		}

		&__ordervolume {
			background-color: white;
			padding-bottom: 20rpx;

			&__number {
				font-size: 32rpx;
				color: #333;
				font-weight: bold;
			}

			&__title {
				font-size: 24rpx;
				margin-top: 10rpx;
				color: $u-type-info;
			}
		}

		&__orderlist {
			background-color: white;
			border-radius: 18rpx;
			margin: 20rpx;
			padding: 30rpx;

			&__ordertime {
				display: flex;
				justify-content: space-between;
				align-items: flex-start;

				&__status {

					view:nth-child(1) {
						color: #333;
					}

					view:nth-child(2) {
						margin-top: 5rpx;
						color: $u-type-info;
						font-size: 20rpx;
					}
				}

				&__time {
					font-weight: bold;
					color: #FF362D;
				}
			}

			&__address {
				font-size: 32rpx;
				color: #333;
				font-weight: bold;
				margin-top: 30rpx;
			}

			&__remark {
				border: 1px solid #FF362D;
				color: #FF362D;
				border-radius: 8rpx;
				font-size: 24rpx;
				display: inline-block;
				font-weight: bold;
				margin-top: 30rpx;
				padding: 8rpx 16rpx;
			}

			&__btn {
				display: flex;
				justify-content: space-between;
				margin-top: 30rpx;
				align-items: center;

				&__right {
					display: flex;
					align-items: center;
				}
			}

			&__completed {
				margin-top: 30rpx;

				&__section {
					margin-top: 30rpx;

					&:first-child {
						margin-top: 0;
					}
				}

				&__images {
					display: flex;
					gap: 20rpx;
					flex-wrap: wrap;
				}

				&__remark {
					font-size: 24rpx;
					color: #666;
					font-weight: bold;
					padding: 24rpx;
					background-color: #F8F8F8;
					border-radius: 8rpx;
				}
			}
		}

		&__popup {
			background-color: #F8F8F8;
			padding: 20rpx;

			&__shoplist {
				background-color: white;
				border-radius: 18rpx 18rpx 0 0;
				padding: 30rpx;
			}

			&__header {
				display: flex;
				justify-content: space-between;
				align-items: center;
				padding-bottom: 20rpx;
				border-bottom: 1px solid #F5F5F5;

				&__title {
					font-size: 28rpx;
					font-weight: bold;
					color: #333;
				}

				&__price {
					display: flex;
					align-items: baseline;
					font-size: 24rpx;

					text:nth-child(1) {
						font-weight: bold;
						margin-right: 10rpx;
					}

					text:nth-child(2),
					text:nth-child(3) {
						color: #FF362D;
						font-weight: bold;
					}

					text:nth-child(2) {
						font-size: 24rpx;
					}

					text:nth-child(3) {
						font-size: 32rpx;
					}
				}
			}
		}

		&__list {
			&__shopinfo {
				width: 100%;
				display: flex;
				justify-content: space-between;
				align-items: flex-start;
				margin-top: 30rpx;

				&__left {
					display: flex;
					flex: 1;

					&__image {
						margin-right: 20rpx;
					}

					&__desc {
						display: flex;
						flex-direction: column;
						justify-content: space-between;
						flex: 1;

						&__shopname {
							font-weight: bold;
							color: #333;
							font-size: 28rpx;
						}

						&__content {
							font-size: 20rpx;
							color: $u-type-info;
							margin-top: 8rpx;
						}

						&__price {
							display: flex;
							align-items: baseline;
							font-weight: bold;
							color: #333;
							margin-top: 20rpx;

							text:nth-child(1) {
								font-size: 20rpx;
								margin-right: 5rpx;
							}

							text:nth-child(2) {
								font-size: 30rpx;
							}
						}
					}
				}

				&__right {
					font-size: 28rpx;
					color: #333;
					font-weight: bold;
				}
			}
		}

		&__deliveryPopup {
			margin: 30rpx;

			view:nth-child(2) {
				margin-top: 30rpx;
			}

			view:nth-child(3) {
				margin-top: 30rpx;
			}

			view:nth-child(4) {
				color: white;
				background-color: #0A3D28;
				width: 100%;
				margin-top: 50rpx;
				text-align: center;
				padding: 30rpx 0;
				border-radius: 8rpx;
				letter-spacing: 4rpx;

				&.btn-disabled {
					background-color: #cccccc;
					pointer-events: none;
				}
			}
		}
	}
</style>