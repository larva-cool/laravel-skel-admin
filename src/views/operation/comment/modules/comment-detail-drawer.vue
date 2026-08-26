<script setup lang="ts">
  import { ref } from 'vue'
  import {
    ElDrawer,
    ElTag,
    ElDescriptions,
    ElDescriptionsItem,
    ElButton,
    ElSkeleton,
    ElEmpty,
    ElPagination
  } from 'element-plus'
  import ArtSvgIcon from '@/components/core/base/art-svg-icon/index.vue'
  import { fetchGetCommentDetail, fetchGetCommentReplies } from '@/api/content-manage'

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

  // 回复链
  const repliesLoading = ref(false)
  const replies = ref<Api.ContentManage.CommentListItem[]>([])
  const repliesPage = ref(1)
  const repliesPerPage = ref(10)
  const repliesTotal = ref(0)

  const sourceTypeLabel = (t?: string) => {
    return props.sourceTypeMap[t || ''] || t || '-'
  }

  const mapTagType = (t?: string) => {
    if (!t || t === 'default') return undefined
    return t as 'primary' | 'success' | 'warning' | 'danger' | 'info'
  }

  /** 加载指定评论的回复列表 */
  async function loadReplies(id: number) {
    repliesLoading.value = true
    try {
      const res = await fetchGetCommentReplies(id, {
        page: repliesPage.value,
        per_page: repliesPerPage.value
      })
      replies.value = res.data || []
      repliesTotal.value = res.meta?.total || 0
    } catch {
      replies.value = []
      repliesTotal.value = 0
    } finally {
      repliesLoading.value = false
    }
  }

  function handleRepliesPageChange(page: number) {
    repliesPage.value = page
    if (detail.value) {
      loadReplies(detail.value.id)
    }
  }

  const open = async (row: Api.ContentManage.CommentListItem) => {
    detail.value = { ...row }
    visible.value = true
    loading.value = true
    // 重置回复链状态
    replies.value = []
    repliesTotal.value = 0
    repliesPage.value = 1
    try {
      const res = await fetchGetCommentDetail(row.id)
      detail.value = res
    } catch {
      // 使用行数据乐观渲染
    } finally {
      loading.value = false
    }
    // 详情加载完成后加载回复链
    loadReplies(row.id)
  }

  const close = () => {
    visible.value = false
    detail.value = null
    replies.value = []
    repliesTotal.value = 0
    repliesPage.value = 1
  }

  const handleReview = () => {
    if (!detail.value) return
    emit('review', detail.value)
  }

  /** 按 ID 打开评论详情（用于回复链内跳转，无需完整行数据） */
  const openById = async (id: number) => {
    visible.value = true
    loading.value = true
    detail.value = null
    replies.value = []
    repliesTotal.value = 0
    repliesPage.value = 1
    try {
      detail.value = await fetchGetCommentDetail(id)
    } finally {
      loading.value = false
    }
    loadReplies(id)
  }

  /** 点击回复项，切换查看该回复的详情 */
  const viewReply = (reply: Api.ContentManage.CommentListItem) => {
    openById(reply.id)
  }

  /** 点击上级评论，跳转查看上级评论详情 */
  const viewParent = () => {
    const parent = detail.value?.parent_comment
    if (!parent) return
    openById(parent.id)
  }

  defineExpose({ open })
</script>

<template>
  <ElDrawer v-model="visible" size="680px" :destroy-on-close="true" :with-header="false">
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
            <ElTag v-if="detail?.is_reply" type="info" size="small" effect="plain">回复</ElTag>
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
          <!-- 上级评论（回复对象） -->
          <div v-if="detail.is_reply && detail.parent_comment" class="mb-4">
            <div
              class="mb-2 flex items-center gap-1.5 text-sm font-medium text-[var(--el-text-color-primary)]"
            >
              <ArtSvgIcon
                icon="ri:corner-up-left-line"
                class="text-[var(--el-text-color-secondary)]"
              />
              回复的评论
            </div>
            <div
              class="cursor-pointer rounded-md border-l-2 border-[var(--el-color-primary)] bg-[var(--el-fill-color-lighter)] px-4 py-3 transition-colors hover:bg-[var(--el-fill-color)]"
              @click="viewParent"
            >
              <div
                class="mb-1.5 flex items-center gap-2 text-xs text-[var(--el-text-color-secondary)]"
              >
                <span class="font-medium text-[var(--el-text-color-regular)]">
                  {{ detail.parent_comment.username || `ID:${detail.parent_comment.user_id}` }}
                </span>
                <ElTag
                  :type="mapTagType(detail.parent_comment.status_label_type)"
                  size="small"
                  effect="plain"
                >
                  {{ detail.parent_comment.status_label }}
                </ElTag>
                <span>{{ detail.parent_comment.created_at }}</span>
              </div>
              <div
                class="line-clamp-3 text-sm leading-6 text-[var(--el-text-color-regular)] whitespace-pre-wrap break-all"
              >
                {{ detail.parent_comment.content }}
              </div>
            </div>
          </div>

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
          <ElDescriptions :column="2" border size="small" class="mb-5">
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

          <!-- 回复链 -->
          <div>
            <div
              class="mb-2 flex items-center gap-1.5 text-sm font-medium text-[var(--el-text-color-primary)]"
            >
              <ArtSvgIcon icon="ri:chat-3-line" class="text-[var(--el-text-color-secondary)]" />
              回复列表
              <span class="text-xs font-normal text-[var(--el-text-color-secondary)]">
                （{{ repliesTotal }}）
              </span>
            </div>

            <div v-loading="repliesLoading">
              <ElEmpty
                v-if="!repliesLoading && replies.length === 0"
                description="暂无回复"
                :image-size="60"
              />

              <div v-else class="flex flex-col gap-2">
                <div
                  v-for="reply in replies"
                  :key="reply.id"
                  class="cursor-pointer rounded-md border border-[var(--el-border-color-lighter)] px-4 py-3 transition-colors hover:border-[var(--el-color-primary-light-5)] hover:bg-[var(--el-fill-color-lighter)]"
                  @click="viewReply(reply)"
                >
                  <div
                    class="mb-1.5 flex flex-wrap items-center gap-2 text-xs text-[var(--el-text-color-secondary)]"
                  >
                    <span class="font-medium text-[var(--el-text-color-regular)]">
                      {{ reply.username || `ID:${reply.user_id}` }}
                    </span>
                    <ElTag :type="mapTagType(reply.status_label_type)" size="small" effect="plain">
                      {{ reply.status_label }}
                    </ElTag>
                    <span>{{ reply.created_at }}</span>
                    <span v-if="reply.comment_count > 0" class="flex items-center gap-0.5">
                      <ArtSvgIcon icon="ri:chat-3-line" />
                      {{ reply.comment_count }}
                    </span>
                    <span v-if="reply.like_count > 0" class="flex items-center gap-0.5">
                      <ArtSvgIcon icon="ri:thumb-up-line" />
                      {{ reply.like_count }}
                    </span>
                  </div>
                  <div
                    class="line-clamp-3 text-sm leading-6 text-[var(--el-text-color-regular)] whitespace-pre-wrap break-all"
                  >
                    {{ reply.content }}
                  </div>
                </div>
              </div>

              <div v-if="repliesTotal > repliesPerPage" class="mt-3 flex justify-end">
                <ElPagination
                  v-model:current-page="repliesPage"
                  :page-size="repliesPerPage"
                  :total="repliesTotal"
                  layout="prev, pager, next"
                  small
                  background
                  @current-change="handleRepliesPageChange"
                />
              </div>
            </div>
          </div>
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
