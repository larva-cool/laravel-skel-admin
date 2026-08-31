<template>
  <ElDialog
    v-model="dialogVisible"
    :title="title"
    width="600px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <ElForm ref="formRef" :model="form" :rules="rules" label-width="120px">
      <ElFormItem label="平台" prop="platform">
        <ElSelect v-model="form.platform" placeholder="请选择平台" style="width: 100%">
          <ElOption label="安卓" value="android" />
          <ElOption label="iOS" value="ios" />
          <ElOption label="鸿蒙" value="harmony" />
        </ElSelect>
      </ElFormItem>
      <ElFormItem label="版本号" prop="version">
        <ElInput v-model="form.version" placeholder="如 1.2.3" clearable />
      </ElFormItem>
      <ElFormItem label="构建号" prop="build">
        <ElInputNumber
          v-model="form.build"
          :min="1"
          controls-position="right"
          placeholder="如 10203"
          style="width: 100%"
        />
      </ElFormItem>
      <ElFormItem label="下载地址" prop="download_url">
        <div class="flex gap-2 w-full">
          <ElInput
            v-model="form.download_url"
            :placeholder="downloadUrlPlaceholder"
            clearable
            class="flex-1"
          />
          <ElUpload
            v-if="form.platform === 'android'"
            :show-file-list="false"
            :before-upload="handleBeforeUpload"
            :http-request="handleUploadApk"
            accept=".apk"
          >
            <ElButton :loading="uploading" type="primary">上传 APK</ElButton>
          </ElUpload>
        </div>
      </ElFormItem>
      <ElFormItem label="更新说明" prop="release_notes">
        <ElInput v-model="form.release_notes" type="textarea" :rows="4" placeholder="更新说明" />
      </ElFormItem>
      <ElFormItem label="最低支持版本" prop="min_supported_version">
        <ElInput v-model="form.min_supported_version" placeholder="如 1.0.0（可选）" clearable />
      </ElFormItem>
      <ElFormItem label="最低支持构建号" prop="min_supported_build">
        <ElInputNumber
          v-model="form.min_supported_build"
          :min="0"
          controls-position="right"
          placeholder="低于此值强制更新"
          style="width: 100%"
        />
      </ElFormItem>
      <ElFormItem label="强制更新" prop="force_update">
        <ElSwitch v-model="form.force_update" active-text="是" inactive-text="否" />
      </ElFormItem>
      <ElFormItem label="安装包大小" prop="file_size_mb">
        <ElInputNumber
          v-model="form.file_size_mb"
          :min="0"
          :precision="2"
          :step="0.1"
          controls-position="right"
          placeholder="MB"
          style="width: 100%"
        />
      </ElFormItem>
      <ElFormItem label="文件哈希" prop="file_hash">
        <ElInput v-model="form.file_hash" placeholder="MD5/SHA256（可选）" clearable />
      </ElFormItem>
    </ElForm>

    <template #footer>
      <ElButton @click="handleClose">取消</ElButton>
      <ElButton type="primary" :loading="submitting" @click="handleSubmit">确认</ElButton>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import { fetchCreateVersion, fetchUpdateVersion, fetchUploadApk } from '@/api/app-manage'
  import CryptoJS from 'crypto-js'
  import type { FormInstance, FormRules, UploadRequestOptions } from 'element-plus'
  import { ElMessage } from 'element-plus'

  defineOptions({ name: 'VersionDialog' })

  const props = defineProps<{
    appId: number
  }>()

  const emit = defineEmits<{
    (e: 'refresh'): void
  }>()

  const dialogVisible = ref(false)
  const formRef = ref<FormInstance>()
  const submitting = ref(false)
  const uploading = ref(false)
  const id = ref<number | null>(null)
  const isEdit = computed(() => id.value !== null)
  const title = computed(() => (isEdit.value ? '编辑版本' : '新增版本'))

  const downloadUrlPlaceholder = computed(() => {
    if (form.platform === 'android') return 'APK 直链，可直接输入或点击右侧上传'
    if (form.platform === 'ios') return 'App Store URL'
    return '鸿蒙应用市场 URL'
  })

  const form = reactive({
    platform: 'android',
    version: '',
    build: 1,
    download_url: '',
    release_notes: '1、修复了已知问题。',
    min_supported_version: '',
    min_supported_build: 0,
    force_update: false,
    file_size_mb: null as number | null,
    file_hash: ''
  })

  const rules: FormRules = {
    platform: [{ required: true, message: '请选择平台', trigger: 'change' }],
    version: [
      { required: true, message: '请输入版本号', trigger: 'blur' },
      {
        pattern: /^\d+\.\d+\.\d+/,
        message: '版本号格式如 1.2.3',
        trigger: 'blur'
      }
    ],
    build: [{ required: true, message: '请输入构建号', trigger: 'blur' }],
    download_url: [{ required: true, message: '请输入或上传下载地址', trigger: 'blur' }]
  }

  const handleBeforeUpload = (file: File) => {
    if (!file.name.toLowerCase().endsWith('.apk')) {
      ElMessage.error('仅支持上传 APK 文件')
      return false
    }
    return true
  }

  const computeFileHash = (file: File, algorithm: 'MD5' | 'SHA256'): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const wordArray = CryptoJS.lib.WordArray.create(e.target?.result as ArrayBuffer)
          const hash = algorithm === 'MD5' ? CryptoJS.MD5(wordArray) : CryptoJS.SHA256(wordArray)
          resolve(hash.toString())
        } catch (err) {
          reject(err)
        }
      }
      reader.onerror = reject
      reader.readAsArrayBuffer(file)
    })
  }

  const handleUploadApk = async (options: UploadRequestOptions) => {
    uploading.value = true
    try {
      const file = options.file as File
      const [res, md5, sha256] = await Promise.all([
        fetchUploadApk(file),
        computeFileHash(file, 'MD5'),
        computeFileHash(file, 'SHA256')
      ])
      form.download_url = res.url
      if (res.file_size) {
        form.file_size_mb = +(res.file_size / 1024 / 1024).toFixed(2)
      }
      form.file_hash = `MD5:${md5} SHA256:${sha256}`
      ElMessage.success('上传成功')
    } finally {
      uploading.value = false
    }
  }

  const open = (row: Api.AppManage.VersionListItem | null) => {
    dialogVisible.value = true
    if (row) {
      id.value = row.id
      Object.assign(form, {
        platform: row.platform.value,
        version: row.version,
        build: row.build,
        download_url: row.download_url,
        release_notes: row.release_notes ?? '',
        min_supported_version: row.min_supported_version ?? '',
        min_supported_build: row.min_supported_build,
        force_update: row.force_update,
        file_size_mb: row.file_size ? +(row.file_size / 1024 / 1024).toFixed(2) : null,
        file_hash: row.file_hash ?? ''
      })
    } else {
      id.value = null
      Object.assign(form, {
        platform: 'android',
        version: '',
        build: 1,
        download_url: '',
        release_notes: '',
        min_supported_version: '',
        min_supported_build: 0,
        force_update: false,
        file_size_mb: null,
        file_hash: ''
      })
    }
  }

  const handleSubmit = async () => {
    if (!formRef.value) return
    await formRef.value.validate(async (valid) => {
      if (!valid) return
      submitting.value = true
      try {
        const data: Api.AppManage.VersionSaveParams = {
          platform: form.platform,
          version: form.version,
          build: form.build,
          download_url: form.download_url,
          release_notes: form.release_notes || null,
          min_supported_version: form.min_supported_version || null,
          min_supported_build: form.min_supported_build,
          force_update: form.force_update,
          file_size: form.file_size_mb ? Math.round(form.file_size_mb * 1024 * 1024) : null,
          file_hash: form.file_hash || null
        }
        if (isEdit.value && id.value) {
          await fetchUpdateVersion(props.appId, id.value, data)
        } else {
          await fetchCreateVersion(props.appId, data)
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
