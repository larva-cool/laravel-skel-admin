import request from '@/utils/http'

// ========== 应用管理 ==========

// 获取应用列表（分页）
export function fetchGetAppList(params: Api.AppManage.AppSearchParams) {
  return request.get<Api.AppManage.AppList>({
    url: '/admin/apps',
    params
  })
}

// 获取应用详情
export function fetchGetAppDetail(id: number) {
  return request.get<Api.AppManage.AppListItem>({
    url: `/admin/apps/${id}`
  })
}

// 创建应用
export function fetchCreateApp(data: Api.AppManage.AppSaveParams) {
  return request.post<Api.AppManage.AppListItem>({
    url: '/admin/apps',
    data,
    showSuccessMessage: true,
    successMessage: '创建成功'
  })
}

// 更新应用
export function fetchUpdateApp(id: number, data: Api.AppManage.AppSaveParams) {
  return request.put<Api.AppManage.AppListItem>({
    url: `/admin/apps/${id}`,
    data,
    showSuccessMessage: true,
    successMessage: '更新成功'
  })
}

// 删除应用
export function fetchDeleteApp(id: number) {
  return request.del<null>({
    url: `/admin/apps/${id}`,
    showSuccessMessage: true,
    successMessage: '删除成功'
  })
}

// ========== 版本管理 ==========

// 获取版本列表（分页）
export function fetchGetVersionList(appId: number, params: Api.AppManage.VersionSearchParams) {
  return request.get<Api.AppManage.VersionList>({
    url: `/admin/apps/${appId}/versions`,
    params
  })
}

// 获取版本详情
export function fetchGetVersionDetail(appId: number, id: number) {
  return request.get<Api.AppManage.VersionListItem>({
    url: `/admin/apps/${appId}/versions/${id}`
  })
}

// 创建版本
export function fetchCreateVersion(appId: number, data: Api.AppManage.VersionSaveParams) {
  return request.post<Api.AppManage.VersionListItem>({
    url: `/admin/apps/${appId}/versions`,
    data,
    showSuccessMessage: true,
    successMessage: '创建成功'
  })
}

// 更新版本
export function fetchUpdateVersion(
  appId: number,
  id: number,
  data: Api.AppManage.VersionSaveParams
) {
  return request.put<Api.AppManage.VersionListItem>({
    url: `/admin/apps/${appId}/versions/${id}`,
    data,
    showSuccessMessage: true,
    successMessage: '更新成功'
  })
}

// 删除版本
export function fetchDeleteVersion(appId: number, id: number) {
  return request.del<null>({
    url: `/admin/apps/${appId}/versions/${id}`,
    showSuccessMessage: true,
    successMessage: '删除成功'
  })
}

// 发布版本
export function fetchPublishVersion(appId: number, id: number) {
  return request.post<Api.AppManage.VersionListItem>({
    url: `/admin/apps/${appId}/versions/${id}/publish`,
    showSuccessMessage: true,
    successMessage: '发布成功'
  })
}

// 撤回版本
export function fetchWithdrawVersion(appId: number, id: number) {
  return request.post<Api.AppManage.VersionListItem>({
    url: `/admin/apps/${appId}/versions/${id}/withdraw`,
    showSuccessMessage: true,
    successMessage: '撤回成功'
  })
}

// 废弃版本
export function fetchObsoleteVersion(appId: number, id: number) {
  return request.post<Api.AppManage.VersionListItem>({
    url: `/admin/apps/${appId}/versions/${id}/obsolete`,
    showSuccessMessage: true,
    successMessage: '废弃成功'
  })
}

// 上传 APK 文件
export function fetchUploadApk(file: File) {
  const formData = new FormData()
  formData.append('file', file)
  return request.post<Api.AppManage.ApkUploadResult>({
    url: '/admin/uploader/apk',
    data: formData
  })
}
