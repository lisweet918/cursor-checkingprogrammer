<template>
  <view>
    <!-- 顶部操作栏 -->
    <view class="uni-header">
      <view class="uni-group">
        <view class="uni-title">菜品管理</view>
        <view class="uni-sub-title">管理所有菜品的名称、价格和图片</view>
      </view>
      <view class="uni-group">
        <input class="uni-search" type="text" v-model="query" @confirm="search" placeholder="搜索菜品名称" />
        <button class="uni-button" type="default" size="mini" @click="search">搜索</button>
        <button class="uni-button" type="primary" size="mini" @click="navigateTo('./form')">+ 新增菜品</button>
        <button class="uni-button" type="default" size="mini" :disabled="!selectedIndexs.length" @click="batchDelete">批量删除</button>
        <button class="uni-button" type="warn" size="mini" @click="importMockData">一键导入原有菜品</button>
      </view>
    </view>

    <!-- 分类筛选 -->
    <view class="category-filter">
      <view
        class="cat-tab"
        :class="{ active: activeCatId === '' }"
        @click="switchCat('')"
      >全部</view>
      <view
        v-for="cat in categories"
        :key="cat._id"
        class="cat-tab"
        :class="{ active: activeCatId === cat._id }"
        @click="switchCat(cat._id)"
      >{{ cat.name }}</view>
    </view>

    <!-- 菜品列表 -->
    <view class="uni-container">
      <unicloud-db
        ref="udb"
        collection="product"
        :field="fields"
        :where="where"
        orderby="sort asc, createTime desc"
        :getcount="true"
        :page-size="options.pageSize"
        :page-current="options.pageCurrent"
        page-data="replace"
        loadtime="manual"
        v-slot:default="{ data, pagination, loading, error }"
        @load="onDbLoad"
      >
        <uni-table
          ref="table"
          :loading="loading"
          :emptyText="error.message || '暂无菜品，点击右上角新增'"
          border
          stripe
          type="selection"
          @selection-change="selectionChange"
        >
          <uni-tr>
            <uni-th align="center" width="100">图片</uni-th>
            <uni-th align="center">菜品名称</uni-th>
            <uni-th align="center" width="120">分类</uni-th>
            <uni-th align="center" width="100">价格(元)</uni-th>
            <uni-th align="center" width="80">堂食</uni-th>
            <uni-th align="center" width="80">外卖</uni-th>
            <uni-th align="center" width="80">状态</uni-th>
            <uni-th align="center" width="160">操作</uni-th>
          </uni-tr>
          <uni-tr v-for="(item, index) in data" :key="index">
            <uni-td align="center">
              <image
                v-if="getImgUrl(item)"
                :src="getImgUrl(item)"
                class="product-img"
                mode="aspectFill"
              />
              <text v-else class="no-img">暂无图片</text>
            </uni-td>
            <uni-td>
              <view class="product-name">{{ item.name }}</view>
              <view class="product-desc" v-if="item.description">{{ item.description }}</view>
            </uni-td>
            <uni-td align="center">
              <text>{{ getCatName(item.category_id) }}</text>
            </uni-td>
            <uni-td align="center">
              <text class="price">¥{{ item.price }}</text>
            </uni-td>
            <uni-td align="center">
              <text :class="item.is_pickup == 1 ? 'tag-yes' : 'tag-no'">{{ item.is_pickup == 1 ? '支持' : '不支持' }}</text>
            </uni-td>
            <uni-td align="center">
              <text :class="item.is_takeout == 1 ? 'tag-yes' : 'tag-no'">{{ item.is_takeout == 1 ? '支持' : '不支持' }}</text>
            </uni-td>
            <uni-td align="center">
              <text :class="item.is_show === false ? 'tag-no' : 'tag-yes'">{{ item.is_show === false ? '已下架' : '已上架' }}</text>
            </uni-td>
            <uni-td align="center">
              <view class="uni-group">
                <button class="uni-button" size="mini" type="primary" @click="navigateTo('./form?id=' + item._id, false)">编辑</button>
                <button class="uni-button" size="mini" type="warn" @click="confirmDelete(item._id)">删除</button>
              </view>
            </uni-td>
          </uni-tr>
        </uni-table>
        <view class="uni-pagination-box">
          <uni-pagination show-icon :page-size="pagination.size" v-model="pagination.current" :total="pagination.count" @change="onPageChanged" />
        </view>
      </unicloud-db>
    </view>
  </view>
</template>

