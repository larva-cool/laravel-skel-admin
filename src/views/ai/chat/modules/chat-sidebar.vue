<!-- AI 聊天 - 会话列表侧边栏 -->
<template>
  <div
    class="chat-sidebar-panel relative box-border flex h-full w-90 flex-col p-5 max-md:h-42 max-md:w-full"
  >
    <span
      class="absolute top-0 right-0 bottom-0 hidden w-px bg-[var(--default-border)] md:block"
    ></span>

    <!-- 用户信息与搜索 -->
    <div class="pb-5 max-md:!hidden">
      <div class="flex-c gap-3">
        <ElAvatar :size="50" :src="userAvatar" />
        <div class="min-w-0">
          <div class="truncate text-base font-medium">{{ userName }}</div>
          <div class="mt-1 truncate text-xs text-g-500">{{ userEmail }}</div>
        </div>
      </div>
      <div class="mt-3 flex gap-2">
        <ElInput
          v-model="keyword"
          class="flex-1"
          placeholder="搜索会话"
          clearable
          :prefix-icon="Search"
        />
        <ElButton type="primary" title="新对话" @click="emit('create')">
          <ElIcon><Plus /></ElIcon>
        </ElButton>
      </div>
      <ElDropdown class="mt-5" @command="handleSortCommand">
        <span class="c-p flex-c text-sm whitespace-nowrap">
          {{ sortLabel }}
          <ElIcon class="el-icon--right"><ArrowDown /></ElIcon>
        </span>
        <template #dropdown>
          <ElDropdownMenu>
            <ElDropdownItem command="latest" :class="{ 'text-theme': sortOrder === 'latest' }"
              >最近</ElDropdownItem
            >
            <ElDropdownItem command="earliest" :class="{ 'text-theme': sortOrder === 'earliest' }"
              >最早</ElDropdownItem
            >
          </ElDropdownMenu>
        </template>
      </ElDropdown>
    </div>

    <!-- 会话列表 -->
    <div
      ref="listRef"
      class="chat-list-scroll min-h-0 flex-1 overflow-y-auto"
      @scroll="handleScroll"
    >
      <template v-if="filteredConversations.length">
        <div
          v-for="item in filteredConversations"
          :key="item.id"
          class="group flex-c mb-1 c-p rounded-lg p-3 tad-200 hover:bg-active-color/30"
          :class="{ 'bg-g-200/65': item.id === activeId }"
          @click="handleSelect(item)"
        >
          <div class="relative me-3 shrink-0">
            <ElAvatar :size="40" :src="aiAvatar" />
            <div class="absolute end-1 bottom-1 size-2 rounded-full bg-success/100"></div>
          </div>
          <div class="min-w-0 flex-1">
            <div class="flex-cb mb-1">
              <span class="truncate text-sm font-medium">{{ item.title || '新的对话' }}</span>
              <span class="ms-2 shrink-0 text-xs text-g-600">{{
                formatRelativeTime(item.updated_at)
              }}</span>
            </div>
            <div class="flex-cb">
              <span class="overflow-hidden text-xs whitespace-nowrap text-g-600 text-ellipsis">{{
                item.messages_count ? `${item.messages_count} 条消息` : 'AI 助手会话'
              }}</span>
              <ElIcon
                class="ms-2 shrink-0 text-g-600 opacity-0 tad-200 group-hover:opacity-100 hover:!text-danger"
                :size="14"
                title="删除会话"
                @click.stop="handleDelete(item)"
              >
                <Delete />
              </ElIcon>
            </div>
          </div>
        </div>
        <div v-if="loading" class="py-2 text-center text-xs text-g-500">加载中...</div>
        <div v-else-if="!hasMore && !keyword" class="py-2 text-center text-xs text-g-500">
          没有更多了
        </div>
      </template>
      <div v-else-if="!loading" class="py-10 text-center text-sm text-g-500">
        {{ keyword ? '未找到相关会话' : '暂无会话' }}
      </div>
      <div v-else class="py-10 text-center text-sm text-g-500">加载中...</div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { fetchDeleteConversation, fetchGetConversations } from '@/api/chat'
  import aiAvatar from '@/assets/images/avatar/ai.png'
  import defaultAvatar from '@/assets/images/avatar/avatar5.webp'
  import { useUserStore } from '@/store/modules/user'
  import { ArrowDown, Delete, Plus, Search } from '@element-plus/icons-vue'
  import { ElMessage, ElMessageBox } from 'element-plus'

  defineOptions({ name: 'ChatSidebar' })

  const props = defineProps<{
    /** 当前选中的会话 ID（null 表示新对话） */
    activeId: string | null
  }>()

  const emit = defineEmits<{
    /** 选中会话 */
    select: [item: Api.Chat.ConversationItem]
    /** 发起新对话 */
    create: []
    /** 会话被删除 */
    deleted: [id: string]
  }>()

  const PER_PAGE = 20
  const SCROLL_THRESHOLD = 30

  const userStore = useUserStore()
  const userName = computed(() => userStore.adminInfo?.user_name || '我')
  const userEmail = computed(() => userStore.adminInfo?.email || '')
  const userAvatar = computed(() => userStore.adminInfo?.avatar || defaultAvatar)

  // 列表状态
  const keyword = ref('')
  const conversations = ref<Api.Chat.ConversationItem[]>([])
  const loading = ref(false)
  const page = ref(1)
  const hasMore = ref(true)
  const listRef = ref<HTMLElement | null>(null)

  // 排序
  type SortOrder = 'latest' | 'earliest'
  const sortOrder = ref<SortOrder>('latest')
  const sortLabel = computed(() => (sortOrder.value === 'latest' ? '最近' : '最早'))

  const handleSortCommand = (command: SortOrder): void => {
    sortOrder.value = command
  }

  /** 过滤 + 排序后的会话列表（前端处理） */
  const filteredConversations = computed(() => {
    const kw = keyword.value.trim().toLowerCase()
    const list = kw
      ? conversations.value.filter((c) => (c.title || '').toLowerCase().includes(kw))
      : [...conversations.value]
    return list.sort((a, b) => {
      const ta = a.updated_at ? new Date(a.updated_at).getTime() : 0
      const tb = b.updated_at ? new Date(b.updated_at).getTime() : 0
      return sortOrder.value === 'latest' ? tb - ta : ta - tb
    })
  })

  /** 加载会话列表 */
  const loadConversations = async (reset = false): Promise<void> => {
    if (loading.value) return
    loading.value = true
    try {
      const targetPage = reset ? 1 : page.value
      const res = await fetchGetConversations({ page: targetPage, per_page: PER_PAGE })
      const list = res.data || []
      conversations.value = reset ? list : [...conversations.value, ...list]
      page.value = targetPage + 1
      hasMore.value = list.length >= PER_PAGE
    } catch {
      // 请求失败时 http 拦截器已统一提示
    } finally {
      loading.value = false
    }
  }

  /** 滚动到底部附近时加载更多 */
  const handleScroll = (): void => {
    const el = listRef.value
    if (!el || loading.value || !hasMore.value || keyword.value) return
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - SCROLL_THRESHOLD) {
      loadConversations()
    }
  }

  /** 选中会话 */
  const handleSelect = (item: Api.Chat.ConversationItem): void => {
    if (item.id === props.activeId) return
    emit('select', item)
  }

  /** 删除会话 */
  const handleDelete = async (item: Api.Chat.ConversationItem): Promise<void> => {
    try {
      await ElMessageBox.confirm(`确定删除会话「${item.title || '新的对话'}」吗？`, '删除确认', {
        type: 'warning',
        confirmButtonText: '删除',
        cancelButtonText: '取消'
      })
    } catch {
      return
    }
    try {
      await fetchDeleteConversation(item.id)
      conversations.value = conversations.value.filter((c) => c.id !== item.id)
      ElMessage.success('会话已删除')
      emit('deleted', item.id)
    } catch {
      // 请求失败时 http 拦截器已统一提示
    }
  }

  /** 相对时间：x分钟前 / x小时前 / x天前 / x周前 */
  const formatRelativeTime = (t: string | null): string => {
    if (!t) return ''
    const time = new Date(t).getTime()
    if (Number.isNaN(time)) return ''
    const diff = Date.now() - time
    const minutes = Math.floor(diff / 60000)
    if (minutes < 1) return '刚刚'
    if (minutes < 60) return `${minutes}分钟前`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}小时前`
    const days = Math.floor(hours / 24)
    if (days < 7) return `${days}天前`
    const weeks = Math.floor(days / 7)
    if (weeks < 5) return `${weeks}周前`
    return new Date(t).toLocaleDateString([], { month: '2-digit', day: '2-digit' })
  }

  /** 刷新列表，optionally 选中第一条 */
  const refresh = async (selectFirst = false): Promise<Api.Chat.ConversationItem | null> => {
    await loadConversations(true)
    if (selectFirst && conversations.value.length > 0) {
      return conversations.value[0]
    }
    return null
  }

  onMounted(() => {
    loadConversations(true)
  })

  defineExpose({ refresh })
</script>

<style scoped>
  .chat-list-scroll {
    scrollbar-width: none;
    -ms-overflow-style: none;
  }

  .chat-list-scroll::-webkit-scrollbar {
    display: none;
    width: 0;
    height: 0;
  }
</style>
