<template>
  <view class="uni-container">
    <uni-forms ref="form" :model="formData" :rules="rules" validateTrigger="bind" label-width="90px">

      <!-- 菜品图片 -->
      <uni-forms-item label="菜品图片" name="images">
        <view class="img-section">
          <view class="img-list">
            <view v-for="(img, idx) in formData.images" :key="idx" class="img-item">
              <image :src="img.url" class="thumb" mode="aspectFill" />
              <view class="img-delete" @click="removeImage(idx)">×</view>
            </view>
            <view v-if="formData.images.length < 3" class="img-add" @click="chooseImage">
              <view class="img-add-icon">+</view>
              <view class="img-add-text">上传图片</view>
            </view>
          </view>
          <view class="img-tip">建议上传正方形图片，最多3张，第一张为主图</view>
        </view>
      </uni-forms-item>

      <!-- 菜品名称 -->
      <uni-forms-item label="菜品名称" name="name" required>
        <uni-easyinput v-model="formData.name" placeholder="请输入菜品名称" />
      </uni-forms-item>

      <!-- 价格 -->
      <uni-forms-item label="价格(元)" name="price" required>
        <uni-easyinput v-model="formData.price" type="number" placeholder="请输入价格，如 5.99" />
      </uni-forms-item>

      <!-- 所属分类 -->
      <uni-forms-item label="所属分类" name="category_id" required>
        <picker :value="catIndex" :range="categories" range-key="name" @change="onCatChange">
          <view class="picker-view">
            <text v-if="formData.category_id">{{ getCatName(formData.category_id) }}</text>
            <text v-else style="color:#bbb">请选择分类</text>
            <text class="picker-arrow">›</text>
          </view>
        </picker>
      </uni-forms-item>

      <!-- 菜品描述 -->
      <uni-forms-item label="菜品描述" name="description">
        <uni-easyinput type="textarea" v-model="formData.description" placeholder="请输入菜品描述（选填）" :maxlength="200" />
      </uni-forms-item>

      <!-- 已售数量 -->
      <uni-forms-item label="已售展示" name="sold">
        <uni-easyinput v-model="formData.sold" placeholder="如：600+（选填，展示在用户端）" />
      </uni-forms-item>

      <!-- 销售方式 -->
      <uni-forms-item label="销售方式">
        <view class="checkbox-group">
          <label class="checkbox-item">
            <checkbox :checked="formData.is_pickup === 1" @change="formData.is_pickup = $event.detail.value ? 1 : 0" />
            <text>支持堂食自取</text>
          </label>
          <label class="checkbox-item">
            <checkbox :checked="formData.is_takeout === 1" @change="formData.is_takeout = $event.detail.value ? 1 : 0" />
            <text>支持外卖配送</text>
          </label>
        </view>
      </uni-forms-item>

      <!-- 是否上架 -->
      <uni-forms-item label="上架状态">
        <switch :checked="formData.is_show" @change="formData.is_show = $event.detail.value" />
        <text style="margin-left:10px;color:#666;font-size:13px">{{ formData.is_show ? '已上架' : '已下架' }}</text>
      </uni-forms-item>

      <!-- 排序 -->
      <uni-forms-item label="排序权重" name="sort">
        <uni-easyinput v-model="formData.sort" type="number" placeholder="数值越小越靠前（选填）" />
      </uni-forms-item>

      <!-- 按钮 -->
      <view class="uni-button-group">
        <button type="primary" class="uni-button" style="width:120px" :loading="submitting" @click="submit">
          {{ isEdit ? '保存修改' : '新增菜品' }}
        </button>
        <navigator open-type="navigateBack" style="margin-left:15px">
          <button class="uni-button" style="width:100px">返回</button>
        </navigator>
      </view>
    </uni-forms>
  </view>
</template>

