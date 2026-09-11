"""从研究来源目录生成 PNG 与可点击 SVG；原创工程图，不使用第三方图像。"""
from pathlib import Path
import argparse
import json
from html import escape
from PIL import Image, ImageDraw, ImageFont

parser = argparse.ArgumentParser()
parser.add_argument('--font', default='C:/Windows/Fonts/msyh.ttc')
args = parser.parse_args()
if not Path(args.font).exists():
    parser.error('请用 --font 指定支持中文的本地字体')
root = Path(__file__).resolve().parents[1]
catalog = json.loads((root / 'data/source-catalog.json').read_text(encoding='utf-8-sig'))
sources = catalog['sources']
assert len(sources) == 34
W, H, S = 1600, 1550, 2
bg, ink, muted = '#F5F6F2', '#193039', '#526970'
teal, blue, orange = '#087B6A', '#285EAB', '#A66517'
im = Image.new('RGB', (W*S, H*S), bg)
d = ImageDraw.Draw(im)
svg = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}" role="img" aria-labelledby="title desc">',
       '<title id="title">Follow Builders：来源名单、定位方式与获取解析路径</title>',
       '<desc id="desc">26 个 X 账号通过 handle 和 API 获取动态；6 个播客通过 RSS 发现节目、pod2txt 获取转录，YouTube 匹配观看链接；2 个博客通过栏目地址获取正文。三路形成公开 feed，再由宿主 AI 整理。</desc>',
       f'<rect width="{W}" height="{H}" fill="{bg}"/>',
       '<style>text{font-family:"Microsoft YaHei","Noto Sans CJK SC",sans-serif}a:hover text{text-decoration:underline}</style>']

def f(size):
    return ImageFont.truetype(args.font, size*S)

def text(x, y, label, size=23, color=ink, link=None):
    d.text((x*S, y*S), label, font=f(size), fill=color)
    element = f'<text x="{x}" y="{y+size}" font-size="{size}" fill="{color}">{escape(label)}</text>'
    if link:
        element = f'<a href="{escape(link, quote=True)}" target="_blank">{element}</a>'
    svg.append(element)

def rect(x, y, w, h, fill='#FFFFFF', stroke=None, radius=18):
    d.rounded_rectangle((x*S,y*S,(x+w)*S,(y+h)*S), radius=radius*S,
                        fill=fill, outline=stroke, width=2*S)
    svg.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{radius}" fill="{fill}" stroke="{stroke or "none"}" stroke-width="2"/>')

def arrow(x1, y, x2, color):
    d.line((x1*S,y*S,x2*S,y*S), fill=color, width=3*S)
    d.polygon([(x2*S,y*S),((x2-10)*S,(y-6)*S),((x2-10)*S,(y+6)*S)], fill=color)
    svg.append(f'<path d="M{x1},{y} H{x2} M{x2-10},{y-6} L{x2},{y} L{x2-10},{y+6}" fill="none" stroke="{color}" stroke-width="3"/>')

def wrapped(x, y, label, max_width, size=22, color=ink, link=None):
    lines, line = [], ''
    for word in label.split(' '):
        candidate = (line+' '+word).strip()
        if line and d.textlength(candidate, font=f(size)) > max_width*S:
            lines.append(line)
            line = word
        else:
            line = candidate
    if line:
        lines.append(line)
    for i, part in enumerate(lines):
        text(x, y+i*(size+5), part, size, color, link)

text(50, 28, 'FOLLOW BUILDERS  /  SOURCE MAP', 20, teal)
text(48, 72, '来源名单 → 定位 → 获取与解析', 52)
text(51, 150, '34 个具体关注对象：26 个 X 账号、6 个播客节目、2 个博客栏目', 27, muted)
rect(50, 207, 1500, 58, '#E5ECE6', radius=12)
text(71, 222, '名单由作者在 default-sources.json 中集中设置；普通客户端读取采集后的公开 feed。', 22, teal)
text(72, 286, '关注哪些对象', 21, muted)
text(830, 286, '根据什么定位', 21, muted)
text(1132, 286, '如何获取和解析', 21, muted)

# X：列出所有配置名称，账号 handle 作为实际定位字段。
rect(50, 325, 1500, 390, '#FFFFFF', '#D7E4DC')
text(72, 343, '01  X / Twitter · 26 个账号', 29, teal)
accounts = [s for s in sources if s['type'] == 'x']
for i, account in enumerate(accounts):
    col, row = divmod(i, 9)
    text(76+col*247, 397+row*30, account['name'], 21, ink, account['url'])
