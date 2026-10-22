<!-- 财务分析页面 -->
<template>
  <div>
    <!-- 财务指标卡片 -->
    <ElRow :gutter="20" class="flex">
      <ElCol v-for="(item, index) in cards" :key="index" :sm="12" :md="6" :lg="6">
        <div
          v-loading="loading"
          class="art-card relative flex flex-col justify-center h-35 px-5 mb-5 max-sm:mb-4"
        >
          <span class="text-g-700 text-sm">{{ item.label }}</span>
          <span
            class="text-[26px] font-medium mt-2 tabular-nums"
            :class="item.value < 0 ? 'text-danger' : 'text-g-900'"
          >
            {{ formatMoney(item.value) }}
          </span>
          <span class="text-xs text-g-500 mt-1">{{ item.hint }}</span>
          <div
            class="absolute top-0 bottom-0 right-5 m-auto size-12.5 rounded-xl flex-cc bg-theme/10"
          >
            <ArtSvgIcon :icon="item.icon" class="text-xl text-theme" />
          </div>
        </div>
      </ElCol>
    </ElRow>

    <!-- 资金流向趋势 -->
    <div v-loading="loading" class="art-card h-105 p-5 mb-5 max-sm:mb-4">
      <div class="art-card-header">
        <div class="title">
          <h4>资金流向</h4>
          <p class="text-g-600">近 7 天充值 / 提现金额趋势</p>
        </div>
      </div>
      <ArtLineChart
        height="calc(100% - 56px)"
        :data="chartData"
        :xAxisData="xAxisData"
        :showLegend="true"
        :showAreaColor="true"
        :showAxisLine="false"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
  import { fetchDashboardStats, type DashboardFinance } from '@/api/dashboard'
  import type { LineDataItem } from '@/types/component/chart'

  interface FinanceCard {
    label: string
    value: number
    hint: string
    icon: string
  }

  defineOptions({ name: 'Finance' })

  const loading = ref(true)
  const cards = ref<FinanceCard[]>([])
  const xAxisData = ref<string[]>([])
  const chartData = ref<LineDataItem[]>([
    { name: '充值', data: [] },
    { name: '提现', data: [] }
  ])

  async function loadData() {
    loading.value = true
    try {
      const res = await fetchDashboardStats({ days: 7 })
      const finance: DashboardFinance = res.finance

      cards.value = [
        {
          label: '充值总额',
          value: finance.total_recharge,
          hint: `共 ${finance.recharge_count} 笔`,
          icon: 'ri:money-cny-circle-line'
        },
        {
          label: '提现总额',
          value: finance.total_withdraw,
          hint: `共 ${finance.withdraw_count} 笔`,
          icon: 'ri:bank-card-2-line'
        },
        { label: '净收入', value: finance.net_income, hint: '充值 - 提现', icon: 'ri:funds-line' },
        {
          label: '今日充值',
          value: finance.today_recharge,
          hint: `今日提现 ${formatMoney(finance.today_withdraw)}`,
          icon: 'ri:calendar-2-line'
        }
      ]

      const trend = finance.trend
      xAxisData.value = trend.map((p) => {
        const d = new Date(p.date)
        return `${d.getMonth() + 1}/${d.getDate()}`
      })
      chartData.value = [
        { name: '充值', data: trend.map((p) => p.recharge) },
        { name: '提现', data: trend.map((p) => p.withdraw) }
      ]
    } finally {
      loading.value = false
    }
  }

  function formatMoney(value: number): string {
    const sign = value < 0 ? '-' : ''
    const abs = Math.abs(value)
    return `${sign}¥${abs.toLocaleString('zh-CN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`
  }

  onMounted(loadData)
</script>
