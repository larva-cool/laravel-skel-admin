<template>
  <div class="art-full-height flex flex-col gap-3">
    <TaskSearch
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
      >
        <template #left>
          <ElSpace wrap>
            <ElButton v-auth="'tasks.create'" type="primary" @click="openCreateDialog">
              <ElIcon class="mr-1"><Plus /></ElIcon>
              新增任务
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

    <TaskEditDialog ref="editDialogRef" @success="onEditSuccess" />
  </div>
</template>

<script setup lang="ts">
  import { h, ref } from 'vue'
  import { ElTag, ElButton, ElMessageBox, ElSwitch } from 'element-plus'
  import { Plus } from '@element-plus/icons-vue'
  import ArtButtonTable from '@/components/core/forms/art-button-table/index.vue'
  import { useTable } from '@/hooks/core/useTable'
  import { useAuth } from '@/hooks/core/useAuth'
  import { fetchGetTaskList, fetchDeleteTask, fetchToggleTaskStatus } from '@/api/operation-manage'
  import TaskSearch from './modules/task-search.vue'
  import TaskEditDialog from './modules/task-edit-dialog.vue'

  defineOptions({ name: 'TaskManage' })

  type TaskListItem = Api.OperationManage.TaskListItem

  const { hasAuth } = useAuth()

  const showSearchBar = ref(true)
  const editDialogRef = ref<InstanceType<typeof TaskEditDialog>>()
  const toggleLoading = ref<Map<number, boolean>>(new Map())

  const taskTypeMap: Record<
    string,
    { type: 'info' | 'primary' | 'success' | 'warning' | 'danger'; label: string }
  > = {
    sign_in: { type: 'primary', label: '签到' },
    complete_profile: { type: 'success', label: '完善资料' },
    follow_official_account: { type: 'warning', label: '关注公众号' },
    invite_user: { type: 'info', label: '邀请好友' },
    daily_login: { type: 'success', label: '每日登录' },
    custom_action: { type: 'info', label: '自定义行为' }
  }

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
      apiFn: fetchGetTaskList,
      apiParams: { page: 1, per_page: 20 },
      columnsFactory: () => [
        { prop: 'id', label: 'ID', width: 80 },
        { prop: 'name', label: '任务名称', minWidth: 150, showOverflowTooltip: true },
        { prop: 'code', label: '编码', width: 220, showOverflowTooltip: true },
        {
          prop: 'group',
          label: '所属分组',
          width: 120,
          formatter: (row: TaskListItem) => row.group?.name || '-'
        },
        {
          prop: 'type',
          label: '任务类型',
          width: 110,
          formatter: (row: TaskListItem) => {
            const info = taskTypeMap[row.type] || { type: 'info' as const, label: row.type }
            return h(ElTag, { type: info.type, size: 'small', effect: 'light' }, () => info.label)
          }
        },
        {
          prop: 'reward_type',
          label: '奖励',
          width: 130,
          formatter: (row: TaskListItem) => {
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
          prop: 'claim_mode',
          label: '领取方式',
          width: 100,
          formatter: (row: TaskListItem) => (row.claim_mode === 0 ? '自动发放' : '手动领取')
        },
        { prop: 'sort_order', label: '排序', width: 70, align: 'center' },
        {
          prop: 'status',
          label: '状态',
          width: 90,
          formatter: (row: TaskListItem) =>
            h(ElSwitch, {
              modelValue: row.status,
              loading: toggleLoading.value.get(row.id) ?? false,
              disabled: !hasAuth('tasks.edit'),
              activeText: '启用',
              inactiveText: '禁用',
              inlinePrompt: true,
              onChange: () => handleToggleStatus(row)
            })
        },
        { prop: 'created_at', label: '创建时间', width: 170, showOverflowTooltip: true },
        {
          prop: 'actions',
          label: '操作',
          width: 140,
          fixed: 'right',
          formatter: (row: TaskListItem) =>
            h('div', { class: 'flex items-center' }, [
              hasAuth('tasks.edit')
                ? h(ArtButtonTable, {
                    type: 'edit',
                    title: '编辑',
                    onClick: () => openEditDialog(row)
                  })
                : null,
              hasAuth('tasks.delete')
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

  const openCreateDialog = () => editDialogRef.value?.open()
  const openEditDialog = (row: TaskListItem) => editDialogRef.value?.open(row)
  const onEditSuccess = () => refreshData()

  const handleDelete = (row: TaskListItem) => {
    ElMessageBox.confirm(`确认删除任务「${row.name}」吗？删除后不可恢复。`, '删除任务', {
      type: 'warning',
      confirmButtonText: '确认删除',
      cancelButtonText: '取消'
    })
      .then(async () => {
        await fetchDeleteTask(row.id)
        refreshData()
      })
      .catch(() => {})
  }

  const handleToggleStatus = async (row: TaskListItem) => {
    toggleLoading.value.set(row.id, true)
    try {
      await fetchToggleTaskStatus(row.id)
      refreshData()
    } catch {
      // 失败不刷新
    } finally {
      toggleLoading.value.delete(row.id)
    }
  }

  const handleSearch = (params: Partial<Api.OperationManage.TaskSearchParams>) => {
    const paramsRecord = searchParams as Record<string, unknown>
    Object.keys(paramsRecord).forEach((key) => {
      if (key !== 'page' && key !== 'per_page') delete paramsRecord[key]
    })
    Object.assign(searchParams, params)
    getData()
  }

  const handleRefresh = () => refreshData()
</script>
