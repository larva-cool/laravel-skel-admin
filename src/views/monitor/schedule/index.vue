<template>
  <div class="art-full-height flex flex-col gap-3">
    <!-- 搜索栏 -->
    <ScheduleSearch
      v-show="showSearchBar"
      @search="handleSearch"
      @reset-search-params="resetSearchParams"
    />

    <!-- 表格卡片 -->
    <ElCard class="art-table-card flex-1">
      <ArtTableHeader
        v-model:columns="columnChecks"
        v-model:showSearchBar="showSearchBar"
        :loading="loading"
        @refresh="refreshData"
      >
        <template #left>
          <ElSpace wrap>
            <ElButton v-auth="'schedules.create'" type="primary" @click="openCreateDialog">
              <ElIcon class="mr-1"><Plus /></ElIcon>
              新增定时任务
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

    <!-- 新增/编辑弹窗 -->
    <ScheduleEditDialog ref="editDialogRef" @success="onEditSuccess" />

    <!-- 详情弹窗（含调度日志） -->
    <ScheduleDetailDialog ref="detailDialogRef" />
  </div>
</template>

<script setup lang="ts">
  import {
    fetchDeleteSchedule,
    fetchExecuteSchedule,
    fetchScheduleList,
    fetchToggleSchedule,
    type ScheduleItem
  } from '@/api/schedule'
  import ArtButtonTable from '@/components/core/forms/art-button-table/index.vue'
  import { useAuth } from '@/hooks/core/useAuth'
  import { useTable } from '@/hooks/core/useTable'
  import { Plus } from '@element-plus/icons-vue'
  import { ElMessageBox, ElTag } from 'element-plus'
  import { h } from 'vue'
  import ScheduleEditDialog from './modules/schedule-edit-dialog.vue'
  import ScheduleDetailDialog from './modules/schedule-detail-dialog.vue'
  import ScheduleSearch from './modules/schedule-search.vue'

  defineOptions({ name: 'ScheduleManage' })

  const { hasAuth } = useAuth()

  const showSearchBar = ref(true)
  const editDialogRef = ref<InstanceType<typeof ScheduleEditDialog>>()
  const detailDialogRef = ref<InstanceType<typeof ScheduleDetailDialog>>()

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
      apiFn: fetchScheduleList,
      apiParams: { page: 1, per_page: 20 },
      columnsFactory: () => [
        {
          prop: 'id',
          label: 'ID',
          width: 100,
          formatter: (row: ScheduleItem) => String(row.id).padStart(8, '0')
        },
        { prop: 'name', label: '任务名称', minWidth: 180, showOverflowTooltip: true },
        {
          prop: 'command_string',
          label: '命令',
          minWidth: 260,
          showOverflowTooltip: true,
          formatter: (row: ScheduleItem) =>
            h('code', { class: 'text-xs font-mono' }, row.command_string)
        },
        {
          prop: 'expression',
          label: 'Cron 表达式',
          width: 150,
          showOverflowTooltip: true,
          formatter: (row: ScheduleItem) =>
            h('code', { class: 'text-xs font-mono text-cyan-700' }, row.expression)
        },
        {
          prop: 'status',
          label: '状态',
          width: 90,
          formatter: (row: ScheduleItem) =>
            h(
              ElTag,
              {
                type: row.status === 1 ? 'success' : 'info',
                size: 'small',
                effect: 'light'
              },
              () => row.status_text
            )
        },
        { prop: 'created_at', label: '创建时间', width: 180, showOverflowTooltip: true },
        {
          prop: 'operation',
          label: '操作',
          width: 240,
          fixed: 'right',
          formatter: (row: ScheduleItem) =>
            h('div', { class: 'flex items-center' }, [
              h(ArtButtonTable, {
                type: 'view',
                title: '详情',
                onClick: () => openDetailDialog(row)
              }),
              hasAuth('schedules.edit')
                ? h(ArtButtonTable, {
                    type: 'edit',
                    title: '编辑',
                    onClick: () => openEditDialog(row)
                  })
                : null,
              hasAuth('schedules.execute')
                ? h(ArtButtonTable, {
                    icon: 'ri:play-circle-line',
                    iconColor: 'var(--el-color-success)',
                    buttonBgColor: 'rgba(103,194,58,0.12)',
                    title: '执行',
                    onClick: () => handleExecute(row)
                  })
                : null,
              hasAuth('schedules.edit')
                ? h(ArtButtonTable, {
                    icon: row.status === 1 ? 'ri:pause-circle-line' : 'ri:play-circle-fill',
                    iconColor: 'var(--el-color-warning)',
                    buttonBgColor: 'rgba(230,162,60,0.12)',
                    title: row.status === 1 ? '禁用' : '启用',
                    onClick: () => handleToggle(row)
                  })
                : null,
              hasAuth('schedules.delete')
                ? h(ArtButtonTable, {
                    type: 'delete',
                    title: '删除',
                    onClick: () => handleDelete(row)
                  })
                : null
            ])
        }
      ]
    }
  })

  const openCreateDialog = () => {
    editDialogRef.value?.open()
  }

  const openEditDialog = (row: ScheduleItem) => {
    editDialogRef.value?.open(row)
  }

  const openDetailDialog = (row: ScheduleItem) => {
    detailDialogRef.value?.open(row)
  }

  const onEditSuccess = () => {
    refreshData()
  }

  const handleDelete = (row: ScheduleItem) => {
    ElMessageBox.confirm(`确认删除定时任务「${row.name}」吗？删除后不可恢复。`, '删除定时任务', {
      type: 'warning',
      confirmButtonText: '确认删除',
      cancelButtonText: '取消'
    })
      .then(async () => {
        await fetchDeleteSchedule(row.id)
        refreshData()
      })
      .catch(() => {})
  }

  const handleToggle = async (row: ScheduleItem) => {
    await fetchToggleSchedule(row.id)
    refreshData()
  }

  const handleExecute = (row: ScheduleItem) => {
    ElMessageBox.confirm(`确认手动执行定时任务「${row.name}」吗？`, '执行定时任务', {
      type: 'warning',
      confirmButtonText: '确认执行',
      cancelButtonText: '取消',
      customClass: 'schedule-execute-msgbox'
    })
      .then(async () => {
        const result = await fetchExecuteSchedule(row.id)
        ElMessageBox.alert(
          h(
            'pre',
            {
              style:
                'max-height: 400px; overflow: auto; padding: 12px; background: #1e1e1e; color: #d4d4d4; border-radius: 4px; font-size: 13px; white-space: pre-wrap; word-break: break-word;'
            },
            result?.output || '（无输出）'
          ),
          '执行结果',
          {
            confirmButtonText: '关闭',
            dangerouslyUseHTMLString: false,
            customClass: 'schedule-execute-msgbox'
          }
        )
      })
      .catch(() => {})
  }

  const handleSearch = (params: Record<string, unknown>) => {
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

<style scoped lang="scss">
  // 全局覆盖：通过 customClass 命中的 el-message-box 容器宽度加宽一倍
  :global(.schedule-execute-msgbox) {
    width: 640px;
    max-width: calc(100vw - 64px);
  }
</style>
