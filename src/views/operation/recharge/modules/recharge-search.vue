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
    (e: 'search', params: Partial<Api.WalletManage.RechargeSearchParams>): void
    (e: 'resetSearchParams'): void
  }

  const emit = defineEmits<Emits>()

  defineOptions({ name: 'RechargeSearch' })

  const searchBarRef = ref()
  const formData = ref<Record<string, any>>({})

  const formItems = computed(() => [
    {
      label: '订单号',
      key: 'order_no',
      type: 'input',
      placeholder: '请输入订单号',
      clearable: true
    },
    {
      label: '支付状态',
      key: 'pay_status',
      type: 'select',
      props: {
        placeholder: '请选择支付状态',
        clearable: true,
        options: [
          { label: '待支付', value: 'pending' },
          { label: '支付成功', value: 'success' },
          { label: '支付失败', value: 'failed' },
          { label: '已过期', value: 'expired' },
          { label: '已关闭', value: 'closed' }
        ]
      }
    },
    {
      label: '支付渠道',
      key: 'pay_channel',
      type: 'select',
      props: {
        placeholder: '请选择支付渠道',
        clearable: true,
        options: [
          { label: '人工充值', value: 'manual' },
          { label: '微信支付', value: 'wechat' },
          { label: '支付宝', value: 'alipay' },
          { label: 'Apple Pay', value: 'apple' }
        ]
      }
    },
    {
      label: '下单时间',
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
    const output: Partial<Api.WalletManage.RechargeSearchParams> = { ...rest }

    if (date_range && Array.isArray(date_range) && date_range.length === 2) {
      output.start_date = date_range[0]
      output.end_date = date_range[1]
    }

    emit('search', output)
  }
</script>
