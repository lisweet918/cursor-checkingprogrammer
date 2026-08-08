<template>
  <view>
    <!-- 顶部搜索栏 -->
    <view class="uni-header">
      <view class="uni-group">
        <view class="uni-title">订单管理</view>
        <view class="uni-sub-title">管理所有顾客的点餐订单</view>
      </view>
      <view class="uni-group">
        <input class="uni-search" type="text" v-model="query" @confirm="search" placeholder="搜索订单号/桌号/菜品" />
        <button class="uni-button" type="default" size="mini" @click="search">搜索</button>
        <button class="uni-button" type="default" size="mini" @click="resetSearch">重置</button>
      </view>
    </view>

    <!-- 状态筛选 Tab -->
    <view class="status-tabs">
      <view
        v-for="tab in statusTabs"
        :key="tab.value"
        class="status-tab"
        :class="{ active: activeTab === tab.value }"
        @click="switchTab(tab.value)"
      >
        {{ tab.label }}
      </view>
    </view>

    <!-- 订单列表 -->
    <view class="uni-container">
      <unicloud-db
        ref="udb"
        collection="order"
        :field="fields"
        :where="where"
        :orderby="orderby"
        :getcount="true"
        :page-size="options.pageSize"
        :page-current="options.pageCurrent"
        page-data="replace"
        loadtime="manual"
        v-slot:default="{ data, pagination, loading, error }"
        @load="onQueryLoad"
      >
        <uni-table
          ref="table"
          :loading="loading"
          :emptyText="error.message || '暂无订单数据'"
          border
          stripe
        >
          <uni-tr>
            <uni-th align="center" width="180">下单时间</uni-th>
            <uni-th align="center" width="120">订单号</uni-th>
            <uni-th align="center" width="80">桌号</uni-th>
            <uni-th align="center" width="80">类型</uni-th>
            <uni-th align="center">商品明细</uni-th>
            <uni-th align="center" width="100">件数</uni-th>
            <uni-th align="center" width="100">金额(元)</uni-th>
            <uni-th align="center" width="100">状态</uni-th>
            <uni-th align="center" width="80">显示</uni-th>
            <uni-th align="center" width="160">操作</uni-th>
          </uni-tr>
          <uni-tr v-for="(item, index) in data" :key="index">
            <uni-td align="center">
              <uni-dateformat :threshold="[0, 0]" :date="item.createTime"></uni-dateformat>
            </uni-td>
            <uni-td align="center">
              <text class="order-no">{{ item.out_trade_no || item._id }}</text>
            </uni-td>
            <uni-td align="center">
              {{ item.tableNumber || (item.type === 'takeout' ? '外卖' : '-') }}
            </uni-td>
            <uni-td align="center">
              <text :class="['type-tag', item.type === 'takeout' ? 'tag-takeout' : 'tag-takein']">
                {{ item.type === 'takeout' ? '外卖' : '堂食' }}
              </text>
            </uni-td>
            <uni-td>
              <view class="goods-list">
                <view v-for="(g, gi) in item.commodity_list" :key="gi" class="goods-item">
                  {{ g.name }} x{{ g.number }}
                </view>
              </view>
            </uni-td>
            <uni-td align="center">{{ item.shop_num }}</uni-td>
            <uni-td align="center">
              <text class="price">¥{{ item.price }}</text>
            </uni-td>
            <uni-td align="center">
              <text :class="['status-badge', getStatusClass(item.status)]">
                {{ getStatusText(item.status) }}
              </text>
            </uni-td>
            <uni-td align="center">
              <switch :checked="item.is_show !== false" @change="toggleVisibility(item._id, $event.detail.value)" scale="0.7" />
            </uni-td>
            <uni-td align="center">
              <view class="uni-group">
                <button
                  class="uni-button"
                  size="mini"
                  type="primary"
                  @click="viewDetail(item)"
                >详情</button>
                <button
                  v-if="item.status === '0' || item.status === 0"
                  class="uni-button"
                  size="mini"
                  type="warn"
                  @click="updateStatus(item._id, '1')"
                >接单</button>
                <button
                  v-if="item.status === '1' || item.status === 1"
                  class="uni-button"
                  size="mini"
                  style="background:#52c41a;color:#fff;border:none;"
                  @click="updateStatus(item._id, '3')"
                >完成</button>
              </view>
            </uni-td>
          </uni-tr>
        </uni-table>

        <view class="uni-pagination-box">
          <uni-pagination
            show-icon
            :page-size="pagination.size"
            v-model="pagination.current"
            :total="pagination.count"
            @change="onPageChanged"
          />
        </view>
      </unicloud-db>
    </view>

    <!-- 订单详情弹窗 -->
    <uni-popup ref="detailPopup" type="right" :is-mask-click="true">
      <view class="detail-panel" v-if="selectedOrder">
        <view class="detail-header">
          <text class="detail-title">订单详情</text>
          <text class="detail-close" @click="$refs.detailPopup.close()">✕</text>
        </view>
        <scroll-view scroll-y class="detail-body">
          <!-- 订单状态 -->
          <view class="detail-section">
            <view class="section-title">订单状态</view>
            <view class="status-row">
              <text :class="['status-badge', getStatusClass(selectedOrder.status)]">
                {{ getStatusText(selectedOrder.status) }}
              </text>
              <view class="action-buttons">
                <button v-if="selectedOrder.status === '0' || selectedOrder.status === 0" size="mini" type="warn" @click="updateStatus(selectedOrder._id, '1')">接单</button>
                <button v-if="selectedOrder.status === '1' || selectedOrder.status === 1" size="mini" style="background:#52c41a;color:#fff;" @click="updateStatus(selectedOrder._id, '3')">完成</button>
              </view>
            </view>
            <view class="status-row" style="margin-top: 10px;">
              <text class="info-label" style="width: 120px;">用户端显示</text>
              <switch :checked="selectedOrder.is_show !== false" @change="toggleVisibility(selectedOrder._id, $event.detail.value)" scale="0.8" />
            </view>
          </view>

          <!-- 基本信息 -->
          <view class="detail-section">
            <view class="section-title">基本信息</view>
            <view class="info-row"><text class="info-label">订单号</text><text class="info-value">{{ selectedOrder.out_trade_no || selectedOrder._id }}</text></view>
            <view class="info-row"><text class="info-label">下单时间</text><text class="info-value"><uni-dateformat :threshold="[0,0]" :date="selectedOrder.createTime"></uni-dateformat></text></view>
            <view class="info-row"><text class="info-label">订单类型</text><text class="info-value">{{ selectedOrder.type === 'takeout' ? '外卖配送' : '堂食' }}</text></view>
            <view class="info-row" v-if="selectedOrder.tableNumber"><text class="info-label">桌号</text><text class="info-value">{{ selectedOrder.tableNumber }}{{ selectedOrder.diningCount ? '（' + selectedOrder.diningCount + '人就餐）' : '' }}</text></view>
            <view class="info-row"><text class="info-label">备注</text><text class="info-value">{{ selectedOrder.remark || '无' }}</text></view>
          </view>

          <!-- 外卖地址 -->
          <view class="detail-section" v-if="selectedOrder.type === 'takeout'">
            <view class="section-title">配送信息</view>
            <view class="info-row"><text class="info-label">收货人</text><text class="info-value">{{ selectedOrder.name }}</text></view>
            <view class="info-row"><text class="info-label">联系电话</text><text class="info-value">{{ selectedOrder.phone }}</text></view>
            <view class="info-row"><text class="info-label">地址</text><text class="info-value">{{ selectedOrder.address }} {{ selectedOrder.house_number }}</text></view>
          </view>

          <!-- 商品列表 -->
          <view class="detail-section">
            <view class="section-title">商品明细</view>
            <view class="goods-detail-item" v-for="(g, gi) in selectedOrder.commodity_list" :key="gi">
              <view class="goods-name">{{ g.name }}</view>
              <view class="goods-spec" v-if="g.materials_text">{{ g.materials_text }}</view>
              <view class="goods-price-row">
                <text>¥{{ g.price }}</text>
                <text>x{{ g.number }}</text>
                <text class="goods-subtotal">¥{{ (g.price * g.number).toFixed(2) }}</text>
              </view>
            </view>
            <view class="fee-row" v-if="selectedOrder.packing_fee > 0 || selectedOrder.delivery_fee > 0 || selectedOrder.coupon_deduct > 0">
              <view class="info-row" v-if="selectedOrder.goods_amount != null">
                <text class="info-label">商品小计</text><text class="info-value">¥{{ selectedOrder.goods_amount }}</text>
              </view>
              <view class="info-row" v-if="selectedOrder.packing_fee > 0">
                <text class="info-label">打包费</text><text class="info-value">¥{{ selectedOrder.packing_fee }}</text>
              </view>
              <view class="info-row" v-if="selectedOrder.type === 'takeout'">
                <text class="info-label">配送费</text><text class="info-value">{{ selectedOrder.delivery_fee > 0 ? '¥' + selectedOrder.delivery_fee : '免配送费' }}</text>
              </view>
              <view class="info-row" v-if="selectedOrder.coupon_deduct > 0">
                <text class="info-label">优惠券抵扣</text><text class="info-value" style="color:#e74c3c;">-¥{{ selectedOrder.coupon_deduct }}</text>
              </view>
            </view>
            <view class="goods-total">
              共 {{ selectedOrder.shop_num }} 件，合计：
              <text class="total-price">¥{{ selectedOrder.price }}</text>
            </view>
          </view>

          <!-- 支付信息 -->
          <view class="detail-section">
            <view class="section-title">支付信息</view>
            <view class="info-row"><text class="info-label">交易单号</text><text class="info-value small">{{ selectedOrder.transaction_id || '-' }}</text></view>
            <view class="info-row"><text class="info-label">支付时间</text><text class="info-value">{{ selectedOrder.payment_time_text || '-' }}</text></view>
          </view>
        </scroll-view>
      </view>
    </uni-popup>
  </view>
