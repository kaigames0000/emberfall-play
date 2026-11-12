import * as M from './model.js?v=140';
import { watchBplusImages, bplusAsset } from './bplus-art.js?v=124';
import { drawBplusHero } from './bplus-hero.js?v=124';
import { drawAnimePickup, drawAnimeProp, drawAnimeUnit } from './anime-art.js?v=125';
import { drawAnimeBolt, projectilePaintMargin } from './anime-effects.js?v=125';
import { combatVisualOptions, drawCombatEffect, drawCombatField, fieldInView } from './field-effects.js?v=135';
import { drawFieldProp, drawSceneSprite, scenePickup, sceneTexture } from './bplus-scene.js?v=124';
import { resolveAppearance } from './character-appearance.js?v=108';
import { appearancePickerMarkup } from './appearance-picker.js?v=124';
import { equipmentArt } from './equipment-visuals.js?v=124';
import { ACTIVE_SKILL_KEYS, FLASK_KEYS, DODGE_KEY, DODGE_LABEL, manualSkillSlot, flaskKeySlot } from './scene-input.js?v=108';

const stepInterval = 125;
const maxStepActions = 8;
const movementKeys = {
  w: [0, -1], a: [-1, 0], s: [0, 1], d: [1, 0],
  arrowup: [0, -1], arrowleft: [-1, 0], arrowdown: [0, 1], arrowright: [1, 0]
};
const playableModes = ['roster', 'camp', 'playing', 'dead', 'victory'];
const roomThemes = [
  {floor: 'abbey-stone', color: '#333543', block: '#53505d', edge: '#91867d'},
  {floor: 'dock-wood', color: '#3d3c40', block: '#183744', edge: '#708b8b'},
  {floor: 'court-stone', color: '#3c354c', block: '#171a2d', edge: '#8d83ab'}
];
const rarityColors = ['#dfdcc9', '#98c4e8', '#ecc66d', '#c8a0ed', '#e88581', '#f3ac6e'];
const routeType = {normal:'戰鬥', elite:'菁英', reward:'寶庫', rest:'回復', secret:'秘室', trial:'試煉', miniboss:'小首領', boss:'首領'};
const breakables = new Set(['barrel', 'crate', 'urn']);
const gatewayMessages = {
  unauthorized: '登入已失效，請重新登入。',
  revision_conflict: '遠征進度已更新，請重新連線。',
  command_in_progress: '遠征仍在處理指令，請稍後再試。',
  rate_limited: '遠征連線忙碌，請稍後再試。'
};
const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'})[ch]);
const limit = (value, min, max) => Math.max(min, Math.min(max, value));
const option = (value, name, selected = false, disabled = false) => `<option value="${esc(value)}"${selected ? ' selected' : ''}${disabled ? ' disabled' : ''}>${esc(name)}</option>`;
const finitePoint = item => Number.isFinite(item?.x) && Number.isFinite(item?.y);

function connectionMessage(error) {
  const message = error?.result?.message || error?.message;
  if (typeof message === 'string' && /[\u3000-\u9fff]/.test(message)) return message.slice(0, 240);
  const code = error?.result?.error ?? error?.code ?? message;
  return Object.hasOwn(gatewayMessages, code) ? gatewayMessages[code] : '目前無法連線至認證遠征。';
}

function paintCircle(ctx, x, y, radius, fill, stroke) {
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.stroke(); }
}

function paintRoom(ctx, view, bounds) {
  const theme = roomThemes[view.chapter - 1] ?? roomThemes[0];
  const floor = sceneTexture(theme.floor);
  ctx.fillStyle = (floor && ctx.createPattern(floor, 'repeat')) || theme.color;
  ctx.fillRect(bounds.left, bounds.top, bounds.right - bounds.left, bounds.bottom - bounds.top);
  ctx.strokeStyle = theme.edge;
  ctx.lineWidth = 3;
  ctx.strokeRect(bounds.left, bounds.top, bounds.right - bounds.left, bounds.bottom - bounds.top);
  for (const block of view.terrain?.blocks ?? []) {
    ctx.fillStyle = theme.block;
    ctx.fillRect(block.left, block.top, block.right - block.left, block.bottom - block.top);
    ctx.strokeRect(block.left, block.top, block.right - block.left, block.bottom - block.top);
  }
  for (const bridge of view.terrain?.bridges ?? []) {
    ctx.strokeRect(bridge.left, bridge.top, bridge.right - bridge.left, bridge.bottom - bridge.top);
  }
}

function paintHealth(ctx, unit, color) {
  if (!Number.isFinite(unit.maxHp) || unit.maxHp <= 0 || unit.hp >= unit.maxHp) return;
  const width = unit.type === 'boss' ? 68 : 36;
  const height = unit.type === 'boss' ? 112 : 72;
  ctx.fillStyle = '#141924';
  ctx.fillRect(unit.x - width / 2 - 1, unit.y - height - 1, width + 2, 7);
  ctx.fillStyle = color;
  ctx.fillRect(unit.x - width / 2, unit.y - height, width * limit(unit.hp / unit.maxHp, 0, 1), 5);
}

