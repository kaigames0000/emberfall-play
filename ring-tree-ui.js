import {colorTerms} from './skill-presentation.js?v=130';
import {PASSIVE_MOD_NAMES} from './passive-tree.js?v=108';
import {ringDerived} from './ring-tree.js?v=133';
import {routeRingConnections} from './ring-tree-paths.js?v=132';

const KIND = {
 skill:{label:'技能',mark:'✦'},
 passive:{label:'屬性',mark:'·'},
 survival:{label:'生存',mark:'♡'},
 mechanic:{label:'機制',mark:'✧'},
 equipment:{label:'裝備條件',mark:'▰'}
};
const STATES = {owned:'已點亮',draft:'已預選',available:'可投入',locked:'尚未解鎖'};
const FALLBACK_STATS = {manaOnHit:'命中回魔',dualDamage:'雙持傷害',coldDamage:'冰霜傷害',coldResist:'冰霜抗性',lightningPen:'閃電穿透',poisonResist:'毒素抗性',poisonDotDamage:'毒素持續傷害',projectileRange:'投射物射程',farDamage:'遠距傷害',poisonStacks:'毒素層數上限',
 hp:'最大生命',mana:'最大魔力',armor:'護甲',damage:'傷害',attackSpeed:'攻擊速度',
 moveSpeed:'移動速度',castSpeed:'施法速度',crit:'暴擊率',critDamage:'暴擊傷害',
 allRes:'全元素抗性',fireRes:'火焰抗性',coldRes:'冰霜抗性',lightningRes:'閃電抗性',poisonRes:'毒素抗性',
 physicalDamage:'物理傷害',spellDamage:'法術傷害',pierce:'穿透次數',evasion:'閃避率', leech: '生命吸取', manaLeech: '魔力吸取',coldPen:'冰霜穿透',poisonPen:'毒素穿透',lightningDamage:'閃電傷害',poisonDamage:'毒素傷害',manaRegen:'每秒魔力回復',summonManaCost:'召喚魔力減耗'
};
const FLAT_STATS = new Set(['poisonStacks','mana','manaRegen','armor','lifeRegen','summonCapacity','pierce','extraProjectiles',
 'trapCapacity','flatManaCost','manaOnHit','manaOnKill']);
const SUMMARY_GROUPS = [
 ['生存', /^(hpPct|armor|.*Resist|reduce|physicalReduce|shieldBlock.*|evasion|leech|basicLeech|skillLeech|lifeRegen.*|bloodRegen|healingPenalty|manaShield|slowResistance)$/],
 ['召喚', /^summon/],
 ['資源與機動', /^(mana.*|lifeCostReduction|auraManaCost|skillCostPenalty|speedPct|movementRecovery)$/],
 ['輸出與技能', /./]
];
const DIRECTIONS = {ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]};
const PAGE_SIZE = 5;
const clamp = (value,min,max) => Math.min(max,Math.max(min,value));
const safeColor = value => /^#[a-f\d]{3}(?:[a-f\d]{3})?$/i.test(value) ? value : '#c8b482';
const normalized = value => String(value??'').normalize('NFKC').toLowerCase().trim();
const escape = value => String(value??'').replace(/[&<>"']/g,char=>({
 '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
})[char]);

function modDisplay(key,value,formatModifier){
 const custom = formatModifier?.(key,value);
 if(custom)return custom;
 const flat = FLAT_STATS.has(key);
 const number = Number((value*(flat?1:100)).toFixed(2));
 const label = key==='lifeRegenPct'?'每秒回復最大生命':FALLBACK_STATS[key]||PASSIVE_MOD_NAMES[key]||key;
 return {label,value:`${number>0?'+':''}${number}${flat?'':'%'}`};
}

function modifierList(rows){
 return rows.length?`<dl class="ring-tree-mods">${rows.map(({label,value})=>
  `<div><dt>${colorTerms(label)}</dt><dd>${colorTerms(value)}</dd></div>`).join('')}</dl>`:'';
}

