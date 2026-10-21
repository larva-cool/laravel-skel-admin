declare namespace Api {
  /** AI 模型管理模块 */
  namespace ChatModel {
    /** 模型列表搜索参数 */
    interface SearchParams extends Api.Common.PaginationRequest {
      /** 关键词（名称 / 模型 ID） */
      keyword?: string
      /** AI 服务商 */
      provider?: string
      /** 是否启用 */
      is_enabled?: boolean | string
    }

    /** 模型列表项 */
    interface ListItem {
      id: number
      /** AI 服务商 */
      provider: string
      /** 模型 ID（服务商侧标识） */
      model_id: string
      /** 展示名称 */
      name: string
      /** 是否默认模型 */
      is_default: boolean
      /** 是否启用 */
      is_enabled: boolean
      /** 排序（越小越靠前） */
      sort: number
      created_at: string | null
      updated_at: string | null
    }

    /** 模型列表响应（Laravel 分页） */
    type ListResponse = Api.Common.PaginatedResponse<ListItem>

    /** 新增/编辑模型参数 */
    interface SaveParams {
      provider: string
      model_id: string
      name: string
      is_default: boolean
      is_enabled: boolean
      sort: number
    }
  }
}
