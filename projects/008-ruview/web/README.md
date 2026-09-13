# RuView 无线感知实验室

## 真实 WiFi 可视化入口

打开 [真实 WiFi 现场](http://127.0.0.1:8770/live.html)。这是本机网卡的实测曲线和原版 RSSI 活动分类，使用独立本地服务；下文 8768 端口仍为早期合成信号实验。

在本目录运行 [start-live.ps1](start-live.ps1)，启动后自动采集一轮 180 秒真实数据。网页每约 0.7 秒获取快照，网卡目标采样 2 Hz，原版分类使用 15 秒窗口、约每 3 秒输出一次。可停止或重新开始一轮，采集记录保存在 `../real-wifi/recordings/`。服务只监听 `127.0.0.1:8770`；没有后台自启。历史记录与实时来源明确分开，下载保留来源及版本信息。

“刚才的真实记录”读取 2026-09-13 18:53 的 356 个实测样本，先验证原始文件 SHA-256。支持时间拖动、播放和跳到约 62 秒的信号突变。橙色时段表示原版算法的活动候选，不等同于人体事件。其他电脑没有这份本地记录时会显示不可用，不补造数据；实时采集仍可使用。

断网、RSSI 缺失、读取异常会停止采集；超过 4 秒未收到新数据时页面隐藏当前读数与判定，旧记录仍可查看。停止后不会再产生新样本。此入口未提供 CSI、人数、骨架或生命体征数据，也未部署公网。

页面明确区分“历史记录（不实时）”、采集结束与持续读取相同 RSSI。重复读取时间戳不代表每次都获得新的物理测量。用户曾反馈走动但无响应，原生接口对照也为恒定值；详见 [输入与模式排查](../notes/live-input-diagnosis.md)。

验证：`../real-wifi/.venv/Scripts/python.exe ../real-wifi/check_web.py`、`node --check public/live.js`。还需检查 `/api/live/state` 的真实来源、时间戳与样本持续增加，以及缺少本机请求头的控制请求被拒绝。

## 合成信号实验入口

访问 [本地演示](http://127.0.0.1:8768/)；服务仅监听本机。输入为本项目生成的合成信号，算法实际来自固定提交的原版 Rust 模块。

## 启动

需要 Python 3.10+、Rust/Cargo 及本机编译工具链。本次使用 Python 3.10、Cargo 1.95.0；Python 仅使用标准库。首次构建需要联网读取 GitHub 和 crates.io。

在本目录运行：

```powershell
python bootstrap.py
python server.py
```

也可运行 [start.ps1](start.ps1)，缺少本机程序时会自动构建。访问 http://127.0.0.1:8768/；在启动终端按 Ctrl+C 停止服务。

## 功能

- 五组原版计算记录：安静呼吸、较快节律、运动干扰、单子载波、零信号。
- 时间拖动与约 2 倍速回放，查看历史不足和输出变化。
- 合成幅度、原版预处理残差、BPM、内部质量与状态。
- 调整呼吸、心跳、噪声、运动后重新计算。沿用所选场景的子载波数量，自定义实验始终包含周期源。
- JSON 导出，包含输入、完整展示时序和来源信息。
- 技术原理、能力边界、官方演示和真实硬件资料。

## 来源与构建

固定提交：33a9e90896a691a3f98de042b463e5945178b87c。

[bootstrap.py](bootstrap.py) 仅下载所需 MIT crate、README、基准文件和根 LICENSE，缓存于忽略目录 .upstream。原版 crate 不修改；缓存中的 v2/Cargo.toml 是本项目生成的最小构建工作区，补全继承字段与依赖。

下载文件哈希保存在 [upstream-lock.json](upstream-lock.json)，第三方依赖锁定于 [Cargo.lock](engine/Cargo.lock)。[适配器](engine/src/main.rs) 调用原版 API，没有重新实现呼吸或心率算法。

```text
本项目合成幅度与相位
→ RuView CsiVitalPreprocessor
→ RuView BreathingExtractor / HeartRateExtractor
→ 原始输出与抽样时序 JSON
→ 本项目网页
```

固定种子 42，默认 56 子载波、50 Hz、45 秒；幅度基线 10，心跳分量是呼吸分量的 0.15 倍。相位为简化的一致性输入，各通道共享周期源，不能视为独立无线传播路径。不是多径、穿墙或临床仿真。

## 重新生成与验证

本地服务运行时，在本目录执行：

```powershell
cargo build --release --manifest-path engine/Cargo.toml
python generate.py
python check.py
cargo test --lib --manifest-path .upstream/RuView/v2/crates/wifi-densepose-vitals/Cargo.toml
```

generate.py 运行五组实验并保存静态回放记录；check.py 校验来源哈希、重复计算一致性、正负对照、资源路径、参数重算与错误输入。已知失败不会被修正为成功。

## 纯静态模式与部署

public/ 为完整静态页，无外部脚本与字体依赖：

```powershell
python -m http.server 8769 --bind 127.0.0.1 --directory public
```

访问 http://127.0.0.1:8769/。无 API 时参数控件禁用，预设回放、说明和下载仍可用。尚未发布公网或加入站点清单；未来可采用基础路径 /0912_codex_project/008-ruview/。Pages 只执行静态回放，本机计算 API 不由 Pages 提供。

本次没有连接硬件或运行完整 sensing-server。研究时 PyPI 发布与 README 的 Python 2.x 宣称存在差异，因此使用固定源码构建。详见 [实测记录](../notes/README.md)。

[返回项目](../README.md)


## 虚拟房间动态演示

打开 [scene.html](http://127.0.0.1:8768/scene.html)。场景页无需后端也可完整播放；只有“运行原版算法”按钮需要本机服务。

- 走动：预设人物路径、17 关节点动画、轨迹与信号联动。
- 静坐：身体与胸部呼吸动画，位移经过放大以便观察。
- 跌倒：第 3 秒开始倒下，约第 4 秒触发脚本告警，第 7 秒记录持续静止。
- 多人：三个人物分别显示，人数直接来自场景设置。
- 空房：移除人物与周期源，只保留设定噪声。
- 支持暂停、重播、斜视/俯视、播放速度、呼吸频率、干扰和隔墙。

动画与监测状态由本项目 scene.js 生成，不执行上游人数、姿态或跌倒模型。墙体使用固定 0.35 衰减系数，仅用于界面示意，不代表材质穿透率。原版计算只接收呼吸、心跳和干扰等简化参数，不接收场景骨架、位置或墙体；多人场景也不会转成独立多人的体征推断。

尊重系统减少动态效果偏好：启用时初始暂停，可以点击“继续”。切换场景保留当前暂停状态。
