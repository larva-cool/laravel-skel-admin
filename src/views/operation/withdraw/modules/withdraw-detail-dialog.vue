<template>
  <ElDialog
    v-model="dialogVisible"
    title="提现申请详情"
    width="820px"
    :close-on-click-modal="false"
    destroy-on-close
    align-center
    @close="handleClose"
  >
    <ElDescriptions v-if="detail" :column="2" border class="mt-4">
      <ElDescriptionsItem label="申请ID" :span="1">{{ detail.id }}</ElDescriptionsItem>
      <ElDescriptionsItem label="提现单号" :span="1">
        <span class="font-mono text-sm">{{ detail.order_no }}</span>
      </ElDescriptionsItem>
      <ElDescriptionsItem label="申请人" :span="1">
        {{ detail.owner?.name || '—' }}
        <span v-if="detail.owner?.id" class="text-xs text-g-500">（#{{ detail.owner.id }}）</span>
      </ElDescriptionsItem>
      <ElDescriptionsItem label="账户类型" :span="1">
        <ElTag size="small" :type="mapTagType(detail.account_type_label_type)" effect="plain">
          {{ accountTypeLabel(detail.account_type) }}
        </ElTag>
      </ElDescriptionsItem>
      <ElDescriptionsItem label="提现金额" :span="1">
        <span class="font-semibold tabular-nums text-g-900">¥{{ formatMoney(detail.amount) }}</span>
      </ElDescriptionsItem>
      <ElDescriptionsItem label="手续费" :span="1">
        <span class="font-semibold tabular-nums text-warning">¥{{ formatMoney(detail.fee) }}</span>
      </ElDescriptionsItem>
      <ElDescriptionsItem label="实到金额" :span="1">
        <span class="font-semibold tabular-nums text-primary text-base"
          >¥{{ formatMoney(detail.actual_amount) }}</span
        >
      </ElDescriptionsItem>
      <ElDescriptionsItem label="状态" :span="1">
        <ElTag size="small" :type="mapTagType(detail.status_label_type)">
          {{ statusLabel(detail.status) }}
        </ElTag>
      </ElDescriptionsItem>

      <!-- 收款账户信息 -->
      <ElDescriptionsItem label="收款账户" :span="1">
        <span class="font-mono text-sm">{{ detail.account_info?.account || '—' }}</span>
      </ElDescriptionsItem>
      <ElDescriptionsItem label="真实姓名" :span="1">{{
        detail.account_info?.real_name || '—'
      }}</ElDescriptionsItem>
      <ElDescriptionsItem v-if="detail.account_type === 'bank'" label="开户银行" :span="2">
        {{ detail.account_info?.bank_name || '—' }}
      </ElDescriptionsItem>

      <ElDescriptionsItem label="审核人ID" :span="1">{{
        detail.reviewed_by || '—'
      }}</ElDescriptionsItem>
      <ElDescriptionsItem label="审核时间" :span="1">{{
        detail.reviewed_at || '—'
      }}</ElDescriptionsItem>
      <ElDescriptionsItem label="打款时间" :span="1">{{
        detail.transfer_at || '—'
      }}</ElDescriptionsItem>
      <ElDescriptionsItem label="申请时间" :span="1">{{
        detail.created_at || '—'
      }}</ElDescriptionsItem>

      <ElDescriptionsItem v-if="detail.reject_reason" label="驳回原因" :span="2">
        <span class="text-danger">{{ detail.reject_reason }}</span>
      </ElDescriptionsItem>
      <ElDescriptionsItem v-if="detail.fail_reason" label="失败原因" :span="2">
        <span class="text-danger">{{ detail.fail_reason }}</span>
      </ElDescriptionsItem>
      <ElDescriptionsItem v-if="detail.remark" label="备注" :span="2">{{
        detail.remark
      }}</ElDescriptionsItem>
    </ElDescriptions>

    <template #footer>
      <ElButton type="primary" @click="handleClose">关闭</ElButton>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import { ref } from 'vue'
  import { fetchGetWithdrawDetail } from '@/api/wallet'

  defineOptions({ name: 'WithdrawDetailDialog' })

  type WithdrawItem = Api.WalletManage.Withdraw

  const dialogVisible = ref(false)
  const detail = ref<WithdrawItem | null>(null)

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
    return (v && map[v]) || v || '—'
  }

  const statusLabel = (v?: string) => {
    const map: Record<string, string> = {
      pending: '待审核',
      approved: '已通过',
      rejected: '已驳回',
      success: '已打款',
      failed: '打款失败'
    }
    return (v && map[v]) || v || '—'
  }

  function formatMoney(v: number | string | null | undefined): string {
    if (v == null) return '0.00'
    const n = typeof v === 'number' ? v : Number(v)
    return Number.isFinite(n) ? n.toFixed(2) : String(v)
  }

  const open = async (row: WithdrawItem) => {
    dialogVisible.value = true
    detail.value = row
    try {
      const res = await fetchGetWithdrawDetail(row.id)
      detail.value = res
    } catch {
      // 保留列表数据
    }
  }

  const handleClose = () => {
    dialogVisible.value = false
    detail.value = null
  }

  defineExpose({ open })
</script>

<style scoped lang="scss">
  .mt-4 {
    margin-top: 12px;
  }
</style>
