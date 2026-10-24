# =========================================================
# Ai Forge Admin - 多阶段构建
# 阶段一：pnpm 构建静态产物；阶段二：Nginx 托管
# =========================================================

# ---------- 构建阶段 ----------
FROM node:22-alpine AS builder

# 与本地一致的 pnpm 大版本（lockfile 由 pnpm 12 生成）
RUN npm install -g pnpm@12

# 禁用 husky（容器内无 .git，prepare 钩子会失败）
ENV HUSKY=0

WORKDIR /app

# 优先拷贝依赖清单，充分利用 Docker 层缓存
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

# 拷贝源码并执行生产构建（vite build --mode production + vue-tsc 类型检查）
COPY . .
RUN pnpm build:production

# ---------- 运行阶段 ----------
FROM nginx:1.27-alpine

# 构建产物与站点配置
COPY --from=builder /app/dist /usr/share/nginx/html
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
