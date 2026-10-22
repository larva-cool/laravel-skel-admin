<template>
  <ElDialog
    v-model="dialogVisible"
    :title="title"
    width="700px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <ElForm ref="formRef" :model="form" :rules="rules" label-width="100px" label-position="right">
      <ElFormItem label="文档标题" prop="title">
        <ElInput
          v-model="form.title"
          placeholder="请输入文档标题"
          maxlength="200"
          show-word-limit
          clearable
        />
      </ElFormItem>
      <ElFormItem label="文档内容" prop="content">
        <ElInput
          v-model="form.content"
          type="textarea"
          :rows="14"
          placeholder="请输入文档原始内容，保存后系统将自动分块并向量化（段落之间以空行分隔效果更佳）"
          maxlength="200000"
          show-word-limit
        />
      </ElFormItem>
      <ElFormItem label="启用状态" prop="is_enabled">
        <ElSwitch v-model="form.is_enabled" />
        <span class="ml-2 text-xs text-secondary">停用的文档不参与语义检索</span>
      </ElFormItem>
    </ElForm>

    <template #footer>
      <ElButton @click="handleClose">取消</ElButton>
      <ElButton type="primary" :loading="submitting" @click="handleSubmit">确认</ElButton>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import {
    fetchCreateKnowledge,
    fetchGetKnowledgeDetail,
    fetchUpdateKnowledge
  } from '@/api/knowledge'
  import type { FormInstance, FormRules } from 'element-plus'
  import { ElMessage } from 'element-plus'

  defineOptions({ name: 'KnowledgeEditDialog' })

  const emit = defineEmits<{
    (e: 'success'): void
  }>()

  const dialogVisible = ref(false)
  const formRef = ref<FormInstance>()
  const submitting = ref(false)
  const id = ref<number | null>(null)
  const isEdit = computed(() => id.value !== null)
  const title = computed(() => (isEdit.value ? '编辑文档' : '新增文档'))

  const form = reactive<Api.Knowledge.SaveParams>({
    title: '',
    content: '',
    is_enabled: true
  })

  const rules: FormRules = {
    title: [
      { required: true, message: '请输入文档标题', trigger: 'blur' },
      { max: 200, message: '长度不能超过 200 字符', trigger: 'blur' }
    ],
    content: [
      { required: true, message: '请输入文档内容', trigger: 'blur' },
      { min: 10, message: '内容不能少于 10 个字符', trigger: 'blur' }
    ]
  }

  const resetForm = () => {
    id.value = null
    form.title = ''
    form.content = ''
    form.is_enabled = true
  }

  const open = async (row?: Api.Knowledge.ListItem) => {
    resetForm()
    dialogVisible.value = true
    nextTick(() => formRef.value?.clearValidate())

    if (row) {
      id.value = row.id
      form.title = row.title
      form.is_enabled = row.is_enabled
      // 列表不含原始内容，编辑时需拉取详情
      try {
        const detail = await fetchGetKnowledgeDetail(row.id)
        form.content = detail.content ?? ''
      } catch {
        ElMessage.error('获取文档内容失败')
      }
    }
  }

  const handleSubmit = async () => {
    if (!formRef.value) return
    await formRef.value.validate(async (valid) => {
      if (!valid) return
      submitting.value = true
      try {
        if (isEdit.value && id.value) {
          await fetchUpdateKnowledge(id.value, { ...form })
        } else {
          await fetchCreateKnowledge({ ...form })
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
