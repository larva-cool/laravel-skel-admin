<!-- 定时任务详情（含该任务的调度日志） -->
<template>
  <ElDialog
    v-model="dialogVisible"
    title="定时任务详情"
    width="900px"
    :close-on-click-modal="false"
    append-to-body
  >
    <!-- 顶部：任务基本信息 -->
    <ElDescriptions :column="2" border size="small" class="mb-4">
      <ElDescriptionsItem label="任务名称">{{ detail?.name }}</ElDescriptionsItem>
      <ElDescriptionsItem label="状态">
        <ElTag :type="detail?.status === 1 ? 'success' : 'info'" size="small">
          {{ detail?.status_text }}
        </ElTag>
      </ElDescriptionsItem>
      <ElDescriptionsItem label="Artisan 命令">
        <code class="font-mono text-xs">{{ detail?.command }}</code>
      </ElDescriptionsItem>
      <ElDescriptionsItem label="Cron 表达式">
        <code class="font-mono text-xs text-cyan-700">{{ detail?.expression }}</code>
      </ElDescriptionsItem>
      <ElDescriptionsItem label="完整命令" :span="2">
        <code class="font-mono text-xs">{{ detail?.command_string }}</code>
      </ElDescriptionsItem>
      <ElDescriptionsItem label="描述" :span="2">
        {{ detail?.description || '—' }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="创建时间">{{ detail?.created_at || '—' }}</ElDescriptionsItem>
      <ElDescriptionsItem label="更新时间">{{ detail?.updated_at || '—' }}</ElDescriptionsItem>
    </ElDescriptions>

    <!-- 下方：该任务的调度日志 -->
    <div class="flex items-center justify-between mb-2">
      <span class="font-medium">调度日志</span>
      <ElButton text type="primary" :loading="logLoading" @click="loadLogs">刷新</ElButton>
    </div>

    <ElTable :data="logs" v-loading="logLoading" size="small" height="320">
      <ElTableColumn prop="started_at" label="开始时间" width="160" show-overflow-tooltip />
      <ElTableColumn prop="finished_at" label="结束时间" width="160" show-overflow-tooltip />
      <ElTableColumn label="状态" width="90">
        <template #default="{ row }">
          <ElTag :type="logStatusType(row.status)" size="small">{{ row.status_text }}</ElTag>
        </template>
      </ElTableColumn>
      <ElTableColumn prop="runtime" label="耗时(秒)" width="90">
        <template #default="{ row }">{{ row.runtime ?? '—' }}</template>
      </ElTableColumn>
      <ElTableColumn prop="exit_code" label="退出码" width="80">
        <template #default="{ row }">{{ row.exit_code ?? '—' }}</template>
      </ElTableColumn>
      <ElTableColumn prop="hostname" label="主机" min-width="120" show-overflow-tooltip>
        <template #default="{ row }">{{ row.hostname || '—' }}</template>
      </ElTableColumn>
      <ElTableColumn label="异常信息" min-width="160" show-overflow-tooltip>
        <template #default="{ row }">
          <span v-if="row.exception" class="text-red-500">{{ row.exception }}</span>
          <span v-else>—</span>
        </template>
      </ElTableColumn>
    </ElTable>

    <!-- 日志分页 -->
    <div class="flex justify-end mt-3">
      <ElPagination
        v-model:current-page="logPage"
        v-model:page-size="logPerPage"
        :total="logTotal"
        layout="total, prev, pager, next"
        small
        background
        @current-change="loadLogs"
      />
    </div>

    <template #footer>
      <ElButton type="primary" @click="dialogVisible = false">关闭</ElButton>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import type { ScheduleItem } from '@/api/schedule'
  import { fetchScheduleDetail } from '@/api/schedule'
  import { fetchScheduleLogList } from '@/api/monitor'

  defineOptions({ name: 'ScheduleDetailDialog' })

  const dialogVisible = ref(false)
  const detail = ref<ScheduleItem>()

  // 调度日志
  const logs = ref<Api.Monitor.ScheduleLogItem[]>([])
  const logLoading = ref(false)
  const logPage = ref(1)
  const logPerPage = ref(5)
  const logTotal = ref(0)

  /** 调度日志状态对应的 tag 类型 */
  function logStatusType(status: number): 'success' | 'danger' | 'info' | 'warning' {
    // 1=成功，2=失败，0=运行中，3=跳过
    switch (status) {
      case 1:
        return 'success'
      case 2:
        return 'danger'
      case 0:
        return 'warning'
      default:
        return 'info'
    }
  }

  /** 加载该任务的调度日志（按任务名称精确过滤） */
  async function loadLogs() {
    if (!detail.value) return
    logLoading.value = true
    try {
      const result = await fetchScheduleLogList({
        page: logPage.value,
        per_page: logPerPage.value,
        name: detail.value.name
      })
      logs.value = result.data
      logTotal.value = result.meta.total
    } finally {
      logLoading.value = false
    }
  }

  async function open(row: ScheduleItem) {
    dialogVisible.value = true
    logPage.value = 1
    detail.value = row

    try {
      detail.value = await fetchScheduleDetail(row.id)
    } catch {
      // 接口失败时使用列表行数据
      detail.value = row
    }

    await loadLogs()
  }

  defineExpose({ open })
</script>