<script>
  const db = uniCloud.database()

  export default {
    data() {
      return {
        isEdit: false,
        editId: '',
        submitting: false,
        categories: [],
        catIndex: 0,
        formData: {
          name: '',
          price: '',
          category_id: '',
          description: '',
          sold: '',
          images: [],
          is_pickup: 1,
          is_takeout: 1,
          is_show: true,
          sort: ''
        },
        rules: {
          name: {
            rules: [{ required: true, errorMessage: '请输入菜品名称' }]
          },
          price: {
            rules: [
              { required: true, errorMessage: '请输入价格' },
              { validateFunction: (rule, value) => !isNaN(Number(value)) || '请输入有效的数字价格' }
            ]
          },
          category_id: {
            rules: [{ required: true, errorMessage: '请选择所属分类' }]
          }
        }
      }
    },
    async onLoad(options) {
      await this.loadCategories()
      if (options.id) {
        this.isEdit = true
        this.editId = options.id
        uni.setNavigationBarTitle({ title: '编辑菜品' })
        await this.loadProduct(options.id)
      } else {
        uni.setNavigationBarTitle({ title: '新增菜品' })
      }
    },
    onReady() {
      this.$refs.form.setRules(this.rules)
    },
    methods: {
      // ---- 加载分类 ----
      async loadCategories() {
        try {
          const res = await db.collection('category').field('_id,name').orderBy('sort', 'asc').get()
          this.categories = res.result.data || []
        } catch (e) {
          console.error('加载分类失败', e)
        }
      },

      getCatName(id) {
        const cat = this.categories.find(c => c._id === id)
        return cat ? cat.name : ''
      },

      onCatChange(e) {
        this.catIndex = e.detail.value
        this.formData.category_id = this.categories[this.catIndex]._id
      },

      // ---- 加载编辑数据 ----
      async loadProduct(id) {
        try {
          const res = await db.collection('product').doc(id).get()
          const data = res.result.data[0]
          if (data) {
            this.formData = {
              name: data.name || '',
              price: String(data.price || ''),
              category_id: data.category_id || '',
              description: data.description || '',
              sold: data.sold || '',
              images: data.images || [],
              is_pickup: data.is_pickup !== undefined ? data.is_pickup : 1,
              is_takeout: data.is_takeout !== undefined ? data.is_takeout : 1,
              is_show: data.is_show !== false,
              sort: data.sort !== undefined ? String(data.sort) : ''
            }
            // 同步分类选中索引
            const idx = this.categories.findIndex(c => c._id === this.formData.category_id)
            if (idx > -1) this.catIndex = idx
          }
        } catch (e) {
          uni.showModal({ title: '错误', content: '加载菜品数据失败', showCancel: false })
        }
      },

      // ---- 图片上传 ----
      chooseImage() {
        uni.chooseImage({
          count: 3 - this.formData.images.length,
          sizeType: ['compressed'],
          sourceType: ['album', 'camera'],
          success: async (res) => {
            uni.showLoading({ title: '上传中...', mask: true })
            try {
              for (const tempPath of res.tempFilePaths) {
                const fileName = `product/${Date.now()}_${Math.random().toString(36).slice(2)}.jpg`
                const uploadRes = await uniCloud.uploadFile({
                  filePath: tempPath,
                  cloudPath: fileName
                })
                this.formData.images.push({ url: uploadRes.fileID })
              }
            } catch (e) {
              uni.showModal({ title: '上传失败', content: e.message || '图片上传失败，请重试', showCancel: false })
            } finally {
              uni.hideLoading()
            }
          }
        })
      },

      removeImage(idx) {
        this.formData.images.splice(idx, 1)
      },

      // ---- 提交表单 ----
      submit() {
        this.$refs.form.validate().then(async () => {
          this.submitting = true
          try {
            const payload = {
              name: this.formData.name.trim(),
              price: Number(this.formData.price),
              category_id: this.formData.category_id,
              description: this.formData.description.trim(),
              sold: this.formData.sold.trim(),
              images: this.formData.images,
              is_pickup: this.formData.is_pickup,
              is_takeout: this.formData.is_takeout,
              is_show: this.formData.is_show,
              sort: this.formData.sort !== '' ? Number(this.formData.sort) : 0,
              createTime: Date.now()
            }

            if (this.isEdit) {
              delete payload.createTime
              await db.collection('product').doc(this.editId).update(payload)
              uni.showToast({ title: '修改成功' })
            } else {
              await db.collection('product').add(payload)
              uni.showToast({ title: '新增成功' })
            }

            this.getOpenerEventChannel().emit('refreshData')
            setTimeout(() => uni.navigateBack(), 600)
          } catch (e) {
            uni.showModal({ title: '提交失败', content: e.message || '操作失败，请重试', showCancel: false })
          } finally {
            this.submitting = false
          }
        }).catch(() => {})
      }
    }
  }
</script>

<style>
  /* 图片上传区域 */
  .img-section { padding: 4px 0; }
  .img-list {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }
  .img-item {
    position: relative;
    width: 90px;
    height: 90px;
  }
  .thumb {
    width: 90px;
    height: 90px;
    border-radius: 6px;
    border: 1px solid #eee;
    object-fit: cover;
  }
  .img-delete {
    position: absolute;
    top: -6px;
    right: -6px;
    width: 20px;
    height: 20px;
    background: rgba(0,0,0,0.6);
    color: #fff;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    cursor: pointer;
    line-height: 1;
  }
  .img-add {
    width: 90px;
    height: 90px;
    border: 2px dashed #d9d9d9;
    border-radius: 6px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: #bbb;
  }
  .img-add:hover { border-color: #2979ff; color: #2979ff; }
  .img-add-icon { font-size: 28px; line-height: 1; }
  .img-add-text { font-size: 12px; margin-top: 4px; }
  .img-tip { font-size: 12px; color: #999; margin-top: 6px; }

  /* picker */
  .picker-view {
    display: flex;
    justify-content: space-between;
    align-items: center;
    height: 36px;
    padding: 0 10px;
    border: 1px solid #e5e5e5;
    border-radius: 4px;
    font-size: 14px;
    color: #333;
    background: #fff;
  }
  .picker-arrow { color: #bbb; font-size: 18px; }

  /* 复选框 */
  .checkbox-group { display: flex; gap: 24px; align-items: center; }
  .checkbox-item { display: flex; align-items: center; gap: 6px; font-size: 14px; cursor: pointer; }
</style>
