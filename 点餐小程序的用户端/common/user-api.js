export function getSessionUser() {
 const token = uni.getStorageSync('sessionToken')
 const user = uni.getStorageSync('userInfo')
 return typeof token === 'string' && /^[a-f0-9]{64}$/.test(token) && user && user.openid ? user : null
}

// Validate remembered sessions before showing account details. Network errors
// hide unverified details for this visit but do not discard a valid login.
export async function refreshSessionUser() {
 if (!getSessionUser()) return null
 const token = uni.getStorageSync('sessionToken')
 try {
  const result = await userApi('read', { collection: 'wx_users' })
  if (uni.getStorageSync('sessionToken') !== token) return null
  const user = result && result.data && result.data[0]
  if (!user || !user.openid) return null
  uni.setStorageSync('userInfo', user)
  return user
 } catch (_) { return null }
}

export async function userApi(action, data = {}) {
 const token = uni.getStorageSync('sessionToken')
 if (!token) throw new Error('请先重新登录')
 const response = await uniCloud.callFunction({ name: 'user-service', data: { ...data, action, token } })
 const result = response.result || {}
 if (!result.success) {
  if (result.code === 'UNAUTHORIZED' && uni.getStorageSync('sessionToken') === token) { uni.removeStorageSync('sessionToken'); uni.removeStorageSync('userInfo') }
  throw new Error(result.message || '操作失败，请重试')
 }
 return result.result
}

// Keep existing page result shapes while moving private collections behind cloud authentication.
export function userDatabase() {
 return {
  collection(name) {
   if (!['order', 'wx_users', 'user_coupons'].includes(name)) return uniCloud.database().collection(name)
   let id = '', filter = {}, limit = 1000
   const query = {
    doc(value) { id = value; return query },
    where(value) { filter = value; return query },
    orderBy() { return query },
    limit(value) { limit = value; return query },
    async get() { return { result: await userApi('read', { collection: name, id, filter, limit }) } },
    async count() { const result = await userApi('read', { collection: name, filter }); return { result: { total: result.data.length } } },
    async add(data) { return { result: await userApi(name === 'order' ? 'createOrder' : 'claimCoupon', { data }) } },
    async update(data) { return { result: await userApi(name === 'wx_users' ? 'updateAvatar' : 'updateOrder', { id, data }) } },
    async remove() { return { result: await userApi('hideOrder', { id }) } }
   }
   return query
  }
 }
}
