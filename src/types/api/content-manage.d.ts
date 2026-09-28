declare namespace Api {
  /** 内容运营模块 */
  namespace ContentManage {
    /** 评论列表（Laravel 分页） */
    type CommentList = Api.Common.PaginatedResponse<CommentListItem>

    /** 上级评论摘要（当前评论为回复时返回） */
    interface CommentParentSummary {
      id: number
      user_id: number
      username?: string | null
      content: string
      status: string
      status_label: string
      status_label_type: string
      created_at: string | null
    }

    /** 评论列表项（Admin CommentResource） */
    interface CommentListItem {
      id: number
      user_id: number
      username?: string | null
      source_type: string
      source_id: number
      is_top: boolean
      status: string
      status_label: string
      status_label_type: string
      content: string
      like_count: number
      comment_count: number
      mentioned_users: number[]
      is_reply: boolean
      parent_comment?: CommentParentSummary | null
      ip_address?: string | null
      created_at: string | null
    }

    /** 评论搜索参数 */
    interface CommentSearchParams extends Api.Common.CommonSearchParams {
      keyword?: string
      status?: string
      source_type?: string
      user_id?: number | string
    }

    /** 评论审核参数 */
    interface CommentReviewParams {
      status: string
      remark?: string | null
    }
  }
}
