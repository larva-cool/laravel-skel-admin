import request from '@/utils/http'

// ========== Banner / 轮播图管理（运营） ==========

/** 获取 Banner 列表（分页） */
export function fetchGetBannerList(params: Api.OperationManage.BannerSearchParams) {
  return request.get<Api.OperationManage.BannerList>({
    url: '/admin/banners',
    params
  })
}

/** 获取 Banner 详情 */
export function fetchGetBannerDetail(id: number) {
  return request.get<Api.OperationManage.BannerListItem>({
    url: `/admin/banners/${id}`
  })
}

/** 创建 Banner */
export function fetchCreateBanner(data: Api.OperationManage.BannerSaveParams) {
  return request.post<Api.OperationManage.BannerListItem>({
    url: '/admin/banners',
    data,
    showSuccessMessage: true,
    successMessage: '创建成功'
  })
}

/** 更新 Banner */
export function fetchUpdateBanner(id: number, data: Api.OperationManage.BannerSaveParams) {
  return request.put<Api.OperationManage.BannerListItem>({
    url: `/admin/banners/${id}`,
    data,
    showSuccessMessage: true,
    successMessage: '更新成功'
  })
}

/** 删除 Banner */
export function fetchDeleteBanner(id: number) {
  return request.del<null>({
    url: `/admin/banners/${id}`,
    showSuccessMessage: true,
    successMessage: '删除成功'
  })
}

/** 切换 Banner 启用/禁用 */
export function fetchToggleBannerStatus(id: number) {
  return request.put<Api.OperationManage.BannerListItem>({
    url: `/admin/banners/${id}/toggle-status`,
    showSuccessMessage: true,
    successMessage: '状态切换成功'
  })
}

/** 拖拽批量排序 */
export function fetchSortBanners(data: Api.OperationManage.BannerSortParams) {
  return request.post<null>({
    url: '/admin/banners/sort',
    data,
    showSuccessMessage: true,
    successMessage: '排序已保存'
  })
}

/** 获取广告位字典项（公开字典接口） */
export function fetchGetBannerPositions() {
  return request.get<Api.OperationManage.BannerPositionOption[]>({
    url: '/api/v1/common/dict-items/banner_positions'
  })
}

// ========== 公告管理（运营） ==========

/** 获取公告列表（分页） */
export function fetchGetAnnouncementList(params: Api.OperationManage.AnnouncementSearchParams) {
  return request.get<Api.OperationManage.AnnouncementList>({
    url: '/admin/announcements',
    params
  })
}

/** 获取公告详情 */
export function fetchGetAnnouncementDetail(id: number) {
  return request.get<Api.OperationManage.AnnouncementListItem>({
    url: `/admin/announcements/${id}`
  })
}

/** 创建公告 */
export function fetchCreateAnnouncement(data: Api.OperationManage.AnnouncementSaveParams) {
  return request.post<Api.OperationManage.AnnouncementListItem>({
    url: '/admin/announcements',
    data,
    showSuccessMessage: true,
    successMessage: '创建成功'
  })
}

/** 更新公告 */
export function fetchUpdateAnnouncement(
  id: number,
  data: Api.OperationManage.AnnouncementSaveParams
) {
  return request.put<Api.OperationManage.AnnouncementListItem>({
    url: `/admin/announcements/${id}`,
    data,
    showSuccessMessage: true,
    successMessage: '更新成功'
  })
}

/** 删除公告 */
export function fetchDeleteAnnouncement(id: number) {
  return request.del<null>({
    url: `/admin/announcements/${id}`,
    showSuccessMessage: true,
    successMessage: '删除成功'
  })
}

/** 切换公告状态（草稿→发布 / 发布→归档 / 归档→发布） */
export function fetchToggleAnnouncementStatus(id: number) {
  return request.put<Api.OperationManage.AnnouncementListItem>({
    url: `/admin/announcements/${id}/toggle-status`,
    showSuccessMessage: true,
    successMessage: '状态切换成功'
  })
}
