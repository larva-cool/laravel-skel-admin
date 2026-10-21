import request from '@/utils/http'

// ========== AI 模型管理 ==========

/** 获取模型列表（分页） */
export function fetchGetChatModelList(params: Api.ChatModel.SearchParams) {
  return request.get<Api.ChatModel.ListResponse>({
    url: '/admin/chat-models',
    params
  })
}

/** 获取模型详情 */
export function fetchGetChatModelDetail(id: number) {
  return request.get<Api.ChatModel.ListItem>({
    url: `/admin/chat-models/${id}`
  })
}

/** 创建模型 */
export function fetchCreateChatModel(data: Api.ChatModel.SaveParams) {
  return request.post<Api.ChatModel.ListItem>({
    url: '/admin/chat-models',
    data,
    showSuccessMessage: true,
    successMessage: '创建成功'
  })
}

/** 更新模型 */
export function fetchUpdateChatModel(id: number, data: Api.ChatModel.SaveParams) {
  return request.put<Api.ChatModel.ListItem>({
    url: `/admin/chat-models/${id}`,
    data,
    showSuccessMessage: true,
    successMessage: '更新成功'
  })
}

/** 切换模型启用状态 */
export function fetchToggleChatModelStatus(id: number) {
  return request.put<Api.ChatModel.ListItem>({
    url: `/admin/chat-models/${id}/toggle-status`,
    showSuccessMessage: true,
    successMessage: '状态切换成功'
  })
}

/** 删除模型 */
export function fetchDeleteChatModel(id: number) {
  return request.del<null>({
    url: `/admin/chat-models/${id}`,
    showSuccessMessage: true,
    successMessage: '删除成功'
  })
}
