<template>
  <div class="art-full-height flex flex-col gap-3">
    <!-- 搜索栏 -->
    <BannerSearch
      v-show="showSearchBar"
      :position-options="positionOptions"
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
      >
        <template #left>
          <ElSpace wrap>
            <ElButton v-auth="'banners.create'" type="primary" @click="openCreateDialog">
              <ElIcon class="mr-1"><Plus /></ElIcon>
              新增 Banner
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

    <!-- 新增/编辑弹窗 -->
    <BannerEditDialog
      ref="editDialogRef"
      :position-options="positionOptions"
      @success="onEditSuccess"
    />
  </div>
</template>

<script setup lang="ts">
  import { h, ref } from 'vue'
  import { ElTag, ElButton, ElMessageBox, ElSwitch, ElMessage, ElImage } from 'element-plus'
  import { Plus } from '@element-plus/icons-vue'
  import ArtSvgIcon from '@/components/core/base/art-svg-icon/index.vue'
  import { useTable } from '@/hooks/core/useTable'
  import { useAuth } from '@/hooks/core/useAuth'
  import {
    fetchGetBannerList,
    fetchDeleteBanner,
    fetchToggleBannerStatus,
    fetchGetBannerPositions,
    fetchSortBanners
  } from '@/api/operation-manage'
  import BannerSearch from './modules/banner-search.vue'
  import BannerEditDialog from './modules/banner-edit-dialog.vue'

  defineOptions({ name: 'BannerManage' })

  type BannerListItem = Api.OperationManage.BannerListItem

  const { hasAuth } = useAuth()

  const showSearchBar = ref(true)
  const editDialogRef = ref<InstanceType<typeof BannerEditDialog>>()

  // 广告位选项
  const positionOptions = ref<Api.OperationManage.BannerPositionOption[]>([])

  // 当前按广告位分组的 ID 列表（用于上下移排序）
  const upDownMoves = ref<Map<number, 'up' | 'down'>>(new Map())

  const mapTagType = (t?: string) => {
    if (!t || t === 'default') return undefined
    return t as 'primary' | 'success' | 'warning' | 'danger' | 'info'
  }

  const linkTypeLabel = (t?: string) => {
    switch (t) {
      case 'none':
        return '无链接'
      case 'url':
        return '外部链接'
      case 'page':
        return '内部页面'
      case 'goods':
        return '跳转商品'
      case 'webview':
        return '内嵌网页'
      default:
        return t || '-'
    }
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
      apiFn: fetchGetBannerList,
      apiParams: { page: 1, per_page: 20 },
      columnsFactory: () => [
        { prop: 'id', label: 'ID', width: 100 },
        {
          prop: 'position_label',
          label: '广告位',
          width: 130,
          formatter: (row: BannerListItem) =>
            h(
              ElTag,
              { type: mapTagType('primary'), size: 'small', effect: 'plain' },
              () => row.position_label || row.position
            )
        },
        {
          prop: 'image',
          label: '图片',
          width: 130,
          formatter: (row: BannerListItem) =>
            h(ElImage, {
              src: row.image,
              fit: 'cover',
              style: 'width: 100px; height: 50px; border-radius: 4px;',
              lazy: true,
              previewSrcList: [row.image],
              hideOnClickModal: true,
              previewTeleported: true
            })
        },
        { prop: 'title', label: '标题', minWidth: 180, showOverflowTooltip: true },
        {
          prop: 'link_type',
          label: '链接类型',
          width: 110,
          formatter: (row: BannerListItem) =>
            h(ElTag, { size: 'small', effect: 'plain' }, () => linkTypeLabel(row.link_type))
        },
        { prop: 'link_value', label: '链接值', minWidth: 200, showOverflowTooltip: true },
        { prop: 'sort', label: '排序', width: 80, align: 'center' },
        {
          prop: 'status',
          label: '状态',
          width: 90,
          formatter: (row: BannerListItem) =>
            h(ElSwitch, {
              modelValue: row.status,
              loading: upDownMoves.value.has(row.id),
              disabled: !hasAuth('banners.edit'),
              activeText: '启用',
              inactiveText: '禁用',
              inlinePrompt: true,
              onChange: () => handleToggleStatus(row)
            })
        },
        { prop: 'start_at', label: '开始时间', width: 170, showOverflowTooltip: true },
        { prop: 'end_at', label: '结束时间', width: 170, showOverflowTooltip: true },
        {
          prop: 'actions',
          label: '操作',
          width: 200,
          fixed: 'right',
          formatter: (row: BannerListItem) =>
            h('div', { class: 'flex items-center gap-1' }, [
              h(
                ElButton,
                {
                  type: 'primary',
                  link: true,
                  size: 'small',
                  disabled: !hasAuth('banners.edit'),
                  onClick: () => moveUp(row)
                },
                () => [h(ArtSvgIcon, { icon: 'ri:arrow-up-line', class: 'mr-0.5' }), '上移']
              ),
              h(
                ElButton,
                {
                  type: 'primary',
                  link: true,
                  size: 'small',
                  disabled: !hasAuth('banners.edit'),
                  onClick: () => moveDown(row)
                },
                () => [h(ArtSvgIcon, { icon: 'ri:arrow-down-line', class: 'mr-0.5' }), '下移']
              ),
              hasAuth('banners.edit')
                ? h(
                    ElButton,
                    {
                      type: 'primary',
                      link: true,
                      size: 'small',
                      onClick: () => openEditDialog(row)
                    },
                    () => [h(ArtSvgIcon, { icon: 'ri:edit-line', class: 'mr-0.5' }), '编辑']
                  )
                : null,
              hasAuth('banners.delete')
                ? h(
                    ElButton,
                    {
                      type: 'danger',
                      link: true,
                      size: 'small',
                      onClick: () => handleDelete(row)
                    },
                    () => [h(ArtSvgIcon, { icon: 'ri:delete-bin-line', class: 'mr-0.5' }), '删除']
                  )
                : null
            ])
        }
      ]
    }
  })

  const openCreateDialog = () => {
    editDialogRef.value?.open()
  }

  const openEditDialog = (row: BannerListItem) => {
    editDialogRef.value?.open(row)
  }

  const onEditSuccess = () => {
    refreshData()
  }

  const handleDelete = (row: BannerListItem) => {
    ElMessageBox.confirm(
      `确认删除 Banner「${row.title || row.id}」吗？删除后不可恢复。`,
      '删除 Banner',
      {
        type: 'warning',
        confirmButtonText: '确认删除',
        cancelButtonText: '取消'
      }
    )
      .then(async () => {
        await fetchDeleteBanner(row.id)
        refreshData()
      })
      .catch(() => {})
  }

  const handleToggleStatus = async (row: BannerListItem) => {
    upDownMoves.value.set(row.id, 'up')
    try {
      await fetchToggleBannerStatus(row.id)
      refreshData()
    } catch {
      // 切换失败不刷新
    } finally {
      upDownMoves.value.delete(row.id)
    }
  }

  // 计算当前同广告位中所有 Banner 的 ID（按当前 sort 升序），交换相邻两项后整体回写
  const moveUp = async (row: BannerListItem) => {
    const samePos = data.value
      .filter((r) => r.position === row.position)
      .sort((a, b) => a.sort - b.sort)
    const idx = samePos.findIndex((r) => r.id === row.id)
    if (idx <= 0) {
      ElMessage.warning('已经是第一位')
      return
    }
    const newOrder = samePos.map((r) => r.id)
    ;[newOrder[idx - 1], newOrder[idx]] = [newOrder[idx], newOrder[idx - 1]]
    await fetchSortBanners({ ids: newOrder })
    refreshData()
  }

  const moveDown = async (row: BannerListItem) => {
    const samePos = data.value
      .filter((r) => r.position === row.position)
      .sort((a, b) => a.sort - b.sort)
    const idx = samePos.findIndex((r) => r.id === row.id)
    if (idx < 0 || idx >= samePos.length - 1) {
      ElMessage.warning('已经是最后一位')
      return
    }
    const newOrder = samePos.map((r) => r.id)
    ;[newOrder[idx], newOrder[idx + 1]] = [newOrder[idx + 1], newOrder[idx]]
    await fetchSortBanners({ ids: newOrder })
    refreshData()
  }

  const handleSearch = (params: Partial<Api.OperationManage.BannerSearchParams>) => {
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
  }

  async function loadPositions() {
    try {
      const list = await fetchGetBannerPositions()
      positionOptions.value = (list || []).filter((it) => it && it.value)
    } catch {
      positionOptions.value = []
    }
  }

  onMounted(() => {
    loadPositions()
  })
</script>

<style scoped lang="scss"></style>
