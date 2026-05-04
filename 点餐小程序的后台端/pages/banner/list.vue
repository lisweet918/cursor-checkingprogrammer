<template>
  <view>
    <view class="uni-header">
      <view class="uni-group">
        <view class="uni-title">轮播图管理</view>
        <view class="uni-sub-title">管理小程序首页顶部轮播图</view>
      </view>
      <view class="uni-group">
        <button class="uni-button" type="primary" size="mini" @click="openForm()">+ 新增图片</button>
      </view>
    </view>

    <view class="uni-container">
      <unicloud-db
        ref="udb"
        collection="banner"
        field="_id,image,sort,is_show,createTime"
        orderby="sort asc, createTime desc"
        :getcount="true"
        loadtime="manual"
        v-slot:default="{ data, loading, error }"
        @load="onDbLoad"
      >
        <uni-table :loading="loading" :emptyText="error.message || '暂无轮播图'" border stripe>
          <uni-tr>
            <uni-th align="center" width="80">排序</uni-th>
            <uni-th align="center" width="200">图片</uni-th>
            <uni-th align="center" width="100">状态</uni-th>
            <uni-th align="center" width="160">创建时间</uni-th>
            <uni-th align="center" width="160">操作</uni-th>
          </uni-tr>
          <uni-tr v-for="(item, index) in data" :key="index">
            <uni-td align="center">{{ item.sort || 0 }}</uni-td>
            <uni-td align="center">
              <image :src="item.image" style="width: 120px; height: 60px; object-fit: cover; border-radius: 4px;" />
            </uni-td>
            <uni-td align="center">
              <text :style="{ color: item.is_show === false ? '#bbb' : '#52c41a' }">
                {{ item.is_show === false ? '已隐藏' : '显示中' }}
              </text>
            </uni-td>
            <uni-td align="center">
              <uni-dateformat :threshold="[0,0]" :date="item.createTime"></uni-dateformat>
            </uni-td>
            <uni-td align="center">
              <view class="uni-group">
                <button class="uni-button" size="mini" type="primary" @click="openForm(item)">编辑</button>
                <button class="uni-button" size="mini" type="warn" @click="confirmDelete(item._id)">删除</button>
              </view>
            </uni-td>
          </uni-tr>
        </uni-table>
      </unicloud-db>
    </view>

    <!-- 新增/编辑弹窗 -->
    <uni-popup ref="formPopup" type="center" :mask-click="false">
      <view class="popup-box">
        <view class="popup-title">{{ editId ? '编辑图片' : '新增图片' }}</view>
        <view class="popup-body">
          <view class="field-row">
            <text class="field-label"><text style="color:red">*</text> 图片</text>
            <view class="img-uploader" @click="chooseImage">
              <image v-if="formData.image" :src="formData.image" class="preview-img" mode="aspectFill"></image>
              <view v-else class="img-add-btn">
                <text class="plus">+</text>
                <text class="text">点击上传</text>
              </view>
            </view>
          </view>
          <view class="field-row">
            <text class="field-label">排序权重</text>
            <input class="field-input" v-model="formData.sort" type="number" placeholder="数值越小越靠前，默认0" />
          </view>
          <view class="field-row" style="align-items:center">
            <text class="field-label">是否显示</text>
            <switch :checked="formData.is_show" @change="formData.is_show = $event.detail.value" />
          </view>
        </view>
        <view class="popup-footer">
          <button class="uni-button" @click="closeForm">取消</button>
          <button class="uni-button" type="primary" :loading="submitting" @click="submitForm">{{ editId ? '保存' : '新增' }}</button>
        </view>
      </view>
    </uni-popup>
  </view>
</template>

