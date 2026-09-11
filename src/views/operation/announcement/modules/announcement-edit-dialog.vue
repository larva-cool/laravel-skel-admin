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
        <div class="cover-upload-wrapper">
          <ElUpload
            v-model:file-list="fileList"
            list-type="picture-card"
            :http-request="handleUploadRequest"
            :before-upload="beforeUpload"
            :on-remove="handleRemove"
            :limit="1"
            accept="image/*"
            class="cover-uploader"
            :class="{ 'has-file': fileList.length > 0 }"
          >
            <ElIcon><Plus /></ElIcon>

            <template #file="{ file }">
              <img class="el-upload-list__item-thumbnail" :src="file.url" alt="封面" />
              <span class="el-upload-list__item-actions">
                <span class="el-upload-list__item-preview" @click="handlePicturePreview(file)">
                  <ElIcon><ZoomIn /></ElIcon>
                </span>
                <span class="el-upload-list__item-delete" @click="handleDownload(file)">
                  <ElIcon><Download /></ElIcon>
                </span>
                <span class="el-upload-list__item-delete" @click="handleRemove()">
                  <ElIcon><Delete /></ElIcon>
                </span>
              </span>
            </template>
          </ElUpload>
          <div class="image-tip">支持 jpg/png/gif/webp 格式，建议尺寸 750×420</div>

          <ElDialog v-model="previewVisible" width="auto" append-to-body>
            <img :src="previewUrl" alt="封面预览" class="preview-img" />
          </ElDialog>
        </div>
      </ElFormItem>
      <ElFormItem label="正文" prop="content">
        <ArtWangEditor
          ref="editorRef"
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
  import {
    fetchCreateAnnouncement,
    fetchGetAnnouncementDetail,
    fetchUpdateAnnouncement
  } from '@/api/operation-manage'
  import { fetchUploadAttachmentFile } from '@/api/system-manage'
  import ArtWangEditor from '@/components/core/forms/art-wang-editor/index.vue'
  import { Delete, Download, Plus, ZoomIn } from '@element-plus/icons-vue'
  import type {
    FormInstance,
    FormRules,
    UploadFile,
    UploadRequestOptions,
    UploadUserFile
  } from 'element-plus'

  defineOptions({ name: 'AnnouncementEditDialog' })

  const emit = defineEmits<{
    (e: 'success'): void
  }>()

  const dialogVisible = ref(false)
  const formRef = ref<FormInstance>()
  const editorRef = ref<InstanceType<typeof ArtWangEditor>>()
  const submitting = ref(false)
  const id = ref<number | null>(null)
  const isEdit = computed(() => id.value !== null)
  const title = computed(() => (isEdit.value ? '编辑公告' : '新增公告'))

  const fileList = ref<UploadUserFile[]>([])
  const previewVisible = ref(false)
  const previewUrl = ref('')

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

  const resetForm = () => {
    id.value = null
    form.title = ''
    form.summary = null
    form.content = ''
    form.cover_image = null
    form.status = 'draft'
    form.sort = 1000
    fileList.value = []
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

  const beforeUpload = (rawFile: File) => {
    if (!rawFile.type.startsWith('image/')) {
      ElMessage.error('请选择图片文件')
      return false
    }
    return true
  }

  /**
   * 自定义上传：文件对象在 fileList 中一直存在（ElUpload 自动维护），
   * 上传前立即用本地 URL 填充预览，上传成功后只更新 url 为远端地址，
   * 不重建数组/DOM，从而消除闪烁。
   */
  const handleUploadRequest = async (options: UploadRequestOptions) => {
    // 通过 uid 在 fileList 中找到 ElUpload 创建的 UploadFile 对象
    const raw = options.file
    const uploadFile = fileList.value.find((f) => f.raw === raw)
    if (!uploadFile) {
      options.onError?.(
        new Error('文件未找到') as Error & { status: number; method: string; url: string }
      )
      return
    }

    // 立即生成本地预览，避免空白
    const localUrl = URL.createObjectURL(raw)
    uploadFile.url = localUrl
    uploadFile.status = 'uploading'

    try {
      const res = await fetchUploadAttachmentFile(raw)
      const remoteUrl = res.url ?? ''
      URL.revokeObjectURL(localUrl)
      uploadFile.url = remoteUrl
      uploadFile.status = 'success'
      form.cover_image = remoteUrl
      ElMessage.success('图片上传成功')
      options.onSuccess?.(res)
    } catch (e) {
      URL.revokeObjectURL(localUrl)
      uploadFile.status = 'fail'
      form.cover_image = null
      ElMessage.error('图片上传失败，请重试')
      options.onError?.(e as Error & { status: number; method: string; url: string })
    }
  }

  const handlePicturePreview = (file: UploadFile) => {
    previewUrl.value = file.url ?? ''
    previewVisible.value = true
  }

  const handleDownload = (file: UploadFile) => {
    if (!file.url) return
    const link = document.createElement('a')
    link.href = file.url
    link.download = file.name || 'cover'
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleRemove = () => {
    form.cover_image = null
    fileList.value = []
  }

  const open = async (row?: Api.OperationManage.AnnouncementListItem) => {
    resetForm()
    dialogVisible.value = true

    if (row) {
      id.value = row.id
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
        form.cover_image = row.cover_image
        form.status = row.status
        form.sort = row.sort
        form.content = ''
      }
      // 编辑已存在图片：直接放入一个已完成状态的文件项
      if (form.cover_image) {
        fileList.value = [
          {
            name: 'cover',
            url: form.cover_image,
            status: 'success'
          }
        ]
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

<style scoped lang="scss">
  .cover-upload-wrapper {
    display: inline-flex;
    flex-direction: column;
  }

  .image-tip {
    margin-top: 6px;
    font-size: 12px;
    line-height: 1.4;
    color: var(--el-text-color-secondary);
  }

  .preview-img {
    display: block;
    max-width: 80vw;
    max-height: 80vh;
  }

  .cover-uploader {
    :deep(.el-upload--picture-card),
    :deep(.el-upload-list--picture-card .el-upload-list__item) {
      width: 178px;
      height: 100px;
    }

    &.has-file :deep(.el-upload--picture-card) {
      display: none;
    }
  }
</style>
