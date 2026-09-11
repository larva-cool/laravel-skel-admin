<template>
  <div class="art-full-height flex flex-col gap-3">
    <TaskLogSearch
      v-show="showSearchBar"
      @search="handleSearch"
      @resetSearchParams="resetSearchParams"
    />

    <ElCard class="art-table-card flex-1">
      <ArtTableHeader
        v-model:columns="columnChecks"
        v-model:showSearchBar="showSearchBar"
        :loading="loading"
        @refresh="handleRefresh"
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

    <TaskLogDetailDrawer ref="detailDrawerRef" />
  </div>
</template>

<script setup lang="ts">
  import { h, ref } from 'vue'
  import { ElTag, ElAvatar } from 'element-plus'
  import ArtButtonTable from '@/components/core/forms/art-button-table/index.vue'
  import { useTable } from '@/hooks/core/useTable'
  import { fetchGetTaskLogList } from '@/api/operation-manage'
  import TaskLogSearch from './modules/task-log-search.vue'
  import TaskLogDetailDrawer from './modules/task-log-detail-drawer.vue'

  defineOptions({ name: 'TaskLogManage' })

  type TaskLogListItem = Api.OperationManage.TaskLogListItem

  const showSearchBar = ref(true)
  const detailDrawerRef = ref<InstanceType<typeof TaskLogDetailDrawer>>()

  const rewardTypeMap: Record<string, { type: 'warning' | 'success' | 'danger'; label: string }> = {
    coin: { type: 'warning', label: '金币' },
    point: { type: 'success', label: '积分' },
    vip_days: { type: 'danger', label: 'VIP天数' }
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
      apiFn: fetchGetTaskLogList,
      apiParams: { page: 1, per_page: 20 },
      columnsFactory: () => [
        { prop: 'id', label: 'ID', width: 80 },
        {
          prop: 'user',
          label: '用户',
          minWidth: 180,
          formatter: (row: TaskLogListItem) => {
            if (!row.user) return `ID:${row.user_id}`
            return h('div', { class: 'flex items-center gap-2' }, [
              row.user.avatar ? h(ElAvatar, { src: row.user.avatar, size: 28 }) : null,
              h('span', {}, row.user.nickname || row.user.username || '-'),
              h(
                'span',
                { class: 'text-xs text-[var(--el-text-color-secondary)]' },
                `(ID:${row.user_id})`
              )
            ])
          }
        },
        {
          prop: 'task',
          label: '任务',
          minWidth: 180,
          showOverflowTooltip: true,
          formatter: (row: TaskLogListItem) => {
            if (!row.task) return `ID:${row.task_id}`
            return `${row.task.name}（${row.task.code}）`
          }
        },
        { prop: 'period_key', label: '周期', width: 130, showOverflowTooltip: true },
        {
          prop: 'reward_type',
          label: '奖励',
          width: 130,
          formatter: (row: TaskLogListItem) => {
            const info = rewardTypeMap[row.reward_type] || {
              type: 'info' as const,
              label: row.reward_type
            }
            return h('span', {}, [
              h(ElTag, { type: info.type, size: 'small', effect: 'plain' }, () => info.label),
              ' × ',
              h('span', { class: 'font-medium' }, row.reward_amount)
            ])
          }
        },
        {
          prop: 'source_type',
          label: '触发来源',
          width: 180,
          showOverflowTooltip: true,
          formatter: (row: TaskLogListItem) => row.source_type || '-'
        },
        {
          prop: 'remark',
          label: '备注',
          minWidth: 160,
          showOverflowTooltip: true,
          formatter: (row: TaskLogListItem) => row.remark || '-'
        },
        { prop: 'created_at', label: '记录时间', width: 170, showOverflowTooltip: true },
        {
          prop: 'actions',
          label: '操作',
          width: 80,
          fixed: 'right',
          formatter: (row: TaskLogListItem) =>
            h(ArtButtonTable, {
              type: 'view',
              title: '详情',
              onClick: () => openDetail(row)
            })
        }
      ]
    }
  })

  const openDetail = (row: TaskLogListItem) => detailDrawerRef.value?.open(row)

  const handleSearch = (params: Partial<Api.OperationManage.TaskLogSearchParams>) => {
    const paramsRecord = searchParams as Record<string, unknown>
    Object.keys(paramsRecord).forEach((key) => {
      if (key !== 'page' && key !== 'per_page') delete paramsRecord[key]
    })
    Object.assign(searchParams, params)
    getData()
  }

  const handleRefresh = () => refreshData()
</script>
