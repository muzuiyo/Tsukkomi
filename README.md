# TSUKKOMI

使用 Cloudflare（Worker） + Resend（邮件服务）+ Vercel（页面）托管的卡片笔记系统。

📫 [点击查看 Demo](https://tsukkomi.lain.today) | 🧩 [Firefox 扩展](https://addons.mozilla.org/zh-CN/firefox/addon/tsukkomi-quick-note/)

## 1. 部署

项目分为前端、后端、浏览器扩展三部分。

### 1.1 准备工作

1、克隆项目到本地

```yaml
git clone https://github.com/muzuiyo/tsukkomi
```

并上传到 Github。

2、参数配置

打开 `frontend/site.config.ts`，设置前端站点标题、副标题、分页大小、注册功能选项。

3、Resend API 获取

前往 [Resend](https://resend.com/api-keys) 新建一个 API，根据提示完成创建，API 应至少包含 `Sending access` 权限，复制保存这个 API KEY 待后续使用。

### 1.2 后端部署

打开仓库项目文件夹，依次执行以下命令。

```bash
cd backend
pnpm install
```

登录 Cloudflare

```bash
pnpm wrangler login
```

设置 RESEND API KEY

```bash
pnpm wrangler secret put RESEND_API_KEY
```

创建 D1 数据库，选项选择 N，在这一步控制台会打印数据库相关信息，复制 database_id 替换文件 `wrangler.jsonc` 中 D1 数据库 id。

```bash
pnpm wrangler d1 create memo-db
```

初始化数据库

```bash
pnpm run db:remote
```

部署到 Cloudflare Worker，部署前检查修改文件 `wrangler.jsonc` 的 `name` 字段，避免 worker 重名。同时检查 `vars` 字段内容，设置环境变量，注意把 `FRONT_URL` 设置为 **1.3 前端部署** 生成的 URL。

```bash
pnpm run deploy
```

#### 后端环境变量

| 变量 | 说明 |
|------|------|
| `ALLOW_REGISTER` | 是否开放注册，`"true"` 为开放 |
| `IS_PRODUCTION` | 是否为生产环境，影响 Cookie 和 CORS 行为 |
| `RATE_LIMIT_MAX` | 速率限制 |
| `NOREPLY_EMAIL` | 发件邮箱地址 |
| `FRONT_URL` | 前端部署地址，用于密码重置邮件中的链接 |

部署完成后，访问 `https://your-worker-url/docs` 可查看 API 文档（Swagger UI）。

### 1.3 前端部署

打开 [Vercel](https://vercel.com) 官网，部署新项目，选中仓库 `frontend` 目录，框架选用 `NextJS`，环境变量根据 `frontend/.env.example` 参考设置。

```yaml
# 后端接口地址（前一步产生的 URL）
NEXT_PUBLIC_API_BASE_URL=http://localhost:8787
# 前端部署的地址，该变量用于生成复制链接
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

点击部署，进入部署后的链接即可开始使用。

### 1.4 浏览器扩展

Firefox 浏览器扩展，可在任意网页快速记录笔记。

👉 [点击安装 Firefox 扩展](https://addons.mozilla.org/zh-CN/firefox/addon/tsukkomi-quick-note/)

本地开发调试：打开 `about:debugging#/runtime/this-firefox`，点击 **临时载入附加组件**，选择 `plugin/manifest.json`。

#### 功能

- **快速记录** — 弹窗内直接输入内容，支持 Markdown
- **附带页面链接** — 勾选后自动追加当前页面的标题和 URL 引用
- **标签** — 空格分隔输入标签
- **公开/私密切换** — 选择笔记可见性
- **草稿保存** — 关闭弹窗后内容不会丢失，下次打开自动恢复
- **自定义 API 地址** — 可在设置中修改后端地址

#### API 地址

扩展默认 API 地址为 `https://api.tsukkomi.lain.today`，本地调试时可在扩展设置中改为 `http://localhost:8787`。

## 2. 本地开发

### 后端

```bash
cd backend
pnpm install
pnpm run dev
```

默认运行在 `http://localhost:8787`。

### 前端

```bash
cd frontend
pnpm install
pnpm run dev
```

默认运行在 `http://localhost:3000`。
