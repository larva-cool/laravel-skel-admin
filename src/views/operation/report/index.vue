<template>
  <div class="art-full-height flex flex-col gap-3">
    <!-- 表格卡片 -->
    <ElCard class="art-table-card flex-1">
      <ArtTableHeader
        v-model:columns="columnChecks"
        v-model:showSearchBar="showSearchBar"
        :loading="loading"
        @refresh="handleRefresh"
      >
        <template #left>
          <ElSpace wrap>
            <ElButton v-auth="'reports.export'" :loading="isExporting" @click="handleExport">
              <ElIcon class="mr-1"><Download /></ElIcon>
              导出
            </ElButton>
          </ElSpace>
        </template>
        <template #search>
          <ReportSearch
            v-show="showSearchBar"
            @search="handleSearch"
            @resetSearchParams="resetSearchParams"
          />
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

    <!-- 详情弹窗 -->
    <ReportDetailDialog
      ref="detailDialogRef"
      :can-handle="hasAuth('reports.edit')"
      @handle="openProcessDialog"
      @refresh="handleRefresh"
    />

    <!-- 处理弹窗 -->
    <ReportProcessDialog ref="processDialogRef" @success="onProcessSuccess" />
  </div>
</template>

<script setup lang="ts">
  import { h, ref } from 'vue'
  import { ElTag, ElButton } from 'element-plus'
  import { Download } from '@element-plus/icons-vue'
  import { useTable } from '@/hooks/core/useTable'
  import { useAuth } from '@/hooks/core/useAuth'
  import { useExport } from '@/hooks/core/useExport'
  import { fetchGetReportList, fetchExportReports } from '@/api/system-manage'
  import ReportSearch from './modules/report-search.vue'
  import ReportDetailDialog from './modules/report-detail-dialog.vue'
  import ReportProcessDialog from './modules/report-process-dialog.vue'

  defineOptions({ name: 'ReportManage' })

  type ReportListItem = Api.SystemManage.ReportListItem

  const { hasAuth } = useAuth()

  const showSearchBar = ref(true)
  const detailDialogRef = ref<InstanceType<typeof ReportDetailDialog>>()
  const processDialogRef = ref<InstanceType<typeof ReportProcessDialog>>()

  const mapTagType = (t?: string) => {
    if (!t || t === 'default') return undefined
    return t as 'primary' | 'success' | 'warning' | 'danger' | 'info'
  }

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
      apiFn: fetchGetReportList,
      apiParams: { page: 1, per_page: 20 },
      columnsFactory: () => [
        { prop: 'id', label: 'ID', width: 80, fixed: 'left' },
        { prop: 'user_id', label: '举报人', width: 160, showOverflowTooltip: true },
        {
          prop: 'category_label',
          label: '举报分类',
          width: 110,
          formatter: (row: ReportListItem) =>
            h(
              ElTag,
              { type: mapTagType(row.category_label_type), size: 'small', effect: 'plain' },
              () => row.category_label || row.category
            )
        },
        {
          prop: 'status_label',
          label: '处理状态',
          width: 100,
          formatter: (row: ReportListItem) =>
            h(
              ElTag,
              { type: mapTagType(row.status_label_type), size: 'small', effect: 'dark' },
              () => row.status_label || row.status
            )
        },
        {
          prop: 'reportable',
          label: '被举报对象',
          minWidth: 200,
          formatter: (row: ReportListItem) => {
            const tag = row.reportable_type_label || row.reportable_type
            const id = row.reportable_id
            return h('span', null, [
              h(ElTag, { type: 'info', size: 'small', effect: 'plain' }, () => tag),
              h('span', { class: 'ml-1 font-mono text-xs' }, `#${id}`)
            ])
          }
        },
        { prop: 'handler_name', label: '处理人', width: 120, showOverflowTooltip: true },
        { prop: 'processed_at', label: '处理时间', width: 170 },
        { prop: 'created_at', label: '举报时间', width: 170, fixed: 'right' },
        {
          prop: 'actions',
          label: '操作',
          width: 160,
          fixed: 'right',
          formatter: (row: ReportListItem) =>
            h('div', { class: 'flex items-center gap-1' }, [
              h(
                ElButton,
                {
                  type: 'primary',
                  link: true,
                  size: 'small',
                  onClick: () => viewDetail(row)
                },
                () => '查看'
              ),
              hasAuth('reports.edit') && (row.status === 'pending' || row.status === 'processing')
                ? h(
                    ElButton,
                    {
                      type: 'primary',
                      link: true,
                      size: 'small',
                      onClick: () => openProcessDialog(row as Api.SystemManage.ReportDetail)
                    },
                    () => '处理'
                  )
                : null
            ])
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
      () => fetchExportReports(filters as unknown as Api.SystemManage.ReportSearchParams),
      'reports'
    )
  }

  const viewDetail = (row: ReportListItem) => {
    detailDialogRef.value?.open(row)
  }

  const openProcessDialog = (row: Api.SystemManage.ReportDetail) => {
    processDialogRef.value?.open(row)
  }

  const onProcessSuccess = () => {
    refreshData()
  }

  const handleSearch = (params: Partial<Api.SystemManage.ReportSearchParams>) => {
    const paramsRecord = searchParams as Record<string, unknown>
    Object.keys(paramsRecord).forEach((key) => {
      if (key !== 'page' && key !== 'per_page') {
        delete paramsRecord[key]
      }
    })
    Object.assign(searchParams, params)
    getData()
  }

  const handleRefresh = () => {
    refreshData()
  }
</script>
