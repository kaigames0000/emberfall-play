import {MANA_SIPHON_RATE} from './mana-economy.js?v=108';
import {equipmentIcon} from './equipment-visuals.js?v=124';
import {lootLevelBand} from './encounter-context.js?v=108';
import {riftChapterTier} from './rift-model.js?v=140';
import * as M from './model.js?v=140';
import {ACTOR_DEFENSES,ACTOR_STATUSES,GROUND_STATUSES,PLAYER_STATUSES,actorStatusIconMarkup} from './status-effects.js?v=130';

export const CAMP_GUIDE={
 camp:{label:'遠征',sections:[
  ['移動與互動','WASD、方向鍵或左鍵點地移動。點 NPC、祭壇或寶箱會走近後互動，也可在附近按 E。'],
  ['選擇遠征','營地傳送門選難度與章節。依房間連線前進，擊敗章節首領後開放下一章。裂隙與終局需對應入場道具。'],
  ['房間與祭壇','戰鬥房從地圖各處分批增援，怪量隨房型、樓層與難度提高。首領房先打前哨守衛。福利追咒持續 2 個戰鬥房；祭壇祝福維持 180 秒，新祝福取代舊祝福。'],
  ['營地服務','工匠處理交易、藥水與鍛造。倉庫帳號共用。印記收藏家兌換返脈石，木樁用於傷害測試。']
 ]},
 gear:{label:'裝備',sections:[
  ['掉落與裝等','掉落率 Q 提高裝備出現機率，稀有度 R 改善已掉落裝備的顏色。裝等決定底材白值、需求和擲值上限。'],
  ['獨特裝備','每件獨特裝備有固定裝等與詞條種類，數值仍會浮動。只有房間的掉落裝等涵蓋該裝等，才會進入掉落候選。收集後可在圖鑑查看樓層。'],
  ['詞條品質','白裝 1 條、藍裝 2–3 條、黃裝 3–5 條、紫裝 3–6 條、紅裝 4–8 條、橘裝 5–9 條。T1 最強，紅裝至少 2 條 T1，橘裝至少 3 條。'],
  ['搭配與部位','弓的副手限箭袋。雙手武器通常占用副手，雙持條件由燼脈圖解鎖。重甲提高護甲但降低速度，披風提供裝備光環，護符和戒指以詞條為主。'],
  ['拾取與比較','在背包按顏色設定拾取。滑過或點選裝備可與已穿戴品比較，拖曳可換裝。背包滿時，珍貴裝備留在地面。'],
  ['套裝與印記',`同套 2／3／5 件生效。單把雙手武器計 2 件，雙持各計 1 件，同名戒指部件只計一次。首領印記可兌換指定部件，橘套需${M.DIFFICULTIES[3].name}資格。`]
 ]},
 forge:{label:'鍛造',sections:[
  ['強化','到 ＋10 消耗碎晶且必定成功。＋11 至 ＋20 另需強化石，增加投入可提高成功率。失敗降 1 級，最低保留 ＋10。'],
  ['孔與寶石','每件裝備只能使用一次打孔鑿。同件不能重複鑲嵌同家族寶石。消耗碎晶可卸下並取回寶石，3 顆同種同階寶石可合成。'],
  ['改造材料','升華石提高一階稀有度。重鑄石重抽普通詞條種類與數值，重塑砂只重抽數值。改造會保留孔與寶石。'],
  ['藥水','腰帶 4 格，按 4／5／6／7 使用。擊殺、回復房與祭壇補充充能。回營地可換瓶、升品質、改造詞條或批次出售。']
 ]},
 build:{label:'技能',sections:[
  ['燼脈圖','旅人沿已連接的節點加點，技能、被動與裝備許可共用點數。每級 1 點，每 3 級額外 1 點，另有初始 1 點與首領成就最多 12 點。'],
  ['技能等級','技能可投入至 Lv.10。技能詳情標出實際投點會解鎖的特性，裝備詞條則提高技能的有效等級。'],
  ['快捷技能','1／2／3 施放對應技能，也可用左鍵點敵／右鍵／Q。Shift＋左鍵站定朝游標施放第一格，空白鍵閃避，J 開關自動普攻。'],
  ['召喚與光環','C 召喚或刷新編隊，受單種上限、總容量與資源限制。技能光環點選即啟用，資源不足會關閉。裝備光環穿戴即生效。'],
  ['裝備授技','授予技能可在技能頁配置，部分技能受武器限制。換裝前可查看失效的技能，點亮的天賦在天賦頁可搜尋與重置。']
 ]},
 combat:{label:'戰鬥',sections:[
  ['抗性',`火、冰、雷、毒有效抗性上限 75%。${M.DIFFICULTIES[2].name}扣 20、${M.DIFFICULTIES[3].name}扣 40 個百分點，${M.DIFFICULTIES[3].name}要有 115% 原始抗性才達上限。敵人的抗性與免疫標在身旁。`],
  ['回復預算','生命偷取每秒共用最大生命的 10%。吸魔和命中回魔共用每秒最大魔力的 '+MANA_SIPHON_RATE*100+'%。召喚、光環與持續傷害的偷取效率為 50%。'],
  ['異常與警示','燃燒、毒箭中毒可疊層。毒霧與箭毒分開計算，流血為物理持續傷害。持續傷害以淡紫數字顯示，生命低於 20% 時畫面邊緣會亮紅。'],
  ['傷害測試','營地木樁可改靶數、抗性與時間。首次命中開始計時，缺魔與走位也計入平均 DPS。']
 ]},
 save:{label:'存檔',sections:[
  ['帳號收藏','拾取、兌換或領到的獨特及套裝部件會記入圖鑑。出售與角色切換後仍可查閱。'],
  ['備份','角色、倉庫與收藏存在這台裝置。匯出可留備份，匯入會取代目前的存檔。']
 ]},
 status:{label:'狀態圖示'},affixes:{label:'詞條字典'},sets:{label:'套裝'},uniques:{label:'獨特裝備'}
};

