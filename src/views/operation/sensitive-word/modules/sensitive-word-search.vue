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
  interface Props {
    categoryOptions?: Api.OperationManage.OptionItem[]
    levelOptions?: Api.OperationManage.OptionItem[]
  }
  const props = withDefaults(defineProps<Props>(), {
    categoryOptions: () => [],
    levelOptions: () => []
  })

  interface Emits {
    (e: 'search', params: Partial<Api.OperationManage.SensitiveWordSearchParams>): void
    (e: 'resetSearchParams'): void
  }
  const emit = defineEmits<Emits>()

  const searchBarRef = ref()
  const formData = ref<Partial<Api.OperationManage.SensitiveWordSearchParams>>({})

  const statusOptions = [
    { label: '启用', value: true },
    { label: '禁用', value: false }
  ]

  const formItems = computed(() => [
    {
      label: '关键词',
      key: 'keyword',
      type: 'input',
      props: {
        placeholder: '敏感词关键词',
        clearable: true
      }
    },
    {
      label: '分类',
      key: 'category',
      type: 'select',
      props: {
        placeholder: '请选择分类',
        clearable: true,
        options: props.categoryOptions
      }
    },
    {
      label: '处理级别',
      key: 'level',
      type: 'select',
      props: {
        placeholder: '请选择处理级别',
        clearable: true,
        options: props.levelOptions
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

  function handleReset() {
    formData.value = {}
    emit('resetSearchParams')
  }

  async function handleSearch(params: Partial<Api.OperationManage.SensitiveWordSearchParams>) {
    await searchBarRef.value?.validate()
    emit('search', params)
  }
</script>
