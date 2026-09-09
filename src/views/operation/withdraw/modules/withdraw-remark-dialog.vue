<script setup lang="ts">
  import { reactive, ref, computed } from 'vue'
  import { ElDialog, ElForm, ElFormItem, ElInput, ElButton } from 'element-plus'
  import type { FormInstance } from 'element-plus'
  import { fetchApproveWithdraw, fetchTransferWithdraw } from '@/api/wallet'

  type WithdrawItem = Api.WalletManage.Withdraw
  type ActionType = 'approve' | 'transfer'

  interface Props {
    actionType: ActionType
  }

  const props = withDefaults(defineProps<Props>(), {
    actionType: 'approve'
  })

  const emit = defineEmits<{
    success: [row: WithdrawItem]
  }>()

  defineOptions({ name: 'WithdrawRemarkDialog' })

  const visible = ref(false)
  const saving = ref(false)
  const formRef = ref<FormInstance>()
  const currentId = ref<number | null>(null)

  interface RemarkForm {
    remark: string
  }

  const form = reactive<RemarkForm>({
    remark: ''
  })

  const titleMap: Record<ActionType, string> = {
    approve: '审核通过',
    transfer: '标记已打款'
  }

  const btnMap: Record<ActionType, string> = {
    approve: '确认通过',
    transfer: '确认已打款'
  }

  const dialogTitle = computed(() => titleMap[props.actionType])
  const confirmText = computed(() => btnMap[props.actionType])

  const resetForm = () => {
    form.remark = ''
    formRef.value?.resetFields()
  }

  const open = (row: WithdrawItem) => {
    currentId.value = row.id
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
      const data = { remark: form.remark || null }
      const res =
        props.actionType === 'approve'
          ? await fetchApproveWithdraw(currentId.value, data)
          : await fetchTransferWithdraw(currentId.value, data)
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
    :title="dialogTitle"
    width="500px"
    :close-on-click-modal="false"
    destroy-on-close
    align-center
  >
    <ElForm ref="formRef" :model="form" label-width="80px" label-position="right">
      <ElFormItem label="备注" prop="remark">
        <ElInput
          v-model="form.remark"
          type="textarea"
          :rows="3"
          maxlength="500"
          show-word-limit
          :placeholder="
            actionType === 'approve' ? '可填写审核说明（可选）' : '可填写打款凭证号、说明等（可选）'
          "
        />
      </ElFormItem>
    </ElForm>

    <template #footer>
      <div class="flex justify-end gap-2">
        <ElButton @click="handleCancel">取消</ElButton>
        <ElButton type="primary" :loading="saving" @click="handleSubmit">{{
          confirmText
        }}</ElButton>
      </div>
    </template>
  </ElDialog>
</template>
