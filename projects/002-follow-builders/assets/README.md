# 图片来源与重绘

| 文件 | 内容 | 来源 / 作者 | 版本 / 日期 | 使用说明 |
| :--- | :--- | :--- | :--- | :--- |
| [cover.png](cover.png) | 来源、采集、整理、交付四步流程，真实 feed 数量与待建设能力 | 本研究原创，由图形与文字绘制 | 上游 c8da0e7；2026-09-11 | 非上游界面截图；不含第三方照片或图标 |
| [source-map.png](source-map.png) / [source-map.svg](source-map.svg) | 全部 34 个关注对象，账号 / RSS / 栏目定位，以及三条获取解析路径 | 本研究原创，按来源目录绘制；SVG 的名称链接到对应来源 | 上游 c8da0e7；2026-09-11 | 非运行截图；播客转录与 YouTube 观看链接分开表示 |

图中 26 个 X 账号、6 个播客、2 个博客来自[固定来源配置](https://github.com/zarazhangrui/follow-builders/blob/c8da0e7ece27d6a0007b53f54f546bf0ff1086d4/config/default-sources.json)。14 位作者、28 条动态和空的播客 / 博客来自[核验数据](../data/verification.json)。后续完善内容来自本研究建议，不表示已经实现。

重绘脚本：[render-overview.py](../scripts/render-overview.py)。本次环境为 Python 3.10.11、Pillow 11.3.0，使用 Windows 已安装的微软雅黑字体；不分发字体文件。

在本子项目目录运行：

```powershell
python scripts/render-overview.py
```

需要 Pillow 11.3.0；重绘依赖独立记录在 [requirements-visuals.txt](../requirements-visuals.txt)。其他系统可用 `--font` 指定本机支持中文的字体文件。输出为 1600 × 1040 PNG；已实际打开检查文字、留白与箭头。

[返回项目说明](../README.md)

## 来源关系图重绘

[render-source-map.py](../scripts/render-source-map.py) 读取 [source-catalog.json](../data/source-catalog.json)，输出 1600 × 1550 的 PNG 和可点击 SVG，依赖与整体架构图相同。使用本地已安装字体，不分发字体文件。已打开 PNG 检查排版，并核对 SVG 包含全部 34 个不同来源入口。

```powershell
python scripts/render-source-map.py
```
