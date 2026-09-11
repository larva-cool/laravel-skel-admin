<template>
  <ElDialog
    v-model="dialogVisible"
    title="钱包调账"
    width="520px"
    :close-on-click-modal="false"
    destroy-on-close
    @close="handleClose"
  >
    <ElAlert
      title="正数为充正余额，负数为扣减余额；扣减不可超过用户可用余额。调账会生成不可修改的钱包流水。"
      type="warning"
      :closable="false"
      show-icon
      class="mb-3"
    />

    <ElForm ref="formRef" :model="form" :rules="rules" label-width="90px">
      <ElFormItem label="用户" prop="user_id">
        <ElSelect
          v-model="form.user_id"
          filterable
          remote
          clearable
          reserve-keyword
          placeholder="输入用户名/昵称/手机号搜索"
          :remote-method="searchUsers"
          :loading="userLoading"
          style="width: 100%"
          @change="handleUserChange"
        >
          <ElOption
            v-for="item in userOptions"
            :key="item.id"
            :label="`${item.name || item.username}（#${item.id}）`"
            :value="item.id"
          />
        </ElSelect>
      </ElFormItem>

      <ElFormItem v-if="wallet" label="当前余额">
        <div class="text-sm leading-6">
          <span class="text-g-600">可用</span>
          <span class="ml-1 font-semibold tabular-nums text-primary"
            >¥{{ formatMoney(wallet.available_balance) }}</span
          >
          <span class="ml-3 text-g-600">余额</span>
          <span class="ml-1 tabular-nums">¥{{ formatMoney(wallet.balance) }}</span>
          <span class="ml-3 text-g-600">冻结</span>
          <span class="ml-1 tabular-nums text-warning"
            >¥{{ formatMoney(wallet.frozen_balance) }}</span
          >
        </div>
      </ElFormItem>

      <ElFormItem label="调整金额" prop="amount">
        <ElInputNumber
          v-model="form.amount"
          :min="-99999999.99"
          :max="99999999.99"
          :precision="2"
          :step="10"
          placeholder="正数充正，负数扣减"
          style="width: 100%"
        />
        <div class="form-tip">保留两位小数，不能为 0</div>
      </ElFormItem>

      <ElFormItem label="调账说明" prop="description">
        <ElInput
          v-model="form.description"
          type="textarea"
          :rows="3"
          maxlength="255"
          show-word-limit
          placeholder="请填写调账原因，用于审计追溯"
        />
      </ElFormItem>
    </ElForm>

    <template #footer>
      <ElButton @click="handleClose">取消</ElButton>
      <ElButton type="primary" :loading="submitting" @click="handleSubmit">确认调账</ElButton>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import { computed, reactive, ref } from 'vue'
  import type { FormInstance, FormRules } from 'element-plus'
  import { fetchAdjustUserWallet, fetchGetUserWallet } from '@/api/wallet'
  import { fetchGetUserList } from '@/api/user-manage'

  defineOptions({ name: 'WalletAdjustDialog' })

  const emit = defineEmits<{
    (e: 'success'): void
  }>()

  const dialogVisible = ref(false)
  const formRef = ref<FormInstance>()
  const submitting = ref(false)
  const userLoading = ref(false)
  const userOptions = ref<Api.UserManage.UserListItem[]>([])
  const wallet = ref<Api.WalletManage.UserWallet | null>(null)

  const form = reactive<{
    user_id: number | undefined
    amount: number | undefined
    description: string
  }>({
    user_id: undefined,
    amount: undefined,
    description: ''
  })

  const availableBalance = computed(() => toNumber(wallet.value?.available_balance))

  const rules = computed<FormRules>(() => ({
    user_id: [{ required: true, message: '请选择要调账的用户', trigger: 'change' }],
    amount: [
      { required: true, message: '请输入调整金额', trigger: 'blur' },
      {
        validator: (_rule, value, callback) => {
          if (!value) {
            callback(new Error('调整金额不能为 0'))
            return
          }
          if (value < 0 && wallet.value && Math.abs(value) > availableBalance.value) {
            callback(new Error(`扣减金额不能超过可用余额 ¥${formatMoney(availableBalance.value)}`))
            return
          }
          callback()
        },
        trigger: 'blur'
      }
    ],
    description: [
      { required: true, message: '请填写调账说明', trigger: 'blur' },
      { max: 255, message: '调账说明不能超过 255 个字符', trigger: 'blur' }
    ]
  }))

  function toNumber(v: number | string | null | undefined): number {
    if (v == null) return 0
    const n = typeof v === 'number' ? v : Number(v)
    return Number.isFinite(n) ? n : 0
  }

  function formatMoney(v: number | string | null | undefined): string {
    return toNumber(v).toFixed(2)
  }

  async function searchUsers(keyword: string) {
    if (!keyword) {
      userOptions.value = []
      return
    }
    userLoading.value = true
    try {
      const res = await fetchGetUserList({ page: 1, per_page: 20, keyword })
      userOptions.value = res.data ?? []
    } finally {
      userLoading.value = false
    }
  }

  async function loadWallet(userId: number) {
    try {
      wallet.value = await fetchGetUserWallet(userId)
    } catch {
      wallet.value = null
    }
  }

  function handleUserChange(userId?: number) {
    wallet.value = null
    if (userId) {
      loadWallet(userId)
    }
  }

  /** 支持从流水行直接带入用户，也支持无参从头选择 */
  const open = async (owner?: { id: number; name: string } | null) => {
    dialogVisible.value = true
    wallet.value = null
    userOptions.value = []
    form.user_id = undefined
    form.amount = undefined
    form.description = ''

    if (owner?.id) {
      userOptions.value = [
        { id: owner.id, name: owner.name, username: owner.name } as Api.UserManage.UserListItem
      ]
      form.user_id = owner.id
      await loadWallet(owner.id)
    }
  }

  const handleSubmit = async () => {
    if (!formRef.value) return
    await formRef.value.validate(async (valid) => {
      if (!valid) return
      submitting.value = true
      try {
        await fetchAdjustUserWallet(form.user_id!, {
          amount: form.amount!,
          description: form.description
        })
        dialogVisible.value = false
        emit('success')
      } finally {
        submitting.value = false
      }
    })
  }

  const handleClose = () => {
    dialogVisible.value = false
    wallet.value = null
  }

  defineExpose({ open })
</script>

<style scoped lang="scss">
  .mb-3 {
    margin-bottom: 16px;
  }

  .form-tip {
    margin-top: 4px;
    font-size: 12px;
    line-height: 1.4;
    color: var(--el-text-color-secondary);
  }
</style>
