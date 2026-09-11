# 核验报告、证据索引与许可

研究日期：2026-09-11；固定提交：`c8da0e7ece27d6a0007b53f54f546bf0ff1086d4`。

## 1. 核验方法与边界

读取上游固定提交的文档、配置、三个脚本和公开 feed。来源名单保存在重整后的[来源目录](../data/source-catalog.json)，核验使用材料的 URL、SHA-256、时间及结果保存在 [verification.json](../data/verification.json)。仓库不保存完整上游源码副本或第三方原文全文。

原创 [probe-prepare.mjs](../scripts/probe-prepare.mjs) 下载固定提交材料，在 Node.js VM 中执行**原始准备脚本**；用虚拟 POSIX 路径、虚拟用户配置和预先读取的真实 feed 替代文件系统及网络接口。另注入少量明确标记的失败 / 仅博客测试场景。它不调用中心采集、模型 API、调度器和消息发送接口。

环境：Windows，Node.js v22.15.0。VM 模块为 Node 的实验特性，运行时提示属预期。虚拟 POSIX 执行成功不意味着上游在原生 Windows 路径下已完整兼容。

## 2. 重跑

在本子项目目录执行：

```powershell
node --experimental-vm-modules scripts/probe-prepare.mjs
```

无需安装依赖，需 Node.js 20+ 与 GitHub Raw 网络访问。结果打印为 JSON；若要保存本次运行记录：

```powershell
node --experimental-vm-modules scripts/probe-prepare.mjs | Set-Content -Encoding utf8 data/verification.json
```

命令只更新核验记录，不创建真实用户配置、不新增定时任务、不发送消息。上游源码仅在内存中使用。

## 3. 固定版本公开数据

| 数据 | generatedAt（UTC） | 条目 |
| :--- | :--- | :--- |
| X | 2026-09-10T06:40:40.193Z | 14 位作者，28 条动态 |
| 播客 | 2026-09-10T06:40:42.046Z | 0 集 |
| 博客 | 2026-09-10T06:40:42.278Z | 0 篇 |

来源配置计数为 26 / 6 / 2。上述是一个采集批次，不能推导长期覆盖率、摘要质量或渠道长期正常率。

## 4. 八项核验结果

下表“通过”表示预期观察已得到验证；缺陷得到复现也记为核验通过。

| 编号 | 场景 | 观察结果 | 结果 |
| :--- | :--- | :--- | :--- |
| V01 | 中文配置＋真实固定 feed＋默认 prompt | 14 位作者 / 28 条动态；5 份 prompt；共 8 次请求 | 通过 |
| V02 | 自定义动态 prompt | 自定义覆盖远程，少一次请求 | 通过 |
| V03 | 远程 prompt 返回 HTTP 503 | 成功回退虚拟 POSIX 本地文件 | 通过 |
| V04 | 远程 prompt 请求抛网络异常 | 整个准备过程失败，退出码 1，未走本地回退 | 通过，复现缺陷 |
| V05 | 三个 feed 均 HTTP 503 | 内容为空、三条错误，但顶层 status 为 ok | 通过，复现状态歧义 |
| V06 | 相同快照改 daily 为 weekly | 内容数组相同，未读取历史归档 | 通过，确认能力边界 |
| V07 | 再次读取同一快照 | 内容相同，未维护用户已读状态 | 通过，确认能力边界 |
| V08 | 仅有 1 篇合成博客 | 准备结果保留博客；静态检查确认 Skill 空判断遗漏博客 | 通过，确认工作流风险 |

V08 没有执行宿主大模型，不能宣称已复现某个平台一定漏发博客；确定的是输入中有博客，而 Skill 的文字条件会允许提前停止。

## 5. 源码发现与改进位置

