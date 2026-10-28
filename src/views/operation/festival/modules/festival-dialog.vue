<template>
  <ElDialog
    v-model="dialogVisible"
    :title="title"
    width="520px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <ElForm ref="formRef" :model="form" :rules="rules" label-width="100px" label-position="right">
      <ElFormItem label="节日名称" prop="name">
        <ElInput
          v-model="form.name"
          placeholder="请输入节日名称"
          maxlength="64"
          show-word-limit
          clearable
        />
      </ElFormItem>
      <ElFormItem label="日期类型" prop="date_type">
        <ElRadioGroup v-model="form.date_type">
          <ElRadio value="solar">公历</ElRadio>
          <ElRadio value="lunar">农历</ElRadio>
        </ElRadioGroup>
      </ElFormItem>
      <ElFormItem label="日期" prop="month">
        <div class="flex items-center gap-2">
          <ElInputNumber v-model="form.month" :min="1" :max="12" :step="1" placeholder="月" />
          <span>月</span>
          <ElInputNumber
            v-model="form.day"
            :min="1"
            :max="form.date_type === 'lunar' ? 30 : 31"
            :step="1"
            placeholder="日"
          />
          <span>日</span>
        </div>
      </ElFormItem>
      <ElFormItem label="排序权重" prop="sort">
        <ElInputNumber v-model="form.sort" :min="0" :step="1" placeholder="越小越靠前" />
      </ElFormItem>
      <ElFormItem label="备注" prop="remark">
        <ElInput
          v-model="form.remark"
          type="textarea"
          :rows="2"
          placeholder="备注（可选）"
          maxlength="255"
          show-word-limit
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
  import type { FormInstance, FormRules } from 'element-plus'
  import { fetchCreateAutomationFestival, fetchUpdateAutomationFestival } from '@/api/automation'

  defineOptions({ name: 'AutomationFestivalDialog' })

  const emit = defineEmits<{ (e: 'success'): void }>()

  const dialogVisible = ref(false)
  const formRef = ref<FormInstance>()
  const submitting = ref(false)
  const id = ref<number | null>(null)
  const isEdit = computed(() => id.value !== null)
  const title = computed(() => (isEdit.value ? '编辑节日' : '新增节日'))

  const form = reactive<{
    name: string
    date_type: string
    month: number
    day: number
    status: boolean
    sort: number
    remark: string | null
  }>({
    name: '',
    date_type: 'solar',
    month: 1,
    day: 1,
    status: true,
    sort: 1000,
    remark: null
  })

  const rules: FormRules = {
    name: [
      { required: true, message: '请输入节日名称', trigger: 'blur' },
      { max: 64, message: '长度不能超过 64 字符', trigger: 'blur' }
    ],
    date_type: [{ required: true, message: '请选择日期类型', trigger: 'change' }],
    month: [{ required: true, type: 'number', message: '请输入月份', trigger: 'blur' }],
    day: [{ required: true, type: 'number', message: '请输入日期', trigger: 'blur' }]
  }

  const resetForm = () => {
    form.name = ''
    form.date_type = 'solar'
    form.month = 1
    form.day = 1
    form.status = true
    form.sort = 1000
    form.remark = null
  }

  const open = (row?: Api.Automation.FestivalListItem) => {
    dialogVisible.value = true
    if (row) {
      id.value = row.id
      form.name = row.name
      form.date_type = row.date_type
      form.month = row.month
      form.day = row.day
      form.status = row.status
      form.sort = row.sort
      form.remark = row.remark
    } else {
      id.value = null
      resetForm()
    }
    nextTick(() => formRef.value?.clearValidate())
  }

  const handleSubmit = async () => {
    if (!formRef.value) return
    await formRef.value.validate(async (valid) => {
      if (!valid) return
      submitting.value = true
      try {
        const payload: Api.Automation.FestivalSaveParams = {
          name: form.name,
          date_type: form.date_type,
          month: form.month,
          day: form.day,
          status: form.status,
          sort: form.sort,
          remark: form.remark
        }
        if (isEdit.value && id.value) {
          await fetchUpdateAutomationFestival(id.value, payload)
        } else {
          await fetchCreateAutomationFestival(payload)
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
