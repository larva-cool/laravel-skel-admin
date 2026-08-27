<template>
  <ElDialog
    v-model="dialogVisible"
    :title="title"
    width="640px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <ElForm ref="formRef" :model="form" :rules="rules" label-width="100px" label-position="right">
      <ElFormItem label="广告位" prop="position">
        <ElSelect
          v-model="form.position"
          placeholder="请选择广告位"
          class="w-full"
          :disabled="isEdit"
        >
          <ElOption
            v-for="opt in positionOptions"
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
        <ElInput
          v-model="form.image"
          placeholder="请输入图片 URL（建议使用图床或附件上传后获取 URL）"
          maxlength="500"
          clearable
        />
        <div v-if="form.image" class="mt-2">
          <ElImage
            :src="form.image"
            :preview-src-list="[form.image]"
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
          class="!w-full"
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
  import type { FormInstance, FormRules } from 'element-plus'
  import { fetchCreateBanner, fetchUpdateBanner } from '@/api/operation-manage'

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
      { required: true, message: '请输入图片 URL', trigger: 'blur' },
      { max: 500, message: '长度不能超过 500 字符', trigger: 'blur' }
    ],
    link_type: [{ required: true, message: '请选择链接类型', trigger: 'change' }],
    link_value: [
      {
        validator: (_rule, value, callback) => {
          if (form.link_type === 'none') return callback()
          if (!value || !value.trim()) return callback(new Error('请输入链接值'))
          callback()
        },
        trigger: 'blur'
      }
    ],
    sort: [{ type: 'number', min: 0, message: '排序权重不能小于 0', trigger: 'blur' }]
  }

  const open = (row?: Api.OperationManage.BannerListItem) => {
    dialogVisible.value = true
    if (row) {
      id.value = row.id
      form.position = row.position
      form.title = row.title
      form.image = row.image
      form.link_type = row.link_type
      form.link_value = row.link_value
      form.sort = row.sort
      form.status = row.status
      form.start_at = row.start_at
      form.end_at = row.end_at
      if (row.start_at && row.end_at) {
        dateRange.value = [row.start_at, row.end_at]
      } else {
        dateRange.value = null
      }
    } else {
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
    }
    nextTick(() => formRef.value?.clearValidate())
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

<style scoped lang="scss"></style>
