<script setup lang="ts">
  import { reactive, ref } from 'vue'
  import {
    ElDialog,
    ElForm,
    ElFormItem,
    ElRadioGroup,
    ElRadioButton,
    ElInput,
    ElButton,
    ElTag
  } from 'element-plus'
  import type { FormInstance } from 'element-plus'
  import { fetchReviewComment } from '@/api/content-manage'

  const emit = defineEmits<{
    success: [row: Api.ContentManage.CommentListItem]
  }>()

  const visible = ref(false)
  const saving = ref(false)
  const formRef = ref<FormInstance>()
  const currentId = ref<number | null>(null)

  interface ReviewForm {
    status: string
    remark: string
  }

  const form = reactive<ReviewForm>({
    status: 'approved',
    remark: ''
  })

  const statusOptions = [
    { value: 'approved', label: '通过', type: 'success' },
    { value: 'rejected', label: '驳回', type: 'danger' },
    { value: 'review', label: '审核中', type: 'primary' }
  ]

  const resetForm = () => {
    form.status = 'approved'
    form.remark = ''
    formRef.value?.resetFields()
  }

  const open = (row: Api.ContentManage.CommentListItem) => {
    currentId.value = row.id
    form.status = row.status === 'pending' || row.status === 'review' ? 'approved' : row.status
    form.remark = ''
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
      const res = await fetchReviewComment(currentId.value, {
        status: form.status,
        remark: form.remark || null
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
    title="审核评论"
    width="520px"
    :close-on-click-modal="false"
    destroy-on-close
    align-center
  >
    <ElForm ref="formRef" :model="form" label-width="90px" label-position="right">
      <ElFormItem label="审核结果" prop="status" required>
        <ElRadioGroup v-model="form.status">
          <ElRadioButton v-for="opt in statusOptions" :key="opt.value" :value="opt.value">
            <ElTag :type="opt.type as any" size="small" effect="light" class="mr-0">{{
              opt.label
            }}</ElTag>
          </ElRadioButton>
        </ElRadioGroup>
      </ElFormItem>
      <ElFormItem label="审核备注" prop="remark">
        <ElInput
          v-model="form.remark"
          type="textarea"
          :rows="4"
          maxlength="500"
          show-word-limit
          placeholder="可填写驳回原因或备注说明（可选）"
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