| 编号 | 发现 | 依据 | 影响 / 建议 |
| :--- | :--- | :--- | :--- |
| S01 | README 声称 Supadata，实际用 pod2txt | [转录调用][transcript] | 以代码为准；更新服务说明 |
| S02 | README “一次 HTTP 请求”与实际不符 | [准备脚本][prepare]＋V01 | 实际默认 3 feed＋5 prompt |
| S03 | 普通系统定时方案直接将 prepare 交给 deliver | [Skill][skill] | 文档已承认发送 JSON；需加入模型执行步骤 |
| S04 | 周频率只是配置，feed 每批覆盖；没有历史聚合 | [准备脚本][prepare]、[采集脚本][generator]＋V06 | 添加历史归档与时间窗口查询 |
| S05 | 中心 seen 状态与用户阅读 / 发送无关 | [状态保存][state]＋V07 | 独立记录用户状态与发送回执 |
| S06 | 转录失败也写 seen；状态 7 天清理而播客窗口 14 天 | [播客处理][podcast]、[状态保存][state] | 失败可能短期不重试，过期后又重收；需区分失败与成功 |
| S07 | 博客进入 prepare，但 Skill 的空判断和摘要步骤滞后 | [Skill][skill]、[博客 prompt][blogprompt]＋V08 | 三类内容统一处理，并加入仅博客场景验证 |
| S08 | 网络抛异常未进入 fallback；状态未区分采集失败 | [准备脚本][prepare]＋V04/V05 | 分别捕获、明确 degraded/error 与缓存状态 |
| S09 | prompt 要求完整线程 / 引用背景，采集只保存有限原帖与引用 ID | [X 采集][x]、[动态 prompt][tweetprompt] | 补全上下文或明确降级，不靠模型猜测 |
| S10 | YouTube 模糊标题匹配失败后退回频道 | [YouTube 匹配][youtube]、[播客处理][podcast] | 标记链接精度，优先保留正确节目页 |
| S11 | Telegram 纯文本重试没有再次检查 HTTP 响应 | [发送脚本][deliver] | 可能报告成功但重试失败；需检查并记录回执 |
| S12 | 直接用 file URL pathname 拼路径 | [准备脚本][prepare]、[采集脚本][generator] | Windows 适配应使用 fileURLToPath；未做原生端到端运行 |

这些结论的范围是该固定提交。没有修改上游，也没有向作者提交 Issue 或 PR。

## 6. 未做的验证

- 未提供 X / pod2txt 凭证，未运行上游中心采集，不推断其当前服务套餐或可用性。
- 未执行宿主 onboarding 或调度说明，没有创建系统任务。
- 未测试真实 Telegram / 邮件发送，也没有给任何人发送消息。
- 未对全部 34 个来源进行可达性和内容质量评估。
- 未将公开 feed 中的观点独立事实核查；展示样例明确标记材料来源。
- 未构建或部署 Web 网站。

## 7. 来源与许可

上游 [README][readme] 声明 MIT，但核对的提交文件树未见独立 LICENSE 文件。本子项目以固定版本链接引用实现，保留作者和来源，不复制整个上游仓库。若后续引入大段上游代码，应先保留 / 核对相应版权和许可文本。

`source-catalog.json` 根据上游配置重整姓名、账号、URL 和获取方式，含来源与提交说明；它不是上游配置的原样副本，也不被当作新系统的生产配置。核验脚本和研究提示词为本研究原创。图片为原创流程图，素材记录见 [assets/README.md](../assets/README.md)。

上游仓库的代码许可不等于所有 X 帖子、播客和博客内容可以无限复制。展示仅使用必要的中文概述和原文链接；未把完整第三方 feed 正文或转录加入本仓库。

[返回项目说明](../README.md)

[readme]: https://github.com/zarazhangrui/follow-builders/blob/c8da0e7ece27d6a0007b53f54f546bf0ff1086d4/README.md
[prepare]: https://github.com/zarazhangrui/follow-builders/blob/c8da0e7ece27d6a0007b53f54f546bf0ff1086d4/scripts/prepare-digest.js
[generator]: https://github.com/zarazhangrui/follow-builders/blob/c8da0e7ece27d6a0007b53f54f546bf0ff1086d4/scripts/generate-feed.js
[skill]: https://github.com/zarazhangrui/follow-builders/blob/c8da0e7ece27d6a0007b53f54f546bf0ff1086d4/SKILL.md
[state]: https://github.com/zarazhangrui/follow-builders/blob/c8da0e7ece27d6a0007b53f54f546bf0ff1086d4/scripts/generate-feed.js#L60
[transcript]: https://github.com/zarazhangrui/follow-builders/blob/c8da0e7ece27d6a0007b53f54f546bf0ff1086d4/scripts/generate-feed.js#L330
[podcast]: https://github.com/zarazhangrui/follow-builders/blob/c8da0e7ece27d6a0007b53f54f546bf0ff1086d4/scripts/generate-feed.js#L380
[x]: https://github.com/zarazhangrui/follow-builders/blob/c8da0e7ece27d6a0007b53f54f546bf0ff1086d4/scripts/generate-feed.js#L547
[youtube]: https://github.com/zarazhangrui/follow-builders/blob/c8da0e7ece27d6a0007b53f54f546bf0ff1086d4/scripts/generate-feed.js#L301
[deliver]: https://github.com/zarazhangrui/follow-builders/blob/c8da0e7ece27d6a0007b53f54f546bf0ff1086d4/scripts/deliver.js
[blogprompt]: https://github.com/zarazhangrui/follow-builders/blob/c8da0e7ece27d6a0007b53f54f546bf0ff1086d4/prompts/summarize-blogs.md
[tweetprompt]: https://github.com/zarazhangrui/follow-builders/blob/c8da0e7ece27d6a0007b53f54f546bf0ff1086d4/prompts/summarize-tweets.md
