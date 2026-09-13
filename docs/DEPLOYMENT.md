# 多项目 Web 演示部署约定

本仓库采用 **GitHub Actions 构建 + GitHub Pages 托管**。004 小智 ESP32、005 OpenMAIC、007 AI 视频四项目汇总已发布，并在 2026-09-11 通过远端工作流与在线访问核验；008 RuView 研究汇总于 2026-09-13 发布并核验。

Jan 项目已增加静态研究页面及独立构建说明，尚未发布站点。页面入口和运行方式见 [001 · Jan Web](../projects/001-jan/web/README.md)。本文件继续约定多项目目录和地址组织方式。

## 源码与发布目录

每个项目源码、依赖和构建说明位于 `projects/NNN-slug/web/`。已发布项目统一登记在 [站点清单](web-projects.json)，编号保持稳定；新增项目不覆盖其他项目目录。

| 入口 | 已验证在线地址 |
| :--- | :--- |
| 研究页面总入口 | [研究页面总入口](https://yydshly.github.io/0912_codex_project/) |
| 004 小智 ESP32 | [小智在线研究页面](https://yydshly.github.io/0912_codex_project/004-xiaozhi-esp32/) |
| 005 OpenMAIC | [能力与研究总览](https://yydshly.github.io/0912_codex_project/005-openmaic/) · [欧姆定律互动课堂](https://yydshly.github.io/0912_codex_project/005-openmaic/case.html) |
| 007 AI 视频四项目汇总 | [能力、原理、交互及真实演示](https://yydshly.github.io/0912_codex_project/007-waoowaoo/) |
| 008 RuView | [原理、真实演示依赖、实测边界与日常设备扩展](https://yydshly.github.io/0912_codex_project/008-ruview/) |

004 的源码和运行步骤见 [小智 Web 说明](../projects/004-xiaozhi-esp32/web/README.md)。本地构建后可运行：

```text
python scripts/build_pages.py
python -m http.server 8764 --bind 127.0.0.1 --directory _site
```

`_site/index.html` 为有序总入口；`_site/004-xiaozhi-esp32/` 为项目站点。`_site/` 与各 `dist/` 都是生成目录，不提交；发布使用 Actions 制品。

## 自动更新

1. 在项目目录更新正文、素材与 Web 源码，并执行其构建和必要检查。
2. 推送到 `main` 后，[发布工作流](../.github/workflows/pages.yml)自动构建、校验并汇总所有清单内站点。
3. 汇总脚本会检查全部登记站点是否已构建，缺失时直接失败，避免静默漏发。
4. 工作流通过 `github-pages` 环境发布；也可在 Actions 页面手动运行该工作流。
5. 在工作流成功且 HTTP 访问验证通过后，才将项目和根索引标记为已部署。

GitHub Pages 设置的构建来源应为 GitHub Actions（`build_type=workflow`）。工作流仅请求读取仓库内容、写 Pages 和签发部署身份所需权限。没有自定义域名、付费托管或前端密钥。

发布完成后，可在与线上一致的干净检出中运行 `python scripts/check_pages.py`，检查 HTTP 状态和全部发布文件内容是否与 `_site/` 一致。文本换行会归一化，图片等二进制内容逐字节校验。

## 007 AI 视频四项目汇总

源码为 `projects/007-waoowaoo/web/summary/public`。执行该目录的 `build.py` 和 `check.py`，再汇总到 `_site/007-waoowaoo/`。仅发布研究网页、Pixelle 实际成片和演示截图，原版 Pixelle / waoowaoo 服务仍在本机运行。构建不依赖上游源码、模型服务或本地账号配置。

首次发布于 2026-09-11，[部署工作流成功](https://github.com/yydshly/0912_codex_project/actions/runs/34576193097)，已实际打开在线页面。

## 后续接入新项目

008 RuView 的独立研究汇总登记输出为 `projects/008-ruview/web/dist`，已于 2026-09-13 [首次发布成功](https://github.com/yydshly/0912_codex_project/actions/runs/34757308102)并实际打开。工作流执行 `build_summary.py` 与 `check_summary.py`，只发布说明页面、样式、脚本和图标四个文件；不发布本机 RSSI 服务、原始现场记录或算法运行时。已核验网页总入口与四个静态文件 HTTP 200，内容与本地构建一致。资料、边界与本地入口见[008 Web 说明](../projects/008-ruview/web/README.md)。

005 OpenMAIC 已加入站点清单与构建流程并发布，静态输出为 `projects/005-openmaic/web/dist`，包含能力示例、理解汇总、六模块原理、五产品场景选型，以及 `case.html` 欧姆定律互动课堂。该子项目须先安装自身 npm 依赖；Python 构建会同时调用课堂打包。运行与验证见 [005 Web 说明](../projects/005-openmaic/web/README.md)。基础路径为 `/0912_codex_project/005-openmaic/`。静态案例不调用模型，也不代替完整 OpenMAIC 服务端。

在新子项目保存独立依赖与运行说明，在工作流中增加其构建和检查步骤，再按编号将其静态输出登记到站点清单。汇总脚本只复制构建结果，不统一各项目技术栈。资源使用相对路径，或配置 `/0912_codex_project/NNN-slug/` 基础路径；检查直接访问子页面和刷新行为。

Pages 仅托管静态说明页面，无法在浏览器中运行 ESP32 固件、提供真实设备收音或代替 AI 后端。需要服务器的业务应另行部署。

发布流程依据 [GitHub 自定义 Pages 工作流说明](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)；站点设置依据 [Pages REST API](https://docs.github.com/en/rest/pages/pages)。

[返回首页](../README.md)
