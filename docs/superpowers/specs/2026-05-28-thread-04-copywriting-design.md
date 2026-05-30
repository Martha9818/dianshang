# Thread 04 AI 设置与文案生成设计

## Summary

Thread 04 为 `EcomPilot MVP` 增加可真实使用的 AI 设置、违规词设置、文案生成与文案编辑能力，范围严格限定在：

- `/settings/ai` 的真实 CRUD 与测试连接
- `/settings/banned-words` 的真实 CRUD
- `/copywriting` 单平台文案生成页
- 商品详情页 `平台文案` Tab
- 文案保存、手动编辑、复制、违规词扫描
- 首页“已生成文案数量”和“最近活动”的真实联动

Thread 04 不做：

- API 生图
- 图片生成
- OCR
- 链接解析
- 原创性审核
- 自动发布
- 真正多 Agent 调度

本线程继续遵守当前 MVP 的运行时约束：

- `local` 为唯一正式可写验收环境
- `preview` / `cloud` 为只读降级环境
- Vercel 仅作界面预览，不执行真实 AI 调用

## Goals

- 可以配置 OpenAI-compatible 文本接口
- 可以对未保存表单直接测试连接
- 可以维护违规词库
- 可以为一个商品的一个平台生成 3 个版本的文案
- 可以保存、编辑、复制文案
- 可以对文案执行违规词扫描并高亮
- 可以在商品详情页查看与筛选已生成文案
- 可以在首页看到真实文案数量与最新文案活动

## Key Decisions

- AI 调用逻辑统一放在 `src/lib/services/ai-client.ts`
- Prompt 模板统一放在 `src/lib/modules/copywriting/prompts.ts`
- 文案保存与查询逻辑统一放在 `src/lib/services/copywriting-service.ts`
- 违规词扫描统一放在 `src/lib/services/banned-word-service.ts`
- 平台差异展示和复制文本生成统一放在 `src/lib/modules/copywriting/copywriting-display-adapter.ts`
- 页面组件只负责展示、表单交互与触发 Server Action，不在页面内散落 Prompt、AI 解析、违规词扫描逻辑
- `Copywriting` 采用“一个商品 + 一个平台 + 一个版本一条记录”的固定槽位模型，MVP 不保留历史 revision

## Data Model Changes

### AIProvider

沿用现有字段：

- `name`
- `providerType`
- `baseUrl`
- `apiKey`
- `modelName`
- `purpose`
- `enabled`
- `isDefault`

约束：

- MVP 固定 `providerType = openai-compatible`
- MVP 固定 `purpose = text`
- 同时只能存在一个 `enabled = true && isDefault = true` 的默认 Provider
- 允许多个已启用 Provider，但只能有一个默认 Provider

安全约束：

- `apiKey` 明文存 SQLite 可以接受
- `apiKey` 不写入 `OperationLog`
- `apiKey` 不出现在错误提示
- `apiKey` 不出现在导出文件
- 前端列表与普通读接口不返回完整 `apiKey`
- `README` 与备份说明中明确提示 SQLite 内含 API Key，备份时需谨慎保管

### BannedWord

沿用现有字段：

- `word`
- `category`
- `riskLevel`

Thread 04 增加真实 CRUD，不改历史 `Copywriting.riskWords` 数据。

### Copywriting

保留现有字段：

- `productId`
- `platform`
- `copyType`
- `version`
- `style`
- `title`
- `content`
- `auditStatus`
- `riskWords`

新增字段：

- `providerId Int?`
- `mainCopy String?`
- `sellingPointsJson String?`
- `faqJson String?`
- `riskNotesJson String?`
- `structuredPayloadJson String?`
- `rawResponseText String?`
- `generationStatus String?`

关系与约束：

- `providerId` 关联 `AIProvider.id`
- `Copywriting.providerId` 建议 `onDelete: SetNull`
- 增加 `(productId, platform, version)` 组合唯一约束

字段语义：

