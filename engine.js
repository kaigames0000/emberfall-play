import {manaSiphonBudget} from './mana-economy.js?v=108';
import {FLASK_SLOT_COUNT,isFlaskSlot} from './flask-belt.js?v=108';
import {HORDE_RULES,HordeTrial,hordeReward,hordeLootStats,openingGolemSplash,scaleHordeResource} from './horde-trial.js?v=108';
import {advanceDot} from './poison-stacks.js?v=108';
import {installBerserkerBloodCombat} from './berserker-blood-combat.js?v=108';
import {installEnemyRarity} from './enemy-rarity.js?v=108';
import {installTrainingScenarios} from './training-scenarios.js?v=108';
import {installClassIdentityCombat} from './class-identity-combat.js?v=123';
import {installResourceAvailability} from './resource-availability.js?v=147';
import {skillWeaponCompatible} from './skill-weapon-rules.js?v=129';
import {enemyImpactDamage,enemyWarningTime,hostileProjectileSpeed,recoverOwnedResources,normalAbbey,summonBossHitMultiplier} from './combat-balance.js?v=108';
import {installBasicAttacks,updateInheritedBasic} from './basic-attack-combat.js?v=129';
import {installAutomaticAuras} from './automatic-auras.js?v=108';
import {ExpeditionRisk} from './expedition-risk.js?v=108';
import {pointerAimPoint,playerAimAngle,playerAimPlacement} from './aiming.js?v=108';
import {WorldObjects} from './world-objects.js?v=140';
import {beamBoundingRadius,circleIntersects,circleInBeam,circleInSector,projectileBodyRadius,segmentCircleEntry} from './combat-geometry.js?v=108';
import {skillCue,projectileCue,travelCue,elementalSprite,hasTargetImpact,targetImpactCue} from './combat-vfx.js?v=126';
import {movementTiming} from './hero-motion.js?v=127';
import {summonStrike} from './summon-pose.js?v=127';
import {CombatHitFeedback} from './combat-hit-feedback.js?v=123';
import {pickupAllowed} from './pickup-filter.js?v=108';
import {canStand,walkVisible,nearestGround,moveOnTerrain,approachOnTerrain,terrainBounds} from './room-terrain.js?v=108';
import {EndgameCombat} from './endgame-combat.js?v=108';
import {stats,addXP,isRingHero,ringBudget,rollDropLevel,ROOMS,completeZone,FLASKS,ABILITIES,availableSkills,skillLoadout,abilityFor,DIFFICULTIES,equipmentAuras,equipmentTriggers,triggerAbility,resourceCost,sumResourceCosts,summonUnitResourceCost,autoSkill,weaponDefinition,flaskDefinition,makeFlask,rollResourceLoot,SHRINES,skillCategory,auraLoadout,summonPlan,summonCapacity,movementSkill,reconcileSkillLoadouts,rollEquipmentLoot,rollItemDrop,paidBossEquipment,areaLevel,SETS,recordAchievementKill,recordAchievementShrine} from './model.js?v=140';
import {ChapterCombat} from './chapter-combat.js?v=108';
import {EnemyCombat} from './enemy-combat.js?v=123';
import {canChapter} from './campaign-progress.js?v=108';
import {chapterDefinition} from './chapter-data.js?v=108';
import {contextBand} from './encounter-context.js?v=108';
import {installGameplay} from './gameplay-runtime.js?v=129';
import {SetCombat} from './set-combat.js?v=123';
import {Expedition} from './expedition.js?v=140';
import {MinionCombat} from './minion-combat.js?v=108';
import {RangerCombat} from './ranger-combat.js?v=129';
import {RingCombat,debuffStrength} from './ring-combat.js?v=108';
import {ELEMENTS,HERO_RESISTANCE_PENALTY,MAX_BURN_STACKS,MAX_AILMENT_DURATION,setEnemyDefense,strengthenEliteDefense,immuneToStatus,applyShock,advanceShock} from './elemental-rules.js?v=108';
export const DAMAGE_TYPES=['physical','fire','cold','lightning','poison'];
const DOT_ABILITIES=new Set(['r_venom']);
const emptyDamage=()=>Object.fromEntries(DAMAGE_TYPES.map(t=>[t,0]));
function activeSkillInfusion(stats,options){const id=options.id||options.ability||options.source;return stats.elementalInfusion&&options.skill&&id&&ABILITIES[id]&&ABILITIES[id].type!=='aura'&&!DOT_ABILITIES.has(id)&&!options.minion&&!options.aura&&!options.dot&&!options.triggered&&!options.indirect?stats.elementalInfusion:null;}

