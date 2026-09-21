<template>
  <view class="uni-container">
    <view class="uni-header">
      <view class="uni-group">
        <view class="uni-title">店铺设置</view>
        <view class="uni-sub-title">修改小程序中显示的店铺名称</view>
      </view>
    </view>
    
    <view class="form-container">
      <view class="field-row">
        <text class="field-label">店铺名称</text>
        <input class="field-input" v-model="formData.store_name" type="text" placeholder="请输入店铺名称" />
      </view>

      <view class="field-row">
        <text class="field-label">营业时间</text>
        <input class="field-input" v-model="formData.business_hours" type="text" placeholder="例：早5:00 - 晚18:00" />
      </view>

      <view class="field-row">
        <text class="field-label">微信接单通知</text>
        <input class="field-input" v-model="formData.pushplus_token" type="text" placeholder="请输入PushPlus的Token，为空则不通知" />
      </view>

      <view class="section-divider">
        <text class="section-title">外卖费用设置</text>
        <text class="section-desc">仅影响外卖订单，全部留空或填 0 则不收取相应费用</text>
      </view>

      <view class="field-row">
        <text class="field-label">打包费(元)</text>
        <input class="field-input" v-model="formData.packing_fee" type="digit" placeholder="每单打包费，例：1" />
      </view>

      <view class="field-row">
        <text class="field-label">配送费(元)</text>
        <input class="field-input" v-model="formData.delivery_fee" type="digit" placeholder="基础配送费，例：3" />
      </view>

      <view class="field-row">
        <text class="field-label">免配送费门槛(元)</text>
        <input class="field-input" v-model="formData.free_delivery_threshold" type="digit" placeholder="满此金额免配送费，0 为不免" />
      </view>

      <view class="field-row">
        <text class="field-label">起送金额(元)</text>
        <input class="field-input" v-model="formData.min_order_amount" type="digit" placeholder="外卖起送门槛，0 为不限制" />
      </view>

      <view class="field-row actions">
        <button class="uni-button" type="primary" :loading="loading" @click="submit">保存修改</button>
      </view>
    </view>
  </view>
</template>

<script>
const db = uniCloud.database()

export default {
  data() {
    return {
      recordId: '',
      loading: false,
      formData: {
        store_name: '一二布布食堂',
        business_hours: '早5:00 - 晚18:00',
        pushplus_token: '',
        packing_fee: '',
        delivery_fee: '',
        free_delivery_threshold: '',
        min_order_amount: ''
      }
    }
  },
  onLoad() {
    this.loadSettings()
  },
  methods: {
    async loadSettings() {
      uni.showLoading({ title: '加载中...' })
      try {
        const res = await db.collection('store_settings').get()
        if (res.result.data && res.result.data.length > 0) {
          const setting = res.result.data[0]
          this.recordId = setting._id
          this.formData.store_name = setting.store_name || '一二布布食堂'
          this.formData.business_hours = setting.business_hours || '早5:00 - 晚18:00'
          this.formData.pushplus_token = setting.pushplus_token || ''
          this.formData.packing_fee = setting.packing_fee != null ? String(setting.packing_fee) : ''
          this.formData.delivery_fee = setting.delivery_fee != null ? String(setting.delivery_fee) : ''
          this.formData.free_delivery_threshold = setting.free_delivery_threshold != null ? String(setting.free_delivery_threshold) : ''
          this.formData.min_order_amount = setting.min_order_amount != null ? String(setting.min_order_amount) : ''
        }
      } catch (e) {
        console.error('Failed to load settings:', e)
      } finally {
        uni.hideLoading()
      }
    },
    toAmount(val) {
      const n = parseFloat(val)
      if (isNaN(n) || n < 0) return 0
      return Math.round(n * 100) / 100
    },
    async submit() {
      if (!this.formData.store_name.trim()) {
        uni.showToast({ title: '店铺名称不能为空', icon: 'none' })
        return
      }
      
      this.loading = true
      try {
        const payload = {
          store_name: this.formData.store_name.trim(),
          business_hours: this.formData.business_hours.trim(),
          pushplus_token: this.formData.pushplus_token.trim(),
          packing_fee: this.toAmount(this.formData.packing_fee),
          delivery_fee: this.toAmount(this.formData.delivery_fee),
          free_delivery_threshold: this.toAmount(this.formData.free_delivery_threshold),
          min_order_amount: this.toAmount(this.formData.min_order_amount)
        }
        if (this.recordId) {
          await db.collection('store_settings').doc(this.recordId).update(payload)
        } else {
          const res = await db.collection('store_settings').add(payload)
          this.recordId = res.result.id
        }
        uni.showToast({ title: '保存成功', icon: 'success' })
      } catch (e) {
        uni.showModal({ title: '保存失败', content: e.message, showCancel: false })
      } finally {
        this.loading = false
      }
    }
  }
}
</script>

<style scoped>
.form-container {
  padding: 20px;
  background: #fff;
  border-radius: 8px;
  margin-top: 20px;
  max-width: 600px;
}
.field-row {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
}
.section-divider {
  display: flex;
  flex-direction: column;
  border-top: 1px solid #ebeef5;
  padding-top: 20px;
  margin-bottom: 20px;
}
.section-title {
  font-size: 15px;
  font-weight: bold;
  color: #303133;
}
.section-desc {
  font-size: 12px;
  color: #909399;
  margin-top: 6px;
}
.field-label {
  width: 100px;
  font-size: 14px;
  color: #333;
}
.field-input {
  flex: 1;
  height: 40px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  padding: 0 15px;
  font-size: 14px;
}
.field-input:focus {
  border-color: #409eff;
}
.actions {
  margin-top: 30px;
  justify-content: flex-start;
  padding-left: 100px;
}
</style>
