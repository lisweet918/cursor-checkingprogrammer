// 云对象教程: https://uniapp.dcloud.net.cn/uniCloud/cloud-obj
const https = require('https');
const db = uniCloud.database();
const zhuohaoCollection = db.collection('zhuohao');

const WECHAT_MP_CONFIG = {
	appid: 'wxbe2e8cc90cfb7086',
	secret: 'f73869c07d0582bceac6fbb08a416e6c'
};

function httpsRequest(url, options = {}) {
	return new Promise((resolve, reject) => {
		const body = options.body || '';
		const headers = {
			Accept: options.accept || '*/*',
			'User-Agent': 'Mozilla/5.0',
			...options.headers
		};
		if (body) {
			headers['Content-Length'] = Buffer.byteLength(body);
		}
		const request = https.request(url, {
			method: options.method || 'GET',
			headers
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

		if (body) {
			request.write(body);
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

function getBufferSignature(buffer) {
	if (!buffer || !buffer.length) {
		return '';
	}
	return buffer.slice(0, 16).toString('hex');
}

function buildDebugInfo(codeResponse, extra = {}) {
	const headers = codeResponse && codeResponse.headers ? codeResponse.headers : {};
	const contentType = headers['content-type'] || headers['Content-Type'] || '';
	const bodyText = codeResponse && typeof codeResponse.text === 'string' ? codeResponse.text : '';
	return {
		statusCode: codeResponse ? codeResponse.statusCode : undefined,
		contentType,
		bufferSize: codeResponse && codeResponse.buffer ? codeResponse.buffer.length : 0,
		bufferSignature: getBufferSignature(codeResponse && codeResponse.buffer),
		bodyPreview: bodyText ? bodyText.slice(0, 300) : '',
		...extra
	};
}

function isImageResponse(codeResponse) {
	const headers = codeResponse && codeResponse.headers ? codeResponse.headers : {};
	const contentType = String(headers['content-type'] || headers['Content-Type'] || '').toLowerCase();
	if (contentType.indexOf('image/') === 0) {
		return true;
	}
	return !!(codeResponse && codeResponse.buffer && codeResponse.buffer.length > 0);
}

function formatDebugInfo(debug = {}) {
	if (!debug || !Object.keys(debug).length) {
		return '';
	}
	return [
		`statusCode=${debug.statusCode || ''}`,
		`contentType=${debug.contentType || ''}`,
		`bufferSize=${debug.bufferSize || 0}`,
		`bufferSignature=${debug.bufferSignature || ''}`,
		`page=${debug.page || ''}`,
		`envVersion=${debug.envVersion || ''}`,
		`scene=${debug.scene || ''}`,
		`bodyPreview=${debug.bodyPreview || ''}`
	].join('; ');
}

function getWechatConfig() {
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
}

async function getAccessToken() {
	const config = getWechatConfig();
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
		const bodyPreview = response.text ? response.text.slice(0, 300) : '';
		return {
			errCode: result.errcode || 'GET_ACCESS_TOKEN_FAILED',
			errMsg: `${result.errmsg || '获取小程序 access_token 失败'} | statusCode=${response.statusCode || ''}; bodyPreview=${bodyPreview}`,
			result,
			debug: {
				statusCode: response.statusCode,
				bodyPreview
			}
		};
	}

	return {
		accessToken: result.access_token,
		expiresIn: result.expires_in
	};
}

async function createMiniCode(tableNumber) {
	const cleanTableNumber = String(tableNumber || '').trim();
	if (!cleanTableNumber) {
		return {
			errCode: 'TABLE_NUMBER_REQUIRED',
			errMsg: '桌号不能为空'
		};
	}

	const tokenResult = await getAccessToken();
	if (tokenResult.errCode) {
		return tokenResult;
	}

	const scene = `tableNumber=${cleanTableNumber}`;
	const page = 'pages/home/home';
	const envVersion = 'trial';
	const payload = JSON.stringify({
		scene,
		page,
		env_version: envVersion,
		check_path: false,
		width: 430,
		auto_color: true
	});
	const codeResponse = await httpsRequest(
		`https://api.weixin.qq.com/wxa/getwxacodeunlimit?access_token=${tokenResult.accessToken}`,
		{
			method: 'POST',
			headers: {
				'Content-Type': 'application/json; charset=utf-8'
			},
			accept: 'application/json,text/plain,*/*',
			body: payload
		}
	);

	const debugInfo = buildDebugInfo(codeResponse, {
		page,
		envVersion,
		scene
	});
	const qrError = parseJsonSafely(codeResponse.text);
	if (qrError && qrError.errcode) {
		return {
			errCode: qrError.errcode,
			errMsg: `${qrError.errmsg || '生成小程序码失败'} | ${formatDebugInfo(debugInfo)}`,
			result: qrError,
			debug: debugInfo
		};
	}

	if (!isImageResponse(codeResponse)) {
		return {
			errCode: 'MINI_CODE_NOT_IMAGE',
			errMsg: `微信接口返回的不是图片内容 | ${formatDebugInfo(debugInfo)}`,
			debug: debugInfo
		};
	}

	const uploadResult = await uniCloud.uploadFile({
		cloudPath: `zhuohao/${cleanTableNumber}-${Date.now()}.png`,
		fileContent: codeResponse.buffer
	});

	return {
		errCode: 0,
		errMsg: 'ok',
		tableNumber: cleanTableNumber,
		scene,
		orderQrCode: uploadResult.fileID,
		debug: {
			...debugInfo,
			fileID: uploadResult.fileID
		}
	};
}

module.exports = {
	_before: function () {},
	getWechatConfig() {
		return getWechatConfig();
	},
	async getAccessToken() {
		return await getAccessToken();
	},
	async createMiniCode(tableNumber) {
		return await createMiniCode(tableNumber);
	},
	async saveTable(payload = {}) {
		const tableNumber = String(payload.tableNumber || '').trim();
		if (!tableNumber) {
			return {
				errCode: 'TABLE_NUMBER_REQUIRED',
				errMsg: '桌号不能为空'
			};
		}

		const codeResult = await createMiniCode(tableNumber);
		if (codeResult.errCode) {
			return codeResult;
		}

		const docData = {
			createTime: payload.createTime || Date.now(),
			tableNumber: codeResult.tableNumber,
			orderQrCode: codeResult.orderQrCode,
			scene: codeResult.scene
		};

		let docId = payload.id || '';
		if (docId) {
			await zhuohaoCollection.doc(docId).update(docData);
		} else {
			const addResult = await zhuohaoCollection.add(docData);
			docId = addResult.id;
		}

		return {
			errCode: 0,
			errMsg: 'ok',
			id: docId,
			data: {
				_id: docId,
				...docData
			},
			debug: codeResult.debug
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
