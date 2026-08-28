import request from '@/utils/http'

// ========== 用户分群管理（用户管理 → 分群管理） ==========

/** 获取分群列表（分页） */
export function fetchGetSegmentList(params: Api.SegmentManage.SegmentSearchParams) {
  return request.get<Api.SegmentManage.SegmentList>({
    url: '/admin/user-segments',
    params
  })
}

/** 获取分群详情 */
export function fetchGetSegmentDetail(id: number) {
  return request.get<Api.SegmentManage.SegmentDetail>({
    url: `/admin/user-segments/${id}`
  })
}

/** 创建分群 */
export function fetchCreateSegment(data: Api.SegmentManage.SegmentSaveParams) {
  return request.post<Api.SegmentManage.SegmentDetail>({
    url: '/admin/user-segments',
    data,
    showSuccessMessage: true,
    successMessage: '创建成功'
  })
}

/** 更新分群 */
export function fetchUpdateSegment(id: number, data: Api.SegmentManage.SegmentSaveParams) {
  return request.put<Api.SegmentManage.SegmentDetail>({
    url: `/admin/user-segments/${id}`,
    data,
    showSuccessMessage: true,
    successMessage: '更新成功'
  })
}

/** 删除分群 */
export function fetchDeleteSegment(id: number) {
  return request.del<null>({
    url: `/admin/user-segments/${id}`,
    showSuccessMessage: true,
    successMessage: '删除成功'
  })
}

/** 切换分群启用/禁用 */
export function fetchToggleSegmentStatus(id: number) {
  return request.put<Api.SegmentManage.SegmentDetail>({
    url: `/admin/user-segments/${id}/toggle-status`,
    showSuccessMessage: true,
    successMessage: '状态切换成功'
  })
}

/** 手动同步规则分群 */
export function fetchSyncSegment(id: number) {
  return request.post<Api.SegmentManage.SegmentSyncResponse>({
    url: `/admin/user-segments/${id}/sync`,
    showSuccessMessage: true,
    successMessage: '同步完成'
  })
}

/** 规则预览 */
export function fetchPreviewSegment(id: number) {
  return request.get<Api.SegmentManage.SegmentPreviewResponse>({
    url: `/admin/user-segments/${id}/preview`
  })
}

/** 启用 + 手动分群下拉（公告群发复用） */
export function fetchGetSegmentOptions() {
  return request.get<Api.SegmentManage.SegmentOption[]>({
    url: '/admin/user-segments/options'
  })
}

/** 单分群批量绑用户 */
export function fetchAttachSegmentUsers(id: number, data: Api.SegmentManage.SegmentAttachParams) {
  return request.post<Api.SegmentManage.SegmentAttachResponse>({
    url: `/admin/user-segments/${id}/attach`,
    data,
    showSuccessMessage: true,
    successMessage: '绑定成功'
  })
}

/** 单分群批量解绑用户 */
export function fetchDetachSegmentUsers(id: number, data: Api.SegmentManage.SegmentAttachParams) {
  return request.post<Api.SegmentManage.SegmentDetachResponse>({
    url: `/admin/user-segments/${id}/detach`,
    data,
    showSuccessMessage: true,
    successMessage: '解绑成功'
  })
}

/** 笛卡尔批量打标 */
export function fetchBatchAttachSegments(data: Api.SegmentManage.SegmentBatchAttachParams) {
  return request.post<Api.SegmentManage.SegmentAttachResponse>({
    url: '/admin/user-segments/batch-attach',
    data,
    showSuccessMessage: true,
    successMessage: '批量打标完成'
  })
}

/** 笛卡尔批量解标 */
export function fetchBatchDetachSegments(data: Api.SegmentManage.SegmentBatchAttachParams) {
  return request.post<Api.SegmentManage.SegmentDetachResponse>({
    url: '/admin/user-segments/batch-detach',
    data,
    showSuccessMessage: true,
    successMessage: '批量解标完成'
  })
}
