# 验证记录

日期：2026-09-11。此记录仅覆盖本研究文档与 Web 说明页。

## 执行方式

```text
python build.py
python check.py
node --check app.js
```

检查包括：Markdown 相对文件、生成网页的本地资源与锚点、重复 ID、图片替代文本、根索引编号顺序，以及原创 SVG 的 XML 结构。HTTP 请求另检查页面和资源能否正常返回。

## 已执行结果

- Python 3.10 环境下使用 Markdown 3.10.2 成功构建。
- 6 个 HTML 页面及其本地网页引用、源 Markdown 相对文档引用检查通过（具体计数随根目录中其他研究项目增减）；无缺失文件、失效站内锚点或重复 ID。
- 生成页面中的图片具有非空替代文本；两张原创引导图 / 系统图通过 XML 解析。
- `node --check app.js` 语法检查通过。
- 本地首页 HTTP 返回 200；资源与辅助页面请求检查通过。

## 范围限制

未执行浏览器视觉与真实点击测试；响应式布局由样式实现，不能将静态检查视为不同设备上的实测。未执行 ESP-IDF 编译、烧录、接线、后端调用或音频性能测试。页面交互仅显示教学文字，无硬件和 AI 网络调用。

## 发布状态

已部署至 [小智 ESP32 在线研究页面](https://yydshly.github.io/0912_codex_project/004-xiaozhi-esp32/)。2026-09-11 首次 [GitHub Actions 发布](https://github.com/yydshly/0912_codex_project/actions/runs/34559654464)成功；远端使用 Python 3.12 构建与检查通过。

在线校验覆盖总入口、6 个项目 HTML 页面、CSS、JavaScript、6 张图片 / 图解及上游许可证，共 16 个文件。全部返回 HTTP 200，内容与发布源码的构建结果一致；文本校验仅归一化 Windows / Linux 换行。PNG 引导图也已进行独立图像查看，文字与框线完整；这不等于浏览器布局或交互测试。

在发布提交对应的干净检出中完成各项目构建后，于仓库根目录执行 `python scripts/build_pages.py` 和 `python scripts/check_pages.py`，可复查线上文件。应使用与线上同一版本、同一站点清单的源码，避免把未发布的本地草稿与线上比较。后续部署记录见 [发布工作流历史](https://github.com/yydshly/0912_codex_project/actions/workflows/pages.yml)。

[返回 Web 说明](README.md)
