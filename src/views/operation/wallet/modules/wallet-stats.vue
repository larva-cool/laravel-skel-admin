<template>
  <ElRow :gutter="20" class="flex">
    <ElCol v-for="(item, index) in dataList" :key="index" :sm="12" :md="8" :lg="Math.floor(24 / 5)">
      <div v-loading="loading" class="art-card-sm px-5 py-5 mb-4">
        <div class="flex items-center justify-between gap-3">
          <span class="text-sm text-g-600">{{ item.des }}</span>
          <div
            class="flex size-11 items-center justify-center rounded-[calc(var(--custom-radius)+4px)] text-lg"
            :style="{ background: item.bgColor, color: item.iconColor }"
          >
            <ArtSvgIcon :icon="item.icon" class="text-lg" />
          </div>
        </div>
        <div class="text-3xl font-semibold tracking-tight text-g-900 mt-2">
          <ArtCountTo v-if="typeof item.num === 'number'" :target="item.num" :duration="1200" />
          <span v-else>{{ item.num }}</span>
        </div>
        <div class="mt-2 text-xs leading-6 text-g-500">{{ item.tip }}</div>
      </div>
    </ElCol>
  </ElRow>
</template>

<script setup lang="ts">
  import { fetchGetWalletStats } from '@/api/wallet'

  interface CardDataItem {
    des: string
    icon: string
    num: number | string
    tip: string
    bgColor: string
    iconColor: string
  }

  defineOptions({ name: 'WalletStats' })

  const loading = ref(true)
  const dataList = reactive<CardDataItem[]>([
    {
      des: '用户总余额',
      icon: 'ri:wallet-3-line',
      num: '0.00',
      tip: '全部用户可用余额合计',
      bgColor: 'color-mix(in srgb, var(--el-color-primary) 12%, transparent)',
      iconColor: 'var(--el-color-primary)'
    },
    {
      des: '冻结总额',
      icon: 'ri:lock-line',
      num: '0.00',
      tip: '全部用户冻结余额合计',
      bgColor: 'color-mix(in srgb, var(--el-color-warning) 16%, transparent)',
      iconColor: 'var(--el-color-warning)'
    },
    {
      des: '累计收入',
      icon: 'ri:arrow-up-circle-line',
      num: '0.00',
      tip: '充值 + 退款 + 后台充正',
      bgColor: 'color-mix(in srgb, var(--el-color-success) 12%, transparent)',
      iconColor: 'var(--el-color-success)'
    },
    {
      des: '累计支出',
      icon: 'ri:arrow-down-circle-line',
      num: '0.00',
      tip: '提现 + 消费 + 后台扣减',
      bgColor: 'color-mix(in srgb, var(--el-color-danger) 12%, transparent)',
      iconColor: 'var(--el-color-danger)'
    },
    {
      des: '流水总数',
      icon: 'ri:file-list-3-line',
      num: 0,
      tip: '累计钱包流水条数',
      bgColor: 'color-mix(in srgb, var(--el-color-info) 14%, transparent)',
      iconColor: 'var(--el-color-info)'
    }
  ])

  function toNumber(v: number | string | null | undefined): number {
    if (v == null) return 0
    const n = typeof v === 'number' ? v : Number(v)
    return Number.isFinite(n) ? n : 0
  }

  async function loadData() {
    loading.value = true
    try {
      const res = await fetchGetWalletStats()
      dataList[0].num = toNumber(res.total_balance).toFixed(2)
      dataList[1].num = toNumber(res.total_frozen).toFixed(2)
      dataList[2].num = toNumber(res.total_income).toFixed(2)
      dataList[3].num = toNumber(res.total_expense).toFixed(2)
      dataList[4].num = toNumber(res.trade_count)
    } finally {
      loading.value = false
    }
  }

  const refresh = loadData

  onMounted(loadData)
  defineExpose({ refresh })
</script>
