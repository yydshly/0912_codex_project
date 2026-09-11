# 输入、处理与输出

研究日期：2026-09-11；版本：v3.24.0 / `ca9d415e66073b17702f385d6886934097aec0e7`。流程为源码确认，样例为离线实测，真实多平台效果待联网验证。

## 1. 输入分成三个层级

| 层级 | 输入内容 | 谁提供 |
| :--- | :--- | :--- |
| 用户任务 | 主题、人物、公司、产品、对比问题，或无具体主题的热点发现要求 | 用户 / 调度任务 |
| 研究参数 | 时间窗口、深度、指定来源、账号 / 社区 / 仓库、输出格式、本地资料目录 | 用户显式指定或宿主 AI 解析 |
| 执行计划 | 意图、子查询、检索词、排序问题、来源列表和权重 | 宿主 AI；无人值守路径可用内部规划器 / 确定性回退 |

输入不只是一个关键词。最简单可以是一个产品名，更好的输入包含「研究谁 + 想知道什么 + 多长时间 + 需要什么成果」。

例如：`研究某个开源数据库最近 30 天的维护变化和用户遇到的问题，重点看 GitHub、HN 和 Reddit，用中文给出证据链接。` 这是用法示意，尚未执行该联网任务。

常用参数：`--days` 指定窗口；`--as-of` 指定截止日期；`--quick` / `--deep` 控制深度；`--search` 限制来源；`--plan` 读取计划文件；`--github-repo` / `--github-user` 限定对象；`--corpus` 加入本地目录；`--emit` 选择输出。以固定版本的 [命令入口](https://github.com/mvanhorn/last30days-skill/blob/ca9d415e66073b17702f385d6886934097aec0e7/skills/last30days/scripts/last30days.py) 为准。

## 2. 计划中各字段意味着什么

| 字段 | 用途 |
| :--- | :--- |
| `raw_topic` | 原始研究对象 / 主题 |
| `intent` | 产品、观点、比较、突发消息、概念等意图 |
| `freshness_mode` | 新近信息优先程度 |
| `cluster_mode` | 是否按事件 / 讨论聚类 |
| `subqueries[].search_query` | 发给搜索源的检索表达 |
| `subqueries[].ranking_query` | 用于判断结果是否回答研究问题 |
| `subqueries[].sources` | 该子查询使用哪些平台 |
| `subqueries[].weight` | 子查询在融合排名中的相对权重 |
| `source_weights` | 来源权重 |

「找得到」和「是否有用」被拆成检索词与排序问题两个字段。例如查询词可以短到项目名称，排序问题则明确要求近期故障、迁移或工作流。完整真实回放计划见 [fixture-query-plan.json](samples/fixture-query-plan.json)。结构依据：[schema.py](https://github.com/mvanhorn/last30days-skill/blob/ca9d415e66073b17702f385d6886934097aec0e7/skills/last30days/scripts/lib/schema.py)。

### 平台选择不是只由模型自由判断

选择链路实际是：**代码已接入的平台 → 当前配置允许且可用的平台 → 用户范围与任务规则 → 模型生成的子查询计划 → 程序校验和预算限制**。

1. **已接入平台是有限清单。** 开发者提前编写各来源适配器；模型不需要也不会在一次普通研究中临时发明新平台接口。
2. **运行时判断可用性。** `pipeline.available_sources()` 根据依赖、密钥、登录路径、显式开关及主题条件形成来源列表。可用列表不是所有来源实时请求都已成功的证明。
3. **作者提供搜索经验。** 上游 Skill 指令写明教程优先 YouTube / Reddit、产品研究考虑评测 / 讨论 / 演示、预测加入 Polymarket；规划代码还有 `SOURCE_PRIORITY`、`SOURCE_CAPABILITIES` 和意图排除规则。内置 `categories.py` 提供领域对应的社区名单。
4. **模型结合问题生成计划。** 通常由宿主 AI 先查当前账号、社区和新闻背景，再为每个子查询指定 `search_query`、`ranking_query` 和 `sources`。内部模型规划器的提示词也明确提供主题、深度、可用来源和用户指定来源，要求从可用列表中选择。
5. **程序做最终约束。** 不可用或超出用户来源范围的计划项会被过滤。快速模式会缩减子查询和来源；来源请求另有预算上限。

还应纠正「模型只挑最相关的一两个平台」这一印象：

- Skill 要求主查询覆盖可用且适用的主要来源，次级查询可以更专门。
- 显式 `--plan` 的逐子查询来源会被尊重，不会任意扩充；但仍受可用性与快速模式裁剪约束。
- **内部规划器**的非 quick 路径会按能力规则扩展来源，许多意图会覆盖所有合格来源，再让融合与排序决定信息价值。不能将内部规划器扩展行为误写成所有外部计划也会扩展。
- 没有可用规划模型时，程序可以按关键词识别意图、固定来源优先级和查询模板回退；模型规划并非唯一执行路径。

依据：[规划提示词、优先级与计划校验](https://github.com/mvanhorn/last30days-skill/blob/ca9d415e66073b17702f385d6886934097aec0e7/skills/last30days/scripts/lib/planner.py)、[可用来源与请求调度](https://github.com/mvanhorn/last30days-skill/blob/ca9d415e66073b17702f385d6886934097aec0e7/skills/last30days/scripts/lib/pipeline.py)、[Skill Step 0.75](https://github.com/mvanhorn/last30days-skill/blob/ca9d415e66073b17702f385d6886934097aec0e7/skills/last30days/SKILL.md)。

### “如何搜索”由模型与适配器分工

| 决策 | 主要负责方 | 示例 |
| :--- | :--- | :--- |
| 想获得什么证据 | 模型 + 研究规则 | 部署问题看工程讨论，使用教程看视频与指南 |
| 使用哪些词、账号、社区 | 模型 + 预检索 + 内置分类 | 项目名、具体报错、对应仓库、作者账号、相关 subreddit |
| 如何发出合法请求 | 已编写的平台适配器 | Reddit RSS / 页面，GitHub REST，HN Algolia，YouTube yt-dlp |
| 时间、分页、抓多少、失败怎么办 | 适配器和主流程 | 日期参数、平台查询编译、数量上限、超时与后端回退 |
| 搜索后还读哪些详情 | 来源补充逻辑 | 用返回的帖子 ID / URL 抓评论，用视频 ID 抓字幕 |

因此不存在「大模型每次现场研究 Reddit 接口怎么调用」这一步。程序已知道请求形式；模型主要提供对象、关键词和研究角度。账号 / 社区可以先通过普通网页搜索发现，再将已解析的目标传给平台专用搜索。X 查询操作符等由引擎编译，Skill 要求模型不要自行猜造。

关键词通常保持简短，时间窗口独立传递。排序问题则可以完整写明「这些信息是否回答了用户最近遇到的部署问题」。搜索词生成并不保证最优，仍可能因别名、语言、同名实体、平台索引和来源缺失而漏掉内容。

## 3. 如何处理

| 步骤 | 具体处理 | 为什么需要 |
| :--- | :--- | :--- |
| 对象识别与规划 | 区分产品名、同名人物、账号、社区和意图；生成子查询 | 减少同名、别名和过宽检索造成的跑题 |
| 来源选择与并发检索 | 根据依赖、配置、指定来源及主题路由，调用适配器 | 各平台接口、身份认证、返回字段不同 |
| 内容补充 | 对部分结果再抓热门评论、字幕片段、文章或活动详情 | 标题和互动总数不足以说明具体观点 |
| 规范化 | 转成统一的 `SourceItem` | 让网页、帖子、视频等进入同一处理流程 |
| 时间与相关性 | 解析日期及可信度，实施窗口限制、标记或降权，处理对象不匹配 | 防止旧内容和热门跑题内容主导结果 |
| 去重与融合 | 规范化 URL；合并同条内容较丰富的正文 / 评论；用加权 RRF 融合排名 | 同一帖子会出现在多个子查询中 |
| 重新排序 | 结合模型 / 本地相关性、新鲜度、来源质量、互动量等 | 优先留下与问题有关的证据 |
| 聚类与代表选择 | 根据意图使用文本相似度、实体重合及多样性选择 | 把相关事件放在一起并减少重复 |
| 证据输出与综合 | Python 生成报告；宿主 AI 阅读证据、引用来源、写成简报 | 证据处理和解释写作承担不同职责 |

核心实现：[pipeline.py](https://github.com/mvanhorn/last30days-skill/blob/ca9d415e66073b17702f385d6886934097aec0e7/skills/last30days/scripts/lib/pipeline.py)、[fusion.py](https://github.com/mvanhorn/last30days-skill/blob/ca9d415e66073b17702f385d6886934097aec0e7/skills/last30days/scripts/lib/fusion.py)、[rerank.py](https://github.com/mvanhorn/last30days-skill/blob/ca9d415e66073b17702f385d6886934097aec0e7/skills/last30days/scripts/lib/rerank.py)、[cluster.py](https://github.com/mvanhorn/last30days-skill/blob/ca9d415e66073b17702f385d6886934097aec0e7/skills/last30days/scripts/lib/cluster.py)。

### 排名不是简单相加点赞数

加权 RRF 对候选证据累加 `子查询权重 × 来源权重 / (60 + 在该结果流中的排名)`。它比较排名位置，避免直接把不同平台原始分数混用。

最终基础分为 `0.60 × 重排分 + 0.20 × 归一化融合分 + 0.10 × 新鲜度 + 0.05 × 来源质量分 + 0.05 × 互动分`，其后还有低相关性、对象错配、过期等修正。互动数据也参与结果流排序、候选保留等阶段，不能据此说互动量对整个流程只影响 5%。这些分数是排序信号，不是事实正确的概率。

### 中间数据是什么

`SourceItem` 存储 `source`、`title`、`body`、`url`、`author`、`container`、`published_at`、`date_confidence`、`engagement`、`snippet`、`metadata` 等。

- `engagement.comments` / `num_comments` 通常是评论数量。
- `metadata.top_comments` 才可能包含评论正文、作者、分数及链接。
- `metadata.transcript_snippet` / `transcript_highlights` 存储字幕文字或抽取片段。
- 字段是否出现取决于来源和成功采集的内容；计数存在不能推出全文存在。

## 4. 输出给谁，输出什么

| 输出对象 | 形态 | 内容与限制 |
| :--- | :--- | :--- |
| 宿主 AI | `compact` / `context` 等证据文本 | 排名证据、来源、统计、评论或字幕片段及覆盖提示 |
| 人 | AI 写出的简报、比较报告、热点列表 | 概括主要变化、讨论、分歧和来源；质量还取决于宿主模型 |
| 程序 | `--emit=json`，默认 Agent profile | 当前契约 `1.3`，包含 `query`、`generated_at`、`window_days`、`source_status`、`freshness_verdicts`、`clusters`、`results` |
| 调试 / 深入研究 | `--json-profile=raw` | 完整内部报告，字段不承诺稳定；可能保留更丰富的评论 / 字幕和本地资料 |
| 文件阅读 / 分享 | Markdown、HTML、brief | 格式化证据；HTML 可嵌入通过 `--synthesis-file` 提供的 AI 正文 |
| 连续研究 | SQLite、缓存、原始研究文件、研究库 | 需要相应参数 / 配置；裸引擎文件保存和 Skill 默认保存行为不同 |

**若要下游使用完整评论 / 字幕，不要只看 Agent JSON。** 当前稳定 `results` 字段偏向链接、摘要、互动数、相关性分和聚类索引，没有独立完整评论树 / 字幕字段。应结合原始研究文本或 raw profile，并自行建立稳定提取层。Agent JSON 的 `summary` 是规范化片段，不承诺是模型生成的最终结论。

依据：[JSON 导出契约](https://github.com/mvanhorn/last30days-skill/blob/ca9d415e66073b17702f385d6886934097aec0e7/docs/reference/json-export.md)、[渲染实现](https://github.com/mvanhorn/last30days-skill/blob/ca9d415e66073b17702f385d6886934097aec0e7/skills/last30days/scripts/lib/render.py)。

## 5. 可直接查看的实际样例

本次离线回放主题为上游测试对象 `Nimbus Agent workflows?`，日期窗口为 2026-06-10 至 2026-07-10，使用测试 Web 与 HN 来源。

得到两个结果：一个 Web 片段、一个 HN 条目；Agent JSON 的两个分数分别为 `0.4293`、`0.3255`。HN 的 `points: 80`、`comments: 25` 是测试计数，**不表示输出中抓到了 25 条评论正文**。输出还提示本主题证据薄弱。

先看 [输入计划](samples/fixture-query-plan.json)，再看 [程序证据文本](samples/fixture-engine-output.txt) 和 [程序 JSON](samples/fixture-agent-output.json)。链接是样例地址，日期由测试固定，不能作为实际互联网信息。本次没有追加模型综合，以保持程序输出与 AI 写作的区别。

[返回项目](../README.md)
