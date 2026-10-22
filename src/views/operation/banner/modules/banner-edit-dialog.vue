<template>
  <ElDialog
    v-model="dialogVisible"
    :title="title"
    width="720px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <ElForm ref="formRef" :model="form" :rules="rules" label-width="100px" label-position="right">
      <ElFormItem label="AI 助手">
        <div class="flex w-full flex-col gap-2">
          <div class="flex w-full items-center gap-2">
            <ElInput
              v-model="aiBrief"
              placeholder="一句话描述 Banner 需求，AI 生成标题与绘图提示词"
              maxlength="500"
              clearable
              @keyup.enter="handleAiGenerateCopy"
            />
            <ElButton
              type="primary"
              plain
              :loading="aiCopyGenerating"
              @click="handleAiGenerateCopy"
            >
              <ElIcon class="mr-1"><MagicStick /></ElIcon>
              生成文案
            </ElButton>
          </div>
          <div v-if="aiImagePrompt !== null" class="flex w-full items-center gap-2">
            <ElInput
              v-model="aiImagePrompt"
              placeholder="绘图提示词，可手动修改后生成图片"
              maxlength="1000"
              clearable
            />
            <ElButton
              type="success"
              plain
              :loading="aiImageGenerating"
              @click="handleAiGenerateImage"
            >
              <ElIcon class="mr-1"><Picture /></ElIcon>
              生成图片
            </ElButton>
          </div>
        </div>
      </ElFormItem>
      <ElFormItem label="广告位" prop="position">
        <ElSelect
          v-model="form.position"
          placeholder="请选择广告位"
          class="w-full"
          :disabled="isEdit"
        >
          <ElOption
            v-for="opt in props.positionOptions"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          />
        </ElSelect>
      </ElFormItem>

      <ElFormItem label="标题" prop="title">
        <ElInput
          v-model="form.title"
          placeholder="请输入标题（可选）"
          maxlength="200"
          show-word-limit
          clearable
        />
      </ElFormItem>

      <ElFormItem label="图片" prop="image">
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
              <img class="el-upload-list__item-thumbnail" :src="file.url" alt="Banner 图片" />
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
            <img :src="previewUrl" alt="Banner 预览" class="preview-img" />
          </ElDialog>
        </div>
      </ElFormItem>

      <ElFormItem label="链接类型" prop="link_type">
        <ElSelect v-model="form.link_type" placeholder="请选择链接类型" class="w-full">
          <ElOption
            v-for="opt in linkTypeOptions"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          />
        </ElSelect>
      </ElFormItem>

      <ElFormItem
        v-if="form.link_type !== 'none'"
        label="链接值"
        :prop="form.link_type !== 'none' ? 'link_value' : ''"
      >
        <ElInput
          v-model="form.link_value"
          :placeholder="linkValuePlaceholder"
          maxlength="500"
          clearable
        />
      </ElFormItem>

      <ElFormItem label="排序权重" prop="sort">
        <ElInputNumber v-model="form.sort" :min="0" :step="1" placeholder="越小越靠前" />
      </ElFormItem>

      <ElFormItem label="启用状态" prop="status">
        <ElSwitch v-model="form.status" active-text="启用" inactive-text="禁用" inline-prompt />
      </ElFormItem>

      <ElFormItem label="生效时间">
        <ElDatePicker
          v-model="dateRange"
          type="datetimerange"
          range-separator="至"
          start-placeholder="开始时间"
          end-placeholder="结束时间"
          format="YYYY-MM-DD HH:mm:ss"
          value-format="YYYY-MM-DD HH:mm:ss"
          class="w-full!"
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
  import {
    fetchCreateBanner,
    fetchGenerateBannerCopy,
    fetchGenerateBannerImage,
    fetchGetBannerDetail,
    fetchUpdateBanner
  } from '@/api/operation-manage'
  import { fetchUploadAttachmentFile } from '@/api/system-manage'
  import { Delete, Download, MagicStick, Picture, Plus, ZoomIn } from '@element-plus/icons-vue'
  import type {
    FormInstance,
    FormRules,
    UploadFile,
    UploadRequestOptions,
    UploadUserFile
  } from 'element-plus'

  defineOptions({ name: 'BannerEditDialog' })

  interface Props {
    positionOptions?: Api.OperationManage.BannerPositionOption[]
  }
  const props = withDefaults(defineProps<Props>(), {
    positionOptions: () => []
  })

  const emit = defineEmits<{
    (e: 'success'): void
  }>()

  const dialogVisible = ref(false)
  const formRef = ref<FormInstance>()
  const submitting = ref(false)
  const id = ref<number | null>(null)
  const isEdit = computed(() => id.value !== null)
  const title = computed(() => (isEdit.value ? '编辑 Banner' : '新增 Banner'))

  const fileList = ref<UploadUserFile[]>([])
  const previewVisible = ref(false)
  const previewUrl = ref('')
  const dateRange = ref<[string, string] | null>(null)

  const form = reactive<{
    position: string
    title: string
    image: string
    link_type: string
    link_value: string | null
    sort: number
    status: boolean
    start_at: string | null
    end_at: string | null
  }>({
    position: '',
    title: '',
    image: '',
    link_type: 'none',
    link_value: null,
    sort: 0,
    status: true,
    start_at: null,
    end_at: null
  })

  const linkTypeOptions = [
    { label: '无链接', value: 'none' },
    { label: '外部链接', value: 'url' },
    { label: '内部页面', value: 'page' },
    { label: '跳转商品', value: 'goods' },
    { label: '内嵌网页', value: 'webview' }
  ]

  const linkValuePlaceholder = computed(() => {
    switch (form.link_type) {
      case 'url':
        return '请输入完整 URL，例如 https://example.com'
      case 'page':
        return '请输入内部页面路径，例如 /pages/index'
      case 'goods':
        return '请输入商品 ID'
      case 'webview':
        return '请输入内嵌网页 URL'
      default:
        return '请输入链接值'
    }
  })

  const rules: FormRules = {
    position: [{ required: true, message: '请选择广告位', trigger: 'change' }],
    image: [
      { required: true, message: '请上传 Banner 图片', trigger: 'change' },
      { max: 500, message: '长度不能超过 500 字符', trigger: 'blur' }
    ],
    link_type: [{ required: true, message: '请选择链接类型', trigger: 'change' }],
    link_value: [
      {
        validator: (_rule, value, callback) => {
          if (form.link_type === 'none') return callback()
          if (!value || !String(value).trim()) return callback(new Error('请输入链接值'))
          callback()
        },
        trigger: 'blur'
      }
    ],
    sort: [{ type: 'number', min: 0, message: '排序权重不能小于 0', trigger: 'blur' }]
  }

  const resetForm = () => {
    id.value = null
    form.position = props.positionOptions[0]?.value ?? ''
    form.title = ''
    form.image = ''
    form.link_type = 'none'
    form.link_value = null
    form.sort = 0
    form.status = true
    form.start_at = null
    form.end_at = null
    dateRange.value = null
    fileList.value = []
    aiBrief.value = ''
    aiImagePrompt.value = null
  }

  // ========== AI 文案与配图生成 ==========

  const aiBrief = ref('')
  const aiImagePrompt = ref<string | null>(null)
  const aiCopyGenerating = ref(false)
  const aiImageGenerating = ref(false)

  const handleAiGenerateCopy = async () => {
    if (!aiBrief.value.trim()) {
      ElMessage.warning('请先输入 Banner 需求简述')
      return
    }
    aiCopyGenerating.value = true
    try {
      const res = await fetchGenerateBannerCopy({ brief: aiBrief.value.trim() })
      if (res.title) form.title = res.title
      if (res.image_prompt) aiImagePrompt.value = res.image_prompt
      ElMessage.success('文案生成成功，可继续生成配图')
    } catch {
      // 错误信息由拦截器统一提示
    } finally {
      aiCopyGenerating.value = false
    }
  }

  const handleAiGenerateImage = async () => {
    if (!aiImagePrompt.value?.trim()) {
      ElMessage.warning('请先输入绘图提示词')
      return
    }
    aiImageGenerating.value = true
    try {
      const res = await fetchGenerateBannerImage({ prompt: aiImagePrompt.value.trim() })
      form.image = res.url
      fileList.value = [{ name: 'ai-banner', url: res.url, status: 'success' }]
    } catch {
      // 错误信息由拦截器统一提示
    } finally {
      aiImageGenerating.value = false
    }
  }

  const beforeUpload = (rawFile: File) => {
    if (!rawFile.type.startsWith('image/')) {
      ElMessage.error('请选择图片文件')
      return false
    }
    return true
  }

  /**
   * 自定义上传：与公告模块封面图保持一致——
   * 文件对象在 fileList 中一直存在（ElUpload 自动维护），
   * 选中后立即用本地 blob URL 填充预览，上传成功后原地替换 url，
   * 不重建数组/DOM，消除闪烁。
   */
  const handleUploadRequest = async (options: UploadRequestOptions) => {
    const raw = options.file
    const uploadFile = fileList.value.find((f) => f.raw === raw)
    if (!uploadFile) {
      options.onError?.(
        new Error('文件未找到') as Error & { status: number; method: string; url: string }
      )
      return
    }

    const localUrl = URL.createObjectURL(raw)
    uploadFile.url = localUrl
    uploadFile.status = 'uploading'

    try {
      const res = await fetchUploadAttachmentFile(raw)
      const remoteUrl = res.url ?? ''
      URL.revokeObjectURL(localUrl)
      uploadFile.url = remoteUrl
      uploadFile.status = 'success'
      form.image = remoteUrl
      ElMessage.success('图片上传成功')
      options.onSuccess?.(res)
    } catch (e) {
      URL.revokeObjectURL(localUrl)
      uploadFile.status = 'fail'
      form.image = ''
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
    link.download = file.name || 'banner'
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleRemove = () => {
    form.image = ''
    fileList.value = []
  }

  const open = async (row?: Api.OperationManage.BannerListItem) => {
    resetForm()
    dialogVisible.value = true

    if (row) {
      id.value = row.id
      try {
        const detail = await fetchGetBannerDetail(row.id)
        form.position = detail.position
        form.title = detail.title
        form.image = detail.image
        form.link_type = detail.link_type
        form.link_value = detail.link_value
        form.sort = detail.sort
        form.status = detail.status
        form.start_at = detail.start_at
        form.end_at = detail.end_at
      } catch {
        // 接口失败时用列表行数据兜底
        form.position = row.position
        form.title = row.title
        form.image = row.image
        form.link_type = row.link_type
        form.link_value = row.link_value
        form.sort = row.sort
        form.status = row.status
        form.start_at = row.start_at
        form.end_at = row.end_at
      }

      if (form.start_at && form.end_at) {
        dateRange.value = [form.start_at, form.end_at]
      } else {
        dateRange.value = null
      }

      if (form.image) {
        fileList.value = [
          {
            name: 'banner',
            url: form.image,
            status: 'success'
          }
        ]
      }
    }

    await nextTick()
    formRef.value?.clearValidate()
  }

  const handleSubmit = async () => {
    if (!formRef.value) return
    await formRef.value.validate(async (valid) => {
      if (!valid) return
      submitting.value = true
      try {
        if (dateRange.value && dateRange.value.length === 2) {
          form.start_at = dateRange.value[0]
          form.end_at = dateRange.value[1]
        } else {
          form.start_at = null
          form.end_at = null
        }

        const payload: Api.OperationManage.BannerSaveParams = {
          position: form.position,
          title: form.title,
          image: form.image,
          link_type: form.link_type,
          link_value: form.link_type === 'none' ? null : form.link_value,
          sort: form.sort,
          status: form.status,
          start_at: form.start_at,
          end_at: form.end_at
        }

        if (isEdit.value && id.value) {
          await fetchUpdateBanner(id.value, payload)
        } else {
          await fetchCreateBanner(payload)
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
