'use strict';
const db = uniCloud.database();

exports.main = async (event, context) => {
	const { orderData } = event;
	if (!orderData) return { success: false, msg: '无订单数据' };

	try {
		// 1. 获取 store_settings 中的 PushPlus Token
		const settingsRes = await db.collection('store_settings').get();
		if (!settingsRes.data || settingsRes.data.length === 0) {
			return { success: false, msg: '未配置店铺设置' };
		}
		
		const pushplus_token = settingsRes.data[0].pushplus_token;
		if (!pushplus_token) {
			return { success: false, msg: '未配置PushPlus Token' };
		}

		// 2. 组装推送消息内容
		let content = `**您有一条新订单！**\n\n`;
		content += `- 订单类型：${orderData.type === 'takeout' ? '外卖配送' : '门店自取'}\n`;
		if (orderData.type === 'takeout') {
			content += `- 收货人：${orderData.name} (${orderData.phone})\n`;
			content += `- 地址：${orderData.address} ${orderData.house_number}\n`;
		}
		content += `- 总金额：￥${orderData.price}\n`;
		content += `- 备注要求：${orderData.remark || '无'}\n\n`;
		content += `**--- 菜品详情 ---**\n`;
		
		if (orderData.commodity_list && orderData.commodity_list.length > 0) {
			orderData.commodity_list.forEach(item => {
				content += `> ${item.name} x${item.number} (￥${item.price})\n`;
				if (item.materials_text) {
					content += `> 规格：${item.materials_text}\n`;
				}
				content += `\n`;
			});
		}

		// 3. 发送 HTTP 请求到 PushPlus
		const res = await uniCloud.httpclient.request('http://www.pushplus.plus/send', {
			method: 'POST',
			contentType: 'json',
			data: {
				token: pushplus_token,
				title: `新订单提醒 (￥${orderData.price})`,
				content: content,
				template: 'markdown'
			},
			dataType: 'json'
		});

		return {
			success: true,
			data: res.data
		};
	} catch (err) {
		console.error('PushPlus error:', err);
		return { success: false, error: err.message };
	}
};
