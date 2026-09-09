<script setup lang="ts">
  import { reactive, ref } from 'vue'
  import { ElDialog, ElForm, ElFormItem, ElInput, ElButton } from 'element-plus'
  import type { FormInstance, FormRules } from 'element-plus'
  import { fetchRejectWithdraw } from '@/api/wallet'

  type WithdrawItem = Api.WalletManage.Withdraw

  const emit = defineEmits<{
    success: [row: WithdrawItem]
  }>()

  defineOptions({ name: 'WithdrawRejectDialog' })

  const visible = ref(false)
  const saving = ref(false)
  const formRef = ref<FormInstance>()
  const currentId = ref<number | null>(null)

  interface RejectForm {
    reason: string
    remark: string
  }

  const form = reactive<RejectForm>({
    reason: '',
    remark: ''
  })

  const rules: FormRules<RejectForm> = {
    reason: [{ required: true, message: '请填写驳回原因', trigger: 'blur' }]
  }

  const resetForm = () => {
    form.reason = ''
    form.remark = ''
    formRef.value?.resetFields()
  }

  const open = (row: WithdrawItem) => {
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
      const res = await fetchRejectWithdraw(currentId.value, {
        reason: form.reason,
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
    title="审核驳回"
    width="520px"
    :close-on-click-modal="false"
    destroy-on-close
    align-center
  >
    <ElForm ref="formRef" :model="form" :rules="rules" label-width="80px" label-position="right">
      <ElFormItem label="驳回原因" prop="reason">
        <ElInput
          v-model="form.reason"
          type="textarea"
          :rows="4"
          maxlength="200"
          show-word-limit
          placeholder="请填写驳回原因（必填，将展示给用户）"
        />
      </ElFormItem>
      <ElFormItem label="内部备注" prop="remark">
        <ElInput
          v-model="form.remark"
          type="textarea"
          :rows="2"
          maxlength="500"
          show-word-limit
          placeholder="内部备注说明（可选）"
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
