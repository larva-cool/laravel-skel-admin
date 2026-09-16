<template>
  <div class="art-container p-4 space-y-6">
    <ArtTableHeader title="ArtDataSelect 数据选择器演示" />

    <div class="flex flex-wrap gap-4">
      <ElButton type="primary" @click="openMultiSelect">打开多选</ElButton>
      <ElButton type="success" @click="openSingleSelect">打开单选</ElButton>
    </div>

    <div v-if="selectedMulti.length > 0" class="art-card-xs">
      <h4 class="mb-2">已选（多选）：</h4>
      <div class="flex flex-wrap gap-2">
        <ElTag v-for="item in selectedMulti" :key="item.id" type="primary">
          {{ item.name }}
        </ElTag>
      </div>
    </div>

    <div v-if="selectedSingle" class="art-card-xs">
      <h4 class="mb-2">已选（单选）：</h4>
      <ElTag type="success">{{ selectedSingle.name }}</ElTag>
    </div>

    <!-- 多选 -->
    <ArtDataSelect
      ref="multiSelectRef"
      title="选择用户（多选）"
      :columns="columns"
      :data-source="fetchMockData"
      mode="multiple"
      @confirm="handleMultiConfirm"
    />

    <!-- 单选 -->
    <ArtDataSelect
      ref="singleSelectRef"
      title="选择用户（单选）"
      :columns="columns"
      :data-source="fetchMockData"
      mode="single"
      @confirm="handleSingleConfirm"
    />
  </div>
</template>

<script setup lang="ts">
  import { ref } from 'vue'
  import ArtTableHeader from '@/components/core/tables/art-table-header/index.vue'
  import type { ColumnOption } from '@/types/component'
  import ArtDataSelect from '@/components/core/forms/art-data-select/index.vue'

  defineOptions({ name: 'DataSelectDemo' })

  const columns: ColumnOption[] = [
    { prop: 'id', label: 'ID', width: 80 },
    { prop: 'name', label: '姓名', minWidth: 120 },
    { prop: 'email', label: '邮箱', minWidth: 200 },
    { prop: 'status', label: '状态', width: 100, align: 'center' }
  ]

  // 模拟数据
  const allData = Array.from({ length: 88 }).map((_, i) => ({
    id: i + 1,
    name: `用户${i + 1}`,
    email: `user${i + 1}@example.com`,
    status: i % 3 === 0 ? '禁用' : '正常'
  }))

  const fetchMockData = async (params: any) => {
    await new Promise((r) => setTimeout(r, 300))
    const { page = 1, pageSize = 10 } = params
    const start = (page - 1) * pageSize
    return {
      list: allData.slice(start, start + pageSize),
      total: allData.length
    }
  }

  const multiSelectRef = ref<InstanceType<typeof ArtDataSelect> | null>(null)
  const singleSelectRef = ref<InstanceType<typeof ArtDataSelect> | null>(null)
  const selectedMulti = ref<any[]>([])
  const selectedSingle = ref<any>(null)

  const openMultiSelect = () => {
    multiSelectRef.value?.open(selectedMulti.value)
  }
  const openSingleSelect = () => {
    singleSelectRef.value?.open(selectedSingle.value)
  }
  const handleMultiConfirm = (val: any[]) => {
    selectedMulti.value = val
  }
  const handleSingleConfirm = (val: any) => {
    selectedSingle.value = val
  }
</script>