function paintFallbackWeapon(ctx, weapon) {
  ctx.strokeStyle = weapon.trim ?? '#f1cd85';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(24, 0);
  ctx.stroke();
}

function paintScene(canvas, view, hero, lastPlayer) {
  const player = view?.player;
  const bounds = view?.bounds;
  const width = canvas.clientWidth, height = canvas.clientHeight;
  if (!finitePoint(player) || !bounds || width <= 0 || height <= 0) return null;
  const pixelRatio = Math.min(2, canvas.ownerDocument.defaultView.devicePixelRatio || 1);
  const pixelWidth = Math.round(width * pixelRatio), pixelHeight = Math.round(height * pixelRatio);
  if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
    canvas.width = pixelWidth;
    canvas.height = pixelHeight;
  }
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  const padding = 28;
  const worldWidth = bounds.right - bounds.left + padding * 2;
  const worldHeight = bounds.bottom - bounds.top + padding * 2;
  if (!(worldWidth > 0 && worldHeight > 0)) return null;
  const fit = Math.min(width / worldWidth, height / worldHeight);
  const scale = Math.max(fit, Math.min(.95, width / 1260));
  const axis = (point, min, max, span) => max - min <= span ? (min + max - span) / 2 : limit(point - span / 2, min, max - span);
  const left = axis(player.x, bounds.left - padding, bounds.right + padding, width / scale);
  const top = axis(player.y, bounds.top - padding, bounds.bottom + padding, height / scale);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = '#111623';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const zoom = scale * pixelRatio;
  ctx.setTransform(zoom, 0, 0, zoom, -left * zoom, -top * zoom);
  paintRoom(ctx, view, bounds);

  const clock = view.elapsed ?? 0;
  const camera = {left, top, right:left + width / scale, bottom:top + height / scale};
  const reduced = canvas.ownerDocument.defaultView.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const visuals = combatVisualOptions(view, reduced);
  const hazards = (view.hazards ?? []).filter(field => fieldInView(field, camera));
  for (const field of hazards) {
    if (field.friendly || field.persistentDanger) {
      drawCombatField(ctx, field, {...visuals, clock, kind:field.persistentDanger && field.majorWarning !== false ? 'danger' : 'ground'});
    }
  }
  for (const drop of view.drops ?? []) {
    if (finitePoint(drop)) drawAnimePickup(ctx, drop.x, drop.y, rarityColors[drop.rarity] ?? '#f2d789', 10);
  }
  const figures = [
    {type:'player', unit:player},
    ...(view.foes ?? []).map(unit => ({type:'foe', unit})),
    ...(view.summons ?? []).map(unit => ({type:'ally', unit})),
    ...(view.props ?? []).map(unit => ({type:'prop', unit}))
  ].filter(({unit}) => finitePoint(unit)).sort((a, b) => a.unit.y - b.unit.y);
  for (const {type, unit} of figures) {
    const {x, y} = unit;
    if (type === 'prop') {
      const pickup = scenePickup(unit.kind);
      const drawn = pickup?drawSceneSprite(ctx,pickup,x,y+6,25,25)
        :drawFieldProp(ctx,unit.kind==='objective'?'crystal':unit.kind,x,y,unit.used);
      if (!drawn) {
        if (pickup) drawAnimePickup(ctx, x, y, '#eac789', 8);
        else drawAnimeProp(ctx, unit);
      }
      continue;
    }
    if (type === 'player') {
      const moving = lastPlayer && (lastPlayer.x !== x || lastPlayer.y !== y);
      if (!hero || !drawBplusHero(ctx, resolveAppearance(hero), {x, y, angle:unit.angle, moving, time:view.elapsed}, paintFallbackWeapon)) {
        paintCircle(ctx, x, y - 10, 15, '#d7e4bd', '#202938');
      }
      continue;
    }
    const ally = type === 'ally';
    if (!ally && view.targetId != null && view.targetId === unit.id) paintCircle(ctx, x, y + 2, (unit.r ?? 16) + 7, null, '#f7df9a');
    if (!drawAnimeUnit(ctx, unit, view.elapsed ?? 0, ally, view.chapter)) {
      paintCircle(ctx, x, y - 8, unit.r ?? 14, unit.color ?? (ally ? '#91c7dc' : '#d7927a'), '#251d25');
    }
    paintHealth(ctx, unit, ally ? '#b0d4a0' : '#ed9583');
  }
  for (const effect of view.effects ?? []) drawCombatEffect(ctx, effect, clock, visuals, camera);
  for (const hostile of [false, true]) for (const bullet of view.bullets ?? []) {
    const margin = projectilePaintMargin(bullet);
    if (!!bullet.hostile === hostile && fieldInView(bullet, camera, margin - (bullet.r ?? 0))) {
      drawAnimeBolt(ctx, bullet, visuals);
    }
  }
  for (const field of hazards) {
    if (!field.friendly && !field.persistentDanger) drawCombatField(ctx, field, {...visuals, clock, kind:'warning'});
  }
  return {left, top, scale};
}

