declare namespace Api {
  /** 通用类型 */
  namespace Common {
    /** 分页状态（内部 UI 状态，绑定 ElPagination） */
    interface PaginationParams {
      /** 当前页码 */
      current: number
      /** 每页条数 */
      size: number
      /** 总条数 */
      total: number
    }

    /** 分页请求参数（Laravel 格式：发送给后端的参数名） */
    interface LaravelPaginationRequest {
      /** 当前页码 */
      page: number
      /** 每页条数 */
      per_page: number
    }

    /** 分页响应（Laravel 分页 JSON 结构） */
    interface PaginatedResponse<T = any> {
      data: T[]
      links?: Record<string, string | null>
      meta: {
        current_page: number
        per_page: number
        total: number
        last_page?: number
        from?: number
        to?: number
        [key: string]: any
      }
    }

    /** 通用搜索参数（继承 Laravel 分页请求参数） */
    type CommonSearchParams = LaravelPaginationRequest

    /** 启用状态 */
    type EnableStatus = '1' | '2'

    /** 导出异步响应（HTTP 202） */
    interface ExportTaskResponse {
      message: string
      file_name: string
    }
  }
}
