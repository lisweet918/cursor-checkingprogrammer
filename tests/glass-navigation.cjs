const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname, '..', '点餐小程序的用户端');
const source = fs.readFileSync(path.join(root, 'components/glass-tabbar/glass-tabbar.vue'), 'utf8');
const script = source.match(/<script>([\s\S]*?)<\/script>/)[1].replace(/^import .*$/gm, '').replace('export default', '');
let hide, navigation, fallback = 0, toast = 0;
const uni = {
  hideTabBar(options) { hide = options; },
  showTabBar() { fallback++; },
  switchTab(options) { navigation = options; },
  showToast() { toast++; }
};
const definition = vm.runInNewContext('(' + script + ')', { uni, glassMotion: {} });
const nav = { selected: 1, glassReset() {} };
Object.assign(nav, definition.data.call(nav));
for (const [name, method] of Object.entries(definition.methods)) nav[name] = method.bind(nav);
nav.reveal();
assert.equal(nav.visible, false, 'native bar stays until hide succeeds');
hide.success();
assert.equal(nav.visible, true);
assert.equal(nav.active, 1);
nav.go(1);
assert.equal(navigation, undefined, 'current tab does not navigate again');
nav.go(0);
assert.equal(navigation.url, '/pages/home/home');
assert.equal(nav.active, 0);
const first = navigation;
nav.go(2);
assert.equal(navigation, first, 'rapid taps are ignored while navigating');
navigation.fail();
navigation.complete();
assert.equal(nav.active, 1, 'failed navigation restores selected state');
assert.equal(nav.navigating, false);
assert.equal(toast, 1);
nav.go(2);
assert.equal(navigation.url, '/pages/my/my');
navigation.complete();
nav.reveal();
hide.fail();
assert.equal(nav.visible, false);
assert.equal(fallback, 1, 'native navigation is restored if custom bar fails');
const pages = JSON.parse(fs.readFileSync(path.join(root, 'pages.json'), 'utf8'));
assert.deepEqual(Array.from(nav.tabs, tab => tab.url.slice(1)), pages.tabBar.list.map(tab => tab.pagePath));
pages.tabBar.list.forEach((tab, index) => {
  const page = fs.readFileSync(path.join(root, tab.pagePath + '.vue'), 'utf8');
  assert.ok(page.includes(':selected="' + index + '"'));
  assert.ok(page.includes('this.$refs.glassTabbar.reveal()'), 'programmatic switchTab refreshes selection');
});
console.log('PASS: original tab routes, selected state, duplicate taps, failed navigation, native fallback and all page hooks');
