<template>
  <ArtSearchBar
    ref="searchBarRef"
    v-model="formData"
    :items="formItems"
    @reset="handleReset"
    @search="handleSearch"
  />
</template>

<script setup lang="ts">
  interface Emits {
    (e: 'search', params: Partial<Api.OperationManage.TaskLogSearchParams>): void
    (e: 'resetSearchParams'): void
  }
  const emit = defineEmits<Emits>()

  const searchBarRef = ref()
  const formData = ref<Record<string, unknown>>({})

  const rewardTypeOptions = [
    { label: '金币', value: 'coin' },
    { label: '积分', value: 'point' },
    { label: 'VIP天数', value: 'vip_days' }
  ]

  const formItems = computed(() => [
    {
      label: '关键词',
      key: 'keyword',
      type: 'input',
      props: {
        placeholder: '任务名/用户名/周期标识',
        clearable: true
      }
    },
    {
      label: '任务ID',
      key: 'task_id',
      type: 'input',
      props: {
        placeholder: '任务ID',
        clearable: true
      }
    },
    {
      label: '奖励类型',
      key: 'reward_type',
      type: 'select',
      props: {
        placeholder: '请选择奖励类型',
        clearable: true,
        options: rewardTypeOptions
      }
    },
    {
      label: '记录时间',
      key: 'date_range',
      type: 'daterange',
      props: {
        type: 'daterange',
        placeholder: ['开始日期', '结束日期'],
        clearable: true,
        format: 'YYYY-MM-DD',
        valueFormat: 'YYYY-MM-DD'
      }
    }
  ])

  function handleReset() {
    formData.value = {}
    emit('resetSearchParams')
  }

  async function handleSearch(params: Record<string, unknown>) {
    await searchBarRef.value?.validate()
    // 将 date_range 数组拆分为 start_date / end_date
    const range = params.date_range as [string, string] | undefined
    delete params.date_range
    if (range && range.length === 2) {
      params.start_date = range[0]
      params.end_date = range[1]
    }
    emit('search', params as unknown as Partial<Api.OperationManage.TaskLogSearchParams>)
  }
</script>
