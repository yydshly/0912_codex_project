# GitHub 优秀项目研究集

记录值得深入研究的 GitHub 开源项目，整理核心思路、源码分析、实践过程与可复用的经验，并为适合的项目提供 Web 演示。

本页提供摘要与有序索引；详细研究、截图和运行说明保存在各子项目中。

## 项目索引

按三位编号升序排列，编号一经分配保持不变。

| 编号 | 研究项目 | 摘要 | 原始仓库 | 研究状态 | Web 演示 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 001 | [Jan](projects/001-jan/README.md) | 类 ChatGPT 的开源桌面 App：组织上下文、接入本地或云端模型并执行工具；附架构研究与 Web 页面 | [janhq/jan](https://github.com/janhq/jan) | 研究中 | — |
| 002 | [Follow Builders](projects/002-follow-builders/README.md) | 预设平台上的账号、节目、网站及对应抓取方式，采集解析后由 AI 整理为可阅读、可推送的简报 | [zarazhangrui/follow-builders](https://github.com/zarazhangrui/follow-builders) | 已总结 | — |
| 003 | [last30days-skill](projects/003-last30days-skill/README.md) | 预先接入平台并实现各平台取数方式，再按用户问题编排搜索、补取正文 / 评论 / 字幕，整理为研究报告 | [mvanhorn/last30days-skill](https://github.com/mvanhorn/last30days-skill) | 研究中 | — |
| 004 | [小智 ESP32](projects/004-xiaozhi-esp32/README.md) | 适配硬件的固件库：AI 产品硬件组成、固件能力、DIY 接线与自制产品全流程 | [78/xiaozhi-esp32](https://github.com/78/xiaozhi-esp32) | 已总结 | [在线阅读](https://yydshly.github.io/0912_codex_project/004-xiaozhi-esp32/) |
| 005 | [OpenMAIC](projects/005-openmaic/README.md) | 资料转可执行课堂：课件、白板、实验、对话、测验与项目任务；拆解生成和调度原理，比较五产品的适用场景 | [THU-MAIC/OpenMAIC](https://github.com/THU-MAIC/OpenMAIC) | 已总结 | [在线研究与案例](https://yydshly.github.io/0912_codex_project/005-openmaic/) |
| 006 | [Pixelle-Video](projects/006-pixelle-video/README.md) | 真实源码实测：Codex 图片与文案，经原生配音、字幕模板和合成得到 14.7 秒短片 | [ATH-MaaS/Pixelle-Video](https://github.com/ATH-MaaS/Pixelle-Video) | 研究中 | [本地运行与成片](projects/006-pixelle-video/web/README.md) |
| 007 | [waoowaoo](projects/007-waoowaoo/README.md) | v0.5 创作工作区：已实测素材导入、原版画布、图片预览和助手素材引用；附四项目理解汇总 | [waooAI/waoowaoo](https://github.com/waooAI/waoowaoo) | 研究中 | [四项目在线汇总](https://yydshly.github.io/0912_codex_project/007-waoowaoo/) · [原版运行](projects/007-waoowaoo/web/README.md) |

## 项目图览

### 001 · [Jan](projects/001-jan/README.md)

[理解汇总](projects/001-jan/notes/understanding.md) · [Web 页面本地查看](projects/001-jan/web/README.md)（尚未上线）

**Jan 是一个类 ChatGPT 的开源桌面 App。** 以“输入 → 上下文 → 模型 → 反馈”为核心，关联记忆检索、工具与子 Agent、下载升级和文件管理。另附六大能力域与十八个源码研究入口。原创概念架构图；已做源码静态梳理，尚未运行验证。

![Jan：基础链路与记忆、工具执行、模型资源及共同支撑模块的关系](projects/001-jan/assets/core-flow-architecture.png)

### 002 · [Follow Builders](projects/002-follow-builders/README.md)

**预设来源驱动的 AI 简报工具。** 提前设置平台上的具体账号、节目或网站栏目及对应抓取方式，经采集、解析、过滤去重后，交给宿主 AI 摘要和翻译，再展示或推送。[理解汇总](projects/002-follow-builders/notes/08-understanding.md) · [完整研究](projects/002-follow-builders/README.md)

下图列出 26 个 X 账号、6 个播客节目和 2 个博客栏目。播客经 RSS 与转录服务取文本，YouTube 用于匹配观看链接。原创源码示意，真实采集与推送尚未端到端验证。

![Follow Builders：全部 34 个关注对象、定位方式及获取解析路径](projects/002-follow-builders/assets/source-map.png)

### 003 · [last30days-skill](projects/003-last30days-skill/README.md)

核心是提前实现「平台 → 接入与取数方式」的映射，运行时由模型理解问题、结合规则编排已有能力，再清洗证据并生成回答。[理解总结](projects/003-last30days-skill/notes/06-understanding.md) · [各平台获取方式](projects/003-last30days-skill/notes/03-source-and-content-matrix.md)。原创架构示意；已核对固定源码并运行离线评估，真实多源联网效果待验证。

![last30days 一页原理图：用户提问、模型理解、平台与对应取数方式、反馈清洗及展示](projects/003-last30days-skill/assets/question-to-report.png)

### 004 · [小智 ESP32](projects/004-xiaozhi-esp32/README.md)

通过真实主板与原型照片，拆解硬件、固件和 AI 后端的分工，并记录采购、接线、焊接、自制 PCB 及产品化过程。原创硬件组成与固件能力引导图；已核对固定源码，硬件与后端未实测。[在线阅读](https://yydshly.github.io/0912_codex_project/004-xiaozhi-esp32/) · [Web 运行说明](projects/004-xiaozhi-esp32/web/README.md)（GitHub Pages 已部署）。

![AI 产品硬件组成与小智固件能力：主板及外设怎样形成能听、能说、能显示的设备](projects/004-xiaozhi-esp32/assets/hardware-firmware-guide.svg)

### 005 · [OpenMAIC](projects/005-openmaic/README.md)

**把资料变成可播放、可提问、可操作的课堂。** 特点是内容与教学动作分离、角色按轮次调度、实验代码与任务状态执行，差异超过展示界面。对比 NotebookLM、Open Notebook、SurfSense 与 DeepTutor，帮助区分资料研究、多源检索、持续辅导和互动授课的需求。[理解汇总](projects/005-openmaic/notes/07-understanding.md) · [五产品场景选型](projects/005-openmaic/notes/04-comparison.md) · [六模块底层原理](projects/005-openmaic/notes/06-module-principles.md) · [原理全图](projects/005-openmaic/assets/module-principles-map.png)。

附[欧姆定律八环节案例](projects/005-openmaic/notes/05-case-study.md)：官方课件组件配合可操作实验、规则测验与设计任务；角色对话为预设脚本。[在线研究](https://yydshly.github.io/0912_codex_project/005-openmaic/) · [进入互动课堂](https://yydshly.github.io/0912_codex_project/005-openmaic/case.html) · [Web 运行说明](projects/005-openmaic/web/README.md)（GitHub Pages 已部署）。下图为原创能力图；已核对固定源码，完整应用生成链路未运行。

另有[生成与执行实验台](projects/005-openmaic/web/README.md)：六种能力均可查看生成要求、编辑产物、观察运行效果，并下载提取说明；区分本地模板、官方组件与简化执行器。 新读者先看[六能力网页呈现引导图](projects/005-openmaic/assets/six-capabilities-web-guide.png)与[全部网页导航](projects/005-openmaic/notes/08-web-guide.md)。

**引导图一：能力总览**

![OpenMAIC 能力总览：备课生成，课件、白板、实验、对话、测验和项目任务，以及课程编辑导出；AI 辅助绘制的示意图](projects/005-openmaic/assets/capability-overview.png)

**引导图二：生成内容与网页呈现**

![OpenMAIC 六能力网页呈现引导：课件、白板、实验、对话、测验和任务各自生成什么，网页如何呈现，以及程序的执行职责](projects/005-openmaic/assets/six-capabilities-web-guide.png)

### 006 · [Pixelle-Video](projects/006-pixelle-video/README.md)

**从文案与图片到可播放短片。** 本次 Codex 生成素材，真实 Pixelle 源码执行 Edge TTS、HTML 字幕模板和 FFmpeg 合成；已在原版历史页播放。没有验证应用内模型生成动态视频。[播放成片](projects/006-pixelle-video/assets/cafe-demo.mp4) · [运行说明](projects/006-pixelle-video/web/README.md)。下图为实际成片首帧。

![Pixelle 实际成片：咖啡店图片、标题和中文字幕](projects/006-pixelle-video/assets/composed-frame.png)

### 007 · [waoowaoo](projects/007-waoowaoo/README.md)

**以 Assistant、画布和资源版本组织持续创作。** v0.5.0-beta.1 已实际登录，验证画布、图片预览和将图片引用到助手；两张图片与 Pixelle 成片已导入并读回校验。下图为原版页面实拍，右侧是尚未提交的创作需求草稿；应用内模型生成尚未验证。[两产品差异](projects/007-waoowaoo/notes/comparison.md) · [实测记录](projects/007-waoowaoo/notes/README.md)。

![waoowaoo 原版画布中的两张图片和视频，以及引用拿铁图片的助手输入草稿](projects/007-waoowaoo/assets/canvas-reference.jpg)

另附[四个 AI 视频项目的理解汇总网页](projects/007-waoowaoo/web/summary/README.md)：对照 Pixelle-Video、waoowaoo、火宝短剧和 Toonflow 的能力、原理、场景与扩展方向，区分真实演示和官方资料；[在线阅读](https://yydshly.github.io/0912_codex_project/007-waoowaoo/)（GitHub Pages 已部署）。

## 仓库结构

```text
.
├── README.md                 # 对外摘要、有序索引与项目图览
├── AGENTS.md                 # 后续协作时遵循的仓库约定
├── projects/                 # 研究项目：001-slug、002-slug……
├── templates/project/       # 新研究项目模板
│   ├── README.md             # 项目介绍、研究结论、复现与演示入口
│   ├── assets/               # 封面、截图、架构图及来源说明
│   ├── notes/                # 研究过程与专题笔记
│   └── web/                  # 可选 Web 演示及其独立运行说明
└── docs/
    ├── CONVENTIONS.md         # 编号、收录和图片维护约定
    └── DEPLOYMENT.md          # 多项目 Web 演示部署约定
```

## 开始研究

1. 查看索引，选择下一个未使用的编号，将[项目模板](templates/project/README.md)复制到 `projects/编号-英文短名/`。
2. 填写原始仓库、研究目标与版本信息，再逐步补充笔记、截图和实践代码。
3. 更新本页索引；有代表性图片后补充图览，有可访问的演示后填写链接。

详细规则见[维护约定](docs/CONVENTIONS.md)，Web 演示规划见[部署约定](docs/DEPLOYMENT.md)。

## 来源与许可

每个子项目记录原始仓库、作者和上游许可证。引用、复制或修改上游代码及图片时，应保留其要求的版权与许可说明。本仓库目前未为原创内容指定统一开源许可证。
