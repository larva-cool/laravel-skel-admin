<template>
  <div class="art-full-height flex flex-col gap-3">
    <!-- 搜索栏 -->
    <AgreementSearch
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
            <ElButton v-auth="'agreements.create'" type="primary" @click="openCreateDialog">
              <ElIcon class="mr-1"><Plus /></ElIcon>
              新增协议
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
    <AgreementEditDialog ref="editDialogRef" @success="onEditSuccess" />
    <!-- 详情弹窗 -->
    <AgreementDetailDialog ref="detailDialogRef" />
  </div>
</template>

<script setup lang="ts">
  import { h, ref } from 'vue'
  import { ElTag, ElMessageBox } from 'element-plus'
  import { Plus } from '@element-plus/icons-vue'
  import ArtButtonMore, { ButtonMoreItem } from '@/components/core/forms/art-button-more/index.vue'
  import ArtButtonTable from '@/components/core/forms/art-button-table/index.vue'
  import { useTable } from '@/hooks/core/useTable'
  import { useAuth } from '@/hooks/core/useAuth'
  import { fetchDictItemsByCode } from '@/api/system-manage'
  import {
    fetchGetAgreementList,
    fetchDeleteAgreement,
    fetchToggleAgreementStatus
  } from '@/api/operation-manage'
  import AgreementSearch from './modules/agreement-search.vue'
  import AgreementEditDialog from './modules/agreement-edit-dialog.vue'
  import AgreementDetailDialog from './modules/agreement-detail-dialog.vue'

  defineOptions({ name: 'AgreementManage' })

  type AgreementListItem = Api.OperationManage.AgreementListItem

  const { hasAuth } = useAuth()

  const showSearchBar = ref(true)
  const editDialogRef = ref<InstanceType<typeof AgreementEditDialog>>()
  const detailDialogRef = ref<InstanceType<typeof AgreementDetailDialog>>()

  const statusTagMap: Record<string, { type: 'info' | 'success' | 'warning'; label: string }> = {
    draft: { type: 'info', label: '草稿' },
    published: { type: 'success', label: '已发布' },
    archived: { type: 'warning', label: '已归档' }
  }

  const categoryOptions = ref<{ label: string; value: string }[]>([])

  const loadCategoryOptions = async () => {
    try {
      const items = await fetchDictItemsByCode('agreement_category')
      categoryOptions.value = (items || []).map((it) => ({ label: it.label, value: it.value }))
    } catch {
      categoryOptions.value = []
    }
  }

  onMounted(loadCategoryOptions)

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
      apiFn: fetchGetAgreementList,
      apiParams: { page: 1, per_page: 20 },
      columnsFactory: () => [
        { prop: 'id', label: 'ID', width: 100 },
        { prop: 'title', label: '标题', minWidth: 200, showOverflowTooltip: true },
        {
          prop: 'category',
          label: '类别',
          width: 150,
          formatter: (row: AgreementListItem) => {
            const opt = categoryOptions.value.find((o) => o.value === row.category)
            return h(
              ElTag,
              { type: 'info', size: 'small', effect: 'light' },
              () => opt?.label || row.category
            )
          }
        },
        { prop: 'version', label: '版本号', width: 120 },
        {
          prop: 'status',
          label: '状态',
          width: 110,
          formatter: (row: AgreementListItem) => {
            const info = statusTagMap[row.status] || { type: 'info' as const, label: row.status }
            return h(ElTag, { type: info.type, size: 'small', effect: 'light' }, () => info.label)
          }
        },
        {
          prop: 'effective_at',
          label: '生效时间',
          width: 170,
          showOverflowTooltip: true,
          formatter: (row: AgreementListItem) => row.effective_at || '-'
        },
        { prop: 'created_at', label: '创建时间', width: 170, showOverflowTooltip: true },
        {
          prop: 'actions',
          label: '操作',
          width: 200,
          fixed: 'right',
          formatter: (row: AgreementListItem) =>
            h('div', { class: 'flex items-center' }, [
              h(ArtButtonTable, {
                type: 'view',
                title: '查看',
                onClick: () => handleAction({ key: 'view' } as ButtonMoreItem, row)
              }),
              hasAuth('agreements.edit')
                ? h(ArtButtonTable, {
                    type: 'edit',
                    title: '编辑',
                    onClick: () => handleAction({ key: 'edit' } as ButtonMoreItem, row)
                  })
                : null,
              h(ArtButtonMore, {
                list: [
                  {
                    key: 'toggle',
                    label: getToggleLabel(row.status),
                    icon: getToggleIcon(row.status),
                    auth: 'agreements.edit'
                  },
                  {
                    key: 'delete',
                    label: '删除',
                    icon: 'ri:delete-bin-4-line',
                    color: '#f56c6c',
                    auth: 'agreements.delete'
                  }
                ] as ButtonMoreItem[],
                onClick: (item: ButtonMoreItem) => handleAction(item, row)
              })
            ])
        }
      ]
    }
  })

  const getToggleLabel = (status: string): string => {
    switch (status) {
      case 'draft':
        return '发布'
      case 'published':
        return '归档'
      case 'archived':
        return '重新发布'
      default:
        return '切换'
    }
  }

  const getToggleIcon = (status: string): string => {
    switch (status) {
      case 'draft':
        return 'ri:send-plane-line'
      case 'published':
        return 'ri:archive-line'
      case 'archived':
        return 'ri:refresh-line'
      default:
        return 'ri:exchange-line'
    }
  }

  const openCreateDialog = () => {
    editDialogRef.value?.open()
  }

  const openEditDialog = (row: AgreementListItem) => {
    editDialogRef.value?.open(row)
  }

  const openDetailDialog = (row: AgreementListItem) => {
    detailDialogRef.value?.open(row)
  }

  const onEditSuccess = () => {
    refreshData()
  }

  type ActionKey = 'view' | 'edit' | 'toggle' | 'delete'

  const handleAction = (item: { key: string | number }, row: AgreementListItem) => {
    switch (String(item.key) as ActionKey) {
      case 'view':
        openDetailDialog(row)
        break
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

  const handleDelete = (row: AgreementListItem) => {
    ElMessageBox.confirm(`确认删除协议「${row.title}」吗？删除后不可恢复。`, '删除协议', {
      type: 'warning',
      confirmButtonText: '确认删除',
      cancelButtonText: '取消'
    })
      .then(async () => {
        await fetchDeleteAgreement(row.id)
        refreshData()
      })
      .catch(() => {})
  }

  const handleToggleStatus = async (row: AgreementListItem) => {
    try {
      await fetchToggleAgreementStatus(row.id)
      refreshData()
    } catch {
      // 失败不刷新
    }
  }

  const handleSearch = (params: Partial<Api.OperationManage.AgreementSearchParams>) => {
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
