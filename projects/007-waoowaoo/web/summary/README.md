# 四个 AI 视频项目 · 理解汇总网页

把本次讨论整理为一页中文研究网页，比较 Pixelle-Video、waoowaoo、火宝短剧和 Toonflow 的能力、原理、交互对象、实际效果、使用场景及扩展方向。点击四个项目卡片切换详情。

本机预览：<http://127.0.0.1:8767/>。这是本地研究页面，尚未发布到公网；不需要模型接口或登录。服务停止后可按下方说明重新启动。

## 运行

在本目录使用 Python 3（仅标准库）：

```powershell
python build.py
python -m http.server 8767 --bind 127.0.0.1 --directory dist
```

浏览器访问上方地址；在服务终端按 Ctrl+C 停止。源码位于 [public/index.html](public/index.html)、[public/style.css](public/style.css) 和 [public/app.js](public/app.js)。构建脚本只复制公开页面与三份明确指定的演示素材，产物 `dist/` 不提交。

## 资料与边界

整理日期：2026-09-11。官方链接固定到研究提交，页面内也保留对应来源入口。

| 项目 | 研究版本 | 证据 |
| :--- | :--- | :--- |
| [Pixelle-Video](https://github.com/ATH-MaaS/Pixelle-Video/tree/848b054e4fae40dabc62ec58e960b573e83793ac) | 0.2.0 / 848b054 | 已用 Codex 文案与图片执行原生配音、模板渲染与视频合成；应用内生成模型未验证 |
| [waoowaoo](https://github.com/waooAI/waoowaoo/tree/6cbbe22cc6492159e0f649d507e4e21a9aec3074) | v0.5.0-beta.1 / 6cbbe22 | 已实测导入、画布、预览、播放与助手素材引用；未发送生成请求 |
| [火宝短剧](https://github.com/chatfire-AI/huobao-drama/blob/27cbab93968971230858149e5be0ff4b2f857c1c/README.md) | 27cbab9 | 核对官方 README 的剧集流程、Agent 分工和技术栈；未本地运行 |
| [Toonflow](https://github.com/HBAI-Ltd/Toonflow-app/blob/e03cf590eb0cab63534a4040db9acb4ec95b42a6/README.md) | e03cf59 | 核对官方 README 的原著改编、编剧 / 生产 Agent 和画布流程；未本地运行 |

使用场景、扩展方向和“小目标逐步推进”等判断属于研究建议，不代表同条件效果评测。没有对画质、速度、成本或角色一致性排名。

## 媒体来源

- 视频与海报：[006 真实成片](../../../006-pixelle-video/assets/cafe-demo.mp4)、[实际成片首帧](../../../006-pixelle-video/assets/composed-frame.png)。14.718667 秒，1920×1080；文案与图片由 Codex 提供，Pixelle 实际执行合成。
- waoowaoo 截图：[原版画布与素材引用](../../assets/canvas-reference.jpg)。画布视频来自 Pixelle，助手中的需求草稿尚未发送。
- 网页预览：[本次汇总页截图](../../assets/four-project-summary.jpg)，原创研究网页实拍。

## 检查记录

已检查页面加载、四项目标签切换、Home 键回到首项、导航及 390px 手机布局无整页横向溢出。真实视频在汇总页内完整播放到 14.718667 秒；静态媒体、HTTP 资源与相关文档的本地链接通过检查。网页没有接入任何生成模型。

[返回 waoowaoo 研究](../../README.md) · [两项目实测对比](../../notes/comparison.md)
