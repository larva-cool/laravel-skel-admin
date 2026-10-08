<template>
  <ElDialog
    v-model="dialogVisible"
    :title="title"
    width="780px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <ElForm ref="formRef" :model="form" :rules="rules" label-width="120px" label-position="right">
      <ElFormItem label="任务名称" prop="name">
        <ElInput v-model="form.name" placeholder="请输入任务名称" maxlength="200" clearable />
      </ElFormItem>

      <ElFormItem label="Artisan 命令" prop="command">
        <ElSelect
          v-model="form.command"
          placeholder="请选择命令"
          class="w-full"
          filterable
          clearable
          @change="handleCommandChange"
        >
          <ElOption
            v-for="cmd in commandOptions"
            :key="cmd.name"
            :label="cmd.name"
            :value="cmd.name"
          >
            <span>{{ cmd.name }}</span>
            <span class="text-xs text-gray-400 ml-2">{{ cmd.description }}</span>
          </ElOption>
          <ElOption label="自定义命令（custom）" value="custom" />
        </ElSelect>
      </ElFormItem>

      <ElFormItem v-if="form.command === 'custom'" label="自定义命令" prop="command_custom">
        <ElInput v-model="form.command_custom" placeholder="请输入自定义命令名称" clearable />
      </ElFormItem>

      <ElFormItem label="Cron 表达式" prop="expression">
        <ElInput
          v-model="form.expression"
          placeholder="点击配置 Cron 表达式"
          readonly
          @click="openCronDialog"
        />
        <div class="form-tip">
          标准五段式 Cron：分 时 日 月 周（例如
          <code>* * * * *</code> 每分钟、<code>0 * * * *</code> 每小时、<code>0 0 * * *</code>
          每天）
        </div>
      </ElFormItem>

      <ElFormItem label="描述">
        <ElInput
          v-model="form.description"
          type="textarea"
          :rows="2"
          placeholder="任务描述（可选）"
          maxlength="500"
          show-word-limit
        />
      </ElFormItem>

      <ElFormItem label="运行环境">
        <ElSelect
          v-model="form.environments"
          multiple
          placeholder="留空表示所有环境"
          class="w-full"
          clearable
        >
          <ElOption label="local" value="local" />
          <ElOption label="development" value="development" />
          <ElOption label="testing" value="testing" />
          <ElOption label="production" value="production" />
        </ElSelect>
      </ElFormItem>

      <!-- 命令参数编辑 -->
      <ElFormItem label="命令参数">
        <div class="w-full">
          <div v-for="(item, index) in form.params" :key="`param-${index}`" class="dynamic-row">
            <ElInput v-model="item.name" placeholder="参数名" class="flex-1" />
            <ElInput v-model="item.value" placeholder="参数值" class="flex-1" />
            <ElButton type="danger" text circle @click="removeItem(form.params, index)">
              <ElIcon><Delete /></ElIcon>
            </ElButton>
          </div>
          <ElButton
            type="primary"
            text
            size="small"
            @click="addItem(form.params, { name: '', value: '' })"
          >
            <ElIcon class="mr-1"><Plus /></ElIcon>
            添加参数
          </ElButton>
        </div>
      </ElFormItem>

      <!-- 无值选项编辑 -->
      <ElFormItem label="命令选项">
        <div class="w-full">
          <div v-for="(item, index) in form.options" :key="`option-${index}`" class="dynamic-row">
            <ElInput v-model="item.name" placeholder="选项名（如 --force）" class="flex-1" />
            <ElButton type="danger" text circle @click="removeItem(form.options, index)">
              <ElIcon><Delete /></ElIcon>
            </ElButton>
          </div>
          <ElButton type="primary" text size="small" @click="addItem(form.options, { name: '' })">
            <ElIcon class="mr-1"><Plus /></ElIcon>
            添加选项
          </ElButton>
        </div>
      </ElFormItem>

      <!-- 带值选项编辑 -->
      <ElFormItem label="带值选项">
        <div class="w-full">
          <div
            v-for="(item, index) in form.options_with_value"
            :key="`opt-val-${index}`"
            class="dynamic-row"
          >
            <ElInput v-model="item.name" placeholder="选项名（如 --user）" class="flex-1" />
            <ElInput v-model="item.value" placeholder="选项值" class="flex-1" />
            <ElButton type="danger" text circle @click="removeItem(form.options_with_value, index)">
              <ElIcon><Delete /></ElIcon>
            </ElButton>
          </div>
          <ElButton
            type="primary"
            text
            size="small"
            @click="addItem(form.options_with_value, { name: '', value: '' })"
          >
            <ElIcon class="mr-1"><Plus /></ElIcon>
            添加带值选项
          </ElButton>
        </div>
      </ElFormItem>

      <!-- 高级选项（可折叠） -->
      <ElCollapse v-model="advancedCollapse" class="mb-2">
        <ElCollapseItem title="高级选项" name="advanced">
          <ElFormItem label="维护模式运行">
            <ElSwitch
              v-model="form.even_in_maintenance_mode"
              active-text="是"
              inactive-text="否"
              inline-prompt
            />
            <div class="form-tip">启用后即使应用处于维护模式也会执行该任务</div>
          </ElFormItem>
          <ElFormItem label="禁止重叠">
            <ElSwitch
              v-model="form.without_overlapping"
              active-text="是"
              inactive-text="否"
              inline-prompt
            />
            <div class="form-tip">防止同一任务在前一次执行完成前重复运行</div>
          </ElFormItem>
          <ElFormItem label="单服务器运行">
            <ElSwitch
              v-model="form.on_one_server"
              active-text="是"
              inactive-text="否"
              inline-prompt
            />
            <div class="form-tip">仅在单台服务器上运行，适用于多服务器部署环境</div>
          </ElFormItem>
          <ElFormItem label="后台运行">
            <ElSwitch
              v-model="form.run_in_background"
              active-text="是"
              inactive-text="否"
              inline-prompt
            />
            <div class="form-tip">任务在后台运行，不阻塞调度器</div>
          </ElFormItem>
        </ElCollapseItem>
      </ElCollapse>

      <ElFormItem label="启用状态">
        <ElSwitch v-model="form.status" active-text="启用" inactive-text="禁用" inline-prompt />
      </ElFormItem>
    </ElForm>

    <template #footer>
      <ElButton @click="handleClose">取消</ElButton>
      <ElButton type="primary" :loading="submitting" @click="handleSubmit"> 确认 </ElButton>
    </template>
  </ElDialog>

  <!-- Cron 表达式配置弹窗 -->
  <ElDialog
    v-model="cronDialogVisible"
    title="Cron 表达式配置"
    width="560px"
    append-to-body
    :close-on-click-modal="false"
  >
    <ArtCronPicker ref="cronPickerRef" :model-value="form.expression" />
    <template #footer>
      <ElButton @click="cronDialogVisible = false">取消</ElButton>
      <ElButton type="primary" @click="confirmCron">确认</ElButton>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import { Delete, Plus } from '@element-plus/icons-vue'
  import type { FormInstance, FormRules } from 'element-plus'
  import {
    fetchCreateSchedule,
    fetchUpdateSchedule,
    fetchScheduleDetail,
    fetchScheduleCommands,
    type ScheduleItem,
    type ScheduleSaveParams,
    type CommandOption
  } from '@/api/schedule'

  defineOptions({ name: 'ScheduleEditDialog' })

  const emit = defineEmits<{
    (e: 'success'): void
  }>()

  const dialogVisible = ref(false)
  const formRef = ref<FormInstance>()
  const submitting = ref(false)
  const id = ref<number | null>(null)
  const isEdit = computed(() => id.value !== null)
  const title = computed(() => (isEdit.value ? '编辑定时任务' : '新增定时任务'))

  const commandOptions = ref<CommandOption[]>([])
  const advancedCollapse = ref<string[]>([])

  const form = reactive({
    name: '',
    command: '',
    command_custom: '',
    params: [] as Array<{ name: string; value: string }>,
    options: [] as Array<{ name: string }>,
    options_with_value: [] as Array<{ name: string; value: string }>,
    expression: '',
    environments: [] as string[],
    description: '',
    even_in_maintenance_mode: false,
    without_overlapping: false,
    on_one_server: false,
    run_in_background: false,
    status: true
  })

  const rules: FormRules = {
    name: [{ required: true, message: '请输入任务名称', trigger: 'blur' }],
    command: [{ required: true, message: '请选择命令', trigger: 'change' }],
    expression: [{ required: true, message: '请输入 Cron 表达式', trigger: 'blur' }]
  }

  function addItem<T>(arr: T[], item: T) {
    arr.push(item)
  }

  function removeItem<T>(arr: T[], index: number) {
    arr.splice(index, 1)
  }

  function handleCommandChange() {
    if (form.command !== 'custom') {
      form.command_custom = ''
    }
  }

  function resetForm() {
    id.value = null
    form.name = ''
    form.command = ''
    form.command_custom = ''
    form.params = []
    form.options = []
    form.options_with_value = []
    form.expression = ''
    form.environments = []
    form.description = ''
    form.even_in_maintenance_mode = false
    form.without_overlapping = false
    form.on_one_server = false
    form.run_in_background = false
    form.status = true
    advancedCollapse.value = []
  }

  async function loadCommands() {
    try {
      commandOptions.value = (await fetchScheduleCommands()) || []
    } catch {
      commandOptions.value = []
    }
  }

  function buildPayload(): ScheduleSaveParams {
    return {
      name: form.name,
      command: form.command,
      command_custom: form.command === 'custom' ? form.command_custom || null : null,
      params: form.params.filter((p) => p.name),
      options: form.options.filter((o) => o.name),
      options_with_value: form.options_with_value.filter((o) => o.name),
      expression: form.expression,
      environments: form.environments.length > 0 ? form.environments : null,
      description: form.description || null,
      even_in_maintenance_mode: form.even_in_maintenance_mode,
      without_overlapping: form.without_overlapping,
      on_one_server: form.on_one_server,
      run_in_background: form.run_in_background,
      status: form.status
    }
  }

  function applyDetail(detail: ScheduleItem) {
    form.name = detail.name
    form.command = detail.command
    form.command_custom = detail.command_custom || ''
    form.params = detail.params?.length ? detail.params.map((p) => ({ ...p })) : []
    form.options = detail.options?.length ? detail.options.map((o) => ({ ...o })) : []
    form.options_with_value = detail.options_with_value?.length
      ? detail.options_with_value.map((o) => ({ ...o }))
      : []
    form.expression = detail.expression
    form.environments = detail.environments || []
    form.description = detail.description || ''
    form.even_in_maintenance_mode = detail.even_in_maintenance_mode
    form.without_overlapping = detail.without_overlapping
    form.on_one_server = detail.on_one_server
    form.run_in_background = detail.run_in_background
    form.status = detail.status === 1
  }

  async function open(row?: ScheduleItem) {
    resetForm()
    dialogVisible.value = true

    // 加载命令列表
    await loadCommands()

    if (row) {
      id.value = row.id
      try {
        const detail = await fetchScheduleDetail(row.id)
        applyDetail(detail)
      } catch {
        // 接口失败时用列表行数据兜底
        applyDetail(row)
      }
    }

    await nextTick()
    formRef.value?.clearValidate()
  }

  async function handleSubmit() {
    if (!formRef.value) return
    await formRef.value.validate(async (valid) => {
      if (!valid) return
      submitting.value = true
      try {
        const payload = buildPayload()
        if (isEdit.value && id.value) {
          await fetchUpdateSchedule(id.value, payload)
        } else {
          await fetchCreateSchedule(payload)
        }
        dialogVisible.value = false
        emit('success')
      } finally {
        submitting.value = false
      }
    })
  }

  function handleClose() {
    formRef.value?.resetFields()
    dialogVisible.value = false
  }

  // ===== Cron 配置弹窗 =====
  const cronDialogVisible = ref(false)
  const cronPickerRef = ref<{ getExpression: () => string }>()

  function openCronDialog() {
    cronDialogVisible.value = true
  }

  function confirmCron() {
    const expr = cronPickerRef.value?.getExpression()
    if (expr) {
      form.expression = expr
    }
    cronDialogVisible.value = false
  }

  defineExpose({ open })
</script>

<style scoped lang="scss">
  .form-tip {
    margin-top: 4px;
    font-size: 12px;
    line-height: 1.5;
    color: var(--el-text-color-secondary);
  }

  .dynamic-row {
    display: flex;
    gap: 8px;
    align-items: center;
    margin-bottom: 8px;
  }
</style>
