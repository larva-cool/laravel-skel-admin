import request from '@/utils/http'

/** 获取开放平台账户列表（分页） */
export function fetchGetOpenAccountList(params: Api.OpenAccount.OpenAccountSearchParams) {
  return request.get<Api.OpenAccount.OpenAccountList>({
    url: '/admin/open-accounts',
    params
  })
}

/** 获取开放平台账户详情 */
export function fetchGetOpenAccountDetail(id: number) {
  return request.get<Api.OpenAccount.OpenAccountItem>({
    url: `/admin/open-accounts/${id}`
  })
}

/** 创建开放平台账户 */
export function fetchCreateOpenAccount(data: Api.OpenAccount.OpenAccountStoreParams) {
  return request.post<Api.OpenAccount.OpenAccountItem>({
    url: '/admin/open-accounts',
    data,
    showSuccessMessage: true,
    successMessage: '创建成功'
  })
}

/** 更新开放平台账户 */
export function fetchUpdateOpenAccount(id: number, data: Api.OpenAccount.OpenAccountUpdateParams) {
  return request.put<Api.OpenAccount.OpenAccountItem>({
    url: `/admin/open-accounts/${id}`,
    data,
    showSuccessMessage: true,
    successMessage: '更新成功'
  })
}

/** 删除开放平台账户（软删除，同时吊销所有令牌） */
export function fetchDeleteOpenAccount(id: number) {
  return request.del<null>({
    url: `/admin/open-accounts/${id}`,
    showSuccessMessage: true,
    successMessage: '删除成功'
  })
}

/** 冻结/启用开放平台账户（冻结时吊销所有令牌） */
export function fetchToggleOpenAccountStatus(id: number) {
  return request.put<Api.OpenAccount.OpenAccountItem>({
    url: `/admin/open-accounts/${id}/toggle-status`,
    showSuccessMessage: true,
    successMessage: '状态切换成功'
  })
}

/** 轮换访问令牌：作废历史令牌并签发新令牌（明文仅返回一次） */
export function fetchRotateOpenAccountToken(id: number) {
  return request.post<Api.OpenAccount.RotateTokenResponse>({
    url: `/admin/open-accounts/${id}/rotate-token`,
    showSuccessMessage: true,
    successMessage: '令牌已轮换'
  })
}
