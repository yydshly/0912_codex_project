# 完整来源与获取方式

研究日期：2026-09-11；研究提交：`c8da0e7ece27d6a0007b53f54f546bf0ff1086d4`。

![来源与解析路径：X 通过账号标识获取动态，播客通过 RSS 和转录服务取得文本，博客通过栏目地址发现和解析文章](../assets/source-map.png)

[打开可点击来源的 SVG 图](../assets/source-map.svg)。下文列出账号、RSS 与栏目入口的详细信息。

## 1. 两层来源要分清

**内容的原始来源**是 X 账号、节目和博客；**普通客户端直接读取的来源**是作者发布在 GitHub Raw 的三个 JSON feed。客户端不逐一请求这 34 个原始来源。

本页名单与入口来自[固定版本的 default-sources.json][config]；已验证它们存在于配置，未逐一验证账号现状、节目服务可用性或内容质量。人物职位容易变化，因此不附猜测的现任职位。本研究重整的机器可读目录见 [source-catalog.json](../data/source-catalog.json)。

## 2. X：26 个账号

以下所有账号走相同的 X API v2 流程，`handle` 不带 `@` 写入配置。

| 序号 | 配置名称 | 账号 / 原始入口 |
| :--- | :--- | :--- |
| 1 | Andrej Karpathy | [karpathy](https://x.com/karpathy) |
| 2 | Swyx | [swyx](https://x.com/swyx) |
| 3 | Josh Woodward | [joshwoodward](https://x.com/joshwoodward) |
| 4 | Boris Cherny | [bcherny](https://x.com/bcherny) |
| 5 | Thibault Sottiaux | [thsottiaux](https://x.com/thsottiaux) |
| 6 | Peter Yang | [petergyang](https://x.com/petergyang) |
| 7 | Nan Yu | [thenanyu](https://x.com/thenanyu) |
| 8 | Madhu Guru | [realmadhuguru](https://x.com/realmadhuguru) |
| 9 | Amanda Askell | [AmandaAskell](https://x.com/AmandaAskell) |
| 10 | Cat Wu | [_catwu](https://x.com/_catwu) |
| 11 | Thariq | [trq212](https://x.com/trq212) |
| 12 | Google Labs | [GoogleLabs](https://x.com/GoogleLabs) |
| 13 | Amjad Masad | [amasad](https://x.com/amasad) |
| 14 | Guillermo Rauch | [rauchg](https://x.com/rauchg) |
| 15 | Alex Albert | [alexalbert__](https://x.com/alexalbert__) |
| 16 | Aaron Levie | [levie](https://x.com/levie) |
| 17 | Ryo Lu | [ryolu_](https://x.com/ryolu_) |
| 18 | Garry Tan | [garrytan](https://x.com/garrytan) |
| 19 | Matt Turck | [mattturck](https://x.com/mattturck) |
| 20 | Zara Zhang | [zarazhangrui](https://x.com/zarazhangrui) |
| 21 | Nikunj Kothari | [nikunj](https://x.com/nikunj) |
| 22 | Peter Steinberger | [steipete](https://x.com/steipete) |
| 23 | Dan Shipper | [danshipper](https://x.com/danshipper) |
| 24 | Aditya Agarwal | [adityaag](https://x.com/adityaag) |
| 25 | Sam Altman | [sama](https://x.com/sama) |
| 26 | Claude | [claudeai](https://x.com/claudeai) |

获取步骤（[fetchXContent 源码][x-code]）：

1. 用 `X_BEARER_TOKEN` 认证，每批最多 5 个 handle 请求 `GET /2/users/by`，取得账号 ID、姓名和简介。
2. 对每个账号请求 `GET /2/users/{id}/tweets`，回看 24 小时；请求最近最多 5 条，排除 retweets 和 replies。
3. 按 tweet ID 排除中心状态中已见条目，每人最多留 3 条；长帖优先使用 `note_tweet.text`。
4. 保留时间、链接、点赞/转发/回复数、引用帖标记和 ID。互动数被保存，但没有据此实现完整内容排序算法。
5. 部分服务端错误会重试；拉动态时遇到 429 会停止剩余账号的获取。

局限：没有分页补全活跃账号当天全部内容；没有完整线程恢复、引用正文抓取或图片识别。配置顺序可能影响限流时哪些账号被跳过。文字筛选主要发生在后续模型环节。

## 3. 播客：6 个节目

| 节目 | RSS / 发现入口 | 配置的观看入口 |
| :--- | :--- | :--- |
| Latent Space | [经 pod2txt 代理的 Substack RSS](https://pod2txt.vercel.app/api/feed?url=https://api.substack.com/feed/podcast/1084089.rss) | [YouTube 频道](https://www.youtube.com/@LatentSpacePod) |
| Training Data | [Megaphone RSS](https://feeds.megaphone.fm/trainingdata) | [YouTube 播放列表](https://www.youtube.com/playlist?list=PLOhHNjZItNnMm5tdW61JpnyxeYH5NDDx8) |
| No Priors | [Megaphone RSS](https://feeds.megaphone.fm/nopriors) | [YouTube 频道](https://www.youtube.com/@NoPriorsPodcast) |
| Unsupervised Learning | [Simplecast RSS](https://feeds.simplecast.com/dOSE_bdP) | [YouTube 频道](https://www.youtube.com/@RedpointAI) |
| The MAD Podcast with Matt Turck | [Anchor RSS](https://anchor.fm/s/f2ee4948/podcast/rss) | [YouTube 视频页](https://www.youtube.com/@DataDrivenNYC/videos) |
| AI & I by Every | [Anchor RSS](https://anchor.fm/s/ed1f5584/podcast/rss) | [YouTube 播放列表](https://www.youtube.com/playlist?list=PLuMcoKK9mKgHtW_o9h5sGO2vXrffKHwJL) |

获取步骤（[fetchPodcastContent][podcast-code]、[转录调用][transcript-code]）：

1. 请求各节目 RSS，用正则解析 `item` 的标题、GUID、日期和链接，每个源只检查最近 3 集。
2. 排除中心状态中已见节目，再按 14 天回看窗口过滤（没有日期的也可进入），按新到旧排序。
3. 向 `https://pod2txt.vercel.app/api/transcript` 发送 `feedurl`、`guid`、`apikey`；遇到 `processing` 最多请求 5 次，间隔 30 秒。
4. `ready` 时请求返回的文本 URL。得到首个有效转录后即返回，因此所有节目合计每批最多 1 集。
5. 另外请求 YouTube Atom feed，失败时尝试解析视频页，将节目标题与视频标题做包含/词重合匹配；失败则退回配置的频道或列表入口。

这里的音频转录由外部 pod2txt 服务完成，仓库没有转录模型代码。README 提到的 Supadata 不是该提交的实际实现。YouTube 标题匹配阈值不等于正确率，退回频道也不能满足提示词“必须链接到具体视频”的要求。[YouTube 匹配源码][youtube-code]

转录失败也会被记为已见；状态 7 天后清理。该行为可能导致短期漏重试、稍后又重新收录，需要完善状态模型。

## 4. 博客：2 个站点

| 来源 | 发现方式 | 正文获取 |
| :--- | :--- | :--- |
| [Anthropic Engineering](https://www.anthropic.com/engineering) | 尝试解析 `__NEXT_DATA__`，失败后用 HTML 链接规则提取 | 尝试文章结构化数据，失败后去除脚本、样式和 HTML 标签 |
| [Claude Blog](https://claude.com/blog) | 用站点专用规则匹配博客链接 | JSON-LD 获取元数据，富文本容器提取正文，失败后退回整页去标签 |

共同规则：只扫描索引最前面的最多 3 项，按文章 URL 去重；已知日期按 72 小时窗口筛选，无日期则允许进入。每个博客每批最多 3 篇。正文与标题、作者、日期、链接一起进入 `feed-blogs.json`。[博客处理源码][blog-code]

网页结构变化、发布日期缺失、导航文本混入，都可能影响结果。这是两个站点专用的适配器，不能只在配置里增加任意博客 URL 就获得同样能力。

## 5. 客户端读到的数据

| 数据 | 客户端运行时地址 | 固定版本核对结果 |
| :--- | :--- | :--- |
| X | [feed-x.json](https://raw.githubusercontent.com/zarazhangrui/follow-builders/main/feed-x.json) | 14 位作者、28 条动态 |
| 播客 | [feed-podcasts.json](https://raw.githubusercontent.com/zarazhangrui/follow-builders/main/feed-podcasts.json) | 0 集 |
| 博客 | [feed-blogs.json](https://raw.githubusercontent.com/zarazhangrui/follow-builders/main/feed-blogs.json) | 0 篇 |

运行时地址会变化；本次数据时间和 SHA-256 留存在[核验数据](../data/verification.json)。中心工作流配置每天 **06:17 UTC / 14:17 北京时间** 触发，不能保证秒级准时；客户端发简报的时间是另一套配置。[工作流][workflow]

名单的价值在于提供起点，不能把“被列入名单”理解为“每条内容都可靠”。我们应继续记录来源的一手性、具体性、主题覆盖和实际采集成功率，见[价值与路线](05-value-roadmap.md)。

[返回项目说明](../README.md)

[config]: https://github.com/zarazhangrui/follow-builders/blob/c8da0e7ece27d6a0007b53f54f546bf0ff1086d4/config/default-sources.json
[x-code]: https://github.com/zarazhangrui/follow-builders/blob/c8da0e7ece27d6a0007b53f54f546bf0ff1086d4/scripts/generate-feed.js#L547
[podcast-code]: https://github.com/zarazhangrui/follow-builders/blob/c8da0e7ece27d6a0007b53f54f546bf0ff1086d4/scripts/generate-feed.js#L380
[transcript-code]: https://github.com/zarazhangrui/follow-builders/blob/c8da0e7ece27d6a0007b53f54f546bf0ff1086d4/scripts/generate-feed.js#L330
[youtube-code]: https://github.com/zarazhangrui/follow-builders/blob/c8da0e7ece27d6a0007b53f54f546bf0ff1086d4/scripts/generate-feed.js#L301
[blog-code]: https://github.com/zarazhangrui/follow-builders/blob/c8da0e7ece27d6a0007b53f54f546bf0ff1086d4/scripts/generate-feed.js#L890
[workflow]: https://github.com/zarazhangrui/follow-builders/blob/c8da0e7ece27d6a0007b53f54f546bf0ff1086d4/.github/workflows/generate-feed.yml
