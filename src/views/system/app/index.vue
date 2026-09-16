<template>
  <div class="art-full-height">
    <ArtSearchBar
      v-show="showSearchBar"
      v-model="formFilters"
      :items="formItems"
      @reset="handleReset"
      @search="handleSearch"
    />

    <ElCard class="art-table-card" :style="{ 'margin-top': showSearchBar ? '12px' : '0' }">
      <ArtTableHeader
        v-model:columns="columnChecks"
        v-model:showSearchBar="showSearchBar"
        :loading="loading"
        @refresh="refreshData"
      >
        <template #left>
          <ElButton type="primary" v-auth="'apps.create'" @click="handleAdd" v-ripple>
            新增应用
          </ElButton>
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

      <AppDialog ref="dialogRef" @refresh="refreshData" />
    </ElCard>
  </div>
</template>

<script setup lang="ts">
  import { fetchDeleteApp, fetchGetAppList } from '@/api/app-manage'
  import ArtButtonTable from '@/components/core/forms/art-button-table/index.vue'
  import ArtIconButton from '@/components/core/widget/art-icon-button/index.vue'
  import { useTable } from '@/hooks/core/useTable'
  import { useAuth } from '@/hooks/core/useAuth'
  import { mittBus } from '@/utils/sys'
  import { ElMessageBox, ElTag, ElTooltip } from 'element-plus'
  import AppDialog from './modules/app-dialog.vue'

  defineOptions({ name: 'AppRelease' })

  type AppListItem = Api.AppManage.AppListItem
  type LatestVersion = {
    version: string
    build: number
    force_update: boolean
    published_at: string | null
  } | null

  const showSearchBar = ref(true)
  const dialogRef = ref<InstanceType<typeof AppDialog>>()
  const { hasAuth } = useAuth()

  const formFilters = reactive({ keyword: '' })

  const formItems = [
    {
      label: '关键词',
      key: 'keyword',
      type: 'input',
      props: { clearable: true, placeholder: '应用名称 / 标识' }
    }
  ]

  /** 渲染单个平台最新版本标签 */
  const renderVersionTag = (label: string, v: LatestVersion) => {
    if (!v) {
      return h(ElTag, { size: 'small', type: 'info' }, () => `${label} -`)
    }
    return h(
      ElTooltip,
      { content: `构建号: ${v.build} | 发布时间: ${v.published_at ?? '-'}`, placement: 'top' },
      () =>
        h(
          ElTag,
          { size: 'small', type: v.force_update ? 'danger' : 'success' },
          () => `${label} ${v.version}${v.force_update ? ' (强制)' : ''}`
        )
    )
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
      apiFn: fetchGetAppList,
      apiParams: {
        page: 1,
        per_page: 20
      },
      columnsFactory: () => [
        { prop: 'id', label: 'ID', width: 100 },
        { prop: 'name', label: '应用名称', minWidth: 120 },
        { prop: 'slug', label: '应用标识', width: 130 },
        {
          prop: 'latest_versions',
          label: '最新版本',
          minWidth: 320,
          formatter: (row: AppListItem) => {
            const lv = row.latest_versions
            if (!lv) return '-'
            return h('div', { class: 'flex items-center gap-1 flex-wrap' }, [
              renderVersionTag('安卓', lv.android),
              renderVersionTag('iOS', lv.ios),
              renderVersionTag('鸿蒙', lv.harmony)
            ])
          }
        },
        {
          prop: 'status',
          label: '状态',
          width: 80,
          formatter: (row: AppListItem) =>
            h(ElTag, { type: row.status ? 'success' : 'info', size: 'small' }, () =>
              row.status ? '启用' : '禁用'
            )
        },
        { prop: 'sort', label: '排序', width: 70 },
        { prop: 'created_at', label: '创建时间', width: 170 },
        {
          prop: 'operation',
          label: '操作',
          width: 220,
          align: 'right',
          formatter: (row: AppListItem) => {
            return h('div', { class: 'flex items-center justify-end' }, [
              h(ArtIconButton, {
                icon: 'ri:git-branch-line',
                title: '版本管理',
                class: '!size-8 bg-g-200 dark:bg-g-300/45 text-sm mr-2.5',
                onClick: () => handleVersions(row)
              }),
              hasAuth('apps.edit')
                ? h(ArtButtonTable, {
                    type: 'edit',
                    title: '编辑',
                    onClick: () => handleEdit(row)
                  })
                : null,
              hasAuth('apps.delete')
                ? h(ArtButtonTable, {
                    type: 'delete',
                    title: '删除',
                    onClick: () => handleDelete(row)
                  })
                : null
            ])
          }
        }
      ]
    }
  })

  const handleSearch = (): void => {
    const params = searchParams as Record<string, unknown>
    Object.keys(params).forEach((key) => {
      if (key !== 'page' && key !== 'per_page') {
        delete params[key]
      }
    })
    Object.assign(searchParams, { keyword: formFilters.keyword })
    getData()
  }

  const handleReset = (): void => {
    formFilters.keyword = ''
    resetSearchParams()
  }

  const handleAdd = (): void => {
    dialogRef.value?.open(null)
  }

  const handleEdit = (row: AppListItem): void => {
    dialogRef.value?.open(row)
  }

  const handleVersions = (row: AppListItem): void => {
    routerPush(`/system/app/${row.id}/versions`)
  }

  const handleDelete = async (row: AppListItem): Promise<void> => {
    try {
      await ElMessageBox.confirm(`确定删除应用"${row.name}"吗？`, '删除确认', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })
      await fetchDeleteApp(row.id)
      refreshData()
    } catch {
      // 用户取消
    }
  }

  const { push: routerPush } = useRouter()

  const handleRefreshAppList = (): void => {
    getData()
  }

  onMounted(() => {
    getData()
    mittBus.on('refreshAppList', handleRefreshAppList)
  })

  onUnmounted(() => {
    mittBus.off('refreshAppList', handleRefreshAppList)
  })
</script>
