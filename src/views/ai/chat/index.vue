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
   * 新会话首轮消息发送完成。
   * 后端 stream_end 携带会话 ID 时直接选中；未携带时（Laravel AI 包在流结束后
   * 才异步生成标题并保存会话），轮询等待新会话出现在列表首位再选中。
   */
  const handleCreated = async (id: string): Promise<void> => {
    if (!sidebarRef.value) return
    if (id) {
      activeConversationId.value = id
      await sidebarRef.value.refresh()
      return
    }
    // 记录当前列表首条作为基准，新会话保存后首条会发生变化
    pollNewConversation(sidebarRef.value.firstConversationId ?? null, 0)
  }

  /** 轮询等待新会话出现（后端保存含 AI 标题生成，通常需要数秒） */
  const pollNewConversation = async (
    previousFirstId: string | null,
    attempt: number
  ): Promise<void> => {
    if (!sidebarRef.value) return
    const first = await sidebarRef.value.refresh(true)
    if (first && first.id !== previousFirstId) {
      activeConversationId.value = first.id
      activeConversationTitle.value = first.title || '新的对话'
      return
    }
    if (attempt < 8) {
      setTimeout(() => pollNewConversation(previousFirstId, attempt + 1), 1000)
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
