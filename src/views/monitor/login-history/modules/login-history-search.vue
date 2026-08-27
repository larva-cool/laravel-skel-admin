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
  import { computed, ref } from 'vue'

  interface Emits {
    (e: 'search', params: Partial<Api.Monitor.LoginHistorySearchParams>): void
    (e: 'resetSearchParams'): void
  }

  const emit = defineEmits<Emits>()

  const searchBarRef = ref()
  const formData = ref<Record<string, any>>({})

  const formItems = computed(() => [
    {
      label: '归属主体',
      key: 'guard',
      type: 'select',
      props: {
        placeholder: '请选择归属主体',
        clearable: true,
        options: [
          { label: '管理员', value: 'admin' },
          { label: '前台用户', value: 'user' }
        ]
      }
    },
    {
      label: '用户 ID',
      key: 'user_id',
      type: 'number',
      props: {
        placeholder: '请输入用户 ID',
        min: 1,
        controls: false
      }
    },
    {
      label: '账号',
      key: 'user_name',
      type: 'input',
      placeholder: '请输入账号或用户名',
      clearable: true
    },
    {
      label: '登录结果',
      key: 'result',
      type: 'select',
      props: {
        placeholder: '请选择登录结果',
        clearable: true,
        options: [
          { label: '成功', value: true },
          { label: '失败', value: false }
        ]
      }
    },
    {
      label: '登录 IP',
      key: 'ip',
      type: 'input',
      placeholder: '请输入登录 IP',
      clearable: true
    },
    {
      label: '关键字',
      key: 'keyword',
      type: 'input',
      placeholder: '搜索归属地、设备、平台、浏览器',
      clearable: true
    },
    {
      label: '登录时间',
      key: 'date_range',
      type: 'daterange',
      props: {
        type: 'daterange',
        placeholder: ['开始日期', '结束日期'],
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
    const output: Partial<Api.Monitor.LoginHistorySearchParams> = { ...rest }

    if (date_range && Array.isArray(date_range) && date_range.length === 2) {
      output.login_start = date_range[0]
      output.login_end = date_range[1]
    }

    emit('search', output)
  }
</script>

<style scoped lang="scss"></style>
