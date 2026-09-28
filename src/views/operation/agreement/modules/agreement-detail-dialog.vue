<template>
  <ElDialog
    v-model="visible"
    title="协议详情"
    width="800px"
    :close-on-click-modal="false"
    destroy-on-close
    align-center
  >
    <ElDescriptions v-if="detail" :column="1" border>
      <ElDescriptionsItem label="协议标题">
        {{ detail.title }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="类别">
        <ElTag type="info" size="small">{{ categoryLabel }}</ElTag>
      </ElDescriptionsItem>
      <ElDescriptionsItem label="版本号">
        {{ detail.version }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="状态">
        <ElTag :type="statusInfo.type" size="small">{{ statusInfo.label }}</ElTag>
      </ElDescriptionsItem>
      <ElDescriptionsItem label="生效时间">
        {{ detail.effective_at || '-' }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="创建时间">
        {{ detail.created_at || '-' }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="协议内容">
        <div class="agreement-content" v-html="detail.content"></div>
      </ElDescriptionsItem>
    </ElDescriptions>

    <template #footer>
      <ElButton @click="visible = false">关闭</ElButton>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import { fetchGetAgreementDetail } from '@/api/operation-manage'
  import { fetchDictItemsByCode } from '@/api/system-manage'

  defineOptions({ name: 'AgreementDetailDialog' })

  const visible = ref(false)
  const detail = ref<Api.OperationManage.AgreementListItem | null>(null)
  const categoryOptions = ref<{ label: string; value: string }[]>([])

  const statusTagMap: Record<string, { type: 'info' | 'success' | 'warning'; label: string }> = {
    draft: { type: 'info', label: '草稿' },
    published: { type: 'success', label: '已发布' },
    archived: { type: 'warning', label: '已归档' }
  }

  const categoryLabel = computed(() => {
    if (!detail.value) return '-'
    const opt = categoryOptions.value.find((o) => o.value === detail.value!.category)
    return opt?.label || detail.value.category
  })

  const statusInfo = computed(() => {
    if (!detail.value) return { type: 'info' as const, label: '-' }
    return (
      statusTagMap[detail.value.status] || { type: 'info' as const, label: detail.value.status }
    )
  })

  const open = async (row: Api.OperationManage.AgreementListItem) => {
    detail.value = row
    visible.value = true
    try {
      const res = await fetchGetAgreementDetail(row.id)
      detail.value = res
    } catch {
      // 保留列表行数据
    }
  }

  async function loadCategoryOptions() {
    try {
      const items = await fetchDictItemsByCode('agreement_category')
      categoryOptions.value = (items || []).map((it) => ({ label: it.label, value: it.value }))
    } catch {
      categoryOptions.value = []
    }
  }

  onMounted(loadCategoryOptions)

  defineExpose({ open })
</script>

<style scoped lang="scss">
  .agreement-content {
    line-height: 1.8;
    word-break: break-word;

    :deep(img) {
      max-width: 100%;
      height: auto;
    }
  }
</style>
