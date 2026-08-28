<template>
  <ElDialog
    v-model="visible"
    :title="`分群「${segment?.name ?? ''}」规则预览`"
    width="560px"
    @closed="handleClosed"
  >
    <div v-loading="loading">
      <div class="mb-3">
        共匹配
        <span class="text-lg font-semibold text-primary mx-1">{{ data?.total ?? 0 }}</span>
        名用户
      </div>
      <ElTable v-if="data && data.sample.length" :data="data.sample" border>
        <ElTableColumn prop="id" label="用户 ID" width="100" />
        <ElTableColumn label="账号">
          <template #default="{ row }">
            {{ row.username || row.name || '-' }}
          </template>
        </ElTableColumn>
        <ElTableColumn label="头像" width="80">
          <template #default="{ row }">
            <ElAvatar :src="row.avatar" :size="32">
              {{ (row.name || row.username || '?').charAt(0) }}
            </ElAvatar>
          </template>
        </ElTableColumn>
      </ElTable>
      <ElEmpty v-else description="无匹配用户" :image-size="80" />
    </div>
  </ElDialog>
</template>

<script setup lang="ts">
  import { fetchPreviewSegment } from '@/api/segment-manage'

  const visible = ref(false)
  const loading = ref(false)
  const data = ref<Api.SegmentManage.SegmentPreviewResponse | null>(null)
  const segment = ref<Api.SegmentManage.SegmentListItem | null>(null)

  async function open(row: Api.SegmentManage.SegmentListItem) {
    if (row.type !== 2) {
      ElMessage.warning('仅规则分群支持预览')
      return
    }
    segment.value = row
    visible.value = true
    loading.value = true
    try {
      data.value = await fetchPreviewSegment(row.id)
    } finally {
      loading.value = false
    }
  }

  function handleClosed() {
    segment.value = null
    data.value = null
  }

  defineExpose({ open })
</script>

<style scoped lang="scss"></style>
