<!-- 轻量 Cron 表达式选择器（标准五段式：分 时 日 月 周） -->
<template>
  <div class="art-cron-picker">
    <ElTabs v-model="activeTab">
      <!-- 常用预设 -->
      <ElTabPane label="常用预设" name="preset">
        <ElRadioGroup v-model="presetValue" class="cron-options">
          <ElRadio
            v-for="item in presets"
            :key="item.value"
            :value="item.value"
            class="cron-option"
          >
            {{ item.label }}
            <span class="cron-expr">{{ item.value }}</span>
          </ElRadio>
        </ElRadioGroup>
      </ElTabPane>

      <!-- 周期触发 -->
      <ElTabPane label="周期触发" name="cycle">
        <ElForm label-width="80px" label-position="left" class="cron-form">
          <ElFormItem label="触发周期">
            <ElSelect v-model="cycleUnit" class="w-160">
              <ElOption
                v-for="item in cycleUnits"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </ElSelect>
          </ElFormItem>

          <!-- 每 N 分钟（仅工作时段可选） -->
          <ElFormItem label="间隔">
            <ElInputNumber
              v-model="cycleInterval"
              :min="1"
              :max="cycleMax"
              controls-position="right"
            />
          </ElFormItem>

          <template v-if="cycleUnit === 'minute' || cycleUnit === 'hour'">
            <ElFormItem label="生效时段">
              <div class="flex items-center">
                <ElTimePicker
                  v-model="cycleStart"
                  format="HH:mm"
                  value-format="HH:mm"
                  placeholder="开始"
                  class="w-110"
                />
                <span class="mx-2 text-g-500">至</span>
                <ElTimePicker
                  v-model="cycleEnd"
                  format="HH:mm"
                  value-format="HH:mm"
                  placeholder="结束"
                  class="w-110"
                />
              </div>
            </ElFormItem>
          </template>

          <template v-if="cycleUnit === 'day'">
            <ElFormItem label="触发时间">
              <ElTimePicker
                v-model="cycleTime"
                format="HH:mm"
                value-format="HH:mm"
                placeholder="选择时间"
                class="w-160"
              />
            </ElFormItem>
          </template>

          <template v-if="cycleUnit === 'week'">
            <ElFormItem label="选择星期">
              <ElCheckboxGroup v-model="cycleWeekdays">
                <ElCheckbox v-for="item in weekOptions" :key="item.value" :value="item.value">
                  {{ item.label }}
                </ElCheckbox>
              </ElCheckboxGroup>
            </ElFormItem>
            <ElFormItem label="触发时间">
              <ElTimePicker
                v-model="cycleTime"
                format="HH:mm"
                value-format="HH:mm"
                placeholder="选择时间"
                class="w-160"
              />
            </ElFormItem>
          </template>

          <template v-if="cycleUnit === 'month'">
            <ElFormItem label="选择日期">
              <ElInputNumber
                v-model="cycleMonthDay"
                :min="1"
                :max="31"
                controls-position="right"
                class="w-130"
              />
              <span class="ml-2 text-g-500">号</span>
            </ElFormItem>
            <ElFormItem label="触发时间">
              <ElTimePicker
                v-model="cycleTime"
                format="HH:mm"
                value-format="HH:mm"
                placeholder="选择时间"
                class="w-160"
              />
            </ElFormItem>
          </template>
        </ElForm>
      </ElTabPane>

      <!-- 自定义表达式 -->
      <ElTabPane label="自定义" name="custom">
        <ElInput v-model="customExpr" placeholder="* * * * *" />
        <div class="cron-tip mt-2">
          五段顺序：分(0-59) 时(0-23) 日(1-31) 月(1-12) 周(0-6，0=周日)。 支持 <code>*</code>
          <code>,</code> <code>-</code> <code>/</code> 符号。
        </div>
      </ElTabPane>
    </ElTabs>

    <!-- 当前表达式预览 -->
    <div class="cron-preview">
      <span class="text-g-500">当前表达式：</span>
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

  const activeTab = ref('preset')
  const customExpr = ref('* * * * *')

  // ===== 预设 =====
  interface PresetItem {
    label: string
    value: string
  }

  const presets: PresetItem[] = [
    { label: '每分钟', value: '* * * * *' },
    { label: '每 5 分钟', value: '*/5 * * * *' },
    { label: '每 10 分钟', value: '*/10 * * * *' },
    { label: '每 30 分钟', value: '*/30 * * * *' },
    { label: '每小时整点', value: '0 * * * *' },
    { label: '每天 00:00', value: '0 0 * * *' },
    { label: '每天 01:00', value: '0 1 * * *' },
    { label: '每天 02:00', value: '0 2 * * *' },
    { label: '每周一 00:00', value: '0 0 * * 1' },
    { label: '每月 1 号 00:00', value: '0 0 1 * *' }
  ]

  const presetValue = ref('* * * * *')

  // ===== 周期触发 =====
  interface CycleUnitItem {
    label: string
    value: string
  }

  const cycleUnits: CycleUnitItem[] = [
    { label: '分钟', value: 'minute' },
    { label: '小时', value: 'hour' },
    { label: '每天', value: 'day' },
    { label: '每周', value: 'week' },
    { label: '每月', value: 'month' }
  ]

  const cycleUnit = ref('day')
  const cycleInterval = ref(1)
  const cycleTime = ref('00:00')
  const cycleStart = ref('00:00')
  const cycleEnd = ref('23:59')
  const cycleMonthDay = ref(1)

  const weekOptions = [
    { label: '周一', value: 1 },
    { label: '周二', value: 2 },
    { label: '周三', value: 3 },
    { label: '周四', value: 4 },
    { label: '周五', value: 5 },
    { label: '周六', value: 6 },
    { label: '周日', value: 0 }
  ]
  const cycleWeekdays = ref<number[]>([1])

  // 根据周期单位限制间隔范围
  const cycleMax = computed(() => {
    if (cycleUnit.value === 'minute' || cycleUnit.value === 'hour') {
      return cycleUnit.value === 'minute' ? 59 : 23
    }

    return 31
  })

  // ===== 根据周期配置生成表达式 =====
  function buildCycleExpr(): string {
    const time = (cycleTime.value || '00:00').split(':')
    const hour = time[0] ?? '0'
    const minute = time[1] ?? '0'

    switch (cycleUnit.value) {
      case 'minute': {
        // 限定生效时段：分从 0 开始按间隔，小时限定在起止小时范围
        const startHour = Number((cycleStart.value || '00:00').split(':')[0])
        const endHour = Number((cycleEnd.value || '23:59').split(':')[0])
        const hours = range(startHour, endHour).join(',')

        return `*/${cycleInterval.value} ${hours} * * *`
      }
      case 'hour': {
        const startHour = Number((cycleStart.value || '00:00').split(':')[0])
        const endHour = Number((cycleEnd.value || '23:59').split(':')[0])
        const startMinute = Number((cycleStart.value || '00:00').split(':')[1]) || 0
        const hours = range(startHour, endHour, cycleInterval.value).join(',')

        return `${startMinute} ${hours} * * *`
      }
      case 'day':
        return `${minute} ${hour} * * *`
      case 'week': {
        const days = [...cycleWeekdays.value].sort((a, b) => a - b).join(',')

        return `${minute} ${hour} * * ${days}`
      }
      case 'month':
        return `${minute} ${hour} ${cycleMonthDay.value} * *`
      default:
        return '* * * * *'
    }
  }

  /** 生成连续整数序列，支持步长 */
  function range(start: number, end: number, step = 1): number[] {
    const result: number[] = []
    if (start <= end) {
      for (let i = start; i <= end; i += step) {
        result.push(i)
      }
    } else {
      // 跨午夜场景，如 22 点至次日 6 点
      for (let i = start; i <= 23; i += step) {
        result.push(i)
      }
      for (let i = 0; i <= end; i += step) {
        result.push(i)
      }
    }

    return result
  }

  // ===== 当前表达式 =====
  const resultExpr = computed(() => {
    switch (activeTab.value) {
      case 'preset':
        return presetValue.value
      case 'cycle':
        return buildCycleExpr()
      case 'custom':
        return customExpr.value || '* * * * *'
      default:
        return '* * * * *'
    }
  })

  // 初始化：根据传入表达式判断所在标签
  watchEffect(() => {
    const expr = props.modelValue
    if (!expr) return

    if (presets.some((p) => p.value === expr)) {
      activeTab.value = 'preset'
      presetValue.value = expr
    } else {
      activeTab.value = 'custom'
      customExpr.value = expr
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

  .cron-options {
    display: flex;
    flex-direction: column;
    gap: 4px;
    align-items: flex-start;
  }

  .cron-option {
    height: auto;
    padding: 6px 0;
    margin-right: 0;
    text-align: left;
    white-space: normal;
  }

  .cron-expr {
    margin-left: 8px;
    font-family: var(--el-font-family-monospace, monospace);
    font-size: 12px;
    color: var(--el-color-primary);
  }

  .cron-form {
    margin-top: 4px;
  }

  .cron-tip {
    font-size: 12px;
    line-height: 1.8;
    color: var(--el-text-color-secondary);

    code {
      padding: 0 4px;
      font-family: var(--el-font-family-monospace, monospace);
      background: var(--el-fill-color-light);
      border-radius: 3px;
    }
  }

  .cron-preview {
    padding: 10px 12px;
    margin-top: 12px;
    background: var(--el-fill-color-light);
    border-radius: 4px;

    code {
      font-family: var(--el-font-family-monospace, monospace);
      font-size: 14px;
      color: var(--el-color-primary);
    }
  }
</style>
