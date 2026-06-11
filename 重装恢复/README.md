# 重装恢复包

这个目录用于在重装 Codex 后，继续当前 `EcomPilot` 项目进度，并尽量保持规则、边界、线程状态不漂移。

## 这个恢复包解决什么

- 左侧历史对话丢失后，仍然可以恢复当前项目上下文
- 让新的 Codex 先按仓库规则读文档，再开始做事
- 把当前线程基线、下一步建议、恢复提示词放在一起，减少重新解释成本

## 重装前要保住什么

1. 整个项目目录 `E:\电商`
2. 项目的 `.git` 目录和本地提交历史
3. Windows 本地 SQLite 数据与 runtime 目录
4. 本目录 `E:\电商\重装恢复`

## 重装后怎么恢复

1. 打开 Codex，并进入工作目录 `E:\电商`
2. 新开一个线程
3. 把 [RECOVERY_PROMPT.txt](/E:/电商/重装恢复/RECOVERY_PROMPT.txt) 的全文发给新的 Codex
4. 让它先只做启动阅读和状态复述，不要直接改代码
5. 确认它复述出的当前边界、当前版本线、下一步建议与 [HANDOFF.md](/E:/电商/重装恢复/HANDOFF.md) 一致，再继续执行

## 当前仓库内最重要的恢复基线

- [AGENTS.md](/E:/电商/AGENTS.md)
- [CURRENT_STATUS.md](/E:/电商/agent-memory/CURRENT_STATUS.md)
- [SESSION_LOG.md](/E:/电商/agent-memory/SESSION_LOG.md)
- [DOC_INDEX.md](/E:/电商/docs/current/DOC_INDEX.md)
- [THREAD_SCOPE_CHECKLIST.md](/E:/电商/docs/current/THREAD_SCOPE_CHECKLIST.md)

这些文件是“规则和进度”的主来源，优先级高于历史聊天记录。

## 当前已知仓库状态

- 当前分支：`main`
- 最近提交：
  - `c645ed6 feat: close out v1.7 competitor screenshot confirm flow`
  - `6771e22 Add read-only competitor screenshot draft prep`
  - `c96c9bb Complete V1.6 flow and closeout`
- 当前未跟踪内容：`tmp/`

## 建议

- 重装前如果还有新的有效工作，先做一次本地提交
- 若后续线程继续推进，记得同步更新本目录中的 `HANDOFF.md`
