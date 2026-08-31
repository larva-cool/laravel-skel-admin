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
  import { fetchRejectIdentityVerification, fetchDictItemsByCode } from '@/api/system-manage'

  type IdentityItem = Api.SystemManage.IdentityVerificationListItem

  interface RejectReasonOption {
    label: string
    value: string
    labelType?: string
  }

  const emit = defineEmits<{
    success: [row: IdentityItem]
  }>()

  const visible = ref(false)
  const saving = ref(false)
  const formRef = ref<FormInstance>()
  const currentId = ref<number | null>(null)

  const form = reactive<{
    reason: string
    remark: string
  }>({
    reason: '',
    remark: ''
  })

  const reasonOptions = ref<RejectReasonOption[]>([])

  const mapTagType = (t?: string) => {
    if (!t || t === 'default') return undefined
    return t as 'primary' | 'success' | 'warning' | 'danger' | 'info'
  }

  const rules: FormRules<typeof form> = {
    reason: [{ required: true, message: '请选择驳回原因', trigger: 'change' }]
  }

  async function loadReasons() {
    try {
      const items = await fetchDictItemsByCode('identity_reject_reason')
      reasonOptions.value = (items || []).map((it) => ({
        label: it.label,
        value: it.value,
        labelType: it.label_type || 'default'
      }))
    } catch {
      reasonOptions.value = []
    }
  }

  const resetForm = () => {
    form.reason = ''
    form.remark = ''
    formRef.value?.resetFields()
  }

  const open = (row: IdentityItem) => {
    currentId.value = row.id
    form.reason = ''
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
      const res = await fetchRejectIdentityVerification(currentId.value, {
        reason: form.reason,
        remark: form.remark || undefined
      })
      emit('success', res)
      visible.value = false
      resetForm()
    } finally {
      saving.value = false
    }
  }

  defineExpose({ open })
  onMounted(loadReasons)
</script>

<template>
  <ElDialog
    v-model="visible"
    title="驳回实名认证"
    width="540px"
    :close-on-click-modal="false"
    destroy-on-close
    align-center
  >
    <ElForm ref="formRef" :model="form" :rules="rules" label-width="90px" label-position="right">
      <ElFormItem label="驳回原因" prop="reason">
        <ElSelect v-model="form.reason" placeholder="请选择驳回原因" class="w-full">
          <ElOption
            v-for="opt in reasonOptions"
            :key="opt.value"
            :value="opt.value"
            :label="opt.label"
          >
            <div class="flex items-center gap-2">
              <ElTag :type="mapTagType(opt.labelType) as any" size="small" effect="light">
                {{ opt.label }}
              </ElTag>
            </div>
          </ElOption>
        </ElSelect>
      </ElFormItem>
      <ElFormItem label="驳回备注" prop="remark">
        <ElInput
          v-model="form.remark"
          type="textarea"
          :rows="4"
          maxlength="500"
          show-word-limit
          placeholder="请填写驳回说明（可选，最多 500 字）"
        />
      </ElFormItem>
    </ElForm>

    <template #footer>
      <div class="flex justify-end gap-2">
        <ElButton @click="handleCancel">取消</ElButton>
        <ElButton type="danger" :loading="saving" @click="handleSubmit">确认驳回</ElButton>
      </div>
    </template>
  </ElDialog>
</template>
