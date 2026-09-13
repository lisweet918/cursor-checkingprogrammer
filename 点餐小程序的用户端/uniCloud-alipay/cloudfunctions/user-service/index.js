'use strict';
const crypto = require('crypto');
const db = uniCloud.database();
const DEFAULT_NOTIFICATION_TOKEN = 'order_notification_secret_token_2026';
const hash = value => crypto.createHash('sha256').update(value).digest('hex');
const first = result => Array.isArray(result.data) ? result.data[0] : result.data;
const text = (value, max = 200) => String(value == null ? '' : value).slice(0, max);
function cents(value) {
 const number = Number(value);
 if (!Number.isFinite(number) || number < 0) throw new Error('金额配置不正确');
 return Math.round(number * 100);
}
function publicUser(user) {
 const { _id, openid, nickname, avatar, points, createTime } = user;
 return { _id, openid, nickname, avatar, points: points || 0, createTime };
}
async function authenticate(token) {
 if (typeof token !== 'string' || !/^[a-f0-9]{64}$/.test(token)) return null;
 const result = await db.collection('wx_users').where({ session_hash: hash(token) }).limit(1).get();
 const user = first(result);
 return user && user.session_expires > Date.now() ? user : null;
}
async function ownedOrder(id, user, database = db) {
 if (typeof id !== 'string' || !id) throw new Error('订单不存在');
 const order = first(await database.collection('order').doc(id).get());
 if (!order || order.user_id !== user.openid) throw new Error('订单不存在或无权操作');
 return order;
}
async function read(event, user) {
 if (event.collection === 'wx_users') return { data: [publicUser(user)] };
 if (!['order', 'user_coupons'].includes(event.collection)) throw new Error('不支持的查询');
 if (event.id && event.collection === 'order') {
  const order = await ownedOrder(event.id, user);
  return { data: order.is_show === false || order.user_hidden ? [] : [order] };
 }
 const rows = [];
 // Explicit paging avoids the database's default result limit.
 for (let offset = 0; offset < 1000; offset += 100) {
  const page = await db.collection(event.collection).where({ user_id: user.openid })
   .orderBy(event.collection === 'order' ? 'createTime' : 'create_time', 'desc').skip(offset).limit(100).get();
  rows.push(...page.data);
  if (page.data.length < 100) break;
 }
 const filter = event.filter && typeof event.filter === 'object' ? event.filter : {};
 return { data: rows.filter(row => {
  if (event.collection === 'order' && (row.is_show === false || row.user_hidden)) return false;
  if (filter.status !== undefined && row.status !== filter.status) return false;
  if (filter.source !== undefined && row.source !== filter.source) return false;
  if (filter.unexpired && row.expire_time && Number(row.expire_time) <= Date.now()) return false;
  return true;
 }).slice(0, Math.min(1000, Math.max(1, Number(event.limit) || 1000))) };
}
async function claimCoupon(user) {
 const id = hash('newbie:' + user.openid).slice(0,24);
 const existing = await db.collection('user_coupons').where({ user_id: user.openid, source: 'newbie' }).limit(1).get();
 if (existing.data.length) throw new Error('新人券已领取过');
 // A deterministic primary key prevents concurrent claims from issuing duplicate coupons.
 await db.collection('user_coupons').add({ _id: id, user_id: user.openid, name: '新人专享券',
  amount: 5, threshold: 20, status: 0, source: 'newbie', create_time: Date.now(), expire_time: Date.now() + 30*86400000 });
 return { id };
}
async function createOrder(input, user) {
 if (!input || !['takein','takeout'].includes(input.type)) throw new Error('订单类型无效');
 if (!/^[a-zA-Z0-9-]{8,100}$/.test(input.request_id || '')) throw new Error('请返回结算页重新下单');
 const id = hash(user.openid + ':' + input.request_id).slice(0,24);
 const previous = first(await db.collection('order').doc(id).get());
 if (previous) { if(previous.user_id !== user.openid) throw new Error('订单冲突'); return { id }; }
 if (!Array.isArray(input.commodity_list) || !input.commodity_list.length || input.commodity_list.length > 100) throw new Error('购物车无效');
 let goods = 0, quantity = 0;
 const products = [];
 for (const item of input.commodity_list) {
  const count = Number(item.number);
  if (!Number.isInteger(count) || count < 1 || count > 99) throw new Error('商品数量无效');
  const product = first(await db.collection('product').doc(text(item.id,100)).get());
  if (!product || product.is_show === false || product[input.type === 'takeout' ? 'is_takeout' : 'is_pickup'] === 0) throw new Error('部分菜品已下架，请返回菜单重新选择');
  const price = cents(product.price);
  if (price !== cents(item.price)) throw new Error('菜品价格已更新，请返回菜单重新选择');
  goods += price * count; quantity += count;
  products.push({ id: String(product._id), name: product.name, price: price/100, number: count,
   image: text(item.image,2000), is_single: product.is_single !== false, materials_text: text(item.materials_text) });
 }
 const settings = first(await db.collection('store_settings').limit(1).get()) || {};
 const packing = cents(settings.packing_fee || 0);
 const freeThreshold = cents(settings.free_delivery_threshold || 0);
 const delivery = input.type === 'takeout' && !(freeThreshold > 0 && goods >= freeThreshold) ? cents(settings.delivery_fee || 0) : 0;
 if (input.type === 'takeout' && goods < cents(settings.min_order_amount || 0)) throw new Error('未达到店铺起送金额');
 if (input.type === 'takeout' && (!text(input.address).trim() || !text(input.name).trim() || !/^1\d{10}$/.test(input.phone || ''))) throw new Error('请填写完整的收货地址和手机号码');
 if (input.delivery_type === 'reservation' && !text(input.reservation_time).trim()) throw new Error('请选择预约送达时间');
 const tx = await db.startTransaction();
 try {
  let deduct = 0;
  if (input.coupon_id) {
   const coupon = first(await tx.collection('user_coupons').doc(text(input.coupon_id,100)).get());
   if (!coupon || coupon.user_id !== user.openid || coupon.status !== 0 || (coupon.expire_time && coupon.expire_time <= Date.now()) || goods < cents(coupon.threshold || 0)) throw new Error('优惠券不可用，请重新选择');
   deduct = Math.min(goods, cents(coupon.amount));
   await tx.collection('user_coupons').doc(coupon._id).update({ status:1, used_order_id:id, used_time:Date.now() });
  }
  const total = goods + packing + delivery - deduct;
  if (total !== cents(input.price)) throw new Error('费用已更新，请重新进入结算页');
  const order = { _id:id, request_id:input.request_id, user_id:user.openid, createTime:Date.now(),
   out_trade_no:'WX'+Date.now()+id.slice(-8), torder:'T'+id.slice(-6).toUpperCase(), type:input.type, status:0,
   tableNumber:input.type==='takein'?text(input.tableNumber,30):'', diningCount:Math.max(0,Math.min(100,parseInt(input.diningCount)||0)),
   commodity_list:products, shop_num:quantity, goods_amount:goods/100, packing_fee:packing/100, delivery_fee:delivery/100,
   coupon_deduct:deduct/100, coupon_id:text(input.coupon_id,100), price:total/100, remark:text(input.remark),
   name:text(input.name,50), phone:text(input.phone,30), address:text(input.address), house_number:text(input.house_number),
   delivery_type:input.delivery_type==='reservation'?'reservation':'immediately', reservation_time:text(input.reservation_time,100),
   orderstatus:0, delivery_status:0, is_show:true, user_hidden:false, payment_time_text:'', points_awarded:10 };
  await tx.collection('order').add(order);
  await tx.collection('wx_users').doc(user._id).update({ points:db.command.inc(10) });
  await tx.commit();
  // The notification function loads this persisted order, never caller-supplied order details.
  try { await uniCloud.callFunction({ name:'push-order-notification', data:{ orderId:id, internalToken:process.env.ORDER_NOTIFICATION_TOKEN || DEFAULT_NOTIFICATION_TOKEN } }); } catch (_) {}
  return { id };
 } catch (error) { await tx.rollback(); throw error; }
}
exports.main = async event => {
 try {
  const user = await authenticate(event.token);
  if (!user) return { success:false, code:'UNAUTHORIZED', message:'登录已失效，请重新登录' };
  let result;
  switch (event.action) {
   case 'read': result = await read(event,user); break;
   case 'claimCoupon': result = await claimCoupon(user); break;
   case 'createOrder': result = await createOrder(event.data,user); break;
   case 'updateAvatar': {
    const avatar = text(event.data && event.data.avatar,2000);
    if (!/^(cloud:\/\/|https:\/\/)/.test(avatar)) throw new Error('头像地址无效');
    result = await db.collection('wx_users').doc(user._id).update({ avatar }); break;
   }
   case 'updateOrder': {
    if (!event.data || event.data.status !== 2) throw new Error('不允许此操作');
    const tx = await db.startTransaction();
    try {
     const order = await ownedOrder(event.id,user,tx);
     if(order.status !== 0) throw new Error('商家已处理订单，无法直接取消');
     await tx.collection('order').doc(event.id).update({ status:2 });
     if(order.points_awarded) {
      const member = first(await tx.collection('wx_users').doc(user._id).get());
      await tx.collection('wx_users').doc(user._id).update({points:Math.max(0,Number(member.points || 0)-Number(order.points_awarded))});
     }
     if(order.coupon_id) {
      const coupon = first(await tx.collection('user_coupons').doc(order.coupon_id).get());
      if(coupon && coupon.used_order_id===event.id) await tx.collection('user_coupons').doc(order.coupon_id).update({status:0,used_order_id:'',used_time:0});
     }
     await tx.commit(); result={ updated:1 };
    } catch(error) { await tx.rollback(); throw error; }
    break;
   }
   case 'hideOrder': {
    const order = await ownedOrder(event.id,user);
    if(![2,3].includes(order.status)) throw new Error('进行中的订单不可删除');
    result = await db.collection('order').doc(event.id).update({ user_hidden:true }); break;
   }
   default: throw new Error('不支持的操作');
  }
  return { success:true, result };
 } catch(error) { return { success:false, message:error.message || '操作失败' }; }
};
