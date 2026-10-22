<script setup lang="ts">
  import { computed, reactive, ref } from 'vue'
  import {
    ElDialog,
    ElForm,
    ElFormItem,
    ElRadioGroup,
    ElRadio,
    ElCheckboxGroup,
    ElCheckbox,
    ElInput,
    ElButton,
    ElAlert,
    ElDivider
  } from 'element-plus'
  import type { FormInstance, FormRules } from 'element-plus'
  import { fetchAiTriageReport, fetchProcessReport } from '@/api/system-manage'

  const emit = defineEmits<{
    success: [row: Api.SystemManage.ReportDetail]
  }>()

  const visible = ref(false)
  const saving = ref(false)
  const formRef = ref<FormInstance>()
  const currentId = ref<number | null>(null)
  const targetTypeLabel = ref<string>('')

  type ActionType = Api.SystemManage.ReportProcessAction['type']

  interface HandleForm {
    status: 'resolved' | 'rejected'
    remark: string
    /** 选中的动作类型（字符串数组，传给 ElCheckboxGroup） */
    selectedActions: ActionType[]
  }

  const form = reactive<HandleForm>({
    status: 'resolved',
    remark: '',
    selectedActions: []
  })

  const rules: FormRules<HandleForm> = {
    status: [{ required: true, message: '请选择处理结果', trigger: 'change' }]
  }

  const statusOptions = [
    { value: 'resolved', label: '已处理', description: '联动执行勾选的处置动作' },
    { value: 'rejected', label: '已驳回', description: '不执行处置动作' }
  ]

  /** 当前可选的处置动作（根据被举报对象类型动态展示） */
  const availableActions = computed<{ value: ActionType; label: string; description: string }[]>(
    () => {
      const all: { value: ActionType; label: string; description: string; targetType: string[] }[] =
        [
          {
            value: 'hide_comment',
            label: '隐藏评论',
            description: '将评论状态置为「已驳回」',
            targetType: ['comment']
          },
          {
            value: 'delete_comment',
            label: '删除评论',
            description: '递归删除该评论及其回复',
            targetType: ['comment']
          },
          {
            value: 'freeze_user',
            label: '冻结用户（永久）',
            description: '永久冻结被举报用户，需管理员人工解冻',
            targetType: ['user', 'comment']
          }
        ]
      if (!targetTypeLabel.value) return []
      return all
        .filter((a) => a.targetType.includes(targetTypeLabel.value))
        .map(({ value, label, description }) => ({ value, label, description }))
    }
  )

  // 永久冻结：动作仅含 type，协议不携带时长字段（冻结为永久，需管理员人工解冻）

  const resetForm = () => {
    form.status = 'resolved'
    form.remark = ''
    form.selectedActions = []
    targetTypeLabel.value = ''
    aiTriageResult.value = null
    formRef.value?.resetFields()
  }

  // ========== AI 智能初判 ==========

  const triaging = ref(false)
  const aiTriageResult = ref<Api.SystemManage.ReportAiTriageResult | null>(null)

  const handleAiTriage = async () => {
    if (!currentId.value) return
    triaging.value = true
    try {
      aiTriageResult.value = await fetchAiTriageReport(currentId.value)
    } catch {
      // 错误信息由拦截器统一提示
    } finally {
      triaging.value = false
    }
  }

  /** 采纳 AI 初判建议：回填处理结果与备注 */
  const handleAdoptTriage = () => {
    if (!aiTriageResult.value) return
    form.status = aiTriageResult.value.suggestion === 'uphold' ? 'resolved' : 'rejected'
    if (!form.remark) {
      form.remark = `AI 初判：${aiTriageResult.value.reason}`
    }
    ElMessage.success('已采纳 AI 初判建议，请确认后提交')
  }

  const open = (row: Api.SystemManage.ReportDetail) => {
    currentId.value = row.id
    targetTypeLabel.value = row.reportable_type
    form.status = 'resolved'
    form.remark = ''
    form.selectedActions = []
    visible.value = true
  }

  const handleCancel = () => {
    visible.value = false
    resetForm()
  }

  const handleSubmit = async () => {
    if (!formRef.value || !currentId.value) return
    const valid = await formRef.value.validate().catch(() => false)
    if (!valid) return
    saving.value = true
    try {
      const actions: Api.SystemManage.ReportProcessAction[] | undefined =
        form.status === 'resolved' && form.selectedActions.length > 0
          ? form.selectedActions.map((type) => ({ type }))
          : undefined

      const payload: Api.SystemManage.ReportProcessParams = {
        status: form.status,
        remark: form.remark || null,
        actions
      }
      const res = await fetchProcessReport(currentId.value, payload)
      emit('success', res)
      visible.value = false
      resetForm()
    } finally {
      saving.value = false
    }
  }

  defineExpose({ open })