export function statusGuideMarkup(){
 const grid=entries=>`<ul class="guide-status-grid">${entries.map(entry=>`<li class="guide-status-card"><span class="guide-status-icon" aria-hidden="true" style="--status-color:${entry.color}">${actorStatusIconMarkup(entry)}</span><div><b>${entry.name}</b><p>${entry.detail}</p></div></li>`).join('')}</ul>`;
 const section=(id,label,entries)=>`<section class="guide-status-section" aria-labelledby="guide-status-${id}"><h3 id="guide-status-${id}">${label}</h3>${grid(entries)}</section>`;
 const {slow,bloodDebt,difficulty,summonWard,supportShield,rage}=PLAYER_STATUSES;
 const {shield,aura,...enemy}=ACTOR_STATUSES;
 const speedAura=M.ABILITIES.w_haste;
 const beneficial=[
  summonWard,supportShield,rage,
  {name:'技能光環 · '+speedAura.name,icon:speedAura.icon,color:speedAura.color,detail:'提升移動、攻擊與施法速度。資源不足時會關閉技能光環，裝備光環則在穿戴時生效。'},
  {name:'召喚隊伍 · '+M.ABILITIES.m_wardlantern.name,icon:summonWard.icon,color:summonWard.color,detail:'數字為存活／配置數量，細條顯示隊伍的剩餘生命。'}
 ];
 const defenses=[
  {...ACTOR_DEFENSES.fire,resistant:true,name:'底線 · 抗性',detail:'敵人較能抵抗圖示對應屬性的傷害。火焰、冰霜、閃電、毒素各用自己的圖示。'},
  {...ACTOR_DEFENSES.poison,immune:true,name:'斜線 · 免疫',detail:'敵人免疫圖示對應的傷害或狀態，例如毒素傷害或凍結。'}
 ];
 const examples=[
  ['藥水效果',Object.values(M.FLASKS).map(({name,icon,color,desc})=>({name,icon,color,detail:desc}))],
  ['祭壇祝福',Object.values(M.SHRINES).filter(shrine=>shrine.buff).map(({description,...shrine})=>({...shrine,detail:description}))]
 ];
 return `<div class="guide-status"><p class="guide-status-summary">左上角的角色圖示可用滑鼠停留或鍵盤選取查看詳情。<b>倒數</b>是剩餘時間，<b>∞</b>表示目前沒有倒數，<b>×N</b>是層數或同類效果數。敵人圖示的上緣會隨倒數縮短，分層計時的效果顯示下一層何時到期。</p>
 ${section('debuff','角色減益',[...Object.values(GROUND_STATUSES),slow,bloodDebt,difficulty])}
 ${section('buff','角色增益、光環與召喚',beneficial)}
 ${examples.map(([label,entries])=>`<details class="guide-status-examples"><summary>${label}</summary>${grid(entries)}</details>`).join('')}
 ${section('enemy','敵人身上的標記',[...Object.values(enemy),...defenses])}
 ${section('ally','召喚物身上的標記',[shield,aura])}</div>`;
}

