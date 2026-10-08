<!-- 轻量 Cron 表达式选择器（标准五段式：分 时 日 月 周） -->
<template>
  <div class="art-cron-picker">
    <ElTabs v-model="activeField" type="border-card">
      <ElTabPane v-for="field in fields" :key="field.key" :name="field.key">
        <template #label>
          <span class="tab-label">{{ field.name }}</span>
        </template>

        <div class="tab-body">
          <!-- 任意 -->
          <div class="cron-row">
            <ElRadio v-model="config[field.key].mode" :value="'every'">
              每{{ field.unit }}都执行
            </ElRadio>
          </div>

          <!-- 周期增量：从 start 开始，每 increment -->
          <div class="cron-row">
            <ElRadio v-model="config[field.key].mode" :value="'increment'">
              <span class="mr-1">从</span>
              <ElInputNumber
                v-model="config[field.key].start"
                :min="field.min"
                :max="field.max"
                size="small"
                controls-position="right"
                class="w-110"
              />
              <span class="mx-1">{{ field.unit }}开始，每</span>
              <ElInputNumber
                v-model="config[field.key].increment"
                :min="1"
                :max="field.max"
                size="small"
                controls-position="right"
                class="w-100"
              />
              <span class="ml-1">{{ field.unit }}执行一次</span>
            </ElRadio>
          </div>

          <!-- 指定值多选 -->
          <div class="cron-row">
            <ElRadio v-model="config[field.key].mode" :value="'specific'" class="w-full">
              <span class="mr-1">指定{{ field.unit }}（可多选）</span>
              <ElSelect
                v-model="config[field.key].specific"
                multiple
                collapse-tags
                collapse-tags-tooltip
                size="small"
                class="w-300 align-middle"
              >
                <ElOption
                  v-for="opt in field.options"
                  :key="opt.value"
                  :label="opt.label"
                  :value="opt.value"
                />
              </ElSelect>
            </ElRadio>
          </div>

          <!-- 区间范围 -->
          <div class="cron-row">
            <ElRadio v-model="config[field.key].mode" :value="'range'">
              <span class="mr-1">从</span>
              <ElInputNumber
                v-model="config[field.key].rangeStart"
                :min="field.min"
                :max="field.max"
                size="small"
                controls-position="right"
                class="w-110"
              />
              <span class="mx-1">到</span>
              <ElInputNumber
                v-model="config[field.key].rangeEnd"
                :min="field.min"
                :max="field.max"
                size="small"
                controls-position="right"
                class="w-110"
              />
              <span class="ml-1">{{ field.unit }}之间执行</span>
            </ElRadio>
          </div>
        </div>
      </ElTabPane>
    </ElTabs>

    <!-- 结果预览 -->
    <div class="cron-result">
      <code>{{ resultExpr }}</code>
    </div>
  </div>
</template>

