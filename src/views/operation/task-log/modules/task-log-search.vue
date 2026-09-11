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
  const formData = ref<Partial<Api.OperationManage.TaskLogSearchParams>>({})

  const dateRange = ref<[string, string] | null>(null)

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
        'range-separator': '至',
        'start-placeholder': '开始日期',
        'end-placeholder': '结束日期',
        'value-format': 'YYYY-MM-DD',
        clearable: true
      }
    }
  ])

  watch(dateRange, (val) => {
    if (val && val.length === 2) {
      formData.value.start_date = val[0]
      formData.value.end_date = val[1]
    } else {
      delete formData.value.start_date
      delete formData.value.end_date
    }
  })

  function handleReset() {
    formData.value = {}
    dateRange.value = null
    emit('resetSearchParams')
  }

  async function handleSearch(params: Partial<Api.OperationManage.TaskLogSearchParams>) {
    await searchBarRef.value?.validate()
    if (dateRange.value && dateRange.value.length === 2) {
      params.start_date = dateRange.value[0]
      params.end_date = dateRange.value[1]
    }
    emit('search', params)
  }
</script>
