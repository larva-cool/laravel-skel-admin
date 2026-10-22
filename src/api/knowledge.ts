import request from '@/utils/http'

// ========== AI 知识库管理 ==========

/** 获取文档列表（分页） */
export function fetchGetKnowledgeList(params: Api.Knowledge.SearchParams) {
  return request.get<Api.Knowledge.ListResponse>({
    url: '/admin/knowledge-documents',
    params
  })
}

/** 获取文档详情（含原始内容） */
export function fetchGetKnowledgeDetail(id: number) {
  return request.get<Api.Knowledge.ListItem>({
    url: `/admin/knowledge-documents/${id}`
  })
}

/** 创建文档（自动触发异步索引） */
export function fetchCreateKnowledge(data: Api.Knowledge.SaveParams) {
  return request.post<Api.Knowledge.ListItem>({
    url: '/admin/knowledge-documents',
    data,
    showSuccessMessage: true,
    successMessage: '创建成功，索引任务已开始'
  })
}

/** 更新文档（内容变更时自动重建索引） */
export function fetchUpdateKnowledge(id: number, data: Api.Knowledge.SaveParams) {
  return request.put<Api.Knowledge.ListItem>({
    url: `/admin/knowledge-documents/${id}`,
    data,
    showSuccessMessage: true,
    successMessage: '更新成功'
  })
}

/** 切换文档启用状态 */
export function fetchToggleKnowledgeStatus(id: number) {
  return request.put<Api.Knowledge.ListItem>({
    url: `/admin/knowledge-documents/${id}/toggle-status`,
    showSuccessMessage: true,
    successMessage: '状态切换成功'
  })
}

/** 重建文档索引 */
export function fetchReindexKnowledge(id: number) {
  return request.post<Api.Knowledge.ListItem>({
    url: `/admin/knowledge-documents/${id}/reindex`,
    showSuccessMessage: true,
    successMessage: '索引任务已开始'
  })
}

/** 删除文档 */
export function fetchDeleteKnowledge(id: number) {
  return request.del<null>({
    url: `/admin/knowledge-documents/${id}`,
    showSuccessMessage: true,
    successMessage: '删除成功'
  })
}

/** 获取文档分块列表（分页） */
export function fetchGetKnowledgeChunks(id: number, params: Api.Common.PaginationRequest) {
  return request.get<Api.Knowledge.ChunkListResponse>({
    url: `/admin/knowledge-documents/${id}/chunks`,
    params
  })
}

/** 语义检索测试 */
export function fetchTestKnowledgeSearch(data: Api.Knowledge.SearchTestParams) {
  return request.post<Api.Knowledge.SearchResultItem[]>({
    url: '/admin/knowledge-documents/search',
    data
  })
}
