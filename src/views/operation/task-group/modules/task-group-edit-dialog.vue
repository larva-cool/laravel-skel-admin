<template>
  <ElDialog
    v-model="dialogVisible"
    :title="title"
    width="600px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <ElForm ref="formRef" :model="form" :rules="rules" label-width="100px" label-position="right">
      <ElFormItem label="分组名称" prop="name">
        <ElInput
          v-model="form.name"
          placeholder="请输入分组名称"
          maxlength="100"
          show-word-limit
          clearable
        />
      </ElFormItem>
      <ElFormItem label="分组编码" prop="code">
        <ElInput
          v-model="form.code"
          placeholder="请输入分组编码（英文标识）"
          maxlength="100"
          clearable
        />
      </ElFormItem>
      <ElFormItem label="分组类型" prop="type">
        <ElSelect
          v-model="form.type"
          placeholder="请选择分组类型"
          class="w-full"
          @change="handleTypeChange"
        >
          <ElOption
            v-for="opt in groupTypeOptions"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          />
        </ElSelect>
      </ElFormItem>
      <ElFormItem label="重置方式" prop="reset_type">
        <ElSelect v-model="form.reset_type" placeholder="请选择重置方式" class="w-full">
          <ElOption
            v-for="opt in resetTypeOptions"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          />
        </ElSelect>
      </ElFormItem>
      <ElFormItem label="排序权重" prop="sort_order">
        <ElInputNumber v-model="form.sort_order" :min="0" :step="1" placeholder="越小越靠前" />
      </ElFormItem>
      <ElFormItem label="图标" prop="icon">
        <ElInput
          v-model="form.icon"
          placeholder="图标名（可选，如 ri:folder-line）"
          maxlength="500"
          clearable
        />
      </ElFormItem>
      <ElFormItem label="分组描述" prop="description">
        <ElInput
          v-model="form.description"
          type="textarea"
          :rows="2"
          placeholder="分组描述（可选）"
          maxlength="500"
          show-word-limit
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
  import type { FormInstance, FormRules } from 'element-plus'
  import { fetchCreateTaskGroup, fetchUpdateTaskGroup } from '@/api/operation-manage'

  defineOptions({ name: 'TaskGroupEditDialog' })

  const emit = defineEmits<{ (e: 'success'): void }>()

  const dialogVisible = ref(false)
  const formRef = ref<FormInstance>()
  const submitting = ref(false)
  const id = ref<number | null>(null)
  const isEdit = computed(() => id.value !== null)
  const title = computed(() => (isEdit.value ? '编辑任务分组' : '新增任务分组'))

  const groupTypeOptions = [
    { label: '新手任务', value: 0 },
    { label: '每日任务', value: 1 },
    { label: '每周任务', value: 2 },
    { label: '签到任务', value: 3 },
    { label: '自定义', value: 9 }
  ]

  const resetTypeOptions = [
    { label: '不重置', value: 0 },
    { label: '每日', value: 1 },
    { label: '每周', value: 2 },
    { label: '每月', value: 3 }
  ]

  const defaultResetMap: Record<number, number> = {
    0: 0, // 新手 → 不重置
    1: 1, // 每日 → 每日
    2: 2, // 每周 → 每周
    3: 1, // 签到 → 每日
    9: 0 // 自定义 → 不重置
  }

  const form = reactive<{
    name: string
    code: string
    type: number
    reset_type: number
    sort_order: number
    icon: string | null
    description: string | null
    status: boolean
  }>({
    name: '',
    code: '',
    type: 0,
    reset_type: 0,
    sort_order: 0,
    icon: null,
    description: null,
    status: true
  })

  const rules: FormRules = {
    name: [
      { required: true, message: '请输入分组名称', trigger: 'blur' },
      { max: 100, message: '长度不能超过 100 字符', trigger: 'blur' }
    ],
    code: [
      { required: true, message: '请输入分组编码', trigger: 'blur' },
      { max: 100, message: '长度不能超过 100 字符', trigger: 'blur' }
    ],
    type: [{ required: true, message: '请选择分组类型', trigger: 'change' }],
    reset_type: [{ required: true, message: '请选择重置方式', trigger: 'change' }],
    sort_order: [{ type: 'number', min: 0, message: '排序权重不能小于 0', trigger: 'blur' }]
  }

  const handleTypeChange = (val: number) => {
    form.reset_type = defaultResetMap[val] ?? 0
  }

  const open = (row?: Api.OperationManage.TaskGroupListItem) => {
    dialogVisible.value = true
    if (row) {
      id.value = row.id
      form.name = row.name
      form.code = row.code
      form.type = row.type
      form.reset_type = row.reset_type
      form.sort_order = row.sort_order
      form.icon = row.icon
      form.description = row.description
      form.status = row.status
    } else {
      id.value = null
      form.name = ''
      form.code = ''
      form.type = 0
      form.reset_type = 0
      form.sort_order = 0
      form.icon = null
      form.description = null
      form.status = true
    }
    nextTick(() => formRef.value?.clearValidate())
  }

  const handleSubmit = async () => {
    if (!formRef.value) return
    await formRef.value.validate(async (valid) => {
      if (!valid) return
      submitting.value = true
      try {
        const payload: Api.OperationManage.TaskGroupSaveParams = {
          name: form.name,
          code: form.code,
          type: form.type,
          reset_type: form.reset_type,
          sort_order: form.sort_order,
          icon: form.icon,
          description: form.description,
          status: form.status
        }
        if (isEdit.value && id.value) {
          await fetchUpdateTaskGroup(id.value, payload)
        } else {
          await fetchCreateTaskGroup(payload)
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
