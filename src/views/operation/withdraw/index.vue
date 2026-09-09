<template>
  <div class="art-full-height flex flex-col gap-3">
    <!-- 统计卡片 -->
    <WithdrawStats ref="statsRef" />

    <!-- 搜索栏 -->
    <WithdrawSearch
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
        v-auth="'wallet.withdraws'"
        :loading="loading"
        :data="data"
        :columns="columns"
        :pagination="pagination"
        @pagination:size-change="handleSizeChange"
        @pagination:current-change="handleCurrentChange"
      />
    </ElCard>

    <!-- 详情弹窗 -->
    <WithdrawDetailDialog ref="detailDialogRef" />

    <!-- 审核通过弹窗 -->
    <WithdrawRemarkDialog ref="approveDialogRef" action-type="approve" @success="onHandleSuccess" />

    <!-- 驳回弹窗 -->
    <WithdrawRejectDialog ref="rejectDialogRef" @success="onHandleSuccess" />

    <!-- 标记已打款弹窗 -->
    <WithdrawRemarkDialog
      ref="transferDialogRef"
      action-type="transfer"
      @success="onHandleSuccess"
    />

    <!-- 打款失败弹窗 -->
    <WithdrawFailDialog ref="failDialogRef" @success="onHandleSuccess" />
  </div>
</template>

