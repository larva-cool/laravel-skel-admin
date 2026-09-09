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
  import { fetchGetRechargeStats } from '@/api/wallet'

  interface CardDataItem {
    des: string
    icon: string
    num: number | string
    tip: string
    bgColor: string
    iconColor: string
  }

  defineOptions({ name: 'RechargeStats' })

  const loading = ref(true)
  const dataList = reactive<CardDataItem[]>([
    {
      des: '充值总额',
      icon: 'ri:money-cny-circle-line',
      num: '0.00',
      tip: '累计充值金额（不含赠送）',
      bgColor: 'color-mix(in srgb, var(--el-color-primary) 12%, transparent)',
      iconColor: 'var(--el-color-primary)'
    },
    {
      des: '赠送金额',
      icon: 'ri:gift-line',
      num: '0.00',
      tip: '累计赠送金额合计',
      bgColor: 'color-mix(in srgb, var(--el-color-success) 12%, transparent)',
      iconColor: 'var(--el-color-success)'
    },
    {
      des: '今日充值',
      icon: 'ri:flashlight-line',
      num: '0.00',
      tip: '今日成功入账总额',
      bgColor: 'color-mix(in srgb, var(--el-color-info) 14%, transparent)',
      iconColor: 'var(--el-color-info)'
    },
    {
      des: '待处理',
      icon: 'ri:time-line',
      num: 0,
      tip: '待确认的充值订单数',
      bgColor: 'color-mix(in srgb, var(--el-color-warning) 16%, transparent)',
      iconColor: 'var(--el-color-warning)'
    },
    {
      des: '成功率',
      icon: 'ri:checkbox-circle-line',
      num: '0%',
      tip: '成功订单 / 总订单',
      bgColor: 'color-mix(in srgb, var(--el-color-danger) 12%, transparent)',
      iconColor: 'var(--el-color-danger)'
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
      const res = await fetchGetRechargeStats()
      dataList[0].num = Number(toNumber(res.total_amount)).toFixed(2)
      dataList[1].num = Number(toNumber(res.total_bonus)).toFixed(2)
      dataList[2].num = Number(toNumber(res.today_amount)).toFixed(2)
      dataList[3].num = toNumber(res.pending_count)
      const rate = toNumber(res.success_rate)
      dataList[4].num = `${rate.toFixed(1)}%`
    } finally {
      loading.value = false
    }
  }

  const refresh = loadData

  onMounted(loadData)
  defineExpose({ refresh })
</script>
