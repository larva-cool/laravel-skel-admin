import { AppRouteRecord } from '@/types/router'

export const operationRoutes: AppRouteRecord = {
  path: '/operation',
  name: 'Operation',
  component: '/index/index',
  meta: {
    title: '运营管理',
    icon: 'ri:bar-chart-box-line'
  },
  children: [
    {
      path: 'feedback',
      name: 'Feedback',
      component: '/operation/feedback',
      meta: {
        title: '反馈管理',
        icon: 'ri:feedback-line',
        keep_alive: true,
        auth_list: [
          { title: '处理反馈', auth_mark: 'feedbacks.edit' },
          { title: '删除反馈', auth_mark: 'feedbacks.delete' }
        ]
      }
    }
  ]
}
