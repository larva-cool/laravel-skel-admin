<template>
  <ElDialog
    v-model="dialogVisible"
    title="语义检索测试"
    width="760px"
    :close-on-click-modal="false"
  >
    <ElForm label-width="80px" label-position="right" @submit.prevent>
      <ElFormItem label="检索内容" required>
        <ElInput
          v-model="query"
          type="textarea"
          :rows="3"
          placeholder="用自然语言描述要检索的问题，例如：会员到期了会怎样？"
          maxlength="500"
          show-word-limit
        />
      </ElFormItem>
      <ElFormItem label="返回条数">
        <ElInputNumber v-model="limit" :min="1" :max="10" :step="1" />
        <ElButton class="ml-3" type="primary" :loading="searching" @click="handleSearch">
          开始检索
        </ElButton>
      </ElFormItem>
    </ElForm>

    <ElDivider v-if="searched" content-position="left">检索结果</ElDivider>
    <div v-if="searched" class="max-h-96 overflow-y-auto">
      <ElEmpty v-if="!results.length" description="未检索到相关内容" />
      <div
        v-for="item in results"
        :key="item.chunk_id"
        class="mb-3 rounded-md border border-solid border-[var(--el-border-color-lighter)] p-3"
      >
        <div class="mb-1 flex items-center justify-between">
          <span class="font-medium">{{ item.document_title }}</span>
          <ElTag type="success" size="small" effect="light"
            >相似度 {{ (item.score * 100).toFixed(1) }}%</ElTag
          >
        </div>
        <div class="text-sm text-secondary whitespace-pre-wrap">{{ item.content }}</div>
      </div>
    </div>
  </ElDialog>
</template>

<script setup lang="ts">
  import { fetchTestKnowledgeSearch } from '@/api/knowledge'
  import { ElMessage } from 'element-plus'

  defineOptions({ name: 'KnowledgeTestDialog' })

  const dialogVisible = ref(false)
  const searching = ref(false)
  const searched = ref(false)
  const query = ref('')
  const limit = ref(5)
  const results = ref<Api.Knowledge.SearchResultItem[]>([])

  const open = () => {
    dialogVisible.value = true
  }

  const handleSearch = async () => {
    if (!query.value.trim()) {
      ElMessage.warning('请输入检索内容')
      return
    }
    searching.value = true
    try {
      results.value = await fetchTestKnowledgeSearch({
        query: query.value.trim(),
        limit: limit.value
      })
      searched.value = true
    } finally {
      searching.value = false
    }
  }

  defineExpose({ open })
</script>

<style scoped lang="scss"></style>
