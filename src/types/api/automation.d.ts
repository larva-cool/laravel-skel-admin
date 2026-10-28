/** 自动化运营相关类型 */
declare namespace Api {
  namespace Automation {
    // ========== 自动化规则 ==========

    /** 规则列表（分页） */
    type RuleList = Api.Common.PaginatedResponse<RuleListItem>

    /** 规则触发配置 */
    interface TriggerConfig {
      advance_days: number
      send_time: string
      festival_ids?: number[]
    }

    /** 规则列表项 */
    interface RuleListItem {
      id: number
      name: string
      trigger_type: string
      trigger_type_label: string
      trigger_type_label_type: string
      trigger_config: TriggerConfig
      segment_id: number | null
      segment?: { id: number; name: string } | null
      title: string
      content: string
      channels: string[]
      reward_type: string
      reward_type_label: string
      reward_amount: number
      status: boolean
      last_triggered_at: string | null
      last_triggered_count: number | null
      admin?: { id: number; name: string } | null
      created_at: string | null
      updated_at: string | null
    }

    /** 规则搜索参数 */
    interface RuleSearchParams extends Api.Common.CommonSearchParams {
      keyword?: string
      trigger_type?: string
      status?: boolean
    }

    /** 规则保存参数 */
    interface RuleSaveParams {
      name: string
      trigger_type: string
      trigger_config: TriggerConfig
      segment_id?: number | null
      title: string
      content: string
      channels: string[]
      reward_type: string
      reward_amount: number
      status?: boolean
    }

    /** 规则表单元数据选项 */
    interface MetaOption {
      value: string
      label: string
    }

    /** 规则元数据 */
    interface Meta {
      trigger_types: MetaOption[]
      reward_types: MetaOption[]
      channels: MetaOption[]
    }

    /** 手动触发结果摘要 */
    interface TriggerSummary {
      rule_id: number
      rule_name: string
      trigger_type: string
      event_date: string
      sent: number
      failed: number
      skipped: number
      note: string | null
    }

    /** 手动触发响应 */
    interface TriggerResult {
      summary: TriggerSummary | null
    }

    // ========== 节日管理 ==========

    /** 节日列表（分页） */
    type FestivalList = Api.Common.PaginatedResponse<FestivalListItem>

    /** 节日列表项 */
    interface FestivalListItem {
      id: number
      name: string
      date_type: string
      date_type_label: string
      date_type_label_type: string
      month: number
      day: number
      status: boolean
      sort: number
      remark: string | null
      created_at: string | null
      updated_at: string | null
    }

    /** 节日搜索参数 */
    interface FestivalSearchParams extends Api.Common.CommonSearchParams {
      keyword?: string
      date_type?: string
      status?: boolean
    }

    /** 节日保存参数 */
    interface FestivalSaveParams {
      name: string
      date_type: string
      month: number
      day: number
      status?: boolean
      sort?: number
      remark?: string | null
    }

    /** 节日选项（供规则表单选择节日范围） */
    interface FestivalOption {
      id: number
      name: string
      date_type: string
      date_type_label: string
      month: number
      day: number
    }

    // ========== 触发日志（只读） ==========

    /** 触发日志列表（分页） */
    type LogList = Api.Common.PaginatedResponse<LogListItem>

    /** 触发日志列表项 */
    interface LogListItem {
      id: number
      rule_id: number
      rule?: { id: number; name: string; trigger_type: string; trigger_type_label: string } | null
      user_id: number
      user?: { id: number; name: string; username: string; avatar: string | null } | null
      trigger_date: string
      festival?: { id: number; name: string } | null
      channels: string[] | null
      status: string
      status_label: string
      status_label_type: string
      error: string | null
      created_at: string | null
    }

    /** 触发日志搜索参数 */
    interface LogSearchParams extends Api.Common.CommonSearchParams {
      rule_id?: number
      user_id?: number
      status?: string
      date_from?: string
      date_to?: string
    }
  }
}
