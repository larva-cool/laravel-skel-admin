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

/** 获取可用广告位选项 */
export function fetchGetBannerPositions() {
  return request.get<Api.OperationManage.BannerPositionOption[]>({
    url: '/admin/banners/positions'
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

// ========== 任务分组管理（运营） ==========

/** 获取任务分组列表（分页） */
export function fetchGetTaskGroupList(params: Api.OperationManage.TaskGroupSearchParams) {
  return request.get<Api.OperationManage.TaskGroupList>({
    url: '/admin/task-groups',
    params
  })
}

/** 获取任务分组详情 */
export function fetchGetTaskGroupDetail(id: number) {
  return request.get<Api.OperationManage.TaskGroupListItem>({
    url: `/admin/task-groups/${id}`
  })
}

/** 获取任务分组选项（不分页） */
export function fetchGetTaskGroupOptions() {
  return request.get<Api.OperationManage.TaskGroupListItem[]>({
    url: '/admin/task-groups/options'
  })
}

/** 创建任务分组 */
export function fetchCreateTaskGroup(data: Api.OperationManage.TaskGroupSaveParams) {
  return request.post<Api.OperationManage.TaskGroupListItem>({
    url: '/admin/task-groups',
    data,
    showSuccessMessage: true,
    successMessage: '创建成功'
  })
}

/** 更新任务分组 */
export function fetchUpdateTaskGroup(id: number, data: Api.OperationManage.TaskGroupSaveParams) {
  return request.put<Api.OperationManage.TaskGroupListItem>({
    url: `/admin/task-groups/${id}`,
    data,
    showSuccessMessage: true,
    successMessage: '更新成功'
  })
}

/** 删除任务分组 */
export function fetchDeleteTaskGroup(id: number) {
  return request.del<null>({
    url: `/admin/task-groups/${id}`,
    showSuccessMessage: true,
    successMessage: '删除成功'
  })
}

/** 切换任务分组启用状态 */
export function fetchToggleTaskGroupStatus(id: number) {
  return request.put<Api.OperationManage.TaskGroupListItem>({
    url: `/admin/task-groups/${id}/toggle-status`,
    showSuccessMessage: true,
    successMessage: '状态切换成功'
  })
}

// ========== 任务管理（运营） ==========

/** 获取任务列表（分页） */
export function fetchGetTaskList(params: Api.OperationManage.TaskSearchParams) {
  return request.get<Api.OperationManage.TaskList>({
    url: '/admin/tasks',
    params
  })
}

/** 获取任务详情 */
export function fetchGetTaskDetail(id: number) {
  return request.get<Api.OperationManage.TaskListItem>({
    url: `/admin/tasks/${id}`
  })
}

/** 创建任务 */
export function fetchCreateTask(data: Api.OperationManage.TaskSaveParams) {
  return request.post<Api.OperationManage.TaskListItem>({
    url: '/admin/tasks',
    data,
    showSuccessMessage: true,
    successMessage: '创建成功'
  })
}

/** 更新任务 */
export function fetchUpdateTask(id: number, data: Api.OperationManage.TaskSaveParams) {
  return request.put<Api.OperationManage.TaskListItem>({
    url: `/admin/tasks/${id}`,
    data,
    showSuccessMessage: true,
    successMessage: '更新成功'
  })
}

/** 删除任务 */
export function fetchDeleteTask(id: number) {
  return request.del<null>({
    url: `/admin/tasks/${id}`,
    showSuccessMessage: true,
    successMessage: '删除成功'
  })
}

/** 切换任务启用状态 */
export function fetchToggleTaskStatus(id: number) {
  return request.put<Api.OperationManage.TaskListItem>({
    url: `/admin/tasks/${id}/toggle-status`,
    showSuccessMessage: true,
    successMessage: '状态切换成功'
  })
}

// ========== 任务记录（运营，只读） ==========

/** 获取任务记录列表（分页） */
export function fetchGetTaskLogList(params: Api.OperationManage.TaskLogSearchParams) {
  return request.get<Api.OperationManage.TaskLogList>({
    url: '/admin/task-logs',
    params
  })
}

/** 获取任务记录详情 */
export function fetchGetTaskLogDetail(id: number) {
  return request.get<Api.OperationManage.TaskLogListItem>({
    url: `/admin/task-logs/${id}`
  })
}

// ========== 敏感词管理（运营） ==========

/** 获取敏感词列表（分页） */
export function fetchGetSensitiveWordList(params: Api.OperationManage.SensitiveWordSearchParams) {
  return request.get<Api.OperationManage.SensitiveWordList>({
    url: '/admin/sensitive-words',
    params
  })
}

/** 获取敏感词详情 */
export function fetchGetSensitiveWordDetail(id: number) {
  return request.get<Api.OperationManage.SensitiveWordListItem>({
    url: `/admin/sensitive-words/${id}`
  })
}

/** 创建敏感词 */
export function fetchCreateSensitiveWord(data: Api.OperationManage.SensitiveWordSaveParams) {
  return request.post<Api.OperationManage.SensitiveWordListItem>({
    url: '/admin/sensitive-words',
    data,
    showSuccessMessage: true,
    successMessage: '创建成功'
  })
}

/** 更新敏感词 */
export function fetchUpdateSensitiveWord(
  id: number,
  data: Api.OperationManage.SensitiveWordSaveParams
) {
  return request.put<Api.OperationManage.SensitiveWordListItem>({
    url: `/admin/sensitive-words/${id}`,
    data,
    showSuccessMessage: true,
    successMessage: '更新成功'
  })
}

/** 删除敏感词 */
export function fetchDeleteSensitiveWord(id: number) {
  return request.del<null>({
    url: `/admin/sensitive-words/${id}`,
    showSuccessMessage: true,
    successMessage: '删除成功'
  })
}

/** 切换敏感词启用状态 */
export function fetchToggleSensitiveWordStatus(id: number) {
  return request.put<Api.OperationManage.SensitiveWordListItem>({
    url: `/admin/sensitive-words/${id}/toggle-status`,
    showSuccessMessage: true,
    successMessage: '状态切换成功'
  })
}

/** 批量导入敏感词 */
export function fetchImportSensitiveWords(data: Api.OperationManage.SensitiveWordImportParams) {
  return request.post<Api.OperationManage.SensitiveWordImportResult>({
    url: '/admin/sensitive-words/import',
    data,
    showSuccessMessage: true,
    successMessage: '导入完成'
  })
}

/** 手动刷新 DFA 字典缓存 */
export function fetchRefreshSensitiveDict() {
  return request.post<Api.OperationManage.SensitiveWordRefreshResult>({
    url: '/admin/sensitive-words/refresh',
    showSuccessMessage: true,
    successMessage: '字典已刷新'
  })
}

/** 获取分类与级别选项 */
export function fetchGetSensitiveWordOptions() {
  return request.get<Api.OperationManage.SensitiveWordOptions>({
    url: '/admin/sensitive-words/options'
  })
}
