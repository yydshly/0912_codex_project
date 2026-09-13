# 在自己的房间测试真实 WiFi

这条入口读取 Windows 网卡的真实 RSSI，并调用 RuView 原版 RSSI 特征提取、存在/活动分类模块。无需 ESP32。它适合验证粗粒度信号变化及活动候选，不能测试骨架、人数、心跳或可靠的呼吸检测。

原理、设备依赖、历史实测边界和日常设备扩展统一整理在[在线研究汇总](https://yydshly.github.io/0912_codex_project/008-ruview/)。在线页用于阅读；下方采集步骤需在自己的电脑执行。

## 这台电脑已经具备的条件

2026-09-13 检查：Intel Wi-Fi 6E AX211 160MHz，接口名 `WLAN`，已连接 WiFi；系统直接提供 `Rssi` 字段，现场一次读数为 −56 dBm。电脑现有 Windows 驱动的这条采集路径提供 RSSI，不提供 CSI。读取信号成功不代表人体检测准确。

同日已通过 `start.ps1 -Seconds 24` 完成真实链路检查：采集 48 个样本，全部 −56 dBm；第 15、18、21 秒的原版分类均为 `absent`，窗口方差为 0。没有同步人员动作或空房标签，因此不能据此推断房间无人，也不能计算准确率。本地原始记录为 `recordings/20260913-185120-712956.jsonl`，未提交。接口选择、中文状态、缺失原始 RSSI、断开连接、未知接口和非法数值共 6 项检查通过。

## 直接开始

希望直接看曲线时，打开 [真实 WiFi 监测页面](http://127.0.0.1:8770/live.html)。页面支持实时采集、停止/重新开始、实测历史回放和记录下载；可通过 [网页启动脚本](../web/start-live.ps1) 启动。下方仍保留终端采集方式。

后续已完成一次 3 分钟现场观察：356 个真实样本，RSSI 在约第 62 秒从 −56 变为 −62 dBm，原版算法连续输出 4 次活动候选后恢复。用户未配合受控动作，因此仅确认信号突变触发了分类，不算人体识别成功。[完整实测记录](../notes/live-wifi-test-20260913.md)。

在 Windows PowerShell 中运行：

```powershell
& 'F:\codex_project\0912_codex_project\projects\008-ruview\real-wifi\start.ps1'
```

默认持续 180 秒，前 15 秒积累窗口，之后每 3 秒输出 RSSI、波动和原版分类；按 `Ctrl+C` 提前结束。首次启动在本目录安装独立 Python 依赖，并下载、校验固定版本的上游模块。其他电脑需安装 Python 3.10+，并通过 `-Interface 'Wi-Fi'` 等参数指定实际无线接口名。如果 Windows 限制脚本执行，可在本目录直接运行已安装的 `.venv\Scripts\python.exe monitor.py`，无需修改系统安全设置。

测试前固定电脑和路由器的位置；如果可行，让二者分处房间两侧，人在中间穿行。不要在测试中移动电脑，也尽量保持下载、风扇、其他人员活动等条件一致。

1. **0–30 秒：保持静止。** 观察自然波动和分类；这是“有人静止”对照，不能标为空房。
2. **30–60 秒：在电脑与路由器之间来回走动。** 看波动是否增加，是否出现 `active`。
3. **60–90 秒：再次静止。** 等待完整的 15 秒旧数据窗口退出，观察结果是否回落。
4. **90–180 秒：再重复一轮。** 检查效果能否重复，不能只挑一次成功。

空房对照需另录：启动后离开房间，分析时排除离开过程及其后至少 15 秒的窗口。可以延长为 5 分钟：

```powershell
& 'F:\codex_project\0912_codex_project\projects\008-ruview\real-wifi\start.ps1' -Seconds 300 -Label 'empty-room-plan'
```

`Label` 只是你的记录说明，程序不能确认你是否实际离开。开始/停止和离开时间需要自行记录。

## 如何理解输出

| 原版输出 | 本入口显示 | 实际含义 |
| :--- | :--- | :--- |
| `absent` | 未检出变化 | 方差低于阈值；人在房间静坐也可能得到该结果 |
| `present_still` | 低频变化 | 方差达到阈值、运动频段能量不足；不证明有人或正在呼吸 |
| `active` | 活动候选 | 方差与运动频段能量达到阈值；需要与你实际走动的时段核对 |

原版分数由阈值距离等规则计算，不是经本房间标定的正确概率。窗口为 15 秒，采样目标 2 Hz；重复读取相同值也是真实结果，不能人为添加波动。路由器位置、其他人、无线环境及网卡量化都可能影响输出。单次命中不代表准确率；如果静止时持续报活动，或者多次走动都无响应，这组布置没有证明有效。

本地记录位于 `recordings/*.jsonl`，包含真实 RSSI、时间戳、分析结果、错误和版本信息。原始 SSID、BSSID、密码、IP 不写入记录。记录目录不进入 Git。没有开机自启或后台常驻任务。

## 想验证 CSI、呼吸或定位，需要什么

最小起步是一块受固件支持的 ESP32-S3 开发板、USB 数据线、一个 2.4 GHz WiFi 路由器和这台电脑。优先确认具体板型与 Flash/PSRAM 容量；官方列出的 ESP32-S3-DevKitC-1 等板型可作为参考，固件必须与芯片、容量、有无显示屏匹配。

1. 按[研究版本固件指南](https://github.com/ruvnet/RuView/blob/33a9e90896a691a3f98de042b463e5945178b87c/firmware/esp32-csi-node/README.md)选择匹配固件并配置 WiFi；不要直接套用未知板型的刷写偏移。
2. 将节点发送目标设置为这台电脑的局域网地址，节点和电脑网络可互通，接收端使用 UDP 5005。
3. 按[研究版本服务说明](https://github.com/ruvnet/RuView/blob/33a9e90896a691a3f98de042b463e5945178b87c/docs/user-guide.md)启动 sensing server，明确选择 `--source esp32`。已有 Docker 时，上游提供的运行方式是：

   ```powershell
   docker run --rm -p 3000:3000 -p 3001:3001 -p 5005:5005/udp -e CSI_SOURCE=esp32 ruvnet/wifi-densepose:latest
   ```

4. 先检查 `/health`、`/api/v1/nodes`、`/api/v1/sensing/latest` 的数据来源、节点包数和时间戳持续更新，再看检测结果。不要用 `auto` 验收：没有硬件时它可能切换到模拟数据。
5. 从空房与单人走动对照开始；随后才做静坐呼吸，并与人工计数或参考设备同步对照。先验证一个无线链路，再决定是否增加节点。

上述 CSI 流程尚未在本机执行，Docker 镜像也未在本机验证。`latest` 会变化，实际硬件实验需记录固件版本与镜像摘要。多节点能增加观测链路，但不保证本房间的人数、定位、姿态准确；显示骨架不构成正确识别的证据。

## 版本与适配范围

- 上游：[ruvnet/RuView](https://github.com/ruvnet/RuView)，固定提交 `33a9e90896a691a3f98de042b463e5945178b87c`，MIT。
- 执行：`archive/v1/src/sensing/feature_extractor.py` 的 `RssiFeatureExtractor`、`classifier.py` 的 `PresenceClassifier`。这是归档的 v1 RSSI 路径，不是 v2 CSI/姿态模型。
- 三个原版 Python 文件和许可证通过 [upstream-lock.json](upstream-lock.json) 校验，不改写源码；本地加载器兼容上游残留的 `v1.src.sensing` 导入路径。
- 本地真实采集适配器严格选择接口，只接受已连接状态和原始 `Rssi` 数值。上游旧采集器有缺失 RSSI 时保留 −80 的默认值、假设噪声底及合成字节计数，本入口没有调用这些采集逻辑。辅助字段标为不可用，原版特征提取只使用时间和 RSSI。
- 缺少设备、读取失败或字段缺失时停止并记录错误，不回退模拟。
- 规则参数采用上游 live monitor：方差阈值 0.3，运动能量阈值 0.05。未以本房间实际标签调参。
- 依赖：[requirements.txt](requirements.txt)；安装入口：[start.ps1](start.ps1)。

维护验证：在本目录运行 `.venv\Scripts\python.exe check.py` 检查真实输入约束；运行 `start.ps1 -Seconds 24` 检查本机采集及原版计算链路。真实环境效果仍需按上述步骤手动对照。

参考：[官方 Windows 实测教程](https://github.com/ruvnet/RuView/issues/36)。教程与部分当前文档对 RSSI 呼吸能力描述不一致；这里以可核验的信号变化与粗粒度活动作为验收范围。

[返回子项目](../README.md)
