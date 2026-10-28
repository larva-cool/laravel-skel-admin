<template>
  <ElDrawer v-model="visible" size="720px" :destroy-on-close="true" :title="drawerTitle">
    <div class="p-5">
      <div class="mb-3 flex items-center gap-3">
        <ElSelect v-model="status" placeholder="状态" clearable class="w-32" @change="loadData(1)">
          <ElOption label="成功" value="success" />
          <ElOption label="失败" value="failed" />
        </ElSelect>
        <ElDatePicker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="事件日期起"
          end-placeholder="事件日期止"
          format="YYYY-MM-DD"
          value-format="YYYY-MM-DD"
          class="!w-64"
          @change="loadData(1)"
        />
      </div>

      <ElTable v-loading="loading" :data="list" border stripe>
        <ElTableColumn prop="id" label="ID" width="80" />
        <ElTableColumn label="用户" min-width="140">
          <template #default="{ row }">
            <span v-if="row.user"
              >{{ row.user.name || row.user.username }}（ID:{{ row.user_id }}）</span
            >
            <span v-else>ID:{{ row.user_id }}</span>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="trigger_date" label="事件日期" width="110" />
        <ElTableColumn label="命中节日" width="100">
          <template #default="{ row }">{{ row.festival?.name || '-' }}</template>
        </ElTableColumn>
        <ElTableColumn label="状态" width="90">
          <template #default="{ row }">
            <ElTag :type="row.status_label_type" size="small">{{ row.status_label }}</ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="error" label="失败原因" min-width="140" show-overflow-tooltip>
          <template #default="{ row }">{{ row.error || '-' }}</template>
        </ElTableColumn>
        <ElTableColumn prop="created_at" label="触达时间" width="165" />
      </ElTable>

      <div class="mt-3 flex justify-end">
        <ElPagination
          v-model:current-page="page"
          :page-size="perPage"
          :total="total"
          layout="total, prev, pager, next"
          @current-change="loadData()"
        />
      </div>
    </div>
    <template #footer>
      <ElButton @click="close">关闭</ElButton>
    </template>
  </ElDrawer>
</template>

<script setup lang="ts">
  import { fetchGetAutomationLogList } from '@/api/automation'

  defineOptions({ name: 'AutomationLogDrawer' })

  const visible = ref(false)
  const loading = ref(false)
  const ruleId = ref<number | null>(null)
  const list = ref<Api.Automation.LogListItem[]>([])
  const page = ref(1)
  const perPage = ref(15)
  const total = ref(0)
  const status = ref<string>()
  const dateRange = ref<[string, string] | null>(null)

  const drawerTitle = ref('触发日志')

  async function loadData(targetPage?: number) {
    if (targetPage) page.value = targetPage
    if (!ruleId.value) return
    loading.value = true
    try {
      const params: Api.Automation.LogSearchParams = {
        rule_id: ruleId.value,
        page: page.value,
        per_page: perPage.value,
        status: status.value || undefined
      }
      if (dateRange.value && dateRange.value.length === 2) {
        params.date_from = dateRange.value[0]
        params.date_to = dateRange.value[1]
      }
      const result = await fetchGetAutomationLogList(params)
      list.value = result.data || []
      total.value = result.meta?.total ?? 0
    } finally {
      loading.value = false
    }
  }

  function open(rule: Api.Automation.RuleListItem) {
    ruleId.value = rule.id
    drawerTitle.value = `触发日志 - ${rule.name}`
    page.value = 1
    status.value = undefined
    dateRange.value = null
    visible.value = true
    loadData()
  }

  function close() {
    visible.value = false
  }

  defineExpose({ open })
</script>
