<template>
  <div class="art-full-height flex flex-col gap-3">
    <!-- 搜索栏 -->
    <ArtSearchBar
      v-show="showSearchBar"
      v-model="formData"
      :items="formItems"
      @reset="handleReset"
      @search="handleSearch"
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
            <ElTag
              v-if="selectedSegment"
              type="primary"
              size="default"
              effect="plain"
              class="select-none"
            >
              当前分群：{{ selectedSegment.name }}
            </ElTag>
            <ElTag v-else type="info" size="default" effect="plain" class="select-none">
              请先选择分群
            </ElTag>
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
  </div>
</template>

<script setup lang="ts">
  import { h, ref, computed, onMounted } from 'vue'
  import { ElMessage, ElMessageBox, ElTag } from 'element-plus'
  import ArtButtonTable from '@/components/core/forms/art-button-table/index.vue'
  import { useTable } from '@/hooks/core/useTable'
  import { useAuth } from '@/hooks/core/useAuth'
  import {
    fetchGetSegmentOptions,
    fetchDetachSegmentUsers,
    fetchGetSegmentUsers
  } from '@/api/segment-manage'

  defineOptions({ name: 'SegmentMember' })

  type Item = Api.UserManage.UserListItem

  const { hasAuth } = useAuth()

  const showSearchBar = ref(true)
  const formData = ref<Record<string, any>>({})

  // 分群选项
  const segmentOptions = ref<Api.SegmentManage.SegmentOption[]>([])
  const selectedSegmentId = ref<number | undefined>(undefined)
  const selectedSegment = computed(() =>
    segmentOptions.value.find((s) => s.id === selectedSegmentId.value)
  )

  // 加载分群选项
  onMounted(async () => {
    try {
      segmentOptions.value = await fetchGetSegmentOptions()
    } catch {
      // 拦截器已统一提示
    }
  })

  const {
    columns,
    columnChecks,
    data,
    loading,
    pagination,
    getData,
    searchParams,
    resetSearchParams,
    refreshSoft,
    refreshRemove,
    handleSizeChange,
    handleCurrentChange
  } = useTable({
    core: {
      apiFn: (async (params: { page?: number; per_page?: number; keyword?: string }) => {
        if (!selectedSegmentId.value) {
          return { data: [], meta: { total: 0 } } as any
        }
        return fetchGetSegmentUsers(selectedSegmentId.value, params)
      }) as any,
      apiParams: { page: 1, per_page: 15 },
      immediate: false,
      columnsFactory: () => [
        { prop: 'id', label: '用户 ID', width: 100 },
        { prop: 'username', label: '用户名', minWidth: 140, showOverflowTooltip: true },
        { prop: 'name', label: '昵称', minWidth: 140, showOverflowTooltip: true },
        {
          prop: 'phone',
          label: '手机号',
          width: 140,
          formatter: (row: Item) => row.phone || '-'
        },
        { prop: 'email', label: '邮箱', minWidth: 180, showOverflowTooltip: true },
        {
          prop: 'status',
          label: '状态',
          width: 90,
          formatter: (row: Item) =>
            h(
              ElTag,
              {
                type: row.status.value === 1 ? 'success' : 'danger',
                size: 'small',
                effect: 'plain'
              },
              () => row.status.label
            )
        },
        {
          prop: 'actions',
          label: '操作',
          width: 110,
          fixed: 'right',
          formatter: (row: Item) =>
            h('div', { class: 'flex items-center' }, [
              hasAuth('segments.assign')
                ? h(ArtButtonTable, {
                    icon: 'ri:user-unfollow-line',
                    iconClass: 'bg-error/12 text-error',
                    title: '移出分群',
                    onClick: () => handleRemove(row)
                  })
                : null
            ])
        }
      ]
    }
  })

  // 搜索栏表单项
  const formItems = computed(() => [
    {
      label: '分群',
      key: 'segment_id',
      type: 'select',
      props: {
        placeholder: '请选择分群',
        clearable: true,
        options: segmentOptions.value.map((s) => ({
          label: s.name,
          value: s.id
        })),
        onChange: (val: number | undefined) => {
          selectedSegmentId.value = val
          syncSearchParams()
          if (val) {
            getData()
          } else {
            resetSearchParams()
          }
        }
      }
    },
    {
      label: '关键词',
      key: 'keyword',
      type: 'input',
      props: {
        placeholder: '用户名/昵称/邮箱/手机号',
        clearable: true
      }
    }
  ])

  /** 将 formData 中的 keyword 同步到 searchParams（保留分页参数） */
  function syncSearchParams() {
    const paramsRecord = searchParams as Record<string, unknown>
    Object.keys(paramsRecord).forEach((key) => {
      if (key !== 'page' && key !== 'per_page') {
        delete paramsRecord[key]
      }
    })
    if (formData.value.keyword) {
      paramsRecord.keyword = formData.value.keyword
    }
  }

  function handleSearch(params: Record<string, any>) {
    selectedSegmentId.value = params.segment_id

    const paramsRecord = searchParams as Record<string, unknown>
    Object.keys(paramsRecord).forEach((key) => {
      if (key !== 'page' && key !== 'per_page') {
        delete paramsRecord[key]
      }
    })
    if (params.keyword) {
      paramsRecord.keyword = params.keyword
    }

    if (selectedSegmentId.value) {
      getData()
    } else {
      resetSearchParams()
    }
  }

  function handleReset() {
    formData.value = {}
    selectedSegmentId.value = undefined
    resetSearchParams()
  }

  function handleRefresh() {
    refreshSoft()
  }

  async function handleRemove(row: Item) {
    if (!selectedSegmentId.value) return
    try {
      await ElMessageBox.confirm(
        `确认将用户「${row.username || row.name || row.id}」移出当前分群？`,
        '移出分群',
        { type: 'warning', confirmButtonText: '确认', cancelButtonText: '取消' }
      )
    } catch {
      return
    }
    try {
      const result = await fetchDetachSegmentUsers(selectedSegmentId.value, {
        user_ids: [row.id]
      })
      if ((result as Api.SegmentManage.SegmentAsyncResponse).task_id) {
        ElMessage.success(
          `任务已提交（ID: ${(result as Api.SegmentManage.SegmentAsyncResponse).task_id}），完成后将通过站内信通知`
        )
      } else {
        ElMessage.success('已移出')
      }
      refreshRemove()
    } catch {
      // 拦截器已统一提示
    }
  }
</script>

<style scoped lang="scss"></style>
