<template>
  <ElDialog
    v-model="dialogVisible"
    :title="title"
    width="560px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <ElForm ref="formRef" :model="form" :rules="rules" label-width="100px" label-position="right">
      <ElFormItem label="敏感词" prop="word">
        <ElInput
          v-model="form.word"
          placeholder="请输入敏感词（最长 50 字符）"
          maxlength="50"
          show-word-limit
          clearable
        />
      </ElFormItem>

      <ElFormItem label="分类" prop="category">
        <ElSelect v-model="form.category" placeholder="请选择分类" class="w-full">
          <ElOption
            v-for="opt in props.categoryOptions"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          />
        </ElSelect>
      </ElFormItem>

      <ElFormItem label="处理级别" prop="level">
        <ElSelect v-model="form.level" placeholder="请选择处理级别" class="w-full">
          <ElOption
            v-for="opt in props.levelOptions"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          />
        </ElSelect>
        <div class="text-xs text-secondary mt-1">
          自动替换：命中后以掩码替换并放行；人工审核：标记待审核；直接拦截：命中即拒绝提交。
        </div>
      </ElFormItem>

      <ElFormItem label="替换字符" prop="replacement">
        <ElInput
          v-model="form.replacement"
          placeholder="默认 *（单字符掩码）"
          maxlength="5"
          clearable
        />
      </ElFormItem>

      <ElFormItem label="启用状态" prop="status">
        <ElSwitch v-model="form.status" active-text="启用" inactive-text="禁用" inline-prompt />
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
    fetchCreateSensitiveWord,
    fetchGetSensitiveWordDetail,
    fetchUpdateSensitiveWord
  } from '@/api/operation-manage'
  import type { FormInstance, FormRules } from 'element-plus'

  defineOptions({ name: 'SensitiveWordEditDialog' })

  interface Props {
    categoryOptions?: Api.OperationManage.OptionItem[]
    levelOptions?: Api.OperationManage.OptionItem[]
  }
  const props = withDefaults(defineProps<Props>(), {
    categoryOptions: () => [],
    levelOptions: () => []
  })

  const emit = defineEmits<{
    (e: 'success'): void
  }>()

  const dialogVisible = ref(false)
  const formRef = ref<FormInstance>()
  const submitting = ref(false)
  const id = ref<number | null>(null)
  const isEdit = computed(() => id.value !== null)
  const title = computed(() => (isEdit.value ? '编辑敏感词' : '新增敏感词'))

  const form = reactive<{
    word: string
    category: string
    level: 'replace' | 'review' | 'block'
    replacement: string
    status: boolean
  }>({
    word: '',
    category: 'other',
    level: 'review',
    replacement: '*',
    status: true
  })

  const rules: FormRules = {
    word: [
      { required: true, message: '请输入敏感词', trigger: 'blur' },
      { min: 1, max: 50, message: '敏感词长度 1-50 字符', trigger: 'blur' }
    ],
    category: [{ required: true, message: '请选择分类', trigger: 'change' }],
    level: [{ required: true, message: '请选择处理级别', trigger: 'change' }]
  }

  const resetForm = () => {
    id.value = null
    form.word = ''
    form.category = 'other'
    form.level = 'review'
    form.replacement = '*'
    form.status = true
  }

  const open = async (row?: Api.OperationManage.SensitiveWordListItem) => {
    resetForm()
    dialogVisible.value = true

    if (row) {
      id.value = row.id
      try {
        const detail = await fetchGetSensitiveWordDetail(row.id)
        form.word = detail.word
        form.category = detail.category as typeof form.category
        form.level = detail.level
        form.replacement = detail.replacement || '*'
        form.status = detail.status
      } catch {
        form.word = row.word
        form.category = row.category as typeof form.category
        form.level = row.level
        form.replacement = row.replacement || '*'
        form.status = row.status
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
        const payload: Api.OperationManage.SensitiveWordSaveParams = {
          word: form.word.trim(),
          category: form.category,
          level: form.level,
          replacement: form.replacement.trim() || '*',
          status: form.status
        }

        if (isEdit.value && id.value) {
          await fetchUpdateSensitiveWord(id.value, payload)
        } else {
          await fetchCreateSensitiveWord(payload)
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
