const SYNC_INTERVAL = 60_000;
const statusText = {
  conflict: '另一台裝置已有新版。請查看雲端進度，再選擇還原或覆蓋。',
  offline: '目前離線。進度已保留在本機。',
  limit: '備份太頻繁，請稍候再試。',
  failure: '雲端操作失敗，請稍後再試。'
};

export function createCloudPanel({client, readLocal, restoreLocal, canRestore, clock = Date.now}) {
  const element = document.createElement('section');
  element.className = 'cloud-panel';
  const online = () => navigator.onLine !== false;
  let account = null, remote = null, busy = false, auto = false, linkedRevision = null;
  let pending = null, message = '', timer = 0, queued = 0, backedUp = 0, lastAttempt = 0;
  const stamp = date => {
    const time = new Date(date);
    return Number.isFinite(time.valueOf()) ? time.toLocaleString('zh-TW') : '';
  };
  const revision = value => Number.isSafeInteger(value) && value >= 0;
  const cleanRemote = data => {
    if (!revision(data?.revision)) throw Error('invalid cloud revision');
    return {revision:data.revision, savedAt:data.savedAt, history:(Array.isArray(data.history)?data.history:[])
      .filter(item=>revision(item?.revision)&&item.revision>0&&item.revision<data.revision)};
  };

  function stopAuto() {
    auto = false;
    clearTimeout(timer);
    timer = 0;
    queued = 0;
  }

  function render() {
    if (!client.enabled) {
      element.innerHTML = '<p>雲端服務尚未連線。本機存檔可在遊戲設定匯出。</p>';
      return;
    }
    if (!account) {
      element.innerHTML = '<p>登入 Google 後，可備份這台裝置的角色與共用倉庫。</p><button type="button" class="gold-btn" data-cloud-action="login">使用 Google 登入</button><p class="cloud-status" role="status"></p>';
    } else {
      const active = !busy && online(), restorable = active && canRestore();
      element.innerHTML = `
        <div class="cloud-head"><b>個人備份</b><button type="button" class="text-btn" data-cloud-action="logout" ${busy?'disabled':''}>登出</button></div>
        <p data-cloud-meta></p>
        <div class="cloud-actions">
          <button type="button" class="outline-btn" data-cloud-action="read" ${active?'':'disabled'}>重新讀取</button>
          <button type="button" class="gold-btn" data-cloud-action="upload" ${active&&remote?'':'disabled'}>上傳本機備份</button>
          <button type="button" class="outline-btn" data-cloud-action="restore" data-cloud-revision="${remote?.revision??0}" ${restorable&&remote?.revision?'':'disabled'}>還原雲端備份</button>
        </div>
        ${remote?.history.length?`<details class="cloud-history"><summary>更早的版本</summary><ul>${remote.history.map(item=>`<li><span>第 ${item.revision} 版</span><button type="button" class="text-btn" data-cloud-action="restore" data-cloud-revision="${item.revision}" ${restorable?'':'disabled'}>還原</button></li>`).join('')}</ul></details>`:''}
        ${linkedRevision!==null?`<label class="cloud-auto"><input type="checkbox" data-cloud-auto ${auto?'checked':''} ${busy?'disabled':''}> 此分頁在回營或清房後自動備份</label>`:''}
        ${pending?`<div class="cloud-confirm"><p>${pending.action==='upload'?'覆蓋雲端目前版本？舊版會保留在版本紀錄。':'用此版本替換本機進度？本機會先保留復原備份。'}</p><div class="cloud-actions"><button type="button" class="text-btn" data-cloud-action="cancel" ${busy?'disabled':''}>取消</button><button type="button" class="gold-btn" data-cloud-action="confirm" ${active?'':'disabled'}>確認</button></div></div>`:''}
        <p class="cloud-status" role="status"></p>`;
      element.querySelector('[data-cloud-meta]').textContent = remote?.revision
        ? `雲端第 ${remote.revision} 版 · ${stamp(remote.savedAt)}`
        : remote ? '這個帳號還沒有個人備份。' : '正在等待雲端版本資訊。';
    }
    element.querySelector('.cloud-status').textContent = message || (!online()?statusText.offline:'');
  }

  function accountChanged() {
    if (account === client.account) return false;
    stopAuto();
    account = client.account;
    remote = null;
    linkedRevision = null;
    pending = null;
    backedUp = 0;
    lastAttempt = 0;
    message = '';
    return true;
  }

  function applyRemote(data) {
    remote = cleanRemote(data);
    if (linkedRevision !== null && linkedRevision !== remote.revision) {
      stopAuto();
      linkedRevision = null;
      message = statusText.conflict;
    }
  }

  async function run(task) {
    if (busy || !online()) return false;
    busy = true;
    message = '';
    render();
    const owner = account;
    try {
      await task(owner);
      return true;
    } catch (error) {
      if (owner !== client.account) return false;
      if (error.status === 409) {
        linkedRevision = null;
        stopAuto();
        remote = null;
        message = statusText.conflict;
      } else message = !online()?statusText.offline:error.status===429?statusText.limit:statusText.failure;
      return false;
    } finally {
      busy = false;
      accountChanged();
      render();
      schedule();
    }
  }

  function readRemote() {
    return run(async owner => {
      pending = null;
      const data = await client.readBackup();
      if (owner === client.account) applyRemote(data);
    });
  }

  function upload(expected, automatic = false) {
    if (!revision(expected)) return false;
    return run(async owner => {
      pending = null;
      lastAttempt = clock();
      const profile = await readLocal(!automatic);
      if (owner !== client.account) return;
      const saved = await client.writeBackup(expected, profile);
      if (owner !== client.account) return;
      if (saved.revision !== expected + 1) throw Error('invalid saved revision');
      remote = cleanRemote({...saved, history:[...(remote?.revision?[remote]:[]),...(remote?.history??[])].slice(0,2)});
      linkedRevision = remote.revision;
      backedUp = profile.writeRevision || 0;
      message = '已備份至雲端。';
    });
  }

  function restore(selected) {
    if (!canRestore() || selected <= 0 || !revision(selected)) return false;
    return run(async owner => {
      pending = null;
      const data = await client.readBackup(selected);
      if (owner !== client.account) return;
      if (!data?.profile || data.revision !== selected || !canRestore()) throw Error('invalid restore');
      stopAuto();
      linkedRevision = null;
      await restoreLocal(data.profile);
      message = '已還原雲端備份，原本的本機進度已另存。';
    });
  }

  function schedule() {
    if (!auto || busy || timer || !online() || queued<=backedUp || linkedRevision===null) return;
    timer = setTimeout(() => {
      timer = 0;
      if (auto && account === client.account && queued>backedUp) void upload(linkedRevision, true);
    }, Math.max(1, SYNC_INTERVAL - (clock() - lastAttempt)));
  }

  element.addEventListener('click', async event => {
    const button = event.target.closest('[data-cloud-action]');
    if (!button || busy) return;
    const action = button.dataset.cloudAction;
    if (action === 'login') {
      await run(()=>client.signIn());
    } else if (action === 'logout') {
      await run(()=>client.signOut());
    } else if (action === 'read') {
      await readRemote();
    } else if (action === 'cancel') {
      pending = null;
      render();
    } else if (action === 'upload' && remote) {
      if (remote.revision === 0) await upload(0);
      else { pending = {action, revision:remote.revision}; render(); }
    } else if (action === 'restore' && canRestore()) {
      pending = {action, revision:Number(button.dataset.cloudRevision)};
      render();
    } else if (action === 'confirm' && pending) {
      const choice = pending;
      if (choice.action === 'upload') await upload(choice.revision);
      else await restore(choice.revision);
    }
  });
  element.addEventListener('change', event => {
    if (!event.target.matches('[data-cloud-auto]')) return;
    if (!event.target.checked) { stopAuto(); return; }
    auto = linkedRevision !== null;
    schedule();
  });
  const updateNetwork = () => { if (element.isConnected) render(); schedule(); };
  window.addEventListener('online', updateNetwork);
  window.addEventListener('offline', updateNetwork);

  return {
    element,
    refresh() {
      accountChanged();
      render();
      if (account && !remote && !message) void readRemote();
    },
    close() { pending = null; },
    unlink() { stopAuto(); linkedRevision = null; },
    offer(profile) {
      if (!auto || !account || account !== client.account) return;
      queued = Math.max(queued, profile?.writeRevision || 0);
      schedule();
    }
  };
}
