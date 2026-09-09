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
    (e: 'search', params: Partial<Api.WalletManage.WithdrawSearchParams>): void
    (e: 'resetSearchParams'): void
  }

  const emit = defineEmits<Emits>()

  defineOptions({ name: 'WithdrawSearch' })

  const searchBarRef = ref()
  const formData = ref<Record<string, any>>({})

  const formItems = computed(() => [
    {
      label: '提现单号',
      key: 'order_no',
      type: 'input',
      placeholder: '请输入提现单号',
      clearable: true
    },
    {
      label: '审核状态',
      key: 'status',
      type: 'select',
      props: {
        placeholder: '请选择审核状态',
        clearable: true,
        options: [
          { label: '待审核', value: 'pending' },
          { label: '已通过', value: 'approved' },
          { label: '已驳回', value: 'rejected' },
          { label: '已打款', value: 'success' },
          { label: '打款失败', value: 'failed' }
        ]
      }
    },
    {
      label: '账户类型',
      key: 'account_type',
      type: 'select',
      props: {
        placeholder: '请选择账户类型',
        clearable: true,
        options: [
          { label: '微信', value: 'wechat' },
          { label: '支付宝', value: 'alipay' },
          { label: '银行卡', value: 'bank' }
        ]
      }
    },
    {
      label: '申请时间',
      key: 'date_range',
      type: 'daterange',
      props: {
        type: 'daterange',
        placeholder: ['开始日期', '结束日期'],
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

    const { date_range, ...rest } = params
    const output: Partial<Api.WalletManage.WithdrawSearchParams> = { ...rest }

    if (date_range && Array.isArray(date_range) && date_range.length === 2) {
      output.start_date = date_range[0]
      output.end_date = date_range[1]
    }

    emit('search', output)
  }
</script>
