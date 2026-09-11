"""Original capability map. Python 3.10+, Pillow, Microsoft YaHei fonts required."""
from pathlib import Path
from html import escape
from PIL import Image, ImageDraw, ImageFont

OUT = Path(__file__).resolve().parent
SHA = 'f4c46fefc64f88adaca24d63541873f1e318a04b'
BASE = f'https://github.com/janhq/jan/tree/{SHA}/'
W, H = 1920, 2040
BG, INK, MUTED = '#F3F6FA', '#15283E', '#52647A'
FONT = Path('C:/Windows/Fonts/msyh.ttc')
BOLD = Path('C:/Windows/Fonts/msyhbd.ttc')
if not FONT.exists():
    raise RuntimeError('Set FONT and BOLD to installed CJK fonts before rendering.')

# name, two capability lines, reference value, upstream location, priority
groups = [
 ('01', '交互与工作空间', '用户怎样使用 AI', '#3267AD', [
  ('桌面外壳与交互', '窗口、主题、语言、托盘', '文件对话框、链接唤起', '跨平台桌面应用骨架', 'web-app/src/services', False),
  ('会话、助手与项目', '消息历史、角色指令', '项目组织、共享资料', '业务对象与状态管理', 'src-tauri/src/core/threads', False),
  ('附件与结果呈现', '聊天附件、项目文件', '多模态输入、产物卡片', '输入处理与结果展示', 'web-app/src/services/uploads', False),
 ]),
 ('02', '模型与任务编排', '决定调用谁、怎样继续', '#7954B2', [
  ('多模型适配', '本地 / 云端统一入口', '能力差异、参数与流式响应', '隔离模型供应商差异', 'web-app/src/lib/model-factory.ts', True),
  ('Agent 执行循环', '模型 → 工具 → 结果回传', '进度事件、取消、上下文压缩', '执行逻辑与界面分离', 'src-tauri/src/core/agent/loop.rs', False),
  ('子 Agent、记忆与技能', '后台派发、并发排队、结果回收', '角色定义、工具白名单、技能', '多 Agent 生命周期管理', 'src-tauri/src/core/agent/subagent.rs', False),
 ]),
 ('03', '工具与知识接入', '让模型使用外部能力', '#147E83', [
  ('MCP 工具连接', '工具发现、调用、进度与取消', '连接配置、认证与授权', '标准化外部系统接入', 'src-tauri/src/core/mcp', True),
  ('本地工具与执行边界', '文件读写、命令、网页工具', '工作区路径、权限与隔离', '给 Agent 可控的执行环境', 'src-tauri/plugins/tauri-plugin-agent-tools/src', False),
  ('文档解析与检索', '文档解析、分块、索引', '相关片段检索与上下文注入', '把项目资料接入对话', 'extensions/rag-extension/src', False),
 ]),
 ('04', '模型资源与运行', '让模型下载并运行起来', '#AF6B24', [
  ('下载与资源管理', '任务进度、暂停、续传、取消', '镜像回退、文件大小 / 哈希校验', '大文件下载状态机', 'src-tauri/src/core/downloads', True),
  ('模型与推理引擎', '模型导入、元数据、加载 / 卸载', 'llama.cpp、MLX 与运行参数', '管理模型资源生命周期', 'src-tauri/plugins/tauri-plugin-llamacpp', False),
  ('硬件与运行环境', 'CPU、GPU、内存信息', '设备适配与资源状态', '硬件感知的运行配置', 'src-tauri/plugins/tauri-plugin-hardware', False),
 ]),
 ('05', '本地数据与架构基础', '管理文件、状态和模块边界', '#4D6D99', [
  ('文件系统与数据目录', '文件读写、目录、移动、删除', '路径处理、解压、数据位置', '集中封装系统文件操作', 'src-tauri/src/core/filesystem', True),
  ('持久化、设置与凭据', '会话文件、设置存储与迁移', '延迟合并写入、系统凭据库', '区分业务数据与敏感配置', 'src-tauri/src/core/app/settings_store.rs', False),
  ('服务抽象与扩展注册', 'ServiceHub 屏蔽平台差异', '扩展注册、加载与生命周期', '业务功能与平台实现解耦', 'web-app/src/services/index.ts', True),
 ]),
 ('06', '交付、开放与维护', '把程序做成可持续使用的产品', '#665C83', [
  ('应用升级', '版本检查、下载进度、安装', '重启流程、更新源回退', '桌面软件持续交付机制', 'web-app/src/services/updater', True),
  ('本地 API 与 CLI', 'HTTP 服务、模型路由与协议转换', '命令行复用后端能力', '同一核心支持多种入口', 'src-tauri/src/core/server', False),
  ('日志、测试与发布', '应用日志、日志轮转、错误定位', '自动化测试、跨平台打包', '可诊断、可验证、可交付', '.github/workflows', False),
 ]),
]

