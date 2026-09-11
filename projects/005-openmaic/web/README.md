# OpenMAIC 能力展示网页

网页包含可操作的「欧姆定律互动课堂」、六类能力官方示例、技术原理和同类对比。课件真实接入官方 renderer；实验和评分是案例自编程序，角色对话为预设脚本。页面不调用模型，不运行完整 OpenMAIC。

**[在线研究与能力展示](https://yydshly.github.io/0912_codex_project/005-openmaic/)** · [理解汇总](https://yydshly.github.io/0912_codex_project/005-openmaic/docs/understanding.html) · [互动课堂](https://yydshly.github.io/0912_codex_project/005-openmaic/case.html) · [六模块原理](https://yydshly.github.io/0912_codex_project/005-openmaic/docs/module-principles.html)

## 查看与运行

```powershell
python -m pip install -r projects/005-openmaic/web/requirements.txt
npm ci --prefix projects/005-openmaic/web
npm run test:case --prefix projects/005-openmaic/web
python projects/005-openmaic/web/build.py
python projects/005-openmaic/web/check.py
node --check projects/005-openmaic/web/public/app.js
python -m http.server 8765 --bind 127.0.0.1 --directory projects/005-openmaic/web/dist
```

需要 Node.js 22 和 Python 3.12（或兼容版本）。在浏览器打开本地地址 `http://127.0.0.1:8765/case.html` 进入互动课堂，或 `http://127.0.0.1:8765/` 查看总览。这些地址仅在本机服务运行期间有效。

## 页面内容

- 生成与执行实验台（`generation.html`）：六模块共用“输入 → 可编辑产物 → 运行效果”界面；支持示范修改、逐步执行、实验消息控制、规则评分、任务提交，以及下载产物和能力提取说明。
- 首页：六类能力切换，官方静态截图 / 动图与源码流程示意。
- 互动案例：八个环节，同一组电路材料贯穿三页课件、白板、参数实验、预设讨论、测验、设计任务与改课导出。[完整体验路线与实现边界](../notes/05-case-study.md)
- 同类对比：三个主要产品的工作重心，补充 Open Notebook 与 SurfSense。
- 技术原理：原创能力图、内容与动作分离、导演调度与动作执行。
- 扩展方向：可信资料、课堂呈现、学习反馈。
- 十二份参考页面：从项目 Markdown 生成，覆盖理解汇总、研究、来源、对比、案例、六模块底层原理与验证记录。

## 实现与部署

| 项目 | 说明 |
| :--- | :--- |
| 前端 | 总览为 HTML / CSS / JavaScript；课堂使用 React 19、官方 renderer 0.1.6 与 DSL 0.11.1；字体用系统字体，依赖打包在本地 |
| 构建 | Python + Markdown 3.10.2 构建参考文档，并调用 esbuild 与 Tailwind 编译课堂；依赖由 package-lock.json 锁定 |
| 源码 | `public/`、`src/`、`build.py`、`build-case.mjs`、`check.py`、`tests/` |
| 输出 | `dist/`，构建产物不提交 |
| 图片 | 从项目 assets 原样复制，随站点保留上游许可 |
| 依赖许可 | 构建汇总为 `case-dependencies-LICENSE.txt`，打包器保留相应法律注释 |
| 数据 | 学习状态保存在当前浏览器，可下载 Markdown 记录和三页 Slide JSON；不是完整课堂 ZIP |
| 语音 | 使用浏览器 / 系统接口，失败时保留字幕；没有配置上游 TTS |
| 响应式 | 桌面两栏展示，窄屏能力按钮换行，表格独立横向滚动 |
| 动图控制 | 支持收起与播放；减少动态效果偏好下默认不播放动图 |
| 部署基础路径 | `/0912_codex_project/005-openmaic/`；静态资源使用相对路径 |
| 发布状态 | 2026-09-11 已通过 GitHub Pages 发布，工作流成功且主要页面及原理图 HTTP 200；详见验证记录 |
| 验证记录 | [网页验证记录](validation.md) |

按仓库已有[GitHub Pages 部署约定](../../../docs/DEPLOYMENT.md)构建和汇总。本页面只是研究展示；上游完整应用还需要独立后端、模型与可选服务。

## 生成实验台的实现边界

输入使用同一份欧姆定律材料，可修改标题、电压、电阻及对话主题。生成按钮调用本地模板组装示例，未请求模型；产物编辑器可改变输出，点击应用后再执行。JSON 为说明机制的简化协议，不应当作可直接导入上游的完整课程文件。

| 模块 | 实际运行部分 | 与上游的区别 |
| :--- | :--- | :--- |
| 课件 | 官方 renderer 0.1.6 渲染，元素 ID 驱动 spotlight，配合字幕 | 产物来自模板；仅开放文字元素编辑，无上游 TTS |
| 白板 | 简化指令执行器和 SVG 文字画布 | 不运行上游完整白板或 KaTeX 公式组件 |
| 实验 | 编辑后的 HTML / CSS / JS 在 sandbox iframe 中运行；输入事件计算，postMessage 控制 | 模板代码；用 CSP 阻止外部网络，不验证所有编辑后的科学计算 |
| 对话 | 逐轮执行角色与动作脚本，显示导演决策和焦点 | 不调用模型，不运行上游 LangGraph 或 SSE |
| 测验 | 选择题按答案键匹配，数值题按容差评分 | 数值简答是案例规则，不是上游语义评分 |
| 任务 | 保存当前会话的设计提交，按电流与功率约束更新两步任务状态 | 简化 PBL；不调用规划、导师或评价模型，文字理由仅保存 |

示例、编辑与提交只保留在当前页面内，刷新后重置；下载可保存产物。课程标题作为文字处理；课件编辑限制基本文字排版，网页脚本仅进入隔离实验容器。每个模块提供固定上游源码链接和可下载的提取清单。

[返回项目说明](../README.md)