export const AFFIX_GROUPS={
 all:'全部',offense:'輸出',defense:'防禦',resource:'資源',skillLevels:'技能等級',summon:'召喚',passive:'光環與觸發',loot:'打寶',legacy:'舊制'
};
const AFFIX_EFFECTS={
 skillArea:'擴大技能作用區域，也延展可支援的光束、毒霧與光環。',
 extraProjectiles:'增加可支援技能的投射物；連鎖閃電改為增加跳躍上限。',
 skillDuration:'延長可支援的技能效果、地面區域與持續效果。',
 castSpeed:'加快法術施放節奏及可支援的引導頻率。',
 allSkills:'提高已習得的技能與裝備授予的技能等級，包含普攻技能。每件最多 +1，同一技能的裝備加成合計最多 +3。',
 hpPct:'按比例增加最大生命。',
 mana:'增加最大魔力。',
 manaRegen:'每秒恢復固定點數的魔力。',
 manaCost:'按比例降低使用技能所需的魔力。',
 manaLeech:'按實際傷害偷取魔力，與命中回魔共用回復預算。',
 manaOnHit:'本體直接命中回復固定魔力，與魔力偷取共用預算。',
 manaOnKill:'擊殺敵人時回復固定魔力。',
 crit:'提高可爆擊命中的機率，基礎爆擊為 2 倍傷害。',
 critDmg:'此舊版爆擊加成已停用。',
 critMultiplier:'將爆擊倍率改為 3 倍。',
 haste:'加快普攻、近戰武技及部分攻擊引導。',
 speedPct:'提高移動速度。',
 cdr:'縮短採冷卻時間計算的技能等待。',
 leech:'按實際傷害偷取生命，受每秒預算限制。',
 drop:'提高裝備出現機率，詞條越高時邊際增益越低。',
 rarityFind:'改善已掉落裝備的顏色。',
 armor:'減免物理直接命中的傷害。',
 lifeRegenPct:'每秒回復一定比例的最大生命。',
 chargeGain:'提高擊殺時回補的藥水充能。',
 lifeCostReduction:'降低以生命支付的技能成本。',
 lowLifeDamage:'低生命時增加本體直接命中的傷害。',
 trapDamage:'提高陷阱造成的傷害。',
 trapSetup:'加快陷阱部署。',
 movementRecovery:'加快支援充能的位移技能回復。',
 projectileDamage:'增加弓箭、暗器及法術投射物的傷害。',
 bleedDamage:'提高流血的物理持續傷害。',
 poisonDotDamage:'提高中毒持續傷害。',
 evasion:'提高閃避敵方攻擊的機率，上限 80%。',
 block:'持盾時提高格擋率，受盾類上限限制。',
 blockReduction:'持盾時提高成功格擋減免的傷害。',
 physicalDamage:'提高物理類型傷害。',
 attackDamage:'提高攻擊類型傷害。',
 spellDamage:'提高法術類型傷害。',
 physicalReduce:'額外減免物理傷害，上限 20%。',
 allResist:'提高火、冰、雷、毒四種抗性。',
 dotDamage:'提高燃燒、中毒、流血等持續傷害。',
 summonManaCost:'降低召喚編隊的魔力成本。',
 auraManaCost:'降低付費光環的魔力成本。',
 summonCapacity:'增加召喚編隊的總容量。',
 summonDamage:'提高召喚物造成的傷害。',
 summonLife:'增加召喚物最大生命。',
 summonHaste:'加快召喚物的攻擊頻率。',
 summonSpeed:'增加召喚物移動速度。',
 soulBond:'召喚物承受的傷害降低 8%。',
 bossMana:'直接命中首領回復魔力，每秒最多一次。',
 auraEffect:'提高裝備光環所給的加成。',
 lifeRegen:'每秒回復固定點數的生命。',
 manaRegenPct:'按比例提高每秒魔力回復。',
 flatManaCost:'扣除固定點數的技能魔力成本。',
 atkPct:'按比例提高攻擊力。',
 skillDmg:'提高技能造成的傷害。',
 resist:'減免法術傷害。'
};
const DEFENSE=new Set(['hpPct','armor','lifeRegenPct','physicalReduce','evasion','block','blockReduction']);
const RESOURCE=new Set(['mana','manaRegen','manaCost','manaLeech','manaOnHit','manaOnKill','leech','chargeGain','lifeCostReduction','bossMana']);
const escaped=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const labelFor=key=>M.AFFIXES[key]?.label||M.AFFIXES[key]?.name||'';
const formFor=item=>M.WEAPON_TYPES[item.weaponType]?.name??M.SLOT_NAMES[item.slot];
const iconFor=(item,silhouette=false)=>'<svg aria-hidden="true"><use href="#i-'+escaped(equipmentIcon(item,'sword',{silhouette}))+'"/></svg>';
const byName=(a,b)=>a.localeCompare(b,'zh-Hant');