// Mount in the host dialog, open after attaching it, and close on dialog exit.
export function createVerifiedPanel({ request }) {
  const element = document.createElement('section');
  element.className = 'verified-panel';
  element.innerHTML = `
    <div class="verified-status-row">
      <p class="verified-status" role="status"></p>
      <button type="button" class="text-btn" data-verified-command="load" hidden>重新連線</button>
    </div>
    <div class="verified-lobby" hidden>
      <p class="verified-note">認證遠征使用帳號的新角色，角色與進度由伺服器保存。</p>
      <fieldset class="verified-command-group" data-verified-group>
        <label class="verified-field" data-verified-roster hidden>遠征角色<select data-verified-select="character"></select></label>
        <details data-verified-create>
          <summary>建立角色</summary>
          <form class="verified-form-row" data-verified-form="create">
            <label class="verified-field">角色名稱<input name="name" maxlength="24" autocomplete="off" placeholder="無名旅人"></label>
            <label class="verified-field">起始武器<select name="weaponType">${M.RING_START_WEAPONS.map(type => option(type, M.WEAPON_TYPES[type].name)).join('')}</select></label>
            ${appearancePickerMarkup()}
            <button type="submit" class="gold-btn">建立 Lv.1 角色</button>
          </form>
        </details>
      </fieldset>
      <fieldset class="verified-command-group" data-verified-group data-verified-camp hidden>
        <p class="verified-note" data-verified-stats></p>
        <form class="verified-form-row" data-verified-form="start">
          <label class="verified-field">難度<select name="difficulty" data-verified-select="difficulty"></select></label>
          <label class="verified-field">章節<select name="chapter"></select></label>
          <button type="submit" class="gold-btn">開始遠征</button>
        </form>
        <details><summary>燼脈圖</summary>
          <div class="verified-build" data-verified-ring></div>
        </details>
        <details><summary>技能與召喚</summary><div class="verified-build" data-verified-skills></div></details>
        <details><summary>裝備與背包</summary><div class="verified-build" data-verified-gear></div></details>
      </fieldset>
    </div>
    <div class="verified-stage" hidden>
      <div class="verified-hud">
        <div><strong data-verified-room></strong><small data-verified-progress></small></div>
        <p data-verified-vitals></p>
        <button type="button" class="text-btn" data-verified-command="camp">返回營地</button>
      </div>
      <p class="verified-boss" data-verified-boss hidden></p>
      <p class="verified-note" data-verified-buffs hidden></p>
      <fieldset class="verified-routes" data-verified-group data-verified-routes hidden></fieldset>
      <div class="verified-world" role="region" aria-label="認證遠征戰場" tabindex="0">
        <canvas aria-label="伺服器遠征畫面"></canvas>
        <div class="verified-stick" aria-label="移動搖桿"><i></i></div>
        <div class="verified-combat" aria-label="戰鬥操作">
          <button type="button" data-verified-input="attack">普攻 <small>J</small></button>
          ${ACTIVE_SKILL_KEYS.map((key, slot) => `<button type="button" data-verified-input="cast" data-slot="${slot}"><span>技能 ${key}</span> <small>${slot === 2 ? key + '／Q' : key}</small></button>`).join('')}
          <button type="button" data-verified-input="dodge">閃避 <small>${DODGE_LABEL}</small></button>
          <button type="button" data-verified-input="summon">召喚 <small>C</small></button>
          ${FLASK_KEYS.map((key, slot) => `<button type="button" data-verified-input="potion" data-slot="${slot}"><span>藥水 ${slot + 1}</span> <small>${key}</small></button>`).join('')}
        </div>
      </div>
      <p class="verified-note verified-key-help">方向鍵或 WASD 移動。點選敵人瞄準，靠近後可點選物件或拾取戰利品。</p>
    </div>`;

  const doc = element.ownerDocument, win = doc.defaultView;
  const find = selector => element.querySelector(selector);
  const status = find('[role="status"]'), retry = find('[data-verified-command="load"]');
  const lobby = find('.verified-lobby'), create = find('[data-verified-create]');
  const roster = find('[data-verified-roster]'), character = roster.querySelector('select');
  const camp = find('[data-verified-camp]'), start = find('[data-verified-form="start"]');
  const ring = find('[data-verified-ring]'), skills = find('[data-verified-skills]'), gear = find('[data-verified-gear]');
  const stage = find('.verified-stage'), world = find('.verified-world'), canvas = find('canvas');
  const stick = find('.verified-stick'), knob = stick.querySelector('i');
  const routes = find('[data-verified-routes]'), campButton = find('[data-verified-command="camp"]');
  const inputButtons = [...element.querySelectorAll('[data-verified-input]')];
  const commandGroups = [...element.querySelectorAll('[data-verified-group]')];
  const portrait = win.matchMedia('(pointer: coarse) and (orientation: portrait)');
  const resize = new win.ResizeObserver(queueDraw);
  const keys = new Set(), attackPointers = new Map(), actions = [];
  let joy = {x:0,y:0}, stickPointer = null, pulse = false, aim = null;
  let view = null, profile = null, lastPlayer = null, projection = null, routeKey = '';
  let visible = false, visit = 0, halted = false, commandLock = null, pending = null;
  let timer = null, frame = null, lastStep = -Infinity, stopWatching = null;

  const activeHero = () => profile?.characters?.[profile.active];
  const canStep = () => visible && element.isConnected && !doc.hidden && !portrait.matches && !halted && view?.mode === 'playing';
  const canInput = () => canStep() && !commandLock && !view.transitioning;

  function showStatus(message, error = false) {
    if (status.textContent !== message) status.textContent = message;
    status.classList.toggle('verified-error', error);
    status.dataset.error = String(error);
  }

  function queueDraw() {
    if (frame !== null || !visible || stage.hidden || doc.hidden) return;
    frame = win.requestAnimationFrame(() => {
      frame = null;
      if (visible && !stage.hidden && !doc.hidden) projection = paintScene(canvas, view, activeHero(), lastPlayer);
    });
  }

  function renderChapters(hero) {
    const chapter = start.elements.namedItem('chapter');
    const difficulty = Number(start.elements.namedItem('difficulty').value);
    const selected = Number(chapter.value) || 1;
    chapter.innerHTML = [1, 2, 3].map(id => option(id, M.chapterDefinition(id).name, id === selected, !M.canChapter(hero, difficulty, id))).join('');
    if (chapter.selectedOptions[0]?.disabled) chapter.value = '1';
  }

  function renderRing(hero) {
    const previous = ring.querySelector('select')?.value;
    const roots = [M.RING_TREE.root, ...Object.keys(hero.ring ?? {})];
    const neighbors = new Set(roots.flatMap(id => M.RING_TREE.byId[id]?.neighbors ?? []));
    const nodes = [...neighbors].map(id => M.ringNodeState(hero, id))
      .filter(state => state.node && !state.node.retired && (!state.rank || state.maxRank > state.rank));
    nodes.sort((a, b) => Number(b.ok) - Number(a.ok));
    const respec = M.respecStonePreview(profile, hero.id, 'camp');
    ring.innerHTML = `<p>可用天賦點 ${M.ringPoints(hero)}</p>
      <div class="verified-form-row"><label class="verified-field">相連天賦<select data-verified-select="ring">
        ${nodes.map(({node,rank,maxRank}) => option(node.id, [node.themeName, node.name, maxRank>1?`Lv. ${rank}/${maxRank}`:''].filter(Boolean).join('・'), node.id === previous)).join('')}
      </select></label><button type="button" class="gold-btn" data-verified-command="allocate">配置天賦</button></div><p data-verified-node></p>
      <details><summary>返脈石 · 持有 ${respec.count}</summary>
        <p>${M.DIFFICULTIES[1].name}印記 ${respec.marks} · 通過${M.DIFFICULTIES[1].name}第二章後可兌換。</p>
        <div class="verified-form-row">
          <button type="button" class="outline-btn" data-verified-command="redeem-respec" ${respec.ok?'':'disabled'}>兌換 · ${respec.cost} 枚${M.DIFFICULTIES[1].name}印記</button>
          <button type="button" class="gold-btn" data-verified-command="respec" ${respec.canUse?'':'disabled'}>消耗 1 顆並重置</button>
        </div><small>${esc(respec.canUse?'使用後退回所有天賦點。':respec.useReason)}</small>
      </details>`;
    renderRingSelection(hero);
  }

  function renderRingSelection(hero) {
    const id = ring.querySelector('select')?.value;
    const state = M.ringNodeState(hero, id);
    const description = state.node?.description || state.node?.effectDescription || '';
    const skill = state.node?.talentId&&M.skillNode(hero.cls,state.node.talentId);
    const def = skill?.basicAttack?M.previewBasicAttack(hero,skill.basicAttack,state.rank||1)
      :skill?.ability?M.previewAbility(hero,skill.ability,state.rank||1):null;
    const next = def?.masteries?.find(milestone=>milestone.rank>state.rank);
    ring.querySelector('[data-verified-node]').textContent = [description,
      next?`Lv. ${next.rank} · ${next.label}`:'', state.reason].filter(Boolean).join('　');
    const button = ring.querySelector('[data-verified-command="allocate"]');
    button.textContent = state.maxRank>1?(state.rank?`升至 Lv. ${state.nextRank} · 1 點`:'習得 · 1 點'):'投入 1 點';
    button.disabled = !state.ok;
  }

  function renderSkills(hero) {
    const assigned = M.skillLoadout(hero);
    const manual = M.manualSkills(hero);
    const slots = assigned.map((id, slot) => `<label class="verified-field">技能 ${slot + 1}
      <select data-verified-select="skill" data-slot="${slot}">${option('', '空白', !id)}${manual.map(skill => option(skill, M.ABILITIES[skill].name, id === skill, id !== skill && assigned.includes(skill))).join('')}</select></label>`);
    const summons = M.availableSkills(hero).filter(id => M.skillCategory(id) === 'summon').map(id => `<form class="verified-form-row" data-verified-form="summon-config" data-id="${esc(id)}">
      <label class="verified-field">${esc(M.ABILITIES[id].name)}<input name="count" type="number" min="0" max="${M.summonCapacity(hero)}" required value="${hero.summonSkills?.[id] ?? 0}"></label>
      <button type="submit" class="text-btn">套用數量</button></form>`);
    skills.innerHTML = `<div class="verified-form-row">${slots.join('')}</div>${summons.join('')}`;
  }

  function itemLabel(item) {
    const icon = equipmentArt(item);
    return `${icon ? `<img src="${esc(bplusAsset(icon))}" width="26" height="26" alt="">` : ''}<span>${esc(item.name)} <small>Lv.${esc(item.level)}</small></span>`;
  }

  function renderGear(hero) {
    const worn = Object.entries(hero.equipment ?? {}).map(([slot, item]) => `<li>${itemLabel(item)}
      <button type="button" class="text-btn" data-verified-command="unequip" data-slot="${esc(slot)}">卸下${esc(M.SLOT_NAMES[slot])}</button></li>`);
    const bag = (hero.bag ?? []).map(item => {
      const targets = item.slot === 'ring' ? ['ring_left', 'ring_right'] : item.slot === 'weapon' ? ['weapon', 'offhand'] : [item.slot];
      const choices = targets.map(slot => M.equipRequirement(hero, item, slot));
      const buttons = choices.filter(choice => choice.ok).map(({targetSlot}) => `<button type="button" class="text-btn" data-verified-command="equip" data-id="${esc(item.id)}" data-slot="${esc(targetSlot)}">裝備至${esc(M.SLOT_NAMES[targetSlot])}</button>`);
      return `<li>${itemLabel(item)}${buttons.join('') || `<small>${esc(choices[0]?.reason)}</small>`}</li>`;
    });
    gear.innerHTML = `<h3>穿戴</h3><ul>${worn.join('') || '<li>尚未穿戴裝備</li>'}</ul><h3>背包</h3><ul>${bag.join('') || '<li>背包目前是空的</li>'}</ul>`;
  }

  function renderLobby() {
    const heroes = Object.values(profile?.characters ?? {});
    const hero = activeHero();
    roster.hidden = !heroes.length;
    character.innerHTML = `${option('', '請選擇角色', !hero, true)}${heroes.map(entry => option(entry.id, `${entry.name} · Lv.${entry.level}`, entry.id === profile?.active)).join('')}`;
    if (!heroes.length) create.open = true;
    camp.hidden = !hero;
    if (!hero) return;
    const stats = view?.stats;
    const statLine = find('[data-verified-stats]');
    statLine.hidden = !stats;
    statLine.textContent = stats ? `攻擊 ${Math.round(stats.attack)}　護甲 ${Math.round(stats.armor)}　移動速度 ${Math.round(stats.speed)}` : '';
    const difficulty = start.elements.namedItem('difficulty');
    const selected = Number(difficulty.value) || hero.difficulty || 1;
    difficulty.innerHTML = [1, 2, 3].map(id => option(id, M.DIFFICULTIES[id].name, id === selected, !M.canDifficulty(hero, id))).join('');
    if (difficulty.selectedOptions[0]?.disabled) difficulty.value = '1';
    renderChapters(hero);
    renderRing(hero);
    renderSkills(hero);
    renderGear(hero);
  }

  function renderStage() {
    const room = view.room;
    find('[data-verified-room]').textContent = room?.name ?? (view.mode === 'victory' ? '遠征完成' : '遠征結束');
    const chapter = M.chapterDefinition(view.chapter)?.name;
    const difficulty = M.DIFFICULTIES[view.difficulty]?.name;
    const phase = view.transitioning ? '進入下一房' : view.mode === 'dead' ? '角色已倒下' : view.mode === 'victory' ? '遠征完成' : view.cleared ? '房間已清除' : room?.waves ? `第 ${room.wave}／${room.waves} 波` : '';
    const elapsed = Math.max(0, Math.floor(view.elapsed || 0));
    const time = `${Math.floor(elapsed / 60)}:${String(elapsed % 60).padStart(2, '0')}`;
    find('[data-verified-progress]').textContent = [chapter, difficulty, phase, time].filter(Boolean).join('・');
    const player = view.player;
    find('[data-verified-vitals]').textContent = player ? `${player.name} Lv.${player.level}　生命 ${Math.ceil(player.hp)}/${Math.ceil(player.maxHp)}　魔力 ${Math.ceil(player.mana)}/${Math.ceil(player.maxMana)}` : '';
    const boss = (view.foes ?? []).find(unit => unit.type === 'boss' || unit.type === 'miniboss');
    const bossLine = find('[data-verified-boss]');
    bossLine.hidden = !boss;
    bossLine.textContent = boss ? `${boss.name}　生命 ${Math.ceil(boss.hp)} / ${Math.ceil(boss.maxHp)}` : '';
    const buffs = (view.buffs ?? []).filter(buff => buff.name).slice(0, 4);
    const buffLine = find('[data-verified-buffs]');
    buffLine.hidden = !buffs.length;
    buffLine.textContent = buffs.map(buff => `${buff.name} ${Math.ceil(buff.remaining)} 秒`).join('・');
    const choices = view.routes ?? [];
    const nextKey = choices.map(route => route.id).join('|');
    if (nextKey !== routeKey) {
      routeKey = nextKey;
      routes.innerHTML = choices.map(route => `<button type="button" class="gold-btn" data-verified-command="next" data-id="${esc(route.id)}">${esc(route.name)} <small>${esc(routeType[route.type] ?? '')}</small></button>`).join('');
    }
    routes.hidden = !choices.length || view.transitioning || view.mode !== 'playing';
    for (const button of inputButtons) {
      const type = button.dataset.verifiedInput;
      const slot = Number(button.dataset.slot);
      const record = (type === 'cast' ? view.skills : type === 'potion' ? view.flasks : [])?.find(entry => entry.slot === slot);
      button.disabled = !canInput() || (type === 'cast' && (!record?.id || record.cooldown > 0)) || (type === 'potion' && (!record?.charges || record.cooldown > 0));
      if (type === 'cast' || type === 'potion') {
        const name = record?.name ?? (type === 'cast' ? `技能 ${slot + 1}` : `藥水 ${slot + 1}`);
        button.querySelector('span').textContent = type === 'potion' && record?.maxCharges > 0 ? `${name} ${record.charges}/${record.maxCharges}` : name;
      }
    }
    queueDraw();
  }

  function renderView(refocus = false) {
    const atCamp = view?.mode === 'camp' || view?.mode === 'roster';
    lobby.hidden = !atCamp;
    stage.hidden = !view || atCamp;
    if (atCamp) renderLobby();
    if (!stage.hidden) {
      renderStage();
      if (refocus && view.mode === 'playing') world.focus({preventScroll:true});
    }
  }

  function clearTimer() {
    if (timer !== null) win.clearTimeout(timer);
    timer = null;
  }

  function resetInput() {
    keys.clear();
    for (const [pointer, node] of attackPointers) {
      if (node.hasPointerCapture(pointer)) node.releasePointerCapture(pointer);
    }
    attackPointers.clear();
    actions.length = 0;
    pulse = false;
    aim = null;
    const pointer = stickPointer;
    stickPointer = null;
    if (pointer !== null && stick.hasPointerCapture(pointer)) stick.releasePointerCapture(pointer);
    joy = {x:0,y:0};
    knob.style.transform = '';
  }

  function schedule() {
    if (timer !== null || pending || commandLock || !canStep()) return;
    timer = win.setTimeout(() => {
      timer = null;
      if (!canStep() || pending || commandLock) return;
      const move = { ...joy };
      for (const key of keys) {
        const direction = movementKeys[key];
        if (direction) { move.x += direction[0]; move.y += direction[1]; }
      }
      const length = Math.max(1, Math.hypot(move.x, move.y));
      const input = {x:move.x / length, y:move.y / length, attack:pulse || keys.has('j') || attackPointers.size > 0};
      if (aim && input.attack) {
        input.aimX = aim.x;
        input.aimY = aim.y;
      }
      if (aim && !attackPointers.has(aim.pointer)) aim = null;
      pulse = false;
      lastStep = win.performance.now();
      issue({action:'step', input, actions:actions.splice(0, maxStepActions)});
    }, Math.max(0, stepInterval - (win.performance.now() - lastStep)));
  }

  function issue(payload) {
    const currentVisit = visit;
    const step = payload.action === 'step';
    const current = () => visible && visit === currentVisit;
    pending = Promise.resolve().then(async () => {
      if (!current() || step && !canStep()) return null;
      try {
        return await request(payload);
      } catch (error) {
        // Reopening a panel can briefly overlap the gateway's previous read.
        if (payload.action !== 'load' || ![409,429].includes(error?.status)) throw error;
        await new Promise(resolve => win.setTimeout(resolve,650));
        return current() ? request(payload) : null;
      }
    }).then(result => {
      if (!current() || result === null) return false;
      if (!playableModes.includes(result?.view?.mode)) throw Error('遠征資料格式有誤。');
      const previousMode = view?.mode;
      lastPlayer = view?.player;
      view = result.view;
      if (result.profile) profile = result.profile;
      halted = false;
      retry.hidden = true;
      if (view.mode !== 'playing' || view.transitioning) resetInput();
      if (payload.action === 'create') { create.open = false; create.querySelector('form').reset(); }
      const message = view.events?.findLast(event => typeof event.message === 'string' && event.message.trim())?.message;
      if (!step || message && status.dataset.error !== 'true') showStatus(message ?? '');
      if (step && !stage.hidden && previousMode === view.mode) renderStage();
      else renderView(previousMode !== view.mode || payload.action === 'load');
      return true;
    }).catch(error => {
      if (!current()) return false;
      if (step || payload.action === 'load') { halted = true; resetInput(); retry.hidden = false; }
      showStatus(connectionMessage(error), true);
      renderView();
      return false;
    }).finally(() => { pending = null; schedule(); });
    return pending;
  }

  function setCommandBusy(busy) {
    for (const group of commandGroups) group.disabled = busy;
    campButton.disabled = busy;
    retry.disabled = busy;
    if (!stage.hidden) renderStage();
  }

  async function command(payload) {
    if (!visible || commandLock) return false;
    const lock = {};
    commandLock = lock;
    clearTimer();
    resetInput();
    setCommandBusy(true);
    try {
      if (pending) await pending;
      if (!visible || commandLock !== lock) return false;
      showStatus(payload.action === 'load' ? '正在連線…' : '處理中…');
      return await issue(payload);
    } finally {
      if (commandLock === lock) {
        commandLock = null;
        setCommandBusy(false);
        schedule();
      }
    }
  }

  function queueInput(action) {
    if (canInput() && actions.length < maxStepActions) actions.push(action);
  }

  function onVisibility() {
    if (doc.hidden || portrait.matches) {
      clearTimer();
      resetInput();
    } else {
      queueDraw();
      schedule();
    }
  }

  function open() {
    if (visible) return pending ?? Promise.resolve(true);
    visible = true;
    visit++;
    showStatus('正在連線…');
    doc.addEventListener('visibilitychange', onVisibility);
    portrait.addEventListener('change', onVisibility);
    win.addEventListener('blur', resetInput);
    resize.observe(canvas);
    stopWatching = watchBplusImages(queueDraw);
    return command({action:'load'});
  }

  function close() {
    if (!visible) return;
    visible = false;
    visit++;
    commandLock = null;
    clearTimer();
    resetInput();
    if (frame !== null) win.cancelAnimationFrame(frame);
    frame = null;
    resize.disconnect();
    stopWatching?.();
    stopWatching = null;
    doc.removeEventListener('visibilitychange', onVisibility);
    portrait.removeEventListener('change', onVisibility);
    win.removeEventListener('blur', resetInput);
    view = profile = lastPlayer = projection = null;
    halted = false;
    retry.hidden = true;
    renderView();
  }

  element.addEventListener('submit', event => {
    const form = event.target;
    const action = form.dataset.verifiedForm;
    if (!action) return;
    event.preventDefault();
    const value = name => form.elements.namedItem(name).value;
    if (action === 'create') {
      const name = value('name').trim();
      if ([...name].length > 12) { showStatus('角色名稱最多 12 個字。', true); return; }
      command({action, name, weaponType:value('weaponType'), gender:value('gender')});
    } else if (action === 'start') command({action, chapter:Number(value('chapter')), difficulty:Number(value('difficulty'))});
    else if (action === 'summon-config') command({action, id:form.dataset.id, count:Number(value('count'))});
  });

  element.addEventListener('change', event => {
    const input = event.target;
    switch (input.dataset.verifiedSelect) {
      case 'character': if (input.value) command({action:'select', id:input.value}); break;
      case 'difficulty': renderChapters(activeHero()); break;
      case 'ring': renderRingSelection(activeHero()); break;
      case 'skill': command({action:'skill', slot:Number(input.dataset.slot), id:input.value || null}); break;
    }
  });

  element.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button || button.disabled) return;
    const {verifiedCommand:action, verifiedInput:type, id, slot} = button.dataset;
    if (action === 'allocate') command({action, id:ring.querySelector('select').value});
    else if (action) command({action, ...(id ? {id} : {}), ...(slot ? {slot} : {})});
    else if (type) {
      if (type === 'attack') { if (canInput() && !event.detail) pulse = true; }
      else queueInput(slot === undefined ? {type} : {type, slot:Number(slot)});
      if (!win.matchMedia('(pointer: coarse)').matches) world.focus({preventScroll:true});
    }
  });

  element.addEventListener('keydown', event => {
    if (!canInput() || event.isComposing || event.ctrlKey || event.metaKey || event.altKey || event.target.closest('input,select,textarea,[contenteditable]')) return;
    const key = event.key.toLowerCase();
    if (key === ' ' && event.target.closest('button,summary')) return;
    const cast = manualSkillSlot(key);
    const potion = flaskKeySlot(key);
    if (Object.hasOwn(movementKeys, key) || key === 'j') {
      keys.add(key);
      if (key === 'j' && !event.repeat) pulse = true;
    } else if (cast >= 0 || potion >= 0 || key === DODGE_KEY || key === 'c') {
      if (!event.repeat) {
        if (cast >= 0) queueInput({type:'cast', slot:cast});
        else if (potion >= 0) queueInput({type:'potion', slot:potion});
        else queueInput({type:key === DODGE_KEY ? 'dodge' : 'summon'});
      }
    } else return;
    event.preventDefault();
    event.stopPropagation();
  });
  element.addEventListener('keyup', event => { if (keys.delete(event.key.toLowerCase())) event.stopPropagation(); });
  element.addEventListener('focusout', event => { if (!element.contains(event.relatedTarget)) resetInput(); });

  function startAttack(event) {
    attackPointers.set(event.pointerId, event.currentTarget);
    pulse = true;
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  const attack = find('[data-verified-input="attack"]');
  attack.addEventListener('pointerdown', event => { if (canInput() && event.button === 0) startAttack(event); });
  canvas.addEventListener('pointerdown', event => {
    if (!canInput() || !projection || event.button !== 0) return;
    event.preventDefault();
    world.focus({preventScroll:true});
    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left - canvas.clientLeft) / projection.scale + projection.left;
    const y = (event.clientY - rect.top - canvas.clientTop) / projection.scale + projection.top;
    const candidates = [
      ...(view.foes ?? []).map(unit => ({unit, type:'target'})),
      ...(view.drops ?? []).map(unit => ({unit, type:'pickup'})),
      ...(view.props ?? []).filter(unit => !unit.used).map(unit => ({unit, type:'prop'}))
    ];
    let best = null, distance = Infinity;
    for (const candidate of candidates) {
      const unit = candidate.unit;
      const d = Math.hypot(x - unit.x, y - unit.y + (candidate.type === 'target' ? 16 : 0));
      if (d < distance && d < Math.max((unit.r ?? 15) + 10, 15 / projection.scale)) { best = candidate; distance = d; }
    }
    if (best) {
      const {unit, type} = best;
      const near = Math.hypot(unit.x - view.player.x, unit.y - view.player.y) < 80;
      if (type === 'target') {
        aim = null;
        queueInput({type, id:unit.id});
        startAttack(event);
      } else if (type === 'prop' && breakables.has(unit.kind)) {
        aim = {x:unit.x, y:unit.y, pointer:event.pointerId};
        startAttack(event);
      } else if (near && type === 'pickup') queueInput({type, id:unit.id});
      else if (near && !scenePickup(unit.kind)) queueInput({type:'interact', id:unit.id});
      else queueInput({type:'move', x:unit.x, y:unit.y});
    } else if (x >= view.bounds.left && x <= view.bounds.right && y >= view.bounds.top && y <= view.bounds.bottom) queueInput({type:'move', x, y});
  });
  for (const node of [attack, canvas]) {
    for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) node.addEventListener(type, event => attackPointers.delete(event.pointerId));
  }

  function steer(event) {
    if (stickPointer !== event.pointerId) return;
    const rect = stick.getBoundingClientRect();
    const x = (event.clientX - rect.left - rect.width / 2) / (rect.width / 2);
    const y = (event.clientY - rect.top - rect.height / 2) / (rect.height / 2);
    const length = Math.max(1, Math.hypot(x, y));
    joy = {x:x / length, y:y / length};
    knob.style.transform = `translate(${joy.x * 24}px, ${joy.y * 24}px)`;
  }
  stick.addEventListener('pointerdown', event => {
    if (!canInput() || stickPointer !== null || event.button !== 0) return;
    event.preventDefault();
    stickPointer = event.pointerId;
    stick.setPointerCapture(event.pointerId);
    steer(event);
  });
  stick.addEventListener('pointermove', steer);
  for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) stick.addEventListener(type, event => {
    if (stickPointer !== event.pointerId) return;
    stickPointer = null;
    joy = {x:0,y:0};
    knob.style.transform = '';
  });

  return {element, open, close};
}
