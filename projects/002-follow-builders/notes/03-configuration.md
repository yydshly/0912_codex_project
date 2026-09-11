# 新增来源、调整设置与完善系统

研究日期：2026-09-11；研究提交：`c8da0e7ece27d6a0007b53f54f546bf0ff1086d4`。本页前半部分解释上游现有配置，后半部分为待实施改进；本次没有修改上游或部署服务。

## 1. 先区分三种改动

| 想做的事 | 改哪里 | 是否需要维护采集端 |
| :--- | :--- | :--- |
| 中文、双语、篇幅、时间、渠道 | 用户 `~/.follow-builders/` 配置和 prompt；调度器配置 | 否 |
| 加一个同类 X 账号或播客 | 维护者的 `config/default-sources.json` | 是；已有采集器可能可以复用 |
| 加一个任意博客、新平台或自己的 feed | 来源配置＋采集适配器＋输出结构；客户端切换 feed 地址 | 是；通常需要代码改动 |

上游 Skill 明确将来源名单设为中心维护，普通用户只能建议作者增源。改自己安装目录中的名单，不会改变作者已经发布的公共 feed。[Skill 来源设置][skill]

## 2. 用户设置：可直接理解和复用的字段

完整中文示例见 [config.zh.stdout.json](../examples/config.zh.stdout.json)。这是演示配置，尚未写入任何真实用户目录。

| 字段 | 可用值 / 示例 | 影响与注意事项 |
| :--- | :--- | :--- |
| `platform` | `openclaw` / `other` | 表示宿主；不因改字段就获得该平台的后台运行能力 |
| `language` | `en` / `zh` / `bilingual` | 摘要语言；双语逐段交错 |
| `frequency` | `daily` / `weekly` | 发送偏好；准备脚本没有历史周聚合 |
| `timezone` | `Asia/Shanghai` | 调度器需使用同一时区 |
| `deliveryTime` | `16:00` | 示例选择下午，给中心 14:17 触发留出余量；不能保证 feed 此时已更新 |
| `weeklyDay` | `monday` 等七个小写英文星期 | 仅周模式有意义 |
| `delivery.method` | `stdout` / `telegram` / `email` | 输出位置；stdout 在普通助手中通常是手动获取 |
| `delivery.chatId` | 实际 Telegram chat ID 字符串 | Telegram 需要；不在仓库示例中填写真实目标 |
| `delivery.email` | 实际收件地址 | 邮件需要 |
| `onboardingComplete` | `true` / `false` | 首次设置完成标记 |

这些字段来自[上游配置 Schema][schema]。但脚本只是解析 JSON，没有调用 Schema 验证器；Schema 本身也没有严格约束所有条件。因此不能认为填写任何字符串时间或不完整渠道配置都能成功运行。

**改时间、频率或时区之后，还要修改实际调度任务。** 单改 JSON 不会让定时器重新排程。在 Windows 环境中，上游的 `crontab` 文档不能直接使用；需要另选可调用完整生成流程的调度方式，本次未安装任何调度任务。

## 3. 编辑规则：用本地覆盖保存个性化

| prompt 文件 | 控制什么 |
| :--- | :--- |
| `summarize-tweets.md` | 哪些动态值得保留，每位作者怎样写 |
| `summarize-podcast.md` | 长节目如何提炼观点、背景与经验 |
| `summarize-blogs.md` | 文章的发布、数字、实践影响 |
| `digest-intro.md` | 整体结构、排序、来源链接 |
| `translate.md` | 中文和双语表达 |

上游读取顺序是用户目录 `~/.follow-builders/prompts/` → GitHub 远程 → 随安装提供的本地文件。因此长期定制应放用户目录；只改安装目录的默认 prompt 可能仍被远程版本覆盖。[准备脚本][prepare]

本研究提供[面向开源项目研究的规则](../examples/summarize-tweets.research.md)。未来要采用时，以 `summarize-tweets.md` 命名放入上述用户 prompt 目录，再用同一批材料比较新旧输出，检查是否保留原文链接、是否把推测写成事实。

## 4. 新增 X 账号：复用现有采集器

以下是未来在自有 fork 中的操作步骤，不代表本次已经新增来源：

1. 找到目标账号的真实 handle，并记录为什么值得关注、希望覆盖什么主题。
2. 在中心 `config/default-sources.json` 的 `x_accounts` 数组新增 `name` 和 `handle`，保持 handle 唯一，不带 `@`。
3. 用具备相应访问权限的 `X_BEARER_TOKEN` 执行采集。仅启动 X 的上游命令是 `node generate-feed.js --tweets-only`（在其 `scripts/` 目录）。
4. 检查账号解析、最近内容、长帖正文、原文链接、错误及时间窗口。目标账号过去 24 小时没有新帖时，feed 中没有它属于可能的正常结果。
5. 确认中心生成的是自己的 feed，并让消费端读取自己的地址。

不是添加成功就必然获得当日内容：每人限量、时间窗口、429 限流和内容筛选都会影响最终输出。[X 采集实现][generator]

## 5. 新增播客：先验证 RSS 和转录覆盖

