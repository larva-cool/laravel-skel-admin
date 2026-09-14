<template>
  <div class="art-full-height flex flex-col gap-3">
    <!-- 统计卡片 -->
    <RechargeStats ref="statsRef" />

    <!-- 搜索栏 -->
    <RechargeSearch
      v-show="showSearchBar"
      @search="handleSearch"
      @resetSearchParams="resetSearchParams"
    />

    <!-- 表格卡片 -->
    <ElCard class="art-table-card flex-1">
      <ArtTableHeader
        v-model:columns="columnChecks"
        v-model:showSearchBar="showSearchBar"
        :loading="loading"
        @refresh="handleRefresh"
      >
        <template #left>
          <ElSpace wrap>
            <ElButton v-auth="'wallet.export'" :loading="isExporting" @click="handleExport">
              <ElIcon class="mr-1"><Download /></ElIcon>
              导出
            </ElButton>
          </ElSpace>
        </template>
      </ArtTableHeader>

      <ArtTable
        v-auth="'wallet.orders'"
        :loading="loading"
        :data="data"
        :columns="columns"
        :pagination="pagination"
        @pagination:size-change="handleSizeChange"
        @pagination:current-change="handleCurrentChange"
      />
    </ElCard>

    <!-- 详情弹窗 -->
    <RechargeDetailDialog ref="detailDialogRef" />

    <!-- 处理弹窗 -->
    <RechargeHandleDialog ref="handleDialogRef" @success="onHandleSuccess" />
  </div>
</template>

