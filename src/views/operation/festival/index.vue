<template>
  <div class="art-full-height flex flex-col gap-3">
    <FestivalSearch
      v-show="showSearchBar"
      @search="handleSearch"
      @resetSearchParams="resetSearchParams"
    />

    <ElCard class="art-table-card flex-1">
      <ArtTableHeader
        v-model:columns="columnChecks"
        v-model:showSearchBar="showSearchBar"
        :loading="loading"
        @refresh="handleRefresh"
      >
        <template #left>
          <ElSpace wrap>
            <ElButton
              v-auth="'automation-festivals.create'"
              type="primary"
              @click="openCreateDialog"
            >
              <ElIcon class="mr-1"><Plus /></ElIcon>
              新增节日
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

    <FestivalDialog ref="dialogRef" @success="onEditSuccess" />
  </div>
</template>

<script setup lang="ts">
  import { h, ref } from 'vue'
  import { ElTag, ElButton, ElMessageBox, ElSwitch } from 'element-plus'
  import { Plus } from '@element-plus/icons-vue'
  import ArtButtonTable from '@/components/core/forms/art-button-table/index.vue'
  import { useTable } from '@/hooks/core/useTable'
  import { useAuth } from '@/hooks/core/useAuth'
  import {
    fetchGetAutomationFestivalList,
    fetchDeleteAutomationFestival,
    fetchToggleAutomationFestivalStatus
  } from '@/api/automation'
  import FestivalSearch from './modules/festival-search.vue'
  import FestivalDialog from './modules/festival-dialog.vue'

  defineOptions({ name: 'AutomationFestival' })

  type FestivalListItem = Api.Automation.FestivalListItem

  const { hasAuth } = useAuth()

  const showSearchBar = ref(true)
  const dialogRef = ref<InstanceType<typeof FestivalDialog>>()
  const toggleLoading = ref<Map<number, boolean>>(new Map())

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
      apiFn: fetchGetAutomationFestivalList,
      apiParams: { page: 1, per_page: 20 },
      columnsFactory: () => [
        { prop: 'id', label: 'ID', width: 80 },
        { prop: 'name', label: '节日名称', minWidth: 140, showOverflowTooltip: true },
        {
          prop: 'date_type',
          label: '日期类型',
          width: 110,
          formatter: (row: FestivalListItem) =>
            h(
              ElTag,
              {
                type: (row.date_type_label_type || 'info') as never,
                size: 'small',
                effect: 'light'
              },
              () => row.date_type_label
            )
        },
        {
          prop: 'month',
          label: '日期',
          width: 110,
          formatter: (row: FestivalListItem) => `${row.month} 月 ${row.day} 日`
        },
        { prop: 'sort', label: '排序', width: 70, align: 'center' },
        { prop: 'remark', label: '备注', minWidth: 140, showOverflowTooltip: true },
        {
          prop: 'status',
          label: '状态',
          width: 90,
          formatter: (row: FestivalListItem) =>
            h(ElSwitch, {
              modelValue: row.status,
              loading: toggleLoading.value.get(row.id) ?? false,
              disabled: !hasAuth('automation-festivals.edit'),
              activeText: '启用',
              inactiveText: '禁用',
              inlinePrompt: true,
              onChange: () => handleToggleStatus(row)
            })
        },
        { prop: 'created_at', label: '创建时间', width: 170, showOverflowTooltip: true },
        {
          prop: 'actions',
          label: '操作',
          width: 140,
          fixed: 'right',
          formatter: (row: FestivalListItem) =>
            h('div', { class: 'flex items-center' }, [
              hasAuth('automation-festivals.edit')
                ? h(ArtButtonTable, {
                    type: 'edit',
                    title: '编辑',
                    onClick: () => openEditDialog(row)
                  })
                : null,
              hasAuth('automation-festivals.delete')
                ? h(ArtButtonTable, {
                    type: 'delete',
                    title: '删除',
                    onClick: () => handleDelete(row)
                  })
                : null
            ])
        }
      ]
    }
  })

  const openCreateDialog = () => dialogRef.value?.open()
  const openEditDialog = (row: FestivalListItem) => dialogRef.value?.open(row)
  const onEditSuccess = () => refreshData()

  const handleDelete = (row: FestivalListItem) => {
    ElMessageBox.confirm(
      `确认删除节日「${row.name}」吗？删除后引用该节日的规则将不再命中它。`,
      '删除节日',
      {
        type: 'warning',
        confirmButtonText: '确认删除',
        cancelButtonText: '取消'
      }
    )
      .then(async () => {
        await fetchDeleteAutomationFestival(row.id)
        refreshData()
      })
      .catch(() => {})
  }

  const handleToggleStatus = async (row: FestivalListItem) => {
    toggleLoading.value.set(row.id, true)
    try {
      await fetchToggleAutomationFestivalStatus(row.id)
      refreshData()
    } catch {
      // 失败不刷新
    } finally {
      toggleLoading.value.delete(row.id)
    }
  }

  const handleSearch = (params: Partial<Api.Automation.FestivalSearchParams>) => {
    const paramsRecord = searchParams as Record<string, unknown>
    Object.keys(paramsRecord).forEach((key) => {
      if (key !== 'page' && key !== 'per_page') delete paramsRecord[key]
    })
    Object.assign(searchParams, params)
    getData()
  }

  const handleRefresh = () => refreshData()
</script>
