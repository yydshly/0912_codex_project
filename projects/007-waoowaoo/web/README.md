# 真实应用运行说明

另有[四项目理解汇总网页](summary/README.md)：在一个页面比较 Pixelle、waoowaoo、火宝和 Toonflow，附真实成片、截图与证据边界。与下方原版应用独立运行。

本地入口：<https://localhost:1443>。HTTP 13000 只负责跳转。本机已获用户明确授权，将本次 Caddy 公共根证书导入当前 Windows 用户信任库，并已通过正常 HTTPS 页面登录。原版画布、图片预览和助手引用已验证；模型生成未验证。其他机器重新安装时，需要信任对应安装的证书，不能复用本次指纹或跳过证书警告。

## 固定版本与环境

Windows + 已有 Ubuntu 22.04 WSL。此次安装 Docker Engine 29.8.0 / Compose 5.5.1。上游代码存于忽略的 `.upstream/waoowaoo`。

```powershell
git -c core.autocrlf=false clone https://github.com/waooAI/waoowaoo.git .upstream/waoowaoo
git -C .upstream/waoowaoo checkout 6cbbe22cc6492159e0f649d507e4e21a9aec3074
```

应用及 worker 镜像：
`ghcr.io/waooai/waoowaoo@sha256:3275844dc8b670d0271d4b6b519ef9812a6d97658408eefbb570cb4c241228dd`

Codex runtime 镜像：
`ghcr.io/waooai/waoowaoo-codex-runtime@sha256:227e693df52733c6ade9a086fcae6c0ae3e603260349d6adb480e59e5f672219`

来源：[v0.5.0-beta.1 Release](https://github.com/waooAI/waoowaoo/releases/tag/v0.5.0-beta.1)。

## 本次脚本

- [install-docker-wsl.sh](install-docker-wsl.sh)：仅供本机 Ubuntu 22.04，使用 Docker 官方软件源安装。其他系统请按上游文档。
- [configure-local.py](configure-local.py)：生成独立本地密码和固定镜像配置；已有 .env 时拒绝覆盖。不会显示密码。
- [start-release-wsl.sh](start-release-wsl.sh)：本机绝对路径启动脚本，拉取镜像、bootstrap blue、启动服务并检查 worker。用于首次安装；已有数据升级应遵循上游升级流程。
- [import-cafe-demo.py](import-cafe-demo.py)：正常账户认证与原生 API 导入素材，使用公共 CA 校验 TLS；不会修改系统信任库，不伪装模型接口。

导入脚本需要 Python requests。本次调用 006 的独立 Python 环境；可在本项目建 .venv 安装 requests 后独立运行。图片在本项目 assets，视频来自 006。

证书、账号、运行状态保存在忽略的 temp；.env 在忽略的上游目录。不要把两者提交或发到聊天中。

## 重启与停止

常规启动，在 WSL 的上游目录：

```sh
docker compose up -d
sh scripts/temporal/worker-rollout.sh status
```

常规停止：

```sh
docker compose stop
```

不要使用 `down -v`，它会删除数据库、媒体和证书持久卷。此次另启动隐藏 WSL keepalive 进程；先停止应用容器，再按照 temp/wsl-keepalive.pid 核对 wsl.exe 命令行为 `sleep infinity` 后停止该进程。无需停止机器上的其他 WSL 或 Docker 任务。

演示账号名为 codex-cafe-demo，随机密码仅在本机 temp/demo-state.json；这只是本地新建演示账户。项目 ID 见 [实验记录](../notes/README.md)。

当前没有配置应用内 OpenRouter，无法把当前 Codex 会话内置工具自动作为它的模型接口。不要把已导入视频算作 waoowaoo 生成的视频。
