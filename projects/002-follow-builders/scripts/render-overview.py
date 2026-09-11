"""生成本研究原创流程图；仅使用矢量形状和文字，不包含第三方图片。"""
from pathlib import Path
import argparse
from PIL import Image, ImageDraw, ImageFont

parser = argparse.ArgumentParser()
parser.add_argument('--font', default='C:/Windows/Fonts/msyh.ttc', help='支持简体中文的字体文件')
args = parser.parse_args()
if not Path(args.font).exists():
    parser.error('找不到中文字体，请用 --font 指定字体文件')

S = 2
W, H = 1600, 1040
canvas = Image.new('RGB', (W * S, H * S), '#F3F4EF')
d = ImageDraw.Draw(canvas)
ink, muted, teal, border = '#172F36', '#586B70', '#087D72', '#D7DFD8'

def font(n):
    return ImageFont.truetype(args.font, n * S)

def txt(x, y, text, size=24, fill=ink):
    d.text((x*S, y*S), text, font=font(size), fill=fill)

def box(x, y, w, h, fill, outline=None, radius=20):
    d.rounded_rectangle((x*S, y*S, (x+w)*S, (y+h)*S), radius=radius*S,
                        fill=fill, outline=outline, width=2*S)

txt(62, 42, 'OPEN SOURCE RESEARCH  /  002', 20, teal)
txt(60, 86, 'Follow Builders', 65)
txt(63, 177, '从一手来源到可追溯的研究简报', 32)
box(1190, 62, 350, 94, '#E2ECE6')
txt(1212, 76, '研究版本  c8da0e7', 25, teal)
txt(1212, 116, '研究日期  2026-09-11', 19, muted)

box(60, 249, 1480, 98, '#FFFFFF', border)
for x, number, label in [(90, '26', '个 X 账号'), (450, '6', '个播客'), (795, '2', '个官方博客')]:
    txt(x, 262, number, 42, teal)
    txt(x+82, 278, label, 25)
txt(1170, 271, '人工策展的来源名单', 23)
txt(1170, 305, '配置数量 ≠ 当日更新数量', 17, muted)

cards = [
    ('01 / INPUT', '精选来源', ['人物动态、节目与文章', '维护者确定采集范围', '用户提供语言和阅读偏好']),
    ('02 / COLLECT', '中心采集', ['API / RSS / 网页解析', '时间窗口、限量与去重', '发布三个公开 JSON feed']),
    ('03 / EDIT', '个性化整理', ['读取内容、配置和规则', '宿主 AI 生成摘要与翻译', '附原文链接，说明局限']),
    ('04 / DELIVER', '交付与研究', ['聊天 / Telegram / 邮件', '发现线索，回到原文查证', '进入开源项目研究流程']),
]
for i, (label, title, lines) in enumerate(cards):
    x = 60 + i*385
    box(x, 391, 325, 262, '#FFFFFF', border)
    txt(x+24, 411, label, 18, teal)
    txt(x+24, 453, title, 34)
    for j, line in enumerate(lines):
        txt(x+24, 518+j*35, line, 21, muted)
    if i < 3:
        ay = 513*S
        d.line(((x+335)*S, ay, (x+371)*S, ay), fill=teal, width=3*S)
        d.polygon([((x+371)*S, ay), ((x+361)*S, ay-7*S), ((x+361)*S, ay+7*S)], fill=teal)

box(60, 695, 1480, 112, '#173D42')
txt(84, 714, '已核对快照', 21, '#AFE2CB')
txt(84, 751, '14 位作者 · 28 条动态', 27, '#FFFFFF')
txt(590, 717, '播客 0 集 · 博客 0 篇', 26, '#FFFFFF')
txt(590, 759, '单批为空，不代表长期无内容', 19, '#C3D9D6')
txt(1180, 719, '数据时间  09-10', 22, '#FFFFFF')
txt(1180, 758, '06:40 UTC 左右', 19, '#C3D9D6')

txt(63, 843, '后续完善', 25)
txt(224, 850, '建设建议 · 尚未实现', 18, muted)
for i, label in enumerate(['历史存储与真正周报', '完整自动摘要与重试', '来源配置与主题筛选', '证据追踪与发送回执']):
    x = 60 + i*385
    box(x, 893, 325, 59, '#E3EBDF')
    txt(x+22, 907, label, 22, '#385643')

txt(63, 992, '原创研究流程图，非上游产品截图。依据：zarazhangrui/follow-builders 固定提交与公开 feed。', 17, muted)
output = Path(__file__).resolve().parents[1] / 'assets' / 'cover.png'
canvas.resize((W, H), Image.Resampling.LANCZOS).save(output, optimize=True)
print(output)
