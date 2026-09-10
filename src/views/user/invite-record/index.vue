<template>
  <div class="art-full-height">
    <InviteRecordSearch
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

    <InviteRecordDetailDialog ref="detailDialogRef" />
  </div>
</template>

<script setup lang="ts">
  import { fetchGetInviteRecordList } from '@/api/user-manage'
  import ArtButtonTable from '@/components/core/forms/art-button-table/index.vue'
  import { useAuth } from '@/hooks/core/useAuth'
  import { useTable } from '@/hooks/core/useTable'
  import { ElTag } from 'element-plus'
  import { h, ref } from 'vue'
  import InviteRecordDetailDialog from './modules/invite-record-detail-dialog.vue'
  import InviteRecordSearch from './modules/invite-record-search.vue'

  defineOptions({ name: 'UserInviteRecord' })

  type InviteRecordItem = Api.UserManage.InviteRecordItem

  const { hasAuth } = useAuth()

  const showSearchBar = ref(true)
  const detailDialogRef = ref<InstanceType<typeof InviteRecordDetailDialog>>()

  /** 渲染多态主体类型标签 */
  const renderMorphTag = (type: 'user' | 'admin') =>
    h(ElTag, { type: type === 'admin' ? 'warning' : 'info', size: 'small', effect: 'light' }, () =>
      type === 'admin' ? '管理员' : '前台用户'
    )

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
      apiFn: fetchGetInviteRecordList,
      apiParams: {
        page: 1,
        per_page: 20
      },
      columnsFactory: () => [
        { prop: 'id', label: 'ID', width: 100 },
        {
          prop: 'inviter_type',
          label: '邀请人类型',
          width: 120,
          formatter: (row: InviteRecordItem) => renderMorphTag(row.inviter_type)
        },
        {
          prop: 'inviter_name',
          label: '邀请人',
          minWidth: 160,
          showOverflowTooltip: true,
          formatter: (row: InviteRecordItem) => row.inviter_name || `#${row.inviter_id}`
        },
        {
          prop: 'invitee_type',
          label: '被邀请人类型',
          width: 130,
          formatter: (row: InviteRecordItem) => renderMorphTag(row.invitee_type)
        },
        {
          prop: 'invitee_name',
          label: '被邀请人',
          minWidth: 160,
          showOverflowTooltip: true,
          formatter: (row: InviteRecordItem) => row.invitee_name || `#${row.invitee_id}`
        },
        {
          prop: 'description',
          label: '描述',
          minWidth: 180,
          showOverflowTooltip: true,
          formatter: (row: InviteRecordItem) => row.description || '—'
        },
        {
          prop: 'created_at',
          label: '邀请时间',
          width: 180,
          formatter: (row: InviteRecordItem) => row.created_at || '—'
        },
        {
          prop: 'operation',
          label: '操作',
          width: 80,
          fixed: 'right',
          formatter: (row: InviteRecordItem) =>
            h(
              'div',
              { class: 'flex items-center' },
              hasAuth('invite-records.show')
                ? [
                    h(ArtButtonTable, {
                      type: 'view',
                      onClick: () => handleView(row)
                    })
                  ]
                : []
            )
        }
      ]
    }
  })

  const handleView = (row: InviteRecordItem) => {
    detailDialogRef.value?.open(row)
  }

  const handleSearch = (params: Partial<Api.UserManage.InviteRecordSearchParams>) => {
    const paramsRecord = searchParams as Record<string, unknown>
    Object.keys(paramsRecord).forEach((key) => {
      if (key !== 'page' && key !== 'per_page') {
        delete paramsRecord[key]
      }
    })
    Object.assign(searchParams, params)
    getData()
  }
</script>
