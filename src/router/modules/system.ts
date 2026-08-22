import { AppRouteRecord } from '@/types/router'

export const systemRoutes: AppRouteRecord = {
  path: '/system',
  name: 'System',
  component: '/index/index',
  meta: {
    title: 'menus.system.title',
    icon: 'ri:user-3-line'
  },
  children: [
    {
      path: 'admin',
      name: 'Admin',
      component: '/system/admin',
      meta: {
        title: 'menus.system.admin',
        keep_alive: true
      }
    },
    {
      path: 'role',
      name: 'Role',
      component: '/system/role',
      meta: {
        title: 'menus.system.role',
        keep_alive: true
      }
    },
    {
      path: 'user-center',
      name: 'UserCenter',
      component: '/system/user-center',
      meta: {
        title: 'menus.system.userCenter',
        is_hide: true,
        keep_alive: true,
        is_hide_tab: true
      }
    },
    {
      path: 'menu',
      name: 'Menus',
      component: '/system/menu',
      meta: {
        title: 'menus.system.menu',
        keep_alive: true,
        auth_list: [
          { title: '新增', auth_mark: 'add' },
          { title: '编辑', auth_mark: 'edit' },
          { title: '删除', auth_mark: 'delete' }
        ]
      }
    },
    {
      path: 'config',
      name: 'SystemConfig',
      component: '/system/config',
      meta: {
        title: 'menus.system.config',
        keep_alive: true,
        icon: 'ri:settings-3-line'
      }
    },
    {
      path: 'attachment',
      name: 'Attachment',
      component: '/system/attachment',
      meta: {
        title: 'menus.system.attachment',
        keep_alive: true,
        auth_list: [
          { title: '登记附件', auth_mark: 'attachments.create' },
          { title: '编辑附件', auth_mark: 'attachments.edit' },
          { title: '删除附件', auth_mark: 'attachments.delete' }
        ]
      }
    },
    {
      path: 'app',
      name: 'AppRelease',
      component: '/system/app',
      meta: {
        title: 'menus.system.app',
        keep_alive: true,
        auth_list: [
          { title: '新增应用', auth_mark: 'apps.create' },
          { title: '编辑应用', auth_mark: 'apps.edit' },
          { title: '删除应用', auth_mark: 'apps.delete' }
        ]
      }
    },
    {
      path: 'app/:id/versions',
      name: 'AppVersion',
      component: '/system/app/version',
      meta: {
        title: 'menus.system.appVersion',
        keep_alive: true,
        is_hide: true,
        auth_list: [
          { title: '新增版本', auth_mark: 'app-versions.create' },
          { title: '编辑版本', auth_mark: 'app-versions.edit' },
          { title: '删除版本', auth_mark: 'app-versions.delete' }
        ]
      }
    }
  ]
}
