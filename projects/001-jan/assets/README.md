# 架构图与来源

| 文件 | 说明 | 来源 / 作者 | 版本 / 日期 | 使用说明 |
| :--- | :--- | :--- | :--- | :--- |
| [core-flow-architecture.png](core-flow-architecture.png) | 以基础链路为核心，关联上下文、模型资源、Agent 循环与共同支撑模块 | 本次研究依据已有源码结论原创绘制 | f4c46fe / 2026-09-11 | 概念关系图，非逐函数调用图 |
| [core-flow-architecture.svg](core-flow-architecture.svg) | 同内容可编辑矢量图 | 同上 | 同上 | 可修改文本、节点与连接线 |
| [build_core_flow.py](build_core_flow.py) | 基础链路关系图生成源文件 | 本次研究原创 | 2026-09-11 | Python 3.10+、Pillow、微软雅黑字体 |
| [capability-architecture.png](capability-architecture.png) | 六大能力域、十八个研究入口 | 本次研究依据源码原创绘制 | f4c46fe / 2026-09-11 | 非产品截图，未运行验证 |
| [capability-architecture.svg](capability-architecture.svg) | 相同内容的可编辑矢量图，模块名称含源码链接 | 同上 | 同上 | 浏览器可点击，部分图片预览器不支持跳转 |
| [build_architecture.py](build_architecture.py) | 图形生成源文件 | 本次研究原创 | 2026-09-11 | Python 3.10+、Pillow、微软雅黑字体 |

重绘命令（从仓库根执行）：`python projects/001-jan/assets/build_architecture.py`。基础链路图重绘：`python projects/001-jan/assets/build_core_flow.py`。其他系统需调整脚本中的字体路径。

来源：[janhq/jan 固定提交](https://github.com/janhq/jan/tree/f4c46fefc64f88adaca24d63541873f1e318a04b)。图中没有引用外部图片、官方截图或品牌标志；仅以链接引用源码。本仓库尚未为原创内容指定统一开源许可证。

[返回项目说明](../README.md)
