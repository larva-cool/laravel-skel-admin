<frontend-guidelines>
=== foundation rules ===

# 前端开发规范

本规范专为 laravel-skel-admin 前端项目定制，构建 Vue 3 + TypeScript + Vite 应用时请严格遵循。

## 基础上下文

本项目是一个 Vue 3 SPA（单页应用）管理后台。主要生态包及版本如下，请确保熟悉并遵守：

- vue - v3.5
- typescript - v5.6
- vite - v7.3
- element-plus - v2.14
- pinia - v4.0
- vue-router - v4.6
- tailwindcss - v4.3
- axios - v1.19
- echarts - v6.0
- @vueuse/core - v14.4
- laravel-echo - v2.4
- sass - v1.102
- node - 22.x
- pnpm - >=8.8.0

## 技能激活

项目在 `**/skills/**` 目录下有领域相关技能，在对应领域工作时必须主动激活相关技能，不要等遇到问题才想起。

## 约定

- 必须遵循项目中已有的代码约定。创建或编辑文件时，参考同级文件的结构、方式和命名。
- 变量和函数使用描述性名称，例如 `handleUserSubmit`，而不是 `submit`。
- **优先使用 `art-` 前缀全局组件**：编写新组件或搭建页面之前，必须先检查 `src/components/core/` 中是否已有可复用的 `art-` 前缀组件。仅当现有组件确实无法满足需求时，才允许自定义组件。详见 [art- 前缀全局组件使用规范](#art-前缀全局组件使用规范)。
- 所有新 Vue 组件使用 Composition API + `<script setup lang="ts">` 语法。

## 验证脚本

- 当有单元/集成测试覆盖时，不要创建验证脚本或手动测试脚本。
- UI 验证优先使用 Playwright/webapp-testing 技能进行浏览器测试。

## 应用结构与架构

- 保持现有目录结构，未经批准不要新建根级目录。
- 未经批准不要更改项目依赖。
- 新业务页面放在 `src/views/{模块名}/` 下，包含 `index.vue` 入口文件和 `modules/` 子组件目录。
- 新 API 文件放在 `src/api/` 下，遵循现有命名约定（`模块名.ts`）。

## 页面组织规范

每个业务页面遵循统一的目录结构和组件组装方式，确保代码一致性和可维护性。

### 目录结构

```
src/views/{模块名}/
├── index.vue              # 页面入口（组合 useTable + ArtTable + dialog 组件）
└── modules/               # 页面私有子组件（仅当前页面使用）
    ├── xxx-search.vue     # 搜索栏（基于 ArtSearchBar）
    ├── xxx-dialog.vue     # 新建/编辑弹窗
    └── xxx-detail-dialog.vue  # 详情弹窗
```

### 页面组装原则

1. **入口文件职责单一**：`index.vue` 只负责数据管理（useTable、API 调用）和组件编排，不编写复杂模板片段。
2. **搜索区**：使用 `ArtSearchBar`，搜索项通过 `schema` 配置声明，不手写表单结构。
3. **表格区**：使用 `ArtTable` + `ArtTableHeader` 组合，列配置通过 `columnsFactory` 生成。
4. **操作按钮**：表格行操作采用 `ArtButtonTable`（图标按钮，常用操作内联）+ `ArtButtonMore`（更多下拉菜单，收纳次要/危险操作）组合；批量操作按钮放 `ArtTableHeader`。操作列按钮折叠规则见下方「操作列折叠规范」。
5. **弹窗区**：新建/编辑弹窗放在 `modules/` 目录，通过 `ref` 调用 `handleOpen()`。
6. **优先复用 art- 全局组件**：凡是 `components/core/` 中已有对应功能的 `art-` 组件，直接使用，不要在页面中重复实现。

### 模板骨架

```vue
<template>
  <div class="art-container">
    <!-- 搜索区 -->
    <xxx-search @search="handleSearch" @reset="handleReset" />
    <!-- 表格区 -->
    <ArtTableHeader :buttons="headerButtons" @refresh="refreshData()" />
    <ArtTable :data="tableData" :columns="columns" :loading="loading" />
    <!-- 弹窗区 -->
    <xxx-dialog ref="dialogRef" @success="refreshData()" />
  </div>
</template>
```

## 文档文件

- 仅在用户明确要求时才创建文档文件。

## 回复

- 解释时保持简洁，聚焦重点而非赘述显而易见的内容。

=== frontend/core rules ===

# Vue 3 + TypeScript 规范

## 组件结构

- 所有组件必须使用 `<script setup lang="ts">` 语法。
- 使用带 TypeScript 类型注解的 `defineProps`、`defineEmits`、`defineExpose`。
- 组件命名使用 `defineOptions({ name: 'ArtXxx' })` 约定。
- 组件文件命名为目录内的 `index.vue`（如 `art-button-more/index.vue`）。
- 模板风格：2 空格缩进，属性用双引号，脚本中用单引号。

## TypeScript

- 始终使用正确的 TypeScript 类型，除非绝对必要否则避免使用 `any`。
- 对象形状用 `interface`，联合类型/工具类型用 `type`。
- API 响应类型定义在 `src/types/api/api.d.ts` 的 `Api` 命名空间下。
- 组合式函数（hooks）使用泛型以确保类型安全。

## 状态管理（Pinia）

- Pinia 使用 Composition API（`defineStore` + `ref`/`computed`）。
- 所有 store 在 `src/store/modules/` 中，从 `src/store/index.ts` 导出。
- 持久化使用 `pinia-plugin-persistedstate`，由 `StorageKeyManager` 统一管理 key。
- 通过 `useXxxStore()` 组合式函数访问 store。

## 路由

- 使用 Hash 模式（`createWebHashHistory`）。
- 静态路由在 `src/router/routes/staticRoutes.ts` 中。
- 动态路由通过 `RouteRegistry` 从后端菜单加载。
- 路由守卫在 `src/router/guards/` 中。

## HTTP 与 API

- 使用 `src/utils/http/index.ts` 中的 axios 实例。
- API 函数使用 `fetchXxx` 命名约定（如 `fetchGetUserList`）。
- Laravel 风格响应：直接返回数据，不使用 code/msg 包装。
- 401 由拦截器处理（防抖自动登出）。
- 422 验证错误：取 `errors[field][0]` 作为提示信息。
- SSE 流式使用原生 `fetch` + `ReadableStream`（绕过 axios）。

=== coding rules ===

# 编码标准

## 命名约定

- **文件**：目录和文件名使用 kebab-case（如 `user-list/index.vue`、`useTable.ts`）
- **组件**：定义时用 PascalCase，模板中用 kebab-case（`art-button-more`）
- **组合式函数/Hooks**：camelCase，`use` 前缀（`useTable`、`useAuth`）
- **Stores**：camelCase，`Store` 后缀（`userStore`、`menuStore`）
- **API 函数**：`fetch` 前缀 + 动作（`fetchGetUserList`、`fetchUpdateUser`）
- **类型/接口**：PascalCase（`UserInfo`、`ApiResponse`）
- **枚举**：PascalCase，成员 UPPER_CASE

## 导入

- 使用路径别名：`@` 对应 `src/`、`@views` 对应 `views`、`@utils` 对应 `utils`、`@stores` 对应 `store`、`@styles` 对应 `styles`、`@imgs` 对应 `images`。
- 自动导入的 API（Vue、Vue Router、Pinia、VueUse）不需要显式 import。
- Element Plus 组件自动导入。

## Vue 组件最佳实践

- 组件保持职责单一，尽量控制在 ~300 行以内。
- 将可复用逻辑提取到 `src/hooks/` 中的组合式函数。
- 衍生状态用 `computed`，能用 computed 就不用 `watch`。
- 自定义组件优先使用 `v-model` 实现双向绑定。
- `defineProps` 使用 TypeScript 类型，默认值通过 `withDefaults` 设置。
- 在 `onUnmounted` 中清理事件监听器和定时器。

## useTable 组合式函数

- 列表页面统一使用 `src/hooks/core/useTable.ts` 中的 `useTable`。
- 配置对象包含 4 个块：`core`、`transform`、`performance`、`hooks`。
- 刷新策略：`refreshCreate`、`refreshUpdate`、`refreshRemove`、`refreshData`、`refreshSoft`。
- 列定义通过 `columnsFactory` 函数返回列配置数组。
- 复杂列内容（头像、标签、操作按钮等）使用 `h()` 渲染函数。

## 样式

- 工具类使用 Tailwind CSS v4。
- 复杂样式和混入使用 SCSS。
- 全局混入 `@styles/core/mixin.scss` 自动注入所有 Vue 组件。
- 暗色模式通过 Tailwind 的 `dark:` 前缀 + Element Plus 暗色主题实现。
- 主题色使用 CSS 变量实现动态切换。

### 操作列折叠规范

表格行操作列的按钮排列遵循以下折叠规则：

1. **不足 3 个按钮不折叠**：当行操作项总数（含权限过滤后可见项）少于 3 个时，所有按钮一律通过 `ArtButtonTable` 以图标按钮形式直接内联展示，**不使用** `ArtButtonMore` 下拉折叠。
2. **3 个及以上按钮部分折叠**：最常用的 1-2 个操作（如「编辑」）使用 `ArtButtonTable` 内联图标按钮，其余操作（如状态切换、重置密码、删除等次要或危险操作）收入 `ArtButtonMore` 下拉菜单。
3. **业务明确指定不折叠的场景**：特定业务页面（如公告管理）若产品/交互上要求全部按钮始终可见，则全部使用 `ArtButtonTable` 内联展示，不使用下拉折叠，但需自行控制列宽与响应式表现。

#### 内联按钮图标与配色约定

| 操作 | type | 图标 | 配色 |
| --- | --- | --- | --- |
| 查看 | `view` | `ri:eye-line` | 信息蓝 `bg-info/12 text-info` |
| 编辑 | `edit` | `ri:pencil-line` | 次要灰 `bg-secondary/12 text-secondary` |
| 删除 | `delete` | `ri:delete-bin-5-line` | 错误红 `bg-error/12 text-error` |
| 自定义操作 | 不传 type，通过 `icon`/`iconColor`/`buttonBgColor` 自定义 | 根据语义选择 | 建议使用业务主题色或警告色浅底 |

### ArtButtonMore 使用模式

表格操作按钮使用 `ArtButtonMore` 的 `list` 属性，每个菜单项包含 `key`、`label`、`icon`、`auth`（权限key）、`color`（可选，危险操作用红色）：

```ts
const columns = columnsFactory([
  // ... 其他列
  {
    prop: 'operation',
    label: '操作',
    width: 200,
    fixed: 'right',
    formatter: (row: Api.User.Item) =>
      h('div', { class: 'flex items-center' }, [
        // 常用操作内联展示
        hasAuth('users.edit')
          ? h(ArtButtonTable, {
              type: 'edit',
              title: '编辑',
              onClick: () => handleAction({ key: 'edit' } as ButtonMoreItem, row)
            })
          : null,
        // 次要/危险操作收入更多下拉
        h(ArtButtonMore, {
          list: [
            { key: 'toggle', label: '冻结/启用', icon: 'ri:forbid-line', auth: 'users.edit' },
            {
              key: 'delete',
              label: '删除',
              icon: 'ri:delete-bin-4-line',
              color: '#f56c6c',
              auth: 'users.delete'
            }
          ] as ButtonMoreItem[],
          onClick: (item: ButtonMoreItem) => handleAction(item, row)
        })
      ])
  }
])
```

## 权限控制

- 按钮级权限使用 `v-auth="'permission.key'"` 指令。
- 脚本中使用 `useAuth().hasAuth('permission.key')`。
- 权限模式由环境变量 `VITE_ACCESS_MODE` 控制。

=== tooling rules ===

# 工具与命令

## 包管理器

- 使用 **pnpm** 管理依赖，不要用 npm 或 yarn。
- 安装依赖：`pnpm install`
- 添加依赖：`pnpm add package-name`
- 添加开发依赖：`pnpm add -D package-name`

## 开发服务器

- 启动开发服务：`pnpm dev`
- API 代理到 `http://laravel-skel-forge.test`
- 后端由 Laravel Herd 提供服务 —— 不要运行 `php artisan serve`。

## 构建与检查

- 生产构建：`pnpm build`（执行 `vue-tsc --noEmit && vite build`）
- 代码检查：`pnpm lint`
- 自动修复：`pnpm fix`
- Prettier 格式化：`pnpm lint:prettier`
- 样式检查：`pnpm lint:stylelint`

## 代码质量钩子

- **Husky** 管理 git hooks（pre-commit、commit-msg）。
- **lint-staged** 在提交前对暂存文件执行检查。
- **Commitlint** 通过 cz-git 强制 Conventional Commits 规范。
- 交互式提交：`pnpm commit`

=== project-structure rules ===

# 项目结构

```
src/
├── api/              # RESTful API 层
├── assets/
│   ├── images/       # 图片和 SVG
│   └── styles/       # 全局 SCSS 样式
├── components/core/  # 全局组件（art- 前缀，自动注册）
│   ├── base/         # ArtLogo、ArtSvgIcon、ArtBackToTop
│   ├── layouts/      # 布局骨架组件
│   ├── forms/        # ArtForm、ArtSearchBar、ArtWangEditor 等
│   ├── tables/       # ArtTable、ArtTableHeader
│   ├── charts/       # ECharts 封装组件
│   ├── cards/        # 统计卡片、图表卡片等
│   └── ...           # 其他可复用组件
├── config/           # 静态配置
├── directives/       # 自定义指令（v-auth、v-roles 等）
├── enums/            # 枚举定义
├── hooks/core/       # 组合式函数（useTable、useAuth、useTheme 等）
├── locales/          # 国际化（vue-i18n）
├── plugins/          # 插件注册（echarts）
├── router/           # Vue Router 配置、守卫、模块
├── store/modules/    # Pinia 状态管理
├── types/            # TypeScript 类型定义
│   └── api/api.d.ts  # 全局 Api 命名空间
├── utils/            # 工具函数
│   ├── http/         # Axios 实例和拦截器
│   ├── echo/         # Laravel Echo（Reverb）
│   ├── storage/      # 存储管理
│   ├── table/        # 表格工具
│   ├── form/         # 表单工具
│   ├── navigation/   # 路由跳转辅助
│   ├── sys/          # 系统工具（mitt、错误处理）
│   └── ui/           # UI 工具（颜色、loading、动画）
└── views/            # 页面组件
    ├── auth/         # 登录页
    ├── dashboard/    # 仪表盘页面
    ├── system/       # 系统管理页面
    ├── user/         # 用户管理页面
    ├── monitor/      # 监控页面
    ├── operation/    # 运营页面
    └── exception/    # 错误页面
```

=== echo/realtime rules ===

# 实时通信

- 使用 `utils/echo` 单例操作 Laravel Echo + Reverb。
- 自定义 authorizer 发送 `Bearer` token 和 `X-Socket-ID` 请求头。
- 登出时销毁 echo 实例（`destroyEcho()`）。
- Reverb 配置来自环境变量：`VITE_REVERB_HOST`、`VITE_REVERB_PORT`、`VITE_REVERB_SCHEME`。

=== testing rules ===

# 测试

- 添加新组件或功能后，通过运行开发服务器验证效果。
- UI 交互和端到端流程使用 Playwright 测试。
- 开发期间可用浏览器开发者工具和 Vue DevTools（vite-plugin-vue-devtools）调试。

=== art-components rules ===

# art- 前缀全局组件使用规范

`src/components/core/` 目录下以 `art-` 为前缀的组件是项目级通用组件，通过自动注册机制在所有页面中**无需 import 即可直接使用**。开发新功能或重构现有页面时，必须优先复用这些组件。

## 使用 art- 组件的收益

| 维度           | 说明                                                                     |
| -------------- | ------------------------------------------------------------------------ |
| **视觉一致性** | 统一设计语言，避免不同页面出现样式差异（间距、颜色、尺寸、交互反馈一致） |
| **开发效率**   | 无需从零编写表格、表单、搜索栏等常见模式，通过 schema 配置即可完成       |
| **可维护性**   | 组件 bug 修复和功能增强在一处完成，所有引用页面自动受益                  |
| **主题适配**   | 内置暗色模式和主题色切换支持，自定义组件需额外处理                       |
| **权限集成**   | 表格操作按钮等组件已内置权限指令（`auth` 属性），无需手动编写 v-auth     |
| **类型安全**   | 全局组件经过完整 TypeScript 类型声明，IDE 可提供完整的补全和类型校验     |
| **响应式兼容** | 已处理移动端/小屏幕适配，自定义组件需要额外处理                          |

## 组件清单与适用场景

以下为各分类下的 art- 组件及典型使用场景。开发前请查阅此清单确认是否有可复用组件。

### 基础组件（base/）

| 组件 | 适用场景 | 使用示例 |
| --- | --- | --- |
| `art-svg-icon` | 显示 SVG 图标，替代手动 `<svg>` 标签 | `<art-svg-icon name="user" :size="16" />` |
| `art-logo` | 侧边栏/登录页 Logo 展示 | `<art-logo :collapse="isCollapse" />` |
| `art-back-to-top` | 页面右下角返回顶部按钮 | `<art-back-to-top />` |

### 布局组件（layouts/）

| 组件 | 适用场景 | 使用示例 |
| --- | --- | --- |
| `art-page-content` | 页面内容容器，提供统一内边距和滚动区域 | `<art-page-content>...</art-page-content>` |
| `art-breadcrumb` | 面包屑导航（由 RouteRegistry 自动生成） | 布局中自动渲染，一般无需手动使用 |
| `art-header-bar` | 顶部导航栏 | 布局组件内部使用 |
| `art-menus`（art-sidebar-menu 等） | 侧边栏/顶部/混合菜单 | 布局组件内部使用 |
| `art-work-tab` | 标签页（多标签页导航） | 布局组件内部使用 |
| `art-notification` | 通知中心入口 | 布局组件内部使用 |
| `art-global-search` | 全局搜索菜单 | 布局组件内部使用 |

### 表格组件（tables/）

| 组件 | 适用场景 | 使用示例 |
| --- | --- | --- |
| `art-table` | **所有数据列表页**，基于 ElTable 封装，支持分页、选择、树形、虚拟滚动等 | `<art-table :data="data" :columns="columns" />` |
| `art-table-header` | 表格上方标题栏，包含标题描述、批量操作按钮、刷新、密度、列设置等 | `<art-table-header title="用户管理" :buttons="buttons" />` |

### 表单组件（forms/）

| 组件 | 适用场景 | 使用示例 |
| --- | --- | --- |
| `art-search-bar` | **所有列表页的搜索区域**，通过 schema 配置搜索项，支持展开/收起 | `<art-search-bar :schemas="searchSchemas" @search="handleSearch" />` |
| `art-form` | 新建/编辑弹窗中的表单，通过 schema 配置表单项，内置校验和提交逻辑 | `<art-form :schemas="formSchemas" v-model="formData" />` |
| `art-button-more` | 表格行操作的更多按钮下拉菜单，内置权限控制 | 见下方示例 |
| `art-button-table` | 表格顶部批量操作按钮组 | `<art-button-table :buttons="tableButtons" />` |
| `art-wang-editor` | 富文本编辑器（基于 wangEditor） | `<art-wang-editor v-model="content" />` |
| `art-drag-verify` | 拖拽验证滑块（登录/敏感操作） | `<art-drag-verify @success="handleVerify" />` |
| `art-excel-import` | Excel 文件导入按钮 | `<art-excel-import :api="importApi" @success="refresh" />` |
| `art-excel-export` | Excel 文件导出按钮 | `<art-excel-export :api="exportApi" />` |

### 卡片组件（cards/）— 仪表盘/统计页使用

| 组件                     | 适用场景         |
| ------------------------ | ---------------- |
| `art-stats-card`         | KPI 统计数字卡片 |
| `art-line-chart-card`    | 折线图卡片       |
| `art-bar-chart-card`     | 柱状图卡片       |
| `art-donut-chart-card`   | 环形图卡片       |
| `art-progress-card`      | 进度条卡片       |
| `art-data-list-card`     | 数据列表卡片     |
| `art-timeline-list-card` | 时间线列表卡片   |
| `art-image-card`         | 图片展示卡片     |

### 图表组件（charts/）— 直接 ECharts 封装

| 组件                                                   | 适用场景         |
| ------------------------------------------------------ | ---------------- |
| `art-line-chart` / `art-bar-chart` / `art-h-bar-chart` | 折线/柱状/条形图 |
| `art-ring-chart` / `art-radar-chart`                   | 环形/雷达图      |
| `art-scatter-chart` / `art-k-line-chart`               | 散点/K线图       |
| `art-dual-bar-compare-chart`                           | 双柱状对比图     |

### 媒体组件（media/）

| 组件               | 适用场景     |
| ------------------ | ------------ |
| `art-cutter-img`   | 图片裁剪上传 |
| `art-video-player` | 视频播放器   |

### 其他组件（others/、banners/、text-effect/、widget/）

| 组件                                           | 适用场景        |
| ---------------------------------------------- | --------------- |
| `art-watermark`                                | 页面水印        |
| `art-basic-banner` / `art-card-banner`         | 横幅展示        |
| `art-count-to`                                 | 数字滚动动画    |
| `art-text-scroll` / `art-festival-text-scroll` | 文字滚动/跑马灯 |
| `art-icon-button`                              | 图标按钮        |

### 结果页/异常页（views/）

| 组件            | 适用场景               |
| --------------- | ---------------------- |
| `ArtException`  | 403/404/500 等异常页面 |
| `ArtResultPage` | 操作成功/失败结果页    |

## 典型使用示例

### 列表页标准组合（必须遵循）

```vue
<template>
  <div class="art-container p-4">
    <!-- 搜索：使用 ArtSearchBar，不手写 el-form -->
    <user-search ref="searchRef" @search="handleSearch" @reset="handleReset" />
    <!-- 表格标题 + 操作按钮 -->
    <ArtTableHeader title="用户管理" :buttons="headerButtons" @refresh="refreshData()" />
    <!-- 数据表格：使用 ArtTable，不手写 el-table -->
    <ArtTable
      :data="data"
      :columns="columns"
      :loading="loading"
      :pagination="pagination"
      @pagination-change="handlePageChange"
    />
    <!-- 新建/编辑弹窗 -->
    <user-dialog ref="dialogRef" @success="refreshData()" />
  </div>
</template>
```

### 搜索栏（xxx-search.vue）

使用 `ArtSearchBar` 的 `schemas` 配置声明搜索项，**禁止**在搜索栏中手动堆砌 `el-form-item`：

```vue
<template>
  <ArtSearchBar :schemas="searchSchemas" @search="emit('search', $event)" @reset="emit('reset')" />
</template>

<script setup lang="ts">
  const searchSchemas = computed(() => [
    { field: 'keyword', label: '关键词', type: 'input', placeholder: '请输入用户名/邮箱' },
    { field: 'status', label: '状态', type: 'select', options: statusOptions },
    { field: 'created_at', label: '注册时间', type: 'daterange' }
  ])
</script>
```

### 行操作按钮（ArtButtonTable + ArtButtonMore）

表格行操作遵循「操作列折叠规范」：常用操作内联为图标按钮（`ArtButtonTable`），次要/危险操作收入下拉菜单（`ArtButtonMore`）。按钮自动遵循权限、样式规范，统一通过 `handleAction(item, row)` switch-case 分发事件。

**不足 3 个按钮示例（全部内联，如公告管理）：**

```ts
{
  prop: 'actions',
  label: '操作',
  width: 220,
  fixed: 'right',
  formatter: (row: Item) =>
    h('div', { class: 'flex items-center' }, [
      hasAuth('xxx.edit')
        ? h(ArtButtonTable, { type: 'edit', title: '编辑', onClick: () => handleAction({ key: 'edit' }, row) })
        : null,
      hasAuth('xxx.edit')
        ? h(ArtButtonTable, {
            icon: 'ri:send-plane-line',
            iconColor: 'var(--el-color-warning)',
            buttonBgColor: 'rgba(230,162,60,0.12)',
            title: '发布',
            onClick: () => handleAction({ key: 'toggle' }, row)
          })
        : null,
      hasAuth('xxx.delete')
        ? h(ArtButtonTable, { type: 'delete', title: '删除', onClick: () => handleAction({ key: 'delete' }, row) })
        : null
    ])
}
```

**3 个及以上按钮示例（常用内联 + 更多下拉，如用户管理）：**

```ts
{
  prop: 'operation',
  label: '操作',
  width: 200,
  fixed: 'right',
  formatter: (row: Item) =>
    h('div', { class: 'flex items-center' }, [
      h(ArtButtonTable, { type: 'view', title: '查看', onClick: () => handleAction({ key: 'view' }, row) }),
      hasAuth('xxx.edit')
        ? h(ArtButtonTable, { type: 'edit', title: '编辑', onClick: () => handleAction({ key: 'edit' }, row) })
        : null,
      h(ArtButtonMore, {
        list: [
          { key: 'toggle', label: '冻结', icon: 'ri:forbid-line', auth: 'xxx.edit' },
          { key: 'delete', label: '删除', icon: 'ri:delete-bin-4-line', color: '#f56c6c', auth: 'xxx.delete' }
        ] as ButtonMoreItem[],
        onClick: (item: ButtonMoreItem) => handleAction(item, row)
      })
    ])
}
```

## 何时允许自定义组件

虽然优先使用 art- 组件，但以下情况可以且应当创建自定义组件：

1. **art- 组件不支持的特殊交互**：例如特定业务流程的多步骤向导、复杂的拖拽排序界面、流程图/画布类交互，现有组件无法通过 props/slots 扩展实现。
2. **页面专属展示组件**：仅在单个页面使用且具有明显业务特征的 UI，如订单状态流转时间线、特定商品的预览卡片。这类组件应放在页面的 `modules/` 目录下，而非 `components/core/`。
3. **需要复杂内部状态管理的复合组件**：包含多个互斥状态、内部动画循环、第三方库深度集成（如地图、3D 渲染、代码编辑器）且无法通过简单封装适配 art- 组件模式。
4. **新组件的贡献路径**：当自定义组件在 3 个及以上页面被复用时，应将其重构为新的 `art-` 前缀全局组件，放入 `components/core/` 对应子目录，并补充类型声明和使用文档。

### 判断流程

```
需要一个新 UI 元素
    │
    ├─→ components/core/ 中是否已有 art- 组件可直接使用？
    │       ├─ 是 → 直接使用（通过 props/slots 定制）
    │       └─ 否 ↓
    │
    ├─→ 现有 art- 组件是否可通过扩展（插槽、组合）满足？
    │       ├─ 是 → 在现有组件基础上扩展，不创建新组件
    │       └─ 否 ↓
    │
    ├─→ 是否仅在当前页面使用？
    │       ├─ 是 → 在 views/{模块}/modules/ 下创建页面私有组件
    │       └─ 否（可复用）→ 创建为新的 art- 全局组件，放入 components/core/
```

### 自定义组件命名规范

- 页面私有组件：kebab-case 文件名，组件名无 art- 前缀（如 `user-status-tag.vue`）
- 新全局组件：必须加 `art-` 前缀，放入对应分类子目录（如 `forms/art-cascader-area/index.vue`），组件名使用 `defineOptions({ name: 'ArtCascaderArea' })`

=== common-patterns rules ===

# 常见实现模式

## 新建 CRUD 模块

新增后台 CRUD 模块的步骤：

1. **API 文件**：`src/api/模块名.ts`，包含 `fetchGetXxxList`、`fetchGetXxxDetail`、`fetchCreateXxx`、`fetchUpdateXxx`、`fetchDeleteXxx`
2. **类型定义**：在 `src/types/api/api.d.ts` 中的 `Api.模块名` 命名空间下添加类型
3. **视图文件**：`src/views/system/模块名/index.vue` + `modules/` 子目录
   - `xxx-search.vue` — 搜索表单（ArtSearchBar）
   - `xxx-dialog.vue` — 新建/编辑弹窗
   - `xxx-detail-dialog.vue` — 详情查看弹窗
4. **页面模式**：`useTable` + `ArtTableHeader` + `ArtTable` + 多个 dialog ref
5. **菜单配置**：通过后台菜单管理添加菜单项

## 表单弹窗模式

```vue
<script setup lang="ts">
  const dialogRef = ref<InstanceType<typeof ElDialog>>()
  const formRef = ref()
  const formModel = reactive({ id: 0, name: '' })
  const formRules = {
    name: [{ required: true, message: '请输入名称', trigger: 'blur' }]
  }

  function handleOpen(row?: Api.Xxx.Item) {
    Object.assign(formModel, row || { id: 0, name: '' })
    nextTick(() => formRef.value?.clearValidate())
    dialogRef.value?.open?.()
  }

  async function handleSubmit() {
    await formRef.value?.validate()
    if (formModel.id) {
      await fetchUpdateXxx(formModel.id, formModel)
    } else {
      await fetchCreateXxx(formModel)
    }
    dialogRef.value?.close()
    // 触发表格刷新
  }

  defineExpose({ handleOpen })
</script>
```

</frontend-guidelines>
