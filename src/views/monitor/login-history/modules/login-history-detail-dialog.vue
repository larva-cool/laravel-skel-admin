<template>
  <ElDialog
    v-model="dialogVisible"
    title="登录日志详情"
    width="800px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <ElDescriptions :column="2" border class="mt-4">
      <ElDescriptionsItem label="ID" :span="1">{{ log?.id }}</ElDescriptionsItem>
      <ElDescriptionsItem label="登录结果" :span="1">
        <ElTag size="small" :type="log?.result ? 'success' : 'danger'">
          {{ log?.result ? '成功' : '失败' }}
        </ElTag>
      </ElDescriptionsItem>
      <ElDescriptionsItem label="归属主体" :span="1">
        <ElTag size="small" :type="log?.guard === 'admin' ? 'warning' : 'info'" effect="light">
          {{ log?.guard === 'admin' ? '管理员' : '前台用户' }}
        </ElTag>
      </ElDescriptionsItem>
      <ElDescriptionsItem label="账号" :span="1">
        {{ log?.user_name || `用户 #${log?.user_id}` }}
        <span class="text-xs text-g-500">（#{{ log?.user_id }}）</span>
      </ElDescriptionsItem>
      <ElDescriptionsItem label="登录 IP" :span="1">
        <code class="text-sm font-mono">{{ log?.ip || '—' }}</code>
      </ElDescriptionsItem>
      <ElDescriptionsItem label="端口" :span="1">{{ log?.port ?? '—' }}</ElDescriptionsItem>
      <ElDescriptionsItem label="归属地" :span="2">{{ log?.address || '—' }}</ElDescriptionsItem>
      <ElDescriptionsItem label="平台" :span="1">{{ log?.platform || '—' }}</ElDescriptionsItem>
      <ElDescriptionsItem label="设备" :span="1">{{ log?.device || '—' }}</ElDescriptionsItem>
      <ElDescriptionsItem label="浏览器" :span="2">{{ log?.browser || '—' }}</ElDescriptionsItem>
      <ElDescriptionsItem label="登录时间" :span="2">
        {{ log?.login_at || '—' }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="User Agent" :span="2">
        <span class="text-xs break-all">{{ log?.user_agent || '—' }}</span>
      </ElDescriptionsItem>
    </ElDescriptions>

    <template #footer>
      <ElButton type="primary" @click="handleClose">关闭</ElButton>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import { ref } from 'vue'

  defineOptions({ name: 'LoginHistoryDetailDialog' })

  type LoginHistoryItem = Api.Monitor.LoginHistoryItem

  const dialogVisible = ref(false)
  const log = ref<LoginHistoryItem | null>(null)

  const open = (row: LoginHistoryItem) => {
    dialogVisible.value = true
    log.value = row
  }

  const handleClose = () => {
    dialogVisible.value = false
    log.value = null
  }

  defineExpose({ open })
</script>

<style scoped lang="scss">
  .mt-4 {
    margin-top: 12px;
  }
</style>
