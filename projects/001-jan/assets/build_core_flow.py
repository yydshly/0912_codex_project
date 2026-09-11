"""Original Jan core-flow diagram; Python 3.10+, Pillow, CJK fonts required."""
from pathlib import Path
from html import escape
import math
from PIL import Image, ImageDraw, ImageFont

OUT = Path(__file__).resolve().parent
W, H = 2560, 1870
INK, MUTED = '#142B45', '#52677D'
BLUE, PURPLE, ORANGE = '#256BB1', '#7A5BA7', '#B8681E'
im = Image.new('RGB', (W, H), '#F1F5F9')
d = ImageDraw.Draw(im)
svg = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">',
       '<title>Jan：基础链路与扩展模块关系图</title>',
       '<desc>用户输入、组织上下文、模型适配、模型推理和反馈处理构成主链路。工具和子Agent形成回路；记忆、文件、模型资源与交付模块提供支撑。</desc>']
fonts = {}

def text(x,y,s,size=28,color=INK,bold=False):
    key=(size,bold)
    if key not in fonts:
        fonts[key]=ImageFont.truetype('C:/Windows/Fonts/msyhbd.ttc' if bold else 'C:/Windows/Fonts/msyh.ttc',size)
    d.text((x,y),s,font=fonts[key],fill=color,anchor='lt')
    svg.append(f'<text x="{x}" y="{y}" dominant-baseline="text-before-edge" font-family="Microsoft YaHei, Noto Sans CJK SC, sans-serif" font-size="{size}" font-weight="{700 if bold else 400}" fill="{color}">{escape(s)}</text>')

def rect(x,y,w,h,fill,r=16,stroke=None):
    d.rounded_rectangle((x,y,x+w,y+h),r,fill=fill,outline=stroke,width=2)
    svg.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}" fill="{fill}"'+(f' stroke="{stroke}" stroke-width="2"' if stroke else '')+'/>')

def line(points,color=BLUE,width=5,dash=False,arrow=True):
    if dash:
        for a,b in zip(points,points[1:]):
            dx,dy=b[0]-a[0],b[1]-a[1]
            length=math.hypot(dx,dy)
            for pos in range(0,int(length),20):
                end=min(pos+11,length)
                if length:
                    d.line((a[0]+dx*pos/length,a[1]+dy*pos/length,a[0]+dx*end/length,a[1]+dy*end/length),fill=color,width=width)
    else:
        d.line(points,fill=color,width=width,joint='curve')
    path=' '.join(f'{x},{y}' for x,y in points)
    svg.append(f'<polyline points="{path}" fill="none" stroke="{color}" stroke-width="{width}" stroke-linejoin="round"'+(' stroke-dasharray="11 9"' if dash else '')+'/>')
    if arrow:
        a,b=points[-2:]
        angle=math.atan2(b[1]-a[1],b[0]-a[0])
        tri=[b,(b[0]-19*math.cos(angle)+9*math.sin(angle),b[1]-19*math.sin(angle)-9*math.cos(angle)),(b[0]-19*math.cos(angle)-9*math.sin(angle),b[1]-19*math.sin(angle)+9*math.cos(angle))]
        d.polygon(tri,fill=color)
        svg.append('<polygon points="'+' '.join(f'{x:.1f},{y:.1f}' for x,y in tri)+f'" fill="{color}"/>')

def label(x,y,s,color=PURPLE,size=25):
    f=ImageFont.truetype('C:/Windows/Fonts/msyh.ttc',size)
    w=d.textlength(s,font=f)
    rect(x-9,y-5,w+18,size+13,'#F1F5F9',5)
    text(x,y,s,size,color)

def card(x,y,w,h,title,lines,color=PURPLE,fill='#FFFFFF',ts=32):
    rect(x,y,w,h,fill,18,'#D5DFEA')
    rect(x,y,7,h,color,3)
    text(x+25,y+24,title,ts,color,True)
    for i,s in enumerate(lines):
        text(x+25,y+87+i*46,s,27,MUTED)

rect(0,0,W,H,'#F1F5F9',0)
rect(0,0,W,180,'#142B45',0)
text(60,25,'JAN / 架构关系图',25,'#A7C5E4',True)
text(60,67,'以基础链路为核心，看清每个模块的作用',51,'#FFFFFF',True)
text(62,140,'模型提供理解、生成与决策；Jan 组织上下文、管理运行并执行操作。',27,'#D3E2F0')
line([(1775,57),(1845,57)],'#8DC6FF',5)
text(1865,41,'主链路',27,'#FFFFFF')
line([(2045,57),(2115,57)],'#BCA6DD',4,True)
text(2135,41,'支撑 / 记录',27,'#FFFFFF')
line([(1775,118),(1845,118)],'#F4B56D',5)
text(1865,102,'Agent 执行循环（按需）',27,'#FFFFFF')

# The saved conversation feeds the next turn, not every optional module.
line([(2280,265),(2280,220),(940,220),(940,265)],PURPLE,4,True)
label(1250,203,'保存的会话 → 供下一轮组装上下文',PURPLE,26)
card(60,265,420,265,'入口与工作空间',[
    '桌面：窗口 / 主题 / 语言',
    '业务：会话 / 助手 / 项目',
    '外部：CLI / 本地 API'])
