import request from '@/utils/http'
import type { AxiosResponse } from 'axios'

// ========== 评论管理（运营） ==========

// 获取评论列表（分页）
export function fetchGetCommentList(params: Api.ContentManage.CommentSearchParams) {
  return request.get<Api.ContentManage.CommentList>({
    url: '/admin/comments',
    params
  })
}

// 获取评论源类型选项
export function fetchGetCommentSourceTypes() {
  return request.get<{ label: string; value: string }[]>({
    url: '/admin/common/source-types'
  })
}

// 获取评论详情
export function fetchGetCommentDetail(id: number) {
  return request.get<Api.ContentManage.CommentListItem>({
    url: `/admin/comments/${id}`
  })
}

// 获取评论回复列表
export function fetchGetCommentReplies(id: number, params?: Partial<Api.Common.PaginationRequest>) {
  return request.get<Api.ContentManage.CommentList>({
    url: `/admin/comments/${id}/replies`,
    params
  })
}

// 审核评论
export function fetchReviewComment(id: number, data: Api.ContentManage.CommentReviewParams) {
  return request.post<Api.ContentManage.CommentListItem>({
    url: `/admin/comments/${id}/review`,
    data,
    showSuccessMessage: true,
    successMessage: '审核操作成功'
  })
}

// 删除评论
export function fetchDeleteComment(id: number) {
  return request.del<null>({
    url: `/admin/comments/${id}`,
    showSuccessMessage: true,
    successMessage: '删除成功'
  })
}

// 导出评论列表（返回原始响应，同步为 Blob / 异步为 JSON 由上层判断）
export function fetchExportComments(params?: Api.ContentManage.CommentSearchParams) {
  return request.get<AxiosResponse>({
    url: '/admin/comments/export',
    params,
    responseType: 'blob',
    returnRawResponse: true,
    showErrorMessage: true
  })
}
