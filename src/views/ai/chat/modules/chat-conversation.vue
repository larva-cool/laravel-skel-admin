<!-- AI 聊天 - 会话窗口 -->
<template>
  <div class="box-border flex h-full min-w-0 flex-1 flex-col">
    <!-- 头部 -->
    <div class="flex-cb mb-5 px-4 pt-4 pb-0">
      <div class="min-w-0">
        <span class="truncate text-base font-medium">{{ headerTitle }}</span>
        <div class="mt-1.5 flex-c gap-1">
          <div
            class="h-2 w-2 rounded-full"
            :class="isStreaming ? 'animate-pulse bg-warning' : 'bg-success/100'"
          ></div>
          <span class="text-xs text-g-600">{{ isStreaming ? '思考中...' : '在线' }}</span>
        </div>
      </div>
      <div class="flex-c gap-2">
        <ElTooltip content="新对话" placement="bottom">
          <div
            class="flex-cc size-8.5 c-p rounded-full text-xl text-g-600 tad-300 hover:bg-hover-color"
            @click="emit('create')"
          >
            <ArtSvgIcon icon="ri:add-line" />
          </div>
        </ElTooltip>
      </div>
    </div>

    <div class="flex min-h-0 flex-1 flex-col">
      <!-- 聊天消息区域 -->
      <div ref="messageContainer" class="chat-scroll flex-1 overflow-y-auto border-t-d px-4 py-7.5">
        <!-- 空状态 / 快捷问题 -->
        <div
          v-if="messages.length === 0 && !isStreaming && !loadError && !loadingMessages"
          class="flex h-full flex-col items-center justify-center text-center"
        >
          <img :src="aiAvatar" class="h-14 w-14 rounded-full" />
          <p class="mt-3 text-sm font-medium">你好！我是你的AI助手，有什么我可以帮你的吗？</p>
          <div class="mt-5 flex flex-wrap justify-center gap-2">
            <ElButton v-for="q in quickQuestions" :key="q" size="small" @click="fillAndSend(q)">{{
              q
            }}</ElButton>
          </div>
        </div>

        <!-- 消息加载中 -->
        <div
          v-if="loadingMessages"
          class="flex h-full items-center justify-center text-sm text-g-500"
        >
          消息加载中...
        </div>

        <!-- 错误状态 -->
        <div v-if="loadError" class="flex h-full flex-col items-center justify-center text-center">
          <p class="text-sm text-danger">{{ loadError }}</p>
          <ElButton size="small" class="mt-3" @click="loadConversation()">重试</ElButton>
        </div>

        <template v-for="message in messages" :key="message.id">
          <div
            v-if="!isMessagePlaceholder(message)"
            :class="[
              'mb-7.5 flex w-full items-start gap-2',
              message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
            ]"
          >
            <ElAvatar
              :size="32"
              :src="message.role === 'user' ? meAvatar : aiAvatar"
              class="shrink-0"
            />
            <div
              :class="[
                'flex max-w-[70%] flex-col',
                message.role === 'user' ? 'items-end' : 'items-start'
              ]"
            >
              <div
                :class="[
                  'mb-1 flex gap-2 text-xs',
                  message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                ]"
              >
                <span class="font-medium">{{ message.role === 'user' ? userName : BOT_NAME }}</span>
                <span class="text-g-600">{{ formatTime(message.created_at) }}</span>
              </div>

              <!-- 工具调用记录 -->
              <div
                v-if="message.toolCalls && message.toolCalls.length"
                class="mb-2 w-full space-y-1"
              >
                <div
                  v-for="tc in message.toolCalls"
                  :key="tc.id"
                  class="flex-c gap-1.5 rounded bg-g-200/60 px-2.5 py-1 text-xs text-g-700"
                >
                  <ElIcon><Tools /></ElIcon>
                  <span class="font-medium">{{ toolLabel(tc.name) }}</span>
                </div>
              </div>

              <!-- 图片附件 -->
              <div
                v-if="message.attachments && message.attachments.length"
                class="mb-1.5 flex flex-wrap gap-1.5"
                :class="message.role === 'user' ? 'justify-end' : 'justify-start'"
              >
                <ElImage
                  v-for="(attachment, index) in message.attachments"
                  :key="index"
                  :src="attachment.url"
                  :preview-src-list="message.attachments.map((a) => a.url)"
                  :initial-index="index"
                  fit="cover"
                  class="size-20 rounded-md border border-g-300"
                  preview-teleported
                />
              </div>

              <!-- 文本气泡 -->
              <div
                v-if="message.content"
                :class="[
                  'rounded-md px-3.5 py-2.5 text-sm leading-[1.4] break-words whitespace-pre-wrap text-g-900',
                  message.role === 'user'
                    ? 'message-right bg-theme/15'
                    : 'message-left bg-active-color'
                ]"
              >
                {{ message.content }}
                <span
                  v-if="message.streaming"
                  class="ml-0.5 inline-block h-3.5 w-1.5 animate-pulse bg-g-500 align-middle"
                ></span>
              </div>

              <!-- 工具结果（成功/失败） -->
              <div
                v-if="message.toolResults && message.toolResults.length"
                class="mt-2 w-full space-y-1.5"
              >
                <div
                  v-for="tr in message.toolResults"
                  :key="tr.id"
                  :class="[
                    'rounded border-l-2 bg-g-100/60 px-2.5 py-1.5 text-xs',
                    !tr.denied && tr.successful ? 'border-success/70' : 'border-danger/70'
                  ]"
                >
                  <div class="flex-c gap-1.5">
                    <ElIcon v-if="tr.denied" class="text-danger"><CircleClose /></ElIcon>
                    <ElIcon v-else-if="tr.successful" class="text-success"><CircleCheck /></ElIcon>
                    <ElIcon v-else class="text-danger"><CircleClose /></ElIcon>
                    <span class="font-medium">{{ toolLabel(tr.name) }}</span>
                    <span class="text-g-500">{{
                      tr.denied ? '已拒绝' : tr.successful ? '执行成功' : '执行失败'
                    }}</span>
                  </div>
                  <div v-if="tr.error" class="mt-0.5 break-words text-danger">{{ tr.error }}</div>
                </div>
              </div>

              <!-- 待审批卡片 -->
              <div
                v-if="message.pendingApprovals && message.pendingApprovals.length"
                class="approval-card mt-2 w-full rounded-md border border-warning/40 bg-warning/5 p-3"
              >
                <div class="flex-c gap-1.5 text-warning">
                  <ElIcon><WarningFilled /></ElIcon>
                  <span class="text-xs font-medium">需要您的确认</span>
                </div>
                <div v-for="approval in message.pendingApprovals" :key="approval.id" class="mt-2">
                  <p class="text-xs text-g-700">
                    <span class="font-medium">{{ toolLabel(approval.tool) }}</span>
                  </p>
                  <p
                    v-if="approval.reason"
                    class="mt-1 rounded bg-white/70 p-2 text-xs leading-relaxed whitespace-pre-wrap text-g-800"
                    >{{ approval.reason }}</p
                  >
                  <details v-if="Object.keys(approval.arguments).length" class="mt-1.5">
                    <summary class="c-p text-[11px] text-g-500 hover:text-theme">参数详情</summary>
                    <pre
                      class="mt-1 max-h-40 overflow-auto rounded bg-white/80 p-2 text-[11px] text-g-700"
                      >{{ JSON.stringify(approval.arguments, null, 2) }}</pre>
                  </details>
                  <div v-if="!message.approvalResolved" class="mt-2.5 flex gap-2">
                    <ElButton
                      type="primary"
                      size="small"
                      :loading="approvingId === approval.id"
                      @click="resolveApproval(approval.id, true)"
                      >批准执行</ElButton
                    >
                    <ElButton
                      size="small"
                      :loading="approvingId === approval.id"
                      @click="resolveApproval(approval.id, false)"
                      >拒绝</ElButton
                    >
                  </div>
                  <div v-else class="mt-1.5 text-xs">
                    <ElTag
                      :type="message.approvalResolved === 'approved' ? 'success' : 'danger'"
                      size="small"
                      >{{ message.approvalResolved === 'approved' ? '已批准' : '已拒绝' }}</ElTag
                    >
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>

        <!-- AI 等待中：仅当存在空的占位 streaming 消息时显示 -->
        <div
          v-if="isStreaming && messages.some((m) => isMessagePlaceholder(m))"
          class="mb-7.5 flex w-full items-start gap-2"
        >
          <ElAvatar :size="32" :src="aiAvatar" class="shrink-0" />
          <div class="flex max-w-[70%] flex-col items-start">
            <div class="mb-1 flex gap-2 text-xs">
              <span class="font-medium">{{ BOT_NAME }}</span>
            </div>
            <div class="flex items-center gap-1 rounded-md bg-g-300/50 px-3.5 py-3">
              <span
                class="h-1.5 w-1.5 animate-bounce rounded-full bg-g-500"
                style="animation-delay: 0ms"
              ></span>
              <span
                class="h-1.5 w-1.5 animate-bounce rounded-full bg-g-500"
                style="animation-delay: 150ms"
              ></span>
              <span
                class="h-1.5 w-1.5 animate-bounce rounded-full bg-g-500"
                style="animation-delay: 300ms"
              ></span>
            </div>
          </div>
        </div>
      </div>

      <!-- 聊天输入区域 -->
      <div class="p-4">
        <!-- 待发送图片预览 -->
        <div v-if="pendingImages.length" class="mb-2 flex flex-wrap gap-2">
          <div v-for="(img, index) in pendingImages" :key="index" class="relative size-16">
            <img
              :src="img.url"
              class="size-16 rounded-md border border-g-300 object-cover"
              :class="{ 'opacity-50': img.uploading }"
            />
            <div v-if="img.uploading" class="absolute inset-0 flex-cc">
              <ElIcon class="is-loading text-g-700" :size="18"><Loading /></ElIcon>
            </div>
            <ElIcon
              v-else
              class="absolute -top-1.5 -right-1.5 c-p rounded-full bg-g-700/70 p-0.5 text-white hover:!bg-danger"
              :size="14"
              @click="pendingImages.splice(index, 1)"
              ><Close
            /></ElIcon>
          </div>
        </div>

        <ElInput
          v-model="messageText"
          type="textarea"
          :rows="3"
          placeholder="输入消息，Shift+Enter 换行，可粘贴图片"
          resize="none"
          :disabled="isStreaming"
          @keyup.enter.exact.prevent="sendMessage"
          @paste="handlePaste"
        />

        <div class="mt-3 flex-cb">
          <div class="flex-c gap-1">
            <!-- 上传图片 -->
            <ElTooltip content="上传图片" placement="top">
              <div
                class="flex-cc size-8.5 c-p rounded-full text-lg text-g-600 tad-300 hover:bg-hover-color"
                @click="fileInputRef?.click()"
              >
                <ArtSvgIcon icon="ri:attachment-2" />
              </div>
            </ElTooltip>
            <input
              ref="fileInputRef"
              type="file"
              accept="image/*"
              multiple
              class="hidden"
              @change="handleFileChange"
            />

            <!-- 智能体选择 -->
            <ElDropdown trigger="click" @command="(key: string) => (selectedAgent = key)">
              <span
                class="flex-c c-p rounded-md px-2 py-1.5 text-xs text-g-600 tad-300 hover:bg-hover-color"
              >
                {{ currentAgentName }}
                <ElIcon class="ms-0.5"><ArrowDown /></ElIcon>
              </span>
              <template #dropdown>
                <ElDropdownMenu>
                  <ElDropdownItem
                    v-for="agent in metaAgents"
                    :key="agent.key"
                    :command="agent.key"
                    :class="{ 'text-theme': agent.key === selectedAgent }"
                    >{{ agent.name }}</ElDropdownItem
                  >
                </ElDropdownMenu>
              </template>
            </ElDropdown>

            <!-- 模型选择 -->
            <ElDropdown
              v-if="metaModels.length"
              trigger="click"
              @command="(id: string) => (selectedModel = id)"
            >
              <span
                class="flex-c c-p rounded-md px-2 py-1.5 text-xs text-g-600 tad-300 hover:bg-hover-color"
              >
                {{ currentModelName }}
                <ElIcon class="ms-0.5"><ArrowDown /></ElIcon>
              </span>
              <template #dropdown>
                <ElDropdownMenu>
                  <ElDropdownItem
                    v-for="model in metaModels"
                    :key="model.id"
                    :command="model.id"
                    :class="{ 'text-theme': model.id === selectedModel }"
                    >{{ model.name }}</ElDropdownItem
                  >
                </ElDropdownMenu>
              </template>
            </ElDropdown>
          </div>

          <ElButton
            type="primary"
            circle
            class="!size-10"
            :loading="isStreaming"
            :disabled="!canSend"
            @click="sendMessage"
          >
            <ArtSvgIcon icon="ri:send-plane-fill" class="text-base" />
          </ElButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import type { PendingApproval } from '@/api/chat'
  import {
    fetchChatApprove,
    fetchChatMeta,
    fetchChatStream,
    fetchGetConversation,
    fetchUploadChatFile
  } from '@/api/chat'
  import aiAvatar from '@/assets/images/avatar/ai.png'
  import defaultAvatar from '@/assets/images/avatar/avatar5.webp'
  import { useUserStore } from '@/store/modules/user'
  import {
    ArrowDown,
    Check as CircleCheck,
    Close,
    Close as CircleClose,
    Loading,
    Tools,
    WarningFilled
  } from '@element-plus/icons-vue'
  import { ElMessage } from 'element-plus'

  defineOptions({ name: 'ChatConversation' })

  type ApprovalStatus = 'approved' | 'rejected'

  interface ToolCallRecord {
    id: string
    name: string
    arguments: Record<string, unknown>
  }

  interface ToolResultRecord {
    id: string
    name: string
    result: unknown
    successful: boolean
    denied?: boolean
    error?: string | null
  }

  interface ChatMessage {
    id: string
    role: 'user' | 'assistant'
    content: string
    created_at: string | null
    streaming?: boolean
    attachments?: Api.Chat.MessageAttachment[]
    toolCalls?: ToolCallRecord[]
    toolResults?: ToolResultRecord[]
    pendingApprovals?: PendingApproval[]
    approvalResolved?: ApprovalStatus
  }

  const props = defineProps<{
    /** 当前会话 ID（null 表示新对话） */
    conversationId: string | null
    /** 当前会话标题（用于头部展示） */
    conversationTitle?: string
  }>()

  const emit = defineEmits<{
    /** 发起新对话 */
    create: []
    /** 新会话已创建（首轮消息发送完成） */
    created: [id: string]
  }>()

  // 常量定义
  const SCROLL_DELAY = 80
  const MAX_IMAGES = 4
  const quickQuestions = ['介绍一下系统功能', '怎么创建管理员？', '如何配置邮件？']

  // 工具名中文映射
  const TOOL_LABELS: Record<string, string> = {
    list_users: '查询用户列表',
    get_user: '查询用户详情',
    set_user_status: '修改用户状态',
    adjust_user_balance: '调整用户余额',
    reset_user_password: '重置用户密码',
    get_setting: '查询系统配置',
    set_setting: '修改系统配置',
    get_dashboard_stats: '查询数据概览'
  }
  const toolLabel = (name: string): string => TOOL_LABELS[name] || name

  // 用户信息
  const userStore = useUserStore()
  const userName = computed(() => userStore.adminInfo?.user_name || '我')
  const meAvatar = computed(() => userStore.adminInfo?.avatar || defaultAvatar)

  // 元数据（智能体 / 模型）
  const metaAgents = ref<Api.Chat.AgentOption[]>([{ key: 'assistant', name: '系统管理助手' }])
  const metaModels = ref<Api.Chat.ModelOption[]>([])
  const selectedAgent = ref('assistant')
  const selectedModel = ref('')

  const currentAgentName = computed(
    () => metaAgents.value.find((a) => a.key === selectedAgent.value)?.name || '系统管理助手'
  )
  const currentModelName = computed(
    () => metaModels.value.find((m) => m.id === selectedModel.value)?.name || '默认模型'
  )
  /** AI 助手展示名（跟随当前选择的智能体） */
  const BOT_NAME = computed(() => currentAgentName.value)

  /** 加载可用智能体与模型列表 */
  const loadMeta = async (): Promise<void> => {
    try {
      const meta = await fetchChatMeta()
      metaAgents.value = meta.agents
      metaModels.value = meta.models
      selectedModel.value = meta.default_model
      if (!meta.agents.some((a) => a.key === selectedAgent.value)) {
        selectedAgent.value = meta.agents[0]?.key || 'assistant'
      }
    } catch {
      // 元数据加载失败时使用默认值，不影响聊天主流程
    }
  }

  // 图片附件
  interface PendingImage {
    /** 上传成功后的附件 ID */
    id?: number
    /** 预览地址（上传中用本地 blob） */
    url: string
    uploading: boolean
  }
  const pendingImages = ref<PendingImage[]>([])
  const fileInputRef = ref<HTMLInputElement | null>(null)

  /** 上传单张图片到附件库 */
  const uploadImage = async (file: File): Promise<void> => {
    if (pendingImages.value.length >= MAX_IMAGES) {
      ElMessage.warning(`最多上传 ${MAX_IMAGES} 张图片`)
      return
    }
    const item: PendingImage = { url: URL.createObjectURL(file), uploading: true }
    pendingImages.value.push(item)
    try {
      const res = await fetchUploadChatFile(file)
      item.id = res.id
      if (res.url) item.url = res.url
    } catch {
      // 上传失败时移除该图片，http 拦截器已统一提示
      pendingImages.value = pendingImages.value.filter((i) => i !== item)
    } finally {
      item.uploading = false
    }
  }

  /** 选择文件上传 */
  const handleFileChange = (e: Event): void => {
    const files = (e.target as HTMLInputElement).files
    if (files) Array.from(files).slice(0, MAX_IMAGES).forEach(uploadImage)
    if (fileInputRef.value) fileInputRef.value.value = ''
  }

  /** 粘贴图片上传 */
  const handlePaste = (e: ClipboardEvent): void => {
    const files = Array.from(e.clipboardData?.files || []).filter((f) =>
      f.type.startsWith('image/')
    )
    if (files.length) {
      e.preventDefault()
      files.slice(0, MAX_IMAGES).forEach(uploadImage)
    }
  }

  /** 是否可发送 */
  const canSend = computed(
    () => !!messageText.value.trim() && !pendingImages.value.some((i) => i.uploading)
  )

  // 头部展示
  const headerTitle = computed(
    () =>
      props.conversationTitle ||
      (props.conversationId ? '' : currentAgentName.value) ||
      currentAgentName.value
  )

  // 组件状态
  const isStreaming = ref(false)
  const loadError = ref('')
  const loadingMessages = ref(false)
  const approvingId = ref<string | null>(null)

  // 消息相关状态
  const messageText = ref('')
  const messageContainer = ref<HTMLElement | null>(null)
  const messages = ref<ChatMessage[]>([])

  /** 判断是否是「占位」的空 streaming assistant 消息 */
  const isMessagePlaceholder = (m: ChatMessage): boolean => {
    if (!m.streaming || m.role !== 'assistant') return false
    return (
      !m.content &&
      (!m.toolCalls || m.toolCalls.length === 0) &&
      (!m.toolResults || m.toolResults.length === 0) &&
      (!m.pendingApprovals || m.pendingApprovals.length === 0)
    )
  }

  // 本地 id 生成器
  let localMsgSeq = 1
  const genLocalId = () => `local-${Date.now()}-${localMsgSeq++}`

  const formatCurrentTime = (): string => {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const formatTime = (t: string | null): string => {
    if (!t) return formatCurrentTime()
    const d = new Date(t)
    if (Number.isNaN(d.getTime())) return formatCurrentTime()
    const now = new Date()
    const sameDay = d.toDateString() === now.toDateString()
    return sameDay
      ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : d.toLocaleString([], {
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        })
  }

  const scrollToBottom = (): void => {
    nextTick(() => {
      setTimeout(() => {
        if (messageContainer.value) {
          messageContainer.value.scrollTop = messageContainer.value.scrollHeight
        }
      }, SCROLL_DELAY)
    })
  }

  /** 加载指定会话的消息记录（silent 时不打断当前展示，加载完成后静默替换） */
  const loadConversation = async (silent = false): Promise<void> => {
    if (!props.conversationId) {
      messages.value = []
      loadError.value = ''
      return
    }
    loadError.value = ''
    if (!silent) loadingMessages.value = true
    try {
      const detail = await fetchGetConversation(props.conversationId)
      messages.value = detail.messages.map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        created_at: m.created_at,
        attachments: (m.attachments || []).map((a) => ({ type: a.type, url: a.url })),
        toolCalls: (m.tool_calls || []).map((tc) => ({
          id: tc.id,
          name: tc.name,
          arguments: tc.arguments
        })),
        toolResults: (m.tool_results || []).map((tr) => ({
          id: tr.id,
          name: tr.name,
          result: tr.result,
          // 存储结构中无 successful 字段：denied 为 true 表示被拒绝/失败，否则视为成功
          successful: tr.successful ?? !tr.denied,
          denied: !!tr.denied,
          error: tr.error ?? null
        }))
      }))
      scrollToBottom()
    } catch (e: any) {
      loadError.value = e?.message || '消息加载失败'
    } finally {
      loadingMessages.value = false
    }
  }

  /** 发起一次流式对话（首次提问或审批续跑共用），返回是否成功 */
  const runStream = async (
    requester: () => Promise<void>,
    options: { pendingAssistantId: string }
  ): Promise<boolean> => {
    isStreaming.value = true
    try {
      await requester()
      return true
    } catch (e: any) {
      ElMessage.error(e?.message || '请求失败，请重试')
      const m = messages.value.find((x) => x.id === options.pendingAssistantId)
      if (m) m.streaming = false
      return false
    } finally {
      isStreaming.value = false
      scrollToBottom()
    }
  }

  /** 通用 SSE 事件处理：基于当前 assistant 消息增量更新 */
  const bindStreamHandlers = (assistantId: string) => ({
    onTextDelta: (delta: string) => {
      const m = messages.value.find((x) => x.id === assistantId)
      if (m) m.content += delta
      scrollToBottom()
    },
    onToolCall: (toolName: string, args: Record<string, unknown>) => {
      const m = messages.value.find((x) => x.id === assistantId)
      if (!m) return
      const id = (args?.id as string) || `${toolName}-${Date.now()}`
      m.toolCalls = [...(m.toolCalls || []), { id, name: toolName, arguments: args }]
      scrollToBottom()
    },
    onToolResult: (
      toolName: string,
      result: unknown,
      meta: { successful: boolean; denied: boolean; error: string | null }
    ) => {
      const m = messages.value.find((x) => x.id === assistantId)
      if (!m) return
      m.toolResults = [
        ...(m.toolResults || []),
        {
          id: `${toolName}-result-${Date.now()}`,
          name: toolName,
          result,
          successful: meta.successful,
          denied: meta.denied,
          error: meta.error
        }
      ]
      scrollToBottom()
    },
    onApprovalRequest: (approvals: PendingApproval[]) => {
      const m = messages.value.find((x) => x.id === assistantId)
      if (m) m.pendingApprovals = approvals
      scrollToBottom()
    },
    onDone: (data: { conversationId: string | null }) => {
      const m = messages.value.find((x) => x.id === assistantId)
      if (m) m.streaming = false
      // 后端在 stream_end 中携带会话 ID 时直接同步给父组件
      if (!props.conversationId && data.conversationId) {
        emit('created', data.conversationId)
      }
      scrollToBottom()
    },
    onError: (msg: string) => {
      ElMessage.error(msg)
      const m = messages.value.find((x) => x.id === assistantId)
      if (m) m.streaming = false
    }
  })

  /** 发送消息 */
  const sendMessage = async (): Promise<void> => {
    const text = messageText.value.trim()
    if (!text || isStreaming.value) return
    if (pendingImages.value.some((i) => i.uploading)) return

    const userMsg: ChatMessage = {
      id: genLocalId(),
      role: 'user',
      content: text,
      created_at: new Date().toISOString(),
      attachments: pendingImages.value.map((i) => ({ type: 'image', url: i.url }))
    }
    messages.value.push(userMsg)

    // 预创建空的 assistant 消息，用于承载流式内容
    const assistantId = genLocalId()
    messages.value.push({
      id: assistantId,
      role: 'assistant',
      content: '',
      created_at: new Date().toISOString(),
      streaming: true,
      toolCalls: [],
      toolResults: []
    })

    const attachmentIds = pendingImages.value.map((i) => i.id!).filter(Boolean)
    messageText.value = ''
    pendingImages.value = []
    scrollToBottom()

    const isNewConversation = !props.conversationId
    const handlers = bindStreamHandlers(assistantId)

    // SSE 内部错误（HTTP 4xx/5xx、error 事件）不抛异常，单独记录以避免误触发列表轮询
    let sawStreamError = false
    const rawOnError = handlers.onError
    handlers.onError = (msg: string) => {
      sawStreamError = true
      rawOnError?.(msg)
    }

    const succeeded = await runStream(
      () =>
        fetchChatStream(
          {
            prompt: text,
            conversation_id: props.conversationId,
            agent: selectedAgent.value,
            model: selectedModel.value || undefined,
            attachment_ids: attachmentIds.length ? attachmentIds : undefined
          },
          handlers
        ),
      { pendingAssistantId: assistantId }
    )

    // SSE 流完整消费后，后端已完成会话保存（RememberConversation 在流末尾执行），
    // 此时通知父组件刷新会话列表即可命中新会话
    if (succeeded && !sawStreamError && isNewConversation) {
      emit('created', '')
    }
  }

  /** 处理审批 */
  const resolveApproval = async (approvalId: string, approved: boolean): Promise<void> => {
    if (!props.conversationId) {
      ElMessage.error('会话 ID 缺失，无法处理审批')
      return
    }
    approvingId.value = approvalId

    // 找到包含该审批的消息
    const target = messages.value.find((m) => m.pendingApprovals?.some((a) => a.id === approvalId))
    if (target) target.approvalResolved = approved ? 'approved' : 'rejected'

    // 续跑：新增一条空 assistant 消息承载后续流式内容
    const assistantId = genLocalId()
    messages.value.push({
      id: assistantId,
      role: 'assistant',
      content: '',
      created_at: new Date().toISOString(),
      streaming: true,
      toolCalls: [],
      toolResults: []
    })
    scrollToBottom()

    const handlers = bindStreamHandlers(assistantId)
    isStreaming.value = true

    try {
      await fetchChatApprove(
        {
          conversation_id: props.conversationId,
          approval_id: approvalId,
          approved,
          agent: selectedAgent.value,
          model: selectedModel.value || undefined
        },
        handlers
      )
    } catch (e: any) {
      ElMessage.error(e?.message || '审批请求失败')
      const m = messages.value.find((x) => x.id === assistantId)
      if (m) m.streaming = false
      if (target) target.approvalResolved = undefined
    } finally {
      isStreaming.value = false
      approvingId.value = null
      scrollToBottom()
    }
  }

  const fillAndSend = (q: string): void => {
    messageText.value = q
    sendMessage()
  }

  // 会话切换时重新加载
  watch(
    () => props.conversationId,
    (newId, oldId) => {
      messageText.value = ''
      approvingId.value = null
      pendingImages.value = []
      // 新对话首轮结束后被赋予会话 ID：本地流式消息已在界面上，静默加载替换，避免闪烁
      const isNewConversationCreated = oldId === null && newId !== null
      loadConversation(isNewConversationCreated)
    },
    { immediate: true }
  )

  onMounted(() => {
    loadMeta()
  })
</script>

<style scoped>
  .chat-scroll {
    scrollbar-width: none;
    -ms-overflow-style: none;
  }

  .chat-scroll::-webkit-scrollbar {
    display: none;
    width: 0;
    height: 0;
  }

  .approval-card details > summary {
    list-style: none;
  }

  .approval-card details > summary::-webkit-details-marker {
    display: none;
  }
</style>