card(550,265,780,265,'上下文从哪里来？',[
    '会话历史、角色指令、项目说明 → 组织输入',
    '项目文件 → 解析 / 分块 / 检索 → 相关片段',
    '长期记忆、技能说明 → 按需检索或加载'])
card(1430,265,540,265,'模型怎样准备好？',[
    '本地：下载 / 续传 / 校验 / 导入',
    '运行：硬件适配 / 加载 / 卸载',
    '云端：配置可访问的模型服务'])
card(2070,265,430,265,'输出呈现与记录',[
    '流式文字、文件与产物卡片',
    '显示工具进度与错误信息',
    '保存会话；按配置写入记忆'])

rect(30,660,2500,670,'#FFFFFF',24,'#D5DFEA')
line([(270,530),(270,720)],PURPLE,4,True)
label(185,603,'组织输入')
line([(940,530),(940,575),(725,575),(725,720)],PURPLE,4,True)
label(634,603,'提供上下文')
line([(1700,530),(1700,720)],PURPLE,4,True)
label(1594,603,'准备模型运行')
line([(2285,720),(2285,530)],PURPLE,4,True)
label(2200,603,'展示与保存')

text(62,936,'蓝色主链路：普通聊天的一次交互',25,BLUE,True)
nodes=[(60,420,'01  用户输入',['提问、任务、附件','也可来自外部程序']),
       (550,350,'02  组织上下文',['当前输入 + 必要信息','筛选 / 召回 / 压缩']),
       (1000,350,'03  模型适配',['选择模型、转换请求','参数、能力与协议适配']),
       (1450,520,'04  大模型推理',['本地：llama.cpp / MLX 运行模型','或云端：通过 API 调用模型']),
       (2070,430,'05  处理模型反馈',['直接回答 → 展示并保存','工具请求 → 进入下方循环'])]
for x,w,title,lines in nodes:
    card(x,720,w,180,title,lines,BLUE,'#EAF3FC',34)
for a,b in [(480,550),(900,1000),(1350,1450),(1970,2070)]:
    line([(a,810),(b,810)],BLUE,6)

text(62,977,'为什么还需要其他模块？',31,INK,True)
text(62,1039,'提供信息：文件、记忆、检索',28,MUTED)
text(62,1090,'提供行动：工具、子 Agent',28,MUTED)
text(62,1141,'保障可用：下载、存储、升级',28,MUTED)
text(62,1213,'普通聊天可跳过橙色执行循环。',26,ORANGE,True)

card(1000,1050,350,220,'执行结果回传',[
    '工具数据、执行状态',
    '子任务结果、错误信息'],ORANGE,'#FFF5E8',32)
card(1450,1050,520,220,'工具与子 Agent 执行',[
    '权限检查 → MCP / 本地工具',
    '文件读写、命令、网页搜索',
    '子 Agent：派发 / 排队 / 回收'],ORANGE,'#FFF5E8',32)
card(2070,1050,430,220,'Agent 执行编排',[
    '解析模型提出的操作',
    '协调授权、取消与进度',
    '决定继续执行或结束'],ORANGE,'#FFF5E8',32)
line([(2285,900),(2285,1050)],ORANGE,6)
label(2305,962,'需执行操作',ORANGE,25)
line([(2070,1160),(1970,1160)],ORANGE,6)
line([(1450,1160),(1350,1160)],ORANGE,6)
line([(1000,1160),(725,1160),(725,900)],ORANGE,6)
label(762,1116,'追加结果',ORANGE,26)
label(738,961,'再次调用模型',ORANGE,26)

# Shared infrastructure underpins the entire Jan application.
rect(30,1430,2500,330,'#E4ECF5',22,'#D5DFEA')
text(62,1452,'共同支撑层  /  保障整条链路可用、可维护',30,INK,True)
line([(1280,1430),(1280,1330)],'#72859B',4,True)
label(1310,1364,'共同支撑，并非每轮对话都执行','#52677D',27)
card(60,1520,565,210,'文件与业务数据',[
    '文件读写 / 附件归属 / 数据目录',
    '会话和设置持久化 / 数据迁移'], '#4D6D99',ts=31)
card(685,1520,565,210,'服务抽象与扩展',[
    'ServiceHub 屏蔽平台差异',
    '扩展注册 / 加载 / 生命周期'], '#4D6D99',ts=31)
card(1310,1520,565,210,'配置与凭据管理',[
    '模型参数 / 服务地址 / 运行配置',
    '系统凭据库 / 设置存储'], '#4D6D99',ts=31)
card(1935,1520,565,210,'升级、日志与发布',[
    '应用更新：检查 / 下载 / 安装 / 重启',
    '日志 / 自动化测试 / 跨平台打包'], '#4D6D99',ts=31)
text(60,1793,'阅读方式：先沿蓝色看主链路，再看紫色支撑，最后看橙色循环。各扩展按任务需要启用。',27,INK,True)
text(60,1837,'依据：janhq/jan · f4c46fe｜原创概念架构图，非逐函数调用图；静态源码研究，未运行验证。',24,MUTED)

svg.append('</svg>')
im.save(OUT/'core-flow-architecture.png',optimize=True)
(OUT/'core-flow-architecture.svg').write_text('\n'.join(svg),encoding='utf-8')
print(f'Rendered core flow: {W} x {H}')
