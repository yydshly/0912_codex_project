# 实验记录

研究日期：2026-09-11。提交：848b054e4fae40dabc62ec58e960b573e83793ac。

## 输入与结果

主题：街角咖啡店。外景、拿铁近景两张 Codex 内置 imagegen 图片，文案三段：

> 清晨的街角，一杯咖啡，给忙碌的生活留一点空白。
> 阳光落在桌边，奶香和咖啡香，让每一口都慢下来。
> 推开门，坐一会儿。今天，从这里开始。

原生模板：`1920x1080/image_full.html`。原生 Edge TTS 女声：`zh-CN-XiaoxiaoNeural`，速度 1.0。

成片 1,305,882 bytes，ffprobe 时长 14.718667 秒，1920×1080，H.264 视频 + AAC 音频。完整 FFmpeg 解码无错误；检查首帧和第 7 秒图像，确认两张图片、中文标题和字幕存在；在原版 Streamlit 历史页实际播放至结尾。

## 关键源码

以下链接固定到研究提交：

- [服务初始化](https://github.com/ATH-MaaS/Pixelle-Video/blob/848b054e4fae40dabc62ec58e960b573e83793ac/pixelle_video/service.py)
- [分镜处理](https://github.com/ATH-MaaS/Pixelle-Video/blob/848b054e4fae40dabc62ec58e960b573e83793ac/pixelle_video/services/frame_processor.py)
- [HTML 渲染](https://github.com/ATH-MaaS/Pixelle-Video/blob/848b054e4fae40dabc62ec58e960b573e83793ac/pixelle_video/services/frame_html.py)
- [视频合成](https://github.com/ATH-MaaS/Pixelle-Video/blob/848b054e4fae40dabc62ec58e960b573e83793ac/pixelle_video/services/video.py)

## 实验问题

直接调用分镜服务时，需要调用方先创建任务 frames 目录；已在演示脚本补齐。素材必须在渲染前存在；最终演示在两图都就绪后重新运行并核对第二镜头。

进程结束后，上游 Playwright / asyncio 在 Windows 偶见清理警告，但本次命令返回成功、MP4 全片解码成功。上游代码没有修改。

未运行图像 API、视频 API、数字人或动作迁移。未注入假模型服务；没有把外部生成图片标成 Pixelle 模型实测。

[返回项目](../README.md)
