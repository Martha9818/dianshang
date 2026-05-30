# EcomPilot V1-Core

EcomPilot 是一个本地优先的电商选品与商品工作台。V1-Core 的正式运行环境是 Windows 本地，数据写入以本机 SQLite 和本地文件夹为准；Vercel 只用于只读预览和页面可访问性检查。

## 当前功能范围

- 商品池：新建、编辑、软删除商品，上传商品主图，查看商品详情。
- 竞品记录：手动录入竞品平台、标题、价格、热度、日期和截图。
- 利润测算：根据售价、进货价、运费、包装成本计算单件净利润和利润率。
- 六维评分：生成总分、扣分原因、下一步建议、推荐结论，并保存 ScoreSnapshot。
- 多平台文案：为闲鱼、淘宝、小红书、抖音生成文案包，支持手动编辑、违规词扫描和标记实际使用版本。
- Prompt 任务：为商品生成图片 Prompt，手动复制到 ChatGPT，回传生成图片。
- 素材库：查看、预览、筛选、手动上传素材，并保存图片 hash、缩略图、来源和使用权限。
- 灵感箱：设置本地灵感文件夹，手动扫描图片，按 fileHash 去重，生成待审核草稿，可选 AI 识图建议，人工确认后转商品。
- 诊断中心：查看运行环境、SQLite、目录、日志、AI、图片和灵感扫描摘要，并复制或导出脱敏诊断文本。
- Excel 导出：导出商品、竞品、文案、Prompt、素材、评分 6 个 Sheet。
- 手动备份：备份本地 SQLite 数据库和 `uploads/` 文件夹。
- 设置：AI Provider 设置和默认违规词设置。

## 正式运行环境

- Windows 本地
- Next.js + Prisma + SQLite
- 本地 `uploads/` 保存图片
- 本地 `exports/` 保存 Excel 导出
- 本地 `backups/` 保存手动备份
- 本地 `logs/` 保存脱敏应用日志

本地数据库可能包含 AI Provider 的 API Key。复制、备份或分享数据库文件前，请确认接收方和保存位置安全。

## Vercel 预览说明

Vercel 只用于页面预览，不用于正式数据写入。

预览环境必须保持：

- 不连接本地 SQLite。
- 不写入 `uploads/`、`exports/`、`backups/`、`logs/`。
- 不真实调用高成本 AI。
- 写操作显示只读降级提示。
- 核心页面不 500、不白屏、不显示 `Failed to fetch` 或 Next.js runtime overlay。

需要真实创建商品、上传图片、导出 Excel、备份、生成 AI 文案或扫描灵感文件夹时，请使用 Windows 本地环境。

## 明确不做的功能

以下内容不属于 V1-Core，不能在 V1-Core 收尾或 Patch 中扩展：

- 登录、注册、云端账户、支付、会员。
- 平台爬虫、自动采集、自动上架、自动私信、自动评论。
- API 自动生图、自动操作 ChatGPT。
- OCR、链接解析、截图自动识别。
- 库存系统、供应商管理、采购批次、试销复盘。
- 完整站内搜索、通知中心、定时扫描。
- PDF 报告、Electron 桌面端。
- 真正多智能体调度或 Agent 工作流。

顶部搜索框和通知图标可以作为占位 UI 保留；完整搜索、通知中心、多 Agent 工作流属于后续版本规划。

## 安装依赖

首次使用前，请在 PowerShell 中进入项目目录：

```powershell
cd E:\电商
npm install
```

如果 Windows 上出现 Prisma Client `EPERM` 文件锁，先关闭本项目相关的 `node`、`next`、`prisma` 进程，再重新执行命令。不要因为文件锁误改业务代码。

## 初始化数据库

项目使用本地 SQLite。默认 `.env.example` 内容会指向 `prisma/dev.db`。

如果还没有 `.env`：

```powershell
Copy-Item .env.example .env
```

执行数据库迁移：

```powershell
npx prisma migrate dev
```

需要单独生成 Prisma Client 时：

```powershell
npx prisma generate
```

导入默认违规词：

```powershell
npm run prisma:seed
```

该命令可以重复执行；重复执行不会重复创建同一个违规词。

## 启动方式

开发模式：

```powershell
npm run dev
```

