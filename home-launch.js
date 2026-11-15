import * as M from './model.js?v=140';
import {appearancePickerMarkup} from './appearance-picker.js?v=124';
import {bplusAsset} from './bplus-art.js?v=124';
import {equipmentArt} from './equipment-visuals.js?v=124';
import {openProfileStore} from './profile-storage.js?v=121';
import {cloudEndpoints, createCloudClient} from './cloud-client.js?v=108';
import {connectGameView} from './home-game.js?v=153';

export function mountHomeRoster(inlineGame) {
  const find = selector => document.querySelector(selector);
  const art = find('.title-art');
  const hideMissingArt = () => { art.hidden = true; };
  art.addEventListener('error', hideMissingArt, {once:true});
  if (art.complete && !art.naturalWidth) hideMissingArt();

  const tabs = find('.realm-switch');
  const realmButtons = [...tabs.querySelectorAll('button')];
  const login = find('[data-home-signin]');
  const choice = find('.roster-choice');
  const roster = find('[data-home-character]');
  const create = find('[data-home-new]');
  const form = find('.roster-create');
  const cancel = find('[data-home-cancel]');
  const enter = find('[data-home-enter]');
  const status = find('.title-status');
  const retry = find('[data-home-retry]');
  const recovery = find('[data-home-recovery]');
  const cancelEntry = find('[data-cancel-entry]');
  const characterActions = find('[data-home-character-actions]');
  const rename = find('[data-home-rename]');
  const remove = find('[data-home-delete]');
  const editForm = find('[data-home-edit]');
  const editCancel = find('[data-home-edit-cancel]');
  const editSubmit = find('[data-home-edit-submit]');
  const renameField = find('[data-home-rename-field]');
  const deleteMessage = find('[data-home-delete-message]');

  const cloud = createCloudClient();
  const hasPublicRoster = Boolean(!inlineGame && cloudEndpoints()?.verified && cloud.verifiedEnabled);
  let realm = hasPublicRoster && !new URLSearchParams(location.search).has('local') ? 'verified' : 'local';
  let profile = null, remoteMode = null, localStore = null, publicLoad = null;
  let requestNumber = 0, booting = true, loading = true, writing = false;
  let creating = false, retryable = false, recoverable = false;
  let entering = false, entryFailed = false;
  let edit = null;

  find('[data-home-appearance]').innerHTML = appearancePickerMarkup();
  find('[data-home-weapons]').innerHTML = M.RING_START_WEAPONS.map((weaponType, index) => {
    const name = M.WEAPON_TYPES[weaponType].name;
    const art = bplusAsset(equipmentArt({slot:'weapon', weaponType}));
    return `<label class="weapon-option">
      <input type="radio" name="weaponType" value="${weaponType}" ${index === 0 ? 'checked' : ''}>
      <img src="${art}" alt="" draggable="false">
      <span>${name}</span>
    </label>`;
  }).join('');

  const locked = () => realm === 'local' ? !!profile?.rifts?.activeRun : !!remoteMode && !['camp','roster'].includes(remoteMode);

  function showStatus(message, error = false) {
    status.textContent = message;
    status.dataset.error = String(error);
  }

  function renderRoster(heroes, active, disabled) {
    const wasHidden = choice.hidden;
    const scrollTop = roster.scrollTop;
    choice.hidden = !heroes.length || creating || !!edit;
    roster.replaceChildren(...heroes.map(hero => {
      const entry = document.createElement('li');
      const button = document.createElement('button');
      const portrait = document.createElement('img');
      const name = document.createElement('span');
      const level = document.createElement('small');
      button.type = 'button';
      button.className = 'roster-character';
      button.dataset.characterId = hero.id;
      button.setAttribute('aria-pressed', String(hero.id === active?.id));
      button.disabled = disabled;
      portrait.src = bplusAsset(`heroes/base/${hero.gender === 'female' ? 'female' : 'male'}-front.webp`);
      portrait.alt = '';
      name.textContent = hero.name;
      level.textContent = `Lv.${hero.level}`;
      button.append(portrait, name, level);
      entry.append(button);
      return entry;
    }));
    const selected = roster.querySelector('[aria-pressed="true"]');
    roster.scrollTop = wasHidden && !choice.hidden ? selected?.offsetTop ?? 0 : scrollTop;
  }

  function render() {
    const heroes = Object.values(profile?.characters ?? {});
    const active = profile?.characters?.[profile.active];
    const busy = booting || loading || writing || entering;
    const lockedRoster = locked();
    tabs.hidden = !hasPublicRoster;
    for (const button of realmButtons) {
      button.setAttribute('aria-pressed', String(button.dataset.realm === realm));
      button.disabled = busy;
    }
    login.hidden = realm !== 'verified' || !!cloud.account || loading;
    login.disabled = busy;
    renderRoster(heroes, active, busy || lockedRoster);
    characterActions.hidden = realm !== 'local' || !active;
    rename.disabled = remove.disabled = busy || lockedRoster;
    create.disabled = busy || lockedRoster || heroes.length >= M.MAX_CHARACTERS;
    form.hidden = !profile || lockedRoster || !creating;
    form.querySelector('fieldset').disabled = busy;
    cancel.hidden = !active;
    editForm.hidden = !edit || lockedRoster;
    editForm.querySelector('fieldset').disabled = busy;
    enter.hidden = !active || creating || !!edit || busy;
    if (enter.hidden) enter.removeAttribute('href');
    else enter.setAttribute('href', inlineGame ? '#' : realm === 'verified' ? './play.html?realm=verified' : './?view=play');
    retry.hidden = !retryable || busy;
    recovery.hidden = realm !== 'local' || (!recoverable && (!entryFailed || !!inlineGame));
    recovery.textContent = recoverable ? '存檔復原' : '直接開啟遊戲';
    cancelEntry.hidden = !entering;
  }

  function statusForRoster() {
    if (!locked()) return '';
    return realm === 'local' ? '裂隙尚未結算，請先使用目前角色。' : '遠征尚未結束，請先使用目前角色。';
  }

  function errorMessage(error, fallback) {
    const detail = error?.result?.message || error?.message;
    return typeof detail === 'string' && /[\u3400-\u9fff]/.test(detail) ? detail.slice(0, 160) : fallback;
  }

  function openLocal() {
    localStore ??= openProfileStore().catch(error => { localStore = null; throw error; });
    return localStore;
  }

  const gameView = connectGameView({
    inlineGame,
    home:find('[data-home-view]'),
    homeStyle:find('[data-home-style]'),
    canEnter:({recovery = false} = {}) => !booting && !loading && !writing && realm === 'local' &&
      Boolean(recovery ? recoverable : !creating && !edit && profile?.active),
    setLoading(value, error = '') {
      entering = value;
      entryFailed = Boolean(error);
      showStatus(value ? '載入營地…' : error || statusForRoster(), entryFailed);
      render();
    },
    async reloadRoster() {
      await showRealm('local');
      enter.focus({ preventScroll:true });
    },
  });

  enter.addEventListener('click', event => {
    if (realm !== 'local' || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    void gameView.enter();
  });
  cancelEntry.addEventListener('click', gameView.cancel);
  if (inlineGame) {
    recovery.href = '#';
    recovery.addEventListener('click', event => {
      event.preventDefault();
      void gameView.enter({recovery:true});
    });
  }

  function readPublic() {
    if (publicLoad) return publicLoad;
    const account = cloud.account;
    publicLoad = Promise.resolve().then(async () => {
      try { return await cloud.verified({action:'load'}); }
      catch (error) {
        if (![409,429].includes(error?.status)) throw error;
        await new Promise(resolve => setTimeout(resolve, 650));
        if (cloud.account !== account) throw error;
        return cloud.verified({action:'load'});
      }
    }).finally(() => { publicLoad = null; });
    return publicLoad;
  }

  async function showRealm(next, loginError = '') {
    if (booting || writing) return;
    const request = ++requestNumber;
    realm = next;
    profile = remoteMode = null;
    creating = retryable = recoverable = false;
    edit = null;
    entryFailed = false;
    loading = true;
    form.reset();
    showStatus('載入角色…');
    render();
    try {
      if (next === 'local') {
        const store = await openLocal();
        const current = await store.load();
        const backups = await store.listRecoveryBackups().catch(() => []);
        if (request !== requestNumber) return;
        profile = current;
        recoverable = store.info.resetIncompatible || backups.some(backup => ['corrupt','incompatible'].includes(backup.reason));
      } else if (cloud.account) {
        const account = cloud.account;
        const response = await readPublic();
        if (request !== requestNumber || cloud.account !== account) return;
        if (!response?.profile?.characters) throw Error('無法讀取公測角色。');
        profile = response.profile;
        remoteMode = response.view?.mode;
      }
      creating = Boolean(profile && !profile.active);
      showStatus(loginError || statusForRoster(), Boolean(loginError));
    } catch (error) {
      if (request !== requestNumber) return;
      retryable = next === 'local' || !!cloud.account;
      const fallback = next === 'local' ? '無法讀取本機存檔。' : '無法讀取公測角色。';
      showStatus(errorMessage(error, fallback), true);
    } finally {
      if (request === requestNumber) {
        loading = false;
        render();
      }
    }
  }

  async function writeLocal(command) {
    const store = await openLocal();
    const current = await store.load();
    if (current.rifts?.activeRun) throw Error('請先結算目前的裂隙。');
    if (command.action === 'select' && current.active === command.id) return current;
    const candidate = structuredClone(current);
    let result;
    switch (command.action) {
      case 'create': result = M.createCharacter(candidate, command.name, 'wanderer', command.weaponType, command.gender); break;
      case 'rename': result = M.renameCharacter(candidate, command.id, command.name); break;
      case 'delete': result = M.deleteCharacter(candidate, command.id); break;
      case 'select': result = {ok:M.selectCharacter(candidate, command.id), error:'找不到這位角色。'}; break;
    }
    if (!result?.ok) throw Error(result?.error || '無法儲存角色。');
    return store.save(candidate);
  }

  async function changeCharacter(command) {
    if (loading || writing || entering || !profile || locked()) return false;
    writing = true;
    showStatus('儲存角色…');
    render();
    try {
      if (realm === 'local') profile = await writeLocal(command);
      else {
        const account = cloud.account;
        const result = await cloud.verified(command);
        if (cloud.account !== account || !result?.profile?.characters) throw Error('無法儲存公測角色。');
        profile = result.profile;
        remoteMode = result.view?.mode;
      }
      creating = !profile.active;
      edit = null;
      form.reset();
      showStatus(statusForRoster());
      return true;
    } catch (error) {
      if (realm === 'local') {
        try { profile = await (await openLocal()).load(); } catch {}
        if (locked()) { creating = false; edit = null; }
        else if (edit && !profile?.characters[edit.id]) { edit = null; creating = !profile?.active; }
      } else if (!cloud.account) {
        profile = remoteMode = null;
        creating = false;
      }
      showStatus(errorMessage(error, '無法儲存角色，請稍後再試。'), true);
      return false;
    } finally {
      writing = false;
      render();
    }
  }

  for (const button of realmButtons) button.addEventListener('click', () => {
    if (button.dataset.realm !== realm) void showRealm(button.dataset.realm);
  });
  retry.addEventListener('click', () => { void showRealm(realm); });
  roster.addEventListener('click', async event => {
    const button = event.target.closest('button[data-character-id]');
    if (!button || button.dataset.characterId === profile?.active) return;
    await changeCharacter({action:'select', id:button.dataset.characterId});
    if (document.activeElement === document.body) {
      roster.querySelector('[aria-pressed="true"]')?.focus({preventScroll:true});
    }
  });
  create.addEventListener('click', () => {
    if (!profile || loading || writing || locked()) return;
    creating = true;
    showStatus('');
    render();
    form.elements.namedItem('name').focus();
  });
  cancel.addEventListener('click', () => {
    form.reset();
    creating = false;
    showStatus(statusForRoster());
    render();
    create.focus();
  });
  function beginEdit(action) {
    const hero = profile?.characters[profile.active];
    if (!hero || realm !== 'local' || writing || loading || entering || locked()) return;
    const deleting = action === 'delete';
    edit = {action, id:hero.id};
    renameField.hidden = deleting;
    deleteMessage.hidden = !deleting;
    deleteMessage.textContent = deleting ? `永久刪除「${hero.name}」及角色的冒險進度？` : '';
    editForm.elements.name.value = hero.name;
    editSubmit.textContent = deleting ? '永久刪除' : '儲存名稱';
    editSubmit.classList.toggle('title-danger', deleting);
    showStatus('');
    render();
    (deleting ? editCancel : editForm.elements.name).focus();
  }
  rename.addEventListener('click', () => beginEdit('rename'));
  remove.addEventListener('click', () => beginEdit('delete'));
  editCancel.addEventListener('click', () => {
    const trigger = edit?.action === 'delete' ? remove : rename;
    edit = null;
    showStatus(statusForRoster());
    render();
    trigger.focus();
  });
  editForm.addEventListener('submit', async event => {
    event.preventDefault();
    if (!edit) return;
    const changed = await changeCharacter({...edit, name:editForm.elements.name.value});
    if (changed) (profile.active ? enter : form.elements.name).focus();
    else if (edit) (edit.action === 'rename' ? editForm.elements.name : editCancel).focus();
  });
  form.addEventListener('submit', event => {
    event.preventDefault();
    const fields = new FormData(form);
    void changeCharacter({action:'create', name:fields.get('name'), gender:fields.get('gender'), weaponType:fields.get('weaponType')});
  });
  login.addEventListener('click', async () => {
    if (writing || loading) return;
    writing = true;
    render();
    try { await cloud.signIn('home'); }
    catch { showStatus('無法開始登入，請稍後再試。', true); }
    finally {
      writing = false;
      render();
    }
  });
  window.addEventListener('pageshow', event => { if (event.persisted) void showRealm(realm); });

  async function boot() {
    let loginError = '';
    if (hasPublicRoster) {
      try { await cloud.completeLogin(); }
      catch { loginError = '登入未完成，請再試一次。'; }
    }
    booting = false;
    await showRealm(realm, loginError);
    await gameView.restoreLocation();
  }
  void boot();
}

if (document.querySelector('[data-home-view]:not([data-portable])')) mountHomeRoster();
