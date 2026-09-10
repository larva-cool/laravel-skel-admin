<template>
  <ArtSearchBar
    ref="searchBarRef"
    v-model="formData"
    :items="formItems"
    label-width="100px"
    @reset="handleReset"
    @search="handleSearch"
  />
</template>

<script setup lang="ts">
  import { computed, ref } from 'vue'

  interface Emits {
    (e: 'search', params: Partial<Api.UserManage.InviteRecordSearchParams>): void
    (e: 'resetSearchParams'): void
  }

  const emit = defineEmits<Emits>()

  const searchBarRef = ref()
  const formData = ref<Record<string, any>>({})

  const morphOptions = [
    { label: '前台用户', value: 'user' },
    { label: '管理员', value: 'admin' }
  ]

  const formItems = computed(() => [
    {
      label: '邀请人类型',
      key: 'inviter_type',
      type: 'select',
      props: {
        placeholder: '请选择邀请人类型',
        clearable: true,
        options: morphOptions
      }
    },
    {
      label: '邀请人 ID',
      key: 'inviter_id',
      type: 'number',
      props: {
        placeholder: '请输入邀请人 ID',
        min: 1,
        controls: false
      }
    },
    {
      label: '被邀请人类型',
      key: 'invitee_type',
      type: 'select',
      props: {
        placeholder: '请选择被邀请人类型',
        clearable: true,
        options: morphOptions
      }
    },
    {
      label: '被邀请人 ID',
      key: 'invitee_id',
      type: 'number',
      props: {
        placeholder: '请输入被邀请人 ID',
        min: 1,
        controls: false
      }
    },
    {
      label: '描述',
      key: 'description',
      type: 'input',
      placeholder: '搜索邀请描述关键词',
      clearable: true
    },
    {
      label: '邀请时间',
      key: 'date_range',
      type: 'daterange',
      props: {
        type: 'daterange',
        startPlaceholder: '开始日期',
        endPlaceholder: '结束日期',
        clearable: true,
        format: 'YYYY-MM-DD',
        valueFormat: 'YYYY-MM-DD'
      }
    }
  ])

  function handleReset() {
    formData.value = {}
    emit('resetSearchParams')
  }

  async function handleSearch(params: Record<string, any>) {
    await searchBarRef.value?.validate()

    const { date_range, ...rest } = params
    const output: Partial<Api.UserManage.InviteRecordSearchParams> = { ...rest }

    if (date_range && Array.isArray(date_range) && date_range.length === 2) {
      output.created_start = date_range[0]
      output.created_end = date_range[1]
    }

    emit('search', output)
  }
</script>

<style scoped lang="scss"></style>
