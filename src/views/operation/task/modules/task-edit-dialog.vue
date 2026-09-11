<template>
  <ElDialog
    v-model="dialogVisible"
    :title="title"
    width="700px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <ElForm ref="formRef" :model="form" :rules="rules" label-width="110px" label-position="right">
      <ElFormItem label="所属分组" prop="group_id">
        <ElSelect v-model="form.group_id" placeholder="请选择任务分组" class="w-full">
          <ElOption
            v-for="opt in groupOptions"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          />
        </ElSelect>
      </ElFormItem>
      <ElFormItem label="任务名称" prop="name">
        <ElInput
          v-model="form.name"
          placeholder="请输入任务名称"
          maxlength="100"
          show-word-limit
          clearable
        />
      </ElFormItem>
      <ElFormItem label="任务编码" prop="code">
        <ElInput
          v-model="form.code"
          placeholder="请输入任务编码（英文标识）"
          maxlength="100"
          clearable
        />
      </ElFormItem>
      <ElFormItem label="任务类型" prop="type">
        <ElSelect v-model="form.type" placeholder="请选择任务类型" class="w-full">
          <ElOption
            v-for="opt in taskTypeOptions"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          />
        </ElSelect>
      </ElFormItem>
      <ElFormItem label="任务描述" prop="description">
        <ElInput
          v-model="form.description"
          type="textarea"
          :rows="2"
          placeholder="任务描述（可选）"
          maxlength="500"
          show-word-limit
          clearable
        />
      </ElFormItem>

      <ElDivider content-position="left">任务条件</ElDivider>
      <ElFormItem v-if="form.type === 'sign_in'" label="连续签到天数" prop="condition.serial_days">
        <ElInputNumber
          v-model="form.condition.serial_days"
          :min="0"
          :step="1"
          placeholder="0 表示每日签到"
        />
      </ElFormItem>
      <ElFormItem
        v-if="form.type === 'complete_profile'"
        label="完整度阈值(%)"
        prop="condition.completeness_threshold"
      >
        <ElInputNumber
          v-model="form.condition.completeness_threshold"
          :min="0"
          :max="100"
          :step="1"
        />
      </ElFormItem>
      <ElFormItem
        v-if="form.type !== 'complete_profile' && form.type !== 'sign_in'"
        label="目标值"
        prop="condition.target_value"
      >
        <ElInputNumber
          v-model="form.condition.target_value"
          :min="0"
          :step="1"
          placeholder="完成任务所需的目标次数/数量"
        />
      </ElFormItem>

      <ElDivider content-position="left">奖励设置</ElDivider>
      <ElFormItem label="奖励类型" prop="reward_type">
        <ElSelect v-model="form.reward_type" placeholder="请选择奖励类型" class="w-full">
          <ElOption
            v-for="opt in rewardTypeOptions"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          />
        </ElSelect>
      </ElFormItem>
      <ElFormItem label="奖励数量" prop="reward_amount">
        <ElInputNumber v-model="form.reward_amount" :min="0" :step="1" placeholder="奖励数量" />
      </ElFormItem>
      <ElFormItem label="领取方式" prop="claim_mode">
        <ElRadioGroup v-model="form.claim_mode">
          <ElRadio :value="0">自动发放</ElRadio>
          <ElRadio :value="1">手动领取</ElRadio>
        </ElRadioGroup>
      </ElFormItem>

      <ElDivider content-position="left">其他设置</ElDivider>
      <ElFormItem label="排序权重" prop="sort_order">
        <ElInputNumber v-model="form.sort_order" :min="0" :step="1" placeholder="越小越靠前" />
      </ElFormItem>
      <ElFormItem label="生效时间">
        <ElDatePicker
          v-model="dateRange"
          type="datetimerange"
          range-separator="至"
          start-placeholder="开始时间"
          end-placeholder="结束时间"
          format="YYYY-MM-DD HH:mm:ss"
          value-format="YYYY-MM-DD HH:mm:ss"
          class="!w-full"
        />
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
    fetchCreateTask,
    fetchGetTaskGroupOptions,
    fetchUpdateTask
  } from '@/api/operation-manage'

  defineOptions({ name: 'TaskEditDialog' })

  const emit = defineEmits<{ (e: 'success'): void }>()

  const dialogVisible = ref(false)
  const formRef = ref<FormInstance>()
  const submitting = ref(false)
  const id = ref<number | null>(null)
  const isEdit = computed(() => id.value !== null)
  const title = computed(() => (isEdit.value ? '编辑任务' : '新增任务'))
  const dateRange = ref<[string, string] | null>(null)

  const groupOptions = ref<{ label: string; value: number }[]>([])

  const taskTypeOptions = [
    { label: '签到', value: 'sign_in' },
    { label: '完善资料', value: 'complete_profile' },
    { label: '关注公众号', value: 'follow_official_account' },
    { label: '邀请好友', value: 'invite_user' },
    { label: '每日登录', value: 'daily_login' },
    { label: '自定义行为', value: 'custom_action' }
  ]

  const rewardTypeOptions = [
    { label: '金币', value: 'coin' },
    { label: '积分', value: 'point' },
    { label: 'VIP天数', value: 'vip_days' }
  ]

  const form = reactive<{
    group_id: number
    name: string
    code: string
    type: string
    description: string | null
    condition: {
      serial_days: number
      target_value: number
      completeness_threshold: number
    }
    reward_type: string
    reward_amount: number
    claim_mode: number
    sort_order: number
    start_at: string | null
    end_at: string | null
    status: boolean
  }>({
    group_id: 0,
    name: '',
    code: '',
    type: 'sign_in',
    description: null,
    condition: { serial_days: 0, target_value: 1, completeness_threshold: 100 },
    reward_type: 'coin',
    reward_amount: 0,
    claim_mode: 0,
    sort_order: 0,
    start_at: null,
    end_at: null,
    status: true
  })

  const rules: FormRules = {
    group_id: [{ required: true, message: '请选择所属分组', trigger: 'change' }],
    name: [
      { required: true, message: '请输入任务名称', trigger: 'blur' },
      { max: 100, message: '长度不能超过 100 字符', trigger: 'blur' }
    ],
    code: [
      { required: true, message: '请输入任务编码', trigger: 'blur' },
      { max: 100, message: '长度不能超过 100 字符', trigger: 'blur' }
    ],
    type: [{ required: true, message: '请选择任务类型', trigger: 'change' }],
    reward_type: [{ required: true, message: '请选择奖励类型', trigger: 'change' }],
    reward_amount: [{ type: 'number', min: 0, message: '奖励数量不能小于 0', trigger: 'blur' }],
    claim_mode: [{ required: true, message: '请选择领取方式', trigger: 'change' }],
    sort_order: [{ type: 'number', min: 0, message: '排序权重不能小于 0', trigger: 'blur' }]
  }

  async function loadGroups() {
    try {
      const list = await fetchGetTaskGroupOptions()
      groupOptions.value = (list || []).map((g) => ({ label: g.name, value: g.id }))
    } catch {
      groupOptions.value = []
    }
  }

  const resetForm = () => {
    form.group_id = groupOptions.value[0]?.value ?? 0
    form.name = ''
    form.code = ''
    form.type = 'sign_in'
    form.description = null
    form.condition = { serial_days: 0, target_value: 1, completeness_threshold: 100 }
    form.reward_type = 'coin'
    form.reward_amount = 0
    form.claim_mode = 0
    form.sort_order = 0
    form.start_at = null
    form.end_at = null
    form.status = true
    dateRange.value = null
  }

  const open = async (row?: Api.OperationManage.TaskListItem) => {
    await loadGroups()
    dialogVisible.value = true
    if (row) {
      id.value = row.id
      form.group_id = row.group_id
      form.name = row.name
      form.code = row.code
      form.type = row.type
      form.description = row.description
      form.condition = {
        serial_days: row.condition?.serial_days ?? 0,
        target_value: row.condition?.target_value ?? 1,
        completeness_threshold: row.condition?.completeness_threshold ?? 100
      }
      form.reward_type = row.reward_type
      form.reward_amount = row.reward_amount
      form.claim_mode = row.claim_mode
      form.sort_order = row.sort_order
      form.start_at = row.start_at
      form.end_at = row.end_at
      form.status = row.status
      if (row.start_at && row.end_at) {
        dateRange.value = [row.start_at, row.end_at]
      } else {
        dateRange.value = null
      }
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
        if (dateRange.value && dateRange.value.length === 2) {
          form.start_at = dateRange.value[0]
          form.end_at = dateRange.value[1]
        } else {
          form.start_at = null
          form.end_at = null
        }
        // 根据类型清理无用条件字段
        const condition = { ...form.condition }
        if (form.type !== 'sign_in') condition.serial_days = 0
        if (form.type !== 'complete_profile') condition.completeness_threshold = 100
        if (form.type === 'complete_profile' || form.type === 'sign_in') condition.target_value = 1

        const payload: Api.OperationManage.TaskSaveParams = {
          group_id: form.group_id,
          name: form.name,
          code: form.code,
          type: form.type,
          description: form.description,
          condition,
          reward_type: form.reward_type,
          reward_amount: form.reward_amount,
          claim_mode: form.claim_mode,
          sort_order: form.sort_order,
          start_at: form.start_at,
          end_at: form.end_at,
          status: form.status
        }
        if (isEdit.value && id.value) {
          await fetchUpdateTask(id.value, payload)
        } else {
          await fetchCreateTask(payload)
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
