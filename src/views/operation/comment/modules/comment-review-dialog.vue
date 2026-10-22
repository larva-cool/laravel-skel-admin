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
  import { fetchAiReviewComment, fetchReviewComment } from '@/api/content-manage'

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
    aiReviewResult.value = null
    formRef.value?.resetFields()
  }

  // ========== AI 敏感词智能复核 ==========

  const reviewing = ref(false)
  const aiReviewResult = ref<Api.ContentManage.CommentAiReviewResult | null>(null)

  const handleAiReview = async () => {
    if (!currentId.value) return
    reviewing.value = true
    try {
      aiReviewResult.value = await fetchAiReviewComment(currentId.value)
    } catch {
      // 错误信息由拦截器统一提示
    } finally {
      reviewing.value = false
    }
  }

  /** 采纳 AI 复核建议：回填审核结果与备注 */
  const handleAdoptReview = () => {
    if (!aiReviewResult.value) return
    form.status = aiReviewResult.value.suggestion === 'reject' ? 'rejected' : 'approved'
    if (!form.remark) {
      form.remark = `AI 复核：${aiReviewResult.value.reason}`
    }
    ElMessage.success('已采纳 AI 复核建议，请确认后提交')
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
      <ElFormItem label="AI 复核">
        <div class="w-full">
          <ElButton type="primary" plain size="small" :loading="reviewing" @click="handleAiReview">
            敏感词智能复核
          </ElButton>
          <div v-if="aiReviewResult" class="mt-2">
            <div v-if="aiReviewResult.hits.length" class="mb-1 flex flex-wrap gap-1">
              <ElTag
                v-for="hit in aiReviewResult.hits"
                :key="hit.word"
                :type="hit.level === 'block' ? 'danger' : 'warning'"
                size="small"
                effect="light"
              >
                {{ hit.word }}
              </ElTag>
            </div>
            <ElAlert
              :type="aiReviewResult.suggestion === 'reject' ? 'error' : 'success'"
              :closable="false"
              show-icon
            >
              <template #title>
                <div class="flex items-center gap-2">
                  <span>{{ aiReviewResult.suggestion_label }}</span>
                  <ElButton size="small" text type="primary" @click="handleAdoptReview">
                    采纳建议
                  </ElButton>
                </div>
              </template>
              <div class="text-sm">{{ aiReviewResult.reason }}</div>
            </ElAlert>
          </div>
        </div>
      </ElFormItem>
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
