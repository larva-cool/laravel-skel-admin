declare namespace Api {
  namespace OpenAccount {
    /** 开放平台账户列表（Laravel 分页） */
    type OpenAccountList = Api.Common.PaginatedResponse<OpenAccountItem>

    /** 开放平台账户列表项 */
    interface OpenAccountItem {
      id: number
      username: string | null
      email: string | null
      phone: string | null
      name: string | null
      contact_name: string | null
      contact_phone: string | null
      contact_email: string | null
      rate_limit: number
      available_points: number | null
      available_coins: number | null
      balance: number
      frozen_balance: number
      /** 账户状态枚举 { value, label } */
      status: { value: number; label: string }
      /** 实名认证类型枚举 { value, label } */
      identity_type: { value: string; label: string } | null
      /** 实名认证状态枚举 { value, label } */
      identity_status: { value: string; label: string }
      /** 是否已通过实名认证（逻辑属性） */
      identity_verified: boolean
      login_count: number | null
      last_login_ip: string | null
      last_login_at: string | null
      last_active_at: string | null
      last_request_at: string | null
      last_request_ip: string | null
      /** 令牌数量（withCount） */
      tokens_count?: number
      created_at: string | null
      updated_at: string | null
      deleted_at: string | null
    }

    /** 开放平台账户搜索参数 */
    interface OpenAccountSearchParams extends Api.Common.CommonSearchParams {
      keyword?: string
      status?: number
      identity_status?: string
      start_date?: string
      end_date?: string
    }

    /** 创建开放平台账户参数 */
    interface OpenAccountStoreParams {
      username?: string
      email?: string | null
      phone?: string | null
      name: string
      password?: string
      status: number
      contact_name?: string
      contact_phone?: string
      contact_email?: string
      rate_limit?: number
    }

    /** 更新开放平台账户参数 */
    interface OpenAccountUpdateParams {
      email?: string | null
      phone?: string | null
      name: string
      password?: string
      status: number
      contact_name?: string
      contact_phone?: string
      contact_email?: string
      rate_limit?: number
    }

    /** 轮换令牌响应 */
    interface RotateTokenResponse {
      token: string
      message: string
    }
  }
}
