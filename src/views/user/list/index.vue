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
      >
        <template #left>
          <ElSpace wrap>
            <ElTooltip content="用户由前台注册，后台不支持新增">
              <ElButton type="primary" disabled v-ripple>新增用户</ElButton>
            </ElTooltip>
            <ElButton v-auth="'users.export'" :loading="isExporting" @click="handleExport">
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

    <UserDetailDialog ref="detailDialogRef" />
    <UserEditDialog ref="editDialogRef" @refresh="refreshData" />
    <UserResetPasswordDialog ref="resetPwdDialogRef" @refresh="refreshData" />
    <UserResetContactDialog ref="resetContactDialogRef" @refresh="refreshData" />
    <UserAdjustPointsDialog ref="adjustPointsDialogRef" @refresh="refreshData" />
    <UserAdjustCoinsDialog ref="adjustCoinsDialogRef" @refresh="refreshData" />
    <UserExtendVipDialog ref="extendVipDialogRef" @refresh="refreshData" />
  </div>
</template>

<script setup lang="ts">
  import {
    fetchDeleteUser,
    fetchExportUsers,
    fetchGetUserList,
    fetchToggleUserStatus
  } from '@/api/user-manage'
  import ArtButtonMore, { ButtonMoreItem } from '@/components/core/forms/art-button-more/index.vue'
  import ArtButtonTable from '@/components/core/forms/art-button-table/index.vue'
  import { useAuth } from '@/hooks/core/useAuth'
  import { useExport } from '@/hooks/core/useExport'
  import { useTable } from '@/hooks/core/useTable'
  import { ElAvatar, ElMessageBox, ElTag } from 'element-plus'
  import { Download } from '@element-plus/icons-vue'
  import { h } from 'vue'
  import UserAdjustCoinsDialog from './modules/user-adjust-coins-dialog.vue'
  import UserAdjustPointsDialog from './modules/user-adjust-points-dialog.vue'
  import UserDetailDialog from './modules/user-detail-dialog.vue'
  import UserEditDialog from './modules/user-dialog.vue'
  import UserExtendVipDialog from './modules/user-extend-vip-dialog.vue'
  import UserResetContactDialog from './modules/user-reset-contact-dialog.vue'
  import UserResetPasswordDialog from './modules/user-reset-password-dialog.vue'
  import UserSearch from './modules/user-search.vue'

  defineOptions({ name: 'UserList' })

  type UserListItem = Api.UserManage.UserListItem

  const { hasAuth } = useAuth()

  // 实名认证状态映射到 Element Plus Tag 类型
  function mapIdentityTagType(
    status: string
  ): 'success' | 'warning' | 'danger' | 'info' | 'primary' {
    switch (status) {
      case 'approved':
        return 'success'
      case 'pending':
        return 'warning'
      case 'rejected':
        return 'danger'
      case 'unsubmitted':
      default:
        return 'info'
    }
  }

  const showSearchBar = ref(true)
  const detailDialogRef = ref<InstanceType<typeof UserDetailDialog>>()
  const editDialogRef = ref<InstanceType<typeof UserEditDialog>>()
  const resetPwdDialogRef = ref<InstanceType<typeof UserResetPasswordDialog>>()
  const resetContactDialogRef = ref<InstanceType<typeof UserResetContactDialog>>()
  const adjustPointsDialogRef = ref<InstanceType<typeof UserAdjustPointsDialog>>()
  const adjustCoinsDialogRef = ref<InstanceType<typeof UserAdjustCoinsDialog>>()
  const extendVipDialogRef = ref<InstanceType<typeof UserExtendVipDialog>>()

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
      apiFn: fetchGetUserList,
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
        {
          prop: 'vip',
          label: 'VIP',
          width: 100,
          formatter: (row: UserListItem) =>
            row.is_vip
              ? h(ElTag, { type: 'warning', size: 'small' }, () => 'VIP')
              : h(ElTag, { type: 'info', size: 'small' }, () => '普通')
        },
        { prop: 'email', label: '邮箱', minWidth: 170, showOverflowTooltip: true },
        { prop: 'phone', label: '手机号', width: 130 },
        {
          prop: 'points_coins',
          label: '积分/金币',
          width: 120,
          formatter: (row: UserListItem) => `${row.available_points} / ${row.available_coins}`
        },
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
        {
          prop: 'identity_status',
          label: '实名状态',
          width: 100,
          formatter: (row: UserListItem) =>
            h(
              ElTag,
              { type: mapIdentityTagType(row.identity_status.value) },
              () => row.identity_status.label
            )
        },
        { prop: 'login_count', label: '登录次数', width: 90 },
        { prop: 'last_login_at', label: '最后登录', width: 170 },
        { prop: 'created_at', label: '注册时间', width: 170 },
        {
          prop: 'operation',
          label: '操作',
          width: 200,
          fixed: 'right',
          formatter: (row: UserListItem) =>
            h('div', { class: 'flex items-center' }, [
              h(ArtButtonTable, {
                type: 'view',
                title: '查看',
                onClick: () => handleAction({ key: 'view' } as ButtonMoreItem, row)
              }),
              hasAuth('users.edit')
                ? h(ArtButtonTable, {
                    type: 'edit',
                    title: '编辑',
                    onClick: () => handleAction({ key: 'edit' } as ButtonMoreItem, row)
                  })
                : null,
              hasAuth('users.edit')
                ? h(ArtButtonTable, {
                    icon: row.status.value === 1 ? 'ri:forbid-line' : 'ri:checkbox-circle-line',
                    iconColor: 'var(--el-color-warning)',
                    buttonBgColor: 'rgba(230,162,60,0.12)',
                    title: row.status.value === 1 ? '冻结' : '启用',
                    onClick: () => handleAction({ key: 'toggle' } as ButtonMoreItem, row)
                  })
                : null,
              h(ArtButtonMore, {
                list: [
                  {
                    key: 'reset-pwd',
                    label: '重置密码',
                    icon: 'ri:lock-password-line',
                    auth: 'users.edit'
                  },
                  {
                    key: 'reset-email',
                    label: '重置邮箱',
                    icon: 'ri:mail-line',
                    auth: 'users.edit'
                  },
                  {
                    key: 'reset-phone',
                    label: '重置手机',
                    icon: 'ri:smartphone-line',
                    auth: 'users.edit'
                  },
                  {
                    key: 'adjust-points',
                    label: '调整积分',
                    icon: 'ri:copper-coin-line',
                    auth: 'users.edit'
                  },
                  {
                    key: 'adjust-coins',
                    label: '调整金币',
                    icon: 'ri:coins-line',
                    auth: 'users.edit'
                  },
                  {
                    key: 'extend-vip',
                    label: '延长VIP',
                    icon: 'ri:vip-crown-line',
                    auth: 'users.edit'
                  },
                  {
                    key: 'delete',
                    label: '删除',
                    icon: 'ri:delete-bin-4-line',
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

  // 导出
  const { isExporting, handleExport: doExport } = useExport()
  const handleExport = () => {
    // 仅传递筛选条件（剔除分页参数，后端会自动判断同步/异步）
    const filters = { ...(searchParams as Record<string, unknown>) }
    delete filters.page
    delete filters.per_page
    doExport(() => fetchExportUsers(filters as unknown as Api.UserManage.UserSearchParams), 'users')
  }

  const handleAction = (item: ButtonMoreItem, row: UserListItem) => {
    switch (item.key) {
      case 'view':
        detailDialogRef.value?.open(row)
        break
      case 'edit':
        editDialogRef.value?.open(row)
        break
      case 'toggle':
        handleToggleStatus(row)
        break
      case 'reset-pwd':
        resetPwdDialogRef.value?.open(row)
        break
      case 'reset-email':
        resetContactDialogRef.value?.open(row, 'email')
        break
      case 'reset-phone':
        resetContactDialogRef.value?.open(row, 'phone')
        break
      case 'adjust-points':
        adjustPointsDialogRef.value?.open(row)
        break
      case 'adjust-coins':
        adjustCoinsDialogRef.value?.open(row)
        break
      case 'extend-vip':
        extendVipDialogRef.value?.open(row)
        break
      case 'delete':
        handleDelete(row)
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

  const handleToggleStatus = async (row: UserListItem) => {
    await fetchToggleUserStatus(row.id)
    refreshData()
  }

  const handleDelete = (row: UserListItem) => {
    ElMessageBox.confirm(`确定删除用户"${row.username}"吗？删除后可通过软删除恢复。`, '删除确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
      .then(async () => {
        await fetchDeleteUser(row.id)
        refreshCreate()
      })
      .catch(() => {})
  }
</script>