function affixGroup(key,affix){
 if(affix.legacyOnly)return 'legacy';
 if(affix.family==='skillLevels')return 'skillLevels';
 if(key.startsWith('summon')||key==='soulBond')return 'summon';
 if(key.startsWith('aura')||M.TRIGGERS[key])return 'passive';
 if(key==='drop'||key==='rarityFind')return 'loot';
 if(DEFENSE.has(key)||key.endsWith('Resist'))return 'defense';
 if(RESOURCE.has(key))return 'resource';
 return 'offense';
}
function affixEffect(key,affix){
 const trigger=M.TRIGGERS[key];
 if(trigger)return `有機率免費施放${M.ABILITIES[trigger.skill].name}，效果 ${Math.round(trigger.scale*100)}%。同詞條間隔 ${trigger.cooldown} 秒。`;
 if(affix.aura){
  const buff=Object.entries(M.AURAS[affix.aura].buff).map(([stat,value])=>{
   const label=labelFor(stat).replace('（舊制）','')||'減傷';
   return label+' +'+(M.AFFIXES[stat]?.percent||stat==='reduce'?Math.round(value*1000)/10+'%':value);
  }).join('、');
  return '穿戴即生效，1 級提供 '+buff+'，同源取最強。';
 }
 if(AFFIX_EFFECTS[key])return AFFIX_EFFECTS[key];
 if(key.startsWith('flat'))return key.startsWith('flatAttack')?'舊版追加傷害，僅適用攻擊。':key.startsWith('flatSpell')?'舊版追加傷害，僅適用法術。':'攻擊或法術命中時追加對應類型傷害。';
 if(key.endsWith('Pen'))return '計算對應傷害時降低敵人的同類抗性。';
 if(key.endsWith('Resist'))return '降低受到的同類型傷害，難度懲罰後上限 75%。';
 if(affix.skillCategory)return `對應類型技能有效等級 +${affix.max}。裝等 ${affix.minItemLevel} 起可擲出，同一技能合計最多 +3。`;
 if(affix.family==='skillLevels')return '提高已擁有的同元素技能有效等級。';
 return '提高造成的同類型傷害。';
}
let dictionaryRows;
function buildDictionary(){
 const rollSlots=new Map();
 for(const slot of M.ITEM_SLOTS){
  const forms=['weapon','offhand'].includes(slot)
   ?Object.keys(M.WEAPON_TYPES).filter(type=>M.WEAPON_TYPES[type].slot===slot)
   :[undefined];
  const pools=forms.map(weaponType=>M.affixPool({slot,weaponType,level:99,rarity:4}));
  for(const [key,affix] of Object.entries(M.AFFIXES)){
   const names=forms.filter((_,index)=>pools[index].includes(key)).map(type=>M.WEAPON_TYPES[type]?.name??M.SLOT_NAMES[slot]);
   if(!names.length||affix.uniqueOnly)continue;
   if(!rollSlots.has(key))rollSlots.set(key,[]);
   rollSlots.get(key).push(names.length===forms.length?(slot==='ring'&&key==='allResist'?'戒指（裝等70+）':M.SLOT_NAMES[slot]):names.join('、'));
  }
 }
 return Object.entries(M.AFFIXES).map(([key,affix])=>{
  const group=affixGroup(key,affix),grade=M.affixGrade(key),label=labelFor(key),effect=affixEffect(key,affix);
  const source=rollSlots.get(key)?.join(' · ')||(affix.legacyOnly?'舊制裝備':affix.uniqueOnly?'獨特裝備固定':'特殊裝備');
  return {key,name:affix.name,label,effect,source,grade,group};
 }).sort((a,b)=>byName(a.label,b.label));
}
export function affixDictionaryMarkup({query='',group='all'}={}){
 dictionaryRows??=buildDictionary();
 const terms=query.trim().normalize('NFKC').toLocaleLowerCase().split(/\s+/).filter(Boolean);
 const rows=dictionaryRows.filter(row=>{
  if(group==='all'?row.group==='legacy':row.group!==group)return false;
  const text=[row.key,row.name,row.label,row.effect,row.source].join(' ').normalize('NFKC').toLocaleLowerCase();
  return terms.every(term=>text.includes(term));
 });
 if(!rows.length)return '<p class="guide-empty" role="status">找不到符合的詞條。</p>';
 return `<div class="guide-affix-count" role="status">${rows.length} 個詞條</div><div class="guide-affix-list">${rows.map(row=>`<article class="guide-affix-row">
 <div><b>${escaped(row.label)}</b><small>${escaped(row.name)}${row.grade?' · '+escaped(row.grade.name):''}</small></div>
 <p>${escaped(row.effect)}</p><small class="guide-affix-source">${escaped(row.source)}</small></article>`).join('')}</div>`;
}

