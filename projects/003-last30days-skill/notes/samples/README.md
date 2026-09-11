# 离线回放样例

**这里展示固定测试输入经过真实代码处理的结果，不是真实联网研究。** 研究版本 v3.24.0 / `ca9d415e66073b17702f385d6886934097aec0e7`，生成日期 2026-09-11。

| 文件 | 内容 | 来源 |
| :--- | :--- | :--- |
| [fixture-query-plan.json](fixture-query-plan.json) | 查询计划，不含执行配置或密钥 | 上游 tech-product fixture manifest 的 plan |
| [fixture-agent-output.json](fixture-agent-output.json) | 实际生成的 Agent JSON，schema `1.3` | 回放报告经 `schema.to_agent_export` 导出 |
| [fixture-engine-output.txt](fixture-engine-output.txt) | 实际生成的证据文本，前置离线标记 | 回放报告经 `render.render_compact` 导出 |
| [offline-eval-results.txt](offline-eval-results.txt) | 7 类样例的评分表，带版本和日期 | 上游 harness 本次运行 |
| [offline-replay-log.txt](offline-replay-log.txt) | 本次回放诊断输出 | 上游 harness 标准错误输出 |

`Nimbus`、`.example.test` 地址、互动数等属于测试内容。链接不是实际产品地址或在线演示；不要点击测试地址去验证现实事件。样例里 `comments` 数值不能证明已有对应数量的评论正文。

评分表已清理行尾空格，保留原始评分数值与列结构。

上游出处：[fixtures](https://github.com/mvanhorn/last30days-skill/tree/ca9d415e66073b17702f385d6886934097aec0e7/tests/eval/fixtures)、[harness](https://github.com/mvanhorn/last30days-skill/blob/ca9d415e66073b17702f385d6886934097aec0e7/tests/eval/harness.py)。引用这些上游派生输出时保留 [MIT 许可](../../UPSTREAM-LICENSE.txt)。

[验证记录](../05-validation-and-reproduction.md) · [返回项目](../../README.md)