</template>

<script>
  const db = uniCloud.database()

  const STATUS_MAP = {
    '0': { text: '待接单', cls: 'status-pending' },
    '1': { text: '已接单', cls: 'status-accepted' },
    '2': { text: '已退款', cls: 'status-refund' },
    '3': { text: '已完成', cls: 'status-done' },
    0: { text: '待接单', cls: 'status-pending' },
    1: { text: '已接单', cls: 'status-accepted' },
    2: { text: '已退款', cls: 'status-refund' },
    3: { text: '已完成', cls: 'status-done' },
  }

  export default {
    data() {
      return {
        fields: '_id,createTime,out_trade_no,tableNumber,diningCount,type,commodity_list,shop_num,price,goods_amount,packing_fee,delivery_fee,coupon_deduct,status,remark,name,phone,address,house_number,transaction_id,payment_time_text,torder,is_show',
        query: '',
        where: '',
        orderby: 'createTime desc',
        activeTab: 'all',
        selectedOrder: null,
        statusTabs: [
          { label: '全部', value: 'all' },
          { label: '待接单', value: '0' },
          { label: '已接单', value: '1' },
          { label: '已完成', value: '3' },
          { label: '已退款', value: '2' },
        ],
        options: {
          pageSize: 15,
          pageCurrent: 1,
        },
      }
    },
    onLoad() {
      this.buildWhere()
    },
    onReady() {
      this.$refs.udb.loadData()
    },
    methods: {
      onQueryLoad() {},

      getStatusText(status) {
        return (STATUS_MAP[status] || { text: '未知' }).text
      },
      getStatusClass(status) {
        return (STATUS_MAP[status] || { cls: '' }).cls
      },

      buildWhere() {
        const parts = []
        if (this.activeTab !== 'all') {
          parts.push(`status == ${this.activeTab}`)
        }
        if (this.query.trim()) {
          const q = this.query.trim()
          parts.push(`(out_trade_no.indexOf('${q}') > -1 || tableNumber.indexOf('${q}') > -1)`)
        }
        this.where = parts.join(' && ')
      },

      search() {
        this.buildWhere()
        this.$nextTick(() => this.$refs.udb.loadData())
      },

      resetSearch() {
        this.query = ''
        this.activeTab = 'all'
        this.buildWhere()
        this.$nextTick(() => this.$refs.udb.loadData())
      },

      switchTab(val) {
        this.activeTab = val
        this.buildWhere()
        this.$nextTick(() => this.$refs.udb.loadData())
      },

      onPageChanged(e) {
        this.$refs.udb.loadData({ current: e.current })
      },

      viewDetail(item) {
        this.selectedOrder = item
        this.$refs.detailPopup.open()
      },

      async updateStatus(id, status) {
        try {
          await db.collection('order').doc(id).update({ status: parseInt(status) })
          uni.showToast({ title: '状态已更新' })
          if (this.selectedOrder && this.selectedOrder._id === id) {
            this.selectedOrder = { ...this.selectedOrder, status }
          }
          this.$refs.udb.loadData()
        } catch (e) {
          uni.showModal({ title: '错误', content: e.message || '更新失败', showCancel: false })
        }
      },

      async toggleVisibility(id, isShow) {
        try {
          await db.collection('order').doc(id).update({ is_show: isShow })
          uni.showToast({ title: isShow ? '已在用户端显示' : '已在用户端隐藏' })
          if (this.selectedOrder && this.selectedOrder._id === id) {
            this.selectedOrder = { ...this.selectedOrder, is_show: isShow }
          }
          // 不强制刷新整个列表，只更新本地状态（如果可能）或者静默刷新
          // 为了简单起见，这里可以不 reload，因为 switch 状态已经由用户操作更新了
        } catch (e) {
          uni.showModal({ title: '错误', content: e.message || '操作失败', showCancel: false })
        }
      },
    }
  }
