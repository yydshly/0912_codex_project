# 验证记录与复现

研究日期：2026-09-11；版本：v3.24.0 / `ca9d415e66073b17702f385d6886934097aec0e7`。

## 验证范围

| 项目 | 已执行 | 未执行 |
| :--- | :--- | :--- |
| 源码 | 固定提交的入口、计划 / 数据模型、采集路由、评论 / 字幕、排序 / 聚类、watchlist、导出与分类核对 | 全仓库逐行审计 |
| 程序 | 上游离线质量评估、7 类样例回放、10 项评估测试 | 全量单元测试、真实多平台检索、最终宿主 AI 综合效果测评 |
| 来源 | 从上游 GitHub 获取源码和资料 | 读取个人登录会话、调用付费平台、配置密钥 |
| 输出 | 保存实际回放计划、Agent JSON、引擎文本、评估表 | 把测试样例当作现实新闻或产品研究结论 |
| 周期运行 | 查看调度与通知实现 | 安装 Skill、部署服务、创建定时任务或发送 webhook |

## 环境

Windows / PowerShell；使用 uv 解析上游环境，实际 Python 为 **3.12.13**。项目声明 `requires-python >=3.12`、运行 Python 依赖列表为空，但平台来源可依赖 yt-dlp、外部 CLI、账号、服务和宿主 AI，不能据此宣称运行零依赖。

源码检出位置为工作区之外的临时目录。本项目不提交上游完整仓库、虚拟环境或密钥。[版本声明](https://github.com/mvanhorn/last30days-skill/blob/ca9d415e66073b17702f385d6886934097aec0e7/pyproject.toml)。

## 运行命令

下列 PowerShell 步骤将固定源码取到新临时目录。网络只用于取得源码 / 依赖；评估回放自身不调用真实来源和大模型。

```powershell
$upstreamCheckout = Join-Path $env:TEMP ('last30days-review-' + [guid]::NewGuid().ToString('N'))
git clone https://github.com/mvanhorn/last30days-skill.git $upstreamCheckout
if ($LASTEXITCODE -ne 0) { throw '获取源码失败' }
Set-Location -LiteralPath $upstreamCheckout
git checkout --detach ca9d415e66073b17702f385d6886934097aec0e7
if ($LASTEXITCODE -ne 0) { throw '固定版本失败' }
uv run python tests/eval/harness.py
if ($LASTEXITCODE -ne 0) { throw '离线评估未通过' }
$evalTemp = Join-Path $upstreamCheckout ('pytest-temp-' + [guid]::NewGuid().ToString('N'))
if (Test-Path -LiteralPath $evalTemp) { throw '测试临时目录已存在' }
uv run pytest tests/eval -q --basetemp $evalTemp
if ($LASTEXITCODE -ne 0) { throw '评估测试未通过' }
```

在本机首次测试时，pytest 默认临时目录遇到访问权限问题。改为检出目录内全新、唯一的 `--basetemp` 后，10 项测试全部通过。这是本机临时目录问题，不作为上游检索逻辑失败记录。

## 实测结果

| 样例 | 引用匹配 | 时效符合 | 聚类一致性 | 来源核算 | 确定性 |
| :--- | ---: | ---: | ---: | ---: | ---: |
| breaking-event | 1.000 | 1.000 | 0.533 | 1.000 | 1.000 |
| comparison | 1.000 | 1.000 | 0.833 | 1.000 | 1.000 |
| emerging-event | 1.000 | 1.000 | 1.000 | 1.000 | 1.000 |
| niche | 1.000 | 1.000 | 1.000 | 1.000 | 1.000 |
| non-english-cjk | 1.000 | 1.000 | 1.000 | 1.000 | 1.000 |
| person | 1.000 | 1.000 | 1.000 | 1.000 | 1.000 |
| tech-product | 1.000 | 1.000 | 1.000 | 1.000 | 1.000 |
| 平均 | 1.000 | 1.000 | 0.910 | 1.000 | 1.000 |

实际保存的表格：[offline-eval-results.txt](samples/offline-eval-results.txt)。测试结果：**10 passed**；仅指 `tests/eval`。

指标含义以 [上游评估说明](https://github.com/mvanhorn/last30days-skill/blob/ca9d415e66073b17702f385d6886934097aec0e7/docs/reference/eval.md) 为准：

- 引用匹配：输出 URL 在固定输入中能找到，不衡量原始资料真假。
- 时效符合：被检查的已知日期处于窗口中；未知日期不被误判为过期。
- 聚类一致性：使用实体重合规则，单例聚类通常记为一致；不是人工语义评分。
- 来源核算：样例来源有可用结果或明确状态；不是来源实际召回率。
- 确定性：固定时间、同一输入重复运行得到相同结构；不包含模型随机性。

这套样例规模小，不代表所有来源，也未验证外部 CLI 的实时解析、付费接口、反爬和最终摘要忠实度。上游文档中对样例矩阵的概括较早，本次以实际加载的七类样例为准。

## 样例输出是如何生成的

本次通过上游 `tests/eval/harness.py` 的 `evaluate_all()` 获取报告，对 `tech-product` 的报告调用：

- `schema.to_agent_export(report)` 生成稳定 Agent JSON。
- `render.render_compact(report)` 生成引擎证据文本。
- 从对应 manifest 中单独提取 `plan`，没有复制包含占位凭据的配置对象。

保存内容及许可见 [samples](samples/README.md)。引擎文本里的 `synced` 日期是渲染日期，JSON 的生成时间和研究窗口由测试固定在 2026-07-10，二者用途不同。引擎文本还保留未进行宿主账号 / 社区解析的提示，这是固定回放省略宿主前置步骤的结果。

## 下一阶段的联网验证应看什么

1. 对同一真实主题记录各来源的请求条件、返回数、日期完整度和失败状态。
2. 选出若干结果手工对照原页面，核对正文、评论与字幕是否真实存在。
3. 单独统计「搜索有结果」「正文可读」「评论成功」「字幕成功」，避免只看总结果数。
4. 对比原生免费路径与配置后的备援路径，记录耗时、额度和新增信息价值。
5. 让宿主 AI 综合，再逐条核对结论是否由已取得的证据支持。

以上是后续实验设计，目前未执行，不能填写猜测的准确率、耗时或成本。

[返回项目](../README.md)
