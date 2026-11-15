import {storeVolume} from './combat-audio.js?v=137';
import {escapeHtml as esc} from './ui-controls.js?v=152';

const aimKey = 'emberfall-pointer-aim-v1';

export function loadPointerAim() {
  try { return localStorage.getItem(aimKey) === 'true'; }
  catch { return false; }
}

export function controlSettingsMarkup({aim, volume}) {
  const percent = Math.round(volume * 100);
  return `<section class="pointer-aim-setting"><label class="settings-toggle"><input type="checkbox" data-pointer-aim${aim ? ' checked' : ''}><span><b>朝滑鼠位置施放</b><small>普攻與技能朝游標，範圍技能指定落點。手機維持自動索敵。</small></span></label></section>
  <section class="audio-settings" aria-label="音效">
    <label for="sfx-volume">音效音量 <output id="sfx-value">${percent}%</output></label>
    <div><input id="sfx-volume" type="range" min="0" max="100" step="1" value="${percent}">
      <button type="button" class="outline-btn" data-sfx-mute>${volume ? '靜音' : '取消靜音'}</button>
      <button type="button" class="outline-btn" data-sfx-test>試聽</button></div>
  </section>`;
}

export function bindControlSettings(root, {audio, onAim, report, signal}) {
  let audible = audio.volume || .45;
  function setVolume(value) {
    const volume = audio.setVolume(value), percent = Math.round(volume * 100);
    if (volume) audible = volume;
    storeVolume(volume);
    root.querySelector('#sfx-volume').value = percent;
    root.querySelector('#sfx-value').textContent = percent + '%';
    root.querySelector('[data-sfx-mute]').textContent = volume ? '靜音' : '取消靜音';
    if (volume) void audio.unlock();
  }
  root.addEventListener('input', event => {
    if (event.target.id === 'sfx-volume') setVolume(Number(event.target.value) / 100);
  }, {signal});
  root.addEventListener('change', event => {
    if (!event.target.matches('[data-pointer-aim]')) return;
    const aim = event.target.checked;
    onAim?.(aim);
    try { localStorage.setItem(aimKey, String(aim)); }
    catch { report('此裝置無法儲存瞄準設定。'); }
  }, {signal});
  root.addEventListener('click', event => {
    if (event.target.closest('[data-sfx-mute]')) setVolume(audio.volume ? 0 : audible);
    if (event.target.closest('[data-sfx-test]') && audio.volume)
      void audio.unlock().then(ok => { if (ok && !signal.aborted && !document.hidden) audio.play('cleave'); });
  }, {signal});
}

const backupLabels = {incompatible:'不相容原檔', corrupt:'受損原檔', 'unsupported-codec':'未能解壓的原檔', 'before-replace':'覆蓋前備份'};

export function storageSettingsMarkup({info, backups = [], active, importDisabled = false, extra = '', showCreate = false}) {
  if (!info) return '';
  const kb = value => (Math.max(0, value) / 1024).toFixed(1) + ' KB';
  const percent = info.jsonBytes ? Math.round((1 - info.storedBytes / info.jsonBytes) * 100) : 0;
  const recovery = backups.length ? `<details class="recovery-backups"${active ? '' : ' open'}><summary>復原備份 · ${backups.length} 份</summary>
    <ul>${backups.map(backup => `<li><span>${backupLabels[backup.reason] || '原始存檔'} · ${esc(new Date(backup.savedAt).toLocaleString('zh-TW'))}</span><button type="button" class="text-btn" data-recovery-download="${esc(backup.id)}">下載</button></li>`).join('')}</ul></details>` : '';
  return `<section class="storage-summary"><b>本機存檔</b><small>壓縮後 ${kb(info.storedBytes)} · 原始 ${kb(info.jsonBytes)} · 節省 ${percent}%</small>
    <div class="storage-backup-actions"><button type="button" data-export>匯出備份</button><button type="button" data-import${importDisabled ? ' disabled' : ''}>匯入備份</button>${showCreate && !active && backups.length ? '<button type="button" data-recovery-continue>返回首頁</button>' : ''}</div>${extra}${recovery}</section>`;
}

export function downloadSaveFile(blob, filename) {
  const url = URL.createObjectURL(blob), link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function toggleFullscreen(report) {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else if (document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen();
    else report('此瀏覽器不支援全螢幕。');
  } catch { report('無法啟用全螢幕，可使用瀏覽器的全螢幕功能。'); }
}

export {toggleFullscreen};
