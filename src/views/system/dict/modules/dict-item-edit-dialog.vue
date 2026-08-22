<template>
  <ElDialog
    v-model="dialogVisible"
    :title="title"
    width="520px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <ElForm ref="formRef" :model="form" :rules="rules" label-width="80px" label-position="right">
      <ElFormItem label="数据标签" prop="label">
        <ElInput
          v-model="form.label"
          placeholder="请输入数据标签"
          maxlength="100"
          show-word-limit
        />
      </ElFormItem>
      <ElFormItem label="数据键值" prop="value">
        <ElInput
          v-model="form.value"
          placeholder="请输入数据键值"
          maxlength="100"
          show-word-limit
        />
      </ElFormItem>
      <ElFormItem label="标签类型" prop="label_type">
        <ElSelect v-model="form.label_type" placeholder="请选择标签类型" style="width: 100%">
          <ElOption label="默认" value="default">
            <ElTag type="info" size="small">默认</ElTag>
          </ElOption>
          <ElOption label="主要" value="primary">
            <ElTag type="primary" size="small">主要</ElTag>
          </ElOption>
          <ElOption label="成功" value="success">
            <ElTag type="success" size="small">成功</ElTag>
          </ElOption>
          <ElOption label="警告" value="warning">
            <ElTag type="warning" size="small">警告</ElTag>
          </ElOption>
          <ElOption label="危险" value="danger">
            <ElTag type="danger" size="small">危险</ElTag>
          </ElOption>
          <ElOption label="信息" value="info">
            <ElTag type="info" size="small">信息</ElTag>
          </ElOption>
        </ElSelect>
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
  import { fetchCreateDictItem, fetchUpdateDictItem } from '@/api/system-manage'

  const emit = defineEmits<{
    (e: 'refresh'): void
  }>()

  const props = defineProps<{
    dictId?: number
  }>()

  const dialogVisible = ref(false)
  const formRef = ref<FormInstance>()
  const submitting = ref(false)
  const id = ref<number | null>(null)

  const isEdit = computed(() => id.value !== null)
  const title = computed(() => (isEdit.value ? '编辑字典数据' : '新增字典数据'))

  const form = reactive<Api.SystemManage.DictItemSaveParams>({
    dict_id: props.dictId || 0,
    label: '',
    value: '',
    label_type: 'default',
    status: 1,
    sort: 0,
    remark: ''
  })

  const rules: FormRules = {
    label: [{ required: true, message: '请输入数据标签', trigger: 'blur' }],
    value: [{ required: true, message: '请输入数据键值', trigger: 'blur' }],
    status: [{ required: true, message: '请选择状态', trigger: 'change' }]
  }

  const open = (row?: Api.SystemManage.DictItemListItem) => {
    dialogVisible.value = true
    form.dict_id = props.dictId || 0
    if (row) {
      id.value = row.id
      form.label = row.label
      form.value = row.value
      form.label_type = row.label_type
      form.status = row.status
      form.sort = row.sort
      form.remark = row.remark ?? ''
    } else {
      id.value = null
      form.label = ''
      form.value = ''
      form.label_type = 'default'
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
          await fetchUpdateDictItem(id.value!, form)
        } else {
          await fetchCreateDictItem(form)
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
