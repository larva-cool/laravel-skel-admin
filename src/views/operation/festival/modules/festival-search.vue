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
    (e: 'search', params: Partial<Api.Automation.FestivalSearchParams>): void
    (e: 'resetSearchParams'): void
  }
  const emit = defineEmits<Emits>()

  const searchBarRef = ref()
  const formData = ref<Partial<Api.Automation.FestivalSearchParams>>({})

  const formItems = computed(() => [
    {
      label: '关键词',
      key: 'keyword',
      type: 'input',
      props: {
        placeholder: '节日名称',
        clearable: true
      }
    },
    {
      label: '日期类型',
      key: 'date_type',
      type: 'select',
      props: {
        placeholder: '请选择日期类型',
        clearable: true,
        options: [
          { label: '公历', value: 'solar' },
          { label: '农历', value: 'lunar' }
        ]
      }
    },
    {
      label: '状态',
      key: 'status',
      type: 'select',
      props: {
        placeholder: '请选择状态',
        clearable: true,
        options: [
          { label: '启用', value: true },
          { label: '禁用', value: false }
        ]
      }
    }
  ])

  function handleReset() {
    formData.value = {}
    emit('resetSearchParams')
  }

  async function handleSearch(params: Partial<Api.Automation.FestivalSearchParams>) {
    await searchBarRef.value?.validate()
    emit('search', params)
  }
</script>
