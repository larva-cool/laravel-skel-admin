declare namespace Api {
  /** 钱包管理（流水 / 充值 / 提现） */
  namespace WalletManage {
    // ========== 钱包流水 ==========

    /** 流水交易类型 */
    type WalletTradeTypeValue =
      | 'recharge'
      | 'withdraw'
      | 'freeze'
      | 'unfreeze'
      | 'payment'
      | 'refund'
      | 'admin_recharge'
      | 'admin_deduct'

    /** 流水状态 */
    type WalletTradeStatusValue = 'pending' | 'success' | 'failed'

    /** Element Plus 标签类型 */
    type TagType = 'primary' | 'success' | 'warning' | 'danger' | 'info' | string

    /** 钱包流水项（WalletTradeResource） */
    interface WalletTrade {
      id: number
      amount: number | string
      before_balance: number | string
      after_balance: number | string
      before_frozen: number | string
      after_frozen: number | string
      /** 交易类型枚举 { value, label } */
      type: { value: WalletTradeTypeValue | string; label: string }
      type_label_type?: TagType
      /** 流水状态枚举 { value, label } */
      status: { value: WalletTradeStatusValue | string; label: string }
      status_label_type?: TagType
      source_type: string | null
      source_id: number | null
      description: string | null
      owner?: { id: number; name: string } | null
      created_at: string | null
    }

    /** 钱包流水列表（Laravel 分页） */
    type WalletTradeList = Api.Common.PaginatedResponse<WalletTrade>

    /** 钱包流水搜索参数 */
    interface WalletTradeSearchParams extends Api.Common.CommonSearchParams {
      owner_type?: string
      owner_id?: number
      type?: string
      status?: string
      keyword?: string
      start_date?: string
      end_date?: string
    }

    /** 钱包全局统计 */
    interface WalletStats {
      total_balance: number | string
      total_frozen: number | string
      total_income: number | string
      total_expense: number | string
      trade_count: number
    }

    /** 单用户钱包概览 */
    interface UserWallet {
      user_id: number
      balance: number | string
      frozen_balance: number | string
      available_balance: number | string
      total_balance: number | string
      total_income: number | string
      total_expense: number | string
    }

    /** 钱包调账参数（正数充正，负数扣减；说明必填） */
    interface WalletAdjustParams {
      amount: number
      description: string
    }

    // ========== 充值订单 ==========

    /** 支付渠道 */
    type PayChannelValue = 'manual' | 'wechat' | 'alipay' | 'apple'

    /** 充值支付状态 */
    type RechargeStatusValue = 'pending' | 'success' | 'failed' | 'expired' | 'closed'

    /** 充值列表项 */
    interface Recharge {
      id: number
      order_no: string
      amount: number | string
      bonus_amount: number | string
      total_amount: number | string
      /** 支付渠道枚举 { value, label } */
      pay_channel: { value: PayChannelValue | string; label: string }
      pay_channel_label_type?: TagType
      /** 支付状态枚举 { value, label } */
      pay_status: { value: RechargeStatusValue | string; label: string }
      pay_status_label_type?: TagType
      transaction_id: string | null
      confirmed_by: number | null
      client_ip: string | null
      remark: string | null
      is_expired: boolean
      owner?: { id: number; name: string } | null
      /** 仅详情接口返回 */
      callback_payload?: Record<string, any> | null
      paid_at: string | null
      expired_at: string | null
      created_at: string | null
    }

    /** 充值列表（Laravel 分页） */
    type RechargeList = Api.Common.PaginatedResponse<Recharge>

    /** 充值统计 */
    interface RechargeStats {
      total_amount: number | string
      total_bonus: number | string
      today_amount: number | string
      total_count: number
      success_count: number
      pending_count: number
      success_rate: number | string
    }

    /** 充值搜索参数 */
    interface RechargeSearchParams extends Api.Common.CommonSearchParams {
      pay_status?: string
      pay_channel?: string
      order_no?: string
      start_date?: string
      end_date?: string
    }

    /** 充值操作参数（备注可选） */
    interface RechargeHandleParams {
      remark?: string | null
    }

    // ========== 提现申请 ==========

    /** 提现账户信息（已脱敏） */
    interface WithdrawAccountInfo {
      account?: string
      real_name?: string
      bank_name?: string
      [key: string]: any
    }

    /** 提现账户类型 */
    type WithdrawAccountTypeValue = 'wechat' | 'alipay' | 'bank'

    /** 提现状态 */
    type WithdrawStatusValue = 'pending' | 'approved' | 'rejected' | 'success' | 'failed'

    /** 提现列表项 */
    interface Withdraw {
      id: number
      order_no: string
      amount: number | string
      fee: number | string
      actual_amount: number | string
      /** 账户类型枚举 { value, label } */
      account_type: { value: WithdrawAccountTypeValue | string; label: string }
      account_type_label_type?: TagType
      account_info: WithdrawAccountInfo | null
      /** 提现状态枚举 { value, label } */
      status: { value: WithdrawStatusValue | string; label: string }
      status_label_type?: TagType
      reviewed_by: number | null
      reject_reason: string | null
      fail_reason: string | null
      remark: string | null
      owner?: { id: number; name: string } | null
      reviewed_at: string | null
      transfer_at: string | null
      created_at: string | null
    }

    /** 提现列表（Laravel 分页） */
    type WithdrawList = Api.Common.PaginatedResponse<Withdraw>

    /** 提现统计 */
    interface WithdrawStats {
      total_amount: number | string
      total_fee: number | string
      today_amount: number | string
      total_count: number
      success_count: number
      pending_count: number
      success_rate: number | string
    }

    /** 提现搜索参数 */
    interface WithdrawSearchParams extends Api.Common.CommonSearchParams {
      status?: string
      account_type?: string
      order_no?: string
      owner_id?: number
      owner_type?: string
      start_date?: string
      end_date?: string
    }

    /** 提现通过/打款参数（备注可选） */
    interface WithdrawRemarkParams {
      remark?: string | null
    }

    /** 提现驳回/打款失败参数（原因必填） */
    interface WithdrawRejectParams {
      reason: string
      remark?: string | null
    }

    // ========== 收款账户（管理端） ==========

    /** 收款账户状态 */
    type WithdrawAccountStatusValue = 'active' | 'disabled'

    /** 收款账户项（管理端完整信息） */
    interface WithdrawAccount {
      id: number
      /** 账户类型枚举 { value, label } */
      account_type: { value: WithdrawAccountTypeValue | string; label: string }
      account_type_label_type?: TagType
      real_name: string
      /** 完整账号（管理端可见，用于审核打款） */
      account_no: string
      bank_name: string | null
      bank_branch: string | null
      is_default: boolean
      is_verified: boolean
      /** 账户状态枚举 { value, label } */
      status: { value: WithdrawAccountStatusValue | string; label: string }
      status_label_type?: TagType
      last_used_at: string | null
      owner?: { id: number; name: string } | null
      created_at: string | null
      updated_at: string | null
    }

    /** 收款账户列表（Laravel 分页） */
    type WithdrawAccountList = Api.Common.PaginatedResponse<WithdrawAccount>
  }
}
