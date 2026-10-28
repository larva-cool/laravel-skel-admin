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
    (e: 'search', params: Partial<Api.Automation.RuleSearchParams>): void
    (e: 'resetSearchParams'): void
  }
  const emit = defineEmits<Emits>()

  const searchBarRef = ref()
  const formData = ref<Partial<Api.Automation.RuleSearchParams>>({})

  const triggerTypeOptions = [
    { label: '生日提醒', value: 'birthday' },
    { label: '节日提醒', value: 'festival' },
    { label: '注册周年提醒', value: 'register_anniversary' }
  ]

  const formItems = computed(() => [
    {
      label: '关键词',
      key: 'keyword',
      type: 'input',
      props: {
        placeholder: '规则名称',
        clearable: true
      }
    },
    {
      label: '触发类型',
      key: 'trigger_type',
      type: 'select',
      props: {
        placeholder: '请选择触发类型',
        clearable: true,
        options: triggerTypeOptions
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

  async function handleSearch(params: Partial<Api.Automation.RuleSearchParams>) {
    await searchBarRef.value?.validate()
    emit('search', params)
  }
</script>
