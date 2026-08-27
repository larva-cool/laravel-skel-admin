<template>
  <div class="art-full-height">
    <LoginHistorySearch
      v-show="showSearchBar"
      @search="handleSearch"
      @reset-search-params="resetSearchParams"
    />

    <ElCard class="art-table-card" :style="{ 'margin-top': showSearchBar ? '12px' : '0' }">
      <ArtTableHeader
        v-model:columns="columnChecks"
        v-model:showSearchBar="showSearchBar"
        :loading="loading"
        @refresh="refreshData"
      />

      <ArtTable
        :loading="loading"
        :data="data"
        :columns="columns"
        :pagination="pagination"
        @pagination:size-change="handleSizeChange"
        @pagination:current-change="handleCurrentChange"
      />
    </ElCard>

    <LoginHistoryDetailDialog ref="detailDialogRef" />
  </div>
</template>

<script setup lang="ts">
  import { fetchLoginHistoryList } from '@/api/monitor'
  import { useTable } from '@/hooks/core/useTable'
  import { ElTag } from 'element-plus'
  import { h, ref } from 'vue'
  import LoginHistoryDetailDialog from './modules/login-history-detail-dialog.vue'
  import LoginHistorySearch from './modules/login-history-search.vue'

  defineOptions({ name: 'LoginHistory' })

  type LoginHistoryItem = Api.Monitor.LoginHistoryItem

  const showSearchBar = ref(true)
  const detailDialogRef = ref<InstanceType<typeof LoginHistoryDetailDialog>>()

  const {
    columns,
    columnChecks,
    data,
    loading,
    pagination,
    getData,
    searchParams,
    resetSearchParams,
    handleSizeChange,
    handleCurrentChange,
    refreshData
  } = useTable({
    core: {
      apiFn: fetchLoginHistoryList,
      apiParams: {
        page: 1,
        per_page: 20
      },
      columnsFactory: () => [
        { prop: 'id', label: 'ID', width: 110 },
        {
          prop: 'guard',
          label: '归属主体',
          width: 120,
          formatter: (row: LoginHistoryItem) =>
            h(
              ElTag,
              { type: row.guard === 'admin' ? 'warning' : 'info', size: 'small', effect: 'light' },
              () => (row.guard === 'admin' ? '管理员' : '前台用户')
            )
        },
        {
          prop: 'user_name',
          label: '账号',
          minWidth: 160,
          showOverflowTooltip: true,
          formatter: (row: LoginHistoryItem) => row.user_name || `#${row.user_id}`
        },
        {
          prop: 'result',
          label: '登录结果',
          width: 110,
          formatter: (row: LoginHistoryItem) =>
            h(
              ElTag,
              { type: row.result ? 'success' : 'danger', size: 'small', effect: 'light' },
              () => (row.result ? '成功' : '失败')
            )
        },
        {
          prop: 'ip',
          label: '登录 IP',
          width: 140,
          showOverflowTooltip: true
        },
        {
          prop: 'address',
          label: '归属地',
          minWidth: 140,
          showOverflowTooltip: true,
          formatter: (row: LoginHistoryItem) => row.address || '—'
        },
        {
          prop: 'platform',
          label: '平台',
          width: 100,
          formatter: (row: LoginHistoryItem) => row.platform || '—'
        },
        {
          prop: 'device',
          label: '设备',
          width: 110,
          showOverflowTooltip: true,
          formatter: (row: LoginHistoryItem) => row.device || '—'
        },
        {
          prop: 'browser',
          label: '浏览器',
          width: 110,
          showOverflowTooltip: true,
          formatter: (row: LoginHistoryItem) => row.browser || '—'
        },
        { prop: 'login_at', label: '登录时间', width: 180 },
        {
          prop: 'operation',
          label: '操作',
          width: 100,
          fixed: 'right',
          formatter: (row: LoginHistoryItem) =>
            h('div', [
              h(
                'ElLink',
                { type: 'primary', underline: false, onClick: () => handleAction(row) },
                () => '查看'
              )
            ])
        }
      ]
    }
  })

  const handleAction = (row: LoginHistoryItem) => {
    detailDialogRef.value?.open(row)
  }

  const handleSearch = (params: Partial<Api.Monitor.LoginHistorySearchParams>) => {
    const paramsRecord = searchParams as Record<string, unknown>
    Object.keys(paramsRecord).forEach((key) => {
      if (key !== 'page' && key !== 'per_page') {
        delete paramsRecord[key]
      }
    })
    Object.assign(searchParams, params)
    getData()
  }
</script>
