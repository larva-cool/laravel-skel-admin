declare namespace Api {
  /** AI 知识库模块 */
  namespace Knowledge {
    /** 文档列表搜索参数 */
    interface SearchParams extends Api.Common.PaginationRequest {
      /** 关键词（标题） */
      keyword?: string
      /** 索引状态：pending/processing/ready/failed */
      status?: string
      /** 是否启用 */
      is_enabled?: boolean | string
    }

    /** 文档列表项 */
    interface ListItem {
      id: number
      /** 文档标题 */
      title: string
      /** 原始内容（仅详情接口返回） */
      content?: string
      /** 索引状态 */
      status: string
      /** 索引状态文案 */
      status_label: string
      /** 索引状态标签类型 */
      status_type: string
      /** 是否启用（停用不参与检索） */
      is_enabled: boolean
      /** 分块数量 */
      chunks_count: number
      /** 向量化消耗 Tokens */
      tokens: number
      /** 最近一次索引失败原因 */
      error: string | null
      /** 创建管理员 ID */
      created_by: number | null
      created_at: string | null
      updated_at: string | null
    }

    /** 文档列表响应（Laravel 分页） */
    type ListResponse = Api.Common.PaginatedResponse<ListItem>

    /** 新增/编辑文档参数 */
    interface SaveParams {
      title: string
      content: string
      is_enabled: boolean
    }

    /** 分块列表项 */
    interface ChunkItem {
      id: number
      document_id: number
      /** 分块文本内容 */
      content: string
      /** 该分块向量化消耗 Tokens */
      tokens: number
      /** 分块在文档内的顺序 */
      sort: number
      created_at: string | null
    }

    /** 分块列表响应（Laravel 分页） */
    type ChunkListResponse = Api.Common.PaginatedResponse<ChunkItem>

    /** 检索测试参数 */
    interface SearchTestParams {
      query: string
      limit?: number
    }

    /** 检索测试结果项 */
    interface SearchResultItem {
      chunk_id: number
      document_id: number
      /** 来源文档标题 */
      document_title: string
      /** 分块内容 */
      content: string
      /** 余弦相似度得分（0-1） */
      score: number
    }
  }
}