<script setup lang="ts">
  import { h, ref } from 'vue'
  import { ElTag, ElButton } from 'element-plus'
  import { Download } from '@element-plus/icons-vue'
  import ArtSvgIcon from '@/components/core/base/art-svg-icon/index.vue'
  import { useTable } from '@/hooks/core/useTable'
  import { useAuth } from '@/hooks/core/useAuth'
  import { fetchGetWithdrawList, fetchExportWithdraws } from '@/api/wallet'
  import WithdrawStats from './modules/withdraw-stats.vue'
  import WithdrawSearch from './modules/withdraw-search.vue'
  import WithdrawDetailDialog from './modules/withdraw-detail-dialog.vue'
  import WithdrawRemarkDialog from './modules/withdraw-remark-dialog.vue'
  import WithdrawRejectDialog from './modules/withdraw-reject-dialog.vue'
  import WithdrawFailDialog from './modules/withdraw-fail-dialog.vue'
  import { useExport } from '@/hooks/core/useExport'

  defineOptions({ name: 'Withdraw' })

  type WithdrawItem = Api.WalletManage.Withdraw

  const { hasAuth } = useAuth()

  const showSearchBar = ref(true)
  const statsRef = ref<InstanceType<typeof WithdrawStats>>()
  const detailDialogRef = ref<InstanceType<typeof WithdrawDetailDialog>>()
  const approveDialogRef = ref<InstanceType<typeof WithdrawRemarkDialog>>()
  const rejectDialogRef = ref<InstanceType<typeof WithdrawRejectDialog>>()
  const transferDialogRef = ref<InstanceType<typeof WithdrawRemarkDialog>>()
  const failDialogRef = ref<InstanceType<typeof WithdrawFailDialog>>()

  const mapTagType = (t?: string) => {
    if (!t || t === 'default') return undefined
    return t as 'primary' | 'success' | 'warning' | 'danger' | 'info'
  }

  const accountTypeLabel = (v?: string) => {
    const map: Record<string, string> = {
      wechat: '微信',
      alipay: '支付宝',
      bank: '银行卡'
    }
    return (v && map[v]) || v || '-'
  }

  const statusLabel = (v?: string) => {
    const map: Record<string, string> = {
      pending: '待审核',
      approved: '已通过',
      rejected: '已驳回',
      success: '已打款',
      failed: '打款失败'
    }
    return (v && map[v]) || v || '-'
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
      apiFn: fetchGetWithdrawList,
      apiParams: { page: 1, per_page: 20 },
      columnsFactory: () => [
        { prop: 'id', label: 'ID', width: 80 },
        {
          prop: 'order_no',
          label: '提现单号',
          width: 200,
          showOverflowTooltip: true,
          fixed: 'left'
        },
        {
          prop: 'owner',
          label: '用户',
          width: 160,
          showOverflowTooltip: true,
          formatter: (row: WithdrawItem) => {
            if (!row.owner) return '—'
            return h('span', {}, [
              row.owner.name || '—',
              h('span', { class: 'text-xs text-g-500 ml-1' }, `(#${row.owner.id})`)
            ])
          }
        },
        {
          prop: 'amount',
          label: '提现金额',
          width: 120,
          align: 'right',
          formatter: (row: WithdrawItem) =>
            h(
              'span',
              { class: 'font-semibold tabular-nums text-g-900' },
              `¥${formatMoney(row.amount)}`
            )
        },
        {
          prop: 'fee',
          label: '手续费',
          width: 110,
          align: 'right',
          formatter: (row: WithdrawItem) =>
            h(
              'span',
              { class: 'font-semibold tabular-nums text-warning' },
              `¥${formatMoney(row.fee)}`
            )
        },
        {
          prop: 'actual_amount',
          label: '实到金额',
          width: 130,
          align: 'right',
          formatter: (row: WithdrawItem) =>
            h(
              'span',
              { class: 'font-semibold tabular-nums text-primary text-[15px]' },
              `¥${formatMoney(row.actual_amount)}`
            )
        },
        {
          prop: 'account_type',
          label: '账户类型',
          width: 100,
          formatter: (row: WithdrawItem) =>
            h(
              ElTag,
              { type: mapTagType(row.account_type_label_type), size: 'small', effect: 'plain' },
              () => accountTypeLabel(row.account_type)
            )
        },
        {
          prop: 'account_info.account',
          label: '收款账号',
          width: 180,
          showOverflowTooltip: true,
          formatter: (row: WithdrawItem) =>
            h('span', { class: 'font-mono text-xs' }, row.account_info?.account || '—')
        },
        {
          prop: 'account_info.real_name',
          label: '真实姓名',
          width: 110,
          showOverflowTooltip: true,
          formatter: (row: WithdrawItem) => row.account_info?.real_name || '—'
        },
        {
          prop: 'status',
          label: '状态',
          width: 110,
          formatter: (row: WithdrawItem) =>
            h(ElTag, { type: mapTagType(row.status_label_type), size: 'small' }, () =>
              statusLabel(row.status)
            )
        },
        {
          prop: 'reviewed_by',
          label: '审核人',
          width: 90,
          formatter: (row: WithdrawItem) => row.reviewed_by || '—'
        },
        {
          prop: 'reason',
          label: '原因',
          minWidth: 160,
          showOverflowTooltip: true,
          formatter: (row: WithdrawItem) => {
            const reason = row.reject_reason || row.fail_reason
            if (!reason) return '—'
            return h('span', { class: 'text-danger text-xs' }, reason)
          }
        },
        { prop: 'created_at', label: '申请时间', width: 180 },
        {
          prop: 'actions',
          label: '操作',
          width: 240,
          fixed: 'right',
          formatter: (row: WithdrawItem) => {
            const buttons: any[] = [
              h(
                ElButton,
                {
                  type: 'primary',
                  link: true,
                  size: 'small',
                  onClick: () => viewDetail(row)
                },
                () => [h(ArtSvgIcon, { icon: 'ri:eye-line', class: 'mr-0.5' }), '详情']
              )
            ]

            if (hasAuth('wallet.withdraws')) {
              if (row.status === 'pending') {
                buttons.push(
                  h(
                    ElButton,
                    {
                      type: 'success',
                      link: true,
                      size: 'small',
                      onClick: () => openApprove(row)
                    },
                    () => [h(ArtSvgIcon, { icon: 'ri:check-line', class: 'mr-0.5' }), '通过']
                  )
                )
                buttons.push(
                  h(
                    ElButton,
                    {
                      type: 'danger',
                      link: true,
                      size: 'small',
                      onClick: () => openReject(row)
                    },
                    () => [h(ArtSvgIcon, { icon: 'ri:close-line', class: 'mr-0.5' }), '驳回']
                  )
                )
              } else if (row.status === 'approved') {
                buttons.push(
                  h(
                    ElButton,
                    {
                      type: 'success',
                      link: true,
                      size: 'small',
                      onClick: () => openTransfer(row)
                    },
                    () => [h(ArtSvgIcon, { icon: 'ri:bank-line', class: 'mr-0.5' }), '已打款']
                  )
                )
                buttons.push(
                  h(
                    ElButton,
                    {
                      type: 'danger',
                      link: true,
                      size: 'small',
                      onClick: () => openFail(row)
                    },
                    () => [
                      h(ArtSvgIcon, { icon: 'ri:close-circle-line', class: 'mr-0.5' }),
                      '打款失败'
                    ]
                  )
                )
              }
            }

            return h('div', { class: 'flex items-center gap-1 flex-wrap' }, buttons)
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
      () => fetchExportWithdraws(filters as unknown as Api.WalletManage.WithdrawSearchParams),
      'withdraws'
    )
  }

  const viewDetail = (row: WithdrawItem) => {
    detailDialogRef.value?.open(row)
  }

  const openApprove = (row: WithdrawItem) => {
    approveDialogRef.value?.open(row)
  }

  const openReject = (row: WithdrawItem) => {
    rejectDialogRef.value?.open(row)
  }

  const openTransfer = (row: WithdrawItem) => {
    transferDialogRef.value?.open(row)
  }

  const openFail = (row: WithdrawItem) => {
    failDialogRef.value?.open(row)
  }

  const onHandleSuccess = () => {
    refreshData()
    statsRef.value?.refresh()
  }

  const handleSearch = (params: Partial<Api.WalletManage.WithdrawSearchParams>) => {
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