- `title`：标准展示标题
- `mainCopy`：主正文
- `content`：页面可继续保留为兼容字段，可存汇总可读文本
- `sellingPointsJson`：卖点数组 JSON string
- `faqJson`：FAQ 数组 JSON string
- `riskNotesJson`：风险提示数组 JSON string
- `structuredPayloadJson`：该版本完整结构化结果 JSON string
- `rawResponseText`：AI 非 JSON 或解析失败时保留的原始文本
- `generationStatus`：`success | partial | failed`
- `riskWords`：命中明细 JSON string，不使用简单逗号拼接

## Persistence Rules

### 文案生成保存

- 一次生成仅针对一个平台
- 一次请求需要得到 A / B / C 三个版本
- 系统将 A / B / C 拆成 3 条 `Copywriting`
- 同 `productId + platform + version` 只保留最新一条
- 重生成时执行覆盖更新，不新增重复记录
- MVP 不保留历史版本，历史 revision 留到后续线程

### 手动填写保存

当 AI 失败或用户直接人工填写时：

- `providerId = null`
- `generationStatus = success`
- `rawResponseText = null`
- 仍然执行违规词扫描
- `auditStatus` 按扫描结果实时生成

### Provider 删除规则

- 未被 `Copywriting` 使用过的 Provider 可以删除
- 已被 `Copywriting` 使用过的 Provider 不建议物理删除，只允许禁用
- 删除已被使用的 Provider 时应返回明确提示并引导用户改为禁用

## Runtime Behavior

- `local`：允许真实测试连接、真实 AI 生成、真实保存
- `preview` / `cloud`：禁止真实 AI 调用

在 `preview` / `cloud` 下：

- 禁止测试连接
- 禁止生成文案
- 禁止重生成
- 显示统一提示：
  - `预览环境不执行真实 AI 调用，请在 Windows 本地验收`

前后端都要拦截，不能只依赖前端禁用按钮。

## AI Client Design

文件：

- `src/lib/services/ai-client.ts`

职责：

- 统一处理 OpenAI-compatible 文本接口调用
- 统一处理测试连接
- 统一处理结构化输出与降级解析
- 统一翻译常见错误消息

公开能力：

- `testConnection(providerId)`
- `testConnectionWithConfig({ baseUrl, apiKey, modelName, providerType })`
- `generateStructuredCopywriting(...)`

### 测试连接规则

- 支持对已保存 Provider 直接测试
- 支持对未保存表单直接测试
- `testConnectionWithConfig` 不落库，只验证当前输入

### 结构化输出优先级

文案生成优先级：

1. 若 Provider 支持结构化输出能力，优先使用 `response_format` / `json_schema`
2. 若不支持，再退化为普通 JSON Prompt + 文本解析兜底

### 错误翻译规则

- API Key 错误：
  - `认证失败，请检查 API Key`
- 模型名错误：
  - `模型不可用，请检查模型名`
- 网络超时：
  - 提示可重试
- 限流 / 余额不足：
  - 显示中文化原因摘要
- 返回非 JSON：
  - 不阻断保存原文
  - 返回“解析失败，已保留原始文本，可手动整理后保存”

安全要求：

- 错误消息中不得回显 API Key
- 调试输出与日志中不得写入完整 API Key

## Prompt Design

文件：

- `src/lib/modules/copywriting/prompts.ts`

职责：

- 保存固定总 Prompt 模板
- 保存平台追加要求
- 提供模板变量填充
- 注入兜底策略

变量映射按 Thread 04 要求实现：

- `{product_name}` = `product.name`
- `{category_level1}` = `product.categoryLevel1`
- `{category_level2}` = `product.categoryLevel2`
- `{product_tags}` = `product.tags`
- `{target_user}` = `product.targetUser`
- `{estimated_price}` = `product.estimatedPrice`
- `{estimated_cost}` = `product.estimatedCost`
- `{estimated_shipping}` = `product.estimatedShipping`
- `{selling_points}` = `product.sellingPoints`
- `{pain_points}` = `product.painPoints`
- `{usage_scenes}` = `product.usageScenes`
- `{target_platforms}` = `product.targetPlatforms`
- `{notes}` = `product.notes`
- `{platform}` = 当前平台
- `{banned_words}` = 默认违规词 + 用户自定义违规词
- `{competitor_selling_points}` = 当前商品竞品 `sellingPoint` 汇总
- `{competitor_pain_points}` = 当前商品竞品 `painPoint` 汇总
- `{competitor_price_range}` = 当前商品竞品价格区间
- `{competitor_image_style}` = 当前商品竞品 `imageStyle` 汇总

