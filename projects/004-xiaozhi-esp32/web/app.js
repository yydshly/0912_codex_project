'use strict';
if (window.matchMedia('(max-width: 760px)').matches) {
  document.querySelector('aside details').open = false;
}
const parts = {
  core: ['主控模组：设备的控制中心','照片左侧金属罩所在模组包含主控和配套电路。CPU 执行固件，RAM / PSRAM 暂存音频与画面，Flash 保存固件和资源；容量取决于具体型号。'],
  power: ['稳压电路：让供电适合芯片','图中 LDO 将 5V 输入转换为 3.3V。麦克风、功放和主控需要匹配各自电压；喇叭播放和无线发射时的电流变化也会影响稳定性。'],
  usb: ['USB、下载与复位：把程序装进去','USB 提供烧录、通信或供电路径。USB 转串口芯片便于电脑调试；BOOT 配合 RESET 进入下载模式。固件写入后，设备可独立供电联网运行。'],
  pins: ['排针：连接外部功能的入口','两排针脚引出电源、GND 和 GPIO。麦克风、OLED、功放通过信号线连接。排针通常已焊在板上，杜邦线与排针之间是可拔插连接；并非每个 GPIO 都空闲。']
};
document.querySelectorAll('[data-part]').forEach(button => button.addEventListener('click', () => {
  document.querySelectorAll('[data-part]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
  const content = parts[button.dataset.part];
  document.querySelector('#part-detail h3').textContent = content[0];
  document.querySelector('#part-detail p').textContent = content[1];
}));
const steps = ['麦克风把声音转换成数字音频。固件采集声音，准备发送给后端。','主板完成必要的音频处理与 Opus 编码，通过 Wi-Fi 和协议通道上传；同时管理聆听状态。','后端识别“把音量调到 30”，由模型选择设置音量工具。模型理解发生在后端，MCP 负责描述和调用工具。','设备收到 self.audio_speaker.set_volume 的 volume=30 参数，调用音频接口设置音量并返回结果。这里显示的是教学流程，没有实际操作任何设备。'];
document.querySelectorAll('[data-step]').forEach(button => button.addEventListener('click', () => {
  document.querySelectorAll('[data-step]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
  document.querySelector('#step-detail').textContent = steps[Number(button.dataset.step)];
}));