<script>
  const db = uniCloud.database()

  export default {
    data() {
      return {
        editId: '',
        submitting: false,
        formData: {
          image: '',
          sort: '',
          is_show: true
        }
      }
    },
    onReady() {
      this.$refs.udb.loadData()
    },
    methods: {
      onDbLoad() {},

      openForm(item) {
        if (item) {
          this.editId = item._id
          this.formData = {
            image: item.image || '',
            sort: item.sort !== undefined ? String(item.sort) : '',
            is_show: item.is_show !== false
          }
        } else {
          this.editId = ''
          this.formData = { image: '', sort: '', is_show: true }
        }
        this.$refs.formPopup.open()
      },

      closeForm() {
        this.$refs.formPopup.close()
      },

      chooseImage() {
        uni.chooseImage({
          count: 1,
          sizeType: ['compressed'],
          sourceType: ['album', 'camera'],
          success: async (res) => {
            uni.showLoading({ title: '上传中...', mask: true })
            try {
              const tempPath = res.tempFilePaths[0]
              const fileName = `banner/${Date.now()}_${Math.random().toString(36).slice(2)}.jpg`
              const uploadRes = await uniCloud.uploadFile({
                filePath: tempPath,
                cloudPath: fileName
              })
              this.formData.image = uploadRes.fileID
            } catch (e) {
              uni.showModal({ title: '上传失败', content: e.message, showCancel: false })
            } finally {
              uni.hideLoading()
            }
          }
        })
      },

      async submitForm() {
        if (!this.formData.image) {
          uni.showToast({ icon: 'none', title: '请上传图片' })
          return
        }
        this.submitting = true
        try {
          const payload = {
            image: this.formData.image,
            sort: this.formData.sort !== '' ? Number(this.formData.sort) : 0,
            is_show: this.formData.is_show
          }
          if (this.editId) {
            await db.collection('banner').doc(this.editId).update(payload)
            uni.showToast({ title: '修改成功' })
          } else {
            payload.createTime = Date.now()
            await db.collection('banner').add(payload)
            uni.showToast({ title: '新增成功' })
          }
          this.closeForm()
          this.$refs.udb.loadData()
        } catch (e) {
          uni.showModal({ title: '操作失败', content: e.message || '请重试', showCancel: false })
        } finally {
          this.submitting = false
        }
      },

      confirmDelete(id) {
        uni.showModal({
          title: '确认删除',
          content: '删除后无法恢复，确认删除该轮播图？',
          success: async (res) => {
            if (res.confirm) {
              try {
                await db.collection('banner').doc(id).remove()
                uni.showToast({ title: '已删除' })
                this.$refs.udb.loadData()
              } catch (e) {
                uni.showModal({ title: '删除失败', content: e.message, showCancel: false })
              }
            }
          }
        })
      }
    }
  }
</script>

<style>
  .popup-box {
    width: 450px;
    background: #fff;
    border-radius: 10px;
    overflow: hidden;
  }
  .popup-title {
    padding: 18px 24px 14px;
    font-size: 16px;
    font-weight: bold;
    color: #333;
    border-bottom: 1px solid #f0f0f0;
  }
  .popup-body {
    padding: 20px 24px;
  }
  .field-row {
    display: flex;
    align-items: flex-start;
    margin-bottom: 16px;
  }
  .field-label {
    width: 80px;
    flex-shrink: 0;
    font-size: 14px;
    color: #555;
    line-height: 36px;
  }
  .field-input {
    flex: 1;
    height: 36px;
    border: 1px solid #e0e0e0;
    border-radius: 4px;
    padding: 0 10px;
    font-size: 14px;
    color: #333;
    background: #fafafa;
  }
  .field-input:focus {
    border-color: #2979ff;
    background: #fff;
  }
  .img-uploader {
    width: 240px;
    height: 120px;
    border: 1px dashed #d9d9d9;
    border-radius: 6px;
    cursor: pointer;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #fafafa;
  }
  .preview-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .img-add-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    color: #999;
  }
  .img-add-btn .plus {
    font-size: 32px;
    line-height: 1;
  }
  .img-add-btn .text {
    font-size: 13px;
    margin-top: 8px;
  }
  .popup-footer {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    padding: 12px 24px 18px;
    border-top: 1px solid #f0f0f0;
  }
</style>
