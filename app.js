import {CombatAudio,savedVolume,storeVolume,soundForSkill,soundForEffect} from './combat-audio.js?v=137';
import {createGameNotices} from './game-notices.js?v=143';
import {majorEnemyArea,majorEnemyCharge,majorEnemyIntent} from './enemy-warnings.js?v=108';
import {createCloudClient} from './cloud-client.js?v=108';
import {RELEASE_NOTES} from './release-notes.mjs?v=147';
import {renderReleaseHistory} from './release-history.js?v=134';
import {createVerifiedPanel} from './verified-ui.js?v=135';
import {MANA_SIPHON_RATE,manaSiphonBudget} from './mana-economy.js?v=108';
import {skillCatalog,skillConfigurationMarkup} from './compact-skills-ui.js?v=130';
import {basicAttackMetrics} from './basic-attack-combat.js?v=129';
import {skillWeaponRequirement,skillWeaponCompatible} from './skill-weapon-rules.js?v=129';
import * as SkillAtlas from './skill-tree-layout.js?v=108';
import {mountRingTree} from './ring-tree-ui.js?v=141';
import {beastEffectRows} from './ranger-beasts.js?v=108';
import {bloodEffectRows} from './berserker-blood-data.js?v=108';
import {costText,sumCosts,scaleCost,availabilityView} from './resource-ui.js?v=108';
import {lowHealthActive} from './combat-balance.js?v=108';
import {paidMapChoices} from './paid-map-selection.js?v=140';
import {difficultySelector,chapterCards} from './campaign-selection.js?v=140';
import {HORDE_RULES} from './horde-trial.js?v=108';
import {riskEntries,riskChips,routeCostText} from './risk-presentation.js?v=108';
import * as BasicAttacks from './basic-attacks.js?v=129';
import * as InventoryPages from './inventory-pages.js?v=144';
import {SceneInteraction,CursorMovement,sceneTargetAt,leftClickAction,manualSkillSlot,flaskKeySlot,navigationPanel,ACTIVE_SKILL_KEYS,ACTIVE_SKILL_LABELS,FLASK_KEYS,DODGE_KEY,DODGE_LABEL} from './scene-input.js?v=108';
import {createSceneTransition} from './scene-transition.js?v=143';
import {installMobileControls} from './mobile-controls.js?v=146';
import {CombatInput} from './combat-input.js?v=108';
import {decodeProfileBackup,encodeProfileBackup,openProfileStore} from './profile-storage.js?v=121';
import {clearCampaignCheckpoints,settleInterruptedPaidRun,takePaidRunLock} from './local-expedition-save.js?v=108';
import {ARMOR_WEIGHTS,ARMOR_SHARES,armorClass,isShield} from './gear-archetypes.js?v=108';
import {updateStatusHUD} from './status-hud.js?v=135';
import {PICKUP_COLORS} from './pickup-filter.js?v=108';
import {AFFIX_GROUPS,CAMP_GUIDE,affixDictionaryMarkup,setCatalogMarkup,statusGuideMarkup,uniqueCatalogMarkup} from './camp-guide.js?v=143';
import {GROUND_STATUSES,PLAYER_STATUSES} from './status-effects.js?v=130';
import {HERO_RESISTANCE_PENALTY,MAX_AILMENT_DURATION} from './elemental-rules.js?v=108';
import {STARTING_WEAPONS,equipmentIcon,equipmentIconSymbols} from './equipment-visuals.js?v=124';
import {PASSIVE_LAYOUT,ROLE_BRANCHES,CONDITION_LABELS} from './passive-constellations.js?v=108';
import * as Rifts from './rift-model.js?v=140';
import {paidSaveCandidate,refreshPaidCheckpoint} from './rift-runtime.js?v=108';
import * as M from './model.js?v=140';
import {Game,abilityDamageTypes} from './engine.js?v=147';
import {projectileBodyRadius} from './combat-geometry.js?v=108';
import * as SkillText from './skill-presentation.js?v=130';
import {Renderer} from './render.js?v=135';
import {appearancePickerMarkup} from './appearance-picker.js?v=124';
import {watchBplusImages} from './bplus-art.js?v=124';
import {paintHeroPreview} from './character-model.js?v=130';
import * as Inventory from './inventory-items.js?v=144';
import {itemCell as carriedItemCell,inventoryIconSymbols,currencyCountersMarkup,equipmentAffixesMarkup} from './inventory-presentation.js?v=135';
import {flaskCardSummary,flaskComparisonRows,flaskStatValue} from './flask-workshop.js?v=108';
import {animeUiSymbols} from './anime-ui-icons.js?v=124';
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
$('.svg-defs defs').insertAdjacentHTML('beforeend',equipmentIconSymbols()+inventoryIconSymbols());
animeUiSymbols($('.svg-defs defs'));
const textEditingTarget=target=>{const el=target instanceof Element?target:target?.parentElement;return !!el&&(!!el.closest('input,textarea')||el.isContentEditable);};
document.addEventListener('contextmenu',ev=>ev.preventDefault(),true);
document.addEventListener('selectstart',ev=>{if(!textEditingTarget(ev.target))ev.preventDefault();},true);
document.addEventListener('dragstart',ev=>{if(!ev.target.closest?.('[draggable="true"]'))ev.preventDefault();},true);
const icon=n=>`<svg aria-hidden="true"><use href="#i-${n}"/></svg>`;
function modalClose(attributes,label,extra=''){return `<button type="button" class="modal-close ${extra}" ${attributes} aria-label="${esc(label)}" title="${esc(label)}">${icon('close')}</button>`;}
const SET_FIVE_DETAILS={
 wrath:'裂地旋渦：旋風斬每1秒將半徑120內至多6名普通／菁英拉近80，施加4秒物理易傷10%；同源不疊，Boss免拉但可受易傷。需已取得旋風斬。',
 iron:'蓄勢反擊：成功格擋儲存實際阻止傷害40%，上限為角色基礎技能攻擊基準100%；4秒內下次玩家直接傷害附加物理傷害後清空，冷卻4秒。附加傷害不爆擊、不吸取、不觸發技能。',
 wind:'返航箭：玩家傷害類弓箭投射物到最大射程後返航一次，回程傷害50%；每敵去／回程各最多命中1次。返航不再分裂、觸發技能或吸取，敵人與召喚投射物不適用。',
 hunt:'爆擊升格：玩家直接命中爆擊後20%機率使本次爆擊倍率+1，最高4倍；基礎2倍→3倍，獨特3倍→4倍。每次傷害只判定1次，不另製造命中。',
 flame:'霜晶彈坑：霜晶爆球爆炸留下3秒寒地，每秒造成該霜球未爆擊命中基準15%的冰冷持續傷害；最多2片，同一敵人只受最強一片。不再觸發技能或吸取。',
 frost:'碎冰回響：冰凍敵人被玩家直接命中擊殺後，對160範圍至多5個其他敵人造成該次未爆擊基準30%的冰傷；全套冷卻0.5秒。回響不遞迴、不吸取、不觸發技能。',
 soul:'地裂守衛：土傀儡每第3次普攻改為長160、寬60震波，至多4目標各120%原攻擊傷害；取代普攻，受召喚傷害與範圍加成，不觸發玩家命中詞條。',
 codex:'萬法通識：已學主動與裝備授予技能等級+3；全部裝備加成合計最多+3級，不提升被動或解鎖硬點機制，涵蓋傷害、召喚、光環、詛咒、戰吼與位移。不解鎖未知技能；前置及硬點連攜只計實投點。遵守能力上限並重新驗證容量與魔力預算。',
 covenant:'聖約常駐：營地選1個已學光環，免配置、自動啟用、0持續耗魔，以原正常計算強度60%自動常駐；傷害、治療、回魔、增減益及凍結機率皆乘60%，保留頻率與範圍。同源主動／裝備版本只取較強，不疊加；其他光環照常耗魔。',
 court:'荒原泰坦：授予獨特永久召喚，至多1隻，占3召喚容量、基礎90MP，納入整隊預算並按C召喚。等級1＋floor(最低套裝ilvl÷10)，最高10，再加合法技能等級；傷害為同級土傀儡2.4倍、生命3倍、攻擊間隔1.2秒。第3擊改為半徑140、至多5目標震擊，取代普攻。失去5件立即移除。',
 evolution:'元素進化：營地選1種已擁有召喚，不增加數量、容量或成本。哥雷姆第3擊改為半徑150、最多5敵的120%冰冷重擊並緩速20%持續3秒；霧冰精靈每次2枚各65%冰彈、每枚最多3敵；霧雷雲／雷神連鎖+2跳、最多6跳、首擊90%；冰神每第3擊額外半徑160冰爆，最多5敵、40%召喚原始傷害，留下3秒寒地、緩速20%，最多2片。',
 fate:'三重爆擊：玩家直接傷害爆擊後20%機率將本次倍率固定提升為6倍；獨特3倍也提升到6倍，其他升格取最高而不相乘。只算1次命中，召喚、持續與不得爆擊的衍生傷害不適用。',
 rifts:'迴旋殘像：旋風斬持續滿1秒後，每2秒在原地生成1個2秒殘像，以該旋風斬未爆擊基準30%的傷害、同步頻率打擊半徑120內至多5敵；最多1個。停止引導即消失，原魔耗照付。殘像非召喚，不爆擊、不吸取、不觸發技能或殘像。',
 drift:'游離雷印：使用位移技能或基礎閃避後，在起點留2秒雷印，每0.5秒攻擊最多5敵，每跳30%攻擊基準閃電傷害。最多1片、冷卻2秒，不觸發技能或吸取。',
 rotcycle:'蝕刻傳染：擊殺帶有效燃燒／中毒／詛咒的敵人，把最強一份持續傷害及詛咒傳給160範圍最多3敵，剩餘時間最多4秒。繼承不再傳播，對新目標重算抗性，原傷害不再放大。',
 huntmark:'獵印協定：玩家每3次直接命中留2秒獵印；下一次不同命中的投射物或召喚傷害引爆，造成最大魔力20%基準的額外閃電傷害。冷卻1秒，標記當次及衍生傷害不再觸發。',
 manavessel:'奧能釋放：最終受傷25%先由魔力1比1承擔，僅吸收實際可付部分，儲能上限最大魔力50%。下次付費傷害技能以儲能1.5倍釋放160範圍脈衝、最多5敵，冷卻2秒。光環／召喚不引爆。',
 convergence:'群星共振：存活至少3種召喚技能來源，每滿6秒各來源首個單位發射共鳴彈，最多4彈，各45%召喚攻擊基準、依來源元素，並治療全隊5%生命。不足3種重新計時，不觸發玩家效果或吸取。',
 singularity:'守命主宰：編隊及存活皆只有1單位時，該召喚生命×2.5、攻擊基準×2，玩家最終傷害25%轉給它承受。失去條件即失效，不重設傷勢；仍需支付C的魔力並符合容量，替換編隊不複製加成。'
};
const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const SKILL_DESCRIPTION_KEY='emberfall-skill-description-v1';
let shortSkillDescriptions=true;try{shortSkillDescriptions=localStorage.getItem(SKILL_DESCRIPTION_KEY)!=='full';}catch{}
let storageOK=true,storageReady=false,profileStore=null,state=M.newSave();
let recoveryBackups=[];
async function refreshRecoveryBackups(){
 try{recoveryBackups=await profileStore.listRecoveryBackups();}catch{recoveryBackups=[];}
}
let storageTransactions=0,autoSaveTask=null,saveAgain=false;
let combatInput=null,movementInput=null,sceneInput=null,mobileBlocked=false,pointerClient=null,stationaryCast=false;
const SLOT_LABELS=ACTIVE_SKILL_LABELS;
let c=state.characters[state.active]??M.newCharacter('warrior','尚未建立角色'),manualPause=false,pwaOverlayOpen=false,panel=null,skillTab=0,selectedSkillID=null,draftWeapon='sword',bagFilter='all',bagSearch='',lastUI=0,lastFrame=performance.now(),joy={x:0,y:0},keys=new Set();
let routePreviewID=null,selectedChapter=1,mapTab='campaign',paidLockRelease=null,paidLockOwned=false,paidBusy=false,repeatEligible=false,repeatRunId='',riftDraft={target:'physical',targetType:'set',challenge:1,guardian:1};
let returningToCamp=false;
const currentRoom=()=>e.currentRoom?.()||M.ROOMS[e.room]||M.ROOMS[0];
function openRoute(){if(!e.training&&e.mode==='playing'&&!e.transition){routePreviewID=null;openPanel('quests');}}
let forgeTab='enhance',setsView='catalog',guideTopic='camp',guideAffixQuery='',guideAffixGroup='all';
let includeValuable=false,valuableConsentID=null;
const inventoryPageByHero=new Map();
let passiveFocusRequested=false;
let inventoryTab='bag',loadoutTarget=null,talentSheetOpen=false,flaskSelection=null,flaskTarget=0,enhancementStones=1;
let flaskBatch=false,flaskWorkshopHero=null;
const flaskSaleIDs=new Set();
let inventorySelection=null,inventoryDrag=null,lastInventoryTap=null,touchInventoryDown=null,inventoryClickUntil=0,itemTooltipTimer=null;
let inventoryPanelPinned=false,inventoryHoverUntil=0,inventoryPointerMovedAt=0;
let gearInspectorView='rolls',inventoryReturnScroll=0;
let gearDiscardPending=null,inventoryDiscardBatch=null;
let achievementScope='1',achievementFilter='unclaimed',progressionBadgeKey='',progressionBadgeRecord=null;
let passiveQuery='',passiveFilter='all';
let passiveSelection=null,passiveDrag=null,passiveView={hero:null,scale:.85,x:0,y:0};
let ringTarget=null,weaponTarget='weapon',workshopTab='sockets',workshopAction='socket',stashPage=0,stashPlacement=null,craftSelection=null;
const sceneTransition=createSceneTransition($('#travel-overlay'));
let sceneMode='camp';
const audio=new CombatAudio({volume:savedVolume()});
const e=new Game(c,(type,data)=>{
 if(!document.hidden)audio.event(type,data);
 event(type,data);
}),renderer=new Renderer($('#world'),e),dialog=$('#panel-dialog'),catalogDialog=$('#skill-catalog-dialog');
const heardWarnings=new WeakSet();
let footPoint=null,footDistance=0,lowHealthSound=false,lastAudibleVolume=audio.volume||.45;
const soundPan=x=>Number.isFinite(x)?(x-e.player.x)/580:0;
e.onSound=(type,data)=>{
 if(!audio.ready||document.hidden)return;
 if(type==='effect'){
  if(!['camp','playing'].includes(e.mode))return;
  const def=M.ABILITIES[data.ability]??BasicAttacks.BASIC_ATTACKS[data.ability];
  const key=soundForEffect(data,def);
  if(key)audio.play(key,{pan:soundPan(data.x)});
 }else if(type==='projectile'){
  if(data.minion||data.clone||data.actor)return;
  const key=data.visual==='arrow'?soundForSkill({id:data.visualAbility,cls:'ranger',type:'projectile',damageType:data.visualDamageType}):
   data.visual==='dagger'?'stab':'magic-shot';
  audio.play(key,{pan:soundPan(data.x)});
 }else if(type==='hit'){
  audio.damage(data.byType,{...data,pan:soundPan(data.x)});
 }else if(type==='drop')audio.event(type,data);
 else audio.play(type);
};
function updateGameAudio(){
 if(!audio.ready)return;
 const playing=e.mode==='playing',active=!e.paused&&!e.transition;
 const def=playing&&active?M.ABILITIES[e.channel?.id]:null;
 audio.setChannel(def?.type==='channel'?soundForSkill(def):null);
 if(!active||!playing&&e.mode!=='camp'){footPoint=null;footDistance=0;if(!playing)lowHealthSound=false;return;}
 const p=e.player;
 if(footPoint&&!e.dashTime){
  const step=Math.hypot(p.x-footPoint.x,p.y-footPoint.y);
  if(step<65)footDistance+=step;
  if(footDistance>72){audio.play(playing&&e.chapter===2?'foot-wood':'foot-stone');footDistance=0;}
 }else footDistance=0;
 footPoint={x:p.x,y:p.y};
 if(!playing){lowHealthSound=false;return;}
 const low=lowHealthActive(e);
 if(low&&!lowHealthSound)audio.play('low-health');
 lowHealthSound=low;
 let warning=null,distance=Infinity;
 const consider=(cue,x,y,r)=>{
  const delta=Math.hypot(x-p.x,y-p.y);
  if(delta>Math.max(430,r+95))return;
  heardWarnings.add(cue);
  if(delta<distance){warning={x};distance=delta;}
 };
 for(const enemy of e.enemies){
  if(enemy.hp<=0)continue;
  if(enemy.intent&&!heardWarnings.has(enemy.intent)&&majorEnemyIntent(e,enemy))
   consider(enemy.intent,enemy.intent.targetX??enemy.x,enemy.intent.targetY??enemy.y,enemy.intent.range);
  if(enemy.charge&&!heardWarnings.has(enemy.charge)&&majorEnemyCharge(e,enemy))
   consider(enemy.charge,enemy.charge.x,enemy.charge.y,enemy.charge.r);
 }
 for(const area of e.hazards)if(!area.friendly&&!heardWarnings.has(area)&&majorEnemyArea(e,area))
  consider(area,area.x,area.y,area.r);
 if(warning)audio.play('boss-warning',{pan:soundPan(warning.x)});
}
const unlockAudio=()=>{if(audio.volume>0&&!audio.ready)void audio.unlock();};
document.addEventListener('pointerdown',unlockAudio,{passive:true,capture:true});
document.addEventListener('pointerup',unlockAudio,{passive:true,capture:true});
document.addEventListener('keydown',unlockAudio,{capture:true});
document.addEventListener('visibilitychange',()=>{if(document.hidden)audio.silence();});
document.addEventListener('click',event=>{
 if(!event.target.closest('button:not(:disabled):is([data-panel],.modal-close,[data-home-play])'))return;
 if(audio.volume>0)void audio.unlock().then(ok=>{if(ok&&!document.hidden)audio.play('click');});
},{capture:true});
const POINTER_AIM_KEY='emberfall-pointer-aim-v1';try{e.pointerAimEnabled=localStorage.getItem(POINTER_AIM_KEY)==='true';}catch{e.pointerAimEnabled=false;}
document.body.classList.toggle('pointer-aim-on',e.pointerAimEnabled);
e.setHordeTrial(true);
const verifiedEntry=new URLSearchParams(location.search).get('realm')==='verified';
const localQaOrigin=!verifiedEntry&&location.protocol==='http:'&&location.port==='8765'&&['127.0.0.1','localhost'].includes(location.hostname)?'http://127.0.0.1:8766':'';
let pendingQaBackup=null;
let verifiedPanel=null;
let cloudIdentity=null;
const cloud=createCloudClient({onChange(identity){
 if(identity===cloudIdentity)return;
 cloudIdentity=identity;
 if(panel==='verified'&&dialog.open){leaveConnectedPanel();renderVerified();}
}});
cloudIdentity=cloud.account;
function toast(text){const el=document.createElement('div');el.className='toast';el.textContent=text;$('#toasts').append(el);setTimeout(()=>el.remove(),3600);while($('#toasts').children.length>2)$('#toasts').firstElementChild.remove();}
const gameNotices=createGameNotices($('#loot-notices'),$('#level-notice'),$('#action-notices'));
function showLoot(name,{rarity=0,count=1,showRarity=false}={}){
 const grade=M.RARITIES[rarity]||M.RARITIES[0];
 gameNotices.pickup(name,{rarity,count,color:grade.color,rarityLabel:showRarity?grade.name.split('・')[0]:''});
}
let trainingDraft={scenario:'dummy',preset:'boss',armor:null,resistance:null,targets:1,duration:30,unlimitedMana:false},trainingHUDSummary=null;
let pendingSave=null,lastSavedAt=0;
let combatUIQueued=false,combatCharacterQueued=false,terminalCheckpointQueued=false;
function queueCombatUI(character=false){combatUIQueued=true;combatCharacterQueued ||= character;}
function flushCombatUI(){if(!combatUIQueued)return false;const character=combatCharacterQueued;if(terminalCheckpointQueued){terminalCheckpointQueued=false;save(true);}combatUIQueued=false;combatCharacterQueued=false;if(character)updateCharacter(false);else updateHUD();return true;}
async function save(force=false){
 if(!storageReady||e.mode==='camp'&&(paidBusy||state.rifts?.activeRun&&!paidLockOwned))return false;
 if(storageTransactions){saveAgain=true;return false;}
 if(autoSaveTask){saveAgain=true;return autoSaveTask;}
 if(!force&&e.mode==='playing'&&performance.now()-lastSavedAt<5000){if(!pendingSave)pendingSave=setTimeout(()=>{pendingSave=null;void save(true);},5000);return true;}
 if(pendingSave){clearTimeout(pendingSave);pendingSave=null;}
 autoSaveTask=Promise.resolve().then(async()=>{try{
  do{saveAgain=false;const owner=state;if(state.active===c.id&&e.c===c)e.persistSummons();
    const candidate=state.rifts?.activeRun&&e.mode!=='camp'?paidSaveCandidate(state,e):structuredClone(state);
    clearCampaignCheckpoints(candidate);
   const discoveries=candidate.rifts?.activeRun?M.collectOwnedEquipment(candidate).gearCollection:null;
   await profileStore.save(candidate);
   if(state===owner){
    state.writeRevision=candidate.writeRevision;
    if(candidate.rifts?.activeRun)state.rifts.activeRun=candidate.rifts.activeRun;
    if(discoveries?.length)state.gearCollection=[...new Set([...(state.gearCollection??[]),...discoveries])];
   }
   lastSavedAt=performance.now();storageOK=true;$('#save-status').innerHTML='<i></i>進度已儲存於此裝置';
  }while(saveAgain&&!storageTransactions);
  return true;
 }catch(error){if(storageOK)toast('無法儲存進度，請在設定匯出備份。');storageOK=false;$('#save-status').textContent='存檔失敗 · 請匯出備份';return false;}
 finally{autoSaveTask=null;}});
 return autoSaveTask;
}
async function persistProfile(candidate,options={}){
 if(!profileStore||!storageReady)throw Error('存檔尚未準備完成。');
 if(storageTransactions)throw Error('正在儲存，請稍後再試。');
 clearCampaignCheckpoints(candidate);
 const owner=state,before=candidate.writeRevision||0;storageTransactions++;dialog.classList.add('storage-writing');updatePause();
 try{
  if(autoSaveTask){if(!await autoSaveTask)throw Error('先前進度尚未儲存。');if(state===owner&&(candidate.writeRevision||0)===before)candidate.writeRevision=state.writeRevision;}
  const saved=await profileStore.save(candidate,options);storageOK=true;lastSavedAt=performance.now();$('#save-status').innerHTML='<i></i>進度已儲存於此裝置';return saved;
 }finally{storageTransactions--;dialog.classList.remove('storage-writing');updatePause();if(saveAgain){saveAgain=false;setTimeout(()=>void save(true),0);}}
}

window.addEventListener('pagehide',()=>save(true));
window.addEventListener('pageshow',event=>{if(event.persisted&&e.mode!=='camp')location.reload();});
setInterval(()=>{
 if(e.mode==='playing'&&!e.paused&&!e.training&&performance.now()-lastSavedAt>=5_000)save(true);
},5_000);
function feed(text){$('#feed-text').textContent=text;$('#feed-time').textContent=new Date().toLocaleTimeString('zh-TW',{hour:'2-digit',minute:'2-digit'});}
function event(type,data){
 if(type==='transition'||type==='transitionEnd'){updateTravelEvent(type);return;}
 if(!state.rifts?.activeRun&&type==='loot')M.recordEquipmentDiscovery(state,data);
 if(type==='auraConfigOff'){save(true);if(panel==='loadout')renderLoadout();queueCombatUI();return;}
 if(type==='objective'){updateMode();void save(true);return;}
 if(state.rifts?.activeRun&&['victory','dead'].includes(type)){finishPaid(type==='victory'?'won':'failed');return;}
 if(type==='room'&&!e.training)save(true);
 if(type==='victory'&&repeatEligible){Rifts.awardRepeatFragment(state,e.diff,repeatRunId);repeatEligible=false;showLoot('裂隙碎片');}
 if(type==='routeChoice'||type==='routeSelectionRequired'){openRoute();return;}
 if(type==='worldLoot'||type==='worldPickup'){save();queueCombatUI();return;}
 if(type==='room'||type==='start'||type==='camp'){
  stationaryCast=false;combatInput?.clear();movementInput?.clear();sceneInput?.clear();pointerClient=null;e.pointerTarget=null;routePreviewID=null;
 }
 if(['trainingStart','trainingReset','trainingEnd'].includes(type)){
  if(type!=='trainingEnd')$('#toasts .toast').forEach(el=>el.remove());
  trainingHUDSummary=null;updateMode();updateHUD();
  feed(type==='trainingEnd'?'訓練完成 · 可查看傷害來源或重新測試':type==='trainingReset'?'訓練已重置 · 裝備與技能變更後重新採樣':'DPS 訓練場 · 首次命中開始計時 · 無掉落與進度');
  return;
 }
 if(type==='bagfull'){gameNotices.notice('裝備背包已滿，物品留在地上');return;}
 if(type==='wave'&&e.horde?.active){queueCombatUI();return;}
 if(type==='summonArmy'||type==='shrineExpired'){save(true);updateHUD();return;}
 if(type==='summonError'){gameNotices.notice(data?.reason||data?.message||e.skillError||'目前無法召喚軍隊。');return;}
 if(type==='aurasToggle'){feed(data?.active?'所選光環已開啟 · 持續支付'+(bloodResource()?'生命':'魔力'):'光環已整組關閉');save();updateHUD();return;}
 if(type==='shrine'){
  const name=data?.name||M.SHRINES?.[data?.type]?.name||'神壇';
  gameNotices.notice(name+' · '+(data?.instant?'恩賜已領取':'祝福持續 180 秒'));
  save(true);updateHUD();return;
 }
 if(type==='auraToggle'||type==='auraOff'){
  const name=M.ABILITIES[data?.id]?.name||'光環';
  if(type==='auraOff'){
   gameNotices.notice(name+'已關閉 · '+(bloodResource()?'可用生命':'魔力')+'不足');
   queueCombatUI();
  }else{
   feed(name+(data?.active?'已開啟 · 持續支付'+(bloodResource()?'生命':'魔力'):'已關閉'));
   updateHUD();
  }
  return;
 }
 if(type==='resourceLoot'){
  M.addResourceLoot(state,data);
  for(const item of data.materials||[])showLoot(M.MATERIALS[item.key]?.name||item.key,{count:item.count});
  for(const item of data.gems||[])showLoot(gemName(item.key,item.tier),{count:item.count,rarity:item.tier});
  save();queueCombatUI();return;
 }
 if(type==='bossMarks'){
  const reward=M.addBossMarks(state,data.difficulty);if(!reward)return;
  showLoot(M.DIFFICULTIES[reward.difficulty].name+'印記',{count:reward.amount});
  save(true);return;
 }
 if(type==='flaskLoot'){
  showLoot(M.flaskForItem(data).name,{rarity:data.rarity,showRarity:true});save();queueCombatUI();return;
 }
 if(type==='trigger'){queueCombatUI();return;}
 if(type==='noMana'){gameNotices.notice(e.skillError||(bloodResource()?'可用生命不足。':'魔力不足。'));return;}
 if(type==='flask'){updateHUD();return;}
 if(type==='loot')showLoot(data.name,{rarity:data.rarity,showRarity:true});
 if(type==='level')gameNotices.levelUp(c.level,data.points??data.levels??1,data.unified?'天賦點':'技能點');
 if(['start','camp','clear','room','wave','dead','victory'].includes(type)||type==='kill'&&e.objectives?.some(o=>!o.used)&&!e.enemies.length)updateMode();
 if(['loot','kill','level','victory','dead','clear'].includes(type)){
  if(['dead','victory'].includes(type))terminalCheckpointQueued=true;
  else save(type==='clear');
  queueCombatUI(true);
 }
 if(['dead','victory'].includes(type))showResult();
}
function updateArenaLocation(){
 const chapter=e.chapter||1,route=e.runContext;
 let label=['','第一章','第二章','第三章'][chapter],name=M.chapterDefinition(chapter).name,room=currentRoom().name;
 if(e.training){
  label='練習';
  name='DPS 訓練場';
  room='';
 }else if(e.mode==='camp'){
  label='營地';
  name='遠征整備';
  room='';
 }else if(route&&route.kind!=='campaign'){
  label=route.kind==='rift'?'裂隙':'終局';
  name=route.final?'界隙之心':Rifts.RIFT_THEMES[route.theme]?.name||label;
 }
 $('#arena-chapter').textContent=label;
 $('#arena-chapter-name').textContent=name;
 $('#arena-location').textContent=room;
 $('#arena-location-divider').hidden=!room;
}
const CAMP_SERVICES = new Set(['difficulty','stash','forge','merchant','flasks','sets','training','characters','guide']);
const interactButton=$('#camp-interact');
let promptTarget=null;
function updateCampPrompt(){
 const target=worldInputEnabled()?sceneInput?.nearestInteraction(true):null;
 promptTarget=target;
 interactButton.classList.toggle('hidden',!target);
 if(!target)return;
 const object=target.point||target.entity;
 const label=target.kind==='chest'?'開啟寶箱':target.kind==='exit'?'選擇下一區域':target.kind==='objective'?'開啟 '+object.name:object.name??M.SHRINES[object.type]?.name;
 const text=interactButton.querySelector('span');
 if(text.textContent!==label)text.textContent=label;
 const point=renderer.screenPoint(object.x,object.y-target.top-3);
 const x=Math.round(Math.max(76,Math.min(renderer.w-76,point.x)));
 const y=Math.round(Math.max(48,point.y));
 interactButton.style.transform=`translate3d(${x}px,${y}px,0) translate(-50%,-100%)`;
}
function interactCamp(){
 if(promptTarget&&worldInputEnabled()&&sceneInput.nearby(promptTarget)&&sceneInput.activate(promptTarget))updateHUD();
 updateCampPrompt();
}
function updateMode(){
 const next=nextCampaignChapter(),combat=e.mode==='playing',practice=!!e.training,room=currentRoom();
 const arena=$('#arena'),finished=e.mode==='dead'||e.mode==='victory';
 arena.classList.toggle('in-training',practice);
 arena.classList.toggle('in-camp',e.mode==='camp'&&!!state.active);
 arena.classList.toggle('in-combat',combat);
 arena.closest('.game-shell').classList.toggle('showing-result',finished);
 $('#result-overlay').classList.toggle('hidden',!finished);
 $('#camp-overlay').classList.toggle('hidden',e.mode!=='camp'||!!state.active);
 $('#training-overlay').classList.toggle('hidden',!practice);
 if(practice||e.mode!==sceneMode){
  if(!practice&&state.active&&(combat||e.mode==='camp'))sceneTransition.reveal(e);
  else sceneTransition.clear();
 }
 sceneMode=e.mode;
 $('#arena-state').textContent=practice?'DPS 訓練場':e.mode==='camp'?'營地準備':e.mode==='dead'?'遠征結束':e.mode==='victory'?'關卡完成':e.cleared?(room.type==='recovery'?'整備完成':'區域淨化'):`第 ${e.wave} / ${room.waves} 波`;
 updateArenaLocation();$('#objective-text').textContent=practice?'測試目前 BUILD · 無掉落與進度':e.mode==='camp'?(state.active&&c.level===1&&c.kills===0?'T 開啟燼脈圖學第一招 · 點擊遠征傳送門出發':'點擊地標前往互動 · E 與附近目標互動'):e.mode==='victory'?(next?'下一章已解鎖 · '+next.name:'章節已完成 · 整備後再次遠征'):e.mode==='dead'?'成長與裝備已保留，整備後再次挑戰。':e.cleared?(room.type==='recovery'?'整備完成 · 兩種祭壇選一，或選擇下一條路線':'區域已淨化 · 選擇下一條路線'):e.objectives?.some(o=>!o.used)?(e.enemies.length?'清除敵人並開啟水門 · ':'開啟水門 · ')+e.objectives.filter(o=>o.used).length+'/'+e.objectives.length:room.type==='recovery'?'生命、魔力與藥水已補滿 · 靠近祭壇按 E，兩種祝福選一':room.type==='boss'?'擊敗 '+(e.enemies.find(n=>n.type==='boss')?.name||room.name)+' · 留意地面預警':room.type==='miniboss'?'擊敗 '+room.name+' · 避開地面預警':`清除敵人 · ${(room.description||room.desc)}`;
 $('#mini-map').innerHTML=(e.expedition?.graph?.layers||M.chapterDefinition(selectedChapter).rooms).map((r,i)=>{const pathNode=e.expedition?.graph?.nodes?.find(n=>(e.expedition.path||[]).includes(n.id)&&n.layer===i);return `<span class="${i===e.room?'active':i<e.room?'done':''}" title="第${i+1}層 · ${esc(pathNode?.name||r.name)}"></span>`;}).join('');
 updateRunProgress();updatePause();}
function updatePause(){e.paused=!storageReady||storageTransactions>0||manualPause||mobileBlocked||pwaOverlayOpen||dialog.open||document.hidden;if(e.paused){stationaryCast=false;e.pointerTarget=null;e.cancelMoveTarget();combatInput?.clear();movementInput?.clear();sceneInput?.clear();}$('#pause-overlay').classList.toggle('hidden',!manualPause||e.mode!=='playing'||dialog.open);$('#pause').disabled=e.mode!=='playing';$('#pause').setAttribute('aria-label',manualPause?'繼續遊戲':'暫停遊戲');$('#pause').innerHTML=icon(manualPause?'play':'pause')+'<small>'+(manualPause?'繼續':'暫停')+'</small>';}
function formatTime(t){return Math.floor(t/60).toString().padStart(2,'0')+':'+Math.floor(t%60).toString().padStart(2,'0');}
function nextCampaignChapter(){
 if(e.mode!=='victory'||state.rifts?.activeRun||(e.runContext&&e.runContext.kind!=='campaign')||c.difficulty!==e.diff)return null;
 const next=e.chapter+1;
 return M.canChapter(c,e.diff,next)?M.chapterDefinition(next):null;
}
function deathSummaryMarkup(){
 const summary=e.deathSummary;if(!summary)return '';const type=SkillText.DAMAGE_LABELS[summary.type]||summary.type||'傷害',num=value=>Math.round(Number(value)||0).toLocaleString('zh-TW'),kinds={damage:'敵方傷害',enemy:'敵方傷害',lifePaid:'技能血費',lifeCost:'技能血費',cost:'技能血費',deferred:'延遲承傷',heal:'回復',healed:'回復'};
 const sourceLabel=source=>({burst:'爆發傷害',field:'持續範圍傷害',projectile:'投射物',contact:'接觸傷害',slam:'重擊'})[source]||source;
 return `<section class="death-summary" aria-label="死亡前傷害摘要"><div><b>${esc(sourceLabel(summary.source)||'未知來源')}</b><span>${esc(type)}${summary.resistance===undefined?'':' · 有效抗性 '+percent(summary.resistance)}</span></div><dl><div><dt>近 ${summary.window||6} 秒敵傷</dt><dd>${num(summary.enemyDamage)}</dd></div><div><dt>技能血費</dt><dd>${num(summary.lifePaid)}</dd></div><div><dt>延遲承傷</dt><dd>${num(summary.deferred)}</dd></div><div><dt>回復</dt><dd>${num(summary.healed)}</dd></div></dl>${summary.events?.length?`<details><summary>生命變化紀錄 · ${summary.events.length} 筆</summary><table><thead><tr><th>來源</th><th>類型</th><th>數量</th><th>生命</th></tr></thead><tbody>${summary.events.map(event=>`<tr><td>${esc(sourceLabel(event.source)||kinds[event.kind]||event.kind)}</td><td>${esc(kinds[event.kind]||event.kind)}${event.type?' · '+esc(SkillText.DAMAGE_LABELS[event.type]||event.type):''}</td><td>${num(event.amount)}</td><td>${num(event.hpBefore)} → ${num(event.hpAfter)}</td></tr>`).join('')}</tbody></table></details>`:''}</section>`;
}
function showResult(){
 const win=e.mode==='victory',pending=win&&!!state.rifts?.activeRun,next=nextCampaignChapter();
 let actions='<button class="gold-btn" data-result="retry">'+icon('sword')+'再次遠征</button>';
 if(pending){
  actions='<button class="gold-btn" data-result="settle">領取遠征獎勵</button><button class="outline-btn" data-panel="inventory">整理背包</button>';
 }else if(next){
  actions=`<button class="gold-btn" data-result="next-chapter">前往下一章 · ${esc(next.name)} ${icon('chevron')}</button>`;
 }
 const context=[M.DIFFICULTIES[e.diff]?.name,$('#arena-chapter-name').textContent].filter(Boolean).join(' · ');
 const details=win?(pending?'':'<p class="result-reward">印記已收入帳號，可向營地收藏家兌換返脈石。</p>'):deathSummaryMarkup();
 $('#result-overlay').innerHTML=`
  <section class="result-card" aria-labelledby="result-title">
   <header>${icon(win?'rune':'shield')}<div><small>${esc(context)}</small><h2 id="result-title">${win?'遠征完成':'遠征結束'}</h2></div></header>
   <dl class="result-card-stats">
    <div><dt>擊殺敵人</dt><dd>${e.runKills}</dd></div>
    <div><dt>取得裝備</dt><dd>${e.runLoot}</dd></div>
    <div><dt>遠征時間</dt><dd>${formatTime(e.elapsed)}</dd></div>
   </dl>
   ${details?`<div class="result-details"${win?'':' role="region" tabindex="0" aria-label="傷害摘要與生命紀錄"'}>${details}</div>`:''}
   <footer><button class="outline-btn" data-result="camp">返回營地</button>${actions}</footer>
  </section>`;
}
async function returnToCamp(){
 if(returningToCamp)return false;
 returningToCamp=true;
 try{
  const run=state.rifts?.activeRun;
  if(run){
   if(!paidLockOwned)return e.mode==='camp'&&await settleStoredPaidRun()==='settled';
   const outcome=e.mode==='victory'||run.status==='won'?'won':e.mode==='dead'?'failed':'abandoned';
   return await finishPaid(outcome,{camp:true});
  }
  if(e.mode==='playing'&&!e.training){
   const wasPaused=manualPause;manualPause=true;updatePause();e.collectAll();
   if(!await save(true)){manualPause=wasPaused;updatePause();return false;}
  }
  e.runContext=null;
  e.camp();
  manualPause=false;repeatEligible=false;repeatRunId='';updatePause();
  return true;
 }finally{returningToCamp=false;}
}
function start(chapter=selectedChapter){
 if(state.rifts?.activeRun||paidBusy){openPanel('quests');return false;}
 if(!state.active){openPanel('characters');return false;}
 if(!M.canChapter(c,c.difficulty,chapter)){toast('需先完成同難度的前一章。');openPanel('quests');return false;}
 const alreadyCleared=M.progressFor(c,c.difficulty,chapter).length===8;
 manualPause=false;
 keys.clear();
 joy={x:0,y:0};
 if(e.start(c.difficulty,null,{chapter})===false){
  updatePause();
  return false;
 }
 selectedChapter=chapter;
 repeatEligible=alreadyCleared;
 repeatRunId='campaign:'+c.id+':'+e.expedition.graph.seed;
 updateHUD();
 return true;
}
async function activateHero(id){if(state.rifts?.activeRun){toast('請先結算目前裂隙，再切換角色。');return;}if(e.mode==='playing'){toast('請先返回營地，再選擇另一位角色。');return;}if(!state.characters[id])return;if(!await returnToCamp())return;e.persistSummons();if(state.characters[c.id])state.characters[c.id].summonState=structuredClone(c.summonState);if(!M.selectCharacter(state,id))return;c=state.characters[id];e.c=c;inventorySelection=null;manualPause=false;e.camp();updateCharacter();updateHUD();await save(true);closePanel();toast(`已載入 ${c.name} 的獨立存檔。`);}
function renderCharacters(){
 const heroes=Object.values(state.characters),locked=e.mode==='playing';
 const deletionLocked=locked||!!state.rifts?.activeRun;
 if(!heroes.length){renderCreateCharacter();return;}
 $('#dialog-body').innerHTML=saveNamespaceNotice()+`<div class="roster-toolbar"><p>每位角色都有獨立的等級、裝備、天賦與難度。</p><button class="gold-btn" data-create-screen ${locked||heroes.length>=M.MAX_CHARACTERS?'disabled':''}>＋ 建立角色 <span>${heroes.length} / ${M.MAX_CHARACTERS}</span></button></div>${locked?'<div class="roster-combat-lock">遠征進行中，無法變更角色。<button class="text-btn" data-return-camp>結束遠征並返回營地</button></div>':''}<div class="hero-list">${heroes.map(hero=>{const cl=M.CLASSES[hero.cls],active=hero.id===state.active;return `<article class="hero-card ${active?'selected':''}" style="--class-color:${cl.color}"><div class="hero-card-icon hero-model-icon">${heroPreviewMarkup(hero)}</div><div class="hero-card-info"><span class="hero-class-label">${cl.name} · LV.${hero.level}${active?' · 目前角色':''}</span><h3>${esc(hero.name)}</h3><p>擊殺 ${hero.kills} · 通關 ${hero.clears} · 裝備 ${Object.keys(hero.equipment).length} / ${M.SLOTS.length}</p><small>${M.DIFFICULTIES[hero.difficulty].name} · 獨立存檔</small></div><div class="hero-card-actions"><button class="${active?'outline-btn':'gold-btn'}" data-hero="${hero.id}" ${locked?'disabled':''}>${active?'繼續冒險':'載入角色'}</button><div class="hero-secondary-actions"><button class="text-btn" data-rename-screen="${hero.id}" ${locked?'disabled':''}>重新命名</button><button class="text-btn hero-delete-link" data-delete-screen="${hero.id}" aria-label="刪除 ${esc(hero.name)}" ${deletionLocked?'disabled':''}>刪除</button></div></div></article>`;}).join('')}</div><p class="roster-note">角色各自保有背包、裝備、天賦點與貨幣。</p>`;
 paintCharacterPreviews();
}
function renderCreateCharacter(){
 if(e.mode==='playing')return;draftWeapon='sword';
 $('#dialog-title').textContent='建立角色';$('#dialog-eyebrow').textContent='';
 $('#dialog-body').innerHTML=`${saveNamespaceNotice()}<form id="create-character-form" autocomplete="off"><div class="create-intro"><p>選擇外觀與起始武器，名稱可稍後設定。</p><span>Lv.1 起步 · 可在燼脈圖學習第一個技能。</span></div><label class="hero-name-field" for="hero-name"><span>角色名稱 <small>選填</small></span><input id="hero-name" name="heroName" maxlength="24" placeholder="可留白，稍後命名" autocomplete="off"><span class="name-helper">留白時先以「無名旅人」顯示，可於角色列表重新命名。</span></label>${appearancePickerMarkup()}<div class="create-class-heading"><span>起始武器</span></div><div class="class-grid create-class-grid starter-weapon-grid" role="group" aria-label="選擇起始武器">${M.RING_START_WEAPONS.map(type=>{const weapon=M.WEAPON_TYPES[type];return `<button type="button" data-draft-weapon="${type}" class="class-card ${type===draftWeapon?'selected':''}" aria-pressed="${type===draftWeapon}">${icon(equipmentIcon({slot:'weapon',weaponType:type}))}<h3>${weapon.name}</h3><small>${weapon.kind==='spell'?'術器':weapon.kind==='ranged'?'遠程':'近戰'} · ${weapon.kind==='ranged'?'可配箭袋':weapon.hands===2?'雙手':'單手'}</small></button>`;}).join('')}</div><p id="character-form-error" class="form-error" role="alert"></p><div class="create-form-footer"><button type="button" data-roster-back class="text-btn">${Object.keys(state.characters).length?'返回角色列表':'返回營地'}</button><button type="submit" class="gold-btn" id="create-character-submit">建立角色並進入營地 ${icon('chevron')}</button></div></form>`;
}
function renderRenameCharacter(id){const hero=state.characters[id];if(!hero||e.mode==='playing')return;$('#dialog-title').textContent='重新命名';$('#dialog-eyebrow').textContent='';$('#dialog-body').innerHTML=`<form id="rename-character-form" data-id="${id}" autocomplete="off"><p class="panel-intro">更新角色名稱，既有職業與冒險進度都會保留。</p><label class="hero-name-field" for="rename-hero-name"><span>角色名稱 <small>1–12 個字</small></span><input id="rename-hero-name" value="${esc(hero.name)}" maxlength="24" required></label><p id="character-form-error" class="form-error" role="alert"></p><div class="create-form-footer"><button type="button" data-roster-back class="text-btn">返回角色列表</button><button type="submit" class="gold-btn">儲存名稱</button></div></form>`;}

function renderDeleteCharacter(id){
 const hero=state.characters[id];
 if(panel!=='characters'||!hero||e.mode==='playing'||state.rifts?.activeRun)return;
 $('#dialog-body').innerHTML=`<form id="delete-character-form" class="character-delete-form" data-id="${id}" aria-labelledby="delete-character-title">
  <h3 id="delete-character-title">刪除「${esc(hero.name)}」？</h3>
  <p>這會永久刪除該角色的進度、裝備與個人背包。</p>
  <p class="form-error" role="alert"></p>
  <div class="character-delete-actions"><button type="button" class="outline-btn" data-roster-back>取消</button><button type="submit" class="hero-delete-confirm">永久刪除</button></div>
 </form>`;
 dialog.scrollTop=0;
 $('#delete-character-form [data-roster-back]').focus({preventScroll:true});
}
async function commitCharacterDeletion(form){
 const error=form.querySelector('.form-error');
 if(e.mode==='playing'){error.textContent='請先結束遠征再刪除角色。';return;}
 const id=form.dataset.id,deletedName=state.characters[id]?.name;
 const candidate=profileCandidate(),result=M.deleteCharacter(candidate,id);
 if(!result.ok){error.textContent=result.error;return;}
 try{
  prepareCandidate(candidate);
  await persistProfile(candidate);
 }catch{
  error.textContent='刪除未儲存。請確認儲存空間，或重新整理後再試。';
  return;
 }
 const activeChanged=state.active!==candidate.active;
 state=candidate;
 c=state.characters[state.active]??M.newCharacter('warrior','尚未建立角色');
 M.ensureCampaign(c);
 e.c=c;
 if(activeChanged){
  e.runContext=null;
  selectedChapter=1;
  mapTab='campaign';
  inventorySelection=null;
  manualPause=false;
  e.camp(true);
 }
 updateCharacter(false);
 openPanel('characters');
 toast('已刪除 '+deletedName+'。');
}

function openPanel(name){if(catalogDialog.open)catalogDialog.close();if(!storageReady&&name!=='verified')return;if(name==='summons'||name==='auras')name='loadout';if(name==='appearance')name='inventory';if(M.isRingHero(c)&&name==='passives')name='talents';if(name!=='talents')disposeSkillAtlas();if(name==='difficulty'){name='quests';mapTab='campaign';}if(CAMP_SERVICES.has(name)&&e.mode!=='camp'&&!(name==='training'&&e.training)){toast('請返回營地使用此服務。');return;}if(state.rifts?.activeRun&&(e.mode!=='playing'||!e.cleared)&&!(canManagePaidRewards()&&['inventory','stash','forge','merchant'].includes(name))&&!['quests','guide','stats','settings','verified'].includes(name)){toast('裂隙清房後才能整備。');return;}if(name==='trainingResults'&&!e.training)name='training';if(name==='training')trainingDraft=trainingSettings(e.training?.options||trainingDraft);if(name==='expedition'){closePanel();return;}if(['sets','inventory','talents','loadout','summons','auras','difficulty','stash','flasks','quests','training','trainingResults','achievements','passives','stats','forge','merchant','appearance'].includes(name)&&!state.active){toast('請先建立一位角色。');name='characters';}hideItemTooltip();clearInventoryDrag();passiveDrag=null;lastInventoryTap=null;if(panel!==name){leaveConnectedPanel();inventorySelection=null;talentSheetOpen=false;if(name==='inventory')inventoryTab='bag';if(name==='merchant')includeValuable=false;}if(name==='passives'&&panel!==name)passiveFocusRequested=true;if(name==='achievements'&&panel!==name){achievementScope=String(c.difficulty);achievementFilter='unclaimed';}if(name!=='inventory')inventoryDiscardBatch=null;panel=name;if(name!=='talents'||!M.isRingHero(c))disposeRingPanel();dialog.classList.toggle('ring-tree-dialog',name==='talents'&&M.isRingHero(c));dialog.classList.toggle('achievements-dialog',name==='achievements');dialog.classList.toggle('passive-dialog',name==='passives');dialog.classList.toggle('route-dialog',name==='quests');dialog.classList.toggle('sets-dialog',name==='sets');dialog.classList.toggle('settings-dialog',name==='settings');dialog.classList.toggle('verified-dialog',name==='verified');dialog.classList.toggle('training-dialog',['training','trainingResults'].includes(name));dialog.classList.toggle('skill-dialog',name==='talents');dialog.classList.toggle('skill-atlas-dialog',name==='talents');dialog.classList.toggle('loadout-dialog',['loadout','summons','auras'].includes(name));dialog.classList.toggle('inventory-dialog',name==='inventory');dialog.classList.toggle('flasks-dialog',name==='flasks');dialog.classList.toggle('stash-dialog',name==='stash');dialog.classList.toggle('camp-service-dialog',['forge','merchant','guide'].includes(name));dialog.classList.toggle('forge-dialog',name==='forge');dialog.scrollTop=0;keys.clear();joy={x:0,y:0};$('#stick').style.transform='';let title={achievements:['ACHIEVEMENTS','成就'],passives:['PASSIVE TREE','天賦'],stats:['','角色統計'],forge:['','鐵匠'],merchant:['','商人'],sets:['','印記收藏家'],settings:['','遊戲設定'],verified:['','公測遠征'],training:['MEASURE YOUR BUILD','DPS 訓練場'],trainingResults:['DAMAGE BREAKDOWN','訓練傷害分析'],inventory:['','裝備'],talents:['SHAPE YOUR BUILD','技能加點'],loadout:['','技能'],summons:['YOUR PERMANENT ARMY','召喚編隊'],auras:['SUSTAIN YOUR AURAS','光環配置'],characters:['YOUR HEROES','角色與存檔'],guide:['ADVENTURER’S CODEX','冒險指南'],difficulty:['THE GREATER THE RISK','遠征難度'],quests:['QUEST LOG','遠征路線'],stash:['SHARED ACROSS YOUR HEROES','共用倉庫'],flasks:['PREPARE YOUR FLASK BELT','充能藥水腰帶']}[name];if(!title)return;$('#dialog-eyebrow').textContent=title[0];$('#dialog-title').textContent=title[1];renderPanel();if(!dialog.open)dialog.showModal();$('#dialog-body').scrollTop=0;positionInventoryInspector();if(name==='quests')requestAnimationFrame(focusRouteProgress);updatePause();}
function closePanel(){inventoryDiscardBatch=null;gearDiscardPending=null;if(catalogDialog.open)catalogDialog.close();leaveConnectedPanel();disposeSkillAtlas();disposeRingPanel();hideItemTooltip();clearInventoryDrag();passiveDrag=null;dialog.close();panel=null;updatePause();}
function renderPanelControls(){
 $('#settings-tools').hidden=panel!=='settings';
 const ring=M.isRingHero(c),artisan=['forge','merchant','flasks'].includes(panel),gear=panel==='inventory',skills=['talents','passives','loadout','summons','auras'].includes(panel),links=gear?[]:skills?[...(ring?[['talents','燼脈圖']]:[['talents','加點'],['passives','天賦']]),['loadout','技能']]:artisan?[['merchant','交易'],['flasks','藥水'],['forge','鐵匠']]:[];
 dialog.classList.toggle('tabbed-dialog',skills||artisan||panel==='quests');
 $('#panel-tabs').innerHTML=links.map(([id,label])=>`<button data-panel="${id}" class="${panel===id?'selected':''}" aria-pressed="${panel===id}">${label}</button>`).join('')+(!ring&&skills?panel==='passives'?`<span class="panel-points" title="每級1點；基礎數值由天賦成長，三首領成就另給1點">天賦點 <b>${M.passivePoints(c)}</b></span><button class="panel-refund" data-passive-reset title="使用返脈石重置天賦" aria-label="重置天賦" ${e.mode==='playing'||!Object.keys(c.passives||{}).length?'disabled':''}>↺</button>`:`<span class="panel-points" title="1級1點；每3級獲得1點；技能最高10級；裝備最多額外3級">技能點 <b>${c.points}</b></span><button class="panel-refund" data-refund title="免費退還所有技能點">重置 ↺</button>`:'')+(!ring&&state.active&&['talents','passives'].includes(panel)&&e.mode==='camp'?'<button type="button" class="panel-refund" data-ring-convert>轉入燼脈圖</button>':'');
}
function renderPanel(){if(M.isRingHero(c)&&panel==='passives')panel='talents';dialog.classList.toggle('ring-tree-dialog',panel==='talents'&&M.isRingHero(c));renderPanelControls();const scroll=dialog.scrollTop,detailScroll=$('#inventory-selection')?.scrollTop||0,detailItem=inventorySelection?.id;if(panel==='sets')renderSets();if(panel==='inventory')renderInventory();if(panel==='talents')renderTalents();if(panel==='loadout')renderLoadout();if(panel==='characters')renderCharacters();if(panel==='guide')renderGuide();if(panel==='quests')renderQuests();if(panel==='achievements')renderAchievements();if(panel==='stats')renderCharacterStats();if(panel==='passives')renderPassives();if(panel==='stash')renderStash();if(panel==='forge')renderForge();if(panel==='merchant')renderMerchant();if(panel==='flasks')renderFlasks();if(panel==='training')renderTraining();if(panel==='trainingResults')renderTrainingResults();if(panel==='settings')renderSettings();if(panel==='verified')renderVerified();dialog.scrollTop=scroll;if(inventorySelection?.id===detailItem&&$('#inventory-selection'))$('#inventory-selection').scrollTop=detailScroll;if(!inventorySelection)inventoryPanelPinned=false;positionInventoryInspector();}
function skillSource(id){const sources=M.SLOTS.filter(slot=>c.equipment[slot]?.grantedSkill===id);const learned=M.skillNode(c.cls,id)?.ability&&(c.talents[id]||0)>0;return [id==='m_titan'?'萬靈王庭5件授予':'',learned?'技能加點習得':'',sources.length?'裝備 · '+sources.map(slot=>M.SLOT_NAMES[slot]).join('／'):''].filter(Boolean).join(' ＋ ');}
function equipmentGrantHint(item){const worn=Object.values(c.equipment).some(i=>i.id===item.id),id=item.grantedSkill,slot=M.skillLoadout(c).indexOf(id),family=M.skillCategory(id),where=family==='summon'?'召喚編隊 · C':family==='aura'?'光環配置':family==='movement'?'位移配置 · 空白鍵':'主動配置';return worn?(slot>=0?'已配置 '+SLOT_LABELS[slot]:M.movementSkill(c)===id?'已配置空白鍵':'已取得 · 前往'+where)+' · 不限職業／等級':'穿戴後可用 · '+where+' · 不限職業／等級';}
async function commitSkillConfig(mutate,message){
 const candidate=profileCandidate(),hero=candidate.characters[c.id];if(!hero||!mutate(hero)){toast('此技能無法配置，請先清空原欄位。');if(['loadout','summons','auras'].includes(panel))renderPanel();return false;}
 try{prepareCandidate(candidate);await persistProfile(candidate);}catch{toast('技能配置未儲存，原配置保留。');if(['loadout','summons','auras'].includes(panel))renderPanel();updateHUD();return false;}
 for(const id of [...e.auraIds])if(!M.auraLoadout(hero).includes(id))e.toggleAura(e.ability(id));
 state=candidate;c=state.characters[state.active];e.c=c;e.refresh();e.syncConfiguredAuras();if(['loadout','summons','auras'].includes(panel))renderPanel();updateCharacter();updateHUD();if(message)toast(message);return true;
}
function profileCandidate(){if(state.active===c.id&&e.c===c)e.persistSummons();return structuredClone(state);}
function restoreLegacyEquipment(hero){
 return !!(hero?.pendingLoot?.length&&hero.bag.length<Inventory.BAG_CAPACITIES.equipment&&M.claimPendingLoot(hero).ok);
}
function prepareCandidate(profile){
 for(const hero of Object.values(profile.characters)){if(e.mode==='camp')restoreLegacyEquipment(hero);M.reconcileSkillLoadouts(hero);}
 refreshPaidCheckpoint(profile,e);
}
function categoryTag(value){const category=M.SKILL_CATEGORIES[M.skillCategory(value)];return `<span class="skill-category" style="--category-color:${category.color}">${category.name}</span>`;}

function skillCopyToggle(){return `<label class="skill-copy-toggle"><input type="checkbox" data-short-skill-description ${shortSkillDescriptions?'checked':''}><span>簡短說明</span></label>`;}
function skillTypeBadges(def){if(def?.shadowV70&&!def.damage)return '';return SkillText.typeBadges(def,abilityDamageTypes(def?.id));}
function bloodAuraBehavior(def){if(!def?.bloodBuildV81||def.id!=='b_bloodaura')return '';return '在技能頁點擊光環啟用／關閉；成功支付維持血費才累積血熱，支付後須保留20%最大生命。暫停、營地與過場不累積血熱。'+(def.bloodPulse?'已學會的物理脈衝不產生狂怒、吸血或裝備觸發。':'尚未學會血熱脈衝時只提供攻勢增益。')+(def.bloodOath?'蓄熱達門檻後手動關閉可釋放血爆；資源不足、死亡或失去技能等自動停止不釋放。':'');}
function skillDescription(def,node={},configuration=false){const prose=def?.desc||node.desc||'';return shortSkillDescriptions?SkillText.colorTerms(SkillText.skillSummary(def?{...def,damageTypes:abilityDamageTypes(def.id)}:null,node).join(' · ')):SkillText.colorTerms((configuration?SkillText.configurationDescription(prose):prose)+(def?' '+(bloodAuraBehavior(def)||skillBehavior(def)):''));}
function skillDamagePacket(def,stats=e.s){if(!def)return null;const aura=def.type==='aura',damageDef=aura?{...def,damage:(def.damage||0)*auraBoostFor(def,stats)}:def;return Game.prototype.damagePreview.call({s:stats},damageDef,aura?{aura:true,damageType:def.damageType}:{});}
function skillEffectRows(def,stats=e.s){const packet=skillDamagePacket(def,stats);return abilityRows(def,stats,packet).map(([label,value])=>`<div><dt>${SkillText.colorTerms(label)}</dt><dd>${SkillText.effectMarkup(label,value,def,packet?.byType)}</dd></div>`).join('');}
function fullSkillEffects(def,label='完整效果與消耗',stats=e.s){return shortSkillDescriptions?'':`<details class="granted-skill-details"><summary>${esc(label)}</summary><dl>${skillEffectRows(def,stats)}</dl></details>`;}
function equipmentGrantMarkup(item){const def=M.grantedSkillPreview(c,item);if(!def){const base=M.ABILITIES[item.grantedSkill];return base?`<div class="tooltip-granted">${icon(base.icon)}<b>授予：${base.name}</b>${categoryTag(base)}<small class="tooltip-grant-hint">${esc(M.equipRequirement(c,item).reason||'穿戴後可用')}</small><div class="skill-copy-bar">${skillCopyToggle()}${skillTypeBadges(base)}</div><p>${skillDescription(base)}</p></div>`:'';}const hero=structuredClone(c),worn=Object.values(hero.equipment).some(i=>i.id===item.id);if(!worn){hero.equipment[item.slot]=structuredClone(item);if(item.slot==='weapon'&&M.weaponDefinition(item,hero.cls).hands===2)delete hero.equipment.offhand;if(item.slot==='offhand'&&hero.equipment.weapon&&M.weaponDefinition(hero.equipment.weapon,hero.cls).hands===2)delete hero.equipment.weapon;}const stats=M.stats(hero);return `<div class="tooltip-granted">${icon(def.icon)}<b>授予：${def.name} Lv.${def.level}</b>${categoryTag(def)}<small class="tooltip-grant-hint">${equipmentGrantHint(item)}</small><p>${skillFacts(def,stats)}</p><div class="skill-copy-bar">${skillCopyToggle()}${skillTypeBadges(def)}</div><p>${skillDescription(def)}</p>${fullSkillEffects(def,'完整技能效果 · 以穿戴後能力估算',stats)}</div>`;}
function configureAutoEnabled(enabled){if(!state.active){toast('請先建立一位角色。');updateHUD();return;}commitSkillConfig(hero=>{hero.autoEnabled=!!enabled;return true;},enabled?'自動戰鬥已開啟。':'自動戰鬥已關閉。');}
function renderLoadout(){
 renderPanelControls();$('#dialog-body').innerHTML=skillConfigurationMarkup({hero:c,game:e,target:loadoutTarget,icon,esc,costText,
  summary:def=>def.category==='passive'?def.description:def.category==='basic'?BasicAttacks.basicAttackSummary(def.id,{compact:true}):SkillText.skillSummary({...def,damageTypes:abilityDamageTypes(def.id)},{}).join(' · '),incrementReason:summonIncrementReason});
}

function catalogBasicRows(def){
 const compatible=BasicAttacks.basicAttackCompatible(c,def.id);
 const weaponNames=skillWeaponRequirement(def)||def.weapons.map(type=>M.WEAPON_TYPES[type].name).join('／');
 const rows=[['裝備條件',weaponNames+(def.requiresShield?' · 需配盾牌':'')+(compatible?'':' · 目前未符合')],
  ['傷害屬性',SkillText.DAMAGE_LABELS[def.damageType]],['普攻傷害係數',percent(def.damage)+' 武器普攻']];
 if(!compatible)return rows;
 const metrics=basicAttackMetrics(e,def);
 const sides=['主手','副手'];
 metrics.hands.forEach(({interval,range,hits},i)=>{
  const prefix=metrics.hands.length>1?sides[i]:'';
  rows.push([prefix+'攻擊間隔',interval.toFixed(2)+' 秒'],[prefix+'攻擊距離',Math.round(range)],
   [prefix+'命中傷害',hits.map(Math.round).join(' ＋ ')]);
 });
 if(metrics.projectiles)rows.push(['投射物',metrics.projectiles+' 枚'],['穿透次數',metrics.pierce]);
 if(metrics.explosion)rows.push(['爆炸半徑',Math.round(metrics.explosion)]);
 if(metrics.width)rows.push(['貫穿寬度',Math.round(metrics.width)]);
 if(metrics.chainTargets)rows.push(['連鎖目標',metrics.chainTargets+' 名'],['連鎖距離',metrics.chainRange]);
 if(metrics.secondHitDelay)rows.push(['雙刺間隔',metrics.secondHitDelay.toFixed(2)+' 秒']);
 if(metrics.poisonRatio)rows.push(['中毒',percent(metrics.poisonRatio)+' 命中傷害／秒 · '+metrics.poisonDuration.toFixed(1)+' 秒']);
 if(metrics.life!==undefined)rows.push(['每擊成本',costText({life:metrics.life})]);
 else rows.push(['每擊成本','無']);
 return rows;
}

function catalogPassiveRows(def){
 const rows=Object.entries(def.mods||{}).map(([key,value])=>[modNames[key]||M.PASSIVE_MOD_NAMES[key]||M.AFFIXES[key]?.label||'效果',modifierText(key,value*def.level,false)]);
 for(const [label,threshold] of [['召喚容量',def.summonCapacityThreshold],['召喚技能等級',def.summonSkillThreshold]]){
  if(!threshold)continue;
  const current=Math.min(threshold.max??Infinity,Math.floor(def.level/(threshold.every||5))*(threshold.amount||1));
  rows.push([label,'＋'+current]);
 }
 return rows;
}

function openCatalogSkill(id){
 const def=skillCatalog(c).find(entry=>entry.id===id);
 if(!def)return;
 const basic=def.category==='basic',passive=def.category==='passive';
 const packet=basic||passive?null:skillDamagePacket(def);
 const rows=basic?catalogBasicRows(def):passive?catalogPassiveRows(def):abilityRows(def,e.s,packet);
 const description=basic?BasicAttacks.basicAttackSummary(def.id,{compact:true}):passive?(def.desc||def.description):
  def.id==='r_clone'?skillBehavior(def):[SkillText.configurationDescription(def.desc),bloodAuraBehavior(def)||skillBehavior(def)].filter(Boolean).join(' ');
 const family=basic?'普攻':M.SKILL_CATEGORIES[def.category]?.name;
 const masteries=def.masteries||[];
 catalogDialog.innerHTML=`<header class="skill-catalog-heading">
  <span class="compact-skill-icon" style="color:${def.color||'#b9cce5'}">${icon(def.icon)}</span>
  <div><h2 id="skill-catalog-title">${esc(def.name)}</h2><span>${SkillText.catalogText(family+' · Lv.'+def.level+(def.bonusRank?' · 裝備 +'+def.bonusRank:''))}</span></div>
  ${modalClose('data-close-skill-catalog autofocus','關閉技能詳情')}</header>
  <div class="skill-catalog-content">
   ${description?`<p class="skill-catalog-description">${SkillText.catalogText(description)}</p>`:''}
   ${rows.length?`<dl class="skill-catalog-values" aria-label="目前效果與數值">${rows.map(([label,value])=>`<div><dt>${SkillText.catalogText(label)}</dt><dd>${SkillText.catalogValue(label,value,def,packet?.byType)}</dd></div>`).join('')}</dl>`:''}
   ${masteries.length?`<section class="skill-catalog-masteries"><h3>熟練效果</h3><ul>${masteries.map(m=>`<li class="${m.active?'is-active':''}"><span class="skill-catalog-mastery-rank">${SkillText.catalogText('Lv.'+m.rank+' · '+(m.active?'已生效':'未解鎖'))}</span><span>${SkillText.catalogText(m.label)}</span></li>`).join('')}</ul></section>`:''}
   ${basic||def.damage||def.summon&&!def.summon.support?'<p class="skill-catalog-note">傷害依目前能力估算，尚未計入敵人減傷與爆擊。</p>':''}
  </div>`;
 catalogDialog.showModal();
}

catalogDialog.addEventListener('click',event=>{
 if(event.target===catalogDialog||event.target.closest('[data-close-skill-catalog]'))catalogDialog.close();
});
function summonIncrementReason(plan,row){if(row.count>=row.limit)return '已達此技能上限';if(plan.count+(row.capacityCost??1)>plan.capacity)return '已達角色召喚容量';if(plan.manaCost+row.unitMana>plan.maxMana)return '超過最大魔力預算';if(plan.lifeCost+row.unitLife>=plan.maxLife)return '超過可支付的生命預算';return '';}
async function assignConfiguredSkill(id,kind){
 const [targetKind,target]=(loadoutTarget||'').split(':');if(targetKind!==kind||!target)return;const basic=kind==='basic';
 const ok=await commitSkillConfig(hero=>{
  if(basic){if(id){const previous=BasicAttacks.basicLoadout(hero).indexOf(id);if(previous>=0&&previous!==Number(target))BasicAttacks.assignBasicSlot(hero,previous,null);}return BasicAttacks.assignBasicSlot(hero,Number(target),id);}
  if(id){const previous=M.skillLoadout(hero).indexOf(id);if(previous>=0)M.assignSkill(hero,previous,null);if(M.autoSkill(hero)===id)M.assignAutoSkill(hero,null);if(M.movementSkill(hero)===id)M.assignMovement(hero,null);}
  return target==='movement'?M.assignMovement(hero,id):M.assignSkill(hero,Number(target),id);
 },'');
 if(ok&&panel==='loadout'){loadoutTarget=null;renderLoadout();$('[data-config-target="'+targetKind+':'+target+'"]')?.focus({preventScroll:true});}
}
async function toggleConfiguredAura(id){
 const enabled=!M.auraLoadout(c).includes(id),def=e.ability(id),drain=e.auraResourceCost(def),cost=M.resourceCost(def,e.s),reason=enabled?e.resourceFailure(cost,drain.life>0?e.s.hp*.2:1):'';
 if(reason){toast(reason);return;}await commitSkillConfig(hero=>M.assignAura(hero,id,enabled),'');
}
function bloodResource(stats=e.s){return stats.resourceClass?['berserker','blood'].includes(stats.resourceClass):c.cls==='berserker';}
function summonDraftRow(def){const unitResourceCost=M.summonUnitResourceCost(def,e.s);return {id:def.id,count:0,limit:def.summon.count,capacityCost:def.summon.capacityCost??1,unitResourceCost,unitMana:unitResourceCost.mana,unitLife:unitResourceCost.life};}
function markAvailability(button,state){
 const view=availabilityView(state),cooling=state.blockedByCooldown&&view.cooldown>0;
 button.classList.toggle('unavailable',view.unavailable&&!cooling);
 button.setAttribute('aria-disabled',String(view.unavailable));button.dataset.unavailableReason=view.reason;
 const cover=button.querySelector('.cooldown');
 cover.classList.toggle('active',!!cooling);
 if(cooling){
  const seconds=view.cooldown,remaining=Math.min(1,seconds/(state.cooldownDuration||seconds));
  cover.style.setProperty('--cooldown-remaining',(remaining*100)+'%');
  cover.textContent=seconds<1?(Math.ceil(seconds*10)/10).toFixed(1):String(Math.ceil(seconds));
 }
 let note=button.querySelector('.action-reason');
 if(!note){note=document.createElement('span');note.className='action-reason';button.append(note);}
 note.textContent=view.reason;note.hidden=!view.unavailable||!!cooling;
 if(view.reason){button.title+=' · '+view.reason;button.setAttribute('aria-label',(button.getAttribute('aria-label')||'')+'，'+view.reason);}
}
function resourceRateText(def,stats=e.s){
 const cost=M.resourceCost(def,stats);if(def.type!=='channel')return costText(cost);
 return def.designV29?costText(cost)+'／秒':costText(cost)+'／次';
}
function previewContext(stats){return Object.assign(Object.create(e),{s:stats});}
function actualCooldown(def,stats=e.s){return e.skillCooldown.call(previewContext(stats),def);}

function channelInterval(def,stats=e.s){return e.abilityInterval.call(previewContext(stats),def);}
function auraCostFor(def,stats=e.s){return e.auraResourceCost(def,1,stats);}
function auraPulseFor(def,stats=e.s){return Game.prototype.auraPulseInterval.call({s:stats},def);}
function auraBoostFor(def,stats=e.s){return Game.prototype.auraDamageBoost.call({s:stats},def);}
function auraManaRestore(def,stats=e.s){return (def.manaRestore||0)+(def.manaRestorePct||0)*stats.mana;}
function bloodAuraStateText(def){const state=def.id==='b_bloodaura'&&def.bloodBuildV81&&e.bloodBuild?.details();return state?(state.active?'血熱 '+state.heat+' 層 · 維持血費 '+Number(state.drainMultiplier.toFixed(2))+'× · 已支付 '+state.paidSeconds.toFixed(1)+' 秒'+(state.releaseReady?' · 血爆就緒':''):'未開啟 · 血熱 0 層'):'';}

function percent(value){return Number((value*100).toFixed(1))+'%';}
function auraRestoreText(def,stats=e.s){const parts=[];if(def.lifeRestorePct)parts.push(percent(def.lifeRestorePct)+' HP／秒');if(!bloodResource(stats)&&def.manaRestorePct)parts.push(percent(def.manaRestorePct)+' MP／秒');if(!bloodResource(stats)&&def.manaRestore)parts.push(Number(def.manaRestore.toFixed(1))+' MP／秒');return parts.length?' · 回復 '+parts.join('、'):'';}
function skillFacts(def,stats=e.s){
 const family=M.skillCategory(def);if(family==='summon')return `C 整隊召喚 · 每隻 ${costText(M.summonUnitResourceCost(def,stats))} · 上限 ${def.summon.count} 名 · 永久`;
 if(family==='aura')return `V 群組開關 · 啟動 ${costText(M.resourceCost(def,stats))} · ${costText(auraCostFor(def,stats))}／秒${auraRestoreText(def,stats)}`;
 if(def.type==='channel')return `${resourceRateText(def,stats)} · 每秒 ${(1/channelInterval(def,stats)).toFixed(1)} 次 · ${def.allowsBasic?'引導時可普攻':'按住施放／放開停止'}`;
 return `${family==='movement'?DODGE_LABEL+' · ':''}${costText(M.resourceCost(def,stats))} · 冷卻 ${actualCooldown(def,stats).toFixed(1)} 秒${['curse','warcry'].includes(family)?' · 持續 '+def.duration.toFixed(1)+' 秒':''}`;
}
const modNames={lifeRegenPct:'每秒生命再生',dotDamage:'持續傷害',evasion:'閃避率',summonArea:'召喚作用範圍',summonReduce:'召喚減傷',summonManaCost:'召喚減耗',rarityFind:'裝備稀有度 R',atkPct:'攻擊',hpPct:'最大生命',speedPct:'移動速度',mana:'最大魔力',manaRegen:'每秒回魔',armor:'護甲',haste:'攻擊速度',crit:'爆擊率',critDmg:'舊版爆傷（停用）',critMultiplier:'獨特爆擊倍率',critDamageBonus:'爆擊倍率加成',skillArea:'技能範圍',extraProjectiles:'額外技能投射物',skillDuration:'技能持續時間',castSpeed:'施法速度',block:'格擋率',blockReduction:'格擋減傷',leech:'生命偷取',reduce:'減傷',resist:'法術減傷',cdr:'冷卻縮減',skillDmg:'技能傷害',skillMult:'技能傷害',summonDamage:'召喚物傷害',summonLife:'召喚物生命',summonHaste:'召喚物攻擊速度',summonSpeed:'召喚物移動速度',manaRegenPct:'回魔速度',flatManaCost:'固定減耗',manaLeech:'魔力吸取',manaOnHit:'命中回魔',manaOnKill:'擊殺回魔',extraArrows:'額外箭矢',pierce:'穿透',burn:'每秒持續傷害',freeze:'凍結時間',lifeRegen:'每秒回血',summonCapacity:'召喚容量',drop:'裝備掉落率 Q',manaCost:'資源減耗',chargeGain:'充能獲取',thorns:'反傷',killHeal:'擊殺回血',allSkills:'全部技能等級',auraDamage:'光環傷害',auraArea:'光環範圍',auraManaCost:'光環減耗',skillAuraEffect:'技能光環增益／減益效果',damageBonus:'額外傷害',experienceGain:'經驗獲取',armorPct:'護甲',allResist:'全元素抗性'};

function modifierText(key,value,includeLabel=true){if(key==='critDmg')return '舊版爆擊傷害（停用）';if(key==='critDamageBonus')return '爆擊倍率 +'+Number(value.toFixed(3))+'×';if(key==='critMultiplier')return '爆擊倍率固定 '+value+'×（指定獨特裝備）';const flat=['summonCapacity','mana','manaRegen','armor','extraArrows','extraProjectiles','pierce','freeze','lifeRegen','allSkills','flatManaCost','manaOnHit','manaOnKill'].includes(key);const sign=value<0?'−':'+';return (includeLabel?(modNames[key]||M.AFFIXES[key]?.label||'能力')+' ':'')+sign+(flat?Number(Math.abs(value).toFixed(1)):percent(Math.abs(value)))+(key==='freeze'?' 秒':'');}
function abilityRows(def,stats=e.s,packet=skillDamagePacket(def,stats)){
 if(!def)return [];const rows=[],aura=def.type==='aura',interval=aura?auraPulseFor(def,stats):def.interval,boost=aura?auraBoostFor(def,stats):1,damagePacket=packet,rawDamage=damagePacket.total;
 const support=def.summon?.support;
 if(support){
  const ward=support.kind==='ward';
  const effect=ward?percent(support.strength)+' 友軍減傷':`敵人傷害 −${percent(support.strength)} · 對首領效果 ${percent(support.bossMultiplier??.5)}`;
  const rows=[['召喚定位',ward?'防護光環 · 跟隨角色':'衰弱詛咒 · 靠近敵群'],['支援效果',effect],['作用半徑',Math.round(support.radius)],['每隻成本',costText(M.summonUnitResourceCost(def,stats))],['召喚配置',`最多 ${def.summon.count} 隻 · 容量 ${def.summon.capacityCost} · C 重召`],['每隻生命',Math.round(stats.hp*def.summon.hpMult*stats.summonLife)]];
  if(def.summon.shieldRatio)rows.push(['友軍護盾',`${percent(def.summon.shieldRatio)} 最大生命 · 持續 ${def.summon.shieldDuration} 秒`]);
  if(support.slow)rows.push(['緩速',percent(support.slow)+' · 對首領減半']);
  return rows;
 }
 const weaponRequirement=skillWeaponRequirement(def);
 if(weaponRequirement)rows.push(['裝備條件',weaponRequirement+(skillWeaponCompatible(c,def)?'':' · 目前未符合')]);
 if(aura){const drain=auraCostFor(def,stats),restore=auraManaRestore(def,stats);rows.push(['操作','在技能頁啟用／關閉'],['啟動成本',costText(M.resourceCost(def,stats))],['持續成本',costText(drain)+'／秒']);if(def.damage)rows.push(['脈衝間隔',interval.toFixed(2)+' 秒']);if(def.lifeRestorePct)rows.push(['生命回復',percent(def.lifeRestorePct)+' 最大 HP／秒（'+(def.lifeRestorePct*stats.hp).toFixed(1)+'）']);if(!bloodResource(stats)&&def.manaRestorePct)rows.push(['魔力回復比例',percent(def.manaRestorePct)+' 最大 MP／秒']);if(!bloodResource(stats)&&restore)rows.push(['魔力回復',restore.toFixed(1)+' MP／秒'],['淨魔力回復',(restore-drain.mana).toFixed(1)+' MP／秒']);if(bloodResource(stats))rows.push(['光環淨生命變化',((def.lifeRestorePct||0)*stats.hp-drain.life).toFixed(1)+' HP／秒']);}
 else if(def.summon){rows.push(['操作','C 重召整支軍隊'],['每隻成本',costText(M.summonUnitResourceCost(def,stats))],['軍隊重召冷卻','1 秒']);}else {rows.push([def.type==='channel'?'持續成本':'施放成本',resourceRateText(def,stats)]);rows.push(['冷卻',def.type==='channel'?'0 秒':actualCooldown(def,stats).toFixed(1)+' 秒']);}
 const stanceInfo=M.stanceSkillInfo(c,def.id);if(stanceInfo)rows.push(['持握效果',stanceInfo.name+' · '+stanceInfo.text]);if(def.id==='a_blink')rows.push(['充能','2 次'],['每次恢復',Math.max(1,2.5/(1+(stats.movementRecovery||0))).toFixed(2)+' 秒']);if(def.type==='charge')rows.push(['蓄力時間',Math.max(.35,def.chargeTime/(stats.haste||1)).toFixed(2)+' 秒 · 放開施放']);if(def.summon?.kind==='shadow_clone')rows.push(['分身呼應','影刺／斬喉／鏡殺 · 每次施放一次'],['普攻繼承','按配置順序使用本體的普攻技能，採用本體武器與攻速']);if(def.damage)rows.push(['傷害屬性',Object.entries(damagePacket.byType).filter(([,value])=>value>0).map(([type])=>SkillText.DAMAGE_LABELS[type]).join('／')]);else if(def.damageType&&!def.summon)rows.push(['傷害屬性',SkillText.DAMAGE_LABELS[def.damageType]||def.damageType]);if(def.lightningVariance)rows.push(['閃電特性','每次直接命中 50%～150% 傷害 · 技能爆擊率＋10 百分點（最高80%）']);if(def.shock)rows.push(['感電','持續4秒 · 被爆擊率＋10百分點 · 所受爆擊最終傷害＋20% · 同狀態不疊加，玩家與盟友皆受益']);if(def.slow)rows.push(['緩速',percent(def.slow)+' · '+Number(def.slowDuration||2).toFixed(1)+' 秒']);if(def.stun)rows.push(['暈眩',Number(def.stun).toFixed(1)+' 秒']);
 const splash=def.splashFactor??1;
 if(def.damage)rows.push([aura?'每次脈衝傷害':def.type==='ground'?'每秒傷害':def.type==='channel'?'每次傷害':def.impactBonus?'濺射傷害':'命中傷害',Math.round(rawDamage*splash)+'（'+Math.round(def.damage*boost*splash*100)+'% 攻擊）']);
 if(def.impactBonus)rows.push(['直擊傷害',Math.round(rawDamage*(1+def.impactBonus))+'（自施 +'+percent(def.impactBonus)+'）']);
 if(def.coldExposure)rows.push(['敵人冰抗降低',Math.round(def.coldExposure*100)+' 百分點 · '+def.coldExposureDuration.toFixed(1)+' 秒'],['普攻','引導時照常攻擊']);
 if(def.damage&&Object.values(damagePacket.byType).filter(value=>value>0).length>1)for(const [type,value] of Object.entries(damagePacket.byType))if(value>0)rows.push([SkillText.DAMAGE_LABELS[type]+'傷害',Math.round(value)]);
 if(def.combo){rows.push(['連擊次數',def.combo.hits+' 次'],['每擊間隔',Math.max(.06,def.combo.interval/Math.max(.25,stats.haste)).toFixed(2)+' 秒'],['單敵命中上限',(def.combo.perTarget||def.combo.hits)+' 次']);}if(def.id==='a_veil')rows.push(['隱身閃避／減傷','+15%／20%'],['破隱伏擊','下一次本體命中 +25%'],['破隱再施放限制','2 秒']);if(def.id==='a_dancer'&&def.m6)rows.push(['閃避回魔','4 MP · 每0.75秒最多一次'],...(def.m10?[['閃避後增益','額外8%閃避 · 0.8秒']]:[]));
 if(def.arsenalV79)rows.push([def.id==='a_shuriken'?'釘刃上限／維持':'可消耗釘刃',def.id==='a_shuriken'?'3 層／4 秒':'最多3層'],['每層釘刃增傷','本次機關或苦無傷害 +10%']);
 if(aura&&def.damage)rows.push(['脈衝每秒傷害',Math.round(rawDamage/interval)+'／秒（不含燃燒）']);
 if(aura&&def.elementalAura&&boost>1)rows.push(['元素光環強化','傷害 +'+percent(boost-1)+' · 頻率 +'+percent((def.interval||1)/interval-1)]);
 if(def.type==='channel')rows.push(['傷害頻率',(1/channelInterval(def,stats)).toFixed(2)+' 次／秒'],['每秒成本',costText(def.designV29?M.resourceCost(def,stats):scaleCost(M.resourceCost(def,stats),1/channelInterval(def,stats)))+'／秒']);
 if(def.radius&&def.type!=='projectile'&&!(def.bloodBuildV81&&def.id==='b_bloodaura'))rows.push(['作用半徑',Math.round(def.radius)]);if(def.length)rows.push(['引導長度',Math.round(def.length)]);if(def.width)rows.push(['引導寬度',Math.round(def.width)]);
 if(def.type==='projectile')rows.push(['投射物',Math.min(12,(def.explosionRadius||def.chain?1:(def.arrows||1)+(stats.extraArrows||0))+(def.extraProjectiles||0))+' 枚'],['彈體半徑',Math.round(projectileBodyRadius(def.radius||7,def.explosionRadius||0))]);
 if(def.type==='chain')rows.push(['首段','即時電弧 · 距離 '+def.range]);
 if(def.explosionRadius)rows.push(['爆炸半徑',Math.round(def.explosionRadius)]);
 if(def.chain)rows.push(['連鎖目標',(def.chain.jumps+1)+' 名'],['每跳傷害',Math.round(def.chain.falloff*100)+'% 前一跳'],['連鎖距離',Math.round(def.chain.range)]);
 if(def.trap){const spec=def.trap;rows.push(['陷阱類型',spec.mode==='turret'?'自動飛刃哨機':'踩踏觸發'],['存留時間',(spec.duration||0)+' 秒'],['設置上限',(spec.maxCount||0)+' 個 · 全陷阱合計最多8個'],['啟動時間',(spec.armTime||0)+' 秒']);if(spec.mode==='turret')rows.push(['射擊間隔',(spec.interval||0)+' 秒'],['索敵距離',spec.range]);else rows.push(['觸發半徑',spec.triggerRadius]);if(spec.cloud)rows.push(['毒霧','命中留下限時毒霧 · 最多12片']);}if(def.poisonFraction&&def.id!=='r_venom')rows.push(['中毒',percent(def.poisonFraction)+' 攻擊基準／秒 · '+Math.min(MAX_AILMENT_DURATION,(def.poisonDuration||3)*(1+(stats.ailmentDuration||0)+(stats.poisonDurationBonus||0))).toFixed(1)+' 秒 · '+(def.rangerPoison?'獨立疊層，上限'+(def.poisonStackLimit||5)+'層':'同源取強')]);if(def.poisonCloud)rows.push(['毒霧半徑',Math.round(def.poisonCloudRadius||90)+' · 同區取強，與箭毒分開'],['引爆規則','霧爆箭提前結算剩餘箭毒40%，扣除相同預算']);if(def.poisonCloud)rows.push(['毒霧',def.designV29?'中毒目標死亡留下毒霧':'命中留下3秒毒霧 · 半徑90 · 每秒25%攻擊']);
 if(def.summon){const spec=def.summon;rows.push(['召喚維持','永久 · C 重召整支軍隊'],['召喚定位',spec.role||(spec.ranged?'遠程輸出':'近戰輸出')],['傷害屬性',({physical:'物理',fire:'火焰',cold:'冰霜',lightning:'閃電',poison:'毒素'})[spec.damageType]||(spec.kind==='mirror_clone'?'依武器／複製技能':'依召喚物')],['召喚上限',spec.count+' 名'],['每隻生命',Math.round(stats.hp*spec.hpMult*stats.summonLife)],['每隻攻擊',spec.kind==='mirror_clone'?'依武器／複製技能傷害 × 繼承倍率':Math.round(Game.prototype.damagePreview.call({s:stats},def,{minion:true}).total)],['攻擊頻率',spec.kind==='mirror_clone'?'普攻沿用本體武器與攻速；複製技能另計冷卻':(stats.summonHaste*(1+(e.minionAura?.haste||0))/spec.interval).toFixed(2)+' 次／秒']);if(spec.kind==='mirror_clone'||def.id==='r_clone')rows.push(['傷害繼承',percent(spec.inheritance??1)+' 玩家傷害 · 召喚傷害加成另計一次'],['獨立魔力',Math.round(stats.ringMirrorMana??stats.mana)+' MP · 每秒回復 '+Number((stats.ringMirrorRegen??stats.manaRegen??0)*(1+(spec.manaRegenBonus||0))).toFixed(1)],['複製施放','複製1／2／3（左鍵／右鍵／Q）可由分身施放的技能；獨立魔力與冷卻'],['普攻繼承','按配置順序使用本體的普攻技能，採用本體武器與攻速']);if(spec.armor!==undefined)rows.push(['固有護甲',spec.armor+c.level]);if(spec.reduce)rows.push(['固有減傷',percent(spec.reduce)]);if(spec.tauntRadius)rows.push(['嘲諷半徑',Math.round(spec.tauntRadius)+' · 普通／菁英，首領不強制轉向']);if(spec.attackRadius)rows.push(['攻擊範圍',Math.round(spec.attackRadius)+' 半徑 · 最多 '+(spec.maxTargets||3)+' 目標']);if(spec.burnFraction)rows.push(['每層燃燒',Math.round(Game.prototype.damagePreview.call({s:stats},{id:def.id,summon:{...spec,attackMult:spec.attackMult*spec.burnFraction}},{minion:true,dot:true,damageType:'fire'}).total)+'／秒 · '+spec.burnDuration.toFixed(1)+' 秒'],['燃燒倍率',percent(spec.burnFraction)+' 未爆擊命中傷害／秒 · 全來源最多8層']);if(spec.poisonFraction)rows.push(['中毒傷害',percent(spec.poisonFraction)+' 原始未爆擊攻擊／秒 · '+Number(spec.poisonDuration||3).toFixed(1)+' 秒'],['中毒規則','同來源只保留最強一份，不重複套召喚增傷']);if(spec.shieldRatio)rows.push(['友軍護盾',percent(spec.shieldRatio)+' 各自最大生命'],['護盾頻率',Number(spec.shieldInterval||6).toFixed(1)+' 秒'],['護盾持續',Number(spec.shieldDuration||4).toFixed(1)+' 秒'],['護盾半徑',Math.round(spec.shieldRadius||220)],['同源護盾','每名友軍只保留最強一份，不隨守衛數量疊層']);if(spec.slow)rows.push(['緩速',percent(spec.slow)+' · '+spec.slowDuration.toFixed(1)+' 秒']);if(spec.freezeChance)rows.push(['冰凍',percent(spec.freezeChance)+' 基礎機率 · '+spec.freezeDuration.toFixed(2)+' 秒 · 受敵人冰抗影響']);if(spec.attackMode==='cone')rows.push(['冰箭扇形',(spec.projectiles||3)+' 道 · 張角 '+Math.round((spec.spread||0)*180/Math.PI)+'°']);if(spec.storm)rows.push(['暴風雪','每第3次攻擊 · '+spec.storm.duration+' 秒 · 半徑'+spec.storm.radius+' · 每秒'+percent(spec.storm.damage)+'攻擊'],['暴雪緩速',percent(spec.storm.slow)]);if(spec.chain)rows.push(['連鎖目標',(spec.chain.jumps+1)+' 名 · 不重複命中'],['連鎖距離',Math.round(spec.chain.range)],['每跳傷害',percent(spec.chain.falloff)+' 前一跳']);}
 if(M.skillCategory(def)==='curse')rows.push(['傷害','無 · 僅施加敵人減益']);if(M.skillCategory(def)==='warcry')rows.push(['作用對象','自己與召喚盟友']);if(M.skillCategory(def)==='movement')rows.push(['快捷鍵','空白鍵 · 取代免費閃避']);if(def.shield)rows.push(['護盾',Math.round(def.shield*stats.hp)]);if(def.heal)rows.push(['恢復生命',Math.round(def.heal*stats.hp)]);
 if(def.leech)rows.push(['生命吸取',Math.round(def.leech*100)+'% 傷害']);if(def.type==='projectile'&&!def.explosionRadius&&!def.chain&&(def.pierce||stats.pierce))rows.push(['穿透次數',(def.pierce||0)+(stats.pierce||0)]);if(def.freeze)rows.push(['控制時間',def.freeze.toFixed(1)+' 秒']);if(def.distance)rows.push(['位移距離',def.distance]);if(def.duration&&!def.summon)rows.push(['持續時間',def.duration.toFixed(1)+' 秒']);
 if(def.burn){const poison=['r_trap','r_venom'].includes(def.id),coefficient=(def.burn+(aura?0:stats.burn||0))*boost;rows.push([poison?'毒素傷害':'每層燃燒傷害',Math.round(Game.prototype.damagePreview.call({s:stats},{id:def.id,damage:coefficient},{dot:true,aura,damageType:poison?'poison':'fire'}).total)+'／秒']);if(!poison)rows.push(['燃燒持續',(def.burnDuration||def.duration||3).toFixed(1)+' 秒／層'],['燃燒疊層','全來源共用，最多 8 層']);}
 if(def.freezeChance)rows.push(['凍結機率（敵冰抗 0%）',percent(def.freezeChance)],['凍結持續',(def.freezeDuration||0).toFixed(2)+' 秒'],['冰抗影響','機率 ×（1 − 敵人冰抗）；冰抗計入 −50%～75%']);
 for(const [key,value] of Object.entries(def.debuff||{}))rows.push([({slow:'敵人緩速',armorShred:'敵人護甲降低',weaken:'敵人傷害降低'})[key]||'敵人減益',percent(value)]);
 for(const [key,value] of Object.entries(def.buff||{}))rows.push([modNames[key]||'增益',modifierText(key,value)]);
 if(def.infusion){const v=def.infusion;rows.push(['主動技能火焰附傷',percent(v.fire||0)+' 本次技能傷害'],['主動技能冰霜附傷',percent(v.cold||0)+' 本次技能傷害'],['附魔燃燒',percent(v.burn||0)+' 本次技能傷害／秒 · '+(v.burnDuration||0).toFixed(1)+' 秒／層 · 上限 8 層'],['附魔緩速',percent(v.slow||0)],['附魔凍結',percent(v.freezeChance||0)+' ×（1 − 敵冰抗） · '+(v.freezeDuration||0).toFixed(2)+' 秒']);}
 rows.push(...beastEffectRows(def),...bloodEffectRows(def));if(def.elementalBoost)rows.push(['火／冰光環傷害','+'+percent(def.elementalBoost.damage||0)],['火／冰光環脈衝頻率','+'+percent(def.elementalBoost.frequency||0)]);return rows;
}
function skillBehavior(def){if(!def)return '每投入 1 點，提高下列被動能力。';
 if(def.id==='a_execute')return '揮擊前方單一敵人，消耗破綻增強傷害。';
 if(def.id==='a_flurry')return '對鎖定的單一敵人連擊。';
 if(def.id==='a_storm')return '在敵人之間瞬移並依序斬擊，可重擊單一目標。';
 if(def.id==='a_veil')return '短暫隱身並保護自己，破隱後的首次攻擊獲得伏擊加成。';
 if(def.id==='b_leap')return '配置至空白鍵，向選定方向躍進，在落地時造成範圍傷害。';
 if(def.id==='r_venom')return '在目標區域留下毒霧，重疊時取最強的毒霧，與箭毒各自計算。';
 if(def.type==='chain')return '立刻放出電弧命中前方目標，再連向附近尚未命中的敵人。';
 if(M.skillCategory(def)==='curse')return '對範圍內敵人施加限時減益，不造成直接傷害；限 1／2／3（左鍵／右鍵／Q） 手動施放。';if(M.skillCategory(def)==='warcry')return '為自己與召喚盟友提供限時增益'+(def.shield?'與個別護盾':'')+'；限 1／2／3（左鍵／右鍵／Q） 手動施放。';if(M.skillCategory(def)==='movement')return '配置至空白鍵取代免費閃避；施放支付技能成本並進入冷卻。';if(def.id==='r_clone')return '召喚一名永久幻影，繼承武器與光環，以獨立魔力和冷卻施放相容的傷害、詛咒及戰吼。普攻沿用本體的配置與攻速。';if(def.type==='trap')return def.trap.mode==='turret'?'在目標處架設持續自動射擊的弩塔；可配置 1／2／3（左鍵／右鍵／Q）。陷阱不觸發裝備命中效果或吸取。':'在目標處放置機關，啟動後由敵人踩踏引爆；未觸發會到時消失。可配置 1／2／3（左鍵／右鍵／Q）。';if(M.skillCategory(def)==='summon')return '在召喚編隊選擇數量，C 依配置重召整支永久軍隊；存活盟友跨區、回營與重新遠征保留，陣亡後需再次召喚。';if(def.type==='aura'){let text='在技能頁點擊光環啟用／關閉；持續支付資源，資源不足時關閉。';if(def.infusion)return text+'主動技能直接命中（含引導與地面技能）附加火、冰傷害與狀態；普攻、召喚物、光環、毒素／持續傷害與裝備觸發不附魔。另強化已開啟火／冰光環的傷害與脈衝頻率。';if(def.damage)text+='脈衝不受攻速／法速影響，元素光環可提高頻率；光環傷害不爆擊、不觸發命中效果；可用50%效率的生命／魔力偷取。';else if(!def.lifeRestorePct&&!def.manaRestorePct&&!def.manaRestore)text+='只提供光環增益，不造成傷害脈衝。';if(def.lifeRestorePct||def.manaRestorePct||def.manaRestore)text+='按目前最大生命／魔力持續回復，固定回魔按標示恢復；不再受回復速度加成放大。';if(def.freezeChance)text+='敵人冰抗影響凍結機率，菁英與首領的控制持續時間縮短。';return text;}if(def.explosionRadius)return def.damageType==='cold'?'冰霜投射物命中後範圍爆發，施加寒冷控制，不會穿透。':'命中後造成範圍爆發，不會穿透。';if(def.chain)return '箭矢命中後會轉向，飛到下一個目標時才造成傷害。';return ({channel:['flame','frost'].includes(def.mode)?(def.damageType==='cold'?'持續引導霜束；法速影響頻率，按標示支付資源，按住施放・放開停止；點技能鈕切換。':'持續引導元素束；法速影響頻率，按住施放・放開停止；點技能鈕切換。'):'持續旋轉攻擊周圍敵人；攻速影響頻率，按住施放・放開停止；點技能鈕切換。',projectile:'朝目標射出投射物。',ground:'在目標區域持續造成傷害。',nova:'對周圍敵人造成範圍傷害。',dash:'朝移動方向突進，沿途造成傷害。',guard:'立即獲得防禦效果。',summon:'召喚盟友協助戰鬥；再次施放會替換同類召喚物。'})[def.type]||def.desc;}
function synergyText(link){if(shortSkillDescriptions)return SkillText.synergySummary(link);const rank=c.talents[link.id]||0,value=rank*link.perRank,label=link.label||'傷害';if(link.effect==='summonChainJumps')return `${label} · 每投入 ${link.threshold||10} 點 +1 跳 · 目前 +${Math.floor(value+1e-8)} 跳`;const absolute=['freezeChance','infusionFreeze','crit','haste','summonReduce','summonSlow','summonFreezeChance','summonBurn','summonChainFalloff'].includes(link.effect),format=v=>absolute?Number((v*100).toFixed(1))+' 百分點':percent(v);return label+' · 每投入 1 點 +'+format(link.perRank)+' · 目前 +'+format(value);}

function summonRuntimeMarkup(id){if(shortSkillDescriptions)return '';const links=(M.summonSupportDetails?.(c,id)||[]).filter(link=>M.skillNode(c.cls,link.id));return links.length?`<section class="summon-runtime-links"><h4>硬點機制支援</h4>${links.map(link=>`<article class="${link.active?'active':''}"><button data-inspect-skill="${link.id}">${esc(link.name)} <span>硬點 ${link.rank}/${M.skillNode(c.cls,link.id)?.max||1}${link.active?' · 生效':' · 未啟動'}</span></button><p>${esc(link.description)}</p>${link.threshold?`<small>啟動門檻 ${link.threshold} 硬點</small>`:''}<div>${(link.targets||[]).map(target=>`<button data-inspect-skill="${target}">${esc(M.ABILITIES[target]?.name||M.skillNode(c.cls,target)?.name||target)}</button>`).join('')}</div></article>`).join('')}<p>上述門檻只計實投硬點；裝備與星典提高一般數值，不解鎖門檻。傷害連攜於DPS訓練場各自記錄來源。</p></section>`:'';}
function summonSupportMarkup(node){const links=M.TREES[c.cls].flat().filter(n=>n.ability&&M.skillCategory(n)==='summon').flatMap(n=>(n.synergies||[]).filter(link=>link.id===node.id).map(link=>({node:n,link})));return (links.length?`<details class="compact-synergies summon-support"><summary>數值連攜 · 支援 ${links.length} 項召喚</summary>${links.map(({node:target,link})=>`<button data-inspect-skill="${target.id}">${esc(target.name)}<span>${SkillText.colorTerms(synergyText(link))}</span></button>`).join('')}</details>`:'')+summonRuntimeMarkup(node.id);}

function renderSkillDetail(node){
 const rank=c.talents[node.id]||0,rule=M.learningState(c,node.id),current=node.ability?M.abilityFor(c,node.ability):null,nextRank=Math.min(node.max,rank+1),next=node.ability?M.previewAbility(c,node.ability,nextRank):null;
 const currentPacket=skillDamagePacket(current),nextPacket=skillDamagePacket(next);
 const currentRows=node.ability?abilityRows(current,e.s,currentPacket):Object.entries(node.mods||{}).map(([key,value])=>[modNames[key]||M.AFFIXES[key]?.label||key,rank?modifierText(key,value*rank):'—']);
 const nextRows=rank<node.max?(node.ability?abilityRows(next,e.s,nextPacket):Object.entries(node.mods||{}).map(([key,value])=>[modNames[key]||M.AFFIXES[key]?.label||key,modifierText(key,value*nextRank)])):[];
 if(node.summonCapacityThreshold){const threshold=node.summonCapacityThreshold;currentRows.push(['召喚容量',`每 ${threshold.every||5} 點 +${threshold.amount||1}，目前 +${Math.min(threshold.max||4,Math.floor(rank/(threshold.every||5))*(threshold.amount||1))}`]);if(rank<node.max)nextRows.push(['召喚容量',`+${Math.min(threshold.max||4,Math.floor(nextRank/(threshold.every||5))*(threshold.amount||1))}`]);}
 if(node.basicAttack){
  const basic=BasicAttacks.effectiveBasicAttack(c,node.basicAttack),previewHero={...c,talents:{...c.talents,[node.id]:nextRank}},nextBasic=BasicAttacks.effectiveBasicAttack(previewHero,node.basicAttack),format=def=>def?Math.round(def.damage*100)+'% 武器普攻':'未學習';
  currentRows.push(['普攻傷害係數',format(basic)],['生效機制',(basic?.masteries||[]).filter(m=>m.active).map(m=>m.label).join('；')||'基礎轉換']);
  if(rank<node.max)nextRows.push(['普攻傷害係數',format(nextBasic)],['生效機制',(nextBasic?.masteries||[]).filter(m=>m.active).map(m=>m.label).join('；')||'基礎轉換']);
 }else if(!node.ability){currentRows.push(['機制',rank?node.desc:'未解鎖']);if(rank<node.max)nextRows.push(['機制',node.desc]);}
 const now=new Map(currentRows),after=new Map(nextRows),keys=[...new Set([...now.keys(),...after.keys()])];const compactKeys=keys.filter(key=>['普攻傷害係數','施放成本','持續成本','每隻成本','啟動成本','持續成本','冷卻','命中傷害','每次傷害','每秒傷害','每次脈衝傷害'].includes(key));
 return `<aside class="d2-detail ${talentSheetOpen?'mobile-detail-open':''}" id="skill-detail"><div class="d2-detail-title">${icon(node.icon)}<div><small>${M.SKILL_CATEGORIES[M.skillCategory(node)].name} · Lv.${node.reqLevel} 解鎖</small><h3>${node.name} ${categoryTag(node)}</h3></div><b>${current?.level??rank}<small> 級</small></b>${modalClose('data-close-talent','關閉技能詳情','sheet-close talent-sheet-close')}</div><button class="gold-btn d2-invest" data-learn="${node.id}" ${rule.ok?'':'disabled'}>${rule.ok?(rank?'提升 · 1 點':'學習 · 1 點'):esc(rule.reason)}</button>
 <div class="skill-effect-meta"><span>技能樹 ${rank}/${node.max}</span>${current?.bonusRank?`<span>裝備 +${current.bonusRank}</span>`:''}${!shortSkillDescriptions&&current?.synergyBonus?`<span title="僅計實際投入點數；傷害協同上限70%，各種效果分別計算">傷害協同 +${Number(((current.type==='aura'&&current.damage?Math.min(.7,current.synergyBonus):current.synergyBonus)*100).toFixed(1))}%</span>`:''}${!rank&&current?'<span>裝備授予</span>':''}</div>
 <div class="skill-copy-bar">${skillCopyToggle()}${skillTypeBadges(current||next)}</div>${shortSkillDescriptions?'':`<table class="skill-effect-table"><thead><tr><th>效果</th><th>目前${!rank&&!current?' · 未學':''}</th>${rank<node.max?'<th>下一級</th>':''}</tr></thead><tbody>${keys.map(key=>`<tr><th scope="row">${SkillText.colorTerms(key)}</th><td>${SkillText.effectMarkup(key,now.get(key)??'—',current,currentPacket?.byType)}</td>${rank<node.max?`<td class="${String(now.get(key))!==String(after.get(key))?'effect-upgrade':''}">${SkillText.effectMarkup(key,after.get(key)??'—',next,nextPacket?.byType)}</td>`:''}</tr>`).join('')}</tbody></table>`}
 ${!shortSkillDescriptions&&node.ability?'<p class="skill-estimate-note">傷害為目前裝備估算，未計敵人減傷與爆擊。</p>':''}
 ${!shortSkillDescriptions&&(current||next)?.masteries?`<div class="skill-mastery-list" aria-label="技能機制成長">${(current||next).masteries.map(m=>`<span class="${rank>=m.rank?'active':''}" title="僅實際投入解鎖；裝備加成不計入">${m.rank}級 · ${esc(m.label)}</span>`).join('')}</div>`:''}
 <p class="d2-description">${skillDescription(current||next,node)}</p>
 ${shortSkillDescriptions&&compactKeys.length?`<table class="skill-effect-table compact-effect-table"><thead><tr><th>效果</th><th>目前</th>${rank<node.max?'<th>下一級</th>':''}</tr></thead><tbody>${compactKeys.map(key=>`<tr><th>${esc(key)}</th><td>${SkillText.effectMarkup(key,now.get(key)??'—',current,currentPacket?.byType)}</td>${rank<node.max?`<td>${SkillText.effectMarkup(key,after.get(key)??'—',next,nextPacket?.byType)}</td>`:''}</tr>`).join('')}</tbody></table>`:''}
 ${node.prevs.length?`<div class="compact-prerequisites">前置：${node.prevs.map(id=>`<button class="${c.talents[id]?'met':''}" data-inspect-skill="${id}">${esc(M.skillNode(c.cls,id).name)} ${c.talents[id]?'✓':'1 級'}</button>`).join(' · ')}</div>`:''}
 ${(node.synergies||[]).length?`<details class="compact-synergies"><summary>硬點協同 · 裝備技能等級不計入</summary>${node.synergies.map(link=>`<button data-inspect-skill="${link.id}">${esc(M.skillNode(c.cls,link.id).name)}<span>${SkillText.colorTerms(synergyText(link))}</span></button>`).join('')}</details>`:''}${summonSupportMarkup(node)}</aside>`;
}

let skillAtlasObserver=null,skillAtlasFrame=0,skillAtlasContext=null,skillAtlasHover=null;
const skillAtlasSelections=new Map();
function disposeSkillAtlas(){skillAtlasObserver?.disconnect();skillAtlasObserver=null;if(skillAtlasFrame)cancelAnimationFrame(skillAtlasFrame);skillAtlasFrame=0;skillAtlasContext=null;skillAtlasHover=null;}
function atlasNodeState(node){const rank=c.talents[node.id]||0,rule=M.learningState(c,node.id),locked=c.level<node.reqLevel||node.prevs.some(id=>!c.talents[id]);return {rank,rule,locked};}
function atlasNodeLabel(node,state=atlasNodeState(node)){return `${node.name}，需求等級 ${node.reqLevel}，已投入 ${state.rank}/${node.max} 點。${state.rule.reason}`;}
function atlasStateMarkup(state){return state.locked?icon('lock'):state.rule.ok?'＋':'';}
function atlasNodeMarkup(node,position,layout){
 const state=atlasNodeState(node),category=M.skillCategory(node),name=M.SKILL_CATEGORIES[category]?.name||'被動',external=layout.external.filter(e=>e.to===node.id).map(e=>M.skillNode(c.cls,e.from)?.name||e.from),classes=['d2-node','atlas-node','atlas-'+position.kind,...(position.core?['atlas-core']:[]),...(node.max===1?['atlas-onepoint']:[]),...(state.rank?['learned']:[]),...(state.locked?['locked']:[]),...(state.rule.ok?['available']:[]),...(node.id===selectedSkillID?['selected']:[])];
 return `<button class="${classes.join(' ')}" data-inspect-skill="${node.id}" data-max-rank="${node.max}" aria-label="${esc(atlasNodeLabel(node,state))}" title="${esc(atlasNodeLabel(node,state))}" aria-pressed="${node.id===selectedSkillID}" style="left:${position.x}%;top:${position.y}%"><span class="atlas-node-mark">${icon(node.icon)}<i class="atlas-state" ${state.locked||state.rule.ok?'':'hidden'} aria-hidden="true">${atlasStateMarkup(state)}</i>${external.length?`<i class="atlas-offpage" title="其他分頁前置：${esc(external.join('、'))}" aria-label="其他分頁前置：${esc(external.join('、'))}">↗</i>`:''}</span><b class="atlas-node-name">${esc(node.name)}</b><span class="atlas-node-meta"><span class="atlas-level">Lv.${node.reqLevel}</span><span class="atlas-category">${name}</span><em class="atlas-rank">${state.rank}<small>/${node.max}</small></em></span></button>`;
}
function updateSkillAtlasHighlight(){
 const ctx=skillAtlasContext;if(!ctx?.canvas.isConnected)return;
 const related=SkillAtlas.skillAtlasRelated(ctx.nodes,skillAtlasHover||selectedSkillID);
 for(const button of ctx.canvas.querySelectorAll('.atlas-node')){const id=button.dataset.inspectSkill;button.classList.toggle('selected',id===selectedSkillID);button.classList.toggle('related',related.has(id));button.setAttribute('aria-pressed',String(id===selectedSkillID));}
 for(const path of ctx.canvas.querySelectorAll('.atlas-edge')){const a=path.dataset.from,b=path.dataset.to,lit=related.has(a)&&related.has(b),learned=(c.talents[a]||0)>0;path.classList.toggle('fulfilled',learned);path.classList.toggle('related',lit);path.setAttribute('marker-end',`url(#atlas-arrow${lit?'-active':learned?'-lit':''})`);}
}
function queueSkillAtlasConnections(){
 if(skillAtlasFrame||!skillAtlasContext?.canvas.isConnected)return;
 skillAtlasFrame=requestAnimationFrame(()=>{
  skillAtlasFrame=0;const ctx=skillAtlasContext;if(panel!=='talents'||!ctx?.canvas.isConnected)return;
  const area=ctx.canvas.getBoundingClientRect();if(!(area.width>0&&area.height>0))return;
  const rects=new Map(),local=r=>({left:r.left-area.left,top:r.top-area.top,right:r.right-area.left,bottom:r.bottom-area.top});
  for(const button of ctx.canvas.querySelectorAll('.atlas-node'))rects.set(button.dataset.inspectSkill,{bounds:local(button.getBoundingClientRect()),icon:local(button.querySelector('.atlas-node-mark').getBoundingClientRect())});
  const svg=ctx.canvas.querySelector('.atlas-connections');svg.setAttribute('viewBox',`0 0 ${area.width} ${area.height}`);
  const routes=SkillAtlas.routeAtlasConnections(ctx.layout,rects,{width:area.width,height:area.height});
  svg.querySelector('.atlas-paths').innerHTML=routes.map(edge=>`<path class="atlas-edge" data-from="${edge.from}" data-to="${edge.to}" d="${edge.d}"/>`).join('');
  ctx.canvas.parentElement.dataset.routesReady='true';updateSkillAtlasHighlight();
 });
}
function wireSkillAtlas(canvas,nodes,layout,key){
 skillAtlasContext={canvas,nodes,layout,key};
 canvas.addEventListener('pointerover',event=>{if(event.pointerType==='touch')return;const button=event.target.closest('.atlas-node');if(!button)return;skillAtlasHover=button.dataset.inspectSkill;updateSkillAtlasHighlight();});
 canvas.addEventListener('pointerleave',()=>{skillAtlasHover=null;updateSkillAtlasHighlight();});
 canvas.addEventListener('focusin',event=>{const button=event.target.closest('.atlas-node');if(button){skillAtlasHover=button.dataset.inspectSkill;updateSkillAtlasHighlight();}});
 canvas.addEventListener('focusout',()=>{skillAtlasHover=null;updateSkillAtlasHighlight();});
 if(typeof ResizeObserver!=='undefined'){skillAtlasObserver=new ResizeObserver(queueSkillAtlasConnections);skillAtlasObserver.observe(canvas);}
 queueSkillAtlasConnections();
}
function refreshSkillAtlasDetail(){
 const node=M.skillNode(c.cls,selectedSkillID),detail=$('#skill-detail');if(!node||!detail)return;
 const body=$('#dialog-body'),scroll=body.scrollTop;detail.outerHTML=renderSkillDetail(node);body.scrollTop=scroll;
}
function inspectSkillAtlas(id){
 if(M.isRingHero(c)){openPanel('talents');ringPanel?.select?.('s:'+id);return;}
 const fromDetail=!!document.activeElement?.closest('#skill-detail'),page=M.TREES[c.cls].findIndex(nodes=>nodes.some(n=>n.id===id));if(page<0)return;
 selectedSkillID=id;talentSheetOpen=true;skillAtlasSelections.set(c.id+':'+page,id);
 if(page!==skillTab||!skillAtlasContext?.canvas.isConnected){skillTab=page;renderTalents();}
 else{skillAtlasHover=null;updateSkillAtlasHighlight();refreshSkillAtlasDetail();}
 if(fromDetail)skillAtlasContext?.canvas.querySelector('.atlas-node.selected')?.focus({preventScroll:true});
 if(matchMedia('(pointer:coarse)').matches&&innerWidth<=1000)$('#skill-detail')?.scrollIntoView({block:'nearest',behavior:'auto'});
}
function refreshSkillAtlas(){
 const ctx=skillAtlasContext;if(panel!=='talents'||!ctx?.canvas.isConnected||ctx.key!==c.id+':'+skillTab){renderTalents();return;}
 const body=$('#dialog-body'),scroll=body.scrollTop,learnFocus=document.activeElement?.dataset.learn;
 renderPanelControls();
 for(const button of ctx.canvas.querySelectorAll('.atlas-node')){const node=M.skillNode(c.cls,button.dataset.inspectSkill),state=atlasNodeState(node);button.classList.toggle('learned',state.rank>0);button.classList.toggle('locked',state.locked);button.classList.toggle('available',state.rule.ok);button.title=atlasNodeLabel(node,state);button.setAttribute('aria-label',button.title);button.querySelector('.atlas-rank').innerHTML=`${state.rank}<small>/${node.max}</small>`;const status=button.querySelector('.atlas-state');status.hidden=!state.locked&&!state.rule.ok;status.innerHTML=atlasStateMarkup(state);}
 refreshSkillAtlasDetail();updateSkillAtlasHighlight();queueSkillAtlasConnections();
 if(learnFocus){const button=$('#skill-detail')?.querySelector('[data-learn]');(button&&!button.disabled?button:ctx.canvas.querySelector('.atlas-node.selected'))?.focus({preventScroll:true});}
 body.scrollTop=scroll;
}
function renderTalents(){
 if(M.isRingHero(c)){renderRingPanel();return;}
 const oldKey=skillAtlasContext?.key,body=$('#dialog-body'),scroll=body.scrollTop,tabFocus=document.activeElement?.dataset.skillTab;
 disposeSkillAtlas();renderPanelControls();
 const cl=M.CLASSES[c.cls];skillTab=Math.max(0,Math.min(2,skillTab));const nodes=M.TREES[c.cls][skillTab].filter(node=>!c.shadowStrikeRetired||node.id!=='a_stab'),key=c.id+':'+skillTab;
 let node=M.skillNode(c.cls,selectedSkillID);if(!node||!nodes.some(n=>n.id===node.id)){node=nodes.find(n=>n.id===skillAtlasSelections.get(key))||nodes[0];selectedSkillID=node.id;}
 skillAtlasSelections.set(key,selectedSkillID);
 const layout=SkillAtlas.skillAtlasLayout(nodes.map(n=>({...n,category:M.skillCategory(n)})),{cls:c.cls,page:skillTab}),byId=new Map(nodes.map(n=>[n.id,n]));
 body.innerHTML=`<div class="d2-tabs" role="tablist" aria-label="技能分頁">${cl.branches.map((name,i)=>`<button role="tab" data-skill-tab="${i}" aria-selected="${i===skillTab}" class="${i===skillTab?'selected':''}">${name}</button>`).join('')}</div>${c.skillRefundNotice?`<p class="skill-refund-notice">技能已按新規則重置，可分配 ${Number(c.skillRefundNotice.points)||0} 點；裝備、天賦與進度保留，請重新配置技能。</p>`:''}<div class="d2-workbench"><section class="d2-tree-pane skill-atlas" data-density="${layout.density}" style="--atlas-height:${layout.height}px"><div class="atlas-canvas" role="group" aria-label="${esc(cl.branches[skillTab])}技能樹"><div class="atlas-backdrop" aria-hidden="true"></div><svg class="atlas-connections" aria-hidden="true" preserveAspectRatio="none"><defs>${[['','#69735c'],['-lit','#bba267'],['-active','#ecd190']].map(([key,color])=>`<marker id="atlas-arrow${key}" viewBox="0 0 6 6" refX="6" refY="3" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0 L6 3 L0 6Z" fill="${color}"/></marker>`).join('')}</defs><g class="atlas-paths"></g></svg><div class="atlas-nodes">${layout.nodes.map(p=>atlasNodeMarkup(byId.get(p.id),p,layout)).join('')}</div></div></section>${renderSkillDetail(node)}</div>`;
 wireSkillAtlas(body.querySelector('.atlas-canvas'),nodes,layout,key);body.scrollTop=oldKey===key?scroll:0;
 if(tabFocus!==undefined)body.querySelector(`[data-skill-tab="${tabFocus}"]`)?.focus({preventScroll:true});
}
window.addEventListener('resize',queueSkillAtlasConnections);
document.fonts?.ready.then(queueSkillAtlasConnections);
let ringPanel=null,ringPanelHero=null;
function disposeRingPanel(){
 ringPanel?.dispose();
 ringPanel=null;
 ringPanelHero=null;
}
function ringSkillDetails(talentId,_node,hero=c){
 const node=M.skillNode(hero.cls,talentId),id=node?.ability;
 if(node?.basicAttack){
  const rank=hero.talents[talentId]||0;
  const basic=rank?M.effectiveBasicAttack(hero,node.basicAttack):M.previewBasicAttack(hero,node.basicAttack,1);
  if(!basic)return null;
  return {detail:['普攻傷害 · '+Math.round(basic.damage*100)+'% 武器普攻'],
   bonusRank:rank?basic.level-basic.hardRank:0,level:basic.level,milestones:basic.masteries};
 }
 if(!id)return null;
 const stats=M.stats(hero);
 const ability=hero.talents[talentId]?M.abilityFor(hero,id):M.previewAbility(hero,id,1);
 if(!ability)return null;
 const family=M.SKILL_CATEGORIES[M.skillCategory(node)]?.name;
 const cost=M.resourceCost(ability,stats);
 const lines=[family,cost.mana||cost.life||cost.rage?costText(cost):''];
 if(ability.type==='aura')lines.push('維持 '+costText(auraCostFor(ability,stats))+'／秒');
 else if(ability.summon)lines.push('同類上限 '+ability.summon.count+' · 每隻容量 '+(ability.summon.capacityCost??1));
 else if(ability.cooldown>0)lines.push('冷卻 '+actualCooldown(ability,stats).toFixed(1)+' 秒');
 const keys=new Set(['裝備條件','命中傷害','直擊傷害','濺射傷害','每秒傷害','每次傷害','每次脈衝傷害','傷害屬性','作用半徑','爆炸半徑','投射物','連鎖目標','連鎖距離','引導長度','引導寬度','敵人冰抗降低','支援效果','中毒','毒霧半徑','持續時間']);
 for(const [key,value] of abilityRows(ability,stats))if(keys.has(key))lines.push(key+' · '+value);
 return {detail:lines.filter(Boolean),bonusRank:hero.talents[talentId]?ability.level-ability.hardRank:0,
  level:ability.level,milestones:ability.masteries};
}
function renderRingPanel(){
 const total=M.ringBudget(c),points=M.ringPoints(c),budget={total,points,spent:total-points};
 const resetInfo=respecInfo(total-points);
 const body=$('#dialog-body');
 if(ringPanel&&ringPanelHero===c.id&&body.querySelector('[data-ring-panel-host]')){
  ringPanel.update({hero:c,budget,...resetInfo});
  return;
 }
 disposeSkillAtlas();
 disposeRingPanel();
 body.innerHTML='<div data-ring-panel-host></div>';
 ringPanelHero=c.id;
 ringPanel=mountRingTree(body.firstElementChild,{
  tree:M.RING_TREE,hero:c,budget,...resetInfo,
  toolbarAnchor:document.body.classList.contains('mobile-phone')?$('#dialog-close'):null,
  draftAnchor:body,
  stateFor:(id,hero=c)=>M.ringNodeState(hero,id),skillDetails:ringSkillDetails,
  stage:(hero,id)=>M.allocateRing(hero,id),
  invest:ids=>progressionCommit(hero=>{
   for(const id of ids){
    const result=M.allocateRing(hero,id);
    if(!result.ok)return result;
   }
   return {ok:true};
  },`已投入 ${ids.length} 點。`),
  reset:useTalentReset
 });
}
function respecInfo(spent){
 const {canUse,useReason,count,cost}=M.respecStonePreview(state,c.id,e.mode);
 return {canReset:canUse,resetHint:canUse
  ?`持有 ${count} 顆 · 消耗 1 顆，退回 ${spent} 點天賦。受影響的副手會收回背包。`
  :useReason+(!count?` 通過${M.DIFFICULTIES[1].name}第二章後，可用 ${cost} 枚${M.DIFFICULTIES[1].name}印記向營地收藏家兌換。`:'')};
}
function useTalentReset(){
 return progressionCommit((hero,profile)=>M.useRespecStone(profile,hero.id,e.mode),'返脈石已使用，天賦點已退回。');
}
function showLegacyTalentReset(){
 if(panel!=='passives')return;
 $('#dialog-body .legacy-respec')?.remove();
 const {canReset,resetHint}=respecInfo(Object.keys(c.passives||{}).length);
 $('#dialog-body').insertAdjacentHTML('afterbegin',`<section class="legacy-respec"><p>${esc(resetHint)}</p><div><button type="button" class="text-btn" data-passive-reset-cancel>取消</button><button type="button" class="gold-btn" data-passive-reset-confirm ${canReset?'':'disabled'}>消耗 1 顆返脈石</button></div></section>`);
}
async function convertRingCharacter(){
 if(e.mode!=='camp'||state.rifts?.activeRun||M.isRingHero(c))return;
 if(!window.confirm('轉入燼脈圖後，技能與天賦點會合併並退回。需要雙持天賦的副手武器會收起。確定轉入？'))return;
 const converted=await progressionCommit(M.convertToRing,'角色已轉入燼脈圖。');
 if(converted)openPanel('talents');
}
function useFlaskSlot(index){
 const used=e.useFlask(index);
 if(!used&&e.flaskError)gameNotices.notice(e.flaskError);
 updateHUD();
}
function combatAction(action){if(dialog.open||e.paused||e.transition||document.hidden||!state.active||e.mode==='camp'&&(paidBusy||state.rifts?.activeRun&&!paidLockOwned))return false;if(['summon','auras'].includes(action)?!['camp','playing'].includes(e.mode):e.mode!=='playing')return false;updatePointerAim();const used=action==='summon'?e.summonArmy():action==='auras'?e.toggleAuras():e.dodge();if(!used&&e.skillError)gameNotices.notice(e.skillError);if(!used||action==='dash')updateHUD();return used;}
function configureSummonCount(id,count){const plan=M.summonPlan(c),def=M.abilityFor(c,id),row=plan.rows.find(r=>r.id===id)||summonDraftRow(def);if(count>row.count){const reason=summonIncrementReason(plan,row);if(reason){toast(reason+'。');return false;}}return commitSkillConfig(hero=>M.setSummonCount(hero,id,count),'召喚編隊已儲存 · 按 C 重召。');}
function castSlot(index,hold=false,quiet=false){if(dialog.open||pwaOverlayOpen||e.paused||e.transition||document.hidden||!state.active||e.mode!=='playing')return false;updatePointerAim();const used=e.cast(index);if(used&&e.channel?.id===M.skillLoadout(c)[index]&&e.ability(e.channel.id)?.type==='charge'&&!hold)e.channel.source='tap';if(!quiet&&!used&&e.skillError)gameNotices.notice(e.skillError);if(used||!quiet)updateHUD();return used;}
document.addEventListener('click',async ev=>{let b=ev.target.closest('button');if(!b)return;let d=b.dataset;if(d.achievementScope){achievementScope=d.achievementScope;renderAchievements();return;}if(d.achievementFilter){achievementFilter=d.achievementFilter;renderAchievements();return;}if('claimAllAchievements'in d){
 if(panel!=='achievements')return;
 progressionCommit((hero,profile)=>M.claimAchievements(profile,hero.id,scopedAchievements(hero).filter(item=>item.claimable).map(item=>item.id)),result=>`已領取 ${result.count} 項成就獎勵。`,false);
 return;
 }if(d.claimAchievement){progressionCommit((hero,profile)=>M.claimAchievement(profile,hero.id,d.claimAchievement),'成就獎勵已領取。',false);return;}if(d.passiveBranch){const owned=Object.keys(c.passives||{}).filter(id=>M.PASSIVE_NODES[id]?.branch===d.passiveBranch).sort((a,b)=>Math.hypot(M.PASSIVE_NODES[b].x,M.PASSIVE_NODES[b].y)-Math.hypot(M.PASSIVE_NODES[a].x,M.PASSIVE_NODES[a].y));jumpPassiveNode(owned.find(id=>M.PASSIVE_NODES[id].path)||d.passiveBranch+'_l4');return;}if(d.passiveFilter){passiveFilter=d.passiveFilter;filterPassives();return;}if(d.passiveNode){passiveSelection=d.passiveNode;$$('.passive-node').forEach(node=>{const selected=node.dataset.passiveNode===passiveSelection;node.classList.toggle('selected',selected);node.setAttribute('aria-pressed',String(selected));});renderPassiveDetail();return;}if(d.passiveInvest){progressionCommit(hero=>M.allocatePassive(hero,d.passiveInvest),'天賦已生效。');return;}if('passiveReset'in d){showLegacyTalentReset();return;}if('passiveResetCancel'in d){b.closest('.legacy-respec')?.remove();return;}if('passiveResetConfirm'in d&&panel==='passives'){if(await useTalentReset())b.closest('.legacy-respec')?.remove();return;}if('closePassive'in d){passiveSelection=null;renderPassiveDetail();return;}if(d.passiveView){if(d.passiveView==='fit')centerPassiveView(true);else if(d.passiveView==='center')centerPassiveView(false);else zoomPassiveView(d.passiveView==='zoom-in'?1.2:1/1.2);return;}if(d.mapTab){mapTab=d.mapTab;renderQuests();return;}if(d.chapter){selectedChapter=Number(d.chapter);renderQuests();return;}if(d.riftOption){riftDraft[d.riftOption]=['challenge','guardian'].includes(d.riftOption)?Number(d.value):d.value;renderQuests();return;}if(d.riftClaim){claimRiftReward(d.riftClaim);return;}if(d.riftCraft){craftRift(d.riftCraft);return;}if(d.riftEnter){enterPaid(d.riftEnter);return;}if('riftSettle'in d){if(e.mode==='camp')void settleStoredPaidRun({wait:true});else if(e.mode==='victory')void finishPaid('won');return;}if(d.routePreview){selectRouteNode(d.routePreview);return;}if(d.routeChoose){chooseRouteRoom(d.routeChoose);return;}if('routeStart'in d){if(start())closePanel();return;}if(d.forgeTab&&panel==='forge'){forgeTab=d.forgeTab;workshopTab=forgeTab==='craft'?'craft':'sockets';craftSelection=null;renderForge();return;}if(d.setsView&&panel==='sets'){setsView=d.setsView;renderSets();return;}if(d.guideTopic&&panel==='guide'&&Object.hasOwn(CAMP_GUIDE,d.guideTopic)){guideTopic=d.guideTopic;renderGuide();return;}if('redeemRespec'in d&&panel==='sets'){await progressionCommit((hero,profile)=>M.redeemRespecStone(profile,hero.id,e.mode),'已取得 1 顆返脈石。',false);return;}if(d.trainingAction){trainingAction(d.trainingAction);return;}if(d.summonStep){configureSummonCount(d.summonStep,Number(d.count));return;}if(d.socketPick!==undefined){craftSelection={socketIndex:Number(d.socketPick)};refreshSelection();return;}if(d.gearView==='rolls'||d.gearView==='facts'){gearInspectorView=d.gearView;refreshSelection();$('#inventory-selection').scrollTop=0;if(dialog.classList.contains('inventory-detail-focus'))$('#dialog-body').scrollTop=0;$(`[data-gear-view="${d.gearView}"]`)?.focus({preventScroll:true});return;}if(d.weaponTarget){weaponTarget=d.weaponTarget;refreshSelection();$(`[data-weapon-target="${d.weaponTarget}"]`)?.focus({preventScroll:true});return;}if(d.ringTarget){ringTarget=d.ringTarget;refreshSelection();$(`[data-ring-target="${d.ringTarget}"]`)?.focus({preventScroll:true});return;}if(d.workshopAction){workshopAction=d.workshopAction;craftSelection=null;refreshSelection();return;}if(d.craftGem){craftSelection={gemKey:d.craftGem,tier:Number(d.gemTier),socketIndex:Number(d.socketIndex)};refreshSelection();return;}if(d.craftCommit){commitCraft(d.craftCommit);return;}if(d.combineGem){commitGemCombine(d.combineGem,Number(d.gemTier));return;}if('closeTalent'in d){talentSheetOpen=false;$('#skill-detail').classList.remove('mobile-detail-open');return;}if(d.inventoryPage){selectInventoryPage(d.inventoryPage);return;}if(d.inventoryTab){inventoryDiscardBatch=null;inventoryTab=d.inventoryTab;inventorySelection=null;renderInventory();return;}if(d.flaskBatch){flaskBatchAction(d.flaskBatch);return;}if(d.flaskSelect){if(e.mode!=='camp')return;flaskSelection=d.flaskSelect;renderFlasks();$('.flask-selected-sheet')?.scrollIntoView({block:'start'});$('[data-close-flask]')?.focus({preventScroll:true});return;}if(d.flaskTarget!==undefined){flaskTarget=Number(d.flaskTarget);renderFlasks();return;}if(d.flaskAction){flaskAction(d.flaskAction,d.flaskItem);return;}if('closeFlask'in d){const id=flaskSelection;flaskSelection=null;renderFlasks();$$('[data-flask-select]').find(button=>button.dataset.flaskSelect===id)?.focus();return;}if(d.inventoryItem){if(Date.now()>inventoryClickUntil){if(ev.shiftKey&&fineInventoryPointer()&&panel==='stash'&&e.mode==='camp'){if(['bag','flask-bag'].includes(d.inventoryFrom)){moveStash('deposit',d.inventoryItem);return;}if(['stash','flask-stash'].includes(d.inventoryFrom)){moveStash('withdraw',d.inventoryItem);return;}}if(ev.pointerType==='touch'||ev.sourceCapabilities?.firesTouchEvents){clearTimeout(itemTooltipTimer);const id=d.inventoryItem,from=d.inventoryFrom;itemTooltipTimer=setTimeout(()=>{if(dialog.open&&['inventory','stash','forge','merchant'].includes(panel))selectInventoryItem(id,from);},360);}else selectInventoryItem(d.inventoryItem,d.inventoryFrom);}return;}if('clearSelection'in d){closeInventoryInspector(250,true);return;}if('inventorySort'in d){inventoryAction('sort');return;}if(d.inventoryAction){inventoryAction(d.inventoryAction);return;}if(d.skillTab!==undefined){skillTab=Number(d.skillTab);selectedSkillID=null;talentSheetOpen=false;renderTalents();return;}if(d.inspectSkill){inspectSkillAtlas(d.inspectSkill);return;}if(d.panel){openPanel(d.panel);return;}if(d.deposit){moveStash('deposit',d.deposit);return;}if(d.withdraw){moveStash('withdraw',d.withdraw);return;}if(d.flask!==undefined){useFlaskSlot(Number(d.flask));return;}if(d.hero){activateHero(d.hero);return;}if('createScreen'in d){renderCreateCharacter();return;}if(d.draftWeapon){draftWeapon=d.draftWeapon;$$('[data-draft-weapon]').forEach(el=>{const selected=el.dataset.draftWeapon===draftWeapon;el.classList.toggle('selected',selected);el.setAttribute('aria-pressed',String(selected));});return;}if('ringConvert' in d){convertRingCharacter();return;}if('rosterBack'in d){if(Object.keys(state.characters).length)openPanel('characters');else closePanel();return;}if(d.renameScreen){renderRenameCharacter(d.renameScreen);return;}if(d.deleteScreen){renderDeleteCharacter(d.deleteScreen);return;}if('returnCamp'in d){if(!await returnToCamp())return;save();renderCharacters();return;}if(d.learn){changeBuild('learn',d.learn);return;}if('refund'in d){changeBuild('refund');return;}if(d.difficulty){if(panel!=='quests'||e.mode!=='camp'||state.rifts?.activeRun)return;if(!M.setDifficulty(c,Number(d.difficulty))){toast('需先通關上一難度的所有章節。');return;}if(!M.canChapter(c,c.difficulty,selectedChapter))selectedChapter=1;save();updateMode();renderQuests();return;}if(d.result){if(d.result==='settle'){finishPaid('won');return;}if(d.result==='next-chapter'){const next=nextCampaignChapter();if(next)start(next.id);return;}if(d.result==='retry')start();else{if(!await returnToCamp())return;save(true);}return;}if(d.action){if(/^skill[0-2]$/.test(d.action))castSlot(Number(d.action.slice(-1)));if(['dash','summon'].includes(d.action))combatAction(d.action);return;}if('export'in d){await save(true);const {blob,filename}=await encodeProfileBackup(state);downloadSaveFile(blob,filename);return;}if('import'in d){if(e.mode==='playing'){toast('請先結束遠征，再匯入存檔。');return;}$('#import-file').click();}});
const composingBagSearches=new WeakSet();
$('#dialog-body').addEventListener('compositionstart',event=>{
 if(event.target.id==='bag-search')composingBagSearches.add(event.target);
});
$('#dialog-body').addEventListener('compositionend',event=>{
 if(event.target.id!=='bag-search')return;
 composingBagSearches.delete(event.target);
 updateBagSearch(event.target);
});
$('#dialog-body').addEventListener('input',event=>{
 if(event.target.id!=='bag-search'||event.isComposing||composingBagSearches.has(event.target))return;
 updateBagSearch(event.target);
});
$('#dialog-body').addEventListener('input',ev=>{
 if(panel!=='forge'||!ev.target.matches('[data-enhancement-stones]'))return;
 enhancementStones=Math.max(1,Math.min(20,Math.floor(Number(ev.target.value)||1)));
 const selected=inventorySelection,item=selected&&inventoryItem(selected.id,selected.from);
 if(!item)return;
 const target=selected.from==='equipped'?Object.keys(c.equipment).find(slot=>c.equipment[slot]?.id===item.id):item.id;
 const preview=M.enhancementPreview(state,c,target,enhancementStones);
 const live=$('.enhancement-live');
 if(live)live.innerHTML=enhancementLiveMarkup(item,preview,preview.reason,false);
});
$('#dialog-body').addEventListener('click',async ev=>{
 const button=ev.target.closest('button');if(panel!=='loadout'||!button||button.disabled||storageTransactions)return;const d=button.dataset;
 if(d.configTarget!==undefined){loadoutTarget=loadoutTarget===d.configTarget?null:d.configTarget;renderLoadout();return;}
 if(d.assignSkill!==undefined){await assignConfiguredSkill(d.assignSkill||null,'active');return;}
 if(d.assignBasic!==undefined){await assignConfiguredSkill(d.assignBasic||null,'basic');return;}
 if(d.toggleAura){await toggleConfiguredAura(d.toggleAura);return;}
 if(d.viewSkill){openCatalogSkill(d.viewSkill);return;}
});
$('#dialog-body').addEventListener('change',async ev=>{if(ev.target.matches('[data-enhancement-stones]')){enhancementStones=Math.max(1,Math.min(20,Math.floor(Number(ev.target.value)||1)));ev.target.value=String(enhancementStones);return;}if(ev.target.matches('[data-pickup-color]')){configurePickupFilter(ev.target);return;}if(ev.target.matches('[data-valuable-consent]')){valuableConsentID=ev.target.checked?inventorySelection?.id:null;refreshSelection();return;}if(ev.target.matches('[data-include-valuable]')){includeValuable=ev.target.checked;renderMerchant();return;}if(ev.target.matches('[data-set-option]')){configureSetChoice(ev.target.dataset.setOption,ev.target.value||null);return;}if(ev.target.matches('[data-auto-enabled]')){configureAutoEnabled(ev.target.checked);return;}if(ev.target.matches('[data-sell-rarity]')){const colours=$$('[data-sell-rarity]:checked').map(el=>Number(el.dataset.sellRarity));if(!await commitInventory(hero=>M.setSellRarities(hero,colours),''))renderMerchant();return;}if(ev.target.id==='bag-filter'){bagFilter=ev.target.value;inventorySelection=null;lastInventoryTap=null;renderInventory();}});
$('#start').addEventListener('click',()=>openPanel(state.active?'quests':'characters'));$('#camp-interact').addEventListener('click',interactCamp);$('#dialog-close').addEventListener('click',closePanel);dialog.addEventListener('close',()=>{if(dialog.open)return;if(catalogDialog.open)catalogDialog.close();leaveConnectedPanel();disposeSkillAtlas();disposeRingPanel();hideItemTooltip();clearInventoryDrag();lastInventoryTap=null;panel=null;updatePause();});dialog.addEventListener('click',ev=>{if(ev.target===dialog){let r=dialog.getBoundingClientRect();if(ev.clientX<r.left||ev.clientX>r.right||ev.clientY<r.top||ev.clientY>r.bottom)closePanel();}});
$('#pause').addEventListener('click',()=>{if(e.mode==='playing'&&!paidBusy&&!returningToCamp){manualPause=!manualPause;keys.clear();if(panel==='settings')closePanel();updatePause();}});$('#resume').addEventListener('click',()=>{if(e.mode==='playing'&&!paidBusy&&!returningToCamp){manualPause=false;updatePause();}});$('#abandon').addEventListener('click',async()=>{if(e.mode==='playing'&&await returnToCamp())void save();});$('#fullscreen').addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else if(document.documentElement.requestFullscreen)await document.documentElement.requestFullscreen();else toast('此瀏覽器不支援全螢幕，建議橫向操作。');}catch{toast('無法啟用全螢幕，可使用瀏覽器的全螢幕功能。');}});
async function importBackupFile(file){
 try{
  if(state.rifts?.activeRun){toast('先結算裂隙，再匯入另一份存檔。');return false;}
  const raw=await decodeProfileBackup(file),parsed=JSON.parse(raw);
  const restored=parsed?.version===state.version&&parsed.characters?M.importSave(raw):null;
  if(!restored){
   if(localQaOrigin&&Object.hasOwn(parsed?.characters??{},'hero-00000000-0000-4000-8000-000000000120')){
    pendingQaBackup=file;
    openPanel('settings');
   }else toast('這份存檔與目前版本的資料規則不相容。既有角色進度已保留。');
   return false;
  }
  if(!await returnToCamp())return false;
  await restorePersonalProfile(restored);
  pendingQaBackup=null;
  renderPanel();
  toast('存檔已匯入。');
  return true;
 }catch(error){
  toast(['BACKUP_TOO_LARGE','UNSUPPORTED_CODEC'].includes(error.code)?error.message:'無法匯入存檔，請確認檔案及儲存空間。既有角色進度已保留。');
  return false;
 }
}
$('#import-file').addEventListener('change',async ev=>{
 const input=ev.target,file=input.files[0];
 if(!file)return;
 try{await importBackupFile(file);}finally{input.value='';}
});
function handoffQaBackup(button){
 const file=pendingQaBackup;
 if(!localQaOrigin||!file)return;
 const token=crypto.randomUUID(),target=window.open(localQaOrigin+'/?restore='+token,'_blank');
 if(!target){toast('瀏覽器擋住了新分頁。請開啟測試版後選擇匯入。');return;}
 button.disabled=true;
 const finish=()=>{
  clearTimeout(timer);
  window.removeEventListener('message',receive);
  button.disabled=false;
 };
 const receive=event=>{
  if(event.origin!==localQaOrigin||event.source!==target||event.data?.token!==token)return;
  if(event.data.type==='emberfall:qa-ready')target.postMessage({type:'emberfall:qa-backup',token,file},localQaOrigin);
  else if(event.data.type==='emberfall:qa-result'){
   finish();
   if(event.data.ok){if(pendingQaBackup===file)pendingQaBackup=null;if(panel==='settings')renderSettings();toast('已在全滿測試版匯入。');}
   else toast('測試版未能匯入這份檔案。請查看測試版的提示。');
  }
 };
 const timer=setTimeout(()=>{finish();toast('測試版未回應。可直接開啟測試版再匯入。');},20000);
 window.addEventListener('message',receive);
}
$('#dialog-body').addEventListener('click',event=>{
 const button=event.target.closest('[data-qa-import]');
 if(button)handoffQaBackup(button);
});
function combatInputEnabled(){return storageReady&&!!state.active&&!dialog.open&&!pwaOverlayOpen&&!e.paused&&!e.transition&&!document.hidden&&e.mode==='playing'&&!e.training?.finished&&!document.activeElement?.closest('input,select,textarea,[contenteditable]');}
combatInput=new CombatInput({
 enabled:combatInputEnabled,cast:castSlot,
 repeatable:index=>{const id=M.skillLoadout(c)[index],def=id&&e.ability(id);return !!def&&!['channel','charge'].includes(def.type)&&!e.gameplay.assassin.combo&&(e.skillCooldowns[id]||0)<=0;},
 release:(index,cancel)=>{const ch=e.channel;if(ch?.source!=='manual'||ch.id!==M.skillLoadout(c)[index])return;if(!cancel&&e.ability(ch.id)?.type==='charge')e.releaseCharge?.();else e.channel=null;}
});
sceneInput=new SceneInteraction(e,name=>{if(name==='quests'){if(e.mode!=='camp'){openRoute();return;}mapTab='campaign';}openPanel(name);});
function worldInputEnabled(){return storageReady&&!!state.active&&!dialog.open&&!pwaOverlayOpen&&!mobileBlocked&&!e.paused&&!e.transition&&!document.hidden&&['camp','playing'].includes(e.mode);}
movementInput=new CursorMovement({enabled:()=>worldInputEnabled()&&!stationaryCast&&Math.hypot(joy.x,joy.y)<.1&&!['w','a','s','d','arrowup','arrowleft','arrowdown','arrowright'].some(k=>keys.has(k)),worldPoint:(x,y)=>renderer.worldPoint(x,y),move:(x,y)=>e.setMoveTarget(x,y),cancel:()=>e.cancelMoveTarget()});
const gameKeys=['b','k','t','p','o','l','e','w','a','s','d','arrowup','arrowleft','arrowdown','arrowright','j','q','c',DODGE_KEY,...ACTIVE_SKILL_KEYS,...FLASK_KEYS];
window.addEventListener('keydown',ev=>{
 if(catalogDialog.open)return;
 const k=ev.key.toLowerCase(),shortcut=navigationPanel(ev),navigation=M.isRingHero(c)&&shortcut==='passives'?'talents':shortcut;
 if(navigation&&storageReady&&!pwaOverlayOpen&&!mobileBlocked&&!document.hidden){ev.preventDefault();if(ev.repeat||storageTransactions)return;release();if(panel===navigation)closePanel();else openPanel(navigation);return;}
 if(ev.isComposing||dialog.open||pwaOverlayOpen||ev.ctrlKey||ev.altKey||ev.metaKey||ev.target.closest?.('input,select,textarea,[contenteditable]'))return;
 if(gameKeys.includes(k)&&['camp','playing'].includes(e.mode))ev.preventDefault();
 if(k==='escape'&&e.mode==='playing'){if(ev.repeat||paidBusy||returningToCamp)return;manualPause=!manualPause;keys.clear();updatePause();return;}
 if(e.paused||e.transition||document.hidden)return;keys.add(k);if(ev.repeat)return;
 if(k==='e'){sceneInput.interactNearest();return;}
 if(k==='c'){combatAction('summon');return;}if(e.mode==='camp')return;
 if(k==='j'){configureAutoEnabled(c.autoEnabled===false);return;}
 const skillSlot=manualSkillSlot(k);if(skillSlot>=0){combatInput.press('key:'+k,skillSlot);return;}
 if(k===DODGE_KEY){combatAction('dash');return;}
 const flaskSlot=flaskKeySlot(k);if(flaskSlot>=0)useFlaskSlot(flaskSlot);
});
window.addEventListener('keyup',ev=>{const k=ev.key.toLowerCase();keys.delete(k);combatInput.release('key:'+k);});
function release(){worldTouch=null;keys.clear();combatInput.clear();stationaryCast=false;movementInput?.clear();sceneInput?.clear();pointerClient=null;e.pointerTarget=null;joy={x:0,y:0};e.cancelMoveTarget();$('#stick').style.transform='';$('#touch-attack').classList.remove('pressed');}
window.addEventListener('blur',()=>{release();if(e.mode==='playing'){manualPause=true;updatePause();}});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&storageReady)void save(true);if(document.hidden&&e.mode==='playing'){manualPause=true;release();}updatePause();});
let worldPointerType='mouse',worldTouch=null;
function rememberPointer(event){if(event.pointerType==='mouse'){pointerClient={x:event.clientX,y:event.clientY};$('#world').style.cursor=worldInputEnabled()&&sceneTargetAt(e,renderer.worldPoint(event.clientX,event.clientY))?'pointer':'';}else{pointerClient=null;e.pointerTarget=null;}}
$('#world').addEventListener('pointerdown',event=>{
 worldPointerType=event.pointerType;rememberPointer(event);
 if(event.pointerType==='touch'&&worldInputEnabled())worldTouch={id:event.pointerId,x:event.clientX,y:event.clientY};
});
$('#world').addEventListener('pointerup',event=>{
 if(worldTouch?.id!==event.pointerId)return;
 const touch=worldTouch;worldTouch=null;
 if(!worldInputEnabled()||Math.hypot(event.clientX-touch.x,event.clientY-touch.y)>14)return;
 if(sceneInput.click(renderer.worldPoint(event.clientX,event.clientY)))event.preventDefault();
});
$('#world').addEventListener('pointermove',rememberPointer);
$('#world').addEventListener('pointerleave',()=>{pointerClient=null;e.pointerTarget=null;});
document.addEventListener('pointerdown',event=>{if(event.pointerType!=='mouse'){pointerClient=null;e.pointerTarget=null;}},true);
function updatePointerAim(){if(!pointerClient||!combatInputEnabled()){e.pointerTarget=null;return;}e.pointerTarget={...renderer.worldPoint(pointerClient.x,pointerClient.y),pointerType:'mouse',at:e.now(),stationary:stationaryCast};}
$('#world').addEventListener('pointercancel',()=>{worldTouch=null;stationaryCast=false;combatInput.clear();movementInput.clear();sceneInput.clear();});
$('#world').addEventListener('mousedown',event=>{
 if(worldPointerType==='touch'||event.sourceCapabilities?.firesTouchEvents||event.defaultPrevented||event.ctrlKey||event.altKey||event.metaKey||!state.active||dialog.open||pwaOverlayOpen||e.paused||e.transition||document.hidden)return;
 const target=renderer.worldPoint(event.clientX,event.clientY);
 const action=event.button===0?leftClickAction(e,target,!!M.skillLoadout(c)[0],event.shiftKey):null;
 if(action?.kind==='interact'){event.preventDefault();combatInput.clear();movementInput.clear();sceneInput.click(target);return;}
 const castLeft=action?.kind==='cast';
 if(event.button===1||event.button===0&&!castLeft){
  event.preventDefault();combatInput.clear();sceneInput.clear();movementInput.press(event.button,event.clientX,event.clientY);return;
 }
 if(e.mode!=='playing'||![0,2].includes(event.button))return;
 event.preventDefault();movementInput.clear();sceneInput.clear();
 if(action?.stationary){
  stationaryCast=true;pointerClient={x:event.clientX,y:event.clientY};e.input.x=e.input.y=0;
 }
 combatInput.press('mouse:'+event.button,event.button===0?0:1);
});
function releaseMouse(button){
 combatInput.release('mouse:'+button);
 if(button===0&&stationaryCast){stationaryCast=false;updatePointerAim();}
}
window.addEventListener('mousemove',event=>{movementInput.movePointer(event.clientX,event.clientY,event.buttons);if(!(event.buttons&1))releaseMouse(0);if(!(event.buttons&2))releaseMouse(2);});
window.addEventListener('mouseup',event=>{releaseMouse(event.button);movementInput.release(event.button);});
let joyPointer=null;const joystick=$('#joystick');function moveJoystick(ev){if(ev.pointerId!==joyPointer)return;let r=joystick.getBoundingClientRect(),x=ev.clientX-r.left-r.width/2,y=ev.clientY-r.top-r.height/2,n=Math.hypot(x,y),limit=r.width*.32;if(n>limit){x=x/n*limit;y=y/n*limit;}joy={x:x/limit,y:y/limit};$('#stick').style.transform=`translate(${x}px,${y}px)`;}
joystick.addEventListener('pointerdown',ev=>{ev.preventDefault();joyPointer=ev.pointerId;joystick.setPointerCapture(ev.pointerId);moveJoystick(ev);});joystick.addEventListener('pointermove',moveJoystick);for(let type of ['pointerup','pointercancel','lostpointercapture'])joystick.addEventListener(type,ev=>{if(ev.pointerId===joyPointer){joyPointer=null;joy={x:0,y:0};$('#stick').style.transform='';}});
const attack=$('#touch-attack');attack.addEventListener('click',()=>configureAutoEnabled(c.autoEnabled===false));
installMobileControls({onBlocked(value){mobileBlocked=value;updatePause();},clearInput:()=>{release();clearInventoryDrag();}});
function loop(now){
 if(!storageReady){lastFrame=now;requestAnimationFrame(loop);return;}
 const dt=Math.min(.05,(now-lastFrame)/1000);lastFrame=now;
 e.input.x=stationaryCast?0:joy.x+(keys.has('d')||keys.has('arrowright')?1:0)-(keys.has('a')||keys.has('arrowleft')?1:0);
 e.input.y=stationaryCast?0:joy.y+(keys.has('s')||keys.has('arrowdown')?1:0)-(keys.has('w')||keys.has('arrowup')?1:0);
 e.input.attack=false;
 movementInput.update(dt);updatePointerAim();e.update(dt);sceneInput.update();combatInput.update(dt);
 updateGameAudio();renderer.draw();updateTravel();updateCampPrompt();
 if(flushCombatUI())lastUI=now;
 if(now-lastUI>120){updateHUD();lastUI=now;}
 requestAnimationFrame(loop);
}
async function bootStorage(){
 try{
  profileStore=await openProfileStore();state=profileStore.profile;c=state.characters[state.active]??M.newCharacter('warrior','尚未建立角色');e.c=c;
  const staleCampaign=clearCampaignCheckpoints(state);
  await refreshRecoveryBackups();storageReady=true;e.camp(true);
  const settlement=state.rifts?.activeRun||staleCampaign?await settleStoredPaidRun():null;
  if(!state.rifts?.activeRun&&restoreLegacyEquipment(state.characters[state.active]))void save(true);
  document.body.classList.remove('storage-loading');$('#storage-loader').hidden=true;updateMode();updateCharacter(false);updateHUD();
  if(verifiedEntry){if(panel!=='verified')openPanel('verified');}
  else if(!state.active)openPanel(recoveryBackups.length?'settings':'characters');
  if(settlement==='locked'&&state.rifts?.activeRun)void settleStoredPaidRun({wait:true});
  if(profileStore.info.resetIncompatible)toast('原始存檔已保留。可在設定下載備份或匯入。');else if(profileStore.info.migrated)toast('角色已搬移至壓縮存檔，舊儲存空間已釋放。');
 }catch(error){storageOK=false;$('#storage-loader').innerHTML='<span>'+(error.code==='RECOVERY_BACKUP_FAILED'?'原始存檔已保留。請釋放瀏覽器儲存空間後重試。':'無法讀取本機存檔')+'</span><button type="button" data-storage-retry>重新載入</button>';}
}
void bootStorage();requestAnimationFrame(loop);
async function finishVerifiedSignIn(){
 if(!verifiedEntry)return;
 try{
  await cloud.completeLogin();
 }catch{toast('登入未完成，請重新使用 Google 登入。');}
 if(panel!=='verified')openPanel('verified');
}
void finishVerifiedSignIn();
document.addEventListener('click',event=>{if(event.target.closest('[data-storage-retry]'))location.reload();if(storageTransactions&&event.target.closest('#panel-dialog')){event.preventDefault();event.stopImmediatePropagation();}},true);





document.addEventListener('submit',async ev=>{
 if(storageTransactions){ev.preventDefault();return;}
 if(ev.target.id==='create-character-form'){ev.preventDefault();if(e.mode==='playing')return;const form=new FormData(ev.target),weapon=draftWeapon;if(!await returnToCamp())return;const candidate=profileCandidate(),result=M.createCharacter(candidate,form.get('heroName'),'wanderer',weapon,form.get('gender'));if(!result.ok){$('#character-form-error').textContent=result.error;return;}try{prepareCandidate(candidate);await persistProfile(candidate);}catch(error){const message=/另一個視窗/.test(error?.message||'')?'無法儲存：另一個遊戲視窗已有較新進度，請重新整理後再建立角色。':'無法儲存新角色，原有角色已保留。請在設定匯出備份後再試。';const box=$('#character-form-error');if(box)box.textContent=message;else toast(message);return;}state=candidate;activateHero(result.character.id);}
 if(ev.target.id==='delete-character-form'){ev.preventDefault();commitCharacterDeletion(ev.target);return;}
 if(ev.target.id==='rename-character-form'){ev.preventDefault();if(e.mode==='playing')return;const candidate=profileCandidate(),result=M.renameCharacter(candidate,ev.target.dataset.id,$('#rename-hero-name').value);if(!result.ok){$('#character-form-error').textContent=result.error;return;}try{prepareCandidate(candidate);await persistProfile(candidate);}catch{const box=$('#character-form-error');if(box)box.textContent='名稱尚未儲存，原有名稱已保留。';else toast('名稱尚未儲存，原有名稱已保留。');return;}state=candidate;c=state.characters[state.active];e.c=c;updateCharacter();updateHUD();save();openPanel('characters');toast('角色名稱已儲存。');}
});

function updateCharacter(persist=true){
 const active=!!state.active;$('#start').innerHTML=active?icon('sword')+'開始遠征'+icon('chevron'):icon('shield')+'建立你的第一位角色'+icon('chevron');$$('.point-dot').forEach(d=>d.style.visibility=active&&(M.isRingHero(c)?M.ringPoints(c):c.points||M.passivePoints(c))?'visible':'hidden');$('#bag-badge').textContent=c.bag.length||'';
 if(persist)save();updateHUD();
}
function updateTravelEvent(type){
 if(type==='transition'){
  stationaryCast=false;
  combatInput?.clear();
  sceneTransition.start(e);
 }else sceneTransition.clear();
 updateCampPrompt();
}
function updateTravel(){sceneTransition.frame(e.transition);}
const summonStatusIds=new WeakMap();
let nextSummonStatusId=0;
function updatePlayerStatuses(auraDefs){
 const statuses=[],positive=(id,name,icon,detail,remaining,max,extra={})=>statuses.push({id,name,icon,detail,remaining,max,group:'beneficial',...extra});
 const describeAura=def=>{
  const lines=Object.entries(def.buff||{}).map(([key,value])=>modifierText(key,value));
  if(def.damage)lines.push('每 '+Number((e.auraPulseInterval?.(def)||def.interval||1).toFixed(2))+' 秒造成範圍'+({fire:'火焰',cold:'冰霜',lightning:'閃電',poison:'毒素',physical:'物理'}[def.damageType]||'')+'傷害');
  for(const [key,value]of Object.entries(def.debuff||{}))lines.push(({'slow':'敵人緩速','armorShred':'敵人護甲降低','weaken':'敵人傷害降低'}[key]||'敵人減益')+' '+percent(value));
  if(def.infusion)lines.push('主動技能附加火焰、冰霜傷害與元素效果');
  if(auraRestoreText(def))lines.push(auraRestoreText(def).replace(/^ · /,''));
  if(bloodAuraStateText(def))lines.push(bloodAuraStateText(def));
  return lines.join(' · ');
 };
 const shadow=e.gameplay?.assassin;
 if(shadow){const chance=shadow.evasionChance();if(chance>0)statuses.push({id:'evasion',group:'permanent',name:'幻影閃避',icon:'wind',color:'#c4addf',value:percent(chance),meta:'上限80%',detail:'閃避所有敵方傷害判定，成功時免除該次傷害；不抵銷自身血費或延遲承傷。'});if(shadow.veiled())positive('shadow-veil','隱身','eye','閃避+15%、承傷降低20%；自動攻擊暫停，手動攻擊破隱，下一次本體命中+25%。首領可看穿隱身。',shadow.veil.until-shadow.time,shadow.veil.def.duration,{color:'#bda0de'});if(shadow.relayUntil>shadow.time&&e.c.talents.a_relay&&e.summons.some(a=>a.source==='a_clone'&&a.hp>0&&Math.hypot(a.x-e.player.x,a.y-e.player.y)<=300))positive('shadow-relay','影契回流','rune','附近存活影分身普攻命中：每秒回復1%最大生命與魔力，不疊加。',shadow.relayUntil-shadow.time,3,{color:'#b5c6e7'});if(shadow.pressure&&shadow.pressureUntil>shadow.time)positive('shadow-adaptation','幻步適應','wind','每層閃避+3%，成功閃避清空。',shadow.pressureUntil-shadow.time,3,{stacks:shadow.pressure});if(shadow.ambushUntil>shadow.time)positive('shadow-ambush','伏擊','sword','下一次本體直接命中傷害+25%；持續傷害、分身與觸發傷害不消耗。',shadow.ambushUntil-shadow.time,1.5);if(shadow.residualUntil>shadow.time)positive('shadow-residual','殘像護身','eye','閃避率 +'+Math.round(shadow.residual*100)+'%。',shadow.residualUntil-shadow.time,2);}
 const ward=e.minionCombat.protectionAt(e.player);
 if(ward>0)statuses.push({...PLAYER_STATUSES.summonWard,id:'summon-ward',group:'beneficial',meta:'召喚光環',detail:'待在護燈靈光環內，受到的傷害降低 '+percent(ward)+'。'});
 const shrine=e.activeShrine?.();
 if(shrine)positive('shrine',shrine.name,shrine.icon||'rune',shrine.description,shrine.remaining,180,{color:shrine.color,meta:'祭壇祝福'});
 for(const effect of e.buffs){
  const def=M.FLASKS[effect.type],lines=[];
  if(effect.hpRate>0)lines.push('每秒恢復 '+Number(effect.hpRate.toFixed(1))+' 生命');
  if(effect.mpRate>0)lines.push('每秒恢復 '+Number(effect.mpRate.toFixed(1))+' 魔力');
  lines.push(...Object.entries(flaskBuffValues(effect)).map(([key,value])=>modifierText(key,value)));
  positive('flask:'+effect.type+':'+(effect.name||''),effect.name||def?.name||'藥水',def?.icon||'potion',lines.join(' · '),effect.t,effect.max,{color:def?.color,meta:'藥水'});
 }
 for(const effect of e.skillEffects){
  const def=SkillText.effectDisplay(effect,M.ABILITIES),detail=Object.entries(effect.buff||{}).map(([key,value])=>modifierText(key,value));
  if(effect.shield>0)detail.push('剩餘護盾 '+Math.ceil(effect.shield));
  positive('skill:'+effect.id,def.name,def.icon,detail.join(' · '),effect.t,effect.max,{color:def.color||'#b0bce4',meta:effect.shield>0?'護盾 '+Math.ceil(effect.shield):effect.team?'團隊增益':'技能'});
 }
 for(const def of auraDefs)statuses.push({id:'aura:'+def.id,group:'permanent',name:def.name,icon:def.icon,color:def.color,detail:describeAura(def)+' · '+skillFacts(def),meta:costText(e.auraResourceCost(def))+'／秒'+auraRestoreText(def)});
 const free=e.setCombat?.activeFreeAura?.();
 if(free)statuses.push({id:'covenant:'+free.id,group:'permanent',name:free.name,icon:free.icon,color:free.color,meta:'聖約光環',detail:describeAura(free)+' · 聖約常駐 · 60% 強度 · 免費'});
 for(const aura of M.equipmentAuras(c))statuses.push({id:'equipment:'+aura.id,group:'permanent',name:aura.name,icon:aura.icon,color:aura.color,meta:'裝備 · Lv.'+aura.level,detail:describeAura(aura)+' · 裝備光環 · 自動生效 · 免費'});
 for(const [id,pool]of Object.entries(e.minionCombat?.playerShields||{})){
  if(pool.remaining>0&&pool.t>0){const blood=id==='bloodward',base=PLAYER_STATUSES.supportShield;statuses.push({...base,id:'support-shield:'+id,group:'beneficial',name:blood?'赤魄護身':base.name,color:blood?'#dd847c':base.color,detail:(blood?'血怒脈衝':'召喚物')+'提供護盾，剩餘可吸收 '+Math.ceil(pool.remaining)+' 傷害。',remaining:pool.t,max:blood?2:4});}
 }
 const blood=e.gameplay?.blood;
 if(c.cls==='berserker'||blood?.rage>0)statuses.push({...PLAYER_STATUSES.rage,id:'rage',group:'beneficial',value:Math.floor(blood?.rage||0)+'/100',fraction:(blood?.rage||0)/100});
 const debts=(blood?.debts||[]).filter(debt=>!debt.ally&&debt.remaining>0&&debt.t>0);
 if(debts.length)statuses.push({...PLAYER_STATUSES.bloodDebt,id:'blood-debt',group:'harmful',remaining:Math.max(...debts.map(debt=>debt.t)),max:3,stacks:debts.length,meta:'待承受 '+Math.ceil(debts.reduce((sum,debt)=>sum+debt.remaining,0))});
 if(e.mode==='playing'&&e.playerSlow<.999)statuses.push({...PLAYER_STATUSES.slow,id:'slow',group:'harmful',value:'−'+Math.round((1-e.playerSlow)*100)+'%',meta:'移動速度'});
 for(const field of e.enemyFields||[]){
  if(field.t<=0||!(field.damage>0)||Math.hypot(field.x-e.player.x,field.y-e.player.y)>=field.r+12)continue;
  const def=GROUND_STATUSES[field.damageType]||GROUND_STATUSES.physical;
  statuses.push({...def,id:'field:'+field.damageType,group:'harmful',remaining:field.t,max:field.max||field.t,meta:'離開範圍解除'});
 }
 if(e.mode==='playing'&&e.s.resistancePenalty>0)statuses.push({...PLAYER_STATUSES.difficulty,id:'difficulty-penalty',group:'harmful',name:M.DIFFICULTIES[e.diff].name+PLAYER_STATUSES.difficulty.name,meta:'抗性 −'+Math.round(e.s.resistancePenalty*100)+' 百分點',detail:'遠征中火、冰、雷、毒四種抗性各降低 '+Math.round(e.s.resistancePenalty*100)+' 個百分點。'});
 for(const ally of e.summons||[]){
  if(!(ally.hp>0&&ally.maxHp>0))continue;
  if(!summonStatusIds.has(ally))summonStatusIds.set(ally,++nextSummonStatusId);
  const def=M.ABILITIES[ally.source];
  statuses.push({id:'summon:'+summonStatusIds.get(ally),group:'summons',name:def?.name||'召喚盟友',
   icon:def?.icon||'shield',color:ally.color||def?.color||'#8cdbd3',fraction:ally.hp/ally.maxHp,
   detail:'生命 '+Math.ceil(ally.hp)+'／'+Math.ceil(ally.maxHp)});
 }
 updateStatusHUD($('#buff-rack'),statuses);
}

function updateRunProgress(){
 const route=$('#route-hud');
 route.hidden=e.mode!=='playing'||!!e.training;
 $('.quest-tracker').hidden=e.mode==='playing';
 if(route.hidden)return;
 const remaining=e.enemies.reduce((count,enemy)=>count+(enemy.hp>0?1:0),0)+(e.horde?.pending||0);
 $('#enemy-count').textContent=remaining;
 const difficulty=e.diff;
 const kind=e.runContext?.kind,label=kind&&kind!=='campaign'?({rift:'裂隙',endgame:'終局',final:'界隙之心'}[kind]||'遠征'):'第 '+(e.chapter||1)+' 章';
 $('#run-difficulty').textContent=(M.DIFFICULTIES[difficulty]??M.DIFFICULTIES[1]).name;
 $('#run-difficulty').dataset.difficulty=difficulty;
 $('#run-progress').textContent=label+' · '+Math.min((e.expedition?.graph?.layers?.length||8),e.room+1)+' / '+(e.expedition?.graph?.layers?.length||8);
 $('#run-time').textContent=formatTime(e.elapsed);
 const room=currentRoom(),roomName=$('#run-room-name'),summons=e.summons.filter(ally=>ally.hp>0).length;
 roomName.textContent=e.encounter?.name||M.ROOM_TYPES?.[room.type]?.label||room.name;
 roomName.title=e.encounter?.desc||room.description||room.desc||roomName.textContent;
 $('#run-wave').textContent=room.type==='recovery'?'回復':`第 ${e.wave}/${room.waves} 波`;
 $('#run-summons').textContent=summons?` · 召喚 ${summons}`:'';
 const objective=$('#run-objective'),pending=e.objectives?.filter(entry=>!entry.used).length||0;
 objective.hidden=!pending;
 if(pending)objective.textContent=`開啟水門 ${e.objectives.length-pending}/${e.objectives.length}`;
}
function updateRiskHUD(){
 const element=$('#expedition-risk-hud');if(!element)return;
 const conditions=e.expeditionRisk?.conditions,entries=e.mode==='playing'&&!e.training?riskEntries(conditions):[];element.hidden=!entries.length;
 if(!entries.length){element.open=false;delete element.dataset.stamp;return;}
 const stamp=JSON.stringify(entries);if(element.dataset.stamp===stamp)return;element.dataset.stamp=stamp;
 element.querySelector('summary').textContent=[conditions.modifiers?.length?conditions.modifiers.length+' 地圖詞條':'',conditions.curses?.length?conditions.curses.length+' 追咒':'',conditions.mystery?'秘室已揭露':''].filter(Boolean).join(' · ');
 element.querySelector('.risk-summary').innerHTML=riskChips(conditions);
}
function updateHUD(){const low=lowHealthActive(e);$('#low-health-warning').classList.toggle('active',low);$('.health-resource').classList.toggle('critical',low);updateProgressionBadge();updateRunProgress();updateRiskHUD();
 updateTrainingHUD();const s=e.s,blood=bloodResource(s);document.body.classList.toggle('blood-resource',blood);$('.mana-resource').hidden=blood;const level=$('#hud-level');level.textContent=c.level;level.setAttribute('aria-label','角色等級 '+c.level);$('#hp-text').textContent=Math.ceil(e.hp)+' / '+s.hp;$('#mp-text').textContent=Math.floor(e.mana)+' / '+s.mana;$('#hp-fill').style.width=Math.max(0,e.hp/s.hp*100)+'%';$('#mp-fill').style.width=Math.max(0,e.mana/Math.max(1,s.mana)*100)+'%';$('#xp-fill').style.width=Math.min(100,c.xp/M.xpNeed(c)*100)+'%';$('#xp-label').textContent=`經驗 ${Math.floor(c.xp)} / ${M.xpNeed(c)}`;const activeAuraDefs=[...(e.auraIds||[])].map(id=>M.abilityFor(c,id)).filter(Boolean),drain=sumCosts(activeAuraDefs.map(a=>e.auraResourceCost(a))),restore=activeAuraDefs.reduce((n,a)=>n+auraManaRestore(a),0);$('#mana-regen-label').textContent=`每秒回魔 ${(s.manaRegen+restore).toFixed(1)}${drain.mana?' · 光環 '+costText(drain)+'/秒':' · 普攻免費'}`;$('.health-resource>small').textContent=blood?`每秒回血 ${s.lifeRegen.toFixed(1)}${drain.life?' · 光環 '+costText(drain)+'/秒':' · 技能支付生命'}`:'生命歸零時遠征結束';$('#run-time').textContent=formatTime(e.elapsed);
 const autoOn=c.autoEnabled!==false,channel=e.channel,basicSequence=BasicAttacks.basicSequence(c);
 const autoStatus=$('#auto-combat-status');autoStatus.classList.toggle('auto-off',!autoOn);autoStatus.classList.toggle('channel-running',!!channel);autoStatus.querySelector('b').textContent=autoOn?'自動普攻 ON':'自動普攻 OFF';autoStatus.querySelector('span').textContent=channel?`${M.ABILITIES[channel.id]?.name||'技能'} · 持續施放`:basicSequence.length>1?'普攻輪替 '+basicSequence.length+'式':basicSequence[0]?.name||'普通攻擊';autoStatus.querySelector('small').textContent=channel?resourceRateText(M.abilityFor(c,channel.id),s):'攻速加成';autoStatus.title='範圍內有敵人時自動普攻 · J 切換';
 $('#touch-attack').setAttribute('aria-pressed',String(autoOn));$('#touch-attack').setAttribute('aria-label',autoOn?'關閉自動戰鬥':'開啟自動戰鬥');$('#touch-attack').classList.toggle('auto-on',autoOn);$('#touch-attack small').textContent=autoOn?'自動 ON':'自動 OFF';
 const slots=M.skillLoadout(c);for(let i=0;i<3;i++){
  const def=slots[i]?M.abilityFor(c,slots[i]):null,button=$(`[data-action="skill${i}"]`),availability=def?e.skillAvailability(def.id,{source:'manual'}):{usable:false,reason:'未配置技能',cooldown:0},aura=def?.type==='aura',auraOn=!!def&&e.auraIds?.has(def.id),channelOn=!!def&&channel?.id===def.id;
  $(`#skill${i}-icon use`).setAttribute('href','#i-'+(def?.icon||'tree'));$(`#skill${i}-name`).textContent=def?.name||'未配置';$(`#skill${i}-cost`).textContent=def?(channelOn?'放開／再按停止':aura?(auraOn?'ON · ':'OFF · ')+costText(e.auraResourceCost(def))+'/秒':resourceRateText(def,s)):'';
  button.setAttribute('aria-label',def?`${SLOT_LABELS[i]}，${def.name} 等級 ${def.level}，${channelOn?'放開／再按停止。':''}${skillFacts(def)}，${skillSource(def.id)}`:`${SLOT_LABELS[i]}，技能欄位${i+1}未配置`);button.setAttribute('aria-pressed',String(auraOn||channelOn));button.title=SLOT_LABELS[i]+' · '+(def?def.name+' Lv.'+def.level+' · '+skillFacts(def):'未配置技能');button.classList.toggle('empty-skill',!def);button.classList.toggle('aura-active',!!auraOn);button.classList.toggle('toggle-aura',!!aura);button.classList.toggle('channel-active',channelOn);markAvailability(button,availability);
 }
 const moveID=M.movementSkill(c),moveDef=moveID?M.abilityFor(c,moveID):null,moveState=e.actionAvailability('dodge'),moveButton=$('[data-action="dash"]');moveButton.querySelector('small').textContent=moveDef?.name||'閃避';moveButton.querySelector('use').setAttribute('href','#i-'+(moveDef?.icon||'wind'));moveButton.querySelector('em').textContent=costText(moveState.cost);moveButton.setAttribute('aria-label',DODGE_LABEL+' '+(moveDef?moveDef.name+'，'+skillFacts(moveDef):'免費閃避'));moveButton.title=DODGE_LABEL+' · '+(moveDef?skillFacts(moveDef):'免費閃避');markAvailability(moveButton,moveState);
 const army=e.armyPlan,armyState=e.actionAvailability('summon'),armyCost=costText(armyState.cost),armyButton=$('[data-action="summon"]'),living=(e.summons||[]).length,configured=army?.rows?.reduce((count,row)=>count+row.count,0)||0;armyButton.querySelector('small').textContent=living+'／'+configured+' 召喚';armyButton.querySelector('em').textContent=configured?armyCost+' · 重召':'遣散';armyButton.setAttribute('aria-label',`C 重召整支軍隊，存活 ${living}，配置 ${configured} 名，消耗 ${armyCost}`);armyButton.title=`C：重召 ${configured} 名永久盟友 · ${armyCost} · 角色容量 ${army?.capacity||4}`;markAvailability(armyButton,armyState);armyButton.classList.toggle('empty-skill',!configured&&!living);

 updateFlaskHUD();
 updatePlayerStatuses(activeAuraDefs);
 const boss=!e.training&&e.enemies.find(n=>n.type==='boss'||n.type==='miniboss');$('#boss-bar').classList.toggle('hidden',!boss||e.mode!=='playing');if(boss){$('#boss-fill').style.width=Math.max(0,boss.hp/boss.maxHp*100)+'%';$('#boss-bar small').firstChild.textContent=(boss.name||'灰燼君王 · 莫爾迦')+' ';$('#boss-phase').textContent=boss.type==='miniboss'?'第4層 · 小首領挑戰':boss.rage?'第二階段 · 餘燼狂怒':'第一階段 · 沉眠的暴君';}
}
function updateFlaskHUD(){
 const belt=$('#flask-belt'),layout=JSON.stringify(e.flasks.map(f=>f.def));
 if(belt.dataset.layout!==layout){
  belt.dataset.layout=layout;
  belt.innerHTML=e.flasks.map(({def},i)=>{
   const key=FLASK_KEYS[i];
   if(!def)return `<button type="button" class="flask-slot flask-empty" data-flask="${i}" disabled aria-label="${key}，未配置藥水" title="${key} · 未配置藥水"><kbd>${key}</kbd>${icon('potion')}<small>空</small></button>`;
   return `<button type="button" class="flask-slot" data-flask="${i}" style="--flask-color:${def.color}" title="${key} · ${esc(def.name)}：${esc(flaskEffectLines(def).join(' · '))} 消耗 ${def.cost}／${def.maxCharges} 充能" aria-label="使用${esc(def.name)}，消耗${def.cost}充能" aria-keyshortcuts="${key}"><kbd>${key}</kbd><span class="flask-liquid"></span>${icon(def.icon)}<small>${def.short}</small><b><span class="charge-value"></span><em>/${def.maxCharges}</em></b></button>`;
  }).join('');
 }
 belt.querySelectorAll('.flask-slot').forEach((el,i)=>{
  const {def,charges,id,type}=e.flasks[i];
  if(!def)return;
  el.style.setProperty('--charge',Math.min(100,charges/def.maxCharges*100)+'%');
  el.classList.toggle('flask-active',e.buffs.some(b=>b.item?b.item.id===id:b.type===type));
  el.classList.toggle('flask-empty',charges<def.cost);
  el.querySelector('.charge-value').textContent=Math.floor(charges);
 });
}
function routeRoomInfo(node){const type=M.ROOM_TYPES?.[node.type]||{},boss=M.MINIBOSSES?.[node.bossKey],element={physical:'物理',fire:'火焰／閃電',poison:'毒素'};return {...type,name:node.name,description:boss?.desc||type.desc||M.ROOMS[node.layer]?.desc,element:boss?element[boss.element]||boss.element:''};}
function canEnterRoute(id){return panel==='quests'&&!e.training&&e.mode==='playing'&&e.cleared&&!e.transition&&!e.expedition?.selectedID&&(e.routeChoices?.()||[]).some(node=>node.id===id);}
async function chooseRouteRoom(id){
 if(!canEnterRoute(id))return false;
 if(state.rifts?.activeRun&&!await save(true)){toast('清房進度尚未儲存，請先匯出備份。');return false;}if(e.nextRoom(id)){closePanel();return true;}
 toast(e.skillError||'目前無法進入此房間。');return false;
}
function selectRouteNode(id){
 if(!e.expedition?.graph?.nodes.some(node=>node.id===id))return false;
 routePreviewID=id;
 // Keep the same buttons alive so native double clicks and horizontal scroll stay stable.
 $$('.route-node[data-route-preview]').forEach(node=>{const selected=node.dataset.routePreview===id;node.classList.toggle('previewed',selected);node.setAttribute('aria-pressed',String(selected));});
 const riskPreview=$('#route-risk-preview');if(riskPreview)riskPreview.textContent=routeCostText(e.expedition.graph,id);
 const confirm=$('[data-route-choose]');if(confirm){confirm.dataset.routeChoose=id;confirm.disabled=!canEnterRoute(id);confirm.setAttribute('aria-label','確認進入'+e.expedition.graph.nodes.find(node=>node.id===id).name);}
 return true;
}
function focusRouteProgress(){
 if(panel!=='quests'||!dialog.open)return;
 const scroll=$('.route-scroll'),current=$('.route-node.current');if(!scroll||!current)return;
 const viewport=scroll.getBoundingClientRect(),node=current.getBoundingClientRect();
 scroll.scrollLeft+=node.left-viewport.left-(scroll.clientWidth-node.width)*.35;
 current.focus({preventScroll:true});
}
$('#dialog-body').addEventListener('dblclick',ev=>{const node=ev.target.closest('[data-route-preview]');if(panel==='quests'&&node){ev.preventDefault();selectRouteNode(node.dataset.routePreview);chooseRouteRoom(node.dataset.routePreview);}});
$('#dialog-body').addEventListener('wheel',ev=>{
 const scroll=ev.target.closest('.route-scroll');if(panel!=='quests'||!scroll||ev.ctrlKey||Math.abs(ev.deltaX)>=Math.abs(ev.deltaY)||scroll.scrollWidth<=scroll.clientWidth)return;
 ev.preventDefault();scroll.scrollLeft+=ev.deltaY*(ev.deltaMode===1?20:ev.deltaMode===2?scroll.clientWidth:1);
},{passive:false});
function routeGraphMarkup(){
 const graph=!e.training&&e.mode==='playing'?e.expedition?.graph:null;
 if(!graph)return '';
 const current=e.expedition.currentID,legal=new Set((e.routeChoices?.()||[]).map(node=>node.id)),visited=new Set(e.expedition.path||[]),selected=graph.nodes.find(node=>node.id===routePreviewID)||graph.nodes.find(node=>node.id===current),coords=node=>[102+node.layer*224,node.col+.5];
 const links=graph.nodes.flatMap(node=>node.next.map(id=>{
  const next=graph.nodes.find(n=>n.id===id);if(!next)return '';const [x,y]=coords(node),[xx,yy]=coords(next),mid=(x+xx)/2,used=visited.has(node.id)&&visited.has(id),reachable=node.id===current&&legal.has(id);
  return `<path class="${used?'visited':reachable?'reachable':''}" d="M${x+90} ${y} C${mid} ${y} ${mid} ${yy} ${xx-90} ${yy}"/>`;
 })).join('');
 return `<div class="route-legend" aria-label="路線狀態"><span class="current">目前</span><span class="reachable">可選</span><span class="visited">已走過</span></div><div class="route-scroll" tabindex="0" aria-label="左右捲動八層分岔路線"><div class="expedition-route" style="grid-template-columns:repeat(${graph.layers.length},204px);width:${graph.layers.length*224-20}px" aria-label="完整分岔路線"><svg class="route-lines" viewBox="0 0 ${graph.layers.length*224-20} 3" preserveAspectRatio="none" aria-hidden="true">${links}</svg>${graph.nodes.map(node=>{
  const meta=routeRoomInfo(node),isCurrent=node.id===current,isVisited=visited.has(node.id),isLegal=legal.has(node.id),canEnter=isLegal&&e.cleared;
  return `<button class="route-node ${isCurrent?'current':''} ${isVisited?'visited':''} ${isLegal?'reachable':''} ${node.id===selected.id?'previewed':''}" data-route-preview="${node.id}" data-route-layer="${node.layer}" data-route-type="${node.type}" title="${esc(routeCostText(graph,node.id)||meta.description)}" style="grid-column:${node.layer+1};grid-row:${node.col+1};--room-color:${meta.color||'#bcb393'}" aria-pressed="${node.id===selected.id}" aria-label="第${node.layer+1}層 ${esc(node.name)}，${isCurrent?'目前房間':isVisited?'已走過':canEnter?'可以選擇':'預覽'}"><small>第 ${node.layer+1} 層 · ${esc(meta.label||node.type)}</small><b>${esc(node.name)}</b><span>${node.type==='recovery'?'HP／MP／藥水全滿':node.type==='miniboss'?meta.element:node.type==='boss'?'君王印記 · 黃裝保底':node.type==='treasure'?'守衛掉裝＋材料':node.type==='trial'?'高風險高回報':node.type==='welfare'?'本房輕鬆 · 後2房追咒':node.type==='mystery'?'未知恩惠／追咒':node.type==='elite'?'每波至少2名菁英':'2波混合敵人'}</span><em>${isCurrent?'目前房間':isVisited?'已走過':canEnter?'可進入':isLegal?'待淨化':'未連通'}</em></button>`;
 }).join('')}</div></div>`;
}
function renderQuests(){
 if(!M.canChapter(c,c.difficulty,selectedChapter))selectedChapter=1;
 const diff=c.difficulty,active=state.rifts?.activeRun,graph=!e.training&&e.mode==='playing'?e.expedition?.graph:null,current=graph?.nodes.find(node=>node.id===e.expedition.currentID),chapter=graph?e.chapter:selectedChapter,ch=M.chapterDefinition(chapter),progress=current?current.layer+1:M.progressFor(c,diff,chapter).length,selected=graph?.nodes.find(node=>node.id===routePreviewID)||current;
 dialog.classList.toggle('campaign-selection-dialog',!graph&&!active);
 $('#panel-tabs').innerHTML=`<nav class="adventure-tabs" aria-label="遠征類型">${['campaign','rift','endgame'].map((id,i)=>`<button data-map-tab="${id}" class="${mapTab===id?'selected':''}" aria-pressed="${mapTab===id}">${['章節','裂隙','終局'][i]}</button>`).join('')}</nav>${graph?`<span class="route-context">${esc(active?(active.kind==='final'?'界隙之心':Rifts.RIFT_THEMES[active.theme].name):ch.name)}<small>${M.DIFFICULTIES[e.diff].name} · ${progress}/${graph.layers.length}</small></span>`:''}`;
 if(active&&!graph){
  const won=active.status==='won',title=active.kind==='final'?'界隙之心':Rifts.RIFT_THEMES[active.theme].name;
  $('#dialog-body').innerHTML=`<div class="paid-run-resume"><b>${won?'已完成 · 獎勵待結算':'中斷遠征 · 待結算'} · ${esc(title)}</b><p>${paidBusy?'等待另一個視窗結束遠征或完成結算。':won?'可整理背包後完成結算。':'中斷的遠征將以放棄結算，已使用的入場道具不退回。'}</p><button class="gold-btn" data-rift-settle ${paidBusy?'disabled':''}>${won?'領取獎勵':'結算並留在營地'}</button>${won&&canManagePaidRewards()?'<button class="outline-btn" data-panel="stash">整理背包與倉庫</button>':''}</div>`;return;
 }
 if(mapTab!=='campaign'&&!graph){renderRiftChoices();return;}
 if(!graph){
  $('#dialog-body').innerHTML=`<div class="campaign-departure-content">${difficultySelector(c)}${chapterCards(c,chapter)}</div><footer class="route-footer"><button class="gold-btn" data-route-start>開始遠征</button></footer>`;return;
 }
 $('#dialog-body').innerHTML=`${graph?'<div class="risk-summary">'+riskChips(e.expeditionRisk?.conditions)+'</div>':''}${routeGraphMarkup()}<small id="route-risk-preview" class="risk-route-note">${graph?esc(routeCostText(graph,selected.id)):''}</small><footer class="route-footer">${graph?`<button class="gold-btn" data-route-choose="${selected.id}" ${canEnterRoute(selected.id)?'':'disabled'}>確認</button>`:'<button class="gold-btn" data-route-start>開始遠征</button>'}</footer>`;
}
function riftAchievementMarkup(){const list=M.riftAchievementList(state),open=$('.rift-achievements')?.open;return `<details class="rift-achievements" ${open?'open':''}><summary>遠征成就 · ${list.filter(a=>a.claimable).length} 待領</summary>${list.map(a=>`<div><span>${a.name} · ${Math.min(a.need,a.progress)}/${a.need}<small>${a.description}</small></span><button data-rift-claim="${a.id}" ${a.claimable?'':'disabled'}>${a.claimed?'已領':'領取'}</button></div>`).join('')}</details>`;}
async function claimRiftReward(id){const candidate=profileCandidate(),r=M.claimRiftAchievement(candidate,id);if(!r.ok){toast(r.reason);return;}if(await commitPaidCandidate(candidate)){renderRiftChoices();toast('遠征成就獎勵已領取');}}
function renderRiftChoices(){
 Rifts.ensureRifts(state);
 const body=$('#dialog-body'),scroll=body.scrollTop,optionsOpen=$('.paid-map-options')?.open||false,focus=document.activeElement?.closest('[data-rift-option]'),focusKey=focus?.dataset.riftOption,focusValue=focus?.dataset.value;
 body.innerHTML=paidMapChoices(state,c,riftDraft,{end:mapTab==='endgame',optionsOpen})+riftAchievementMarkup();
 if(focusKey&&focusValue)body.querySelector(`[data-rift-option="${focusKey}"][data-value="${focusValue}"]`)?.focus({preventScroll:true});
 body.scrollTop=scroll;
}
async function acquirePaidLock({wait=false}={}){
 if(paidLockOwned)return true;
 if(!navigator.locks)return false;
 paidLockRelease=await takePaidRunLock(navigator.locks,{wait});
 return paidLockOwned=!!paidLockRelease;
}
function releasePaidLock(){paidLockRelease?.();paidLockRelease=null;paidLockOwned=false;}
function bindProfile(profile,restoreArmy=false){state=profile;c=state.characters[state.active];M.ensureCampaign(c);e.c=c;if(restoreArmy)e.summons=(c.summonState||[]).map((a,i)=>e.createSummon(a.skill,i,a.hp,c.summonState.length)).filter(Boolean);e.refresh();}
function bindCampProfile(profile){
 clearCampaignCheckpoints(profile);
 state=profile;c=state.characters[state.active]??M.newCharacter('warrior','尚未建立角色');e.c=c;
 e.drops=[];e.worldObjects?.discard();e.runContext=null;
 manualPause=false;repeatEligible=false;repeatRunId='';e.camp(true);
 updateCharacter(false);updateMode();updateHUD();
}
const canManagePaidRewards=()=>state.rifts?.activeRun?.status==='won'&&(paidLockOwned||!navigator.locks)&&!paidBusy;
async function commitPaidCandidate(candidate){try{await persistProfile(candidate);bindProfile(candidate);return true;}catch{toast('未能儲存，沒有扣除本次入場道具。');return false;}}
async function craftRift(kind){if(e.mode==='playing')return;const candidate=profileCandidate(),result=Rifts.craftTicket(candidate,c.difficulty,kind);if(!result.ok){toast(result.reason);return;}if(await commitPaidCandidate(candidate)){toast('入場道具已製作');renderQuests();}}
async function enterPaid(theme){
 if(paidBusy||storageTransactions||e.mode!=='camp'||state.rifts?.activeRun)return;
 if(!navigator.locks){toast('此瀏覽器不支援裂隙的多視窗保護，請使用新版瀏覽器。');return;}
 paidBusy=true;
 let running=false,needsSettlement=false;
 try{
  if(!await acquirePaidLock()){toast('另一個視窗正在進行裂隙。');return;}
  const latest=await profileStore.load();
  if(latest.rifts?.activeRun||(latest.writeRevision||0)!==(state.writeRevision||0)){
   bindCampProfile(latest);needsSettlement=!!latest.rifts?.activeRun;
   if(!needsSettlement)toast('已載入較新的存檔，請重新選擇遠征。');
   if(panel==='quests')renderQuests();return;
  }
  const kind=theme==='final'?'final':mapTab==='endgame'?'endgame':'rift';
  const result=Rifts.createRiftCandidate(state,c.id,{...riftDraft,kind,theme:theme==='final'?'hunt':theme,difficulty:c.difficulty,challenge:kind==='rift'?1:riftDraft.challenge,bossEquipment:true},crypto.randomUUID());
  if(!result.ok){toast(result.reason);return;}
  if(!await commitPaidCandidate(result.profile))return;
  manualPause=false;closePanel();const run=state.rifts.activeRun;
  running=e.start(run.difficulty,run.seed,{chapter:run.chapterTier,context:Rifts.runContext(run)})!==false;
  if(!running){needsSettlement=true;return;}
  void save(true);updateMode();
 }catch{toast('目前無法開始遠征，請稍後重試。');needsSettlement=!!state.rifts?.activeRun;}
 finally{
  if(!running)releasePaidLock();
  paidBusy=false;
  if(needsSettlement)void settleStoredPaidRun({wait:true});
 }
}
async function settleStoredPaidRun({wait=false}={}){
 if(paidBusy||storageTransactions||e.mode!=='camp')return 'pending';
 paidBusy=true;
 if(panel==='quests')renderQuests();
 try{
  if(navigator.locks&&!await acquirePaidLock({wait}))return 'locked';
  const latest=await profileStore.load(),cleaned=clearCampaignCheckpoints(latest);
  const result=settleInterruptedPaidRun(latest);
  if(result?.ok){
   await persistProfile(result.profile);bindCampProfile(result.profile);
   toast(result.profile.rifts.lastResult.outcome==='won'?'遠征已結算，共享材料已入庫。':'中斷的遠征已結算，先前清房獎勵已保留。');
   return 'settled';
  }
  if(cleaned)await persistProfile(latest);
  bindCampProfile(latest);
  if(result){toast(result.reason);return 'pending';}
  return 'settled';
 }catch{toast('遠征結算尚未儲存，請在遠征頁重試。');return 'pending';}
 finally{
  if(state.rifts?.activeRun?.status!=='won')releasePaidLock();
  paidBusy=false;
  if(panel==='quests')renderQuests();
 }
}
async function finishPaid(outcome,{camp=false}={}){
 if(paidBusy||!paidLockOwned||!state.rifts?.activeRun)return false;
 paidBusy=true;
 const wasPaused=manualPause;
 manualPause=true;release();updatePause();
 try{
  if(outcome==='won'&&e.mode==='victory')e.worldObjects?.collectAll();
  if(e.mode!=='camp'&&!await save(true))throw Error('Paid room save failed');
  const result=e.mode==='camp'?settleInterruptedPaidRun(state):M.settlePaidRun(state,outcome);
  if(!result?.ok){
   toast(result?.reason||'遠征結算尚未完成。');
   if(camp&&state.rifts?.activeRun?.status==='won'){bindCampProfile(state);return true;}
   return false;
  }
  await persistProfile(result.profile);
  if(camp)bindCampProfile(result.profile);
  else{
   if(outcome!=='won'){e.drops=[];e.worldObjects?.discard();}
   bindProfile(result.profile,outcome!=='won');
  }
  releasePaidLock();terminalCheckpointQueued=false;
  toast(outcome==='won'?'遠征已結算，共享材料已入庫。':'已保留先前清房獎勵');
  return true;
 }catch{
  toast('結算儲存失敗，請稍後重試。');
  if(camp&&state.rifts?.activeRun?.status==='won'){bindCampProfile(state);return true;}
  return false;
 }
 finally{
  paidBusy=false;manualPause=e.mode==='camp'?false:wasPaused;updateMode();updateHUD();
  if(['dead','victory'].includes(e.mode))showResult();
 }
}

async function progressionCommit(mutate,message,refreshStats=true){
 const claimButton=document.activeElement?.closest('[data-claim-achievement],[data-claim-all-achievements]');
 const candidate=profileCandidate(),hero=candidate.characters[c.id],result=hero&&mutate(hero,candidate);
 if(!result||result.ok===false){toast(result?.reason||'目前無法進行這項操作。');return false;}
 try{prepareCandidate(candidate);await persistProfile(candidate);}catch{toast('無法儲存：點數與獎勵都保留原狀，請稍後再試。');return false;}
 state=candidate;
 c=state.characters[state.active];
 e.c=c;
 if(refreshStats)e.refresh();
 if(panel==='passives'&&!M.isRingHero(c))refreshPassiveAllocations();
 else renderPanel();
 updateCharacter(false);
 if(claimButton&&panel==='achievements'){
  const id=claimButton.dataset.claimAchievement,card=id&&dialog.querySelector(`[data-achievement="${id}"]`);
  (card||dialog.querySelector('[data-achievement-filter].selected'))?.focus({preventScroll:true});
 }
 if(message)toast(typeof message==='function'?message(result):message);
 return true;
}
function achievementRewardMarkup(reward){
 const points=[['skillPoints','rune','技能點','skill-point-reward'],['talentPoints','tree','天賦點','talent-point-reward']];
 return [
  ...points.filter(([key])=>reward[key]).map(([key,glyph,label,cls])=>`<span class="achievement-points ${cls}">${icon(glyph)}${label} +${reward[key]}</span>`),
  ...(reward.materials||[]).map(item=>`<span title="${esc(M.MATERIALS[item.key].description)}">${M.MATERIALS[item.key].name} ×${item.count}</span>`),
  ...(reward.gems||[]).map(item=>`<span title="${esc(M.GEMS[item.key].description)}">${M.GEMS[item.key].name} T${item.tier} ×${item.count}</span>`)
 ].join('');
}
function scopedAchievements(hero){
 return M.achievementList(hero).filter(item=>achievementScope==='global'?!item.difficulty:item.difficulty===Number(achievementScope));
}
function renderAchievements(){
 const scoped=scopedAchievements(c),ready=scoped.filter(item=>item.claimable).length;
 const visible=scoped.filter(item=>achievementFilter==='ready'?item.claimable:achievementFilter==='claimed'?item.claimed:!item.claimed);
 const focus=document.activeElement?.dataset;
 const scopes=[...[1,2,3].map(id=>[String(id),M.DIFFICULTIES[id].name]),['global','旅程']];
 const filters=[['unclaimed','未領取'],['claimed','已領取'],['ready','可領取']];
 $('#dialog-body').innerHTML=`<div class="achievement-toolbar">
  <nav aria-label="成就難度">${scopes.map(([id,label])=>`<button data-achievement-scope="${id}" class="${achievementScope===id?'selected':''}" aria-pressed="${achievementScope===id}">${label}</button>`).join('')}</nav>
  <div class="achievement-actions"><nav aria-label="成就狀態">${filters.map(([id,label])=>`<button data-achievement-filter="${id}" class="${achievementFilter===id?'selected':''}" aria-pressed="${achievementFilter===id}">${label}${id==='ready'?` <small>${ready}</small>`:''}</button>`).join('')}</nav>
  <button class="gold-btn achievement-claim-all" data-claim-all-achievements title="領取目前分類中所有可領取成就" ${ready?'':'disabled'}>一鍵領取</button></div>
 </div><div class="achievement-list">${visible.map(item=>{
  const stateClass=item.claimed?'claimed':item.claimable?'ready':'',pointClass=item.reward.skillPoints?'special-skill':item.reward.talentPoints?'special-talent':'';
  return `<article class="achievement-card ${stateClass} ${pointClass}" data-achievement="${item.id}" tabindex="-1"><div class="achievement-card-title"><span>${icon(item.claimed?'check':item.kind==='boss'?'sword':'flag')}</span><div><h3>${item.title}</h3><p>${item.description}</p></div><small>${item.progress} / ${item.target}</small></div><div class="achievement-card-bottom"><div class="achievement-rewards">${achievementRewardMarkup(item.reward)}</div><button class="${item.claimable?'gold-btn':'outline-btn'}" data-claim-achievement="${item.id}" ${item.claimable?'':'disabled'}>${item.claimed?'已領取':item.claimable?'領取':'未完成'}</button></div></article>`;
 }).join('')||'<p class="compact-empty">目前沒有符合的成就。</p>'}</div>`;
 if(focus?.achievementScope)dialog.querySelector('[data-achievement-scope].selected')?.focus({preventScroll:true});
 if(focus?.achievementFilter)dialog.querySelector('[data-achievement-filter].selected')?.focus({preventScroll:true});
}
function updateProgressionBadge(){
 const badge=$('#achievement-badge');if(!badge)return;if(!state.active){badge.textContent='';return;}
 const total=Object.values(c.progress||{}).reduce((sum,rooms)=>sum+rooms.length,0),key=`${c.id}:${c.level}:${c.kills}:${total}`;
 if(progressionBadgeKey!==key||progressionBadgeRecord!==c.achievements){progressionBadgeKey=key;progressionBadgeRecord=c.achievements;badge.textContent=M.achievementList(c).filter(item=>item.claimable).length||'';}
}
function passiveValue(key,value){const flat=['poisonStacks','mana','armor','lifeRegen','summonCapacity','pierce','extraProjectiles','trapCapacity','flatManaCost','manaOnHit','manaOnKill'].includes(key),number=flat?Number(value.toFixed(2)):Number((value*100).toFixed(2));return `${number>0?'+':''}${number}${flat?'':'%'}`;}
function passiveNodeMatches(node){if(node.id==='root')return true;const role=ROLE_BRANCHES[c.cls]||[],query=passiveQuery.trim().toLocaleLowerCase(),text=[node.name,node.path,node.description,M.PASSIVE_BRANCHES.find(b=>b.id===node.branch)?.name,...Object.keys(node.mods).map(k=>M.PASSIVE_MOD_NAMES[k]||M.AFFIXES[k]?.label||k)].join(' ').toLocaleLowerCase();return (!query||text.includes(query))&&(passiveFilter!=='mechanics'||!!node.mechanic)&&(passiveFilter!=='role'||role.includes(node.branch));}
function filterPassives(){let matches=0;for(const el of $$('.passive-node')){const n=M.PASSIVE_NODES[el.dataset.passiveNode],match=passiveNodeMatches(n);el.classList.toggle('muted',!match);if(match&&n.id!=='root')matches++;}$$('[data-passive-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.passiveFilter===passiveFilter)));const counter=$('#passive-match-count');if(counter)counter.textContent=matches+' / 240';}
function jumpPassiveNode(id){const node=M.PASSIVE_NODES[id],viewport=$('.passive-viewport');if(!node||!viewport)return;passiveSelection=id;passiveView.scale=Math.max(.65,passiveView.scale);passiveView.x=viewport.clientWidth/2-(node.x+PASSIVE_LAYOUT.center)*passiveView.scale;passiveView.y=viewport.clientHeight/2-(node.y+PASSIVE_LAYOUT.center)*passiveView.scale;applyPassiveView();$$('.passive-node').forEach(el=>el.classList.toggle('selected',el.dataset.passiveNode===id));renderPassiveDetail();dialog.querySelector(`[data-passive-node="${id}"]`)?.focus({preventScroll:true});}
function passiveGraphMarkup(){
 const nodes=Object.values(M.PASSIVE_NODES),center=PASSIVE_LAYOUT.center;
 const lines=nodes.flatMap(node=>node.neighbors.filter(id=>node.id<id).map(id=>{
  const next=M.PASSIVE_NODES[id];
  return `<line data-from="${node.id}" data-to="${id}" x1="${node.x+center}" y1="${node.y+center}" x2="${next.x+center}" y2="${next.y+center}"/>`;
 })).join('');
 const labels=M.PASSIVE_BRANCHES.map((branch,index)=>{
  const angle=(-90+index*30)*Math.PI/180;
  return `<span class="passive-branch-label" style="left:${center+Math.cos(angle)*PASSIVE_LAYOUT.labelRadius}px;top:${center+Math.sin(angle)*PASSIVE_LAYOUT.labelRadius}px;color:${branch.color}">${branch.name}</span>`;
 }).join('');
 const buttons=nodes.map(node=>{
  const selected=passiveSelection===node.id;
  return `<button class="passive-node ${node.type} ${node.mechanic?'has-mechanic':''} ${selected?'selected':''}" data-passive-node="${node.id}" style="left:${node.x+center}px;top:${node.y+center}px;--node-color:${node.color||'#d6bc7a'}" title="${node.name}" aria-label="${node.name}${node.id==='root'?'，起始節點':''}" aria-pressed="${selected}">${icon(node.icon||'flame')}<b>${node.id==='root'?'起源':''}</b></button>`;
 }).join('');
 return `<svg class="passive-links" viewBox="0 0 ${PASSIVE_LAYOUT.size} ${PASSIVE_LAYOUT.size}" aria-hidden="true">${lines}</svg>${labels}${buttons}`;
}
function refreshPassiveAllocations(){
 const canvas=$('.passive-canvas');
 const ranks=c.passives||{},active=id=>id==='root'||ranks[id]>0;
 for(const button of canvas.querySelectorAll('.passive-node')){
  const node=M.PASSIVE_NODES[button.dataset.passiveNode];
  button.classList.toggle('allocated',active(node.id));
  if(node.id==='root')continue;
  button.classList.toggle('reachable',node.neighbors.some(active)&&M.passiveState(c,node.id).ok);
  const badge=button.querySelector('b'),label=`${ranks[node.id]||0}/${node.maxRank}`;
  if(badge.textContent!==label){
   badge.textContent=label;
   button.title=`${node.name} · ${label} · Lv.${node.reqLevel}`;
   button.setAttribute('aria-label',`${node.name}，${label}，等級${node.reqLevel}${node.mechanic?'，特殊專精':''}`);
  }
 }
 for(const line of canvas.querySelectorAll('.passive-links line')){
  const from=active(line.dataset.from),to=active(line.dataset.to);
  line.classList.toggle('active',from&&to);
  line.classList.toggle('available',from!==to);
 }
 const owned=Object.keys(ranks);
 const cores=owned.filter(id=>M.PASSIVE_NODES[id]?.type==='keystone').length;
 const masteries=owned.filter(id=>M.PASSIVE_NODES[id]?.type==='mastery').length;
 $('#passive-limits').textContent=`核心 ${cores}/3 · 專精 ${masteries}/4`;
 $('#panel-tabs .panel-points b').textContent=M.passivePoints(c);
 $('[data-passive-reset]').disabled=e.mode==='playing'||!owned.length;
 refreshPassiveDetailState();
}
function renderPassives(){
 const fresh=passiveView.hero!==c.id,focus=fresh||passiveFocusRequested,focusID=M.preferredPassiveNode(c).id;if(focus){passiveFocusRequested=false;passiveQuery='';passiveFilter='all';passiveSelection=focusID==='root'?null:focusID;}
 $('#dialog-body').innerHTML=`<div class="passive-map-tools" aria-label="天賦地圖控制"><input id="passive-search" type="search" autocomplete="off" value="${esc(passiveQuery)}" placeholder="搜尋天賦、效果" aria-label="搜尋天賦"><div class="passive-filters"><button data-passive-filter="all">全部</button><button data-passive-filter="role">職業方向</button><button data-passive-filter="mechanics">特殊效果</button></div><span id="passive-match-count"></span><div class="passive-zoom-tools"><button data-passive-view="zoom-out" title="縮小" aria-label="縮小天賦地圖">−</button><span id="passive-scale"></span><button data-passive-view="zoom-in" title="放大" aria-label="放大天賦地圖">＋</button><button data-passive-view="center">置中</button><button data-passive-view="fit">全覽</button></div><small id="passive-limits"></small></div><nav class="passive-directions" aria-label="天賦方向定位">${M.PASSIVE_BRANCHES.map(b=>`<button data-passive-branch="${b.id}" class="${(ROLE_BRANCHES[c.cls]||[]).includes(b.id)?'role-direction':''}" title="定位${b.name}分支">${b.name}</button>`).join('')}</nav><div class="passive-board"><div class="passive-viewport" tabindex="0" aria-label="從中心向外延伸的天賦樹，拖曳平移、滾輪縮放"><div class="passive-canvas">${passiveGraphMarkup()}</div></div><aside id="passive-detail" class="passive-detail hidden" aria-live="polite"></aside></div>`;
 refreshPassiveAllocations();filterPassives();if(focus){const heroID=c.id;if(fresh)passiveView.scale=innerWidth<700?.65:.7;requestAnimationFrame(()=>{if(panel==='passives'&&dialog.open&&c.id===heroID){passiveView.hero=heroID;if(focusID==='root')centerPassiveView(false);else jumpPassiveNode(focusID);}});}else applyPassiveView();renderPassiveDetail();
}
function refreshPassiveDetailState(){
 const node=M.PASSIVE_NODES[passiveSelection],detail=$('#passive-detail');
 const invest=detail?.querySelector('[data-passive-invest]');
 if(!node||!invest)return;
 const rule=M.passiveState(c,node.id);
 detail.querySelector('h3 small').textContent=`${rule.rank}/${node.maxRank}`;
 invest.disabled=!rule.ok;
 invest.textContent=rule.ok?'投入 1 點':rule.reason;
 const rows=detail.querySelectorAll('.passive-effect-table tbody tr');
 Object.entries(node.mods).forEach(([key,value],index)=>{
  const row=rows[index];
  if(!row)return;
  row.cells[1].textContent=passiveValue(key,value*rule.rank);
  row.cells[2].textContent=passiveValue(key,value*rule.nextRank);
 });
 const condition=detail.querySelector('.passive-condition');
 if(condition){
  condition.classList.toggle('met',rule.conditionMet);
  condition.textContent=`${rule.conditionMet?'已符合':'尚未符合'}：${CONDITION_LABELS[node.condition]}`;
 }
}
function renderPassiveDetail(){
 const detail=$('#passive-detail');
 if(!detail)return;
 const node=M.PASSIVE_NODES[passiveSelection];
 detail.classList.toggle('hidden',!node);
 if(!node)return;
 const root=node.id==='root';
 const branch=node.branch?M.PASSIVE_BRANCHES.find(item=>item.id===node.branch).name:'天賦';
 const heading=`<div class="passive-detail-heading"><div><small>${branch}${root?'':` · Lv.${node.reqLevel}`}</small><h3>${node.name} ${root?'':'<small></small>'}</h3></div>${modalClose('data-close-passive','關閉天賦詳情')}</div>`;
 const effects=node.mechanic?'':`<table class="skill-effect-table passive-effect-table"><thead><tr><th>加成</th><th>目前</th><th>下一點</th></tr></thead><tbody>${Object.keys(node.mods).map(key=>`<tr><th scope="row">${M.PASSIVE_MOD_NAMES[key]||M.AFFIXES[key]?.label||key}</th><td></td><td class="effect-upgrade"></td></tr>`).join('')}</tbody></table>`;
 detail.innerHTML=heading+(root?'<p class="passive-description">每級獲得1點天賦，沿連線向外分配。</p>':`
  <button class="gold-btn passive-invest" data-passive-invest="${node.id}"></button>${effects}
  ${node.condition?'<p class="passive-condition"></p>':''}
  ${node.description?`<p class="passive-description">${SkillText.colorTerms(node.description)}</p>`:''}
  ${node.type==='mastery'?'<p class="passive-note">同方向專精擇一 · 全樹最多4個</p>':''}
  ${node.mods.basicLeech||node.mods.skillLeech?'<p class="passive-note">天賦吸血合計上限10%生命／秒；菁英50%、首領25%效率。</p>':''}`);
 refreshPassiveDetailState();
 const viewport=$('.passive-viewport'),element=dialog.querySelector(`[data-passive-node="${node.id}"]`);
 if(viewport&&element){
  const rect=element.getBoundingClientRect(),box=viewport.getBoundingClientRect();
  detail.classList.toggle('on-left',innerWidth>=700&&rect.left>box.left+box.width/2);
  revealPassiveNode(element);
 }
}
$('#dialog-body').addEventListener('input',ev=>{if(ev.target.id==='passive-search'){passiveQuery=ev.target.value;filterPassives();}});
$('#dialog-body').addEventListener('keydown',ev=>{if(ev.target.id!=='passive-search')return;if(ev.key==='Enter'){ev.preventDefault();const node=Object.values(M.PASSIVE_NODES).find(n=>n.id!=='root'&&passiveNodeMatches(n));if(node)jumpPassiveNode(node.id);}if(ev.key==='Escape'){ev.stopPropagation();passiveQuery='';ev.target.value='';filterPassives();}});
function applyPassiveView(){const canvas=$('.passive-canvas'),viewport=$('.passive-viewport');if(!canvas)return;if(viewport){viewport.scrollLeft=0;viewport.scrollTop=0;}canvas.style.transform=`translate(${passiveView.x}px,${passiveView.y}px) scale(${passiveView.scale})`;$('#passive-scale').textContent=Math.round(passiveView.scale*100)+'%';}
function revealPassiveNode(element){
 const viewport=$('.passive-viewport');if(!viewport||!element?.isConnected)return;viewport.scrollLeft=0;viewport.scrollTop=0;
 const box=viewport.getBoundingClientRect(),node=element.getBoundingClientRect(),margin=18;let dx=node.left<box.left+margin?box.left+margin-node.left:node.right>box.right-margin?box.right-margin-node.right:0,dy=node.top<box.top+margin?box.top+margin-node.top:node.bottom>box.bottom-margin?box.bottom-margin-node.bottom:0;
 const detail=$('#passive-detail');if(detail&&!detail.classList.contains('hidden')){const sheet=detail.getBoundingClientRect(),overlap=node.left+dx<sheet.right&&node.right+dx>sheet.left&&node.top+dy<sheet.bottom&&node.bottom+dy>sheet.top;
  if(overlap){if(innerWidth<700)dy=Math.min(dy,sheet.top-margin-node.bottom);else if(sheet.left>box.left+box.width/2)dx=Math.min(dx,sheet.left-margin-node.right);else dx=Math.max(dx,sheet.right+margin-node.left);}
 }
 if(dx||dy){passiveView.x+=dx;passiveView.y+=dy;applyPassiveView();}
}
function centerPassiveView(fit=false){const viewport=$('.passive-viewport');if(!viewport)return;if(fit)passiveView.scale=Math.max(PASSIVE_LAYOUT.minScale,Math.min(1.2,Math.min(viewport.clientWidth-24,viewport.clientHeight-24)/PASSIVE_LAYOUT.size));passiveView.x=viewport.clientWidth/2-PASSIVE_LAYOUT.center*passiveView.scale;passiveView.y=viewport.clientHeight/2-PASSIVE_LAYOUT.center*passiveView.scale;applyPassiveView();}
function zoomPassiveView(factor,clientX=null,clientY=null){const viewport=$('.passive-viewport');if(!viewport)return;const box=viewport.getBoundingClientRect(),x=clientX===null?box.width/2:clientX-box.left,y=clientY===null?box.height/2:clientY-box.top,scale=Math.max(PASSIVE_LAYOUT.minScale,Math.min(PASSIVE_LAYOUT.maxScale,passiveView.scale*factor)),worldX=(x-passiveView.x)/passiveView.scale,worldY=(y-passiveView.y)/passiveView.scale;passiveView.x=x-worldX*scale;passiveView.y=y-worldY*scale;passiveView.scale=scale;applyPassiveView();}
$('#dialog-body').addEventListener('pointerdown',ev=>{const viewport=ev.target.closest('.passive-viewport');if(panel!=='passives'||!viewport||ev.target.closest('button')||ev.button!==0)return;ev.preventDefault();passiveDrag={id:ev.pointerId,x:ev.clientX,y:ev.clientY,viewX:passiveView.x,viewY:passiveView.y};viewport.setPointerCapture(ev.pointerId);viewport.classList.add('panning');});
$('#dialog-body').addEventListener('pointermove',ev=>{if(!passiveDrag||passiveDrag.id!==ev.pointerId)return;passiveView.x=passiveDrag.viewX+ev.clientX-passiveDrag.x;passiveView.y=passiveDrag.viewY+ev.clientY-passiveDrag.y;applyPassiveView();});
for(const type of ['pointerup','pointercancel'])$('#dialog-body').addEventListener(type,()=>{passiveDrag=null;$('.passive-viewport')?.classList.remove('panning');});
$('#dialog-body').addEventListener('wheel',ev=>{if(panel!=='passives'||!ev.target.closest('.passive-viewport'))return;ev.preventDefault();zoomPassiveView(Math.exp(-ev.deltaY*.0015),ev.clientX,ev.clientY);},{passive:false});
$('#dialog-body').addEventListener('focusin',ev=>{if(panel!=='passives')return;const node=ev.target.closest('.passive-node');if(!node)return;revealPassiveNode(node);requestAnimationFrame(()=>{if(document.activeElement===node)revealPassiveNode(node);});});
$('#dialog-body').addEventListener('scroll',ev=>{if(panel!=='passives'||!ev.target.matches?.('.passive-viewport')||!ev.target.scrollLeft&&!ev.target.scrollTop)return;ev.target.scrollLeft=0;ev.target.scrollTop=0;const node=document.activeElement?.closest?.('.passive-node');if(node)revealPassiveNode(node);},true);
$('#dialog-body').addEventListener('keydown',ev=>{if(panel!=='passives')return;const direction={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[ev.key];if(!direction)return;const element=ev.target.closest('.passive-node');if(!element){if(ev.target.matches('.passive-viewport')){ev.preventDefault();passiveView.x-=direction[0]*60;passiveView.y-=direction[1]*60;applyPassiveView();}return;}
 ev.preventDefault();const node=M.PASSIVE_NODES[element.dataset.passiveNode],next=node.neighbors.map(id=>{const candidate=M.PASSIVE_NODES[id],x=candidate.x-node.x,y=candidate.y-node.y,dot=x*direction[0]+y*direction[1];return {id,dot,angle:Math.abs(x*direction[1]-y*direction[0])/Math.max(.001,dot),distance:Math.hypot(x,y)};}).filter(item=>item.dot>0).sort((a,b)=>a.angle-b.angle||a.distance-b.distance)[0];if(next)dialog.querySelector(`[data-passive-node="${next.id}"]`)?.focus({preventScroll:true});});
dialog.addEventListener('cancel',ev=>{if(panel==='passives'&&passiveSelection){ev.preventDefault();passiveSelection=null;renderPassiveDetail();}});
function renderCharacterStats(){
 const s=e.s,ratio=value=>(value??0).toFixed(2)+'×',int=value=>Math.round(value??0).toLocaleString('zh-TW');
 const rate=value=>percent(value??0),bonus=value=>(value>0?'+':'')+rate(value);
 const elapsed=Math.floor(c.expeditionSeconds??0),hours=Math.floor(elapsed/3600);
 const time=hours?`${hours} 小時 ${formatTime(elapsed%3600)}`:formatTime(elapsed);
 const elements=[['fire','火焰'],['cold','冰霜'],['lightning','閃電'],['poison','毒素']];
 const rows=items=>`<dl class="character-stat-rows">${items.map(([name,value,hint])=>`<div><dt${hint?` title="${hint}"`:''}>${name}</dt><dd>${value}</dd></div>`).join('')}</dl>`;
 const section=(glyph,title,items,extra='')=>`<section class="character-stat-section"><h3>${icon(glyph)}${title}</h3>${items.length?rows(items):''}${extra}</section>`;
 const elementalOffense=rows([['攻擊傷害',bonus(s.attackDamage)],['法術傷害',bonus(s.spellDamage)],['持續傷害',bonus(s.dotDamage)]])+rows([['物理','physical'],...elements.map(([key,label])=>[label,key])].map(([label,key])=>[
  `<span class="damage-type damage-${key}">${label}增傷</span>`,bonus(s.damageIncreases?.[key])
 ]).concat(elements.map(([key,label])=>[`<span class="damage-type damage-${key}">${label}穿透</span>`,rate(s.penetrations?.[key])]),elements.map(([key,label])=>{const attack=s.flatAttackDamage?.[key]||0,spell=s.flatSpellDamage?.[key]||0;return [`<span class="damage-type damage-${key}">追加${label}傷害</span>`,attack===spell?'+'+attack+'（攻擊／法術）':'攻擊 +'+attack+'／法術 +'+spell];})));
 const penalty=e.training?0:e.mode==='camp'?HERO_RESISTANCE_PENALTY[c.difficulty]||0:s.resistancePenalty||0;
 const resistances=`<p class="resistance-context">${e.training?'訓練場抗性':e.mode==='camp'?'所選難度遠征有效抗性':'目前有效抗性'} · 難度扣抗 ${rate(penalty)} · 上限 75%</p><div class="resistance-grid">${elements.map(([key,label])=>{
  const total=s.resistances?.[key]||0,effective=Math.max(-.5,Math.min(.75,total-(e.mode==='camp'?penalty:0)));
  return `<div><span class="damage-type damage-${key}">${label}抗性</span><b>${rate(effective)}</b></div>`;
 }).join('')}</div>`;
 $('#dialog-body').innerHTML=`<div class="character-stats">
  <div class="character-stats-hero">${heroPreviewMarkup(c,'stats-model')}<strong>${esc(c.name)}</strong><span>${M.CLASSES[c.cls].name} · Lv.${c.level}</span>${e.buffs.length?'<small>含目前藥水增益</small>':''}</div>
  ${section('flag','冒險紀錄',[
   ['累計擊殺',int(c.kills)],['累計遠征時間',time,'自本次更新後開始累計，僅計算遠征中未暫停的時間'],['通關次數',int(c.clears)],
   ...(M.isRingHero(c)?[['可用天賦點',int(M.ringPoints(c))]]:[['可用技能點',int(c.points)],['可用天賦點',int(M.passivePoints(c))]]),['裝備技能等級','+'+int(s.allSkills)]
  ])}
  ${section('sword','攻擊',[
   ['攻擊',int(s.atk)],['爆擊率',rate(s.crit)],['爆擊倍率',ratio(s.critDmg)],['攻擊速度',ratio(s.haste)],['施法速度',ratio(s.castSpeed)],
   ['技能範圍',bonus(s.skillArea)],['額外技能投射物','+'+int(s.extraProjectiles)],['技能持續時間',bonus(s.skillDuration)],['冷卻縮減',rate(s.cdr)]
  ],`<details class="character-stat-details"><summary>各類型增傷與元素穿透</summary>${elementalOffense}</details>`)}
  ${section('shield','防禦',[
   ['最大生命',int(s.hp)],['每秒回血',(s.lifeRegen??0).toFixed(1),'百分比生命再生依生命上限計算'],['護甲',int(s.armor),'護甲降低物理命中傷害'],['額外物理減傷',rate(s.physicalReduce)],
   ['法術減傷',rate(s.resist)],['閃避率',rate(e.gameplay?.assassin.evasionChance()??s.evasion??0),'所有敵方傷害判定；最高80%'],['格擋率',rate(s.block)],['格擋成功減傷',s.block>0?rate(s.blockReduction):'需裝備盾牌'],['移動速度',int(s.speed)],
   ['生命偷取',rate(s.leech),'本體命中，以及召喚／光環／持續傷害（50%效率）；共用每秒10%生命偷取預算'],['天賦普攻吸血',rate(s.basicLeech)],['天賦技能吸血',rate(s.skillLeech)]
  ],resistances)}
  ${bloodResource()?section('rune','血費',[
   ['技能資源','生命／狂怒'],['消耗降低',rate(s.manaCost),'裝備魔力消耗降低同樣降低血費；實際成本列於技能'],['固定減耗',s.flatManaCost],['血費額外減免',rate(s.lifeCostReduction)]
  ]):section('rune','魔力',[
   ['最大魔力',int(s.mana)],['每秒回魔',(s.manaRegen??0).toFixed(1)],['回魔速度加成',bonus(s.manaRegenPct)],['魔力消耗降低',rate(s.manaCost)],
   ['固定魔耗降低',s.flatManaCost],['魔力吸取',rate(s.manaLeech),`召喚／光環／持續傷害50%效率，共用每秒${MANA_SIPHON_RATE*100}%最大魔力的吸取預算`],['吸取上限',manaSiphonBudget(s).toFixed(1)+' MP／秒','吸魔、命中回魔與汲能天賦共用；多目標不重複增加上限'],['命中回魔',s.manaOnHit],['擊殺回魔',s.manaOnKill]
  ])}
  ${section('tree','召喚',[
   ['召喚容量',int(s.summonCapacity)],['額外爆擊率',rate(s.summonCrit)],['死亡爆破係數',rate(s.summonDeathNova)],['召喚物傷害',bonus(s.summonDamage-1)],
   ['召喚物生命',bonus(s.summonLife-1)],['召喚物攻速',bonus(s.summonHaste-1)],['召喚物移速',bonus(s.summonSpeed-1)]
  ])}
  ${section('chest','戰利品',[],lootRatesMarkup(s))}
  ${equipmentEffectsMarkup(false)}
 </div>`;
 paintCharacterPreviews();
}
function shieldStatsMarkup(item){if(item.slot!=='offhand'||!isShield(item))return '';const base=M.WEAPON_TYPES[item.weaponType],affixes=M.itemAffixes(item),bonus=key=>affixes.filter(a=>a.key===key).reduce((n,a)=>n+a.value,0),chance=base.block,effect=base.blockReduction??.5,extra=bonus('block')||bonus('blockReduction');return `<section class="shield-block-stats"><dl class="tooltip-base"><div><dt>基礎格擋率</dt><dd>${percent(chance)}</dd></div><div><dt>格擋成功減傷</dt><dd>${percent(effect)}</dd></div>${extra?`<div><dt>此盾總格擋率</dt><dd>${percent(Math.min(base.blockCap,chance+bonus('block')))}</dd></div><div><dt>此盾總格擋減傷</dt><dd>${percent(Math.min(.85,effect+bonus('blockReduction')))}</dd></div>`:''}</dl><small>成功格擋降低該次命中傷害，再由護盾吸收剩餘傷害。${base.name}格擋率上限 ${percent(base.blockCap)}，格擋減傷上限 85%。</small></section>`;}
function inventoryItem(id,from){if(['resource','flask-bag','flask-equipped','flask-stash'].includes(from)){const entry=Inventory.find(state,c.id,id,from);return entry?.item??entry;}return from==='stash'?state.stash.find(item=>item.id===id):from==='equipped'?Object.values(c.equipment).find(item=>item.id===id):c.bag.find(item=>item.id===id);}
function nativeInventoryDragEnabled(from){
 return panel==='inventory'&&!inventoryDiscardBatch&&!document.body.classList.contains('mobile-phone')||panel==='stash'&&from!=='resource';
}

function inventoryCell(item,from,slot=null,stashSlot=null){
 if(item&&(from==='resource'||Inventory.isFlask(item))){const entry=Inventory.find(state,c.id,item.id,from);return entry?carriedItemCell(entry,{selected:inventorySelection?.id===item.id&&inventorySelection?.from===from,draggable:nativeInventoryDragEnabled(from),flaskSlot:from==='flask-equipped'?slot:null}):'';}
 const batch=panel==='inventory'&&inventoryDiscardBatch,eligible=batch&&from==='bag';
 const selected=batch?!!eligible&&batch.ids.has(item?.id):inventorySelection?.id===item?.id&&inventorySelection?.from===from;
 const dropAttribute=stashSlot!==null?`data-stash-slot="${stashSlot}" data-stash-drop`:'data-bag-drop';
 if(!item)return `<div class="inventory-cell empty-cell" ${dropAttribute}="" role="gridcell" aria-label="${from==='stash'?'空倉庫格':'空背包格'}"></div>`;
 const svg=itemIcon(item),requirement=M.equipRequirement(c,item),ringChoice=item.slot==='ring'&&!requirement.ok&&requirement.reason.includes('請選擇');
 const batchMark=eligible?`<span class="inventory-batch-check" aria-hidden="true">${icon('check')}</span>`:'';
 return `<button type="button" class="inventory-cell ${item.uniqueID?'unique-cell ':''}${!requirement.ok&&!ringChoice&&from!=='equipped'?'level-restricted ':''}${from==='equipped'?'worn-cell':''} ${selected?'selected':''}" data-inventory-item="${esc(item.id)}" data-inventory-from="${from}" ${slot?`data-equip-slot="${slot}"`:`${dropAttribute}="${esc(item.id)}"`} draggable="${nativeInventoryDragEnabled(from)}" style="--item-color:${M.itemColor(item)}" aria-label="${esc(item.name)}，${itemFormText(item)}，${M.RARITIES[item.rarity].name}${from==='equipped'?'，已穿戴':''}" aria-pressed="${selected}">${icon(svg)}${armorClass(item)?`<small class="cell-armor-weight" title="${ARMOR_WEIGHTS[armorClass(item)].name}">${ARMOR_WEIGHTS[armorClass(item)].name[0]}</small>`:''}${item.uniqueID?'<i class="cell-unique" aria-label="獨特裝備">✺</i>':''}${!requirement.ok&&from==='bag'?'<small class="cell-requirement" title="'+esc(requirement.reason)+'">'+(c.level<(item.requiredLevel??1)?'Lv.'+item.requiredLevel:ringChoice?'選位':'衝突')+'</small>':''}${item.upgrade?`<b class="cell-upgrade">+${item.upgrade}</b>`:''}${item.set?'<i class="cell-set" aria-label="套裝">◆</i>':''}${item.grantedSkill?'<i class="cell-skill" aria-label="授予技能">✦</i>':''}${batchMark}<span class="cell-quality"></span></button>`;
}
function gearImplicitMarkup(item){
 const weight=ARMOR_WEIGHTS[armorClass(item)],weapon=M.WEAPON_TYPES[item.weaponType],lines=[],fmt=value=>(value>0?'+':'')+Math.round(value*1000)/10+'%';
 if(weight){const share=ARMOR_SHARES[item.slot];lines.push(`${weight.name} · 固有護甲 ×${weight.armor}（已計入白值）`);if(weight.move||weight.attack||weight.cast||weight.dodge)lines.push(`移速 ${fmt(weight.move*share)} · 攻速 ${fmt(weight.attack*share)} · 法速 ${fmt(weight.cast*share)} · 閃避冷卻 ${fmt(weight.dodge*share)}`);}
 if(item.weaponType==='towerShield')lines.push('大盾固有代價：移速 −6% · 攻速 −3% · 法速 −5% · 閃避冷卻 +8%');
 if(weapon?.kind==='melee')lines.push(`普攻半徑 ${weapon.range} · 扇形 ${Math.round(weapon.halfArc*360/Math.PI)}° · 至多 ${weapon.maxTargets} 敵 · 基礎間隔 ${weapon.interval.toFixed(2)} 秒`);
 if(item.weaponType==='bow')lines.push('副手搭配箭袋');
 if(item.weaponType==='quiver')lines.push('弓專用副手 · 固有攻擊速度 '+fmt(weapon.haste));
 if(item.slot==='cloak'){const aura=M.itemAffixes(item).find(a=>M.AFFIXES[a.key]?.aura===item.implicitAura);if(aura)lines.push('固有：'+M.affixText(aura));if(Object.values(c.equipment).some(i=>i.id===item.id)){const live=M.equipmentAuras(c).find(a=>a.id===item.implicitAura);if(live&&live.level!==aura?.value)lines.push('含套裝加成：目前同源光環生效等級 '+live.level);}}
 return lines.length?`<div class="gear-implicits">${lines.map(line=>`<p>${esc(line)}</p>`).join('')}</div>`:'';
}
function equipmentTooltipCard(item,caption){
 const u=1+(item.upgrade||0)*.12,counts=M.stats(c).sets,white=M.equipmentWhiteValues(item),worn=Object.values(c.equipment).some(i=>i.id===item.id),stance=M.dualState(c),weaponRule=worn&&item.slot==='weapon'&&stance.dual?(stance.titan?'持握套用：白值80% · 進攻詞條65% · 僅前2孔生效':item.id===c.equipment.offhand?.id?'副手進攻詞條以70%套用 · 普攻交替出手':'主副手交替出手，依各自白值結算'):'';
 return `<article class="equipment-tooltip-card" style="--item-color:${M.itemColor(item)}"><small class="tooltip-caption">${caption}</small><h3>${esc(item.name)}${item.upgrade?' +'+item.upgrade:''}</h3><div class="tooltip-tags">${item.uniqueID?'獨特裝備 · '+M.UNIQUES[item.uniqueID].name:M.RARITIES[item.rarity].name} · ${itemFormText(item)}<br>${itemLevelText(item)}${!worn&&!M.equipRequirement(c,item).ok?'<p class="requirement-unmet">'+esc(M.equipRequirement(c,item).reason)+'</p>':''}</div>${weaponRule?`<p class="weapon-stance-note">${weaponRule}</p>`:''}${item.uniqueID?`<p class="unique-lore">${M.UNIQUES[item.uniqueID].description} · 固定詞條／數值隨機</p>`:''}${['charm','ring'].includes(item.slot)?'<p class="charm-specialty">無基礎白值 · 使用此部位的專屬詞條範圍</p>':`<dl class="tooltip-base">${[['power','攻擊'],['hp','生命'],['armor','護甲'],['crit','爆擊率']].filter(([key])=>white[key]>0).map(([key,label])=>`<div><dt>${label}</dt><dd>+${key==='crit'?Math.round(white[key]*100)+'%':Math.round(white[key]*u)}</dd></div>`).join('')}</dl>`}${gearImplicitMarkup(item)}${shieldStatsMarkup(item)}${socketSummary(item)}${affixCountMarkup(item)}<ul class="tooltip-affixes">${(item.affixes||[]).map(affix=>`<li>${affixMarkup(affix,item)}</li>`).join('')||'<li class="muted">無額外詞條</li>'}</ul>${gemEffectsMarkup(item)}${item.grantedSkill?equipmentGrantMarkup(item):''}${item.set?`<section class="tooltip-set"><b>${M.SETS[item.set].name}套裝 · 目前 ${counts[item.set]||0} / 5</b>${M.SETS[item.set].effects.map((effect,i)=>`<p class="${(counts[item.set]||0)>=[2,3,5][i]?'active':''}">${[2,3,5][i]} 件：${esc(i===2?(SET_FIVE_DETAILS[item.set]||effect):effect)}</p>`).join('')}</section>`:''}<div class="tooltip-score">裝備戰力 <b>${M.itemScore(item)}</b>${item.upgrade?`<span>強化基礎數值 +${item.upgrade*12}%</span>`:''}</div></article>`;
}
function weaponSwapWarnings(item,slot){
 if(item.slot!=='weapon'&&item.slot!=='offhand')return [];
 const preview=structuredClone(c);
 if(!M.equip(preview,item.id,slot))return [];
 const available=new Set(M.availableSkills(preview));
 const configured=[
  ...M.skillLoadout(c).map((id,i)=>[id,SLOT_LABELS[i]]),[M.movementSkill(c),DODGE_LABEL],
  ...M.auraLoadout(c).map(id=>[id,'光環']),...Object.keys(c.summonSkills??{}).map(id=>[id,'召喚'])
 ];
 const lost=configured.filter(([id])=>id&&skillWeaponCompatible(c,id)&&(!available.has(id)||!skillWeaponCompatible(preview,id)))
  .map(([id,where])=>`${where} · ${M.ABILITIES[id]?.name??id}`);
 for(const basic of BasicAttacks.basicSequence(c))if(!BasicAttacks.basicSequence(preview).some(d=>d.id===basic.id))lost.push('普攻技能 · '+basic.name);
 return lost;
}
function gearInspectorColumn(item,caption,worn,target){
 const white=M.equipmentWhiteValues(item),up=1+(item.upgrade??0)*.12,required=item.requiredLevel??1;
 const stats=[['攻擊',Math.round(white.power*up)],['生命',Math.round(white.hp*up)],['護甲',Math.round(white.armor*up)],['爆擊',white.crit?percent(white.crit):0]];
 const req=worn?null:M.equipRequirement(c,item,target);
 const reason=req?.ok===false&&!req.reason.includes('請選擇')?req.reason:'';
 return `<div class="gear-column" style="--item-color:${M.itemColor(item)}">
  <div class="gear-column-label"><small class="gear-column-caption">${caption}</small>${icon(itemIcon(item))}</div>
  <div class="gear-column-title"><h3>${esc(item.name)}${item.upgrade?' +'+item.upgrade:''}</h3></div>
  <p class="gear-column-meta"><span>${itemFormText(item,true)}</span><span>物等 ${item.level} · <span class="${c.level<required?'requirement-unmet':''}">需求 ${required}</span></span></p>
  ${stats.some(([,value])=>value)?`<dl class="gear-white-values" aria-label="基礎白值">${stats.filter(([,value])=>value).map(([label,value])=>`<div><dt>${label}</dt><dd>${value}</dd></div>`).join('')}</dl>`:''}
  ${reason?`<p class="gear-requirement requirement-unmet">${esc(reason)}</p>`:''}
 </div>`;
}
function gearSetBonusesMarkup(items,detailed=false){
 const ids=[...new Set(items.map(item=>item?.set).filter(id=>M.SETS[id]))];
 if(!ids.length)return '';
 const {counts}=M.setBonuses(c);
 return `<div class="gear-set-bonuses" aria-label="套裝效果">${ids.map(id=>{
  const set=M.SETS[id],count=counts[id]??0,last=set.thresholds.at(-1);
  return `<section class="gear-set-bonus" data-gear-set="${esc(id)}" style="--set-color:${set.color}"><div><b>${esc(set.name)}</b><small>已穿戴 ${count} / ${last}</small></div>
  <ul>${set.thresholds.map((threshold,index)=>`<li class="${count>=threshold?'active':''}"><b>${threshold} 件</b><span>${esc(detailed&&threshold===last?(SET_FIVE_DETAILS[id]||set.effects[index]):set.effects[index])}</span></li>`).join('')}</ul></section>`;
 }).join('')}</div>`;
}
function gearInspectorFacts(item){
 const unique=M.UNIQUES[item.uniqueID],stance=M.dualState(c);
 const base=M.ITEM_BASES[item.baseTier]?.name??'舊版底材';
 const wearing=Object.values(c.equipment).some(gear=>gear.id===item.id);
 const grip=wearing&&item.slot==='weapon'&&stance.dual
  ?stance.titan?'持握套用 · 白值80% · 進攻詞條65% · 僅前2孔生效':item.id===c.equipment.offhand?.id?'副手進攻詞條以70%套用 · 普攻交替出手':'主副手交替出手，依各自白值結算'
  :'';
 return `<article class="gear-facts">
  <p class="gear-facts-meta">${M.RARITIES[item.rarity].name} · ${base} · 戰力 ${M.itemScore(item)}</p>
  ${unique?`<p class="unique-lore">${esc(unique.description)}</p>`:''}${grip?`<p class="weapon-stance-note">${grip}</p>`:''}
  ${gearImplicitMarkup(item)}${shieldStatsMarkup(item)}${socketSummary(item)}${gemEffectsMarkup(item)}
  ${item.grantedSkill?equipmentGrantMarkup(item):''}
  ${item.affixes?.length?`<details class="gear-roll-ranges"><summary>詞條說明與數值範圍</summary>${affixCountMarkup(item)}<ul class="tooltip-affixes">${item.affixes.map(a=>`<li>${affixMarkup(a,item)}</li>`).join('')}</ul></details>`:''}
 </article>`;
}
function inventoryDetails(item,from){
 const target=item.slot==='ring'?ringTarget:item.slot==='weapon'?weaponTarget:item.slot;
 const old=from==='bag'&&target?c.equipment[target]:null,columns=old?'has-comparison':'';
 const facts=gearInspectorView==='facts',sets=gearSetBonusesMarkup([item,old],facts);
 const equippedCaption=['offhand','ring_left','ring_right'].includes(target)?M.SLOT_NAMES[target]:'目前穿戴';
 return `<div class="gear-columns ${columns}">${gearInspectorColumn(item,from==='equipped'?'目前穿戴':from==='stash'?'共用倉庫':'背包物品',from==='equipped',target)}${old?gearInspectorColumn(old,equippedCaption,true,target):''}</div>
 ${facts?`${sets}<div class="gear-columns gear-facts-grid ${columns}">${gearInspectorFacts(item)}${old?gearInspectorFacts(old):''}</div>`:
  equipmentAffixesMarkup(item,old)+(sets?`<details class="gear-set-disclosure"><summary>套裝效果</summary>${sets}</details>`:'')}`;
}

function enhancementMarkup(item,slot){
 const noWhite=['charm','ring'].includes(item.slot),preview=M.enhancementPreview(state,c,slot,enhancementStones),combat=e.mode==='playing',stones=state.materials?.enhance||0;
 const reason=combat?'遠征中無法強化':noWhite?'此部位無白值可強化':item.locked?'請先解除裝備鎖定':preview.reason;
 return `<section class="enhancement-preview" aria-label="裝備強化預覽"><div class="enhancement-heading"><b>白值強化 <span>+${item.upgrade||0} → +${preview.target??Math.min(20,(item.upgrade||0)+1)}</span></b><small>上限 +20 · 詞條與寶石保留</small></div>${!noWhite&&(item.upgrade||0)>=10&&(item.upgrade||0)<20?`<label class="enhancement-stones">本次強化石 <input type="number" min="1" max="20" step="1" value="${enhancementStones}" data-enhancement-stones aria-label="本次強化石數量"><span>1–20 顆 · 持有 ${stones}</span></label>`:''}<div class="enhancement-live">${enhancementLiveMarkup(item,preview,reason,noWhite)}</div></section>`;
}
function enhancementLiveMarkup(item,preview,reason,noWhite){
 return `<div class="enhancement-chance">${noWhite?'戒指與護符沒有可強化白值':(item.upgrade||0)>=20?'已達強化上限':`成功率 <b>${Number(((preview.chance||0)*100).toFixed(1))}%</b> · ${preview.cost?.shards||0} 碎晶 ＋ ${preview.cost?.stones||0} 強化石`}</div><p>${(item.upgrade||0)<10?'＋1～＋10 必定成功，不消耗強化石。':'＋11～＋20 每多投入 1 顆強化石，成功率增加 5 百分點，最高 100%。失敗降 1 級，最低保留＋10；每次均消耗所列碎晶與強化石。'}</p>${reason?`<small class="enhancement-reason">${esc(reason)}</small>`:''}<button class="gold-btn" data-inventory-action="upgrade" ${reason||!preview.ok?'disabled':''}>${(item.upgrade||0)<10?'確定強化':'嘗試強化'}${!noWhite&&(item.upgrade||0)<20?'至＋'+preview.target:''}</button>`;
}
async function commitEnhancement(slot){
 if(panel!=='forge'||e.mode!=='camp'){toast('請在營地鐵匠處強化裝備。');return false;}
 const candidate=profileCandidate(),hero=candidate.characters[c.id],result=M.enhanceEquipment(candidate,hero,slot,enhancementStones);
 if(!result.ok){toast(result.reason||'無法強化，請確認裝備與素材。');refreshSelection();return false;}
 try{prepareCandidate(candidate);await persistProfile(candidate);}catch{toast('強化未儲存，原裝備、碎晶與強化石已保留。');return false;}
 state=candidate;c=state.characters[state.active];e.c=c;e.refresh();renderPanel();updateCharacter();updateHUD();toast(result.success?`強化成功：＋${result.before} → ＋${result.after}`:`強化失敗：＋${result.before} → ＋${result.after}，裝備已保留。`);return true;
}
function pickupFilterMarkup(){
 const rarities=c.pickupRarities??PICKUP_COLORS;
 return `<section class="pickup-filter" aria-label="裝備拾取篩選"><b>拾取裝備</b><div class="auto-loot-colors">${M.RARITIES.map((rarity,index)=>`<label style="--rarity-color:${rarity.color}"><input type="checkbox" data-pickup-color="${index}" ${rarities.includes(index)?'checked':''}><span>${rarity.name.split('・')[0]}</span></label>`).join('')}</div><small>勾選要拾取的顏色</small></section>`;
}
async function configurePickupFilter(input){
 const rarities=$$('[data-pickup-color]:checked').map(el=>Number(el.dataset.pickupColor));
 const selector=`[data-pickup-color="${input.dataset.pickupColor}"]`;
 if(!await commitInventory(hero=>{hero.pickupRarities=rarities;return true;},''))renderInventory();
 $(selector)?.focus({preventScroll:true});
}

function itemActionIcons(item,from){
 if(panel!=='merchant'||from!=='bag')return '';
 const protectedItem=item.locked||item.sockets?.some(Boolean)||valuableItem(item)&&valuableConsentID!==item.id;
 return `<div class="item-action-icons" role="group" aria-label="裝備操作"><button class="item-icon-action item-sell" data-inventory-action="sell" title="出售 · ${M.itemSellValue(item)} 金幣" aria-label="出售裝備，獲得 ${M.itemSellValue(item)} 金幣" ${protectedItem?'disabled':''}>${icon('coin')}</button><button class="item-icon-action item-salvage" data-inventory-action="salvage" title="分解 · +${2+item.rarity*3} 碎晶" aria-label="分解裝備，獲得 ${2+item.rarity*3} 碎晶" ${protectedItem?'disabled':''}>${icon('salvage')}</button></div>`;
}
function selectionMarkup(){
 const selected=inventorySelection,item=selected&&inventoryItem(selected.id,selected.from);if(!item)return '';
 if(selected.from==='resource')return resourceSelectionMarkup(item);
 if(Inventory.isFlask(item))return potionSelectionMarkup(item,selected.from);
 if(panel==='forge')return forgeItemMarkup(item,selected.from);
 const from=selected.from,ring=item.slot==='ring',target=ring?ringTarget:null,combat=e.mode==='playing';
 const handChoices=from==='bag'&&item.slot==='weapon'&&M.legalDualPair(c,c.equipment.weapon,item)?`<div class="ring-targets weapon-targets" role="group" aria-label="武器比較目標">${['weapon','offhand'].map(slot=>`<button data-weapon-target="${slot}" class="${weaponTarget===slot?'selected':''}" aria-pressed="${weaponTarget===slot}">${slot==='weapon'?'主手':'副手'}</button>`).join('')}</div>`:'';
 const stashAction=stashPlacementAction(item,from);
 const actions=from==='stash'?`<button class="gold-btn" data-withdraw="${esc(item.id)}" ${combat||c.bag.length>=150?'disabled':''}>取回背包</button>`:from==='bag'?`${ring?`<div class="ring-targets" role="group" aria-label="戒指穿戴與比較目標">${['ring_left','ring_right'].map(slot=>`<button data-ring-target="${slot}" class="${target===slot?'selected':''}" aria-pressed="${target===slot}"><b>${M.SLOT_NAMES[slot]}</b><span>${esc(c.equipment[slot]?.name||'空戒槽')}</span></button>`).join('')}</div>`:''}`:`<button class="outline-btn" data-inventory-action="unequip" ${c.bag.length>=150?'disabled':''}>卸下至背包</button>${item.grantedSkill?'<button class="outline-btn" data-panel="loadout">配置技能</button>':''}`;
 if(panel==='merchant')return `<div class="item-detail-toolbar"><b>選定裝備</b>${modalClose('data-clear-selection','關閉裝備詳情','sheet-close')}</div><div class="inventory-selection-actions">${itemActionIcons(item,from)}<small class="merchant-item-values">出售 ${M.itemSellValue(item)} 金 · 分解 ${2+item.rarity*3} 碎晶</small>${valuableItem(item)?`<label class="valuable-consent"><input type="checkbox" data-valuable-consent ${valuableConsentID===item.id?'checked':''}>允許出售／分解這件${item.rarity===5?'橘裝':item.set?'套裝':item.uniqueID?'獨特':'紅裝'}</label>`:''}</div><div class="inventory-selected-details">${equipmentTooltipCard(item,'待整理')}${gearSetBonusesMarkup([item])}</div>`;
 const warnings=panel==='inventory'&&from==='bag'?weaponSwapWarnings(item,item.slot==='weapon'?weaponTarget:item.slot):[];
 const phone=panel==='inventory'&&document.body.classList.contains('mobile-phone');
 const equipTarget=ring?target:item.slot==='weapon'?weaponTarget:null;
 const showEquip=phone&&from==='bag'&&!warnings.length;
 const canEquip=showEquip&&(!ring||!!target)&&M.equipRequirement(c,item,equipTarget).ok;
 const equipButton=showEquip?'<button class="gold-btn gear-quick-equip" data-inventory-action="equip" '+(canEquip?'':'disabled')+'>穿戴</button>':'';
 const discard=panel==='inventory'&&combat&&from==='bag',confirmDiscard=discard&&gearDiscardPending===item.id;
 const tabs=`<div role="group" aria-label="裝備詳情檢視">${[['rolls','詞條'],['facts','底材與效果']].map(([id,label])=>`<button type="button" data-gear-view="${id}" aria-pressed="${gearInspectorView===id}">${label}</button>`).join('')}</div>`;
 const discardControls=confirmDiscard
  ?'<div class="gear-discard-confirm"><button type="button" data-gear-discard="cancel">取消</button><button type="button" class="gear-discard-button" data-inventory-action="discard">確認銷毀</button></div>'
  :tabs+equipButton+(discard?'<button type="button" class="gear-discard-button" data-gear-discard="begin">銷毀</button>':'');
 const warning=warnings.length?`<div class="weapon-swap-warning"><b>換裝後停用</b><ul>${warnings.map(name=>`<li>${esc(name)}</li>`).join('')}</ul><button class="outline-btn" data-inventory-action="confirm-equip">仍要換裝</button></div>`:'';
 return `<div class="gear-inspector"><div class="gear-inspector-tools">${discardControls}${modalClose('data-clear-selection','關閉裝備詳情','sheet-close')}</div>
  ${confirmDiscard&&item.sockets?.some(Boolean)?'<small class="gear-discard-sockets">已鑲嵌的寶石也會銷毀</small>':''}
  ${handChoices||actions||stashAction?`<div class="inventory-selection-actions">${handChoices}${actions}${stashAction}</div>`:''}
 ${phone?warning:''}${inventoryDetails(item,from)}${phone?'':warning}</div>`;
}

function selectInventoryItem(id,from,preview=false){const item=inventoryItem(id,from);if(!item||panel==='inventory'&&inventoryDiscardBatch)return;const changed=inventorySelection?.id!==id||inventorySelection?.from!==from;inventoryPanelPinned=!preview;inventorySelection={id,from};if(changed){gearDiscardPending=null;gearInspectorView='rolls';weaponTarget='weapon';valuableConsentID=null;ringTarget=item.slot==='ring'&&!c.equipment.ring_left?'ring_left':item.slot==='ring'&&!c.equipment.ring_right?'ring_right':null;workshopTab=forgeTab==='craft'?'craft':'sockets';craftSelection=null;}$$('[data-inventory-item]').forEach(el=>{const selected=el.dataset.inventoryItem===id&&el.dataset.inventoryFrom===from;el.classList.toggle('selected',selected);el.setAttribute('aria-pressed',String(selected));});$('#inventory-selection').classList.add('has-selection');$('#inventory-selection').innerHTML=selectionMarkup();if(changed)$('#inventory-selection').scrollTop=0;positionInventoryInspector({alignMobileSelection:!preview});if((panel==='forge'||panel==='merchant')&&innerWidth<=700)$('#inventory-selection').scrollIntoView({block:'start'});}

function filteredEquipmentBag(){const words=bagSearch.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);return c.bag.filter(item=>{if(!(['all','equipment'].includes(bagFilter)||bagFilter.startsWith('rarity:')&&item.rarity===Number(bagFilter.slice(7))||bagFilter.startsWith('armor:')&&armorClass(item)===bagFilter.slice(6)||bagFilter==='set'&&item.set||bagFilter==='rare'&&item.rarity>=3||(M.ITEM_SLOTS||M.SLOTS).includes(bagFilter)&&item.slot===bagFilter))return false;if(!words.length)return true;const text=[item.name,M.SLOT_NAMES[item.slot],M.RARITIES[item.rarity].name,item.weaponType?M.WEAPON_TYPES[item.weaponType]?.name:'',item.set?M.SETS[item.set]?.name:'',item.uniqueID?'獨特':'',ARMOR_WEIGHTS[armorClass(item)]?.name||'',item.grantedSkill?M.ABILITIES[item.grantedSkill]?.name:'',...M.itemAffixes(item).map(a=>M.AFFIXES[a.key]?.label||'')].join(' ').toLocaleLowerCase();return words.every(word=>text.includes(word));});}
function heroPreviewMarkup(hero,extra=''){
 return `<canvas class="hero-model-preview ${extra}" data-hero-model="${esc(hero.id)}" width="240" height="220" role="img" aria-label="${esc(hero.name)}的角色外觀"></canvas>`;
}
function miniHeroPreviewMarkup(){return `<section class="mini-hero-preview" aria-label="角色裝備預覽">${heroPreviewMarkup(c)}</section>`;}
function paintCharacterPreviews(){
 for(const canvas of $$('canvas[data-hero-model]')){const hero=state.characters[canvas.dataset.heroModel]??(canvas.dataset.heroModel===c.id?c:null);if(hero)paintHeroPreview(canvas,hero,{angle:Math.PI/2});}
}
let previewFrame=0;
watchBplusImages(relative=>{
 if(!/^(?:heroes|gear)\//.test(relative)||previewFrame)return;
 previewFrame=requestAnimationFrame(()=>{previewFrame=0;paintCharacterPreviews();});
});
function unifiedCell(entry,stashSlot=null){
 if(!entry)return inventoryCell(null,'bag');
 if(entry.kind==='equipment')return inventoryCell(entry.item,entry.from,null,stashSlot);
 return carriedItemCell(entry,{selected:inventorySelection?.id===entry.id&&inventorySelection?.from===entry.from,
  draggable:nativeInventoryDragEnabled(entry.from),stashSlot});
}
function storageCells(entries,used,capacity,from){
 const occupiedHidden='<div class="inventory-cell filtered-slot" data-filtered-slot aria-hidden="true"></div>';
 return entries.map(entry=>unifiedCell(entry)).join('')+occupiedHidden.repeat(Math.max(0,used-entries.length))+inventoryCell(null,from).repeat(Math.max(0,capacity-used));
}
function bagCapacityLabel(){const {equipment,flask}=Inventory.BAG_CAPACITIES;return `裝備 ${c.bag.length}/${equipment} · 藥水 ${c.flaskBag.length}/${flask}`;}
function filteredInventoryBag(entries){
 const kinds=Object.keys(Inventory.CATEGORIES);
 if(kinds.includes(bagFilter)){
  const found=Inventory.filter(entries,bagSearch,bagFilter),gear=new Set(filteredEquipmentBag().map(i=>i.id));
  return entries.filter(entry=>entry.kind==='equipment'?['all','equipment'].includes(bagFilter)&&gear.has(entry.id):found.some(e=>e.id===entry.id));
 }
 const ids=new Set(filteredEquipmentBag().map(i=>i.id));return entries.filter(entry=>entry.kind==='equipment'&&ids.has(entry.id));
}
function inventoryBagResults(entries){
 const matches=filteredInventoryBag(entries),total=entries.length,filtered=!!bagSearch.trim()||bagFilter!=='all';
 const emptyText=!matches.length
  ?(filtered?'沒有符合的道具。':'此分類沒有道具。'):'';
 return {
  total,emptyText,
  matchCount:filtered?matches.length+' / '+total:'',
  cells:matches.map(entry=>unifiedCell(entry)).join('')+inventoryCell(null,'bag').repeat(Math.max(0,12-matches.length))
 };
}
function updateBagSearch(input){
 if(panel!=='inventory'||!input.isConnected||input.value===bagSearch)return;
 bagSearch=input.value;
 hideItemTooltip();
 clearInventoryDrag();
 const entries=InventoryPages.entriesForPage(state,c.id,activeInventoryPage());
 const {cells,emptyText,matchCount}=inventoryBagResults(entries);
 const count=$('.bag-match-count'),empty=$('#bag-search-empty');
 count.textContent=matchCount;
 count.hidden=!matchCount;
 empty.textContent=emptyText;
 empty.hidden=!emptyText;
 $('.inventory-view .backpack-grid[data-bag-drop]').innerHTML=cells;
 positionInventoryInspector();
}
function resourceSelectionMarkup(entry){
 const camp=e.mode==='camp',destination={forge:'鐵匠',sets:'印記收藏家',quests:'遠征傳送門',merchant:'商人',talents:'燼脈圖'}[entry.usePanel],canUse=entry.kind!=='voucher';
 return `<div class="item-detail-toolbar">${modalClose('data-clear-selection','關閉道具詳情','sheet-close')}</div><article class="supply-details" style="--item-color:${entry.color}"><div class="supply-detail-name">${icon(entry.icon)}<h3>${esc(entry.name)}</h3></div><dl><div><dt>持有數量</dt><dd>${entry.quantity.toLocaleString('zh-TW')}</dd></div><div><dt>歸屬</dt><dd>${entry.shared?'所有角色共用':esc(c.name)}</dd></div></dl><p>${esc(entry.description)}</p>${canUse?`<button class="outline-btn" data-item-use="${entry.usePanel}" data-item-kind="${entry.kind}" data-item-key="${esc(entry.key)}" data-item-difficulty="${entry.difficulty||''}" ${camp?'':'disabled'}>前往${destination}</button>`:''}${camp?'':'<small>返回營地後使用。</small>'}</article>`;
}
function flaskTargetChoices(attribute){
 return c.flaskItems.map((flask,i)=>`<button type="button" ${attribute}="${i}" class="${flaskTarget===i?'selected':''}" aria-pressed="${flaskTarget===i}">${FLASK_KEYS[i]} · ${flask?esc(M.FLASKS[flask.type].short):'空格'}</button>`).join('');
}
function potionSelectionMarkup(item,from){
 const worn=from==='flask-equipped',camp=e.mode==='camp',def=M.flaskForItem(item),slot=c.flaskItems.findIndex(i=>i?.id===item.id),inStash=from==='flask-stash';
 const targets=from==='flask-bag'||worn?`<div class="potion-equip-targets" aria-label="選擇藥水位置">${flaskTargetChoices('data-potion-target')}</div><button class="gold-btn" data-potion-equip="${esc(item.id)}" ${!camp||worn&&slot===flaskTarget?'disabled':''}>${worn?'移至':'裝配至'} ${FLASK_KEYS[flaskTarget]} 鍵</button>`:'';
 const transfer=stashPlacementAction(item,from)+(panel==='stash'&&inStash?`<button class="outline-btn" data-potion-transfer="withdraw" data-potion-item="${esc(item.id)}" ${!camp||c.flaskBag.length>=Inventory.BAG_CAPACITIES.flask?'disabled':''}>取回背包</button>`:'');
 const phone=panel==='inventory'&&document.body.classList.contains('mobile-phone');
 const comparison=flaskComparisonMarkup(def,!worn&&!inStash?M.flaskForItem(c.flaskItems[flaskTarget]):null,worn?'藥水槽 '+(slot+1):inStash?'共用倉庫':'背包藥水');
 const actions=`<div class="potion-detail-actions">${panel==='inventory'?targets:''}${transfer}<button class="text-btn" data-item-use="flasks" ${!camp||inStash?'disabled':''}>品質／詞條與出售</button></div>`;
 return `<div class="item-detail-toolbar">${modalClose('data-clear-selection','關閉藥水詳情','sheet-close')}</div><div class="potion-inventory-details">${phone?actions:''}${comparison}${phone?'':actions}${camp?'':'<p class="potion-combat-note">返回營地後可替換藥水。</p>'}</div>`;
}
function potionEquipmentMarkup(){return `<section class="potion-equipment" aria-label="配置藥水"><div><b>藥水</b></div><div class="potion-equipment-slots">${c.flaskItems.map((item,index)=>item?inventoryCell(item,'flask-equipped',index):`<button type="button" class="inventory-cell empty-equipment empty-potion" data-flask-equip="${index}" data-empty-flask-slot="${index}" aria-label="${FLASK_KEYS[index]}，未配置藥水">${icon('potion')}<kbd class="potion-shortcut">${FLASK_KEYS[index]}</kbd><small>空</small></button>`).join('')}</div></section>`;}
function wornEquipmentMarkup(){
 const s=M.stats(c),cl=M.CLASSES[c.cls];
 return `<section class="paperdoll-pane worn-equipment"><div class="inventory-pane-title"><h3>穿戴裝備</h3><small>${M.STANCE_NAMES[M.dualState(c).mode]}</small></div>${panel==='inventory'?miniHeroPreviewMarkup():''}<div class="paperdoll" style="--class-color:${cl.color}">${M.SLOTS.map(slot=>{const item=c.equipment[slot];return `<div class="paperdoll-slot slot-${slot}"><span class="paperdoll-slot-label">${M.SLOT_NAMES[slot]}</span>${item?inventoryCell(item,'equipped',slot):`<button class="inventory-cell empty-equipment" data-equip-slot="${slot}" aria-label="${M.SLOT_NAMES[slot]}，尚未穿戴">${icon(slot==='weapon'?equipmentIcon({slot:'weapon'},STARTING_WEAPONS[c.cls]?.type):M.SLOT_ICONS[slot])}<small>${slot==='offhand'&&c.equipment.weapon&&M.weaponDefinition(c.equipment.weapon,c.cls).hands===2?(c.talents.b_titan_grip?'可雙持雙手劍':'雙手占用'):M.dualState(c).dual?'副手武器':'空'}</small></button>`}</div>`;}).join('')}</div><div class="paperdoll-stats"><div><small>${M.dualState(c).dual?'主手 / 副手':'攻擊'}</small><b>${M.dualState(c).dual?s.atk+' / '+s.offhandAtk:s.atk}</b></div><div><small>生命</small><b>${s.hp}</b></div><div><small>護甲</small><b>${Math.round(s.armor)}</b></div></div>${panel==='inventory'?potionEquipmentMarkup():''}</section>`;
}
function activeInventoryPage(){return inventoryPageByHero.get(c.id)??1;}
function selectInventoryPage(id,filter='all'){
 const page=Number(id);
 if(!InventoryPages.PAGE_IDS.includes(page))return;
 inventoryPageByHero.set(c.id,page);bagFilter=filter;bagSearch='';inventorySelection=null;inventoryPanelPinned=false;
 renderInventory();
 $(`[data-inventory-page="${page}"]`)?.focus({preventScroll:true});
}
function inventoryPagesMarkup(pages,groups,active){
 const tabs=pages.map(({id,name})=>`<button type="button" data-inventory-page="${id}" class="${id===active?'selected':''}" aria-pressed="${id===active}" title="${esc(name)}">${esc(name)} <small>${groups[id].length}</small></button>`);
 return `<nav class="inventory-category-pages" aria-label="背包分頁">${tabs.join('')}</nav>`;
}
function inventoryPageRenameMarkup({id,customName}){
 return `<form class="inventory-page-rename" data-inventory-page-rename="${id}" hidden><label>分頁名稱 <input name="pageName" type="text" autocomplete="off" maxlength="${InventoryPages.MAX_PAGE_NAME*2}" value="${esc(customName)}" placeholder="分頁 ${id}"></label><button type="submit" class="outline-btn">儲存</button><button type="button" data-cancel-inventory-page-rename class="text-btn">取消</button></form>`;
}
const movableBagSource=from=>['bag','flask-bag','resource'].includes(from);
async function moveInventoryItemToPage(id,from,target){
 if(panel!=='inventory'||!movableBagSource(from)||InventoryPages.pageForItem(c,id)===target)return false;
 const destination=InventoryPages.pages(c).find(page=>page.id===target);
 if(!destination)return false;
 return commitInventory((hero,profile)=>InventoryPages.moveToPage(profile,hero.id,id,target),`已移到「${destination.name}」。`,null,{refresh:false});
}
function setInventoryRenameVisible(visible){
 const form=$('[data-inventory-page-rename]'),button=$('[data-rename-inventory-page]');
 if(!form||!button)return;
 form.hidden=!visible;button.setAttribute('aria-expanded',String(visible));
 if(visible){const field=form.elements.pageName;field.focus();field.select();}
 else button.focus({preventScroll:true});
}
function inventoryBatchActionsMarkup(){
 const batch=inventoryDiscardBatch;
 if(!batch){
  return e.mode==='playing'&&c.bag.length?'<button type="button" class="outline-btn" data-inventory-discard="start" aria-label="多選銷毀">多選</button>':'';
 }
 const count=batch.ids.size;
 return `<button type="button" class="text-btn" data-inventory-discard="cancel">取消</button><button type="button" class="gear-discard-button" data-inventory-discard="${batch.confirming?'confirm':'review'}" ${count?'':'disabled'}>${batch.confirming?'確認銷毀':'銷毀'} ${count} 件</button>`;
}
function setInventoryDiscardMode(active){
 if(active&&(panel!=='inventory'||e.mode!=='playing'||!c.bag.length))return;
 closeInventoryInspector();lastInventoryTap=null;
 inventoryDiscardBatch=active?{ids:new Set(),confirming:false}:null;
 renderInventory();
 const selector=active?'[data-inventory-discard="cancel"]':'[data-inventory-discard="start"]';
 $(selector)?.focus({preventScroll:true});
}
function toggleInventoryDiscardItem(cell){
 const batch=inventoryDiscardBatch,id=cell.dataset.inventoryItem;
 const selected=!batch.ids.delete(id);
 if(selected)batch.ids.add(id);
 batch.confirming=false;
 cell.classList.toggle('selected',selected);
 cell.setAttribute('aria-pressed',String(selected));
 $('.inventory-batch-actions').innerHTML=inventoryBatchActionsMarkup();
}
async function discardInventoryEquipment(ids){
 if(panel!=='inventory'||e.mode!=='playing')return false;
 const batch=inventoryDiscardBatch;
 const changed=await commitInventory((hero,profile)=>{
  if(!Inventory.discardBackpackGear(profile,hero.id,ids,e.mode))return false;
  const checkpoint=profile.rifts?.activeRun?.checkpoint?.hero;
  if(checkpoint?.id===hero.id)InventoryPages.pruneAssignments(checkpoint);
  return true;
 },'',null,{refresh:false});
 if(changed){
  gearDiscardPending=null;
  if(batch&&inventoryDiscardBatch===batch)setInventoryDiscardMode(false);
 }
 return changed;
}
$('#dialog-body').addEventListener('click',event=>{
 if(panel!=='inventory')return;
 const cell=event.target.closest('[data-inventory-item]');
 if(cell&&inventoryDiscardBatch){
  event.stopPropagation();
  if(cell.dataset.inventoryFrom==='bag')toggleInventoryDiscardItem(cell);
  return;
 }
 if(event.target.closest('[data-rename-inventory-page]'))setInventoryRenameVisible(true);
 if(event.target.closest('[data-cancel-inventory-page-rename]'))setInventoryRenameVisible(false);
 const single=event.target.closest('[data-gear-discard]')?.dataset.gearDiscard;
 if(single){
  gearDiscardPending=single==='begin'?inventorySelection?.id:null;
  refreshSelection();
  $(single==='begin'?'[data-gear-discard="cancel"]':'[data-gear-discard="begin"]')?.focus({preventScroll:true});
  return;
 }
 const action=event.target.closest('[data-inventory-discard]')?.dataset.inventoryDiscard;
 if(action==='start'||action==='cancel')setInventoryDiscardMode(action==='start');
 const batch=inventoryDiscardBatch;
 if(action==='review'&&batch?.ids.size){
  batch.confirming=true;
  $('.inventory-batch-actions').innerHTML=inventoryBatchActionsMarkup();
  $('[data-inventory-discard="cancel"]')?.focus({preventScroll:true});
 }
 if(action==='confirm'&&batch?.confirming&&batch.ids.size)void discardInventoryEquipment(batch.ids);
});
$('#dialog-body').addEventListener('submit',async event=>{
 const form=event.target;
 if(panel!=='inventory'||!form.hasAttribute('data-inventory-page-rename'))return;
 event.preventDefault();
 const id=Number(form.dataset.inventoryPageRename),name=InventoryPages.cleanPageName(form.elements.pageName.value);
 if(name===null){toast(`分頁名稱最多 ${InventoryPages.MAX_PAGE_NAME} 字，請移除特殊控制符號。`);return;}
 if(await commitInventory(hero=>InventoryPages.renamePage(hero,id,name),'',inventorySelection,{refresh:false})){
  $('[data-rename-inventory-page]')?.focus({preventScroll:true});
 }
});
function renderInventory(){
 hideItemTooltip();clearInventoryDrag();
 const previousBag=$('.inventory-view .backpack-scroll'),bagScroll=previousBag?.scrollTop??0;
 const page=activeInventoryPage(),pages=InventoryPages.pages(c),groups=InventoryPages.groupedEntries(state,c.id);
 const {total,emptyText,matchCount,cells}=inventoryBagResults(groups[page]);
 if(inventorySelection&&!inventoryItem(inventorySelection.id,inventorySelection.from))inventorySelection=null;
 const filterOptions=[
  ...Object.entries(Inventory.CATEGORIES),
  ...M.RARITIES.map((rarity,index)=>['rarity:'+index,rarity.name]),
  ...Object.entries(ARMOR_WEIGHTS).map(([id,weight])=>['armor:'+id,weight.name]),
  ...M.ITEM_SLOTS.map(slot=>[slot,M.SLOT_NAMES[slot]])
 ];
 const filters=filterOptions.map(([id,label])=>`<option value="${id}" ${bagFilter===id?'selected':''}>${label}</option>`).join('');
 $('#dialog-body').innerHTML=`<div class="inventory-view inventory-view-${inventoryTab}${inventoryDiscardBatch?' inventory-discard-mode':''}"><nav class="inventory-view-tabs" aria-label="行囊分頁">${[['bag','背包'],['wear','穿戴']].map(([id,label])=>'<button data-inventory-tab="'+id+'" class="'+(inventoryTab===id?'selected':'')+'" aria-pressed="'+(inventoryTab===id)+'">'+label+'</button>').join('')}</nav><div class="inventory-workbench"><div class="inventory-bag-column"><div class="inventory-topline"><div class="inventory-currencies">${currencyCountersMarkup(Inventory.currencies(state,c.id))}<span class="inventory-capacity">${bagCapacityLabel()}</span></div></div>${pickupFilterMarkup()}<section class="backpack-pane"><div class="inventory-page-header">${inventoryPagesMarkup(pages,groups,page)}<div class="inventory-pane-title"><h3>${icon('bag')}道具<b>${total}</b></h3><div class="inventory-page-actions"><button type="button" class="text-btn" data-rename-inventory-page aria-expanded="false">重新命名</button><button type="button" class="text-btn" data-inventory-sort>整理</button></div></div></div>${inventoryPageRenameMarkup(pages.find(tab=>tab.id===page))}<div class="backpack-toolbar"><select id="bag-filter" aria-label="篩選道具">${filters}</select><input id="bag-search" class="bag-search" type="search" autocomplete="off" value="${esc(bagSearch)}" placeholder="搜尋道具、詞條、用途" aria-label="搜尋背包道具"><div class="inventory-batch-actions">${inventoryBatchActionsMarkup()}</div><span class="bag-match-count"${matchCount?'':' hidden'}>${matchCount}</span></div><p id="bag-search-empty" class="inventory-search-empty" role="status"${emptyText?'':' hidden'}>${emptyText}</p><div class="backpack-scroll"><div class="backpack-grid unified-item-grid" role="grid" aria-label="道具背包" data-bag-drop="">${cells}</div></div></section></div><div class="inventory-worn-column">${wornEquipmentMarkup()}</div></div><section id="inventory-selection" class="inventory-selection ${inventorySelection?'has-selection':''}" aria-live="polite">${selectionMarkup()}</section></div>`;
 const bag=$('.inventory-view .backpack-scroll');
 if(bag)bag.scrollTop=bagScroll;
 paintCharacterPreviews();
}
async function commitInventory(mutate,message,selectionAfter=inventorySelection,{refresh=true}={}){
 const candidate=profileCandidate(),hero=candidate.characters[c.id];if(!hero||!mutate(hero,candidate)){toast('無法移動道具，請確認位置或背包空間。');return false;}
 Inventory.preserveReplacedPositions(c,hero);
 InventoryPages.pruneAssignments(hero);
 try{prepareCandidate(candidate);await persistProfile(candidate);}catch{toast('裝備變更未儲存，物品仍保留在原位。');return false;}
 state=candidate;c=state.characters[state.active];e.c=c;if(refresh)e.refresh();inventorySelection=selectionAfter;if(!selectionAfter)inventoryPanelPinned=false;hideItemTooltip();renderPanel();updateCharacter(refresh);if(message)toast(typeof message==='function'?message(c):message);return true;
}
function inventoryAction(action,id=inventorySelection?.id,from=inventorySelection?.from,slot=null){
 const confirmWeapon=action==='confirm-equip';
 if(confirmWeapon){action='equip';inventoryClickUntil=0;}
 if(!['inventory','stash','forge','merchant'].includes(panel))return false;
 if(['sell','salvage','sell-colors','salvage-colors'].includes(action)&&(panel!=='merchant'||e.mode!=='camp'))return false;
 if(['equip','unequip'].includes(action)&&panel!=='inventory')return false;
 const item=id?inventoryItem(id,from):null;
 if(action==='sort')return commitInventory(hero=>{delete hero.inventoryOrder;Inventory.sortEquipment(hero.bag);return true;},'背包已依品質整理。');
 if(action==='salvage-colors'){const preview=M.salvagePreview(c,c.sellRarities,includeValuable);if(!preview?.count)return false;return commitInventory(hero=>!!M.salvageByRarity(hero,hero.sellRarities,includeValuable),`已分解 ${preview.count} 件裝備，獲得 ${preview.shards} 碎晶。`,null);}
 if(action==='sell-colors'){const preview=M.salePreview(c,c.sellRarities,includeValuable);if(!preview?.count)return false;return commitInventory(hero=>!!M.sellByRarity(hero,hero.sellRarities,includeValuable),`已出售 ${preview.count} 件裝備，獲得 ${preview.gold} 金幣。`,null);}
 if(!item||from==='resource'||Inventory.isFlask(item))return false;
 if(action==='discard')return from==='bag'&&gearDiscardPending===id&&discardInventoryEquipment([id]);
 if(['sell','salvage'].includes(action)&&from==='bag'&&valuableItem(item)&&valuableConsentID!==id){toast('請先勾選此件高價裝備的出售／分解確認。');return false;}if(action==='sell'&&from==='bag')return commitInventory(hero=>M.sell(hero,id),`已出售 ${item.name}，獲得 ${M.itemSellValue(item)} 金幣。`,null);
 if(action==='equip'&&from==='bag'){if(item.slot==='weapon'&&!slot&&inventorySelection?.id===id)slot=weaponTarget;if(item.slot==='ring'&&!slot){slot=inventorySelection?.id===id?ringTarget:null;if(!slot)slot=!c.equipment.ring_left?'ring_left':!c.equipment.ring_right?'ring_right':null;if(!slot){selectInventoryItem(id,from);toast('請先選擇左戒指或右戒指，查看比較後替換。');return false;}}const req=M.equipRequirement(c,item,slot);if(!req.ok){toast(req.reason);return false;}}
 if(action==='equip'&&from==='bag'){
  if(!confirmWeapon&&weaponSwapWarnings(item,slot).length){
   selectInventoryItem(id,from);if(slot&&item.slot==='weapon'){weaponTarget=slot;refreshSelection();}
   const warning=$('.weapon-swap-warning');warning?.scrollIntoView({block:'nearest'});warning?.querySelector('button')?.focus({preventScroll:true});
   return false;
  }
  return commitInventory(hero=>M.equip(hero,id,slot),hero=>{const index=M.skillLoadout(hero).indexOf(item.grantedSkill);return `已穿戴 ${item.name}。`+(item.grantedSkill?(index>=0?`${M.ABILITIES[item.grantedSkill].name} 已配置 ${SLOT_LABELS[index]}。`:'請至對應技能配置頁設定。'):'');},null);
 }
 if(action==='unequip'&&from==='equipped')return commitInventory(hero=>{const key=Object.keys(hero.equipment).find(key=>hero.equipment[key]?.id===id);return key&&M.unequip(hero,key);},`已卸下 ${item.name}。`,null);
 if(action==='salvage'&&from==='bag')return commitInventory(hero=>M.salvage(hero,id),'裝備已分解。',null);
 if(action==='upgrade'&&panel==='forge')return commitEnhancement(from==='equipped'?Object.keys(c.equipment).find(key=>c.equipment[key]?.id===id):id);
 if(action==='deposit'&&from==='bag')return moveStash('deposit',id);
 return false;
}
function fineInventoryPointer(){return matchMedia('(hover:hover) and (pointer:fine)').matches;}
function positionInventoryInspector({alignMobileSelection=false}={}){
 const desktop=fineInventoryPointer()&&innerWidth>=900;
 const phone=document.body.classList.contains('mobile-phone');
 dialog.classList.toggle('equipment-inspector-layout',desktop&&['inventory','stash'].includes(panel));
 const sheet=$('#inventory-selection'),gear=!!sheet?.querySelector('.gear-inspector'),potion=!!sheet?.querySelector('.potion-inventory-details');
 const itemDetail=gear||potion;
 sheet?.classList.toggle('is-item-comparison',itemDetail);
 sheet?.classList.toggle('is-gear-comparison',gear);
 const focused=dialog.open&&panel==='inventory'&&itemDetail&&!desktop&&!phone,wasFocused=dialog.classList.contains('inventory-detail-focus');
 if(focused!==wasFocused){
  const body=$('#dialog-body');
  if(focused)inventoryReturnScroll=body.scrollTop;
  dialog.classList.toggle('inventory-detail-focus',focused);
  if(panel==='inventory'&&dialog.open)body.scrollTop=focused?0:inventoryReturnScroll;
 }
 if(!sheet||!dialog.open)return;
 const comparison=!!sheet.querySelector('.gear-columns.has-comparison,.flask-comparison-table thead th:nth-child(3)');
 sheet.classList.toggle('has-comparison',comparison);
 sheet.setAttribute('role','region');sheet.setAttribute('aria-label',(potion?'藥水':'裝備')+(comparison?'比較':'詳情')+'與操作');
 if(panel==='inventory'){
  const worn=$('.inventory-worn-column'),view=$('.inventory-view');
  if(phone){
   const bag=view.querySelector('.backpack-scroll');
   if(inventorySelection&&(sheet.parentElement!==bag||alignMobileSelection)){
    const scrollTop=bag.scrollTop;
    if(sheet.parentElement!==bag)bag.prepend(sheet);
    sheet.style.setProperty('--comparison-top',scrollTop+'px');
    bag.scrollTop=scrollTop;
   }else if(!inventorySelection&&sheet.parentElement===bag){
    view.append(sheet);
    sheet.style.removeProperty('--comparison-top');
   }
  }else if(desktop&&itemDetail){
   // Keep the source in place while inspecting, including the worn equipment cells.
   const fromWorn=['equipped','flask-equipped'].includes(inventorySelection?.from);
   const dock=fromWorn?$('.backpack-pane'):worn;
   if(dock&&dock.firstElementChild!==sheet)dock.prepend(sheet);
  }else if(desktop&&worn){if(worn.lastElementChild!==sheet)worn.append(sheet);}
  else if(view&&sheet.parentElement!==view)view.append(sheet);
  return;
 }
 if(!fineInventoryPointer())return;
 const box=dialog.getBoundingClientRect(),header=dialog.querySelector('.dialog-header').getBoundingClientRect();
 dialog.style.setProperty('--equipment-sticky-top',Math.round(header.height+8)+'px');
 dialog.style.setProperty('--inspector-top',Math.max(12,Math.round(header.bottom+8))+'px');
 const bag=desktop&&$('.stash-layout');
 if(bag){
  // Fix the panel beside the selected cell; never reserve an empty column or cover the source.
  const source=$$('[data-inventory-item]').find(cell=>cell.dataset.inventoryItem===inventorySelection?.id&&cell.dataset.inventoryFrom===inventorySelection?.from),bounds=source?.getBoundingClientRect();
  const inset=Math.max(12,Math.ceil(box.left+12)),edge=Math.min(innerWidth-12,Math.floor(box.right-12)),desired=comparison?620:340;
  const cell=bounds&&bounds.width?bounds:bag.getBoundingClientRect(),leftSpace=cell.left-inset-10,rightSpace=edge-cell.right-10,onLeft=leftSpace>=desired||leftSpace>=rightSpace;
  const width=Math.min(desired,Math.max(280,onLeft?leftSpace:rightSpace)),left=Math.max(inset,Math.min(edge-width,onLeft?cell.left-10-width:cell.right+10));
  dialog.style.setProperty('--inspector-width',Math.floor(width)+'px');
  dialog.style.setProperty('--inspector-left',Math.round(left)+'px');
  dialog.style.setProperty('--inspector-right','auto');
 }else{
  dialog.style.removeProperty('--inspector-left');dialog.style.removeProperty('--inspector-width');
  dialog.style.setProperty('--inspector-right',Math.max(12,Math.round(innerWidth-box.right+12))+'px');
  if(comparison)dialog.style.setProperty('--inspector-width',Math.min(680,innerWidth-24)+'px');
 }
}
function closeInventoryInspector(suppress=0,restoreFocus=false){
 clearTimeout(itemTooltipTimer);inventoryPanelPinned=false;gearDiscardPending=null;
 const selected=inventorySelection;
 inventorySelection=null;
 if(suppress)inventoryHoverUntil=Date.now()+suppress;
 const sheet=$('#inventory-selection');
 if(sheet){sheet.classList.remove('has-selection');sheet.innerHTML=selectionMarkup();positionInventoryInspector();}
 for(const el of $$('[data-inventory-item]')){
  el.classList.remove('selected');el.setAttribute('aria-pressed','false');
  if(restoreFocus&&el.dataset.inventoryItem===selected?.id&&el.dataset.inventoryFrom===selected.from)el.focus({preventScroll:true});
 }
}
function hideItemTooltip(){clearTimeout(itemTooltipTimer);}
function showItemTooltip(cell){clearTimeout(itemTooltipTimer);if(!['inventory','stash'].includes(panel)||!fineInventoryPointer()||inventoryDiscardBatch||inventoryDrag||inventoryPanelPinned||Date.now()<inventoryHoverUntil)return;if(panel==='inventory'&&innerWidth<900&&['bag','equipped','flask-bag','flask-equipped'].includes(cell.dataset.inventoryFrom))return;const reveal=()=>{if(!cell.isConnected||inventoryDrag||inventoryPanelPinned||Date.now()<inventoryHoverUntil)return;const switching=inventorySelection&&(inventorySelection.id!==cell.dataset.inventoryItem||inventorySelection.from!==cell.dataset.inventoryFrom),settle=switching?260:120,idle=Date.now()-inventoryPointerMovedAt;if(idle<settle){itemTooltipTimer=setTimeout(reveal,settle-idle);return;}itemTooltipTimer=null;selectInventoryItem(cell.dataset.inventoryItem,cell.dataset.inventoryFrom,true);};itemTooltipTimer=setTimeout(reveal,160);}
function suppressDragInspector(){inventoryClickUntil=Date.now()+500;inventoryHoverUntil=inventoryClickUntil;closeInventoryInspector();}
function clearInventoryDrag(){
 const pointer=touchInventoryDown?.pointer,body=$('#dialog-body');
 inventoryDrag=null;touchInventoryDown=null;lastInventoryTap=null;
 if(pointer!==undefined&&body.hasPointerCapture(pointer))body.releasePointerCapture(pointer);
 dialog.classList.remove('inventory-dragging');
 dialog.querySelector('.inventory-drag-preview')?.remove();
 $$('.drop-compatible,.drop-hover,.drop-rejected,.drag-source,.drag-source-lifted').forEach(el=>el.classList.remove('drop-compatible','drop-hover','drop-rejected','drag-source','drag-source-lifted'));
}
function createInventoryDragPreview(cell){
 const bounds=cell.getBoundingClientRect();
 if(!bounds.width||!bounds.height)return null;
 const preview=cell.cloneNode(true);
 for(const {name} of [...preview.attributes])if(name.startsWith('data-'))preview.removeAttribute(name);
 preview.classList.remove('selected','drag-source','drag-source-lifted','drop-hover','drop-rejected','drop-compatible','drop-complete');
 preview.classList.add('inventory-drag-preview');
 preview.draggable=false;
 preview.tabIndex=-1;
 preview.setAttribute('aria-hidden','true');
 Object.assign(preview.style,{left:bounds.left+'px',top:bounds.top+'px',width:bounds.width+'px',height:bounds.height+'px'});
 cell.after(preview);
 return {preview,bounds};
}
function setInventoryDragPreview(event,cell){
 const transfer=event.dataTransfer;
 if(typeof transfer.setDragImage!=='function')return false;
 const clone=createInventoryDragPreview(cell);
 if(!clone)return false;
 const {preview,bounds}=clone;
 const offset=(point,start,size)=>Math.round(Math.max(0,Math.min(size,point-start)));
 // Snapshot the full cell before dimming the source; remove the temporary copy before paint.
 try{transfer.setDragImage(preview,offset(event.clientX,bounds.left,bounds.width),offset(event.clientY,bounds.top,bounds.height));}
 catch{preview.remove();return false;}
 requestAnimationFrame(()=>preview.remove());
 return true;
}
function quickInventory(cell){if(inventoryDiscardBatch)return;if(cell.dataset.inventoryFrom==='resource'){selectInventoryItem(cell.dataset.inventoryItem,'resource');return;}if(Inventory.isFlask(inventoryItem(cell.dataset.inventoryItem,cell.dataset.inventoryFrom))){selectInventoryItem(cell.dataset.inventoryItem,cell.dataset.inventoryFrom);return;}inventoryAction(cell.dataset.inventoryFrom==='bag'?'equip':'unequip',cell.dataset.inventoryItem,cell.dataset.inventoryFrom);}
// Keep the grid DOM intact on a single click, so a native double-click reaches the same cell.
$('#dialog-body').addEventListener('dblclick',ev=>{const cell=ev.target.closest('[data-inventory-item]');if(panel==='inventory'&&cell&&Date.now()>inventoryClickUntil){ev.preventDefault();quickInventory(cell);}});
$('#dialog-body').addEventListener('keydown',ev=>{const cell=ev.target.closest('[data-inventory-item]');if(cell&&panel==='inventory'&&!inventoryDiscardBatch&&ev.key==='Enter'&&!ev.repeat){ev.preventDefault();quickInventory(cell);}});
$('#dialog-body').addEventListener('pointerdown',ev=>{
 if(ev.pointerType!=='touch'||panel!=='inventory'||inventoryDiscardBatch||touchInventoryDown||storageTransactions)return;
 const cell=ev.target.closest('[data-inventory-item]');
 if(cell)touchInventoryDown={cell,pointer:ev.pointerId,id:cell.dataset.inventoryItem,from:cell.dataset.inventoryFrom,x:ev.clientX,y:ev.clientY};
});
$('#dialog-body').addEventListener('pointermove',ev=>{
 const down=touchInventoryDown;
 if(!down||down.pointer!==ev.pointerId||!document.body.classList.contains('mobile-phone'))return;
 if(!inventoryDrag){
  const dx=Math.abs(ev.clientX-down.x),dy=Math.abs(ev.clientY-down.y);
  // Bag cells share a vertical scroller. A sideways drag lifts the item.
  const farEnough=down.cell.closest('.backpack-scroll')?dx>=12&&dx>=dy:Math.hypot(dx,dy)>=12;
  if(!farEnough||!down.cell.isConnected)return;
  const clone=createInventoryDragPreview(down.cell);
  if(!beginInventoryDrag(down.cell)){clone?.preview.remove();return;}
  if(clone){
   down.preview=clone.preview;
   down.offsetX=down.x-clone.bounds.left;down.offsetY=down.y-clone.bounds.top;
   down.cell.classList.add('drag-source-lifted');
  }
  ev.currentTarget.setPointerCapture(ev.pointerId);
 }
 if(down.preview){
  down.preview.style.left=ev.clientX-down.offsetX+'px';
  down.preview.style.top=ev.clientY-down.offsetY+'px';
 }
 highlightInventoryDrop(inventoryDropTarget(document.elementFromPoint(ev.clientX,ev.clientY)));
});
function cancelTouchInventory(ev){
 if(touchInventoryDown?.pointer!==ev.pointerId)return;
 if(inventoryDrag){suppressDragInspector();clearInventoryDrag();}
 else touchInventoryDown=null;
 lastInventoryTap=null;
}
$('#dialog-body').addEventListener('pointercancel',cancelTouchInventory);
$('#dialog-body').addEventListener('lostpointercapture',ev=>{if(ev.target===ev.currentTarget)cancelTouchInventory(ev);});
$('#dialog-body').addEventListener('pointerup',ev=>{
 const down=touchInventoryDown;
 if(!down||down.pointer!==ev.pointerId)return;
 if(inventoryDrag){
  const target=inventoryDropTarget(document.elementFromPoint(ev.clientX,ev.clientY));
  void finishInventoryDrop(target);
  return;
 }
 touchInventoryDown=null;
 const cell=ev.target.closest('[data-inventory-item]');
 if(panel!=='inventory'||!cell||cell!==down.cell||Math.hypot(ev.clientX-down.x,ev.clientY-down.y)>12){lastInventoryTap=null;return;}
 const now=Date.now();
 if(lastInventoryTap?.id===down.id&&lastInventoryTap.from===down.from&&now-lastInventoryTap.time<360){
  inventoryClickUntil=now+450;lastInventoryTap=null;quickInventory(cell);
 }else lastInventoryTap={id:down.id,from:down.from,time:now};
});
dialog.addEventListener('pointermove',ev=>{if(ev.pointerType!=='touch')inventoryPointerMovedAt=Date.now();});
dialog.addEventListener('pointerover',ev=>{if(ev.pointerType==='touch')return;if(ev.target.closest('#inventory-selection')){clearTimeout(itemTooltipTimer);return;}const cell=ev.target.closest('[data-inventory-item]');if(cell&&!cell.contains(ev.relatedTarget))showItemTooltip(cell);});
dialog.addEventListener('pointerout',ev=>{const cell=ev.target.closest('[data-inventory-item]'),sheet=ev.target.closest('#inventory-selection');if(cell&&!cell.contains(ev.relatedTarget)){clearTimeout(itemTooltipTimer);inventoryPanelPinned=false;}if(sheet&&!sheet.contains(ev.relatedTarget))inventoryPanelPinned=false;});
dialog.addEventListener('pointerdown',ev=>{if(ev.pointerType!=='touch'&&ev.target.closest('#inventory-selection')){inventoryPanelPinned=true;clearTimeout(itemTooltipTimer);}});
dialog.addEventListener('focusin',ev=>{if(ev.target.closest('#inventory-selection')){clearTimeout(itemTooltipTimer);return;}const cell=ev.target.closest('[data-inventory-item]');if(cell)showItemTooltip(cell);});
dialog.addEventListener('keydown',ev=>{const cell=ev.target.closest('[data-inventory-item]');if(cell&&ev.key==='F2'){ev.preventDefault();selectInventoryItem(cell.dataset.inventoryItem,cell.dataset.inventoryFrom);$('#inventory-selection button')?.focus();return;}if(panel==='inventory'&&ev.key==='/'&&!ev.target.matches('input,textarea,select,[contenteditable]')){ev.preventDefault();$('#bag-search')?.focus();return;}if(cell?.closest('.backpack-grid')&&['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(ev.key)){ev.preventDefault();const grid=cell.closest('.backpack-grid'),cells=[...grid.querySelectorAll('[data-inventory-item]')],index=cells.indexOf(cell),columns=getComputedStyle(grid).gridTemplateColumns.trim().split(/\s+/).length,delta={ArrowLeft:-1,ArrowRight:1,ArrowUp:-columns,ArrowDown:columns}[ev.key],next=cells[Math.max(0,Math.min(cells.length-1,index+delta))];if(next){next.focus({preventScroll:true});next.scrollIntoView({block:'nearest'});selectInventoryItem(next.dataset.inventoryItem,next.dataset.inventoryFrom);}}});
dialog.addEventListener('cancel',ev=>{
 const focused=document.activeElement;
 if(composingBagSearches.has(focused)){ev.preventDefault();return;}
 if(panel==='inventory'&&inventoryDiscardBatch){ev.preventDefault();setInventoryDiscardMode(false);return;}
 if(!['inventory','stash'].includes(panel)||!fineInventoryPointer()&&!dialog.classList.contains('inventory-detail-focus'))return;
 if(panel==='inventory'&&$('[data-inventory-page-rename]:not([hidden])')){
  ev.preventDefault();setInventoryRenameVisible(false);return;
 }
 if(focused?.id==='bag-search'&&bagSearch){
  ev.preventDefault();
  focused.value='';
  updateBagSearch(focused);
  return;
 }
 if(inventorySelection){ev.preventDefault();closeInventoryInspector(250,true);}
});
dialog.addEventListener('scroll',ev=>{if(!ev.target.closest?.('#inventory-selection'))clearTimeout(itemTooltipTimer);},true);
window.addEventListener('resize',positionInventoryInspector);
dialog.addEventListener('close',()=>{if(!dialog.open){inventoryPanelPinned=false;inventoryDiscardBatch=null;gearDiscardPending=null;dialog.classList.remove('inventory-detail-focus');clearTimeout(itemTooltipTimer);}});
function inventoryDropTarget(element){
 if(!element)return null;
 if(element.closest('[data-filtered-slot]'))return null;
 if(panel==='inventory')return element.closest('[data-inventory-page],[data-flask-equip],[data-equip-slot],[data-bag-drop]');
 if(panel==='stash'&&!element.closest('.stash-supplies'))return element.closest('[data-stash-slot],[data-stash-page],[data-bag-drop]');
 return null;
}
function stashDropPlacement(drag,target,item){
 if(e.mode!=='camp'||!item||stashMoving)return null;
 const stored=['stash','flask-stash'].includes(drag.from),bagged=['bag','flask-bag'].includes(drag.from);
 if(!stored&&!bagged)return null;
 if(stored&&target.hasAttribute('data-bag-drop')){
  const full=Inventory.isFlask(item)?c.flaskBag.length>=Inventory.BAG_CAPACITIES.flask:c.bag.length>=Inventory.BAG_CAPACITIES.equipment;
  return full?null:{action:'withdraw'};
 }
 const slots=Inventory.stashSlotIds(state),page=Number(target.dataset.stashPage);
 const slot=target.hasAttribute('data-stash-slot')?Number(target.dataset.stashSlot)
  :Number.isInteger(page)&&page!==stashPage?firstEmptyStashSlot(slots,page):-1;
 if(!Number.isInteger(slot)||slot<0||slot>=slots.length)return null;
 if(stored&&slots[slot]!==drag.id)return {action:'move',slot};
 if(bagged&&slots[slot]===null)return {action:'deposit',slot};
 return null;
}
function beginInventoryDrag(cell){
 const stash=panel==='stash';
 const from=cell.dataset.inventoryFrom,item=inventoryItem(cell.dataset.inventoryItem,from);
 if(!item||panel==='inventory'&&inventoryDiscardBatch||panel!=='inventory'&&!stash||stash&&(e.mode!=='camp'||from==='resource'))return false;
 inventoryDrag={id:item.id,from,hero:c.id};
 lastInventoryTap=null;
 closeInventoryInspector();
 cell.classList.add('drag-source');
 dialog.classList.add('inventory-dragging');
 if(panel==='inventory'&&movableBagSource(from))$$('[data-inventory-page]').forEach(tab=>{
  tab.classList.toggle('drop-compatible',Number(tab.dataset.inventoryPage)!==InventoryPages.pageForItem(c,item.id));
 });
 if(panel==='inventory'&&Inventory.isFlask(item))$$('[data-flask-equip]').forEach(el=>el.classList.toggle('drop-compatible',e.mode==='camp'&&Number(el.dataset.flaskEquip)!==c.flaskItems.findIndex(f=>f?.id===item.id)));
 if(panel==='inventory'&&from==='bag')$$('[data-equip-slot]').forEach(el=>el.classList.toggle('drop-compatible',slotMatches(item,el.dataset.equipSlot)));
 return true;
}
$('#dialog-body').addEventListener('dragstart',ev=>{
 const cell=ev.target.closest('[data-inventory-item]');
 if(!cell||!ev.dataTransfer)return;
 if(!nativeInventoryDragEnabled(cell.dataset.inventoryFrom)||!beginInventoryDrag(cell)){ev.preventDefault();return;}
 ev.dataTransfer.setData('application/x-emberfall-item',inventoryDrag.id);
 ev.dataTransfer.effectAllowed='move';
 cell.classList.toggle('drag-source-lifted',setInventoryDragPreview(ev,cell));
});
function validInventoryDrop(drag,target){
 if(!drag||drag.hero!==c.id||!target)return false;
 const item=inventoryItem(drag.id,drag.from);
 if(!item)return false;
 if(panel==='stash')return !!stashDropPlacement(drag,target,item);
 if(target.hasAttribute('data-inventory-page')){
  return movableBagSource(drag.from)&&Number(target.dataset.inventoryPage)!==InventoryPages.pageForItem(c,drag.id);
 }
 if(target.hasAttribute('data-flask-equip')){
  return Inventory.isFlask(item)&&e.mode==='camp'&&Number(target.dataset.flaskEquip)!==c.flaskItems.findIndex(f=>f?.id===item.id);
 }
 if(Inventory.isFlask(item)){
  const other=inventoryItem(target.dataset.bagDrop,'flask-bag');
  return target.hasAttribute('data-bag-drop')&&(drag.from==='flask-bag'||e.mode==='camp'&&drag.from==='flask-equipped'&&!!other);
 }
 if(target.hasAttribute('data-equip-slot')){
  const slot=target.dataset.equipSlot;
  return drag.from==='bag'&&slotMatches(item,slot)&&M.equipRequirement(c,item,slot).ok;
 }
 return drag.from==='resource'||drag.from==='bag'||c.bag.length<Inventory.BAG_CAPACITIES.equipment;
}
function highlightInventoryDrop(target){
 const previous=dialog.querySelector('.drop-hover,.drop-rejected');
 const valid=validInventoryDrop(inventoryDrag,target);
 if(previous!==target)previous?.classList.remove('drop-hover','drop-rejected');
 target?.classList.toggle('drop-hover',valid);
 target?.classList.toggle('drop-rejected',!valid);
 return valid;
}
$('#dialog-body').addEventListener('dragover',ev=>{
 if(!inventoryDrag)return;
 const target=inventoryDropTarget(ev.target),valid=highlightInventoryDrop(target);
 if(!target)return;
 ev.preventDefault();
 ev.dataTransfer.dropEffect=valid?'move':'none';
});
function flashInventoryDrop(selector){const target=dialog.querySelector(selector);if(target){target.classList.add('drop-complete');setTimeout(()=>target.classList.remove('drop-complete'),650);}}
async function finishInventoryDrop(target){
 const drag=inventoryDrag,valid=validInventoryDrop(drag,target);
 suppressDragInspector();
 clearInventoryDrag();
 if(!valid)return;
 const movedItem=`[data-inventory-item="${CSS.escape(drag.id)}"]`;
 if(panel==='stash'){
  const placement=stashDropPlacement(drag,target,inventoryItem(drag.id,drag.from));
  if(placement&&await moveStash(placement.action,drag.id,placement.slot))flashInventoryDrop(movedItem);
  return;
 }
 let moved=false,mark=`.backpack-grid ${movedItem}`;
 if(target.hasAttribute('data-inventory-page')){
  const page=Number(target.dataset.inventoryPage);
  moved=await moveInventoryItemToPage(drag.id,drag.from,page);
  mark=`[data-inventory-page="${page}"]`;
 }else if(target.hasAttribute('data-flask-equip')){
  moved=await equipInventoryPotion(drag.id,Number(target.dataset.flaskEquip));mark=`[data-flask-equip="${target.dataset.flaskEquip}"]`;
 }else if(drag.from==='flask-equipped'){
  const other=inventoryItem(target.dataset.bagDrop,'flask-bag'),slot=c.flaskItems.findIndex(i=>i?.id===drag.id);
  if(other)moved=await equipInventoryPotion(other.id,slot);
 }else if(target.hasAttribute('data-equip-slot')){
  const slot=target.dataset.equipSlot;
  moved=await inventoryAction('equip',drag.id,drag.from,slot);
  mark=`.paperdoll [data-equip-slot="${slot}"]`;
 }else if(drag.from==='equipped'){
  moved=await inventoryAction('unequip',drag.id,drag.from);
 }else{
  const before=target.getAttribute('data-bag-drop')||null;
  if(before!==drag.id)moved=await commitInventory((hero,profile)=>Inventory.reorder(profile,hero.id,drag.id,before),'',null);
 }
 if(moved)flashInventoryDrop(mark);
}
$('#dialog-body').addEventListener('drop',ev=>{
 if(!inventoryDrag)return;
 ev.preventDefault();
 void finishInventoryDrop(inventoryDropTarget(ev.target));
});
$('#dialog-body').addEventListener('dragend',()=>{if(inventoryDrag){suppressDragInspector();clearInventoryDrag();}});
function saveNamespaceNotice(){return '';}
function lootRatesText(s){s=e.mode==='playing'?e.lootStats():s;const q=Math.max(0,s.drop*100),roomR=Math.max(0,(s.roomRarityBonus||0)*100),r=Math.max(0,(s.rarityFind||0)*100)+roomR,effective=q/(q+100),difficulty=c.difficulty,level=M.areaLevel(c,difficulty,e.room||0),base=[0,.025,.03,.035][difficulty];return `本房裝備 Lv.${M.equipmentDropBand(difficulty,e.room||0).min}–${M.equipmentDropBand(difficulty,e.room||0).max}，橘裝須物品50級；Q +${q.toFixed(1)}% → 有效 +${(effective*100).toFixed(1)}% 件數；一般怪 ${(M.dropChance(s,base*HORDE_RULES.equipment)*100).toFixed(2)}%、菁英／首領額外各 ${(M.dropChance(s,base*10)*100).toFixed(2)}%。R +${r.toFixed(1)}%${roomR?`（含房間+${roomR.toFixed(0)}百分點）`:""} 只改善顏色。房間裝備成功率×${(s.roomLootMultiplier||1).toFixed(2)}。${['normal','elite','boss'].map(source=>`${{normal:'一般',elite:'菁英',boss:'首領額外'}[source]}：${M.roomLootQuality(difficulty,source,r,e.room||0).map((chance,i)=>M.RARITIES[i].name.split('・')[0]+(chance*100).toFixed(3)+'%').join('／')}`).join('；')}。首領另保底1件黃裝以上。`;}
function lootRatesMarkup(s){const current=e.mode==='playing'?e.lootStats():s,waveDiff=e.mode==='playing'&&(Math.abs((current.drop||0)-(s.drop||0))>1e-9||Math.abs((current.rarityFind||0)-(s.rarityFind||0))>1e-9),waveNote=waveDiff?`<p class="loot-wave-note" data-loot-wave-note>本波：裝備掉落率 +${((current.drop||0)*100).toFixed(1)}%／稀有度 +${((current.rarityFind||0)*100).toFixed(1)}%；身上：+${((s.drop||0)*100).toFixed(1)}%／+${((s.rarityFind||0)*100).toFixed(1)}%。換裝提高於下波生效，降低立即生效；暫時增益已計入。</p>`:'',r=Math.max(0,((current.rarityFind||0)+(current.roomRarityBonus||0))*100),difficulty=c.difficulty,level=M.areaLevel(c,difficulty,e.room||0);return `<details class="loot-rates"><summary>Q +${Math.round(s.drop*100)}% · R +${Math.round(r)}% · 查看實際掉落率</summary>${waveNote}<p>${esc(lootRatesText(s))}</p><div class="loot-rate-table"><table><thead><tr><th>已掉裝備的顏色</th>${M.RARITIES.map(r=>`<th style="color:${r.color}">${r.name.split('・')[0]}</th>`).join('')}</tr></thead><tbody>${[['normal','一般'],['elite','菁英'],['boss','首領額外'],['boss','首領保底',true]].map(([source,name,guaranteed])=>`<tr><th>${name}</th>${M.roomLootQuality(difficulty,source,r,e.room||0,!!guaranteed).map(chance=>`<td>${(chance*100).toFixed(3)}%</td>`).join('')}</tr>`).join('')}</tbody></table></div><p>依本房掉落區間與來源等級加成加權計算；Q不提高保底件數，R不提高同色條數、T階或數值。橘裝需${M.DIFFICULTIES[2].name}／${M.DIFFICULTIES[3].name}且ilvl至少50。</p></details>`;}
function marksMarkup(){return `<div class="marks-balances" aria-label="帳號共用印記">${[1,2,3].map(diff=>`<span>${M.DIFFICULTIES[diff].name}印記 <b data-mark-balance="${diff}">${state.marks[String(diff)]||0}</b></span>`).join('')}<small>首領各給1／2／3枚 · 所有角色共用</small></div>`;}

function setOptionMarkup(key,name,help){const choices=M.setOptionChoices(c,key),active=(M.setBonuses(c).counts[key]||0)>=5,value=c.setOptions[key],camp=e.mode==='camp';return `<label class="set-option"><span>${name}<small>${!active?'尚未穿戴5件 · 可先設定':value?'5件生效中':'穿戴5件 · 尚未選擇'}</small></span><select data-set-option="${key}" aria-label="${name}" ${!camp||!choices.length?'disabled':''}><option value="">不啟用</option>${choices.map(choice=>`<option value="${choice.id}" ${value===choice.id?'selected':''}>${esc(choice.name)}</option>`).join('')}</select><p>${help}${!choices.length?' 尚無符合資格的技能。':''}${!camp?' 僅限營地修改。':''}</p></label>`;}
function collectorCatalogMarkup(counts){
 const found=id=>counts[id]>=5||(state.gearCollection??[]).filter(key=>key.startsWith('s:'+id+':')).length>=5;
 const options=[
  found('covenant')?setOptionMarkup('covenant','聖約常駐光環','5 件後使所選光環以 60% 強度自動常駐。'):null,
  found('evolution')?setOptionMarkup('evolution','元素進化','5 件後進化所選召喚物的攻擊形態。'):null
 ].filter(Boolean);
 const settings=options.length?`<section class="set-options" aria-label="套裝技能設定">${options.join('')}</section>`:'';
 return settings+setCatalogMarkup(state,{counts,fiveDetails:SET_FIVE_DETAILS});
}
function respecExchangeMarkup(){
 const preview=M.respecStonePreview(state,c.id,e.mode);
 return `<section class="respec-exchange"><div><b>${icon('rune')} 返脈石 <small>持有 ${preview.count}</small></b><p>營地使用 1 顆可重置天賦。通過${M.DIFFICULTIES[1].name}第二章後開放兌換。</p>${preview.ok?'':`<small>${esc(preview.reason)}</small>`}</div><button type="button" class="gold-btn" data-redeem-respec ${preview.ok?'':'disabled'}>兌換 · ${preview.cost} 枚${M.DIFFICULTIES[1].name}印記</button></section>`;
}
function renderSets(){
 const counts=M.setBonuses(c).counts;
 $('#dialog-body').innerHTML=`<div class="sets-view">${marksMarkup()}${serviceTabs([['catalog','套裝圖鑑'],['respec','返脈石']],setsView,'sets-view','收藏家')}${setsView==='respec'?respecExchangeMarkup():collectorCatalogMarkup(counts)}</div>`;
}
async function configureSetChoice(key,value){if(e.mode!=='camp'){toast('套裝設定僅限營地修改。');renderSets();return false;}const candidate=profileCandidate(),result=M.configureSetOption(candidate.characters[c.id],key,value);if(!result.ok){toast(result.reason||'無法選擇此技能。');renderSets();return false;}try{prepareCandidate(candidate);await persistProfile(candidate);}catch{toast('設定未儲存，原選擇已保留。');renderSets();return false;}state=candidate;c=state.characters[state.active];e.c=c;e.refresh();renderSets();updateCharacter(false);updateHUD();toast('套裝設定已儲存。');return true;}

const stashPageCount=Math.ceil(M.STASH_CAPACITY/Inventory.STASH_PAGE_SIZE);
let stashMoving=false;
function firstEmptyStashSlot(slots,page){
 const start=page*Inventory.STASH_PAGE_SIZE;
 const offset=slots.slice(start,start+Inventory.STASH_PAGE_SIZE).indexOf(null);
 return offset<0?-1:start+offset;
}
function stashPlacementAction(item,from){
 if(panel!=='stash'||!['bag','flask-bag','stash','flask-stash'].includes(from))return '';
 const stored=from==='stash'||from==='flask-stash',disabled=e.mode!=='camp'||!stored&&Inventory.stashCount(state)>=M.STASH_CAPACITY;
 return `<button type="button" class="outline-btn" data-stash-place="${esc(item.id)}" data-stash-place-from="${from}" ${disabled?'disabled':''}>${stored?'移至倉庫格':'存至倉庫格'}</button>`;
}
function stashControls(count){
 const pages=Array.from({length:stashPageCount},(_,page)=>`<button type="button" data-stash-page="${page}" aria-label="第 ${page+1} 頁" aria-pressed="${stashPage===page}">${page+1}</button>`).join('');
 return `<div class="stash-controls"><div class="stash-categories" role="group" aria-label="倉庫分頁">${pages}</div><button type="button" class="text-btn" data-stash-sort title="依品質整理此頁，保留空格" ${count<2?'disabled':''}>整理本頁</button>${stashPlacement?'<div class="stash-placement"><span role="status">選擇倉庫格</span><button type="button" class="text-btn" data-stash-cancel>取消</button></div>':''}</div>`;
}
function renderStash(){
 hideItemTooltip();clearInventoryDrag();dialog.classList.toggle('equipment-inspector-layout',fineInventoryPointer()&&innerWidth>=900);
 if(inventorySelection&&!inventoryItem(inventorySelection.id,inventorySelection.from))inventorySelection=null;
 if(stashPlacement&&(stashPlacement.hero!==c.id||!inventoryItem(stashPlacement.id,stashPlacement.from)))stashPlacement=null;
 const bag=Inventory.list(state,c.id,{includeShared:false}).filter(entry=>entry.item),{equipment,flask}=Inventory.BAG_CAPACITIES;
 const start=stashPage*Inventory.STASH_PAGE_SIZE,slots=Inventory.stashGrid(state).slice(start,start+Inventory.STASH_PAGE_SIZE);
 const grid=slots.map((entry,index)=>entry?unifiedCell(entry,start+index):`<button type="button" class="inventory-cell empty-cell" data-stash-slot="${start+index}" aria-label="空倉庫格 ${index+1}" ${stashPlacement?'':'tabindex="-1"'}></button>`).join('');
 const supplies=Inventory.stashEntries(state).filter(entry=>!entry.item);
 const supplyGrid=supplies.length?`<details class="stash-supplies"><summary>共用道具</summary><div class="backpack-grid unified-item-grid" role="grid" aria-label="共用道具">${supplies.map(entry=>unifiedCell(entry)).join('')}</div></details>`:'';
 const bagPane=`<section class="stash-pane" data-stash-pane="bag" data-bag-drop><div class="stash-section-heading"><h3>${icon('bag')}角色背包</h3><span>${bagCapacityLabel()}</span></div><div class="backpack-grid unified-item-grid" role="grid" aria-label="角色背包" data-storage-slots>${storageCells(bag,bag.length,equipment+flask,'bag')}</div></section>`;
 const placing=stashPlacement?`data-stash-placing="${stashPlacement.from.endsWith('stash')?'move':'deposit'}"`:'';
 const storedPane=`<section class="stash-pane" data-stash-pane="stash"><div class="stash-section-heading"><h3>${icon('chest')}共用倉庫</h3><span>${Inventory.stashCount(state)} / ${M.STASH_CAPACITY}</span></div><div class="backpack-grid unified-item-grid" role="grid" aria-label="共用倉庫第 ${stashPage+1} 頁" data-storage-slots ${placing}>${grid}</div>${supplyGrid}</section>`;
 $('#dialog-body').innerHTML=`${stashControls(slots.filter(Boolean).length)}<div class="stash-layout">${bagPane}${storedPane}</div><section id="inventory-selection" class="inventory-selection ${inventorySelection?'has-selection':''}" aria-live="polite">${selectionMarkup()}</section>`;
}
function selectSharedStashPage(page){
 if(!Number.isInteger(page)||page<0||page>=stashPageCount||stashMoving)return;
 stashPage=page;closeInventoryInspector();renderStash();
 dialog.scrollTop=0;$('#dialog-body').scrollTop=0;
 $(`[data-stash-page="${page}"]`)?.focus({preventScroll:true});
}
async function sortSharedStash(){
 if(e.mode!=='camp'||stashMoving)return;
 stashMoving=true;
 try{if(await commitInventory((_hero,profile)=>Inventory.sortStashPage(profile,stashPage,e.mode),'此頁已依品質整理。',inventorySelection,{refresh:false}))$('[data-stash-sort]')?.focus({preventScroll:true});}
 finally{stashMoving=false;}
}
async function moveStash(action,id,targetSlot=null){
 if(panel!=='stash'||e.mode!=='camp'){toast('請在營地倉庫存取道具。');return false;}
 if(stashMoving)return false;
 const deposit=action==='deposit';
 if(deposit&&targetSlot===null){
  const slots=Inventory.stashSlotIds(state),firstOnPage=firstEmptyStashSlot(slots,stashPage);
  targetSlot=firstOnPage<0?slots.indexOf(null):firstOnPage;
  if(targetSlot<0){toast('倉庫已滿。');return false;}
 }
 const potion=action!=='move'&&Inventory.find(state,c.id,id,deposit?'flask-bag':'flask-stash');
 const previousPage=stashPage,previousPlacement=stashPlacement;
 if(targetSlot!==null)stashPage=Math.floor(targetSlot/Inventory.STASH_PAGE_SIZE);
 stashPlacement=null;
 stashMoving=true;
 let success=false;
 try{
  success=await commitInventory((hero,profile)=>{
   if(action==='move')return Inventory.moveStashSlot(profile,id,targetSlot,e.mode);
   if(potion)return Inventory.transferPotion(profile,hero.id,id,action,e.mode,targetSlot).ok;
   return deposit?M.deposit(profile,hero.id,id,targetSlot):M.withdraw(profile,hero.id,id);
  },action==='move'?'':deposit?'已存入共用倉庫。':'已取回此角色的背包。',null,{refresh:false});
  return success;
 }finally{
  stashMoving=false;
  if(!success){stashPage=previousPage;if(panel==='stash')stashPlacement=previousPlacement;}
 }
}
$('#dialog-body').addEventListener('click',async ev=>{
 const target=ev.target.closest('[data-stash-slot]');
 if(panel!=='stash'||!stashPlacement||!target)return;
 ev.stopPropagation();
 const drag=stashPlacement,placement=stashDropPlacement(drag,target,inventoryItem(drag.id,drag.from));
 if(!placement){toast('請選擇可放置的倉庫格。');return;}
 if(await moveStash(placement.action,drag.id,placement.slot)){
  const selector=`[data-stash-slot="${placement.slot}"]`;
  flashInventoryDrop(selector);$(selector)?.focus({preventScroll:true});
 }
},true);
dialog.addEventListener('close',()=>{if(!dialog.open)stashPlacement=null;});
async function equipInventoryPotion(id,slot){
 if(panel!=='inventory'||e.mode!=='camp'){toast('請回營地替換藥水。');return false;}
 const candidate=profileCandidate(),result=Inventory.equipPotion(candidate,c.id,id,slot,e.mode);
 if(!result.ok){toast(result.reason);return false;}
 if(!await commitFlaskChange(candidate))return false;
 closeInventoryInspector(400);renderInventory();updateCharacter();updateHUD();toast('已配置快捷 '+FLASK_KEYS[slot]+' 的藥水。');return true;
}
document.addEventListener('click',async ev=>{
 const b=ev.target.closest('button');if(!b||b.disabled)return;const d=b.dataset;
 if(panel==='stash'&&d.stashPage!==undefined){selectSharedStashPage(Number(d.stashPage));return;}
 if(panel==='stash'&&d.stashPlace&&!stashMoving){
  closeInventoryInspector(400);
  stashPlacement={id:d.stashPlace,from:d.stashPlaceFrom,hero:c.id};renderStash();
  $('[data-stash-slot]')?.focus();return;
 }
 if(panel==='stash'&&'stashCancel'in d){stashPlacement=null;renderStash();$(`[data-stash-page="${stashPage}"]`)?.focus({preventScroll:true});return;}
 if(panel==='stash'&&'stashSort'in d){await sortSharedStash();return;}
 if(panel==='inventory'&&d.emptyFlaskSlot!==undefined){
  flaskTarget=Number(d.emptyFlaskSlot);
  const active=activeInventoryPage(),groups=InventoryPages.groupedEntries(state,c.id);
  const hasPotion=id=>groups[id].some(entry=>entry.kind==='flask');
  const page=hasPotion(active)?active:InventoryPages.PAGE_IDS.find(hasPotion)??active;
  inventoryTab='bag';selectInventoryPage(page,'flask');
  return;
 }
 if(d.potionTarget!==undefined){flaskTarget=Number(d.potionTarget);refreshSelection();return;}
 if(d.potionEquip){await equipInventoryPotion(d.potionEquip,flaskTarget);return;}
 if(d.potionTransfer){await moveStash(d.potionTransfer,d.potionItem);return;}
 if(d.itemUse){if(e.mode!=='camp'){toast('請先返回營地。');return;}if(d.itemUse==='flasks'&&inventorySelection){flaskSelection=inventorySelection.id;const slot=c.flaskItems.findIndex(i=>i?.id===flaskSelection);if(slot>=0)flaskTarget=slot;}if(d.itemUse==='forge'){forgeTab=d.itemKind==='gem'?'gems':d.itemKey==='chisel'?'sockets':['ascend','reforge','reroll'].includes(d.itemKey)?'craft':'enhance';}if(d.itemUse==='quests'){mapTab=['key','emblem'].includes(d.itemKind)?'endgame':'rift';if(d.itemDifficulty&&M.canDifficulty(c,Number(d.itemDifficulty))&&c.difficulty!==Number(d.itemDifficulty)){if(!await commitInventory(hero=>M.setDifficulty(hero,Number(d.itemDifficulty)),'',null))return;}}openPanel(d.itemUse);}
});

function ownedFlask(id,hero=c){return [...(hero.flaskItems||[]),...(hero.flaskBag||[])].find(item=>item?.id===id);}
function flaskBuffValues(effect){if(!effect.baseBuff&&!effect.suffixBuff)return effect.buff||{};const values={...effect.baseBuff};for(const [key,value] of Object.entries(effect.suffixBuff||{}))values[key]=(values[key]||0)+value;return values;}
function flaskEffectLines(def){const rows=[];if(def.instantHP)rows.push('立即恢復 '+Math.round(def.instantHP*100)+'% 生命');if(def.hp)rows.push(def.duration.toFixed(1)+' 秒內恢復 '+Math.round(def.hp*100)+'% 生命');if(def.instantMP)rows.push('立即恢復 '+Math.round(def.instantMP*100)+'% 魔力');if(def.mp)rows.push(def.duration.toFixed(1)+' 秒內恢復 '+Math.round(def.mp*100)+'% 魔力');for(const [key,value] of Object.entries(def.debuff||{}))rows.push([({slow:'敵人緩速',armorShred:'敵人護甲降低',weaken:'敵人傷害降低'})[key]||'敵人減益',percent(value)]);
 for(const [key,value] of Object.entries(def.buff||{}))rows.push(modifierText(key,value));return rows;}
function flaskQuality(item){
 return `<span class="flask-quality" data-flask-quality="${item.quality}" title="品質 ${item.quality}%">
  <span class="flask-quality-pips" aria-hidden="true">${Array.from({length:4},(_,i)=>`<i class="${item.quality>i*5?'filled':''}"></i>`).join('')}</span>
  +${item.quality}%
 </span>`;
}
function flaskRarity(item){return `<span class="flask-rarity ${item.rarity?'magic':''}">${item.rarity?'魔法':'普通'}</span>`;}
function flaskComparisonHeader(def,caption){
 return `<th scope="col" class="flask-gear-details" style="--flask-color:${def.color}">
  <small class="flask-detail-caption">${caption}</small><div class="flask-detail-title">${icon(def.icon)}<strong>${esc(def.name)}</strong></div>
  <div class="flask-card-meta">${flaskRarity(def.item)}${flaskQuality(def.item)}<span>等級 ${def.level}</span>${def.item.locked?icon('lock'):''}</div>
 </th>`;
}
function flaskComparisonMarkup(def,current,caption){
 const rows=flaskComparisonRows(def,current);
 return `<table class="flask-comparison-table">
  <thead><tr><th scope="col">效果</th>${flaskComparisonHeader(def,caption)}${current?flaskComparisonHeader(current,'目前裝配'):''}</tr></thead>
  <tbody>${rows.map(({key,label,unit,selected,current:previous})=>{
   const difference=(selected??0)-(previous??0);
   const tone=!current||Math.abs(difference)<1e-8?'':(key==='cost'?-difference:difference)>0?'higher':'lower';
   const marker=tone?` <small class="flask-compare-mark" aria-label="${tone==='higher'?'較佳':'較低'}">${tone==='higher'?'▲':'▼'}</small>`:'';
   return `<tr><th scope="row">${label}</th><td class="${tone}">${selected===undefined?'—':flaskStatValue(selected,unit)}${marker}</td>${current?`<td>${previous===undefined?'—':flaskStatValue(previous,unit)}</td>`:''}</tr>`;
  }).join('')}</tbody>
 </table>`;
}
function flaskSelectedMarkup(item){
 const worn=c.flaskItems.findIndex(f=>f?.id===item.id),old=c.flaskItems[flaskTarget],def=M.flaskForItem(item);
 const next=item.quality<20?M.flaskForItem({...item,quality:Math.min(20,item.quality+5)}):null;
 const changes=next?flaskComparisonRows(next,def).filter(row=>row.selected!==row.current):[];
 return `<section class="flask-selected-sheet">
  <div class="flask-sheet-heading compact-sheet-header"><span class="compact-sheet-label">${worn<0?'比較腰帶':'腰帶詳情'}</span>${modalClose('data-close-flask','關閉藥水詳情','sheet-close')}</div>
  ${worn<0?`<div class="flask-targets" aria-label="比較腰帶位置">${flaskTargetChoices('data-flask-target')}</div>`:''}
  ${flaskComparisonMarkup(def,worn<0?M.flaskForItem(old):null,worn<0?'選取藥水':`腰帶 ${worn+1} 號`)}
  ${worn<0?`<button class="gold-btn flask-equip-main" data-flask-action="equip" data-flask-item="${esc(item.id)}">裝配至 ${FLASK_KEYS[flaskTarget]} 鍵</button>`:''}
  ${next?`<div class="flask-upgrade-preview"><b>品質 +${item.quality}% → +${next.quality}%</b><p>${changes.map(({label,unit,selected,current})=>`${label} ${flaskStatValue(current,unit)} → ${flaskStatValue(selected,unit)}`).join(' · ')}</p></div>`:''}
  <div class="flask-gear-actions">
   <button class="outline-btn" data-flask-action="quality" data-flask-item="${esc(item.id)}" ${!next||c.shards<8?'disabled':''}>${next?'品質 +5% · 8 碎晶':'品質已滿'}</button>
   <button class="outline-btn" data-flask-action="reroll" data-flask-item="${esc(item.id)}" ${item.locked||c.shards<15?'disabled':''}>重鑄詞綴 · 15 碎晶</button>
   <button class="outline-btn" data-flask-action="lock" data-flask-item="${esc(item.id)}" aria-pressed="${item.locked}">${icon('lock')}${item.locked?'解除鎖定':'鎖定保護'}</button>
   ${worn<0?`<button class="outline-btn" data-flask-action="salvage" data-flask-item="${esc(item.id)}" ${item.locked?'disabled':''}>分解 · ${4+item.rarity*4+Math.floor(item.quality/5)} 碎晶</button>`:''}
  </div>
 </section>`;
}
function flaskOwnedCard(item,index=null){
 if(!item)return `<button type="button" class="flask-owned-card equipped empty-potion" data-flask-target="${index}" aria-pressed="${flaskTarget===index}">${icon('potion')}<span class="flask-card-content"><strong>未配置</strong><small>快捷 ${FLASK_KEYS[index]}</small></span></button>`;
 const def=M.flaskForItem(item),equipped=index!==null,batch=flaskBatch&&!equipped;
 const charges=equipped?Math.floor(e.flasks[index]?.charges??def.maxCharges):null;
 const selected=item.id===flaskSelection;
 const content=`${icon(def.icon)}<span class="flask-card-content">
  <strong>${esc(def.name)}${item.locked?` <span class="flask-card-lock" title="已鎖定">${icon('lock')}<span class="flask-visually-hidden">已鎖定</span></span>`:''}</strong>
  <span class="flask-card-effects">${flaskCardSummary(def).map(effect=>`<span>${esc(effect)}</span>`).join('')}</span>
  <span class="flask-card-meta">${flaskRarity(item)}${flaskQuality(item)}<span>${equipped?`快捷 ${FLASK_KEYS[index]} · ${charges}/${def.maxCharges} 充能`:`耗 ${def.cost} · ${flaskStatValue(def.duration,'seconds')}`}</span></span>
 </span>`;
 if(batch)return `<label class="flask-owned-card flask-batch-card ${item.locked?'protected':''}" style="--flask-color:${def.color}">
  <input type="checkbox" data-flask-sale="${esc(item.id)}" aria-label="選取出售${esc(def.name)}" ${item.locked?'disabled':''} ${flaskSaleIDs.has(item.id)?'checked':''}>${content}
 </label>`;
 return `<button type="button" class="flask-owned-card ${equipped?'equipped':''} ${selected?'selected':''}" data-flask-select="${esc(item.id)}" aria-pressed="${selected}" style="--flask-color:${def.color}">${content}</button>`;
}
function renderFlasks(){
 if(flaskWorkshopHero!==c.id){
  flaskWorkshopHero=c.id;
  flaskBatch=false;
  flaskSaleIDs.clear();
  flaskSelection=null;
  flaskTarget=0;
 }
 const selected=ownedFlask(flaskSelection);
 if(!selected)flaskSelection=null;
 const offer=M.flaskSalePreview(c,[...flaskSaleIDs]);
 const canSell=c.flaskBag.some(item=>!item.locked);
 $('#dialog-body').innerHTML=`
  <div class="flask-workshop-intro"><span>${icon('coin')}${c.gold} 金幣</span><span>${icon('rune')}${c.shards} 碎晶</span></div>
  <section class="flask-belt-section">
   <div class="flask-section-heading"><h3>目前腰帶</h3></div>
   <div class="flask-equipped-grid">${c.flaskItems.map((item,index)=>flaskOwnedCard(item,index)).join('')}</div>
  </section>
  ${selected?flaskSelectedMarkup(selected):''}
  <section class="flask-collection-section">
   <div class="flask-section-heading"><h3>藥水收藏</h3><span>${c.flaskBag.length} / 36</span>
    <button class="outline-btn flask-batch-toggle" data-flask-batch="toggle" aria-pressed="${flaskBatch}" ${!flaskBatch&&!canSell?'disabled':''}>${flaskBatch?'完成選取':'批量出售'}</button>
   </div>
   ${flaskBatch?`<div class="flask-batch-toolbar">
    <button class="outline-btn" data-flask-batch="all" ${canSell?'':'disabled'}>全選未鎖定</button>
    <button class="outline-btn" data-flask-batch="clear">清除選取</button>
    <button class="gold-btn" data-flask-batch="sell" ${offer.count?'':'disabled'}>出售 ${offer.count} 瓶 · ${offer.gold} 金幣</button>
   </div>`:''}
   <div class="flask-collection-grid">${c.flaskBag.map(item=>flaskOwnedCard(item)).join('')||'<p class="empty-state">收藏尚空。</p>'}</div>
  </section>
  <details class="flask-howto"><summary>充能與詞綴</summary>
   <p>普通怪、菁英與首領分別回充 0.5、4、15。過區 +6，營地補滿。召喚援軍不回充。</p>
   <p>同類藥水刷新效果，相同後綴取較強者。品質提高生命／魔力恢復量或功能藥水的持續時間，最高 20%。鎖定保護藥水免於重鑄、出售與分解。</p>
  </details>`;
}
async function commitFlaskChange(candidate){
 Inventory.preserveReplacedPositions(c,candidate.characters[c.id]);
 try{prepareCandidate(candidate);await persistProfile(candidate);}
 catch{toast('藥水變更未儲存，物品與金幣碎晶已保留。');return false;}
 state=candidate;
 c=state.characters[state.active];
 e.c=c;
 e.refreshFlaskBelt();
 return true;
}
async function flaskAction(action,id){
 if(e.mode!=='camp')return false;
 const candidate=profileCandidate(),hero=candidate.characters[c.id],item=ownedFlask(id,hero);
 if(!item)return false;
 const mutation={equip:()=>M.equipFlask(hero,id,flaskTarget),quality:()=>M.upgradeFlask(hero,id),reroll:()=>M.rerollFlask(hero,id),lock:()=>M.setFlaskLocked(hero,id,!item.locked),salvage:()=>M.salvageFlask(hero,id)}[action];
 if(!mutation?.()){toast('無法變更藥水，請確認碎晶、鎖定與收藏空間。');return false;}
 if(!await commitFlaskChange(candidate))return false;
 if(action==='salvage')flaskSelection=null;
 renderFlasks();
 updateCharacter();
 updateHUD();
 toast({equip:'藥水已裝配，充能補滿。',quality:'藥水品質已提升。',reroll:'藥水詞綴已重新鑄造。',lock:item.locked?'藥水已鎖定。':'藥水已解除鎖定。',salvage:'藥水已分解為碎晶。'}[action]);
 return true;
}
async function flaskBatchAction(action){
 if(e.mode!=='camp'||panel!=='flasks')return;
 if(action==='toggle'){
  flaskBatch=!flaskBatch;
  flaskSelection=null;
  flaskSaleIDs.clear();
 }else if(action==='all'){
  for(const item of c.flaskBag)if(!item.locked)flaskSaleIDs.add(item.id);
 }else if(action==='clear'){
  flaskSaleIDs.clear();
 }else if(action==='sell'){
  const candidate=profileCandidate(),result=M.sellFlasks(candidate.characters[c.id],[...flaskSaleIDs]);
  if(!result){toast('目前無法出售選取的藥水。');return;}
  if(!await commitFlaskChange(candidate))return;
  flaskSaleIDs.clear();
  if(!c.flaskBag.some(item=>!item.locked))flaskBatch=false;
  updateCharacter();
  updateHUD();
  toast(`已出售 ${result.count} 瓶藥水，獲得 ${result.gold} 金幣。`);
 }
 renderFlasks();
}
document.addEventListener('change',event=>{
 const input=event.target;
 if(e.mode!=='camp'||panel!=='flasks'||!input.matches?.('input[data-flask-sale]')||input.disabled)return;
 if(input.checked)flaskSaleIDs.add(input.dataset.flaskSale);
 else flaskSaleIDs.delete(input.dataset.flaskSale);
 const sale=M.flaskSalePreview(c,[...flaskSaleIDs]),button=$('[data-flask-batch="sell"]');
 button.textContent=`出售 ${sale.count} 瓶 · ${sale.gold} 金幣`;
 button.disabled=!sale.count;
});
function serviceTabs(tabs,selected,attribute,label){
 return `<nav class="resource-tabs camp-service-tabs" aria-label="${label}">${tabs.map(([id,name])=>`<button data-${attribute}="${id}" class="${selected===id?'selected':''}" aria-pressed="${selected===id}">${name}</button>`).join('')}</nav>`;
}
function serviceGrid(items,from,label){
 return `<section class="service-grid-section"><h3>${label} <small>${items.length}</small></h3>${items.length?`<div class="backpack-grid" role="grid" aria-label="${label}">${items.map(item=>inventoryCell(item,from)).join('')}</div>`:'<p class="resource-note">這裡沒有裝備。</p>'}</section>`;
}
function serviceSelection(hint){
 if(inventorySelection&&!inventoryItem(inventorySelection.id,inventorySelection.from))inventorySelection=null;
 return `<section id="inventory-selection" class="service-selection inventory-selection ${inventorySelection?'has-selection':''}" aria-live="polite">${selectionMarkup()||`<p class="service-empty">${hint}</p>`}</section>`;
}
function renderForge(){
 const tabs=serviceTabs([['enhance','強化'],['sockets','鑲嵌'],['craft','改造'],['gems','寶石']],forgeTab,'forge-tab','鐵匠服務');
 $('#dialog-body').innerHTML=`${tabs}${resourceBalances()}${forgeTab==='gems'?gemsMarkup():`<div class="camp-service-layout forge-layout">${wornEquipmentMarkup()}${serviceGrid(c.bag,'bag','個人背包')}${serviceSelection('選擇要加工的裝備')}</div>`}`;
}
function forgeItemMarkup(item,from){
 const target=from==='equipped'?Object.keys(c.equipment).find(slot=>c.equipment[slot]?.id===item.id):item.id;
 const content=forgeTab==='enhance'?enhancementMarkup(item,target):workshopMarkup(item);
 return `<div class="forge-item-heading" style="--item-color:${M.itemColor(item)}">${icon(itemIcon(item))}<div><b>${esc(item.name)}${item.upgrade?' +'+item.upgrade:''}</b><small>${itemLevelText(item)}</small></div>${itemActionIcons(item,from)}${modalClose('data-clear-selection','關閉裝備詳情','sheet-close')}</div>${gearSetBonusesMarkup([item])}${content}`;
}
function renderMerchant(){
 $('#dialog-body').innerHTML=`${resourceBalances()}${saleMarkup()}<div class="camp-service-layout"><div class="service-picker">${serviceGrid(c.bag,'bag','個人背包')}</div>${serviceSelection('選一件裝備查看售價或分解')}</div>`;
}
function guideAffixResults(){return affixDictionaryMarkup({query:guideAffixQuery,group:guideAffixGroup});}
function renderGuide(){
 const topic=CAMP_GUIDE[guideTopic],catalog=['sets','uniques'].includes(guideTopic);
 const main=catalog?'sets':topic.sections?'camp':guideTopic;
 const tabs=serviceTabs([['camp','手冊'],['status',CAMP_GUIDE.status.label],['affixes','詞條字典'],['sets','收藏圖鑑']],main,'guide-topic','冒險指南');
 let content,secondary='';
 if(catalog){
  secondary=serviceTabs([['sets','套裝'],['uniques','獨特裝備']],guideTopic,'guide-topic','收藏類型');
  content=guideTopic==='sets'?setCatalogMarkup(state,{counts:M.setBonuses(c).counts,fiveDetails:SET_FIVE_DETAILS}):uniqueCatalogMarkup(state);
 }else if(guideTopic==='status'){
 content=statusGuideMarkup();
 }else if(guideTopic==='affixes'){
  content=`<div class="guide-affix-controls"><input id="guide-affix-query" type="search" autocomplete="off" aria-label="搜尋詞條" placeholder="搜尋名稱、效果或部位" value="${esc(guideAffixQuery)}"><select id="guide-affix-group" aria-label="詞條類型">${Object.entries(AFFIX_GROUPS).map(([key,label])=>`<option value="${key}" ${guideAffixGroup===key?'selected':''}>${label}</option>`).join('')}</select></div><div id="guide-affix-results">${guideAffixResults()}</div>`;
 }else{
  const topics=Object.entries(CAMP_GUIDE).filter(([,value])=>value.sections).map(([id,value])=>[id,value.label]);
  secondary=serviceTabs(topics,guideTopic,'guide-topic','手冊分類');
  content=`<div class="camp-guide-content">${topic.sections.map(([title,body])=>`<section class="guide-block"><h3>${esc(title)}</h3><p>${esc(body)}</p></section>`).join('')}${guideTopic==='save'?'<div class="save-actions"><button class="outline-btn" data-export>匯出存檔</button><button class="outline-btn" data-import>匯入存檔</button></div>':''}</div>`;
 }
 $('#dialog-body').innerHTML=`<div class="guide-workspace"><div class="guide-navigation">${tabs}${secondary}</div>${content}</div>`;
}
$('#dialog-body').addEventListener('input',ev=>{
 if(panel!=='guide'||ev.target.id!=='guide-affix-query')return;
 guideAffixQuery=ev.target.value;
 $('#guide-affix-results').innerHTML=guideAffixResults();
});
$('#dialog-body').addEventListener('change',ev=>{
 if(panel!=='guide'||ev.target.id!=='guide-affix-group'||!Object.hasOwn(AFFIX_GROUPS,ev.target.value))return;
 guideAffixGroup=ev.target.value;
 $('#guide-affix-results').innerHTML=guideAffixResults();
});
function saleMarkup(){const rarities=c.sellRarities??[0,1],sale=M.salePreview(c,rarities,includeValuable),salvage=M.salvagePreview(c,rarities,includeValuable);return `<section class="inventory-vendor compact-vendor" aria-label="批次出售與分解"><div class="vendor-colours">${M.RARITIES.map((r,i)=>`<label style="--rarity-color:${r.color}"><input type="checkbox" data-sell-rarity="${i}" ${rarities.includes(i)?'checked':''}><span>${r.name.split('・')[0]}</span></label>`).join('')}</div><span class="batch-count" title="已鑲嵌、穿戴及倉庫物品不處理">${sale.count} 件${sale.skippedSocketed?' · ◇ '+sale.skippedSocketed:''}${sale.skippedValuable?' · 保護 '+sale.skippedValuable:''}</span><label class="batch-valuable"><input type="checkbox" data-include-valuable ${includeValuable?'checked':''}>包含珍貴裝備</label>${bagSearch.trim()||bagFilter!=='all'?'<small class="filtered-batch-note">顏色批次按鈕計算整個背包</small>':''}<div class="batch-actions"><button class="item-icon-action item-sell" data-inventory-action="sell-colors" title="出售 ${sale.count} 件 · ${sale.gold} 金幣" aria-label="批次出售 ${sale.count} 件，獲得 ${sale.gold} 金幣" ${sale.count?'':'disabled'}>${icon('coin')}</button><button class="item-icon-action item-salvage" data-inventory-action="salvage-colors" title="分解 ${salvage.count} 件 · ${salvage.shards} 碎晶" aria-label="批次分解 ${salvage.count} 件，獲得 ${salvage.shards} 碎晶" ${salvage.count?'':'disabled'}>${icon('salvage')}</button></div></section>`;}


async function changeBuild(action,id){const candidate=profileCandidate(),hero=candidate.characters[c.id];if(!hero)return;if(action==='learn'){if(!M.learn(hero,id))return;}else if(!M.refund(hero)){toast('請先騰出背包或待領空間，才能收回副手並重置技能。');return;}try{prepareCandidate(candidate);await persistProfile(candidate);}catch{toast('技能加點未儲存，原技能與點數保留。');renderPanel();return;}state=candidate;c=state.characters[state.active];e.c=c;e.refresh();if(panel==='talents')refreshSkillAtlas();else renderPanel();updateCharacter();toast(action==='learn'?'技能點已投入，效果已更新。':'所有技能點已退還。');}

function itemFormText(item,compact=false){if(!['weapon','offhand'].includes(item.slot))return M.SLOT_NAMES[item.slot]+(armorClass(item)?' · '+ARMOR_WEIGHTS[armorClass(item)].name:'');const def=M.weaponDefinition(item,c.cls);return `${compact?'':M.SLOT_NAMES[item.slot]+' · '}${def.name} · ${item.slot==='offhand'?'副手':def.hands===2?'雙手':'單手'}`;}
function itemIcon(item){return equipmentIcon(item,STARTING_WEAPONS[c.cls]?.type);}
function itemLevelText(item){const base=item.baseTier===undefined?'舊版底材':M.ITEM_BASES[item.baseTier]?.name||'底材',required=item.requiredLevel??1;return `${base} · 物品等級 ${item.level} · <span class="${c.level<required?'requirement-unmet':''}">需求 Lv.${required}</span>`;}
function affixMarkup(a,item){const d=M.AFFIXES[a.key],tier=a.tier,range=M.affixRange(a.key,item.level,item,tier),format=value=>d.percent?Math.round(value*1000)/10+'%':value;return `<span class="affix-grade" style="--grade-color:${tier===1?'#e9c676':tier===2?'#ba9ad6':'#a5b69c'}" title="數值強度：T1 最強">T${tier}</span><span class="affix-value">${esc(M.affixText(a))}</span>${range?`<small class="affix-range">ilvl ${item.level} · T${tier} 可擲 ${format(range.min)}–${format(range.max)}</small>`:''}`;}
function valuableItem(item){return item.rarity>=4||!!item.set||!!item.uniqueID;}
function affixCountMarkup(item){const n=M.affixCount(item),t1=(item.affixes||[]).filter(a=>a.tier===1).length,min=item.rarity===5?3:item.rarity===4?2:0;return `<p class="affix-count" data-affix-count="${n}">詞條總數 <b>${n}</b>${item.grantedSkill?'（含授予技能 1 條）':''} · T1 <b>${t1}</b>${min?'／至少 '+min+' 條':''}</p>`;}

function equipmentEffectsMarkup(showSustain=true){const auras=M.equipmentAuras(c),triggers=M.equipmentTriggers(c);return `<section class="equipment-passives"><div class="loadout-section-title"><h3>${icon('armor')}裝備被動效果</h3><span>穿戴自動生效 · 不占主動格</span></div>${showSustain?`<div class="sustain-overview">${bloodResource()?`<span>每秒回血 <b>${e.s.lifeRegen.toFixed(1)}</b></span><span>生命吸取 <b>${Math.round(e.s.leech*100)}%</b></span>`:`<span>每秒回魔 <b>${e.s.manaRegen.toFixed(1)}</b></span><span>魔力吸取 <b>${Math.round(e.s.manaLeech*100)}%</b></span>`}<span>技能減耗 <b>${Math.round(e.s.manaCost*100)}% ＋ ${e.s.flatManaCost}</b></span></div>`:''}<div class="passive-effects-grid">${auras.map(a=>`<article class="passive-effect" style="--effect-color:${a.color}"><span>${icon(a.icon)}</span><div><small>常駐裝備光環 · 免費</small><h4>${a.name} Lv.${a.level}</h4><p>${Object.entries(a.buff).map(([key,value])=>modifierText(key,value)).join(' · ')}</p></div><b>常駐</b></article>`).join('')}${triggers.map(t=>{const def=M.triggerAbility(c,t.skill,t.level);return `<article class="passive-effect" style="--effect-color:#c19fdb"><span>${icon(M.ABILITIES[t.skill].icon)}</span><div><small>${t.event==='attack'?'攻擊命中':'受到生命傷害'} · ${Math.round(t.chance*1000)/10}% 機率</small><h4>${M.ABILITIES[t.skill].name} Lv.${def.level} ${skillTypeBadges(def)}</h4><p>自動施放 · 免費 · ${M.skillCategory(def)==='warcry'?'團隊增益':M.skillCategory(def)==='curse'?'詛咒':'傷害／控制'}倍率 ${Math.round(t.scale*100)}%</p></div><b>觸發</b></article>`;}).join('')}${!auras.length&&!triggers.length?'<p class="passive-empty">尚未穿戴光環或觸發裝備。稀有以上裝備可出現特殊詞條，獨特裝備提供固定組合。</p>':''}</div><p class="passive-rule">同名裝備光環只取最高等級。裝備觸發不會連鎖觸發；同種持續效果刷新。${bloodResource()?'血費使用生命；魔力減耗詞條同樣生效。':'命中回魔與魔力吸取每秒共用 ${MANA_SIPHON_RATE*100}% 最大魔力恢復額度。'}</p></section>`;}


function slotMatches(item,slot){if(item.slot==='weapon'&&slot==='offhand')return M.legalDualPair(c,c.equipment.weapon,item);return item.slot==='ring'?['ring_left','ring_right'].includes(slot):item.slot===slot;}
function refreshSelection(){const sheet=$('#inventory-selection');if(sheet){sheet.innerHTML=selectionMarkup();positionInventoryInspector();}}
function gemName(key,tier){return (M.GEMS[key]?.name||key)+' '+tier+'階';}
function socketSummary(item){return `<p class="socket-summary">天然 ${item.naturalSockets??0} 孔／目前 ${(item.sockets||[]).length} 孔／上限 ${M.socketLimit(item)} 孔 <b>${item.socketCrafted?'已打孔 · 不可再次使用':(item.sockets||[]).length<M.socketLimit(item)?'尚可打孔 +1':'已達上限'}</b></p>`;}
function gemEffectsMarkup(item){const gems=(item.sockets||[]).map((gem,i)=>gem?`<li><b>◇ ${esc(gemName(gem.key,gem.tier))}</b><span>${M.gemEffects(item,gem).map(a=>esc(M.affixText(a))).join(' · ')}</span></li>`:`<li class="empty-socket">○ 第 ${i+1} 孔 · 尚未鑲嵌</li>`);return gems.length?`<ul class="socket-effects">${gems.join('')}</ul>`:'';}
function resourceBalances(){return `<div class="shared-balances"><span>${icon('coin')}角色金幣 <b>${c.gold}</b></span><span>${icon('rune')}角色碎晶 <b>${c.shards}</b></span><span>共享素材 <b>${Object.values(state.materials||{}).reduce((n,v)=>n+v,0)}</b></span><span>共享寶石 <b>${Object.values(state.gems||{}).reduce((n,v)=>n+v,0)}</b></span></div>`;}
function gemEntries(){return Object.entries(state.gems||{}).filter(([,count])=>count>0).map(([id,count])=>{const [key,tier]=id.split(':');return {key,tier:Number(tier),count};}).sort((a,b)=>a.key.localeCompare(b.key)||a.tier-b.tier);}
function gemsMarkup(){return `<div class="gem-bag">${gemEntries().map(gem=>{const def=M.GEMS[gem.key],max=def?.maxTier||3,fee=50*gem.tier*gem.tier;return `<article class="gem-resource"><div><b>◇ ${esc(gemName(gem.key,gem.tier))}</b><strong>×${gem.count}</strong></div><p>${esc(def?.description||'依裝備部位提供對應效果')} · 需求物品 Lv.${def?.minLevels?.[gem.tier-1]||1}</p><p class="gem-allowed">可用：${(def?.slots||[]).map(slot=>M.SLOT_NAMES[slot]||slot).join('／')}</p><button class="outline-btn" data-combine-gem="${gem.key}" data-gem-tier="${gem.tier}" ${e.mode==='playing'||gem.count<3||gem.tier>=max||c.gold<fee?'disabled':''}>${gem.tier>=max?'已達最高階':`3 顆 → ${gem.tier+1} 階 · ${fee} 金`}</button></article>`;}).join('')||'<p class="resource-note gem-empty">寶石袋尚空。擊敗敵人可取得寶石。</p>'}</div><p class="resource-note">同種類同階 3 顆合成 1 顆高階寶石，費用由目前角色支付。鑲入與拆回請找營地鐵匠。</p>`;}
function craftCost(preview){const cost=preview.cost||{};return [cost.gold?cost.gold+' 金':null,cost.shards?cost.shards+' 碎晶':null,cost.material?(M.MATERIALS[cost.material]?.name||cost.material)+' ×'+(cost.amount||1):null].filter(Boolean).join(' ＋ ')||'無額外費用';}
function craftPreviewMarkup(item,action,options={}){const p=M.craftPreview(state,c.id,item.id,action,options),disabled=e.mode==='playing'||item.locked||!p.ok,labels={socket:'確定打孔 +1',ascend:'確認升華',reforge:'確認重鑄詞條',reroll:'確認重塑數值',insert:'確認鑲嵌',remove:'拆回完整寶石'};return `<div class="craft-preview"><p>${esc(p.description||p.reason||'')}</p><b>${craftCost(p)}</b>${!p.ok?`<small>${esc(p.reason||'目前無法進行')}</small>`:''}<button class="gold-btn" data-craft-commit="${action}" ${disabled?'disabled':''}>${labels[action]}</button></div>`;}
function poolMarkup(item){const pool=M.affixPool(item);return `<details class="craft-pool"><summary>合法詞條池與此物品等級範圍（${pool.length} 種）</summary><ul>${pool.map(key=>{const d=M.AFFIXES[key],r=M.affixRange(key,item.level,item),fmt=v=>d.percent?Math.round(v*1000)/10+'%':v;return `<li><span>${esc(d.label)}</span><b>${fmt(r.min)}–${fmt(r.max)}</b></li>`;}).join('')}</ul></details>`;}
function workshopMarkup(item){const sockets=item.sockets||[],index=craftSelection?.socketIndex??(sockets.length?Math.max(0,sockets.findIndex(g=>!g)):-1),gem=index>=0?sockets[index]:null,opts=craftSelection?{socketIndex:index,gemKey:craftSelection.gemKey,tier:craftSelection.tier}:{socketIndex:index};return `<section class="equipment-workshop">${item.locked?'<p class="resource-note">已鎖定 · 解鎖後可加工</p>':''}${socketSummary(item)}${workshopTab==='craft'?`<div class="craft-actions">${[['socket','打孔'],['ascend','升華'],['reforge','重鑄'],['reroll','重塑']].map(([key,label])=>`<button data-workshop-action="${key}" class="${workshopAction===key?'selected':''}" aria-pressed="${workshopAction===key}">${label}<small>${{socket:'確定 +1 孔',ascend:'升色＋新詞條',reforge:'種類＋數值',reroll:'只改數值'}[key]}</small></button>`).join('')}</div>${craftPreviewMarkup(item,workshopAction)}<p class="resource-note">隨機改造不預告固定結果；重塑可能降低數值。全部改造保留天然孔、目前孔、寶石與一次打孔紀錄。</p>${workshopAction==='reroll'?`<div class="reroll-ranges">${(item.affixes||[]).map(a=>`<div>${affixMarkup(a,item)}</div>`).join('')}</div>`:workshopAction==='socket'?'':poolMarkup(item)}`:`<div class="socket-picks">${sockets.map((g,i)=>`<button data-socket-pick="${i}" class="${index===i?'selected':''}" aria-pressed="${index===i}"><b>${g?'◇':'○'} 第 ${i+1} 孔</b><span>${g?esc(gemName(g.key,g.tier)):'選擇寶石'}</span></button>`).join('')||'<p class="resource-note">此物品沒有孔。可在「改造 → 打孔」查看是否能增加 1 孔。</p>'}</div>${index>=0?(gem?`<div class="socket-chosen-effects">${M.gemEffects(item,gem).map(a=>esc(M.affixText(a))).join(' · ')}</div>${craftPreviewMarkup(item,'remove',{socketIndex:index})}`:`<div class="insert-gem-list">${gemEntries().map(g=>{const p=M.craftPreview(state,c.id,item.id,'insert',{socketIndex:index,gemKey:g.key,tier:g.tier}),chosen=craftSelection?.gemKey===g.key&&craftSelection?.tier===g.tier;return `<button data-craft-gem="${g.key}" data-gem-tier="${g.tier}" data-socket-index="${index}" class="${chosen?'selected':''}" ${!p.ok?'disabled':''}><b>${esc(gemName(g.key,g.tier))} ×${g.count}</b><span>${M.gemEffects(item,g).map(a=>esc(M.affixText(a))).join(' · ')||esc(M.GEMS[g.key]?.description||'')}</span>${!p.ok?`<small>${esc(p.reason)}</small>`:''}</button>`;}).join('')||'<p class="resource-note">共享寶石袋尚空。</p>'}</div>${craftSelection?.gemKey?craftPreviewMarkup(item,'insert',opts):'<p class="resource-note">選擇一顆適用寶石，先查看效果與費用再確認。同件不能重複寶石家族。</p>'}`):''}`}</section>`;}
async function commitCraft(action){const selected=inventorySelection,item=selected&&inventoryItem(selected.id,selected.from);if(!item)return false;if(panel!=='forge'||e.mode!=='camp'||item.locked){toast(item.locked?'請先解除裝備鎖定。':'請在營地鐵匠處改造裝備。');return false;}const index=craftSelection?.socketIndex??(item.sockets||[]).findIndex(g=>action==='remove'?!!g:!g),options={socketIndex:index,gemKey:craftSelection?.gemKey,tier:craftSelection?.tier},candidate=profileCandidate(),result=M.craftItem(candidate,c.id,item.id,action,options);if(!result.ok){toast(result.reason||'無法改造此裝備。');refreshSelection();return false;}try{prepareCandidate(candidate);await persistProfile(candidate);}catch{toast('改造未儲存，原裝備、素材、寶石與貨幣已保留。');return false;}state=candidate;c=state.characters[state.active];e.c=c;e.refresh();craftSelection=null;renderPanel();updateCharacter();updateHUD();toast('裝備改造已完成並儲存。');return true;}
async function commitGemCombine(key,tier){if(!['stash','forge'].includes(panel)||e.mode!=='camp'){toast('請在營地鐵匠合成寶石。');return false;}const candidate=profileCandidate(),result=M.combineGems(candidate,key,tier,c.id);if(!result.ok){toast(result.reason||'無法合成寶石。');return false;}try{prepareCandidate(candidate);await persistProfile(candidate);}catch{toast('合成未儲存，寶石與金幣已保留。');return false;}state=candidate;c=state.characters[state.active];e.c=c;e.refresh();renderPanel();updateCharacter();toast('已合成 '+gemName(key,tier+1)+'。');return true;}

// Training presentation uses the normal throttled HUD; source tables are snapshots on open.
function trainingNumber(value,digits=1){return Number.isFinite(value)?value.toLocaleString('zh-TW',{maximumFractionDigits:digits}):'—';}
function trainingPercent(value){return trainingNumber((Number.isFinite(value)?value:0)*100,1)+'%';}
function trainingDefenseMarkup(preview){return `護甲 ${trainingNumber(preview.armor,0)} · ${Object.entries(preview.resistances||{}).map(([type,value])=>({fire:'火',cold:'冰',lightning:'雷',poison:'毒'}[type]||type)+' '+trainingPercent(value)).join('／')}`;}
function trainingSettings(options){const base=e.trainingPreview({preset:options.preset});return {...options,armor:options.armor===base.armor?null:options.armor};}
function readTrainingForm(){const form=$('#training-form');if(!form)return trainingDraft;const number=name=>{const el=form.elements.namedItem(name);return el.value.trim()===''?null:Number(el.value);};return {scenario:form.elements.scenario.value,preset:form.elements.preset.value,armor:number('armor'),resistance:number('resistance')===null?null:number('resistance')/100,targets:Number(form.elements.targets.value),duration:Number(form.elements.duration.value),unlimitedMana:!bloodResource()&&form.elements.unlimitedMana.checked};}
function updateTrainingPreview(){trainingDraft=readTrainingForm();const preview=e.trainingPreview(trainingDraft);$('#training-defense').textContent=trainingDefenseMarkup(preview);$('#training-boss-hp').textContent=trainingNumber(preview.bossHp);$('#training-reference-hp').textContent=trainingNumber(preview.referenceHp);$('#training-preview-mana').textContent=preview.unlimitedMana?'自動補魔：僅測施放頻率，不代表實戰續航。':bloodResource()?'真實生命血費與藥水充能：資源不足時間計入平均 DPS。':'真實魔力與藥水充能：缺魔時間計入平均 DPS。';}
function renderTraining(){
 const blocked=e.mode!=='camp'&&!e.training,preview=e.trainingPreview(trainingDraft),options=trainingDraft;
 $('#dialog-body').innerHTML=`<p class="training-intro">以目前 Lv.${c.level} 角色測試實際傷害。情境涵蓋木樁、敵群、擊殺擴散與定時承傷；均無經驗、掉落或通關進度。</p>${blocked?'<div class="training-blocked">遠征進行中，請先返回營地再進入訓練場。<button class="outline-btn" data-training-action="campSetup">結束遠征並返回營地</button></div>':''}<form id="training-form"><div class="training-form-grid"><label>訓練情境<select name="scenario">${[['dummy','靜止木樁'],['pack','敵群覆蓋'],['spread','擊殺與擴散'],['counter','反擊與承傷'],['elements','元素承傷']].map(([id,name])=>`<option value="${id}" ${(options.scenario||'dummy')===id?'selected':''}>${name}</option>`).join('')}</select></label><label>目標防禦預設<select name="preset">${Object.entries(Game.trainingPresets).map(([id,preset])=>`<option value="${id}" ${options.preset===id?'selected':''}>${esc(preset.name)}</option>`).join('')}</select></label><label>目標數量<select name="targets">${[1,3,8].map(n=>`<option value="${n}" ${options.targets===n?'selected':''}>${n===1?'單體':n+' 個群聚目標'}</option>`).join('')}</select></label><label>測試時間<select name="duration">${[30,60,0].map(n=>`<option value="${n}" ${options.duration===n?'selected':''}>${n?n+' 秒':'不限時間'}</option>`).join('')}</select></label><label>覆寫護甲 <small>留空沿用預設</small><input name="armor" type="number" min="0" max="2000" step="1" placeholder="預設護甲" value="${options.armor??''}"></label><label>覆寫四系抗性 % <small>留空沿用預設</small><input name="resistance" type="number" min="-50" max="75" step="1" placeholder="預設抗性" value="${options.resistance===null||options.resistance===undefined?'':Math.round(options.resistance*10000)/100}"></label><label class="training-mana-toggle" ${bloodResource()?'hidden':''}><input name="unlimitedMana" type="checkbox" ${options.unlimitedMana?'checked':''}><span>自動補滿魔力<small>每幀補滿 · 僅測施放頻率</small></span></label></div><div class="training-reference"><b id="training-defense">${trainingDefenseMarkup(preview)}</b><span>本級${M.DIFFICULTIES[1].name}首領生命 <strong id="training-boss-hp">${trainingNumber(preview.bossHp)}</strong> · 預設目標參考生命 <span id="training-reference-hp">${trainingNumber(preview.referenceHp)}</span></span><p id="training-preview-mana"></p></div><p class="training-note">首次命中開始計時。沿用自動普攻、1／2／3（左鍵／右鍵／Q）、C、空白鍵；光環在技能頁啟用。暫停不計時；更換裝備或技能會重置本次樣本。每次重測補滿生命、魔力、藥水並清空練習召喚。</p><div class="training-form-actions">${e.training?'<button type="button" class="text-btn" data-panel="trainingResults">查看本次分析</button>':'<span>軍隊與世界進度在離場時還原。</span>'}<button type="submit" class="gold-btn" ${blocked?'disabled':''}>${e.training?'套用設定，重新測試':'開始訓練'} ${icon('target')}</button></div></form>`;updateTrainingPreview();
}
function beginTraining(){
 if(document.hidden){toast('回到遊戲畫面後再開始訓練。');return false;}if(e.mode!=='camp'&&!e.training){toast('請先返回營地，再進入訓練場。');return false;}
 const options=panel==='training'?readTrainingForm():{...(e.training?.options||trainingDraft)};trainingDraft=options;closePanel();release();e.paused=false;let started=false;try{started=e.training?e.resetTraining(options):e.startTraining(options);}finally{updatePause();}if(started===false){toast('目前無法開始訓練，請先返回營地。');return false;}updateMode();updateHUD();return true;
}
async function trainingAction(action){
 if(action==='reset'){beginTraining();return;}if(action==='finish'){if(e.training){e.finishTraining();openPanel('trainingResults');}return;}
 if(action==='camp'||action==='campSetup'){if(action==='camp')closePanel();release();manualPause=false;if(!await returnToCamp())return;updatePause();updateMode();updateHUD();save(true);if(action==='campSetup')openPanel('training');}
}
function updateTrainingHUD(){
 const overlay=$('#training-overlay');overlay.classList.toggle('hidden',!e.training);if(!e.training){trainingHUDSummary=null;return;}const score=e.trainingSummary();if(!score)return;trainingHUDSummary=score;
 const status=score.finished?'測試完成':e.paused?'已暫停':score.started?'採樣中':'等待首次命中';$('#training-state').textContent=status;$('#training-timer').textContent=formatTime(score.elapsed)+(score.options.duration?' / '+score.options.duration+'s':' / 不限');
 for(const [id,value] of [['average',score.dps],['recent',score.recentDps],['peak',score.peakDps],['total',score.total],['max',score.maxHit]])$('#training-'+id).textContent=trainingNumber(value);
 $('#training-live-mana').textContent=(score.options.unlimitedMana?'自動補魔 · 頻率測試，不代表續航':bloodResource()?'真實血費 · 資源不足時間計入平均':'真實魔力 · 缺魔時間計入平均')+(score.options.scenario&&score.options.scenario!=='dummy'?` · 模擬擊殺 ${score.simulatedKills||0} · 承傷 ${Math.round(score.incoming||0)}${score.defeated?' · 已倒下':''}`:'');$('#training-finish').disabled=score.finished;$$('.training-live-actions [data-panel]').forEach(button=>button.setAttribute('aria-label',score.finished?'查看已完成的訓練傷害分析':'查看目前訓練傷害分析'));$('#training-reset').textContent=score.finished?'再測一次':'重置';
}
function renderTrainingResults(){
 const score=e.trainingSummary()||trainingHUDSummary;if(!score){renderTraining();return;}trainingHUDSummary=score;const options=score.options,preview=e.trainingPreview(options),nativeBoss=e.trainingPreview({preset:'boss'}),nativeDefense=options.preset==='boss'&&preview.armor===nativeBoss.armor&&Object.entries(nativeBoss.resistances).every(([type,value])=>preview.resistances[type]===value),kindNames={set:'套裝',basic:'普攻',skill:'技能',aura:'光環',summon:'召喚',dot:'持續傷害',trigger:'裝備觸發',other:'其他'},typeNames={physical:'物理',fire:'火焰',cold:'冰霜',lightning:'閃電',poison:'毒素'},bossRatio=score.bossHp>0?score.maxHit/score.bossHp:0;
 $('#dialog-body').innerHTML=`<div class="training-score-heading"><span>${score.finished?'已完成':score.started?'本次快照 · 開啟面板暫停計時':'等待首次傷害'} · ${formatTime(score.elapsed)} · ${options.targets} 靶</span><button class="text-btn" data-panel="training">設定 ${icon('chevron')}</button></div><div class="training-score-grid">${[['平均 DPS',score.dps],['近 5 秒 DPS',score.recentDps],['峰值 1 秒 DPS',score.peakDps],['累計實傷',score.total],['最大單次',score.maxHit],['原始傷害',score.rawTotal]].map(([label,value])=>`<div><span>${label}</span><b>${trainingNumber(value)}</b></div>`).join('')}</div><div class="training-analysis"><p><b>${options.unlimitedMana?'自動補魔 · 僅測施放頻率，不代表實戰續航':'真實魔力 · 平均包含缺魔與移動時間'}</b></p><p>${trainingDefenseMarkup(preview)} · 原始到實傷淨減免 ${trainingPercent(score.mitigation)} · 命中 ${trainingNumber(score.hits,0)}／爆擊 ${trainingNumber(score.crits,0)}（${trainingPercent(score.critRate)}） · 特殊爆擊 ${trainingNumber(score.specialCrits||0,0)}次（單次命中）</p><p>本級${M.DIFFICULTIES[1].name}首領生命 <b>${trainingNumber(score.bossHp)}</b> · 最大單次占首領生命 <b>${trainingPercent(bossRatio)}</b>。主靶 DPS <b>${trainingNumber(score.primaryDps)}</b>，估計擊破 <b>${score.estimatedBossSeconds===null?'尚無傷害':trainingNumber(score.estimatedBossSeconds)+' 秒'}</b>${score.bossKillTime===null?'':' · 已於 '+trainingNumber(score.bossKillTime)+' 秒累積首領生命傷害'}。</p><p class="training-note">估時使用第一個目標的傷害，假設目標不移動、以目前木樁防禦承傷。${!nativeDefense?'目前採自訂或非首領防禦，不能視為實際首領擊殺時間。':'未計入實際首領的攻擊、移動與被迫閃避。'}多靶總傷害不可直接用於估算打王速度。</p></div><div class="training-types">${Object.entries(typeNames).map(([type,name])=>`<span>${name}<b>${trainingNumber(score.byType?.[type]||0)}</b></span>`).join('')}</div><div class="training-source-table"><table><caption>傷害來源 · 實際命中與持續傷害</caption><thead><tr><th>來源</th><th>傷害</th><th>DPS</th><th>占比</th><th>命中／爆擊</th></tr></thead><tbody>${score.sources.map(source=>`<tr><td><b>${esc(source.name)}</b><small>${esc(kindNames[source.kind]||source.kind||'其他')}</small></td><td>${trainingNumber(source.damage)}</td><td>${trainingNumber(source.dps)}</td><td>${trainingPercent(source.share)}</td><td>${trainingNumber(source.hits,0)}／${trainingNumber(source.crits,0)}</td></tr>`).join('')||'<tr><td colspan="5" class="training-empty">尚無傷害。關閉面板，走近木樁開始測試。</td></tr>'}</tbody></table></div>${score.previous?`<p class="training-note training-previous">上一樣本：平均 ${trainingNumber(score.previous.dps)} DPS · ${formatTime(score.previous.elapsed)} · 總傷害 ${trainingNumber(score.previous.total)}。比較時請維持相同目標、防禦與魔力設定。</p>`:''}<div class="training-results-actions"><button class="text-btn" data-training-action="camp">返回營地</button><button class="outline-btn" data-training-action="reset">重新測試</button></div>`;
}
document.addEventListener('change',ev=>{if(ev.target.closest('#training-form'))updateTrainingPreview();});
document.addEventListener('submit',ev=>{if(ev.target.id==='training-form'){ev.preventDefault();beginTraining();}});

function storageSummaryMarkup(){
 const info=profileStore?.info;if(!info)return '';
 const kb=value=>(Math.max(0,value)/1024).toFixed(1)+' KB',saved=info.jsonBytes?Math.round((1-info.storedBytes/info.jsonBytes)*100):0;
 const labels={incompatible:'不相容原檔',corrupt:'受損原檔','unsupported-codec':'未能解壓的原檔','before-replace':'覆蓋前備份'};
 const backups=recoveryBackups.length?`<details class="recovery-backups" ${!state.active?'open':''}><summary>復原備份 · ${recoveryBackups.length} 份</summary>${!state.active?'<p>此裝置的原始資料已保留。可以先下載，或匯入可讀取的備份。</p>':''}<ul>${recoveryBackups.map(entry=>`<li><span>${labels[entry.reason]||'原始存檔'} · ${esc(new Date(entry.savedAt).toLocaleString('zh-TW'))}</span><button type="button" class="text-btn" data-recovery-download="${esc(entry.id)}">下載</button></li>`).join('')}</ul></details>`:'';
 const qa=pendingQaBackup?`<div class="storage-qa-import"><p>已選取全滿測試存檔。可匯入到獨立測試版。</p><button type="button" class="gold-btn" data-qa-import>匯入到全滿測試版</button><a class="outline-btn" href="${localQaOrigin}/">只開啟測試版</a></div>`:'';
 return `<section class="storage-summary"><b>本機存檔</b><small>壓縮後 ${kb(info.storedBytes)} · 原始 ${kb(info.jsonBytes)} · 節省 ${saved}%</small><div class="storage-backup-actions"><button type="button" data-export>匯出備份</button><button type="button" data-import ${e.mode==='playing'?'disabled':''}>匯入備份</button>${!state.active&&recoveryBackups.length?'<button type="button" data-recovery-continue>建立新角色</button>':''}</div>${qa}${backups}</section>`;
}
function downloadSaveFile(blob,filename){
 const url=URL.createObjectURL(blob),link=document.createElement('a');
 link.href=url;link.download=filename;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
document.addEventListener('click',async event=>{
 const button=event.target.closest('[data-recovery-download],[data-recovery-continue]');
 if(!button||panel!=='settings'||storageTransactions)return;
 if(button.hasAttribute('data-recovery-continue')){openPanel('characters');return;}
 try{
  const saved=await profileStore.exportRecoveryBackup(button.dataset.recoveryDownload);
  if(!saved)throw Error();downloadSaveFile(saved.blob,saved.filename);
 }catch{toast('目前無法下載這份原始存檔。');}
});
function leaveConnectedPanel(){
 if(panel==='verified'&&verifiedPanel){verifiedPanel.close();verifiedPanel.element.remove();}
}
async function restorePersonalProfile(restored){
 if(!restored.rifts?.activeRun)for(const hero of Object.values(restored.characters))restoreLegacyEquipment(hero);
 await persistProfile(restored,{replace:true});
 await refreshRecoveryBackups();
 bindCampProfile(restored);
 if(state.rifts?.activeRun&&await settleStoredPaidRun()==='locked')void settleStoredPaidRun({wait:true});
}
function renderVerified(){
 const body=$('#dialog-body');
 if(!cloud.verifiedEnabled||!cloud.account){
  verifiedPanel?.close();
  body.innerHTML=cloud.verifiedEnabled
   ?'<div class="cloud-signin"><p>用 Google 登入後，從 Lv.1 建立公測角色。伺服器會結算戰鬥與獎勵。</p><button class="gold-btn" data-verified-signin>使用 Google 登入</button></div>'
   :'<p>公測伺服器尚未連線。本機冒險仍可遊玩。</p>';
  const signIn=body.querySelector('[data-verified-signin]');
  signIn?.addEventListener('click',async()=>{
   signIn.disabled=true;
   try{await cloud.signIn('verified');}catch{signIn.disabled=false;toast('無法開始登入，請稍後再試。');}
  });
  return;
 }
 verifiedPanel??=createVerifiedPanel({request:action=>cloud.verified(action)});
 if(body.firstElementChild===verifiedPanel.element)return;
 body.replaceChildren(verifiedPanel.element);
 void verifiedPanel.open();
}
function renderSettings(){
 const verifiedLink=cloud.verifiedEnabled?'<button type="button" class="gold-btn" data-panel="verified">公測遠征</button>':'';
 const homeLink=location.protocol==='file:'?'':'<a class="outline-btn" href="./index.html" data-title-home>返回首頁</a>';
 const links=verifiedLink||homeLink?`<div class="settings-links">${verifiedLink}${homeLink}</div>`:'';
 const portable=!document.querySelector('script[src^="updates.js"]');
 const history=portable?'<details class="standalone-release-history"><summary>更新紀錄</summary><div class="release-history" id="standalone-release-history"></div></details>':'';
 $('#dialog-body').innerHTML=`${storageSummaryMarkup()}<section class="pointer-aim-setting"><label class="settings-toggle"><input type="checkbox" data-pointer-aim ${e.pointerAimEnabled?'checked':''}><span><b>朝滑鼠位置施放</b><small>普攻與技能朝游標，範圍技能指定落點；關閉時自動索敵，手機維持自動索敵。</small></span></label></section><section class="audio-settings" aria-label="音效">
  <label for="sfx-volume">音效音量 <output id="sfx-value">${Math.round(audio.volume*100)}%</output></label>
  <div><input id="sfx-volume" type="range" min="0" max="100" step="1" value="${Math.round(audio.volume*100)}">
  <button type="button" class="outline-btn" data-sfx-mute>${audio.volume?'靜音':'取消靜音'}</button>
  <button type="button" class="outline-btn" data-sfx-test>試聽</button></div>
 </section>${links}${history}`;
 if(portable)renderReleaseHistory($('#standalone-release-history'),RELEASE_NOTES);
}
$('#settings').addEventListener('click',()=>openPanel('settings'));
function changeSoundVolume(value){
 const volume=audio.setVolume(value);
 if(volume>0)lastAudibleVolume=volume;
 storeVolume(volume);
 $('#sfx-volume').value=Math.round(volume*100);
 $('#sfx-value').textContent=Math.round(volume*100)+'%';
 $('[data-sfx-mute]').textContent=volume?'靜音':'取消靜音';
 if(volume>0)void audio.unlock();
}
$('#dialog-body').addEventListener('input',event=>{
 if(event.target.id==='sfx-volume')changeSoundVolume(Number(event.target.value)/100);
});
$('#dialog-body').addEventListener('click',event=>{
 if(event.target.closest('[data-sfx-mute]'))changeSoundVolume(audio.volume?0:lastAudibleVolume);
 if(event.target.closest('[data-sfx-test]')&&audio.volume>0)
  void audio.unlock().then(ok=>{if(ok&&!document.hidden)audio.play('cleave');});
});
$('#dialog-body').addEventListener('click',async event=>{
 const link=event.target.closest('[data-title-home]');
 if(!link||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
 event.preventDefault();
 if(link.dataset.pending)return;
 link.dataset.pending='1';
 try{
  if(e.mode!=='camp'&&!await returnToCamp())throw Error();
  const parkedPaidRun=state.rifts?.activeRun&&!paidLockOwned;
  if(!parkedPaidRun&&!await save(true))throw Error();
  await profileStore.flush();
  location.assign(link.href);
 }catch{toast('進度尚未儲存。請稍後再試或先匯出備份。');}
 finally{delete link.dataset.pending;}
});

window.addEventListener('emberfall:pwa-overlay',event=>{pwaOverlayOpen=event.detail?.open===true;release();updatePause();});

window.addEventListener('resize',()=>{if(panel==='passives'){centerPassiveView(false);renderPassiveDetail();}});

// Fail closed: updates wait for the durable save, and never reload a live expedition.
window.addEventListener('emberfall:update-save',event=>{
 const result=event.detail;if(!result||typeof result!=='object')return;
 result.ok=false;
 if(e.mode!=='camp'||e.training||e.transition){result.reason='請先返回營地，再儲存並更新。';return;}
 result.pending=(async()=>{
  try{flushCombatUI();const saved=await save(true);if(saved)await profileStore.flush();result.ok=saved&&storageOK;result.reason=result.ok?'':'存檔失敗，已取消更新。請先匯出備份。';}
  catch{result.reason='存檔失敗，已取消更新。請先匯出備份。';}
 })();
});

document.addEventListener('change',event=>{
 const toggle=event.target.closest('[data-short-skill-description]');if(!toggle)return;
 shortSkillDescriptions=toggle.checked;
 try{localStorage.setItem(SKILL_DESCRIPTION_KEY,shortSkillDescriptions?'short':'full');}catch{toast('說明模式已套用，此裝置暫時無法記住設定。');}
 if(panel==='talents')refreshSkillAtlasDetail();else renderPanel();$('#dialog-body [data-short-skill-description]')?.focus({preventScroll:true});
});

$('#dialog-body').addEventListener('change',event=>{if(!event.target.matches('[data-pointer-aim]'))return;e.pointerAimEnabled=event.target.checked;document.body.classList.toggle('pointer-aim-on',e.pointerAimEnabled);try{localStorage.setItem(POINTER_AIM_KEY,String(e.pointerAimEnabled));}catch{toast('瞄準已切換，此裝置無法保存設定。');}});
