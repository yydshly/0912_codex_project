# 图片与素材来源

| 文件 | 图片说明 | 来源 / 作者 | 版本 / 日期 | 使用说明 |
| :--- | :--- | :--- | :--- | :--- |
| [cover.png](cover.png) | 三种触发模式、处理链路与输出层级 | 本研究原创绘制，依据上游固定源码 | v3.24.0 / ca9d415；2026-09-11 | 架构示意，非上游截图、非联网运行截图；无外部图片素材 |
| [question-to-report.png](question-to-report.png) | 一页横向图：提问到展示的全流程；逐项对应平台与 API、RSS / 页面、登录会话、第三方服务、CLI 和本地读取方式 | 本研究原创绘制 | v3.24.0 / ca9d415；2026-09-11 | 1600 × 900，按 1–7 阅读；中间为来源与取数方式映射，包含缩写释义和部分备援；完整条件见信息源专题 |

图示参考：[pipeline.py](https://github.com/mvanhorn/last30days-skill/blob/ca9d415e66073b17702f385d6886934097aec0e7/skills/last30days/scripts/lib/pipeline.py)、[配置说明](https://github.com/mvanhorn/last30days-skill/blob/ca9d415e66073b17702f385d6886934097aec0e7/CONFIGURATION.md)。

可编辑绘图源为 [generate-cover.py](generate-cover.py)。重新生成需要 Pillow 和支持中文的字体；默认使用 Windows 微软雅黑，可通过 `RESEARCH_DIAGRAM_FONT` 指定本机字体文件。字体文件没有复制进仓库。执行 `python generate-cover.py` 会在此目录生成图片。本次使用 Pillow 11.3.0，图片 1800 × 1100。

绘图工具依赖只用于本项目素材生成，不是上游运行依赖，也不要求根仓库采用统一 Python 环境。

一页原理图的可编辑源为 [generate-question-flow.py](generate-question-flow.py)，运行 `python generate-question-flow.py` 重新生成，依赖和字体配置同上。原来的 `cover.png` 保留作为触发模式专题图，根图览与子项目入口使用新版一页原理图。

[返回项目](../README.md)