<script>
  import mockMenu from './mock-menu.js'
  const db = uniCloud.database()

  export default {
    data() {
      return {
        fields: '_id,name,description,price,category_id,images,is_pickup,is_takeout,is_show,sort,createTime',
        query: '',
        where: '',
        activeCatId: '',
        categories: [],
        selectedIndexs: [],
        options: {
          pageSize: 20,
          pageCurrent: 1
        }
      }
    },
    async onLoad() {
      await this.loadCategories()
    },
    onReady() {
      this.$refs.udb.loadData()
    },
    methods: {
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
        return cat ? cat.name : '-'
      },

      getImgUrl(item) {
        return item.images && item.images[0] && item.images[0].url ? item.images[0].url : ''
      },

      buildWhere() {
        const parts = []
        if (this.activeCatId) {
          parts.push(`category_id == '${this.activeCatId}'`)
        }
        if (this.query.trim()) {
          parts.push(`name.indexOf('${this.query.trim()}') > -1`)
        }
        this.where = parts.join(' && ')
      },

      search() {
        this.buildWhere()
        this.$nextTick(() => this.$refs.udb.loadData())
      },

      switchCat(id) {
        this.activeCatId = id
        this.buildWhere()
        this.$nextTick(() => this.$refs.udb.loadData())
      },

      onDbLoad(data) {
        // data loaded
      },

      onPageChanged(e) {
        this.selectedIndexs = []
        this.$refs.table.clearSelection()
        this.$refs.udb.loadData({ current: e.current })
      },

      selectionChange(e) {
        this.selectedIndexs = e.detail.index
      },

      selectedIds() {
        return this.selectedIndexs.map(i => this.$refs.udb.dataList[i]._id)
      },

      batchDelete() {
        this.$refs.udb.remove(this.selectedIds(), {
          success: () => {
            this.$refs.table.clearSelection()
            this.selectedIndexs = []
          }
        })
      },

      confirmDelete(id) {
        uni.showModal({
          title: '确认删除',
          content: '删除后不可恢复，确认删除该菜品？',
          success: (res) => {
            if (res.confirm) {
              this.$refs.udb.remove(id, {
                success: () => this.$refs.table.clearSelection()
              })
            }
          }
        })
      },

      navigateTo(url, clear = true) {
        uni.navigateTo({
          url,
          events: {
            refreshData: () => this.$refs.udb.loadData({ clear })
          }
        })
      },

      async importMockData() {
        uni.showModal({
          title: '导入确认',
          content: '这会将小程序原有的静态菜品数据导入到数据库中。为避免重复，建议在数据库为空时执行此操作。是否继续？',
          success: async (res) => {
            if (res.confirm) {
              uni.showLoading({ title: '导入中...', mask: true })
              try {
                for (let i = 0; i < mockMenu.length; i++) {
                  const cat = mockMenu[i]
                  // Add category
                  const catRes = await db.collection('category').add({
                    name: cat.name,
                    category_image_url: cat.category_image_url || '',
                    sort: i,
                    is_show: true,
                    createTime: Date.now()
                  })
                  const catId = catRes.result.id

                  // Add products
                  if (cat.products && cat.products.length) {
                    for (let j = 0; j < cat.products.length; j++) {
                      const p = cat.products[j]
                      await db.collection('product').add({
                        name: p.name,
                        description: p.description || '',
                        price: p.price,
                        category_id: catId,
                        images: p.images || [],
                        is_single: p.is_single !== false,
                        is_pickup: p.is_pickup !== undefined ? p.is_pickup : 1,
                        is_takeout: p.is_takeout !== undefined ? p.is_takeout : 1,
                        is_show: true,
                        sold: p.sold ? String(p.sold) : '',
                        sort: j,
                        labels: p.labels || [],
                        materials: p.materials || [],
                        createTime: Date.now()
                      })
                    }
                  }
                }
                uni.hideLoading()
                uni.showToast({ title: '导入成功', icon: 'success' })
                this.loadCategories()
                this.$refs.udb.loadData()
              } catch (e) {
                uni.hideLoading()
                uni.showModal({ title: '导入失败', content: e.message, showCancel: false })
              }
            }
          }
        })
      }
    }
  }
</script>

<style>
  .category-filter {
    display: flex;
    flex-wrap: wrap;
    padding: 10px 16px 4px;
    background: #fff;
    border-bottom: 1px solid #eee;
    margin-bottom: 12px;
    gap: 6px;
  }
  .cat-tab {
    padding: 4px 14px;
    border-radius: 14px;
    font-size: 13px;
    color: #666;
    background: #f5f5f5;
    cursor: pointer;
  }
  .cat-tab.active {
    background: #2979ff;
    color: #fff;
  }

  .product-img {
    width: 64px;
    height: 64px;
    border-radius: 6px;
    object-fit: cover;
  }
  .no-img {
    font-size: 11px;
    color: #ccc;
  }
  .product-name {
    font-size: 14px;
    color: #333;
    font-weight: 500;
  }
  .product-desc {
    font-size: 12px;
    color: #999;
    margin-top: 2px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 260px;
  }
  .price { color: #e74c3c; font-weight: bold; }
  .tag-yes { color: #52c41a; font-size: 12px; }
  .tag-no  { color: #bbb; font-size: 12px; }
</style>
