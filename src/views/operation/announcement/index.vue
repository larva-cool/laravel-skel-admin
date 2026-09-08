<template>
  <div class="art-full-height flex flex-col gap-3">
    <!-- 搜索栏 -->
    <AnnouncementSearch
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
            <ElButton v-auth="'announcements.create'" type="primary" @click="openCreateDialog">
              <ElIcon class="mr-1"><Plus /></ElIcon>
              新增公告
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

    <!-- 新增/编辑弹窗 -->
    <AnnouncementEditDialog ref="editDialogRef" @success="onEditSuccess" />
  </div>
</template>

<script setup lang="ts">
  import { h, ref } from 'vue'
  import { ElTag, ElButton, ElMessageBox } from 'element-plus'
  import { Plus } from '@element-plus/icons-vue'
  import ArtSvgIcon from '@/components/core/base/art-svg-icon/index.vue'
  import { useTable } from '@/hooks/core/useTable'
  import { useAuth } from '@/hooks/core/useAuth'
  import {
    fetchGetAnnouncementList,
    fetchDeleteAnnouncement,
    fetchToggleAnnouncementStatus
  } from '@/api/operation-manage'
  import AnnouncementSearch from './modules/announcement-search.vue'
  import AnnouncementEditDialog from './modules/announcement-edit-dialog.vue'

  defineOptions({ name: 'AnnouncementManage' })

  type AnnouncementListItem = Api.OperationManage.AnnouncementListItem

  const { hasAuth } = useAuth()

  const showSearchBar = ref(true)
  const editDialogRef = ref<InstanceType<typeof AnnouncementEditDialog>>()

  const statusTagMap: Record<string, { type: 'info' | 'success' | 'warning'; label: string }> = {
    draft: { type: 'info', label: '草稿' },
    published: { type: 'success', label: '已发布' },
    archived: { type: 'warning', label: '已归档' }
  }

  const toggleLoading = ref<Map<number, boolean>>(new Map())

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
      apiFn: fetchGetAnnouncementList,
      apiParams: { page: 1, per_page: 20 },
      columnsFactory: () => [
        { prop: 'id', label: 'ID', width: 100 },
        { prop: 'title', label: '标题', minWidth: 200, showOverflowTooltip: true },
        {
          prop: 'summary',
          label: '摘要',
          minWidth: 200,
          showOverflowTooltip: true,
          formatter: (row: AnnouncementListItem) => row.summary || '-'
        },
        { prop: 'sort', label: '排序', width: 80, align: 'center' },
        {
          prop: 'status',
          label: '状态',
          width: 110,
          formatter: (row: AnnouncementListItem) => {
            const info = statusTagMap[row.status] || { type: 'info' as const, label: row.status }
            return h(ElTag, { type: info.type, size: 'small', effect: 'light' }, () => info.label)
          }
        },
        {
          prop: 'published_at',
          label: '发布时间',
          width: 170,
          showOverflowTooltip: true,
          formatter: (row: AnnouncementListItem) => row.published_at || '-'
        },
        { prop: 'created_at', label: '创建时间', width: 170, showOverflowTooltip: true },
        {
          prop: 'actions',
          label: '操作',
          width: 220,
          fixed: 'right',
          formatter: (row: AnnouncementListItem) =>
            h('div', { class: 'flex items-center gap-1' }, [
              hasAuth('announcements.edit')
                ? h(
                    ElButton,
                    {
                      type: 'primary',
                      link: true,
                      size: 'small',
                      loading: toggleLoading.value.get(row.id) ?? false,
                      onClick: () => handleToggleStatus(row)
                    },
                    () => [
                      h(ArtSvgIcon, { icon: 'ri:exchange-line', class: 'mr-0.5' }),
                      getToggleLabel(row.status)
                    ]
                  )
                : null,
              hasAuth('announcements.edit')
                ? h(
                    ElButton,
                    {
                      type: 'primary',
                      link: true,
                      size: 'small',
                      onClick: () => openEditDialog(row)
                    },
                    () => [h(ArtSvgIcon, { icon: 'ri:edit-line', class: 'mr-0.5' }), '编辑']
                  )
                : null,
              hasAuth('announcements.delete')
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

  const getToggleLabel = (status: string): string => {
    switch (status) {
      case 'draft':
        return '发布'
      case 'published':
        return '归档'
      case 'archived':
        return '重新发布'
      default:
        return '切换'
    }
  }

  const openCreateDialog = () => {
    editDialogRef.value?.open()
  }

  const openEditDialog = (row: AnnouncementListItem) => {
    editDialogRef.value?.open(row)
  }

  const onEditSuccess = () => {
    refreshData()
  }

  const handleDelete = (row: AnnouncementListItem) => {
    ElMessageBox.confirm(`确认删除公告「${row.title}」吗？删除后不可恢复。`, '删除公告', {
      type: 'warning',
      confirmButtonText: '确认删除',
      cancelButtonText: '取消'
    })
      .then(async () => {
        await fetchDeleteAnnouncement(row.id)
        refreshData()
      })
      .catch(() => {})
  }

  const handleToggleStatus = async (row: AnnouncementListItem) => {
    toggleLoading.value.set(row.id, true)
    try {
      await fetchToggleAnnouncementStatus(row.id)
      refreshData()
    } catch {
      // 失败不刷新
    } finally {
      toggleLoading.value.delete(row.id)
    }
  }

  const handleSearch = (params: Partial<Api.OperationManage.AnnouncementSearchParams>) => {
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
</script>

<style scoped lang="scss"></style>
