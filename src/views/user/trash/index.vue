<template>
  <div class="art-full-height">
    <div class="trash-toolbar">
      <ElRadioGroup v-model="entityType" @change="handleEntityChange">
        <ElRadioButton value="user">用户</ElRadioButton>
        <ElRadioButton value="open-account">合作方</ElRadioButton>
      </ElRadioGroup>
    </div>

    <component
      :is="currentSearchComponent"
      v-if="currentSearchComponent"
      :key="entityType"
      v-show="showSearchBar"
      @search="handleSearch"
      @reset-search-params="handleResetSearch"
    />

    <ElCard class="art-table-card" :style="{ 'margin-top': showSearchBar ? '12px' : '0' }">
      <ArtTableHeader
        v-model:columns="columnChecks"
        v-model:showSearchBar="showSearchBar"
        :loading="loading"
        @refresh="refreshData"
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
  </div>
</template>

<script setup lang="ts">
  import {
    fetchForceDeleteOpenAccount,
    fetchGetTrashOpenAccountList,
    fetchRestoreOpenAccount
  } from '@/api/open-account'
  import { fetchForceDeleteUser, fetchGetTrashUserList, fetchRestoreUser } from '@/api/user-manage'
  import ArtButtonTable from '@/components/core/forms/art-button-table/index.vue'
  import { useAuth } from '@/hooks/core/useAuth'
  import { ElAvatar, ElMessageBox, ElTag } from 'element-plus'
  import { computed, h, onMounted, ref, watch } from 'vue'
  import OpenAccountSearch from '@/views/user/open-account/modules/open-account-search.vue'
  import UserSearch from '@/views/user/list/modules/user-search.vue'

  defineOptions({ name: 'UserTrash' })

  type EntityType = 'user' | 'open-account'
  type ColumnOption = {
    prop: string
    label: string
    width?: number
    minWidth?: number
    align?: string
    fixed?: boolean | 'left' | 'right'
    showOverflowTooltip?: boolean
    formatter?: (row: TrashItem) => any
    [key: string]: any
  }
  type TrashItem = {
    id: number
    name?: string | null
    phone?: string | null
    username?: string | null
    email?: string | null
    avatar?: string | null
    balance?: number
    status?: { value: number; label: string }
    created_at?: string | null
    deleted_at?: string | null
    [key: string]: unknown
  }

  const { hasAuth } = useAuth()

  const showSearchBar = ref(true)
  const entityType = ref<EntityType>('user')
  const loading = ref(false)
  const data = ref<TrashItem[]>([])
  const pagination = reactive<Api.Common.PaginationParams>({
    current: 1,
    size: 20,
    total: 0
  })
  const searchParams = reactive<Record<string, any>>({})

  const searchComponents: Record<EntityType, any> = {
    user: UserSearch,
    'open-account': OpenAccountSearch
  }

  const currentSearchComponent = computed(() => searchComponents[entityType.value])

  const fetchMap = {
    user: fetchGetTrashUserList,
    'open-account': fetchGetTrashOpenAccountList
  } as const

  const restoreMap = {
    user: fetchRestoreUser,
    'open-account': fetchRestoreOpenAccount
  } as const

  const forceDeleteMap = {
    user: fetchForceDeleteUser,
    'open-account': fetchForceDeleteOpenAccount
  } as const

  const describeEntity = (type: EntityType) => (type === 'user' ? '用户' : '合作方')

  const restoreAuthMap: Record<EntityType, string> = {
    user: 'users.edit',
    'open-account': 'open_accounts.edit'
  }

  const deleteAuthMap: Record<EntityType, string> = {
    user: 'users.delete',
    'open-account': 'open_accounts.delete'
  }

  const userColumns: ColumnOption[] = [
    { prop: 'id', label: 'ID', width: 120 },
    {
      prop: 'avatar',
      label: '头像',
      width: 70,
      align: 'center',
      formatter: (row: TrashItem) =>
        h(
          ElAvatar,
          { size: 32, shape: 'circle', src: (row.avatar as string | null) || '' },
          {
            default: () => (row.username as string | null)?.[0]?.toUpperCase() || '?'
          }
        )
    },
    { prop: 'username', label: '用户名', minWidth: 120 },
    { prop: 'name', label: '昵称', minWidth: 110 },
    { prop: 'email', label: '邮箱', minWidth: 170, showOverflowTooltip: true },
    { prop: 'phone', label: '手机号', width: 130 },
    {
      prop: 'status',
      label: '状态',
      width: 80,
      formatter: (row: TrashItem) =>
        h(
          ElTag,
          { type: (row.status as any)?.value === 1 ? 'success' : 'danger' },
          () => (row.status as any)?.label
        )
    },
    { prop: 'created_at', label: '注册时间', width: 170 },
    { prop: 'deleted_at', label: '删除时间', width: 170 }
  ]

  const openAccountColumns: ColumnOption[] = [
    { prop: 'id', label: 'ID', width: 120 },
    { prop: 'name', label: '合作方名称', minWidth: 140 },
    { prop: 'username', label: '用户名', minWidth: 120 },
    { prop: 'email', label: '邮箱', minWidth: 170, showOverflowTooltip: true },
    { prop: 'phone', label: '手机号', width: 140 },
    {
      prop: 'balance',
      label: '余额(元)',
      width: 120,
      formatter: (row: TrashItem) => `¥${Number(row.balance ?? 0).toFixed(2)}`
    },
    {
      prop: 'status',
      label: '状态',
      width: 80,
      formatter: (row: TrashItem) =>
        h(
          ElTag,
          { type: (row.status as any)?.value === 1 ? 'success' : 'danger' },
          () => (row.status as any)?.label
        )
    },
    { prop: 'created_at', label: '创建时间', width: 170 },
    { prop: 'deleted_at', label: '删除时间', width: 170 }
  ]

  const columnsMap: Record<EntityType, ColumnOption[]> = {
    user: userColumns,
    'open-account': openAccountColumns
  }

  const operationColumn = (type: EntityType): ColumnOption => ({
    prop: 'operation',
    label: '操作',
    width: 180,
    fixed: 'right',
    formatter: (row: TrashItem) =>
      h('div', { class: 'flex items-center' }, [
        hasAuth(restoreAuthMap[type])
          ? h(ArtButtonTable, {
              icon: 'ri:arrow-go-back-line',
              iconClass: 'bg-success/12 text-success',
              title: '恢复',
              onClick: () => handleAction(type, 'restore', row)
            })
          : null,
        hasAuth(deleteAuthMap[type])
          ? h(ArtButtonTable, {
              icon: 'ri:delete-bin-2-line',
              iconClass: 'bg-error/12 text-error',
              title: '彻底删除',
              onClick: () => handleAction(type, 'force-delete', row)
            })
          : null
      ])
  })

  const columns = ref<ColumnOption[]>([])
  const columnChecks = ref<{ prop: string; label: string; visible?: boolean }[]>([])

  const buildColumns = (type: EntityType) => {
    const baseCols = columnsMap[type].map((c) => ({ ...c }))
    baseCols.push(operationColumn(type))
    return baseCols
  }

  const rebuildColumns = (type: EntityType) => {
    const list = buildColumns(type)
    columns.value = list
    columnChecks.value = list.map((c) => ({ prop: c.prop, label: c.label, visible: true }))
  }

  const fetchList = async () => {
    loading.value = true
    try {
      const fn = fetchMap[entityType.value] as any
      const params: Record<string, any> = {
        page: pagination.current,
        per_page: pagination.size,
        ...searchParams
      }
      const res = await fn(params)
      data.value = (res?.data as TrashItem[]) || []
      pagination.total = res?.meta?.total || 0
    } catch {
      data.value = []
      pagination.total = 0
    } finally {
      loading.value = false
    }
  }

  const handleEntityChange = (value: EntityType | string | number | boolean | undefined) => {
    const next = (value as EntityType) ?? 'user'
    entityType.value = next
    pagination.current = 1
    Object.keys(searchParams).forEach((k) => delete searchParams[k])
    rebuildColumns(next)
    fetchList()
  }

  const handleSearch = (params: Record<string, unknown>) => {
    Object.keys(searchParams).forEach((k) => delete searchParams[k])
    Object.assign(searchParams, params)
    pagination.current = 1
    fetchList()
  }

  const handleResetSearch = () => {
    Object.keys(searchParams).forEach((k) => delete searchParams[k])
    pagination.current = 1
    fetchList()
  }

  const handleSizeChange = (size: number) => {
    pagination.size = size
    pagination.current = 1
    fetchList()
  }

  const handleCurrentChange = (current: number) => {
    pagination.current = current
    fetchList()
  }

  const refreshData = () => {
    fetchList()
  }

  const handleAction = (type: EntityType, key: 'restore' | 'force-delete', row: TrashItem) => {
    const id = Number(row.id)
    const label = describeEntity(type)
    const display = row.name || row.username || row.phone || `ID:${id}`
    const confirm = () =>
      ElMessageBox.confirm(
        key === 'restore'
          ? `确定恢复${label}"${display}"吗？恢复后状态将正常。`
          : `确定彻底删除${label}"${display}"吗？此操作不可恢复，所有相关数据将被永久删除。`,
        key === 'restore' ? '恢复确认' : '彻底删除确认',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: key === 'restore' ? 'warning' : 'error',
          ...(key === 'force-delete' ? { confirmButtonClass: 'el-button--danger' } : {})
        }
      )

    confirm()
      .then(async () => {
        if (key === 'restore') {
          await (restoreMap[type] as any)(id)
        } else {
          await (forceDeleteMap[type] as any)(id)
        }
        pagination.current = 1
        fetchList()
      })
      .catch(() => {})
  }

  watch(entityType, (next) => {
    rebuildColumns(next)
  })

  onMounted(() => {
    rebuildColumns(entityType.value)
    fetchList()
  })
</script>

<style scoped lang="scss">
  .trash-toolbar {
    display: flex;
    align-items: center;
    margin-bottom: 12px;
  }
</style>
