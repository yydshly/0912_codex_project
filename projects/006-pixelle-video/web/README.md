# 本地运行与复现

本目录提供真实上游调用脚本，不是仿制网页。原版应用运行在 <http://127.0.0.1:8506>，历史页 <http://127.0.0.1:8506/History>。该地址仅在本机服务运行时有效，未发布公网。

## 获取与依赖

在本子项目目录执行：

```powershell
git -c core.autocrlf=false clone https://github.com/ATH-MaaS/Pixelle-Video.git .upstream/Pixelle-Video
Set-Location .upstream/Pixelle-Video
git checkout 848b054e4fae40dabc62ec58e960b573e83793ac
uv sync --python 3.12
.venv/Scripts/python.exe -m playwright install chromium
```

要求 FFmpeg / ffprobe 在 PATH。此次环境为 Windows、Python 3.12.13、FFmpeg 6.1.3。上游源码保留许可证，仅存放在被忽略的 `.upstream/`；不将第三方仓库整体提交。

## 生成同一演示

从上游目录执行：

```powershell
.venv/Scripts/python.exe ../../web/run-cafe-demo.py
.venv/Scripts/python.exe -m streamlit run web/app.py --server.address 127.0.0.1 --server.port 8506 --server.headless true --browser.gatherUsageStats false
```

[run-cafe-demo.py](run-cafe-demo.py) 读取本项目 assets 中已生成的两张图片，不调用图像模型接口；通过上游 `PixelleVideoCore.frame_processor` 实际执行 TTS、模板和片段合成，`VideoService.concat_videos` 拼接，再通过原生 PersistenceService 保存历史。

需要网络访问 Edge TTS；上游 HTML 字体也可能联网加载。脚本不包含密钥。再次执行会更新同一个 `codex-cafe-demo` 演示任务。

最终视频保存于 [assets/cafe-demo.mp4](../assets/cafe-demo.mp4)，原始分镜及历史在上游 `output/codex-cafe-demo/`。停止终端内服务用 Ctrl+C；当前后台服务可通过本目录 [stop-local.ps1](stop-local.ps1) 按监听端口核对后停止。

这不构成完整的“一句话全自动生成”验证：Codex 在应用之外提供了文案和图片。应用页面中未配置的模型按钮仍然需要真实服务配置。
