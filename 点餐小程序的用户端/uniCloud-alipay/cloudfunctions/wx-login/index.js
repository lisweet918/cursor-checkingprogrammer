'use strict';
const db = uniCloud.database();

exports.main = async (event, context) => {
	const { code, nickname, avatar } = event;
	const appId = 'wxbe2e8cc90cfb7086';
	const appSecret = 'f73869c07d0582bceac6fbb08a416e6c';

	if (!code) return { success: false, msg: '缺失code' };

	try {
		const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${appId}&secret=${appSecret}&js_code=${code}&grant_type=authorization_code`;
		const res = await uniCloud.httpclient.request(url, {
			dataType: 'json'
		});

		const { openid, session_key, errcode, errmsg } = res.data;
		if (errcode) {
			return { success: false, msg: errmsg };
		}

		const usersCol = db.collection('wx_users');
		const userRes = await usersCol.where({ openid }).get();
		let user;

		if (userRes.data && userRes.data.length > 0) {
			await usersCol.doc(userRes.data[0]._id).update({
				nickname: nickname || userRes.data[0].nickname,
				avatar: avatar || userRes.data[0].avatar,
				lastLoginTime: Date.now()
			});
			user = { ...userRes.data[0], nickname, avatar };
		} else {
			const insertRes = await usersCol.add({
				openid,
				nickname: nickname || '微信用户',
				avatar: avatar || '',
				createTime: Date.now(),
				lastLoginTime: Date.now()
			});
			user = { _id: insertRes.id, openid, nickname, avatar };
		}

		return {
			success: true,
			user: user
		};
	} catch (e) {
		console.error(e);
		return { success: false, msg: e.message };
	}
};