function graphMarkup(tree,doc){
 const bounds = Math.ceil(tree.radius+50), diameter=bounds*2;
 const orbits = new Map();
 for(const node of tree.nodes){
  if(!node.ring)continue;
  const ring = orbits.get(node.ring)||{count:0,distance:0};
  ring.count++;
  ring.distance+=Math.hypot(node.x,node.y);
  orbits.set(node.ring,ring);
 }
 const rings = [...orbits].sort(([a],[b])=>a-b).map(([ring,{count,distance}])=>{
  const r = distance/count;
  return `<circle class="ring-tree-orbit" data-ring="${ring}" r="${r}"></circle>`;
 }).join('');
 const edges = routeRingConnections(tree).map(({a,b,d})=>
  `<g class="ring-tree-wire" data-from="${escape(a)}" data-to="${escape(b)}"><path class="ring-tree-wire-gap" d="${d}"></path><path class="ring-tree-edge" d="${d}"></path></g>`).join('');
 const nodes = tree.nodes.filter(node=>node.id!==tree.root).map(node=>{
  const kind = KIND[node.kind]||KIND.passive;
  const iconId = 'i-'+node.icon;
  const mark = (node.kind!=='passive'||node.bridge||node.outerPosition&&node.medium)&&/^[\w-]+$/.test(iconId)&&doc.getElementById(iconId)
   ? `<svg aria-hidden="true"><use href="#${iconId}"></use></svg>` : kind.mark;
  return `<button type="button" class="ring-tree-node" data-ring-node="${escape(node.id)}" data-kind="${escape(node.kind)}"${node.major?' data-major="true"':node.medium?' data-medium="true"':''} aria-pressed="false" tabindex="-1" style="left:${node.x}px;top:${node.y}px;--ring-color:${safeColor(node.color)}">
   <span class="ring-tree-mark" aria-hidden="true">${mark}</span>
   ${node.maxRank>1?'<span class="ring-tree-node-rank" aria-hidden="true" hidden></span>':''}
  </button>`;
 }).join('');
 return `<svg class="ring-tree-geometry" aria-hidden="true" viewBox="${-bounds} ${-bounds} ${diameter} ${diameter}" style="left:${-bounds}px;top:${-bounds}px;width:${diameter}px;height:${diameter}px">
  <g>${rings}</g><g>${edges}</g>
 </svg>${nodes}`;
}

function shellMarkup(tree,doc){
 return `<section class="ring-tree" aria-label="環形天賦樹">
  <div class="ring-tree-toolbar">
   <div class="ring-tree-find">
    <input type="search" autocomplete="off" placeholder="搜尋天賦或效果" aria-label="搜尋天賦">
    <div class="ring-tree-results" hidden>
     <div class="ring-tree-result-list"></div>
     <div class="ring-tree-result-pages"><button type="button" data-ring-action="search-prev" aria-label="上一頁搜尋結果">‹</button><span role="status"></span><button type="button" data-ring-action="search-next" aria-label="下一頁搜尋結果">›</button></div>
    </div>
   </div>
   <div class="ring-tree-controls" role="group" aria-label="地圖縮放與定位">
    <button type="button" data-ring-action="out" aria-label="縮小天賦樹" title="縮小天賦樹">−</button>
    <output class="ring-tree-zoom" aria-label="縮放比例"></output>
    <button type="button" data-ring-action="in" aria-label="放大天賦樹" title="放大天賦樹">＋</button>
    <button type="button" data-ring-action="home" aria-label="回到內圈" title="回到內圈">內圈</button>
    <button type="button" data-ring-action="fit" aria-label="天賦樹全覽" title="天賦樹全覽">全覽</button>
   </div>
   <div class="ring-tree-points">
    <span>可用點數 <b></b></span>
    <button type="button" data-ring-action="summary" aria-controls="ring-summary" aria-expanded="false">總加成</button>
    <button type="button" data-ring-action="reset" aria-controls="ring-reset" aria-expanded="false">重置天賦</button>
   </div>
  </div>
  <div class="ring-tree-layout">
   <div class="ring-tree-map">
    <div class="ring-tree-viewport" role="group" aria-label="天賦地圖。拖曳平移，滾輪或雙指縮放。使用方向鍵選擇節點。">
     <div class="ring-tree-world">${graphMarkup(tree,doc)}</div>
    </div>
    <div class="ring-tree-key" aria-label="地圖圖例">
     <span><i data-legend="owned"></i>已點亮</span><span><i data-legend="available"></i>可投入</span><span><i data-legend="locked"></i>未解鎖</span><span><i data-legend="equipment"></i>${KIND.equipment.label}</span><span><i data-legend="survival">♡</i>生存</span>
    </div>
    <div class="ring-tree-draft" role="group" aria-label="確認天賦配置" hidden>
     <span role="status"></span>
     <div class="ring-tree-draft-actions">
      <button type="button" data-ring-action="undo-draft">復原</button>
      <button type="button" data-ring-action="clear-draft">清除</button>
      <button type="button" class="gold-btn" data-ring-action="confirm-draft">確認加點</button>
     </div>
    </div>
   </div>
   <aside class="ring-tree-detail" aria-label="天賦資訊">
    <div data-ring-detail="node">
     <div class="ring-tree-detail-meta"></div>
     <h3></h3>
     <div class="ring-tree-detail-actions">
      <button type="button" data-ring-action="invest">預選 1 點</button>
      <button type="button" data-ring-action="skill" hidden>查看技能</button>
     </div>
     <p class="ring-tree-status" aria-live="polite"></p>
     <div class="ring-tree-detail-body"></div>
    </div>
    <div id="ring-summary" data-ring-detail="summary" hidden>
     <h3 tabindex="-1">天賦總加成</h3>
     <div class="ring-tree-detail-body"></div>
    </div>
    <div id="ring-reset" data-ring-detail="reset" hidden>
     <h3 tabindex="-1">重置天賦</h3>
     <p class="ring-tree-reset-message" aria-live="polite"></p>
     <div class="ring-tree-detail-actions">
      <button type="button" data-ring-action="cancel-reset">取消</button>
      <button type="button" class="gold-btn" data-ring-action="confirm-reset">消耗 1 顆返脈石</button>
     </div>
    </div>
   </aside>
  </div>
 </section>`;
}

