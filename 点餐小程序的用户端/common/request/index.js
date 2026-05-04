import promotion from './promotion.js'
import order from './order.js'
import menu from './menu.js'

const json = {
	promotion,
	order,
	menu
}

export default async (name, loading = true) => {
	if (loading) {
		uni.showLoading()
	}

	if (name === 'menu') {
		try {
			const db = uniCloud.database()
			const catRes = await db.collection('category').where({is_show: true}).orderBy('sort', 'asc').get()
			const prodRes = await db.collection('product').where({is_show: true}).orderBy('sort', 'asc').get()

			// 提取所有的 fileID (包含分类图片和产品图片)
			const allFileIds = [];
			catRes.result.data.forEach(c => {
				if (c.category_image_url) allFileIds.push(c.category_image_url);
			});
			prodRes.result.data.forEach(p => {
				if (p.images && p.images.length > 0) {
					p.images.forEach(img => {
						if (img.url) allFileIds.push(img.url);
					});
				}
			});

			let urlMap = {};
			if (allFileIds.length > 0) {
				const uniqueFileIds = [...new Set(allFileIds)];
				// 阿里云/支付宝云在有大量图片时可能需要分批处理，但通常够用
				const urlRes = await uniCloud.getTempFileURL({ fileList: uniqueFileIds });
				urlRes.fileList.forEach(f => {
					urlMap[f.fileID] = f.tempFileURL || f.download_url || f.fileID;
				});
			}

			const categories = catRes.result.data.map(cat => {
				const products = prodRes.result.data
					.filter(p => p.category_id === cat._id)
					.sort((a, b) => (a.sort || 0) - (b.sort || 0))
					.map(p => {
						let safeImages = p.images && p.images.length > 0 ? p.images : [{ url: '' }];
						// 转换真实地址
						safeImages = safeImages.map(img => {
							return { ...img, url: urlMap[img.url] || img.url };
						});
						return { 
							...p, 
							id: p._id,
							labels: p.labels || [],
							materials: p.materials || [],
							images: safeImages,
							is_single: p.is_single !== false
						}
					})
				return {
					id: cat._id,
					name: cat.name,
					category_image_url: urlMap[cat.category_image_url] || cat.category_image_url || "",
					products: products
				}
			}).filter(cat => cat.products.length > 0) // Optionally hide empty categories

			uni.hideLoading()
			
			// 如果数据库是空的，使用默认静态数据兜底
			if (categories.length === 0) {
				return json[name]
			}
			return categories
		} catch (e) {
			console.error('Fetch menu failed', e)
			uni.hideLoading()
			return json[name] // 报错兜底
		}
	}

	return new Promise(resolve => {
		setTimeout(() => {
			uni.hideLoading()
			resolve(json[name])
		}, 500)
	})
}