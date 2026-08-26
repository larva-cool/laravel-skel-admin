<script setup lang="ts">
  import { ref } from 'vue'
  import {
    ElDrawer,
    ElTag,
    ElDescriptions,
    ElDescriptionsItem,
    ElButton,
    ElSkeleton
  } from 'element-plus'
  import ArtSvgIcon from '@/components/core/base/art-svg-icon/index.vue'
  import { fetchGetCommentDetail } from '@/api/content-manage'

  interface Props {
    canReview?: boolean
    sourceTypeMap?: Record<string, string>
  }

  const props = withDefaults(defineProps<Props>(), {
    canReview: false,
    sourceTypeMap: () => ({})
  })

  const emit = defineEmits<{
    review: [row: Api.ContentManage.CommentListItem]
    refresh: []
  }>()

  const visible = ref(false)
  const loading = ref(false)
  const detail = ref<Api.ContentManage.CommentListItem | null>(null)

  const sourceTypeLabel = (t?: string) => {
    return props.sourceTypeMap[t || ''] || t || '-'
  }

  const mapTagType = (t?: string) => {
    if (!t || t === 'default') return undefined
    return t as 'primary' | 'success' | 'warning' | 'danger' | 'info'
  }

  const open = async (row: Api.ContentManage.CommentListItem) => {
    detail.value = { ...row }
    visible.value = true
    loading.value = true
    try {
      const res = await fetchGetCommentDetail(row.id)
      detail.value = res
    } catch {
      // 使用行数据乐观渲染
    } finally {
      loading.value = false
    }
  }

  const close = () => {
    visible.value = false
    detail.value = null
  }

  const handleReview = () => {
    if (!detail.value) return
    emit('review', detail.value)
  }

  defineExpose({ open })
</script>

<template>
  <ElDrawer v-model="visible" size="640px" :destroy-on-close="true" :with-header="false">
    <div v-loading="loading" class="h-full flex flex-col">
      <!-- 自定义头部 -->
      <div
        class="shrink-0 flex items-start justify-between px-5 py-4 border-b border-[var(--el-border-color-lighter)]"
      >
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 mb-1">
            <h4 class="text-base font-semibold text-[var(--el-text-color-primary)]">评论详情</h4>
            <ElTag
              v-if="detail?.status_label"
              :type="mapTagType(detail.status_label_type)"
              size="small"
            >
              {{ detail.status_label }}
            </ElTag>
            <ElTag v-if="detail?.is_top" type="warning" size="small" effect="plain">置顶</ElTag>
          </div>
          <div class="flex items-center gap-2 text-xs text-[var(--el-text-color-secondary)]">
            <span>ID: {{ detail?.id }}</span>
            <span>·</span>
            <span>{{ detail?.created_at }}</span>
          </div>
        </div>
        <el-button link class="!p-1" @click="close">
          <ArtSvgIcon icon="ri:close-line" />
        </el-button>
      </div>

      <!-- 内容区 -->
      <div class="flex-1 overflow-y-auto px-5 py-4">
        <ElSkeleton v-if="loading && !detail" :rows="8" animated />

        <template v-else-if="detail">
          <!-- 评论内容 -->
          <div class="mb-5">
            <div class="mb-2 text-sm font-medium text-[var(--el-text-color-primary)]">评论内容</div>
            <div
              class="rounded-md bg-[var(--el-fill-color-light)] px-4 py-3 text-sm leading-6 text-[var(--el-text-color-regular)] whitespace-pre-wrap break-all"
            >
              {{ detail.content || '（无内容）' }}
            </div>
          </div>

          <!-- 基本信息 -->
          <ElDescriptions :column="2" border size="small">
            <ElDescriptionsItem label="评论ID" :span="1">
              {{ detail.id }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="评论用户" :span="1">
              {{
                detail.username
                  ? `${detail.username} (ID:${detail.user_id})`
                  : `ID:${detail.user_id}`
              }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="源类型" :span="1">
              {{ sourceTypeLabel(detail.source_type) }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="源ID" :span="1">
              {{ detail.source_id }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="点赞数" :span="1">
              {{ detail.like_count }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="回复数" :span="1">
              {{ detail.comment_count }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="IP 地址" :span="1">
              {{ detail.ip_address || '-' }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="评论时间" :span="1">
              {{ detail.created_at || '-' }}
            </ElDescriptionsItem>
          </ElDescriptions>
        </template>
      </div>

      <!-- 底部操作区 -->
      <div
        class="shrink-0 flex items-center justify-end gap-2 px-5 py-3 border-t border-[var(--el-border-color-lighter)] bg-[var(--el-bg-color)]"
      >
        <ElButton @click="close">关闭</ElButton>
        <ElButton
          v-if="props.canReview"
          type="primary"
          :disabled="!detail || detail.status === 'approved' || detail.status === 'rejected'"
          @click="handleReview"
        >
          <ArtSvgIcon icon="ri:edit-line" class="mr-1" />审核评论
        </ElButton>
      </div>
    </div>
  </ElDrawer>
</template>

<style scoped>
  :deep(.el-drawer__body) {
    padding: 0;
    overflow: hidden;
  }
</style>
