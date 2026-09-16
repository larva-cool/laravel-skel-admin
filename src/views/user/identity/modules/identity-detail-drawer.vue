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
    ElMessage,
    ElDivider
  } from 'element-plus'
  import ArtSvgIcon from '@/components/core/base/art-svg-icon/index.vue'
  import { fetchGetIdentityVerificationDetail } from '@/api/system-manage'

  interface Props {
    /** 是否可审核（控制底部通过/驳回按钮） */
    canReview?: boolean
  }

  const props = withDefaults(defineProps<Props>(), { canReview: false })

  type IdentityItem = Api.SystemManage.IdentityVerificationListItem

  const emit = defineEmits<{
    approve: [row: IdentityItem]
    reject: [row: IdentityItem]
    refresh: []
  }>()

  const visible = ref(false)
  const loading = ref(false)
  const detail = ref<IdentityItem | null>(null)

  const mapTagType = (t?: string) => {
    if (!t || t === 'default') return undefined
    return t as 'primary' | 'success' | 'warning' | 'danger' | 'info'
  }

  const statusMap: Record<string, string> = {
    pending: '待审核',
    review: '需复审',
    approved: '已通过',
    rejected: '已驳回'
  }
  const canAct = (s?: string) => s === 'pending' || s === 'review'

  const open = async (row: IdentityItem) => {
    detail.value = { ...row }
    visible.value = true
    loading.value = true
    try {
      const res = await fetchGetIdentityVerificationDetail(row.id)
      detail.value = res
    } catch {
      // 列表已乐观渲染，错误不关闭抽屉
    } finally {
      loading.value = false
    }
  }

  const close = () => {
    visible.value = false
    detail.value = null
  }

  const handleApprove = () => {
    if (!detail.value) return
    emit('approve', detail.value)
  }

  const handleReject = () => {
    if (!detail.value) return
    emit('reject', detail.value)
  }

  const copyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      ElMessage.success('已复制')
    } catch {
      ElMessage.error('复制失败')
    }
  }

  const renderAttachment = (label: string, att: Api.SystemManage.IdentityAttachment | null) => {
    return { label, att }
  }

  defineExpose({ open })
</script>

