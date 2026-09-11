# 多项目 Web 演示部署约定

本仓库采用 **GitHub Actions 构建 + GitHub Pages 托管**。004 小智 ESP32 是本次登记的静态研究页面；首次发布正在验证，尚未把目标地址标为验证通过。

## 源码与发布目录

每个项目源码、依赖和构建说明位于 `projects/NNN-slug/web/`。已发布项目统一登记在 [站点清单](web-projects.json)，编号保持稳定；新增项目不覆盖其他项目目录。

| 入口 | 发布目标 |
| :--- | :--- |
| 研究页面总入口 | `https://yydshly.github.io/0912_codex_project/` |
| 004 小智 ESP32 | `https://yydshly.github.io/0912_codex_project/004-xiaozhi-esp32/` |

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

## 后续接入新项目

在新子项目保存独立依赖与运行说明，在工作流中增加其构建和检查步骤，再按编号将其静态输出登记到站点清单。汇总脚本只复制构建结果，不统一各项目技术栈。资源使用相对路径，或配置 `/0912_codex_project/NNN-slug/` 基础路径；检查直接访问子页面和刷新行为。

Pages 仅托管静态说明页面，无法在浏览器中运行 ESP32 固件、提供真实设备收音或代替 AI 后端。需要服务器的业务应另行部署。

发布流程依据 [GitHub 自定义 Pages 工作流说明](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)；站点设置依据 [Pages REST API](https://docs.github.com/en/rest/pages/pages)。

[返回首页](../README.md)
