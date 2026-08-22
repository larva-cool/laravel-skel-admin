<template>
  <div class="dict-page">
    <!-- 左侧：字典类型 -->
    <ElCard class="dict-panel dict-left-panel">
      <!-- 搜索栏 -->
      <div class="dict-search-bar">
        <ElInput
          v-model="dictKeyword"
          placeholder="请输入字典名称或字典编码"
          clearable
          class="dict-search-input"
          @keyup.enter="handleDictSearch"
        >
          <template #prefix>
            <ElIcon><Search /></ElIcon>
          </template>
        </ElInput>
        <ElButton type="primary" @click="handleDictSearch">查询</ElButton>
      </div>

      <!-- 新增按钮 -->
      <div class="dict-left-toolbar">
        <ElButton type="primary" plain v-auth="'dicts.create'" @click="dictEditDialogRef?.open()">
          新增字典
        </ElButton>
      </div>

      <!-- 左侧表格 -->
      <ArtTable
        :loading="dictLoading"
        :data="dictData"
        :columns="dictColumns"
        :pagination="dictPagination"
        :showTableHeader="false"
        :paginationOptions="{ align: 'center', pageSizes: [10, 20, 50] }"
        @pagination:size-change="handleDictSizeChange"
        @pagination:current-change="handleDictCurrentChange"
        @row-click="handleDictRowClick"
      >
        <template #status="{ row }">
          <ElTag :type="row.status === 1 ? 'success' : 'info'">
            {{ row.status === 1 ? '启用' : '禁用' }}
          </ElTag>
        </template>
        <template #action="{ row }">
          <div class="dict-action-btns">
            <ElIcon
              class="dict-action-btn edit"
              v-auth="'dicts.edit'"
              @click.stop="handleDictEdit(row)"
              title="编辑"
            >
              <Edit />
            </ElIcon>
            <ElIcon
              class="dict-action-btn delete"
              v-auth="'dicts.delete'"
              @click.stop="handleDictDelete(row)"
              title="删除"
            >
              <Delete />
            </ElIcon>
          </div>
        </template>
      </ArtTable>
    </ElCard>

    <!-- 右侧：字典数据项 -->
    <ElCard class="dict-panel dict-right-panel">
      <!-- 搜索栏 -->
      <div class="dict-search-bar dict-item-search-bar">
        <ElInput
          v-model="itemLabel"
          placeholder="请输入数据标签"
          clearable
          style="width: 220px"
          @keyup.enter="handleItemSearch"
        >
          <template #prepend>数据标签</template>
        </ElInput>
        <ElInput
          v-model="itemValue"
          placeholder="请输入数据键值"
          clearable
          style="width: 220px; margin-left: 12px"
          @keyup.enter="handleItemSearch"
        >
          <template #prepend>数据键值</template>
        </ElInput>
        <ElButton style="margin-left: 12px" @click="handleItemReset">重置</ElButton>
        <ElButton type="primary" style="margin-left: 8px" @click="handleItemSearch">查询</ElButton>
      </div>

      <!-- 标题 + 工具栏 -->
      <div class="dict-right-header">
        <div class="dict-right-title">
          <span>字典数据 ·</span>
          <span class="dict-right-name">{{ currentDict?.name || '--' }}</span>
          <ElTag
            v-if="currentDict"
            size="small"
            :type="currentDict.status === 1 ? 'success' : 'info'"
          >
            {{ currentDict.status === 1 ? '启用' : '禁用' }}
          </ElTag>
        </div>
        <ArtTableHeader
          v-model:columns="itemColumnChecks"
          :loading="itemLoading"
          layout="refresh,size,fullscreen,columns,settings"
          @refresh="refreshItemData"
        >
          <template #left>
            <ElButton
              type="primary"
              plain
              :disabled="!currentDict"
              v-auth="'dict-items.create'"
              @click="openItemEditDialog()"
            >
              新增数据
            </ElButton>
          </template>
        </ArtTableHeader>
      </div>

      <!-- 右侧表格 -->
      <ArtTable
        :loading="itemLoading"
        :data="itemData"
        :columns="itemColumns"
        :pagination="itemPagination"
        :showTableHeader="false"
        empty-text="暂无数据"
        @pagination:size-change="handleItemSizeChange"
        @pagination:current-change="handleItemCurrentChange"
      >
        <template #label_type="{ row }">
          <ElTag :type="row.label_type as any">{{ row.label }}</ElTag>
        </template>
        <template #status="{ row }">
          <ElTag :type="row.status === 1 ? 'success' : 'info'">
            {{ row.status === 1 ? '启用' : '禁用' }}
          </ElTag>
        </template>
        <template #action="{ row }">
          <div class="dict-action-btns">
            <ElIcon
              class="dict-action-btn edit"
              v-auth="'dict-items.edit'"
              @click="handleItemEdit(row)"
              title="编辑"
            >
              <Edit />
            </ElIcon>
            <ElIcon
              class="dict-action-btn delete"
              v-auth="'dict-items.delete'"
              @click="handleItemDelete(row)"
              title="删除"
            >
              <Delete />
            </ElIcon>
          </div>
        </template>
      </ArtTable>
    </ElCard>

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
  import ArtTableHeader from '@/components/core/tables/art-table-header/index.vue'
  import ArtTable from '@/components/core/tables/art-table/index.vue'
  import { useTable } from '@/hooks/core/useTable'
  import { Delete, Edit, Search } from '@element-plus/icons-vue'
  import { ElMessage, ElMessageBox, ElTag } from 'element-plus'
  import { ref } from 'vue'
  import DictEditDialog from './modules/dict-edit-dialog.vue'
  import DictItemEditDialog from './modules/dict-item-edit-dialog.vue'

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
        { type: 'globalIndex', label: '序号', width: 60 },
        { prop: 'name', label: '字典名称', minWidth: 140 },
        { prop: 'code', label: '字典编码', minWidth: 120 },
        {
          prop: 'status',
          label: '状态',
          width: 90,
          useSlot: true,
          slotName: 'status'
        },
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
      if (key !== 'page' && key !== 'per_page') delete params[key]
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
  const itemLabel = ref('')
  const itemValue = ref('')
  const itemEditDialogRef = ref<InstanceType<typeof DictItemEditDialog>>()

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
        { type: 'globalIndex', label: '序号', width: 70 },
        { prop: 'label', label: '数据标签', minWidth: 140 },
        { prop: 'value', label: '数据键值', minWidth: 140 },
        {
          prop: 'label_type',
          label: '标签类型',
          width: 120,
          useSlot: true,
          slotName: 'label_type'
        },
        { prop: 'sort', label: '排序', width: 80 },
        {
          prop: 'status',
          label: '状态',
          width: 90,
          useSlot: true,
          slotName: 'status'
        },
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
      if (key !== 'page' && key !== 'per_page') delete params[key]
    })
    params.dict_id = currentDict.value.id
    params.page = 1
    getItemData()
  }

  const handleItemSearch = () => {
    if (!currentDict.value) return
    const params = itemSearchParams as Record<string, unknown>
    Object.keys(params).forEach((key) => {
      if (key !== 'page' && key !== 'per_page') delete params[key]
    })
    params.dict_id = currentDict.value.id
    if (itemLabel.value) {
      params.label = itemLabel.value
    }
    if (itemValue.value) {
      params.value = itemValue.value
    }
    getItemData()
  }

  const handleItemReset = () => {
    itemLabel.value = ''
    itemValue.value = ''
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
  .dict-page {
    box-sizing: border-box;
    display: flex;
    gap: 16px;
    height: 100%;
    padding: 16px;
  }

  .dict-panel {
    display: flex;
    flex-direction: column;
    overflow: hidden;

    :deep(.el-card__body) {
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      height: 100%;
      padding: 16px;
      overflow: hidden;
    }
  }

  .dict-left-panel {
    flex-shrink: 0;
    width: 420px;
  }

  .dict-right-panel {
    flex: 1;
    min-width: 0;
  }

  .dict-search-bar {
    display: flex;
    flex-shrink: 0;
    gap: 8px;
    align-items: center;
    margin-bottom: 12px;
  }

  .dict-search-input {
    flex: 1;
  }

  .dict-item-search-bar {
    :deep(.el-input__prepend) {
      padding: 0 10px;
      color: var(--el-text-color-regular);
      background: var(--el-fill-color-light);
    }
  }

  .dict-left-toolbar {
    flex-shrink: 0;
    margin-bottom: 12px;
  }

  .dict-right-header {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
  }

  .dict-right-title {
    display: flex;
    gap: 6px;
    align-items: center;
    font-size: 15px;
    font-weight: 500;
    color: var(--el-text-color-primary);

    .dict-right-name {
      color: var(--el-color-primary);
    }
  }

  .dict-action-btns {
    display: flex;
    gap: 10px;
    align-items: center;
  }

  .dict-action-btn {
    font-size: 16px;
    cursor: pointer;
    transition: color 0.2s;

    &.edit {
      color: var(--el-color-primary);

      &:hover {
        color: var(--el-color-primary-light-3);
      }
    }

    &.delete {
      color: var(--el-color-danger);

      &:hover {
        color: var(--el-color-danger-light-3);
      }
    }
  }
</style>
