<template>
  <ElRow :gutter="20" class="flex">
    <ElCol v-for="(item, index) in dataList" :key="index" :sm="12" :md="6" :lg="6">
      <div v-loading="loading" class="art-surface-sm px-5 py-5 mb-4">
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
          <ArtCountTo :target="item.num" :duration="1200" />
        </div>
        <div class="mt-2 text-xs leading-6 text-g-500">{{ item.tip }}</div>
      </div>
    </ElCol>
  </ElRow>
</template>

<script setup lang="ts">
  import { fetchGetFeedbackStats } from '@/api/system-manage'

  interface CardDataItem {
    des: string
    icon: string
    num: number
    tip: string
    bgColor: string
    iconColor: string
  }

  const loading = ref(true)
  const dataList = reactive<CardDataItem[]>([
    {
      des: '反馈总量',
      icon: 'ri:chat-3-line',
      num: 0,
      tip: '累计收到的全部用户反馈',
      bgColor: 'color-mix(in srgb, var(--el-color-primary) 12%, transparent)',
      iconColor: 'var(--el-color-primary)'
    },
    {
      des: '待推进',
      icon: 'ri:time-line',
      num: 0,
      tip: '待处理、分析中、已规划、处理中',
      bgColor: 'color-mix(in srgb, var(--el-color-warning) 16%, transparent)',
      iconColor: 'var(--el-color-warning)'
    },
    {
      des: '今日新增',
      icon: 'ri:flashlight-line',
      num: 0,
      tip: '今天新收到的体验反馈',
      bgColor: 'color-mix(in srgb, var(--el-color-info) 14%, transparent)',
      iconColor: 'var(--el-color-info)'
    },
    {
      des: '已闭环',
      icon: 'ri:checkbox-circle-line',
      num: 0,
      tip: '已解决或已关闭的反馈',
      bgColor: 'color-mix(in srgb, var(--el-color-success) 16%, transparent)',
      iconColor: 'var(--el-color-success)'
    }
  ])

  async function loadData() {
    loading.value = true
    try {
      const res = await fetchGetFeedbackStats()
      dataList[0].num = res.total
      dataList[1].num = res.pending
      dataList[2].num = res.today
      dataList[3].num = res.closed
    } finally {
      loading.value = false
    }
  }

  const refresh = loadData

  onMounted(loadData)
  defineExpose({ refresh })
</script>
