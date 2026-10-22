declare namespace Api {
  /** 运营管理模块（Banner / 轮播图） */
  namespace OperationManage {
    /** AI 生成公告文案结果 */
    interface AnnouncementAiCopyResult {
      /** 公告标题 */
      title: string
      /** 公告摘要 */
      summary: string
      /** 公告正文（HTML） */
      content: string
    }

    /** AI 生成 Banner 文案结果 */
    interface BannerAiCopyResult {
      /** Banner 标题 */
      title: string
      /** 绘图提示词（供 AI 配图使用） */
      image_prompt: string
    }

    /** AI 生成 Banner 配图结果 */
    interface BannerAiImageResult {
      /** 存储路径 */
      path: string
      /** 访问 URL */
      url: string
    }

    /** Banner 列表（分页） */
    type BannerList = Api.Common.PaginatedResponse<BannerListItem>

    /** Banner 列表项（Admin BannerResource） */
    interface BannerListItem {
      id: number
      position: string
      position_label?: string | null
      title: string
      image: string
      link_type: string
      link_type_label?: string | null
      link_value: string | null
      sort: number
      status: boolean
      start_at: string | null
      end_at: string | null
      created_at: string | null
      updated_at: string | null
    }

    /** Banner 搜索参数 */
    interface BannerSearchParams extends Api.Common.CommonSearchParams {
      keyword?: string
      position?: string
      status?: boolean
    }

    /** Banner 保存参数（创建/编辑共用） */
    interface BannerSaveParams {
      position: string
      title?: string
      image: string
      link_type: string
      link_value?: string | null
      sort?: number
      status?: boolean
      start_at?: string | null
      end_at?: string | null
    }

    /** 拖拽排序参数 */
    interface BannerSortParams {
      ids: number[]
    }

    /** 广告位选项 */
    interface BannerPositionOption {
      label: string
      value: string
    }

    /** 公告列表（分页） */
    type AnnouncementList = Api.Common.PaginatedResponse<AnnouncementListItem>

    /** 公告列表项（Admin AnnouncementResource） */
    interface AnnouncementListItem {
      id: number
      title: string
      summary: string | null
      content?: string
      cover_image: string | null
      status: string
      status_label?: string
      status_label_type?: string
      sort: number
      admin_id: number
      admin?: { id: number; name: string } | null
      published_at: string | null
      created_at: string | null
      updated_at: string | null
    }

    /** 公告搜索参数 */
    interface AnnouncementSearchParams extends Api.Common.CommonSearchParams {
      keyword?: string
      status?: string
    }

    /** 公告保存参数（创建/编辑共用） */
    interface AnnouncementSaveParams {
      title: string
      summary?: string | null
      content: string
      cover_image?: string | null
      status?: string
      sort?: number
    }

    // ========== 任务分组管理（运营） ==========

    /** 任务分组列表（分页） */
    type TaskGroupList = Api.Common.PaginatedResponse<TaskGroupListItem>

    /** 任务分组列表项 */
    interface TaskGroupListItem {
      id: number
      name: string
      code: string
      type: number
      type_label?: string
      reset_type: number
      reset_type_label?: string
      sort_order: number
      icon: string | null
      description: string | null
      status: boolean
      tasks_count?: number
      tasks?: TaskListItem[]
      created_at: string | null
      updated_at: string | null
    }

    /** 任务分组搜索参数 */
    interface TaskGroupSearchParams extends Api.Common.CommonSearchParams {
      keyword?: string
      status?: boolean
    }

    /** 任务分组保存参数 */
    interface TaskGroupSaveParams {
      name: string
      code: string
      type: number
      reset_type: number
      sort_order?: number
      icon?: string | null
      description?: string | null
      status?: boolean
    }

    // ========== 任务管理（运营） ==========

    /** 任务列表（分页） */
    type TaskList = Api.Common.PaginatedResponse<TaskListItem>

    /** 任务列表项 */
    interface TaskListItem {
      id: number
      group_id: number
      group?: { id: number; name: string } | null
      name: string
      code: string
      type: string
      type_label?: string
      description: string | null
      condition: {
        serial_days?: number
        target_value?: number
        completeness_threshold?: number
      }
      reward_type: string
      reward_type_label?: string
      reward_amount: number
      claim_mode: number
      claim_mode_label?: string
      sort_order: number
      target_value: number
      start_at: string | null
      end_at: string | null
      status: boolean
      created_at: string | null
      updated_at: string | null
    }

    /** 任务搜索参数 */
    interface TaskSearchParams extends Api.Common.CommonSearchParams {
      keyword?: string
      group_id?: number
      type?: string
      status?: boolean
    }

    /** 任务保存参数 */
    interface TaskSaveParams {
      group_id: number
      name: string
      code: string
      type: string
      description?: string | null
      condition?: {
        serial_days?: number
        target_value?: number
        completeness_threshold?: number
      }
      reward_type: string
      reward_amount: number
      claim_mode: number
      sort_order?: number
      start_at?: string | null
      end_at?: string | null
      status?: boolean
    }

    // ========== 任务记录（运营） ==========

    /** 任务记录列表（分页） */
    type TaskLogList = Api.Common.PaginatedResponse<TaskLogListItem>

    /** 任务记录列表项 */
    interface TaskLogListItem {
      id: number
      user_id: number
      user?: {
        id: number
        username: string | null
        nickname: string | null
        avatar: string | null
      } | null
      task_id: number
      task?: {
        id: number
        name: string
        code: string
      } | null
      period_key: string
      reward_type: string
      reward_type_label?: string
      reward_amount: number
      source_type: string | null
      remark: string | null
      created_at: string | null
    }

    /** 任务记录搜索参数 */
    interface TaskLogSearchParams extends Api.Common.CommonSearchParams {
      keyword?: string
      task_id?: number
      reward_type?: string
      start_date?: string
      end_date?: string
    }

    // ========== 敏感词管理 ==========

    /** 敏感词列表（分页） */
    type SensitiveWordList = Api.Common.PaginatedResponse<SensitiveWordListItem>

    /** 敏感词列表项 */
    interface SensitiveWordListItem {
      id: number
      word: string
      category: string
      category_label?: string
      level: 'replace' | 'review' | 'block'
      level_label?: string
      replacement: string
      hit_count: number
      status: boolean
      created_at: string | null
      updated_at: string | null
    }

    /** 敏感词搜索参数 */
    interface SensitiveWordSearchParams extends Api.Common.CommonSearchParams {
      keyword?: string
      category?: string
      level?: 'replace' | 'review' | 'block'
      status?: boolean
    }

    /** 敏感词保存参数 */
    interface SensitiveWordSaveParams {
      word: string
      category?: string
      level?: 'replace' | 'review' | 'block'
      replacement?: string
      status?: boolean
    }

    /** 批量导入项 */
    interface SensitiveWordImportItem {
      word: string
      category?: string
      level?: 'replace' | 'review' | 'block'
    }

    /** 批量导入参数 */
    interface SensitiveWordImportParams {
      words: SensitiveWordImportItem[]
    }

    /** 批量导入结果 */
    interface SensitiveWordImportResult {
      created: number
      skipped: string[]
    }

    /** 字典刷新结果 */
    interface SensitiveWordRefreshResult {
      message: string
      total: number
    }

    /** 选项项 */
    interface OptionItem {
      label: string
      value: string
    }

    /** 分类/级别选项 */
    interface SensitiveWordOptions {
      categories: OptionItem[]
      levels: OptionItem[]
    }

    // ========== 协议管理（运营） ==========

    /** 协议列表（分页） */
    type AgreementList = Api.Common.PaginatedResponse<AgreementListItem>

    /** 协议列表项（Admin AgreementResource） */
    interface AgreementListItem {
      id: number
      title: string
      category: string
      content?: string
      version: string
      status: string
      status_label?: string
      status_label_type?: string
      effective_at: string | null
      sort: number
      admin_id: number
      admin?: { id: number; name: string } | null
      created_at: string | null
      updated_at: string | null
    }

    /** 协议搜索参数 */
    interface AgreementSearchParams extends Api.Common.CommonSearchParams {
      keyword?: string
      category?: string
      status?: string
    }

    /** 协议保存参数（创建/编辑共用） */
    interface AgreementSaveParams {
      title: string
      category: string
      content: string
      version: string
      status?: string
      effective_at?: string | null
      sort?: number
    }
  }
}
