// 云对象教程: https://uniapp.dcloud.net.cn/uniCloud/cloud-obj
const https = require('https');
const db = uniCloud.database();
const zhuohaoCollection = db.collection('zhuohao');

const WECHAT_MP_CONFIG = {
	appid: 'wxbe2e8cc90cfb7086', // 这里填写你的小程序 appid，例如：wx1234567890abcdef
	secret: 'f73869c07d0582bceac6fbb08a416e6c' // 这里填写你的小程序 secret
};

function httpsRequest(url, options = {}) {
	return new Promise((resolve, reject) => {
		const request = https.request(url, {
			method: options.method || 'GET',
			headers: options.headers || {}
		}, (response) => {
			const chunks = [];
			response.on('data', (chunk) => chunks.push(chunk));
			response.on('end', () => {
				const buffer = Buffer.concat(chunks);
				resolve({
					statusCode: response.statusCode,
					headers: response.headers,
					buffer,
					text: buffer.toString('utf8')
				});
			});
		});

		request.on('error', reject);

		if (options.body) {
			request.write(options.body);
		}

		request.end();
	});
}

function buildQueryString(data = {}) {
	return Object.keys(data)
		.filter((key) => data[key] !== undefined && data[key] !== null && data[key] !== '')
		.map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(data[key])}`)
		.join('&');
}

function parseJsonSafely(text) {
	try {
		return JSON.parse(text);
	} catch (error) {
		return null;
	}
}

module.exports = {
	_before: function () {},
	getWechatConfig() {
		const appid = WECHAT_MP_CONFIG.appid;
		const secret = WECHAT_MP_CONFIG.secret;

		if (!appid || !secret) {
			return {
				errCode: 'WECHAT_CONFIG_MISSING',
				errMsg: '请先在 WECHAT_MP_CONFIG 中配置小程序 appid 和 secret'
			};
		}

		return {
			appid,
			secret
		};
	},
	async getAccessToken() {
		const config = this.getWechatConfig();
		if (config.errCode) {
			return config;
		}

		const query = buildQueryString({
			grant_type: 'client_credential',
			appid: config.appid,
			secret: config.secret
		});
		const response = await httpsRequest(`https://api.weixin.qq.com/cgi-bin/token?${query}`);
		const result = parseJsonSafely(response.text) || {};

		if (!result.access_token) {
			return {
				errCode: result.errcode || 'GET_ACCESS_TOKEN_FAILED',
				errMsg: result.errmsg || '获取小程序 access_token 失败',
				result
			};
		}

		return {
			accessToken: result.access_token,
			expiresIn: result.expires_in
		};
	},
	async generateMiniCode(tableNumber) {
		if (!tableNumber) {
			return {
				errCode: 'TABLE_NUMBER_REQUIRED',
				errMsg: '桌号不能为空'
			};
		}

		const cleanTableNumber = String(tableNumber).trim();
		const tokenResult = await this.getAccessToken();
		if (tokenResult.errCode) {
			return tokenResult;
		}

		const scene = `tableNumber=${cleanTableNumber}`;
		const payload = JSON.stringify({
			scene,
			page: 'pages/home/home',
			check_path: false,
			width: 430,
			auto_color: true
		});
		const codeResponse = await httpsRequest(
			`https://api.weixin.qq.com/wxa/getwxacodeunlimit?access_token=${tokenResult.accessToken}`,
			{
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: payload
			}
		);

		const qrError = parseJsonSafely(codeResponse.text);
		if (qrError && qrError.errcode) {
			return {
				errCode: qrError.errcode,
				errMsg: qrError.errmsg || '生成小程序码失败',
				result: qrError
			};
		}

		const cloudPath = `zhuohao/${cleanTableNumber}-${Date.now()}.png`;
		const uploadResult = await uniCloud.uploadFile({
			cloudPath,
			fileContent: codeResponse.buffer
		});

		const now = Date.now();
		const existsResult = await zhuohaoCollection.where({
			tableNumber: cleanTableNumber
		}).limit(1).get();
		const data = existsResult.data || [];

		const documentData = {
			createTime: now,
			tableNumber: cleanTableNumber,
			orderQrCode: uploadResult.fileID,
			scene
		};

		let docId = '';
		if (data.length) {
			docId = data[0]._id;
			await zhuohaoCollection.doc(docId).update(documentData);
		} else {
			const addResult = await zhuohaoCollection.add(documentData);
			docId = addResult.id;
		}

		return {
			errCode: 0,
			errMsg: 'ok',
			id: docId,
			tableNumber: cleanTableNumber,
			scene,
			orderQrCode: uploadResult.fileID,
			createTime: now
		};
	},
	async getDetailByTableNumber(tableNumber) {
		if (!tableNumber) {
			return {
				errCode: 'TABLE_NUMBER_REQUIRED',
				errMsg: '桌号不能为空'
			};
		}

		const result = await zhuohaoCollection.where({
			tableNumber: String(tableNumber).trim()
		}).limit(1).get();
		const data = result.data || [];

		if (!data.length) {
			return {
				errCode: 'TABLE_NOT_FOUND',
				errMsg: '桌号不存在'
			};
		}

		return {
			errCode: 0,
			errMsg: 'ok',
			data: data[0]
		};
	},
	async list() {
		const result = await zhuohaoCollection.orderBy('createTime', 'desc').get();
		return {
			errCode: 0,
			errMsg: 'ok',
			data: result.data || []
		};
	}
};
