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
    (e: 'search', params: Partial<Api.SystemManage.IdentityVerificationSearchParams>): void
    (e: 'resetSearchParams'): void
  }
  const emit = defineEmits<Emits>()

  const searchBarRef = ref()
  const formData = ref<Partial<Api.SystemManage.IdentityVerificationSearchParams>>({})

  const typeOptions = [
    { label: '个人', value: 'personal' },
    { label: '企业', value: 'enterprise' }
  ]

  const statusOptions = [
    { label: '待审核', value: 'pending' },
    { label: '已通过', value: 'approved' },
    { label: '已驳回', value: 'rejected' }
  ]

  const formItems = computed(() => [
    {
      label: '关键词',
      key: 'keyword',
      type: 'input',
      props: {
        placeholder: '真实姓名 / 企业名称 / 法人 / 信用代码 / 用户名',
        clearable: true
      }
    },
    {
      label: '认证类型',
      key: 'type',
      type: 'select',
      props: {
        placeholder: '请选择类型',
        clearable: true,
        options: typeOptions
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
      label: '提交起始',
      key: 'start_date',
      type: 'date',
      props: {
        placeholder: '开始日期',
        valueFormat: 'YYYY-MM-DD'
      }
    },
    {
      label: '提交截止',
      key: 'end_date',
      type: 'date',
      props: {
        placeholder: '结束日期',
        valueFormat: 'YYYY-MM-DD'
      }
    }
  ])

  function handleReset() {
    formData.value = {}
    emit('resetSearchParams')
  }

  async function handleSearch(params: Partial<Api.SystemManage.IdentityVerificationSearchParams>) {
    await searchBarRef.value?.validate()
    emit('search', params)
  }
</script>

<style scoped lang="scss"></style>
