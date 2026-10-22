declare namespace Api {
  /** 系统管理类型 */
  namespace SystemManage {
    /** 管理员列表（Laravel 分页） */
    type AdminList = Api.Common.PaginatedResponse<AdminListItem>

    /** 管理员列表项（AdminResource） */
    interface AdminListItem {
      id: number
      username: string
      email: string | null
      phone: string | null
      name: string
      avatar: string | null
      /** 状态枚举 {value: 0|1, label: string} */
      status: { value: number; label: string }
      login_count: number
      last_login_ip: string | null
      last_login_at: string | null
      last_active_at: string | null
      /** 角色信息数组（whenLoaded） */
      roles?: { name: string; display_name: string }[]
      created_at: string | null
      updated_at: string | null
    }

    /** 管理员创建参数 */
    interface AdminCreateParams {
      username: string
      email?: string | null
      phone?: string | null
      name: string
      avatar?: string | null
      password: string
      status: number
      roles?: string[]
    }

    /** 管理员更新参数 */
    interface AdminUpdateParams {
      email?: string | null
      phone?: string | null
      name: string
      avatar?: string | null
      password?: string | null
      status: number
      roles?: string[]
    }

    /** 管理员搜索参数 */
    interface AdminSearchParams extends Api.Common.CommonSearchParams {
      keyword?: string
      role?: string
      status?: number
      last_login_ip?: string
      last_login_start?: string
      last_login_end?: string
    }

    /** 管理员登录历史列表（Laravel 分页） */
    type AdminLoginHistoryList = Api.Common.PaginatedResponse<AdminLoginHistoryItem>

    /** 管理员登录历史项（LoginHistoryResource） */
    interface AdminLoginHistoryItem {
      id: number
      ip: string
      port: number | null
      platform: string | null
      device: string | null
      browser: string | null
      user_agent: string | null
      address: string | null
      login_at: string | null
    }

    /** 管理员登录历史查询参数 */
    interface AdminLoginHistoryParams extends Api.Common.CommonSearchParams {
      keyword?: string
      login_start?: string
      login_end?: string
    }

    /** 角色列表（Laravel 分页） */
    type RoleList = Api.Common.PaginatedResponse<RoleListItem>

    /** 角色列表项（RoleResource） */
    interface RoleListItem {
      id: number
      name: string
      display_name: string
      permissions_count?: number
      created_at: string | null
      updated_at: string | null
    }

    /** 角色保存参数（创建/编辑） */
    interface RoleSaveParams {
      name: string
      display_name: string
      permissions?: number[]
    }

    /** 权限项 */
    interface PermissionItem {
      id: number
      name: string
      display_name: string
    }

    /** 角色搜索参数 */
    interface RoleSearchParams extends Api.Common.CommonSearchParams {
      role_name?: string
      display_name?: string
    }

    /** 配置列表（Laravel 分页） */
    type SettingList = Api.Common.PaginatedResponse<SettingListItem>

    /** 配置列表项（SettingResource） */
    interface SettingListItem {
      id: number
      name: string
      key: string
      value: string | null
      cast_type: string
      input_type: string
      param: string | null
      sort: number
      remark: string | null
      updated_at: string | null
    }

    /** 配置保存参数（创建/编辑） */
    interface SettingSaveParams {
      name: string
      key: string
      value?: string | null
      cast_type: string
      input_type: string
      param?: string | null
      sort?: number
      remark?: string | null
    }

    /** 配置搜索参数 */
    interface SettingSearchParams extends Api.Common.CommonSearchParams {
      keyword?: string
      cast_type?: string
    }

    /** 配置项元数据（分组接口返回） */
    interface SettingGroupItem {
      name: string
      key: string
      field: string
      value: string | number | boolean | null
      cast_type: string
      input_type: string
      param: Record<string, any> | null
      remark: string | null
      sort: number
    }

    /** 配置分组 */
    interface SettingGroup {
      key: string
      title: string
      items: SettingGroupItem[]
    }

    /** 分组配置响应 */
    interface SettingGroupsResponse {
      groups: SettingGroup[]
      disks: string[]
    }

    /** 配置输入类型选项 */
    interface SettingInputTypeOption {
      value: string
      label: string
    }

    /** 配置输入类型响应 */
    interface SettingInputTypesResponse {
      data: SettingInputTypeOption[]
    }

    /** 地区列表项（AreaResource） */
    interface AreaListItem {
      id: number
      parent_id: number | null
      name: string
      area_code: number | null
      lat: number | null
      lng: number | null
      city_code: string | null
      sort: number
      created_at: string | null
      updated_at: string | null
      children?: AreaListItem[]
    }

    /** 地区保存参数（创建/编辑） */
    interface AreaSaveParams {
      parent_id?: number | null
      name: string
      area_code?: number | null
      lat?: number | null
      lng?: number | null
      city_code?: string | null
      sort?: number
    }

    /** 地区搜索参数 */
    interface AreaSearchParams {
      name?: string
      parent_id?: string
    }

    /** 菜单类型枚举值 */
    type MenuTypeValue = 0 | 1 | 2 | 3 | 4

    /** 菜单树节点（/admin/menus/tree 返回） */
    interface MenuTreeItem {
      id: number
      parent_id: number | null
      path: string | null
      name: string | null
      component: string | null
      redirect: string | null
      title: string
      icon: string | null
      link: string | null
      type: { value: MenuTypeValue; label: string }
      sort: number
      is_enable: boolean
      is_hide: boolean
      is_hide_tab: boolean
      is_iframe: boolean
      keep_alive: boolean
      is_full_page: boolean
      fixed_tab: boolean
      show_badge: boolean
      show_text_badge: string | null
      active_path: string | null
      permission: string | null
      children?: MenuTreeItem[]
    }

    /** 菜单保存参数（创建/编辑） */
    interface MenuSaveParams {
      parent_id?: number | null
      path?: string | null
      name?: string | null
      component?: string | null
      redirect?: string | null
      title: string
      icon?: string | null
      link?: string | null
      type: MenuTypeValue
      sort: number
      is_enable: boolean
      is_hide: boolean
      is_hide_tab: boolean
      is_iframe: boolean
      keep_alive: boolean
      is_full_page: boolean
      fixed_tab: boolean
      show_badge: boolean
      show_text_badge?: string | null
      active_path?: string | null
      permission?: string | null
    }

    /** 短信验证码列表（Laravel 分页） */
    type PhoneCodeList = Api.Common.PaginatedResponse<PhoneCodeListItem>

    /** 短信验证码列表项（PhoneCodeResource） */
    interface PhoneCodeListItem {
      id: number
      phone: string
      scene: string
      code: string
      ip: string | null
      /** 状态枚举 {value: 0|1, label: string} */
      state: { value: number; label: string }
      send_at: string | null
      created_at: string | null
      updated_at: string | null
    }

    /** 短信验证码搜索参数 */
    interface PhoneCodeSearchParams extends Api.Common.CommonSearchParams {
      phone?: string
      scene?: string
      state?: number
    }

    /** 邮件验证码列表（Laravel 分页） */
    type MailCodeList = Api.Common.PaginatedResponse<MailCodeListItem>

    /** 邮件验证码列表项（MailCodeResource） */
    interface MailCodeListItem {
      id: number
      email: string
      scene: string
      code: string
      ip: string | null
      /** 状态枚举 {value: 0|1, label: string} */
      state: { value: number; label: string }
      send_at: string | null
      created_at: string | null
      updated_at: string | null
    }

    /** 邮件验证码搜索参数 */
    interface MailCodeSearchParams extends Api.Common.CommonSearchParams {
      email?: string
      state?: number
    }

    /** 附件列表（Laravel 分页） */
    type AttachmentList = Api.Common.PaginatedResponse<AttachmentListItem>

    /** 附件列表项（AttachmentResource） */
    interface AttachmentListItem {
      id: number
      name: string
      original_name: string
      disk: string
      path: string
      url: string | null
      /** 可直接展示的地址：公开磁盘为直链，私有磁盘为临时签名地址 */
      preview_url: string | null
      type: { value: string; label: string }
      extension: string
      mime_type: string
      size: number
      size_text: string
      uploader?: {
        id: number
        name: string | null
      } | null
      created_at: string | null
      exists?: boolean
    }

    /** 附件搜索参数 */
    interface AttachmentSearchParams extends Api.Common.CommonSearchParams {
      keyword?: string
      type?: string
      disk?: string
      extension?: string
      uploader_id?: number
      start_date?: string
      end_date?: string
    }

    /** 附件重命名参数 */
    interface AttachmentRenameParams {
      name: string
    }

    /** 附件移动参数（后端仅支持同磁盘内移动路径） */
    interface AttachmentMoveParams {
      path: string
    }

    /** 附件批量删除参数 */
    interface AttachmentBatchDeleteParams {
      ids: number[]
    }

    /** 中转上传返回结果 */
    interface AttachmentUploadResult {
      id: number
      url: string | null
      storage: string
      origin_name: string
      file_name: string
      file_path: string
      file_size: number
      file_ext: string
      mime_type: string
    }

    /** 直传签名返回结果 */
    interface AttachmentUploadToken {
      url: string
      headers: Record<string, string>
      path: string
    }

    /** 直传完成后登记附件参数 */
    interface AttachmentRegisterParams {
      path: string
      disk?: string
      original_name?: string
    }

    // ========== 字典管理 ==========

    /** 字典类型列表（Laravel 分页） */
    type DictList = Api.Common.PaginatedResponse<DictListItem>

    /** 字典类型列表项 */
    interface DictListItem {
      id: number
      name: string
      code: string
      status: number
      sort: number
      remark: string | null
      created_at: string | null
      updated_at: string | null
    }

    /** 字典类型保存参数 */
    interface DictSaveParams {
      name: string
      code: string
      status: number
      sort?: number
      remark?: string | null
    }

    /** 字典类型搜索参数 */
    interface DictSearchParams extends Api.Common.CommonSearchParams {
      keyword?: string
      status?: number | string
    }

    /** 字典数据项列表（Laravel 分页） */
    type DictItemList = Api.Common.PaginatedResponse<DictItemListItem>

    /** 字典数据项列表项 */
    interface DictItemListItem {
      id: number
      dict_id: number
      label: string
      value: string
      label_type: string
      status: number
      sort: number
      remark: string | null
      created_at: string | null
      updated_at: string | null
    }

    /** 字典数据项保存参数 */
    interface DictItemSaveParams {
      dict_id: number
      label: string
      value: string
      label_type?: string
      status: number
      sort?: number
      remark?: string | null
    }

    /** 字典数据项搜索参数 */
    interface DictItemSearchParams extends Api.Common.CommonSearchParams {
      dict_id?: number
      keyword?: string
      status?: number | string
    }

    // ========== 反馈管理 ==========

    /** 反馈统计数据 */
    interface FeedbackStats {
      total: number
      pending: number
      today: number
      closed: number
    }

    /** 反馈列表（Laravel 分页） */
    type FeedbackList = Api.Common.PaginatedResponse<FeedbackListItem>

    /** 反馈列表项 */
    interface FeedbackListItem {
      id: number
      code: string
      title: string
      content?: string
      images: string[]
      type: string
      type_label: string
      type_label_type: string
      status: number
      status_label: string
      status_label_type: string
      priority: number
      priority_label: string
      priority_label_type: string
      contact_name: string | null
      contact_info: string | null
      user_agent?: string | null
      ip_address?: string | null
      user_id: number | null
      admin_id: number | null
      admin_name?: string | null
      admin_remark: string | null
      resolved_at: string | null
      closed_at: string | null
      created_at: string | null
      updated_at: string | null
    }

    /** 反馈搜索参数 */
    interface FeedbackSearchParams extends Api.Common.CommonSearchParams {
      keyword?: string
      type?: string
      status?: number | string
      priority?: number | string
    }

    /** 实名认证统计数据 */
    interface IdentityVerificationStats {
      total: number
      pending: number
      today: number
      approved: number
      rejected: number
    }

    /** 实名认证附件 */
    interface IdentityAttachment {
      id: number
      url: string
      name: string
      size: number
      size_text: string
    }

    /** 实名认证申请人（管理端简化，多态） */
    interface IdentityVerifiableBrief {
      id: number
      name: string | null
    }

    /** 实名认证列表项（对齐 Admin IdentityVerificationResource） */
    interface IdentityVerificationListItem {
      id: number
      verifiable_type: string
      verifiable_id: number
      verifiable: IdentityVerifiableBrief | null
      type: 'personal' | 'enterprise'
      type_label: string
      status: 'pending' | 'review' | 'approved' | 'rejected'
      status_label: string
      status_label_type: string
      real_name: string | null
      id_card_no: string | null
      id_card_front: IdentityAttachment | null
      id_card_back: IdentityAttachment | null
      handheld: IdentityAttachment | null
      company_name: string | null
      credit_code: string | null
      legal_person_name: string | null
      legal_person_id_card_no: string | null
      business_license: IdentityAttachment | null
      opening_permit: IdentityAttachment | null
      bank_account: string | null
      bank_name: string | null
      admin_id: number | null
      admin_name: string | null
      reject_reason: string | null
      reject_reason_label: string | null
      reject_reason_label_type: string
      reject_remark: string | null
      submitted_at: string | null
      reviewed_at: string | null
      expires_at: string | null
      created_at: string | null
      updated_at: string | null
    }

    /** 实名认证列表（分页） */
    type IdentityVerificationList = Api.Common.PaginatedResponse<IdentityVerificationListItem>

    /** 实名认证搜索参数 */
    interface IdentityVerificationSearchParams extends Api.Common.CommonSearchParams {
      keyword?: string
      verifiable_id?: number
      type?: 'personal' | 'enterprise'
      status?: 'pending' | 'review' | 'approved' | 'rejected'
      start_date?: string
      end_date?: string
    }

    /** 反馈更新参数（处理反馈） */
    interface FeedbackUpdateParams {
      status?: number
      priority?: number
      admin_remark?: string | null
    }

    /** AI 草拟反馈回复结果 */
    interface FeedbackDraftReplyResult {
      /** 回复草稿 */
      draft: string
    }

    // ========== 举报管理 ==========

    /** AI 举报智能初判结果 */
    interface ReportAiTriageResult {
      /** 初判建议：uphold=举报成立，reject=举报不成立 */
      suggestion: 'uphold' | 'reject'
      /** 初判建议文案 */
      suggestion_label: string
      /** 判断理由 */
      reason: string
    }

    /** 举报统计数据 */
    interface ReportStats {
      total: number
      pending: number
      today: number
      closed: number
    }

    /** 举报被举报对象快照（按类型返回不同字段） */
    interface ReportSnapshotComment {
      type: 'comment'
      id: number
      user_id?: number
      username?: string | null
      content?: string
      status?: string
      status_label?: string
      created_at?: string | null
    }

    /** 举报被举报对象快照（用户） */
    interface ReportSnapshotUser {
      type: 'user'
      id: number
      username?: string | null
      nickname?: string | null
      avatar?: string | null
      status?: number
      status_label?: string
      registered_at?: string | null
    }

    type ReportSnapshot =
      ReportSnapshotComment | ReportSnapshotUser | Record<string, unknown> | null

    /** 联动处置动作记录 */
    interface ReportProcessAction {
      type: 'hide_comment' | 'delete_comment' | 'freeze_user'
      reason?: string
    }

    /** 举报列表项（Admin ReportResource 列表形态） */
    interface ReportListItem {
      id: number
      user_id: number
      username?: string | null
      nickname?: string | null
      category: string
      category_label?: string
      category_label_type?: string
      status: 'pending' | 'processing' | 'resolved' | 'rejected'
      status_label?: string
      status_label_type?: string
      reportable_type: string
      reportable_type_label?: string
      reportable_id: number
      handler_id?: number | null
      handler_name?: string | null
      processed_at?: string | null
      created_at: string | null
    }

    /** 举报详情（Admin ReportResource 详情形态，含 reason/evidence/snapshot/process_actions） */
    interface ReportDetail extends ReportListItem {
      reason?: string | null
      evidence?: string[]
      reportable_snapshot?: ReportSnapshot
      process_remark?: string | null
      process_actions?: ReportProcessAction[]
    }

    /** 举报列表（分页） */
    type ReportList = Api.Common.PaginatedResponse<ReportListItem>

    /** 举报搜索参数 */
    interface ReportSearchParams extends Api.Common.CommonSearchParams {
      keyword?: string
      status?: 'pending' | 'processing' | 'resolved' | 'rejected'
      category?: string
      reportable_type?: string
      handler_id?: number
      start_date?: string
      end_date?: string
    }

    /** 举报处理参数（处理举报） */
    interface ReportProcessParams {
      status: 'resolved' | 'rejected'
      remark?: string | null
      actions?: ReportProcessAction[]
    }
  }
}
