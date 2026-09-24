<template>
  <ElDialog
    v-model="dialogVisible"
    :title="isEdit ? '编辑合作方账户' : '新增合作方账户'"
    width="560px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <ElForm ref="formRef" :model="form" :rules="rules" label-width="100px">
      <ElFormItem v-if="!isEdit" label="用户名" prop="username">
        <ElInput v-model="form.username" placeholder="请输入用户名" clearable autocomplete="off" />
      </ElFormItem>
      <ElFormItem label="合作方名称" prop="name">
        <ElInput v-model="form.name" placeholder="请输入合作方名称" clearable />
      </ElFormItem>
      <ElFormItem label="邮箱" prop="email">
        <ElInput v-model="form.email" placeholder="请输入邮箱" clearable autocomplete="off" />
      </ElFormItem>
      <ElFormItem label="手机号" prop="phone">
        <ElInput v-model="form.phone" placeholder="请输入手机号" clearable autocomplete="off" />
      </ElFormItem>
      <ElFormItem label="密码" prop="password">
        <ElInput
          v-model="form.password"
          type="password"
          :placeholder="isEdit ? '留空则不修改密码' : '请输入初始密码'"
          show-password
          autocomplete="new-password"
        />
      </ElFormItem>
      <ElFormItem label="联系人" prop="contact_name">
        <ElInput v-model="form.contact_name" placeholder="请输入联系人" clearable />
      </ElFormItem>
      <ElFormItem label="联系电话" prop="contact_phone">
        <ElInput v-model="form.contact_phone" placeholder="请输入联系电话" clearable />
      </ElFormItem>
      <ElFormItem label="联系邮箱" prop="contact_email">
        <ElInput v-model="form.contact_email" placeholder="请输入联系邮箱" clearable />
      </ElFormItem>
      <ElFormItem label="请求上限" prop="rate_limit">
        <ElInputNumber v-model="form.rate_limit" :min="0" :max="100000" :step="10" />
        <span class="ml-2 text-xs text-gray-400">次/分钟（0 使用全局默认）</span>
      </ElFormItem>
      <ElFormItem label="状态" prop="status">
        <ElRadioGroup v-model="form.status">
          <ElRadio :value="1">正常</ElRadio>
          <ElRadio :value="0">冻结</ElRadio>
        </ElRadioGroup>
      </ElFormItem>
    </ElForm>

    <template #footer>
      <ElButton @click="handleClose">取消</ElButton>
      <ElButton type="primary" :loading="submitting" @click="handleSubmit">确认</ElButton>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import { fetchCreateOpenAccount, fetchUpdateOpenAccount } from '@/api/open-account'
  import type { FormInstance, FormRules } from 'element-plus'

  defineOptions({ name: 'OpenAccountDialog' })

  const emit = defineEmits<{
    (e: 'refresh'): void
  }>()

  const dialogVisible = ref(false)
  const formRef = ref<FormInstance>()
  const submitting = ref(false)
  const isEdit = ref(false)
  const id = ref<number | null>(null)

  const form = reactive({
    username: '',
    name: '',
    email: '',
    phone: '',
    password: '',
    contact_name: '',
    contact_phone: '',
    contact_email: '',
    rate_limit: 60,
    status: 0 as number
  })

  const rules = computed<FormRules>(() => ({
    username: !isEdit.value
      ? [{ min: 3, max: 50, message: '长度在 3 到 50 个字符', trigger: 'blur' }]
      : [],
    name: [
      { required: true, message: '请输入合作方名称', trigger: 'blur' },
      { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
    ],
    email: [{ type: 'email', message: '请输入正确的邮箱', trigger: 'blur' }],
    contact_email: [{ type: 'email', message: '请输入正确的邮箱', trigger: 'blur' }],
    rate_limit: [{ type: 'number', min: 0, message: '不能小于 0', trigger: 'blur' }]
  }))

  const open = (row?: Api.OpenAccount.OpenAccountItem) => {
    isEdit.value = !!row
    id.value = row?.id ?? null
    Object.assign(form, {
      username: row?.username ?? '',
      name: row?.name ?? '',
      email: row?.email ?? '',
      phone: row?.phone ?? '',
      password: '',
      contact_name: row?.contact_name ?? '',
      contact_phone: row?.contact_phone ?? '',
      contact_email: row?.contact_email ?? '',
      rate_limit: row?.rate_limit ?? 60,
      status: row?.status?.value ?? 0
    })
    dialogVisible.value = true
  }

  const handleSubmit = async () => {
    if (!formRef.value) return
    await formRef.value.validate(async (valid) => {
      if (!valid) return
      submitting.value = true
      try {
        const payload = {
          username: form.username || undefined,
          name: form.name,
          email: form.email || null,
          phone: form.phone || null,
          password: form.password || undefined,
          contact_name: form.contact_name || undefined,
          contact_phone: form.contact_phone || undefined,
          contact_email: form.contact_email || undefined,
          rate_limit: form.rate_limit,
          status: form.status
        }
        if (isEdit.value) {
          await fetchUpdateOpenAccount(id.value!, payload)
        } else {
          await fetchCreateOpenAccount(payload)
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
