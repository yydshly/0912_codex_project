# Web 说明页

这是本研究的交互阅读页面：AI 产品硬件组成与小智固件能力引导图、真实主板照片、组件说明、音量工具调用流程，以及由项目 README 生成的完整研究正文。它不是 ESP32 模拟器，不会打开麦克风、调用 AI 或控制硬件。

## 本地运行

在本目录使用 Python 3.10 或更新版本：

```text
python -m pip install -r requirements.txt
python build.py
python -m http.server 8764 --bind 127.0.0.1 --directory dist
```

然后访问 `http://127.0.0.1:8764/`。需要退出服务时在对应终端按 Ctrl+C。也可直接打开构建出的 `dist/index.html` 阅读和使用本地交互。

## 文件与更新

- `../README.md`：完整研究内容的唯一正文来源，更新后重新构建。
- `template.html`、`styles.css`、`app.js`：页面结构、响应式样式和教学交互。
- `build.py`：将 Markdown 转换成 HTML，复制本项目图片和文档。
- `requirements.txt`：仅构建需要 Python Markdown；浏览网页无需安装依赖。
- `dist/`：自动生成的静态站点，不提交；图片来源仍以 `../assets/` 为准。
- `.openai/hosting.json`：预留的静态发布目录声明，没有创建或虚构远端项目 ID。

页面使用相对资源路径，可以放到仓库 Pages 的 `/0912_codex_project/004-xiaozhi-esp32/` 子路径。该路径将由 GitHub Actions 发布，首次发布正在验证；本页面没有密钥或运行时后端配置。

## 验证与发布状态

构建、资源与相对链接检查在本次工作中执行；详细最终结果见 [验证记录](validation.md)。可运行 `python check.py` 重复检查。没有请求或执行浏览器视觉 / 交互测试，不把静态检查写成浏览器测试。硬件及后端未实测。

发布方式采用仓库统一的 GitHub Pages。推送到 `main` 后，工作流构建并检查本项目，按仓库站点清单汇总所有已登记页面，再发布。修改正文后无须手工上传 `dist/`；构建产物仅作为 Actions 发布制品，不提交进源码仓库。发布结果以工作流与在线 HTTP 验证为准。

[返回项目说明](../README.md) · [仓库部署约定](../../../docs/DEPLOYMENT.md)
