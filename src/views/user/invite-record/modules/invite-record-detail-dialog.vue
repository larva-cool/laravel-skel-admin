<template>
  <ElDialog
    v-model="dialogVisible"
    title="邀请记录详情"
    width="680px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <ElDescriptions v-loading="loading" :column="2" border class="mt-4">
      <ElDescriptionsItem label="记录 ID" :span="2">{{ record?.id ?? '—' }}</ElDescriptionsItem>

      <ElDescriptionsItem label="邀请人类型" :span="1">
        <ElTag
          v-if="record"
          size="small"
          effect="light"
          :type="record.inviter_type === 'admin' ? 'warning' : 'info'"
        >
          {{ morphLabel(record.inviter_type) }}
        </ElTag>
        <span v-else>—</span>
      </ElDescriptionsItem>
      <ElDescriptionsItem label="邀请人" :span="1">
        <template v-if="record">
          {{ record.inviter_name || '未命名' }}
          <span class="text-xs text-g-500">（#{{ record.inviter_id }}）</span>
        </template>
        <span v-else>—</span>
      </ElDescriptionsItem>

      <ElDescriptionsItem label="被邀请人类型" :span="1">
        <ElTag
          v-if="record"
          size="small"
          effect="light"
          :type="record.invitee_type === 'admin' ? 'warning' : 'info'"
        >
          {{ morphLabel(record.invitee_type) }}
        </ElTag>
        <span v-else>—</span>
      </ElDescriptionsItem>
      <ElDescriptionsItem label="被邀请人" :span="1">
        <template v-if="record">
          {{ record.invitee_name || '未命名' }}
          <span class="text-xs text-g-500">（#{{ record.invitee_id }}）</span>
        </template>
        <span v-else>—</span>
      </ElDescriptionsItem>

      <ElDescriptionsItem label="描述" :span="2">
        {{ record?.description || '—' }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="邀请时间" :span="2">
        {{ record?.created_at || '—' }}
      </ElDescriptionsItem>
    </ElDescriptions>

    <template #footer>
      <ElButton type="primary" @click="handleClose">关闭</ElButton>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import { fetchGetInviteRecordDetail } from '@/api/user-manage'
  import { ref } from 'vue'

  defineOptions({ name: 'InviteRecordDetailDialog' })

  type InviteRecordItem = Api.UserManage.InviteRecordItem

  const dialogVisible = ref(false)
  const loading = ref(false)
  const record = ref<InviteRecordItem | null>(null)

  const morphLabel = (type: 'user' | 'admin') => (type === 'admin' ? '管理员' : '前台用户')

  const open = async (row: InviteRecordItem) => {
    dialogVisible.value = true
    // 先用列表数据兜底展示，再拉取详情
    record.value = row
    loading.value = true
    try {
      record.value = await fetchGetInviteRecordDetail(row.id)
    } finally {
      loading.value = false
    }
  }

  const handleClose = () => {
    dialogVisible.value = false
    record.value = null
  }

  defineExpose({ open })
</script>

<style scoped lang="scss">
  .mt-4 {
    margin-top: 12px;
  }
</style>
