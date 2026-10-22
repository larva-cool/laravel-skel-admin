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
    (e: 'search', params: Partial<Api.Knowledge.SearchParams>): void
    (e: 'resetSearchParams'): void
  }
  const emit = defineEmits<Emits>()

  const searchBarRef = ref()
  const formData = ref<Partial<Api.Knowledge.SearchParams>>({})

  const statusOptions = [
    { label: '待处理', value: 'pending' },
    { label: '处理中', value: 'processing' },
    { label: '已完成', value: 'ready' },
    { label: '失败', value: 'failed' }
  ]

  const enabledOptions = [
    { label: '启用', value: '1' },
    { label: '停用', value: '0' }
  ]

  const formItems = computed(() => [
    {
      label: '关键词',
      key: 'keyword',
      type: 'input',
      props: {
        placeholder: '文档标题',
        clearable: true
      }
    },
    {
      label: '索引状态',
      key: 'status',
      type: 'select',
      props: {
        placeholder: '请选择索引状态',
        clearable: true,
        options: statusOptions
      }
    },
    {
      label: '启用状态',
      key: 'is_enabled',
      type: 'select',
      props: {
        placeholder: '请选择启用状态',
        clearable: true,
        options: enabledOptions
      }
    }
  ])

  function handleReset() {
    formData.value = {}
    emit('resetSearchParams')
  }

  async function handleSearch(params: Partial<Api.Knowledge.SearchParams>) {
    await searchBarRef.value?.validate()
    emit('search', params)
  }
</script>

<style scoped lang="scss"></style>
