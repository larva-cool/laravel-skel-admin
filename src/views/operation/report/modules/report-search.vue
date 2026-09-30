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
    (e: 'search', params: Partial<Api.SystemManage.ReportSearchParams>): void
    (e: 'resetSearchParams'): void
  }
  const emit = defineEmits<Emits>()

  const searchBarRef = ref()
  const formData = ref<Partial<Api.SystemManage.ReportSearchParams>>({})

  const categoryOptions = ref<{ label: string; value: string }[]>([])

  const statusOptions = [
    { label: '待处理', value: 'pending' },
    { label: '处理中', value: 'processing' },
    { label: '已处理', value: 'resolved' },
    { label: '已驳回', value: 'rejected' }
  ]

  const reportableTypeOptions = [
    { label: '评论', value: 'comment' },
    { label: '用户', value: 'user' }
  ]

  const formItems = computed(() => [
    {
      label: '关键词',
      key: 'keyword',
      type: 'input',
      props: {
        placeholder: '举报描述 / 举报ID',
        clearable: true
      }
    },
    {
      label: '举报分类',
      key: 'category',
      type: 'select',
      props: {
        placeholder: '请选择分类',
        clearable: true,
        options: categoryOptions.value
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
      label: '对象类型',
      key: 'reportable_type',
      type: 'select',
      props: {
        placeholder: '请选择被举报对象类型',
        clearable: true,
        options: reportableTypeOptions
      }
    },
    {
      label: '举报日期',
      key: 'created_at',
      type: 'daterange',
      props: {
        startPlaceholder: '开始日期',
        endPlaceholder: '结束日期',
        valueFormat: 'YYYY-MM-DD'
      }
    }
  ])

  async function loadCategoryOptions() {
    try {
      const items = await fetchDictItemsByCode('report_category')
      categoryOptions.value = (items || []).map((it) => ({ label: it.label, value: it.value }))
    } catch {
      categoryOptions.value = []
    }
  }

  function handleReset() {
    formData.value = {}
    emit('resetSearchParams')
  }

  async function handleSearch(params: Partial<Api.SystemManage.ReportSearchParams>) {
    await searchBarRef.value?.validate()
    // daterange 转 start_date/end_date
    const raw = params as Record<string, unknown>
    const createdAt = raw.created_at as string[] | undefined
    const normalized: Record<string, unknown> = { ...params }
    delete normalized.created_at
    if (Array.isArray(createdAt) && createdAt.length === 2) {
      normalized.start_date = createdAt[0]
      normalized.end_date = createdAt[1]
    }
    emit('search', normalized as Partial<Api.SystemManage.ReportSearchParams>)
  }

  onMounted(loadCategoryOptions)
</script>

<style scoped lang="scss"></style>
