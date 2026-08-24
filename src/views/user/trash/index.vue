<template>
  <div class="art-full-height">
    <UserSearch
      v-show="showSearchBar"
      @search="handleSearch"
      @reset-search-params="resetSearchParams"
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
  import { fetchForceDeleteUser, fetchGetTrashUserList, fetchRestoreUser } from '@/api/user-manage'
  import ArtButtonMore, { ButtonMoreItem } from '@/components/core/forms/art-button-more/index.vue'
  import { useTable } from '@/hooks/core/useTable'
  import { ElAvatar, ElMessageBox, ElTag } from 'element-plus'
  import { h } from 'vue'
  import UserSearch from '@/views/user/list/modules/user-search.vue'

  defineOptions({ name: 'UserTrash' })

  type UserListItem = Api.UserManage.UserListItem

  const showSearchBar = ref(true)

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
    refreshData,
    refreshCreate
  } = useTable({
    core: {
      apiFn: fetchGetTrashUserList,
      apiParams: {
        page: 1,
        per_page: 20
      },
      columnsFactory: () => [
        { prop: 'id', label: 'ID', width: 120 },
        {
          prop: 'avatar',
          label: '头像',
          width: 70,
          align: 'center',
          formatter: (row: UserListItem) =>
            h(
              ElAvatar,
              { size: 32, shape: 'circle', src: row.avatar || '' },
              { default: () => row.username?.[0]?.toUpperCase() || '?' }
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
          formatter: (row: UserListItem) =>
            h(
              ElTag,
              { type: row.status.value === 1 ? 'success' : 'danger' },
              () => row.status.label
            )
        },
        { prop: 'created_at', label: '注册时间', width: 170 },
        { prop: 'deleted_at', label: '删除时间', width: 170 },
        {
          prop: 'operation',
          label: '操作',
          width: 160,
          fixed: 'right',
          formatter: (row: UserListItem) =>
            h('div', [
              h(ArtButtonMore, {
                list: [
                  {
                    key: 'restore',
                    label: '恢复',
                    icon: 'ri:arrow-go-back-line',
                    auth: 'users.edit'
                  },
                  {
                    key: 'force-delete',
                    label: '彻底删除',
                    icon: 'ri:delete-bin-2-line',
                    color: '#f56c6c',
                    auth: 'users.delete'
                  }
                ] as ButtonMoreItem[],
                onClick: (item: ButtonMoreItem) => handleAction(item, row)
              })
            ])
        }
      ]
    }
  })

  const handleAction = (item: ButtonMoreItem, row: UserListItem) => {
    switch (item.key) {
      case 'restore':
        handleRestore(row)
        break
      case 'force-delete':
        handleForceDelete(row)
        break
    }
  }

  const handleSearch = (params: Partial<Api.UserManage.UserSearchParams>) => {
    const paramsRecord = searchParams as Record<string, unknown>
    Object.keys(paramsRecord).forEach((key) => {
      if (key !== 'page' && key !== 'per_page') {
        delete paramsRecord[key]
      }
    })
    Object.assign(searchParams, params)
    getData()
  }

  const handleRestore = (row: UserListItem) => {
    ElMessageBox.confirm(`确定恢复用户"${row.username}"吗？恢复后用户状态将正常。`, '恢复确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
      .then(async () => {
        await fetchRestoreUser(row.id)
        refreshCreate()
      })
      .catch(() => {})
  }

  const handleForceDelete = (row: UserListItem) => {
    ElMessageBox.confirm(
      `确定彻底删除用户"${row.username}"吗？此操作不可恢复，所有相关数据将被永久删除。`,
      '彻底删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'error',
        confirmButtonClass: 'el-button--danger'
      }
    )
      .then(async () => {
        await fetchForceDeleteUser(row.id)
        refreshCreate()
      })
      .catch(() => {})
  }
</script>
