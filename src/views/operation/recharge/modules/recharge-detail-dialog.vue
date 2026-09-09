<template>
  <ElDialog
    v-model="dialogVisible"
    title="充值订单详情"
    width="820px"
    :close-on-click-modal="false"
    destroy-on-close
    align-center
    @close="handleClose"
  >
    <ElDescriptions v-if="detail" :column="2" border class="mt-4">
      <ElDescriptionsItem label="订单ID" :span="1">{{ detail.id }}</ElDescriptionsItem>
      <ElDescriptionsItem label="订单号" :span="1">
        <span class="font-mono text-sm">{{ detail.order_no }}</span>
      </ElDescriptionsItem>
      <ElDescriptionsItem label="用户" :span="1">
        {{ detail.owner?.name || '—' }}
        <span v-if="detail.owner?.id" class="text-xs text-g-500">（#{{ detail.owner.id }}）</span>
      </ElDescriptionsItem>
      <ElDescriptionsItem label="支付渠道" :span="1">
        <ElTag
          v-if="detail.pay_channel"
          size="small"
          :type="mapTagType(detail.pay_channel_label_type)"
          effect="plain"
        >
          {{ payChannelLabel(detail.pay_channel) }}
        </ElTag>
        <span v-else>—</span>
      </ElDescriptionsItem>
      <ElDescriptionsItem label="充值金额" :span="1">
        <span class="font-semibold tabular-nums text-g-900">¥{{ formatMoney(detail.amount) }}</span>
      </ElDescriptionsItem>
      <ElDescriptionsItem label="赠送金额" :span="1">
        <span class="font-semibold tabular-nums text-success"
          >¥{{ formatMoney(detail.bonus_amount) }}</span
        >
      </ElDescriptionsItem>
      <ElDescriptionsItem label="实际入账" :span="1">
        <span class="font-semibold tabular-nums text-primary text-base"
          >¥{{ formatMoney(detail.total_amount) }}</span
        >
      </ElDescriptionsItem>
      <ElDescriptionsItem label="支付状态" :span="1">
        <ElTag size="small" :type="mapTagType(detail.pay_status_label_type)">
          {{ payStatusLabel(detail.pay_status) }}
        </ElTag>
        <ElTag v-if="detail.is_expired" size="small" type="info" effect="plain" class="ml-2"
          >已过期</ElTag
        >
      </ElDescriptionsItem>
      <ElDescriptionsItem label="渠道流水号" :span="1">
        <span class="font-mono text-xs">{{ detail.transaction_id || '—' }}</span>
      </ElDescriptionsItem>
      <ElDescriptionsItem label="确认人ID" :span="1">{{
        detail.confirmed_by || '—'
      }}</ElDescriptionsItem>
      <ElDescriptionsItem label="客户端IP" :span="1">{{
        detail.client_ip || '—'
      }}</ElDescriptionsItem>
      <ElDescriptionsItem label="备注" :span="1">{{ detail.remark || '—' }}</ElDescriptionsItem>
      <ElDescriptionsItem label="支付时间" :span="1">{{
        detail.paid_at || '—'
      }}</ElDescriptionsItem>
      <ElDescriptionsItem label="过期时间" :span="1">{{
        detail.expired_at || '—'
      }}</ElDescriptionsItem>
      <ElDescriptionsItem label="创建时间" :span="2">{{
        detail.created_at || '—'
      }}</ElDescriptionsItem>
      <ElDescriptionsItem v-if="detail.callback_payload" label="渠道回调报文" :span="2">
        <pre
          class="text-xs font-mono overflow-x-auto max-h-[300px] overflow-y-auto whitespace-pre-wrap mt-2 bg-g-50 p-2 rounded"
          >{{ callbackText }}</pre>
      </ElDescriptionsItem>
    </ElDescriptions>

    <template #footer>
      <ElButton type="primary" @click="handleClose">关闭</ElButton>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import { computed, ref } from 'vue'
  import { fetchGetRechargeDetail } from '@/api/wallet'

  defineOptions({ name: 'RechargeDetailDialog' })

  type RechargeItem = Api.WalletManage.Recharge

  const dialogVisible = ref(false)
  const detail = ref<RechargeItem | null>(null)

  const callbackText = computed(() => {
    const payload = detail.value?.callback_payload
    if (!payload || Object.keys(payload).length === 0) return ''
    return JSON.stringify(payload, null, 2)
  })

  const mapTagType = (t?: string) => {
    if (!t || t === 'default') return undefined
    return t as 'primary' | 'success' | 'warning' | 'danger' | 'info'
  }

  const payChannelLabel = (v?: string) => {
    const map: Record<string, string> = {
      manual: '人工充值',
      wechat: '微信支付',
      alipay: '支付宝',
      apple: 'Apple Pay'
    }
    return (v && map[v]) || v || '—'
  }

  const payStatusLabel = (v?: string) => {
    const map: Record<string, string> = {
      pending: '待支付',
      success: '支付成功',
      failed: '支付失败',
      expired: '已过期',
      closed: '已关闭'
    }
    return (v && map[v]) || v || '—'
  }

  function formatMoney(v: number | string | null | undefined): string {
    if (v == null) return '0.00'
    const n = typeof v === 'number' ? v : Number(v)
    return Number.isFinite(n) ? n.toFixed(2) : String(v)
  }

  const open = async (row: RechargeItem) => {
    dialogVisible.value = true
    detail.value = row
    try {
      const res = await fetchGetRechargeDetail(row.id)
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
