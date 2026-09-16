<!--
  ArtDataSelect 数据选择器
  参考 Art Design Pro X 设计：触发器类 Select 输入框 + 弹窗左侧表格 / 右侧已选面板
  支持表格多选 / 表格单选，带搜索、筛选、分页、已选管理
-->
<template>
  <div class="art-data-select" :class="{ 'is-focused': visible, 'is-disabled': disabled }">
    <!-- 触发器：类 Select 输入框 -->
    <div class="art-data-select__trigger" @click="handleTriggerClick">
      <div class="art-data-select__tags">
        <template v-if="isMultiple">
          <template v-if="displayTags.length">
            <span v-for="tag in displayTags" :key="tag[rowKey]" class="art-data-select__tag">
              <span class="art-data-select__tag-text">{{ getTagLabel(tag) }}</span>
            </span>
            <span v-if="hiddenCount > 0" class="art-data-select__tag art-data-select__tag--more">
              +{{ hiddenCount }}
            </span>
          </template>
          <span v-else class="art-data-select__placeholder">{{ placeholder }}</span>
        </template>
        <template v-else>
          <span v-if="singleValue" class="art-data-select__single-text">
            {{ getTagLabel(singleValue) }}
          </span>
          <span v-else class="art-data-select__placeholder">{{ placeholder }}</span>
        </template>
      </div>
      <div class="art-data-select__suffix">
        <button
          v-if="hasClearable && !disabled"
          type="button"
          class="art-data-select__clear"
          @click.stop="handleClear"
        >
          <art-svg-icon name="close-circle" :size="14" />
        </button>
        <art-svg-icon
          name="arrow-down-s"
          :size="16"
          class="art-data-select__arrow"
          :class="{ 'is-open': visible }"
        />
      </div>
    </div>

    <!-- 选择弹窗 -->
    <ElDialog
      v-model="visible"
      :title="title"
      :width="dialogWidth"
      :close-on-click-modal="false"
      append-to-body
      destroy-on-close
      class="art-data-select-dialog"
      @closed="handleClosed"
    >
      <template v-if="titleTip" #title>
        <div class="art-data-select__title-wrap">
          <span>{{ title }}</span>
          <p class="art-data-select__title-tip">{{ titleTip }}</p>
        </div>
      </template>

      <!-- 搜索筛选区 -->
      <div class="art-data-select__search">
        <ElInput
          v-model="keyword"
          placeholder="请输入关键词"
          clearable
          class="art-data-select__search-input"
          @keyup.enter="handleSearchSubmit"
          @clear="handleSearchSubmit"
        >
          <template #prefix>
            <art-svg-icon name="search" :size="16" class="text-gray-400" />
          </template>
        </ElInput>
        <ElSelect
          v-if="filterOptions?.length"
          v-model="filterValue"
          placeholder="请选择分类"
          clearable
          class="art-data-select__search-filter"
          @change="handleSearchSubmit"
        >
          <ElOption
            v-for="opt in filterOptions"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          />
        </ElSelect>
      </div>

      <!-- 主体：左侧表格 + 右侧已选 -->
      <div class="art-data-select__body" :class="{ 'is-single': !isMultiple }">
        <!-- 表格区 -->
        <div class="art-data-select__table-wrap">
          <div class="art-data-select__table-scroll">
            <table class="art-data-select-table">
              <thead>
                <tr>
                  <th v-if="isMultiple" class="col-selection">
                    <ElCheckbox
                      :model-value="isAllSelected"
                      :indeterminate="isIndeterminate"
                      :disabled="!tableData.length"
                      @change="handleToggleAll"
                    />
                  </th>
                  <th v-else class="col-index">#</th>
                  <th
                    v-for="col in columns"
                    :key="col.prop"
                    :style="{
                      width: col.width ? `${col.width}px` : undefined,
                      textAlign: col.align || 'left'
                    }"
                  >
                    {{ col.label }}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(row, idx) in tableData"
                  :key="row[rowKey]"
                  class="art-data-select-row"
                  :class="{
                    'is-selected': isRowSelected(row),
                    'is-single-active': !isMultiple && isRowSelected(row)
                  }"
                  @click="handleRowClick(row)"
                >
                  <td v-if="isMultiple" class="col-selection" @click.stop>
                    <ElCheckbox
                      :model-value="isRowSelected(row)"
                      :disabled="isRowDisabled(row)"
                      @change="(val: any) => handleToggleRow(row, !!val)"
                    />
                  </td>
                  <td v-else class="col-index">
                    {{ (pageState.current - 1) * pageState.size + idx + 1 }}
                  </td>
                  <td
                    v-for="col in columns"
                    :key="col.prop"
                    :style="{ textAlign: col.align || 'left' }"
                  >
                    <template v-if="col.formatter">
                      {{ col.formatter(row) }}
                    </template>
                    <template v-else>{{ row[col.prop!] }}</template>
                  </td>
                </tr>
                <tr v-if="!tableData.length && !loading" class="art-data-select-empty">
                  <td :colspan="columns.length + 1">
                    <ElEmpty description="暂无数据" :image-size="80" />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <!-- 分页 -->
          <div v-if="showPagination" class="art-data-select__pagination">
            <span class="art-data-select__pagination-total">共 {{ pageState.total }} 条</span>
            <ElPagination
              v-model:current-page="pageState.current"
              v-model:page-size="pageState.size"
              :total="pageState.total"
              :page-sizes="pageSizes"
              background
              small
              layout="prev, pager, next, sizes"
              @current-change="handleCurrentChange"
              @size-change="handleSizeChange"
            />
          </div>
        </div>

        <!-- 已选面板（仅多选） -->
        <div v-if="isMultiple" class="art-data-select__selected-panel">
          <div class="art-data-select__selected-header">
            <span class="art-data-select__selected-title">
              已选 <em>{{ selectedList.length }}</em>
            </span>
            <button
              type="button"
              class="art-data-select__selected-clear"
              :disabled="!selectedList.length"
              @click="handleClearSelected"
            >
              清空
            </button>
          </div>
          <div class="art-data-select__selected-list">
            <div
              v-for="item in selectedList"
              :key="item[rowKey]"
              class="art-data-select__selected-item"
            >
              <div class="art-data-select__selected-info">
                <div class="art-data-select__selected-name">{{ getTagLabel(item) }}</div>
                <div
                  v-if="selectedSubLabelProp && item[selectedSubLabelProp]"
                  class="art-data-select__selected-sub"
                >
                  {{ item[selectedSubLabelProp] }}
                </div>
              </div>
              <button
                type="button"
                class="art-data-select__selected-remove"
                @click="handleRemoveSelected(item)"
              >
                <art-svg-icon name="close" :size="14" />
              </button>
            </div>
            <div v-if="!selectedList.length" class="art-data-select__selected-empty">
              暂无已选项
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="art-data-select__footer">
          <span v-if="isMultiple" class="art-data-select__footer-count">
            当前已选择 <em>{{ selectedList.length }}</em> 项
          </span>
          <div class="art-data-select__footer-actions">
            <ElButton @click="handleCancel">取消</ElButton>
            <ElButton type="primary" :disabled="loading" @click="handleConfirm">确定</ElButton>
          </div>
        </div>
      </template>
    </ElDialog>
  </div>
