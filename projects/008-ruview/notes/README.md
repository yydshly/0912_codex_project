# 研究与实测记录

日期：2026-09-13。固定提交：33a9e90896a691a3f98de042b463e5945178b87c。

阅读顺序：[理解、原理与价值汇总](understanding.md) → [真实 RSSI 现场记录](live-wifi-test-20260913.md) → [走动无响应排查](live-input-diagnosis.md)。本文主要保存原版 Rust 合成实验与上游证据边界，不将它们混作真实人体效果。

## 原理与实际执行

RuView 利用 CSI 中多子载波的幅度与相位变化推断人体状态。存在、运动可使用环境阈值和相位变化，复杂姿态还需要训练模型与匹配的硬件输入。

本次运行原版 wifi-densepose-vitals 0.3.2：CsiVitalPreprocessor 消除静态背景，BreathingExtractor 用带通和过零分析提取呼吸，HeartRateExtractor 用相位一致性加权、带通和自相关提取心率。这与 ESP32 C 固件是不同执行路径，不能视为固件实测。

[原版模块源码](https://github.com/ruvnet/RuView/tree/33a9e90896a691a3f98de042b463e5945178b87c/v2/crates/wifi-densepose-vitals/src)

## 实验结果

[机器可读结果](experiment-results.json)来自本机原版模块真实执行。

- 安静：15 / 72 的输入得到 15 / 73.17。
- 较快节律：24 / 96 得到 24 / 103.45，心率状态降级。
- 运动干扰：15 / 72 得到无呼吸结果 / 49.18；错误心率仍标记 Valid，说明质量分数不等于实际准确性。
- 单子载波：心率约 73.17，但质量降至约 0.159，状态 Unreliable。
- 零信号：两种估计均无结果，没有默认 BPM。

输入是确定性的理想周期、简化相位与噪声，不是人体或完整电磁传播实验。不能由此推断穿墙、多人、医疗或姿态效果。网页预置记录是实际执行结果；静态回放时不重新执行 Rust。

## 官方成果的证据边界

- 编码器 82.3% 是时间三元组指标，不是存在检测准确率；旧 100% 已撤回。[模型卡](https://huggingface.co/ruvnet/wifi-densepose-pretrained)
- 独立 MM-Fi 姿态模型单模型报告 82.69% torso-PCK@20，跨环境未经适配约 10%。[研究报告](https://github.com/ruvnet/RuView/blob/33a9e90896a691a3f98de042b463e5945178b87c/docs/benchmarks/mmfi-wifi-sensing-study.md)
- 随附早期 pose_v1 的 PCK@20 为 3.0%，不能与 MM-Fi 模型混称。[基准记录](https://github.com/ruvnet/RuView/blob/33a9e90896a691a3f98de042b463e5945178b87c/docs/benchmarks/pose-estimation-cog.md)
- README 对姿态 stub 的部分描述落后于代码：有权重时当前源码执行真实推理，无权重才回退占位；每帧置信度固定为 0.185。[源码](https://github.com/ruvnet/RuView/blob/33a9e90896a691a3f98de042b463e5945178b87c/v2/crates/cog-pose-estimation/src/inference.rs)
- 生命体征验证工具不能替代参考设备实测。[ADR-293](https://github.com/ruvnet/RuView/blob/33a9e90896a691a3f98de042b463e5945178b87c/docs/adr/ADR-293-vitals-ground-truth-rig.md)

以上官方成绩为文献核对，没有在本次复现姿态训练。所用 crate 为 MIT，独立 MM-Fi 权重为 CC BY-NC 4.0；本演示未使用该权重。

## 场景与扩展

若继续研究 CSI，优先解决硬件输入、安装校准、时钟与丢包、参考数据同步、跨房间测试和事件可靠性。若优先复用日常设备，则从蓝牙随身设备感知、连接状态联动或手机动作遥控另行验证；尚未实现这些功能。选择依据和验收步骤见[理解汇总](understanding.md)。精细姿态及多人、生命体征告警需要各自建立验证证据。

[运行与校验](../web/README.md) · [返回项目](../README.md)


## 本次验证完成

- 原版 crate 单元测试：104 通过，0 失败。
- 五组预设重新执行，与已保存的输入、输出、时序和热图完全一致。
- 原版源码 SHA-256、自定义参数接口及无效参数拒绝通过。
- 浏览器已检查窄屏与桌面布局、场景切换、时间回放和参数重算。

- JSON 下载已在浏览器触发，并在本机下载目录确认文件存在、可解析。
- 纯静态服务已验证：预置输出正常载入，无后端时参数与重新计算按钮禁用。

## 虚拟房间补充

按用户要求增加动态场景仿真。走动、呼吸、跌倒、多人和空房的动画用于展示使用体验；不存在从生成信号反推人物骨架的推理过程。前向动画和监测状态共享脚本输入。真实算法实验仍独立保留。

已在浏览器验证：三人场景人数、跌倒后告警与持续静止事件、暂停、视角切换、隔墙状态、空房零人/无呼吸，以及静坐参数调用原版模块得到呼吸 15、心率约 73.2。未发现页面脚本错误。
