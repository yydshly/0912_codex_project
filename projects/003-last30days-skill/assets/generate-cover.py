"""Draw the original research diagram. Requires Pillow and a CJK font."""
from pathlib import Path
import os
from PIL import Image, ImageDraw, ImageFont

HERE = Path(__file__).resolve().parent
FONT = os.environ.get("RESEARCH_DIAGRAM_FONT", "C:/Windows/Fonts/msyh.ttc")
SCALE = 2
W, H = 1800, 1100
im = Image.new("RGB", (W * SCALE, H * SCALE), "#f4f3ed")
d = ImageDraw.Draw(im)


def text(x, y, value, size=26, color="#243446"):
    font = ImageFont.truetype(FONT, size * SCALE)
    d.text((x * SCALE, y * SCALE), value, font=font, fill=color)


def box(x, y, w, h, fill="#ffffff", outline="#d9dedc"):
    d.rounded_rectangle((x * SCALE, y * SCALE, (x+w) * SCALE, (y+h) * SCALE),
                        radius=18 * SCALE, fill=fill, outline=outline, width=2 * SCALE)


def arrow(x1, x2, y):
    d.line((x1*SCALE, y*SCALE, x2*SCALE, y*SCALE), fill="#27796d", width=4*SCALE)
    d.polygon([(x2*SCALE, y*SCALE), ((x2-10)*SCALE, (y-7)*SCALE),
               ((x2-10)*SCALE, (y+7)*SCALE)], fill="#27796d")


text(64, 37, "003  /  OPEN SOURCE RESEARCH", 22, "#27796d")
text(64, 85, "last30days：从研究任务到多源证据", 52, "#142c40")
text(66, 159, "v3.24.0 · 固定源码研究 · 架构示意（非产品截图）", 25, "#536370")

triggers = [
    ("01  主题驱动", "输入对象 + 问题 + 时间范围", "例如：项目近期变化、用户遇到的问题"),
    ("02  热点发现", "可以不给具体关键词", "扫描可用信息流，再对候选话题研究"),
    ("03  周期跟踪", "关注列表 + 外部调度器", "列表保存主题；定时器负责启动研究"),
]
for i, (title, line1, line2) in enumerate(triggers):
    x = 64 + i * 562
    box(x, 232, 546, 157, "#e7efea", "#cbded4")
    text(x+24, 252, title, 29, "#1c665c")
    text(x+24, 304, line1, 25)
    text(x+24, 345, line2, 22, "#52636c")

text(64, 421, "一次研究如何处理", 25, "#27796d")
steps = [
    ("AI 规划", ["识别主题与账号 / 社区", "拆分子查询与来源", "检索词 + 排序问题"]),
    ("多源取数", ["公开 API / RSS / 页面", "登录会话 / 第三方 / CLI", "帖子 · 评论 · 字幕 · 指标"]),
    ("证据处理", ["日期与相关性筛选", "去重、排名融合与重排", "聚类并保留代表内容"]),
    ("报告与综合", ["Python 生成结构化证据", "宿主 AI 阅读并写成简报", "记录引用与来源缺口"]),
]
for i, (title, lines) in enumerate(steps):
    x = 64 + i * 425
    box(x, 472, 396, 222)
    text(x+23, 493, title, 32, "#142c40")
    for j, line in enumerate(lines):
        text(x+23, 554+j*39, line, 24, "#4b5e6b")
    if i < 3:
        arrow(x+402, x+420, 581)

text(64, 732, "输出分成三层", 25, "#27796d")
outputs = [
    ("给人：研究简报", "近期变化、观点、对比与引用"),
    ("给程序：JSON / 原始证据", "稳定摘要契约与完整内部报告有区别"),
    ("给后续研究：存储与跟踪", "可选 SQLite、研究库、历史变化"),
]
for i, (title, detail) in enumerate(outputs):
    x = 64 + i*562
    box(x, 782, 546, 119, "#142c40", "#142c40")
    text(x+24, 801, title, 28, "#ffffff")
    text(x+24, 851, detail, 23, "#ccddd9")

d.line((64*SCALE, 948*SCALE, 1734*SCALE, 948*SCALE), fill="#c8d1ce", width=2*SCALE)
text(64, 976, "关键边界", 25, "#27796d")
text(224, 976, "评论数 ≠ 评论正文     字幕 ≠ 画面理解     安装 ≠ 持续采集", 27, "#243446")
text(64, 1030, "2026-09-11 · commit ca9d415 · 已核对源码与离线回放，实时来源效果待验证", 21, "#647580")
im.resize((W, H), Image.Resampling.LANCZOS).save(HERE / "cover.png", optimize=True)
print(HERE / "cover.png")
