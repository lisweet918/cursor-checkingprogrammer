// Personal-use drink preferences are preparation notes, never price modifiers.
// Keep merchant-defined groups and only supply missing drink preference groups.
export function prepareProduct(product = {}, categoryName = '') {
	const copy = JSON.parse(JSON.stringify(product || {}));
	copy.images = Array.isArray(copy.images) ? copy.images : [];
	copy.labels = Array.isArray(copy.labels) ? copy.labels : [];
	copy.materials = (Array.isArray(copy.materials) ? copy.materials : []).filter(group =>
		group && Array.isArray(group.values) && group.values.some(value => value && value.name)
	).map(group => ({ ...group, values: group.values.filter(value => value && value.name) }));
	const drink = /(奶茶|饮品|饮料|咖啡|果茶|想喝)/.test(categoryName) ||
		/(奶茶|咖啡|拿铁|美式|果茶|柠檬茶|瑞幸|星巴克|蜜雪冰城|霸王茶姬|古茗|茶百道|喜茶|沪上阿姨|茉莉奶白|益禾堂|书亦烧仙草|ChaPanda|Hey Tea|Coco)/i.test(copy.name || '');
	const addGroup = (group_name, names) => copy.materials.push({
		group_name, values: names.map((name, index) => ({ name, is_selected: index === 0 ? 1 : 0, is_exclusive: 0 }))
	});
	if (drink) {
		if (!copy.materials.some(group => /(甜|糖)/.test(group.group_name || ''))) {
			addGroup('甜度', ['正常糖', '七分糖', '五分糖', '三分糖', '无糖']);
		}
		if (!copy.materials.some(group => /(冰|温|冷热)/.test(group.group_name || ''))) {
			addGroup('冰量 / 温度', ['正常冰', '少冰', '去冰', '常温', '热']);
		}
	}
	copy.materials.forEach(group => {
		group.values.forEach(value => {
			value.is_exclusive = value.is_exclusive === true || Number(value.is_exclusive) === 1 ? 1 : 0;
			value.is_selected = value.is_selected === true || Number(value.is_selected) === 1 ? 1 : 0;
		});
		if (!group.values.some(value => value.is_exclusive)) {
			const selected = Math.max(0, group.values.findIndex(value => value.is_selected));
			group.values.forEach((value, index) => { value.is_selected = index === selected ? 1 : 0; });
		}
	});
	if (copy.materials.length) copy.is_single = false;
	copy.number = 1;
	return copy;
}

export function selectedMaterials(product) {
	return (product.materials || []).reduce((names, group) => {
		(group.values || []).forEach(value => { if (value.is_selected) names.push(value.name); });
		return names;
	}, []).join('，');
}
