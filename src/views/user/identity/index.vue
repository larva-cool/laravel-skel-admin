<template>
  <div class="art-full-height flex flex-col gap-3">
    <!-- 统计卡片 -->
    <IdentityStats ref="statsRef" />

    <!-- 搜索栏 -->
    <IdentitySearch
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
    <IdentityDetailDrawer
      ref="detailDrawerRef"
      :can-review="hasAuth('identity-verifications.edit')"
      @approve="onApprove"
      @reject="onReject"
      @refresh="handleRefresh"
    />

    <!-- 驳回弹窗 -->
    <IdentityRejectDialog ref="rejectDialogRef" @success="onReviewSuccess" />
  </div>
</template>

<script setup lang="ts">
  import { h, ref } from 'vue'
  import { ElTag, ElButton, ElMessageBox } from 'element-plus'
  import ArtSvgIcon from '@/components/core/base/art-svg-icon/index.vue'
  import { useTable } from '@/hooks/core/useTable'
  import { useAuth } from '@/hooks/core/useAuth'
  import {
    fetchGetIdentityVerificationList,
    fetchApproveIdentityVerification
  } from '@/api/system-manage'
  import IdentityStats from './modules/identity-stats.vue'
  import IdentitySearch from './modules/identity-search.vue'
  import IdentityDetailDrawer from './modules/identity-detail-drawer.vue'
  import IdentityRejectDialog from './modules/identity-reject-dialog.vue'

  defineOptions({ name: 'UserIdentity' })

  type IdentityItem = Api.SystemManage.IdentityVerificationListItem

  const { hasAuth } = useAuth()

  const showSearchBar = ref(true)
  const statsRef = ref<InstanceType<typeof IdentityStats>>()
  const detailDrawerRef = ref<InstanceType<typeof IdentityDetailDrawer>>()
  const rejectDialogRef = ref<InstanceType<typeof IdentityRejectDialog>>()

  const mapTagType = (t?: string) => {
    if (!t || t === 'default') return undefined
    return t as 'primary' | 'success' | 'warning' | 'danger' | 'info'
  }

  const isActable = (s?: string) => s === 'pending' || s === 'review'

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
      apiFn: fetchGetIdentityVerificationList,
      apiParams: { page: 1, per_page: 20 },
      columnsFactory: () => [
        { prop: 'id', label: 'ID', width: 80, fixed: 'left' },
        {
          prop: 'user',
          label: '申请人',
          width: 180,
          showOverflowTooltip: true,
          formatter: (row: IdentityItem) => {
            if (!row.user) return '-'
            return h('div', { class: 'flex flex-col' }, [
              h('span', { class: 'text-sm' }, row.user.username || `ID:${row.user_id}`),
              h('span', { class: 'text-xs text-g-500' }, row.user.phone || row.user.name || '')
            ])
          }
        },
        {
          prop: 'type_label',
          label: '认证类型',
          width: 100,
          formatter: (row: IdentityItem) =>
            h(
              ElTag,
              {
                type: row.type === 'personal' ? 'primary' : 'success',
                size: 'small',
                effect: 'plain'
              },
              () => row.type_label || '-'
            )
        },
        {
          prop: 'subject',
          label: '认证主体',
          minWidth: 200,
          showOverflowTooltip: true,
          formatter: (row: IdentityItem) => {
            if (row.type === 'personal') {
              return row.real_name || '-'
            }
            return h('div', { class: 'flex flex-col' }, [
              h('span', { class: 'text-sm' }, row.company_name || '-'),
              h('span', { class: 'text-xs text-g-500' }, row.legal_person_name || '')
            ])
          }
        },
        {
          prop: 'status_label',
          label: '审核状态',
          width: 110,
          formatter: (row: IdentityItem) =>
            h(
              ElTag,
              { type: mapTagType(row.status_label_type), size: 'small' },
              () => row.status_label || '-'
            )
        },
        {
          prop: 'admin_name',
          label: '审核人',
          width: 120,
          formatter: (row: IdentityItem) => row.admin_name || '—'
        },
        { prop: 'submitted_at', label: '提交时间', width: 180 },
        { prop: 'reviewed_at', label: '审核时间', width: 180 },
        {
          prop: 'actions',
          label: '操作',
          width: 160,
          fixed: 'right',
          formatter: (row: IdentityItem) =>
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
              hasAuth('identity-verifications.edit') && isActable(row.status)
                ? h(
                    ElButton,
                    {
                      type: 'success',
                      link: true,
                      size: 'small',
                      onClick: () => onApprove(row)
                    },
                    () => [h(ArtSvgIcon, { icon: 'ri:check-line', class: 'mr-0.5' }), '通过']
                  )
                : null,
              hasAuth('identity-verifications.edit') && isActable(row.status)
                ? h(
                    ElButton,
                    {
                      type: 'danger',
                      link: true,
                      size: 'small',
                      onClick: () => onReject(row)
                    },
                    () => [h(ArtSvgIcon, { icon: 'ri:close-line', class: 'mr-0.5' }), '驳回']
                  )
                : null
            ])
        }
      ]
    }
  })

  const viewDetail = (row: IdentityItem) => {
    detailDrawerRef.value?.open(row)
  }

  const onApprove = (row: IdentityItem) => {
    ElMessageBox.confirm(
      `确认通过「${row.type === 'personal' ? row.real_name : row.company_name}」的实名认证申请？通过后将立即生效。`,
      '审核通过',
      {
        type: 'success',
        confirmButtonText: '确认通过',
        cancelButtonText: '取消'
      }
    )
      .then(async () => {
        await fetchApproveIdentityVerification(row.id)
        // 触发列表/统计刷新
        refreshData()
        statsRef.value?.refresh()
      })
      .catch(() => {})
  }

  const onReject = (row: IdentityItem) => {
    rejectDialogRef.value?.open(row)
  }

  const onReviewSuccess = () => {
    refreshData()
    statsRef.value?.refresh()
  }

  const handleSearch = (params: Partial<Api.SystemManage.IdentityVerificationSearchParams>) => {
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
