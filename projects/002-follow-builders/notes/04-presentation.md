# 展示与分发：从一段简报到研究卡片

研究日期：2026-09-11；研究提交：`c8da0e7ece27d6a0007b53f54f546bf0ff1086d4`。

## 1. 上游已经提供什么展示

当前核心产物是文字简报，没有独立网站。总装提示词安排为 X → 官方博客 → 播客，每条附来源，双语时逐段交错。这个结构适合手机快速浏览，但缺少历史搜索、主题聚类和阅读管理。[总装提示词][intro]、[翻译规则][translate]

| 展示 / 分发方式 | 当前实现 | 可见效果与限制 |
| :--- | :--- | :--- |
| 聊天 / 终端 | `stdout`，或宿主直接输出 | 最少配置；普通非持久助手不因此获得自动推送能力 |
| Telegram | Bot API，长内容分段，Markdown 失败时尝试纯文本 | 可推送手机；分段可能打断阅读，需改进发送回执 |
| 邮件 | Resend API 发送纯文本 | 便于归档；发件地址在代码中固定，真实送达未验证 |
| 其他聊天渠道 | 宿主平台消息系统 | 依赖宿主已有配置，不是 `deliver.js` 原生支持 |

依据：[发送实现][deliver]、[宿主和调度约定][skill]。

上游 `examples/sample-digest.md` 含 `example123` 等占位链接，只能说明格式，不能作为真实运行截图或效果证据。[上游示例][sample]

## 2. 本子项目怎样展示

本次以 Markdown 和原创流程图完成研究展示，所有内容都能在仓库中直接阅读：

- [总览](../README.md)：一张架构图、五个问题入口、已验证结果。
- [来源目录](02-sources.md)：逐项列出 34 个来源和抓取方式，方便查找和复用。
- [简报样例](../examples/research-digest.md)：对固定 feed 中一条记录做中文重述，明确来源和证据状态。
- [核验报告](06-verification.md)：将真实快照、隔离实验、源码判断和建议分开。

本次不将空的博客或播客 feed 填充为“今日内容”，也不把上游占位示例冒充运行结果。`web/` 只保存后续展示计划，尚无在线网站。

## 3. 可扩展的阅读界面（方案，未实现）

### 首页：先让读者知道今天有什么

顶部显示简报日期、内容窗口、各来源最近成功采集时间、失败渠道；主题筛选下展示研究卡片。统计数量应区分“配置源”“成功采集源”“有新内容源”“最终采用条目”。如果数据过旧，应展示最后成功时间，不能仅用页面打开时间标成“刚更新”。

### 卡片：一句结论之后能查证

| 卡片字段 | 读者要解决的问题 | 当前数据能否支持 |
| :--- | :--- | :--- |
| 标题、来源类型、作者、发布时间 | 这是谁什么时候说的？ | 大部分 feed 有；缺失时间要标记 |
| 核心内容 | 发生了什么？ | 由模型生成摘要 |
| 对研究的意义 | 为什么与我有关？ | 新增推理字段，必须标为研究判断 |
| 原文链接 | 怎么核实？ | 有 URL，但不一定指向正确播客单集 |
| 证据状态 | 是观点、声明还是实测结果？ | 需新增结构化标记与核验流程 |
| 关联项目 / 版本 | 能否进入仓库研究？ | 需提取并确认仓库，固定版本 |
| 收藏、已读、待研究 | 后续怎么行动？ | 需新增用户状态存储 |

### 详情页：把摘要和证据对应起来

展示原文位置、摘要依据、时间信息和关联事件。播客若有时间戳，可点击跳转到具体片段；没有时间戳则不生成伪造定位。原文展示需尊重来源使用条件，默认提供必要摘录和原文链接，不直接公开镜像全文。

### 专题页：串起同一问题

例如“Agent 工具调用可靠性”专题可以关联不同日期的讨论、官方工程文章和本仓库复现实验。先按明确项目 URL / 事件标识合并，再考虑语义相似度；不要因词相似就把不同发布当成同一事件。

## 4. 研究卡片的建议数据模型

以下是我们拟议的新模型，上游目前不能直接输出完整对象：

```text
content_id / source_id / source_type
canonical_url / published_at / fetched_at
title / author / source_text_hash
summary / research_implication
evidence_status / context_missing / citation_spans
topics / related_repository / related_commit
generation_model / prompt_version / generated_at
```

用户状态另外存储 `user_id + content_id + read/saved`；发送状态另外存储 `digest_id + channel + recipient + status`。不能将中心 `seen` 状态代替所有用户的阅读与发送记录。

## 5. 推送与推广分别完善

推送是把内容交给已有读者。需要频率、时区、静默时段、失败重试、退订和回执。周报应从历史库取一周的内容，再聚合并生成摘要。

推广是让新读者发现内容。可增加公开精选页、带出处的分享卡片、可订阅 RSS 和主题页面；这需要稳定历史数据与编辑审核。目前仓库没有用户增长、传播统计或商业转化模块。

## 6. 展示验收建议

后续实现界面时至少验证：小屏阅读；键盘操作；来源链接可辨认；空内容与失败有不同提示；按日切换不串数据；未读状态正确；摘要来源可回溯；原文缺失时不编造；同一事件合并后各原始出处仍保留。

[返回项目说明](../README.md) · [展示样例](../examples/research-digest.md)

[intro]: https://github.com/zarazhangrui/follow-builders/blob/c8da0e7ece27d6a0007b53f54f546bf0ff1086d4/prompts/digest-intro.md
[translate]: https://github.com/zarazhangrui/follow-builders/blob/c8da0e7ece27d6a0007b53f54f546bf0ff1086d4/prompts/translate.md
[deliver]: https://github.com/zarazhangrui/follow-builders/blob/c8da0e7ece27d6a0007b53f54f546bf0ff1086d4/scripts/deliver.js
[skill]: https://github.com/zarazhangrui/follow-builders/blob/c8da0e7ece27d6a0007b53f54f546bf0ff1086d4/SKILL.md
[sample]: https://github.com/zarazhangrui/follow-builders/blob/c8da0e7ece27d6a0007b53f54f546bf0ff1086d4/examples/sample-digest.md
