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
  import { fetchGetTaskGroupOptions } from '@/api/operation-manage'

  interface Emits {
    (e: 'search', params: Partial<Api.OperationManage.TaskSearchParams>): void
    (e: 'resetSearchParams'): void
  }
  const emit = defineEmits<Emits>()

  const searchBarRef = ref()
  const formData = ref<Partial<Api.OperationManage.TaskSearchParams>>({})

  const groupOptions = ref<{ label: string; value: number }[]>([])

  const taskTypeOptions = [
    { label: '签到', value: 'sign_in' },
    { label: '完善资料', value: 'complete_profile' },
    { label: '关注公众号', value: 'follow_official_account' },
    { label: '邀请好友', value: 'invite_user' },
    { label: '每日登录', value: 'daily_login' },
    { label: '自定义行为', value: 'custom_action' }
  ]

  const formItems = computed(() => [
    {
      label: '关键词',
      key: 'keyword',
      type: 'input',
      props: {
        placeholder: '任务名称/编码',
        clearable: true
      }
    },
    {
      label: '任务分组',
      key: 'group_id',
      type: 'select',
      props: {
        placeholder: '请选择分组',
        clearable: true,
        options: groupOptions.value
      }
    },
    {
      label: '任务类型',
      key: 'type',
      type: 'select',
      props: {
        placeholder: '请选择类型',
        clearable: true,
        options: taskTypeOptions
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

  async function loadGroups() {
    try {
      const list = await fetchGetTaskGroupOptions()
      groupOptions.value = (list || []).map((g) => ({ label: g.name, value: g.id }))
    } catch {
      groupOptions.value = []
    }
  }

  function handleReset() {
    formData.value = {}
    emit('resetSearchParams')
  }

  async function handleSearch(params: Partial<Api.OperationManage.TaskSearchParams>) {
    await searchBarRef.value?.validate()
    emit('search', params)
  }

  onMounted(() => {
    loadGroups()
  })
</script>
