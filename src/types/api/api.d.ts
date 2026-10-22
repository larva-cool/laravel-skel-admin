/**
 * API 接口类型定义入口
 *
 * 本文件为所有 API 类型声明的聚合入口，各命名空间类型按模块拆分到独立文件。
 * TypeScript 的 `declare namespace` 支持声明合并（Declaration Merging），
 * 各子文件中的 `Api` 命名空间会自动合并为同一个全局 `Api` 命名空间。
 *
 * ## 拆分文件清单
 *
 * | 文件 | 命名空间 | 说明 |
 * | --- | --- | --- |
 * | `common.d.ts` | `Api.Common` | 通用类型（分页参数、响应结构等） |
 * | `auth.d.ts` | `Api.Auth` | 认证类型（登录、用户信息等） |
 * | `system-manage.d.ts` | `Api.SystemManage` | 系统管理（管理员、角色、配置、菜单等） |
 * | `content-manage.d.ts` | `Api.ContentManage` | 内容运营（评论等） |
 * | `operation-manage.d.ts` | `Api.OperationManage` | 运营管理（Banner、公告、任务、敏感词等） |
 * | `segment-manage.d.ts` | `Api.SegmentManage` | 用户分群管理 |
 * | `user-manage.d.ts` | `Api.UserManage` | 用户管理（前台用户） |
 * | `chat.d.ts` | `Api.Chat` | AI 聊天模块 |
 * | `chat-model.d.ts` | `Api.ChatModel` | AI 模型管理模块 |
 * | `knowledge.d.ts` | `Api.Knowledge` | AI 知识库模块 |
 * | `notification.d.ts` | `Api.Notification` | 通知管理 |
 * | `monitor.d.ts` | `Api.Monitor` | 调度日志监控（调度日志、审计日志等） |
 * | `app-manage.d.ts` | `Api.AppManage` | App 版本管理 |
 * | `wallet-manage.d.ts` | `Api.WalletManage` | 钱包管理（流水 / 充值 / 提现） |
 * | `open-account.d.ts` | `Api.OpenAccount` | 开放平台账户管理 |
 *
 * ## 使用方式
 *
 * ```typescript
 * const params: Api.Auth.LoginParams = { account: 'admin', password: '123456' }
 * const response: Api.Auth.AdminInfo = await fetchUserInfo()
 * ```
 *
 * ## 注意事项
 *
 * - 在 .vue 文件使用需要在 eslint.config.mjs 中配置 globals: { Api: 'readonly' }
 * - 使用全局命名空间，无需导入即可使用
 * - 新增模块类型时，创建新的 `.d.ts` 文件并在上方清单中登记
 * - 各子文件由 tsconfig.json 的 include 配置自动纳入编译，无需 reference 指令
 */
