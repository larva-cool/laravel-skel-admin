declare namespace Api {
  /** 认证类型 */
  namespace Auth {
    /** 登录参数（后端接收 account 字段，支持用户名/邮箱/手机号登录） */
    interface LoginParams {
      account: string
      password: string
    }

    /** 登录响应 */
    interface LoginResponse {
      access_token: string
      user: AdminInfo
    }

    /** 管理员信息（对齐后端 AdminInfoResource） */
    interface AdminInfo {
      user_id: number
      user_name: string
      email: string
      avatar: string
      phone?: string
      roles: string[]
      buttons: string[]
    }
  }
}
