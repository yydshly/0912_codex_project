# 信息源、获取方式、评论与字幕

研究日期：2026-09-11；版本：v3.24.0 / `ca9d415e66073b17702f385d6886934097aec0e7`。**本页最重要：信息源名字只说明去哪找，适配器调用链才说明真正拿到了什么。**

所有来源的当前实时可用性、账号权限、接口费用和完整度均待联网验证。下文为固定版本源码和配置核对，不是本机已启用来源清单。文中的源服务地址用于说明实现，不是虚构演示地址。

## 1. 先区分四类数据

| 数据层级 | 内容 | 可以回答什么 | 不能直接推出什么 |
| :--- | :--- | :--- | :--- |
| 搜索与元数据 | 标题、链接、作者、日期、视频 / 帖子 ID | 有哪些相关内容 | 内容全文和观点细节 |
| 正文与片段 | 帖子正文、网页摘要、文章片段 | 作者主要说什么 | 一定抓到了全文或原始上下文 |
| 评论正文 | 若干评论文本、作者、链接和可用互动指标 | 用户具体赞同、反对或遇到什么 | 已抓全评论、全部嵌套回复或代表全体用户 |
| 字幕 / 转录 | 视频语言文字、字幕片段和 highlights | 视频中说了什么 | 看懂画面、图表、动作，或覆盖任意无字幕视频 |

点赞、浏览、回复、收藏数量属于**互动指标**。`comments: 1000` 与「存储了 1000 条评论正文」没有等价关系。

## 2. 核心来源矩阵

| 来源 | 实际获取方式 | 采集内容 | 评论正文 / 字幕 | 条件与边界 | 源码 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Reddit | 搜索 RSS、shreddit 社区列表 / 帖子页面；Arctic Shift 补帖子和分数；可用 ScrapeCreators 备援 | 标题、正文片段、subreddit、作者、日期、投票、评论数 | 有：对选定帖子抓评论正文、作者、分数、链接 | 免费路径免密钥；页面可能被限流；归档分数可能滞后；不抓全站评论 | [keyless][reddit] / [Arctic Shift][arctic] |
| X / Twitter | 普通宿主默认 Bird 登录会话 → xAI → xurl OAuth CLI → Xquik；可显式固定其他后端；宿主连接器也可提供结果文件 | 推文文本、作者、时间、点赞 / 转发 / 回复 / 引用指标；本人发言与关于此人的讨论 | 能有检索到的回复帖子；不能据回复数认定抓取完整对话树 | 后端需相应登录 / 密钥；官方 X API 完整历史取决于权限，recent 回退可能只有约 7 天 | [路由][pipeline] / [官方 API][xapi] |
| YouTube | yt-dlp 搜索与元数据；人工 / 自动字幕轨道；条件性直接 HTTP 或 ScrapeCreators 备援 | 标题、频道、日期、观看 / 点赞 / 评论数、字幕文本与精选句 | 有字幕；有选定视频的少量热门评论正文 | yt-dlp 或第三方密钥；语言、字幕关闭、限流影响覆盖；不是逐帧看视频 | [youtube_yt.py][youtube] |
| TikTok | ScrapeCreators 搜索、内容 / 转录接口、评论接口 | 描述、创作者、时间、浏览 / 点赞 / 评论 / 分享量、转录片段 | 有转录；满足开关和凭据条件时抓少量热门评论 | 第三方密钥与来源配置；按深度限量和截断；不等于抖音覆盖 | [tiktok.py][tiktok] |
| Instagram Reels | ScrapeCreators 关键词 / 创作者搜索、`/v2/instagram/media/transcript`、`/v2/instagram/post/comments` | Reels 描述、作者、日期、互动数、转录文本 | 有转录；选定帖子的热门评论正文 | 第三方密钥与开关；转录可超时；不是通用 Instagram 全内容归档 | [instagram.py][instagram] |
| Hacker News | `hn.algolia.com/api/v1/search`、`search_by_date`、`items/{id}` | 故事 / 讨论条目、链接、分数、评论数、时间 | 有：对选定条目取得并整理评论文本 | 无需密钥；正文指讨论内容，外链文章未必完整抓取；不保证有单条评论票数 | [hackernews.py][hn] |
| GitHub | GitHub REST Search / 对象接口；可使用 token 或 `gh auth token`；匿名 REST 也支持 | Issues、PR、评论；按项目 / 人物模式补仓库活动、发布及相关指标 | 有：选定 Issue / PR 的评论文本 | 匿名额度更低；不是 clone 源码并理解实现；某些模式依赖更细对象信息 | [github.py][github] |
| 普通网页 | 宿主原生搜索；引擎 Brave / Exa / Serper / Parallel；显式 Parallel MCP；无密钥兜底 DuckDuckGo / SearXNG + Jina Reader | 标题、URL、搜索摘要或抓取的网页文字 | 没有通用网页评论抓取承诺；不是通用字幕来源 | 搜索结果与正文读取是两步；登录墙、付费墙和缺日期影响材料 | [grounding.py][web] / [无密钥正文读取][webfetch] |
| Polymarket | Gamma 公开只读 API，`/public-search`、`/events` | 市场 / 事件标题、选项价格 / 概率信号、交易量、截止日期等 | 不是评论或字幕来源 | 无需密钥；市场价格不是事实正确率，也不必然是本窗口新发生的事件 | [polymarket.py][polymarket] |

