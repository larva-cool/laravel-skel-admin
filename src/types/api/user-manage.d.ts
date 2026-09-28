declare namespace Api {
  /** 用户管理模块（前台用户） */
  namespace UserManage {
    /** 用户列表（分页） */
    type UserList = Api.Common.PaginatedResponse<UserListItem>

    /** 用户登录历史列表 */
    type LoginHistoryList = Api.Common.PaginatedResponse<LoginHistoryItem>

    /** 用户社交账号列表 */
    type SocialList = Api.Common.PaginatedResponse<SocialItem>

    /** 用户积分流水列表 */
    type PointTradeList = Api.Common.PaginatedResponse<PointTradeItem>

    /** 用户金币流水列表 */
    type CoinTradeList = Api.Common.PaginatedResponse<CoinTradeItem>

    /** 用户列表项 */
    interface UserListItem {
      id: number
      username: string
      email: string | null
      phone: string | null
      name: string
      avatar: string | null
      /** 状态枚举 { value, label } */
      status: { value: number; label: string }
      available_points: number
      available_coins: number
      login_count: number
      /** 实名认证状态枚举 { value, label } */
      identity_status: { value: string; label: string }
      /** 实名认证类型枚举 { value, label }，未认证时为 null */
      identity_type: { value: string; label: string } | null
      last_login_ip: string | null
      vip_expires_at: string | null
      is_vip: boolean
      last_login_at: string | null
      last_active_at: string | null
      created_at: string | null
      updated_at: string | null
      deleted_at?: string | null
    }

    /** 用户详情（含 profile） */
    interface UserDetail extends UserListItem {
      profile?: UserProfile
    }

    /** 用户资料 */
    interface UserProfile {
      gender: { value: number; label: string } | null
      birthday: string | null
      province_id: number | null
      city_id: number | null
      district_id: number | null
      website: string | null
      intro: string | null
      bio: string | null
    }

    /** 登录历史项 */
    interface LoginHistoryItem {
      id: number
      ip: string
      address: string | null
      device: string | null
      browser: string | null
      platform: string | null
      login_at: string | null
    }

    /** 社交账号项 */
    interface SocialItem {
      id: number
      /** 渠道枚举 { value, label } */
      provider: { value: string; label: string }
      openid: string | null
      unionid: string | null
      expiry_at: string | null
      created_at: string | null
      updated_at: string | null
    }

    /** 积分流水项 */
    interface PointTradeItem {
      id: number
      points: number
      description: string | null
      /** 类型枚举 { value, label } */
      type: { value: string; label: string }
      expired_at: string | null
      created_at: string | null
    }

    /** 金币流水项 */
    interface CoinTradeItem {
      id: number
      coins: number
      description: string | null
      /** 类型枚举 { value, label } */
      type: { value: string; label: string }
      created_at: string | null
    }

    /** 更新用户参数 */
    interface UserUpdateParams {
      username?: string
      email?: string | null
      phone?: string | null
      name?: string
      status?: number
    }

    /** 调整余额参数 */
    interface AdjustBalanceParams {
      /** points=积分, coins=金币 */
      type: 'points' | 'coins'
      /** 正数增加，负数减少 */
      amount: number
      /** 描述/备注 */
      description?: string
    }

    /** 延长 VIP 参数 */
    interface ExtendVipParams {
      days: number
    }

    /** 重置密码参数 */
    interface ResetPasswordParams {
      password: string
    }

    /** 重置联系方式参数 */
    interface ResetContactParams {
      type: 'email' | 'phone'
      value: string
    }

    /** 用户搜索参数 */
    interface UserSearchParams extends Api.Common.CommonSearchParams {
      keyword?: string
      status?: number
      /** 实名认证状态 */
      identity_status?: string
      /** 1=VIP, 0=非VIP */
      vip?: string
      /** 最后登录开始日期 YYYY-MM-DD */
      login_start?: string
      /** 最后登录结束日期 */
      login_end?: string
      /** 注册开始日期 */
      register_start?: string
      /** 注册结束日期 */
      register_end?: string
    }

    /** 邀请记录列表（Laravel 分页） */
    type InviteRecordList = Api.Common.PaginatedResponse<InviteRecordItem>

    /** 邀请记录列表项（InviteRecordAdminResource） */
    interface InviteRecordItem {
      id: number
      /** 邀请人类型：user=前台用户，admin=管理员 */
      inviter_type: 'user' | 'admin'
      inviter_id: number
      inviter_name: string | null
      /** 被邀请人类型：user=前台用户，admin=管理员 */
      invitee_type: 'user' | 'admin'
      invitee_id: number
      invitee_name: string | null
      description: string | null
      created_at: string | null
    }

    /** 邀请记录搜索参数 */
    interface InviteRecordSearchParams extends Api.Common.CommonSearchParams {
      inviter_type?: 'user' | 'admin'
      inviter_id?: number
      invitee_type?: 'user' | 'admin'
      invitee_id?: number
      /** 描述关键词（模糊匹配） */
      description?: string
      /** 邀请开始日期 YYYY-MM-DD */
      created_start?: string
      /** 邀请结束日期 YYYY-MM-DD */
      created_end?: string
    }
  }
}
