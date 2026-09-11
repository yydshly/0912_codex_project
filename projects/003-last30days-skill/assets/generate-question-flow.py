"""Original single-page research flow diagram. Pillow + a CJK font required."""
from pathlib import Path
import math
import os
from PIL import Image, ImageDraw, ImageFont

HERE = Path(__file__).resolve().parent
FONT = os.environ.get("RESEARCH_DIAGRAM_FONT", "C:/Windows/Fonts/msyh.ttc")
W, H, S = 1600, 900, 2
image = Image.new("RGB", (W*S, H*S), "#f5f5f0")
draw = ImageDraw.Draw(image)
INK, MUTED, TEAL = "#173346", "#506575", "#20756b"


def text(x, y, label, size=23, color=INK):
    font = ImageFont.truetype(FONT, size*S)
    draw.text((x*S, y*S), label, font=font, fill=color)


def box(x, y, w, h, fill="#ffffff", border="#d6e0dc", radius=17):
    draw.rounded_rectangle((x*S, y*S, (x+w)*S, (y+h)*S),
                           radius=radius*S, fill=fill, outline=border, width=S)


def line(points, color=TEAL, width=3, arrow=True):
    draw.line([(x*S, y*S) for x, y in points], fill=color, width=width*S,
              joint="curve")
    if arrow:
        x, y = points[-1]
        px, py = points[-2]
        angle = math.atan2(y-py, x-px)
        tri = [(x*S, y*S)]
        for delta in (-0.55, 0.55):
            tri.append(((x-11*math.cos(angle+delta))*S,
                        (y-11*math.sin(angle+delta))*S))
        draw.polygon(tri, fill=color)


def stage(x, y, w, number, title, lines, dark=False):
    box(x, y, w, 134, "#173346" if dark else "#ffffff",
        "#173346" if dark else "#d6e0dc")
    circle = (x+19, y+21, x+52, y+54)
    draw.ellipse(tuple(v*S for v in circle), fill="#d5e9df" if not dark else "#d9eee6")
    text(x+28, y+20, str(number), 23, TEAL)
    text(x+65, y+18, title, 29, "#ffffff" if dark else INK)
    for i, value in enumerate(lines):
        text(x+22, y+66+i*30, value, 23, "#d8e5e8" if dark else MUTED)


text(40, 25, "last30days：从问题到研究结果", 43)
text(42, 87, "提前接入平台与取数方式；运行时按问题编排搜索、整理证据并生成回答", 25, MUTED)
text(1323, 38, "一页原理图", 24, TEAL)
text(1323, 76, "v3.24.0 / ca9d415", 19, MUTED)

top = [
    (40, "用户提问", ["研究对象、具体问题", "时间范围、输出要求"]),
    (425, "模型理解", ["识别对象与研究目的", "拆分问题、生成检索词"]),
    (810, "选择平台", ["问题类型 + 平台特点", "登录、工具和用户限制"]),
    (1195, "调用搜索能力", ["使用预置的平台适配器", "API · 页面 / RSS · CLI 等"]),
]
for number, (x, title, detail) in enumerate(top, 1):
    stage(x, 138, 350, number, title, detail)
for x in (390, 775, 1160):
    line([(x+5, 205), (x+30, 205)])

# Source list is a supporting panel attached to platform selection.
line([(985, 272), (985, 303)], color="#8baba1", width=2, arrow=False)
text(1005, 280, "从已接入的来源中选择", 19, MUTED)
box(40, 309, 1505, 364, "#eaf0e9", "#d1dfd6")
text(62, 322, "平台 → 信息获取方式", 25, TEAL)
text(385, 324, "SC = ScrapeCreators（第三方采集） · CLI = 命令行工具 · 按配置启用", 21, MUTED)

groups = [
    ("社区与代码", [
        "Reddit：RSS / 页面 + Arctic Shift",
        "Reddit 备援：SC API",
        "Hacker News：Algolia API",
        "GitHub：REST API（Token 可选）",
    ]),
    ("视频与第三方采集", [
        "YouTube：yt-dlp；SC 备援",
        "TikTok / Instagram：SC API",
        "LinkedIn / Threads / Pinterest：SC API",
        "Telegram：SC API（指定公开频道）",
    ]),
    ("登录会话与接口", [
        "X：Bird Cookie / API / OAuth",
        "Bluesky：AT Protocol + 应用密码",
        "Truth Social：API + Token",
        "小红书：本地已登录 MCP 的 HTTP 接口",
    ]),
    ("新闻、论文与市场", [
        "Digg / arXiv / Techmeme：专用 CLI",
        "Polymarket：Gamma API",
        "StockTwits / DripStack：公开 API",
    ]),
    ("评价与补充资料", [
        "Trustpilot：trustpilot-pp-cli",
        "Amazon：Bright Data CLI",
        "招聘页：公开 ATS API / 网页",
        "本地文档：文件读取 / PDF 提取",
    ]),
    ("网页与检索服务", [
        "普通网页：宿主搜索 / 搜索 API",
        "无密钥：DuckDuckGo / SearXNG 检索",
        "网页正文兜底：Jina Reader",
        "Perplexity：自身 API / OpenRouter",
    ]),
]
for i, (heading, lines) in enumerate(groups):
    col, row = i % 3, i // 3
    x, y = 63 + col*502, 365 + row*154
    text(x, y, heading, 23, TEAL)
    for j, value in enumerate(lines):
        font = ImageFont.truetype(FONT, 22*S)
        assert draw.textlength(value, font=font) <= 471*S, value
        text(x, y+31+j*26, value, 22, INK)
for x in (549, 1051):
    line([(x, 365), (x, 655)], color="#c8d8ce", width=1, arrow=False)

# The main execution path wraps at the right: read the second row right to left.
line([(1545, 205), (1574, 205), (1574, 765), (1545, 765)])
stage(1095, 698, 450, 5, "获得反馈", ["搜索定位内容，再补取详情", "正文 / 评论 / 字幕 / 链接与指标"], dark=True)
stage(568, 698, 450, 6, "清洗与整理", ["统一字段、日期处理、去重", "筛选、排序、聚类，保留来源"], dark=True)
stage(40, 698, 450, 7, "模型总结与展示", ["归纳发现、回答问题、引用证据", "简报 / 对比表 / JSON / HTML"], dark=True)
line([(1088, 765), (1025, 765)])
line([(560, 765), (497, 765)])

text(42, 857, "平台与取数方式预先实现；模型结合规则安排查询；程序收集证据；模型生成回答。", 22, TEAL)
image.resize((W, H), Image.Resampling.LANCZOS).save(HERE / "question-to-report.png", optimize=True)
print(HERE / "question-to-report.png")