<script setup lang="ts">
  defineOptions({ name: 'ArtCronPicker' })

  const props = defineProps<{
    /** 初始表达式 */
    modelValue?: string
  }>()

  // ===== 字段定义 =====
  interface FieldOption {
    label: string
    value: number | string
  }

  interface FieldDef {
    key: string
    name: string
    unit: string
    min: number
    max: number
    options: FieldOption[]
  }

  /** 生成数字区间选项 */
  function numberOptions(min: number, max: number): FieldOption[] {
    const list: FieldOption[] = []
    for (let i = min; i <= max; i++) {
      list.push({ label: String(i), value: i })
    }

    return list
  }

  const weekOptions: FieldOption[] = [
    { label: '周一', value: 1 },
    { label: '周二', value: 2 },
    { label: '周三', value: 3 },
    { label: '周四', value: 4 },
    { label: '周五', value: 5 },
    { label: '周六', value: 6 },
    { label: '周日', value: 0 }
  ]

  const fields: FieldDef[] = [
    { key: 'minute', name: '分钟', unit: '分钟', min: 0, max: 59, options: numberOptions(0, 59) },
    { key: 'hour', name: '小时', unit: '小时', min: 0, max: 23, options: numberOptions(0, 23) },
    { key: 'day', name: '日', unit: '日', min: 1, max: 31, options: numberOptions(1, 31) },
    { key: 'month', name: '月', unit: '月', min: 1, max: 12, options: numberOptions(1, 12) },
    { key: 'week', name: '周', unit: '星期', min: 0, max: 6, options: weekOptions }
  ]

  // ===== 每个字段的配置 =====
  type FieldMode = 'every' | 'increment' | 'specific' | 'range'

  interface FieldConfig {
    mode: FieldMode
    start: number
    increment: number
    specific: Array<number | string>
    rangeStart: number
    rangeEnd: number
  }

  function defaultConfig(key: string): FieldConfig {
    const dayLike = key === 'day' || key === 'month'

    return {
      mode: 'every',
      start: dayLike ? 1 : 0,
      increment: 1,
      specific: [],
      rangeStart: dayLike ? 1 : 0,
      rangeEnd: dayLike ? 1 : 1
    }
  }

  const config = reactive<Record<string, FieldConfig>>(
    Object.fromEntries(fields.map((f) => [f.key, defaultConfig(f.key)]))
  )

  const activeField = ref('minute')

  // ===== 单字段表达式生成 =====
  function buildFieldExpr(key: string): string {
    const c = config[key]

    switch (c.mode) {
      case 'every':
        return '*'
      case 'increment':
        return `${c.start}/${c.increment}`
      case 'specific': {
        const values = [...c.specific].sort((a, b) => Number(a) - Number(b))

        return values.length ? values.join(',') : '*'
      }
      case 'range':
        return `${c.rangeStart}-${c.rangeEnd}`
      default:
        return '*'
    }
  }

  // ===== 完整表达式 =====
  const resultExpr = computed(() => fields.map((f) => buildFieldExpr(f.key)).join(' '))

  // ===== 从传入表达式解析回填 =====
  function parseExpression(expr: string): void {
    const parts = expr.trim().split(/\s+/)
    if (parts.length !== 5) return

    fields.forEach((field, index) => {
      const token = parts[index]
      const c = defaultConfig(field.key)

      if (token === '*') {
        c.mode = 'every'
      } else if (token.includes('/')) {
        const [start, inc] = token.split('/')
        c.mode = 'increment'
        c.start = Number(start) || 0
        c.increment = Number(inc) || 1
      } else if (token.includes('-')) {
        const [start, end] = token.split('-')
        c.mode = 'range'
        c.rangeStart = Number(start) || 0
        c.rangeEnd = Number(end) || 0
      } else if (token.includes(',')) {
        c.mode = 'specific'
        c.specific = token.split(',').map((v) => {
          return field.key === 'week' && Number.isNaN(Number(v)) ? v : Number(v)
        })
      } else if (token !== '') {
        c.mode = 'specific'
        c.specific = [field.key === 'week' && Number.isNaN(Number(token)) ? token : Number(token)]
      }

      config[field.key] = c
    })
  }

  watchEffect(() => {
    if (props.modelValue) {
      parseExpression(props.modelValue)
    }
  })

  defineExpose({
    /** 获取当前生成的表达式 */
    getExpression: () => resultExpr.value
  })
</script>

<style scoped lang="scss">
  .art-cron-picker {
    font-size: 14px;
  }

  .tab-label {
    padding: 0 2px;
  }

  .tab-body {
    min-height: 200px;
    padding: 4px 8px;
  }

  .cron-row {
    margin: 14px 0;

    :deep(.el-radio) {
      align-items: center;
      height: auto;
      white-space: normal;
    }

    :deep(.el-radio__label) {
      display: inline-flex;
      flex-wrap: wrap;
      align-items: center;
    }
  }

  .cron-result {
    padding: 12px;
    margin-top: 14px;
    text-align: center;
    background: var(--el-fill-color-light);
    border-radius: 4px;

    code {
      font-family: var(--el-font-family-monospace, monospace);
      font-size: 16px;
      color: var(--el-color-primary);
    }
  }
</style>
