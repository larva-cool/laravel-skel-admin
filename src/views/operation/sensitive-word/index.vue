<template>
  <div class="art-full-height flex flex-col gap-3">
    <!-- 搜索栏 -->
    <SensitiveWordSearch
      v-show="showSearchBar"
      :category-options="categoryOptions"
      :level-options="levelOptions"
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
            <ElButton v-auth="'sensitive-words.create'" type="primary" @click="openCreateDialog">
              <ElIcon class="mr-1"><Plus /></ElIcon>
              新增敏感词
            </ElButton>
            <ElButton v-auth="'sensitive-words.create'" @click="openImportDialog">
              <ElIcon class="mr-1"><Upload /></ElIcon>
              批量导入
            </ElButton>
            <ElButton
              v-auth="'sensitive-words.edit'"
              :loading="refreshing"
              @click="handleRefreshDict"
            >
              <ElIcon class="mr-1"><Refresh /></ElIcon>
              刷新字典
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
    <SensitiveWordEditDialog
      ref="editDialogRef"
      :category-options="categoryOptions"
      :level-options="levelOptions"
      @success="onEditSuccess"
    />

    <!-- 批量导入弹窗 -->
    <SensitiveWordImportDialog
      ref="importDialogRef"
      :category-options="categoryOptions"
      :level-options="levelOptions"
      @success="refreshData"
    />
  </div>
</template>

<script setup lang="ts">
  import { h, ref } from 'vue'
  import { ElTag, ElMessageBox, ElSwitch } from 'element-plus'
  import { Plus, Refresh, Upload } from '@element-plus/icons-vue'
  import ArtButtonMore, {
    type ButtonMoreItem
  } from '@/components/core/forms/art-button-more/index.vue'
  import ArtButtonTable from '@/components/core/forms/art-button-table/index.vue'
  import { useTable } from '@/hooks/core/useTable'
  import { useAuth } from '@/hooks/core/useAuth'
  import {
    fetchGetSensitiveWordList,
    fetchDeleteSensitiveWord,
    fetchToggleSensitiveWordStatus,
    fetchGetSensitiveWordOptions,
    fetchRefreshSensitiveDict
  } from '@/api/operation-manage'
  import SensitiveWordSearch from './modules/sensitive-word-search.vue'
  import SensitiveWordEditDialog from './modules/sensitive-word-edit-dialog.vue'
  import SensitiveWordImportDialog from './modules/sensitive-word-import-dialog.vue'

  defineOptions({ name: 'SensitiveWordManage' })

  type Item = Api.OperationManage.SensitiveWordListItem

  const { hasAuth } = useAuth()

  const showSearchBar = ref(true)
  const editDialogRef = ref<InstanceType<typeof SensitiveWordEditDialog>>()
  const importDialogRef = ref<InstanceType<typeof SensitiveWordImportDialog>>()
  const refreshing = ref(false)

  const categoryOptions = ref<Api.OperationManage.OptionItem[]>([])
  const levelOptions = ref<Api.OperationManage.OptionItem[]>([])
  const toggleLoading = ref<Set<number>>(new Set())

  const levelTagType = (level: string): 'primary' | 'success' | 'warning' | 'info' | 'danger' => {
    switch (level) {
      case 'block':
        return 'danger'
      case 'review':
        return 'warning'
      case 'replace':
        return 'info'
      default:
        return 'info'
    }
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
      apiFn: fetchGetSensitiveWordList,
      apiParams: { page: 1, per_page: 20 },
      columnsFactory: () => [
        { prop: 'id', label: 'ID', width: 80 },
        { prop: 'word', label: '敏感词', minWidth: 160, showOverflowTooltip: true },
        {
          prop: 'category',
          label: '分类',
          width: 110,
          formatter: (row: Item) =>
            h(ElTag, { size: 'small', effect: 'plain' }, () => row.category_label || row.category)
        },
        {
          prop: 'level',
          label: '处理级别',
          width: 110,
          formatter: (row: Item) =>
            h(
              ElTag,
              { size: 'small', type: levelTagType(row.level), effect: 'plain' },
              () => row.level_label || row.level
            )
        },
        { prop: 'replacement', label: '替换', width: 80, align: 'center' },
        { prop: 'hit_count', label: '命中次数', width: 100, align: 'center' },
        {
          prop: 'status',
          label: '状态',
          width: 100,
          formatter: (row: Item) =>
            h(ElSwitch, {
              modelValue: row.status,
              loading: toggleLoading.value.has(row.id),
              disabled: !hasAuth('sensitive-words.edit'),
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
          width: 160,
          fixed: 'right',
          formatter: (row: Item) =>
            h('div', { class: 'flex items-center' }, [
              hasAuth('sensitive-words.edit')
                ? h(ArtButtonTable, {
                    type: 'edit',
                    title: '编辑',
                    onClick: () => handleAction({ key: 'edit' } as ButtonMoreItem, row)
                  })
                : null,
              h(ArtButtonMore, {
                list: [
                  {
                    key: 'delete',
                    label: '删除',
                    icon: 'ri:delete-bin-4-line',
                    color: '#f56c6c',
                    auth: 'sensitive-words.delete'
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

  const openEditDialog = (row: Item) => {
    editDialogRef.value?.open(row)
  }

  const openImportDialog = () => {
    importDialogRef.value?.open()
  }

  const onEditSuccess = () => {
    refreshData()
  }

  const handleAction = (item: ButtonMoreItem, row: Item) => {
    switch (item.key) {
      case 'edit':
        openEditDialog(row)
        break
      case 'delete':
        handleDelete(row)
        break
    }
  }

  const handleDelete = (row: Item) => {
    ElMessageBox.confirm(`确认删除敏感词「${row.word}」吗？删除后不可恢复。`, '删除敏感词', {
      type: 'warning',
      confirmButtonText: '确认删除',
      cancelButtonText: '取消'
    })
      .then(async () => {
        await fetchDeleteSensitiveWord(row.id)
        refreshData()
      })
      .catch(() => {})
  }

  const handleToggleStatus = async (row: Item) => {
    toggleLoading.value.add(row.id)
    try {
      await fetchToggleSensitiveWordStatus(row.id)
      refreshData()
    } catch {
      // 切换失败不刷新
    } finally {
      toggleLoading.value.delete(row.id)
    }
  }

  const handleRefreshDict = async () => {
    refreshing.value = true
    try {
      await fetchRefreshSensitiveDict()
      refreshData()
    } finally {
      refreshing.value = false
    }
  }

  const handleSearch = (params: Partial<Api.OperationManage.SensitiveWordSearchParams>) => {
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

  async function loadOptions() {
    try {
      const data = await fetchGetSensitiveWordOptions()
      categoryOptions.value = (data.categories || []) as Api.OperationManage.OptionItem[]
      levelOptions.value = (data.levels || []) as Api.OperationManage.OptionItem[]
    } catch {
      categoryOptions.value = []
      levelOptions.value = []
    }
  }

  onMounted(() => {
    loadOptions()
  })
</script>
