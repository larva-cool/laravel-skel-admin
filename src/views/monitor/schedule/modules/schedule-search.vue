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
  import type { ScheduleSearchParams } from '@/api/schedule'

  interface Emits {
    (e: 'search', params: Partial<ScheduleSearchParams>): void
    (e: 'resetSearchParams'): void
  }

  const emit = defineEmits<Emits>()

  const searchBarRef = ref()
  const formData = ref<Partial<ScheduleSearchParams>>({})

  const formItems = computed(() => [
    {
      label: '任务名称',
      key: 'name',
      type: 'input',
      props: {
        placeholder: '请输入任务名称',
        clearable: true
      }
    },
    {
      label: '命令名称',
      key: 'command',
      type: 'input',
      props: {
        placeholder: '请输入命令名称',
        clearable: true
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
          { label: '启用', value: 1 },
          { label: '禁用', value: 0 }
        ]
      }
    }
  ])

  function handleReset() {
    formData.value = {}
    emit('resetSearchParams')
  }

  async function handleSearch(params: Partial<ScheduleSearchParams>) {
    await searchBarRef.value?.validate()
    emit('search', params)
  }
</script>

<style scoped lang="scss"></style>