</script>

<style>
  .status-tabs {
    display: flex;
    padding: 12px 16px 0;
    border-bottom: 1px solid #eee;
    background: #fff;
    margin-bottom: 12px;
  }
  .status-tab {
    padding: 8px 18px;
    font-size: 14px;
    color: #666;
    cursor: pointer;
    border-bottom: 2px solid transparent;
    margin-right: 4px;
  }
  .status-tab.active {
    color: #2979ff;
    border-bottom-color: #2979ff;
    font-weight: bold;
  }

  .order-no {
    font-size: 12px;
    color: #555;
    word-break: break-all;
  }
  .goods-list { text-align: left; }
  .goods-item { font-size: 12px; color: #333; line-height: 1.6; }

  .price { color: #e74c3c; font-weight: bold; }

  .type-tag {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 12px;
  }
  .tag-takein { background: #e6f7ff; color: #1890ff; }
  .tag-takeout { background: #fff7e6; color: #fa8c16; }

  .status-badge {
    display: inline-block;
    padding: 2px 10px;
    border-radius: 4px;
    font-size: 12px;
  }
  .status-pending  { background: #fff3cd; color: #856404; }
  .status-accepted { background: #d1ecf1; color: #0c5460; }
  .status-done     { background: #d4edda; color: #155724; }
  .status-refund   { background: #f8d7da; color: #721c24; }

  /* 详情面板 */
  .detail-panel {
    width: 420px;
    height: 100vh;
    background: #fff;
    display: flex;
    flex-direction: column;
  }
  .detail-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    border-bottom: 1px solid #eee;
    background: #fff;
    position: sticky;
    top: 0;
  }
  .detail-title { font-size: 16px; font-weight: bold; color: #333; }
  .detail-close { font-size: 18px; color: #999; cursor: pointer; padding: 4px 8px; }
  .detail-body { flex: 1; padding: 16px; overflow-y: auto; }

  .detail-section {
    background: #f9f9f9;
    border-radius: 8px;
    padding: 14px;
    margin-bottom: 14px;
  }
  .section-title {
    font-size: 14px;
    font-weight: bold;
    color: #333;
    margin-bottom: 10px;
    padding-bottom: 6px;
    border-bottom: 1px solid #eee;
  }
  .info-row {
    display: flex;
    justify-content: space-between;
    margin-bottom: 8px;
    font-size: 13px;
    align-items: flex-start;
  }
  .info-label { color: #888; width: 80px; flex-shrink: 0; }
  .info-value { color: #333; text-align: right; flex: 1; }
  .info-value.small { font-size: 11px; word-break: break-all; }

  .status-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .action-buttons { display: flex; gap: 8px; }

  .goods-detail-item {
    padding: 10px 0;
    border-bottom: 1px solid #eee;
  }
  .goods-detail-item:last-of-type { border-bottom: none; }
  .goods-name { font-size: 14px; color: #333; font-weight: 500; }
  .goods-spec { font-size: 12px; color: #999; margin-top: 2px; }
  .goods-price-row {
    display: flex;
    justify-content: space-between;
    margin-top: 6px;
    font-size: 13px;
    color: #666;
  }
  .goods-subtotal { color: #e74c3c; font-weight: bold; }
  .fee-row {
    padding: 8px 0;
    margin-top: 6px;
    border-top: 1px dashed #e5e5e5;
  }
  .goods-total {
    text-align: right;
    padding-top: 10px;
    font-size: 13px;
    color: #555;
  }
  .total-price { color: #e74c3c; font-weight: bold; font-size: 16px; margin-left: 4px; }
</style>
