<template>
  <div class="dict-page art-full-height overflow-visible" style="min-height: calc(-119px + 100vh)">
    <div class="dict-page-splitter flex h-full gap-4 overflow-visible">
      <!-- 左侧：字典类型列表 -->
      <section
        class="dict-panel dict-panel-primary flex h-full min-h-0 w-[640px] shrink-0 flex-col overflow-visible"
      >
        <!-- 搜索区 -->
        <div class="art-card-xs flex items-center gap-3 p-4">
          <ElInput
            v-model="dictKeyword"
            class="flex-1"
            placeholder="请输入字典名称或字典编码"
            clearable
            @keyup.enter="handleDictSearch"
          >
            <template #prefix>
              <ElIcon><Search /></ElIcon>
            </template>
          </ElInput>
          <ElButton type="primary" @click="handleDictSearch">查询</ElButton>
        </div>

        <!-- 表格卡片 -->
        <ElCard
          class="art-table-card mt-3 flex min-h-0 flex-1 flex-col overflow-hidden"
          shadow="never"
        >
          <div class="shrink-0">
            <ElButton
              type="primary"
              plain
              v-auth="'dicts.create'"
              @click="dictEditDialogRef?.open()"
            >
              新增字典
            </ElButton>
          </div>
          <ArtTable
            class="dict-left-table"
            :loading="dictLoading"
            :data="dictData"
            :columns="dictColumns"
            :pagination="dictPagination"
            :paginationOptions="{ align: 'center', pageSizes: [10, 20, 50] }"
            @pagination:size-change="handleDictSizeChange"
            @pagination:current-change="handleDictCurrentChange"
            @row-click="handleDictRowClick"
          >
            <template #status="{ row }">
              <ElTag :type="row.status === 1 ? 'success' : 'info'" effect="light">
                {{ row.status === 1 ? '启用' : '禁用' }}
              </ElTag>
            </template>
            <template #action="{ row }">
              <div class="flex items-center">
                <ArtButtonTable type="edit" v-auth="'dicts.edit'" @click="handleDictEdit(row)" />
                <ArtButtonTable
                  type="delete"
                  v-auth="'dicts.delete'"
                  @click="handleDictDelete(row)"
                />
              </div>
            </template>
          </ArtTable>
        </ElCard>
      </section>

      <!-- 右侧：字典数据项 -->
      <section
        class="dict-panel dict-panel-secondary flex h-full min-h-0 flex-1 flex-col overflow-visible"
      >
        <!-- 搜索区 -->
        <ArtSearchBar
          v-model="itemFilters"
          :items="itemFormItems"
          :showExpand="false"
          :labelWidth="'70px'"
          :span="8"
          @reset="handleItemReset"
          @search="handleItemSearch"
        />

        <!-- 表格卡片 -->
        <ElCard
          class="art-table-card flex min-h-0 flex-1 flex-col overflow-hidden"
          :style="{ 'margin-top': '12px' }"
          shadow="never"
        >
          <template #header>
            <div class="flex items-center justify-between gap-3">
              <div class="flex items-center gap-2">
                <span class="text-sm font-medium">字典数据 · {{ currentDict?.name || '--' }}</span>
                <ElTag v-if="currentDict" size="small" type="success" effect="light">
                  {{ currentDict.code }}
                </ElTag>
              </div>
            </div>
          </template>

          <ArtTableHeader
            v-model:columns="itemColumnChecks"
            :loading="itemLoading"
            layout="refresh,size,fullscreen,columns,settings"
            @refresh="refreshItemData"
          >
            <template #left>
              <ElButton
                v-auth="'dict-items.create'"
                :disabled="!currentDict"
                @click="openItemEditDialog()"
              >
                新增数据
              </ElButton>
            </template>
          </ArtTableHeader>

          <ArtTable
            :loading="itemLoading"
            :data="itemData"
            :columns="itemColumns"
            :pagination="itemPagination"
            empty-text="暂无数据"
            @pagination:size-change="handleItemSizeChange"
            @pagination:current-change="handleItemCurrentChange"
          >
            <template #label_type="{ row }">
              <ElTag :type="row.label_type as any" effect="light">{{ row.label }}</ElTag>
            </template>
            <template #status="{ row }">
              <ElTag :type="row.status === 1 ? 'success' : 'info'" effect="light">
                {{ row.status === 1 ? '启用' : '禁用' }}
              </ElTag>
            </template>
            <template #action="{ row }">
              <div class="flex items-center">
                <ArtButtonTable
                  type="edit"
                  v-auth="'dict-items.edit'"
                  @click="handleItemEdit(row)"
                />
                <ArtButtonTable
                  type="delete"
                  v-auth="'dict-items.delete'"
                  @click="handleItemDelete(row)"
                />
              </div>
            </template>
          </ArtTable>
        </ElCard>
      </section>
    </div>

    <!-- 弹窗 -->
    <DictEditDialog ref="dictEditDialogRef" @refresh="refreshDictCreate" />
    <DictItemEditDialog
      ref="itemEditDialogRef"
      :dict-id="currentDict?.id"
      @refresh="refreshItemCreate"
    />
  </div>
