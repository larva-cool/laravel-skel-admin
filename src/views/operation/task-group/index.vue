<template>
  <div class="art-full-height flex flex-col gap-3">
    <TaskGroupSearch
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
            <ElButton v-auth="'task-groups.create'" type="primary" @click="openCreateDialog">
              <ElIcon class="mr-1"><Plus /></ElIcon>
              新增分组
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

    <TaskGroupEditDialog ref="editDialogRef" @success="onEditSuccess" />
  </div>
</template>

<script setup lang="ts">
  import { h, ref } from 'vue'
  import { ElTag, ElButton, ElMessageBox, ElSwitch } from 'element-plus'
  import { Plus } from '@element-plus/icons-vue'
  import ArtSvgIcon from '@/components/core/base/art-svg-icon/index.vue'
  import { useTable } from '@/hooks/core/useTable'
  import { useAuth } from '@/hooks/core/useAuth'
  import {
    fetchGetTaskGroupList,
    fetchDeleteTaskGroup,
    fetchToggleTaskGroupStatus
  } from '@/api/operation-manage'
  import TaskGroupSearch from './modules/task-group-search.vue'
  import TaskGroupEditDialog from './modules/task-group-edit-dialog.vue'

  defineOptions({ name: 'TaskGroupManage' })

  type TaskGroupListItem = Api.OperationManage.TaskGroupListItem

  const { hasAuth } = useAuth()

  const showSearchBar = ref(true)
  const editDialogRef = ref<InstanceType<typeof TaskGroupEditDialog>>()
  const toggleLoading = ref<Map<number, boolean>>(new Map())

  const groupTypeMap: Record<
    number,
    { type: 'info' | 'primary' | 'success' | 'warning'; label: string }
  > = {
    0: { type: 'info', label: '新手任务' },
    1: { type: 'success', label: '每日任务' },
    2: { type: 'warning', label: '每周任务' },
    3: { type: 'primary', label: '签到任务' },
    9: { type: 'info', label: '自定义' }
  }

  const resetTypeMap: Record<number, string> = {
    0: '不重置',
    1: '每日',
    2: '每周',
    3: '每月'
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
      apiFn: fetchGetTaskGroupList,
      apiParams: { page: 1, per_page: 20 },
      columnsFactory: () => [
        { prop: 'id', label: 'ID', width: 80 },
        { prop: 'name', label: '分组名称', minWidth: 140, showOverflowTooltip: true },
        { prop: 'code', label: '编码', width: 130, showOverflowTooltip: true },
        {
          prop: 'type',
          label: '分组类型',
          width: 110,
          formatter: (row: TaskGroupListItem) => {
            const info = groupTypeMap[row.type] || {
              type: 'info' as const,
              label: String(row.type)
            }
            return h(ElTag, { type: info.type, size: 'small', effect: 'light' }, () => info.label)
          }
        },
        {
          prop: 'reset_type',
          label: '重置方式',
          width: 100,
          formatter: (row: TaskGroupListItem) => resetTypeMap[row.reset_type] || '-'
        },
        {
          prop: 'tasks_count',
          label: '任务数',
          width: 80,
          align: 'center'
        },
        { prop: 'sort_order', label: '排序', width: 70, align: 'center' },
        {
          prop: 'status',
          label: '状态',
          width: 90,
          formatter: (row: TaskGroupListItem) =>
            h(ElSwitch, {
              modelValue: row.status,
              loading: toggleLoading.value.get(row.id) ?? false,
              disabled: !hasAuth('task-groups.edit'),
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
          width: 170,
          fixed: 'right',
          formatter: (row: TaskGroupListItem) =>
            h('div', { class: 'flex items-center gap-1' }, [
              hasAuth('task-groups.edit')
                ? h(
                    ElButton,
                    {
                      type: 'primary',
                      link: true,
                      size: 'small',
                      onClick: () => openEditDialog(row)
                    },
                    () => [h(ArtSvgIcon, { icon: 'ri:edit-line', class: 'mr-0.5' }), '编辑']
                  )
                : null,
              hasAuth('task-groups.delete')
                ? h(
                    ElButton,
                    { type: 'danger', link: true, size: 'small', onClick: () => handleDelete(row) },
                    () => [h(ArtSvgIcon, { icon: 'ri:delete-bin-line', class: 'mr-0.5' }), '删除']
                  )
                : null
            ])
        }
      ]
    }
  })

  const openCreateDialog = () => editDialogRef.value?.open()
  const openEditDialog = (row: TaskGroupListItem) => editDialogRef.value?.open(row)
  const onEditSuccess = () => refreshData()

  const handleDelete = (row: TaskGroupListItem) => {
    ElMessageBox.confirm(`确认删除分组「${row.name}」吗？删除后不可恢复。`, '删除任务分组', {
      type: 'warning',
      confirmButtonText: '确认删除',
      cancelButtonText: '取消'
    })
      .then(async () => {
        await fetchDeleteTaskGroup(row.id)
        refreshData()
      })
      .catch(() => {})
  }

  const handleToggleStatus = async (row: TaskGroupListItem) => {
    toggleLoading.value.set(row.id, true)
    try {
      await fetchToggleTaskGroupStatus(row.id)
      refreshData()
    } catch {
      // 失败不刷新
    } finally {
      toggleLoading.value.delete(row.id)
    }
  }

  const handleSearch = (params: Partial<Api.OperationManage.TaskGroupSearchParams>) => {
    const paramsRecord = searchParams as Record<string, unknown>
    Object.keys(paramsRecord).forEach((key) => {
      if (key !== 'page' && key !== 'per_page') delete paramsRecord[key]
    })
    Object.assign(searchParams, params)
    getData()
  }

  const handleRefresh = () => refreshData()
</script>
