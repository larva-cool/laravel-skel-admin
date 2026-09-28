declare namespace Api {
  /** AI 聊天模块 */
  namespace Chat {
    /** 发送消息参数 */
    interface SendParams {
      /** 用户消息内容 */
      prompt: string
      /** 会话 ID（新对话不传，继续对话时传入） */
      conversation_id?: string | null
    }

    /** 发送消息响应（同步模式） */
    interface SendResponse {
      /** 会话 ID（新对话时返回新建 ID） */
      conversation_id: string
      /** AI 完整回复 */
      reply: string
      /** Token 用量 */
      usage: {
        input_tokens: number
        output_tokens: number
      }
    }

    /** 会话列表分页参数 */
    type ConversationListParams = Api.Common.PaginationRequest

    /** 会话列表项 */
    interface ConversationItem {
      id: string
      title: string
      messages_count?: number
      created_at: string | null
      updated_at: string | null
    }

    /** 会话列表响应（Laravel 分页） */
    type ConversationListResponse = Api.Common.PaginatedResponse<ConversationItem>

    /** 会话消息项 */
    interface MessageItem {
      id: string
      /** user 用户，assistant AI */
      role: 'user' | 'assistant'
      content: string
      created_at: string | null
      /** 工具调用记录（assistant 消息可能包含） */
      tool_calls?: Array<{
        id: string
        name: string
        arguments: Record<string, unknown>
      }> | null
      /** 工具调用结果 */
      tool_results?: Array<{
        id: string
        name: string
        result: unknown
        successful: boolean
        denied?: boolean
        error?: string | null
      }> | null
    }

    /** 会话详情 */
    interface ConversationDetail {
      id: string
      title: string
      messages: MessageItem[]
      created_at: string | null
      updated_at: string | null
    }
  }
}
