# 实验记录

2026-09-11，提交 6cbbe22cc6492159e0f649d507e4e21a9aec3074，v0.5.0-beta.1。

## 已完成

- 在独立 `.upstream/waoowaoo` 获取上游源码。
- 原机器无 Docker；在已有 Ubuntu 22.04 WSL 中安装 Docker 官方软件包。
- 使用发布版固定镜像摘要，创建独立本地密码，不读取或复用其他项目密钥。
- 依照原版 bootstrap blue 建立 Temporal Current Worker Version。
- MySQL、Redis、Temporal、MinIO、应用、worker 与 Caddy 均已启动；配置健康检查的服务已达到 healthy。
- 通过指定本次公共 CA 的 HTTPS 请求完成真实注册、建项目、上传和资源登记。该方式逐请求验证 TLS，**没有修改 Windows 证书库**。
- 三个媒体资源均为 ready / version 1；重新读取媒体并核对内容 SHA-256，通过。完整非敏感结果见 [import-verification.json](import-verification.json)。

项目 ID：`aab58d7d-638f-4a51-81be-d96a332a0092`。演示账号保存在忽略的 `temp/demo-state.json`，不要提交该文件。

## 浏览器实测与证书授权

安装的 Caddy 创建本地 CA。用户已明确回复“允许”，随后核对 SHA-256 并导入当前 Windows 用户信任库。公共证书位于忽略的 `temp/wao-local-root.crt`，没有导出私钥。

- Subject：Caddy Local Authority - 2026 ECC Root
- SHA-256：`49:5C:4A:C6:76:5B:7D:EF:1D:43:B4:FB:13:8E:23:95:59:D4:06:06:BD:3E:F6:51:D3:FB:DF:BE:A1:B5:4F:06`
- 有效期：2026-09-11 至 2036-07-20

上游 [INSTALL.md](https://github.com/waooAI/waoowaoo/blob/6cbbe22cc6492159e0f649d507e4e21a9aec3074/docs/INSTALL.md) 要求先解释信任影响并获得明确批准；本次已履行。初次导入后，旧浏览器标签仍报告证书不受信任，系统浏览器自动操作工具也曾拒绝继续。后续用户打开的新标签已正常显示登录页；重新连接该页后完成正常登录，没有绕过警告或禁用 TLS 验证。

已在原版浏览器界面实测：登录演示账户、进入咖啡项目、适应画布布局、打开拿铁图片预览、选中图片、点击“和 AI 讨论”，确认助手显示图片引用。已留存两张真实截图。助手输入中保留“镜头缓慢推近、咖啡冒出轻微热气”的草稿，未点击发送。

命令行请求协商到了 HTTP/2；浏览器协议列和多个页面事件流的专项压力验证尚未执行。因此基础 UI 已验证，但不宣称完成上游发布环境的全部验收项目。画布中的导入视频来源仍是 Pixelle。

## 环境处理

Windows Git 初次检出使 shell 脚本出现 CRLF，WSL 执行报 `Illegal option`。将该上游副本中 .sh 的换行改为 LF 后按同一路径重试；未改业务逻辑。复现时使用 `git -c core.autocrlf=false clone`。

WSL 的 systemd 服务本身不足以保持交互外的发行版常驻；当前另有隐藏 WSL keepalive 进程，PID 保存在 temp。停止说明见 [web/README.md](../web/README.md)。

## 不应推断的结果

没有将当前 Codex 的认证信息注入第三方应用，没有调用应用内 OpenRouter，没有运行付费图像 / 视频生成，没有验证多版本编辑或新视频生成。导入的 MP4 来源明确为 Pixelle。

[比较结论](comparison.md) · [返回项目](../README.md)
