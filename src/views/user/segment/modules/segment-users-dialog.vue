<template>
  <ElDialog
    v-model="visible"
    :title="`分群「${segment?.name ?? ''}」成员`"
    width="880px"
    :close-on-click-modal="false"
    @closed="handleClosed"
  >
    <div class="mb-3 flex items-center gap-2">
      <ElInput
        v-model="keyword"
        placeholder="搜索用户名/昵称/邮箱/手机号"
        clearable
        style="width: 280px"
        @keyup.enter="handleSearch"
      />
      <ElButton type="primary" @click="handleSearch">搜索</ElButton>
      <ElButton @click="handleReset">重置</ElButton>
    </div>

    <ArtTable
      :loading="loading"
      :data="data"
      :columns="columns"
      :pagination="pagination"
      @pagination:size-change="handleSizeChange"
      @pagination:current-change="handleCurrentChange"
    />

    <template #footer>
      <ElButton @click="visible = false">关闭</ElButton>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import { h, ref } from 'vue'
  import { ElButton, ElMessageBox, ElMessage, ElTag } from 'element-plus'
  import { useTable } from '@/hooks/core/useTable'
  import { useAuth } from '@/hooks/core/useAuth'
  import request from '@/utils/http'
  import ArtSvgIcon from '@/components/core/base/art-svg-icon/index.vue'
  import { fetchDetachSegmentUsers } from '@/api/segment-manage'

  defineOptions({ name: 'SegmentUsersDialog' })

  const { hasAuth } = useAuth()

  const visible = ref(false)
  const segment = ref<Api.SegmentManage.SegmentListItem | null>(null)
  const keyword = ref('')

  const { columns, data, loading, pagination, getData, handleSizeChange, handleCurrentChange } =
    useTable({
      core: {
        apiFn: (async (params: any) => {
          if (!segment.value) return { data: [], meta: { total: 0 } } as any
          return request.get<Api.Common.PaginatedResponse<Api.UserManage.UserListItem>>({
            url: `/admin/user-segments/${segment.value.id}/users`,
            params
          })
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
            formatter: (row: any) => row.phone_text || row.phone || '-'
          },
          { prop: 'email', label: '邮箱', minWidth: 180, showOverflowTooltip: true },
          {
            prop: 'status',
            label: '状态',
            width: 90,
            formatter: (row: any) =>
              h(
                ElTag,
                { type: row.status === 1 ? 'success' : 'danger', size: 'small', effect: 'plain' },
                () => (row.status === 1 ? '正常' : '已冻结')
              )
          },
          {
            prop: 'actions',
            label: '操作',
            width: 100,
            fixed: 'right',
            formatter: (row: any) =>
              h('div', { class: 'flex items-center gap-1' }, [
                hasAuth('segments.assign')
                  ? h(
                      ElButton,
                      {
                        type: 'danger',
                        link: true,
                        size: 'small',
                        onClick: () => handleRemove(row)
                      },
                      () => [
                        h(ArtSvgIcon, { icon: 'ri:user-unfollow-line', class: 'mr-0.5' }),
                        '移出分群'
                      ]
                    )
                  : null
              ])
          }
        ]
      }
    })

  function open(row: Api.SegmentManage.SegmentListItem) {
    segment.value = row
    keyword.value = ''
    visible.value = true
    nextTick(() => getData())
  }

  function handleClosed() {
    segment.value = null
  }

  function handleSearch() {
    ;(searchParams as any).keyword = keyword.value
    getData()
  }

  function handleReset() {
    keyword.value = ''
    ;(searchParams as any).keyword = undefined
    getData()
  }

  async function handleRemove(row: any) {
    if (!segment.value) return
    try {
      await ElMessageBox.confirm(
        `确认将用户「${row.username || row.name || row.id}」移出分群「${segment.value.name}」？`,
        '移出分群',
        { type: 'warning', confirmButtonText: '确认', cancelButtonText: '取消' }
      )
    } catch {
      return
    }
    try {
      const result = await fetchDetachSegmentUsers(segment.value.id, { user_ids: [row.id] })
      if ((result as Api.SegmentManage.SegmentAsyncResponse).task_id) {
        ElMessage.success(
          `任务已提交（ID: ${(result as Api.SegmentManage.SegmentAsyncResponse).task_id}），完成后将通过站内信通知`
        )
      } else {
        ElMessage.success('已移出')
      }
      getData()
    } catch {
      // 拦截器已统一提示
    }
  }

  // 暴露 searchParams 供内部使用
  const searchParams = reactive<{ keyword?: string }>({})

  defineExpose({ open })
</script>

<style scoped lang="scss"></style>
