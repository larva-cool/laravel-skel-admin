/**
 * useAuth - 权限验证管理
 *
 * 提供统一的权限验证功能，支持前端和后端两种权限模式。
 * 用于控制页面按钮、操作等功能的显示和访问权限。
 *
 * ## 主要功能
 *
 * 1. 权限检查 - 检查用户是否拥有指定的权限标识
 * 2. 双模式支持 - 自动适配前端模式和后端模式的权限验证
 * 3. 前端模式 - 从用户信息中获取按钮权限列表（如 ['add', 'edit', 'delete']）
 * 4. 后端模式 - 从路由 meta 配置中获取权限列表（如 [{ auth_mark: 'add' }]）
 *
 * ## 使用示例
 *
 * ```typescript
 * const { hasAuth } = useAuth()
 *
 * // 检查是否有新增权限
 * if (hasAuth('add')) {
 *   // 显示新增按钮
 * }
 *
 * // 在模板中使用
 * <el-button v-if="hasAuth('edit')">编辑</el-button>
 * <el-button v-if="hasAuth('delete')">删除</el-button>
 * ```
 *
 * @module useAuth
 * @author Art Design Pro Team
 */

import { useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useUserStore } from '@/store/modules/user'
import { useAppMode } from '@/hooks/core/useAppMode'
import type { AppRouteRecord } from '@/types/router'

type AuthItem = NonNullable<AppRouteRecord['meta']['auth_list']>[number]

const userStore = useUserStore()

export const useAuth = () => {
  const route = useRoute()
  const { isFrontendMode } = useAppMode()
  const { adminInfo: info } = storeToRefs(userStore)

  // 前端按钮权限（例如：['add', 'edit']）
  const frontendAuthList = info.value?.buttons ?? []

  // 后端路由 meta 配置的权限列表（例如：[{ auth_mark: 'add' }]）
  const backendAuthList: AuthItem[] = Array.isArray(route.meta.auth_list)
    ? (route.meta.auth_list as AuthItem[])
    : []

  /**
   * 检查是否拥有某权限标识（前后端模式通用）
   *
   * 优先匹配后端下发的全局权限列表（adminInfo.buttons，含当前管理员的全部权限），
   * 以支持跨模块权限判断（如 A 列表页跳转查看 B 模块详情）；
   * 全局列表未命中时，再回退匹配当前路由 meta.auth_list。
   * @param auth 权限标识
   * @returns 是否有权限
   */
  const hasAuth = (auth: string): boolean => {
    // 全局权限列表（后端 AdminInfoResource 始终下发全部权限标识）
    if (frontendAuthList.includes(auth)) {
      return true
    }

    // 前端模式仅以全局按钮权限为准
    if (isFrontendMode.value) {
      return false
    }

    // 后端模式回退匹配当前路由配置的权限列表
    return backendAuthList.some((item) => item?.auth_mark === auth)
  }

  return {
    hasAuth
  }
}
