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
    (e: 'search', params: Partial<Api.OperationManage.AgreementSearchParams>): void
    (e: 'resetSearchParams'): void
  }
  const emit = defineEmits<Emits>()

  const searchBarRef = ref()
  const formData = ref<Partial<Api.OperationManage.AgreementSearchParams>>({})

  const categoryOptions = ref<{ label: string; value: string }[]>([])

  const statusOptions = [
    { label: '草稿', value: 'draft' },
    { label: '已发布', value: 'published' },
    { label: '已归档', value: 'archived' }
  ]

  const formItems = computed(() => [
    {
      label: '关键词',
      key: 'keyword',
      type: 'input',
      props: {
        placeholder: '标题关键词',
        clearable: true
      }
    },
    {
      label: '类别',
      key: 'category',
      type: 'select',
      props: {
        placeholder: '请选择类别',
        clearable: true,
        options: categoryOptions.value
      }
    },
    {
      label: '状态',
      key: 'status',
      type: 'select',
      props: {
        placeholder: '请选择状态',
        clearable: true,
        options: statusOptions
      }
    }
  ])

  async function loadCategoryOptions() {
    try {
      const items = await fetchDictItemsByCode('agreement_category')
      categoryOptions.value = (items || []).map((it) => ({ label: it.label, value: it.value }))
    } catch {
      categoryOptions.value = []
    }
  }

  function handleReset() {
    formData.value = {}
    emit('resetSearchParams')
  }

  async function handleSearch(params: Partial<Api.OperationManage.AgreementSearchParams>) {
    await searchBarRef.value?.validate()
    emit('search', params)
  }

  onMounted(loadCategoryOptions)
</script>

<style scoped lang="scss"></style>