const silhouettes=(items,label)=>items.length?`<div class="codex-silhouettes" role="group" aria-label="${label}">${items.map(item=>`<div class="codex-silhouette" aria-hidden="true">${iconFor(item,true)}</div>`).join('')}</div>`:'';

function uniqueLocations(level,riftChapters){
 const locations=[];
 const floors=(difficulty,chapter,roomCount,context)=>Array.from({length:roomCount},(_,room)=>{
  const {min,max}=lootLevelBand(difficulty,room,chapter,context);
  return level>=min&&level<=max?room+1:null;
 }).filter(Boolean);
 const floorText=layers=>`第 ${layers[0]}${layers.length>1?'–'+layers.at(-1):''} 層`;
 for(const difficulty of [1,2,3])for(const chapter of [1,2,3]){
  const label=M.DIFFICULTIES[difficulty].name+' · '+M.chapterDefinition(chapter).name;
  const campaign=floors(difficulty,chapter,8);
  if(campaign.length)locations.push(label+' '+floorText(campaign));
  if(chapter===riftChapters[difficulty]){
   const rift=floors(difficulty,chapter,4,{kind:'rift'});
   if(rift.length)locations.push(label+' 裂隙 '+floorText(rift));
  }
 }
 const endgame=floors(3,3,4,{kind:'endgame',difficulty:3,chapter:3});
 if(endgame.length)locations.push('終局 '+floorText(endgame));
 return locations.join(' ／ ');
}

