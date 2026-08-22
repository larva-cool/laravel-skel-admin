<template>
  <ElDialog
    v-model="dialogVisible"
    :title="title"
    width="500px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <ElForm ref="formRef" :model="form" :rules="rules" label-width="90px">
      <ElFormItem label="应用名称" prop="name">
        <ElInput v-model="form.name" placeholder="请输入应用名称" clearable />
      </ElFormItem>
      <ElFormItem label="应用标识" prop="slug">
        <ElInput v-model="form.slug" placeholder="如 consumer-app" clearable />
      </ElFormItem>
      <ElFormItem label="描述" prop="description">
        <ElInput
          v-model="form.description"
          type="textarea"
          :rows="3"
          placeholder="应用描述（可选）"
        />
      </ElFormItem>
      <ElFormItem label="图标URL" prop="icon">
        <ElInput v-model="form.icon" placeholder="应用图标URL（可选）" clearable />
      </ElFormItem>
      <ElFormItem label="排序" prop="sort">
        <ElInputNumber v-model="form.sort" :min="0" controls-position="right" style="width: 100%" />
      </ElFormItem>
      <ElFormItem label="状态" prop="status">
        <ElSwitch v-model="form.status" active-text="启用" inactive-text="禁用" />
      </ElFormItem>
    </ElForm>

    <template #footer>
      <ElButton @click="handleClose">取消</ElButton>
      <ElButton type="primary" :loading="submitting" @click="handleSubmit">确认</ElButton>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import { fetchCreateApp, fetchUpdateApp } from '@/api/app-manage'
  import type { FormInstance, FormRules } from 'element-plus'

  defineOptions({ name: 'AppDialog' })

  const emit = defineEmits<{
    (e: 'refresh'): void
  }>()

  const dialogVisible = ref(false)
  const formRef = ref<FormInstance>()
  const submitting = ref(false)
  const id = ref<number | null>(null)
  const isEdit = computed(() => id.value !== null)
  const title = computed(() => (isEdit.value ? '编辑应用' : '新增应用'))

  const form = reactive({
    name: '',
    slug: '',
    description: '',
    icon: '',
    sort: 0,
    status: true
  })

  const rules: FormRules = {
    name: [{ required: true, message: '请输入应用名称', trigger: 'blur' }],
    slug: [
      { required: true, message: '请输入应用标识', trigger: 'blur' },
      {
        pattern: /^[a-z0-9-]+$/,
        message: '只能包含小写字母、数字和连字符',
        trigger: 'blur'
      }
    ]
  }

  const open = (row: Api.AppManage.AppListItem | null) => {
    dialogVisible.value = true
    if (row) {
      id.value = row.id
      Object.assign(form, {
        name: row.name,
        slug: row.slug,
        description: row.description ?? '',
        icon: row.icon ?? '',
        sort: row.sort,
        status: row.status
      })
    } else {
      id.value = null
      Object.assign(form, {
        name: '',
        slug: '',
        description: '',
        icon: '',
        sort: 0,
        status: true
      })
    }
  }

  const handleSubmit = async () => {
    if (!formRef.value) return
    await formRef.value.validate(async (valid) => {
      if (!valid) return
      submitting.value = true
      try {
        const data: Api.AppManage.AppSaveParams = {
          name: form.name,
          slug: form.slug,
          description: form.description || null,
          icon: form.icon || null,
          sort: form.sort,
          status: form.status
        }
        if (isEdit.value && id.value) {
          await fetchUpdateApp(id.value, data)
        } else {
          await fetchCreateApp(data)
        }
        dialogVisible.value = false
        emit('refresh')
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
