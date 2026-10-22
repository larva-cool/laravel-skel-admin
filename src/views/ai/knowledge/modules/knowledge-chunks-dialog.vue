<template>
  <ElDialog
    v-model="dialogVisible"
    :title="`文档分块${documentTitle ? ` - ${documentTitle}` : ''}`"
    width="800px"
    :close-on-click-modal="false"
  >
    <ElTable v-loading="loading" :data="chunks" border max-height="480">
      <ElTableColumn prop="sort" label="顺序" width="70" align="center" />
      <ElTableColumn prop="content" label="分块内容" min-width="420" show-overflow-tooltip />
      <ElTableColumn prop="tokens" label="Tokens" width="90" align="center" />
      <ElTableColumn prop="created_at" label="生成时间" width="170" />
      <template #empty>
        <ElEmpty :description="emptyText" />
      </template>
    </ElTable>

    <div class="mt-3 flex justify-end">
      <ElPagination
        v-model:current-page="page"
        :page-size="pageSize"
        :total="total"
        layout="total, prev, pager, next"
        @current-change="loadChunks"
      />
    </div>
  </ElDialog>
</template>

<script setup lang="ts">
  import { fetchGetKnowledgeChunks } from '@/api/knowledge'

  defineOptions({ name: 'KnowledgeChunksDialog' })

  const dialogVisible = ref(false)
  const loading = ref(false)
  const documentId = ref<number | null>(null)
  const documentTitle = ref('')
  const chunks = ref<Api.Knowledge.ChunkItem[]>([])
  const page = ref(1)
  const pageSize = ref(10)
  const total = ref(0)

  const emptyText = computed(() => (loading.value ? '加载中' : '暂无分块，请先完成索引'))

  const open = (row: Api.Knowledge.ListItem) => {
    documentId.value = row.id
    documentTitle.value = row.title
    page.value = 1
    dialogVisible.value = true
    loadChunks()
  }

  const loadChunks = async () => {
    if (!documentId.value) return
    loading.value = true
    try {
      const res = await fetchGetKnowledgeChunks(documentId.value, {
        page: page.value,
        per_page: pageSize.value
      })
      chunks.value = res.data ?? []
      total.value = res.meta?.total ?? 0
    } finally {
      loading.value = false
    }
  }

  defineExpose({ open })
</script>

<style scoped lang="scss"></style>