兜底规则：

- 核心卖点为空：页面提示用户补充，但允许继续生成
- 用户痛点为空：Prompt 中写“请基于商品类目推测常见用户痛点，但不要虚构具体效果”
- 使用场景为空：使用“日常使用场景”
- 无竞品信息：Prompt 中写“暂无竞品信息，请基于商品基础信息生成”

## Banned Word Scan Design

文件：

- `src/lib/services/banned-word-service.ts`

职责：

- 读取全部违规词
- 扫描文案所有展示字段
- 产出命中明细、高亮辅助结构与 `auditStatus`

扫描范围：

- `title`
- `mainCopy`
- `sellingPoints`
- `faq`
- `riskNotes`

命中结果格式建议：

- `word`
- `riskLevel`
- `category`
- `field`
- `matchedText`

高亮等级：

- `high` 标红
- `medium` 标橙
- `low` 标灰

状态规则：

- 无命中：`无风险`
- 命中低 / 中风险：`有风险`
- 命中高风险，或编辑后需人工处理：`待修改`

删除违规词时：

- 仅影响未来扫描
- 不回写历史 `Copywriting.riskWords`

## Copywriting Service Design

文件：

- `src/lib/services/copywriting-service.ts`

职责：

- 读取商品、竞品聚合、Provider 与违规词
- 生成 Prompt
- 调用 AI Client
- 解析 A / B / C 三版
- 处理结构化输出与普通 JSON 兜底
- 对每版执行违规词扫描
- 覆盖保存 `Copywriting`
- 写入操作日志
- 提供列表查询、详情查询、编辑保存、重生成能力

### 解析策略

- 预期 AI 返回平台级 JSON，内含 `versions`
- 若返回 JSON 缺少某一版：
  - 已成功解析的版本照常保存
  - 缺失版视为 `partial`
  - 页面展示明确提示
- 若整体不是 JSON：
  - 保存 `rawResponseText`
  - `generationStatus = partial`
  - 页面允许用户手动补全

### 重生成策略

- 重生成覆盖同 `productId + platform + version` 的记录
- 不产生重复记录

### 操作日志

建议新增日志动作：

- `GENERATE_COPYWRITING`
- `UPDATE_COPYWRITING`
- `TEST_AI_PROVIDER`
- `CREATE_AI_PROVIDER`
- `UPDATE_AI_PROVIDER`
- `DELETE_AI_PROVIDER`
- `CREATE_BANNED_WORD`
- `UPDATE_BANNED_WORD`
- `DELETE_BANNED_WORD`

注意：

- 日志中不得包含 API Key

## Display Adapter Design

文件：

- `src/lib/modules/copywriting/copywriting-display-adapter.ts`

职责：

- 将不同平台的 `structuredPayloadJson` 转为统一页面展示模型
- 生成适合复制到剪贴板的可读文本

统一页面展示结构建议包含：

- `displayTitle`
- `styleLabel`
- `sections`
- `sellingPoints`
- `faqItems`
- `riskNotes`
- `copyText`

平台差异由 adapter 负责处理，例如：

- 闲鱼：标题、商品描述、议价回复、发货说明、常见问题回复
- 淘宝：商品标题、主图卖点、详情文案、参数说明、FAQ、售后说明
- 小红书：笔记标题、正文、标签、评论互动、内容角度建议
- 抖音：视频标题、封面文案、脚本、口播稿、商品卡卖点

页面组件不直接拼接平台专属文案文本。

## Page Design

### `/settings/ai`

目标：

- Provider 真实 CRUD
- 默认 Provider 唯一性控制
- 支持未保存表单直接测试

页面结构：

- Provider 列表
- 编辑表单
- 测试连接结果区

字段：

- Provider 名称
- Provider 类型
- Base URL
- API Key
- 模型名
- 用途
- 是否启用
- 是否默认

交互规则：