im = Image.new('RGB', (W, H), BG)
draw = ImageDraw.Draw(im)
svg = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">',
       '<title>Jan 能力模块架构图</title>',
       '<desc>基于固定提交的六大能力域、十八个源码研究入口。</desc>']

def rect(x, y, w, h, fill, radius=0, stroke=None):
    draw.rounded_rectangle((x, y, x+w, y+h), radius=radius, fill=fill, outline=stroke, width=1)
    svg.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{radius}" fill="{fill}"' +
               (f' stroke="{stroke}"' if stroke else '') + '/>')

def text(x, y, s, size=26, color=INK, bold=False):
    f = ImageFont.truetype(str(BOLD if bold else FONT), size)
    draw.text((x, y), s, font=f, fill=color, anchor='lt')
    svg.append(f'<text x="{x}" y="{y}" dominant-baseline="text-before-edge" font-family="Microsoft YaHei, Noto Sans CJK SC, sans-serif" font-size="{size}" font-weight="{700 if bold else 400}" fill="{color}">{escape(s)}</text>')

rect(0, 0, W, H, BG)
rect(0, 0, W, 216, '#15283E')
text(64, 32, 'JAN / 开源项目架构研究', 22, '#A5C3E2', True)
text(64, 73, '能力模块架构图', 56, '#FFFFFF', True)
text(66, 155, '六大能力域 · 18 个研究入口｜按职责归纳，并非 18 个独立服务', 27, '#D8E4F0')
rect(1558, 71, 293, 56, '#DDF3EC', 12)
text(1581, 85, '优先 = 通用架构参考', 23, '#186A54', True)

for gi, (num, title, sub, color, items) in enumerate(groups):
    y = 243 + gi * 258
    rect(48, y, 1824, 237, '#FFFFFF', 18, '#DCE4ED')
    rect(48, y, 9, 237, color, 4)
    text(77, y+21, num, 33, color, True)
    text(77, y+78, title, 30, INK, True)
    text(77, y+135, sub, 21, MUTED)
    for j, (name, a, b, value, source, priority) in enumerate(items):
        x = 432 + j * 476
        rect(x, y+17, 452, 203, '#F6F8FB', 12)
        kind = 'blob' if Path(source).suffix else 'tree'
        link = f'https://github.com/janhq/jan/{kind}/{SHA}/{source}'
        svg.append(f'<a href="{escape(link)}" target="_blank">')
        text(x+20, y+36, name, 27, INK, True)
        text(x+20, y+86, a, 23, MUTED)
        text(x+20, y+122, b, 23, MUTED)
        text(x+20, y+168, '参考：' + value, 22, color, True)
        svg.append('</a>')
        if priority:
            rect(x+369, y+23, 67, 30, '#DDF3EC', 6)
            text(x+379, y+27, '优先', 19, '#186A54', True)

rect(48, 1812, 1824, 104, '#E5EDF6', 16)
text(77, 1832, '关键关系', 25, '#3267AD', True)
text(245, 1831, '界面 / CLI / API 入口  →  服务与编排  →  模型、工具、文件和存储', 28, INK, True)
text(245, 1873, '模型下载 ≠ 应用升级；文件存储 ≠ 文档检索；角色配置 ≠ 子 Agent 调度。', 23, MUTED)
text(64, 1943, '研究依据：janhq/jan · f4c46fe · 2026-09-11｜源码静态核查，未做运行或安全验证。', 23, MUTED)
text(64, 1982, '当前开发分支已含子 Agent 实现；预览能力与稳定版可能不同。SVG 中模块名称可点击打开源码。', 22, MUTED)
svg.append('</svg>')
im.save(OUT / 'capability-architecture.png', optimize=True)
(OUT / 'capability-architecture.svg').write_text('\n'.join(svg), encoding='utf-8')
print(f'Rendered {W}x{H}: capability-architecture.png and .svg')
