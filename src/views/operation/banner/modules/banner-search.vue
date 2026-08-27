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
    positionOptions?: Api.OperationManage.BannerPositionOption[]
  }
  const props = withDefaults(defineProps<Props>(), {
    positionOptions: () => []
  })

  interface Emits {
    (e: 'search', params: Partial<Api.OperationManage.BannerSearchParams>): void
    (e: 'resetSearchParams'): void
  }
  const emit = defineEmits<Emits>()

  const searchBarRef = ref()
  const formData = ref<Partial<Api.OperationManage.BannerSearchParams>>({})

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
        placeholder: '标题关键词',
        clearable: true
      }
    },
    {
      label: '广告位',
      key: 'position',
      type: 'select',
      props: {
        placeholder: '请选择广告位',
        clearable: true,
        options: props.positionOptions
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

  async function handleSearch(params: Partial<Api.OperationManage.BannerSearchParams>) {
    await searchBarRef.value?.validate()
    emit('search', params)
  }
</script>

<style scoped lang="scss"></style>
