# Laravel Skel Admin

基于 Vue 3 + TypeScript + Vite + Element Plus 的后台管理系统前端模板，配套后端为 [Laravel Skel Forge](https://codeup.aliyun.com/xutongle/Skel/laravel-skel-forge)。

## 技术栈

| 类别        | 技术                                                 |
| ----------- | ---------------------------------------------------- |
| 框架        | Vue 3.5 + TypeScript 5.6                             |
| 构建工具    | Vite 7.x                                             |
| UI 组件库   | Element Plus 2.x                                     |
| 状态管理    | Pinia 4.x + 持久化插件                               |
| 路由        | Vue Router 4.x（Hash 模式）                          |
| CSS 框架    | Tailwind CSS 4.x + SCSS                              |
| 图表        | ECharts 6.x                                          |
| HTTP 客户端 | Axios                                                |
| 实时通信    | Laravel Echo 2.x（Reverb）                           |
| 国际化      | Vue I18n 11.x                                        |
| 图标        | Iconify + Element Plus Icons                         |
| 代码规范    | ESLint 9 + Prettier + Stylelint + Husky + Commitlint |
| 包管理器    | pnpm >= 8.8.0                                        |

## 环境要求

- Node.js >= 22.0.0
- pnpm >= 8.8.0

## 快速开始

### 安装依赖

```bash
pnpm install
```

### 启动开发服务器

```bash
pnpm dev
```

开发服务器默认运行在 `http://localhost:3006`，端口可在 `.env` 中修改。API 请求通过 Vite 代理转发到后端 `http://laravel-skel-forge.test`。

### 生产构建

```bash
pnpm build
```

构建产物输出到 `dist/` 目录（先执行 `vue-tsc` 类型检查）。

### 本地预览生产构建

```bash
pnpm serve
```

### 代码检查与格式化

```bash
# ESLint 检查
pnpm lint

# ESLint 自动修复
pnpm fix

# Prettier 格式化
pnpm lint:prettier

# Stylelint 检查与修复
pnpm lint:stylelint
```

### Git 提交

项目使用 Commitizen + cz-git 规范提交信息：

```bash
pnpm commit
```

## 目录结构

```
src/
├── api/                 # API 请求封装
│   ├── auth.ts          # 认证接口
│   ├── chat.ts          # AI 聊天（SSE 流）
│   ├── dashboard.ts     # 仪表盘统计
│   ├── debug.ts         # 调试工具接口
│   ├── index.ts         # API 统一导出
│   ├── monitor.ts       # 监控相关（Horizon/Pulse）
│   ├── notification.ts  # 通知接口
│   ├── queue.ts         # 队列管理接口
│   ├── system-manage.ts # 系统管理接口
│   └── user-manage.ts   # 前台用户管理接口
├── assets/              # 静态资源
│   ├── images/          # 图片资源（头像、登录背景、SVG 错误页等）
│   ├── styles/          # 全局样式（Tailwind/Reset/Dark/El-UI/Mixin/动画）
│   └── svg/             # SVG 加载组件
├── components/          # 全局组件
│   └── core/            # 核心组件（布局、表单、表格、图表、卡片、Banners 等）
│       ├── base/        # 基础组件（Logo、SvgIcon、BackToTop）
│       ├── layouts/     # 布局组件（Header、Sidebar、SettingsPanel、ChatWindow 等）
│       ├── forms/       # 表单组件（ArtForm、ArtSearchBar、ArtDragVerify、ArtExcel 等）
│       ├── tables/      # 表格组件（ArtTable、ArtTableHeader）
│       ├── charts/      # 图表组件（8 种 ECharts 图表）
│       ├── cards/       # 卡片组件（Stats/Progress/DataList/Timeline/Image）
│       ├── banners/     # Banner 组件
│       ├── views/       # 业务视图组件（ArtException、ArtResultPage、登录视图）
│       ├── media/       # 媒体组件（ArtCutterImg、ArtVideoPlayer）
│       ├── others/      # 其他（ArtWatermark、ArtMenuRight）
│       ├── text-effect/ # 文字动效（ArtCountTo、ArtTextScroll、ArtFestivalTextScroll）
│       ├── theme/       # 主题组件
│       └── widget/      # IconButton
├── config/              # 应用配置（assets/modules/fastEnter/setting）
├── directives/          # 自定义指令（v-auth、v-roles、v-highlight、v-ripple）
├── enums/               # 枚举定义（appEnum、formEnum）
├── hooks/               # 组合式函数（useAppMode、useAuth、useChart、useCommon、useFastEnter、useHeaderBar、useLayoutHeight、useTable、useTableColumns、useTableHeight、useTheme）
├── locales/             # 国际化资源（zh / en）
├── plugins/             # 插件配置（echarts 按需注册）
├── router/              # 路由配置
│   ├── core/            # 路由核心逻辑（RouteRegistry、MenuProcessor、RoutePermissionValidator、RouteTransformer、ComponentLoader、IframeRouteManager）
│   ├── guards/          # 路由守卫（beforeEach、afterEach）
│   ├── modules/         # 路由模块（dashboard、exception、result、system）
│   ├── routes/          # 静态/异步路由定义
│   └── routesAlias.ts   # 路由别名
├── store/               # Pinia 状态管理
│   └── modules/         # 各模块 Store（menu、setting、table、user、worktab）
├── types/               # TypeScript 类型定义
│   ├── api/             # API 类型（api.d.ts）
│   ├── common/          # 通用类型（index、response）
│   ├── component/       # 组件类型（chart）
│   ├── config/          # 配置类型
│   ├── directive/       # 指令类型
│   ├── import/          # 自动导入类型声明
│   ├── router/          # 路由类型
│   └── store/           # Store 类型
├── utils/               # 工具函数
│   ├── constants/       # 常量（links 等）
│   ├── echo/            # Laravel Echo + Reverb 单例封装
│   ├── form/            # 表单工具（响应式校验）
│   ├── http/            # HTTP 请求封装（Axios 实例、错误处理、401 防抖、重试）
│   ├── navigation/      # 路由导航（jump、route、worktab）
│   ├── storage/         # 本地存储封装（StorageKeyManager 版本化 key、兼容迁移）
│   ├── sys/             # 系统工具（mittBus 事件总线、错误处理、控制台、升级检测）
│   ├── table/           # 表格工具（LRU 缓存、响应适配器、防抖）
│   ├── ui/              # UI 工具（颜色、动画、loading、tabs、emojo、iconify-loader）
│   └── index.ts         # 统一导出
├── views/               # 页面视图
│   ├── auth/login/      # 登录页（拖拽验证、主题/语言切换）
│   ├── dashboard/console/ # 工作台仪表盘
│   ├── exception/       # 异常页（403/404/500）
│   ├── index/           # 布局容器（根路径重定向）
│   ├── monitor/         # 监控页（audit-log 审计日志、debug、horizon、pulse、schedule-log 调度日志）
│   ├── outside/         # 外部页面（Iframe）
│   ├── result/          # 结果页（success/fail）
│   ├── system/          # 系统管理（admin 管理员、area 地区、attachment 附件、config 配置、mail-code 邮件验证码、menu 菜单、notification 通知、phone-code 短信验证码、role 角色、setting 设置、user-center 个人中心）
│   └── user/list/       # 前台用户管理
├── App.vue
├── env.d.ts
└── main.ts
```

## 环境变量

项目使用 `.env` 文件管理环境变量，支持多环境配置：

| 文件               | 说明     |
| ------------------ | -------- |
| `.env`             | 通用配置 |
| `.env.development` | 开发环境 |
| `.env.production`  | 生产环境 |

### 主要环境变量

| 变量                    | 说明                         | 默认值                            |
| ----------------------- | ---------------------------- | --------------------------------- |
| `VITE_VERSION`          | 应用版本号                   | `3.0.2`                           |
| `VITE_PORT`             | 开发服务器端口               | `3006`                            |
| `VITE_BASE_URL`         | 应用部署基础路径             | `/`                               |
| `VITE_API_URL`          | API 请求基础路径             | `/`（开发走代理，生产填完整地址） |
| `VITE_API_PROXY_URL`    | 开发环境代理目标地址         | `http://laravel-skel-forge.test`  |
| `VITE_ACCESS_MODE`      | 权限模式（frontend/backend） | `backend`                         |
| `VITE_WITH_CREDENTIALS` | 跨域请求是否携带 Cookie      | `false`                           |
| `VITE_OPEN_ROUTE_INFO`  | 是否开启路由信息展示         | `false`                           |
| `VITE_LOCK_ENCRYPT_KEY` | 锁屏加密密钥                 | `s3cur3k3y4adpro`                 |
| `VITE_DROP_CONSOLE`     | 生产构建是否移除 console     | 开发 `false` / 生产 `true`        |
| `VITE_REVERB_APP_KEY`   | Reverb 应用 Key              | `app-key`                         |
| `VITE_REVERB_HOST`      | Reverb WebSocket 主机        | `laravel-skel-forge.test`         |
| `VITE_REVERB_PORT`      | Reverb WebSocket 端口        | `8080`（开发）/ `443`（生产）     |
| `VITE_REVERB_SCHEME`    | Reverb 协议                  | `http`（开发）/ `https`（生产）   |

## 功能特性

- 多种菜单布局：侧边栏、顶部、混合、双列
- 多种主题风格：亮色 / 暗色 / 跟随系统
- 动态路由与权限控制（前端 / 后端两种模式）
- 标签页导航（worktab）
- 全局搜索、快速入口
- 国际化支持（中文 / 英文）
- 富文本编辑器（wangEditor）
- Excel 导入导出
- 图片裁剪
- 视频播放器
- 图表组件（ECharts 按需加载）
- 锁屏功能
- 水印
- 节日特效（彩屑、文字滚动）
- 数据持久化（Pinia + localStorage，版本化 key 自动迁移）
- AI 助手（SSE 流式对话 + 工具审批）
- 实时通知（Laravel Echo + Reverb WebSocket）

## 开发约定

### 路径别名

| 别名      | 路径                 |
| --------- | -------------------- |
| `@`       | `src/`               |
| `@views`  | `src/views/`         |
| `@imgs`   | `src/assets/images/` |
| `@icons`  | `src/assets/icons/`  |
| `@utils`  | `src/utils/`         |
| `@stores` | `src/store/`         |
| `@styles` | `src/assets/styles/` |

### 权限指令

```vue
<!-- 按钮级权限控制 -->
<button v-auth="'users.edit'">编辑</button>
<button v-roles="['super-admin']">超级管理员可见</button>
```

也可通过 `useAuth()` composable 在脚本中判断权限：

```ts
const { hasAuth } = useAuth()
if (hasAuth('users.create')) {
  // ...
}
```

### API 调用

HTTP 请求使用 Axios 封装的实例，自动注入 Bearer Token、处理 401 防抖登出、解析 Laravel 原生响应（不使用统一 code/msg/data 包装）：

```ts
import http from '@/utils/http'

// GET 请求
const { data } = await http.get('/admin/users', { params: { page: 1 } })

// POST 请求
const result = await http.post('/admin/auth/login', { account: 'admin', password: '123456' })
```

### AI 聊天

使用原生 `fetch` + `ReadableStream` 解析 SSE 流，绕过 Axios：

```ts
import { fetchChatStream } from '@/api/chat'

await fetchChatStream({
  message: '你好',
  onStart: () => {
    /* 流开始 */
  },
  onText: (text) => {
    /* 文本增量 */
  },
  onReasoning: (delta) => {
    /* 思考过程 */
  },
  onToolCall: (tool) => {
    /* 工具调用 */
  },
  onToolApprovalRequest: (approval) => {
    /* 需要人工审批 */
  },
  onError: (err) => {
    /* 错误 */
  },
  onEnd: () => {
    /* 流结束 */
  }
})
```

审批敏感操作时调用 `/admin/chat/approve` 继续执行。

### useTable Hook（企业级）

`useTable` 支持泛型自动推导、AbortController 取消竞态、LRU 缓存、5 种刷新策略、移动端分页适配：

```ts
const { tableData, loading, pagination, refreshData } = useTable({
  core: {
    apiFn: fetchGetUserList,
    apiParams: { page: 1, per_page: 20 },
    columnsFactory: () => [
      { prop: 'user_name', label: '用户名' }
      // ...
    ]
  }
})
```

## 配套后端

前端 API 基于 [Laravel Skel Forge](https://codeup.aliyun.com/xutongle/Skel/laravel-skel-forge) 后端项目，主要接口前缀：

- `/admin/*` - 后台管理接口（管理员、用户、角色、菜单、设置、地区、附件、审计日志、调度日志、监控、AI 聊天等）
- `/api/v1/*` - 前台 API（注册、登录、用户资料、通知等）

默认超级管理员账号：

- 用户名：`admin`
- 密码：`123456`

## 部署

### 构建静态文件

```bash
pnpm build
```

将 `dist/` 目录内容部署到任意静态文件服务器（Nginx 等）。

### Nginx 配置示例（Hash 模式）

```nginx
server {
    listen 80;
    server_name admin.example.com;
    root /path/to/dist;
    index index.html;

    # Hash 模式下所有路径返回 index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 反向代理 API 请求到后端
    location /admin/ {
        proxy_pass http://laravel-skel-forge.test/admin/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /api/ {
        proxy_pass http://laravel-skel-forge.test/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Reverb WebSocket 代理
    location /app {
        proxy_pass http://laravel-skel-forge.test:8080/app;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_read_timeout 86400;
    }

    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

## License

MIT