</template>

<script setup lang="ts">
  import {
    fetchDeleteDict,
    fetchDeleteDictItem,
    fetchGetDictItemList,
    fetchGetDictList
  } from '@/api/system-manage'
  import ArtButtonTable from '@/components/core/forms/art-button-table/index.vue'
  import ArtSearchBar from '@/components/core/forms/art-search-bar/index.vue'
  import ArtTableHeader from '@/components/core/tables/art-table-header/index.vue'
  import ArtTable from '@/components/core/tables/art-table/index.vue'
  import { useTable } from '@/hooks/core/useTable'
  import { Search } from '@element-plus/icons-vue'
  import { ElMessage, ElMessageBox, ElTag } from 'element-plus'
  import DictEditDialog from './modules/dict-edit-dialog.vue'
  import DictItemEditDialog from './modules/dict-item-edit-dialog.vue'

  defineOptions({ name: 'DictManage' })

  // ============== 左侧：字典类型 ==============

  const dictKeyword = ref('')
  const dictEditDialogRef = ref<InstanceType<typeof DictEditDialog>>()

  const {
    columns: dictColumns,
    data: dictData,
    loading: dictLoading,
    pagination: dictPagination,
    searchParams: dictSearchParams,
    getData: getDictData,
    handleSizeChange: handleDictSizeChange,
    handleCurrentChange: handleDictCurrentChange,
    refreshCreate: refreshDictCreate,
    refreshRemove: refreshDictRemove
  } = useTable({
    core: {
      apiFn: fetchGetDictList,
      apiParams: { page: 1, per_page: 10 },
      paginationKey: { current: 'page', size: 'per_page' },
      columnsFactory: () => [
        { type: 'globalIndex', label: '序号', width: 70 },
        { prop: 'name', label: '字典名称', minWidth: 125 },
        { prop: 'code', label: '字典编码', minWidth: 125 },
        { prop: 'status', label: '状态', width: 90, useSlot: true, slotName: 'status' },
        {
          prop: 'action',
          label: '操作',
          width: 100,
          fixed: 'right',
          useSlot: true,
          slotName: 'action'
        }
      ]
    }
  })

  const handleDictSearch = () => {
    const params = dictSearchParams as Record<string, unknown>
    Object.keys(params).forEach((key) => {
      if (key !== 'page' && key !== 'per_page') {
        delete params[key]
      }
    })
    if (dictKeyword.value) {
      params.keyword = dictKeyword.value
    }
    getDictData()
  }

  const handleDictRowClick = (row: Api.SystemManage.DictListItem) => {
    currentDict.value = row
    loadDictItems()
  }

  const handleDictEdit = (row: Api.SystemManage.DictListItem) => {
    dictEditDialogRef.value?.open(row)
  }

  const handleDictDelete = async (row: Api.SystemManage.DictListItem) => {
    try {
      await ElMessageBox.confirm(`确定要删除字典【${row.name}】吗？`, '提示', {
        type: 'warning',
        confirmButtonText: '确定',
        cancelButtonText: '取消'
      })
      await fetchDeleteDict(row.id)
      ElMessage.success('删除成功')
      refreshDictRemove()
      if (currentDict.value?.id === row.id) {
        currentDict.value = null
      }
    } catch {
      /* 取消 */
    }
  }

  // ============== 右侧：字典数据项 ==============

  const currentDict = ref<Api.SystemManage.DictListItem | null>(null)
  const itemEditDialogRef = ref<InstanceType<typeof DictItemEditDialog>>()

  const itemFilters = reactive<Record<string, any>>({ label: '', value: '' })

  const itemFormItems = [
    {
      label: '数据标签',
      key: 'label',
      type: 'input',
      span: 8,
      props: { clearable: true, placeholder: '请输入数据标签' }
    },
    {
      label: '数据键值',
      key: 'value',
      type: 'input',
      span: 8,
      props: { clearable: true, placeholder: '请输入数据键值' }
    }
  ]

  const {
    columns: itemColumns,
    columnChecks: itemColumnChecks,
    data: itemData,
    loading: itemLoading,
    pagination: itemPagination,
    searchParams: itemSearchParams,
    getData: getItemData,
    handleSizeChange: handleItemSizeChange,
    handleCurrentChange: handleItemCurrentChange,
    refreshData: refreshItemData,
    refreshCreate: refreshItemCreate,
    refreshRemove: refreshItemRemove
  } = useTable({
    core: {
      apiFn: fetchGetDictItemList,
      apiParams: { page: 1, per_page: 10 },
      paginationKey: { current: 'page', size: 'per_page' },
      immediate: false,
      columnsFactory: () => [
        { type: 'globalIndex', label: '序号', width: 60 },
        { prop: 'label', label: '数据标签', minWidth: 150 },
        { prop: 'value', label: '数据键值', minWidth: 150 },
        {
          prop: 'label_type',
          label: '标签类型',
          width: 110,
          useSlot: true,
          slotName: 'label_type'
        },
        { prop: 'sort', label: '排序', width: 80, align: 'center' },
        { prop: 'status', label: '状态', width: 90, useSlot: true, slotName: 'status' },
        { prop: 'updated_at', label: '更新时间', width: 170 },
        {
          prop: 'action',
          label: '操作',
          width: 110,
          fixed: 'right',
          useSlot: true,
          slotName: 'action'
        }
      ]
    }
  })

  const loadDictItems = () => {
    if (!currentDict.value) return
    const params = itemSearchParams as Record<string, unknown>
    Object.keys(params).forEach((key) => {
      if (key !== 'page' && key !== 'per_page') {
        delete params[key]
      }
    })
    params.dict_id = currentDict.value.id
    params.page = 1
    itemFilters.label = ''
    itemFilters.value = ''
    getItemData()
  }

  const handleItemSearch = (params: Record<string, any> = {}) => {
    if (!currentDict.value) return
    const searchRecord = itemSearchParams as Record<string, unknown>
    Object.keys(searchRecord).forEach((key) => {
      if (key !== 'page' && key !== 'per_page') {
        delete searchRecord[key]
      }
    })
    searchRecord.dict_id = currentDict.value.id
    Object.assign(searchRecord, params)
    getItemData()
  }

  const handleItemReset = () => {
    itemFilters.label = ''
    itemFilters.value = ''
    handleItemSearch()
  }

  const openItemEditDialog = () => {
    itemEditDialogRef.value?.open()
  }

  const handleItemEdit = (row: Api.SystemManage.DictItemListItem) => {
    itemEditDialogRef.value?.open(row)
  }

  const handleItemDelete = async (row: Api.SystemManage.DictItemListItem) => {
    try {
      await ElMessageBox.confirm(`确定要删除数据项【${row.label}】吗？`, '提示', {
        type: 'warning',
        confirmButtonText: '确定',
        cancelButtonText: '取消'
      })
      await fetchDeleteDictItem(row.id)
      ElMessage.success('删除成功')
      refreshItemRemove()
    } catch {
      /* 取消 */
    }
  }
</script>

<style lang="scss" scoped>
  .dict-page-splitter {
    /* 参考效果图的分隔线 */
    > .dict-panel + .dict-panel {
      border-left: none;
    }
  }

  .dict-left-table {
    :deep(.el-table) {
      height: calc(100% - 48px) !important;
    }
  }
</style>
