# EcomPilot V1.5

EcomPilot 是一个 Windows 本地优先的电商选品与运营工作台。正式数据以本机 SQLite、`uploads/`、`exports/`、`backups/`、`logs/` 和应用内 `trash/` 为准；Vercel 仅用于只读预览。

## 当前版本范围

- MVP：商品 CRUD、软删除、详情、主图上传、竞品录入、成本与利润测算、六维评分、推荐结论、文案生成与编辑、违规词扫描、Prompt 任务、生成图回传素材库、素材库预览筛选、Excel 导出、手动备份。
- V1-Core：AI Provider 设置、AI 调用日志、多平台文案包、AI 识图轻量建议、识图结果不自动保存为事实、灵感文件夹手动扫描、图片安全处理、本地运行诊断、Vercel 只读降级，以及 RuntimeConfig / LocalPathService / EnvironmentGuard / LogService / OperationLog 等底座能力。
- V1-Plus：全局搜索与筛选、灵感箱管理增强、首页待办、应用内通知中心、批量操作安全机制、文件清理与应用内回收站。
- V1.5：灵感文件夹定时扫描、自动 AI 识图草稿、截图识别、图片导入结构化、链接导入尝试、导入质量分级、竞品智能分析、差异化建议、图片去重、轻量原创性风险提示、API 生图轻量版、Electron 技术验证、站内搜索助手、通知摘要助手。

V1.5 只做轻量智能与技术验证，不提前实现 V2，不新增第二套文件清理系统，不实现正式桌面端、SKU、供应商、库存、试销复盘、PDF 报告或真正多 Agent 调度。

## Windows 本地运行

首次启动请在 PowerShell 中执行：

```powershell
cd <项目目录>
npm install
Copy-Item .env.example .env
npx prisma migrate dev
npm run prisma:seed
npm run dev
```

