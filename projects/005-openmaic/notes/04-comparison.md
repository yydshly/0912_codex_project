# OpenMAIC 与 NotebookLM、DeepTutor、Open Notebook、SurfSense 的比较

核对日期：2026-09-11。OpenMAIC 基于 1.0.1 / d5be393；DeepTutor 沿用先前研究的 v1.6.6 / 7a96bba，SurfSense 沿用 3448772，Open Notebook 沿用 2d2df8a。Google 产品功能依据本次官方资料核对。没有进行同题、同材料、同模型的效果评测。

## 先看共同点

它们都能把资料交给模型，进行问答、解释和内容生成；有些也支持测验、音频、可视化或教学引导。功能名称相似，不等于数据结构、证据检索、执行过程和学习状态完全相同，也不意味着教学效果有明确排名。

## 三个主要定位

| 维度 | NotebookLM / Gemini Notebook | DeepTutor | OpenMAIC |
| :--- | :--- | :--- | :--- |
| 核心重心 | 基于资料的研究与学习成品 | 可修改的教学流程与学习状态 | 课程创作与多角色互动授课 |
| 组织对象 | 来源、笔记本、对话及生成成果 | 知识点、学习路径、作答、掌握度和复习 | 课程、场景、页面内容、动作和角色 |
| 用户流程 | 选来源 → 提问 / 生成学习材料 → 返回引用 | 定目标 → 讲解 / 解题 → 练习 → 检查进度 → 复习 | 生成大纲与课程 → 播放讲解 → 插入讨论 / 实验 / 项目 |
| 互动重点 | 来源问答、学习引导、测验、音频互动 | 分步解题、工具结果、掌握门槛、持续反馈 | 白板、页面高亮、角色轮次、讲解与交互界面联动 |
| 可改造范围 | 通过产品开放的设置与接口使用，内部实现未公开 | 可以查看和修改教学规则、模型工具与学习状态 | 可以查看和修改课程协议、动作执行、角色与生成流程 |
| 本研究更关注的价值 | 快速使用成熟的资料学习体验 | 研究“学会多少、接下来学什么” | 研究“怎样把知识讲成一堂课” |

这些是重心对照，不是互斥能力列表。DeepTutor 也有可视化，OpenMAIC 也有测验和 PBL 状态，NotebookLM 也有学习引导。不能将其他产品画成完全缺少教学或交互。

