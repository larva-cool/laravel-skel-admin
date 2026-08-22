<script setup lang="ts">
  import { ref } from 'vue'
  import {
    ElDrawer,
    ElTag,
    ElDescriptions,
    ElDescriptionsItem,
    ElImage,
    ElButton,
    ElSkeleton,
    ElEmpty,
    ElMessage
  } from 'element-plus'
  import ArtSvgIcon from '@/components/core/base/art-svg-icon/index.vue'
  import { fetchGetFeedbackDetail } from '@/api/system-manage'

  interface Props {
    canHandle?: boolean
  }

  const props = withDefaults(defineProps<Props>(), { canHandle: false })

  const emit = defineEmits<{
    handle: [row: Api.SystemManage.FeedbackListItem]
    refresh: []
  }>()

  const visible = ref(false)
  const loading = ref(false)
  const detail = ref<Api.SystemManage.FeedbackListItem | null>(null)

  const mapTagType = (t?: string) => {
    if (!t || t === 'default') return undefined
    return t as 'primary' | 'success' | 'warning' | 'danger' | 'info'
  }

  const open = async (row: Api.SystemManage.FeedbackListItem) => {
    detail.value = { ...row }
    visible.value = true
    loading.value = true
    try {
      const res = await fetchGetFeedbackDetail(row.id)
      detail.value = res
    } catch {
      // 行数据已乐观渲染，错误不关闭抽屉
    } finally {
      loading.value = false
    }
  }

  const close = () => {
    visible.value = false
    detail.value = null
  }

  const handleProcess = () => {
    if (!detail.value) return
    emit('handle', detail.value)
  }

  const copyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      ElMessage.success('已复制')
    } catch {
      ElMessage.error('复制失败')
    }
  }

  defineExpose({ open })
</script>

<template>
  <ElDrawer v-model="visible" size="760px" :destroy-on-close="true" :with-header="false">
    <div v-loading="loading" class="h-full flex flex-col">
      <!-- 自定义头部 -->
      <div
        class="shrink-0 flex items-start justify-between px-5 py-4 border-b border-[var(--el-border-color-lighter)]"
      >
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 mb-1">
            <h4 class="text-base font-semibold text-[var(--el-text-color-primary)] truncate">
              {{ detail?.title || '反馈详情' }}
            </h4>
            <ElTag
              v-if="detail?.status_label"
              :type="mapTagType(detail.status_label_type)"
              size="small"
            >
              {{ detail.status_label }}
            </ElTag>
          </div>
          <div class="flex items-center gap-2 text-xs text-[var(--el-text-color-secondary)]">
            <span>{{ detail?.code }}</span>
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
          <!-- 顶部标签区 -->
          <div class="flex flex-wrap items-center gap-2 mb-4">
            <ElTag
              v-if="detail.type_label"
              :type="mapTagType(detail.type_label_type)"
              effect="plain"
            >
              {{ detail.type_label }}
            </ElTag>
            <ElTag v-if="detail.priority_label" :type="mapTagType(detail.priority_label_type)">
              {{ detail.priority_label }}
            </ElTag>
          </div>

          <!-- 反馈内容 -->
          <div class="mb-5">
            <div class="mb-2 text-sm font-medium text-[var(--el-text-color-primary)]">反馈内容</div>
            <div
              class="rounded-md bg-[var(--el-fill-color-light)] px-4 py-3 text-sm leading-6 text-[var(--el-text-color-regular)] whitespace-pre-wrap break-all"
              >{{ detail.content || '（无补充内容）' }}</div
            >
          </div>

          <!-- 图片预览 -->
          <div v-if="detail.images && detail.images.length > 0" class="mb-5">
            <div class="mb-2 text-sm font-medium text-[var(--el-text-color-primary)]">
              附件图片（{{ detail.images.length }}）
            </div>
            <div class="flex flex-wrap gap-2">
              <ElImage
                v-for="(img, idx) in detail.images"
                :key="idx"
                :src="img"
                :preview-src-list="detail.images"
                :initial-index="idx"
                fit="cover"
                class="w-24 h-24 rounded-md overflow-hidden border border-[var(--el-border-color-lighter)] cursor-zoom-in"
                preview-teleported
              />
            </div>
          </div>

          <!-- 基本信息 -->
          <ElDescriptions :column="2" border class="mb-5" size="small">
            <ElDescriptionsItem label="反馈编号" :span="1">
              <span class="flex items-center gap-1">
                {{ detail.code }}
                <el-button link size="small" @click="copyText(detail.code)">
                  <ArtSvgIcon icon="ri:file-copy-line" class="text-xs" />
                </el-button>
              </span>
            </ElDescriptionsItem>
            <ElDescriptionsItem label="反馈用户" :span="1">
              {{ detail.user_id ? `ID:${detail.user_id}` : '游客' }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="联系人" :span="1">
              {{ detail.contact_name || '-' }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="联系方式" :span="1">
              <span v-if="detail.contact_info" class="flex items-center gap-1">
                {{ detail.contact_info }}
                <el-button link size="small" @click="copyText(detail.contact_info!)">
                  <ArtSvgIcon icon="ri:file-copy-line" class="text-xs" />
                </el-button>
              </span>
              <span v-else>-</span>
            </ElDescriptionsItem>
            <ElDescriptionsItem label="提交时间" :span="1">
              {{ detail.created_at || '-' }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="更新时间" :span="1">
              {{ detail.updated_at || '-' }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="IP 地址" :span="1">
              {{ detail.ip_address || '-' }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="处理人" :span="1">
              {{ detail.admin_name || '未分配' }}
            </ElDescriptionsItem>
            <ElDescriptionsItem v-if="detail.resolved_at" label="解决时间" :span="1">
              {{ detail.resolved_at }}
            </ElDescriptionsItem>
            <ElDescriptionsItem v-if="detail.closed_at" label="关闭时间" :span="1">
              {{ detail.closed_at }}
            </ElDescriptionsItem>
          </ElDescriptions>

          <!-- 客户端信息 -->
          <div v-if="detail.user_agent" class="mb-5">
            <div class="mb-2 text-sm font-medium text-[var(--el-text-color-primary)]"
              >客户端信息</div
            >
            <div
              class="rounded-md bg-[var(--el-fill-color-light)] px-4 py-2 text-xs leading-5 text-[var(--el-text-color-secondary)] break-all font-mono"
            >
              {{ detail.user_agent }}
            </div>
          </div>

          <!-- 处理备注 -->
          <div v-if="detail.admin_remark" class="mb-5">
            <div class="mb-2 text-sm font-medium text-[var(--el-text-color-primary)]">处理备注</div>
            <div
              class="rounded-md bg-[var(--el-color-success-light-9)] px-4 py-3 text-sm leading-6 text-[var(--el-text-color-regular)] whitespace-pre-wrap break-all border-l-2 border-[var(--el-color-success)]"
            >
              {{ detail.admin_remark }}
            </div>
          </div>

          <ElEmpty v-if="!loading && !detail" description="暂无数据" />
        </template>
      </div>

      <!-- 底部操作区 -->
      <div
        class="shrink-0 flex items-center justify-end gap-2 px-5 py-3 border-t border-[var(--el-border-color-lighter)] bg-[var(--el-bg-color)]"
      >
        <ElButton @click="close">关闭</ElButton>
        <ElButton
          v-if="props.canHandle"
          type="primary"
          :disabled="!detail || detail.status >= 5"
          @click="handleProcess"
        >
          <ArtSvgIcon icon="ri:edit-line" class="mr-1" />处理反馈
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