</template>

<script setup lang="ts">
  import { computed, nextTick, ref, watch } from 'vue'
  import type { ColumnOption } from '@/types/component'

  defineOptions({ name: 'ArtDataSelect' })

  /** 筛选选项 */
  export interface DataSelectFilterOption {
    label: string
    value: string | number
  }

  /** Props */
  export interface ArtDataSelectProps<T = Record<string, any>> {
    /** 弹窗标题 */
    title?: string
    /** 标题下方说明文字 */
    titleTip?: string
    /** 弹窗宽度，默认 900px */
    width?: string | number
    /** 选择模式：single 单选 / multiple 多选，默认 multiple */
    mode?: 'single' | 'multiple'
    /** 行唯一标识字段，默认 id */
    rowKey?: string
    /** 表格列配置 */
    columns: ColumnOption<T>[]
    /** 显示在 tag / 已选面板中的 label 字段，默认取第一列 prop */
    labelProp?: string
    /** 已选面板副标签字段（如企业编码） */
    selectedSubLabelProp?: string
    /** 数据源：静态数据数组或异步加载函数 */
    dataSource?:
      | T[]
      | ((params: Record<string, any>) => Promise<{
          list: T[]
          total: number
        }>)
    /** 是否显示分页，默认 true */
    showPagination?: boolean
    /** 分页大小可选值 */
    pageSizes?: number[]
    /** 分类筛选选项 */
    filterOptions?: DataSelectFilterOption[]
    /** 筛选字段名，默认 category */
    filterField?: string
    /** 触发器占位符 */
    placeholder?: string
    /** 是否可清空 */
    clearable?: boolean
    /** 是否禁用 */
    disabled?: boolean
    /** 已选值（v-model） */
    modelValue?: T | T[] | null
    /** 判断行是否禁用的函数 */
    rowDisabled?: (row: T) => boolean
  }

  const props = withDefaults(defineProps<ArtDataSelectProps>(), {
    title: '请选择',
    titleTip: '',
    width: 900,
    mode: 'multiple',
    rowKey: 'id',
    showPagination: true,
    pageSizes: () => [10, 20, 50],
    clearable: true,
    disabled: false,
    filterField: 'category'
  })

  const emit = defineEmits<{
    (e: 'update:modelValue', val: any): void
    (e: 'confirm', selected: any): void
    (e: 'selection-change', selected: any): void
    (e: 'open'): void
    (e: 'close'): void
    (e: 'cancel'): void
  }>()

  // ========== 状态 ==========
  const visible = ref(false)
  const loading = ref(false)
  const tableData = ref<any[]>([])
  /** 已选项（跨页持久化保存） */
  const selectedList = ref<any[]>([])
  const keyword = ref('')
  const filterValue = ref<string | number | undefined>(undefined)
  const pageState = ref({
    current: 1,
    size: 10,
    total: 0
  })
  /** 打开弹窗时的初始值快照，取消时回滚 */
  let snapshotSelected: any[] = []
  let confirmed = false

  // ========== 计算属性 ==========
  const isMultiple = computed(() => props.mode === 'multiple')

  const dialogWidth = computed(() =>
    typeof props.width === 'number' ? `${props.width}px` : props.width
  )

  const labelKey = computed(() => props.labelProp || props.columns[0]?.prop || 'name')

  const hasClearable = computed(() => {
    if (!props.clearable) return false
    if (isMultiple.value) return selectedList.value.length > 0
    return !!selectedList.value[0]
  })

  const singleValue = computed(() => selectedList.value[0] || null)

  /** 触发器展示的 tag（最多显示 2 个） */
  const displayTags = computed(() => selectedList.value.slice(0, 2))
  const hiddenCount = computed(() => Math.max(0, selectedList.value.length - 2))

  const placeholder = computed(() => props.placeholder || '请选择')

  /** 当前页是否全部选中 */
  const isAllSelected = computed(() => {
    if (!tableData.value.length) return false
    const selectable = tableData.value.filter((r) => !isRowDisabled(r))
    if (!selectable.length) return false
    return selectable.every((row) => isRowSelected(row))
  })

  const isIndeterminate = computed(() => {
    const selectable = tableData.value.filter((r) => !isRowDisabled(r))
    const selectedCount = selectable.filter((r) => isRowSelected(r)).length
    return selectedCount > 0 && selectedCount < selectable.length
  })

  // ========== 方法 ==========
  function getTagLabel(row: any): string {
    return row?.[labelKey.value] ?? row?.name ?? String(row?.[props.rowKey] ?? '')
  }

  function isRowSelected(row: any): boolean {
    return selectedList.value.some((item) => item[props.rowKey] === row[props.rowKey])
  }

  function isRowDisabled(row: any): boolean {
    return props.rowDisabled ? props.rowDisabled(row) : false
  }

  /** 加载数据 */
  async function loadData() {
    if (typeof props.dataSource === 'function') {
      loading.value = true
      try {
        const params: Record<string, any> = {
          keyword: keyword.value,
          [props.filterField]: filterValue.value,
          page: pageState.value.current,
          pageSize: pageState.value.size
        }
        const result = await props.dataSource(params)
        tableData.value = result?.list || []
        pageState.value.total = result?.total || 0
      } finally {
        loading.value = false
      }
    } else if (Array.isArray(props.dataSource)) {
      tableData.value = props.dataSource
      pageState.value.total = props.dataSource.length
    }
  }

  /** 打开弹窗 */
  function open(initialSelected?: any) {
    if (isMultiple.value) {
      selectedList.value = Array.isArray(initialSelected) ? [...initialSelected] : []
    } else {
      selectedList.value = initialSelected ? [initialSelected] : []
    }
    snapshotSelected = [...selectedList.value]
    confirmed = false
    keyword.value = ''
    filterValue.value = undefined
    pageState.value.current = 1
    visible.value = true
    emit('open')
    nextTick(() => loadData())
  }

  /** 触发器点击 */
  function handleTriggerClick() {
    if (props.disabled) return
    if (visible.value) return
    open(props.modelValue ?? undefined)
  }

  /** 清空选择 */
  function handleClear() {
    selectedList.value = []
    emit('update:modelValue', isMultiple.value ? [] : null)
    emit('selection-change', isMultiple.value ? [] : null)
  }

  /** 搜索提交 */
  function handleSearchSubmit() {
    pageState.value.current = 1
    loadData()
  }

  /** 分页大小变化 */
  function handleSizeChange(size: number) {
    pageState.value.size = size
    pageState.value.current = 1
    loadData()
  }

  /** 页码变化 */
  function handleCurrentChange(current: number) {
    pageState.value.current = current
    loadData()
  }

  /** 行点击 */
  function handleRowClick(row: any) {
    if (isRowDisabled(row)) return
    if (isMultiple.value) {
      handleToggleRow(row, !isRowSelected(row))
    } else {
      // 单选：点击行直接选中并确认
      selectedList.value = [row]
      handleConfirm()
    }
  }

  /** 切换单行选中 */
  function handleToggleRow(row: any, val: boolean) {
    if (isRowDisabled(row)) return
    const key = props.rowKey
    if (val) {
      if (!isMultiple.value) {
        selectedList.value = [row]
      } else if (!selectedList.value.some((i) => i[key] === row[key])) {
        selectedList.value.push(row)
      }
    } else {
      selectedList.value = selectedList.value.filter((i) => i[key] !== row[key])
    }
    emit(
      'selection-change',
      isMultiple.value ? [...selectedList.value] : (selectedList.value[0] ?? null)
    )
  }

  /** 切换全选 */
  function handleToggleAll(val: any) {
    const checked = !!val
    const key = props.rowKey
    if (checked) {
      const toAdd = tableData.value.filter((r) => !isRowDisabled(r) && !isRowSelected(r))
      selectedList.value = [...selectedList.value, ...toAdd]
    } else {
      const currentKeys = new Set(
        tableData.value.filter((r) => !isRowDisabled(r)).map((r) => r[key])
      )
      selectedList.value = selectedList.value.filter((i) => !currentKeys.has(i[key]))
    }
    emit('selection-change', [...selectedList.value])
  }

  /** 移除单个已选项 */
  function handleRemoveSelected(item: any) {
    selectedList.value = selectedList.value.filter((i) => i[props.rowKey] !== item[props.rowKey])
    emit('selection-change', [...selectedList.value])
  }

  /** 清空已选 */
  function handleClearSelected() {
    selectedList.value = []
    emit('selection-change', [])
  }

  /** 取消 */
  function handleCancel() {
    // 回滚到打开时的状态
    selectedList.value = [...snapshotSelected]
    confirmed = false
    emit('cancel')
    visible.value = false
  }

  /** 确认 */
  function handleConfirm() {
    confirmed = true
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

  /** 弹窗关闭（非取消/确认触发，如 ESC、遮罩点击） */
  function handleClosed() {
    if (!confirmed) {
      // 未确认则回滚内部状态（不回写 v-model，保持 v-model 为上次确认值）
      selectedList.value = [...snapshotSelected]
    }
    emit('close')
  }

  // 监听 v-model 变化，同步内部状态
  watch(
    () => props.modelValue,
    (val) => {
      if (isMultiple.value) {
        selectedList.value = Array.isArray(val) ? [...val] : []
      } else {
        selectedList.value = val ? [val] : []
      }
    },
    { immediate: true, deep: true }
  )

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
    width: 100%;

    &__trigger {
      position: relative;
      display: flex;
      gap: 8px;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      min-height: 36px;
      padding: 4px 12px;
      cursor: pointer;
      background: var(--el-bg-color);
      border: 1px solid var(--el-border-color);
      border-radius: var(--el-border-radius-base);
      transition:
        border-color 0.2s,
        box-shadow 0.2s;

      &:hover {
        border-color: var(--el-color-primary-light-5);
      }
    }

    &.is-focused &__trigger {
      border-color: var(--el-color-primary);
      box-shadow: 0 0 0 2px rgb(64 158 255 / 20%);
    }

    &.is-disabled &__trigger {
      cursor: not-allowed;
      background: var(--el-disabled-bg-color);
      opacity: 0.6;
    }

    &__tags {
      display: flex;
      flex: 1;
      flex-wrap: wrap;
      gap: 6px;
      align-items: center;
      min-width: 0;
    }

    &__tag {
      display: inline-flex;
      align-items: center;
      max-width: 160px;
      padding: 2px 6px;
      font-size: 12px;
      line-height: 1.5;
      color: var(--el-text-color-regular);
      background: var(--el-fill-color-light);
      border-radius: 4px;

      &-text {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      &--more {
        color: var(--el-color-primary);
        background: var(--el-color-primary-light-9);
      }
    }

    &__single-text {
      font-size: 14px;
      color: var(--el-text-color-regular);
    }

    &__placeholder {
      font-size: 14px;
      color: var(--el-text-color-placeholder);
    }

    &__suffix {
      display: flex;
      gap: 4px;
      align-items: center;
      color: var(--el-text-color-secondary);
    }

    &__clear {
      display: none;
      align-items: center;
      justify-content: center;
      width: 16px;
      height: 16px;
      padding: 0;
      color: var(--el-text-color-secondary);
      cursor: pointer;
      background: transparent;
      border: none;
      border-radius: 50%;
      transition: color 0.2s;

      &:hover {
        color: var(--el-text-color-regular);
      }
    }

    &__trigger:hover &__clear {
      display: inline-flex;
    }

    &__arrow {
      transition: transform 0.2s;

      &.is-open {
        transform: rotate(180deg);
      }
    }
  }

  // ========== 弹窗样式 ==========
  .art-data-select-dialog {
    .el-dialog__body {
      padding-top: 12px;
      padding-bottom: 12px;
    }

    .el-dialog__footer {
      padding-top: 12px;
      padding-bottom: 12px;
    }
  }

  .art-data-select__title-wrap {
    display: flex;
    flex-direction: column;
    gap: 4px;

    > span {
      font-size: 16px;
      font-weight: 600;
      color: var(--el-text-color-primary);
    }
  }

  .art-data-select__title-tip {
    margin: 0;
    font-size: 12px;
    font-weight: normal;
    color: var(--el-text-color-secondary);
  }

  .art-data-select__search {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 220px;
    gap: 12px;
    margin-bottom: 16px;

    &-input {
      width: 100%;
    }

    &-filter {
      width: 100%;
    }
  }

  .art-data-select__body {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 260px;
    gap: 16px;
    min-height: 380px;

    &.is-single {
      grid-template-columns: 1fr;
    }
  }

  // 表格区
  .art-data-select__table-wrap {
    display: flex;
    flex-direction: column;
    min-height: 0;
    border: 1px solid var(--el-border-color-lighter);
    border-radius: var(--el-border-radius-base);
  }

  .art-data-select__table-scroll {
    flex: 1;
    max-height: 400px;
    overflow-y: auto;
  }

  .art-data-select-table {
    width: 100%;
    font-size: 13px;
    table-layout: fixed;
    border-spacing: 0;
    border-collapse: separate;

    thead {
      position: sticky;
      top: 0;
      z-index: 1;
      background: var(--el-fill-color-light);

      th {
        padding: 10px 12px;
        font-weight: 600;
        color: var(--el-text-color-primary);
        text-align: left;
        border-bottom: 1px solid var(--el-border-color-lighter);

        &.col-selection {
          width: 44px;
          text-align: center;
        }

        &.col-index {
          width: 44px;
          color: var(--el-text-color-secondary);
          text-align: center;
        }
      }
    }

    tbody {
      td {
        padding: 10px 12px;
        overflow: hidden;
        color: var(--el-text-color-regular);
        text-overflow: ellipsis;
        white-space: nowrap;
        border-bottom: 1px solid var(--el-border-color-lighter);

        &.col-selection {
          text-align: center;
        }

        &.col-index {
          color: var(--el-text-color-secondary);
          text-align: center;
        }
      }

      .art-data-select-row {
        cursor: pointer;
        transition: background-color 0.15s;

        &:hover {
          background: var(--el-fill-color-light);
        }

        &.is-selected {
          background: var(--el-color-primary-light-9);
        }

        &.is-single-active {
          background: var(--el-color-primary-light-9);
        }
      }

      .art-data-select-empty {
        td {
          padding: 40px 0;
          text-align: center;
        }
      }
    }
  }

  .art-data-select__pagination {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 12px;
    border-top: 1px solid var(--el-border-color-lighter);

    &-total {
      font-size: 12px;
      color: var(--el-text-color-secondary);
    }

    .el-pagination {
      justify-content: flex-end;
    }
  }

  // 已选面板
  .art-data-select__selected-panel {
    display: flex;
    flex-direction: column;
    min-height: 0;
    border: 1px solid var(--el-border-color-lighter);
    border-radius: var(--el-border-radius-base);
  }

  .art-data-select__selected-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 12px;
    font-size: 13px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    border-bottom: 1px solid var(--el-border-color-lighter);

    em {
      font-style: normal;
      color: var(--el-color-primary);
    }
  }

  .art-data-select__selected-clear {
    padding: 0;
    font-size: 12px;
    color: var(--el-color-primary);
    cursor: pointer;
    background: none;
    border: none;

    &:disabled {
      color: var(--el-text-color-placeholder);
      cursor: not-allowed;
    }

    &:hover:not(:disabled) {
      text-decoration: underline;
    }
  }

  .art-data-select__selected-list {
    flex: 1;
    max-height: 400px;
    overflow-y: auto;
  }

  .art-data-select__selected-item {
    display: flex;
    gap: 8px;
    align-items: center;
    padding: 8px 12px;
    border-bottom: 1px solid var(--el-border-color-lighter);

    &:last-child {
      border-bottom: none;
    }
  }

  .art-data-select__selected-info {
    flex: 1;
    min-width: 0;
  }

  .art-data-select__selected-name {
    overflow: hidden;
    font-size: 13px;
    color: var(--el-text-color-primary);
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .art-data-select__selected-sub {
    margin-top: 2px;
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }

  .art-data-select__selected-remove {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    padding: 0;
    color: var(--el-text-color-secondary);
    cursor: pointer;
    background: transparent;
    border: none;
    border-radius: 4px;
    transition: all 0.2s;

    &:hover {
      color: var(--el-color-danger);
      background: var(--el-color-danger-light-9);
    }
  }

  .art-data-select__selected-empty {
    padding: 40px 0;
    font-size: 12px;
    color: var(--el-text-color-placeholder);
    text-align: center;
  }

  // 底部
  .art-data-select__footer {
    display: flex;
    align-items: center;
    justify-content: space-between;

    &-count {
      font-size: 13px;
      color: var(--el-text-color-regular);

      em {
        font-style: normal;
        font-weight: 600;
        color: var(--el-color-primary);
      }
    }

    &-actions {
      display: flex;
      gap: 8px;
    }
  }
</style>
