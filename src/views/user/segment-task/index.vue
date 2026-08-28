<template>
  <div class="art-full-height flex flex-col gap-3">
    <!-- 搜索栏 -->
    <SegmentTaskSearch
      v-show="showSearchBar"
      @search="handleSearch"
      @resetSearchParams="resetSearchParams"
    />

    <!-- 表格卡片 -->
    <ElCard class="art-table-card flex-1">
      <ArtTableHeader
        v-model:columns="columnChecks"
        v-model:showSearchBar="showSearchBar"
        :loading="loading"
        @refresh="handleRefresh"
      >
        <template #left>
          <ElSpace wrap>
            <ElTag
              :type="hasActiveTask ? 'primary' : 'info'"
              size="default"
              effect="plain"
              class="select-none"
            >
              <ElIcon class="mr-1 align-middle">
                <component :is="hasActiveTask ? 'ri:refresh-line' : 'ri:checkbox-circle-line'" />
              </ElIcon>
              <span>{{ pollingLabel }}</span>
            </ElTag>
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

    <!-- 任务详情弹窗 -->
    <SegmentTaskDetailDialog ref="detailDialogRef" />
  </div>
</template>

<script setup lang="ts">
  import { fetchGetSegmentTaskList } from '@/api/segment-manage'
  import ArtSvgIcon from '@/components/core/base/art-svg-icon/index.vue'
  import { useTable } from '@/hooks/core/useTable'
  import { ElButton, ElProgress, ElTag } from 'element-plus'
  import { computed, h, onBeforeUnmount, onMounted, ref } from 'vue'
  import SegmentTaskDetailDialog from './modules/segment-task-detail-dialog.vue'
  import SegmentTaskSearch from './modules/segment-task-search.vue'

  defineOptions({ name: 'UserSegmentTaskList' })

  type Item = Api.SegmentManage.SegmentTaskItem

  const showSearchBar = ref(true)
  const detailDialogRef = ref<InstanceType<typeof SegmentTaskDetailDialog>>()

  // 5 秒轮询一次，仅当存在 pending/running 任务时开启
  const POLL_INTERVAL_MS = 5_000
  let pollTimer: ReturnType<typeof setInterval> | null = null

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
    refreshSoft
  } = useTable({
    core: {
      apiFn: fetchGetSegmentTaskList,
      apiParams: { page: 1, per_page: 15 },
      columnsFactory: () => [
        { prop: 'id', label: '任务 ID', width: 90 },
        {
          prop: 'type',
          label: '类型',
          width: 90,
          formatter: (row: Item) =>
            h(
              ElTag,
              {
                type: row.type === 'attach' ? 'primary' : 'warning',
                size: 'small',
                effect: 'plain'
              },
              () => row.type_label
            )
        },
        {
          prop: 'status',
          label: '状态',
          width: 100,
          formatter: (row: Item) =>
            h(
              ElTag,
              { type: statusTagType(row.status), size: 'small', effect: 'plain' },
              () => row.status_label
            )
        },
        {
          prop: 'progress',
          label: '进度',
          minWidth: 240,
          formatter: (row: Item) =>
            h(ElProgress, {
              percentage: row.progress_percent,
              status: progressStatus(row.status),
              strokeWidth: 12,
              textInside: true,
              format: () => `${row.processed_count}/${row.total_count}`
            })
        },
        { prop: 'added_count', label: '实际打标', width: 100, align: 'center' },
        { prop: 'created_at', label: '提交时间', width: 170, showOverflowTooltip: true },
        {
          prop: 'actions',
          label: '操作',
          width: 100,
          fixed: 'right',
          formatter: (row: Item) =>
            h(
              ElButton,
              {
                type: 'primary',
                link: true,
                size: 'small',
                onClick: () => openDetail(row)
              },
              () => [h(ArtSvgIcon, { icon: 'ri:eye-line', class: 'mr-0.5' }), '详情']
            )
        }
      ]
    }
  })

  // 工具函数
  function statusTagType(status: Item['status']) {
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

  function progressStatus(status: Item['status']): '' | 'success' | 'exception' {
    if (status === 'completed') return 'success'
    if (status === 'failed') return 'exception'
    return ''
  }

  // 计算属性：当前页是否仍有进行中的任务
  const hasActiveTask = computed(() =>
    data.value.some((row) => row.status === 'pending' || row.status === 'running')
  )

  const pollingLabel = computed(() =>
    hasActiveTask.value ? `自动刷新中（每 ${POLL_INTERVAL_MS / 1000}s）` : '无运行中任务'
  )

  // 轮询控制
  function startPolling() {
    stopPolling()
    pollTimer = setInterval(() => {
      void refreshSoft()
    }, POLL_INTERVAL_MS)
  }

  function stopPolling() {
    if (pollTimer) {
      clearInterval(pollTimer)
      pollTimer = null
    }
  }

  // 监听 hasActiveTask：有进行中任务 → 启动轮询；全部完成 → 停止轮询
  watch(hasActiveTask, (active) => {
    if (active) {
      if (!pollTimer) startPolling()
    } else {
      stopPolling()
    }
  })

  onMounted(() => {
    // 首次进入如有进行中任务则启动轮询
    if (hasActiveTask.value) startPolling()
  })

  onBeforeUnmount(() => {
    stopPolling()
  })

  // 事件处理
  function openDetail(row: Item) {
    detailDialogRef.value?.open(row.id)
  }

  function handleSearch(params: Partial<Api.SegmentManage.SegmentTaskSearchParams>) {
    const paramsRecord = searchParams as Record<string, unknown>
    Object.keys(paramsRecord).forEach((key) => {
      if (key !== 'page' && key !== 'per_page') {
        delete paramsRecord[key]
      }
    })
    Object.assign(searchParams, params)
    getData()
  }

  function handleRefresh() {
    refreshSoft()
  }
</script>

<style scoped lang="scss"></style>