### Reddit 的实际取数顺序

1. 主题专属 subreddit 用 `top / hot / new` 等列表寻找相关帖子；宽泛主题同时走 RSS 检索。
2. shreddit 列表提供可用分数；Arctic Shift 的 `/api/posts/search`、`/api/posts/ids` 补回帖子、投票和评论数。
3. 针对筛选后的帖子访问 shreddit 页面提取评论。当前 quick / default / deep 每个子查询的评论补充预算为 **4 / 8 / 12 个帖子**，不是这个数量的全部评论树。
4. 免费路径为空时可落到配置好的 ScrapeCreators；也有显式后端选择和薄结果补齐参数。

源码明确把无密钥 `search.json` 失效作为改用 RSS / 页面路径的原因；这描述的是作者代码中的处理策略，不是本研究对今日 Reddit 所有网络环境的探测结论。Arctic Shift 分数是归档快照，其补充检索偏向近期排序，不能完整替代 `hot / top` 原生列表语义。[来源：Reddit 免费路径][reddit]、[分数补充][arctic]。

### YouTube 的字幕与评论链路

1. 先通过 yt-dlp 搜索视频并读取元数据；失败且有第三方密钥时可使用 ScrapeCreators 搜索。
2. 对较优视频尝试读取字幕，清洗 VTT 的时间标记与重复文本；字幕抓取目标随深度变化，排序后还可能补抓进入最终列表的视频。
3. 可保留字幕文本并抽取与主题有关的句子；当前文本有最多 **5000 词**的保留上限。不是每个视频都成功，也不是无限长度保存。
4. 默认字幕语言优先级为 `en,es,pt`，可通过 `LAST30DAYS_YT_SUB_LANGS` 调整；中文任务应专门验证语言配置，不能因模型能用中文回答就认定抓到了中文字幕。
5. 热门评论补充函数默认最多 **3 个视频、每个 5 条评论**。当前代码先用 yt-dlp，失败时在有合适配置的条件下转第三方；成功返回零评论不应该被当作失败而反复付费重试。

函数的一些旧注释仍写成只用 ScrapeCreators，具体判断以 `_fetch_video_comments`、`_ytdlp_comments_result` 等实际调用为准。[来源：YouTube 实现][youtube]。

### TikTok / Instagram 的“视频理解”到了哪一步

两者读取的是平台文字、第三方返回的转录文字、互动数与有限评论。转录补充预算按 quick / default / deep 配置，模块中可见 3 / 5 / 8 的上限设置与片段截断。它们不是在本地对所有视频运行多模态模型，也不能保证每个视频都含可用转录。尤其 `caption` 一词在平台元数据中可能是帖子描述，只有实际取得 transcript 才能称为视频发言文字。[TikTok][tiktok]、[Instagram][instagram]。

## 3. 其他已接入来源

以下同样属于源码确认 / 待联网验证。没有列明评论正文的来源，不应通过其互动字段推断完整评论采集。