然后访问 [http://localhost:3000](http://localhost:3000)。

也可以直接双击 `start.bat`。它会检查 Node.js、npm、`.env`、依赖、本地 SQLite、默认违规词、3000 端口，以及 `uploads/`、`exports/`、`backups/`、`logs/`、`trash/` 目录。若 Windows 出现 Prisma Client `EPERM` 文件锁，请先关闭相关 `node`、`next`、`prisma` 进程后重试。

## 本地目录

- `uploads/`：商品主图、竞品截图、素材图、Prompt 回传图、灵感图、截图识别图及其缩略图。
- `exports/`：Excel 导出文件。
- `backups/`：手动备份目录。
- `logs/`：脱敏应用日志。
- `trash/`：EcomPilot 应用内回收站，仅服务于文件清理能力。

这些目录是本地运行数据，不应提交到 Git。前端、导出、诊断、通知和日志只展示相对路径或脱敏摘要，不展示完整 Windows 绝对路径、数据库真实路径、API Key、`.env` 值、完整 Prompt 或完整堆栈。

## Vercel 只读预览

Vercel 只用于页面预览和可访问性检查，不用于正式写入验收。预览环境必须满足：

- 可以打开主要页面并展示只读数据或安全降级内容。
- 不写 SQLite、`uploads/`、`exports/`、`backups/`、`logs/`、`trash/`。
- 不执行真实文件扫描、移动、删除，不执行高成本 AI 调用，不执行 API 生图，不执行 Electron POC。
- 所有写操作统一提示：`预览环境只读，请在 Windows 本地验收。`
- 页面、通知、日志、导出和诊断不暴露 API Key、完整本地路径、数据库路径、`.env` 值、原始 Prompt 或完整堆栈。

需要真实创建、上传、导出、备份、扫描、清理或 AI 写入时，请在 Windows 本地运行。

## V1.5 智能功能边界

### 灵感文件夹定时扫描

- 只扫描用户指定的本地灵感文件夹。
- 只在应用本地运行时按配置间隔触发。
- 先完成文件导入，再记录 AI 草稿任务状态。
- AI 草稿仅供人工确认，不自动写回正式商品事实。

### 截图识别与图片导入结构化

- 入口：`/screenshots`
- 支持用户主动上传截图，或从已有商品 / 竞品 / 素材 / 灵感记录进入。
- AI 结果只保存在截图任务草稿中，不自动覆盖商品、竞品、评分、素材或状态字段。
- 预览环境提示：`预览环境只读，请在 Windows 本地验收截图识别。`

### 链接导入尝试

- 入口：`/link-imports`
- 只支持用户手动粘贴单条链接。
- 只尝试公开元信息，不做登录、Cookie、浏览器自动化、平台爬虫、批量采集或反爬绕过。
- 失败时保留为手动草稿，不阻塞人工补充说明、截图或备注。

### 竞品智能分析与差异化建议

- 入口：商品详情页 `competitor-analysis` 标签。
- 只基于本地已有商品、竞品、截图草稿、链接草稿数据生成分析快照。
- 结果是 AI 参考意见，不覆盖评分、推荐结论、商品状态或竞品事实。

### 图片去重与轻量原创性风险提示

- 入口：`/materials`、`/inspirations`
- 只做本地指纹比对、重复 / 高相似提示和轻量原创性风险提醒。
- 不负责删除、不移动到回收站、不永久删除。
- 如需删除，必须走既有的 V1-Plus 文件清理与回收站流程：`/maintenance/files`。

## API 生图轻量版

入口：`/settings/ai` 与 `/prompt-tasks`

- 需要单独配置用途为 `API 生图` 的 Provider。
- 功能默认关闭，必须人工开启。
- 每次点击只生成 1 张图，不做批量、循环、后台任务或自动上架。
- 会提示尺寸、质量、模型对应的成本风险；高成本配置需要二次确认。
- 成功后写入受管 `uploads/`，并创建关联素材记录，标记为 `ai_generated` 且 `needs_review`。
- API Key 只在服务端读取，不返回前端，不写入日志、通知、导出或任务参数摘要。
- Vercel 预览只展示说明，不调用真实生图 API；写操作提示：`预览环境只读，请在 Windows 本地验收 API 生图。`

## 文件清理与应用内回收站

入口：`/maintenance/files`

- 这是 V1-Plus 既有能力，V1.5 不会重建第二套清理系统。
- 支持人工扫描 `uploads/`、`exports/`、`backups/`，识别孤儿文件、旧导出、旧备份和回收站内容。
- 正在使用的商品主图、素材、竞品截图、活跃灵感图片不会被直接建议删除。
- 移入回收站需要二次确认。
- 永久删除只允许删除已经位于应用内 `trash/` 的文件，并且需要二次确认。
- `CleanupLog` 只记录相对路径和脱敏摘要，不记录完整本地绝对路径。
- 图片去重只提示，不删除；站内助手只提醒和跳转，不自动执行任何清理。

## AI 与安全说明

- AI Provider 配置保存在本地数据库中，API Key 只在服务端使用。
- AI 日志只保存脱敏摘要、状态、模型、耗时和错误摘要，不保存敏感 provider 原始响应。
- AI 失败不应影响商品、评分、素材、导出、备份、文件清理等非 AI 流程。
- 导出文件、文档、通知、前端错误和诊断摘要都不应包含 API Key、完整本地绝对路径或完整原始 Prompt。
- 历史 Vercel recovery codes 风险仍需在 provider 侧轮换或吊销，当前仓库已只保留风险提醒，不再保留明文。

## Electron 技术验证

V1.5 Thread 07 仅新增 `experiments/electron-poc/` 作为 Electron 技术验证目录。

- 它只验证 Electron 壳加载现有本地 Next.js 页面和本地端口访问。
- 它不是正式 Windows 桌面端，不生成安装包，不做自动更新、系统托盘、Windows 系统通知、崩溃恢复或后台常驻。
- 它不替换 `start.bat`、`npm run dev`、本地 SQLite 路径服务或现有运行底座。
- Vercel 通过 `.vercelignore` 忽略该目录，预览环境不执行 Electron 代码。

正式 Windows 桌面端属于 V2 规划，不在 V1.5 内实现。

## 站内助手

入口：`/assistant`

- 这是轻量站内助手，不是多 Agent，不做自治执行。
- 包含“站内搜索助手”和“通知摘要助手”两个只读区域。
- 搜索助手只返回本地规则生成的安全跳转、筛选、搜索或导航建议。
- 摘要助手只基于首页待办、通知、AI 失败提醒、备份状态和已有 CleanupLog 生成摘要。
- 它不会自动修改、删除、归档、清理、批量执行、标记通知已读、生成图片或修改商品状态。
- 它只会提醒并跳转到 ` /maintenance/files `，不会自动执行文件清理。
- Vercel 预览显示：`预览环境只读，请在 Windows 本地验收站内助手。`

## 验证命令

```powershell
npm run encoding:check
npm run lint
npm run build
npx prisma validate
npm run typecheck
npm run thread09:verify
```

说明：

- 根项目当前没有 `npm test` 脚本。
- Electron POC 验证使用 `experiments/electron-poc` 下的 `npm run smoke`。
- Thread 09 不新增 Prisma migration；现有 migration 用途见 `docs/current/DATABASE_CHANGELOG.md`。

## V2 规划入口

V2 只做规划，不在 V1.5 直接实现。下一阶段可讨论的主题：

- 正式 Windows 桌面端
- 数据恢复
- 多 SKU
- 供应商管理
- 采购批次
- 库存
- 试销复盘
- PDF 报告
- 正式 Agent Mode

V2 讨论前请先查看 `docs/current/CHANGELOG_DEV.md`、`docs/current/RISK_REGISTER.md`、`docs/current/THREAD_SCOPE_CHECKLIST.md`。
