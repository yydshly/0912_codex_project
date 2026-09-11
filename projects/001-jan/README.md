# 001 · Jan：类 ChatGPT 的开源桌面 App

**Jan 是一个类 ChatGPT 的开源桌面 App。** 它组织上下文，接入本地或云端模型，并处理回答与工具操作。本项目汇总我们对其产品定位、基础链路、模块架构及工程参考价值的理解。

## 基本信息

| 项目 | 内容 |
| :--- | :--- |
| 索引编号 | 001 |
| 原始仓库 | [janhq/jan](https://github.com/janhq/jan) |
| 原作者 / 组织 | Jan / Menlo Research |
| 上游许可证 | 根 [LICENSE](https://github.com/janhq/jan/blob/f4c46fefc64f88adaca24d63541873f1e318a04b/LICENSE) 为 Apache-2.0；具体组件与模型另行核对 |
| 研究版本 / Commit | 开发分支固定提交 [f4c46fefc64f88adaca24d63541873f1e318a04b](https://github.com/janhq/jan/tree/f4c46fefc64f88adaca24d63541873f1e318a04b)；提交时间 2026-09-11 02:12:06 UTC |
| 稳定版参考 | 本次查询 GitHub latest release 为 v0.8.4，不将开发分支全部能力归入此发布版 |
| 开始 / 最近研究日期 | 2026-09-11 |
| 研究状态 | 研究中（已完成能力模块静态梳理，未运行验证） |
| 技术栈 | React、TypeScript、Zustand、Tauri、Rust、llama.cpp；Apple Silicon 路径另含 Swift / MLX |
| 演示状态 | 未部署 |
| 在线演示 | — |

## 理解汇总与 Web 页面

- [我们的理解与研究方向](notes/understanding.md)：Jan 的本质、基础链路、能力边界、参考价值，以及“实现软件并公开呈现工程过程”的项目思路。
- [Web 研究页面与本地查看说明](web/README.md)：同一主题的可浏览页面，包含两张架构图、十八个模块的源码入口及完整研究文档。

页面为研究展示，不提供聊天或模型运行服务。静态页面已完成；当前环境没有可用 Sites 发布连接，尚未上线，不填写猜测的在线地址。

## 基础链路与扩展模块关系图

![Jan 基础链路：输入、上下文、模型适配、推理与反馈，关联工具循环和共同支撑模块](assets/core-flow-architecture.png)

蓝色表示一次普通聊天的主链路，紫色连接上下文来源、模型资源与输出记录，橙色表示 Agent 执行工具后重新调用模型的循环。下方模块共同支撑整条链路，并非每轮对话都需要运行。此图为职责关系的概念总结，不是逐函数调用图。

[查看可编辑 SVG](assets/core-flow-architecture.svg) · [查看能力模块研究](notes/architecture.md)

## 能力模块架构图

![Jan 能力模块架构图：六大能力域与十八个源码研究入口](assets/capability-architecture.png)

本图依据固定提交源码自行绘制，是按职责归纳的能力地图，不是上游界面截图或逐进程部署图。

- [完整研究：18 项能力、源码位置、参考价值与关键链路](notes/architecture.md)
- [可编辑 SVG 架构图（模块名称含源码链接）](assets/capability-architecture.svg)
- [图片来源与重绘说明](assets/README.md)

## 核心结论

1. 优先研究服务抽象、模型适配、下载、升级、文件管理、配置存储和工具接入，适合构建自己的 AI 桌面软件。
2. 模型下载与应用升级、文件读写与文档检索有不同的职责和生命周期，应分开研究。
3. 当前提交已经包含后台子 Agent 派发、并发控制、结果回收和取消清理，不能仅归类为角色配置界面。成熟度仍待实测。
4. Agent 编排与底层工具实现分开，界面和 CLI 可复用部分不依赖 Tauri 的核心代码，具有架构参考价值。
5. 有源码不等于已经验证可靠。例如会话 token 预算在当前主循环中是提示性阈值，不是超限强制停止，详见研究笔记。

以上结论的逐项证据见[架构研究](notes/architecture.md)。

## 本地复现与研究边界

本次通过 GitHub API 固定提交并读取选定源文件。没有将上游完整源码、模型或依赖目录加入本仓库。尚未安装 Jan、构建 Jan、下载模型或运行上游测试；性能、操作系统差异、沙箱有效性和任务成功率未验证。

后续复现应在独立位置获取上述提交，按该提交的 [构建说明](https://github.com/janhq/jan/blob/f4c46fefc64f88adaca24d63541873f1e318a04b/README.md)准备环境。Jan 的 Node、Yarn、Rust 和本地引擎依赖以固定提交说明为准，本研究项目暂不配置 Jan 运行环境。

## 后续事项

- [ ] 验证下载暂停、续传、取消与校验失败的状态转换。
- [ ] 验证应用升级的失败处理与安装后重启流程。
- [ ] 复现文件导入、解析、检索和回答链路。
- [ ] 复现子 Agent 并发排队、父任务取消、结果回收及权限交集。
- [ ] 评估可抽取的模块及其平台依赖、具体许可。

## 参考资料与许可

- [固定提交源码](https://github.com/janhq/jan/tree/f4c46fefc64f88adaca24d63541873f1e318a04b)
- [官方文档](https://www.jan.ai/docs/desktop)
- [官方 Cowork 预览文档](https://www.jan.ai/docs/desktop/cowork)
- [根许可证](https://github.com/janhq/jan/blob/f4c46fefc64f88adaca24d63541873f1e318a04b/LICENSE)

正文和架构图为本次研究原创整理，未复制上游程序代码、品牌标志或截图。上游具体组件与模型可能采用不同许可。本仓库尚未为原创内容指定统一开源许可证。

[返回总索引](../../README.md)
