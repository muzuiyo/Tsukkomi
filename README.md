# TSUKKOMI

使用 Cloudflare（Worker） + Resend（邮件服务）+ Vercel（页面）托管的卡片笔记系统。

📫 [点击查看 Demo](https://tsukkomi.lain.today)

## 1. 部署

项目分为前端、后端两部分。

### 1.1 准备工作

1、克隆项目到本地

```yaml
git clone https://github.com/muzuiyo/tsukkomi
```

并上传到 Github。

2、参数配置

打开 `frontend/site.config.ts`，设置前端站点标题、副标题、主页链接（用于生成分享链接等其他信息）、分页大小、注册功能选项。

3、Resend API 获取

前往 [Resend](https://resend.com/api-keys) 新建一个 API，根据提示完成创建，API 应至少包含 `Sending access` 权限，复制保存这个 API KEY 待后续使用。

### 1.2 后端部署

打开仓库项目文件夹，依次执行以下命令。

```bash
# 命令行进入 backend 初始化目录
cd backend
pnpm install
```

登录 cloudflare

```bash
pnpm wrangler login
```

设置 RESEND API KEY

```bash
pnpm wrangler secret put RESEND_API_KEY
```

创建 D1 数据库，选项选择 N，在这一步控制台会打印数据库相关信息，复制 database_id 替换文件 `wrangler.jsonc` 中 D1 数据库id。

```bash
pnpm wrangler d1 create memo-db
```

初始化数据库

```bash
pnpm run db:remote
```

创建 KV 数据库，同样选项选择 N，复制 kv 数据库的 id 到文件 `wrangler.jsonc` 进行替换。

```
pnpm run kv:remote
```

部署到 cloudflare worker，部署前检查修改文件 `wrangler.jsonc` 的 `name` 字段，避免 worker 重名。同时检查 `vars` 字段内容，设置环境变量，注意把 `FRONT_URL` 设置为 **1.3 前端部署** 生成的 URL。

```
pnpm run deploy
```

### 1.3 前端部署

打开 [vercel](https://vercel.com) 官网，部署新项目，选中仓库 `frontend` 目录，框架选用 `NextJS`，环境变量根据 `frontend/.env.example` 参考设置，同时设置 `site.config.ts` 文件内相关选项：

```yaml
# 后端接口地址（前一步产生的 URL）
NEXT_PUBLIC_API_BASE_URL=http://localhost:8787
```

点击部署，进入部署后的链接即可开始使用。