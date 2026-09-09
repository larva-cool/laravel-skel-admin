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
  import type { FormInstance, FormRules } from 'element-plus'
  import { fetchConfirmRecharge, fetchCloseRecharge } from '@/api/wallet'

  type RechargeItem = Api.WalletManage.Recharge

  const emit = defineEmits<{
    success: [row: RechargeItem]
  }>()

  defineOptions({ name: 'RechargeHandleDialog' })

  const visible = ref(false)
  const saving = ref(false)
  const formRef = ref<FormInstance>()
  const currentId = ref<number | null>(null)

  type ActionType = 'confirm' | 'close'

  interface HandleForm {
    action: ActionType
    remark: string
  }

  const form = reactive<HandleForm>({
    action: 'confirm',
    remark: ''
  })

  const actionOptions: { value: ActionType; label: string; type: string; desc: string }[] = [
    {
      value: 'confirm',
      label: '确认到账',
      type: 'success',
      desc: '标记订单已支付，用户余额将入账'
    },
    { value: 'close', label: '关闭订单', type: 'danger', desc: '标记订单已关闭，用户余额不会变动' }
  ]

  const rules: FormRules<HandleForm> = {
    action: [{ required: true, message: '请选择操作类型', trigger: 'change' }]
  }

  const resetForm = () => {
    form.action = 'confirm'
    form.remark = ''
    formRef.value?.resetFields()
  }

  const open = (row: RechargeItem) => {
    currentId.value = row.id
    form.action = 'confirm'
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
        form.action === 'confirm'
          ? await fetchConfirmRecharge(currentId.value, data)
          : await fetchCloseRecharge(currentId.value, data)
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
    title="处理充值订单"
    width="520px"
    :close-on-click-modal="false"
    destroy-on-close
    align-center
  >
    <ElForm ref="formRef" :model="form" :rules="rules" label-width="90px" label-position="right">
      <ElFormItem label="操作类型" prop="action" required>
        <ElRadioGroup v-model="form.action">
          <ElRadioButton v-for="opt in actionOptions" :key="opt.value" :value="opt.value">
            <ElTag :type="opt.type as any" size="small" effect="light" class="mr-0">{{
              opt.label
            }}</ElTag>
          </ElRadioButton>
        </ElRadioGroup>
        <div class="mt-2 text-xs text-g-500">
          {{ actionOptions.find((o) => o.value === form.action)?.desc }}
        </div>
      </ElFormItem>
      <ElFormItem label="处理备注" prop="remark">
        <ElInput
          v-model="form.remark"
          type="textarea"
          :rows="4"
          maxlength="500"
          show-word-limit
          placeholder="可填写处理说明、凭证号等（可选）"
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