启动后访问 [http://localhost:3000](http://localhost:3000)。

生产构建检查：

```powershell
npm run build
```

也可以直接双击 `start.bat`。它会检查 Node.js、npm、`.env`、`uploads/`、`exports/`、`backups/`、`logs/`、依赖、SQLite、默认违规词和 3000 端口，然后打开浏览器并启动 `npm run dev`。如果失败，窗口会保留错误信息。

## 诊断中心

入口：`/system/diagnostics`

诊断中心用于第一时间排查本地运行问题。它会显示：

- 应用版本、运行环境、Node.js、操作系统摘要。
- SQLite 是否可连接，数据数量和最近导出/备份状态。
- `uploads/`、`exports/`、`backups/`、`logs/` 是否存在和可写。
- 最近脱敏错误日志。
- AI Provider、AIJob、AIRequestLog 摘要。
- 图片存储、缩略图、缺失文件和参考图数量。
- 灵感扫描、失败扫描和失败识图摘要。

复制或导出的诊断摘要已经脱敏，不应包含 API Key、完整本地路径、完整数据库路径、完整 Prompt 或完整错误堆栈。

## 多平台文案

入口：`/copywriting`

多平台文案包覆盖闲鱼、淘宝、小红书、抖音。AI 成功时会保存每个平台的多版本草稿；AI 失败时不会破坏商品数据，仍可手动填写、保存、重新扫描违规词，并标记实际使用版本。

## 图片和素材

入口：`/materials`

支持 `jpg`、`jpeg`、`png`、`webp`，单张图片最大 10MB。上传后会保存相对路径、fileHash、缩略图、尺寸、MIME、来源类型和使用权限。前端只显示相对路径，不显示完整 Windows 本地路径。

## 灵感箱

入口：`/inspirations`

灵感箱只做手动扫描。用户设置本地文件夹后，点击手动扫描，系统会复制新图片到受管 `uploads/inspirations/`，按 fileHash 去重，生成待审核草稿和 ScanLog。AI 识图建议只作为参考，不会自动写入正式商品事实；转商品必须由用户确认提交。

## Excel 导出

入口：`/export`

导出的 Excel 包含 6 个 Sheet：

- `Products`
- `Competitors`
- `Copywriting`
- `PromptTasks`
- `Materials`
- `Scores`

即使没有数据，也应导出表头。导出文件保存在本地 `exports/`，该目录不会提交到 Git。

## 备份

入口：`/backup`

手动备份会创建：

```text
backups/yyyyMMdd_HHmmss/
```

备份内容包括：

- `prisma/dev.db`
- 存在时同步备份 `dev.db-wal` 和 `dev.db-shm`
- `uploads/` 文件夹

当前 V1-Core 只实现手动备份，不实现数据恢复。数据恢复属于后续版本规划。

## AI Provider

入口：`/settings/ai`

当前使用 OpenAI-compatible Provider 配置方式：

- Provider 名称
- Base URL
- API Key
- Model Name
- 是否默认 Provider

无真实 AI Key 时，仍可验收手动兜底能力：Provider 配置可保存，错误 Key 会显示可读错误，AI 失败后可以手动填写文案并保存。

## 验收命令

V1-Core-07 收尾使用过的主要命令：

```powershell
npx tsx scripts/v1-core-07-acceptance.mts
npx tsx scripts/thread08-final-acceptance.mts
npx tsc --noEmit
npm run lint
npm run build
npm run encoding:check
npx prisma migrate status
```

`package.json` 当前没有 `typecheck` 或 `test` 脚本；类型检查使用 `npx tsc --noEmit`。

## 后续版本规划

以下内容是后续版本规划，不表示当前 V1-Core 已经实现。

### V1-Plus

- 更完整的站内搜索。
- 本地通知中心。
- 图片尺寸设置增强。
- 更保守的文件清理/归档流程。
- 更完整的 AI Provider 日常使用配置引导。

### V1.5

- 截图识别。
- 链接导入尝试。
- 导入质量分级。
- 竞品共性总结。
- 差异化建议。
- 图片内容去重和轻量原创性审核。

### V2

- 多 SKU 管理。
- 供应商管理与排序。
- 采购批次库存。
- 多平台共用库存。
- 试销复盘。
- 退货退款流程。
- PDF 报告。
- Electron 桌面应用。
- 数据恢复。
- 多智能体工作流。