| 来源 | 获取方式和内容 | 配置与主要限制 | 源码 |
| :--- | :--- | :--- | :--- |
| Digg | `digg-pp-cli` 查询聚合故事、贡献作者和原帖引用，补取代表性帖子 | CLI 可用时启用；可免 X 登录获得其已聚合内容，不等于直接搜索全部 X | [digg.py][digg] |
| arXiv | `arxiv-pp-cli`，论文标题、摘要、作者、日期和论文链接 | CLI；适配器有技术相关性与较宽的回溯门槛，最终还受报告窗口处理；不是自动通读全部 PDF | [arxiv.py][arxiv] |
| Techmeme | `techmeme-pp-cli` 检索新闻归档和关联报道 | CLI；按窗口处理日期，未知日期可信度低；是技术新闻层 | [techmeme.py][techmeme] |
| LinkedIn | ScrapeCreators 帖子搜索；人物任务可补 profile 下的文章 | 密钥 + 显式启用；文章不直接包含在普通帖子搜索里；未见通用评论树采集 | [linkedin.py][linkedin] |
| Threads | ScrapeCreators 搜索帖子、正文片段和互动数据 | 密钥 + 来源开关；不承诺完整对话树 | [threads.py][threads] |
| Pinterest | ScrapeCreators 搜索 Pin 的标题 / 描述、链接和互动字段 | 密钥 + 来源开关；有图片关联信息不等于理解图片内容 | [pinterest.py][pinterest] |
| 小红书 | 本地已登录 MCP 配套 HTTP 服务；`/api/v1/login/status` 和 `/api/v1/feeds/search` | 显式 `--search xhs`；目前读取搜索卡片标题 / 描述、点赞 / 收藏 / 评论数；**未调用详情 / 评论正文接口** | [xiaohongshu_api.py][xhs] |
| Bluesky | AT Protocol：创建 / 刷新会话，`app.bsky.feed.searchPosts` 搜索帖子 | handle + app password；文本和互动，不代表抓全回复 | [bluesky.py][bluesky] |
| Truth Social | `/api/v2/search` 搜索公开状态内容 | 配置 token；文本和互动，不是完整档案采集 | [truthsocial.py][truth] |
| Telegram | ScrapeCreators 读取指定公开频道的分页帖子 | 需密钥与频道名单；不做全站关键词发现，不访问私聊 / 私群 | [telegram.py][telegram] |
| StockTwits | 公开 symbol 搜索与 `streams/symbol/{symbol}.json` | 识别到股票 / 加密货币符号时启用；近期消息和情绪标签；不保证完整历史 | [stocktwits.py][stocktwits] |
| DripStack | 公开搜索 API 返回金融通讯 / 分析文章结果 | 显式启用；不承诺获得付费原文全文 | [dripstack.py][dripstack] |
| Trustpilot | `trustpilot-pp-cli` 获取企业评价 | 显式启用 / 指定域名；可能需要页面访问会话；评分和评论样本不是全量评价库 | [trustpilot.py][trustpilot] |
| Amazon | 已登录 Bright Data CLI，产品检索及最近书面评论抽样 | 显式启用；商品价格、总体评分、评分数和有限买家评价；调用可能计费 | [amazon.py][amazon] |
| 招聘 / Careers | 公开 ATS：Greenhouse、Ashby、Lever、Workable、SmartRecruiters，辅以网页发现 | 用于 hiring signals；岗位信息可支持关注方向推断，不证明战略已确定 | [jobs.py][jobs] |
| Perplexity | Agent API / Search API；可走 OpenRouter Sonar；显式 Deep Research | 相应密钥和开关；属于搜索 / 综合服务，不能当成一个独立原始社区重复计证据 | [perplexity.py][perplexity] |
| 本地资料 | 读取 `.md` / `.txt`；有 `pdftotext` 时提取 PDF | `--corpus` 或配置目录；修改时间作为时效信号；无网络评论 / 字幕采集 | [corpus.py][corpus] |

**小红书还有时间范围差异：** 搜索过滤按深度设置为一天内 / 一周内 / 半年内，再交后续流程处理；并非所有深度都原生检索精确最近 30 天。搜索卡片可能缺少时间、描述或计数，缺失字段会影响证据质量。[小红书实现][xhs]。

