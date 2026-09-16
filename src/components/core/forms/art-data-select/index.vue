<!-- 数据选择器组件 -->
<!-- 支持：表格多选 / 表格单选，带搜索、分页、已选计数、确认提交 -->
<!-- 使用方式：通过 ref 调用 open(selected) 打开弹窗，通过 confirm 事件取回选中项 -->
<template>
  <ElDialog
    v-model="visible"
    :title="title"
    :width="dialogWidth"
    :close-on-click-modal="false"
    append-to-body
    destroy-on-close
    class="art-data-select"
    @closed="handleClosed"
  >
    <!-- 搜索区：可选，配置 searchItems 后显示 -->
    <ArtSearchBar
      v-if="searchItems?.length"
      :items="searchItems"
      :loading="loading"
      @search="handleSearch"
      @reset="handleReset"
    />

    <!-- 已选区：多选模式下显示已选计数与清空 -->
    <div v-if="isMultiple && showSelectedBar" class="art-data-select__selected-bar">
      <span class="art-data-select__selected-text">
        已选择 <em class="art-data-select__selected-count">{{ selectedList.length }}</em> 项
      </span>
      <ElButton
        v-if="selectedList.length > 0"
        type="danger"
        link
        size="small"
        @click="handleClearSelected"
      >
        清空
      </ElButton>
    </div>

    <!-- 数据表格 -->
    <ArtTable
      ref="artTableRef"
      :data="tableData"
      :columns="effectiveColumns"
      :loading="loading"
      :border="tableBorder"
      :stripe="tableStripe"
      :height="tableHeight"
      :row-key="rowKey"
      :show-pagination="showPagination"
      :pagination="pageState"
      @selection-change="handleSelectionChange"
      @row-click="handleRowClick"
      @pagination:size-change="handleSizeChange"
      @pagination:current-change="handleCurrentChange"
    />

    <template #footer>
      <div class="art-data-select__footer">
        <span v-if="isMultiple" class="art-data-select__footer-count">
          已选 <em class="art-data-select__selected-count">{{ selectedList.length }}</em> 项
        </span>
        <div class="flex gap-2 justify-end flex-1">
          <ElButton @click="visible = false">取消</ElButton>
          <ElButton type="primary" :disabled="loading" @click="handleConfirm"> 确定 </ElButton>
        </div>
      </div>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import { computed, ref, watch } from 'vue'
  import ArtSearchBar from '../art-search-bar/index.vue'
  import ArtTable from '@/components/core/tables/art-table/index.vue'
  import type { ColumnOption } from '@/types/component'

  defineOptions({ name: 'ArtDataSelect' })

  /** 搜索项配置类型 */
  export interface DataSelectSearchSchema {
    /** 字段名 */
    field: string
    /** 标签 */
    label: string
    /** 控件类型 */
    type?: 'input' | 'select' | 'date' | 'datetime' | 'daterange'
    /** 占位符 */
    placeholder?: string
    /** 选项（select 类型使用） */
    options?: Array<{ label: string; value: string | number }>
    /** 默认值 */
    defaultValue?: unknown
    /** 所占栅格数 */
    span?: number
  }

  /** Props */
  export interface ArtDataSelectProps<T = Record<string, any>> {
    /** 弹窗标题 */
    title?: string
    /** 弹窗宽度，默认 800px */
    width?: string | number
    /** 选择模式：single 单选 / multiple 多选，默认 multiple */
    mode?: 'single' | 'multiple'
    /** 行唯一标识字段，默认 id */
    rowKey?: string
    /** 表格列配置 */
    columns: ColumnOption<T>[]
    /** 数据源：静态数据数组或异步加载函数 */
    dataSource?:
      | T[]
      | ((params: Record<string, any>) => Promise<{
          list: T[]
          total: number
        }>)
    /** 分页配置 */
    pagination?: any
    /** 是否显示分页，默认 true */
    showPagination?: boolean
    /** 搜索项配置，不配置则不显示搜索区 */
    searchItems?: any[]
    /** 是否显示表头 */
    showHeader?: boolean
    /** 是否显示边框 */
    tableBorder?: boolean
    /** 是否斑马纹 */
    tableStripe?: boolean
    /** 表格高度 */
    tableHeight?: string | number
    /** 是否显示已选计数条（多选） */
    showSelectedBar?: boolean
    /** 已选值（v-model） */
    modelValue?: T | T[] | null
  }

  const props = withDefaults(defineProps<ArtDataSelectProps>(), {
    title: '请选择',
    width: 800,
    mode: 'multiple',
    rowKey: 'id',
    showPagination: true,
    showSelectedBar: true,
    tableBorder: false,
    tableStripe: false
  })

  const emit = defineEmits<{
    (e: 'update:modelValue', val: any): void
    (e: 'confirm', selected: any): void
    (e: 'selection-change', selected: any): void
    (e: 'open'): void
    (e: 'close'): void
  }>()

  /** 弹窗显示状态 */
  const visible = ref(false)
  /** ArtTable 实例 */
  const artTableRef = ref<InstanceType<typeof ArtTable> | null>(null)
  /** 加载中 */
  const loading = ref(false)
  /** 表格数据 */
  const tableData = ref<any[]>([])
  /** 已选项 */
  const selectedList = ref<any[]>([])
  /** 搜索参数 */
  const searchParams = ref<Record<string, any>>({})
  /** 分页状态（与 ArtTable 内部约定一致：current/size/total） */
  const pageState = ref<any>({
    current: 1,
    size: 10,
    total: 0,
    pageSizes: [10, 20, 50, 100],
    layout: 'total, sizes, prev, pager, next, jumper'
  })

  const isMultiple = computed(() => props.mode === 'multiple')

  const dialogWidth = computed(() => {
    return typeof props.width === 'number' ? `${props.width}px` : props.width
  })

  /** 注入选择列 */
  const effectiveColumns = computed<ColumnOption<any>[]>(() => {
    const cols: ColumnOption<any>[] = []
    if (isMultiple.value) {
      cols.push({ type: 'selection', width: 50, align: 'center' })
    } else {
      cols.push({ type: 'index', width: 50, label: '#', align: 'center' })
    }
    return [...cols, ...props.columns]
  })

  /** 合并外部分页配置 */
  watch(
    () => props.pagination,
    (val) => {
      if (val) {
        Object.assign(pageState.value, val)
      }
    },
    { immediate: true, deep: true }
  )

  /**
   * 打开弹窗
   * @param initialSelected 初始已选项（单选传单条，多选传数组）
   */
  const open = (initialSelected?: any) => {
    if (isMultiple.value) {
      selectedList.value = Array.isArray(initialSelected) ? [...initialSelected] : []
    } else {
      selectedList.value = initialSelected ? [initialSelected] : []
    }
    visible.value = true
    emit('open')
    // 首屏加载
    loadData()
  }

  /** 加载数据 */
  const loadData = async () => {
    if (typeof props.dataSource === 'function') {
      loading.value = true
      try {
        const params: Record<string, any> = {
          ...searchParams.value,
          page: pageState.value.current,
          pageSize: pageState.value.size
        }
        const result = await (
          props.dataSource as (
            params: Record<string, any>
          ) => Promise<{ list: any[]; total: number }>
        )(params)
        tableData.value = result?.list || []
        pageState.value.total = result?.total || 0
      } finally {
        loading.value = false
      }
    } else if (Array.isArray(props.dataSource)) {
      tableData.value = props.dataSource
      pageState.value.total = props.dataSource.length
    }

    // 回显已选
    nextTick(() => {
      if (selectedList.value.length > 0 && artTableRef.value) {
        const tableRef = (artTableRef.value as any)?.elTableRef
        if (tableRef?.toggleRowSelection) {
          selectedList.value.forEach((item) => {
            const key = props.rowKey
            const match = tableData.value.find((row: any) => row[key] === item[key])
            if (match) tableRef.toggleRowSelection(match, true)
          })
        }
      }
    })
  }

  /** 搜索 */
  const handleSearch = (params: Record<string, any>) => {
    searchParams.value = params
    pageState.value.current = 1
    loadData()
  }

  /** 重置搜索 */
  const handleReset = () => {
    searchParams.value = {}
    pageState.value.current = 1
    loadData()
  }

  /** 分页大小变化 */
  const handleSizeChange = (size: number) => {
    pageState.value.size = size
    pageState.value.current = 1
    loadData()
  }

  /** 页码变化 */
  const handleCurrentChange = (current: number) => {
    pageState.value.current = current
    loadData()
  }

  /** 选择变化 */
  const handleSelectionChange = (selection: any[]) => {
    selectedList.value = selection
    emit('selection-change', selection)
  }

  /** 行点击（单选模式下直接选中并确认） */
  const handleRowClick = (row: any) => {
    if (!isMultiple.value) {
      selectedList.value = [row]
      // 单选模式点击行即确认
      handleConfirm()
    }
  }

  /** 清空已选 */
  const handleClearSelected = () => {
    selectedList.value = []
    const tableRef = (artTableRef.value as any)?.elTableRef
    if (tableRef?.clearSelection) {
      tableRef.clearSelection()
    }
    emit('selection-change', [])
  }

  /** 确认 */
  const handleConfirm = () => {
    if (isMultiple.value) {
      emit('update:modelValue', [...selectedList.value])
      emit('confirm', [...selectedList.value])
    } else {
      const val = selectedList.value[0] ?? null
      emit('update:modelValue', val)
      emit('confirm', val)
    }
    visible.value = false
  }

  /** 弹窗关闭 */
  const handleClosed = () => {
    emit('close')
  }

  defineExpose({
    open,
    /** 手动获取已选 */
    getSelected: () =>
      isMultiple.value ? [...selectedList.value] : (selectedList.value[0] ?? null),
    /** 手动清空 */
    clearSelected: handleClearSelected
  })
</script>

<style scoped lang="scss">
  .art-data-select {
    &__selected-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 0 12px;
    }

    &__selected-text {
      font-size: 13px;
      color: var(--el-text-color-regular);
    }

    &__selected-count {
      font-style: normal;
      font-weight: 600;
      color: var(--el-color-primary);
    }

    &__footer {
      display: flex;
      align-items: center;
      justify-content: space-between;

      &-count {
        font-size: 13px;
        color: var(--el-text-color-regular);
      }
    }
  }
</style>
