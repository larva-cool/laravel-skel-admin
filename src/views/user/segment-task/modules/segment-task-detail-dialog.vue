<template>
  <ElDialog
    ref="dialogRef"
    v-model="visible"
    title="分群异步任务详情"
    width="560"
    :close-on-click-modal="false"
    align-center
    destroy-on-close
  >
    <div v-if="loading" v-loading="loading" class="h-40" />
    <div v-else class="space-y-3 text-sm">
      <ElDescriptions :column="2" border size="default">
        <ElDescriptionsItem label="任务 ID">{{ detail.id }}</ElDescriptionsItem>
        <ElDescriptionsItem label="管理员 ID">{{ detail.admin_id }}</ElDescriptionsItem>
        <ElDescriptionsItem label="任务类型">
          <ElTag
            :type="detail.type === 'attach' ? 'primary' : 'warning'"
            size="small"
            effect="plain"
          >
            {{ detail.type_label }}
          </ElTag>
        </ElDescriptionsItem>
        <ElDescriptionsItem label="任务状态">
          <ElTag :type="statusTagType(detail.status)" size="small" effect="plain">
            {{ detail.status_label }}
          </ElTag>
        </ElDescriptionsItem>
        <ElDescriptionsItem label="总数">{{ detail.total_count }}</ElDescriptionsItem>
        <ElDescriptionsItem label="已处理">{{ detail.processed_count }}</ElDescriptionsItem>
        <ElDescriptionsItem label="实际打标">{{ detail.added_count }}</ElDescriptionsItem>
        <ElDescriptionsItem label="进度">{{ detail.progress_percent }}%</ElDescriptionsItem>
        <ElDescriptionsItem label="创建时间" :span="2">
          {{ detail.created_at ?? '-' }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="开始时间" :span="2">
          {{ detail.started_at ?? '-' }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="完成时间" :span="2">
          {{ detail.finished_at ?? '-' }}
        </ElDescriptionsItem>
        <ElDescriptionsItem v-if="detail.error_message" label="失败原因" :span="2">
          <span class="text-red-500 break-all">{{ detail.error_message }}</span>
        </ElDescriptionsItem>
      </ElDescriptions>

      <div class="rounded-md bg-gray-50 px-3 py-2 dark:bg-gray-800/40">
        <div class="mb-1 text-xs text-gray-500">进度</div>
        <ElProgress
          :percentage="detail.progress_percent"
          :status="progressStatus(detail.status)"
          :stroke-width="14"
          :format="(p) => `${p}% (${detail.processed_count}/${detail.total_count})`"
        />
      </div>
    </div>

    <template #footer>
      <ElButton @click="visible = false">关闭</ElButton>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import { ElMessage } from 'element-plus'
  import { fetchGetSegmentTaskDetail } from '@/api/segment-manage'

  defineOptions({ name: 'SegmentTaskDetailDialog' })

  type Detail = Api.SegmentManage.SegmentTaskItem

  const visible = ref(false)
  const loading = ref(false)
  const detail = ref<Detail>({
    id: 0,
    admin_id: 0,
    type: 'attach',
    type_label: '',
    status: 'pending',
    status_label: '',
    total_count: 0,
    processed_count: 0,
    added_count: 0,
    progress_percent: 0,
    error_message: null,
    started_at: null,
    finished_at: null,
    created_at: null
  })
  let currentId = 0

  function statusTagType(status: Detail['status']) {
    switch (status) {
      case 'pending':
        return 'info'
      case 'running':
        return 'primary'
      case 'completed':
        return 'success'
      case 'failed':
        return 'danger'
      default:
        return 'info'
    }
  }

  function progressStatus(status: Detail['status']): '' | 'success' | 'exception' {
    if (status === 'completed') return 'success'
    if (status === 'failed') return 'exception'
    return ''
  }

  async function open(id: number) {
    currentId = id
    visible.value = true
    await load()
  }

  async function load() {
    if (!currentId) return
    loading.value = true
    try {
      detail.value = await fetchGetSegmentTaskDetail(currentId)
    } catch {
      ElMessage.error('任务详情加载失败')
      visible.value = false
    } finally {
      loading.value = false
    }
  }

  defineExpose({ open })
</script>

<style scoped lang="scss"></style>
