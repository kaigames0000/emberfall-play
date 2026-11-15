import * as M from './model.js?v=140';
import {CombatAudio, savedVolume} from './combat-audio.js?v=137';
import {decodeProfileBackup, encodeProfileBackup} from './profile-storage.js?v=154';
import {bindControlSettings, controlSettingsMarkup, downloadSaveFile, loadPointerAim, storageSettingsMarkup, toggleFullscreen} from './settings-ui.js?v=154';
import {RELEASE_NOTES} from './release-notes.mjs?v=154';
import {renderReleaseHistory} from './release-history.js?v=134';

export function mountHomeSettings({openStore, reloadRoster, portable}) {
  const button = document.querySelector('[data-home-settings]');
  const dialog = document.querySelector('#home-settings');
  const content = dialog.querySelector('[data-home-settings-content]');
  const status = dialog.querySelector('[data-home-settings-status]');
  const close = dialog.querySelector('.modal-close');
  const file = dialog.querySelector('input[type=file]');
  let lifetime, store, busy = false;
  const report = message => { status.textContent = message; };

  async function renderStorage() {
    const signal = lifetime.signal;
    store = await openStore();
    const [current, backups] = await Promise.all([store.load(), store.listRecoveryBackups()]);
    if (!signal.aborted) dialog.querySelector('[data-home-save]').innerHTML =
      storageSettingsMarkup({info:store.info, active:current.active, backups, importDisabled:!!current.rifts?.activeRun});
  }

  function open() {
    if (dialog.open) return;
    lifetime?.abort();
    lifetime = new AbortController();
    const signal = lifetime.signal;
    const audio = new CombatAudio({volume:savedVolume()});
    content.innerHTML = '<div data-home-save></div>' + controlSettingsMarkup({aim:loadPointerAim(), volume:audio.volume});
    if (portable) {
      content.insertAdjacentHTML('beforeend', '<details class="standalone-release-history"><summary>更新紀錄</summary><div class="release-history"></div></details>');
      renderReleaseHistory(content.querySelector('.release-history'), RELEASE_NOTES);
    } else {
      void Promise.all([import('./pwa.js?v=154'), import('./updates.js?v=154')]).then(([pwa, updates]) => {
        if (signal.aborted) return;
        const install = pwa.mountInstallTools(dialog, signal, {closeSymbol:'title-close'});
        updates.mountUpdateTools(dialog, install, signal);
      }).catch(() => { if (!signal.aborted) report('目前無法載入安裝與更新功能。'); });
    }
    bindControlSettings(content, {audio, report, signal});
    report('');
    dialog.showModal();
    void renderStorage().catch(() => { if (!signal.aborted) report('目前無法讀取本機存檔。'); });
    signal.addEventListener('abort', () => {
      audio.silence();
      if (audio.context && audio.context.state !== 'closed') void audio.context.close().catch(() => {});
    }, {once:true});
    window.addEventListener('emberfall:update-save', event => {
      const result = event.detail;
      if (!dialog.open || !result) return;
      result.pending = (async () => {
        try {
          if (busy) throw Error();
          await (await openStore()).flush();
          result.ok = true;
          result.reason = '';
        } catch { result.ok = false; result.reason = '本機存檔目前無法使用，已取消更新。'; }
      })();
    }, {signal});
  }

  button.addEventListener('click', open);
  close.addEventListener('click', () => { if (!busy) dialog.close(); });
  dialog.addEventListener('cancel', event => { if (busy) event.preventDefault(); });
  dialog.addEventListener('close', () => {
    if (dialog.open) return;
    lifetime?.abort();
    content.replaceChildren();
  });
  dialog.addEventListener('click', async event => {
    const control = event.target.closest('button');
    if (!control || busy) return;
    if (control.hasAttribute('data-home-fullscreen')) { void toggleFullscreen(report); return; }
    if (control.hasAttribute('data-import')) { file.click(); return; }
    try {
      let backup;
      if (control.hasAttribute('data-export')) backup = await encodeProfileBackup(await store.load());
      else if (control.dataset.recoveryDownload) backup = await store.exportRecoveryBackup(control.dataset.recoveryDownload);
      if (backup) downloadSaveFile(backup.blob, backup.filename);
    } catch { report('目前無法下載存檔。'); }
  });
  file.addEventListener('change', async () => {
    const selected = file.files[0];
    if (!selected || busy || !store) return;
    busy = close.disabled = true;
    file.value = '';
    try {
      const restored = M.importSave(await decodeProfileBackup(selected));
      if (!restored) { report('這份存檔與目前版本的資料規則不相容。'); return; }
      const current = await store.load();
      if (current.rifts?.activeRun) { report('請先結算目前的裂隙。'); return; }
      await store.save(restored, {replace:true, expectedRevision:current.writeRevision || 0});
      await reloadRoster();
      await renderStorage();
      report('存檔已匯入。');
    } catch (error) {
      report(['BACKUP_TOO_LARGE','UNSUPPORTED_CODEC','PROFILE_WRITE_CONFLICT'].includes(error.code) ? error.message : '無法匯入存檔。既有進度已保留。');
    } finally { busy = close.disabled = false; }
  });
  return {dialog, open};
}
