<template>
  <view class="uni-container">
    <uni-forms ref="form" :model="formData" validateTrigger="bind">
      <uni-forms-item name="createTime" label="" required>
        <uni-datetime-picker return-type="timestamp" v-model="formData.createTime"></uni-datetime-picker>
      </uni-forms-item>
      <uni-forms-item name="tableNumber" label="桌号" required>
        <uni-easyinput placeholder="桌号" v-model="formData.tableNumber"></uni-easyinput>
      </uni-forms-item>
      <uni-forms-item name="orderQrCode" label="点餐二维码">
        <uni-easyinput placeholder="保存后自动生成小程序码" v-model="formData.orderQrCode" :disabled="true"></uni-easyinput>
        <view v-if="qrCodeTempUrl" class="qr-link-wrap">
          <text class="qr-link" @click="openQrCode">预览/下载二维码</text>
        </view>
      </uni-forms-item>
      <uni-forms-item name="scene" label="">
        <uni-easyinput placeholder="保存后自动绑定场景值" v-model="formData.scene" :disabled="true"></uni-easyinput>
      </uni-forms-item>
      <view class="uni-button-group">
        <button type="primary" class="uni-button" style="width: 100px;" @click="submit">提交</button>
        <navigator open-type="navigateBack" style="margin-left: 15px;">
          <button class="uni-button" style="width: 100px;">返回</button>
        </navigator>
      </view>
    </uni-forms>
  </view>
</template>

<script>
  import { validator } from '../../js_sdk/validator/zhuohao.js';

  const zhuohaoObj = uniCloud.importObject('zhuohao');

  function getValidator(fields) {
    let result = {}
    for (let key in validator) {
      if (fields.includes(key)) {
        result[key] = validator[key]
      }
    }
    return result
  }

  function getCloudFileUrl(fileInfo = {}) {
    return fileInfo.tempFileURL || fileInfo.tempFileUrl || fileInfo.download_url || fileInfo.downloadUrl || fileInfo.url || ''
  }

  function formatDebugInfo(debug = {}) {
    if (!debug || !Object.keys(debug).length) {
      return ''
    }
    return [
      `statusCode: ${debug.statusCode || ''}`,
      `contentType: ${debug.contentType || ''}`,
      `bufferSize: ${debug.bufferSize || 0}`,
      `bufferSignature: ${debug.bufferSignature || ''}`,
      `page: ${debug.page || ''}`,
      `envVersion: ${debug.envVersion || ''}`,
      `scene: ${debug.scene || ''}`,
      `bodyPreview: ${debug.bodyPreview || ''}`
    ].join('\n')
  }

  function buildErrorMessage(res = {}) {
    const debugText = formatDebugInfo(res.debug)
    const rawText = JSON.stringify(res, null, 2)
    return (res.errMsg || '生成小程序码失败') + (debugText ? `\n\n${debugText}` : '') + (rawText ? `\n\nraw: ${rawText}` : '')
  }

  export default {
    data() {
      let formData = {
        "createTime": Date.now(),
        "tableNumber": "",
        "orderQrCode": "",
        "scene": ""
      }
      return {
        formData,
        formOptions: {},
        qrCodeTempUrl: '',
        rules: {
          ...getValidator(['createTime', 'tableNumber'])
        }
      }
    },
    onReady() {
      this.$refs.form.setRules(this.rules)
    },
    methods: {
      /**
       * 验证表单并提交
       */
      submit() {
        uni.showLoading({
          title: '正在生成小程序码',
          mask: true
        })
        this.$refs.form.validate().then((res) => {
          return this.submitForm(res)
        }).catch(() => {
        }).finally(() => {
          uni.hideLoading()
        })
      },

      async resolveQrCodeTempUrl(fileID) {
        if (!fileID) {
          this.qrCodeTempUrl = ''
          return ''
        }
        const res = await uniCloud.getTempFileURL({
          fileList: [fileID]
        })
        const fileList = res.fileList || []
        const fileInfo = fileList[0] || {}
        this.qrCodeTempUrl = getCloudFileUrl(fileInfo)
        return this.qrCodeTempUrl
      },

      openQrCode() {
        if (!this.qrCodeTempUrl) {
          return
        }
        window.open(this.qrCodeTempUrl, '_blank')
      },

      /**
       * 提交表单
       */
      async submitForm(value) {
        try {
          const res = await zhuohaoObj.saveTable(value)
          if (res.errCode && res.errCode !== 0) {
            const debugText = formatDebugInfo(res.debug)
            if (debugText) {
              console.error('桌号二维码生成调试信息\n' + debugText)
            }
            console.error('桌号二维码生成失败原始返回', res)
            throw new Error(buildErrorMessage(res))
          }
          this.formData = {
            ...this.formData,
            ...res.data
          }
          await this.resolveQrCodeTempUrl(res.data.orderQrCode)
          if (res.debug) {
            console.log('桌号二维码生成调试信息\n' + formatDebugInfo(res.debug))
          }
          uni.showToast({
            title: '新增成功'
          })
          this.getOpenerEventChannel().emit('refreshData')
          setTimeout(() => uni.navigateBack(), 500)
        } catch (err) {
          uni.showModal({
            content: err.message || '请求服务失败',
            showCancel: false
          })
        }
      }
    }
  }
</script>

<style>
  .qr-link-wrap {
    margin-top: 12px;
  }

  .qr-link {
    color: #2979ff;
  }
</style>
