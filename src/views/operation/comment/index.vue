<template>
  <div class="art-full-height flex flex-col gap-3">
    <!-- 搜索栏 -->
    <CommentSearch
      v-show="showSearchBar"
      :source-type-options="sourceTypeOptions"
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
      >
        <template #left>
          <ElSpace wrap>
            <ElButton v-auth="'comments.export'" :loading="isExporting" @click="handleExport">
              <ElIcon class="mr-1"><Download /></ElIcon>
              导出
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

    <!-- 详情抽屉 -->
    <CommentDetailDrawer
      ref="detailDrawerRef"
      :can-review="hasAuth('comments.edit')"
      :source-type-map="sourceTypeMap"
      @review="openReviewDialog"
      @refresh="handleRefresh"
    />

    <!-- 审核弹窗 -->
    <CommentReviewDialog ref="reviewDialogRef" @success="onReviewSuccess" />
  </div>
</template>

<script setup lang="ts">
  import { computed, h, ref } from 'vue'
  import { ElTag, ElButton, ElMessageBox } from 'element-plus'
  import { Download } from '@element-plus/icons-vue'
  import ArtSvgIcon from '@/components/core/base/art-svg-icon/index.vue'
  import { useTable } from '@/hooks/core/useTable'
  import { useAuth } from '@/hooks/core/useAuth'
  import {
    fetchGetCommentList,
    fetchDeleteComment,
    fetchGetCommentSourceTypes,
    fetchExportComments
  } from '@/api/content-manage'
  import CommentSearch from './modules/comment-search.vue'
  import CommentDetailDrawer from './modules/comment-detail-drawer.vue'
  import CommentReviewDialog from './modules/comment-review-dialog.vue'
  import { useExport } from '@/hooks/core/useExport'

  defineOptions({ name: 'Comment' })

  type CommentListItem = Api.ContentManage.CommentListItem
  type SourceOption = { label: string; value: string }

  const { hasAuth } = useAuth()

  const showSearchBar = ref(true)
  const detailDrawerRef = ref<InstanceType<typeof CommentDetailDrawer>>()
  const reviewDialogRef = ref<InstanceType<typeof CommentReviewDialog>>()

  // 源类型选项（接口加载）
  const sourceTypeOptions = ref<SourceOption[]>([])
  const sourceTypeMap = computed<Record<string, string>>(() => {
    const map: Record<string, string> = {}
    sourceTypeOptions.value.forEach((opt) => {
      map[opt.value] = opt.label
    })
    return map
  })

  const sourceTypeLabel = (t?: string) => sourceTypeMap.value[t || ''] || t || '-'

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
      apiFn: fetchGetCommentList,
      apiParams: { page: 1, per_page: 20 },
      columnsFactory: () => [
        { prop: 'id', label: 'ID', width: 100 },
        {
          prop: 'username',
          label: '评论用户',
          width: 140,
          showOverflowTooltip: true,
          formatter: (row: CommentListItem) => row.username || `ID:${row.user_id}`
        },
        { prop: 'content', label: '评论内容', minWidth: 260, showOverflowTooltip: true },
        {
          prop: 'source_type',
          label: '评论目标',
          width: 120,
          formatter: (row: CommentListItem) =>
            h(
              ElTag,
              { size: 'small', effect: 'plain' },
              () => `${sourceTypeLabel(row.source_type)} #${row.source_id}`
            )
        },
        {
          prop: 'status_label',
          label: '审核状态',
          width: 100,
          formatter: (row: CommentListItem) =>
            h(
              ElTag,
              { type: mapTagType(row.status_label_type), size: 'small' },
              () => row.status_label || '-'
            )
        },
        { prop: 'like_count', label: '点赞', width: 70, align: 'center' },
        { prop: 'comment_count', label: '回复', width: 70, align: 'center' },
        { prop: 'created_at', label: '评论时间', width: 170 },
        {
          prop: 'actions',
          label: '操作',
          width: 200,
          fixed: 'right',
          formatter: (row: CommentListItem) =>
            h('div', { class: 'flex items-center gap-1' }, [
              h(
                ElButton,
                {
                  type: 'primary',
                  link: true,
                  size: 'small',
                  onClick: () => viewDetail(row)
                },
                () => [h(ArtSvgIcon, { icon: 'ri:eye-line', class: 'mr-0.5' }), '详情']
              ),
              hasAuth('comments.edit') && (row.status === 'pending' || row.status === 'review')
                ? h(
                    ElButton,
                    {
                      type: 'primary',
                      link: true,
                      size: 'small',
                      onClick: () => openReviewDialog(row)
                    },
                    () => [h(ArtSvgIcon, { icon: 'ri:check-double-line', class: 'mr-0.5' }), '审核']
                  )
                : null,
              hasAuth('comments.delete')
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

  // 导出
  const { isExporting, handleExport: doExport } = useExport()
  const handleExport = () => {
    const filters = { ...(searchParams as Record<string, unknown>) }
    delete filters.page
    delete filters.per_page
    doExport(
      () => fetchExportComments(filters as unknown as Api.ContentManage.CommentSearchParams),
      'comments'
    )
  }

  const viewDetail = (row: CommentListItem) => {
    detailDrawerRef.value?.open(row)
  }

  const openReviewDialog = (row: CommentListItem) => {
    reviewDialogRef.value?.open(row)
  }

  const onReviewSuccess = () => {
    refreshData()
  }

  const handleDelete = (row: CommentListItem) => {
    ElMessageBox.confirm('确认删除该评论吗？删除后不可恢复。', '删除评论', {
      type: 'warning',
      confirmButtonText: '确认删除',
      cancelButtonText: '取消'
    })
      .then(async () => {
        await fetchDeleteComment(row.id)
        refreshData()
      })
      .catch(() => {})
  }

  const handleSearch = (params: Partial<Api.ContentManage.CommentSearchParams>) => {
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
  }

  async function loadSourceTypes() {
    try {
      sourceTypeOptions.value = await fetchGetCommentSourceTypes()
    } catch {
      sourceTypeOptions.value = []
    }
  }

  onMounted(loadSourceTypes)
</script>
