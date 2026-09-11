<template>
  <ElDrawer v-model="visible" size="560px" :destroy-on-close="true" title="任务记录详情">
    <div v-loading="loading" class="p-5">
      <ElSkeleton v-if="loading && !detail" :rows="6" animated />
      <template v-else-if="detail">
        <ElDescriptions :column="1" border size="default">
          <ElDescriptionsItem label="日志ID">{{ detail.id }}</ElDescriptionsItem>
          <ElDescriptionsItem label="用户">
            <div v-if="detail.user" class="flex items-center gap-2">
              <ElAvatar v-if="detail.user.avatar" :src="detail.user.avatar" :size="28" />
              <span>{{
                detail.user.nickname || detail.user.username || `ID:${detail.user_id}`
              }}</span>
              <span class="text-xs text-[var(--el-text-color-secondary)]"
                >(ID:{{ detail.user_id }})</span
              >
            </div>
            <span v-else>ID:{{ detail.user_id }}</span>
          </ElDescriptionsItem>
          <ElDescriptionsItem label="任务">
            <div v-if="detail.task">
              {{ detail.task.name }}
              <span class="ml-2 text-xs text-[var(--el-text-color-secondary)]"
                >{{ detail.task.code }} (ID:{{ detail.task_id }})</span
              >
            </div>
            <span v-else>ID:{{ detail.task_id }}</span>
          </ElDescriptionsItem>
          <ElDescriptionsItem label="周期标识">{{ detail.period_key || '-' }}</ElDescriptionsItem>
          <ElDescriptionsItem label="奖励">
            <ElTag :type="rewardTagType(detail.reward_type)" size="small">{{
              detail.reward_type_label || detail.reward_type
            }}</ElTag>
            <span class="ml-2 font-medium">{{ detail.reward_amount }}</span>
          </ElDescriptionsItem>
          <ElDescriptionsItem label="触发来源">{{ detail.source_type || '-' }}</ElDescriptionsItem>
          <ElDescriptionsItem label="备注">
            <div class="whitespace-pre-wrap break-all">{{ detail.remark || '-' }}</div>
          </ElDescriptionsItem>
          <ElDescriptionsItem label="记录时间">{{ detail.created_at || '-' }}</ElDescriptionsItem>
        </ElDescriptions>
      </template>
    </div>
    <template #footer>
      <ElButton @click="close">关闭</ElButton>
    </template>
  </ElDrawer>
</template>

<script setup lang="ts">
  import {
    ElDescriptions,
    ElDescriptionsItem,
    ElDrawer,
    ElSkeleton,
    ElTag,
    ElAvatar
  } from 'element-plus'
  import { fetchGetTaskLogDetail } from '@/api/operation-manage'

  defineOptions({ name: 'TaskLogDetailDrawer' })

  const visible = ref(false)
  const loading = ref(false)
  const detail = ref<Api.OperationManage.TaskLogListItem | null>(null)

  const rewardTagType = (t?: string): 'warning' | 'success' | 'danger' | 'info' => {
    switch (t) {
      case 'coin':
        return 'warning'
      case 'point':
        return 'success'
      case 'vip_days':
        return 'danger'
      default:
        return 'info'
    }
  }

  const open = async (row: Api.OperationManage.TaskLogListItem) => {
    detail.value = { ...row }
    visible.value = true
    loading.value = true
    try {
      detail.value = await fetchGetTaskLogDetail(row.id)
    } catch {
      // 降级使用行数据
    } finally {
      loading.value = false
    }
  }

  const close = () => {
    visible.value = false
    detail.value = null
  }

  defineExpose({ open })
</script>