<template>
  <ElDrawer v-model="visible" size="860px" :destroy-on-close="true" :with-header="false">
    <div v-loading="loading" class="h-full flex flex-col">
      <!-- 自定义头部 -->
      <div
        class="shrink-0 flex items-start justify-between px-5 py-4 border-b border-[var(--el-border-color-lighter)]"
      >
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 mb-1">
            <h4 class="text-base font-semibold text-[var(--el-text-color-primary)] truncate">
              实名认证详情
            </h4>
            <ElTag
              v-if="detail?.type_label"
              :type="detail.type === 'personal' ? 'primary' : 'success'"
              size="small"
              effect="plain"
            >
              {{ detail.type_label }}
            </ElTag>
            <ElTag v-if="detail?.status" :type="mapTagType(detail.status_label_type)" size="small">
              {{ detail.status_label || statusMap[detail.status] }}
            </ElTag>
          </div>
          <div class="flex items-center gap-2 text-xs text-[var(--el-text-color-secondary)]">
            <span>ID：{{ detail?.id }}</span>
            <span>·</span>
            <span>提交时间：{{ detail?.submitted_at || detail?.created_at }}</span>
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
          <!-- 申请人信息 -->
          <div class="mb-5">
            <div class="mb-2 text-sm font-medium text-[var(--el-text-color-primary)]"
              >申请人信息</div
            >
            <ElDescriptions :column="2" border size="small">
              <ElDescriptionsItem label="用户 ID">{{ detail.verifiable_id }}</ElDescriptionsItem>
              <ElDescriptionsItem label="昵称">
                {{ detail.verifiable?.name || '-' }}
              </ElDescriptionsItem>
            </ElDescriptions>
          </div>

          <!-- 个人认证字段 -->
          <template v-if="detail.type === 'personal'">
            <div class="mb-5">
              <div class="mb-2 text-sm font-medium text-[var(--el-text-color-primary)]"
                >个人资料</div
              >
              <ElDescriptions :column="2" border size="small">
                <ElDescriptionsItem label="真实姓名">{{
                  detail.real_name || '-'
                }}</ElDescriptionsItem>
                <ElDescriptionsItem label="身份证号">
                  <span v-if="detail.id_card_no" class="flex items-center gap-1 font-mono">
                    {{ detail.id_card_no }}
                    <el-button link size="small" @click="copyText(detail.id_card_no!)">
                      <ArtSvgIcon icon="ri:file-copy-line" class="text-xs" />
                    </el-button>
                  </span>
                  <span v-else>-</span>
                </ElDescriptionsItem>
              </ElDescriptions>
            </div>

            <div class="mb-5">
              <div class="mb-2 text-sm font-medium text-[var(--el-text-color-primary)]"
                >证件照片</div
              >
              <div class="grid grid-cols-3 gap-3">
                <div
                  v-for="item in [
                    renderAttachment('身份证人像面', detail.id_card_front),
                    renderAttachment('身份证国徽面', detail.id_card_back),
                    renderAttachment('手持身份证', detail.handheld)
                  ]"
                  :key="item.label"
                >
                  <div class="text-xs text-g-500 mb-1">{{ item.label }}</div>
                  <ElImage
                    v-if="item.att"
                    :src="item.att.url"
                    :preview-src-list="[item.att.url]"
                    fit="cover"
                    class="w-full h-32 rounded-md overflow-hidden border border-[var(--el-border-color-lighter)] cursor-zoom-in"
                    preview-teleported
                  />
                  <div
                    v-else
                    class="w-full h-32 rounded-md border border-dashed border-[var(--el-border-color-lighter)] flex items-center justify-center text-xs text-g-400"
                  >
                    未上传
                  </div>
                </div>
              </div>
            </div>
          </template>

          <!-- 企业认证字段 -->
          <template v-else>
            <div class="mb-5">
              <div class="mb-2 text-sm font-medium text-[var(--el-text-color-primary)]"
                >企业资料</div
              >
              <ElDescriptions :column="2" border size="small">
                <ElDescriptionsItem label="企业名称" :span="2">
                  {{ detail.company_name || '-' }}
                </ElDescriptionsItem>
                <ElDescriptionsItem label="统一社会信用代码">
                  <span v-if="detail.credit_code" class="flex items-center gap-1 font-mono">
                    {{ detail.credit_code }}
                    <el-button link size="small" @click="copyText(detail.credit_code!)">
                      <ArtSvgIcon icon="ri:file-copy-line" class="text-xs" />
                    </el-button>
                  </span>
                  <span v-else>-</span>
                </ElDescriptionsItem>
                <ElDescriptionsItem label="法人姓名">
                  {{ detail.legal_person_name || '-' }}
                </ElDescriptionsItem>
                <ElDescriptionsItem label="法人身份证号" :span="2">
                  <span
                    v-if="detail.legal_person_id_card_no"
                    class="flex items-center gap-1 font-mono"
                  >
                    {{ detail.legal_person_id_card_no }}
                    <el-button link size="small" @click="copyText(detail.legal_person_id_card_no!)">
                      <ArtSvgIcon icon="ri:file-copy-line" class="text-xs" />
                    </el-button>
                  </span>
                  <span v-else>-</span>
                </ElDescriptionsItem>
                <ElDescriptionsItem label="对公账户">
                  {{ detail.bank_account || '-' }}
                </ElDescriptionsItem>
                <ElDescriptionsItem label="开户行">
                  {{ detail.bank_name || '-' }}
                </ElDescriptionsItem>
              </ElDescriptions>
            </div>

            <div class="mb-5">
              <div class="mb-2 text-sm font-medium text-[var(--el-text-color-primary)]"
                >资质材料</div
              >
              <div class="grid grid-cols-2 gap-3">
                <div
                  v-for="item in [
                    renderAttachment('营业执照', detail.business_license),
                    renderAttachment('开户许可证', detail.opening_permit)
                  ]"
                  :key="item.label"
                >
                  <div class="text-xs text-g-500 mb-1">{{ item.label }}</div>
                  <ElImage
                    v-if="item.att"
                    :src="item.att.url"
                    :preview-src-list="[item.att.url]"
                    fit="cover"
                    class="w-full h-40 rounded-md overflow-hidden border border-[var(--el-border-color-lighter)] cursor-zoom-in"
                    preview-teleported
                  />
                  <div
                    v-else
                    class="w-full h-40 rounded-md border border-dashed border-[var(--el-border-color-lighter)] flex items-center justify-center text-xs text-g-400"
                  >
                    未上传
                  </div>
                </div>
              </div>
            </div>
          </template>

          <ElDivider />

          <!-- 审核信息 -->
          <div class="mb-2">
            <div class="mb-2 text-sm font-medium text-[var(--el-text-color-primary)]">审核信息</div>
            <ElDescriptions :column="2" border size="small">
              <ElDescriptionsItem label="审核管理员">
                {{ detail.admin_name || '未审核' }}
              </ElDescriptionsItem>
              <ElDescriptionsItem label="审核时间">
                {{ detail.reviewed_at || '-' }}
              </ElDescriptionsItem>
              <ElDescriptionsItem label="认证有效期">
                {{ detail.expires_at || '-' }}
              </ElDescriptionsItem>
              <ElDescriptionsItem label="驳回原因">
                <ElTag
                  v-if="detail.reject_reason"
                  :type="mapTagType(detail.reject_reason_label_type)"
                  size="small"
                >
                  {{ detail.reject_reason_label || detail.reject_reason }}
                </ElTag>
                <span v-else>-</span>
              </ElDescriptionsItem>
              <ElDescriptionsItem v-if="detail.reject_remark" label="驳回备注" :span="2">
                {{ detail.reject_remark }}
              </ElDescriptionsItem>
            </ElDescriptions>
          </div>

          <ElEmpty v-if="!loading && !detail" description="暂无数据" />
        </template>
      </div>

      <!-- 底部操作区 -->
      <div
        class="shrink-0 flex items-center justify-end gap-2 px-5 py-3 border-t border-[var(--el-border-color-lighter)] bg-[var(--el-bg-color)]"
      >
        <ElButton @click="close">关闭</ElButton>
        <template v-if="props.canReview && canAct(detail?.status)">
          <ElButton type="danger" plain @click="handleReject">
            <ArtSvgIcon icon="ri:close-circle-line" class="mr-1" />驳回
          </ElButton>
          <ElButton type="primary" @click="handleApprove">
            <ArtSvgIcon icon="ri:check-double-line" class="mr-1" />审核通过
          </ElButton>
        </template>
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
