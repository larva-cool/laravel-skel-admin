<script setup lang="ts">
  import { reactive, ref } from 'vue'
  import {
    ElDialog,
    ElForm,
    ElFormItem,
    ElSelect,
    ElOption,
    ElInput,
    ElButton,
    ElTag
  } from 'element-plus'
  import type { FormInstance, FormRules } from 'element-plus'
  import { fetchUpdateFeedback } from '@/api/system-manage'

  const emit = defineEmits<{
    success: [row: Api.SystemManage.FeedbackListItem]
  }>()

  const visible = ref(false)
  const saving = ref(false)
  const formRef = ref<FormInstance>()
  const currentId = ref<number | null>(null)

  interface HandleForm {
    status: number | null
    priority: number | null
    admin_remark: string
  }

  const form = reactive<HandleForm>({
    status: null,
    priority: null,
    admin_remark: ''
  })

  const statusOptions = [
    { value: 0, label: '待处理', type: 'info' },
    { value: 1, label: '分析中', type: 'warning' },
    { value: 2, label: '已规划', type: 'primary' },
    { value: 3, label: '处理中', type: 'warning' },
    { value: 4, label: '已解决', type: 'success' },
    { value: 5, label: '已关闭', type: 'info' }
  ]

  const priorityOptions = [
    { value: 1, label: '低', type: 'info' },
    { value: 2, label: '中', type: 'warning' },
    { value: 3, label: '高', type: 'danger' },
    { value: 4, label: '紧急', type: 'danger' }
  ]

  const rules: FormRules<HandleForm> = {
    status: [{ required: true, message: '请选择处理状态', trigger: 'change' }],
    priority: [{ required: true, message: '请选择优先级', trigger: 'change' }]
  }

  const resetForm = () => {
    form.status = null
    form.priority = null
    form.admin_remark = ''
    formRef.value?.resetFields()
  }

  const open = (row: Api.SystemManage.FeedbackListItem) => {
    currentId.value = row.id
    form.status = row.status
    form.priority = row.priority
    form.admin_remark = row.admin_remark || ''
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
      const res = await fetchUpdateFeedback(currentId.value, {
        status: form.status ?? undefined,
        priority: form.priority ?? undefined,
        admin_remark: form.admin_remark || null
      })
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
    title="处理反馈"
    width="540px"
    :close-on-click-modal="false"
    destroy-on-close
    align-center
  >
    <ElForm ref="formRef" :model="form" :rules="rules" label-width="90px" label-position="right">
      <ElFormItem label="处理状态" prop="status">
        <ElSelect v-model="form.status" placeholder="请选择处理状态" class="w-full">
          <ElOption
            v-for="opt in statusOptions"
            :key="opt.value"
            :value="opt.value"
            :label="opt.label"
          >
            <div class="flex items-center gap-2">
              <ElTag :type="opt.type as any" size="small" effect="light">{{ opt.label }}</ElTag>
            </div>
          </ElOption>
        </ElSelect>
      </ElFormItem>
      <ElFormItem label="优先级" prop="priority">
        <ElSelect v-model="form.priority" placeholder="请选择优先级" class="w-full">
          <ElOption
            v-for="opt in priorityOptions"
            :key="opt.value"
            :value="opt.value"
            :label="opt.label"
          >
            <div class="flex items-center gap-2">
              <ElTag :type="opt.type as any" size="small" effect="light">{{ opt.label }}</ElTag>
            </div>
          </ElOption>
        </ElSelect>
      </ElFormItem>
      <ElFormItem label="处理备注" prop="admin_remark">
        <ElInput
          v-model="form.admin_remark"
          type="textarea"
          :rows="4"
          maxlength="500"
          show-word-limit
          placeholder="请填写处理方案、备注或说明（可选）"
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