来源：[OpenMAIC 固定说明](https://github.com/THU-MAIC/OpenMAIC/blob/d5be3933176247feebf4007f6e31e20b93871609/README.md)、[DeepTutor 固定版本](https://github.com/HKUDS/DeepTutor/tree/7a96bba1ae03401644c17763a2411c28aff3dcc9)、[Google 学习功能](https://blog.google/innovation-and-ai/models-and-research/google-labs/notebooklm-student-features/)。

## NotebookLM 的版本更新与比较边界

Google 于 2026-07-16 宣布 NotebookLM 更名为 Gemini Notebook，仍是独立产品，并开始提供安全云端代码执行能力；具体开放范围取决于账户与发布进度。这里沿用熟悉的 NotebookLM 名称，不把宣布的全部能力视为所有账户均已可用。[官方更新](https://blog.google/innovation-and-ai/products/gemini-notebook/notebooklm-gemini-notebook/)

它已经支持资料驱动的闪卡、测验和 Learning Guide，答错时可请求解释并返回来源。音频概览也支持加入对话、提问后继续播放；本次帮助文档注明互动模式仅支持英语。因此，“NotebookLM 只能总结，OpenMAIC 才能互动”不是可靠区分。[学习功能](https://blog.google/innovation-and-ai/models-and-research/google-labs/notebooklm-student-features/) · [音频互动帮助](https://support.google.com/gemininotebook/answer/16212820?hl=en)

NotebookLM 内部检索、编排与状态实现没有在本次资料中完整公开，不能说它和任何开源项目使用完全相同的架构。可观察的产品功能与可以审阅的开源实现应分开比较。

## OpenMAIC 与 DeepTutor 的技术增量

OpenMAIC 把教学表示为可执行的课程场景：内容与动作分开生成，播放器管理播放和实时状态，导演决定角色发言，再由动作引擎执行语音、白板和高亮。这是课堂呈现与互动调度的工程增量。[导演](https://github.com/THU-MAIC/OpenMAIC/blob/d5be3933176247feebf4007f6e31e20b93871609/lib/orchestration/director-graph.ts) · [动作引擎](https://github.com/THU-MAIC/OpenMAIC/blob/d5be3933176247feebf4007f6e31e20b93871609/lib/action/engine.ts)

DeepTutor 在通用模型与检索上增加学习路径和作答状态。先前固定源码中的基础掌握度使用最近最多五次作答的加权正确率，并对少量作答的掌握度设上限。它体现的是可检查的学习进度规则，而不是已证明精确理解了学生能力。[掌握度实现](https://github.com/HKUDS/DeepTutor/blob/7a96bba1ae03401644c17763a2411c28aff3dcc9/deeptutor/learning/mastery.py)

两者可以互相借鉴，但不能只交换几个提示词就把完整能力搬过去；还要映射课程 / 知识点、事件 / 作答、进度和工具结果。

## 如果你想到的是 Open Notebook 或 SurfSense

先前 DeepTutor 研究也比较过这两个项目；它们更接近资料研究工作台：

| 项目 | 侧重什么 | 与 OpenMAIC 的关系 |
| :--- | :--- | :--- |
| Open Notebook | 围绕笔记本组织资料、笔记、对话、内容转换与播客 | 更关注材料如何成为研究成果；OpenMAIC 更关注成果如何成为可播放课堂 |
| SurfSense | 多来源接入、混合检索、证据组织、连接器、协作与自动化 | 更关注资料进入系统并支持研究任务；可为课程提供素材与证据 |

Open Notebook 的已研究 Ask 路径先制定搜索策略，再检索、生成局部答案并汇总；SurfSense 的已研究混合检索路径融合向量和 PostgreSQL 全文排名，再按文档组织证据。不同路径只是各系统的一部分，不能据此推断其他检索方式都不存在。

来源：[Open Notebook 架构](https://github.com/lfnovo/open-notebook/blob/2d2df8a3cbb098776e56ca5ee77b9832f848228e/docs/7-DEVELOPMENT/architecture.md)、[Ask 路径](https://github.com/lfnovo/open-notebook/blob/2d2df8a3cbb098776e56ca5ee77b9832f848228e/open_notebook/graphs/ask.py)、[SurfSense 固定说明](https://github.com/MODSetter/SurfSense/blob/3448772bd3d5d439114f810ac5da8e5a86967917/README.md)、[混合检索](https://github.com/MODSetter/SurfSense/blob/3448772bd3d5d439114f810ac5da8e5a86967917/surfsense_backend/app/agents/chat/multi_agent_chat/shared/retrieval/hybrid_search.py)。

## 对我们的意义

比较服务于三个决定：**能否直接使用现成产品、哪个开源项目适合作为改造底座、组合时由谁负责资料、授课与学习状态。** 下面是场景判断，不是性能或教学效果评测；实际采用前还需验证自己的材料、模型配置与部署条件。

| 首要需求 | 优先考察 | 选择理由与后续工作 |
| :--- | :--- | :--- |
| 用一组论文或报告快速研究、解释和生成学习材料 | NotebookLM / Gemini Notebook | 先利用现成的来源学习流程；核对账户能力和材料适用性 |
| 自建资料笔记本，控制模型、数据及内容处理流程 | Open Notebook | 开源资料研究工作台；部署、数据管理和定制由自己承担 |
| 从分散业务系统接入资料并组织检索证据 | SurfSense | 优先解决连接器与检索；核对具体来源支持、同步和权限需求 |
| 持续辅导学生，围绕作答安排后续学习与复习 | DeepTutor | 学习路径与状态是研究重点；掌握度及教学规则仍需验证 |
| 为教师、科普作者或企业培训制作可参与的课程 | OpenMAIC | 课件、动作、角色、实验与项目任务联动；需要内容审核、真实生成验证与业务接入 |

同一份欧姆定律材料可以产生不同交付目标：查清公式的前提与出处、持续诊断单位换算错误、制作能调参数并完成电阻设计的课堂。比较这些目标及其运行过程，比统计功能按钮数量更有意义。这里没有声称任何产品只能完成一类目标。

面对相同的一份开源项目材料，可以分别研究：

- **资料研究：** 找到相关源码、回答带引用的问题、形成可信笔记。
- **课堂呈现：** 将笔记转成课件、可操作实验与多角色讲解，借鉴 OpenMAIC。
- **持续学习：** 用可执行练习验证理解，保存学习状态，安排下一步，借鉴 DeepTutor。

“资料研究 → 课堂呈现 → 学习反馈”是建议组合方向，**不是这些项目现成互通的系统**。真正连接时还需要内容协议、来源引用、身份授权和学习事件映射。

既有研究入口：[DeepTutor 完整研究](https://yydshly.github.io/0910_codex_project/007-deeptutor/) · [SurfSense 研究源码](https://github.com/yydshly/0909_codex_project/tree/main/projects/014-surfsense)。

[返回项目说明](../README.md)
