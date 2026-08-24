<template>
  <div class="art-full-height flex flex-col gap-3">
    <!-- 统计卡片 -->
    <FeedbackStats ref="statsRef" />

    <!-- 搜索栏 -->
    <FeedbackSearch
      v-show="showSearchBar"
      @search="handleSearch"
      @resetSearchParams="resetSearchParams"
    />

    <!-- 表格卡片 -->
    <ElCard class="art-table-card flex-1" :style="{ 'margin-top': showSearchBar ? '0' : '0' }">
      <ArtTableHeader
        v-model:columns="columnChecks"
        v-model:showSearchBar="showSearchBar"
        :loading="loading"
        @refresh="handleRefresh"
      />

      <ArtTable
        :loading="loading"
        :data="data"
        :columns="columns"
        :pagination="pagination"
        @pagination:size-change="handleSizeChange"
        @pagination:current-change="handleCurrentChange"
      />
    </ElCard>

    <!-- 详情抽屉 -->
    <FeedbackDetailDrawer
      ref="detailDrawerRef"
      :can-handle="hasAuth('feedbacks.edit')"
      @handle="openHandleDialog"
      @refresh="handleRefresh"
    />

    <!-- 处理弹窗 -->
    <FeedbackHandleDialog ref="handleDialogRef" @success="onHandleSuccess" />
  </div>
</template>

<script setup lang="ts">
  import { h, ref } from 'vue'
  import { ElTag, ElButton, ElMessageBox } from 'element-plus'
  import ArtSvgIcon from '@/components/core/base/art-svg-icon/index.vue'
  import { useTable } from '@/hooks/core/useTable'
  import { useAuth } from '@/hooks/core/useAuth'
  import { fetchGetFeedbackList, fetchDeleteFeedback } from '@/api/system-manage'
  import FeedbackStats from './modules/feedback-stats.vue'
  import FeedbackSearch from './modules/feedback-search.vue'
  import FeedbackDetailDrawer from './modules/feedback-detail-drawer.vue'
  import FeedbackHandleDialog from './modules/feedback-handle-dialog.vue'

  defineOptions({ name: 'Feedback' })

  type FeedbackListItem = Api.SystemManage.FeedbackListItem

  const { hasAuth } = useAuth()

  const showSearchBar = ref(true)
  const statsRef = ref<InstanceType<typeof FeedbackStats>>()
  const detailDrawerRef = ref<InstanceType<typeof FeedbackDetailDrawer>>()
  const handleDialogRef = ref<InstanceType<typeof FeedbackHandleDialog>>()

  const mapTagType = (t?: string) => {
    if (!t || t === 'default') return undefined
    return t as 'primary' | 'success' | 'warning' | 'danger' | 'info'
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
      apiFn: fetchGetFeedbackList,
      apiParams: { page: 1, per_page: 20 },
      columnsFactory: () => [
        { prop: 'code', label: '反馈编号', width: 220, showOverflowTooltip: true, fixed: 'left' },
        { prop: 'title', label: '标题', minWidth: 200, showOverflowTooltip: true },
        {
          prop: 'type_label',
          label: '反馈类型',
          width: 120,
          formatter: (row: FeedbackListItem) =>
            h(
              ElTag,
              { type: mapTagType(row.type_label_type), size: 'small', effect: 'plain' },
              () => row.type_label || '-'
            )
        },
        {
          prop: 'status_label',
          label: '处理状态',
          width: 110,
          formatter: (row: FeedbackListItem) =>
            h(
              ElTag,
              { type: mapTagType(row.status_label_type), size: 'small' },
              () => row.status_label || '-'
            )
        },
        {
          prop: 'priority_label',
          label: '优先级',
          width: 100,
          formatter: (row: FeedbackListItem) =>
            h(
              ElTag,
              { type: mapTagType(row.priority_label_type), size: 'small', effect: 'dark' },
              () => row.priority_label || '-'
            )
        },
        { prop: 'contact_name', label: '联系人', width: 120, showOverflowTooltip: true },
        { prop: 'created_at', label: '提交时间', width: 180 },
        {
          prop: 'actions',
          label: '操作',
          width: 180,
          fixed: 'right',
          formatter: (row: FeedbackListItem) =>
            h('div', { class: 'flex items-center gap-1' }, [
              h(
                ElButton,
                {
                  type: 'primary',
                  link: true,
                  size: 'small',
                  onClick: () => viewDetail(row)
                },
                () => [h(ArtSvgIcon, { icon: 'ri:eye-line', class: 'mr-0.5' }), '查看']
              ),
              hasAuth('feedbacks.edit')
                ? h(
                    ElButton,
                    {
                      type: 'primary',
                      link: true,
                      size: 'small',
                      disabled: row.status >= 5,
                      onClick: () => openHandleDialog(row)
                    },
                    () => [h(ArtSvgIcon, { icon: 'ri:edit-line', class: 'mr-0.5' }), '处理']
                  )
                : null,
              hasAuth('feedbacks.delete')
                ? h(
                    ElButton,
                    {
                      type: 'danger',
                      link: true,
                      size: 'small',
                      onClick: () => handleDelete(row)
                    },
                    () => [h(ArtSvgIcon, { icon: 'ri:delete-bin-line', class: 'mr-0.5' }), '删除']
                  )
                : null
            ])
        }
      ]
    }
  })

  const viewDetail = (row: FeedbackListItem) => {
    detailDrawerRef.value?.open(row)
  }

  const openHandleDialog = (row: FeedbackListItem) => {
    handleDialogRef.value?.open(row)
  }

  const onHandleSuccess = () => {
    refreshData()
    statsRef.value?.refresh()
  }

  const handleDelete = (row: FeedbackListItem) => {
    ElMessageBox.confirm(
      `确认删除反馈「${row.title}」（${row.code}）吗？删除后不可恢复。`,
      '删除反馈',
      {
        type: 'warning',
        confirmButtonText: '确认删除',
        cancelButtonText: '取消'
      }
    )
      .then(async () => {
        await fetchDeleteFeedback(row.id)
        refreshData()
        statsRef.value?.refresh()
      })
      .catch(() => {})
  }

  const handleSearch = (params: Partial<Api.SystemManage.FeedbackSearchParams>) => {
    const paramsRecord = searchParams as Record<string, unknown>
    Object.keys(paramsRecord).forEach((key) => {
      if (key !== 'page' && key !== 'per_page') {
        delete paramsRecord[key]
      }
    })
    Object.assign(searchParams, params)
    getData()
  }

  const handleRefresh = () => {
    refreshData()
    statsRef.value?.refresh()
  }
</script>
