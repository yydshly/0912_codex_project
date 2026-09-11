# 多项目 Web 演示部署约定

当前仅初始化研究仓库，尚无 Web 演示、构建流程或已发布站点。本文件约定后续目录和地址组织方式。

## 源码与入口

每个需要演示的项目将源码放在 `projects/NNN-slug/web/`，独立记录依赖、安装命令、启动命令、构建命令及产物目录。没有演示需求的项目可以保留说明或删除空的 `web/` 模板目录。

演示上线后，在根 README 和对应子项目 README 填写实际可访问的链接。GitHub 仓库中的 README 负责研究说明，Web 演示负责交互体验。

## GitHub Pages 路径规划

GitHub Pages 用于静态站点，每个仓库最多对应一个 Pages 站点，因此本仓库的多个演示规划为同一站点下的不同子路径。[官方说明](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages)

| 用途 | 规划路径（尚未部署） |
| :--- | :--- |
| 演示总入口 | `https://yydshly.github.io/0912_codex_project/` |
| 001 号项目示例 | `https://yydshly.github.io/0912_codex_project/001-project-name/` |
| 002 号项目示例 | `https://yydshly.github.io/0912_codex_project/002-project-name/` |

后续配置部署时，将每个项目的静态构建结果汇总为一个发布目录，再统一发布：

```text
_site/                       # 生成目录，不提交到源码仓库
├── index.html               # 有序演示入口
├── 001-project-name/        # 第一个 Web 的静态产物
└── 002-project-name/        # 第二个 Web 的静态产物
```

## 接入演示时检查

1. 根据实际技术栈配置 `/0912_codex_project/NNN-slug/` 基础路径，确保图片、脚本和样式在子路径下可加载。
2. 单页应用选择适合静态托管的路由方式，验证刷新和直接打开内部页面的行为。
3. 汇总所有要发布的子项目，再通过统一发布流程更新整个站点，避免仅发布一个项目时遗漏其他演示。
4. 需要后端或私密凭据的功能使用独立服务，前端仅连接公开接口；Pages 不承载这些后端进程。
5. 验证演示入口与主要功能后，再将地址标记为「已部署」。使用其他托管服务时，在项目内记录实际地址与更新方法。

具体构建工具、工作流和托管设置，在首个 Web 项目明确后配置。

[返回首页](../README.md)