<script setup lang="ts">
  import { h, ref } from 'vue'
  import { ElTag } from 'element-plus'
  import { Download } from '@element-plus/icons-vue'
  import ArtButtonTable from '@/components/core/forms/art-button-table/index.vue'
  import { useTable } from '@/hooks/core/useTable'
  import { useAuth } from '@/hooks/core/useAuth'
  import { fetchGetRechargeList, fetchExportRecharges } from '@/api/wallet'
  import RechargeStats from './modules/recharge-stats.vue'
  import RechargeSearch from './modules/recharge-search.vue'
  import RechargeDetailDialog from './modules/recharge-detail-dialog.vue'
  import RechargeHandleDialog from './modules/recharge-handle-dialog.vue'
  import { useExport } from '@/hooks/core/useExport'

  defineOptions({ name: 'Recharge' })

  type RechargeItem = Api.WalletManage.Recharge

  const { hasAuth } = useAuth()

  const showSearchBar = ref(true)
  const statsRef = ref<InstanceType<typeof RechargeStats>>()
  const detailDialogRef = ref<InstanceType<typeof RechargeDetailDialog>>()
  const handleDialogRef = ref<InstanceType<typeof RechargeHandleDialog>>()

  const mapTagType = (t?: string) => {
    if (!t || t === 'default') return undefined
    return t as 'primary' | 'success' | 'warning' | 'danger' | 'info'
  }

  function formatMoney(v: number | string | null | undefined): string {
    if (v == null) return '0.00'
    const n = typeof v === 'number' ? v : Number(v)
    return Number.isFinite(n) ? n.toFixed(2) : String(v)
  }

  const {
    columns,
    columnChecks,
    data,
    loading,
    pagination,
    getData,
    searchParams,
    resetSearchParams,
    handleSizeChange,
    handleCurrentChange,
    refreshData
  } = useTable({
    core: {
      apiFn: fetchGetRechargeList,
      apiParams: { page: 1, per_page: 20 },
      columnsFactory: () => [
        { prop: 'id', label: 'ID', width: 110 },
        {
          prop: 'order_no',
          label: '订单号',
          width: 220,
          showOverflowTooltip: true,
          fixed: 'left',
          formatter: (row: RechargeItem) =>
            h('span', { class: 'font-mono text-xs' }, row.order_no || '—')
        },
        {
          prop: 'owner',
          label: '用户',
          width: 200,
          showOverflowTooltip: true,
          formatter: (row: RechargeItem) => {
            if (!row.owner) return '—'
            return h('span', {}, [
              row.owner.name || '—',
              h('span', { class: 'text-xs text-g-500 ml-1' }, `(#${row.owner.id})`)
            ])
          }
        },
        {
          prop: 'amount',
          label: '充值金额',
          width: 120,
          align: 'right',
          formatter: (row: RechargeItem) =>
            h(
              'span',
              { class: 'font-semibold tabular-nums text-g-900' },
              `¥${formatMoney(row.amount)}`
            )
        },
        {
          prop: 'bonus_amount',
          label: '赠送金额',
          width: 120,
          align: 'right',
          formatter: (row: RechargeItem) =>
            h(
              'span',
              { class: 'font-semibold tabular-nums text-success' },
              `¥${formatMoney(row.bonus_amount)}`
            )
        },
        {
          prop: 'total_amount',
          label: '实际入账',
          width: 130,
          align: 'right',
          formatter: (row: RechargeItem) =>
            h(
              'span',
              { class: 'font-semibold tabular-nums text-primary text-[15px]' },
              `¥${formatMoney(row.total_amount)}`
            )
        },
        {
          prop: 'pay_channel',
          label: '支付渠道',
          width: 110,
          formatter: (row: RechargeItem) =>
            h(
              ElTag,
              { type: mapTagType(row.pay_channel_label_type), size: 'small', effect: 'plain' },
              () => row.pay_channel?.label || '—'
            )
        },
        {
          prop: 'pay_status',
          label: '支付状态',
          width: 110,
          formatter: (row: RechargeItem) =>
            h('span', { class: 'inline-flex items-center gap-1' }, [
              h(
                ElTag,
                { type: mapTagType(row.pay_status_label_type), size: 'small' },
                () => row.pay_status?.label || '—'
              ),
              row.is_expired
                ? h(ElTag, { size: 'small', type: 'info', effect: 'plain' }, () => '过期')
                : null
            ])
        },
        {
          prop: 'transaction_id',
          label: '交易号',
          width: 180,
          showOverflowTooltip: true,
          formatter: (row: RechargeItem) =>
            h('span', { class: 'font-mono text-xs' }, row.transaction_id || '—')
        },
        { prop: 'client_ip', label: '客户端IP', width: 140, showOverflowTooltip: true },
        { prop: 'created_at', label: '下单时间', width: 180 },
        {
          prop: 'actions',
          label: '操作',
          width: 140,
          fixed: 'right',
          formatter: (row: RechargeItem) => {
            const canHandle = row.pay_status?.value === 'pending' && !row.is_expired
            return h('div', { class: 'flex items-center' }, [
              h(ArtButtonTable, {
                type: 'view',
                title: '详情',
                onClick: () => viewDetail(row)
              }),
              hasAuth('wallet.orders') && canHandle
                ? h(ArtButtonTable, {
                    icon: 'ri:check-double-line',
                    iconColor: 'var(--el-color-success)',
                    buttonBgColor: 'rgba(103,194,58,0.12)',
                    title: '处理',
                    onClick: () => openHandleDialog(row)
                  })
                : null
            ])
          }
        }
      ]
    }
  })

  // 导出
  const { isExporting, handleExport: doExport } = useExport()
  const handleExport = () => {
    const filters = { ...(searchParams as Record<string, unknown>) }
    delete filters.page
    delete filters.per_page
    doExport(
      () => fetchExportRecharges(filters as unknown as Api.WalletManage.RechargeSearchParams),
      'recharges'
    )
  }

  const viewDetail = (row: RechargeItem) => {
    detailDialogRef.value?.open(row)
  }

  const openHandleDialog = (row: RechargeItem) => {
    handleDialogRef.value?.open(row)
  }

  const onHandleSuccess = () => {
    refreshData()
    statsRef.value?.refresh()
  }

  const handleSearch = (params: Partial<Api.WalletManage.RechargeSearchParams>) => {
    const paramsRecord = searchParams as Record<string, unknown>
    Object.keys(paramsRecord).forEach((key) => {
      if (key !== 'page' && key !== 'per_page') {
        delete paramsRecord[key]
      }
    })
    Object.assign(searchParams, params)
    getData()
  }

  const handleRefresh = () => {
    refreshData()
    statsRef.value?.refresh()
  }
</script>
