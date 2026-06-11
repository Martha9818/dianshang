# Handoff

## 项目

- 项目名：`EcomPilot`
- 工作目录：`E:\电商`
- 当前分支：`main`
- 当前日期基线：`2026-06-11`

## 当前恢复结论

当前项目不是从零开始，而是已经有明确仓库记忆和线程边界。即使 Codex 重装导致左侧历史对话消失，只要项目目录、`.git`、本地 SQLite/runtime、以及仓库内记忆文件仍在，新会话就能按当前基线继续。

## 规则主来源

新会话必须先读：

1. [AGENTS.md](/E:/电商/AGENTS.md)
2. [CURRENT_STATUS.md](/E:/电商/agent-memory/CURRENT_STATUS.md)
3. [SESSION_LOG.md](/E:/电商/agent-memory/SESSION_LOG.md)
4. [DOC_INDEX.md](/E:/电商/docs/current/DOC_INDEX.md)

按 `DOC_INDEX.md` 再选择当前任务相关文档，默认不要读 `agent-memory/archive/`。

## 当前主线状态

- `V1.6-08 final acceptance and closeout` 已完成并记录
- 当前 mainline 还带着 `V1.7 Design Gate` 和后续 `V1.7 MVP Thread 01/02`、`V1.7.1 Thread 00/01` 的已实现与已验收结果
- 当前推荐动作不是立刻再开一个新的实现线程，而是先把 `V1.7.1` 这组 closeout 基线作为当前交接点，完成干净的 commit/push，然后等待真实本地使用暴露下一个窄问题

## 当前冻结边界

- 不要引入登录、云账户、支付、爬虫、OCR 扩展、自动发布、库存、供应商、通知中心扩展、后台队列、真实多 agent 系统或 V2 行为
- Vercel 仍然是 preview-only、read-only
- Windows 本地 runtime 才是可写事实源
- docs-only 任务不能顺手改 schema、migration、dependency、filesystem write behavior、AI behavior、UI behavior、product logic

## 当前建议作为 handoff 基线的文档

- [2026-06-09-v16-final-acceptance.md](/E:/电商/docs/superpowers/acceptance/2026-06-09-v16-final-acceptance.md)
- [2026-06-09-v17-confirm-to-competitor-design-gate.md](/E:/电商/docs/superpowers/specs/2026-06-09-v17-confirm-to-competitor-design-gate.md)
- [2026-06-09-v17-mvp-thread02-acceptance.md](/E:/电商/docs/superpowers/acceptance/2026-06-09-v17-mvp-thread02-acceptance.md)
- [2026-06-09-v17-1-thread00-acceptance.md](/E:/电商/docs/superpowers/acceptance/2026-06-09-v17-1-thread00-acceptance.md)
- [2026-06-09-v17-1-thread01-acceptance.md](/E:/电商/docs/superpowers/acceptance/2026-06-09-v17-1-thread01-acceptance.md)

## 当前 git 观察

- 分支：`main`
- 最近 5 个提交：
  - `c645ed6 feat: close out v1.7 competitor screenshot confirm flow`
  - `6771e22 Add read-only competitor screenshot draft prep`
  - `c96c9bb Complete V1.6 flow and closeout`
  - `80fbdb5 Fix inspiration scan settings bottom spacing`
  - `be78001 Rework inspiration inbox buyer desk layout`
- 当前 `git status --short`：
  - `?? tmp/`

## 新会话应该怎么开

先让新 Codex 做三件事：

1. 严格读取启动文档
2. 复述“当前状态 / 当前冻结边界 / 下一步建议”
3. 在你确认复述无偏差后，再开始动手

如果新会话一上来就跳过文档、直接猜需求、或者把版本线说成别的，就应该立刻打断，要求它重新按启动顺序读取。

## 建议技能/动作

- `context-save`：后续每次需要做大动作前，先保存现场
- `handoff`：当你准备换机器、重装、或换线程时，再生成一次交接摘要
- 本项目内置记忆更新：做了有意义的工作后，同步更新 `CURRENT_STATUS.md` 和 `SESSION_LOG.md`
