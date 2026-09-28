declare namespace Api {
  /** 调度日志监控 */
  namespace Monitor {
    /** 调度日志列表（Laravel 分页） */
    type ScheduleLogList = Api.Common.PaginatedResponse<ScheduleLogItem>

    /** 调度日志列表项（ScheduleLogResource） */
    interface ScheduleLogItem {
      id: number
      name: string
      type: string
      expression: string
      status: number
      status_text: string
      exit_code: number | null
      runtime: number | null
      exception: string | null
      hostname: string | null
      started_at: string | null
      finished_at: string | null
    }

    /** 调度日志搜索参数 */
    interface ScheduleLogSearchParams extends Api.Common.CommonSearchParams {
      name?: string
      type?: string
      status?: number
      start_date?: string
      end_date?: string
    }

    /** 审计日志列表（Laravel 分页） */
    type AuditLogList = Api.Common.PaginatedResponse<AuditLogItem>

    /** 审计日志列表项（AuditLogResource） */
    interface AuditLogItem {
      id: number
      operator_id: number | null
      operator_name: string | null
      route: string | null
      method: string
      uri: string
      title: string | null
      payload: Record<string, any> | null
      status_code: number
      is_failed: boolean
      error: string | null
      runtime: number | null
      ip: string | null
      user_agent: string | null
      created_at: string | null
    }

    /** 审计日志搜索参数 */
    interface AuditLogSearchParams extends Api.Common.CommonSearchParams {
      operator_id?: number
      operator_name?: string
      route?: string
      method?: string
      uri?: string
      status_code?: number
      is_failed?: boolean
      start_date?: string
      end_date?: string
    }

    /** 登录历史列表（Laravel 分页） */
    type LoginHistoryList = Api.Common.PaginatedResponse<LoginHistoryItem>

    /** 登录历史列表项（GlobalLoginHistoryResource） */
    interface LoginHistoryItem {
      id: number
      guard: 'user' | 'admin'
      user_id: number
      user_name: string | null
      result: boolean
      ip: string
      port: number | null
      platform: string | null
      device: string | null
      browser: string | null
      user_agent: string | null
      address: string | null
      login_at: string | null
    }

    /** 登录历史搜索参数 */
    interface LoginHistorySearchParams extends Api.Common.CommonSearchParams {
      guard?: 'user' | 'admin'
      user_id?: number
      keyword?: string
      ip?: string
      result?: boolean
      login_start?: string
      login_end?: string
    }
  }
}
