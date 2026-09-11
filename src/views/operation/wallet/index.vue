<template>
  <div class="art-full-height flex flex-col gap-3">
    <!-- 统计卡片 -->
    <WalletStats ref="statsRef" />

    <!-- 搜索栏 -->
    <WalletSearch
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
            <ElButton v-auth="'wallet.adjust'" type="primary" @click="openAdjustDialog()">
              <ElIcon class="mr-1"><EditPen /></ElIcon>
              调账
            </ElButton>
            <ElButton v-auth="'wallet.export'" :loading="isExporting" @click="handleExport">
              <ElIcon class="mr-1"><Download /></ElIcon>
              导出
            </ElButton>
          </ElSpace>
        </template>
      </ArtTableHeader>

      <ArtTable
        :loading="loading"
        :data="data"
        :columns="columns"
        :pagination="pagination"
        @pagination:size-change="handleSizeChange"
        @pagination:current-change="handleCurrentChange"
      />
    </ElCard>

    <!-- 详情弹窗 -->
    <WalletDetailDialog ref="detailDialogRef" />

    <!-- 调账弹窗 -->
    <WalletAdjustDialog ref="adjustDialogRef" @success="onAdjustSuccess" />
  </div>
</template>

<script setup lang="ts">
  import { h, ref } from 'vue'
  import { ElTag } from 'element-plus'
  import { Download, EditPen } from '@element-plus/icons-vue'
  import ArtButtonTable from '@/components/core/forms/art-button-table/index.vue'
  import { useTable } from '@/hooks/core/useTable'
  import { useAuth } from '@/hooks/core/useAuth'
  import { useExport } from '@/hooks/core/useExport'
  import { fetchExportWalletTrades, fetchGetWalletTradeList } from '@/api/wallet'
  import WalletStats from './modules/wallet-stats.vue'
  import WalletSearch from './modules/wallet-search.vue'
  import WalletDetailDialog from './modules/wallet-detail-dialog.vue'
  import WalletAdjustDialog from './modules/wallet-adjust-dialog.vue'

  defineOptions({ name: 'Wallet' })

  type WalletTradeItem = Api.WalletManage.WalletTrade

  const { hasAuth } = useAuth()

  const showSearchBar = ref(true)
  const statsRef = ref<InstanceType<typeof WalletStats>>()
  const detailDialogRef = ref<InstanceType<typeof WalletDetailDialog>>()
  const adjustDialogRef = ref<InstanceType<typeof WalletAdjustDialog>>()

  const mapTagType = (t?: string) => {
    if (!t || t === 'default') return undefined
    return t as 'primary' | 'success' | 'warning' | 'danger' | 'info'
  }

  function toNumber(v: number | string | null | undefined): number {
    if (v == null) return 0
    const n = typeof v === 'number' ? v : Number(v)
    return Number.isFinite(n) ? n : 0
  }

  function formatMoney(v: number | string | null | undefined): string {
    return toNumber(v).toFixed(2)
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
      apiFn: fetchGetWalletTradeList,
      apiParams: { page: 1, per_page: 20 },
      columnsFactory: () => [
        { prop: 'id', label: '流水号', width: 120, fixed: 'left' },
        {
          prop: 'owner',
          label: '持有者',
          width: 220,
          showOverflowTooltip: true,
          formatter: (row: WalletTradeItem) => {
            if (!row.owner) return '—'
            return `${row.owner.name || '—'} (#${row.owner.id})`
          }
        },
        {
          prop: 'type',
          label: '交易类型',
          width: 110,
          formatter: (row: WalletTradeItem) =>
            h(
              ElTag,
              { type: mapTagType(row.type_label_type), size: 'small', effect: 'plain' },
              () => row.type?.label || '—'
            )
        },
        {
          prop: 'amount',
          label: '变动金额',
          width: 130,
          align: 'right',
          formatter: (row: WalletTradeItem) => {
            const amount = toNumber(row.amount)
            const isIncome = amount >= 0
            return h(
              'span',
              {
                class: `font-semibold tabular-nums text-[15px] ${
                  isIncome ? 'text-success' : 'text-danger'
                }`
              },
              `${isIncome ? '+' : '-'}¥${formatMoney(Math.abs(amount))}`
            )
          }
        },
        {
          prop: 'before_balance',
          label: '变动前余额',
          width: 120,
          align: 'right',
          formatter: (row: WalletTradeItem) =>
            h('span', { class: 'tabular-nums text-g-600' }, `¥${formatMoney(row.before_balance)}`)
        },
        {
          prop: 'after_balance',
          label: '变动后余额',
          width: 120,
          align: 'right',
          formatter: (row: WalletTradeItem) =>
            h(
              'span',
              { class: 'font-semibold tabular-nums text-g-900' },
              `¥${formatMoney(row.after_balance)}`
            )
        },
        {
          prop: 'after_frozen',
          label: '变动后冻结',
          width: 120,
          align: 'right',
          formatter: (row: WalletTradeItem) =>
            h('span', { class: 'tabular-nums text-warning' }, `¥${formatMoney(row.after_frozen)}`)
        },
        {
          prop: 'status',
          label: '状态',
          width: 100,
          formatter: (row: WalletTradeItem) =>
            h(
              ElTag,
              { type: mapTagType(row.status_label_type), size: 'small' },
              () => row.status?.label || '—'
            )
        },
        {
          prop: 'description',
          label: '交易描述',
          minWidth: 180,
          showOverflowTooltip: true,
          formatter: (row: WalletTradeItem) => row.description || '—'
        },
        {
          prop: 'source_type',
          label: '来源',
          width: 150,
          showOverflowTooltip: true,
          formatter: (row: WalletTradeItem) =>
            h(
              'span',
              { class: 'font-mono text-xs' },
              row.source_type ? `${row.source_type}#${row.source_id ?? '-'}` : '—'
            )
        },
        { prop: 'created_at', label: '交易时间', width: 180 },
        {
          prop: 'actions',
          label: '操作',
          width: 140,
          fixed: 'right',
          formatter: (row: WalletTradeItem) =>
            h('div', { class: 'flex items-center' }, [
              h(ArtButtonTable, {
                type: 'view',
                title: '详情',
                onClick: () => viewDetail(row)
              }),
              hasAuth('wallet.adjust') && row.owner
                ? h(ArtButtonTable, {
                    icon: 'ri:coins-line',
                    iconColor: 'var(--el-color-warning)',
                    buttonBgColor: 'rgba(230,162,60,0.12)',
                    title: '调账',
                    onClick: () => openAdjustDialog(row.owner)
                  })
                : null
            ])
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
      () => fetchExportWalletTrades(filters as unknown as Api.WalletManage.WalletTradeSearchParams),
      'wallet_trades'
    )
  }

  const viewDetail = (row: WalletTradeItem) => {
    detailDialogRef.value?.open(row)
  }

  const openAdjustDialog = (owner?: { id: number; name: string } | null) => {
    adjustDialogRef.value?.open(owner)
  }

  const onAdjustSuccess = () => {
    refreshData()
    statsRef.value?.refresh()
  }

  const handleSearch = (params: Partial<Api.WalletManage.WalletTradeSearchParams>) => {
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
