# 主动采集、主题驱动与持续运行

研究日期：2026-09-11；版本：v3.24.0 / `ca9d415e66073b17702f385d6886934097aec0e7`。本页为源码确认与研究判断，没有实际创建调度任务。

## 结论

**这是一个由研究任务驱动的主动检索工具。** 触发后会自己请求平台数据，用户不必先给它一批文章；但它默认不会常驻后台连续收集。

「会主动向外取数」和「会自行定时启动」是两个不同问题：前者已经实现，后者需要外部调度。

| 模式 | 是否必须给具体关键词 | 谁启动 | 做什么 | 默认持续运行？ |
| :--- | :--- | :--- | :--- | :--- |
| 主题研究 | 通常需要主题 / 人名 / 产品 / 问题 | 用户或上层 Agent | 查询与主题相关的近期信息 | 否 |
| 全局热点发现 | 不需要 | 用户或上层 Agent | 扫描预设来源的热门 / 上升信息流 | 否 |
| 领域热点发现 | 需要领域，可没有具体对象 | 用户或上层 Agent | 先提名热点，再进一步检索 | 否 |
| 关注列表 | 先存入主题 | 外部定时器调用 | 逐个主题研究、保存和比较新旧记录 | 需自行配置 |
| 研究库搜索 | 需要本地搜索问题 | 用户或上层 Agent | 搜索已经保存的研究 | 不自动再采集 |

## 热点发现为什么不依赖具体关键词

入口是 `--discover`。全局模式从 Reddit 的热门 / 上升列表、HN front / best、Digg 话题流等已有信息流获得候选；领域模式增加类别与关键词限制，X 在有认证的条件下参与。

交互式宿主路径分为三段：

1. 程序扫描列表，输出候选话题材料。
2. 宿主 AI 判断话题名称、是否噪声以及内容价值；程序继续对候选话题进行多源研究。
3. 宿主可补充内容角度，程序完成排序、渲染与话题队列记录。

无人值守保留确定性的一次执行路径。没有候选达到证据门槛时，可以返回 `nothing-solid`，而不是必然输出若干「热点」。这仍是任务触发后的发现，不是自主常驻代理，也不是全互联网热点覆盖。

依据：[Discovery 概念](https://github.com/mvanhorn/last30days-skill/blob/ca9d415e66073b17702f385d6886934097aec0e7/CONCEPTS.md)、[pipeline.py](https://github.com/mvanhorn/last30days-skill/blob/ca9d415e66073b17702f385d6886934097aec0e7/skills/last30days/scripts/lib/pipeline.py)。

## 关注列表不是调度器

`watchlist.py add` 保存主题及 schedule 字段；`run-one` / `run-all` 执行研究。保存 schedule 不会自动安装系统定时任务。

完整周期链路是：`外部调度器 → watchlist.py → 检索引擎 → SQLite 新增 / 更新记录 → 可选摘要或通知`。

调度可以由 Windows 任务计划、cron、GitHub Actions 或已有 Agent 调度系统承担。当前 `run-all` 执行启用的主题并受预算约束，不能将 schedule 字段误认为逐主题自动到点检查器；何时执行由调度配置负责。

固定版本的关注列表子进程使用快速模式，传入 `--lookback-days 90`。因此应区分「普通命令默认最近 30 天」与「包装任务实际选择的窗口」，不要根据项目名猜测所有入口都取 30 天。

若配置了 HTTPS 通知地址，代码可在有新增发现时发送 Slack / 通用 webhook；这是可选能力。本研究没有配置通知，也没有发送消息。

依据：[watchlist.py](https://github.com/mvanhorn/last30days-skill/blob/ca9d415e66073b17702f385d6886934097aec0e7/skills/last30days/scripts/watchlist.py)、[CONFIGURATION.md](https://github.com/mvanhorn/last30days-skill/blob/ca9d415e66073b17702f385d6886934097aec0e7/CONFIGURATION.md#trend-monitoring-store--watchlist--briefings)。

## 对本研究仓库的启示

适合先手动研究一个开源项目，确认账号 / 仓库 / 社区与信息质量，再为少量重点项目增加周期运行。若建设监测系统，还需要调度状态、重试、跨次去重、失败通知、成本记录和变更摘要；不能仅靠安装 Skill 获得完整运行保障。

[返回项目](../README.md)
