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
- 编写新组件前先检查是否已有可复用的组件。`src/components/core/` 中 `art-` 前缀的组件为全局可用组件。
- 所有新 Vue 组件使用 Composition API + `<script setup lang="ts">` 语法。

## 验证脚本

- 当有单元/集成测试覆盖时，不要创建验证脚本或手动测试脚本。
- UI 验证优先使用 Playwright/webapp-testing 技能进行浏览器测试。

## 应用结构与架构

- 保持现有目录结构，未经批准不要新建根级目录。
- 未经批准不要更改项目依赖。
- 新业务页面放在 `src/views/{模块名}/` 下，包含 `index.vue` 入口文件和 `modules/` 子组件目录。
- 新 API 文件放在 `src/api/` 下，遵循现有命名约定（`模块名.ts`）。

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

### ArtButtonMore 使用模式

表格操作按钮使用 `ArtButtonMore` 的 `list` 属性：

```ts
const actionList = (row: Api.SystemManage.User) => [
  { text: '编辑', auth: 'users.edit', onClick: () => handleEdit(row) },
  { text: '删除', auth: 'users.delete', type: 'danger', onClick: () => handleDelete(row) }
]
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
