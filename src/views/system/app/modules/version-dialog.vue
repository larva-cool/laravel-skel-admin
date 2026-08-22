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
        <ElInput
          v-model="form.download_url"
          placeholder="APK 直链 / App Store URL / 鸿蒙应用市场 URL"
          clearable
        />
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
      <ElFormItem label="安装包大小" prop="file_size">
        <ElInputNumber
          v-model="form.file_size"
          :min="0"
          controls-position="right"
          placeholder="字节"
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
  import { fetchCreateVersion, fetchUpdateVersion } from '@/api/app-manage'
  import type { FormInstance, FormRules } from 'element-plus'

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
  const id = ref<number | null>(null)
  const isEdit = computed(() => id.value !== null)
  const title = computed(() => (isEdit.value ? '编辑版本' : '新增版本'))

  const form = reactive({
    platform: 'android',
    version: '',
    build: 1,
    download_url: '',
    release_notes: '',
    min_supported_version: '',
    min_supported_build: 0,
    force_update: false,
    file_size: null as number | null,
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
    download_url: [{ required: true, message: '请输入下载地址', trigger: 'blur' }]
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
        file_size: row.file_size,
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
        file_size: null,
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
          file_size: form.file_size,
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
