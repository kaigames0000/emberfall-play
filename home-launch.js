import * as M from './model.js?v=140';
import {appearancePickerMarkup} from './appearance-picker.js?v=124';
import {openProfileStore} from './profile-storage.js?v=108';
import {cloudEndpoints, createCloudClient} from './cloud-client.js?v=108';

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

const cloud = createCloudClient();
const hasPublicRoster = Boolean(cloudEndpoints()?.verified && cloud.verifiedEnabled);
let realm = hasPublicRoster ? 'verified' : 'local';
let profile = null, remoteMode = null, localStore = null, publicLoad = null;
let requestNumber = 0, booting = true, loading = true, writing = false;
let creating = false, retryable = false, recoverable = false;

find('[data-home-appearance]').innerHTML = appearancePickerMarkup();
for (const id of M.RING_START_WEAPONS) form.elements.namedItem('weaponType').add(new Option(M.WEAPON_TYPES[id].name, id));

const locked = () => realm === 'local' ? !!profile?.rifts?.activeRun : !!remoteMode && !['camp','roster'].includes(remoteMode);

function showStatus(message, error = false) {
  status.textContent = message;
  status.dataset.error = String(error);
}

function render() {
  const heroes = Object.values(profile?.characters ?? {});
  const active = profile?.characters?.[profile.active];
  const busy = booting || loading || writing;
  const lockedRoster = locked();
  tabs.hidden = !hasPublicRoster;
  for (const button of realmButtons) {
    button.setAttribute('aria-pressed', String(button.dataset.realm === realm));
    button.disabled = booting || writing;
  }
  login.hidden = realm !== 'verified' || !!cloud.account || loading;
  login.disabled = busy;
  choice.hidden = !heroes.length || creating;
  roster.replaceChildren(...heroes.map(hero => new Option(`${hero.name} · Lv.${hero.level}`, hero.id, false, hero.id === active?.id)));
  roster.disabled = busy || lockedRoster;
  create.disabled = busy || lockedRoster || heroes.length >= M.MAX_CHARACTERS;
  form.hidden = !profile || lockedRoster || !creating;
  form.querySelector('fieldset').disabled = busy;
  cancel.hidden = !active;
  enter.hidden = !active || creating || busy;
  if (enter.hidden) enter.removeAttribute('href');
  else enter.setAttribute('href', realm === 'verified' ? './play.html?realm=verified' : './play.html');
  retry.hidden = !retryable || busy;
  recovery.hidden = realm !== 'local' || !recoverable;
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
  if (command.action === 'create') {
    const result = M.createCharacter(candidate, command.name, 'wanderer', command.weaponType, command.gender);
    if (!result.ok) throw Error(result.error);
  } else if (!M.selectCharacter(candidate, command.id)) throw Error('找不到這位角色。');
  return store.save(candidate);
}

async function changeCharacter(command) {
  if (loading || writing || !profile || locked()) return;
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
    creating = false;
    form.reset();
    showStatus(statusForRoster());
  } catch (error) {
    if (realm === 'local') {
      try { profile = await (await openLocal()).load(); } catch {}
      if (locked()) creating = false;
    } else if (!cloud.account) {
      profile = remoteMode = null;
      creating = false;
    }
    showStatus(errorMessage(error, '無法儲存角色，請稍後再試。'), true);
  } finally {
    writing = false;
    render();
  }
}

for (const button of realmButtons) button.addEventListener('click', () => {
  if (button.dataset.realm !== realm) void showRealm(button.dataset.realm);
});
retry.addEventListener('click', () => { void showRealm(realm); });
roster.addEventListener('change', () => {
  if (roster.value !== profile?.active) void changeCharacter({action:'select', id:roster.value});
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
}
void boot();