export function mountRingTree(container,{
 tree,hero,budget,stateFor,stage,invest,reset,inspectSkill,skillDetails,formatModifier,canReset,resetHint='',toolbarAnchor,draftAnchor
}){
 container.innerHTML = shellMarkup(tree,container.ownerDocument);
 const panel = container.firstElementChild;
 const toolbar = panel.querySelector('.ring-tree-toolbar');
 const find = selector => panel.querySelector(selector)||toolbar.querySelector(selector);
 const viewport = find('.ring-tree-viewport'), world = find('.ring-tree-world');
 const zoomOutput = find('.ring-tree-zoom'), pointsOutput = find('.ring-tree-points b');
 const search = find('input'), results = find('.ring-tree-results'), resultList = find('.ring-tree-result-list');
 const resultStatus = find('.ring-tree-result-pages span');
 const resetButton = find('[data-ring-action="reset"]'), investButton = find('[data-ring-action="invest"]');
 const summaryButton = find('[data-ring-action="summary"]'), confirmButton = find('[data-ring-action="confirm-reset"]');
 const resetMessage = find('.ring-tree-reset-message'), summaryBody = find('#ring-summary .ring-tree-detail-body');
 const skillButton = find('[data-ring-action="skill"]'), outButton = find('[data-ring-action="out"]');
 const inButton = find('[data-ring-action="in"]');
 const detail = find('.ring-tree-detail'), meta = detail.querySelector('.ring-tree-detail-meta');
 const title = detail.querySelector('h3'), content = detail.querySelector('.ring-tree-detail-body');
 const status = detail.querySelector('.ring-tree-status');
 const mapKey = find('.ring-tree-key'), draftBar = find('.ring-tree-draft');
 const draftStatus = draftBar.querySelector('[role="status"]');
 const draftActions = [...draftBar.querySelectorAll('button')];
 const nodeEls = new Map([...world.querySelectorAll('[data-ring-node]')].map(el=>[el.dataset.ringNode,el]));
 const edgeEls = [...world.querySelectorAll('.ring-tree-edge')];
 const edges = routeRingConnections(tree);
 const starterIds = tree.starters??[];
 const startSelection = () => nodeEls.has(hero.ringOrigin)?hero.ringOrigin:starterIds[0]??nodeEls.keys().next().value;
 const starterRadius = Math.max(0,...tree.nodes.filter(node=>node.ring===1).map(node=>Math.hypot(node.x,node.y)));
 const searchTerms = tree.nodes.filter(node=>nodeEls.has(node.id)).map(node=>({
  node,
  terms:normalized([node.name,node.themeName,node.description,KIND[node.kind]?.label,node.id,
   ...Object.entries(node.mods||{}).map(([key,value])=>modDisplay(key,value,formatModifier).label)
  ].join(' '))
 }));
 const states = new Map();
 const pointers = new Map();
 const listeners = new AbortController();
 const listen = (el,type,handler,options) =>
  el.addEventListener(type,handler,{...options,signal:listeners.signal});
 const view = {x:0,y:0,scale:1,w:0,h:0,fit:false};
 let selected = nodeEls.has(hero?.lastRingNode)?hero.lastRingNode:startSelection();
 let detailMode = 'node', spent = 0;
 let draftHero = hero, draftIds = [];
 let matches = [], resultPage = 0, pending = false, disposed = false;
 let gesture = null, suppressClick = false, feedback = '';
 const setUnavailable = (el,unavailable) => el.setAttribute('aria-disabled',String(unavailable));
 const fitScale = () => Math.min(view.w,view.h)/(2*(tree.radius+44));
 const defaultScale = () => matchMedia('(pointer:coarse)').matches?1.08:.92;
 const homeScale = () => Math.min(defaultScale(),Math.min(view.w,view.h)/(2*(starterRadius+26)));
 const minScale = () => Math.min(fitScale(),defaultScale());
 const maxScale = () => 2.35;

 function applyView(){
  if(!view.w||!view.h)return;
  const reach = (tree.radius+110)*view.scale;
  view.x = clamp(view.x,view.w/2-reach,view.w/2+reach);
  view.y = clamp(view.y,view.h/2-reach,view.h/2+reach);
  world.style.transform = `translate(${view.x}px,${view.y}px) scale(${view.scale})`;
  const percent = `${Math.round(view.scale*100)}%`;
  if(zoomOutput.value!==percent)zoomOutput.value = percent;
  viewport.dataset.overview = String(view.scale<.36);
  setUnavailable(outButton,view.scale<=minScale()+.001);
  setUnavailable(inButton,view.scale>=maxScale()-.001);
 }

 function centerOn(id,scale=view.scale,fit=false){
  const node = tree.byId[id];
  if(!node||!view.w||!view.h)return;
  view.fit = fit;
  view.scale = clamp(scale,minScale(),maxScale());
  view.x = view.w/2-node.x*view.scale;
  view.y = view.h/2-node.y*view.scale;
  applyView();
 }

 function resize(){
  const w = viewport.clientWidth, h = viewport.clientHeight;
  if(!w||!h||w===view.w&&h===view.h)return;
  const first = !view.w;
  view.x += (w-view.w)/2;
  view.y += (h-view.h)/2;
  view.w = w;
  view.h = h;
  if(first){
   if(spent)centerOn(selected,defaultScale());
   else centerOn(tree.root,homeScale());
  }
  else if(view.fit)centerOn(tree.root,fitScale(),true);
  else applyView();
 }

 function zoomAt(scale,x,y,fromX=x,fromY=y){
  if(!view.w||!view.h)return;
  view.fit = false;
  const next = clamp(scale,minScale(),maxScale()), factor=next/view.scale;
  view.x = x+(view.x-fromX)*factor;
  view.y = y+(view.y-fromY)*factor;
  view.scale = next;
  applyView();
 }

 function reveal(id){
  const node = tree.byId[id], margin = 38;
  const x = view.x+node.x*view.scale, y = view.y+node.y*view.scale;
  if(x<margin||x>view.w-margin||y<margin||y>view.h-margin)centerOn(id);
 }

 function visibleState(id,rule){
  return rule.rank>(hero.ring?.[id]||0)?'draft':rule.rank?'owned':rule.ok?'available':'locked';
 }

 function renderSelection(){
  const node = tree.byId[selected], rule=states.get(selected)||{}, kind=KIND[node.kind]||KIND.passive;
  const ranked = rule.maxRank>1;
  const isStarter = starterIds.includes(selected), choosingOrigin = isStarter&&!spent&&!draftIds.length;
  const stagedRank = rule.rank-(hero.ring?.[selected]||0);
  const skill = node.talentId&&skillDetails?.(node.talentId,node,draftHero);
  const heading = node.name;
  if(title.textContent!==heading)title.textContent = heading;
  const context = [node.kind==='passive'||node.kind==='equipment'?'':kind.label,node.themeName,
   `第 ${node.ring} 圈`,rule.minLevel>1&&`等級 ${rule.minLevel}`,
   selected===draftHero.ringOrigin?'起始技能':choosingOrigin?'可選起點':''].filter(Boolean).join(' · ');
  const rankLabel = ranked?`<span class="ring-tree-rank">Lv. ${rule.rank} / ${rule.maxRank}</span>`:'';
  const bonusLabel = skill?.bonusRank>0?`<span class="ring-tree-rank-bonus">裝備 +${skill.bonusRank} · 有效 Lv. ${skill.level}</span>`:'';
  meta.innerHTML = (node.kind==='equipment'?`<span class="ring-tree-equipment-tag">${KIND.equipment.label}</span>`:'')+escape(context)+rankLabel+bonusLabel;
  detail.style.setProperty('--ring-color',safeColor(node.color));
  const prose = skill?.replaceDescription?null:node.effectDescription??node.description;
  const descriptions = [...new Set([prose,skill?.description].filter(Boolean))];
  const mods = Object.entries(node.mods||{}).map(([key,value])=>modDisplay(key,value,formatModifier));
  const effects = modifierList(mods);
  const lines = [skill?.rankText,...(Array.isArray(skill?.detail)?skill.detail:[])].filter(Boolean);
  const skills = lines.length?`<ul class="ring-tree-skill-effects">${lines.map(line=>`<li>${colorTerms(line)}</li>`).join('')}</ul>`:'';
  const milestones = skill?.milestones?.length?`<ul class="ring-tree-milestones" aria-label="投點解鎖特性">${skill.milestones.map(({rank,label,active})=>
   `<li data-active="${active}"><span>Lv.${rank}${active?' ✓':''}</span><span>${colorTerms(label)}</span></li>`).join('')}</ul>`:'';
  const text = descriptions.map(desc=>`<p>${colorTerms(desc)}</p>`).join('');
  const links=(label,ids)=>ids.length?`<div class="ring-tree-links"><small>${label}</small>${ids.map(id=>{
   const target=tree.byId[id],state=states.get(id);
   return `<button type="button" data-ring-result="${escape(id)}" data-owned="${!!state?.rank}">${escape(target.name)}${state?.rank?' ✓':''}</button>`;
  }).join('')}</div>`:'';
  const adjacent=node.neighbors.filter(id=>id!==tree.root);
  const paths=links('相連任一點',adjacent)+links('必要機制',node.requires??[]);
  const body = text+effects+skills+milestones+paths;
  if(content.innerHTML!==body)content.innerHTML = body;
  status.dataset.state = feedback?'locked':visibleState(selected,rule);
  const summary = feedback||(pending?'儲存中…':stagedRank>0?`已預選 ${stagedRank} 點`:choosingOrigin&&rule.ok?'選定後，沿相連天賦延伸。':
   rule.ok||ranked&&rule.nextRank===null?'':rule.rank&&!ranked?'已點亮':rule.reason||STATES.locked);
  if(status.textContent!==summary)status.textContent = summary;
  status.hidden = !summary;
  investButton.textContent = choosingOrigin?rule.starterWeaponName?`預選並換上${rule.starterWeaponName}`:'預選起點 · 1 點':ranked
   ? rule.nextRank===null?'已滿級':rule.rank?`預選 Lv. ${rule.nextRank} · 1 點`:'預選習得 · 1 點'
   : '預選 1 點';
  setUnavailable(investButton,pending||!rule.ok);
  skillButton.hidden = !node.talentId||!inspectSkill;
 }

 function renderSummary(){
  const grouped = new Map(SUMMARY_GROUPS.map(([label])=>[label,[]]));
  for(const [key,value] of Object.entries(ringDerived(tree,draftHero.ring).mods)){
   if(!value)continue;
   const [label] = SUMMARY_GROUPS.find(([,pattern])=>pattern.test(key));
   grouped.get(label).push(modDisplay(key,value,formatModifier));
  }
  const sections = [...grouped].map(([label,rows])=>{
   if(!rows.length)return '';
   rows.sort((a,b)=>a.label.localeCompare(b.label,'zh-Hant'));
   return `<section><h4>${label}</h4>${modifierList(rows)}</section>`;
  }).join('');
  const mechanics = tree.nodes.filter(node=>states.get(node.id)?.rank&&['mechanic','equipment'].includes(node.kind));
  const powers = mechanics.length?`<section><h4>機制與裝備條件</h4><div class="ring-tree-summary-powers">${mechanics.map(node=>
   `<button type="button" data-ring-result="${escape(node.id)}">${escape(node.name)}</button>`).join('')}</div></section>`:'';
  const body = `<p class="ring-tree-summary-note">已投入 ${spent} 點${draftIds.length?` · 預覽 ${draftIds.length} 點`:''}</p>`+
   (sections||'<p>目前沒有數值加成。</p>')+powers;
  if(summaryBody.innerHTML!==body)summaryBody.innerHTML = body;
 }

 function renderReset(){
  resetMessage.textContent = pending?'儲存中…':feedback||
   resetHint||(canReset===false?'返回營地並結束進行中的遠征後，即可重置。':
    spent?`退回已投入的 ${spent} 點。依賴天賦的副手會收起，技能欄會重新檢查。`:'目前沒有已投入的點數。');
  setUnavailable(confirmButton,pending||canReset===false||!spent);
 }

 function showDetail(mode,{focus=false}={}){
  detailMode = mode;
  for(const el of detail.querySelectorAll('[data-ring-detail]'))el.hidden = el.dataset.ringDetail!==mode;
  summaryButton.setAttribute('aria-expanded',String(mode==='summary'));
  resetButton.setAttribute('aria-expanded',String(mode==='reset'));
  if(mode==='summary')renderSummary();
  else if(mode==='reset')renderReset();
  else renderSelection();
  if(focus)find(`[data-ring-detail="${mode}"] h3`)?.focus();
 }

 function renderAllocations(){
  spent = 0;
  for(const node of tree.nodes){
   const rule = stateFor(node.id,draftHero), el=nodeEls.get(node.id);
   states.set(node.id,rule);
   if(!el)continue;
   const state = visibleState(node.id,rule), origin=node.id===draftHero.ringOrigin;
   if(el.dataset.state!==state)el.dataset.state = state;
   if(el.dataset.origin!==String(origin))el.dataset.origin = String(origin);
   const badge = node.maxRank>1?el.querySelector('.ring-tree-node-rank'):null;
   if(badge){
    badge.hidden = !rule.rank;
    const rank = rule.rank?String(rule.rank):'';
    if(badge.textContent!==rank)badge.textContent = rank;
   }
   const rank = rule.maxRank>1?`，等級 ${rule.rank}/${rule.maxRank}`:'';
   const label = `${node.name}，${KIND[node.kind]?.label||'天賦'}，${STATES[state]}${rank}${origin?'，起始技能':''}`;
   if(el.getAttribute('aria-label')!==label)el.setAttribute('aria-label',label);
   spent+=hero.ring?.[node.id]||0;
  }
  edges.forEach(({a,b},index)=>{
   const from = states.get(a),to=states.get(b);
   const planned = visibleState(a,from)==='draft'||visibleState(b,to)==='draft';
   const state = from.rank&&to.rank?(planned?'draft':'owned'):from.rank&&to.ok||to.rank&&from.ok?'available':'locked';
   if(edgeEls[index].dataset.state!==state)edgeEls[index].dataset.state = state;
  });
  const points = typeof budget==='number'?budget:budget?.points??budget?.available;
  pointsOutput.textContent = Math.max(0,points===undefined?(states.get(tree.root)?.points??0):points-draftIds.length);
  mapKey.hidden = !!draftIds.length;
  draftBar.hidden = !draftIds.length;
  const swap = draftHero.equipment?.weapon?.weaponType!==hero.equipment?.weapon?.weaponType;
  const draftMessage = pending?'儲存中…':`預選 ${draftIds.length} 點${swap?` · 換上${draftHero.equipment.weapon.name}`:''}`;
  if(draftStatus.textContent!==draftMessage)draftStatus.textContent = draftMessage;
  for(const button of draftActions)setUnavailable(button,pending);
  resetButton.hidden = !reset;
  showDetail(detailMode);
 }

 function decorateSelection(id,active){
  const el = nodeEls.get(id);
  el.setAttribute('aria-pressed',String(active));
  el.title = active?'':tree.byId[id].name;
  el.tabIndex = active?0:-1;
  if(active){
   const node=tree.byId[id];
   for(const [other,button]of nodeEls)button.dataset.adjacent=String(node.neighbors.includes(other));
   edges.forEach(({a,b},index)=>{
    const path=edgeEls[index],related=a===id||b===id;
    path.dataset.selected=String(related);
    if(related)path.parentNode.parentNode.append(path.parentNode);
   });
  }
 }

 function select(id,{center=false,focus=false,detailZoom=false}={}){
  if(disposed||!nodeEls.has(id))return;
  decorateSelection(selected,false);
  selected = id;
  feedback = '';
  decorateSelection(id,true);
  showDetail('node');
  if(center)centerOn(id,detailZoom?Math.max(view.scale,defaultScale()):view.scale);
  else reveal(id);
  if(focus)nodeEls.get(id).focus({preventScroll:true});
 }

 function goHome(focus){
  select(startSelection(),{focus});
  centerOn(tree.root,homeScale());
 }

 function searchMatches(){
  const query = normalized(search.value), words=query.split(/\s+/);
  if(!query){matches=[];results.hidden=true;return;}
  matches = searchTerms.filter(({terms})=>words.every(word=>terms.includes(word))).map(({node})=>node);
  matches.sort((a,b)=>Number(normalized(b.name).includes(query))-Number(normalized(a.name).includes(query))||a.ring-b.ring);
  resultPage = 0;
  renderResults();
 }

 function renderResults(){
  results.hidden = false;
  const totalPages = Math.max(1,Math.ceil(matches.length/PAGE_SIZE));
  resultPage = clamp(resultPage,0,totalPages-1);
  const page = matches.slice(resultPage*PAGE_SIZE,(resultPage+1)*PAGE_SIZE);
  resultList.innerHTML = page.map(node=>
   `<button type="button" data-ring-result="${escape(node.id)}"><span>${escape(node.name)}</span><small>${escape(node.themeName||('第 '+node.ring+' 圈'))}</small></button>`
  ).join('');
  resultStatus.textContent = matches.length?`${matches.length} 個結果 · ${resultPage+1}/${totalPages}`:'找不到符合的天賦';
  setUnavailable(find('[data-ring-action="search-prev"]'),resultPage===0);
  setUnavailable(find('[data-ring-action="search-next"]'),resultPage===totalPages-1);
 }

 function searchSelect(id){
  results.hidden = true;
  select(id,{center:true,focus:true,detailZoom:true});
 }

 function directionalNeighbor(direction){
  const node = tree.byId[selected], [dx,dy]=direction;
  const neighbors = (!spent&&!draftIds.length&&starterIds.includes(selected)?starterIds:node.neighbors)
   .filter(id=>id!==selected&&nodeEls.has(id)).map(id=>tree.byId[id]);
  const score = candidate => {
   const x = candidate.x-node.x,y=candidate.y-node.y,projection=x*dx+y*dy;
   return projection>0?Math.hypot(x,y)*(1+2*Math.abs(x*dy-y*dx)/projection):Infinity;
  };
  return neighbors.reduce((best,candidate)=>score(candidate)<(best?score(best):Infinity)?candidate:best,null);
 }

 function stageSelected(){
  if(pending||!states.get(selected)?.ok)return;
  const candidate = draftIds.length?draftHero:structuredClone(hero);
  const result = stage(candidate,selected);
  feedback = result.ok?'':result.reason||'目前無法預選。';
  if(result.ok){
   draftIds.push(selected);
   draftHero = candidate;
  }
  renderAllocations();
 }

 function replayDraft(){
  draftHero = draftIds.length?structuredClone(hero):hero;
  draftIds = draftIds.filter(id=>stage(draftHero,id).ok);
  if(!draftIds.length)draftHero = hero;
 }

 async function commit(action,resetting=false){
  if(pending)return;
  const selection = [...draftIds];
  pending = true;
  feedback = '';
  renderAllocations();
  let ok = false;
  try{ok = resetting?await action():await action(selection);}catch{}
  if(disposed)return;
  pending = false;
  if(ok)draftIds = [];
  replayDraft();
  if(!ok)feedback = '變更未儲存，請再試一次。';
  if(ok&&resetting&&detailMode==='reset'){
   goHome(false);
   showDetail('summary',{focus:true});
  }
  renderAllocations();
  if(ok&&!resetting)nodeEls.get(selected).focus({preventScroll:true});
 }

 function pointFrom(event){
  const rect = viewport.getBoundingClientRect();
  return {x:event.clientX-rect.left,y:event.clientY-rect.top};
 }

 function twoFingerView(){
  const [a,b] = [...pointers.values()];
  return {x:(a.x+b.x)/2,y:(a.y+b.y)/2,distance:Math.max(1,Math.hypot(a.x-b.x,a.y-b.y))};
 }

 function startDragging(){
  gesture.dragging = true;
  suppressClick = true;
  viewport.classList.add('is-panning');
  for(const id of pointers.keys()){
   if(!viewport.hasPointerCapture(id))viewport.setPointerCapture(id);
  }
 }

 listen(viewport,'pointerdown',event=>{
  if(event.button!==0||pointers.size>=2)return;
  const point = pointFrom(event);
  pointers.set(event.pointerId,point);
  if(pointers.size===1){
   suppressClick = false;
   gesture = {start:point,previous:point,dragging:false};
  }else{
   startDragging();
   gesture.previous = twoFingerView();
  }
 });
 listen(viewport,'pointermove',event=>{
  if(!pointers.has(event.pointerId)||!gesture)return;
  const point = pointFrom(event);
  pointers.set(event.pointerId,point);
  if(pointers.size===2){
   const next = twoFingerView(), prev=gesture.previous;
   zoomAt(view.scale*next.distance/prev.distance,next.x,next.y,prev.x,prev.y);
   gesture.previous = next;
   return;
  }
  if(!gesture.dragging&&Math.hypot(point.x-gesture.start.x,point.y-gesture.start.y)>=6)startDragging();
  if(gesture.dragging){
   const prev = gesture.previous;
   zoomAt(view.scale,point.x,point.y,prev.x,prev.y);
   gesture.previous = point;
  }
 });
 function finishPointer(event){
  if(!pointers.delete(event.pointerId))return;
  if(pointers.size)gesture.previous = pointers.values().next().value;
  else{
   gesture = null;
   viewport.classList.remove('is-panning');
  }
 }
 const win = container.ownerDocument.defaultView;
 listen(win,'pointerup',finishPointer);
 listen(win,'pointercancel',finishPointer);
 listen(viewport,'lostpointercapture',event=>{if(event.target===viewport)finishPointer(event);});
 listen(win,'blur',()=>{
  pointers.clear();
  gesture = null;
  viewport.classList.remove('is-panning');
 });
 listen(viewport,'wheel',event=>{
  event.preventDefault();
  const {x,y} = pointFrom(event);
  const delta = event.deltaY*(event.deltaMode===1?15:event.deltaMode===2?view.h:1);
  zoomAt(view.scale*Math.exp(clamp(-delta,-180,180)*.003),x,y);
 },{passive:false});

 const eventRoot=(toolbarAnchor||draftAnchor)?.closest('dialog')||panel;
 if(toolbarAnchor){
  toolbar.classList.add('ring-tree','ring-tree-toolbar-docked');
  toolbarAnchor.before(toolbar);
 }
 if(draftAnchor){
  draftBar.classList.add('ring-tree','ring-tree-draft-docked');
  draftAnchor.after(draftBar);
 }
 listen(eventRoot,'pointerdown',event=>{
  if(!event.target.closest('.ring-tree-find'))results.hidden = true;
 });
 listen(eventRoot,'focusout',event=>{
  if(event.target.closest('.ring-tree-find')&&!event.relatedTarget?.closest('.ring-tree-find'))results.hidden = true;
 });
 listen(search,'focus',searchMatches);
 listen(search,'input',searchMatches);
 listen(eventRoot,'keydown',event=>{
  if(event.target.closest('.ring-tree-find')){
   if(event.key==='Escape'&&(!results.hidden||search.value)){
    event.preventDefault();
    event.stopPropagation();
    results.hidden = true;
    if(event.target===search)search.value = '';
    else search.focus({preventScroll:true});
   }else if(event.target===search&&!results.hidden&&matches.length){
    if(event.key==='Enter'){
     event.preventDefault();
     searchSelect(matches[resultPage*PAGE_SIZE].id);
    }else if(event.key==='ArrowDown'){
     event.preventDefault();
     resultList.querySelector('button')?.focus({preventScroll:true});
    }
   }
   return;
  }
  if(!event.target.closest('[data-ring-node]'))return;
  const direction = DIRECTIONS[event.key];
  if(direction){
   event.preventDefault();
   event.stopPropagation();
   const neighbor = directionalNeighbor(direction);
   if(neighbor)select(neighbor.id,{focus:true});
  }else if(event.key==='Home'){
   event.preventDefault();
   goHome(true);
  }
 });
 listen(eventRoot,'click',event=>{
  const button = event.target.closest('button');
  if(!button||button.getAttribute('aria-disabled')==='true')return;
  const {ringNode,ringResult,ringAction} = button.dataset;
  if(ringNode){
   if(suppressClick&&event.detail){suppressClick=false;return;}
   select(ringNode,{focus:true});
   if(!states.get(ringNode)?.rank)stageSelected();
   return;
  }
  if(ringResult){searchSelect(ringResult);return;}
  if(ringAction==='in'||ringAction==='out')zoomAt(view.scale*(ringAction==='in'?1.25:.8),view.w/2,view.h/2);
  else if(ringAction==='fit')centerOn(tree.root,fitScale(),true);
  else if(ringAction==='home')goHome(false);
  else if(ringAction==='invest')stageSelected();
  else if(ringAction==='confirm-draft')void commit(invest);
  else if(ringAction==='undo-draft'||ringAction==='clear-draft'){
   if(ringAction==='clear-draft')draftIds = [];
   else draftIds.pop();
   feedback = '';
   replayDraft();
   renderAllocations();
   if(!draftIds.length)nodeEls.get(selected).focus({preventScroll:true});
  }
  else if(ringAction==='summary'||ringAction==='reset'){
   feedback = '';
   showDetail(detailMode===ringAction?'node':ringAction,{focus:detailMode!==ringAction});
  }else if(ringAction==='cancel-reset'){
   feedback = '';
   showDetail('node');
   resetButton.focus({preventScroll:true});
  }else if(ringAction==='confirm-reset')void commit(reset,true);
  else if(ringAction==='skill')inspectSkill(tree.byId[selected].talentId);
  else if(ringAction==='search-prev'||ringAction==='search-next'){
   resultPage += ringAction==='search-next'?1:-1;
   renderResults();
  }
 });

 for(const id of nodeEls.keys())decorateSelection(id,id===selected);
 renderAllocations();
 resize();
 const observer = new ResizeObserver(resize);
 observer.observe(viewport);
 return {
  select(id){select(id,{center:true,focus:true,detailZoom:true});},
  update(next){
   if(disposed)return;
   hero = next.hero??hero;
   budget = next.budget??budget;
   canReset = next.canReset??canReset;
   resetHint = next.resetHint??resetHint;
   if(pending)return;
   replayDraft();
   renderAllocations();
  },
  dispose(){
   if(disposed)return;
   disposed = true;
   observer.disconnect();
   listeners.abort();
   pointers.clear();
   toolbar.remove();
   draftBar.remove();
   panel.remove();
  }
 };
}
