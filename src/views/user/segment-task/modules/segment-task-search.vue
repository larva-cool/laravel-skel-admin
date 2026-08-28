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
    (e: 'search', params: Partial<Api.SegmentManage.SegmentTaskSearchParams>): void
    (e: 'resetSearchParams'): void
  }
  const emit = defineEmits<Emits>()

  const searchBarRef = ref()
  const formData = ref<Partial<Api.SegmentManage.SegmentTaskSearchParams>>({})

  const statusOptions = [
    { label: '待执行', value: 'pending' },
    { label: '执行中', value: 'running' },
    { label: '已完成', value: 'completed' },
    { label: '失败', value: 'failed' }
  ]

  const typeOptions = [
    { label: '打标', value: 'attach' },
    { label: '解标', value: 'detach' }
  ]

  const formItems = computed(() => [
    {
      label: '任务类型',
      key: 'type',
      type: 'select',
      props: {
        placeholder: '请选择任务类型',
        clearable: true,
        options: typeOptions
      }
    },
    {
      label: '任务状态',
      key: 'status',
      type: 'select',
      props: {
        placeholder: '请选择任务状态',
        clearable: true,
        options: statusOptions
      }
    }
  ])

  function handleReset() {
    formData.value = {}
    emit('resetSearchParams')
  }

  async function handleSearch(params: Partial<Api.SegmentManage.SegmentTaskSearchParams>) {
    await searchBarRef.value?.validate()
    emit('search', params)
  }
</script>

<style scoped lang="scss"></style>
