import type { AxiosResponse } from 'axios'
import request from '@/utils/http'

// ========== 充值订单 ==========

/** 获取充值订单列表（分页） */
export function fetchGetRechargeList(params: Api.WalletManage.RechargeSearchParams) {
  return request.get<Api.WalletManage.RechargeList>({
    url: '/admin/wallet/recharges',
    params
  })
}

/** 获取充值订单详情 */
export function fetchGetRechargeDetail(id: number) {
  return request.get<Api.WalletManage.Recharge>({
    url: `/admin/wallet/recharges/${id}`
  })
}

/** 获取充值订单统计 */
export function fetchGetRechargeStats() {
  return request.get<Api.WalletManage.RechargeStats>({
    url: '/admin/wallet/recharges/stats'
  })
}

/** 确认充值到账 */
export function fetchConfirmRecharge(id: number, data: Api.WalletManage.RechargeHandleParams) {
  return request.post<Api.WalletManage.Recharge>({
    url: `/admin/wallet/recharges/${id}/confirm`,
    data,
    showSuccessMessage: true,
    successMessage: '确认到账成功'
  })
}

/** 关闭充值订单 */
export function fetchCloseRecharge(id: number, data: Api.WalletManage.RechargeHandleParams) {
  return request.post<Api.WalletManage.Recharge>({
    url: `/admin/wallet/recharges/${id}/close`,
    data,
    showSuccessMessage: true,
    successMessage: '订单已关闭'
  })
}

/** 导出充值订单 */
export function fetchExportRecharges(params?: Api.WalletManage.RechargeSearchParams) {
  return request.get<AxiosResponse>({
    url: '/admin/wallet/recharges/export',
    params,
    responseType: 'blob',
    returnRawResponse: true,
    showErrorMessage: true
  })
}

// ========== 提现申请 ==========

/** 获取提现申请列表（分页） */
export function fetchGetWithdrawList(params: Api.WalletManage.WithdrawSearchParams) {
  return request.get<Api.WalletManage.WithdrawList>({
    url: '/admin/wallet/withdraws',
    params
  })
}

/** 获取提现申请详情 */
export function fetchGetWithdrawDetail(id: number) {
  return request.get<Api.WalletManage.Withdraw>({
    url: `/admin/wallet/withdraws/${id}`
  })
}

/** 获取提现申请统计 */
export function fetchGetWithdrawStats() {
  return request.get<Api.WalletManage.WithdrawStats>({
    url: '/admin/wallet/withdraws/stats'
  })
}

/** 审核通过 */
export function fetchApproveWithdraw(id: number, data: Api.WalletManage.WithdrawRemarkParams) {
  return request.post<Api.WalletManage.Withdraw>({
    url: `/admin/wallet/withdraws/${id}/approve`,
    data,
    showSuccessMessage: true,
    successMessage: '审核通过成功'
  })
}

/** 审核驳回 */
export function fetchRejectWithdraw(id: number, data: Api.WalletManage.WithdrawRejectParams) {
  return request.post<Api.WalletManage.Withdraw>({
    url: `/admin/wallet/withdraws/${id}/reject`,
    data,
    showSuccessMessage: true,
    successMessage: '已驳回'
  })
}

/** 标记已打款 */
export function fetchTransferWithdraw(id: number, data: Api.WalletManage.WithdrawRemarkParams) {
  return request.post<Api.WalletManage.Withdraw>({
    url: `/admin/wallet/withdraws/${id}/transfer`,
    data,
    showSuccessMessage: true,
    successMessage: '已标记为已打款'
  })
}

/** 标记打款失败 */
export function fetchFailWithdraw(id: number, data: Api.WalletManage.WithdrawRejectParams) {
  return request.post<Api.WalletManage.Withdraw>({
    url: `/admin/wallet/withdraws/${id}/fail`,
    data,
    showSuccessMessage: true,
    successMessage: '已标记为打款失败'
  })
}

/** 导出提现申请 */
export function fetchExportWithdraws(params?: Api.WalletManage.WithdrawSearchParams) {
  return request.get<AxiosResponse>({
    url: '/admin/wallet/withdraws/export',
    params,
    responseType: 'blob',
    returnRawResponse: true,
    showErrorMessage: true
  })
}
