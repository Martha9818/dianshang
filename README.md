# EcomPilot V1-Plus

EcomPilot 是一个 Windows 本地优先的电商选品与运营工作台。正式数据以本机 SQLite、`uploads/`、`exports/`、`backups/`、`logs/` 和应用内 `trash/` 为准；Vercel 仅用于只读预览。

## 当前功能范围

- MVP：商品 CRUD、软删除、详情、主图上传、竞品录入、成本和利润测算、六维评分、推荐结论、文案生成与编辑、违规词扫描、Prompt 任务、生成图回传素材库、素材预览筛选、Excel 导出、手动备份。
- V1-Core：AI Provider 设置、AI 调用日志、多平台文案包、AI 识图轻量建议、识图结果不自动保存为事实、灵感文件夹手动扫描、图片安全处理、本地运行诊断、Vercel 只读降级、RuntimeConfig / LocalPathService / EnvironmentGuard / LogService / OperationLog 等基础能力。
- V1-Plus：全局搜索与筛选、商品池/素材库/文案列表/Prompt 任务/灵感箱筛选、灵感箱管理增强、灵感状态流转、灵感转商品保护、首页待办、应用内通知中心、批量操作安全机制、文件清理与应用内回收站。

## Windows 本地运行

首次使用请在 PowerShell 中进入项目目录：

```powershell
cd <项目目录>
npm install
Copy-Item .env.example .env
npx prisma migrate dev
npm run prisma:seed
npm run dev
```

