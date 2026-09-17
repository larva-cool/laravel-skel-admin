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
          :size="14"
          class="art-data-select__arrow"
          :class="{ 'is-open': visible }"
        />
      </div>
    </div>

    <!-- 选择弹窗 -->
    <ElDialog
      v-model="visible"
      :width="dialogWidth"
      :close-on-click-modal="false"
      append-to-body
      destroy-on-close
      class="art-data-select-dialog"
      @closed="handleClosed"
    >
      <template #header="{ close }">
        <div class="art-data-select__header">
          <div class="art-data-select__header-title">
            <span class="art-data-select__title">{{ title }}</span>
            <p v-if="titleTip" class="art-data-select__title-tip">{{ titleTip }}</p>
          </div>
          <div class="art-data-select__header-actions">
            <button
              type="button"
              class="art-data-select__header-btn"
              :class="{ 'is-fullscreen': isFullscreen }"
              @click="toggleFullscreen"
            >
              <art-svg-icon :name="isFullscreen ? 'fullscreen-exit' : 'fullscreen'" :size="16" />
            </button>
            <button type="button" class="art-data-select__header-btn" @click="close">
              <art-svg-icon name="close" :size="16" />
            </button>
          </div>
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
            <art-svg-icon name="search" :size="14" class="art-data-select__search-icon" />
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
          <table class="art-data-select-table">
            <colgroup>
              <col v-if="isMultiple" style="width: 48px" />
              <col v-else style="width: 48px" />
              <col
                v-for="col in columns"
                :key="col.prop"
                :style="{ width: col.width ? `${col.width}px` : undefined }"
              />
            </colgroup>
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
                  :style="{ textAlign: col.align || 'left' }"
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
          <!-- 分页 -->
          <div v-if="showPagination" class="art-data-select__pagination">
            <span class="art-data-select__pagination-total">共 {{ pageState.total }} 条</span>
            <ElPagination
              v-model:current-page="pageState.current"
              v-model:page-size="pageState.size"
              :total="pageState.total"
              :page-sizes="pageSizes"
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
              <div class="art-data-select__selected-icon">
                <art-svg-icon name="file-list-2" :size="16" />
              </div>
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
                @click.stop="handleRemoveSelected(item)"
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
          <span v-else></span>
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
    /** 弹窗宽度，默认 1040px */
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
    width: 1040,
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
  const isFullscreen = ref(false)
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
    isFullscreen.value ? '100%' : typeof props.width === 'number' ? `${props.width}px` : props.width
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

  function toggleFullscreen() {
    isFullscreen.value = !isFullscreen.value
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
    isFullscreen.value = false
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
    isFullscreen.value = false
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

<style lang="scss">
  // ========== 颜色变量（SCSS 编译期替换，不依赖 DOM 位置） ==========
  $ads-border: #e3e8ee;
  $ads-border-light: #eef1f5;
  $ads-text-primary: #4b4f66;
  $ads-text-regular: #636779;
  $ads-text-secondary: #878d9c;
  $ads-text-placeholder: #a5acc2;
  $ads-bg-hover: #f5f7fa;
  $ads-bg-selected: #eff4ff;
  $ads-primary: #377dff;
  $ads-tag-bg: #efeff1;
  $ads-tag-text: #4b5066;
  $ads-radius: 4px;

  // ========== 触发器（在组件内，scoped 也能生效，但为统一管理放这里） ==========
  .art-data-select {
    width: 100%;

    &__trigger {
      position: relative;
      display: flex;
      gap: 8px;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      height: 36px;
      padding: 0 12px;
      cursor: pointer;
      background: #fff;
      border: 1px solid $ads-border;
      border-radius: $ads-radius;
      transition: border-color 0.2s;

      &:hover {
        border-color: $ads-primary;
      }
    }

    &.is-focused &__trigger {
      border-color: $ads-primary;
      box-shadow: 0 0 0 2px rgb(55 125 255 / 15%);
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
      gap: 4px;
      align-items: center;
      min-width: 0;
    }

    &__tag {
      display: inline-flex;
      align-items: center;
      max-width: 160px;
      height: 22px;
      padding: 0 6px;
      font-size: 12px;
      line-height: 22px;
      color: $ads-tag-text;
      background: $ads-tag-bg;
      border-radius: $ads-radius;

      &-text {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      &--more {
        color: $ads-primary;
        background: $ads-bg-selected;
      }
    }

    &__single-text {
      font-size: 14px;
      color: $ads-text-primary;
    }

    &__placeholder {
      font-size: 14px;
      color: $ads-text-placeholder;
    }

    &__suffix {
      display: flex;
      flex-shrink: 0;
      gap: 4px;
      align-items: center;
      color: $ads-text-secondary;
    }

    &__clear {
      display: none;
      align-items: center;
      justify-content: center;
      width: 16px;
      height: 16px;
      padding: 0;
      color: $ads-text-secondary;
      cursor: pointer;
      background: transparent;
      border: none;
      border-radius: 50%;
      transition: color 0.2s;

      &:hover {
        color: $ads-text-regular;
      }
    }

    &__trigger:hover &__clear {
      display: inline-flex;
    }

    &__arrow {
      font-size: 12px;
      transition: transform 0.2s;

      &.is-open {
        transform: rotate(180deg);
      }
    }
  }

  // ========== 弹窗（append-to-body，用类名命名空间隔离） ==========
  .art-data-select-dialog {
    .el-dialog {
      overflow: hidden;
      border-radius: 8px;
    }

    .el-dialog__header {
      display: none;
    }

    .el-dialog__body {
      padding: 0;
      color: $ads-text-primary;
    }

    .el-dialog__footer {
      padding: 12px 20px;
      border-top: 1px solid $ads-border-light;
    }

    // 全屏态
    &.is-fullscreen {
      .el-dialog {
        width: 100vw !important;
        max-width: 100vw !important;
        height: 100vh !important;
        margin: 0 !important;
        border-radius: 0;
      }

      .el-dialog__body {
        height: calc(100vh - 120px);
        overflow: auto;
      }
    }

    // ========== 弹窗头部 ==========
    .art-data-select__header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      padding: 16px 20px;
      border-bottom: 1px solid $ads-border-light;

      &-title {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      &-actions {
        display: flex;
        gap: 8px;
        align-items: center;
      }
    }

    .art-data-select__title {
      font-size: 16px;
      font-weight: 600;
      color: $ads-text-primary;
    }

    .art-data-select__title-tip {
      margin: 0;
      font-size: 12px;
      font-weight: normal;
      color: $ads-text-secondary;
    }

    .art-data-select__header-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      padding: 0;
      color: $ads-text-secondary;
      cursor: pointer;
      background: transparent;
      border: none;
      border-radius: 4px;
      transition: all 0.2s;

      &:hover {
        color: $ads-text-primary;
        background: $ads-bg-hover;
      }
    }

    // ========== 搜索区 ==========
    .art-data-select__search {
      display: grid;
      grid-template-columns: minmax(0, 1fr) 220px;
      gap: 12px;
      padding: 16px 20px;

      .el-input__wrapper {
        border-radius: $ads-radius;
        box-shadow: 0 0 0 1px $ads-border inset;
      }
    }

    .art-data-select__search-icon {
      color: $ads-text-secondary;
    }

    // ========== 主体 ==========
    .art-data-select__body {
      display: grid;
      grid-template-columns: minmax(0, 1fr) 260px;
      gap: 16px;
      padding: 0 20px 16px;

      &.is-single {
        grid-template-columns: 1fr;
      }
    }

    // ========== 表格区 ==========
    .art-data-select__table-wrap {
      display: flex;
      flex-direction: column;
      min-height: 0;
      border: 1px solid $ads-border;
      border-radius: $ads-radius;
    }

    .art-data-select-table {
      width: 100%;
      font-size: 14px;
      table-layout: fixed;
      border-collapse: collapse;

      thead {
        th {
          padding: 12px 16px;
          font-weight: 500;
          color: $ads-text-regular;
          text-align: left;
          background: #fff;
          border-bottom: 1px solid $ads-border;

          &.col-selection {
            width: 48px;
            padding: 12px 0;
            text-align: center;
          }

          &.col-index {
            width: 48px;
            padding: 12px 0;
            color: $ads-text-secondary;
            text-align: center;
          }
        }
      }

      tbody {
        td {
          padding: 12px 16px;
          overflow: hidden;
          color: $ads-text-primary;
          text-overflow: ellipsis;
          white-space: nowrap;
          border-bottom: 1px solid $ads-border-light;

          &.col-selection {
            padding: 12px 0;
            text-align: center;
          }

          &.col-index {
            padding: 12px 0;
            color: $ads-text-secondary;
            text-align: center;
          }
        }

        tr:last-child td {
          border-bottom: none;
        }

        .art-data-select-row {
          cursor: pointer;
          transition: background-color 0.15s;

          &:hover {
            background: $ads-bg-hover;
          }

          &.is-selected {
            background: $ads-bg-selected;
          }

          &.is-single-active {
            background: $ads-bg-selected;
          }
        }

        .art-data-select-empty {
          td {
            padding: 40px 0;
            text-align: center;
            border-bottom: none;
          }
        }
      }
    }

    // 分页
    .art-data-select__pagination {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 12px;
      border-top: 1px solid $ads-border-light;

      &-total {
        font-size: 12px;
        color: $ads-text-secondary;
      }

      .el-pagination {
        justify-content: flex-end;

        .el-pager li {
          min-width: 24px;
          height: 24px;
          font-size: 12px;
          line-height: 24px;
          border-radius: 4px;
        }

        .btn-prev,
        .btn-next {
          width: 24px;
          height: 24px;
          line-height: 24px;
        }

        .el-pagination__sizes .el-input .el-input__wrapper {
          height: 24px;
        }
      }
    }

    // ========== 已选面板 ==========
    .art-data-select__selected-panel {
      display: flex;
      flex-direction: column;
      min-height: 348px;
      overflow: hidden;
      border: 1px solid $ads-border;
      border-radius: $ads-radius;
    }

    .art-data-select__selected-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 16px;
      font-size: 14px;
      font-weight: 500;
      color: $ads-text-primary;
      background: #fff;
      border-bottom: 1px solid $ads-border;

      em {
        font-style: normal;
        font-weight: 600;
        color: $ads-primary;
      }
    }

    .art-data-select__selected-clear {
      padding: 0;
      font-size: 12px;
      color: $ads-primary;
      cursor: pointer;
      background: none;
      border: none;

      &:disabled {
        color: $ads-text-placeholder;
        cursor: not-allowed;
      }

      &:hover:not(:disabled) {
        text-decoration: underline;
      }
    }

    .art-data-select__selected-list {
      flex: 1;
      overflow-y: auto;
    }

    .art-data-select__selected-item {
      display: flex;
      gap: 12px;
      align-items: flex-start;
      padding: 12px 16px;
      border-bottom: 1px solid $ads-border-light;
      transition: background-color 0.15s;

      &:last-child {
        border-bottom: none;
      }

      &:hover {
        background: $ads-bg-hover;
      }
    }

    .art-data-select__selected-icon {
      display: inline-flex;
      flex-shrink: 0;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      margin-top: 2px;
      color: $ads-primary;
      background: $ads-bg-selected;
      border-radius: $ads-radius;
    }

    .art-data-select__selected-info {
      flex: 1;
      min-width: 0;
    }

    .art-data-select__selected-name {
      overflow: hidden;
      font-size: 13px;
      font-weight: 500;
      color: $ads-text-primary;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .art-data-select__selected-sub {
      margin-top: 2px;
      font-size: 12px;
      color: $ads-text-secondary;
    }

    .art-data-select__selected-remove {
      display: inline-flex;
      flex-shrink: 0;
      align-items: center;
      justify-content: center;
      width: 20px;
      height: 20px;
      padding: 0;
      margin-top: 6px;
      color: $ads-text-secondary;
      cursor: pointer;
      background: transparent;
      border: none;
      border-radius: 4px;
      opacity: 0;
      transition: all 0.2s;

      &:hover {
        color: var(--el-color-danger);
        background: var(--el-color-danger-light-9);
      }
    }

    .art-data-select__selected-item:hover .art-data-select__selected-remove {
      opacity: 1;
    }

    .art-data-select__selected-empty {
      padding: 40px 0;
      font-size: 12px;
      color: $ads-text-placeholder;
      text-align: center;
    }

    // ========== 底部 ==========
    .art-data-select__footer {
      display: flex;
      align-items: center;
      justify-content: space-between;

      &-count {
        font-size: 13px;
        color: $ads-text-regular;

        em {
          font-style: normal;
          font-weight: 600;
          color: $ads-primary;
        }
      }

      &-actions {
        display: flex;
        gap: 8px;
      }
    }
  }
</style>