export function uniqueCatalogMarkup(profile){
 const known=new Set(profile.gearCollection),entries=Object.values(M.UNIQUES).sort((a,b)=>a.itemLevel-b.itemLevel).map(unique=>({...unique,uniqueID:unique.id}));
 const hero=profile.characters?.[profile.active],riftChapters=[0,...[1,2,3].map(difficulty=>riftChapterTier(hero,difficulty))];
 const discovered=entries.filter(item=>known.has(M.equipmentDiscoveryKey(item)));
 const hidden=entries.filter(item=>!known.has(M.equipmentDiscoveryKey(item)));
 const cards=discovered.map(item=>`<details class="codex-card"><summary><span class="codex-art">${iconFor(item)}</span>
 <span class="codex-card-title"><b>${escaped(item.name)}</b><small>${escaped(formFor(item))} · 新掉落裝等 Lv.${item.itemLevel} · 需求 Lv.${Math.max(item.minLevel,item.itemLevel-6)}</small></span></summary>
 <div class="codex-details"><p>${escaped(item.description)}</p><p>掉落 · ${escaped(uniqueLocations(item.itemLevel,riftChapters))}</p><ul aria-label="固定詞條">${item.affixes.map(key=>`<li>${escaped(labelFor(key))}</li>`).join('')}</ul></div></details>`).join('');
 return `<p class="codex-progress">獨特裝備 <b>${discovered.length} / ${entries.length}</b></p><div class="codex-cards">${cards}</div>${silhouettes(hidden,'未收集的獨特裝備')}`;
}
function setPieces(id,set){
 return set.slots.flatMap(slot=>(slot==='ring'?['ring:a','ring:b']:[slot]).map(setPiece=>({
  set:id,slot,setPiece,name:slot==='ring'?'戒指 '+setPiece.at(-1).toUpperCase():M.SLOT_NAMES[slot]
 })));
}
export function setCatalogMarkup(profile,{counts={},fiveDetails={}}={}){
 const known=new Set(profile.gearCollection),hidden=[],cards=[];
 for(const [id,set] of Object.entries(M.SETS)){
  const pieces=setPieces(id,set),seen=pieces.filter(item=>known.has(M.equipmentDiscoveryKey(item)));
  if(!seen.length){hidden.push({slot:'chest',set:id,setPiece:'chest'});continue;}
  const worn=counts[id]||0,featured=seen[0];
  const pieceGrid=pieces.map(item=>known.has(M.equipmentDiscoveryKey(item))?
   `<div class="codex-piece" title="${escaped(item.name)}">${iconFor(item)}<span>${escaped(item.name)}</span></div>`:
   `<div class="codex-piece codex-silhouette" aria-hidden="true">${iconFor(item,true)}</div>`).join('');
  const effects=set.thresholds.map((threshold,index)=>seen.length>=threshold||worn>=threshold?
   `<p class="codex-set-effect"><b>${threshold} 件</b><span>${escaped(index===2?fiveDetails[id]||set.effects[index]:set.effects[index])}</span></p>`:'').join('');
  const bases=['weapon','offhand'].map(slot=>{
   const names=M.setEquipmentTypes(id,slot).map(type=>M.WEAPON_TYPES[type].name).join('／');
   return names?`<span><b>${slot==='weapon'?'主手':'副手'}</b> ${escaped(names)}</span>`:'';
  }).join('');
  cards.push(`<details class="codex-card codex-set-card" style="--codex-color:${set.color}"><summary><span class="codex-art">${iconFor(featured)}</span>
   <span class="codex-card-title"><b>${escaped(set.name)}</b><small>部件 ${seen.length} / ${pieces.length}${worn?' · 穿戴 '+worn+' 件':''}</small></span></summary>
   <div class="codex-details"><p class="codex-set-bases">${bases}</p><div class="codex-pieces" aria-label="套裝部件">${pieceGrid}</div>${effects}</div></details>`);
 }
 return `<p class="codex-progress">套裝 <b>${cards.length} / ${cards.length+hidden.length}</b></p><div class="codex-cards">${cards.join('')}</div>${silhouettes(hidden,'未收集的套裝')}`;
}