## 4. 不是所有模块都已成为自动能力

`transcribe.py` 已实现「媒体 URL / 文件 → 获取音频 → ffmpeg 压缩 / 分块 → Groq / OpenAI Whisper 回退 → 文本」。但配置文档明确注明这是已交付的基础模块，**尚未由引擎自动调用**。对主流程无调用也做了静态核对。

因此，对无字幕视频应写成「有可复用的转写模块，自动接入待完成」，不能写成「所有视频无字幕也能自动转写」。它还要求相应模型服务凭据与 ffmpeg。[转写模块][transcribe]、[配置说明][config]。

## 5. 采集方式对部署意味着什么

| 方式 | 代表来源 | 部署影响 |
| :--- | :--- | :--- |
| 公开只读 API | HN、Polymarket、匿名 GitHub、部分 ATS | 接入较轻，仍可能限流或有历史范围限制 |
| RSS / 页面解析 | Reddit、部分网页兜底 | 页面结构变化与反爬容易影响结果 |
| 登录会话 / OAuth | Bird / xurl、小红书服务、Bluesky | 需要会话续期与明确账号环境 |
| 第三方采集 API | ScrapeCreators、Bright Data | 平台适配由服务承担，成本、额度和返回完整度随服务而变 |
| 外部 CLI | yt-dlp、Printing Press 系列 CLI | 需要安装、可执行路径和版本兼容；Python 依赖为空不等于无运行依赖 |
| 搜索 / 正文代理 | Brave、Exa、Serper、Parallel、Jina | 可能只返回摘要或代理文本；不是平台原生全量数据 |
| 本地读取 | corpus、研究库 | 不需平台访问，文件时间 / 类型与导出规则不同 |

## 6. 如何评价“采集成功”

应分别检查：是否找到结果、是否读到正文、是否读到评论、是否读到字幕、日期是否可确认、来源有无降级。`source_status` 的 `no-results` 代表干净的空结果；`partial`、`timeout`、`auth-failed`、`rate-limited`、`schema-drift` 等不能被解释成平台上无人讨论。

可用不等于覆盖完整：源码会对抓取结果数量、评论数、转录长度、并发、重试和时间预算设置上限。当前方案适合有限预算下收集研究证据，不能作为全量社交数据归档或统计抽样系统。

还有一处文档与代码差异：配置表较早仍写 GitHub 需要 `gh`；`pipeline.available_sources` 和 `github.py` 已支持匿名 GitHub REST，凭据用于提高配额。本文按代码描述，不照抄旧表。[来源选择][pipeline]、[GitHub 实现][github]。

[返回项目](../README.md)

