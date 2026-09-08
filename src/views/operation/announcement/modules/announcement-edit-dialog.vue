<template>
  <ElDialog
    v-model="dialogVisible"
    :title="title"
    width="800px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <ElForm ref="formRef" :model="form" :rules="rules" label-width="100px" label-position="right">
      <ElFormItem label="标题" prop="title">
        <ElInput
          v-model="form.title"
          placeholder="请输入公告标题"
          maxlength="200"
          show-word-limit
          clearable
        />
      </ElFormItem>
      <ElFormItem label="摘要" prop="summary">
        <ElInput
          v-model="form.summary"
          type="textarea"
          :rows="2"
          placeholder="一句话摘要，不填则前端不展示（可选）"
          maxlength="500"
          show-word-limit
          clearable
        />
      </ElFormItem>
      <ElFormItem label="封面图" prop="cover_image">
        <ElInput
          v-model="form.cover_image"
          placeholder="封面图 URL（可选）"
          maxlength="500"
          clearable
        />
        <div v-if="form.cover_image" class="mt-2">
          <ElImage
            :src="form.cover_image"
            :preview-src-list="[form.cover_image]"
            :hide-on-click-modal="true"
            fit="contain"
            style="
              max-width: 240px;
              max-height: 100px;
              border: 1px solid var(--el-border-color-lighter);
              border-radius: 4px;
            "
            :preview-teleported="true"
          />
        </div>
      </ElFormItem>
      <ElFormItem label="正文" prop="content">
        <ArtWangEditor
          v-model="form.content"
          height="400px"
          placeholder="请输入公告正文"
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
  import type { FormInstance, FormRules } from 'element-plus'
  import ArtWangEditor from '@/components/core/forms/art-wang-editor/index.vue'
  import {
    fetchCreateAnnouncement,
    fetchUpdateAnnouncement,
    fetchGetAnnouncementDetail
  } from '@/api/operation-manage'

  defineOptions({ name: 'AnnouncementEditDialog' })

  const emit = defineEmits<{
    (e: 'success'): void
  }>()

  const dialogVisible = ref(false)
  const formRef = ref<FormInstance>()
  const submitting = ref(false)
  const id = ref<number | null>(null)
  const isEdit = computed(() => id.value !== null)
  const title = computed(() => (isEdit.value ? '编辑公告' : '新增公告'))

  const statusOptions = [
    { label: '草稿', value: 'draft' },
    { label: '已发布', value: 'published' },
    { label: '已归档', value: 'archived' }
  ]

  const form = reactive<{
    title: string
    summary: string | null
    content: string
    cover_image: string | null
    status: string
    sort: number
  }>({
    title: '',
    summary: null,
    content: '',
    cover_image: null,
    status: 'draft',
    sort: 1000
  })

  const rules: FormRules = {
    title: [
      { required: true, message: '请输入公告标题', trigger: 'blur' },
      { max: 200, message: '长度不能超过 200 字符', trigger: 'blur' }
    ],
    content: [{ required: true, message: '请输入公告正文', trigger: 'blur' }],
    status: [{ required: true, message: '请选择状态', trigger: 'change' }],
    sort: [{ type: 'number', min: 0, message: '排序权重不能小于 0', trigger: 'blur' }]
  }

  const open = async (row?: Api.OperationManage.AnnouncementListItem) => {
    dialogVisible.value = true
    if (row) {
      id.value = row.id
      // 编辑时拉取详情获取 content
      try {
        const detail = await fetchGetAnnouncementDetail(row.id)
        form.title = detail.title
        form.summary = detail.summary
        form.content = detail.content ?? ''
        form.cover_image = detail.cover_image
        form.status = detail.status
        form.sort = detail.sort
      } catch {
        form.title = row.title
        form.summary = row.summary
        form.content = ''
        form.cover_image = row.cover_image
        form.status = row.status
        form.sort = row.sort
      }
    } else {
      id.value = null
      form.title = ''
      form.summary = null
      form.content = ''
      form.cover_image = null
      form.status = 'draft'
      form.sort = 1000
    }
    nextTick(() => formRef.value?.clearValidate())
  }

  const handleSubmit = async () => {
    if (!formRef.value) return
    await formRef.value.validate(async (valid) => {
      if (!valid) return
      submitting.value = true
      try {
        const payload: Api.OperationManage.AnnouncementSaveParams = {
          title: form.title,
          summary: form.summary,
          content: form.content,
          cover_image: form.cover_image,
          status: form.status,
          sort: form.sort
        }

        if (isEdit.value && id.value) {
          await fetchUpdateAnnouncement(id.value, payload)
        } else {
          await fetchCreateAnnouncement(payload)
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
