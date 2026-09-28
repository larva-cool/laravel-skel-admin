declare namespace Api {
  /** App 版本管理类型 */
  namespace AppManage {
    /** 应用列表（Laravel 分页） */
    type AppList = Api.Common.PaginatedResponse<AppListItem>

    /** 应用列表项 */
    interface AppListItem {
      id: number
      name: string
      slug: string
      description: string | null
      icon: string | null
      sort: number
      status: boolean
      latest_versions: {
        android: {
          version: string
          build: number
          force_update: boolean
          published_at: string | null
        } | null
        ios: {
          version: string
          build: number
          force_update: boolean
          published_at: string | null
        } | null
        harmony: {
          version: string
          build: number
          force_update: boolean
          published_at: string | null
        } | null
      }
      created_at: string | null
      updated_at: string | null
    }

    /** 应用搜索参数 */
    interface AppSearchParams extends Api.Common.CommonSearchParams {
      keyword?: string
      status?: boolean
      start_date?: string
      end_date?: string
    }

    /** 应用保存参数 */
    interface AppSaveParams {
      name: string
      slug: string
      description?: string | null
      icon?: string | null
      sort?: number
      status?: boolean
    }

    /** 版本列表（Laravel 分页） */
    type VersionList = Api.Common.PaginatedResponse<VersionListItem>

    /** 版本列表项 */
    interface VersionListItem {
      id: number
      app_release_id: number
      platform: { value: string; label: string }
      version: string
      build: number
      download_url: string
      release_notes: string | null
      min_supported_version: string | null
      min_supported_build: number
      force_update: boolean
      file_size: number | null
      file_hash: string | null
      status: { value: string; label: string }
      published_at: string | null
      created_by: number | null
      created_at: string | null
      updated_at: string | null
    }

    /** 版本搜索参数 */
    interface VersionSearchParams extends Api.Common.CommonSearchParams {
      platform?: string
      status?: string
      version?: string
      force_update?: boolean
      start_date?: string
      end_date?: string
    }

    /** 版本保存参数 */
    interface VersionSaveParams {
      platform: string
      version: string
      build: number
      download_url: string
      release_notes?: string | null
      min_supported_version?: string | null
      min_supported_build?: number
      force_update?: boolean
      file_size?: number | null
      file_hash?: string | null
      status?: string
    }

    /** APK 上传返回 */
    interface ApkUploadResult {
      id: number
      url: string
      file_name: string
      file_path: string
      file_size: number
      file_ext: string
      origin_name: string
      storage: string
    }
  }
}
