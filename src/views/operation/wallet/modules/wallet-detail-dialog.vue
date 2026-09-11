<template>
  <ElDialog
    v-model="dialogVisible"
    title="钱包流水详情"
    width="820px"
    :close-on-click-modal="false"
    destroy-on-close
    align-center
    @close="handleClose"
  >
    <ElDescriptions v-if="detail" :column="2" border class="mt-3">
      <ElDescriptionsItem label="流水号" :span="1">
        <span class="font-mono text-sm">{{ detail.id }}</span>
      </ElDescriptionsItem>
      <ElDescriptionsItem label="持有者" :span="1">
        {{ detail.owner?.name || '—' }}
        <span v-if="detail.owner?.id" class="text-xs text-g-500">（#{{ detail.owner.id }}）</span>
      </ElDescriptionsItem>

      <ElDescriptionsItem label="交易类型" :span="1">
        <ElTag size="small" :type="mapTagType(detail.type_label_type)" effect="plain">
          {{ detail.type?.label || '—' }}
        </ElTag>
      </ElDescriptionsItem>
      <ElDescriptionsItem label="流水状态" :span="1">
        <ElTag size="small" :type="mapTagType(detail.status_label_type)">
          {{ detail.status?.label || '—' }}
        </ElTag>
      </ElDescriptionsItem>

      <ElDescriptionsItem label="变动金额" :span="2">
        <span
          class="font-semibold tabular-nums text-base"
          :class="isIncome ? 'text-success' : 'text-danger'"
        >
          {{ isIncome ? '+' : '-' }}¥{{ formatMoney(Math.abs(toNumber(detail.amount))) }}
        </span>
      </ElDescriptionsItem>

      <ElDescriptionsItem label="变动前余额" :span="1">
        <span class="tabular-nums">¥{{ formatMoney(detail.before_balance) }}</span>
      </ElDescriptionsItem>
      <ElDescriptionsItem label="变动后余额" :span="1">
        <span class="font-semibold tabular-nums text-primary"
          >¥{{ formatMoney(detail.after_balance) }}</span
        >
      </ElDescriptionsItem>
      <ElDescriptionsItem label="变动前冻结" :span="1">
        <span class="tabular-nums">¥{{ formatMoney(detail.before_frozen) }}</span>
      </ElDescriptionsItem>
      <ElDescriptionsItem label="变动后冻结" :span="1">
        <span class="font-semibold tabular-nums text-warning"
          >¥{{ formatMoney(detail.after_frozen) }}</span
        >
      </ElDescriptionsItem>

      <ElDescriptionsItem label="来源类型" :span="1">
        <span class="font-mono text-xs">{{ detail.source_type || '—' }}</span>
      </ElDescriptionsItem>
      <ElDescriptionsItem label="来源ID" :span="1">{{
        detail.source_id || '—'
      }}</ElDescriptionsItem>

      <ElDescriptionsItem label="交易时间" :span="2">{{
        detail.created_at || '—'
      }}</ElDescriptionsItem>
      <ElDescriptionsItem label="交易描述" :span="2">{{
        detail.description || '—'
      }}</ElDescriptionsItem>
    </ElDescriptions>

    <template #footer>
      <ElButton type="primary" @click="handleClose">关闭</ElButton>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import { computed, ref } from 'vue'
  import { fetchGetWalletTradeDetail } from '@/api/wallet'

  defineOptions({ name: 'WalletDetailDialog' })

  type WalletTradeItem = Api.WalletManage.WalletTrade

  const dialogVisible = ref(false)
  const detail = ref<WalletTradeItem | null>(null)

  const isIncome = computed(() => toNumber(detail.value?.amount) >= 0)

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

  const open = async (row: WalletTradeItem) => {
    dialogVisible.value = true
    detail.value = row
    try {
      const res = await fetchGetWalletTradeDetail(row.id)
      detail.value = res
    } catch {
      // 请求失败时保留列表已有数据
    }
  }

  const handleClose = () => {
    dialogVisible.value = false
    detail.value = null
  }

  defineExpose({ open })
</script>

<style scoped lang="scss">
  .mt-3 {
    margin-top: 12px;
  }
</style>
