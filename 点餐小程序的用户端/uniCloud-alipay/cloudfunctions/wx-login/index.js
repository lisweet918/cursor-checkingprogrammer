'use strict';
const db = uniCloud.database();
const crypto = require('crypto');

exports.main = async (event, context) => {
	const { code, nickname, avatar } = event;
	const appId = process.env.WECHAT_APP_ID || 'wxbe2e8cc90cfb7086';
	const appSecret = process.env.WECHAT_APP_SECRET || 'f73869c07d0582bceac6fbb08a416e6c';
 if (!appSecret) return { success:false, msg:'请先配置云函数 WECHAT_APP_SECRET' };

	if (!code) return { success: false, msg: '缺失code' };

	try {
		const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${appId}&secret=${appSecret}&js_code=${code}&grant_type=authorization_code`;
		const res = await uniCloud.httpclient.request(url, {
			dataType: 'json'
		});

		const { openid, session_key, errcode, errmsg } = res.data;
		if (errcode || !openid) {
			return { success: false, msg: errmsg || '微信登录失败' };
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
			user = { ...userRes.data[0], nickname: nickname || userRes.data[0].nickname, avatar: avatar || userRes.data[0].avatar };
		} else {
			const insertRes = await usersCol.add({
				openid,
				nickname: nickname || '微信用户',
				avatar: avatar || '',
				createTime: Date.now(),
				lastLoginTime: Date.now()
			});
			user = { _id: insertRes.id, openid, nickname: nickname || '微信用户', avatar: avatar || '', points:0, createTime:Date.now() };
		}

const token = crypto.randomBytes(32).toString('hex');
 await usersCol.doc(user._id).update({ session_hash: crypto.createHash('sha256').update(token).digest('hex'), session_expires: Date.now() + 7*86400000 });
 return { success:true, token, user: { _id:user._id, openid:user.openid, nickname:user.nickname, avatar:user.avatar, points:user.points || 0, createTime:user.createTime } };
	} catch (e) {
		console.error(e);
		return { success: false, msg: e.message };
	}
};
