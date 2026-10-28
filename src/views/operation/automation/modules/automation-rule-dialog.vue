<template>
  <ElDialog
    v-model="dialogVisible"
    :title="title"
    width="720px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <ElForm ref="formRef" :model="form" :rules="rules" label-width="110px" label-position="right">
      <ElFormItem label="规则名称" prop="name">
        <ElInput
          v-model="form.name"
          placeholder="请输入规则名称"
          maxlength="64"
          show-word-limit
          clearable
        />
      </ElFormItem>
      <ElFormItem label="触发类型" prop="trigger_type">
        <ElSelect
          v-model="form.trigger_type"
          placeholder="请选择触发类型"
          class="w-full"
          @change="handleTriggerTypeChange"
        >
          <ElOption
            v-for="opt in metaOptions.trigger_types"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          />
        </ElSelect>
      </ElFormItem>
      <ElFormItem label="目标人群" prop="segment_id">
        <ElSelect
          v-model="form.segment_id"
          placeholder="不选择表示全量用户"
          class="w-full"
          clearable
        >
          <ElOption
            v-for="opt in segmentOptions"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          />
        </ElSelect>
      </ElFormItem>

      <ElDivider content-position="left">触发时机</ElDivider>
      <ElFormItem label="提前天数" prop="trigger_config.advance_days">
        <ElInputNumber v-model="form.trigger_config.advance_days" :min="0" :max="30" :step="1" />
        <span class="ml-2 text-sm text-gray-400">0 表示当天推送，N 表示提前 N 天</span>
      </ElFormItem>
      <ElFormItem label="推送时间" prop="trigger_config.send_time">
        <ElTimePicker
          v-model="sendTimeValue"
          format="HH:mm"
          value-format="HH:mm"
          placeholder="选择推送时间（最晚 23:00）"
        />
      </ElFormItem>
      <ElFormItem
        v-if="form.trigger_type === 'festival'"
        label="节日范围"
        prop="trigger_config.festival_ids"
      >
        <ElSelect
          v-model="form.trigger_config.festival_ids"
          multiple
          placeholder="不选择表示全部启用节日"
          class="w-full"
          clearable
        >
          <ElOption
            v-for="opt in festivalOptions"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          />
        </ElSelect>
      </ElFormItem>

      <ElDivider content-position="left">通知内容</ElDivider>
      <ElFormItem label="通知标题" prop="title">
        <ElInput
          v-model="form.title"
          placeholder="支持 {nickname} {festival} {date} 变量"
          maxlength="200"
          show-word-limit
          clearable
        />
      </ElFormItem>
      <ElFormItem label="通知内容" prop="content">
        <ElInput
          v-model="form.content"
          type="textarea"
          :rows="3"
          placeholder="支持 {nickname} 用户昵称、{festival} 节日名称、{date} 事件日期"
          maxlength="1000"
          show-word-limit
        />
      </ElFormItem>
      <ElFormItem label="触达渠道" prop="channels">
        <ElCheckboxGroup v-model="form.channels">
          <ElCheckbox v-for="opt in metaOptions.channels" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </ElCheckbox>
        </ElCheckboxGroup>
      </ElFormItem>

      <ElDivider content-position="left">奖励设置</ElDivider>
      <ElFormItem label="奖励类型" prop="reward_type">
        <ElSelect v-model="form.reward_type" placeholder="请选择奖励类型" class="w-full">
          <ElOption
            v-for="opt in metaOptions.reward_types"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          />
        </ElSelect>
      </ElFormItem>
      <ElFormItem v-if="form.reward_type !== 'none'" label="奖励数量" prop="reward_amount">
        <ElInputNumber v-model="form.reward_amount" :min="1" :max="100000" :step="1" />
      </ElFormItem>

      <ElFormItem label="启用状态" prop="status">
        <ElSwitch v-model="form.status" active-text="启用" inactive-text="禁用" inline-prompt />
      </ElFormItem>
    </ElForm>

    <template #footer>
      <ElButton @click="handleClose">取消</ElButton>
      <ElButton type="primary" :loading="submitting" @click="handleSubmit">确认</ElButton>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import type { FormInstance, FormRules } from 'element-plus'
  import {
    fetchCreateAutomationRule,
    fetchGetAutomationFestivalOptions,
    fetchGetAutomationRuleMeta,
    fetchUpdateAutomationRule
  } from '@/api/automation'
  import { fetchGetSegmentOptions } from '@/api/segment-manage'

  defineOptions({ name: 'AutomationRuleDialog' })

  const emit = defineEmits<{ (e: 'success'): void }>()

  const dialogVisible = ref(false)
  const formRef = ref<FormInstance>()
  const submitting = ref(false)
  const id = ref<number | null>(null)
  const isEdit = computed(() => id.value !== null)
  const title = computed(() => (isEdit.value ? '编辑规则' : '新增规则'))

  const metaOptions = ref<Api.Automation.Meta>({
    trigger_types: [],
    reward_types: [],
    channels: []
  })
  const segmentOptions = ref<{ label: string; value: number }[]>([])
  const festivalOptions = ref<{ label: string; value: number }[]>([])

  const form = reactive<{
    name: string
    trigger_type: string
    segment_id: number | null
    trigger_config: { advance_days: number; send_time: string; festival_ids: number[] }
    title: string
    content: string
    channels: string[]
    reward_type: string
    reward_amount: number
    status: boolean
  }>({
    name: '',
    trigger_type: 'birthday',
    segment_id: null,
    trigger_config: { advance_days: 0, send_time: '09:00', festival_ids: [] },
    title: '',
    content: '',
    channels: ['database'],
    reward_type: 'none',
    reward_amount: 0,
    status: true
  })

  // ElTimePicker 绑定值与 trigger_config.send_time 之间的桥接
  const sendTimeValue = computed({
    get: () => form.trigger_config.send_time,
    set: (value: string) => {
      form.trigger_config.send_time = value || '09:00'
    }
  })

  const rules: FormRules = {
    name: [
      { required: true, message: '请输入规则名称', trigger: 'blur' },
      { max: 64, message: '长度不能超过 64 字符', trigger: 'blur' }
    ],
    trigger_type: [{ required: true, message: '请选择触发类型', trigger: 'change' }],
    title: [{ required: true, message: '请输入通知标题', trigger: 'blur' }],
    content: [{ required: true, message: '请输入通知内容', trigger: 'blur' }],
    channels: [
      {
        required: true,
        type: 'array',
        min: 1,
        message: '请至少选择一个触达渠道',
        trigger: 'change'
      }
    ],
    reward_type: [{ required: true, message: '请选择奖励类型', trigger: 'change' }]
  }

  async function loadOptions() {
    try {
      const [meta, segments, festivals] = await Promise.all([
        fetchGetAutomationRuleMeta(),
        fetchGetSegmentOptions(),
        fetchGetAutomationFestivalOptions()
      ])
      metaOptions.value = meta
      segmentOptions.value = (segments || []).map((item) => ({ label: item.name, value: item.id }))
      festivalOptions.value = (festivals || []).map((item) => ({
        label: `${item.name}（${item.date_type_label} ${item.month}/${item.day}）`,
        value: item.id
      }))
    } catch {
      // 选项加载失败不阻断表单
    }
  }

  const resetForm = () => {
    form.name = ''
    form.trigger_type = 'birthday'
    form.segment_id = null
    form.trigger_config = { advance_days: 0, send_time: '09:00', festival_ids: [] }
    form.title = ''
    form.content = ''
    form.channels = ['database']
    form.reward_type = 'none'
    form.reward_amount = 0
    form.status = true
  }

  const handleTriggerTypeChange = (type: string) => {
    // 切换为节日类型时给出文案示例，其他类型清空节日范围
    if (type !== 'festival') {
      form.trigger_config.festival_ids = []
    }
    if (!isEdit.value) {
      const templates: Record<string, { title: string; content: string }> = {
        birthday: {
          title: '生日快乐，{nickname}！',
          content: '亲爱的 {nickname}，今天是你的生日，祝你生日快乐！'
        },
        festival: {
          title: '{festival}快乐！',
          content: '亲爱的 {nickname}，今天是{festival}，祝你节日愉快！'
        },
        register_anniversary: {
          title: '感谢一路相伴，{nickname}！',
          content: '亲爱的 {nickname}，今天是你加入我们的周年纪念日，感谢你的陪伴！'
        }
      }
      const template = templates[type]
      if (template) {
        form.title = template.title
        form.content = template.content
      }
    }
  }

  const open = async (row?: Api.Automation.RuleListItem) => {
    await loadOptions()
    dialogVisible.value = true
    if (row) {
      id.value = row.id
      form.name = row.name
      form.trigger_type = row.trigger_type
      form.segment_id = row.segment_id
      form.trigger_config = {
        advance_days: row.trigger_config?.advance_days ?? 0,
        send_time: row.trigger_config?.send_time ?? '09:00',
        festival_ids: row.trigger_config?.festival_ids ?? []
      }
      form.title = row.title
      form.content = row.content
      form.channels = [...(row.channels || [])]
      form.reward_type = row.reward_type
      form.reward_amount = row.reward_amount
      form.status = row.status
    } else {
      id.value = null
      resetForm()
    }
    nextTick(() => formRef.value?.clearValidate())
  }

  const handleSubmit = async () => {
    if (!formRef.value) return
    await formRef.value.validate(async (valid) => {
      if (!valid) return
      submitting.value = true
      try {
        const payload: Api.Automation.RuleSaveParams = {
          name: form.name,
          trigger_type: form.trigger_type,
          trigger_config: {
            advance_days: form.trigger_config.advance_days,
            send_time: form.trigger_config.send_time,
            ...(form.trigger_type === 'festival'
              ? { festival_ids: form.trigger_config.festival_ids }
              : {})
          },
          segment_id: form.segment_id,
          title: form.title,
          content: form.content,
          channels: form.channels,
          reward_type: form.reward_type,
          reward_amount: form.reward_type === 'none' ? 0 : form.reward_amount,
          status: form.status
        }
        if (isEdit.value && id.value) {
          await fetchUpdateAutomationRule(id.value, payload)
        } else {
          await fetchCreateAutomationRule(payload)
        }
        dialogVisible.value = false
        emit('success')
      } finally {
        submitting.value = false
      }
    })
  }

  const handleClose = () => {
    formRef.value?.resetFields()
    dialogVisible.value = false
  }

  defineExpose({ open })
</script>
