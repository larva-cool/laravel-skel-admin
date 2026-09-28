declare namespace Api {
  /** 通知管理 */
  namespace Notification {
    /** 通知列表查询参数 */
    interface ListParams extends Api.Common.LaravelPaginationRequest {
      type?: string
    }

    /** 通知项 */
    interface NotificationItem {
      id: string
      type: string
      data: Record<string, unknown>
      read_at: string | null
      send_at: string
    }

    /** 通知列表响应 */
    type NotificationListResponse = Api.Common.PaginatedResponse<NotificationItem>

    /** 标记已读参数 */
    interface MarkReadParams {
      id: string
    }

    /** 审批参数 */
    interface ApprovalParams {
      conversation_id: string
      approval_id: string
      approved: boolean
      reason?: string
    }
  }
}
