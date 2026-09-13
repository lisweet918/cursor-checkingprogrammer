const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '..');
const userRoot = path.join(root, '点餐小程序的用户端');
const token = 'a'.repeat(64);
let tables = {
 wx_users: [{_id:'u1',openid:'owner',points:0,session_hash:crypto.createHash('sha256').update(token).digest('hex'),session_expires:Date.now()+60000}],
 order:[{_id:'other-order',user_id:'other',status:0}],
 product:[{_id:'product-string-id',name:'测试菜品',price:25,is_show:true,is_pickup:1,is_takeout:1}],
 user_coupons:[],store_settings:[{_id:'settings',packing_fee:0,delivery_fee:2,min_order_amount:10}]
};
const copy = value => JSON.parse(JSON.stringify(value));
function database(getTables) {
 return {
  command: {inc: value => ({increment:value})},
  collection(name) {
   let id, filter = {}, skip=0, limit=100;
   const q = {
    doc(value){id=value;return q;},where(value){filter=value;return q;},orderBy(){return q;},skip(value){skip=value;return q;},limit(value){limit=value;return q;},
    async get(){const list=(getTables()[name] || []).filter(row=>(!id || row._id===id)&&Object.entries(filter).every(([k,v])=>row[k]===v));return {data:copy(list.slice(skip,skip+limit))};},
    async add(row){const list=getTables()[name] || (getTables()[name]=[]);if(list.some(r=>r._id===row._id))throw Error('duplicate id');list.push(copy(row));return {id:row._id};},
    async update(data){const row=getTables()[name].find(r=>r._id===id);if(!row)throw Error('missing row');for(const [k,v]of Object.entries(data))row[k]=v&&typeof v==='object'&&'increment'in v?(row[k]||0)+v.increment:v;return {updated:1};}
   };return q;
  },
  async startTransaction(){const draft=copy(getTables());const tx=database(()=>draft);tx.commit=async()=>{tables=draft;};tx.rollback=async()=>{};return tx;}
 };
}
const db=database(()=>tables);
const context={exports:{},require,process:{env:{}},uniCloud:{database:()=>db,callFunction:async()=>({})}};
vm.runInNewContext(fs.readFileSync(path.join(userRoot,'uniCloud-alipay/cloudfunctions/user-service/index.js'),'utf8'),context);
const call=(action,data={})=>context.exports.main({action,token,...data});
async function run(){
 assert.equal((await context.exports.main({action:'read',collection:'order',token:'forged'})).code,'UNAUTHORIZED');
 const before=JSON.stringify(tables);
 assert.equal((await call('read',{collection:'order',id:'other-order'})).success,false);
 assert.equal((await call('updateOrder',{id:'other-order',data:{status:2}})).success,false);
 assert.equal(JSON.stringify(tables),before);
 assert.equal((await call('claimCoupon')).success,true);
 assert.equal((await call('claimCoupon')).success,false);
 const coupon=tables.user_coupons[0];
 const payload={type:'takein',request_id:'regression-order-1',price:20,coupon_id:coupon._id,commodity_list:[{id:'product-string-id',number:1,price:25,materials_text:'五分糖，少冰'}]};
 assert.equal((await call('createOrder',{data:{...payload,price:0}})).success,false);
 assert.equal(tables.user_coupons[0].status,0,'failed order rolls coupon back');
 const created=await call('createOrder',{data:payload});assert.equal(created.success,true,created.message);
 const id=created.result.id;
 assert.equal(tables.order.find(order=>order._id===id).commodity_list[0].materials_text,'五分糖，少冰','taste notes survive server order creation');
 assert.equal(tables.order.length,2);assert.equal(tables.wx_users[0].points,10);assert.equal(tables.user_coupons[0].status,1);
 assert.equal((await call('createOrder',{data:payload})).result.id,id,'retry is idempotent');
 assert.equal(tables.order.length,2);assert.equal(tables.wx_users[0].points,10);
 assert.equal((await call('createOrder',{data:{...payload,request_id:'regression-order-2'}})).success,false,'used coupon rejected');
 assert.equal((await call('hideOrder',{id})).success,false,'active order preserved');
 assert.equal((await call('updateOrder',{id,data:{status:2}})).success,true);
 assert.equal(tables.user_coupons[0].status,0);assert.equal(tables.wx_users[0].points,0);
 assert.equal((await call('hideOrder',{id})).success,true);
 assert.ok(tables.order.find(o=>o._id===id),'hide keeps merchant order');
 assert.equal((await call('read',{collection:'order'})).result.data.length,0);
 assert.equal((await call('updateAvatar',{data:{avatar:'https://example.com/avatar.jpg',points:999}})).success,true);
 assert.equal(tables.wx_users[0].points,0,'client cannot modify points');
 const storage = new Map([['userInfo',{openid:'owner'}]]);
 let selectedAddress = null;
 const addressUi = {
  getStorageSync:key=>storage.get(key),setStorageSync:(key,value)=>storage.set(key,value),
  showToast:()=>{},navigateBack:()=>{},showModal:options=>options.success({confirm:true})
 };
 function loadAddressPage(rel) {
  const source=fs.readFileSync(path.join(userRoot,rel),'utf8');
  const sandbox={module:{exports:{}},uni:addressUi};
  vm.runInNewContext(source.match(/<script>([\s\S]*?)<\/script>/)[1].replace('export default','module.exports ='),sandbox);
  const component=sandbox.module.exports, state=component.data();
  state.$store={state:{get addressInfo(){return selectedAddress || {}}},commit:(name,value)=>{selectedAddress=value;}};
  for(const [name,fn]of Object.entries(component.methods||{}))state[name]=fn.bind(state);
  return {component,state};
 }
 const editor=loadAddressPage('subpackageMy/myAddress/add-address.vue');editor.component.onLoad.call(editor.state,{});
 editor.state.form={name:'张三',phone:'13800138000',address:'测试街道',house_number:'101'};editor.state.save();
 assert.equal(storage.get('addresses:owner').length,1);assert.equal(selectedAddress.name,'张三');
 const manager=loadAddressPage('subpackageMy/myAddress/address-manage.vue');manager.component.onShow.call(manager.state);
 manager.state.chooseAddress(manager.state.dataList[0]);assert.equal(selectedAddress.phone,'13800138000');
 manager.state.remove(manager.state.dataList[0]);assert.equal(storage.get('addresses:owner').length,0);
 assert.equal(Object.keys(selectedAddress).length,0);
 storage.set('userInfo',{openid:'another-user'});manager.component.onShow.call(manager.state);assert.equal(manager.state.dataList.length,0);
 for(const rel of ['subpackageHome/pointsMall/points-mall.vue','subpackageHome/pointsMall/withdraw-history.vue','subpackageMy/riderCenter/rider-center.vue']) {
  const source=fs.readFileSync(path.join(userRoot,rel),'utf8');assert.ok(!source.includes('<script setup>'));
  const script=source.match(/<script>([\s\S]*?)<\/script>/)[1].replace('export default','module.exports =');
  const sandbox={module:{exports:{}},uni:{previewImage:()=>{},showToast:()=>{}}};vm.runInNewContext(script,sandbox);
  const component=sandbox.module.exports;const state=component.data();
  for(const [name,fn]of Object.entries(component.methods||{}))state[name]=fn.bind(state);
  if(state.change){state.change(1);state.previewImage('image',[]);state.popupModal(state.completedOrders[0]);assert.equal(state.popupShow,true);}
 }
 console.log('PASS: login boundary, ownership, coupon uniqueness, price validation, rollback, idempotency, cancellation, soft deletion, points protection, address CRUD/isolation and three Vue 2 pages');
}
run().catch(error=>{console.error(error);process.exitCode=1;});
