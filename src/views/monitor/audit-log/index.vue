<template>
  <div class="art-full-height">
    <AuditLogSearch
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
      >
        <template #left>
          <ElSpace wrap>
            <ElButton v-auth="'audit-logs.export'" :loading="isExporting" @click="handleExport">
              <ElIcon class="mr-1"><Download /></ElIcon>
              导出
            </ElButton>
          </ElSpace>
        </template>
      </ArtTableHeader>

      <ArtTable
        :loading="loading"
        :data="data"
        :columns="columns"
        :pagination="pagination"
        @pagination:size-change="handleSizeChange"
        @pagination:current-change="handleCurrentChange"
      />
    </ElCard>

    <AuditLogDetailDialog ref="detailDialogRef" />
  </div>
</template>

<script setup lang="ts">
  import { fetchAuditLogList, fetchExportAuditLogs } from '@/api/monitor'
  import ArtButtonTable from '@/components/core/forms/art-button-table/index.vue'
  import { useExport } from '@/hooks/core/useExport'
  import { useTable } from '@/hooks/core/useTable'
  import { ElTag } from 'element-plus'
  import { Download } from '@element-plus/icons-vue'
  import { h, ref } from 'vue'
  import AuditLogDetailDialog from './modules/audit-log-detail-dialog.vue'
  import AuditLogSearch from './modules/audit-log-search.vue'

  defineOptions({ name: 'AuditLog' })

  type AuditLogItem = Api.Monitor.AuditLogItem

  const showSearchBar = ref(true)
  const detailDialogRef = ref<InstanceType<typeof AuditLogDetailDialog>>()

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
      apiFn: fetchAuditLogList,
      apiParams: {
        page: 1,
        per_page: 20
      },
      columnsFactory: () => [
        { prop: 'id', label: 'ID', width: 110 },
        {
          prop: 'operator_name',
          label: '操作人',
          width: 130,
          showOverflowTooltip: true,
          formatter: (row: AuditLogItem) => row.operator_name || '—'
        },
        {
          prop: 'title',
          label: '操作描述',
          minWidth: 180,
          showOverflowTooltip: true,
          formatter: (row: AuditLogItem) => row.title || '—'
        },
        {
          prop: 'method',
          label: '请求方法',
          width: 100,
          formatter: (row: AuditLogItem) =>
            h(ElTag, { type: methodTagType(row.method), size: 'small' }, () => row.method)
        },
        {
          prop: 'uri',
          label: '请求地址',
          minWidth: 200,
          showOverflowTooltip: true,
          formatter: (row: AuditLogItem) =>
            h('code', { class: 'text-xs font-mono text-g-700' }, row.uri || '—')
        },
        {
          prop: 'status_code',
          label: '状态码',
          width: 100,
          formatter: (row: AuditLogItem) =>
            h(
              ElTag,
              { type: row.is_failed ? 'danger' : 'success', size: 'small', effect: 'light' },
              () => String(row.status_code)
            )
        },
        {
          prop: 'runtime',
          label: '耗时',
          width: 100,
          formatter: (row: AuditLogItem) => (row.runtime != null ? `${row.runtime}s` : '—')
        },
        {
          prop: 'ip',
          label: 'IP',
          width: 140,
          showOverflowTooltip: true,
          formatter: (row: AuditLogItem) => row.ip || '—'
        },
        { prop: 'created_at', label: '操作时间', width: 180 },
        {
          prop: 'operation',
          label: '操作',
          width: 80,
          fixed: 'right',
          formatter: (row: AuditLogItem) =>
            h(ArtButtonTable, {
              type: 'view',
              title: '查看',
              onClick: () => handleAction(row)
            })
        }
      ]
    }
  })

  // 导出
  const { isExporting, handleExport: doExport } = useExport()
  const handleExport = () => {
    const filters = { ...(searchParams as Record<string, unknown>) }
    delete filters.page
    delete filters.per_page
    doExport(
      () => fetchExportAuditLogs(filters as unknown as Api.Monitor.AuditLogSearchParams),
      'audit_logs'
    )
  }

  const handleAction = (row: AuditLogItem) => {
    detailDialogRef.value?.open(row)
  }

  const handleSearch = (params: Partial<Api.Monitor.AuditLogSearchParams>) => {
    const paramsRecord = searchParams as Record<string, unknown>
    Object.keys(paramsRecord).forEach((key) => {
      if (key !== 'page' && key !== 'per_page') {
        delete paramsRecord[key]
      }
    })
    Object.assign(searchParams, params)
    getData()
  }

  function methodTagType(method: string): 'primary' | 'success' | 'warning' | 'danger' | 'info' {
    switch (method) {
      case 'POST':
        return 'success'
      case 'PUT':
      case 'PATCH':
        return 'warning'
      case 'DELETE':
        return 'danger'
      default:
        return 'info'
    }
  }
</script>