</script>

<template>
  <ElDialog
    v-model="visible"
    title="处理举报"
    width="600px"
    :close-on-click-modal="false"
    destroy-on-close
    align-center
  >
    <ElForm ref="formRef" :model="form" :rules="rules" label-width="90px" label-position="right">
      <ElFormItem label="AI 初判">
        <div class="w-full">
          <ElButton type="primary" plain size="small" :loading="triaging" @click="handleAiTriage">
            开始智能初判
          </ElButton>
          <ElAlert
            v-if="aiTriageResult"
            :type="aiTriageResult.suggestion === 'uphold' ? 'warning' : 'success'"
            :closable="false"
            class="mt-2"
            show-icon
          >
            <template #title>
              <div class="flex items-center gap-2">
                <span>{{ aiTriageResult.suggestion_label }}</span>
                <ElButton size="small" text type="primary" @click="handleAdoptTriage">
                  采纳建议
                </ElButton>
              </div>
            </template>
            <div class="text-sm">{{ aiTriageResult.reason }}</div>
          </ElAlert>
        </div>
      </ElFormItem>
      <ElFormItem label="处理结果" prop="status">
        <ElRadioGroup v-model="form.status">
          <ElRadio v-for="opt in statusOptions" :key="opt.value" :value="opt.value">
            <div class="flex flex-col">
              <span class="font-medium">{{ opt.label }}</span>
              <span class="text-xs text-g-500">{{ opt.description }}</span>
            </div>
          </ElRadio>
        </ElRadioGroup>
      </ElFormItem>

      <template v-if="form.status === 'resolved'">
        <ElDivider content-position="left">联动处置动作</ElDivider>

        <ElAlert
          v-if="availableActions.length === 0"
          type="info"
          :closable="false"
          title="该被举报对象类型暂无可用的联动处置动作"
          show-icon
          class="mb-3"
        />

        <ElFormItem v-else label="处置动作">
          <ElCheckboxGroup v-model="form.selectedActions" class="flex flex-col gap-2">
            <ElCheckbox
              v-for="opt in availableActions"
              :key="opt.value"
              :value="opt.value"
              :label="opt.value"
              border
              class="!w-full"
            >
              <div class="flex items-center gap-2">
                <span class="font-medium">{{ opt.label }}</span>
                <span class="text-xs text-g-500">{{ opt.description }}</span>
              </div>
            </ElCheckbox>
          </ElCheckboxGroup>
        </ElFormItem>
      </template>

      <ElFormItem label="处理备注" prop="remark">
        <ElInput
          v-model="form.remark"
          type="textarea"
          :rows="4"
          maxlength="500"
          show-word-limit
          placeholder="请填写处理说明（可选）"
        />
      </ElFormItem>
    </ElForm>

    <template #footer>
      <div class="flex justify-end gap-2">
        <ElButton @click="handleCancel">取消</ElButton>
        <ElButton type="primary" :loading="saving" @click="handleSubmit">确认提交</ElButton>
      </div>
    </template>
  </ElDialog>
</template>
