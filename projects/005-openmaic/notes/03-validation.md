# 验证记录与复现实验建议

研究日期：2026-09-11。固定提交：`d5be3933176247feebf4007f6e31e20b93871609`；版本标记 1.0.1。

## 已完成的事实核对

| 项目 | 证据 | 结果与范围 |
| :--- | :--- | :--- |
| 版本与环境 | [package.json](https://github.com/THU-MAIC/OpenMAIC/blob/d5be3933176247feebf4007f6e31e20b93871609/package.json) | 1.0.1；Node.js ≥ 22.19.0 |
| 上游许可 | [LICENSE](https://github.com/THU-MAIC/OpenMAIC/blob/d5be3933176247feebf4007f6e31e20b93871609/LICENSE) | MIT；已保留素材对应许可原文 |
| 课程生成拆分 | [生成包说明](https://github.com/THU-MAIC/OpenMAIC/blob/d5be3933176247feebf4007f6e31e20b93871609/packages/%40openmaic/generation/README.md) | 内容、动作与组装有独立接口 |
| 默认多智能体路径 | [director-graph.ts](https://github.com/THU-MAIC/OpenMAIC/blob/d5be3933176247feebf4007f6e31e20b93871609/lib/orchestration/director-graph.ts) | 单请求最多一轮导演与角色；客户端驱动讨论循环 |
| 播放与执行 | [动作引擎](https://github.com/THU-MAIC/OpenMAIC/blob/d5be3933176247feebf4007f6e31e20b93871609/lib/action/engine.ts) | 播放和在线动作共用执行层 |
| 交互页面 | [iframe 宿主](https://github.com/THU-MAIC/OpenMAIC/blob/d5be3933176247feebf4007f6e31e20b93871609/components/scene-renderers/InteractiveIframeHost.tsx) | 使用 sandbox 与消息通信；未验证各生成页面 |
| 可选功能 | [feature-flags.ts](https://github.com/THU-MAIC/OpenMAIC/blob/d5be3933176247feebf4007f6e31e20b93871609/lib/config/feature-flags.ts) | Pro、Pi、PPTX 导入、视频导出等有独立条件 |
| 评分降级 | [quiz-grade/route.ts](https://github.com/THU-MAIC/OpenMAIC/blob/d5be3933176247feebf4007f6e31e20b93871609/app/api/quiz-grade/route.ts) | 简答题模型输出解析失败时，返回约半分与通用提示；这是实现行为，不是推荐做法 |
| 多用户存储边界 | [上游 README](https://github.com/THU-MAIC/OpenMAIC/blob/d5be3933176247feebf4007f6e31e20b93871609/README.md) | 基础持久化开发令牌公开可见，不提供真正用户隔离 |
| 官方效果素材 | [素材记录](../assets/README.md) | 原样引用固定提交的三份示例；不作为本次运行证明 |

上游源码位于工作区外的临时研究副本，未作为第三方仓库提交到本研究项目。正文链接固定提交，后续上游变化不自动改变本次研究结论。

## 本研究交付检查

2026-09-11 初次文档交付完成以下检查；后续增加的同类对比和网页检查另见[网页验证记录](../web/validation.md)：

- 检查根 README 与本项目共 8 份 Markdown，68 个相对链接全部指向现有文件；图片和返回入口有效。
- 34 个固定提交源码链接与临时上游副本中的对应文件路径匹配；此项是路径核对，不是逐个远端 HTTP 探测。
- 根索引编号为 001–005，唯一且升序；005 图览和子项目均标记「已总结」，完整应用未实测、研究站点未部署。
- SVG XML 解析通过，并用 Edge 无头浏览器渲染为临时图片做目视检查：文字、连线及卡片无明显遮挡，配置条件与验证范围可读。
- 三份官方图片 / 动图和许可文件的 SHA-256 与上游原文件完全一致。
- 项目只包含研究文档、原创 SVG、三份引用素材及许可；没有依赖目录、构建产物、密钥或完整上游仓库。
- 根文档差异检查通过；原有文件有 CRLF → LF 的 Git 换行提示，不影响内容或链接。

这些初次结果只验证本研究文档交付，不代表上游课堂应用通过运行测试。后续新增了接入官方 renderer 的欧姆定律互动案例、前端源码与锁定依赖清单，并在 2026-09-11 完成 GitHub Pages 发布；上面的“未部署”描述的是初次交付阶段。依赖目录与构建产物仍被忽略，不提交。案例的组件运行、规则检查和发布结果见[网页验证记录](../web/validation.md)。

## 尚未完成的运行验证

| 验证项 | 状态 |
| :--- | :--- |
| 安装、构建和启动完整 OpenMAIC | 未执行 |
| 模型、语音、文档解析、图像与视频服务联调 | 未执行 |
| 从固定材料完整生成课程并导出 | 未执行 |
| 学生提问、打断、继续、测验与进度恢复 | 未执行 |
| Pro 会话恢复、并发编辑和故障重试 | 未执行 |
| 生成耗时、费用、知识准确率与评分一致性 | 未测量 |
| 教学效果的前后测或对照实验 | 未执行 |

## 建议的最小复现实验

使用一份可公开分享、包含明确知识点的短文档，例如本研究的“课程数据与动作引擎”说明。固定文档、模型、配置和期望答案，然后：

1. 生成包含课件、测验和一个交互页面的小课。
2. 检查知识点是否覆盖、有无编造、示例与公式是否正确。
3. 播放课程，提问一次并返回讲解，观察语音与动作衔接。
4. 提交正确、部分正确和错误答案，核对评分与反馈。
5. 调整交互参数，检查边界条件与浏览器错误。
6. 导出课程，重新打开，核对内容、媒体与交互保留情况。
7. 记录重试次数、人工修改时间、总耗时和可获取的服务费用。

建议记录字段：材料版本、模型标识、运行配置、课程页数、失败页面、修改内容、费用计量来源和验证日期。涉及正式学习收益时，再设计知识前测、后测及对照条件。

[返回项目说明](../README.md)
