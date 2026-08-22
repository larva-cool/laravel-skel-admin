/**
 * v-auth 权限指令
 *
 * 适用于后端权限控制模式，基于权限标识控制 DOM 元素的显示和隐藏。
 * 如果用户没有对应权限，元素将从 DOM 中移除。
 *
 * ## 主要功能
 *
 * - 权限验证 - 根据路由 meta 中的权限列表验证用户权限
 * - DOM 控制 - 无权限时自动移除元素，而非隐藏
 * - 响应式更新 - 权限变化时自动更新元素状态
 * - KeepAlive 支持 - 组件激活时重新检查权限
 *
 * ## 使用示例
 *
 * ```vue
 * <!-- 只有拥有 'add' 权限的用户才能看到新增按钮 -->
 * <el-button v-auth="'add'">新增</el-button>
 *
 * <!-- 只有拥有 'edit' 权限的用户才能看到编辑按钮 -->
 * <el-button v-auth="'edit'">编辑</el-button>
 *
 * <!-- 只有拥有 'delete' 权限的用户才能看到删除按钮 -->
 * <el-button v-auth="'delete'">删除</el-button>
 * ```
 *
 * ## 注意事项
 *
 * - 该指令会直接移除 DOM 元素，而不是使用 v-if 隐藏
 * - 权限列表从当前路由的 meta.auth_list 中获取
 *
 * @module directives/auth
 * @author Art Design Pro Team
 */

import { router } from '@/router'
import { App, DirectiveBinding, ObjectDirective } from 'vue'

export type AuthDirective = ObjectDirective<HTMLElement, string> & {
  activated?(el: HTMLElement, binding: DirectiveBinding<string>): void
}

/** 保存每个元素的占位注释节点，用于 KeepAlive 场景恢复元素 */
const placeholderMap = new WeakMap<HTMLElement, Comment>()

function hasPermission(authMark: string): boolean {
  const authList = (router.currentRoute.value.meta.auth_list as Array<{ auth_mark: string }>) || []
  return authList.some((item) => item.auth_mark === authMark)
}

function showElement(el: HTMLElement): void {
  const placeholder = placeholderMap.get(el)
  if (!placeholder || !placeholder.parentNode) {
    return
  }
  placeholder.parentNode.insertBefore(el, placeholder)
  placeholder.parentNode.removeChild(placeholder)
  placeholderMap.delete(el)
}

function hideElement(el: HTMLElement): void {
  if (placeholderMap.has(el)) {
    return
  }
  const placeholder = document.createComment('v-auth')
  placeholderMap.set(el, placeholder)
  if (el.parentNode) {
    el.parentNode.insertBefore(placeholder, el)
    el.parentNode.removeChild(el)
  }
}

function updateVisibility(el: HTMLElement, binding: DirectiveBinding<string>): void {
  if (hasPermission(binding.value)) {
    showElement(el)
  } else {
    hideElement(el)
  }
}

const authDirective: AuthDirective = {
  mounted(el, binding) {
    updateVisibility(el, binding)
  },
  updated(el, binding) {
    updateVisibility(el, binding)
  },
  // KeepAlive 组件激活时重新检查权限
  // 例如从详情页返回列表页时，路由 auth_list 变化了
  activated(el, binding) {
    updateVisibility(el, binding)
  }
}

export function setupAuthDirective(app: App): void {
  app.directive('auth', authDirective)
}