1. 获取节目真实 RSS 地址；观看入口单独填在 `url`。YouTube 频道 URL 不能直接替代播客 RSS。
2. 添加 `name`、`rssUrl`、`url`。先确认 RSS 含可解析的节目 GUID、日期和标题。
3. 检查 pod2txt 对该 RSS / GUID 的实际支持。`POD2TXT_API_KEY` 由采集端持有；仅配置凭证不保证外部服务支持所有节目。
4. 在上游 `scripts/` 中执行 `node generate-feed.js --podcasts-only`，确认转录非空、标题对应，观看链接指向正确节目。
5. 若目标节目被别的更新节目抢先选中，需在独立测试配置中只保留目标源验证；当前所有节目合计每批最多 1 集。

增加来源数量并不会增加每批节目容量；若要“每个节目至少一集”，需要改选择策略、转录成本预算与模型上下文处理。[播客采集实现][generator]

## 6. 新增博客 / 新平台：需要适配器

博客现有配置含 `name`、`type`、`indexUrl`、`articleBaseUrl`、`fetchMethod`，但真正的解析分支依赖域名判断。`type: scrape` 和 `fetchMethod: http` 不是通用插件机制。

新增博客至少需要：

1. **发现器**：从 RSS、站点 API 或索引网页提取标题、稳定文章 URL、发布日期。
2. **正文提取器**：提取正文及作者，剔除导航、广告和脚本；记录缺失日期、截断等状态。
3. **路由接入**：在 `fetchBlogContent` 中接入新的解析函数，不能只添加配置。
4. **标准输出**：保持 `source: blog`、`name`、`title`、`url`、`publishedAt`、`author`、`description`、`content` 结构。
5. **关键验证**：索引无新文、正文结构变化、相对链接、发布日期缺失、重复文章和单页失败。

GitHub Releases、论文、论坛等新类型还需要定义数据结构，扩展 feed、准备统计、摘要规则、Skill 的处理步骤与空内容判断、展示层。不能只改采集端而让下游看不到新字段。[博客采集实现][generator]

## 7. 自建 feed 的完整改动清单

| 层 | 需要同步的内容 |
| :--- | :--- |
| 来源 | 自有 fork 的 `default-sources.json` 和新平台解析器 |
| 凭证 | 自有采集环境中的 X / pod2txt 凭证；不放进 feed 或前端 |
| 调度 | 自有工作流时区、频率、运行结果；启用后先手动验证 |
| 发布 | 三个 feed 和状态文件的发布位置；扩展后考虑历史存储 |
| 消费 | `prepare-digest.js` 的 `FEED_X_URL`、`FEED_PODCASTS_URL`、`FEED_BLOGS_URL` |
| 规则 | 如果维护独立编辑规则，还需切换 `PROMPTS_BASE`；否则继续使用作者远程规则 |
| Skill | 增源政策、博客处理、新内容类型、错误提示与真实调度流程 |

上游这些地址硬编码在准备脚本中。**仅 fork、改来源名单，客户端仍可能读取原作者的数据。** 后续应将 endpoint 和 prompt 更新策略移入配置，并校验配置生效范围。[准备脚本][prepare]

## 8. 完善系统的具体改动

以下为建议，未在本子项目实现：

| 优先级 | 改动 | 完成的判断标准 |
| :--- | :--- | :--- |
| P0 | 三类内容统一空判断，明确执行博客摘要 | 只有博客更新时仍生成简报 |
| P0 | 让自动任务真正调用模型，验证后再发送 | 收到可读摘要，不是准备 JSON |
| P0 | 网络超时、异常捕获、缓存回退和明确失败状态 | 断网、HTTP 错误与无新内容可区分 |
| P0 | 历史存储和按时间范围查询 | 周报覆盖一周内内容，跨日不漏读 |
| P0 | 转录失败与成功分开记录；发送成功才写回执 | 临时失败能重试；成功消息不重复发送 |
| P1 | endpoint 配置化、来源开关、参数校验 | 修改来源和窗口后能观察到实际生效 |
| P1 | 用户阅读状态、偏好过滤、主题分类 | 相同内容不会反复推给同一用户 |
| P1 | URL 校验、引用上下文、摘要事实检查 | 错配节目和缺失引文能被标记 |

Windows 适配还应使用 Node 的 `fileURLToPath(import.meta.url)` 构造路径，而非直接使用 URL 的 `pathname`；本次核验采用虚拟 POSIX 路径，没有验证上游在 Windows 的完整兼容性。

[返回项目说明](../README.md) · [系统路线与价值](05-value-roadmap.md)

[skill]: https://github.com/zarazhangrui/follow-builders/blob/c8da0e7ece27d6a0007b53f54f546bf0ff1086d4/SKILL.md
[schema]: https://github.com/zarazhangrui/follow-builders/blob/c8da0e7ece27d6a0007b53f54f546bf0ff1086d4/config/config-schema.json
[prepare]: https://github.com/zarazhangrui/follow-builders/blob/c8da0e7ece27d6a0007b53f54f546bf0ff1086d4/scripts/prepare-digest.js
[generator]: https://github.com/zarazhangrui/follow-builders/blob/c8da0e7ece27d6a0007b53f54f546bf0ff1086d4/scripts/generate-feed.js
