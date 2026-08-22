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
  import { fetchDictItemsByCode } from '@/api/system-manage'

  interface Emits {
    (e: 'search', params: Partial<Api.SystemManage.FeedbackSearchParams>): void
    (e: 'resetSearchParams'): void
  }
  const emit = defineEmits<Emits>()

  const searchBarRef = ref()
  const formData = ref<Partial<Api.SystemManage.FeedbackSearchParams>>({})

  const typeOptions = ref<{ label: string; value: string }[]>([])

  const statusOptions = [
    { label: '待处理', value: 0 },
    { label: '分析中', value: 1 },
    { label: '已规划', value: 2 },
    { label: '处理中', value: 3 },
    { label: '已解决', value: 4 },
    { label: '已关闭', value: 5 }
  ]

  const priorityOptions = [
    { label: '低', value: 1 },
    { label: '中', value: 2 },
    { label: '高', value: 3 },
    { label: '紧急', value: 4 }
  ]

  const formItems = computed(() => [
    {
      label: '关键词',
      key: 'keyword',
      type: 'input',
      props: {
        placeholder: '编号 / 标题 / 描述 / 联系方式',
        clearable: true
      }
    },
    {
      label: '反馈类型',
      key: 'type',
      type: 'select',
      props: {
        placeholder: '请选择类型',
        clearable: true,
        options: typeOptions.value
      }
    },
    {
      label: '处理状态',
      key: 'status',
      type: 'select',
      props: {
        placeholder: '请选择状态',
        clearable: true,
        options: statusOptions
      }
    },
    {
      label: '优先级',
      key: 'priority',
      type: 'select',
      props: {
        placeholder: '请选择优先级',
        clearable: true,
        options: priorityOptions
      }
    }
  ])

  async function loadTypeOptions() {
    try {
      const items = await fetchDictItemsByCode('feedback_type')
      typeOptions.value = (items || []).map((it) => ({ label: it.label, value: it.value }))
    } catch {
      typeOptions.value = []
    }
  }

  function handleReset() {
    formData.value = {}
    emit('resetSearchParams')
  }

  async function handleSearch(params: Partial<Api.SystemManage.FeedbackSearchParams>) {
    await searchBarRef.value?.validate()
    emit('search', params)
  }

  onMounted(loadTypeOptions)
</script>

<style scoped lang="scss"></style>