启动后访问 [http://localhost:3000](http://localhost:3000)。

也可以双击 `start.bat`。它会检查 Node.js、npm、`.env`、依赖、本地 SQLite、默认违规词、3000 端口，以及 `uploads/`、`exports/`、`backups/`、`logs/`、`trash/` 目录；通过后会打开浏览器并启动 `npm run dev`。如果 Windows 出现 Prisma Client `EPERM` 文件锁，请先关闭相关 `node`、`next`、`prisma` 进程后重试。

## 本地目录

- `uploads/`：商品主图、竞品截图、素材图、Prompt 回传图、灵感箱受管图片和缩略图。
- `exports/`：Excel 导出文件。
- `backups/`：手动备份，目录格式为 `backups/yyyyMMdd_HHmmss/`。
- `logs/`：脱敏应用日志。
- `trash/`：EcomPilot 应用内回收站，仅用于文件清理功能。

这些目录是本地运行数据，不应提交到 Git。前端展示应使用相对路径或脱敏摘要，不展示完整 Windows 绝对路径、数据库真实路径、API Key、`.env` 内容、完整 Prompt 或完整错误堆栈。

## Vercel 只读预览

Vercel 只用于页面预览和可访问性检查，不用于正式数据写入。预览环境必须满足：

- 可以打开主要页面，并显示只读数据或降级展示。
- 不写 SQLite、`uploads/`、`exports/`、`backups/`、`logs/`、`trash/`。
- 不执行文件扫描、文件移动、文件删除或高成本 AI 调用。
- 所有写操作提示：`预览环境只读，请在 Windows 本地验收。`
- 页面不应暴露 API Key、完整本地路径、数据库路径、`.env` 值、原始 Prompt 或完整堆栈。

需要真实创建商品、上传图片、导出 Excel、备份、生成 AI 文案、扫描灵感文件夹或清理文件时，请使用 Windows 本地环境。

## 文件清理安全

入口：`/maintenance/files`

文件清理只做人工触发的本地扫描和清理建议。它会扫描 `uploads/`、`exports/`、`backups/`，展示相对路径，并记录 `CleanupLog`。

- 有效商品主图、素材文件、竞品截图和活跃灵感图片不会直接允许清理。
- 移入回收站需要勾选、输入确认文本，并通过浏览器确认。
- 永久删除只允许删除已经位于应用内 `trash/` 的文件。
- 清理不会删除数据库记录，不提供自动后台清理、定时清理、Windows 回收站集成或恢复流程。
- 旧备份可以被建议清理，但删除备份会降低后续手工排障和恢复能力，应谨慎处理。

## AI Key 安全

AI Provider 配置保存在本地数据库中，API Key 只在服务端使用。复制、备份或分享数据库文件前，请确认接收方和保存位置安全。

系统日志、诊断摘要、通知和前端错误应做脱敏处理。AI 调用失败不能影响商品保存、评分、素材、导出、备份或文件清理等非 AI 流程；无可用 AI Key 时仍可使用手动录入、编辑和导出能力。

## 主要入口

- `/`：首页待办。
- `/products`：商品池、搜索筛选、批量状态变更和软删除。
- `/products/new`、`/products/[id]`、`/products/[id]/edit`：商品创建、详情和编辑。
- `/copywriting`：多平台文案包、搜索筛选、手动编辑、违规词扫描。
- `/prompt-tasks`：Prompt 任务管理、搜索筛选和生成图回传。
- `/materials`：素材库、搜索筛选、预览和状态管理。
- `/inspirations`：灵感箱、手动扫描、状态流转、转商品保护。
- `/notifications`：应用内通知中心。
- `/export`：Excel 导出。
- `/backup`：手动备份。
- `/maintenance/files`：文件清理与应用内回收站。
- `/system/diagnostics`：本地运行诊断。
- `/settings/ai`、`/settings/banned-words`：AI Provider 和违规词设置。

## Excel 导出

入口：`/export`

导出文件保存在 `exports/`，包含 6 个 Sheet：

- `Products`
- `Competitors`
- `Copywriting`
- `PromptTasks`
- `Materials`
- `Scores`

导出文件不应包含 API Key、`.env` 值、数据库真实路径或完整 Windows 绝对路径。图片字段使用应用相对路径。

## 手动备份

入口：`/backup`

手动备份会复制：

- `prisma/dev.db`
- 存在时同步复制 `dev.db-wal` 和 `dev.db-shm`
- `uploads/` 文件夹

当前版本只提供手动备份，不提供应用内数据恢复。数据恢复属于 V2 规划。

## 诊断中心

入口：`/system/diagnostics`

诊断中心用于排查本地运行问题，会显示运行环境、SQLite、目录、日志、AI、图片和灵感扫描摘要。复制或导出的诊断摘要已脱敏，不应包含 API Key、完整本地路径、完整数据库路径、完整 Prompt 或完整堆栈。

## 桌面端底座

V1-Core 已沉淀路径、日志、环境判断、Vercel 只读、本地诊断、图片安全、AI 失败兜底和操作记录能力。V1-Plus 继续复用这些底座，作为未来 V1.5 Electron 技术验证和 V2 Windows 桌面端的准备基础。

当前版本没有实现 Electron 正式桌面端、系统托盘、Windows 系统通知、自动更新或安装包打包。

## V1-Plus 验收清单

- Windows 本地可以启动、读写 SQLite，并访问主要页面。
- Vercel 预览只读，写操作显示 `预览环境只读，请在 Windows 本地验收。`
- MVP、V1-Core、V1-Plus 功能入口可回归。
- 批量操作、文件清理、永久删除均有二次确认。
- 上传、导出、备份、回收站路径复用本地路径服务。
- 日志、通知、诊断、导出和前端错误不泄露 API Key 或完整本地绝对路径。
- 文件清理只保存相对路径到 `CleanupLog`。
- README、当前状态、Session Log 和已知问题已更新。

## 验证命令

```powershell
npm run lint
npm run build
npx prisma validate
npm run typecheck
npm run encoding:check
```

`package.json` 当前没有 `test` 脚本；如需测试命令，应在新增真实测试用例时一起补充。

## 常见问题

- 启动脚本提示 3000 端口占用：关闭占用进程，或手动运行 `npm run dev -- -p 3001`。
- Prisma 报 `EPERM`：关闭正在占用 Prisma Client 或 SQLite 的本地进程后重试。
- Vercel 上不能创建、上传、导出、备份或清理：这是预期行为，请在 Windows 本地验收。
- AI 失败：检查 `/settings/ai` 的 Provider 配置；AI 失败不影响手动文案、评分、素材、导出、备份和清理。
- 文件清理看到缺失文件：系统只提示缺失，不会自动改数据库。
- 备份能否恢复：当前版本不提供应用内恢复，恢复能力列入 V2。

## 明确不在当前版本实现

V1.5 才考虑：OCR、截图识别、链接导入/链接解析、API 生图技术验证、Electron 技术验证、导入质量分级、竞品共性总结、差异化建议、图片内容去重和轻量原创性审核。

V2 才考虑：正式 Windows 桌面端、数据恢复、多 SKU 管理、供应商系统、库存系统、采购批次、试销复盘、退货退款流程、PDF 报告、多智能体工作流。

当前 V1-Plus 不实现自动采集、自动上架、自动私信、自动评论、自动打开 ChatGPT、浏览器自动化、系统托盘、Windows 系统通知、自动更新、后台队列或真正多智能体调度。
