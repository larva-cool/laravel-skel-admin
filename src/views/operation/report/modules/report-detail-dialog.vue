<script setup lang="ts">
  import { computed, ref } from 'vue'
  import {
    ElDialog,
    ElDescriptions,
    ElDescriptionsItem,
    ElTag,
    ElImage,
    ElButton,
    ElDivider,
    ElEmpty
  } from 'element-plus'
  import ArtSvgIcon from '@/components/core/base/art-svg-icon/index.vue'
  import { fetchGetReportDetail } from '@/api/system-manage'

  interface Props {
    canHandle?: boolean
  }

  const props = withDefaults(defineProps<Props>(), { canHandle: false })

  const emit = defineEmits<{
    handle: [row: Api.SystemManage.ReportDetail]
    refresh: []
  }>()

  const visible = ref(false)
  const loading = ref(false)
  const detail = ref<Api.SystemManage.ReportDetail | null>(null)

  const mapTagType = (t?: string) => {
    if (!t || t === 'default') return undefined
    return t as 'primary' | 'success' | 'warning' | 'danger' | 'info'
  }

  const open = async (row: Api.SystemManage.ReportListItem) => {
    detail.value = { ...row } as Api.SystemManage.ReportDetail
    visible.value = true
    loading.value = true
    try {
      const res = await fetchGetReportDetail(row.id)
      detail.value = res
    } catch {
      // 保留乐观渲染
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

  /** 被举报对象快照（comment）渲染 */
  const snapshotComment = computed(() => {
    const snap = detail.value?.reportable_snapshot as
      Api.SystemManage.ReportSnapshotComment | undefined
    return snap && snap.type === 'comment' ? snap : null
  })

  /** 被举报对象快照（user）渲染 */
  const snapshotUser = computed(() => {
    const snap = detail.value?.reportable_snapshot as
      Api.SystemManage.ReportSnapshotUser | undefined
    return snap && snap.type === 'user' ? snap : null
  })

  /** 联动处置动作渲染 */
  const actionTypeLabel = (type: string) => {
    const map: Record<string, string> = {
      hide_comment: '隐藏评论',
      delete_comment: '删除评论',
      freeze_user: '冻结用户'
    }
    return map[type] ?? type
  }

  defineExpose({ open })
</script>

<template>
  <ElDialog
    v-model="visible"
    title="举报详情"
    width="760px"
    :close-on-click-modal="false"
    destroy-on-close
    align-center
  >
    <div v-loading="loading">
      <ElEmpty v-if="!detail" description="暂无数据" />
      <template v-else>
        <!-- 基础信息 -->
        <ElDescriptions :column="2" border size="default">
          <ElDescriptionsItem label="举报ID">
            <span class="font-mono">{{ detail.id }}</span>
          </ElDescriptionsItem>
          <ElDescriptionsItem label="举报分类">
            <ElTag
              v-if="detail.category_label"
              :type="mapTagType(detail.category_label_type)"
              size="small"
            >
              {{ detail.category_label }}
            </ElTag>
            <span v-else>{{ detail.category }}</span>
          </ElDescriptionsItem>
          <ElDescriptionsItem label="处理状态">
            <ElTag :type="mapTagType(detail.status_label_type)" size="small" effect="dark">
              {{ detail.status_label || detail.status }}
            </ElTag>
          </ElDescriptionsItem>
          <ElDescriptionsItem label="举报时间">{{ detail.created_at || '-' }}</ElDescriptionsItem>
          <ElDescriptionsItem label="举报人">
            <span>{{ detail.nickname || detail.username || '-' }}</span>
            <span class="ml-1 text-xs text-g-500">#{{ detail.user_id }}</span>
          </ElDescriptionsItem>
          <ElDescriptionsItem label="处理人">
            <span v-if="detail.handler_name"
              >{{ detail.handler_name }} #{{ detail.handler_id }}</span
            >
            <span v-else>-</span>
          </ElDescriptionsItem>
        </ElDescriptions>

        <ElDivider content-position="left">举报描述</ElDivider>
        <div class="px-3 py-2 rounded bg-g-50 text-g-700">
          {{ detail.reason || '（未填写）' }}
        </div>

        <template v-if="detail.evidence && detail.evidence.length > 0">
          <ElDivider content-position="left">证据图片</ElDivider>
          <div class="flex flex-wrap gap-3">
            <ElImage
              v-for="(url, idx) in detail.evidence"
              :key="idx"
              :src="url"
              :preview-src-list="detail.evidence"
              fit="cover"
              style="width: 96px; height: 96px; border-radius: 4px"
              :hide-on-click-modal="true"
            />
          </div>
        </template>

        <ElDivider content-position="left">被举报对象</ElDivider>
        <ElDescriptions :column="2" border size="default">
          <ElDescriptionsItem label="对象类型">
            <ElTag size="small" effect="plain">{{
              detail.reportable_type_label || detail.reportable_type
            }}</ElTag>
          </ElDescriptionsItem>
          <ElDescriptionsItem label="对象ID">
            <span class="font-mono">{{ detail.reportable_id }}</span>
          </ElDescriptionsItem>
        </ElDescriptions>

        <!-- 评论快照 -->
        <div v-if="snapshotComment" class="mt-4 rounded border border-g-100 bg-white">
          <div class="px-3 py-2 border-b text-xs text-g-500">评论内容快照</div>
          <div class="p-3">
            <div class="mb-2 text-sm text-g-700">
              <span class="font-medium">{{ snapshotComment.username || '匿名' }}</span>
              <span class="ml-2 text-xs text-g-500">#{{ snapshotComment.user_id }}</span>
              <ElTag
                v-if="snapshotComment.status_label"
                class="ml-2"
                size="small"
                :type="mapTagType(snapshotComment.status === 'rejected' ? 'danger' : 'success')"
              >
                {{ snapshotComment.status_label }}
              </ElTag>
            </div>
            <div class="whitespace-pre-wrap text-g-800">{{
              snapshotComment.content || '（内容已删除）'
            }}</div>
          </div>
        </div>

        <!-- 用户快照 -->
        <div v-else-if="snapshotUser" class="mt-4 rounded border border-g-100 bg-white p-3">
          <div class="flex items-center gap-3">
            <ElImage
              v-if="snapshotUser.avatar"
              :src="snapshotUser.avatar"
              style="width: 48px; height: 48px; border-radius: 50%"
              fit="cover"
            />
            <div>
              <div class="font-medium">{{
                snapshotUser.nickname || snapshotUser.username || '匿名用户'
              }}</div>
              <div class="text-xs text-g-500">
                @{{ snapshotUser.username }} · 注册于 {{ snapshotUser.registered_at || '-' }}
              </div>
            </div>
            <ElTag
              v-if="snapshotUser.status_label"
              class="ml-auto"
              size="small"
              :type="mapTagType(snapshotUser.status === 0 ? 'danger' : 'success')"
            >
              {{ snapshotUser.status_label }}
            </ElTag>
          </div>
        </div>

        <template v-if="detail.process_actions && detail.process_actions.length > 0">
          <ElDivider content-position="left">已执行处置动作</ElDivider>
          <div class="flex flex-col gap-2">
            <div
              v-for="(action, idx) in detail.process_actions"
              :key="idx"
              class="flex items-center gap-2 px-3 py-2 rounded bg-g-50"
            >
              <ArtSvgIcon icon="ri:shield-check-line" class="text-primary" />
              <span class="font-medium">{{ actionTypeLabel(action.type) }}</span>
              <span v-if="action.duration !== undefined" class="text-xs text-g-500">
                （{{ action.duration === 0 ? '永久' : `${action.duration} 天` }}）
              </span>
              <span v-if="action.reason" class="text-xs text-g-500 ml-2"
                >- {{ action.reason }}</span
              >
            </div>
          </div>
          <div
            v-if="detail.process_remark"
            class="mt-2 px-3 py-2 rounded bg-g-50 text-sm text-g-700"
          >
            {{ detail.process_remark }}
          </div>
          <div class="mt-1 text-xs text-g-500">处理时间：{{ detail.processed_at || '-' }}</div>
        </template>
      </template>
    </div>

    <template #footer>
      <div class="flex justify-end gap-2">
        <ElButton @click="close">关闭</ElButton>
        <ElButton
          v-if="
            detail &&
            (detail.status === 'pending' || detail.status === 'processing') &&
            props.canHandle
          "
          type="primary"
          @click="handleProcess"
        >
          去处理
        </ElButton>
      </div>
    </template>
  </ElDialog>
</template>