rect(816, 417, 252, 204, '#EDF5EF', radius=14)
text(838, 440, '账号 handle', 28, teal)
text(838, 490, '例如：karpathy', 21, muted)
text(838, 538, '↓ 解析为 X 用户 ID', 21, teal)
text(838, 577, '个人与组织账号均可', 18, muted)
arrow(775, 521, 803, teal)
arrow(1080, 521, 1117, teal)
text(1132, 424, 'X 官方 API', 29, teal)
text(1132, 477, '获取近期原创动态', 23)
text(1132, 519, '提取正文、作者、时间和链接', 22, muted)
text(1132, 560, '过滤转发 / 回复，按 ID 去重', 21, muted)
text(1132, 619, '输出：feed-x.json', 22, teal)
text(76, 681, '全部名称来自固定来源配置；点击 SVG 中的名称可打开对应来源。', 17, muted)

# 播客：节目 RSS 是发现入口；观看链接与转录获取分开。
rect(50, 735, 1500, 300, '#FFFFFF', '#D5DFEE')
text(72, 754, '02  播客 · 6 个节目', 29, blue)
podcasts = [s for s in sources if s['type'] == 'podcast']
for i, podcast in enumerate(podcasts):
    col, row = divmod(i, 3)
    wrapped(76+col*358, 811+row*63, podcast['name'], 335, 22, ink, podcast['url'])
rect(816, 790, 252, 193, '#ECF1FA', radius=14)
text(838, 811, '节目 RSS URL', 27, blue)
text(838, 859, '发现每一集节目', 21, muted)
text(838, 902, '＋ YouTube 频道 /', 20, blue)
text(859, 933, '播放列表 URL', 20, blue)
arrow(775, 887, 803, blue)
arrow(1080, 887, 1117, blue)
text(1132, 793, 'RSS → 标题、日期、GUID', 23, blue)
text(1132, 839, 'pod2txt → 节目转录文本', 23)
text(1132, 885, 'YouTube → 匹配观看链接', 22, muted)
text(1132, 956, '输出：feed-podcasts.json', 22, blue)
text(76, 1000, '文字内容来自节目转录；YouTube 主要提供对应的观看入口。', 18, blue)

# 博客：栏目页发现文章，正文页专用解析。
rect(50, 1055, 1500, 224, '#FFFFFF', '#E8DECE')
text(72, 1073, '03  博客网站 · 2 个栏目', 29, orange)
blogs = [s for s in sources if s['type'] == 'blog']
for i, blog in enumerate(blogs):
    text(76, 1135+i*49, blog['name'], 26, ink, blog['url'])
text(431, 1141, 'anthropic.com/engineering', 20, muted)
text(431, 1190, 'claude.com/blog', 20, muted)
rect(816, 1103, 252, 132, '#F7F0E5', radius=14)
text(838, 1122, '博客栏目 URL', 27, orange)
text(838, 1173, '定位栏目和文章页面', 20, muted)
arrow(775, 1168, 803, orange)
arrow(1080, 1168, 1117, orange)
text(1132, 1095, '栏目页 → 文章链接', 23, orange)
text(1132, 1139, '正文页 → 结构化数据 / HTML', 21)
text(1132, 1180, '提取标题、正文、日期与链接', 21, muted)
text(1132, 1231, '输出：feed-blogs.json', 21, orange)

text(52, 1310, '三路采集之后，共用后续流程', 24)
nodes = [(50, '三个公开 JSON feed', '中心采集结果，供客户端读取'),
         (575, '宿主 AI 整理', '按用户偏好筛选、摘要与翻译'),
         (1100, '阅读与推送', '聊天 / Telegram / 邮件')]
for x, title, subtitle in nodes:
    rect(x, 1357, 450, 108, '#1B3F45')
    text(x+24, 1371, title, 29, '#FFFFFF')
    text(x+24, 1420, subtitle, 20, '#CDE2DD')
arrow(512, 1410, 562, teal)
arrow(1037, 1410, 1087, teal)
text(52, 1500, '依据：zarazhangrui/follow-builders · c8da0e7 · 2026-09-11 研究。原创源码示意，非实测采集界面。', 18, muted)

svg.append('</svg>')
assets = root / 'assets'
(assets / 'source-map.svg').write_text('\n'.join(svg)+'\n', encoding='utf-8')
im.resize((W,H), Image.Resampling.LANCZOS).save(assets / 'source-map.png', optimize=True)
print(assets / 'source-map.png')
print(assets / 'source-map.svg')
