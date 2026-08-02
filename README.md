# 政府项目申报管理系统（Vercel 版）

基于 React + Vite + Hono + tRPC + Drizzle ORM + Neon Postgres 的全栈项目申报管理系统。

## 功能特性

- 登录认证与 JWT 鉴权
- 可自定义的仪表板统计卡片
- 项目管理 + 自定义字段
- 数据分析 + 可自定义分析卡片
- 企业荣誉库 + 复审周期管理
- 用户管理 + 角色权限（管理员/只读用户）
- 系统设置

## 技术栈

- 前端：React 19 + TypeScript + Vite + Tailwind CSS + shadcn/ui + Recharts
- 后端：Hono + tRPC
- ORM：Drizzle ORM
- 数据库：Neon Postgres（Vercel Marketplace 原生集成）
- 部署：Vercel

## 本地开发

```bash
# 1. 安装依赖
npm install

# 2. 配置环境变量
cp .env.example .env
# 编辑 .env，设置 POSTGRES_URL 和 APP_SECRET

# 3. 推送数据库 schema
npm run db:push

# 4. 可选：初始化示例数据
npm run db:seed

# 5. 启动开发服务器
npm run dev
```

访问 http://localhost:3000，默认管理员账号：`admin` / `admin123`。

## Vercel 部署

1. 在 Vercel 创建项目，关联 Git 仓库。
2. 在 Vercel 控制台添加环境变量：
   - `POSTGRES_URL`：Neon 数据库连接串
   - `APP_SECRET`：JWT 签名密钥
3. 首次部署前，在本地或 Vercel Shell 执行：
   ```bash
   npm run db:push
   npm run db:seed
   ```
4. 后续代码更新可直接重新部署。

## 脚本说明

- `npm run dev`：本地开发
- `npm run build`：构建前端
- `npm run db:push`：将 schema 推送到数据库
- `npm run db:generate`：生成迁移文件
- `npm run db:migrate`：执行迁移
- `npm run db:seed`：初始化示例数据

## 注意事项

- 所有写操作（增删改）仅对 `admin` 角色开放；其他角色登录后仅有查看权限。
- 数据库使用 Neon Postgres，无需维护 MySQL 实例，适合 Vercel Serverless 环境。
