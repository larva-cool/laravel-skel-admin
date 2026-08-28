<template>
  <ElDialog
    v-model="visible"
    :title="isEdit ? '编辑分群' : '新增分群'"
    width="960px"
    :close-on-click-modal="false"
    @closed="handleClosed"
  >
    <ElForm ref="formRef" :model="formModel" :rules="formRules" label-width="100px">
      <ElFormItem label="分群名称" prop="name">
        <ElInput
          v-model="formModel.name"
          placeholder="请输入分群名称"
          maxlength="64"
          show-word-limit
        />
      </ElFormItem>

      <ElFormItem label="分群类型" prop="type">
        <ElRadioGroup v-model="formModel.type" :disabled="isEdit">
          <ElRadio :value="1">手动</ElRadio>
          <ElRadio :value="2">规则</ElRadio>
        </ElRadioGroup>
        <div class="mt-1 text-xs text-gray-400">
          {{ isEdit ? '已存在的分群不允许切换类型' : '规则分群由定时任务按规则自动同步成员' }}
        </div>
      </ElFormItem>

      <ElFormItem v-if="formModel.type === 2" label="分群编码" prop="code">
        <ElInput
          v-model="formModel.code"
          placeholder="英文/数字/下划线，规则分群必填且唯一"
          maxlength="64"
          show-word-limit
        />
      </ElFormItem>

      <ElFormItem label="标签样式" prop="label_type">
        <ElSelect v-model="formModel.label_type" style="width: 200px">
          <ElOption
            v-for="opt in labelTypeOptions"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          >
          </ElOption>
        </ElSelect>
      </ElFormItem>

      <ElFormItem label="分组" prop="group">
        <ElInput
          v-model="formModel.group"
          placeholder="如：用户画像/运营分群/风控"
          maxlength="32"
        />
      </ElFormItem>

      <ElFormItem label="描述" prop="description">
        <ElInput
          v-model="formModel.description"
          type="textarea"
          :rows="2"
          placeholder="选填，分群说明"
          maxlength="500"
          show-word-limit
        />
      </ElFormItem>

      <ElFormItem label="排序" prop="sort">
        <ElInputNumber v-model="formModel.sort" :min="0" :max="99999" />
      </ElFormItem>

      <ElFormItem label="启用" prop="status">
        <ElSwitch v-model="formModel.status" />
      </ElFormItem>

      <ElFormItem v-if="formModel.type === 2" label="规则">
        <SegmentRuleBuilder
          :model-value="formModel.rule ?? null"
          @update:model-value="(v) => (formModel.rule = v)"
        />
      </ElFormItem>
    </ElForm>

    <template #footer>
      <ElButton @click="visible = false">取消</ElButton>
      <ElButton v-if="formModel.type === 2 && isEdit" type="warning" plain @click="handlePreview">
        预览匹配
      </ElButton>
      <ElButton type="primary" :loading="submitting" @click="handleSubmit">保存</ElButton>
    </template>
  </ElDialog>

  <!-- 预览弹窗 -->
  <ElDialog v-model="previewVisible" title="规则预览" width="720px">
    <div v-loading="previewLoading">
      <div class="mb-3">
        共匹配
        <span class="text-lg font-semibold text-primary mx-1">{{ previewData?.total ?? 0 }}</span>
        名用户
      </div>
      <ElTable v-if="previewData && previewData.sample.length" :data="previewData.sample" border>
        <ElTableColumn prop="id" label="用户 ID" width="100" />
        <ElTableColumn label="账号">
          <template #default="{ row }">
            {{ row.username || row.name || '-' }}
          </template>
        </ElTableColumn>
        <ElTableColumn label="头像" width="80">
          <template #default="{ row }">
            <ElAvatar :src="row.avatar" :size="32">{{
              (row.name || row.username || '?').charAt(0)
            }}</ElAvatar>
          </template>
        </ElTableColumn>
      </ElTable>
      <ElEmpty v-else description="无匹配用户" :image-size="80" />
    </div>
  </ElDialog>
</template>

<script setup lang="ts">
  import { fetchCreateSegment, fetchUpdateSegment, fetchPreviewSegment } from '@/api/segment-manage'
  import SegmentRuleBuilder from './segment-rule-builder.vue'

  type Detail = Api.SegmentManage.SegmentDetail

  const visible = ref(false)
  const isEdit = ref(false)
  const editingId = ref<number | null>(null)
  const submitting = ref(false)
  const formRef = ref()

  const formModel = reactive<Api.SegmentManage.SegmentSaveParams>({
    code: null,
    name: '',
    label_type: 'primary',
    type: 1,
    group: '',
    description: '',
    sort: 0,
    status: true,
    rule: null
  })

  const labelTypeOptions = [
    { label: '默认', value: 'default' },
    { label: '主要', value: 'primary' },
    { label: '成功', value: 'success' },
    { label: '警告', value: 'warning' },
    { label: '危险', value: 'danger' },
    { label: '信息', value: 'info' }
  ]

  const formRules = computed(() => ({
    name: [{ required: true, message: '请输入分群名称', trigger: 'blur' }],
    type: [{ required: true, message: '请选择类型', trigger: 'change' }],
    code: [
      {
        validator: (_: unknown, v: string, cb: (e?: Error) => void) => {
          if (formModel.type === 2 && !v) {
            cb(new Error('规则分群必填编码'))
          } else {
            cb()
          }
        },
        trigger: 'blur'
      }
    ]
  }))

  // 预览
  const previewVisible = ref(false)
  const previewLoading = ref(false)
  const previewData = ref<Api.SegmentManage.SegmentPreviewResponse | null>(null)

  async function handlePreview() {
    if (!editingId.value) {
      ElMessage.warning('请先保存分群后再预览')
      return
    }
    previewVisible.value = true
    previewLoading.value = true
    try {
      previewData.value = await fetchPreviewSegment(editingId.value)
    } finally {
      previewLoading.value = false
    }
  }

  function resetForm() {
    formModel.code = null
    formModel.name = ''
    formModel.label_type = 'primary'
    formModel.type = 1
    formModel.group = ''
    formModel.description = ''
    formModel.sort = 0
    formModel.status = true
    formModel.rule = null
  }

  function open(row?: Detail) {
    resetForm()
    if (row) {
      isEdit.value = true
      editingId.value = row.id
      Object.assign(formModel, {
        code: row.code,
        name: row.name,
        label_type: row.label_type || 'default',
        type: row.type,
        group: row.group,
        description: row.description,
        sort: row.sort,
        status: row.status,
        rule: row.rule
      })
    } else {
      isEdit.value = false
      editingId.value = null
    }
    visible.value = true
    nextTick(() => formRef.value?.clearValidate())
  }

  function handleClosed() {
    editingId.value = null
  }

  async function handleSubmit() {
    await formRef.value?.validate()
    submitting.value = true
    try {
      if (isEdit.value && editingId.value !== null) {
        await fetchUpdateSegment(editingId.value, { ...formModel })
      } else {
        await fetchCreateSegment({ ...formModel })
      }
      visible.value = false
      emit('success')
    } finally {
      submitting.value = false
    }
  }

  const emit = defineEmits<{ (e: 'success'): void }>()
  defineExpose({ open })
</script>

<style scoped lang="scss"></style>
