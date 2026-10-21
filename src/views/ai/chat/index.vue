<!-- AI 聊天：左侧会话列表 + 右侧会话窗口 -->
<template>
  <div class="page-content chat-page flex !p-0 max-md:flex-col">
    <!-- 左侧：会话列表 -->
    <ChatSidebar
      ref="sidebarRef"
      :active-id="activeConversationId"
      @select="handleSelect"
      @create="handleCreate"
      @deleted="handleDeleted"
    />

    <!-- 右侧：会话窗口 -->
    <ChatConversation
      :conversation-id="activeConversationId"
      :conversation-title="activeConversationTitle"
      @create="handleCreate"
      @created="handleCreated"
    />
  </div>
</template>

<script setup lang="ts">
  import ChatConversation from './modules/chat-conversation.vue'
  import ChatSidebar from './modules/chat-sidebar.vue'

  defineOptions({ name: 'AIChat' })

  const sidebarRef = ref<InstanceType<typeof ChatSidebar> | null>(null)

  /** 当前选中的会话（null 表示新对话） */
  const activeConversationId = ref<string | null>(null)
  const activeConversationTitle = ref('')

  /** 选中会话 */
  const handleSelect = (item: Api.Chat.ConversationItem): void => {
    activeConversationId.value = item.id
    activeConversationTitle.value = item.title || '新的对话'
  }

  /** 发起新对话 */
  const handleCreate = (): void => {
    activeConversationId.value = null
    activeConversationTitle.value = ''
  }

  /**
   * 新会话首轮消息发送完成：刷新会话列表。
   * 后端 stream_end 携带会话 ID 时直接选中，否则回退选中最新一条。
   */
  const handleCreated = async (id: string): Promise<void> => {
    if (!sidebarRef.value) return
    if (id) {
      activeConversationId.value = id
      await sidebarRef.value.refresh()
    } else {
      const first = await sidebarRef.value.refresh(true)
      if (first) {
        activeConversationId.value = first.id
        activeConversationTitle.value = first.title || '新的对话'
      }
    }
  }

  /** 会话被删除：若为当前会话则切回新对话 */
  const handleDeleted = (id: string): void => {
    if (activeConversationId.value === id) {
      handleCreate()
    }
  }
</script>

<style scoped>
  .chat-page {
    height: var(--art-full-height);
    min-height: var(--art-full-height);
  }
</style>
