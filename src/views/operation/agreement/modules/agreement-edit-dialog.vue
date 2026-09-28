<template>
  <ElDialog
    v-model="dialogVisible"
    :title="title"
    width="800px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <ElForm ref="formRef" :model="form" :rules="rules" label-width="100px" label-position="right">
      <ElFormItem label="协议标题" prop="title">
        <ElInput
          v-model="form.title"
          placeholder="请输入协议标题"
          maxlength="200"
          show-word-limit
          clearable
        />
      </ElFormItem>
      <ElFormItem label="协议类别" prop="category">
        <ElSelect v-model="form.category" placeholder="请选择协议类别" clearable class="w-full">
          <ElOption
            v-for="opt in categoryOptions"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          />
        </ElSelect>
      </ElFormItem>
      <ElFormItem label="版本号" prop="version">
        <ElInput
          v-model="form.version"
          placeholder="请输入版本号，如 v1.0.0"
          maxlength="20"
          show-word-limit
          clearable
        />
      </ElFormItem>
      <ElFormItem label="协议内容" prop="content">
        <ArtWangEditor
          ref="editorRef"
          v-model="form.content"
          height="400px"
          placeholder="请输入协议内容"
          :upload-config="{ isCustomUpload: true, server: '/admin/uploader/image' }"
        />
      </ElFormItem>
      <ElFormItem label="状态" prop="status">
        <ElSelect v-model="form.status" placeholder="请选择状态" class="w-full">
          <ElOption
            v-for="opt in statusOptions"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          />
        </ElSelect>
      </ElFormItem>
      <ElFormItem label="排序权重" prop="sort">
        <ElInputNumber v-model="form.sort" :min="0" :step="1" placeholder="越小越靠前" />
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
    fetchCreateAgreement,
    fetchGetAgreementDetail,
    fetchUpdateAgreement
  } from '@/api/operation-manage'
  import { fetchDictItemsByCode } from '@/api/system-manage'
  import ArtWangEditor from '@/components/core/forms/art-wang-editor/index.vue'
  import type { FormInstance, FormRules } from 'element-plus'

  defineOptions({ name: 'AgreementEditDialog' })

  const emit = defineEmits<{
    (e: 'success'): void
  }>()

  const dialogVisible = ref(false)
  const formRef = ref<FormInstance>()
  const editorRef = ref<InstanceType<typeof ArtWangEditor>>()
  const submitting = ref(false)
  const id = ref<number | null>(null)
  const isEdit = computed(() => id.value !== null)
  const title = computed(() => (isEdit.value ? '编辑协议' : '新增协议'))

  const categoryOptions = ref<{ label: string; value: string }[]>([])

  const statusOptions = [
    { label: '草稿', value: 'draft' },
    { label: '已发布', value: 'published' },
    { label: '已归档', value: 'archived' }
  ]

  const form = reactive<{
    title: string
    category: string
    version: string
    content: string
    status: string
    sort: number
  }>({
    title: '',
    category: '',
    version: '',
    content: '',
    status: 'draft',
    sort: 1000
  })

  const rules: FormRules = {
    title: [
      { required: true, message: '请输入协议标题', trigger: 'blur' },
      { max: 200, message: '长度不能超过 200 字符', trigger: 'blur' }
    ],
    category: [{ required: true, message: '请选择协议类别', trigger: 'change' }],
    version: [
      { required: true, message: '请输入版本号', trigger: 'blur' },
      { max: 20, message: '长度不能超过 20 字符', trigger: 'blur' }
    ],
    content: [{ required: true, message: '请输入协议内容', trigger: 'blur' }],
    status: [{ required: true, message: '请选择状态', trigger: 'change' }],
    sort: [{ type: 'number', min: 0, message: '排序权重不能小于 0', trigger: 'blur' }]
  }

  const resetForm = () => {
    id.value = null
    form.title = ''
    form.category = ''
    form.version = ''
    form.content = ''
    form.status = 'draft'
    form.sort = 1000
  }

  const waitEditorReady = (): Promise<void> => {
    return new Promise((resolve) => {
      const trySet = (retry = 0) => {
        if (editorRef.value?.getEditor()) {
          resolve()
          return
        }
        if (retry > 50) {
          resolve()
          return
        }
        setTimeout(() => trySet(retry + 1), 50)
      }
      trySet()
    })
  }

  async function loadCategoryOptions() {
    try {
      const items = await fetchDictItemsByCode('agreement_category')
      categoryOptions.value = (items || []).map((it) => ({ label: it.label, value: it.value }))
    } catch {
      categoryOptions.value = []
    }
  }

  const open = async (row?: Api.OperationManage.AgreementListItem) => {
    resetForm()
    dialogVisible.value = true

    if (row) {
      id.value = row.id
      try {
        const detail = await fetchGetAgreementDetail(row.id)
        form.title = detail.title
        form.category = detail.category
        form.version = detail.version
        form.content = detail.content ?? ''
        form.status = detail.status
        form.sort = detail.sort
      } catch {
        form.title = row.title
        form.category = row.category
        form.version = row.version
        form.status = row.status
        form.sort = row.sort
        form.content = ''
      }
    }

    await nextTick()
    await waitEditorReady()
    if (form.content) {
      editorRef.value?.setHtml(form.content)
    } else {
      editorRef.value?.clear()
    }

    formRef.value?.clearValidate()
  }

  const handleSubmit = async () => {
    if (!formRef.value) return
    await formRef.value.validate(async (valid) => {
      if (!valid) return
      submitting.value = true
      try {
        const payload: Api.OperationManage.AgreementSaveParams = {
          title: form.title,
          category: form.category,
          version: form.version,
          content: form.content,
          status: form.status,
          sort: form.sort
        }

        if (isEdit.value && id.value) {
          await fetchUpdateAgreement(id.value, payload)
        } else {
          await fetchCreateAgreement(payload)
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

  onMounted(loadCategoryOptions)

  defineExpose({ open })
</script>

<style scoped lang="scss"></style>
