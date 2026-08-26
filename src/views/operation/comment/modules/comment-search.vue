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
  interface SourceOption {
    label: string
    value: string
  }

  interface Props {
    sourceTypeOptions?: SourceOption[]
  }

  const props = withDefaults(defineProps<Props>(), {
    sourceTypeOptions: () => []
  })

  interface Emits {
    (e: 'search', params: Partial<Api.ContentManage.CommentSearchParams>): void
    (e: 'resetSearchParams'): void
  }
  const emit = defineEmits<Emits>()

  const searchBarRef = ref()
  const formData = ref<Partial<Api.ContentManage.CommentSearchParams>>({})

  const statusOptions = [
    { label: '待审核', value: 'pending' },
    { label: '审核中', value: 'review' },
    { label: '已通过', value: 'approved' },
    { label: '已驳回', value: 'rejected' }
  ]

  const formItems = computed(() => [
    {
      label: '关键词',
      key: 'keyword',
      type: 'input',
      props: {
        placeholder: '评论内容',
        clearable: true
      }
    },
    {
      label: '审核状态',
      key: 'status',
      type: 'select',
      props: {
        placeholder: '请选择状态',
        clearable: true,
        options: statusOptions
      }
    },
    {
      label: '源类型',
      key: 'source_type',
      type: 'select',
      props: {
        placeholder: '请选择源类型',
        clearable: true,
        options: props.sourceTypeOptions
      }
    }
  ])

  function handleReset() {
    formData.value = {}
    emit('resetSearchParams')
  }

  async function handleSearch(params: Partial<Api.ContentManage.CommentSearchParams>) {
    await searchBarRef.value?.validate()
    emit('search', params)
  }
</script>

<style scoped lang="scss"></style>
