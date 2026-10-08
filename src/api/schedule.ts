import request from '@/utils/http'

// ========== 定时任务管理 ==========

/** 定时任务列表项 */
export interface ScheduleItem {
  id: number
  name: string
  command: string
  command_custom: string | null
  params: Array<{ name: string; value: string }>
  options: Array<{ name: string }>
  options_with_value: Array<{ name: string; value: string }>
  expression: string
  environments: string[] | null
  description: string | null
  even_in_maintenance_mode: boolean
  without_overlapping: boolean
  on_one_server: boolean
  run_in_background: boolean
  status: number
  status_text: string
  command_string: string
  created_at: string | null
  updated_at: string | null
}

/** 可用命令选项 */
export interface CommandOption {
  name: string
  description: string
}

/** 定时任务列表（Laravel 分页） */
export type ScheduleList = Api.Common.PaginatedResponse<ScheduleItem>

/** 定时任务搜索参数 */
export interface ScheduleSearchParams {
  page?: number
  per_page?: number
  name?: string
  command?: string
  status?: number
}

/** 定时任务创建/更新参数 */
export interface ScheduleSaveParams {
  name: string
  command: string
  command_custom?: string | null
  params?: Array<{ name: string; value: string }>
  options?: Array<{ name: string }>
  options_with_value?: Array<{ name: string; value: string }>
  expression: string
  environments?: string[] | null
  description?: string | null
  even_in_maintenance_mode?: boolean
  without_overlapping?: boolean
  on_one_server?: boolean
  run_in_background?: boolean
  status?: boolean
}

/** 获取定时任务列表（分页） */
export function fetchScheduleList(params?: ScheduleSearchParams) {
  return request.get<ScheduleList>({ url: '/admin/schedules', params })
}

/** 获取定时任务详情 */
export function fetchScheduleDetail(id: number) {
  return request.get<ScheduleItem>({ url: `/admin/schedules/${id}` })
}

/** 创建定时任务 */
export function fetchCreateSchedule(data: ScheduleSaveParams) {
  return request.post<ScheduleItem>({
    url: '/admin/schedules',
    data,
    showSuccessMessage: true,
    successMessage: '创建成功'
  })
}

/** 更新定时任务 */
export function fetchUpdateSchedule(id: number, data: ScheduleSaveParams) {
  return request.put<ScheduleItem>({
    url: `/admin/schedules/${id}`,
    data,
    showSuccessMessage: true,
    successMessage: '更新成功'
  })
}

/** 删除定时任务 */
export function fetchDeleteSchedule(id: number) {
  return request.del<null>({
    url: `/admin/schedules/${id}`,
    showSuccessMessage: true,
    successMessage: '删除成功'
  })
}

/** 切换定时任务启用/禁用 */
export function fetchToggleSchedule(id: number) {
  return request.request<ScheduleItem>({
    url: `/admin/schedules/${id}/toggle`,
    method: 'PATCH',
    showSuccessMessage: true,
    successMessage: '状态切换成功'
  })
}

/** 手动执行定时任务 */
export function fetchExecuteSchedule(id: number) {
  return request.post<{ output: string; exit_code: number | null }>({
    url: `/admin/schedules/${id}/execute`,
    showSuccessMessage: true,
    successMessage: '执行完成'
  })
}

/** 获取可用命令列表 */
export function fetchScheduleCommands() {
  return request.get<CommandOption[]>({ url: '/admin/schedules/commands' })
}
