// All fixtures are local. No uniCloud or real ordering calls are made.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '../点餐小程序的用户端');
const helperContext = { module: { exports: {} } };
vm.runInNewContext(fs.readFileSync(path.join(root, 'common/product-preferences.js'), 'utf8').replace(/export function/g, 'function') + '\nmodule.exports = { prepareProduct, selectedMaterials };', helperContext);
const { prepareProduct, selectedMaterials } = helperContext.module.exports;
const drink = { id: 'drink-1', category_id: 'tea', name: '测试奶茶', price: 12, is_single: true, images: [{url:'/local-drink.png'}] };
const original = JSON.stringify(drink);
const prepared = prepareProduct(drink, '想喝奶茶！');
assert.equal(prepared.materials.length, 2);
assert.equal(prepared.is_single, false);
assert.equal(selectedMaterials(prepared), '正常糖，正常冰');
assert.equal(JSON.stringify(drink), original, 'source menu is not mutated');
assert.equal(prepareProduct({name:'茶叶蛋', is_single:true}).materials.length, 0);
assert.equal(prepareProduct({name:'测试品牌', is_single:true}, '想喝奶茶！').materials.length, 2, 'drink category enables preferences');
const configured = prepareProduct({...drink, materials:[{group_name:'甜度',values:[{name:'不另外加糖',is_selected:1}]}]});
assert.equal(configured.materials.length, 2);
assert.equal(configured.materials[0].values[0].name, '不另外加糖', 'merchant options retained');
assert.equal(prepareProduct({materials:[null,{values:[]},{group_name:'配菜',values:[null,{name:'青菜'}]}]}).materials.length, 1);
function loadComponent(relative, injected={}) {
 const source = fs.readFileSync(path.join(root, relative), 'utf8').match(/<script>([\s\S]*?)<\/script>/)[1];
 const context = {module:{exports:{}}, prepareProduct, selectedMaterials, Modal:{}, Actions:{}, YierArt:{},
  YierFeedback:{}, CartBar:{}, ProductModal:{}, cartPopup:{}, Search:{}, util:{},
  mapState:()=>({}), mapMutations:()=>({}), ...injected};
 vm.runInNewContext(source.replace(/import[\s\S]*?from\s*['"][^'"]+['"];?/g, '').replace('export default','module.exports ='), context);
 return context.module.exports;
}
function instance(component) {
 const state = { ...component.data(), $set:(obj,key,value)=>{obj[key]=value}, $emit(name,value){this.emitted={name,value}} };
 Object.entries(component.methods || {}).forEach(([key, fn])=>{state[key]=fn.bind(state)});
 Object.entries(component.computed || {}).forEach(([key, fn])=>Object.defineProperty(state,key,{get:()=>fn.call(state)}));
 return state;
}
const modal = loadComponent('components/product-modal/product-modal.vue');
const sheet = instance(modal);
modal.watch.product.handler.call(sheet, prepared);
sheet.add();
sheet.changeMaterialSelected(0,2);
sheet.changeMaterialSelected(1,1);
assert.equal(sheet.getProductSelectedMaterials,'五分糖，少冰');
assert.equal(sheet.productData.number,2,'changing taste preserves chosen quantity');
assert.equal(sheet.currentPrice,12,'preferences do not alter price');
sheet.addToCart();
assert.equal(sheet.emitted.value.materials_text,'五分糖，少冰');
assert.equal(selectedMaterials(prepared),'正常糖，正常冰','modal owns a separate draft');
const page = loadComponent('subpackageHome/pointSingle/point-single.vue');
const menu = instance(page);
menu.handleAddToCartInModal(sheet.emitted.value);
assert.equal(menu.cart.length,1);
assert.equal(menu.cart[0].number,2);
assert.equal(menu.cart[0].materials_text,'五分糖，少冰');
assert.equal(menu.cart[0].image,'/local-drink.png');
modal.watch.product.handler.call(sheet,prepared);
assert.equal(sheet.getProductSelectedMaterials,'正常糖，正常冰','reopening resets unsaved choice');
sheet.addToCart();menu.handleAddToCartInModal(sheet.emitted.value);
assert.equal(menu.cart.length,2,'different preferences are separate cart lines');
menu.handleAddToCart({...menu.cart[0], number:1, is_single:true});
assert.equal(menu.cart[0].number,3,'legacy is_single flag cannot merge another taste');
assert.equal(menu.cart[1].number,1);
menu.handleMinusFromCart(menu.cart[1]);
assert.equal(menu.cart.length,1);
assert.equal(menu.cart[0].materials_text,'五分糖，少冰');
modal.watch.product.handler.call(sheet, {id:'food',price:0,is_single:true,materials:[{group_name:'配菜',values:[{name:'青菜',is_exclusive:1},{name:'蘑菇',is_exclusive:1}]}]});
sheet.changeMaterialSelected(0,0);sheet.changeMaterialSelected(0,1);
assert.equal(sheet.getProductSelectedMaterials,'青菜，蘑菇');
sheet.changeMaterialSelected(0,0);assert.equal(sheet.getProductSelectedMaterials,'蘑菇');
sheet.productData.number=1;sheet.minus();assert.equal(sheet.productData.number,1);
sheet.productData.number=99;sheet.add();assert.equal(sheet.productData.number,99);
const detail = instance(loadComponent('subpackageOrder/order/order-detail.vue',{userDatabase:()=>({})}));
for (const [status,index] of [[0,0],['1',1],[3,2],[2,-1],[null,-1],[undefined,-1],['',-1],[99,-1]]) {
 detail.orderData={status};assert.equal(detail.progressIndex,index,'progress uses only known server states');
 assert.ok(!/配送员|正在赶路/.test(detail.progressCaption),'does not invent courier tracking');
}
console.log('PASS: drink defaults, ordinary dishes, existing groups, single/multiple choice, draft isolation, stable price, taste-specific cart add/minus, quantity bounds, truthful order progress');
