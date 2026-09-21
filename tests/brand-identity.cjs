const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const skip = new Set(['unpackage', 'node_modules', '.git']);
const exts = new Set(['.vue', '.js', '.scss', '.json', '.css', '.md']);
const forbidden = [
	'倚品',
	'七香嫂',
	'heytea.com',
	'#0A3D28',
	'#0a3d28',
	'QXS_'
];
const hits = [];

function walk(dir) {
	for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
		if (skip.has(entry.name)) continue;
		const full = path.join(dir, entry.name);
		if (entry.isDirectory()) {
			walk(full);
			continue;
		}
		if (!exts.has(path.extname(entry.name))) continue;
		let text;
		try { text = fs.readFileSync(full, 'utf8'); } catch (_) { continue; }
		for (const token of forbidden) {
			if (text.includes(token)) hits.push(`${path.relative(root, full)}: ${token}`);
		}
	}
}

walk(root);
assert.deepEqual(hits, [], hits.join('\n'));
const pages = JSON.parse(fs.readFileSync(path.join(root, '点餐小程序的用户端/pages.json'), 'utf8'));
assert.equal(pages.globalStyle.navigationBarTitleText, '一二布布食堂');
const brand = fs.readFileSync(path.join(root, '点餐小程序的用户端/common/brand.js'), 'utf8');
assert.ok(brand.includes("STORE_NAME = '一二布布食堂'"));
console.log('PASS: source identity is 一二布布食堂');
