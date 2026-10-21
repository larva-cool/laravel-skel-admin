<template>
  <ElDialog
    v-model="dialogVisible"
    :title="title"
    width="600px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <ElForm ref="formRef" :model="form" :rules="rules" label-width="100px" label-position="right">
      <ElFormItem label="服务商" prop="provider">
        <ElInput
          v-model="form.provider"
          placeholder="请输入 AI 服务商标识"
          maxlength="50"
          clearable
        />
      </ElFormItem>
      <ElFormItem label="模型 ID" prop="model_id">
        <ElInput
          v-model="form.model_id"
          placeholder="请输入服务商侧模型标识"
          maxlength="100"
          clearable
        />
      </ElFormItem>
      <ElFormItem label="展示名称" prop="name">
        <ElInput
          v-model="form.name"
          placeholder="请输入展示名称"
          maxlength="100"
          show-word-limit
          clearable
        />
      </ElFormItem>
      <ElFormItem label="默认模型" prop="is_default">
        <ElSwitch v-model="form.is_default" />
        <span class="ml-2 text-xs text-secondary">设为默认后将自动取消其他模型的默认标记</span>
      </ElFormItem>
      <ElFormItem label="启用状态" prop="is_enabled">
        <ElSwitch v-model="form.is_enabled" />
      </ElFormItem>
      <ElFormItem label="排序" prop="sort">
        <ElInputNumber
          v-model="form.sort"
          :min="0"
          :max="65535"
          :step="1"
          placeholder="越小越靠前"
        />
      </ElFormItem>
    </ElForm>

    <template #footer>
      <ElButton @click="handleClose">取消</ElButton>
      <ElButton type="primary" :loading="submitting" @click="handleSubmit">确认</ElButton>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import { fetchCreateChatModel, fetchUpdateChatModel } from '@/api/chat-model'
  import type { FormInstance, FormRules } from 'element-plus'

  defineOptions({ name: 'ChatModelEditDialog' })

  const emit = defineEmits<{
    (e: 'success'): void
  }>()

  const dialogVisible = ref(false)
  const formRef = ref<FormInstance>()
  const submitting = ref(false)
  const id = ref<number | null>(null)
  const isEdit = computed(() => id.value !== null)
  const title = computed(() => (isEdit.value ? '编辑模型' : '新增模型'))

  const form = reactive<Api.ChatModel.SaveParams>({
    provider: 'volc',
    model_id: '',
    name: '',
    is_default: false,
    is_enabled: true,
    sort: 0
  })

  const rules: FormRules = {
    provider: [{ required: true, message: '请输入 AI 服务商标识', trigger: 'blur' }],
    model_id: [
      { required: true, message: '请输入模型 ID', trigger: 'blur' },
      { max: 100, message: '长度不能超过 100 字符', trigger: 'blur' }
    ],
    name: [
      { required: true, message: '请输入展示名称', trigger: 'blur' },
      { max: 100, message: '长度不能超过 100 字符', trigger: 'blur' }
    ],
    sort: [{ type: 'number', min: 0, message: '排序不能小于 0', trigger: 'blur' }]
  }

  const resetForm = () => {
    id.value = null
    form.provider = 'volc'
    form.model_id = ''
    form.name = ''
    form.is_default = false
    form.is_enabled = true
    form.sort = 0
  }

  const open = (row?: Api.ChatModel.ListItem) => {
    resetForm()
    if (row) {
      id.value = row.id
      form.provider = row.provider
      form.model_id = row.model_id
      form.name = row.name
      form.is_default = row.is_default
      form.is_enabled = row.is_enabled
      form.sort = row.sort
    }
    dialogVisible.value = true
    nextTick(() => formRef.value?.clearValidate())
  }

  const handleSubmit = async () => {
    if (!formRef.value) return
    await formRef.value.validate(async (valid) => {
      if (!valid) return
      submitting.value = true
      try {
        if (isEdit.value && id.value) {
          await fetchUpdateChatModel(id.value, { ...form })
        } else {
          await fetchCreateChatModel({ ...form })
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

<style scoped lang="scss"></style>