[config]: https://github.com/mvanhorn/last30days-skill/blob/ca9d415e66073b17702f385d6886934097aec0e7/CONFIGURATION.md
[pipeline]: https://github.com/mvanhorn/last30days-skill/blob/ca9d415e66073b17702f385d6886934097aec0e7/skills/last30days/scripts/lib/pipeline.py
[reddit]: https://github.com/mvanhorn/last30days-skill/blob/ca9d415e66073b17702f385d6886934097aec0e7/skills/last30days/scripts/lib/reddit_keyless.py
[arctic]: https://github.com/mvanhorn/last30days-skill/blob/ca9d415e66073b17702f385d6886934097aec0e7/skills/last30days/scripts/lib/reddit_arctic.py
[xapi]: https://github.com/mvanhorn/last30days-skill/blob/ca9d415e66073b17702f385d6886934097aec0e7/skills/last30days/scripts/lib/x_api.py
[youtube]: https://github.com/mvanhorn/last30days-skill/blob/ca9d415e66073b17702f385d6886934097aec0e7/skills/last30days/scripts/lib/youtube_yt.py
[tiktok]: https://github.com/mvanhorn/last30days-skill/blob/ca9d415e66073b17702f385d6886934097aec0e7/skills/last30days/scripts/lib/tiktok.py
[instagram]: https://github.com/mvanhorn/last30days-skill/blob/ca9d415e66073b17702f385d6886934097aec0e7/skills/last30days/scripts/lib/instagram.py
[hn]: https://github.com/mvanhorn/last30days-skill/blob/ca9d415e66073b17702f385d6886934097aec0e7/skills/last30days/scripts/lib/hackernews.py
[github]: https://github.com/mvanhorn/last30days-skill/blob/ca9d415e66073b17702f385d6886934097aec0e7/skills/last30days/scripts/lib/github.py
[web]: https://github.com/mvanhorn/last30days-skill/blob/ca9d415e66073b17702f385d6886934097aec0e7/skills/last30days/scripts/lib/grounding.py
[webfetch]: https://github.com/mvanhorn/last30days-skill/blob/ca9d415e66073b17702f385d6886934097aec0e7/skills/last30days/scripts/lib/web_fetch_keyless.py
[polymarket]: https://github.com/mvanhorn/last30days-skill/blob/ca9d415e66073b17702f385d6886934097aec0e7/skills/last30days/scripts/lib/polymarket.py
[digg]: https://github.com/mvanhorn/last30days-skill/blob/ca9d415e66073b17702f385d6886934097aec0e7/skills/last30days/scripts/lib/digg.py
[arxiv]: https://github.com/mvanhorn/last30days-skill/blob/ca9d415e66073b17702f385d6886934097aec0e7/skills/last30days/scripts/lib/arxiv.py
[techmeme]: https://github.com/mvanhorn/last30days-skill/blob/ca9d415e66073b17702f385d6886934097aec0e7/skills/last30days/scripts/lib/techmeme.py
[linkedin]: https://github.com/mvanhorn/last30days-skill/blob/ca9d415e66073b17702f385d6886934097aec0e7/skills/last30days/scripts/lib/linkedin.py
[threads]: https://github.com/mvanhorn/last30days-skill/blob/ca9d415e66073b17702f385d6886934097aec0e7/skills/last30days/scripts/lib/threads.py
[pinterest]: https://github.com/mvanhorn/last30days-skill/blob/ca9d415e66073b17702f385d6886934097aec0e7/skills/last30days/scripts/lib/pinterest.py
[xhs]: https://github.com/mvanhorn/last30days-skill/blob/ca9d415e66073b17702f385d6886934097aec0e7/skills/last30days/scripts/lib/xiaohongshu_api.py
[bluesky]: https://github.com/mvanhorn/last30days-skill/blob/ca9d415e66073b17702f385d6886934097aec0e7/skills/last30days/scripts/lib/bluesky.py
[truth]: https://github.com/mvanhorn/last30days-skill/blob/ca9d415e66073b17702f385d6886934097aec0e7/skills/last30days/scripts/lib/truthsocial.py
[telegram]: https://github.com/mvanhorn/last30days-skill/blob/ca9d415e66073b17702f385d6886934097aec0e7/skills/last30days/scripts/lib/telegram.py
[stocktwits]: https://github.com/mvanhorn/last30days-skill/blob/ca9d415e66073b17702f385d6886934097aec0e7/skills/last30days/scripts/lib/stocktwits.py
[dripstack]: https://github.com/mvanhorn/last30days-skill/blob/ca9d415e66073b17702f385d6886934097aec0e7/skills/last30days/scripts/lib/dripstack.py
[trustpilot]: https://github.com/mvanhorn/last30days-skill/blob/ca9d415e66073b17702f385d6886934097aec0e7/skills/last30days/scripts/lib/trustpilot.py
[amazon]: https://github.com/mvanhorn/last30days-skill/blob/ca9d415e66073b17702f385d6886934097aec0e7/skills/last30days/scripts/lib/amazon.py
[jobs]: https://github.com/mvanhorn/last30days-skill/blob/ca9d415e66073b17702f385d6886934097aec0e7/skills/last30days/scripts/lib/jobs.py
[perplexity]: https://github.com/mvanhorn/last30days-skill/blob/ca9d415e66073b17702f385d6886934097aec0e7/skills/last30days/scripts/lib/perplexity.py
[corpus]: https://github.com/mvanhorn/last30days-skill/blob/ca9d415e66073b17702f385d6886934097aec0e7/skills/last30days/scripts/lib/corpus.py
[transcribe]: https://github.com/mvanhorn/last30days-skill/blob/ca9d415e66073b17702f385d6886934097aec0e7/skills/last30days/scripts/lib/transcribe.py