- `API Key` 默认掩码
- 编辑时支持覆盖已有 key
- 测试连接可以直接使用当前表单值，不要求先保存
- 设为默认时自动取消其他默认 Provider
- 禁止出现“默认但未启用”的状态
- 已被文案使用的 Provider 禁止物理删除

### `/settings/banned-words`

目标：

- 违规词真实 CRUD
- 保留统计卡与筛选能力

页面结构：

- 顶部统计卡
- 筛选栏
- 列表表格
- 新增 / 编辑表单

交互规则：

- 支持新增、编辑、删除
- 支持分类与风险等级设置
- `word` 唯一，重复时报明确提示

### `/copywriting`

目标：

- 单平台一次生成 3 版
- 支持保存、编辑、复制、重生成、违规词展示

页面结构：

- 商品选择
- 平台选择
- Provider 选择
- 商品信息摘要
- 生成按钮
- A / B / C 三张版本卡

交互规则：

- 平台为单选
- Provider 默认选当前默认 Provider
- 无默认 Provider 时禁止直接生成并提示先配置
- Provider 被禁用时禁止生成
- 生成中禁用按钮
- 同一商品 + 平台同时只允许一个生成任务
- 重复点击提示“正在生成中，请稍候”

每张版本卡支持：

- 查看结构化内容
- 查看违规词命中
- 编辑
- 保存
- 复制
- 重新生成

### 商品详情页 `平台文案` Tab

目标：

- 展示该商品所有已生成文案
- 支持平台与版本筛选
- 支持编辑与复制
- 支持跳转到 `/copywriting`

展示内容：

- 平台
- 版本
- 风格
- 审核状态
- 更新时间
- 编辑入口
- 复制入口

## Homepage Linkage

首页改动：

- “已生成文案数量”改为真实统计 `Copywriting` 数量
- “最近活动”改为读取 `OperationLog` 的真实活动流

活动流优先展示：

- 文案生成
- 文案编辑
- Provider 测试 / 修改
- 违规词维护

## Concurrency Guard

MVP 不实现完整任务队列，但必须做轻量防重入：

- 生成按钮在提交中时禁用
- 服务端对同 `productId + platform` 生成请求做并发保护
- 重复提交提示“正在生成中，请稍候”

## Verification

必跑：

- `npx prisma migrate dev`
- `npm.cmd run lint`
- `npm.cmd run build`

本地验收场景：

- 新增 Provider
- 编辑 Provider
- 删除未被使用的 Provider
- 已被使用的 Provider 只能禁用
- 无默认 Provider 时生成被阻止
- Provider 被禁用时生成被阻止
- 已保存 Provider 测试连接
- 未保存表单直接测试连接
- API Key 错误提示
- 模型名错误提示
- preview 模式禁止测试连接
- 单平台生成 A / B / C 三版
- 返回 JSON 缺少某一版时部分保存
- 返回非 JSON 时保存原文并允许手动补全
- 手动填写文案保存
- 手动编辑后重新审核
- 违规词高亮与状态正确
- 删除违规词不影响历史 `riskWords`
- 重生成不产生重复记录
- 商品详情页文案 Tab 支持筛选、编辑、复制
- 首页文案数量和最近活动联动正确
- preview 模式不执行真实 AI 请求

## Files Expected To Change

- `prisma/schema.prisma`
- `prisma/migrations/...`
- `README.md`
- `src/app/page.tsx`
- `src/app/copywriting/page.tsx`
- `src/app/settings/ai/page.tsx`
- `src/app/settings/banned-words/page.tsx`
- `src/app/products/[id]/page.tsx`
- `src/app/products/actions.ts`
- `src/lib/services/ai-client.ts`
- `src/lib/services/banned-word-service.ts`
- `src/lib/services/copywriting-service.ts`
- `src/lib/services/product-service.ts`
- `src/lib/modules/copywriting/prompts.ts`
- `src/lib/modules/copywriting/copywriting-display-adapter.ts`

## Implementation Order

1. Prisma schema 与 migration
2. AI client
3. Prompt 模板
4. 违规词服务
5. 文案服务
6. AI 设置页与测试连接
7. 违规词设置页
8. `/copywriting`
9. 商品详情页 `平台文案` Tab
10. 首页联动
11. 本地验收与 preview 降级验证
