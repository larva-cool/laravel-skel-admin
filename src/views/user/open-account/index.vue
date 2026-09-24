<template>
  <div class="art-full-height">
    <OpenAccountSearch
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
            <ElButton v-auth="'open_accounts.create'" type="primary" @click="handleCreate">
              <ElIcon class="mr-1"><Plus /></ElIcon>
              新增账户
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

    <OpenAccountDialog ref="dialogRef" @refresh="refreshData" />
  </div>
</template>

<script setup lang="ts">
  import {
    fetchDeleteOpenAccount,
    fetchGetOpenAccountList,
    fetchRotateOpenAccountToken,
    fetchToggleOpenAccountStatus
  } from '@/api/open-account'
  import ArtButtonMore, { ButtonMoreItem } from '@/components/core/forms/art-button-more/index.vue'
  import ArtButtonTable from '@/components/core/forms/art-button-table/index.vue'
  import { useAuth } from '@/hooks/core/useAuth'
  import { useTable } from '@/hooks/core/useTable'
  import { ElMessageBox, ElTag } from 'element-plus'
  import { Plus } from '@element-plus/icons-vue'
  import { h } from 'vue'
  import OpenAccountDialog from './modules/open-account-dialog.vue'
  import OpenAccountSearch from './modules/open-account-search.vue'

  defineOptions({ name: 'OpenAccount' })

  type OpenAccountItem = Api.OpenAccount.OpenAccountItem

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
  const dialogRef = ref<InstanceType<typeof OpenAccountDialog>>()

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
      apiFn: fetchGetOpenAccountList,
      apiParams: {
        page: 1,
        per_page: 20
      },
      columnsFactory: () => [
        { prop: 'id', label: 'ID', width: 120 },
        { prop: 'name', label: '合作方名称', minWidth: 140 },
        { prop: 'username', label: '用户名', minWidth: 120 },
        { prop: 'email', label: '邮箱', minWidth: 170, showOverflowTooltip: true },
        { prop: 'phone', label: '手机号', width: 140 },
        {
          prop: 'contact',
          label: '联系人',
          minWidth: 140,
          formatter: (row: OpenAccountItem) =>
            row.contact_name
              ? `${row.contact_name}${row.contact_phone ? ` / ${row.contact_phone}` : ''}`
              : '-'
        },
        {
          prop: 'rate_limit',
          label: '请求上限',
          width: 110,
          formatter: (row: OpenAccountItem) =>
            row.rate_limit === 0 ? '默认' : `${row.rate_limit}/分`
        },
        {
          prop: 'balance',
          label: '余额(元)',
          width: 120,
          formatter: (row: OpenAccountItem) => `¥${Number(row.balance).toFixed(2)}`
        },
        {
          prop: 'status',
          label: '状态',
          width: 80,
          formatter: (row: OpenAccountItem) =>
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
          formatter: (row: OpenAccountItem) =>
            h(
              ElTag,
              { type: mapIdentityTagType(row.identity_status.value) },
              () => row.identity_status.label
            )
        },
        { prop: 'last_request_at', label: '最近调用', width: 170 },
        { prop: 'created_at', label: '创建时间', width: 170 },
        {
          prop: 'operation',
          label: '操作',
          width: 220,
          fixed: 'right',
          formatter: (row: OpenAccountItem) =>
            h('div', { class: 'flex items-center' }, [
              hasAuth('open_accounts.edit')
                ? h(ArtButtonTable, {
                    type: 'edit',
                    title: '编辑',
                    onClick: () => handleAction({ key: 'edit' } as ButtonMoreItem, row)
                  })
                : null,
              hasAuth('open_accounts.edit')
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
                    key: 'rotate-token',
                    label: '轮换令牌',
                    icon: 'ri:key-2-line',
                    auth: 'open_accounts.edit'
                  },
                  {
                    key: 'delete',
                    label: '删除',
                    icon: 'ri:delete-bin-4-line',
                    color: '#f56c6c',
                    auth: 'open_accounts.delete'
                  }
                ] as ButtonMoreItem[],
                onClick: (item: ButtonMoreItem) => handleAction(item, row)
              })
            ])
        }
      ]
    }
  })

  const handleCreate = () => {
    dialogRef.value?.open()
  }

  const handleAction = (item: ButtonMoreItem, row: OpenAccountItem) => {
    switch (item.key) {
      case 'edit':
        dialogRef.value?.open(row)
        break
      case 'toggle':
        handleToggleStatus(row)
        break
      case 'rotate-token':
        handleRotateToken(row)
        break
      case 'delete':
        handleDelete(row)
        break
    }
  }

  const handleSearch = (params: Partial<Api.OpenAccount.OpenAccountSearchParams>) => {
    const paramsRecord = searchParams as Record<string, unknown>
    Object.keys(paramsRecord).forEach((key) => {
      if (key !== 'page' && key !== 'per_page') {
        delete paramsRecord[key]
      }
    })
    Object.assign(searchParams, params)
    getData()
  }

  const handleToggleStatus = async (row: OpenAccountItem) => {
    await fetchToggleOpenAccountStatus(row.id)
    refreshData()
  }

  const handleRotateToken = async (row: OpenAccountItem) => {
    try {
      await ElMessageBox.confirm(
        `确定轮换账户"${row.name || row.username}"的访问令牌吗？轮换后旧令牌将立即失效，新令牌仅显示一次，请妥善保管。`,
        '轮换令牌确认',
        {
          confirmButtonText: '确认轮换',
          cancelButtonText: '取消',
          type: 'warning'
        }
      )
    } catch {
      return
    }

    const res = await fetchRotateOpenAccountToken(row.id)
    // 明文令牌仅返回一次，用 alert 形式展示并支持复制
    ElMessageBox.alert(
      `新访问令牌如下，请立即复制保存：<br/><br/><code style="word-break:break-all;font-size:12px;background:#f5f7fa;padding:8px 12px;border-radius:4px;display:block;">${res.token}</code>`,
      '令牌已轮换',
      {
        confirmButtonText: '我已保存',
        dangerouslyUseHTMLString: true,
        type: 'success'
      }
    ).catch(() => {})
  }

  const handleDelete = (row: OpenAccountItem) => {
    ElMessageBox.confirm(
      `确定删除合作方账户"${row.name || row.username}"吗？删除后将吊销所有令牌，且无法恢复。`,
      '删除确认',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
      .then(async () => {
        await fetchDeleteOpenAccount(row.id)
        refreshCreate()
      })
      .catch(() => {})
  }
</script>
