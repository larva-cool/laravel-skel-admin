/**
 * 自动化运营相关 API（规则 / 节日 / 触发日志）
 */
import request from '@/utils/http'

// ========== 自动化规则 ==========

/** 获取规则列表（分页） */
export function fetchGetAutomationRuleList(params: Api.Automation.RuleSearchParams) {
  return request.get<Api.Automation.RuleList>({
    url: '/admin/automation-rules',
    params
  })
}

/** 获取规则详情 */
export function fetchGetAutomationRuleDetail(id: number) {
  return request.get<Api.Automation.RuleListItem>({
    url: `/admin/automation-rules/${id}`
  })
}

/** 获取规则表单元数据（触发类型/奖励类型/渠道选项） */
export function fetchGetAutomationRuleMeta() {
  return request.get<Api.Automation.Meta>({
    url: '/admin/automation-rules/meta'
  })
}

/** 创建规则 */
export function fetchCreateAutomationRule(data: Api.Automation.RuleSaveParams) {
  return request.post<Api.Automation.RuleListItem>({
    url: '/admin/automation-rules',
    data,
    showSuccessMessage: true,
    successMessage: '创建成功'
  })
}

/** 更新规则 */
export function fetchUpdateAutomationRule(id: number, data: Api.Automation.RuleSaveParams) {
  return request.put<Api.Automation.RuleListItem>({
    url: `/admin/automation-rules/${id}`,
    data,
    showSuccessMessage: true,
    successMessage: '更新成功'
  })
}

/** 删除规则 */
export function fetchDeleteAutomationRule(id: number) {
  return request.del<null>({
    url: `/admin/automation-rules/${id}`,
    showSuccessMessage: true,
    successMessage: '删除成功'
  })
}

/** 切换规则启用状态 */
export function fetchToggleAutomationRuleStatus(id: number) {
  return request.put<Api.Automation.RuleListItem>({
    url: `/admin/automation-rules/${id}/toggle-status`,
    showSuccessMessage: true,
    successMessage: '状态切换成功'
  })
}

/** 手动触发规则（可指定运行日期补跑） */
export function fetchTriggerAutomationRule(id: number, date?: string) {
  return request.post<Api.Automation.TriggerResult>({
    url: `/admin/automation-rules/${id}/trigger`,
    data: date ? { date } : {},
    showSuccessMessage: true,
    successMessage: '触发完成'
  })
}

// ========== 节日管理 ==========

/** 获取节日列表（分页） */
export function fetchGetAutomationFestivalList(params: Api.Automation.FestivalSearchParams) {
  return request.get<Api.Automation.FestivalList>({
    url: '/admin/automation-festivals',
    params
  })
}

/** 获取节日详情 */
export function fetchGetAutomationFestivalDetail(id: number) {
  return request.get<Api.Automation.FestivalListItem>({
    url: `/admin/automation-festivals/${id}`
  })
}

/** 获取启用节日选项（供规则表单选择节日范围） */
export function fetchGetAutomationFestivalOptions() {
  return request.get<Api.Automation.FestivalOption[]>({
    url: '/admin/automation-festivals/options'
  })
}

/** 创建节日 */
export function fetchCreateAutomationFestival(data: Api.Automation.FestivalSaveParams) {
  return request.post<Api.Automation.FestivalListItem>({
    url: '/admin/automation-festivals',
    data,
    showSuccessMessage: true,
    successMessage: '创建成功'
  })
}

/** 更新节日 */
export function fetchUpdateAutomationFestival(id: number, data: Api.Automation.FestivalSaveParams) {
  return request.put<Api.Automation.FestivalListItem>({
    url: `/admin/automation-festivals/${id}`,
    data,
    showSuccessMessage: true,
    successMessage: '更新成功'
  })
}

/** 删除节日 */
export function fetchDeleteAutomationFestival(id: number) {
  return request.del<null>({
    url: `/admin/automation-festivals/${id}`,
    showSuccessMessage: true,
    successMessage: '删除成功'
  })
}

/** 切换节日启用状态 */
export function fetchToggleAutomationFestivalStatus(id: number) {
  return request.put<Api.Automation.FestivalListItem>({
    url: `/admin/automation-festivals/${id}/toggle-status`,
    showSuccessMessage: true,
    successMessage: '状态切换成功'
  })
}

// ========== 触发日志（只读） ==========

/** 获取触发日志列表（分页） */
export function fetchGetAutomationLogList(params: Api.Automation.LogSearchParams) {
  return request.get<Api.Automation.LogList>({
    url: '/admin/automation-logs',
    params
  })
}

/** 获取触发日志详情 */
export function fetchGetAutomationLogDetail(id: number) {
  return request.get<Api.Automation.LogListItem>({
    url: `/admin/automation-logs/${id}`
  })
}
