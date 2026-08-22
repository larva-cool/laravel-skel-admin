<template>
  <ElDialog
    v-model="dialogVisible"
    :title="title"
    width="520px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <ElForm ref="formRef" :model="form" :rules="rules" label-width="80px" label-position="right">
      <ElFormItem label="字典名称" prop="name">
        <ElInput v-model="form.name" placeholder="请输入字典名称" maxlength="100" show-word-limit />
      </ElFormItem>
      <ElFormItem label="字典编码" prop="code">
        <ElInput
          v-model="form.code"
          placeholder="请输入字典编码"
          :disabled="isEdit"
          maxlength="50"
          show-word-limit
        />
      </ElFormItem>
      <ElFormItem label="状态" prop="status">
        <ElRadioGroup v-model="form.status">
          <ElRadio :value="1">启用</ElRadio>
          <ElRadio :value="0">禁用</ElRadio>
        </ElRadioGroup>
      </ElFormItem>
      <ElFormItem label="排序" prop="sort">
        <ElInputNumber v-model="form.sort" :min="0" :max="999999" controls-position="right" />
      </ElFormItem>
      <ElFormItem label="备注" prop="remark">
        <ElInput
          v-model="form.remark"
          type="textarea"
          :rows="3"
          placeholder="请输入备注"
          maxlength="255"
          show-word-limit
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
  import { reactive, ref, computed } from 'vue'
  import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
  import { fetchCreateDict, fetchUpdateDict } from '@/api/system-manage'

  const emit = defineEmits<{
    (e: 'refresh'): void
  }>()

  const dialogVisible = ref(false)
  const formRef = ref<FormInstance>()
  const submitting = ref(false)
  const id = ref<number | null>(null)

  const isEdit = computed(() => id.value !== null)
  const title = computed(() => (isEdit.value ? '编辑字典' : '新增字典'))

  const form = reactive<Api.SystemManage.DictSaveParams>({
    name: '',
    code: '',
    status: 1,
    sort: 0,
    remark: ''
  })

  const rules: FormRules = {
    name: [{ required: true, message: '请输入字典名称', trigger: 'blur' }],
    code: [{ required: true, message: '请输入字典编码', trigger: 'blur' }],
    status: [{ required: true, message: '请选择状态', trigger: 'change' }]
  }

  const open = (row?: Api.SystemManage.DictListItem) => {
    dialogVisible.value = true
    if (row) {
      id.value = row.id
      form.name = row.name
      form.code = row.code
      form.status = row.status
      form.sort = row.sort
      form.remark = row.remark ?? ''
    } else {
      id.value = null
      form.name = ''
      form.code = ''
      form.status = 1
      form.sort = 0
      form.remark = ''
    }
  }

  const handleSubmit = async () => {
    await formRef.value?.validate(async (valid) => {
      if (!valid) return
      submitting.value = true
      try {
        if (isEdit.value) {
          await fetchUpdateDict(id.value!, form)
        } else {
          await fetchCreateDict(form)
        }
        dialogVisible.value = false
        emit('refresh')
      } catch (err: any) {
        ElMessage.error(err?.message || '操作失败')
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
