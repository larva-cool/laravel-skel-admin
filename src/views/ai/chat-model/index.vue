<template>
  <div class="art-full-height flex flex-col gap-3">
    <!-- 搜索栏 -->
    <ChatModelSearch
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
            <ElButton v-auth="'chat-models.create'" type="primary" @click="openCreateDialog">
              <ElIcon class="mr-1"><Plus /></ElIcon>
              新增模型
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
    <ChatModelEditDialog ref="editDialogRef" @success="onEditSuccess" />
  </div>
</template>

<script setup lang="ts">
  import { h, ref } from 'vue'
  import { ElTag, ElMessageBox } from 'element-plus'
  import { Plus } from '@element-plus/icons-vue'
  import ArtButtonTable from '@/components/core/forms/art-button-table/index.vue'
  import { useTable } from '@/hooks/core/useTable'
  import { useAuth } from '@/hooks/core/useAuth'
  import {
    fetchGetChatModelList,
    fetchDeleteChatModel,
    fetchToggleChatModelStatus
  } from '@/api/chat-model'
  import ChatModelSearch from './modules/chat-model-search.vue'
  import ChatModelEditDialog from './modules/chat-model-edit-dialog.vue'

  defineOptions({ name: 'AIChatModel' })

  type ChatModelListItem = Api.ChatModel.ListItem

  const { hasAuth } = useAuth()

  const showSearchBar = ref(true)
  const editDialogRef = ref<InstanceType<typeof ChatModelEditDialog>>()

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
      apiFn: fetchGetChatModelList,
      apiParams: { page: 1, per_page: 20 },
      columnsFactory: () => [
        { prop: 'id', label: 'ID', width: 80 },
        { prop: 'name', label: '展示名称', minWidth: 160, showOverflowTooltip: true },
        { prop: 'model_id', label: '模型 ID', minWidth: 220, showOverflowTooltip: true },
        { prop: 'provider', label: '服务商', width: 100, align: 'center' },
        { prop: 'sort', label: '排序', width: 80, align: 'center' },
        {
          prop: 'is_default',
          label: '默认',
          width: 90,
          align: 'center',
          formatter: (row: ChatModelListItem) =>
            row.is_default
              ? h(ElTag, { type: 'warning', size: 'small', effect: 'light' }, () => '默认')
              : '-'
        },
        {
          prop: 'is_enabled',
          label: '状态',
          width: 100,
          align: 'center',
          formatter: (row: ChatModelListItem) =>
            h(
              ElTag,
              { type: row.is_enabled ? 'success' : 'info', size: 'small', effect: 'light' },
              () => (row.is_enabled ? '启用' : '禁用')
            )
        },
        { prop: 'created_at', label: '创建时间', width: 170, showOverflowTooltip: true },
        {
          prop: 'actions',
          label: '操作',
          width: 200,
          fixed: 'right',
          formatter: (row: ChatModelListItem) =>
            h('div', { class: 'flex items-center' }, [
              hasAuth('chat-models.edit')
                ? h(ArtButtonTable, {
                    type: 'edit',
                    title: '编辑',
                    onClick: () => handleAction({ key: 'edit' }, row)
                  })
                : null,
              hasAuth('chat-models.edit')
                ? h(ArtButtonTable, {
                    icon: row.is_enabled ? 'ri:forbid-line' : 'ri:check-line',
                    iconColor: row.is_enabled
                      ? 'var(--el-color-warning)'
                      : 'var(--el-color-success)',
                    buttonBgColor: row.is_enabled
                      ? 'rgba(230,162,60,0.12)'
                      : 'rgba(103,194,58,0.12)',
                    title: row.is_enabled ? '禁用' : '启用',
                    onClick: () => handleAction({ key: 'toggle' }, row)
                  })
                : null,
              hasAuth('chat-models.delete')
                ? h(ArtButtonTable, {
                    type: 'delete',
                    title: '删除',
                    onClick: () => handleAction({ key: 'delete' }, row)
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

  const openEditDialog = (row: ChatModelListItem) => {
    editDialogRef.value?.open(row)
  }

  const onEditSuccess = () => {
    refreshData()
  }

  type ActionKey = 'edit' | 'toggle' | 'delete'

  const handleAction = (item: { key: ActionKey }, row: ChatModelListItem) => {
    switch (item.key) {
      case 'edit':
        openEditDialog(row)
        break
      case 'toggle':
        handleToggleStatus(row)
        break
      case 'delete':
        handleDelete(row)
        break
    }
  }

  const handleDelete = (row: ChatModelListItem) => {
    ElMessageBox.confirm(`确认删除模型「${row.name}」吗？删除后不可恢复。`, '删除模型', {
      type: 'warning',
      confirmButtonText: '确认删除',
      cancelButtonText: '取消'
    })
      .then(async () => {
        await fetchDeleteChatModel(row.id)
        refreshData()
      })
      .catch(() => {})
  }

  const handleToggleStatus = async (row: ChatModelListItem) => {
    try {
      await fetchToggleChatModelStatus(row.id)
      refreshData()
    } catch {
      // 失败不刷新
    }
  }

  const handleSearch = (params: Partial<Api.ChatModel.SearchParams>) => {
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
