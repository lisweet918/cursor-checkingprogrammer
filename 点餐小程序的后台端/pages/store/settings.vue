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
        store_name: '七香嫂包子铺',
        business_hours: '早5:00 - 晚18:00',
        pushplus_token: ''
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
          this.formData.store_name = setting.store_name || '七香嫂包子铺'
          this.formData.business_hours = setting.business_hours || '早5:00 - 晚18:00'
          this.formData.pushplus_token = setting.pushplus_token || ''
        }
      } catch (e) {
        console.error('Failed to load settings:', e)
      } finally {
        uni.hideLoading()
      }
    },
    async submit() {
      if (!this.formData.store_name.trim()) {
        uni.showToast({ title: '店铺名称不能为空', icon: 'none' })
        return
      }
      
      this.loading = true
      try {
        if (this.recordId) {
          // 更新
          await db.collection('store_settings').doc(this.recordId).update({
            store_name: this.formData.store_name.trim(),
            business_hours: this.formData.business_hours.trim(),
            pushplus_token: this.formData.pushplus_token.trim()
          })
        } else {
          // 新增
          const res = await db.collection('store_settings').add({
            store_name: this.formData.store_name.trim(),
            business_hours: this.formData.business_hours.trim(),
            pushplus_token: this.formData.pushplus_token.trim()
          })
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
