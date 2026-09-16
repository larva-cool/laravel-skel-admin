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
          <ElButton :icon="ArrowLeft" @click="handleBack" v-ripple> 返回 </ElButton>
          <ElButton type="primary" v-auth="'app-versions.create'" @click="handleAdd" v-ripple>
            新增版本
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

      <VersionDialog ref="dialogRef" :app-id="appId" @refresh="refreshData" />
    </ElCard>
  </div>
</template>

<script setup lang="ts">
  import {
    fetchDeleteVersion,
    fetchGetVersionList,
    fetchObsoleteVersion,
    fetchPublishVersion,
    fetchWithdrawVersion
  } from '@/api/app-manage'
  import ArtButtonMore, { ButtonMoreItem } from '@/components/core/forms/art-button-more/index.vue'
  import ArtButtonTable from '@/components/core/forms/art-button-table/index.vue'
  import { useTable } from '@/hooks/core/useTable'
  import { useAuth } from '@/hooks/core/useAuth'
  import { mittBus } from '@/utils/sys'
  import { ElTag, ElMessageBox } from 'element-plus'
  import { ArrowLeft } from '@element-plus/icons-vue'
  import VersionDialog from './modules/version-dialog.vue'

  defineOptions({ name: 'AppVersion' })

  type VersionListItem = Api.AppManage.VersionListItem

  const route = useRoute()
  const router = useRouter()
  const appId = computed(() => Number(route.params.id))

  const showSearchBar = ref(true)
  const dialogRef = ref<InstanceType<typeof VersionDialog>>()
  const { hasAuth } = useAuth()

  const formFilters = reactive({
    platform: '',
    status: ''
  })

  const platformOptions = [
    { label: '安卓', value: 'android' },
    { label: 'iOS', value: 'ios' },
    { label: '鸿蒙', value: 'harmony' }
  ]

  const statusOptions = [
    { label: '草稿', value: 'draft' },
    { label: '已发布', value: 'published' },
    { label: '已撤回', value: 'withdrawn' },
    { label: '已废弃', value: 'obsolete' }
  ]

  const formItems = [
    {
      label: '平台',
      key: 'platform',
      type: 'select',
      props: { clearable: true, options: platformOptions }
    },
    {
      label: '状态',
      key: 'status',
      type: 'select',
      props: { clearable: true, options: statusOptions }
    }
  ]

  const statusTagType: Record<string, 'primary' | 'success' | 'warning' | 'info' | 'danger'> = {
    draft: 'info',
    published: 'success',
    withdrawn: 'warning',
    obsolete: 'danger'
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
      apiFn: (params: Api.AppManage.VersionSearchParams) =>
        fetchGetVersionList(appId.value, params),
      apiParams: {
        page: 1,
        per_page: 20
      },
      columnsFactory: () => [
        { prop: 'id', label: 'ID', width: 100 },
        {
          prop: 'platform',
          label: '平台',
          width: 100,
          formatter: (row: VersionListItem) => h(ElTag, { size: 'small' }, () => row.platform.label)
        },
        { prop: 'version', label: '版本号', minWidth: 120 },
        { prop: 'build', label: '构建号', width: 100 },
        {
          prop: 'force_update',
          label: '强制更新',
          width: 100,
          formatter: (row: VersionListItem) =>
            h(ElTag, { type: row.force_update ? 'danger' : 'info', size: 'small' }, () =>
              row.force_update ? '是' : '否'
            )
        },
        {
          prop: 'file_size',
          label: '安装包大小',
          width: 120,
          formatter: (row: VersionListItem) =>
            row.file_size ? `${(row.file_size / 1024 / 1024).toFixed(2)} MB` : '-'
        },
        {
          prop: 'status',
          label: '状态',
          width: 100,
          formatter: (row: VersionListItem) =>
            h(
              ElTag,
              { type: statusTagType[row.status.value] || 'info', size: 'small' },
              () => row.status.label
            )
        },
        { prop: 'published_at', label: '发布时间', width: 180 },
        { prop: 'created_at', label: '创建时间', width: 180 },
        {
          prop: 'operation',
          label: '操作',
          width: 200,
          align: 'right',
          formatter: (row: VersionListItem) => {
            const buttons: any[] = []
            if (hasAuth('app-versions.edit')) {
              buttons.push(
                h(ArtButtonTable, {
                  type: 'edit',
                  title: '编辑',
                  onClick: () => handleEdit(row)
                })
              )
            }
            if (
              (row.status.value === 'draft' || row.status.value === 'withdrawn') &&
              hasAuth('app-versions.edit')
            ) {
              buttons.push(
                h(ArtButtonTable, {
                  icon: 'ri:upload-2-line',
                  iconColor: 'var(--el-color-success)',
                  buttonBgColor: 'rgba(103,194,58,0.12)',
                  title: '发布',
                  onClick: () => handlePublish(row)
                })
              )
            }
            if (row.status.value === 'published' && hasAuth('app-versions.edit')) {
              buttons.push(
                h(ArtButtonTable, {
                  icon: 'ri:arrow-go-back-line',
                  iconColor: 'var(--el-color-warning)',
                  buttonBgColor: 'rgba(230,162,60,0.12)',
                  title: '撤回',
                  onClick: () => handleWithdraw(row)
                })
              )
            }

            // 废弃与删除为次要/危险操作，当内联按钮已达 3 个时收入更多菜单
            const moreList: ButtonMoreItem[] = []
            if (row.status.value !== 'obsolete' && hasAuth('app-versions.edit')) {
              moreList.push({
                key: 'obsolete',
                label: '废弃',
                icon: 'ri:archive-line',
                color: '#e6a23c'
              })
            }
            if (row.status.value !== 'published' && hasAuth('app-versions.delete')) {
              moreList.push({
                key: 'delete',
                label: '删除',
                icon: 'ri:delete-bin-4-line',
                color: '#f56c6c'
              })
            }

            // 非已发布状态：编辑 + 发布(可选) + 废弃 = 3 个内联，删除入 More
            // 已发布状态：编辑 + 撤回 + 废弃 = 3 个内联，删除入 More
            // 已废弃状态：仅编辑 + 删除 2 个，全部内联
            if (row.status.value === 'obsolete' && hasAuth('app-versions.delete')) {
              buttons.push(
                h(ArtButtonTable, {
                  type: 'delete',
                  title: '删除',
                  onClick: () => handleDelete(row)
                })
              )
            } else {
              const obsolete = moreList.find((item) => item.key === 'obsolete')
              if (obsolete) {
                buttons.push(
                  h(ArtButtonTable, {
                    icon: obsolete.icon,
                    iconColor: 'var(--el-color-warning)',
                    buttonBgColor: 'rgba(230,162,60,0.12)',
                    title: '废弃',
                    onClick: () => handleObsolete(row)
                  })
                )
              }
              if (moreList.some((item) => item.key === 'delete')) {
                buttons.push(
                  h(ArtButtonMore, {
                    list: [
                      {
                        key: 'delete',
                        label: '删除',
                        icon: 'ri:delete-bin-4-line',
                        color: '#f56c6c'
                      }
                    ] as ButtonMoreItem[],
                    onClick: () => handleDelete(row)
                  })
                )
              }
            }

            return h('div', { class: 'flex items-center justify-end' }, buttons)
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
    Object.assign(searchParams, {
      platform: formFilters.platform || undefined,
      status: formFilters.status || undefined
    })
    getData()
  }

  const handleReset = (): void => {
    formFilters.platform = ''
    formFilters.status = ''
    resetSearchParams()
  }

  const handleBack = (): void => {
    mittBus.emit('refreshAppList')
    router.push('/system/app')
  }

  const handleAdd = (): void => {
    dialogRef.value?.open(null)
  }

  const handleEdit = (row: VersionListItem): void => {
    dialogRef.value?.open(row)
  }

  const handlePublish = async (row: VersionListItem): Promise<void> => {
    try {
      await ElMessageBox.confirm(
        `确定发布版本 ${row.version}（构建号 ${row.build}）吗？同平台旧版本将自动废弃。`,
        '发布确认',
        { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }
      )
      await fetchPublishVersion(appId.value, row.id)
      refreshData()
    } catch {
      // 用户取消
    }
  }

  const handleWithdraw = async (row: VersionListItem): Promise<void> => {
    try {
      await ElMessageBox.confirm(`确定撤回版本 ${row.version} 吗？`, '撤回确认', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })
      await fetchWithdrawVersion(appId.value, row.id)
      refreshData()
    } catch {
      // 用户取消
    }
  }

  const handleObsolete = async (row: VersionListItem): Promise<void> => {
    try {
      await ElMessageBox.confirm(`确定废弃版本 ${row.version} 吗？`, '废弃确认', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })
      await fetchObsoleteVersion(appId.value, row.id)
      refreshData()
    } catch {
      // 用户取消
    }
  }

  const handleDelete = async (row: VersionListItem): Promise<void> => {
    try {
      await ElMessageBox.confirm(`确定删除版本 ${row.version} 吗？`, '删除确认', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })
      await fetchDeleteVersion(appId.value, row.id)
      refreshData()
    } catch {
      // 用户取消
    }
  }

  onMounted(() => {
    getData()
  })
</script>
