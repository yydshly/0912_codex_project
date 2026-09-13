// Only the existing research servers expose these local pages. Public builds
// retain documentation links and never probe or access the visitor's devices.
(() => {
  const localResearch = location.hostname === '127.0.0.1' && ['8768', '8770'].includes(location.port);
  if (!localResearch) return;
  document.querySelectorAll('[data-local]').forEach(link => {
    const destination = link.dataset.local;
    if (destination === 'live.html') link.href = 'http://127.0.0.1:8770/live.html';
    else link.href = destination;
    link.textContent = link.dataset.localLabel;
  });
  document.getElementById('entry-context').textContent = '正在本机研究服务中阅读。可进入对应实验；8770 为真实 RSSI，8768 为合成算法实验。各服务需先启动。';
})();
