declare namespace Api {
  /** 用户分群管理模块（用户管理 → 分群管理） */
  namespace SegmentManage {
    /** 分群列表（分页） */
    type SegmentList = Api.Common.PaginatedResponse<SegmentListItem>

    /** 分群列表项（SegmentListResource） */
    interface SegmentListItem {
      id: number
      code: string | null
      name: string
      label_type: string
      type: number
      type_label: string
      group: string | null
      description: string | null
      sort: number
      status: boolean
      rule: SegmentRule | null
      last_synced_at: string | null
      last_synced_user_count: number | null
      created_at: string | null
      updated_at: string | null
    }

    /** 分群详情（SegmentResource，含 users_count） */
    interface SegmentDetail extends SegmentListItem {
      users_count?: number
    }

    /** 分群搜索参数 */
    interface SegmentSearchParams extends Api.Common.CommonSearchParams {
      keyword?: string
      type?: number
      group?: string
      status?: number
    }

    /** 规则操作符 */
    type SegmentRuleOperator =
      '=' | '!=' | '>' | '>=' | '<' | '<=' | 'between' | 'in' | 'not_in' | 'is_null' | 'is_not_null'

    /** 规则字段 */
    type SegmentRuleField =
      | 'status'
      | 'identity_status'
      | 'identity_type'
      | 'vip_expires_at'
      | 'last_login_at'
      | 'last_active_at'
      | 'created_at'
      | 'available_points'
      | 'available_coins'
      | 'login_count'

    /** 规则单条条件 */
    interface SegmentRuleCondition {
      field: SegmentRuleField
      op: SegmentRuleOperator
      value?: string | number | boolean | (string | number)[] | null
    }

    /** 规则结构 */
    interface SegmentRule {
      version: number
      logic: 'and' | 'or'
      conditions: SegmentRuleCondition[]
    }

    /** 分群保存参数 */
    interface SegmentSaveParams {
      code?: string | null
      name: string
      label_type?: string
      type: number
      group?: string | null
      description?: string | null
      sort?: number
      status?: boolean
      rule?: SegmentRule | null
    }

    /** 绑定/解绑用户参数 */
    interface SegmentAttachParams {
      user_ids: number[]
    }

    /** 笛卡尔批量打标参数 */
    interface SegmentBatchAttachParams {
      segment_ids: number[]
      user_ids: number[]
    }

    /** 选项（公告群发复用） */
    interface SegmentOption {
      id: number
      name: string
      label_type: string
      type: number
    }

    /** 规则预览响应 */
    interface SegmentPreviewResponse {
      total: number
      sample: Array<{
        id: number
        username: string | null
        name: string | null
        avatar: string | null
      }>
    }

    /** 同步结果 */
    interface SegmentSyncResponse {
      added: number
      removed: number
      total: number
    }

    /** 打标结果 */
    interface SegmentAttachResponse {
      added: number
      requested: number
    }

    /** 解标结果 */
    interface SegmentDetachResponse {
      removed: number
      requested: number
    }

    /** 分群异步任务列表（分页） */
    type SegmentTaskList = Api.Common.PaginatedResponse<SegmentTaskItem>

    /** 分群异步任务搜索参数 */
    interface SegmentTaskSearchParams extends Api.Common.CommonSearchParams {
      status?: 'pending' | 'running' | 'completed' | 'failed'
      type?: 'attach' | 'detach'
    }

    /** 分群异步任务项（SegmentTaskResource） */
    interface SegmentTaskItem {
      id: number
      admin_id: number
      type: 'attach' | 'detach'
      type_label: string
      status: 'pending' | 'running' | 'completed' | 'failed'
      status_label: string
      total_count: number
      processed_count: number
      added_count: number
      progress_percent: number
      error_message: string | null
      started_at: string | null
      finished_at: string | null
      created_at: string | null
    }

    /** 异步任务提交响应（202） */
    interface SegmentAsyncResponse {
      task_id: number
      status: 'pending'
      mode: 'async'
      requested?: number
      message: string
    }
  }
}