export function abilityDamageTypes(id){const type=ABILITIES[id]?.damageType??ABILITIES[id]?.summon?.damageType;if(type)return {[type]:1};return id==='w_blitz'?{physical:.5,lightning:.5}:{physical:1};}
export function outgoingDamage(s,amount,options={}){
 if(options.clone){const packet=outgoingDamage(s,amount,{...options,clone:false,minion:false,indirect:false}),mult=Math.max(0,options.inheritance??1)*Math.max(0,s.summonDamage??1);for(const type of DAMAGE_TYPES)packet.byType[type]*=mult;packet.total*=mult;return packet;}
 const id=options.id||options.ability||options.source,composition=options.damageTypes||(options.damageType?{[options.damageType]:1}:abilityDamageTypes(id)),tag=options.tag||(ABILITIES[id]?.attackTag??(ABILITIES[id]?.cls==='mage'?'spell':'attack')),minion=!!options.minion,dot=!!options.dot||DOT_ABILITIES.has(id),byType=emptyDamage(),coefficient=(s.atk||0)>0?Math.max(0,amount)/(s.atk||1):0;
 const infusion=activeSkillInfusion(s,options),flats=minion||dot||options.indirect||options.aura?{}:tag==='spell'?s.flatSpellDamage||{}:s.flatAttackDamage||{};
 for(const type of DAMAGE_TYPES){const base=Math.max(0,amount)*(composition[type]||0)+(flats[type]||0)*coefficient+Math.max(0,amount)*(infusion?.[type]||0);if(!base)continue;let increase;
  if(minion)increase=(s.summonDamage??1)+(s.damageBonus||0)+(options.summonFocusBonus||0);
  else increase=1+(s.damageBonus||0)+(s.damageIncreases?.[type]||0)+(options.skill?(s.skillMult??1)-1:0)+(tag==='spell'?s.spellDamage||0:s.attackDamage||0)+(!options.skill&&!dot&&!options.aura&&!options.triggered&&!options.indirect?(s.basicDamage||0):0);
  if(dot&&!minion)increase+=(s.dotDamage||0)+(type==='poison'?s.poisonDotDamage||0:type==='fire'?s.burnDamage||0:options.bleed?s.bleedDamage||0:0);
  byType[type]=Math.max(0,base*Math.max(0,increase));
 }
 return {byType,total:Object.values(byType).reduce((n,v)=>n+v,0)};
}
const coldExposure=target=>target.auraDebuffs?.['frost-exposure']?.coldExposure??0;
const heroCast=options=>!options.triggered&&!options.triggerKey&&!options.actor&&!options.minion&&!options.clone&&!options.indirect&&!options.setSecondary&&!options.ringSecondary;
function applyDotTick(game,target,tick,effect,damageType){
 const lifeLost=Math.min(target.hp,tick.damage);
 if(!(lifeLost>0))return;
 game.recordTrainingDamage(target,lifeLost,{dot:true,source:effect.source,damageType,raw:tick.raw});
 recoverOwnedResources(game,lifeLost,true,effect,target,true);
 target.hp-=lifeLost;
 game.soundDotImpact(target,damageType,lifeLost);
}
export function mitigateDamage(packet,defender={},attackerLevel=1,options={}){
 const input=packet.byType||packet,byType=emptyDamage(),level=Math.max(1,attackerLevel||1),generic=Math.max(0,Math.min(.5,defender.reduce||0));
 for(const type of DAMAGE_TYPES){const amount=Math.max(0,input[type]||0);if(!amount)continue;let factor;
  if(type==='physical'){const armor=options.dot?0:Math.min(.6,Math.max(0,defender.armor||0)/(Math.max(0,defender.armor||0)+12*level)),extra=Math.min(.2,Math.max(0,defender.physicalReduce||0));factor=Math.max(.25,(1-armor)*(1-extra)*(1-generic));}
  else {const resistance=Math.max(-.5,Math.min(.75,(defender.resistances?.[type]||0)-(type==='cold'?coldExposure(defender):0)-(options.penetrations?.[type]||0))),elementalFactor=defender.immunities?.includes(type)?Math.max(0,Math.min(.3,options.immunityPierce?.[type]||0)):1-resistance;factor=elementalFactor*(1-generic)*(options.spell?1-Math.min(.6,Math.max(0,defender.resist||0)):1);}
  byType[type]=amount*factor;
 }
 return {byType,total:Object.values(byType).reduce((n,v)=>n+v,0)};
}
export const ENEMY_KINDS={
 melee:{name:'墮落步卒',hp:68,armor:1,speed:86,damage:12,interval:1.25},
 shield:{name:'灰誓盾衛',hp:100,armor:6,speed:56,damage:13,interval:1.5},
 elite:{name:'墮落重甲騎士',hp:240,armor:6,speed:68,damage:22,interval:1.8},
 summoner:{name:'骸骨召喚師',hp:82,armor:0,speed:74},
 skeleton:{name:'骸骨僕從',hp:26,armor:0,speed:72,damage:5,interval:1.6},
 skirmisher:{name:'灰刃遊蕩者',hp:56,armor:0,speed:118,damage:9,interval:1.1},
 bomber:{name:'腐火投擲者',hp:62,armor:0,speed:68},
 wraith:{name:'霧行怨靈',hp:58,armor:0,speed:82},
 caster:{name:'禁術法師',hp:75,armor:0,speed:82},
 archer:{name:'亡者射手',hp:72,armor:1,speed:86},
 charger:{name:'裂角衝鋒者',hp:82,armor:1,speed:132,damage:12,interval:1.25},
 boss:{name:'灰燼君王',hp:4000,armor:25,speed:60}
};
export const ELITE_MODIFIERS={
 ember:{key:'ember',name:'赤焰',trait:'熔火殘留',color:'#e69a61',element:'fire',interval:7},
 frost:{key:'frost',name:'霜脈',trait:'霜環禁地',color:'#8ed6e5',element:'cold',interval:8},
 storm:{key:'storm',name:'雷紋',trait:'追獵連雷',color:'#c4a4ee',element:'lightning',interval:9},
 wind:{key:'wind',name:'掠風',trait:'雙段突襲',color:'#9cd7b2',interval:7.5},
 quake:{key:'quake',name:'震地',trait:'裂地三連震',color:'#d9ba76',interval:8}
};
export function isElite(enemy){return enemy.type==='elite'||!!enemy.elite;}
export function isBoss(enemy){return enemy.type==='boss'||enemy.type==='miniboss';}
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y),clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export class Game{
 constructor(character,onEvent=()=>{},random=Math.random,now=Date.now){this.now=now;this.c=character;this.onEvent=onEvent;this.rand=random;this.mode='camp';this.training=null;this.hordeTrialEnabled=false;this.paused=false;this.input={x:0,y:0,attack:false};this.clock=0;this.room=0;this.diff=1;this.reset();}
 setHordeTrial(value){if(this.mode!=='camp'||typeof value!=='boolean')return false;this.hordeTrialEnabled=value;return true;}
 static trainingPresets={boss:{name:`${DIFFICULTIES[1].name} Boss 木樁`,description:`沿用${DIFFICULTIES[1].name}王座區域等級的血量與防禦，超過區域上限後不再隨角色增長。`},melee:{name:'普通怪物木樁',description:`${DIFFICULTIES[1].name}第一區墮落步卒的防禦。`},zero:{name:'零防禦木樁',description:'護甲與元素抗性為零，用於比較傷害倍率；不等於實戰 Boss。'}};
 trainingPreview(options={}){
  if(!options||typeof options!=='object'||Array.isArray(options))options={};const preset=Object.hasOwn(Game.trainingPresets,options.preset)?options.preset:'boss',reference=Game.prototype.spawn.call({c:this.c,diff:1,room:preset==='melee'?0:ROOMS.length-1,rand:()=>.5},preset==='melee'?'melee':'boss',560,400),boss=Game.prototype.spawn.call({c:this.c,diff:1,room:ROOMS.length-1,rand:()=>.5},'boss',560,400);
  const armor=typeof options.armor==='number'&&Number.isFinite(options.armor)?clamp(options.armor,0,2000):preset==='zero'?0:reference.armor,resistance=typeof options.resistance==='number'&&Number.isFinite(options.resistance)?clamp(options.resistance,-.5,.75):null,resistances=Object.fromEntries(['fire','cold','lightning','poison'].map(type=>[type,resistance??(preset==='zero'?0:reference.resistances[type])]));
  return {preset,name:Game.trainingPresets[preset].name,armor,resistance,resistances,referenceHp:reference.maxHp,bossHp:boss.maxHp,level:reference.level,targets:[1,3,8].includes(options.targets)?options.targets:1,duration:[0,30,60].includes(options.duration)?options.duration:30,unlimitedMana:options.unlimitedMana===true};
 }
 startTraining(options={}){
  if(this.mode!=='camp'||this.paused||this.transition||this.training)return false;const savedArmy=this.summons.filter(a=>a.hp>0).map(a=>({skill:a.source,hp:a.hp}));this.training={options,savedArmy,hero:this.c.id};this.resetTraining(options);this.emit('trainingStart');return true;
 }
 resetTraining(options){
  if(!this.training)return false;const old=this.training,previous=old.started?this.trainingSummary():old.previous||null,settings=this.trainingPreview(options??old.options);if(previous)delete previous.previous;
  this.diff=1;this.reset();this.mode='playing';this.room=ROOMS.length-1;this.summons=[];this.minionCombat.reconcileSupportSources();this.player={x:560,y:520,angle:-Math.PI/2};this.cleared=false;this.training={options:settings,savedArmy:old.savedArmy,hero:old.hero,previous,started:false,finished:false,elapsed:0,total:0,rawTotal:0,primaryDamage:0,maxHit:0,hits:0,crits:0,peakDps:0,bossKillTime:null,byType:emptyDamage(),sources:new Map(),buckets:[]};
  for(let i=0;i<settings.targets;i++){const angle=(i-1)/Math.max(1,settings.targets-1)*Math.PI*2,x=560+(i?Math.cos(angle)*65:0),y=400+(i?Math.sin(angle)*65:0),enemy=this.spawn(settings.preset==='melee'?'melee':'boss',x,y);Object.assign(enemy,{trainingDummy:true,dummy:true,trainingPrimary:i===0,trainingIndex:i,referenceHp:settings.referenceHp,name:settings.name+(i?' '+(i+1):' · 主樁'),armor:settings.armor,resistances:{...settings.resistances},immunities:[],statusImmunities:[],hp:1e12,maxHp:1e12,speed:0,cd:1e9,specialCD:1e9});this.enemies.push(enemy);}
  this.encounter={name:'DPS 訓練場',desc:'首次命中開始計時；無經驗、掉落與通關進度。'};this.emit('trainingReset');return true;
 }
 restoreTrainingArmy(){if(!this.training)return;const saved=this.training;this.training=null;this.summons=saved.hero===this.c.id?saved.savedArmy.map((record,index)=>this.createSummon(record.skill,index,record.hp,saved.savedArmy.length)).filter(Boolean):[];this.reconcileSummons();}
 finishTraining(){if(!this.training||this.training.finished)return false;this.training.finished=true;this.channel=null;this.emit('trainingEnd');return true;}
 trainingRefill(){if(this.training?.options.unlimitedMana&&!this.training.finished&&this.mode==='playing'&&!this.paused&&!this.transition)this.mana=this.s.mana;}
 recordTrainingDamage(enemy,amount,details={}){
  const t=this.training;if(!t||t.finished||!enemy?.trainingDummy||!Number.isFinite(amount)||amount<=0)return;if(!t.started){t.started=true;t.elapsed=0;}
  const support=typeof details.source==='string'&&details.source.startsWith('link:')?details.source:null,ability=support||details.id||details.ability||details.source,def=ABILITIES[ability],setID=typeof ability==='string'&&ability.startsWith('set:')?ability.slice(4):null,kind=setID?'set':details.dot?'dot':details.triggered?'trigger':details.aura?'aura':details.minion?'summon':details.skill?'skill':details.indirect?'other':'basic',prefix={set:'套裝',dot:'持續傷害',trigger:'裝備觸發',aura:'光環',summon:'召喚',skill:'技能',other:'其他',basic:'普攻'}[kind],id=kind+':'+(setID||support?ability:def?ability:kind==='basic'?'basic':details.damageType||'other'),name=kind==='basic'?'普通攻擊':prefix+' · '+(SETS[setID]?.name||({'link:m_relay':'靈紋續擊','link:m_confluence':'元素共鳴'}[support])||def?.name||(details.damageType==='poison'?'毒素':details.damageType==='fire'?'燃燒':'傷害'));
  let row=t.sources.get(id);if(!row){row={id,name,kind,damage:0,hits:0,crits:0};if(t.sources.size<50)t.sources.set(id,row);else row=t.sources.get('other:overflow')||{id:'other:overflow',name:'其他來源',kind:'other',damage:0,hits:0,crits:0};if(!t.sources.has(row.id)&&t.sources.size>=50){const last=[...t.sources.keys()].at(-1),existing=t.sources.get(last);t.sources.delete(last);row.damage+=existing.damage;row.hits+=existing.hits;row.crits+=existing.crits;t.sources.set(row.id,row);}}
  row.damage+=amount;t.total+=amount;const raw=Number.isFinite(details.raw)?Math.max(0,details.raw):amount;t.rawTotal+=raw;if(!details.dot){t.hits++;row.hits++;t.maxHit=Math.max(t.maxHit,amount);if(details.crit){t.crits++;row.crits++;}if(details.specialCrit)t.specialCrits=(t.specialCrits||0)+1;}
  if(enemy.trainingPrimary){t.primaryDamage+=amount;if(t.bossKillTime===null&&t.primaryDamage>=t.options.bossHp)t.bossKillTime=t.elapsed;}
  const packet=details.byType||{[details.damageType||'physical']:amount},sum=Object.values(packet).reduce((n,v)=>n+(Number.isFinite(v)&&v>0?v:0),0);if(sum>0)for(const type of DAMAGE_TYPES)t.byType[type]+=amount*Math.max(0,packet[type]||0)/sum;else t.byType.physical+=amount;
  const bucketTime=Math.floor((t.elapsed+1e-8)*10)/10,last=t.buckets.at(-1);if(last&&last.time===bucketTime)last.damage+=amount;else t.buckets.push({time:bucketTime,damage:amount});t.buckets=t.buckets.filter(b=>b.time>t.elapsed-5-1e-8).slice(-128);t.peakDps=Math.max(t.peakDps,t.buckets.filter(b=>b.time>t.elapsed-1+1e-8).reduce((n,b)=>n+b.damage,0));
 }
 trainingSummary(){
  const t=this.training;if(!t)return null;const seconds=Math.max(1,t.elapsed),primaryDps=t.primaryDamage/seconds,recent=t.buckets.filter(b=>b.time>t.elapsed-5+1e-8).reduce((n,b)=>n+b.damage,0);
  return {started:t.started,finished:t.finished,elapsed:t.elapsed,total:t.total,rawTotal:t.rawTotal,dps:t.total/seconds,recentDps:recent/Math.max(1,Math.min(5,t.elapsed)),peakDps:t.peakDps,maxHit:t.maxHit,hits:t.hits,crits:t.crits,specialCrits:t.specialCrits||0,critRate:t.hits?t.crits/t.hits:0,primaryDps,primaryDamage:t.primaryDamage,bossHp:t.options.bossHp,estimatedBossSeconds:primaryDps>0?t.options.bossHp/primaryDps:null,bossKillTime:t.bossKillTime,mitigation:t.rawTotal>0?1-t.total/t.rawTotal:0,byType:{...t.byType},sources:[...t.sources.values()].map(row=>({...row,dps:row.damage/seconds,share:t.total?row.damage/t.total:0})).sort((a,b)=>b.damage-a.damage),options:{...t.options,resistances:{...t.options.resistances}},previous:t.previous};
 }
 reset(restore=false){
  this.terrain=null;this.objectives=[];this.worldObjects=new WorldObjects(this);
  this.hitFeedback=new CombatHitFeedback();
  this.bagFullNotified=false;
  const survivors=!restore&&this._summonHero===this.c.id?(this.summons||[]).filter(a=>a.hp>0).map(a=>({skill:a.source,hp:a.hp})):(this.c.summonState||[]);this._summonHero=this.c.id;reconcileSkillLoadouts(this.c);
  this._abilityCache=new Map();this.baseS=stats(this.c);this.refreshEquipmentTriggers();this.bossManaCD=0;this.buffs=[];this.skillEffects=[];this.auraIds=new Set();this.auraTimers={};this.auraIntervals={};this.transition=null;this.shrines=[];this.enemyFields=[];this.playerSlow=1;this._shrineStamp='';this.summons=[];this.summonCD=0;this.armyPlan=summonPlan(this.c);this.skillCooldowns={};this.triggerCooldowns={};this.processingTrigger=false;this.manaLeechAllowance=manaSiphonBudget(this.baseS);this.passiveLeechAllowance=this.baseS.hp*.1;this.cooldowns=[0,0,0];this.dodgeCD=0;this.channel=null;this.autoCastCD=0;this.noManaNotice=0;this.s={...this.baseS};this.setCombat=new SetCombat(this);this.minionCombat=new MinionCombat(this);this.rangerCombat=new RangerCombat(this);this.ringCombat=new RingCombat(this);this.lootFloor=null;this.expedition=new Expedition(this);this.horde=new HordeTrial(this);this.expeditionRisk=new ExpeditionRisk(this);this.chapterCombat=new ChapterCombat(this);this.enemyCombat=new EnemyCombat(this);this.endgameCombat=new EndgameCombat(this);this.applyBuffs();this.hp=this.s.hp;this.mana=this.s.mana;
  this.refreshFlaskBelt();this._dropHero=this.c.id;this.player={x:560,y:560,angle:-Math.PI/2};this.moveTarget=null;this.enemies=[];this.bullets=[];this.effects=[];this.drops=(this.c.groundLoot||[]).map(item=>({item,x:560,y:650,t:0}));this.numbers=[];this.hazards=[];this.attackCD=0;this.invuln=0;this.dashTime=0;this.dashCue=null;this.elapsed=0;this.runKills=0;this.runGold=0;this.runLoot=0;this.wave=0;this.cleared=false;this.waveWait=0;this.shake=0;this.bossRage=false;this.eventTimer=5;this.bossAdds=9;this.encounter={name:'營地整備',desc:'普攻起步，打造自己的技能組。'};
  this.summons=survivors.map((record,index)=>this.createSummon(record.skill,index,record.hp,survivors.length)).filter(Boolean);this.reconcileSummons();
 }
 emit(type,data={}){if(type==='dead')this.minionCombat.onOwnerDeath();this.onEvent(type,data);}
 skillStamp(id){const ability=this.ability(id);return ability?JSON.stringify([ability.level,ability.synergyBonus,ability.radius,ability.explosionRadius,ability.length,ability.width,ability.duration,ability.extraProjectiles,ability.chain?.jumps,ability.chain?.range,ability.poisonStackLimit,ability.poisonCloudRadius]):null;}
 refreshEquipmentTriggers(){
  this.triggerDefinitions=new Map();
  for(const trigger of equipmentTriggers(this.c)){
   const ability=triggerAbility(this.c,trigger.skill,trigger.level);if(!ability)continue;
   const def={...ability};for(const key of ['damage','burn','shield','freeze','poisonFraction','heal','slow','slowDuration','freezeChance','freezeDuration','shock','shockCritTaken','shockCritDamage','stun'])if(typeof def[key]==='number')def[key]*=trigger.scale;
   for(const key of ['buff','debuff'])if(def[key])def[key]=Object.fromEntries(Object.entries(def[key]).map(([key,value])=>[key,value*trigger.scale]));
   const stamp=JSON.stringify([trigger.skill,def,this.baseS.atk,this.baseS.skillMult,this.baseS.damageIncreases,this.baseS.penetrations,this.baseS.flatAttackDamage,this.baseS.flatSpellDamage]);
   this.triggerDefinitions.set(trigger.key,{trigger,def,stamp});
  }
 }
 triggerStamp(key){return this.triggerDefinitions.get(key)?.stamp??null;}

 reconcileSkills(){const allowed=new Set(availableSkills(this.c)),valid=(effect,id)=>effect.passiveKey?this.gameplay?.talents.owns(effect.passiveKey):effect.triggerKey?this.triggerStamp(effect.triggerKey)!==null&&effect.stamp===this.triggerStamp(effect.triggerKey):allowed.has(id)&&effect.stamp===this.skillStamp(id);const previousAuras=[...this.auraIds].join(',');this.auraIds=new Set([...this.auraIds].filter(id=>allowed.has(id)&&auraLoadout(this.c).includes(id)&&skillCategory(id)==='aura'));for(const id of Object.keys(this.auraTimers))if(!this.auraIds.has(id))delete this.auraTimers[id];this.skillEffects=this.skillEffects.filter(b=>valid(b,b.id)&&(b.sourceHP===undefined||this.baseS.hp>=b.sourceHP));this.reconcileSummons();this.rangerCombat.reconcile();for(const enemy of this.enemies||[]){let changed=false;for(const [key,debuff]of Object.entries(enemy.auraDebuffs||{}))if(debuff.triggerKey&&debuff.stamp!==this.triggerStamp(debuff.triggerKey)){delete enemy.auraDebuffs[key];changed=true;}if(changed)this.aggregateAuraDebuffs(enemy);for(const [key,dot]of Object.entries(enemy.dots||{}))if(dot.triggerKey&&dot.stamp!==this.triggerStamp(dot.triggerKey))delete enemy.dots[key];if(enemy.burnStacks)enemy.burnStacks=enemy.burnStacks.filter(dot=>!dot.triggerKey||dot.stamp===this.triggerStamp(dot.triggerKey));}this.hazards=this.hazards.filter(h=>!h.ability||valid(h,h.ability));this.bullets=this.bullets.filter(b=>(!b.triggerKey||valid(b,b.ability))&&(!b.actor||this.summons.includes(b.actor)&&b.actor.hp>0&&allowed.has(b.ability)&&(!b.stamp||b.stamp===this.skillStamp(b.ability))));if(this.channel&&(!allowed.has(this.channel.id)||!skillWeaponCompatible(this.c,this.channel.id)||this.channel.stamp!==this.skillStamp(this.channel.id)||(this.channel.source==='auto'?this.c.autoEnabled===false||autoSkill(this.c)!==this.channel.id:skillLoadout(this.c)[this.channel.slot]!==this.channel.id)))this.channel=null;if(previousAuras!==[...this.auraIds].join(','))this.applyBuffs();}
 ability(id){if(!this._abilityCache)this._abilityCache=new Map();if(!this._abilityCache.has(id))this._abilityCache.set(id,abilityFor(this.c,id));return this._abilityCache.get(id);}
 damagePreview(def,options={}){const minion=options.minion??!!def.summon,coefficient=minion?(def.summon?.attackMult??def.damage??0):def.damage||0,more=minion||options.dot?1:def.id==='w_whirl'?this.s.whirl:def.id==='m_meteor'?this.s.meteor:def.id==='r_snipe'?this.s.snipe:1;const base=minion?(this.s.summonAttackBase||this.s.atk):this.s.atk;return outgoingDamage(this.s,base*coefficient*more,{...def,skill:!minion,minion,...options});}
 refresh(){reconcileSkillLoadouts(this.c);this._abilityCache=new Map();this.baseS=stats(this.c);this.refreshEquipmentTriggers();this.armyPlan=summonPlan(this.c);this.setCombat.refresh();this.minionCombat.refresh();this.rangerCombat.refresh();this.reconcileSkills();this.applyBuffs();this.ringCombat.reconcile();this.hp=Math.min(this.s.hp,this.hp);this.mana=Math.min(this.s.mana,this.mana);this.manaLeechAllowance=Math.min(this.manaLeechAllowance,manaSiphonBudget(this.s));this.passiveLeechAllowance=Math.min(this.passiveLeechAllowance??this.s.hp*.1,this.s.hp*.1);this.syncCooldowns();this.refreshLootFloor();if(this.training)this.resetTraining();}
 syncCooldowns(){this.cooldowns=skillLoadout(this.c).map(id=>id?this.skillCooldowns[id]||0:0);}
 start(diff=1,seed=null,{chapter=1,context=null}={}){if(!canChapter(this.c,diff,chapter))return false;this.leaveRoomLoot();this.chapter=chapter;this.runContext=context;this.restoreTrainingArmy();this.diff=diff;this.room=0;this.paused=false;this.mode='playing';this.reset();this._expeditionSeq=(this._expeditionSeq??0)+1;this.expedition.start(seed??`${this.now()}:${this._expeditionSeq}:${Math.floor(this.rand()*4294967296)}`,chapter);this.enterRoom();this.emit('start');return true;}
 camp(restore=false){this.collectAll();this.restoreTrainingArmy();this.mode='camp';this.reset(restore);this.persistSummons();this.room=0;this.emit('camp');}
 currentRoom(){return this.expedition.currentRoom();}
 worldBounds(){return terrainBounds(this.terrain);}
 clampWorldPoint(x,y,inset=0){const b=this.worldBounds();return nearestGround(this.terrain,clamp(x,b.left+inset,b.right-inset),clamp(y,b.top+inset,b.bottom-inset));}
 damageables(){return [...this.enemies,...(this.worldObjects?.damageables()??[])];}
 canLand(x,y){return canStand(this.terrain,x,y);}
 walkVisible(from,to){return walkVisible(this.terrain,from,to);}
 moveActor(actor,dx,dy,slide=true){return moveOnTerrain(this.terrain,actor,dx,dy,slide);}
 approachActor(actor,target,step,stop=0){approachOnTerrain(this.terrain,actor,target,step,stop);}
 placeActor(actor,x,y){
  Object.assign(actor,this.terrain?nearestGround(this.terrain,x,y):{x,y});
  return actor;
 }
 placeFollower(ally){
  if(!this.terrain||this.walkVisible(this.player,ally))return;
  const dx=ally.x-this.player.x,dy=ally.y-this.player.y;
  ally.x=this.player.x;ally.y=this.player.y;
  this.moveActor(ally,dx,dy,false);
 }
 routeChoices(){return this.expedition.choices();}
 enterRoom(){
  const expedition=this.expedition,id=expedition.selectedID??expedition.currentID;if(this.training||!expedition.graph||expedition.enteredNodes.has(id)||this.transition&&!this.transition.entered)return false;
  if(expedition.enteredNodes.size)this.leaveRoomLoot();
  this.hitFeedback.clear();
  this.ringCombat.clear();this.player.x=560;this.player.y=650;this.enemies=[];this.bullets=[];this.hazards=[];this.effects=[];this.numbers=[];this.enemyFields=[];this.playerSlow=1;this.shrines=[];for(let i=0;i<this.summons.length;i++){const a=this.summons[i];a.x=560+(i%5-2)*38;a.y=610-Math.floor(i/5)*38;}if(!expedition.enterRoom())return false;this.worldObjects.enterRoom();this.emit('room');return true;
 }
 nextRoom(id=null){
  if(this.training||this.mode!=='playing'||!this.cleared||this.room>=ROOMS.length-1||this.transition||this.expedition.selectedID)return false;
  if(!id){this.emit('routeChoice');return false;}if(!this.routeChoices().some(node=>node.id===id))return false;
  const choice=this.expedition.choose(id);if(!choice.ok)return false;this.transition={t:.72,max:.72,from:this.room,to:choice.to,entered:false};this.emit('transition');return true;
 }
 nearbyShrine(){return this.shrines?.find(shrine=>!shrine.used&&dist(this.player,shrine)<=90)||null;}
 activeShrine(){const record=this.c.shrineBuff,def=record&&SHRINES[record.type];if(!def||def.instant||!Number.isFinite(record.expiresAt)||record.expiresAt<=this.now())return null;return {type:record.type,name:def.name,icon:def.icon,color:def.color,description:def.description,remaining:Math.max(0,(record.expiresAt-this.now())/1000)};}
 syncShrine(){const record=this.c.shrineBuff;if(record&&!this.activeShrine()){delete this.c.shrineBuff;this._shrineStamp='';this.applyBuffs();this.emit('shrineExpired');return;}const stamp=record?record.type+':'+record.expiresAt:'';if(stamp!==this._shrineStamp){this._shrineStamp=stamp;this.applyBuffs();}}
 activateShrine(target=null){
 if(!target&&this.chapterCombat?.activateObjective())return true;
  if(this.mode!=='playing'||this.paused||this.transition)return false;const shrine=target||this.nearbyShrine(),def=shrine&&SHRINES[shrine.type];if(!def||shrine.used||!this.shrines.includes(shrine)||dist(this.player,shrine)>90)return false;shrine.used=true;
  if(def.instant==='restore'){this.hp=this.s.hp;this.mana=this.s.mana;}
  else if(def.instant==='flasks')this.refillFlasks(Infinity);
  else{this.c.shrineBuff={type:shrine.type,expiresAt:this.now()+180000};this._shrineStamp=shrine.type+':'+this.c.shrineBuff.expiresAt;this.applyBuffs();}
  if(!this.training)recordAchievementShrine(this.c);this.expedition.onShrineActivated(shrine);this.fx(shrine.x,shrine.y,90,def.color,'shock',.7);this.emit('shrine',{type:shrine.type,name:def.name,instant:!!def.instant});return true;
 }
 auraDrain(id){return this.auraResourceCost(id).mana;}
 auraPulseInterval(value){const def=typeof value==='string'?this.ability(value):value,boost=def?.elementalAura?this.s.elementalBoost?.frequency||0:0;return Math.max(.4,(def?.interval||1)/(1+Math.min(.45,Math.max(0,boost))));}
 auraDamageBoost(value){const def=typeof value==='string'?this.ability(value):value;return 1+(def?.elementalAura?Math.min(.35,Math.max(0,this.s.elementalBoost?.damage||0)):0);}
 reconcileAuraIntervals(){this.auraIntervals??={};for(const id of Object.keys(this.auraIntervals))if(!this.auraIds.has(id))delete this.auraIntervals[id];for(const id of this.auraIds){const def=this.ability(id);if(!def)continue;const previous=this.auraIntervals[id]||def.interval||1,next=this.auraPulseInterval(def);this.auraTimers[id]=Math.max(0,Math.min(1,(this.auraTimers[id]??previous)/previous))*next;this.auraIntervals[id]=next;}}
 toggleAura(def){
  const id=def?.id;if(!def||skillCategory(def)!=='aura')return false;
  if(this.auraIds.has(id)){this.auraIds.delete(id);delete this.auraTimers[id];delete this.auraIntervals[id];this.applyBuffs();this.emit('auraToggle',{id,active:false});return true;}
  this.trainingRefill();const available=this.skillAvailability(id);if(!available.usable){this.skillError=available.reason;return false;}if(!this.payResourceCost(available.cost,{floor:available.drain.life>0?this.s.hp*.2:1}))return false;this.auraIds.add(id);this.auraTimers[id]=this.auraPulseInterval(def);this.auraIntervals[id]=this.auraTimers[id];this.applyBuffs();this.auraCue(def);this.emit('auraToggle',{id,active:true});return true;
 }
 // C refreshes the complete army; validate the transaction before touching survivors.
 summonCost(){return this.summonResourceCost().mana;}
 summonArmy(){
  this.trainingRefill();this.skillError='';const available=this.actionAvailability('summon');if(!available.usable){this.skillError=available.reason;return false;}const plan=available.plan,cost=available.cost;
  const army=[];for(const row of plan.rows)for(let i=0;i<row.count;i++){const ally=this.createSummon(row.id,army.length,null,plan.physicalCount);if(!ally)return false;army.push(ally);}if(!this.payResourceCost(cost))return false;this.summons=army;this.minionCombat.onArmyCreated(army,cost);this.gameplay?.talents.paid({id:'army',type:'summon'},cost.mana);this.summonCD=1;this.fx(this.player.x,this.player.y,110,'#9fcbbb','shock',.45,skillCue({id:'army'},'summon',{sprite:'summon-circle'}));for(const ally of army)this.fx(ally.x,ally.y,Math.max(24,ally.r*1.7),ally.color,'ring',.52,skillCue({id:ally.source,damageType:ally.damageType},'summon',{sprite:'summon-circle'}));this.emit('summonArmy',{count:army.length,cost:cost.mana,resourceCost:cost,lifeCost:cost.life});return true;
 }
 createSummon(id,index=0,hp=null,population=(this.summons||[]).filter(a=>a.hp>0).length){
  const def=this.ability(id),spec=def?.summon;if(!spec||skillCategory(def)!=='summon')return null;const singleMode=this.minionCombat?.singleEligible(population)||false,maxHp=this.baseS.hp*spec.hpMult*(this.baseS.summonLife||1)*(singleMode?2.5:1),p=this.player||{x:560,y:560};
  const ally={source:id,sourceHP:this.baseS.hp,sourceLife:this.baseS.summonLife,stamp:this.skillStamp(id),kind:spec.kind,damageType:spec.damageType??(spec.kind==='spirit'?['fire','cold','lightning'][index%3]:'physical'),summonSpec:{...spec,chain:spec.chain?{...spec.chain}:null},armor:(spec.armor??(spec.kind==='knight'?30:spec.kind==='wolf'?10:5))+this.c.level,resistances:{fire:.15,cold:.15,lightning:.15,poison:.15},formationIndex:index,x:p.x+(index%5-2)*38,y:p.y-50-Math.floor(index/5)*38,hp:hp===null?maxHp:Math.min(maxHp,hp),maxHp,cd:spec.kind==='mirror_clone'?0:spec.interval*((index*.38196601125)%1)/Math.max(.25,(this.s.summonHaste||1)*(1+(this.minionAura?.haste||0))),r:17,ranged:spec.ranged,interval:spec.interval,attackMult:spec.attackMult*(singleMode?2:1),singleMode,color:def.color,teamShields:{},passiveShields:{}};
  if(spec.kind==='mirror_clone'){ally.inheritance=spec.inheritance;ally.maxMana=this.s.ringMirrorMana??this.s.mana;ally.mana=ally.maxMana;ally.cooldowns={};ally.effects=[];ally.channel=null;}
  for(const effect of this.skillEffects||[])if(effect.team&&effect.t>0&&effect.shieldRatio>0)ally.teamShields[effect.triggerKey||effect.id]={effect,remaining:maxHp*effect.shieldRatio};
  this.placeFollower(ally);return ally;
 }
 reconcileSummons(){
  const counts={},kept=[];let paid={mana:0,life:0,rage:0},capacity=0;for(const ally of this.summons||[]){const def=this.ability(ally.source);if(ally.hp<=0||skillCategory(def)!=='summon'||!def?.summon)continue;const used=counts[ally.source]||0,cost=summonUnitResourceCost(def,this.baseS);if(used>=def.summon.count||capacity+(def.summon.capacityCost||1)>summonCapacity(this.c,this.baseS)||paid.mana+cost.mana>this.baseS.mana+1e-8||paid.life+cost.life>this.baseS.hp-1+1e-8||paid.rage+cost.rage>100)continue;const fresh=this.createSummon(ally.source,kept.length,ally.hp,this.summons.filter(a=>a.hp>0).length);Object.assign(ally,{maxHp:fresh.maxHp,hp:fresh.hp,armor:fresh.armor,interval:fresh.interval,attackMult:fresh.attackMult,singleMode:fresh.singleMode,ranged:fresh.ranged,damageType:fresh.damageType,summonSpec:fresh.summonSpec,color:fresh.color,stamp:fresh.stamp,sourceHP:fresh.sourceHP,sourceLife:fresh.sourceLife,inheritance:fresh.inheritance,maxMana:fresh.maxMana});delete ally.t;delete ally.max;kept.push(ally);counts[ally.source]=used+1;paid=sumResourceCosts([paid,cost]);capacity+=def.summon.capacityCost||1;}this.summons=kept;for(const ally of kept){const fresh=this.createSummon(ally.source,0,ally.hp,kept.length);ally.maxHp=fresh.maxHp;ally.hp=fresh.hp;ally.attackMult=fresh.attackMult;ally.singleMode=fresh.singleMode;this.minionCombat?.clampShields(ally,ally.maxHp,ally.passiveShields);}
  this.minionCombat.reconcileSupportSources();
 }
 persistSummons(){if(this.training)return;if(this._summonHero!==this.c.id)return;this.c.summonState=this.summons.filter(a=>a.hp>0).map(a=>({skill:a.source,hp:a.hp}));}
 toggleAuras(){
  this.skillError='';if(this.auraIds.size){this.auraIds.clear();this.auraTimers={};this.auraIntervals={};this.applyBuffs();this.emit('aurasToggle',{active:false,count:0});return true;}
  this.trainingRefill();const available=this.actionAvailability('auras');if(!available.usable){this.skillError=available.reason;return false;}if(!this.payResourceCost(available.cost,{floor:available.drain.life>0?this.s.hp*.2:1}))return false;const ids=auraLoadout(this.c);for(const id of ids){const def=this.ability(id);this.auraIds.add(id);this.auraTimers[id]=this.auraPulseInterval(def);this.auraIntervals[id]=this.auraTimers[id];}this.applyBuffs();this.fx(this.player.x,this.player.y,180,'#e5c981','ring',.45,{sprite:'aura'});this.emit('aurasToggle',{active:true,count:ids.length});return true;
 }
 updateAuras(dt){
  let changed=false;const lifePaid=this.ringCombat.owns('bloodaura')?new Set():null,restore=id=>{const def=this.ability(id);return (def?.manaRestore||0)+(def?.manaRestorePct||0)*this.s.mana;},ids=[...this.auraIds].sort((a,b)=>restore(b)-restore(a));
  for(const id of ids){const def=this.ability(id);if(!def)continue;const cost=this.auraResourceCost(def,dt),floor=cost.life>0?this.s.hp*.2:1;const paid=this.gameplay?.blood?this.gameplay.blood.aura(def,dt):this.payResourceCost(cost,{floor,aura:true});if(!paid){this.auraIds.delete(id);delete this.auraTimers[id];delete this.auraIntervals[id];changed=true;this.emit('auraOff',{id,reason:cost.life>0?'life':'mana'});continue;}if(cost.life>0)lifePaid?.add(id);this.mana=Math.min(this.s.mana,this.mana+restore(id)*dt);if(def.lifeRestorePct)this.hp=this.healValue(def.lifeRestorePct*this.s.hp*dt);}
  if(changed)this.applyBuffs();
   for(const id of this.auraIds){const def=this.ability(id);if(!def)continue;const interval=this.auraPulseInterval(def);this.auraTimers[id]=(this.auraTimers[id]??interval)-dt;if(this.auraTimers[id]>1e-8)continue;this.auraTimers[id]+=interval;if(this.pulseAura(def)&&lifePaid?.has(id))this.ringCombat.auraRecovery();}
   this.setCombat.updateAura(dt);
 }
 pulseAura(def){
  if(!def.damage&&!def.debuff&&!def.freezeChance)return;
  this.fx(this.player.x,this.player.y,def.radius,def.color,'ring',.25,skillCue(def,'aura'));const boost=this.auraDamageBoost(def);let damaging=false;
  for(const enemy of [...this.enemies])if(enemy.hp>0&&dist(this.player,enemy)<=def.radius+enemy.r){
   if(def.debuff){enemy.auraDebuffs??={};enemy.auraDebuffs[def.id]={...def.debuff,t:1.4};this.aggregateAuraDebuffs(enemy);}
   if(def.damage){const before=enemy.hp;this.hit(enemy,this.s.atk*def.damage*boost,true,{ability:def.id,damageType:def.damageType||'physical',tag:'attack',aura:true,periodic:true,indirect:true,burn:(def.burn||0)*boost,burnDuration:def.burnDuration,freezeChance:def.freezeChance||0,freezeDuration:def.freezeDuration});damaging||=enemy.hp<before;}
  }
  return damaging;
 }

 addBurn(enemy,rate,duration=3,source='fire',rawRate=rate,options={}){
  if(!enemy||enemy.hp<=0||!Number.isFinite(rate)||rate<=0||!Number.isFinite(duration)||duration<=0)return false;enemy.burnStacks=(enemy.burnStacks||[]).filter(stack=>stack.t>0);const stack={rate,rawRate:Number.isFinite(rawRate)?rawRate:rate,t:Math.min(MAX_AILMENT_DURATION,duration*(1+(this.s.ailmentDuration||0))),source,minion:!!options.minion,triggerKey:options.triggerKey,stamp:options.stamp};if(enemy.burnStacks.length<MAX_BURN_STACKS)enemy.burnStacks.push(stack);else{let weakest=0;for(let i=1;i<enemy.burnStacks.length;i++){const a=enemy.burnStacks[i],b=enemy.burnStacks[weakest];if(a.rate<b.rate||a.rate===b.rate&&a.t<b.t)weakest=i;}if(rate<enemy.burnStacks[weakest].rate)return false;enemy.burnStacks[weakest]=stack;}return true;
 }
 tryFreeze(enemy,chance,duration){
  if(!enemy||enemy.hp<=0||!chance||!duration||immuneToStatus(enemy,'freeze'))return false;const resistance=Math.max(-.5,Math.min(.75,(enemy.resistances?.cold||0)-coldExposure(enemy))),probability=Math.min(.8,Math.max(0,chance*(1-resistance)));if(this.rand()>=probability)return false;const control=isBoss(enemy)?Math.min(.8,duration*.2):isElite(enemy)?Math.min(2,duration*.65):duration;enemy.stun=Math.max(enemy.stun||0,control);enemy.frozen=Math.max(enemy.frozen||0,control);return true;
 }

 aggregateAuraDebuffs(enemy){const values=Object.values(enemy.auraDebuffs||{});if(values.some(d=>d.ringCurseOrder))values.sort((a,b)=>(a.ringCurseOrder||0)-(b.ringCurseOrder||0));enemy.auraSlow=Math.min(.6,Math.max(debuffStrength(values,'slow'),this.minionCombat.slowingAt(enemy)));enemy.auraArmorShred=Math.min(.5,debuffStrength(values,'armorShred'));enemy.auraWeaken=Math.min(.3,Math.max(debuffStrength(values,'weaken'),this.minionCombat.weakeningAt(enemy)));}
 updateEnemyFields(dt){
  this.playerSlow=1;for(const field of this.enemyFields){const live=Math.min(dt,field.t);field.t-=dt;if(dist(this.player,field)<=field.r+12&&field.slow)this.playerSlow=Math.min(this.playerSlow,1-field.slow*(1-Math.min(.8,this.s.slowResistance||0)));field.tick=(field.tick??field.interval)-live;if(field.tick>0)continue;field.tick=field.interval||.5;if(dist(this.player,field)<field.r+12&&field.damage>0)this.damage(field.damage,field.damageType,'field',field.attacker,field);for(const ally of this.summons)if(dist(ally,field)<field.r+16&&field.damage>0)this.damageAlly(ally,field.damage,field.damageType,{origin:field,periodic:true});}
  this.enemyFields=this.enemyFields.filter(field=>field.t>0).slice(-16);
 }

 spawn(type,x,y){
  if(this.terrain)({x,y}=nearestGround(this.terrain,x,y));
  const kind=ENEMY_KINDS[type]||ENEMY_KINDS.melee,difficulty=DIFFICULTIES[this.diff]||DIFFICULTIES[1],zone=1+(8*((this.chapter||1)-1)+this.room)*.14,zoneLevel=contextBand(this.runContext,{monsterLevel:areaLevel(this.c,this.diff,this.runContext?.kind==='rift'?Math.min(7,4+this.room):this.room,this.chapter||1)}).monsterLevel,level=1+(zoneLevel-1)*.17,hp=kind.hp*difficulty.hp*zone*level;
  const enemy={x,y,type,name:kind.name,level:zoneLevel,dots:{},hp,maxHp:hp,damageScale:difficulty.damage*(1+this.room*.1)*(1+Math.max(0,zoneLevel-20)/35),attackSpeed:1+(this.diff-1)*.15+this.room*.04,armor:type==='skeleton'?0:kind.armor+this.room*(type==='boss'?3:1.5)+(this.diff-1)*5,r:type==='boss'?42:type==='elite'?26:16,speed:kind.speed*(.95+this.rand()*.1)*(1+(this.diff-1)*.06),cd:type==='summoner'?3.5+this.rand()*1.5:1+this.rand()*1.3,specialCD:5,elite:null,eliteCD:0,summonCast:null,flash:0,stun:0,burn:0,burnDmg:0,rage:false,phase:0,angle:0,chargesLeft:this.diff===1?1:2,charge:null,summoned:false};this.enemyCombat?.decorate(enemy);this.chapterCombat?.decorate(enemy);this.endgameCombat?.decorate(enemy);return setEnemyDefense(enemy,this.diff,enemy.defenseAffinity||chapterDefinition(this.chapter||1)?.boss.element);
 }
 promoteElite(enemy,key){
  if(!enemy||enemy.summoned||enemy.type==='skeleton'||isBoss(enemy)||isElite(enemy))return null;
  const keys=Object.keys(ELITE_MODIFIERS),modifier=ELITE_MODIFIERS[key??keys[Math.min(keys.length-1,Math.floor(this.rand()*keys.length))]];if(!modifier)return null;
  enemy.elite=modifier;enemy.name=modifier.name+'・'+ENEMY_KINDS[enemy.type].name;const health=this.room===0?1.8:2.1;enemy.hp*=health;enemy.maxHp*=health;enemy.damageScale*=1.12;enemy.r*=1.12;enemy.speed*=modifier.key==='wind'?1.2:1.05;enemy.eliteCD=6+this.rand()*2;strengthenEliteDefense(enemy,this.diff);return enemy;
 }
 addEnemy(type,x,y,summoned=false){if(this.enemies.length>=(this.horde?.active?HORDE_RULES.actorCap:48))return null;const point=this.clampWorldPoint(x,y,14),e=this.spawn(type,point.x,point.y);e.summoned=summoned;this.expedition.scaleEnemy(e);this.enemies.push(e);return e;}
 spawnWave(){return this.expedition.spawnWave();}
 updateElite(enemy,target,dt){
  if(enemy.eliteIntent){enemy.eliteIntent.t-=dt;if(enemy.eliteIntent.t<=0)enemy.eliteIntent=null;}
  if(!enemy.elite)return;enemy.eliteCD-=dt;if(enemy.eliteCD>0||enemy.charge||enemy.summonCast)return;const modifier=enemy.elite;enemy.eliteCD=modifier.interval;const damage=enemy.damageScale*(1-(enemy.auraWeaken||0)),warning=(x,y,r,amount,delay,type,field)=>{const count=this.hazards.length;this.hazard(x,y,r,amount,delay,type,enemy);if(field&&this.hazards.length>count){const h=this.hazards[this.hazards.length-1];h.fieldOnExpire=field;}};
  enemy.eliteIntent={label:modifier.trait,t:1.8,max:1.8};
  if(modifier.key==='ember')warning(target.x,target.y,65,10*damage,1.4,'fire',{duration:4,damage:4*damage,damageType:'fire',color:modifier.color});
  else if(modifier.key==='frost')warning(enemy.x,enemy.y,155,10*damage,1.6,'cold',{duration:4,damage:2*damage,slow:.35,damageType:'cold',color:modifier.color});
  else if(modifier.key==='storm')for(let i=0;i<3;i++){const angle=i/3*Math.PI*2;warning(target.x+Math.cos(angle)*65,target.y+Math.sin(angle)*65,45,11*damage,1.1+i*.35,'lightning');}
  else if(modifier.key==='quake'){const angle=Math.atan2(target.y-enemy.y,target.x-enemy.x);for(let i=1;i<=3;i++)warning(enemy.x+Math.cos(angle)*i*90,enemy.y+Math.sin(angle)*i*90,52,16*damage,1.15+i*.25,'physical');}
  else if(modifier.key==='wind'){const d=dist(enemy,target)||1,range=Math.min(200,d);enemy.charge={x:enemy.x+(target.x-enemy.x)/d*range,y:enemy.y+(target.y-enemy.y)/d*range,t:1.1,r:60,damage:11*damage,remaining:2};}
  this.fx(enemy.x,enemy.y,enemy.r+15,modifier.color,'ring',.7);
 }

 damageDefenseOptions(target,options={}){const owner=!options.minion||options.clone;return {dot:options.dot,penetrations:owner?(options.actorStats||this.s).penetrations:null,immunityPierce:target.immunities?.length?this.gameplay?.uniques?.immunityPierce(options):null};}
 mitigateDot(amount,type,target,options={}){return mitigateDamage({[type]:amount},target,this.c.level,this.damageDefenseOptions(target,{...options,dot:true})).total;}
 nearest(from=this.player){let target=null,d=Infinity;for(const e of this.enemies){if(e.hp<=0)continue;const n=dist(from,e);if(n<d){d=n;target=e;}}return target;}
 aim(context={}){return this.player.angle=playerAimAngle(this,context);}
 float(x,y,text,color='#e8dfcf'){if(this.numbers.length>=90)this.numbers.shift();this.numbers.push({x,y,text,color,t:1,max:1});}
 fx(x,y,r,color,type='ring',life=.45,geometry){if(this.effects.length>=90)this.effects.shift();const effect={x,y,r,color,type,t:life,max:life,...geometry};this.effects.push(effect);if(effect.visual)this.onSound?.('effect',effect);return effect;}
 ageEffects(dt){for(const effect of this.effects)effect.t-=dt;this.effects=this.effects.filter(effect=>effect.t>0);}
 auraCue(def){this.fx(this.player.x,this.player.y,def.radius||160,def.color,'ring',.45,skillCue(def,'aura',{sprite:'aura'}));}
 beginDashCue(def){
  const p=this.player,color=def.color||'#c9cfdf';
  const {duration}=movementTiming(def.id,this.dashTime);
  this.dashCue=this.fx(p.x,p.y,0,color,'lightning',duration+.20,{
   ...travelCue(def,p),motionDuration:duration,angle:Math.atan2(this.dash.y,this.dash.x)
  });
 }
 hit(e,amount,skill=false,options={}){
  options=this.minionCombat?.beasts?.prepareHit?.(e,options)??options;
  if(e.hp<=0||this.training?.finished)return;amount=this.ringCombat.beforeHit(amount,skill,options);const hitStats=options.actorStats||this.s,lightning=options.lightningVariance&&!options.dot&&(!options.periodic||options.primarySkill)&&(!options.indirect||options.clone)&&!options.setSecondary&&!options.preScaled&&(options.damageType==='lightning'||abilityDamageTypes(options.id||options.ability).lightning),variance=lightning?.5+this.rand():1;amount*=variance;const indirect=options.dot||options.minion||options.clone||options.periodic||options.indirect||options.triggered||options.aura||options.setSecondary,packet=options.preScaled?{byType:Object.fromEntries(DAMAGE_TYPES.map(type=>[type,Math.max(0,amount)*(options.damageTypes?.[type]??(type===(options.damageType||'physical')?1:0))]))}:outgoingDamage(hitStats,amount,{...options,skill}),crit=!options.noCrit&&!options.aura&&!options.dot&&!DOT_ABILITIES.has(options.id||options.ability)&&this.rand()<Math.min(.8,(hitStats.crit||0)+(options.minion?(hitStats.summonCrit||0):0)+(lightning?(options.lightningCritBonus||.1):0)+(e.shock>0?Math.min(.15,e.shockCritTaken??.1):0)),shockDamageBonus=e.shock>0?Math.min(.3,e.shockCritDamage??.2):0,source=options.origin||this.player,front=Math.abs(Math.atan2(Math.sin(Math.atan2(source.y-e.y,source.x-e.x)-e.angle),Math.cos(Math.atan2(source.y-e.y,source.x-e.x)-e.angle)))<Math.PI*.4,shieldBlock=e.type==='shield'&&e.braceActive!==false&&!skill&&options.tag!=='spell'&&front?.65:1;
  if(!indirect&&isBoss(e)&&hitStats.bossDamage>0)for(const type of DAMAGE_TYPES)packet.byType[type]*=1+hitStats.bossDamage;
  const summonBossBoost=summonBossHitMultiplier(this,e,options);
  if(summonBossBoost!==1)for(const type of DAMAGE_TYPES)packet.byType[type]*=summonBossBoost;
   if(e.setPhysicalTaken>0&&!options.ringReflect)packet.byType.physical*=1+e.setPhysicalTaken;
   const uncriticalTotal=Object.values(packet.byType).reduce((n,v)=>n+v,0),fireHit=packet.byType.fire,critMultiplier=this.setCombat.critMultiplier(crit,indirect)*(crit?1+shockDamageBonus:1);
   for(const type of DAMAGE_TYPES)packet.byType[type]*=(crit?critMultiplier:1)*shieldBlock;
  const result=options.preMitigated?{byType:packet.byType,total:Object.values(packet.byType).reduce((a,b)=>a+b,0)}:mitigateDamage(packet,e.auraArmorShred?{...e,armor:e.armor*(1-e.auraArmorShred)}:e,this.c.level,this.damageDefenseOptions(e,options)),damage=result.total>0?Math.max(1,Math.round(result.total)):0,lifeLost=Math.min(e.hp,damage);
  if(damage>0){
   this.recordTrainingDamage(e,lifeLost,{...options,skill,crit,specialCrit:crit&&critMultiplier>this.s.critDmg,raw:Object.values(packet.byType).reduce((n,v)=>n+v,0),byType:result.byType});
   e.hp-=damage;
   if(skill&&hasTargetImpact(options)){
    const impact=targetImpactCue(options,e,options.actor||source);
    if(impact)this.fx(impact.x,impact.y,impact.r,impact.color,'burst',.24,impact);
   }
   const reacted=this.hitFeedback?.record(e,this.clock,{loss:lifeLost,origin:options.origin||options.actor||source,velocity:options,type:options.damageType,
    crit,periodic:!!(options.periodic&&!options.primarySkill||options.aura||options.ringSecondary||options.setSecondary),dot:!!options.dot});
   if(reacted)e.flash=.10;
   if(this.onSound&&(reacted||options.dot))this.onSound('hit',{
    x:e.x,y:e.y,byType:result.byType,crit,minion:!!(options.minion||options.clone||options.actor),
    periodic:!!(options.dot||options.aura||options.periodic||options.setSecondary||options.ringSecondary)
   });
   if(!e.hordeFodder||crit||this.horde.allowNumber())this.float(e.x,e.y-e.r,crit&&critMultiplier>=6?damage+' 三重':crit?damage+'!':damage,crit?'#f1c681':'#dedbd4');
  }
  else if(uncriticalTotal>0&&e.immunities?.length&&(e.immuneTextAt??-1)<=this.clock){e.immuneTextAt=this.clock+.5;this.float(e.x,e.y-e.r,'免疫','#c8c6b4');}
  if(options.ringSecondary){if(e.hp<=0)this.kill(e);return;}
  if(lifeLost>0)this.ringCombat.afterHit(e,options);
  this.recoverPassiveLife(lifeLost,skill,options,e);
   const infusion=activeSkillInfusion(this.s,{...options,skill}),burn=(options.burn||0)+(!indirect?(this.s.burn||0):0),fireTalent=!indirect&&fireHit>0?Math.min(this.s.atk*.16,fireHit*(this.s.burnFromFireHit||0)):0,burnAmount=this.s.atk*burn+Math.max(0,amount)*(infusion?.burn||0)+fireTalent;
  if(burnAmount&&!options.dot&&!options.minion){const id=options.id||options.ability,type=['r_trap','r_venom'].includes(id)?'poison':'fire',dotPacket=outgoingDamage(this.s,burnAmount,{damageType:type,tag:ABILITIES[id]?.cls==='mage'?'spell':'attack',skill:true,dot:true,aura:!!options.aura}),rate=this.mitigateDot(dotPacket.total,type,e,options),duration=Math.max(options.burnDuration||options.duration||(fireTalent?2.4:3),infusion?.burnDuration||0);if(type==='fire')this.addBurn(e,rate,duration,id||'fire',dotPacket.total,options);else if(rate>0){e.dots??={};const old=e.dots[type];e.dots[type]={rate:Math.max(old?.rate||0,rate),rawRate:old&&old.rate>rate?(old.rawRate??old.rate):dotPacket.total,source:old&&old.rate>rate?old.source:id,time:Math.max(old?.time||0,duration)};e.burn=Math.max(e.burn||0,duration);}}
  if(options.shock&&!options.dot&&!options.setSecondary)applyShock(e,options.shock,options.shockCritTaken,options.shockCritDamage);
  if(lifeLost>0&&options.coldExposure>0&&heroCast(options)){
   (e.auraDebuffs??={})['frost-exposure']={coldExposure:options.coldExposure,t:options.coldExposureDuration};
  }
  if(options.slow){e.auraDebuffs??={};e.auraDebuffs['skill:'+(options.id||options.ability)]={slow:options.slow,t:options.slowDuration||2};this.aggregateAuraDebuffs(e);}
  if(infusion?.slow){e.auraDebuffs??={};e.auraDebuffs.infusion={slow:infusion.slow,t:2};this.aggregateAuraDebuffs(e);}
  if(options.minion&&!options.dot){if(options.minionBurnFraction>0){const dotPacket=outgoingDamage(this.s,amount*options.minionBurnFraction,{minion:true,dot:true,damageType:'fire'}),rate=this.mitigateDot(dotPacket.total,'fire',e,options);this.addBurn(e,rate,options.burnDuration||3,options.ability||'summon',dotPacket.total,options);}if(options.minionSlow>0){e.auraDebuffs??={};e.auraDebuffs['summon:'+options.ability]={slow:options.minionSlow,t:options.minionSlowDuration||2.5};this.aggregateAuraDebuffs(e);}}
  this.tryFreeze(e,Math.max(options.freezeChance||0,infusion?.freezeChance||0),Math.max(options.freezeDuration||0,infusion?.freezeDuration||0));

  if(options.freeze){const cold=options.damageType==='cold'||abilityDamageTypes(options.id||options.ability).cold;if(!cold||!immuneToStatus(e,'freeze')){const control=options.freeze+this.s.freeze,duration=isBoss(e)?Math.min(.8,control*.2):isElite(e)?Math.min(2,control*.65):control;e.stun=Math.max(e.stun,duration);if(cold)e.frozen=Math.max(e.frozen||0,duration);}}if(!indirect&&lifeLost>0){if(isBoss(e)&&this.s.bossMana>0&&this.bossManaCD<=0){const recovered=Math.min(this.s.bossMana,this.manaLeechAllowance,this.s.mana-this.mana);this.mana+=Math.max(0,recovered);this.manaLeechAllowance-=Math.max(0,recovered);this.bossManaCD=1;}if(!options.dualFollowup)this.tryTrigger('attack');}this.rangerCombat.onHit(e,amount,options);this.minionCombat.onHit(e,amount,options,lifeLost>0?uncriticalTotal:0);if(lifeLost>0)this.setCombat.afterHit(e,options,uncriticalTotal);if(e.hp<=0)this.kill(e);
 }
 kill(e){
  if(e.dotNumber)this.showDotDamage(e,0,0,true);
  this.enemyCombat?.cancel(e);
  if(this.training){if(e.trainingDummy)e.hp=e.maxHp;return;}if(!this.enemies.includes(e))return;this.expeditionRisk?.onKill(e);if(!this._identityHit?.options?.ringSecondary){this.rangerCombat.onKill(e);this.setCombat.onKill(e);}const lootStats=hordeLootStats(this.lootStats(),e),lootOwner={...this.c,level:this.c.level},finalBoss=e.type==='boss'&&!e.summoned&&this.currentRoom().type==='boss';this.enemies=this.enemies.filter(n=>n!==e);this.runKills++;this.c.kills++;recordAchievementKill(this.c,e,this.diff,this.room,this.chapter||1,{campaign:!this.runContext||this.runContext.kind==='campaign'});if(!e.summoned)this.mana=Math.min(this.s.mana,this.mana+(this.s.manaOnKill||0)*hordeReward(e));this.refillFlasks((e.summoned?0:e.type==='boss'?15:e.type==='miniboss'?8:isElite(e)?4:.5)*(1+this.s.chargeGain)*hordeReward(e));this.hp=this.healValue(this.s.hp*this.s.killHeal*hordeReward(e));
  const unified=isRingHero(this.c),prior=unified?ringBudget(this.c):this.c.points,lv=addXP(this.c,Math.max(1,Math.floor((e.type==='boss'?220:e.type==='miniboss'?120:isElite(e)?40:12)*this.diff*(e.summoned?.2:1)*(1+(this.s.experienceGain||0))*hordeReward(e))));if(lv){this.refresh();this.hp=this.healValue(this.s.hp*.15);this.mana=Math.min(this.s.mana,this.mana+this.s.mana*.15);this.float(this.player.x,this.player.y-50,'等級提升！','#edc989');this.emit('level',{points:(unified?ringBudget(this.c):this.c.points)-prior,unified,levels:lv});}
  const reward=scaleHordeResource(rollResourceLoot(isElite(e)?'elite':e.type,e.level||this.c.level,this.diff,this.rand,e.summoned),e,this.rand),gold=reward.gold;this.c.gold+=gold;this.runGold+=gold;if(gold){if(e.hordeFodder)this.horde.addGold(gold,e);else this.float(e.x,e.y-14,'+'+gold+' 金','#d2b771');}if(!e.summoned)this.emit('resourceLoot',reward);if(!e.hordeFodder||this.horde.allowDeathFx())this.fx(e.x,e.y,e.r*2,isBoss(e)?'#ce8558':'#976954','burst');
  const source=e.type==='boss'?'boss':e.type==='miniboss'?'miniboss':isElite(e)?'elite':'normal';
  const context={...(this.runContext||{}),chapter:this.chapter||1};
  const items=e.summoned?[]:rollEquipmentLoot(lootOwner,this.diff,source,this.room,this.rand,lootStats,context);
  const room=this.currentRoom();
  if(!e.summoned&&room.type==='treasure'&&this.wave>=room.waves&&!this.horde?.pending&&!this.enemies.some(enemy=>!enemy.summoned)){
   items.push(rollItemDrop(lootOwner,this.diff,this.rand,{room:this.room,source,minimumRarity:1,chapter:context.chapter,context,lootStats}));
  }
  if(finalBoss&&context.bossEquipment)items.push(...paidBossEquipment(this.c,context));
  for(const item of items){
   if(!item||!pickupAllowed(this.c,item))continue;
   if(this.protectedLoot(item))this.preserveGround(item);
   this.addGroundDrop({x:e.x,y:e.y,item,t:0});
  }
   if(finalBoss)this.emit('bossMarks',{difficulty:this.diff,amount:this.diff});
  if(!e.summoned&&this.rand()<(e.type==='boss'?.2:e.type==='miniboss'?.1:isElite(e)?.04:.006)*hordeReward(e)){const types=Object.keys(FLASKS),type=types[Math.min(types.length-1,Math.floor(this.rand()*types.length))],item=makeFlask(type,(this.runContext?.kind==='endgame'?Math.min(this.room>=3?99:98,(this.room>=3?97:96)+Math.floor(this.rand()*3)):rollDropLevel(this.diff,this.room,source,this.rand,this.chapter||1)),this.rand,true);this.c.flaskBag??=[];if(this.c.flaskBag.length<36){this.c.flaskBag.push(item);this.emit('flaskLoot',item);}else this.c.shards+=2;}
  if(finalBoss){this.collectAll();if(!this.runContext||this.runContext.kind==='campaign')completeZone(this.c,this.diff,7,this.chapter||1);this.c.clears++;this.c.best=Math.max(this.c.best,this.diff);this.enemies=[];this.hazards=[];this.bullets=[];this.enemyFields=[];this.cleared=true;this.mode='victory';this.channel=null;if(this.expedition.currentID)this.expedition.clearedNodes.add(this.expedition.currentID);this.emit('victory');}else this.emit('kill');
 }
 addGroundDrop(drop){
  this.drops.push(drop);
  if(drop.item.rarity>=4)this.onSound?.('drop',drop.item);
 }
 pickup(drop,notify=true){
  if(this._dropHero!==this.c.id||!this.drops.includes(drop))return false;
  if(!pickupAllowed(this.c,drop.item)&&!this.c.groundLoot?.some(item=>item.id===drop.item.id)){this.drops=this.drops.filter(d=>d!==drop);return true;}
  if(this.c.bag.length>=150){
   if(this.protectedLoot(drop.item))this.preserveGround(drop.item);
   if(notify&&!this.bagFullNotified){this.bagFullNotified=true;this.emit('bagfull');}
   return false;
  }
  this.bagFullNotified=false;
  this.removeGround(drop.item);
  this.drops=this.drops.filter(d=>d!==drop);
  this.c.bag.push(drop.item);this.runLoot++;this.emit('loot',drop.item);
  return true;
 }
 protectedLoot(item){return item.rarity>=3||item.set||item.uniqueID||item.grantedSkill||item.locked||(item.upgrade||0)>0||item.sockets?.some(Boolean);}
 preserveGround(item){this.c.groundLoot??=[];if(!this.c.groundLoot.some(i=>i.id===item.id)&&this.c.groundLoot.length<150)this.c.groundLoot.push(item);}
 removeGround(item){this.c.groundLoot=(this.c.groundLoot||[]).filter(i=>i.id!==item.id);}
 collectAll(){this.worldObjects?.collectAll();for(const d of [...this.drops])this.pickup(d,false);return this.drops.length===0;}
 leaveRoomLoot(){
  this.collectAll();
  if(this._dropHero===this.c.id&&this.c.groundLoot?.length){
   const leftBehind=new Set(this.drops.map(drop=>drop.item.id));
   this.c.groundLoot=this.c.groundLoot.filter(item=>!leftBehind.has(item.id));
  }
  this.drops=[];this.bagFullNotified=false;
 }
 beginLootWave(){this.lootFloor={drop:Math.max(0,this.baseS.drop||0),rarityFind:Math.max(0,this.baseS.rarityFind||0)};}
 refreshLootFloor(){if(!this.lootFloor)return;for(const key of ['drop','rarityFind'])this.lootFloor[key]=Math.min(this.lootFloor[key],Math.max(0,this.baseS[key]||0));}
 lootStats(){const out={...this.s};for(const key of ['drop','rarityFind'])out[key]=(this.lootFloor?.[key]??this.baseS[key]??0)+Math.max(0,(this.s[key]||0)-(this.baseS[key]||0));if(this.expedition?.graph&&!this.training)Object.assign(out,this.expedition.roomLoot());if(this.runContext?.kind==='endgame'&&this.runContext.riskVersion!==1){const risk=Math.min(3,this.runContext.challenge||1)-1;out.roomRarityBonus=(out.roomRarityBonus||0)+risk*.05;out.roomLootMultiplier=Math.min(1.4,(out.roomLootMultiplier||1)*(1+risk*.1));}return this.expeditionRisk?.lootStats(out)??out;}
 damagePacket(amount,options={}){return outgoingDamage(options.actorStats||this.s,amount,options);}

 weapon(){return weaponDefinition(this.c.equipment.weapon,this.c.cls);}
 inReach(range){return this.enemies.some(enemy=>enemy.hp>0&&circleIntersects(this.player,range,enemy));}
 attack(w=this.weapon(),attackBase=this.s.atk,hand=null){if(this.training?.finished||this.mode!=='playing'||this.paused||this.transition||this.channelBlocksBasic()||this.attackCD>0)return false;const spell=w.kind==='spell',speed=this.s.haste;this.attackCD=w.interval/Math.max(.25,speed);const a=this.aim(),p=this.player,damage=attackBase*w.damageMult,options={tag:spell?'spell':'attack',...(hand?{hand}:{})};if(w.kind==='melee'){
  const halfArc=w.halfArc??1.3;
  this.fx(p.x,p.y,w.range,'#e3b77c','slash',.22,skillCue({id:'weapon-basic'},'melee',{angle:a,halfArc}));
  const targets=this.damageables().filter(e=>e.hp>0&&circleInSector(p,a,w.range,halfArc,e)).sort((x,y)=>dist(p,x)-dist(p,y)).slice(0,w.maxTargets??3);for(const e of targets)this.hit(e,damage,false,options);}else this.shoot(p.x,p.y,a,w.speed||480,damage,spell?'#c4a6ed':'#b4c7a0',this.s.pierce,spell?8:4,false,options);return true;}
 trapPlacementRange(def){return Math.min(450,(def.trap.range||300)*(1+(this.s.trapRange||0)));}
 abilityReach(def){if(def.trap&&def.designV29){const reach=this.trapPlacementRange(def);return reach+(def.trap.mode==='turret'?reach:def.trap.triggerRadius||75);}if(def.type==='chain')return def.range;return def.type==='channel'?(['flame','frost'].includes(def.mode)?def.length:def.radius):def.type==='nova'?def.radius:700;}
 notifyMana(){if(this.noManaNotice<=0){this.emit('noMana');this.noManaNotice=1.5;}}
 channelBlocksBasic(){return !!this.channel&&!this.channel.allowsBasic;}
 updateAuto(){if(this.c.autoEnabled===false||this.channelBlocksBasic())return;if(this.inReach(this.weapon().range))this.attack();}
 beginChannel(def,source,slot=null){if(!skillWeaponCompatible(this.c,def))return false;this.channel={id:def.id,source,slot,stamp:this.skillStamp(def.id),timer:0,allowsBasic:!!def.allowsBasic};return this.updateChannel(0,true);}
 updateChannel(dt,initial=false){
  const ch=this.channel;if(!ch)return false;
  const def=this.ability(ch.id);if(!def||def.type!=='channel'||!skillWeaponCompatible(this.c,def)){this.channel=null;return false;}
  const beam=['flame','frost'].includes(def.mode),p=this.player;
  let whirlCue=def.id==='w_whirl'?this.effects.findLast(effect=>effect.playerWhirl):null;
  if(whirlCue)Object.assign(whirlCue,{x:p.x,y:p.y});
  const reach=beam?beamBoundingRadius(def.length,def.width):this.abilityReach(def);
  if(!this.inReach(reach)){
   if(ch.source==='auto'){this.channel=null;return true;}
   const props=this.worldObjects?.damageables()??[],a=beam&&props.length?playerAimAngle(this):0;
   const propHit=props.some(prop=>beam?circleInBeam(p,a,def.length,def.width,prop):circleIntersects(p,reach,prop));
   if(!propHit){ch.timer=0;return true;}
  }
  this.setCombat.channelTick(def,dt);ch.timer-=dt;
  let ticks=0;
  while(this.channel===ch&&ch.timer<=.000001&&ticks++<4){
   const cost=resourceCost(def,this.s),castId=++this.gameplay.sequence;
   if(!this.payResourceCost(cost,{castId})){this.channel=null;this.autoCastCD=.35;this.skillError=this.resourceFailure(cost);return false;}
   const actorStats=this.ringCombat.spellStats(def,{});
   const tickDef={...def,castId,ringSkipEcho:ch.ringEchoStarted,...(actorStats!==this.s?{actorStats}:{})};
   ch.ringEchoStarted=true;
   this.setCombat.onPaidDamage(tickDef,cost.mana);
   const interval=this.abilityInterval(def),a=this.aim(),damage=actorStats.atk*def.damage*(def.id==='w_whirl'?this.s.whirl:1);
   ch.timer+=interval;
   for(const enemy of this.damageables()){
    const hit=beam?circleInBeam(p,a,def.length,def.width,enemy):circleIntersects(p,def.radius,enemy);
    if(hit)this.hit(enemy,damage,true,tickDef);
   }
   const life=interval*1.2;
   if(whirlCue&&this.effects.includes(whirlCue))Object.assign(whirlCue,{r:def.radius,t:life,max:life});
   else{
    const playerWhirl=def.id==='w_whirl';
    const cue=this.fx(p.x,p.y,def.radius||0,def.color,beam?'channel-flame':'channel-whirl',life,
     skillCue(def,beam?'beam':'melee',{length:def.length,width:def.width,a,...(playerWhirl?{playerWhirl}:{})}));
    if(playerWhirl)whirlCue=cue;
   }
  }
  if(initial)this.emit('cast');
  return true;
 }
 shoot(x,y,a,speed,damage,color,pierce=0,r=5,hostile=false,options={}){
  if(hostile)speed=hostileProjectileSpeed(this,speed);
  if(this.bullets.length>=240||hostile&&this.enemyCombat&&!this.enemyCombat.allowProjectile())return;
  const radius=projectileBodyRadius(r,Math.max(options.explosionRadius||0,options.payloadRadius||0),hostile);
  const t=3*(!hostile&&!options.minion?1+Math.min(.5,this.s.projectileRange||0):1);
  const bullet={x,y,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,color,hostile,t,hit:new Set(),...options,damage,pierce,r:radius,...projectileCue(options,hostile)};
  this.bullets.push(bullet);
  if(!hostile)this.onSound?.('projectile',bullet);
  if(!options.minion&&!options.indirect)this.setCombat.decorateProjectile(bullet);
 }
 lightningArc(from,to,color,element='lightning',source={}){this.fx(from.x,from.y,0,color,'lightning',.35,skillCue({...source,damageType:element},'chain',{x2:to.x,y2:to.y,sprite:element==='lightning'?'lightning':undefined}));}
 chainTarget(origin,angle,options){
  const aim=pointerAimPoint(this,options,origin),range=options.range;
  let selected=null,best=Infinity;
  for(const candidate of this.damageables()){
   if(candidate.hp<=0||!circleIntersects(origin,range,candidate))continue;
   if(aim&&!circleInBeam(origin,angle,range,48,candidate))continue;
   const score=dist(aim||origin,candidate)+(!aim&&candidate.worldProp?range+1:0);
   if(score<best){selected=candidate;best=score;}
  }
  return selected;
 }
 homingTarget(origin,angle,range){
  let target=null,nearest=Infinity;
  for(const enemy of this.enemies.slice(0,96)){
   if(enemy.hp<=0||enemy.worldProp)continue;
   const distance=dist(origin,enemy);
   if(distance>=nearest||!circleInSector(origin,angle,range,1.05,enemy,0)||!this.walkVisible(origin,enemy))continue;
   target=enemy;nearest=distance;
  }
  return target;
 }
 strikeChain(from,target,damage,color,options,chain){
  const origin={x:from.x,y:from.y},strike={...options,damage,color,chain,origin,hit:new Set([target])};
  this.hit(target,damage,true,strike);
  this.followChain(strike,target,origin);
 }
 projectileImpact(b,target){
  if(b.explosionRadius){if(b.summonGroup&&b.summonGroup.count>=(b.summonMaxTargets??3))return;const reflect=this.setCombat.fireballImpact(b,target);const impact=skillCue(b,'impact',{sprite:elementalSprite(b.visualDamageType??b.damageType)});this.fx(target.x,target.y,b.explosionRadius,b.color,'meteor',.55,impact);this.fx(target.x,target.y,b.explosionRadius*.75,b.damageType==='cold'?b.color:'#edb06c','burst',.4,skillCue(b,'impact'));b.hit??=new Set();const candidates=this.damageables().filter(enemy=>dist(enemy,target)<=b.explosionRadius+enemy.r&&(enemy===target||!b.hit.has(enemy))).sort((a,b)=>dist(a,target)-dist(b,target));for(const enemy of candidates.slice(0,b.minion&&!b.clone?Math.max(0,(b.summonMaxTargets??3)-(b.summonGroup?.count||0)):Infinity)){if(b.summonGroup)b.summonGroup.count++;b.hit.add(enemy);const multiplier=enemy===target?1+(b.impactBonus&&heroCast(b)?b.impactBonus:0):b.splashFactor??1;this.hit(enemy,b.damage*multiplier,true,b);}reflect?.();return;}
  this.hit(target,b.damage,b.skill,{...b,origin:{x:target.x-b.vx,y:target.y-b.vy}});
 }
 chainNeighbor(from,hit,range){
  let next=null,closest=Infinity;
  for(const enemy of this.enemies){
   if(enemy.hp<=0||hit.has(enemy))continue;
   const distance=dist(from,enemy);
   if(distance<=range+(enemy.r??0)&&distance<=closest){next=enemy;closest=distance;}
  }
  return next;
 }
 followChain(b,target,origin){
  const element=b.visualDamageType??b.damageType??'physical';
  this.lightningArc(origin,target,b.color,element,b);let from=target,damage=b.damage;
  for(let jump=0;jump<b.chain.jumps;jump++){
   const next=this.chainNeighbor(from,b.hit,b.chain.range);
   if(!next)break;
   b.hit.add(next);damage*=b.chain.falloff;
   this.lightningArc(from,next,b.color,element,b);
   this.hit(next,damage,true,b);from=next;
  }
 }
 redirectProjectile(b,from,contact){
  if(!(b.chain?.jumps>0)||b.explosionRadius)return false;
  const next=this.chainNeighbor(from,b.hit,b.chain.range);
  if(!next)return false;
  const speed=Math.hypot(b.vx,b.vy),angle=Math.atan2(next.y-contact.y,next.x-contact.x);
  if(!(speed>0))return false;
  Object.assign(b,contact,{vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,
   t:Math.max(b.r,dist(next,contact))/speed,damage:b.damage*b.chain.falloff,
   chain:{...b.chain,jumps:b.chain.jumps-1}});
  return true;
 }
 cast(index){
  this.trainingRefill();this.skillError='';const activeId=skillLoadout(this.c)[index];if(this.channel&&this.channel.id===activeId&&this.channel.source==='manual'){this.channel=null;return true;}if(this.training?.finished||!Number.isInteger(index)||index<0||index>2)return false;if(this.mode!=='playing'||this.paused||this.transition)return false;const id=skillLoadout(this.c)[index],def=this.ability(id);
  if(!def||!['damage','curse','warcry'].includes(skillCategory(def))){this.skillError='此欄尚未配置主動技能。';return false;}
  if(def.type==='channel'){if(this.channel?.id===id&&this.channel.source==='manual'){this.channel=null;return true;}return this.beginChannel(def,'manual',index);}
  const available=this.skillAvailability(id);if(!available.usable){this.skillError=available.reason;return false;}const receipt=this.payResourceCost(available.cost);if(!receipt)return false;this.skillCooldowns[id]=this.skillCooldown(def);this.performAbility({...def,castId:receipt.id});this.setCombat.onPaidDamage({...def,castId:receipt.id},receipt.mana);this.syncCooldowns();this.emit('cast');return true;
 }
 performAbility(def,context={}){
  const id=def.id,p=context.actor||this.player,s=this.ringCombat.spellStats(def,context),target=context.actor?this.nearest(p):null,a=context.actor?Math.atan2((target?.y??p.y-1)-p.y,(target?.x??p.x)-p.x):this.aim({...def,...context}),stamp=context.triggerKey?this.triggerStamp(context.triggerKey):this.skillStamp(id),effectKey=context.triggerKey||id,options={...def,...context,...(s!==this.s?{actorStats:s}:{})},damage=s.atk*(def.damage||0)*(id==='w_whirl'?s.whirl:id==='m_meteor'?s.meteor:id==='r_snipe'?s.snipe:1);
  if(def.type==='trap'){this.rangerCombat.place(def,context.actor||null,options);}
  else if(id==='r_venom'&&def.type==='ground'){const center=playerAimPlacement(this,def.range||700,options,p)||this.nearest(p)||p,raw=this.damagePacket(damage,{...options,damageType:'poison',skill:true,indirect:true}).total;const cloud=this.rangerCombat.cloud(center,id,raw,{r:def.radius||90,t:def.duration||6,max:def.duration||6,actor:context.actor||null});this.fx(cloud.x,cloud.y,cloud.r,cloud.color,'ring',.4,skillCue(options,'field',{sprite:'poison-cloud'}));}
  else if(def.type==='nova'){this.ringCombat.placeSpell(def,context,p);this.fx(p.x,p.y,def.radius,def.color,def.freeze?'frost':'whirl',.65,skillCue(options,'impact',{sprite:id==='w_cleave'?'cleave':elementalSprite(def.damageType)}));for(const e of this.damageables())if(dist(p,e)<def.radius+e.r)this.hit(e,damage,true,options);}
  else if(def.type==='chain'){
   const first=this.chainTarget(p,a,options);
   if(first){
    p.angle=Math.atan2(first.y-p.y,first.x-p.x);
    if(this.ringCombat.owns('doubleecho'))this.ringCombat.placeSpell(def,context,first);
    this.strikeChain(p,first,damage,def.color,{...options,ability:id},def.chain);
   }else{
    this.fx(p.x,p.y,30,def.color,'burst',.2,skillCue(options,'cast',{angle:a}));
   }
  }
  else if(def.type==='projectile'){
   if(this.ringCombat.owns('doubleecho'))this.ringCombat.placeSpell(def,context,playerAimPlacement(this,def.range||700,options,p)||this.nearest(p)||p);
   const special=!!(def.explosionRadius||def.chain||def.homing);
   const count=Math.min(12,(special?1:(def.arrows||1)+(s.extraArrows||0))+(def.extraProjectiles||0));
   const seeking=def.homing?{homingTarget:this.homingTarget(p,a,def.homing.range),homingLeft:def.homing.duration}:{};
   const shared=new Set();
   for(let i=0;i<count;i++){
    this.shoot(p.x,p.y,a+(i-(count-1)/2)*(def.spread||.13),def.speed||580,damage,def.color,special?0:(def.pierce||0)+s.pierce,def.radius||7,false,
     {...options,...seeking,hit:shared,ability:id,stamp,skill:true,explosionRadius:def.explosionRadius||0,chain:def.chain?{...def.chain}:null,burn:def.burn||0,freeze:def.freeze||0,duration:def.duration||3});
   }
   this.fx(p.x,p.y,40,def.color,'burst',.27,skillCue(options,typeof def.fullCharge==='boolean'?'release':'cast',{angle:a}));
  }
  else if(def.type==='ground'){
   const target=this.nearest(p),center=this.ringCombat.placeSpell(def,context,playerAimPlacement(this,def.range||700,options,p)||nearestGround(this.terrain,target?.x??p.x,target?.y??p.y-100)),field={x:center.x,y:center.y,r:def.radius||150,t:.6,max:.6,friendly:true,color:def.color,...def,damage:damage*(def.interval||1),ability:id,...context,...(s!==this.s?{actorStats:s}:{}),stamp,periodic:true,primarySkill:true,interval:def.interval||1,remaining:def.duration||0,freeze:def.freeze||0,burn:def.burn||0,duration:def.duration||0};
   const existing=context.triggerKey?this.hazards.find(h=>h.friendly&&h.triggerKey===context.triggerKey):
    def.singleField&&(context.actor||heroCast(context))?
     this.hazards.find(h=>h.friendly&&h.ability===id&&(context.actor?h.actor===context.actor:heroCast(h))):null;
   if(existing){const {t,max}=existing;Object.assign(existing,field,{t,max});}
   else if(this.hazards.length<64)this.hazards.push(field);
   else return;
   if(!existing||!context.triggered)this.fx(field.x,field.y,field.r,field.color,'ring',Math.min(.6,field.t),skillCue(field,'field'));
  }
  else if(def.type==='dash'){if(!context.triggered)this.setCombat.onMovement({x:p.x,y:p.y});const point=pointerAimPoint(this,options,p),n=Math.hypot(this.input.x,this.input.y);this.dash=point?{x:Math.cos(a),y:Math.sin(a)}:n>.1?{x:this.input.x/n,y:this.input.y/n}:{x:Math.cos(a),y:Math.sin(a)};this.dashSpeed=def.speed||850;this.dashTime=(def.distance||240)/this.dashSpeed;if(def.buff){this.skillEffects=this.skillEffects.filter(b=>(b.triggerKey||b.id)!==effectKey);this.skillEffects.push({id,...context,stamp,t:def.duration||4,max:def.duration||4,buff:def.buff,shield:0});this.applyBuffs();}this.dashDamage=damage;this.dashRadius=def.radius||100;this.dashHit=new Set();this.dashDefinition=options;this.invuln=Math.max(this.invuln,this.dashTime);this.fx(p.x,p.y,75,def.color,'burst',.24,skillCue(options,'cast',{angle:Math.atan2(this.dash.y,this.dash.x)}));this.beginDashCue({...options,damageTypes:options.damageTypes??(options.damageType?undefined:abilityDamageTypes(id))});}
  else if(def.type==='guard'){
   if(context.actor){const actor=context.actor;actor.ownShield=(def.shield||0)*actor.maxHp;actor.ownShieldKey=id;actor.effects=(actor.effects||[]).filter(e=>e.id!==id);actor.effects.push({id,t:def.duration||5,buff:def.buff||{}});if(def.heal)actor.hp=Math.min(actor.maxHp,actor.hp+actor.maxHp*def.heal);this.fx(p.x,p.y,90,def.color,'shock',.45,skillCue(options,def.shield?'shield':'warcry',{sprite:def.shield?'shield':'warcry'}));return;}
   this.skillEffects=this.skillEffects.filter(b=>(b.triggerKey||b.id)!==effectKey);const effect={id,sourceHP:this.baseS.hp,...context,stamp,t:def.duration||5,max:def.duration||5,buff:def.buff||{},shield:(def.shield||0)*s.hp,shieldRatio:def.shield||0,team:skillCategory(def)==='warcry'};this.skillEffects.push(effect);
   if(effect.team)for(const ally of this.summons){if(ally.hp<=0)continue;ally.teamShields??={};ally.teamShields[effectKey]={effect,remaining:ally.maxHp*(def.shield||0)*(1+(this.s.summonHealing||0))};if(def.heal)ally.hp=Math.min(ally.maxHp,ally.hp+ally.maxHp*def.heal*(1+(this.s.summonHealing||0)));}this.applyBuffs();if(def.heal)this.hp=this.healValue(this.s.hp*def.heal);this.fx(p.x,p.y,90,def.color,'shock',.45,skillCue(options,def.shield?'shield':'warcry',{sprite:def.shield?'shield':'warcry'}));
  }
  else if(def.type==='curse'){
   const center=playerAimPlacement(this,def.range||700,options,p)||this.nearest(p)||p,{radius,duration}=this.ringCombat.curseSpec(def,context);for(const enemy of this.enemies)if(enemy.hp>0&&dist(center,enemy)<=radius+enemy.r){this.ringCombat.curse(enemy,def,context,effectKey,stamp,duration);this.aggregateAuraDebuffs(enemy);}this.fx(center.x,center.y,radius,def.color,'ring',.45,skillCue(options,'curse',{sprite:'curse'}));
  }

 }
 recoverPassiveLife(lifeLost,skill,options,target){recoverOwnedResources(this,lifeLost,skill,options,target,DOT_ABILITIES.has(options.id||options.ability));}
 recoverHitMana(lifeLost){const wanted=(this.s.manaOnHit||0)+lifeLost*(this.s.manaLeech||0),recovered=Math.max(0,Math.min(wanted,this.manaLeechAllowance,this.s.mana-this.mana));if(recovered<=0)return;this.mana+=recovered;this.manaLeechAllowance-=recovered;}
 tryTrigger(event){
  if(this.mode!=='playing'||this.paused||this.transition||this.processingTrigger)return false;let fired=false;
  for(const {trigger,def}of this.triggerDefinitions.values()){
   if(this.mode!=='playing'||this.paused||this.transition)break;
   if(trigger.event!==event||(this.triggerCooldowns[trigger.key]||0)>1e-8||!skillWeaponCompatible(this.c,def)||this.rand()>=trigger.chance)continue;
   this.triggerCooldowns[trigger.key]=trigger.cooldown;this.processingTrigger=true;
   try{this.performAbility(def,{triggered:true,triggerKey:trigger.key,triggerScale:trigger.scale});fired=true;this.emit('trigger',{key:trigger.key,skill:def.id,name:def.name});}finally{this.processingTrigger=false;}
  }
  return fired;
 }
 movementCooldown(){const id=movementSkill(this.c);return id?this.skillCooldowns[id]||0:this.dodgeCD;}
 dodge(){this.trainingRefill();if(this.training?.finished)return false;this.skillError='';if(this.mode!=='playing'||this.paused||this.transition||this.movementCooldown()>0)return false;const id=movementSkill(this.c),def=id?this.ability(id):null;if(def){const available=this.skillAvailability(id);if(!available.usable){this.skillError=available.reason;return false;}const receipt=this.payResourceCost(available.cost);if(!receipt)return false;this.skillCooldowns[id]=this.skillCooldown(def);this.performAbility(def);this.emit('cast');return true;}let {x,y}=this.input;if(Math.hypot(x,y)<.1){x=Math.cos(this.player.angle);y=Math.sin(this.player.angle);}const n=Math.hypot(x,y);this.dash={x:x/n,y:y/n};this.dashSpeed=780;this.dashTime=.2;this.dashDamage=0;this.beginDashCue({id:'dodge'});this.invuln=.4;this.dodgeCD=1.6*(1-this.s.cdr)*(this.s.dodgeCDMultiplier??1);this.setCombat.onMovement({x:this.player.x,y:this.player.y});this.fx(this.player.x,this.player.y,40,'#b7ada0','burst',.25,skillCue({id:'dodge'},'cast',{angle:Math.atan2(y,x)}));return true;}
 applyModifier(buff){for(const [key,value] of Object.entries(buff??{})){if(key==='speedPct')this.s.speed+=this.baseS.speed*value;else if(key==='atkPct')this.s.atk+=this.baseS.atk*value;else if(key==='critDamageBonus')this.s.critDmg+=value;else if(key==='armorPct')this.s.armor+=this.baseS.armor*value;else if(key==='allResist'){for(const type of ['fire','cold','lightning','poison'])this.s.resistances[type]+=value;}else if(key==='hpPct')this.s.hp+=this.baseS.hp*value;else if(typeof this.s[key]==='number')this.s[key]+=value;}}
 applyBuffs(){this.s={...this.baseS,sets:{...this.baseS.sets},resistances:{...this.baseS.resistances},damageIncreases:{...this.baseS.damageIncreases},penetrations:{...this.baseS.penetrations}};this.s.elementalInfusion=null;this.s.elementalBoost=null;this.minionAura={armor:0,reduce:0,haste:0,atkPct:0,damageBonus:0,crit:0,speedPct:0,allResist:0};for(const aura of [...equipmentAuras(this.c),...this.setCombat.auraDefinitions(),...this.skillEffects.filter(effect=>effect.team)].filter(a=>a.id!=='b_bloodaura'||a.m10&&this.c.talents.b_avatar))for(const key of Object.keys(this.minionAura))this.minionAura[key]+=(aura.buff?.[key]||0);this.s.manaRegen=this.baseS.manaRegen/(1+(this.baseS.manaRegenPct||0));const suffixes=new Map();for(const b of this.buffs){this.applyModifier(b.baseBuff??b.buff??FLASKS[b.type].buff);if(b.suffixKey){const old=suffixes.get(b.suffixKey);if(!old||(b.suffixStrength||0)>(old.suffixStrength||0))suffixes.set(b.suffixKey,b);}}for(const b of suffixes.values())this.applyModifier(b.suffixBuff);for(const b of this.skillEffects)this.applyModifier(b.buff);for(const def of this.setCombat.auraDefinitions()){this.applyModifier(def?.buff);if(def?.infusion)this.s.elementalInfusion=def.infusion;if(def?.elementalBoost)this.s.elementalBoost=def.elementalBoost;}const shrine=this.activeShrine();if(shrine)this.applyModifier(SHRINES[shrine.type].buff);this.minionCombat?.beasts?.applyOwnerBonuses(this.s);if(this.c.cls==='berserker'||this.s.resourceClass==='blood'){this.s.mana=0;this.s.manaRegen=0;this.mana=0;}this.s.resistancePenalty=this.mode==='camp'||this.training?0:HERO_RESISTANCE_PENALTY[this.diff]||0;for(const type of ELEMENTS)this.s.resistances[type]=Math.max(-.5,Math.min(.75,this.s.resistances[type]-this.s.resistancePenalty));this.s.crit=Math.min(.8,this.s.crit);this.s.critDmg=Math.min(3.5,this.s.critDmg);this.s.haste=Math.min(4,this.s.haste);this.s.reduce=Math.min(.5,this.s.reduce);this.s.resist=Math.min(.6,this.s.resist);this.s.manaCost=Math.min(.6,this.s.manaCost);this.s.block=Number.isFinite(this.s.block)?clamp(this.s.block,0,this.s.blockCap??.5):0;this.s.blockReduction=Number.isFinite(this.s.blockReduction)?clamp(this.s.blockReduction,.25,.85):.5;this.s.castSpeed=Math.min(4,this.s.castSpeed);this.s.manaRegenPct=Math.min(2,this.s.manaRegenPct||0);this.s.manaRegen*=1+this.s.manaRegenPct;this.reconcileAuraIntervals();}
 refreshFlaskBelt(){
  this.flasks=Array.from({length:FLASK_SLOT_COUNT},(_,index)=>{
   const def=flaskDefinition(this.c,index);
   return {type:def?.type??null,id:def?.id??null,charges:def?.maxCharges??0,cooldown:0,def};
  });
 }
 refillFlasks(amount=60){for(const flask of this.flasks)flask.charges=flask.def?Math.min(flask.def.maxCharges,flask.charges+amount):0;}
 useFlask(index){
  this.flaskError='';if(this.training?.finished||this.mode!=='playing'||this.paused||this.transition||!isFlaskSlot(index))return false;
  const slot=this.flasks[index],def=slot.def;
  if(!def){this.flaskError='此藥水槽尚未配置';return false;}
  if(slot.cooldown>0){this.flaskError='藥水尚未就緒';return false;}if(slot.charges<def.cost){this.flaskError='充能不足，擊殺敵人可補充';return false;}const hasBuff=Object.keys(def.buff??{}).length>0;if(!hasBuff&&(!def.hp||this.hp>=this.s.hp)&&(!def.mp||this.mana>=this.s.mana)){this.flaskError='對應資源已滿';return false;}
  slot.charges-=def.cost;slot.cooldown=.6;this.hp=this.healValue(this.s.hp*(def.instantHP||0));this.mana=Math.min(this.s.mana,this.mana+this.s.mana*(def.instantMP||0));const effect={type:slot.type,item:structuredClone(def.item),name:def.name,baseBuff:{...def.baseBuff},suffixBuff:{...def.suffixBuff},suffixKey:def.suffixKey,suffixStrength:def.item.suffix?.value||0,t:def.duration,max:def.duration,hpRate:this.s.hp*(def.hp||0)/def.duration,mpRate:this.s.mana*(def.mp||0)/def.duration};this.buffs=this.buffs.filter(b=>b.type!==slot.type);this.buffs.push(effect);this.applyBuffs();this.fx(this.player.x,this.player.y,65,def.color);this.float(this.player.x,this.player.y-35,def.short,def.color);this.emit('flask',{type:slot.type});return true;
 }
 damage(n,type='physical',kind=null,attacker=null,contact=null){
  if(this.invuln>0||this.mode!=='playing'||!Number.isFinite(n)||n<=0)return false;
  const shadow=this.gameplay?.assassin.incoming();if(shadow?.evaded){this.ringCombat.evaded();return false;}
  n*=shadow?.multiplier??1;n*=this.ringCombat.incomingMultiplier();
  type=type===true?'fire':type===false?'physical':type;
  n=enemyImpactDamage(this,n,type,kind)*(1-this.minionCombat.protectionAt(this.player));
  let real=mitigateDamage({[type]:n},this.s,this.c.level+this.room*2,{spell:type!=='physical'}).total,blocked=0;
  const blockChance=Number.isFinite(this.s.block)?clamp(this.s.block,0,this.s.blockCap??.5):0,blockReduction=Number.isFinite(this.s.blockReduction)?clamp(this.s.blockReduction,.25,.85):.5;
  if(blockChance>0&&this.rand()<blockChance){
   this.setCombat.onBlock(real*blockReduction);this.gameplay?.weapons.onBlock();this.gameplay?.uniques.onBlock(real*blockReduction);this.gameplay?.talents.onBlock(real*blockReduction);
   blocked=real*blockReduction;real-=blocked;this.float(this.player.x,this.player.y-42,'格擋','#bed4b5');
  }
  const beforeShield=real;
  for(const b of this.skillEffects){const absorb=Math.min(real,b.shield||0);b.shield-=absorb;real-=absorb;}
  real=this.minionCombat.absorbShields(this.player,real);real=this.setCombat.absorbMana(real);
  if(this.s.manaShield>0){const n=Math.min(this.ringCombat.shieldMana(),real*Math.min(.35,this.s.manaShield));this.mana-=n;real-=n;}
  const absorbed=blocked+beforeShield-real;
  real=this.minionCombat.transferDamage(real,type);real=this.gameplay?.talents.beforeIncoming(real,type)??real;real=this.gameplay?.blood.deferDamage(real,type)??real;
  this.hitFeedback?.record(this.player,this.clock,{loss:Math.min(this.hp,real),absorbed,maxHp:this.s.hp,origin:contact||attacker,velocity:contact,type,side:'player',periodic:kind==='field'});
  if(blocked>0)this.onSound?.('block');
  else if(real>0)this.onSound?.('hit',{byType:{[type]:real},incoming:true,periodic:kind==='field'});
  else if(absorbed>0)this.onSound?.('ward');
  this.hp=Math.max(0,this.hp-real);this.invuln=.28;
  if(real>0&&kind!=='field')this.shake=Math.max(this.shake,real>=this.s.hp*.14?5:2);
  this.float(this.player.x,this.player.y-25,'−'+Math.round(real),'#e88177');
  if(this.hp<=0){this.mode='dead';this.channel=null;this.collectAll();this.emit('dead');}
  else if(real>0)this.tryTrigger('damaged');
  if(blocked>0&&this.mode==='playing')this.ringCombat.reflected(attacker,blocked,type);
  return true;
 }
 hazard(x,y,r,damage,delay=1,damageType='fire',attacker=null){delay=enemyWarningTime(this,r,delay);if(this.hazards.length<64)this.hazards.push({x,y,r,damage,t:delay,max:delay,friendly:false,color:damageType==='lightning'?'#bfa3ed':damageType==='cold'?'#8ed6e5':damageType==='physical'?'#d9ba76':damageType==='poison'?'#a2b95a':'#db8057',damageType,attacker});}
 damageAlly(a,amount,type='physical',{origin,velocity,periodic=false}={}){
  if(a.hp<=0||this.minionCombat.immune(a))return;
  amount*=1-this.minionCombat.protectionAt(a);
  const mods=a.kind==='mirror_clone'?this.rangerCombat.modifiers(a):{},defense={armor:((a.armor||0)+(this.minionAura?.armor||0)+(mods.armor||0))*(1+(mods.armorPct||0)),resistances:a.resistances||{},reduce:Math.min(.5,(this.s.summonReduce||0)+(a.summonSpec?.reduce||0)+(this.minionAura?.reduce||0)+(mods.reduce||0))};
  defense.resistances=Object.fromEntries(['fire','cold','lightning','poison'].map(type=>[type,Math.min(.75,(a.resistances?.[type]||0)+(this.minionAura?.allResist||0)+(mods.allResist||0)+(this.s.summonResist||0))]));
  let real=mitigateDamage({[type]:amount},defense,this.c.level+this.room*2).total;
  const beforeShield=real;
  if(a.ownShield>0){
   const same=a.teamShields?.[a.ownShieldKey];
   if(same&&same.effect.t>0){a.ownShield=Math.max(a.ownShield,same.remaining);same.remaining=0;}
   const absorbed=Math.min(real,a.ownShield);a.ownShield-=absorbed;real-=absorbed;
  }
  for(const [key,pool]of Object.entries(a.teamShields||{})){
   if(!this.skillEffects.includes(pool.effect)||pool.effect.t<=0){delete a.teamShields[key];continue;}
   const absorb=Math.min(real,pool.remaining);pool.remaining-=absorb;real-=absorb;
  }
  real=this.minionCombat.absorbShields(a,real);
  const absorbed=beforeShield-real;
  real=this.gameplay?.blood.deferAllyDamage(a,real,type)??real;
  if(real>=a.hp&&this.minionCombat.rescue(a))return;
  const reacted=this.hitFeedback?.record(a,this.clock,{loss:Math.min(a.hp,real),absorbed,origin,velocity,type,side:'ally',periodic});
  if(reacted&&real>0)this.onSound?.('hit',{x:a.x,y:a.y,byType:{[type]:real},minion:true,periodic});
  a.hp=Math.max(0,a.hp-real);
  if(a.hp<=0)this.summonDeathExplosion(a);
 }
 summonDeathExplosion(ally){
  if(ally.hp<=0)this.minionCombat.onAllyDeath(ally);
  if(ally.hp>0||ally.deathNovaDone||!(this.s.summonDeathNova>0))return false;ally.deathNovaDone=true;
  const radius=Math.min(180,100*(1+(this.s.summonArea||0))),damage=Math.min(ally.maxHp*Math.min(.25,this.s.summonDeathNova)*Math.max(0,(this.s.summonDamage||1)+(this.s.damageBonus||0)),this.s.atk*4);
  this.fx(ally.x,ally.y,radius,'#9cc4d3','shock',.45,skillCue({id:ally.source,damageType:'physical'},'impact'));
  for(const enemy of [...this.enemies])if(enemy.hp>0&&dist(ally,enemy)<=radius+enemy.r)this.hit(enemy,damage,true,{minion:true,damageType:'physical',preScaled:true,noCrit:true,indirect:true,setSecondary:true,ability:ally.source,source:'passive:death_nova'});
  return true;
 }
 updateSkills(dt){
  let changed=false;
  for(const key of Object.keys(this.triggerCooldowns))this.triggerCooldowns[key]=Math.max(0,this.triggerCooldowns[key]-dt);for(const b of this.skillEffects)b.t-=dt;const count=this.skillEffects.length;this.skillEffects=this.skillEffects.filter(b=>b.t>0);if(count!==this.skillEffects.length)changed=true;if(changed)this.applyBuffs();for(const id of Object.keys(this.skillCooldowns))this.skillCooldowns[id]=Math.max(0,this.skillCooldowns[id]-dt);this.syncCooldowns();this.dodgeCD=Math.max(0,this.dodgeCD-dt);
  this.minionCombat.beginMovement();for(const ally of this.summons){if(ally.hp<=0)continue;if(ally.kind==='mirror_clone'){this.rangerCombat.updateClone(ally,dt);continue;}ally.hp=Math.min(ally.maxHp,ally.hp+this.s.lifeRegen*dt);ally.cd=Math.max(0,ally.cd-dt);if(ally.hp<=0)continue;
   if(ally.source==='a_clone'){updateInheritedBasic(this,ally,dt);continue;}
   const target=this.minionCombat.movementTarget(ally,dt);this.minionCombat.move(ally,target,dt);if(ally.summonSpec?.support)continue;
   if(target&&ally.cd<=0&&circleIntersects(ally,ally.ranged?360:70,target)){
    summonStrike(ally,target,this.clock);
    ally.cd=ally.interval/((this.s.summonHaste||1)*(1+(this.minionAura?.haste||0)+this.minionCombat.commandHaste()));const summonBase=this.s.summonAttackBase||this.s.atk,damage=summonBase*ally.attackMult,spec=ally.summonSpec||{},options={skill:true,minion:true,damageType:ally.damageType,ability:ally.source,minionBurnFraction:spec.burnFraction||0,burnDuration:spec.burnDuration,minionPoisonFraction:spec.poisonFraction||0,poisonDuration:spec.poisonDuration,minionSlow:spec.slow||0,minionSlowDuration:spec.slowDuration,freezeChance:spec.freezeChance||0,freezeDuration:spec.freezeDuration||0,summonMaxTargets:spec.maxTargets||3,lightningVariance:spec.lightningVariance,lightningCritBonus:spec.lightningCritBonus,shock:spec.shock,shockCritTaken:spec.shockCritTaken,shockCritDamage:spec.shockCritDamage};this.minionCombat.beforeAttack(ally,target,damage,options);this.gameplay?.uniques.beforeMinion(ally,target,damage,options);this.gameplay?.talents.beforeMinion(ally,target,damage,options);if(this.setCombat.summonAttack(ally,target,damage,options))continue;
    if(spec.attackMode==='chain'&&spec.chain){
     this.strikeChain(ally,target,damage,ally.color,options,spec.chain);continue;
    }
    if(ally.ranged){const angle=Math.atan2(target.y-ally.y,target.x-ally.x),count=spec.attackMode==='cone'?(spec.projectiles||3):1,shared=new Set(),group={count:0};for(let i=0;i<count;i++)this.shoot(ally.x,ally.y,angle+(i-(count-1)/2)*(spec.spread||.5)/Math.max(1,count-1),430,damage,ally.color,0,7,false,{...options,hit:shared,summonGroup:group,explosionRadius:spec.attackRadius||0,chain:spec.chain?{...spec.chain}:null});ally.stormAttacks=(ally.stormAttacks||0)+1;if(spec.storm&&ally.stormAttacks%3===0&&this.hazards.length<64){const storm=spec.storm;this.hazards.push({...options,damageType:'cold',x:target.x,y:target.y,r:storm.radius,t:storm.interval||1,max:storm.interval||1,interval:storm.interval||1,remaining:storm.duration,damage:summonBase*storm.damage*(storm.interval||1),friendly:true,periodic:true,noCrit:true,fieldMaxTargets:8,slow:storm.slow,slowDuration:2,color:ally.color,stamp:this.skillStamp(ally.source)});}}else{const targets=spec.attackRadius?this.enemies.filter(e=>e.hp>0&&dist(e,target)<=spec.attackRadius+e.r).sort((a,b)=>dist(a,target)-dist(b,target)).slice(0,spec.maxTargets||3) :[target];
    const targetDistance=dist(ally,target),openingSplash=spec.attackRadius?[]:openingGolemSplash(this,ally,target);
    for(const victim of targets)this.hit(victim,damage,true,options);
    for(const victim of openingSplash)if(victim.hp>0)this.hit(victim,damage*.65,true,{...options,noCrit:true,indirect:true,setSecondary:true});
    if(openingSplash.length)this.fx(target.x,target.y,76,ally.color,'shock',.18,skillCue(options,'impact'));
    if(spec.attackRadius){
    this.fx(target.x,target.y,spec.attackRadius,ally.color,'shock',.2,skillCue(options,'impact'));
   }else{
    const angle=Math.atan2(target.y-ally.y,target.x-ally.x);
    this.fx(ally.x,ally.y,Math.max(35,targetDistance),ally.color,'slash',.2,skillCue(options,'melee',{angle,halfArc:.7}));
   }}}}
  this.minionCombat.separate(dt);const oldPopulation=this.summons.length;this.summons=this.summons.filter(a=>a.hp>0);if(oldPopulation!==this.summons.length&&this.setCombat.flags.singularity)this.reconcileSummons();
 }
 updateEncounter(dt){
  if(this.training)return;this.chapterCombat?.updateRoom(dt);this.expedition.update(dt);this.expeditionRisk?.update(dt);if((this.chapter||1)>1)return;if(this.cleared||!this.enemies.length)return;const hazardScale=DIFFICULTIES[this.diff].damage*(1+this.room*.1);this.eventTimer-=dt;if(this.eventTimer<=0){this.eventTimer=this.enemyCombat.encounterInterval(7);if(this.encounter.hazard==='runes')for(let i=0;i<3;i++)this.hazard(this.player.x+(i-1)*130,this.player.y+(this.rand()-.5)*180,65,24*hazardScale,1.4);if(this.encounter.hazard==='cross')for(let i=0;i<5;i++)this.hazard(190+i*180,320+(this.wave%2)*150,52,25*hazardScale,1.35,'physical');if(this.encounter.hazard==='pulse'){this.hazard(340,350,100,32*hazardScale,1.6,'lightning');this.hazard(780,500,100,32*hazardScale,1.6,'lightning');}if(this.currentRoom().type==='boss'&&this.bossRage)this.hazard(this.player.x,this.player.y,85,38*hazardScale,1.5);}
  if(this.currentRoom().type==='boss'){
   const boss=this.enemies.find(e=>e.type==='boss'),easier=normalAbbey(this),limit=easier?4:8;
   if(!boss||(boss.totalAdds||0)>=limit)return;
   const interval=easier?18:boss.rage?9:13;
   if(easier&&boss.totalAdds===undefined){boss.totalAdds=0;this.bossAdds=interval;}
   this.bossAdds-=dt;
   if(this.bossAdds>0)return;
   this.bossAdds=interval;
   const count=Math.min(easier?2:4,limit-(boss.totalAdds||0));
   for(let i=0;i<count;i++){
    const add=this.addEnemy(i%3===0?this.encounter.extra:'melee',200+i*95,200,true);
    if(add)boss.totalAdds=(boss.totalAdds||0)+1;
   }
   this.emit('reinforcements');
  }
 }
 soundDotImpact(target,type,loss){
  if(!this.onSound||!(loss>0))return;
  const ready=this.dotSoundReady??=new Map();
  if(this.clock<(ready.get(type)??-Infinity))return;
  ready.set(type,this.clock+.65);
  this.onSound('hit',{x:target.x,y:target.y,byType:{[type]:loss},periodic:true});
 }
 showDotDamage(e,lost,dt,finished){
  if(lost>0){
   const number=e.dotNumber??={damage:0,time:0};
   number.damage+=lost;
   number.time+=dt;
  }
  const number=e.dotNumber;
  if(!number||(!finished&&number.time<.5-1e-8))return;
  if(e.hordeFodder&&!this.horde.allowNumber()){
   if(finished)e.dotNumber=null;
   return;
  }
  const amount=number.damage;
  const label=amount>=1?String(Math.round(amount)):amount<.005?'<0.01':String(Number(amount.toFixed(2)));
  this.float(e.x,e.y-e.r-13,label,'#cfb8e4');
  e.dotNumber=null;
 }
 updateEnemies(dt){
  if(this.paused||this.mode!=='playing')return;
  this.enemyCombat.beginFrame(dt);
  const p=this.player;
  for(const e of [...this.enemies]){
   if(e.hp<=0){this.enemyCombat.cancel(e);continue;}
   if(e.stun>0)this.enemyCombat.cancel(e);
   advanceShock(e,dt);
   e.frozen=Math.max(0,(e.frozen||0)-dt);
   const before=e.hp;
   for(const stack of e.burnStacks||[]){
    const tick=Math.min(dt,Math.max(0,stack.t)),damage=stack.rate*tick;
    this.recordTrainingDamage(e,Math.min(e.hp,damage),{dot:true,source:stack.source,damageType:'fire',raw:(stack.rawRate??stack.rate)*tick});
    recoverOwnedResources(this,Math.min(e.hp,damage),true,stack,e,true);
    this.soundDotImpact(e,'fire',Math.min(e.hp,damage));
    e.hp-=damage;
    stack.t-=tick;
   }
   if(e.burnStacks)e.burnStacks=e.burnStacks.filter(stack=>stack.t>1e-8);
   if(e.hp<=0){this.showDotDamage(e,before,dt,true);this.kill(e);continue;}
   for(const [id,debuff]of Object.entries(e.auraDebuffs||{})){debuff.t-=dt;if(debuff.t<=0)delete e.auraDebuffs[id];}
   this.aggregateAuraDebuffs(e);
   e.flash=Math.max(0,e.flash-dt);
   e.stun=Math.max(0,e.stun-dt);
   if(e.dots&&Object.keys(e.dots).length){
    for(const [type,dot] of Object.entries(e.dots)){
     const tick=advanceDot(dot,dt);
     const damageType=dot.damageType||type.split(':')[0];
     if(tick.parts)for(const part of tick.parts)applyDotTick(this,e,part,part.effect,damageType);
     else applyDotTick(this,e,tick,dot,damageType);
     if(dot.time<=0&&e.hp>0)delete e.dots[type];
    }
    e.burn=Math.max(0,...Object.values(e.dots).map(d=>d.time));
   }else if(e.burn>0){
    const tick=Math.min(dt,e.burn),damage=(e.burnDmg||0)*tick;
    e.burn-=tick;
    this.recordTrainingDamage(e,Math.min(e.hp,damage),{dot:true,damageType:'fire'});
    this.recoverPassiveLife(Math.min(e.hp,damage),true,{dot:true},e);
    this.soundDotImpact(e,'fire',Math.min(e.hp,damage));
    e.hp-=damage;
   }
   if(before>e.hp||e.dotNumber)this.showDotDamage(e,before-Math.max(0,e.hp),dt,e.hp<=0||(!e.burnStacks?.length&&e.burn<=0));
   if(e.hp<=0){this.kill(e);continue;}
   if(e.trainingDummy||e.staticObject||e.stun>0)continue;
   let target=p,taunter=null,tauntDistance=Infinity;for(const ally of this.summons){if(ally.hp<=0)continue;const distance=dist(e,ally);if(distance<dist(e,target))target=ally;if(!isBoss(e)&&ally.summonSpec?.tauntRadius>0&&distance<=ally.summonSpec.tauntRadius&&distance<tauntDistance){taunter=ally;tauntDistance=distance;}}if(taunter)target=taunter;this.enemyCombat.update(e,target,dt);
  }
  for(let i=0;i<this.enemies.length;i++)for(let j=i+1;j<this.enemies.length;j++){const a=this.enemies[i],b=this.enemies[j];if(a.trainingDummy||b.trainingDummy)continue;const d=dist(a,b),min=a.r+b.r;if(d<min&&d>0){const f=(min-d)*.3,dx=(a.x-b.x)/d,dy=(a.y-b.y)/d;if(!this.terrain||!a.staticObject)this.moveActor(a,dx*f,dy*f);if(!this.terrain||!b.staticObject)this.moveActor(b,-dx*f,-dy*f);}}
 }
 updateHazards(dt){
  for(const field of [...this.hazards]){
   field.t-=dt;
   let ticks=0;
   while(field.t<=1e-8&&ticks++<12){
    this.fx(field.x,field.y,field.r,field.color,field.friendly?'meteor':'shock',.65,skillCue(field,'impact',{friendly:!!field.friendly,sprite:elementalSprite(field.damageType)}));
    if(!field.friendly&&field.fieldOnExpire&&this.enemyFields.length<16){
     const effect=field.fieldOnExpire;
     this.enemyFields.push({x:field.x,y:field.y,r:field.r,t:effect.duration,max:effect.duration,damage:effect.damage,damageType:effect.damageType,color:effect.color,slow:effect.slow||0,interval:.5,tick:.5,attacker:field.attacker});
    }
    if(field.friendly){
     const targets=this.damageables().filter(enemy=>enemy.hp>0&&circleIntersects(field,field.r,enemy)).sort((a,b)=>dist(a,field)-dist(b,field)).slice(0,field.fieldMaxTargets||48);
     for(const target of targets)this.hit(target,field.damage,true,field);
    }else{
     if(circleIntersects(field,field.r,this.player,12))this.damage(field.damage,field.damageType||'fire','burst',field.attacker,field);
     for(const ally of this.summons)if(ally.hp>0&&circleIntersects(field,field.r,ally,16))this.damageAlly(ally,field.damage,field.damageType||'fire',{origin:field});
    }
    const interval=Math.max(.01,field.interval||1);
    if(!field.friendly||!(field.remaining>interval+1e-8)){field.expired=true;break;}
    field.remaining-=interval;
    field.t+=interval;
    field.max=interval;
   }
  }
  this.hazards=this.hazards.filter(field=>!field.expired);
 }
 updateProjectiles(dt){
  let impactCues=0;
  for(const bullet of [...this.bullets]){
   if(bullet.returning)this.setCombat.projectileStep(bullet);
   if(!(bullet.t>0)){this.setCombat.projectileStep(bullet);continue;}
   const from={x:bullet.x,y:bullet.y},live=Math.min(dt,Math.max(0,bullet.t));
   bullet.x+=bullet.vx*live;bullet.y+=bullet.vy*live;bullet.t-=dt;
   const home=bullet.returning?segmentCircleEntry(from,bullet,this.player,24):null;
   if(home!==null){bullet.x=from.x+(bullet.x-from.x)*home;bullet.y=from.y+(bullet.y-from.y)*home;}
   if(!bullet.outboundSpent){
    const targets=bullet.hostile?[...this.summons.filter(ally=>ally.hp>0),this.player]:this.damageables().filter(enemy=>enemy.hp>0&&!bullet.hit.has(enemy));
    const contacts=[];
    for(const target of targets){
     const radius=bullet.r+(bullet.hostile?16:target.r);
     const entry=segmentCircleEntry(from,bullet,target,radius);
     if(entry!==null)contacts.push({target,entry});
    }
    contacts.sort((a,b)=>a.entry-b.entry);
    for(const {target,entry} of contacts){
     if(target.hp<=0||!bullet.hostile&&bullet.hit.has(target))continue;
     const point={x:from.x+(bullet.x-from.x)*entry,y:from.y+(bullet.y-from.y)*entry};
     if(bullet.hostile){
      if(target===this.player)this.damage(bullet.damage,bullet.damageType||'fire','projectile',bullet.attacker,bullet);
      else this.damageAlly(target,bullet.damage,bullet.damageType||'fire',{origin:bullet.attacker,velocity:bullet});
      Object.assign(bullet,point);bullet.t=0;break;
     }
     bullet.hit.add(target);this.projectileImpact(bullet,target);
     if(!bullet.explosionRadius&&!hasTargetImpact(bullet)&&impactCues<24){
      this.fx(point.x,point.y,20,bullet.color,'burst',.2,skillCue(bullet,'impact',{angle:Math.atan2(bullet.vy,bullet.vx)}));
      impactCues++;
     }
     if(bullet.chain&&this.redirectProjectile(bullet,target,point))break;
     if(bullet.pierce--<=0){
      Object.assign(bullet,point);
      if(bullet.setReturn&&!bullet.returning)bullet.outboundSpent=true;
      else bullet.t=0;
      break;
     }
    }
   }
   if(home!==null)bullet.t=0;
   this.setCombat.projectileStep(bullet);
  }
  this.bullets=this.bullets.filter(bullet=>{
   const bounds=this.worldBounds(),alive=bullet.t>0&&bullet.x>bounds.left-70&&bullet.x<bounds.right+70&&bullet.y>bounds.top-70&&bullet.y<bounds.bottom+70;
   if(!alive)this.gameplay?.mastery.projectileEnd(bullet);
   return alive;
  });
 }
 setMoveTarget(x,y){
  if(!Number.isFinite(x)||!Number.isFinite(y)||this.paused||this.training?.finished||this.transition||!['camp','playing'].includes(this.mode))return false;
  const target=nearestGround(this.mode==='camp'?null:this.terrain,x,y);
  this.moveTarget=dist(this.player,target)>2?target:null;
  return true;
 }
 cancelMoveTarget(){this.moveTarget=null;}
 followMoveTarget(dt,speed){
  if(!this.moveTarget)return;
  const from={x:this.player.x,y:this.player.y};
  approachOnTerrain(this.mode==='camp'?null:this.terrain,this.player,this.moveTarget,Math.max(0,speed*dt));
  if(dist(from,this.player)>.001)this.player.angle=Math.atan2(this.player.y-from.y,this.player.x-from.x);
  if(dist(this.player,this.moveTarget)<.001)this.moveTarget=null;
 }
 moveInCamp(dt){
  const {x,y}=this.input, length=Math.hypot(x,y);
  if(length<=.1){this.followMoveTarget(dt,Math.min(310,Math.max(220,this.s.speed)));return;}
  this.cancelMoveTarget();
  const step=Math.min(310,Math.max(220,this.s.speed))*dt/Math.max(1,length);
  this.player.x=clamp(this.player.x+x*step,76,1044);
  this.player.y=clamp(this.player.y+y*step,126,728);
  this.player.angle=Math.atan2(y,x);
 }
 update(dt){
  this.clock+=dt;this.syncShrine();if(this.paused||this.training?.finished){this.cancelMoveTarget();return;}dt=Math.min(dt,.1);if(this.mode==='camp'){this.moveInCamp(dt);for(const drop of [...this.drops])if(dist(drop,this.player)<85)this.pickup(drop);this.minionCombat.idle(dt);this.summonCD=Math.max(0,this.summonCD-dt);this.minionCombat.update(dt);this.updateAuras(dt);this.ageEffects(dt);this.mana=Math.min(this.s.mana,this.mana+this.s.manaRegen*dt);return;}if(this.mode!=='playing'){this.cancelMoveTarget();return;}
  if(!this.training&&dt>0)this.c.expeditionSeconds=Math.min(1e12,(this.c.expeditionSeconds??0)+dt);
  if(this.transition){this.cancelMoveTarget();const transition=this.transition;transition.t-=dt;if(!transition.entered&&transition.t<=transition.max/2){transition.entered=true;this.room=transition.to;this.hp=this.healValue(this.s.hp*.15);this.refillFlasks(6);this.enterRoom();}if(transition.t<=0){this.transition=null;this.emit('transitionEnd');}return;}this.horde.update(dt);this.trainingRefill();if(this.training?.started)this.training.elapsed=this.training.options.duration?Math.min(this.training.options.duration,this.training.elapsed+dt):this.training.elapsed+dt;this.elapsed+=dt;this.summonCD=Math.max(0,this.summonCD-dt);this.minionCombat.update(dt);this.updateAuras(dt);this.updateEnemyFields(dt);this.bossManaCD=Math.max(0,this.bossManaCD-dt);this.manaLeechAllowance=Math.min(manaSiphonBudget(this.s),this.manaLeechAllowance+manaSiphonBudget(this.s)*dt);this.passiveLeechAllowance=Math.min(this.s.hp*.1,(this.passiveLeechAllowance??0)+this.s.hp*.1*dt);this.updateSkills(dt);this.rangerCombat.update(dt);this.setCombat.update(dt);for(const f of this.flasks)f.cooldown=Math.max(0,f.cooldown-dt);for(const b of this.buffs){const tick=Math.min(dt,b.t);this.hp=this.healValue(b.hpRate*tick);this.mana=Math.min(this.s.mana,this.mana+b.mpRate*tick);b.t-=dt;}const count=this.buffs.length;this.buffs=this.buffs.filter(b=>b.t>0);if(this.buffs.length!==count)this.applyBuffs();this.mana=Math.min(this.s.mana,this.mana+this.s.manaRegen*dt);this.hp=this.healValue(this.s.lifeRegen*dt);this.attackCD=Math.max(0,this.attackCD-dt);this.autoCastCD=Math.max(0,this.autoCastCD-dt);this.noManaNotice=Math.max(0,this.noManaNotice-dt);this.invuln=Math.max(0,this.invuln-dt);this.shake=Math.max(0,this.shake-dt*25);
  const p=this.player,m=this.input,n=Math.hypot(m.x,m.y);if(n>.1)this.cancelMoveTarget();if(this.dashTime>0){const from={x:p.x,y:p.y},step=(this.dashSpeed||780)*Math.min(dt,this.dashTime);this.dashTime=Math.max(0,this.dashTime-dt);
   if(!this.moveActor(p,this.dash.x*step,this.dash.y*step,false))this.dashTime=0;if(this.dashDamage)for(const e of [...this.enemies])if(!this.dashHit.has(e)&&segmentCircleEntry(from,p,e,this.dashRadius+e.r)!==null){this.dashHit.add(e);this.hit(e,this.dashDamage,true,this.dashDefinition);}this.ringCombat.landed();if(this.dashCue){
    this.dashCue.x2=p.x;this.dashCue.y2=p.y;
    if(this.dashTime<=0){this.fx(p.x,p.y,32,this.dashCue.color,'ring',.30,skillCue(this.dashCue,'landing',{angle:Math.atan2(this.dash.y,this.dash.x)}));this.dashCue=null;}
   }}else if(n>.1){const step=this.s.speed*this.playerSlow*dt/Math.max(1,n);this.moveActor(p,m.x*step,m.y*step);p.angle=Math.atan2(m.y,m.x);}else this.followMoveTarget(dt,this.s.speed*this.playerSlow);const bounds=this.worldBounds();p.x=clamp(p.x,bounds.left,bounds.right);p.y=clamp(p.y,bounds.top,bounds.bottom);if(m.attack&&this.c.autoEnabled===false)this.attack();this.updateAuto();this.updateChannel(dt);this.updateEncounter(dt);this.updateEnemies(dt);
  this.updateProjectiles(dt);
  this.updateHazards(dt);
  this.ageEffects(dt);for(const f of this.numbers){f.t-=dt;f.y-=25*dt;}this.numbers=this.numbers.filter(f=>f.t>0);for(const d of [...this.drops]){d.t+=dt;if(dist(d,p)<85)this.pickup(d);}this.worldObjects.update(dt);
  if(this.training){this.trainingRefill();if(this.training.options.duration&&this.training.elapsed>=this.training.options.duration-1e-8){this.training.elapsed=this.training.options.duration;this.finishTraining();}}
  if(!this.training&&this.mode==='playing'&&!this.enemies.length&&!this.horde.pending&&!this.cleared){this.waveWait+=dt;if(this.waveWait>(this.horde.active?.55:1.3)){this.waveWait=0;if(this.wave<this.currentRoom().waves)this.spawnWave();else this.expedition.onRoomCleared();}}
 }
}

installResourceAvailability(Game);installGameplay(Game);installBasicAttacks(Game);installClassIdentityCombat(Game);installEnemyRarity(Game);installTrainingScenarios(Game);installBerserkerBloodCombat(Game);installAutomaticAuras(Game);
