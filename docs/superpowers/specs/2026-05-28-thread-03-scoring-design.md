# Thread 03 评分模型与推荐结论

## Summary

Thread 03 为商品详情页补齐纯规则评分闭环，不引入 AI、机器学习、自动重算、供应商模块或通知中心。

实现范围：

- 商品评分 Tab
- 六维评分与总分
- 临时评分规则
- 一票否决规则
- 推荐结论
- 扣分原因
- 下一步建议
- 保存 `ScoreSnapshot`
- 历史评分记录
- 根据评分更新商品状态
- 首页和商品列表的评分轻量联动

## Key Decisions

- 评分核心逻辑放在 `src/lib/modules/scoring/` 与 `src/lib/services/scoring-service.ts`。
- 页面只展示与触发，不直接编写评分规则，也不直接 `JSON.parse` 快照字段。
- “实时计算”仅指基于当前已保存数据的预览；只有点击“重新计算评分”才会持久化：
  - `Product` 手动风险字段
  - 商品状态
  - `ScoreSnapshot`
- `saveScoreAction` 使用 Prisma transaction 包裹：
  - 保存手动风险字段
  - 更新商品状态
  - 写入 `CHANGE_STATUS` 日志
  - 创建 `ScoreSnapshot`
  - 写入 `CALCULATE_SCORE` 日志
- `deductionReasons` 与 `nextSuggestions` 继续存 `String?` JSON，统一走 stringify/parse helper。
- 最新评分读取统一走：
  - `getLatestScoreSnapshot(productId)`
  - `getLatestScoreMap(productIds)`
- 首页“需要重新评分”统计规则：
  - 仅统计 `deletedAt = null` 的商品
  - 若无评分快照，或商品/竞品最新更新时间晚于最新评分时间，则计入

## Data Changes

- `Product`
  - `manualRegulatedRisk Boolean`
  - `manualInfringementRisk Boolean`
  - `manualRiskNotes String?`
- `ScoreSnapshot`
  - `recommendationNote String?`
  - `manualRegulatedRisk Boolean`
  - `manualInfringementRisk Boolean`
  - `manualRiskNotes String?`

## Rule Notes

- 总分权重、六维子项权重、临时评估、待补充成本数据、一票否决和推荐结论全部按 Thread 03 提供规则实现。
- 供应商稳定性分在 MVP 固定为 `60`，并在扣分原因中提示供应商数据不足。
- 推荐结论优先级固定为：
  - 一票否决
  - 待补充成本数据
  - 临时评估
  - 正式分数段结论
- `ruleVersion` 固定为 `thread03-mvp-v1`。

## Acceptance Fixtures

### A. 宠物梳毛器

- 售价 `29.9`
- 进货价 `8`
- 运费 `3`
- 包装 `1`
- 有效竞品 `5`
- 品类风险 `低风险`
- 退货风险 `低`
- 手动风险：
  - `manualRegulatedRisk = false`
  - `manualInfringementRisk = false`
- 预期结论：`建议测试`

### B. 冷门宠物装饰摆件

- 售价 `39.9`
- 进货价 `18`
- 运费 `5`
- 包装 `0`
- 有效竞品 `1`
- 品类风险 `中风险`
- 手动风险：
  - `manualRegulatedRisk = false`
  - `manualInfringementRisk = false`
- 预期结论：`临时评估`

### C. 宠物营养粉

- 售价 `59`
- 进货价 `20`
- 运费 `4`
- 包装 `1`
- 有效竞品 `6`
- 品类风险 `高风险`
- 手动风险：
  - `manualRegulatedRisk = true`
  - `manualInfringementRisk = false`
- 预期结论：`淘汰`

## Verification

- `npx prisma migrate dev`
- `npm.cmd run lint`
- `npm.cmd run build`
- 本地核对验收样例 A / B / C 的结论与状态
