<template>
  <div class="art-full-height flex flex-col gap-3">
    <!-- 搜索栏 -->
    <SegmentSearch
      v-show="showSearchBar"
      @search="handleSearch"
      @resetSearchParams="resetSearchParams"
    />

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
            <ElButton
              v-auth="'segments.create'"
              type="primary"
              :icon="'ri:add-line'"
              @click="openCreateDialog"
            >
              新增分群
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
    <SegmentEditDialog ref="editDialogRef" @success="onSuccess" />

    <!-- 成员列表弹窗 -->
    <SegmentUsersDialog ref="usersDialogRef" />

    <!-- 规则预览弹窗 -->
    <SegmentPreviewDialog ref="previewDialogRef" />
  </div>
</template>

<script setup lang="ts">
  import { h, ref } from 'vue'
  import { ElButton, ElMessage, ElMessageBox, ElSwitch, ElTag } from 'element-plus'
  import ArtSvgIcon from '@/components/core/base/art-svg-icon/index.vue'
  import { useTable } from '@/hooks/core/useTable'
  import { useAuth } from '@/hooks/core/useAuth'
  import {
    fetchGetSegmentList,
    fetchDeleteSegment,
    fetchToggleSegmentStatus,
    fetchSyncSegment
  } from '@/api/segment-manage'
  import SegmentSearch from './modules/segment-search.vue'
  import SegmentEditDialog from './modules/segment-edit-dialog.vue'
  import SegmentUsersDialog from './modules/segment-users-dialog.vue'
  import SegmentPreviewDialog from './modules/segment-preview-dialog.vue'

  defineOptions({ name: 'UserSegmentManage' })

  type Item = Api.SegmentManage.SegmentListItem

  const { hasAuth } = useAuth()

  const showSearchBar = ref(true)
  const editDialogRef = ref<InstanceType<typeof SegmentEditDialog>>()
  const usersDialogRef = ref<InstanceType<typeof SegmentUsersDialog>>()
  const previewDialogRef = ref<InstanceType<typeof SegmentPreviewDialog>>()

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
      apiFn: fetchGetSegmentList,
      apiParams: { page: 1, per_page: 20 },
      columnsFactory: () => [
        { prop: 'id', label: 'ID', width: 100 },
        {
          prop: 'name',
          label: '分群名称',
          minWidth: 180,
          showOverflowTooltip: true,
          formatter: (row: Item) =>
            h('div', { class: 'flex items-center gap-2' }, [
              h(
                ElTag,
                {
                  type: mapTagType(row.label_type),
                  size: 'small',
                  effect: 'plain'
                },
                () => row.name
              ),
              row.code ? h('span', { class: 'text-xs text-gray-400 font-mono' }, row.code) : null
            ])
        },
        {
          prop: 'type',
          label: '类型',
          width: 100,
          formatter: (row: Item) =>
            h(
              ElTag,
              { type: row.type === 2 ? 'warning' : 'primary', size: 'small', effect: 'plain' },
              () => row.type_label
            )
        },
        { prop: 'group', label: '分组', width: 130, showOverflowTooltip: true },
        {
          prop: 'last_synced_user_count',
          label: '匹配用户数',
          width: 110,
          align: 'center',
          formatter: (row: Item) => (row.type === 2 ? (row.last_synced_user_count ?? '-') : '-')
        },
        { prop: 'last_synced_at', label: '最近同步', width: 170, showOverflowTooltip: true },
        { prop: 'sort', label: '排序', width: 80, align: 'center' },
        {
          prop: 'status',
          label: '状态',
          width: 90,
          formatter: (row: Item) =>
            h(ElSwitch, {
              modelValue: row.status,
              disabled: !hasAuth('segments.edit'),
              activeText: '启用',
              inactiveText: '禁用',
              inlinePrompt: true,
              onChange: () => handleToggleStatus(row)
            })
        },
        {
          prop: 'actions',
          label: '操作',
          width: 280,
          fixed: 'right',
          formatter: (row: Item) =>
            h('div', { class: 'flex items-center gap-1' }, [
              hasAuth('segments.index')
                ? h(
                    ElButton,
                    {
                      type: 'primary',
                      link: true,
                      size: 'small',
                      onClick: () => openUsersDialog(row)
                    },
                    () => [h(ArtSvgIcon, { icon: 'ri:user-line', class: 'mr-0.5' }), '成员']
                  )
                : null,
              row.type === 2 && hasAuth('segments.edit')
                ? h(
                    ElButton,
                    {
                      type: 'primary',
                      link: true,
                      size: 'small',
                      onClick: () => openPreviewDialog(row)
                    },
                    () => [h(ArtSvgIcon, { icon: 'ri:eye-line', class: 'mr-0.5' }), '预览']
                  )
                : null,
              row.type === 2 && hasAuth('segments.edit')
                ? h(
                    ElButton,
                    {
                      type: 'primary',
                      link: true,
                      size: 'small',
                      onClick: () => handleSync(row)
                    },
                    () => [h(ArtSvgIcon, { icon: 'ri:refresh-line', class: 'mr-0.5' }), '同步']
                  )
                : null,
              hasAuth('segments.edit')
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
              hasAuth('segments.delete')
                ? h(
                    ElButton,
                    {
                      type: 'danger',
                      link: true,
                      size: 'small',
                      onClick: () => handleDelete(row)
                    },
                    () => [h(ArtSvgIcon, { icon: 'ri:delete-bin-line', class: 'mr-0.5' }), '删除']
                  )
                : null
            ])
        }
      ]
    }
  })

  function openCreateDialog() {
    editDialogRef.value?.open()
  }

  function openEditDialog(row: Item) {
    editDialogRef.value?.open({
      id: row.id,
      code: row.code,
      name: row.name,
      label_type: row.label_type,
      type: row.type,
      group: row.group,
      description: row.description,
      sort: row.sort,
      status: row.status,
      rule: row.rule,
      type_label: row.type_label,
      last_synced_at: row.last_synced_at,
      last_synced_user_count: row.last_synced_user_count,
      created_at: row.created_at,
      updated_at: row.updated_at
    } as any)
  }

  function openUsersDialog(row: Item) {
    usersDialogRef.value?.open(row)
  }

  function openPreviewDialog(row: Item) {
    previewDialogRef.value?.open(row)
  }

  function onSuccess() {
    refreshData()
  }

  function handleDelete(row: Item) {
    ElMessageBox.confirm(
      `确认删除分群「${row.name}」吗？删除后该分群下所有成员关系会被级联清理，且不可恢复。`,
      '删除分群',
      {
        type: 'warning',
        confirmButtonText: '确认删除',
        cancelButtonText: '取消'
      }
    )
      .then(async () => {
        await fetchDeleteSegment(row.id)
        refreshData()
      })
      .catch(() => {})
  }

  async function handleToggleStatus(row: Item) {
    try {
      await fetchToggleSegmentStatus(row.id)
      refreshData()
    } catch {
      // 切换失败不刷新
    }
  }

  async function handleSync(row: Item) {
    try {
      await ElMessageBox.confirm(
        `将立即按当前规则重新计算分群「${row.name}」的成员，差异部分将增量更新。是否继续？`,
        '同步规则分群',
        { type: 'info', confirmButtonText: '开始同步', cancelButtonText: '取消' }
      )
    } catch {
      return
    }
    try {
      const result = await fetchSyncSegment(row.id)
      ElMessage.success(
        `同步完成：新增 ${result.added}，移除 ${result.removed}，匹配 ${result.total}`
      )
      refreshData()
    } catch {
      // 拦截器已提示
    }
  }

  function handleSearch(params: Partial<Api.SegmentManage.SegmentSearchParams>) {
    const paramsRecord = searchParams as Record<string, unknown>
    Object.keys(paramsRecord).forEach((key) => {
      if (key !== 'page' && key !== 'per_page') {
        delete paramsRecord[key]
      }
    })
    Object.assign(searchParams, params)
    getData()
  }

  function handleRefresh() {
    refreshData()
  }
</script>

<style scoped lang="scss"></style>
