<template>
  <ArtSearchBar
    ref="searchBarRef"
    v-model="formData"
    :items="formItems"
    @reset="handleReset"
    @search="handleSearch"
  />
</template>

<script setup lang="ts">
  import { computed, ref } from 'vue'

  interface Emits {
    (e: 'search', params: Partial<Api.WalletManage.WalletTradeSearchParams>): void
    (e: 'resetSearchParams'): void
  }

  const emit = defineEmits<Emits>()

  defineOptions({ name: 'WalletSearch' })

  const searchBarRef = ref()
  const formData = ref<Record<string, any>>({})

  const typeOptions = [
    { label: '充值', value: 'recharge' },
    { label: '提现', value: 'withdraw' },
    { label: '冻结', value: 'freeze' },
    { label: '解冻', value: 'unfreeze' },
    { label: '消费', value: 'payment' },
    { label: '退款', value: 'refund' },
    { label: '后台充正', value: 'admin_recharge' },
    { label: '后台扣减', value: 'admin_deduct' }
  ]

  const statusOptions = [
    { label: '处理中', value: 'pending' },
    { label: '已完成', value: 'success' },
    { label: '已失败', value: 'failed' }
  ]

  const formItems = computed(() => [
    {
      label: '交易描述',
      key: 'keyword',
      type: 'input',
      placeholder: '请输入交易描述关键词',
      clearable: true
    },
    {
      label: '交易类型',
      key: 'type',
      type: 'select',
      props: {
        placeholder: '请选择交易类型',
        clearable: true,
        options: typeOptions
      }
    },
    {
      label: '流水状态',
      key: 'status',
      type: 'select',
      props: {
        placeholder: '请选择流水状态',
        clearable: true,
        options: statusOptions
      }
    },
    {
      label: '用户ID',
      key: 'owner_id',
      type: 'input',
      placeholder: '请输入用户ID',
      clearable: true
    },
    {
      label: '交易时间',
      key: 'date_range',
      type: 'daterange',
      props: {
        type: 'daterange',
        startPlaceholder: '开始日期',
        endPlaceholder: '结束日期',
        clearable: true,
        format: 'YYYY-MM-DD',
        valueFormat: 'YYYY-MM-DD'
      }
    }
  ])

  function handleReset() {
    formData.value = {}
    emit('resetSearchParams')
  }

  async function handleSearch(params: Record<string, any>) {
    await searchBarRef.value?.validate()

    const { date_range, owner_id, ...rest } = params
    const output: Partial<Api.WalletManage.WalletTradeSearchParams> = { ...rest }

    // 按用户ID筛选时需同时带上多态类型，否则后端无法定位持有者
    if (owner_id) {
      output.owner_id = Number(owner_id)
      output.owner_type = 'user'
    }

    if (date_range && Array.isArray(date_range) && date_range.length === 2) {
      output.start_date = date_range[0]
      output.end_date = date_range[1]
    }

    emit('search', output)
  }
</script>
