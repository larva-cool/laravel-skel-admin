<template>
  <div class="art-full-height flex flex-col gap-3">
    <!-- 搜索栏 -->
    <KnowledgeSearch
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
              v-auth="'knowledge-documents.create'"
              type="primary"
              @click="openCreateDialog"
            >
              <ElIcon class="mr-1"><Plus /></ElIcon>
              新增文档
            </ElButton>
            <ElButton v-auth="'knowledge-documents.index'" @click="openTestDialog">
              <ElIcon class="mr-1"><Search /></ElIcon>
              检索测试
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
    <KnowledgeEditDialog ref="editDialogRef" @success="onEditSuccess" />
    <!-- 分块查看弹窗 -->
    <KnowledgeChunksDialog ref="chunksDialogRef" />
    <!-- 检索测试弹窗 -->
    <KnowledgeTestDialog ref="testDialogRef" />
  </div>
</template>

<script setup lang="ts">
  import { h, ref } from 'vue'
  import { ElTag, ElMessageBox, ElTooltip } from 'element-plus'
  import { Plus, Search } from '@element-plus/icons-vue'
  import ArtButtonTable from '@/components/core/forms/art-button-table/index.vue'
  import ArtButtonMore, {
    type ButtonMoreItem
  } from '@/components/core/forms/art-button-more/index.vue'
  import { useTable } from '@/hooks/core/useTable'
  import { useAuth } from '@/hooks/core/useAuth'
  import {
    fetchGetKnowledgeList,
    fetchDeleteKnowledge,
    fetchToggleKnowledgeStatus,
    fetchReindexKnowledge
  } from '@/api/knowledge'
  import KnowledgeSearch from './modules/knowledge-search.vue'
  import KnowledgeEditDialog from './modules/knowledge-edit-dialog.vue'
  import KnowledgeChunksDialog from './modules/knowledge-chunks-dialog.vue'
  import KnowledgeTestDialog from './modules/knowledge-test-dialog.vue'

  defineOptions({ name: 'AIKnowledge' })

  type KnowledgeListItem = Api.Knowledge.ListItem

  const { hasAuth } = useAuth()

  const showSearchBar = ref(true)
  const editDialogRef = ref<InstanceType<typeof KnowledgeEditDialog>>()
  const chunksDialogRef = ref<InstanceType<typeof KnowledgeChunksDialog>>()
  const testDialogRef = ref<InstanceType<typeof KnowledgeTestDialog>>()

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
      apiFn: fetchGetKnowledgeList,
      apiParams: { page: 1, per_page: 20 },
      columnsFactory: () => [
        { prop: 'id', label: 'ID', width: 80 },
        { prop: 'title', label: '文档标题', minWidth: 200, showOverflowTooltip: true },
        {
          prop: 'status',
          label: '索引状态',
          width: 110,
          align: 'center',
          formatter: (row: KnowledgeListItem) =>
            h(
              ElTag,
              {
                type: (row.status_type as 'success' | 'info' | 'warning' | 'danger') || 'info',
                size: 'small',
                effect: 'light'
              },
              () => row.status_label
            )
        },
        {
          prop: 'is_enabled',
          label: '启用',
          width: 90,
          align: 'center',
          formatter: (row: KnowledgeListItem) =>
            h(
              ElTag,
              { type: row.is_enabled ? 'success' : 'info', size: 'small', effect: 'light' },
              () => (row.is_enabled ? '启用' : '停用')
            )
        },
        { prop: 'chunks_count', label: '分块数', width: 90, align: 'center' },
        { prop: 'tokens', label: '消耗 Tokens', width: 110, align: 'center' },
        {
          prop: 'error',
          label: '失败原因',
          minWidth: 160,
          formatter: (row: KnowledgeListItem) =>
            row.error
              ? h(ElTooltip, { content: row.error, placement: 'top' }, () =>
                  h(
                    'span',
                    { class: 'text-danger truncate inline-block max-w-full align-middle' },
                    row.error ?? ''
                  )
                )
              : '-'
        },
        { prop: 'created_at', label: '创建时间', width: 170, showOverflowTooltip: true },
        {
          prop: 'actions',
          label: '操作',
          width: 200,
          fixed: 'right',
          formatter: (row: KnowledgeListItem) =>
            h('div', { class: 'flex items-center' }, [
              hasAuth('knowledge-documents.edit')
                ? h(ArtButtonTable, {
                    type: 'edit',
                    title: '编辑',
                    onClick: () => handleAction({ key: 'edit' } as ButtonMoreItem, row)
                  })
                : null,
              hasAuth('knowledge-documents.index')
                ? h(ArtButtonTable, {
                    icon: 'ri:stack-line',
                    iconColor: 'var(--el-color-primary)',
                    buttonBgColor: 'rgba(var(--el-color-primary-rgb),0.12)',
                    title: '查看分块',
                    onClick: () => handleAction({ key: 'chunks' } as ButtonMoreItem, row)
                  })
                : null,
              h(ArtButtonMore, {
                list: [
                  {
                    key: 'reindex',
                    label: '重建索引',
                    icon: 'ri:refresh-line',
                    auth: 'knowledge-documents.edit'
                  },
                  {
                    key: 'toggle',
                    label: row.is_enabled ? '停用' : '启用',
                    icon: row.is_enabled ? 'ri:forbid-line' : 'ri:check-line',
                    auth: 'knowledge-documents.edit'
                  },
                  {
                    key: 'delete',
                    label: '删除',
                    icon: 'ri:delete-bin-4-line',
                    color: '#f56c6c',
                    auth: 'knowledge-documents.delete'
                  }
                ] as ButtonMoreItem[],
                onClick: (item: ButtonMoreItem) => handleAction(item, row)
              })
            ])
        }
      ]
    }
  })

  const openCreateDialog = () => {
    editDialogRef.value?.open()
  }

  const openTestDialog = () => {
    testDialogRef.value?.open()
  }

  const onEditSuccess = () => {
    refreshData()
  }

  const handleAction = (item: { key: string | number }, row: KnowledgeListItem) => {
    switch (item.key) {
      case 'edit':
        editDialogRef.value?.open(row)
        break
      case 'chunks':
        chunksDialogRef.value?.open(row)
        break
      case 'reindex':
        handleReindex(row)
        break
      case 'toggle':
        handleToggleStatus(row)
        break
      case 'delete':
        handleDelete(row)
        break
    }
  }

  const handleReindex = (row: KnowledgeListItem) => {
    ElMessageBox.confirm(
      `确认重建文档「${row.title}」的索引吗？将重新分块并向量化全部内容。`,
      '重建索引',
      {
        type: 'warning',
        confirmButtonText: '确认重建',
        cancelButtonText: '取消'
      }
    )
      .then(async () => {
        await fetchReindexKnowledge(row.id)
        refreshData()
      })
      .catch(() => {})
  }

  const handleDelete = (row: KnowledgeListItem) => {
    ElMessageBox.confirm(
      `确认删除文档「${row.title}」吗？其全部分块将一并删除且不可恢复。`,
      '删除文档',
      {
        type: 'warning',
        confirmButtonText: '确认删除',
        cancelButtonText: '取消'
      }
    )
      .then(async () => {
        await fetchDeleteKnowledge(row.id)
        refreshData()
      })
      .catch(() => {})
  }

  const handleToggleStatus = async (row: KnowledgeListItem) => {
    try {
      await fetchToggleKnowledgeStatus(row.id)
      refreshData()
    } catch {
      // 失败不刷新
    }
  }

  const handleSearch = (params: Partial<Api.Knowledge.SearchParams>) => {
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

<style scoped lang="scss"></style>
