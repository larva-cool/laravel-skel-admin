<template>
  <div class="art-full-height flex flex-col gap-3">
    <AutomationSearch
      v-show="showSearchBar"
      @search="handleSearch"
      @resetSearchParams="resetSearchParams"
    />

    <ElCard class="art-table-card flex-1">
      <ArtTableHeader
        v-model:columns="columnChecks"
        v-model:showSearchBar="showSearchBar"
        :loading="loading"
        @refresh="handleRefresh"
      >
        <template #left>
          <ElSpace wrap>
            <ElButton v-auth="'automation-rules.create'" type="primary" @click="openCreateDialog">
              <ElIcon class="mr-1"><Plus /></ElIcon>
              新增规则
            </ElButton>
          </ElSpace>
        </template>
      </ArtTableHeader>

      <ArtTable
        :loading="loading"
        :data="data"
        :columns="columns"
        :pagination="pagination"
        @pagination:size-change="handleSizeChange"
        @pagination:current-change="handleCurrentChange"
      />
    </ElCard>

    <AutomationRuleDialog ref="ruleDialogRef" @success="onEditSuccess" />
    <AutomationLogDrawer ref="logDrawerRef" />
  </div>
</template>

<script setup lang="ts">
  import { h, ref } from 'vue'
  import { ElTag, ElButton, ElMessageBox, ElSwitch } from 'element-plus'
  import { Plus } from '@element-plus/icons-vue'
  import ArtButtonMore, { ButtonMoreItem } from '@/components/core/forms/art-button-more/index.vue'
  import ArtButtonTable from '@/components/core/forms/art-button-table/index.vue'
  import { useTable } from '@/hooks/core/useTable'
  import { useAuth } from '@/hooks/core/useAuth'
  import {
    fetchGetAutomationRuleList,
    fetchDeleteAutomationRule,
    fetchToggleAutomationRuleStatus,
    fetchTriggerAutomationRule
  } from '@/api/automation'
  import AutomationSearch from './modules/automation-search.vue'
  import AutomationRuleDialog from './modules/automation-rule-dialog.vue'
  import AutomationLogDrawer from './modules/automation-log-drawer.vue'

  defineOptions({ name: 'AutomationRule' })

  type RuleListItem = Api.Automation.RuleListItem

  const { hasAuth } = useAuth()

  const showSearchBar = ref(true)
  const ruleDialogRef = ref<InstanceType<typeof AutomationRuleDialog>>()
  const logDrawerRef = ref<InstanceType<typeof AutomationLogDrawer>>()
  const toggleLoading = ref<Map<number, boolean>>(new Map())
  const triggerLoading = ref<Map<number, boolean>>(new Map())

  const channelMap: Record<string, string> = {
    database: '站内通知',
    wechat_mini_program: '微信小程序'
  }

  const {
    columns,
    columnChecks,
    data,
    loading,
    pagination,
    getData,
    searchParams,
    resetSearchParams,
    handleSizeChange,
    handleCurrentChange,
    refreshData
  } = useTable({
    core: {
      apiFn: fetchGetAutomationRuleList,
      apiParams: { page: 1, per_page: 20 },
      columnsFactory: () => [
        { prop: 'id', label: 'ID', width: 80 },
        { prop: 'name', label: '规则名称', minWidth: 150, showOverflowTooltip: true },
        {
          prop: 'trigger_type',
          label: '触发类型',
          width: 120,
          formatter: (row: RuleListItem) =>
            h(
              ElTag,
              {
                type: (row.trigger_type_label_type || 'info') as never,
                size: 'small',
                effect: 'light'
              },
              () => row.trigger_type_label
            )
        },
        {
          prop: 'trigger_config',
          label: '触发时机',
          width: 160,
          formatter: (row: RuleListItem) => {
            const advance = row.trigger_config?.advance_days ?? 0
            const advanceText = advance > 0 ? `提前 ${advance} 天` : '当天'
            return `${advanceText} ${row.trigger_config?.send_time ?? '-'} 推送`
          }
        },
        {
          prop: 'segment',
          label: '目标人群',
          width: 120,
          formatter: (row: RuleListItem) => row.segment?.name || '全量用户'
        },
        {
          prop: 'channels',
          label: '触达渠道',
          width: 170,
          formatter: (row: RuleListItem) =>
            h(
              'div',
              { class: 'flex gap-1' },
              (row.channels || []).map((channel) =>
                h(ElTag, { size: 'small', effect: 'plain' }, () => channelMap[channel] || channel)
              )
            )
        },
        {
          prop: 'reward_amount',
          label: '奖励',
          width: 110,
          formatter: (row: RuleListItem) =>
            row.reward_type === 'none' ? '-' : `${row.reward_type_label} × ${row.reward_amount}`
        },
        {
          prop: 'last_triggered_at',
          label: '最近触发',
          width: 170,
          formatter: (row: RuleListItem) =>
            row.last_triggered_at
              ? `${row.last_triggered_at}（${row.last_triggered_count ?? 0} 人）`
              : '-'
        },
        {
          prop: 'status',
          label: '状态',
          width: 90,
          formatter: (row: RuleListItem) =>
            h(ElSwitch, {
              modelValue: row.status,
              loading: toggleLoading.value.get(row.id) ?? false,
              disabled: !hasAuth('automation-rules.edit'),
              activeText: '启用',
              inactiveText: '禁用',
              inlinePrompt: true,
              onChange: () => handleToggleStatus(row)
            })
        },
        { prop: 'created_at', label: '创建时间', width: 170, showOverflowTooltip: true },
        {
          prop: 'actions',
          label: '操作',
          width: 140,
          fixed: 'right',
          formatter: (row: RuleListItem) =>
            h('div', { class: 'flex items-center' }, [
              hasAuth('automation-rules.edit')
                ? h(ArtButtonTable, {
                    type: 'edit',
                    title: '编辑',
                    onClick: () => openEditDialog(row)
                  })
                : null,
              h(ArtButtonMore, {
                list: [
                  {
                    key: 'trigger',
                    label: '手动触发',
                    icon: 'ri:send-plane-line',
                    auth: 'automation-rules.edit'
                  },
                  {
                    key: 'logs',
                    label: '触发日志',
                    icon: 'ri:file-list-3-line',
                    auth: 'automation-logs.index'
                  },
                  {
                    key: 'delete',
                    label: '删除',
                    icon: 'ri:delete-bin-4-line',
                    color: '#f56c6c',
                    auth: 'automation-rules.delete'
                  }
                ] as ButtonMoreItem[],
                onClick: (item: ButtonMoreItem) => handleAction(item, row)
              })
            ])
        }
      ]
    }
  })

  const openCreateDialog = () => ruleDialogRef.value?.open()
  const openEditDialog = (row: RuleListItem) => ruleDialogRef.value?.open(row)
  const onEditSuccess = () => refreshData()

  const handleAction = (item: ButtonMoreItem, row: RuleListItem) => {
    switch (item.key) {
      case 'trigger':
        handleTrigger(row)
        break
      case 'logs':
        logDrawerRef.value?.open(row)
        break
      case 'delete':
        handleDelete(row)
        break
    }
  }

  const handleTrigger = (row: RuleListItem) => {
    ElMessageBox.confirm(
      `将立即对规则「${row.name}」执行一次匹配与触达（忽略推送时间窗），是否继续？`,
      '手动触发',
      { type: 'warning', confirmButtonText: '确认触发', cancelButtonText: '取消' }
    )
      .then(async () => {
        triggerLoading.value.set(row.id, true)
        try {
          const result = await fetchTriggerAutomationRule(row.id)
          const summary = result?.summary
          if (summary) {
            ElMessage({
              type: summary.failed > 0 ? 'warning' : 'success',
              message: `事件日期 ${summary.event_date}：触达 ${summary.sent} 人，失败 ${summary.failed} 人，跳过 ${summary.skipped} 人`
            })
          }
          refreshData()
        } finally {
          triggerLoading.value.delete(row.id)
        }
      })
      .catch(() => {})
  }

  const handleDelete = (row: RuleListItem) => {
    ElMessageBox.confirm(`确认删除规则「${row.name}」吗？删除后不再自动触发。`, '删除规则', {
      type: 'warning',
      confirmButtonText: '确认删除',
      cancelButtonText: '取消'
    })
      .then(async () => {
        await fetchDeleteAutomationRule(row.id)
        refreshData()
      })
      .catch(() => {})
  }

  const handleToggleStatus = async (row: RuleListItem) => {
    toggleLoading.value.set(row.id, true)
    try {
      await fetchToggleAutomationRuleStatus(row.id)
      refreshData()
    } catch {
      // 失败不刷新
    } finally {
      toggleLoading.value.delete(row.id)
    }
  }

  const handleSearch = (params: Partial<Api.Automation.RuleSearchParams>) => {
    const paramsRecord = searchParams as Record<string, unknown>
    Object.keys(paramsRecord).forEach((key) => {
      if (key !== 'page' && key !== 'per_page') delete paramsRecord[key]
    })
    Object.assign(searchParams, params)
    getData()
  }

  const handleRefresh = () => refreshData()
</script>
