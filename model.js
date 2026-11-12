import {baseMana,baseManaRegen} from './mana-economy.js?v=108';
import {saveStashSlots,stashSlots,validStashSlot,validStashSlots} from './stash-slots.js';
import {DIFFICULTY_NAMES} from './difficulty-labels.js?v=108';
import {resourceCost,sumResourceCosts} from './resource-cost.js?v=108';
export {resourceCost,sumResourceCosts};
import {migrateShadowAura} from './assassin-arsenal.js?v=123';
import {installBasicAttackData,validBasicAttack,reconcileBasicAttack} from './basic-attacks.js?v=129';
export {effectiveBasicAttack,previewBasicAttack} from './basic-attacks.js?v=129';
import {validPages as validInventoryPages} from './inventory-page-rules.js?v=125';
import {validAppearance,validHeroAppearance} from './character-appearance.js?v=108';
import {ARCHETYPE_SETS,ARCHETYPE_UNIQUES,SET_EQUIPMENT_BASES,campaignAffixWeight} from './gear-builds.js?v=129';
import {ARMOR_WEIGHTS,ARMOR_SHARES,SHIELDS,MELEE_PROFILES,armorMultiplier,implicitModifiers,isShield,supportCompatible} from './gear-archetypes.js?v=108';
import {STARTING_WEAPONS,EQUIPMENT_ICONS,FLASK_ICONS} from './equipment-visuals.js?v=124';
import {EARLY_UNIQUES,NEW_UNIQUES} from './unique-design.js?v=108';
import {dualState,legalDualPair,classWeaponAllowed,stanceSkillInfo,STANCE_NAMES} from './weapon-stance.js?v=108';
export {dualState,legalDualPair,classWeaponAllowed,stanceSkillInfo,STANCE_NAMES};
import * as RiftModel from './rift-model.js?v=140';
export {riftPreview,createRiftCandidate,craftTicket,closeRunCandidate,RIFT_THEMES,GEAR_FAMILIES,awardRepeatFragment} from './rift-model.js?v=140';
import * as CampaignProgress from './campaign-progress.js?v=108';
import {normalizeCampaignCheckpoints} from './campaign-checkpoint.js?v=108';
import {FLASK_SLOT_COUNT,LEGACY_FLASK_SLOT_COUNT,isFlaskSlot,migrateFlaskCheckpoint} from './flask-belt.js?v=108';
export {FLASK_SLOT_COUNT};
import {chapterDefinition,ALL_MINIBOSSES} from './chapter-data.js?v=108';
import {lootLevelBand} from './encounter-context.js?v=108';
export {chapterDefinition};
export const ensureCampaign=CampaignProgress.ensureCampaign,canChapter=CampaignProgress.canChapter;
import {NEW_CLASSES,installClassData} from './class-design.js?v=108';
import * as Mastery from './skill-mastery.js?v=123';
import * as Campaign from './campaign-rules.js?v=108';
import * as Progression from './progression.js?v=108';
import * as PassiveTree from './passive-tree.js?v=108';
import * as RingTree from './ring-tree.js?v=133';
import * as Routes from './route-model.js?v=140';
import * as GearRules from './equipment-rules.js?v=108';
import {BOW_SKILLS} from './bow-skills.js?v=123';
import {requiredSkillWeapon,skillWeaponCompatible,skillWeaponFailure} from './skill-weapon-rules.js?v=129';
let validatingLegacyCapacity=false;
let validatingResourceLegacy=false,validatingUniformRing=false,validatingBinaryRing=false;
export const CLASSES={...NEW_CLASSES,
 warrior:{name:'戰士',title:'鋼鐵與怒火',color:'#dcad6b',hp:260,atk:24,armor:12,icon:'sword',skills:['旋風斬','震地怒吼'],branches:['狂戰之道','不屈壁壘'],sets:['wrath','iron'],desc:'近身橫掃，吸血續戰。讓鋼鐵成為你的信仰。'},
 ranger:{name:'弓手',title:'風行於暗影',color:'#87bda1',hp:190,atk:22,armor:6,icon:'bow',skills:['散射箭雨','穿心狙擊'],branches:['疾風箭術','獵殺本能'],sets:['wind','hunt'],desc:'遠距離走位，多重箭與暴擊。每一箭都是致命的答案。'},
 mage:{name:'法師',title:'禁忌的餘燼',color:'#a89ad8',hp:150,atk:28,armor:4,icon:'staff',skills:['冰霜新星','隕火降臨'],branches:['烈焰秘法','霜寒掌控'],sets:['flame','frost'],desc:'元素範圍爆發，凍結控場。讓古老的力量再次甦醒。'}
};
const ability=(id,cls,name,icon,desc,type,mana,cooldown,extra={})=>({id,cls,name,icon,desc:desc.replace('每秒耗魔 4','每秒耗魔 8'),type,mana:Math.ceil(mana*1.65),cooldown:Math.round(cooldown*.4*100)/100,color:CLASSES[cls].color,...extra,...(extra.drain?{drain:extra.drain*2}:{})});
export const ABILITIES=Object.fromEntries([
 ability('w_cleave','warrior','裂地斬','earthbreak','橫掃周圍敵人，造成 190% 攻擊傷害。','nova',12,3,{damage:1.9,radius:120}),
 ability('w_whirl','warrior','血刃旋風','whirl','持續旋轉，每次造成 65% 攻擊傷害並汲取生命，可移動。','channel',6,0,{mana:6,damage:.65,radius:120,maxRadius:280,interval:.28,speedStat:'haste',mode:'whirl',leech:.08}),
 ability('w_charge','warrior','破陣衝鋒','wind','朝目標突進，沿途造成 150% 攻擊傷害。','dash',12,4,{damage:1.5,radius:70,distance:240,speed:850}),
 ability('w_blitz','warrior','雷霆奔襲','rune','高速突進並震懾敵人，短暫提高攻速與移速。','dash',24,7,{damage:2.7,radius:95,distance:350,speed:1100,freeze:.8,duration:4,buff:{haste:.3,speedPct:.25}}),
 ability('w_guard','warrior','鋼鐵戰吼','shield','戰吼使自身與召喚物各自獲得 20% 最大生命護盾、護甲與減傷，持續 5 秒。','guard',14,8,{shield:.2,duration:5,buff:{armor:35,reduce:.15}}),
 ability('w_slam','warrior','堡壘震擊','rune','震擊周遭敵人，造成 320% 傷害並暈眩 1.5 秒。','nova',24,7,{damage:3.2,radius:165,freeze:1.5}),
 ability('w_banner','warrior','戰旗光環','flag','手動切換，持續耗魔：提高自身與召喚物造成的傷害。','aura',8,0,{color:'#d8bc77',toggle:true,drain:1,radius:145,interval:1,buff:{damageBonus:.12}}),
 ability('w_haste','warrior','疾風光環','wind','手動切換，持續耗魔：提高移動、攻擊與施法速度。','aura',10,0,{color:'#99d5bb',toggle:true,drain:1.2,radius:155,interval:1,buff:{speedPct:.08,haste:.07,castSpeed:.07}}),
 ability('w_warcry','warrior','堅壁光環','shield','手動切換，持續耗魔：降低受到的傷害並提高全元素抗性。','aura',12,0,{color:'#bbc5de',toggle:true,drain:1.3,radius:160,interval:1,buff:{reduce:.06,allResist:.07}}),
 ability('w_knight','warrior','焚誓光環','flame','手動切換，持續耗魔：每秒造成火焰傷害並附加短時間灼燒，每層獨立計時，所有來源共用8層上限。','aura',12,0,{color:'#eb935d',toggle:true,drain:2,radius:150,interval:1,damage:.48,damageType:'fire',elementalAura:true,burn:.11,burnDuration:3}),
 ability('w_order','warrior','霜誓光環','snow','手動切換，持續耗魔：每秒造成冰冷傷害與緩速，依敵人冰抗判定凍結。','aura',12,0,{color:'#8ac8e5',toggle:true,drain:1.8,radius:160,interval:1,damage:.32,damageType:'cold',elementalAura:true,debuff:{slow:.14},freezeChance:.08,freezeDuration:.7}),
 ability('w_renewal','warrior','復甦光環','heart','手動切換，持續耗魔：每秒依最大生命與魔力恢復，不再受回復百分比加成。','aura',12,0,{color:'#9cd7a1',toggle:true,drain:1.5,radius:165,interval:1,lifeRestorePct:.012,manaRestorePct:.015}),
 ability('w_crit','warrior','致命光環','target','手動切換，持續耗魔：提高暴擊率與暴擊傷害倍率。','aura',14,0,{color:'#e6bc8e',toggle:true,drain:1.6,radius:165,interval:1,buff:{crit:.06,critDamageBonus:.15}}),
 ability('w_elemental','warrior','元素灌注光環','rune','手動切換，持續耗魔：主動技能附加火冰傷害與狀態，並加強火焰、冰霜光環的傷害與脈衝速度。','aura',16,0,{color:'#d3a2e4',toggle:true,drain:2,radius:170,interval:1,infusion:{fire:.08,cold:.08,burn:.04,burnDuration:2,slow:.08,freezeChance:.04,freezeDuration:.5},elementalBoost:{damage:.15,frequency:.15}}),
 ability('r_volley','ranger','扇形箭','bow','射出 5 支箭，每支造成 85% 攻擊傷害。','projectile',14,3,{damage:.85,arrows:5,pierce:0,speed:560}),
 ability('r_rain','ranger','暴風箭雨','bow','目標區域持續落箭，4 秒內每秒造成 150% 攻擊傷害。','ground',30,8,{damage:1.5,radius:155,duration:4,interval:.5}),
 ability('r_dash','ranger','疾風步','wind','高速位移並獲得 4 秒攻速與移速加成。','dash',10,4,{damage:.8,radius:50,distance:260,speed:1000,duration:4,buff:{haste:.18,speedPct:.2}}),
 ability('r_snipe','ranger','穿心狙擊','target','射出高速穿透箭，造成 480% 攻擊傷害。','projectile',24,6,{damage:4.8,arrows:1,pierce:8,speed:900}),
 ability('r_trap','ranger','毒棘陷阱','rune','放置持續 5 秒的毒棘區域，每秒造成 90% 傷害。','ground',16,5,{damage:.9,radius:120,duration:5,interval:.5,burn:.2}),
 ability('r_venom','ranger','瘟疫領域','flame','廣域毒霧每秒造成 150% 傷害，附加持續侵蝕。','ground',30,9,{damage:1.5,radius:180,duration:6,interval:.5,burn:.35}),
 ability('r_hunt','ranger','獵團光環','eye','手動切換，持續耗魔：自身與召喚物獲得爆擊率與移速加成。','aura',12,0,{toggle:true,drain:1.5,radius:210,interval:1,buff:{crit:.08,speedPct:.12}}),
 ability('r_mark','ranger','獵殺時刻','target','戰吼使自身與召喚物在 6 秒內爆擊 +25%、攻速 +25%。','guard',22,11,{duration:6,buff:{crit:.25,haste:.25}}),
 ability('r_barbs','ranger','破甲印記','target','詛咒周圍敵人，降低 20% 護甲與 10% 傷害，持續 5 秒；不造成直接傷害。','curse',16,6,{radius:180,duration:5,debuff:{armorShred:.2,weaken:.1}}),
 ability('r_wolf','ranger','灰狼夥伴','heart','編隊召喚近戰灰狼；永久存在，直到死亡或重新召喚。','summon',22,9,{summon:{kind:'wolf',count:2,hpMult:.4,attackMult:.45,interval:.75,ranged:false}}),
 ability('r_pack','ranger','月影狼群','eye','編隊召喚月影狼；永久存在，直到死亡或重新召喚。','summon',38,15,{summon:{kind:'wolf',count:4,hpMult:.45,attackMult:.5,interval:.65,ranged:false}}),
 ability('m_flamethrower','mage','熾焰噴流','flame','持續向前噴射火焰，每次造成 45% 攻擊傷害，可移動。','channel',5,0,{mana:5,damage:.45,interval:.24,speedStat:'castSpeed',mode:'flame',length:220,maxLength:460,width:70,maxWidth:160}),
 ability('m_fireball','mage','熾焰火球','flame','火球命中後爆炸，對周圍敵人造成 210% 攻擊傷害並引燃，不會穿透。','projectile',16,3,{damage:2.1,arrows:1,pierce:0,speed:480,color:'#ed9959',explosionRadius:115,burn:.3,duration:3}),
 ability('m_meteor','mage','隕火降臨','meteor','目標區域落下隕火，每秒造成 180% 傷害，持續 4 秒。','ground',34,8,{damage:1.8,radius:175,duration:4,interval:1,burn:.4}),
 ability('m_nova','mage','冰霜新星','snow','冰環造成 160% 攻擊傷害並凍結 2 秒。','nova',18,5,{damage:1.6,radius:170,freeze:2}),
 ability('m_blizzard','mage','永冬風暴','snow','持續 5 秒暴風雪，每秒造成 120% 傷害並反覆凍結。','ground',32,9,{damage:1.2,radius:190,duration:5,interval:.6,freeze:.8}),
 ability('m_spark','mage','連鎖閃電','rune','立即從施法者連向前方敵人，再跳向附近未命中的敵人。基礎最多擊中 4 名，首擊 150% 傷害，每跳保留 80%。','chain',17,3,{damage:1.5,range:650,color:'#9ed7f5',chain:{jumps:3,range:210,falloff:.8}}),
 ability('m_chain','mage','雷霆洪流','staff','射出 7 道雷電，每道造成 140% 傷害並短暫麻痺。','projectile',30,6,{damage:1.4,arrows:7,pierce:4,speed:780,freeze:.35}),
 ability('m_ward','mage','守護光環','shield','手動切換，持續耗魔：自身與召喚物獲得護甲、減傷與生命恢復。','aura',14,0,{color:'#93cfbd',toggle:true,drain:1.5,radius:200,interval:1,buff:{armor:20,reduce:.08,lifeRegen:2}}),
 ability('m_aegis','mage','澄明光環','rune','手動切換，持續耗魔：每秒恢復固定魔力，淨恢復隨等級提高；不受魔力再生百分比加成。','aura',10,0,{color:'#7cbde8',toggle:true,drain:.6,radius:180,interval:1,manaRestore:3.6}),
 ability('m_sanctuary','mage','奧術聖域','rune','戰吼使自身與召喚物各自獲得 30% 生命護盾與 30% 減傷，持續 6 秒。','guard',28,12,{shield:.3,duration:6,buff:{reduce:.3,lifeRegen:8}}),
 ability('m_golem','mage','土傀儡','shield','編隊召喚土傀儡，嘲諷附近非首領敵人並承受前線攻擊；永久存在，直到死亡或重新召喚。','summon',20,0,{mana:20,color:'#b9a27b',damageType:'physical',summon:{kind:'earth_golem',role:'前排坦克',count:1,hpMult:.85,attackMult:.65,interval:1.15,ranged:false,damageType:'physical',armor:22,reduce:.1,tauntRadius:135,attackRadius:70,maxTargets:3}}),
 ability('m_frostgolem','mage','霜衛傀儡','snow','編隊召喚霜衛傀儡，近戰攻擊緩速並有機率凍結敵人；永久存在，直到死亡或重新召喚。','summon',30,0,{mana:30,color:'#9cd8e9',damageType:'cold',summon:{kind:'frost_golem',role:'近戰控場',count:1,hpMult:.7,attackMult:.4,interval:1.2,ranged:false,damageType:'cold',armor:14,attackRadius:80,maxTargets:3,slow:.2,slowDuration:2.5,freezeChance:.12,freezeDuration:.6}}),
 ability('m_spirit','mage','炎靈','staff','編隊召喚遠程炎靈，火焰命中濺射並造成燃燒；永久存在，直到死亡或重新召喚。','summon',26,0,{color:'#e9a064',damageType:'fire',summon:{kind:'fire_spirit',role:'遠程灼燒',count:2,hpMult:.35,attackMult:.6,interval:1.1,ranged:true,damageType:'fire',attackRadius:55,maxTargets:3,burnFraction:.12,burnDuration:3}}),
 ability('m_avatar','mage','雷霆化身','meteor','編隊召喚雷霆化身，以連鎖閃電清掃敵群；永久存在，直到死亡或重新召喚。','summon',42,0,{color:'#b6a3ed',damageType:'lightning',summon:{kind:'storm_spirit',role:'連鎖清場',count:3,hpMult:.55,attackMult:.8,interval:.95,ranged:true,damageType:'lightning',chain:{jumps:2,range:145,falloff:.65}}})
].map(a=>[a.id,a]));
ABILITIES.m_thorn=ability('m_thorn','mage','棘靈','flame','編隊召喚迅捷近戰棘靈，以毒素攻擊並留下最強一份同源中毒。','summon',60,0,{mana:60,color:'#98bd77',damageType:'poison',summon:{kind:'thorn_construct',role:'近戰中毒',count:2,maxCount:4,hpMult:.42,attackMult:.45,interval:.7,ranged:false,damageType:'poison',attackRadius:55,maxTargets:1,poisonFraction:.12,poisonDuration:3}});
ABILITIES.m_warder=ability('m_warder','mage','靈織守衛','rune','編隊召喚低傷遠程靈織，每6秒提供附近友軍4秒同源取強護盾。','summon',45,0,{mana:45,color:'#a2cbd9',damageType:'lightning',summon:{kind:'ward_spirit',role:'遠程護盾',count:1,maxCount:2,hpMult:.45,attackMult:.25,interval:1.5,ranged:true,damageType:'lightning',shieldRatio:.06,shieldInterval:6,shieldDuration:4,shieldRadius:220}});
ABILITIES.m_titan=ability('m_titan','mage','荒原泰坦','shield','占3召喚容量、基礎90MP，永久存在；每第3擊改為震擊。','summon',90,0,{mana:90,damageType:'physical',summon:{type:'titan',kind:'titan',role:'荒原泰坦',count:1,maxCount:1,capacityCost:3,hpMult:2.55,attackMult:1.56,interval:1.2,ranged:false,damageType:'physical',armor:22,reduce:.1,attackRadius:70,maxTargets:1}});
ABILITIES.m_wardlantern=ability('m_wardlantern','mage','護燈靈','shield','跟隨角色，讓光環內的角色和召喚物受到較少傷害。占用 2 點召喚容量，最多 1 隻。','summon',30,0,{mana:30,color:'#9cdecc',summon:{kind:'ward_lantern',role:'防護光環',count:1,maxCount:1,capacityCost:2,hpMult:.55,attackMult:0,interval:1,ranged:false,armor:8,support:{kind:'ward',radius:175,strength:.09}}});
ABILITIES.m_hexidol=ability('m_hexidol','mage','衰咒偶','target','靠近敵群，降低範圍內敵人造成的傷害。對首領及小首領效果減半，同類減傷詛咒取最強。占用 2 點召喚容量，最多 1 隻。','summon',36,0,{mana:36,color:'#cea5f0',summon:{kind:'hex_idol',role:'衰弱詛咒',count:1,maxCount:1,capacityCost:2,hpMult:.55,attackMult:0,interval:1,ranged:false,armor:8,support:{kind:'hex',radius:155,strength:.14}}});
export const SKILL_CATEGORIES={damage:{name:'傷害',icon:'sword',color:'#e6a078'},summon:{name:'召喚',icon:'heart',color:'#9fd1aa'},aura:{name:'光環',icon:'rune',color:'#d8bc77'},curse:{name:'詛咒',icon:'target',color:'#bc91cf'},warcry:{name:'戰吼',icon:'flag',color:'#e0bd86'},movement:{name:'位移',icon:'wind',color:'#8bc9dc'},passive:{name:'被動',icon:'eye',color:'#a5afc0'}};
const categoryByType={nova:'damage',charge:'damage',projectile:'damage',chain:'damage',ground:'damage',trap:'damage',channel:'damage',summon:'summon',aura:'aura',curse:'curse',guard:'warcry',dash:'movement'};
for(const def of Object.values(ABILITIES))def.category=categoryByType[def.type];
export function skillCategory(value){const node=typeof value==='string'?ABILITIES[value]??Object.values(TREES).flat(2).find(n=>n.id===value):value;if(!node)return null;const def=node.ability?ABILITIES[node.ability]:ABILITIES[node.id]??node;return categoryByType[def.type]??(node.mods||node.mechanicSummary?'passive':null);}
const passive=(id,name,icon,mods)=>({id,name,icon,mods,desc:'每投入 1 點，永久強化下列能力。'});
const P=passive;
const skillPage=(ids)=>{const levels=[1,1,6,6,12,18,18,24,30,30],cols=[0,2,0,2,1,0,2,1,0,2],parents=[[],[],[0],[1],[2],[4],[3],[5],[7],[6]];return ids.map((entry,i)=>{const source=typeof entry==='string'?ABILITIES[entry]:entry;return {...(typeof entry==='string'?{id:source.id,name:source.name,desc:source.desc,icon:source.icon,ability:source.id}:source),reqLevel:levels[i],row:[0,0,1,1,2,3,3,4,5,5][i],col:cols[i],prevs:parents[i].map(j=>typeof ids[j]==='string'?ids[j]:ids[j].id),prev:parents[i].length?(typeof ids[parents[i][0]]==='string'?ids[parents[i][0]]:ids[parents[i][0]].id):null,max:20};});};
export const TREES={
 warrior:[skillPage(['w_cleave',P('w_swordcraft','劍術專精','sword',{atkPct:.02}),'w_charge',P('w_momentum','乘勝追擊','wind',{speedPct:.012,haste:.01}),P('w_blood','浴血狂怒','flame',{leech:.003,crit:.005}),'w_blitz',P('w_precision','精準打擊','target',{crit:.01}),P('w_carnage','破陣殺勢','rune',{skillDmg:.025}),'w_whirl',P('w_execution','終結意志','sword',{atkPct:.025,crit:.003})]),
 skillPage([P('w_vigor','堅韌體魄','heart',{hpPct:.025}),P('w_armorcraft','甲冑專精','armor',{armor:2}),'w_guard',P('w_footwork','重甲步法','boot',{speedPct:.012,resist:.005}),P('w_bastion','不屈壁壘','shield',{hpPct:.02,armor:1,thorns:.025}),'w_slam',P('w_defiance','頑強抵抗','shield',{reduce:.005,resist:.005}),P('w_recovery','不屈再生','heart',{lifeRegen:.6}),P('w_retribution','鋼鐵反擊','sword',{thorns:.04}),P('w_resolve','永恆堡壘','shield',{hpPct:.03,armor:2})]),
 []],
 ranger:[skillPage(['r_volley',P('r_fletching','暴風箭術','bow',{atkPct:.02}), 'r_trap','r_barbs',P('r_toxin','腐蝕毒素','flame',{burn:.02,skillDmg:.015}),P('r_piercing','穿透專精','bow',{skillDmg:.025}),P('r_quiver','迅捷箭袋','wind',{haste:.02}), 'r_venom','r_rain',P('r_ballistics','彈道大師','target',{atkPct:.025,crit:.004})]),
 skillPage([P('r_agility','靈巧身法','boot',{speedPct:.015}),P('r_alertness','警覺','eye',{resist:.008}), 'r_dash',P('r_wind','風行遊擊','wind',{speedPct:.01,haste:.015}),'r_hunt','r_snipe',P('r_focus','致命洞悉','eye',{crit:.011}),P('r_survival','荒野生存','heart',{hpPct:.02,lifeRegen:.3}),'r_mark',P('r_ambush','伏擊本能','target',{skillDmg:.03,cdr:.004})]),
 skillPage([P('r_empathy','野性親和','heart',{summonLife:.025}),P('r_spiritbond','靈獸感應','eye',{manaRegen:.3}),P('r_tracking','追蹤本能','target',{summonDamage:.02}),P('r_protection','獸群守望','shield',{armor:1,hpPct:.01}),'r_wolf',P('r_bond','獸群連結','heart',{summonDamage:.025,summonLife:.025}),P('r_huntcall','獵群呼喚','flag',{manaCost:.007}),P('r_ferocity','野性狂熱','sword',{summonDamage:.03}), 'r_pack',P('r_moonpact','月影契約','eye',{summonLife:.03,cdr:.005})])],
 mage:[skillPage(['m_fireball',P('m_kindling','燃火學識','flame',{skillDmg:.02}),'m_spark',P('m_conduit','電能導體','rune',{skillDmg:.025,cdr:.004}),P('m_embers','餘燼蔓延','flame',{atkPct:.015,burn:.02}),P('m_overload','元素超載','rune',{crit:.004}),P('m_convergence','元素匯流','staff',{manaRegen:.3}),'m_chain','m_meteor',P('m_mastery','元素宗師','meteor',{skillDmg:.03})]),
 skillPage([P('m_coldcraft','霜寒學識','snow',{skillDmg:.02}),P('m_icearmor','冰甲學識','shield',{armor:1.5}),'m_nova',P('m_permafrost','永久凍土','snow',{freeze:.05,hpPct:.015}),'m_ward','m_aegis',P('m_crystal','晶霜之心','snow',{resist:.008}),'m_sanctuary','m_blizzard',P('m_glacial','永冬意志','snow',{freeze:.05,reduce:.004})]),
 skillPage([P('m_attunement','魔力調和','rune',{mana:5}),P('m_spiritlore','精靈學識','staff',{summonLife:.025}),P('m_flow','奧術流轉','wind',{manaRegen:.4}),P('m_invocation','喚靈儀式','rune',{summonDamage:.025,summonHaste:.01}),'m_spirit',P('m_pact','元素契約','staff',{summonDamage:.025,summonLife:.025}),P('m_channel','秘法導引','rune',{manaCost:.008,summonSpeed:.01}),P('m_manifest','元素具現','meteor',{summonDamage:.03}),'m_avatar',P('m_transcend','靈魂昇華','eye',{summonLife:.03,cdr:.005})])]
};
const flameNode=ABILITIES.m_flamethrower;
TREES.mage[0].push({id:flameNode.id,name:flameNode.name,desc:flameNode.desc,icon:flameNode.icon,ability:flameNode.id,reqLevel:12,row:2,col:2,prevs:['m_fireball'],prev:'m_fireball',max:20});
// Retain the old node graph solely to validate build-5 saves before refunding it.
const oldWarriorAuraPage=skillPage([P('w_discipline'),P('w_devotion'),P('w_leadership'),P('w_command'),'w_banner','w_knight',P('w_oath'),'w_warcry','w_order',P('w_sovereign')]);
const auraNode=(source,reqLevel,row,col,prev=null)=>{const node=typeof source==='string'?{...ABILITIES[source],ability:source}:source;return {...node,reqLevel,row,col,prev,prevs:prev?[prev]:[],max:20};};
TREES.mage[2].push(auraNode('m_golem',1,0,1),auraNode('m_frostgolem',6,1,1,'m_golem'));
// Import-only graph retained to validate old profiles before refunding that page.
const oldMageSummonPage=TREES.mage[2];
oldMageSummonPage.find(n=>n.id==='m_spiritlore').summonCapacityThreshold={every:5,amount:1,max:4};
const summonRows=[
 ['m_golem',P('m_attunement','魔力調和','rune',{mana:6,summonLife:.02}),P('m_spiritlore','精靈學識','staff',{summonDamage:.03})],
 ['m_frostgolem',P('m_invocation','喚靈儀式','rune',{summonDamage:.04,summonHaste:.005}),P('m_bond','土霜誓約','shield',{summonLife:.04,summonReduce:.003})],
 ['m_spirit',P('m_pact','元素契約','staff',{summonDamage:.04,summonLife:.01}),P('m_flow','奧術流轉','wind',{manaRegenPct:.03,manaRegen:.15})],
 ['m_thorn',P('m_channel','秘法導引','rune',{summonDamage:.04,summonSpeed:.012}),P('m_confluence','元素共鳴','rune',{summonDamage:.03})],
 ['m_warder',P('m_manifest','形態具現','meteor',{summonDamage:.05,summonArea:.01}),P('m_relay','靈紋續擊','rune',{summonHaste:.01})],
 ['m_avatar',P('m_transcend','靈魂昇華','eye',{summonDamage:.05,summonLife:.03}),P('m_sovereign','主宰烙印','eye',{summonDamage:.04,summonManaCost:.003})]
];
TREES.mage[2]=summonRows.flatMap((row,r)=>row.map((source,col)=>auraNode(source,[1,6,12,18,24,30][r],r,col,r?(typeof summonRows[r-1][col]==='string'?summonRows[r-1][col]:summonRows[r-1][col].id):null)));
TREES.mage[2].find(n=>n.id==='m_manifest').summonSkillThreshold={every:5,max:4};
TREES.warrior[2]=[
 auraNode('w_banner',1,0,0),auraNode(P('w_discipline','軍紀','flag',{auraArea:.012,auraManaCost:.008}),1,0,2),
 auraNode('w_haste',6,1,0,'w_banner'),auraNode('w_knight',6,1,1,'w_banner'),auraNode('w_warcry',12,2,0,'w_haste'),
 auraNode('w_order',18,3,1,'w_knight'),auraNode(P('w_oath','永恆誓約','heart',{auraArea:.008,auraDamage:.018}),18,3,2,'w_discipline'),
 auraNode('w_renewal',24,4,0,'w_warcry'),auraNode('w_crit',30,5,0,'w_renewal'),auraNode('w_elemental',30,5,1,'w_order'),
 auraNode(P('w_sovereign','統御意志','flag',{skillAuraEffect:.012,auraDamage:.015}),30,5,2,'w_oath')
];
const auraLink=(id,perRank,effect,label)=>({id,perRank,effect,label});
const auraSynergies={
 w_banner:[auraLink('w_renewal',.003,'haste','攻擊速度')],w_haste:[auraLink('w_renewal',.002,'crit','暴擊率')],
 w_knight:[auraLink('w_banner',.015,'damage','火焰光環傷害'),auraLink('w_crit',.01,'burnDuration','燃燒持續時間')],
 w_order:[auraLink('w_banner',.015,'damage','冰霜光環傷害'),auraLink('w_crit',.004,'freezeChance','凍結基礎機率')],
 w_warcry:[],w_renewal:[auraLink('w_warcry',.012,'healing','生命恢復效果')],w_crit:[auraLink('w_haste',.008,'buffEffect','暴擊增益效果')],
 w_elemental:[auraLink('w_knight',.015,'infusionBurn','灌注燃燒傷害'),auraLink('w_order',.002,'infusionFreeze','灌注凍結基礎機率')]
};
const summonSynergies={
 m_golem:[auraLink('m_pact',.03,'damage','土傀儡傷害'),auraLink('m_attunement',.025,'summonLife','土傀儡生命'),auraLink('m_spiritlore',.003,'summonReduce','土傀儡減傷'),auraLink('m_channel',.01,'tauntArea','嘲諷半徑')],
 m_frostgolem:[auraLink('m_invocation',.03,'damage','霜衛傀儡傷害'),auraLink('m_pact',.025,'summonLife','霜衛傀儡生命'),auraLink('m_permafrost',.003,'summonSlow','緩速幅度'),auraLink('m_spiritlore',.004,'summonFreezeChance','凍結機率'),auraLink('m_channel',.02,'summonFreezeDuration','凍結持續時間')],
 m_spirit:[auraLink('m_invocation',.035,'damage','炎靈傷害'),auraLink('m_pact',.025,'summonLife','炎靈生命'),auraLink('m_manifest',.008,'summonBurn','燃燒傷害比例'),auraLink('m_channel',.02,'summonBurnDuration','燃燒持續時間')],
 m_thorn:[auraLink('m_pact',.005,'summonPoison','中毒傷害比例'),auraLink('m_channel',.02,'summonPoisonDuration','中毒持續時間')],
 m_warder:[auraLink('m_flow',.003,'summonShield','友軍護盾生命比例')],
 m_avatar:[auraLink('m_manifest',.03,'damage','雷霆化身傷害'),auraLink('m_pact',.025,'summonLife','雷霆化身生命'),auraLink('m_channel',.015,'summonChainRange','連鎖距離'),auraLink('m_invocation',.004,'summonChainFalloff','連鎖傷害保留比例'),auraLink('m_spirit',.1,'summonChainJumps','每 10 硬點增加 1 次連鎖跳躍（最多 +2 次）')]
};
const synergySources={m_flamethrower:['m_kindling','m_embers'],w_cleave:['w_blood','w_charge'],w_charge:['w_momentum','w_cleave'],w_blitz:['w_momentum','w_charge'],w_whirl:['w_blood','w_cleave'],w_guard:['w_bastion','w_slam'],w_slam:['w_retribution','w_guard'],w_banner:['w_leadership','w_warcry'],w_warcry:['w_discipline','w_banner'],w_knight:['w_oath','w_banner'],w_order:['w_command','w_knight'],r_volley:['r_fletching','r_rain'],r_rain:['r_ballistics','r_volley'],r_trap:['r_toxin','r_venom'],r_venom:['r_toxin','r_trap'],r_dash:['r_wind','r_hunt'],r_snipe:['r_focus','r_volley'],r_hunt:['r_alertness','r_wolf'],r_mark:['r_focus','r_hunt'],r_wolf:['r_bond','r_hunt'],r_pack:['r_ferocity','r_wolf'],m_fireball:['m_embers','m_meteor'],m_meteor:['m_mastery','m_fireball'],m_spark:['m_conduit','m_chain'],m_chain:['m_overload','m_spark'],m_nova:['m_permafrost','m_blizzard'],m_blizzard:['m_glacial','m_nova'],m_ward:['m_aegis','m_sanctuary'],m_aegis:['m_flow','m_attunement'],m_sanctuary:['m_icearmor','m_ward'],m_spirit:['m_pact','m_ward'],m_avatar:['m_manifest','m_spirit']};
for(const [cls,labels] of Object.entries({warrior:['戰鬥技藝','戰鬥專精','光環'],ranger:['箭術與陷阱','生存與獵技','獸群與靈契'],mage:['火焰與雷霆','冰霜與守護','傀儡與元素契約']})){CLASSES[cls].branches=labels;CLASSES[cls].skills=[];for(const node of TREES[cls].flat())if(node.ability)node.synergies=auraSynergies[node.id]??summonSynergies[node.id]??(synergySources[node.id]??[]).map((id,i)=>({id,perRank:i===0?.04:.03}));}
for(const [cls,id] of [['ranger','r_empathy'],['mage','m_spiritlore']]){const node=TREES[cls].flat().find(n=>n.id===id);node.summonCapacityThreshold={every:5,amount:1,max:4};node.desc+=' 每投入 5 硬點，召喚容量 +1（最多 +4）。';}
// Authentic import-only snapshots. Validation swaps these synchronously before any refund.
const rules20Trees=structuredClone(TREES),rules20Abilities=structuredClone(ABILITIES);
const redefine=(id,changes)=>{ABILITIES[id]={...ABILITIES[id],...changes};};
redefine('m_fireball',{name:'霜晶爆球',icon:'snow',desc:'霜球命中時爆炸並緩速附近敵人，直擊的敵人受到額外冰冷傷害。',mana:15,cooldown:1.08,damage:2.2,speed:670,explosionRadius:95,maxExplosionRadius:180,impactBonus:.32,splashFactor:.7,color:'#9cd8e9',damageType:'cold',slow:.25,slowDuration:2});
redefine('m_flamethrower',{name:'極寒光束',icon:'snow',desc:'持續引導冰束，緩速敵人並短暫降低冰抗。引導時仍可移動及普攻。',mana:4,damage:.22,interval:.3,color:'#9cd8e9',damageType:'cold',mode:'frost',slow:.3,slowDuration:2,coldExposure:.12,coldExposureDuration:1.6,allowsBasic:true,noCrit:true});
redefine('m_blizzard',{desc:'在目標位置降下風暴，持續緩速並有機會凍結敵人。重施時將風暴移至新位置。',mana:26,damage:.85,radius:155,maxRadius:240,duration:3.9,maxDuration:5.2,interval:.65,slow:.35,slowDuration:1.1,freeze:0,freezeChance:.2,freezeDuration:.5,singleField:true});
redefine('m_meteor',{name:'雷暴天幕',icon:'rune',desc:'雷暴持續4秒，每秒180%閃電傷害；命中感電4秒。',color:'#b6a3ed',damageType:'lightning'});
redefine('m_chain',{desc:'射出7道雷電，每道140%閃電傷害，感電4秒。'});
redefine('m_spirit',{name:'霧冰精靈',icon:'snow',desc:'遠程霜晶濺射最多3名敵人，造成冰冷傷害及25%緩速2.5秒。',color:'#9cd8e9',damageType:'cold',summon:{...ABILITIES.m_spirit.summon,kind:'frost_spirit',role:'遠程冰冷濺射',damageType:'cold',slow:.25,slowDuration:2.5}});
redefine('m_thorn',{name:'霧雷雲',icon:'rune',desc:'迅捷近戰霧雷雲，造成閃電傷害並感電4秒；基礎60MP召喚2名。',color:'#b6a3ed',damageType:'lightning',summon:{...ABILITIES.m_thorn.summon,kind:'lightning_blade',role:'近戰感電',damageType:'lightning'}});
for(const id of ['m_fireball','m_meteor','m_spirit','m_thorn']){delete ABILITIES[id].burn;delete ABILITIES[id].burnDuration;for(const key of ['burnFraction','burnDuration','poisonFraction','poisonDuration'])if(ABILITIES[id].summon)delete ABILITIES[id].summon[key];}
delete ABILITIES.m_chain.freeze;
for(const id of ['m_nova','m_blizzard'])redefine(id,{damageType:'cold'});
for(const id of ['m_spark','m_chain','m_avatar','m_warder'])redefine(id,{damageType:'lightning'});
for(const a of Object.values(ABILITIES))if(a.cls==='mage'&&a.damageType==='lightning'){Object.assign(a,{lightningVariance:true,lightningCritBonus:.1,shock:4});if(a.summon)Object.assign(a.summon,{lightningVariance:true,lightningCritBonus:.1,shock:4});}
for(const id of ['r_volley','r_snipe','r_rain','r_dash'])redefine(id,{damageType:'physical'});
redefine('r_trap',{name:'連弩砲塔',desc:'部署8秒連弩，每0.75秒自動射擊300距離內敵人，65%物理傷害。單類上限3，合計上限8。',type:'trap',mana:26,damage:.65,damageType:'physical',trap:{mode:'turret',duration:8,interval:.75,range:300,armTime:.4,maxCount:3,damageType:'physical'}});
redefine('r_venom',{name:'劇毒霧域',desc:'部署毒霧6秒，每秒造成150%攻擊的毒素傷害。重疊的毒霧取最強，與箭毒各自計算。',damageType:'poison',rangerPoison:true,poisonFraction:.35,poisonDuration:3});
delete ABILITIES.r_trap.burn;delete ABILITIES.r_venom.burn;
ABILITIES.r_poisonarrow=ability('r_poisonarrow','ranger','毒霧箭','bow','射出110%毒素傷害箭，附加35%攻擊中毒3秒；命中生成半徑90毒霧3秒，每秒25%攻擊傷害。毒殺造成60%攻擊毒爆並將最強原始毒傳染最多3人4秒，只傳一次。','projectile',16,3,{damage:1.1,damageType:'poison',arrows:1,pierce:0,speed:620,poisonFraction:.35,poisonDuration:3,poisonCloud:true,rangerPoison:true});
ABILITIES.r_ricochet=ability('r_ricochet','ranger','迴旋箭','bow','射出物理箭矢，命中後轉向並飛往附近敵人。每次彈跳遞減傷害，同一箭只命中每個敵人一次。','projectile',20,4,{damage:1.4,damageType:'physical',arrows:1,pierce:0,speed:650,chain:{jumps:3,range:200,falloff:.8}});
ABILITIES.r_mine=ability('r_mine','ranger','毒爆地雷','rune','布置10秒毒雷，0.4秒後有人踏入75距離才爆炸，半徑135，180%毒素傷害並留下毒霧。單類上限4。','trap',22,5,{damage:1.8,damageType:'poison',radius:135,poisonFraction:.35,poisonDuration:3,rangerPoison:true,trap:{mode:'proximity',duration:10,armTime:.4,triggerRadius:75,maxCount:4,damageType:'poison',cloud:true}});
ABILITIES.r_snare=ability('r_snare','ranger','絆索機關','rune','布置10秒絆索，0.4秒後踏入75距離觸發，半徑110造成140%物理傷害，緩速60%持續3秒並暈眩1秒。單類上限4。','trap',18,5,{damage:1.4,damageType:'physical',radius:110,slow:.6,slowDuration:3,stun:1,trap:{mode:'proximity',duration:10,armTime:.4,triggerRadius:75,maxCount:4,damageType:'physical'}});
ABILITIES.r_clone=ability('r_clone','ranger','幻影分身','eye','召喚唯一永久分身（80MP），生命為自身65%；繼承武器、光環與傷害管線一次，另套召喚增傷一次。使用左鍵／右鍵／空白中可由分身施放的傷害、詛咒與戰吼，獨立魔力與冷卻。1級繼承30%，20級100%，30級150%封頂；不複製召喚、光環切換或位移。','summon',80,0,{mana:80,summon:{kind:'mirror_clone',role:'技能鏡像',count:1,maxCount:1,hpMult:.65,attackMult:1,interval:1,ranged:true,inheritance:.3}});
// Elemental roster: physical golem, two mist spirits and two advanced gods.
redefine('m_golem',{name:'哥雷姆',desc:'物理前線坦克，嘲諷附近非首領敵人。形態具現5硬點解鎖範圍攻擊100半徑、最多5目標；每再5硬點半徑+10，最高130。',damageType:'physical',summon:{...ABILITIES.m_golem.summon,damageType:'physical',attackRadius:0,maxTargets:1}});
redefine('m_spirit',{name:'霧冰精靈',desc:'霧冰精靈向前方扇形射出3道冰箭，造成冰冷傷害與25%緩速2.5秒。永久存在。',summon:{...ABILITIES.m_spirit.summon,kind:'mist_ice',role:'扇形冰箭',attackMode:'cone',projectiles:3,spread:.5,attackRadius:65,maxTargets:3}});
redefine('m_thorn',{name:'霧雷雲',desc:'霧雷雲直接對目標放電，跳躍2次、距離180、每跳保留75%，感電4秒。感電使被暴擊率+10百分點、所受暴擊最終傷害+20%。',summon:{...ABILITIES.m_thorn.summon,kind:'mist_thunder',role:'連鎖感電',ranged:true,attackMode:'chain',chain:{jumps:2,range:180,falloff:.75}}});
delete ABILITIES.m_thorn.summon.attackRadius;
delete ABILITIES.m_thorn.summon.maxTargets;
redefine('m_avatar',{name:'雷神',desc:'召喚唯一雷神，占2容量、基礎110MP；直接施放連鎖閃電，跳躍4次，感電使被暴擊率+10百分點、所受暴擊最終傷害+20%。永久存在。',mana:110,summon:{...ABILITIES.m_avatar.summon,kind:'thunder_god',role:'進階連鎖雷霆',count:1,maxCount:1,capacityCost:2,hpMult:1.2,attackMult:1.25,attackMode:'chain',chain:{jumps:4,range:240,falloff:.8}}});
ABILITIES.m_icegod=ability('m_icegod','mage','冰神','snow','召喚唯一冰神，占2容量、基礎110MP；扇形5道冰箭，每第3次攻擊生成半徑160暴風雪3秒，每秒50%攻擊冰冷傷害並緩速35%。永久存在。','summon',110,0,{mana:110,damageType:'cold',color:'#9cd8e9',summon:{kind:'ice_god',role:'進階冰箭暴風雪',count:1,maxCount:1,capacityCost:2,hpMult:1.2,attackMult:1.25,interval:1.1,ranged:true,damageType:'cold',attackMode:'cone',projectiles:5,spread:.8,attackRadius:85,maxTargets:5,slow:.35,slowDuration:3,freezeChance:.18,freezeDuration:.8,storm:{radius:160,duration:3,interval:1,damage:.5,slow:.35}}});
ABILITIES.m_frostarmor=ability('m_frostarmor','mage','霜甲術','shield','凝結霜甲6秒，自身與召喚物各獲20%最大生命護盾、護甲+30與15%減傷。','guard',22,10,{shield:.2,duration:6,buff:{armor:30,reduce:.15}});
ABILITIES.m_icecone=ability('m_icecone','mage','冰錐術','snow','扇形射出3枚冰錐，每枚105%攻擊冰冷傷害，可穿透2次，緩速20%持續2秒；10%機率凍結0.5秒。永冬風暴、永冬意志每硬點分別使傷害+4%、+3%。','projectile',16,3,{damage:1.05,damageType:'cold',color:'#9cd8e9',arrows:3,pierce:2,speed:550,slow:.2,slowDuration:2,freezeChance:.1,freezeDuration:.5});
for(const a of Object.values(ABILITIES))if(a.cls==='mage'&&a.damageType==='lightning'){Object.assign(a,{shockCritTaken:.1,shockCritDamage:.2});if(a.summon)Object.assign(a.summon,{shockCritTaken:.1,shockCritDamage:.2});if(a.damage)a.desc+=' 閃電每次原始命中傷害為50%至150%，技能暴擊率+10百分點；感電4秒，使被暴擊率+10百分點與所受暴擊最終傷害+20%。';}
for(const a of Object.values(ABILITIES))a.category=categoryByType[a.type];
TREES.mage[0]=[
 auraNode('m_fireball',1,0,0),auraNode(P('m_coldcraft','霜寒學識','snow',{skillDmg:.02}),1,0,2),
 auraNode('m_nova',6,1,0,'m_fireball'),auraNode(P('m_icearmor','冰甲學識','shield',{armor:1.5}),6,1,2,'m_coldcraft'),
 auraNode('m_flamethrower',12,2,0,'m_nova'),auraNode(P('m_permafrost','永久凍土','snow',{freeze:.05,hpPct:.015}),12,2,2,'m_icearmor'),
 auraNode('m_frostarmor',12,2,1,'m_nova'),
 auraNode('m_ward',18,3,0,'m_flamethrower'),auraNode(P('m_crystal','晶霜之心','snow',{resist:.008}),18,3,2,'m_permafrost'),
 auraNode('m_icecone',18,3,1,'m_flamethrower'),
 auraNode('m_sanctuary',24,4,0,'m_ward'),auraNode('m_blizzard',30,5,0,'m_sanctuary'),auraNode(P('m_glacial','永冬意志','snow',{freeze:.05,reduce:.004}),30,5,2,'m_crystal')];
TREES.mage[1]=[
 auraNode('m_spark',1,0,0),auraNode(P('m_kindling','雷光學識','rune',{skillDmg:.02}),1,0,2),
 auraNode(P('m_conduit','電能導體','rune',{skillDmg:.025,cdr:.004,castSpeed:.01}),6,1,0,'m_spark'),auraNode(P('m_embers','電荷凝聚','rune',{atkPct:.015,lightningDamage:.02}),6,1,2,'m_kindling'),
 auraNode('m_aegis',12,2,0,'m_conduit'),auraNode(P('m_overload','雷電超載','rune',{crit:.004}),12,2,2,'m_embers'),
 auraNode('m_chain',18,3,0,'m_aegis'),auraNode(P('m_convergence','冰雷匯流','staff',{manaRegen:.3}),18,3,2,'m_overload'),
 auraNode('m_meteor',30,5,0,'m_chain'),auraNode(P('m_mastery','雷霆宗師','rune',{skillDmg:.03}),30,5,2,'m_convergence')];
const summonPassive=id=>TREES.mage[2].find(n=>n.id===id);
const elementalRows=[['m_golem',summonPassive('m_attunement'),summonPassive('m_spiritlore')],['m_spirit',summonPassive('m_invocation'),summonPassive('m_bond')],['m_thorn',summonPassive('m_pact'),summonPassive('m_flow')],['m_warder',summonPassive('m_channel'),summonPassive('m_confluence')],[summonPassive('m_manifest'),summonPassive('m_transcend'),summonPassive('m_relay')],['m_avatar','m_icegod',summonPassive('m_sovereign')]];
TREES.mage[2]=elementalRows.flatMap((row,r)=>row.map((source,col)=>{const prev=r?typeof elementalRows[r-1][col]==='string'?elementalRows[r-1][col]:elementalRows[r-1][col].id:null;return auraNode(source,[1,6,12,18,24,30][r],r,col,prev);}));
summonSynergies.m_spirit=[auraLink('m_invocation',.035,'damage','霧冰精靈傷害'),auraLink('m_pact',.025,'summonLife','霧冰精靈生命'),auraLink('m_manifest',.003,'summonSlow','緩速幅度'),auraLink('m_channel',.02,'summonSlowDuration','冰冷控制持續時間')];
summonSynergies.m_thorn=[auraLink('m_pact',.03,'damage','霧雷雲傷害'),auraLink('m_channel',.025,'summonLife','霧雷雲生命'),auraLink('m_invocation',.004,'summonChainFalloff','連鎖傷害保留比例')];
summonSynergies.m_icegod=[auraLink('m_manifest',.03,'damage','冰神傷害'),auraLink('m_bond',.025,'summonLife','冰神生命'),auraLink('m_glacial',.004,'summonFreezeChance','冰神凍結機率')];
TREES.ranger=[
 skillPage(['r_volley',P('r_fletching','暴風箭術','bow',{atkPct:.02}),'r_poisonarrow',P('r_toxin','腐蝕毒素','rune',{poisonDamage:.02,skillDmg:.015}),'r_ricochet',P('r_piercing','穿透專精','bow',{skillDmg:.025}),P('r_quiver','迅捷箭袋','wind',{haste:.02}),'r_venom','r_rain',P('r_ballistics','彈道大師','target',{atkPct:.025,crit:.004})]),
 skillPage(['r_trap',P('r_mechanics','機關學識','rune',{skillDmg:.02}),'r_mine',P('r_payload','毒霧載荷','rune',{poisonDamage:.02}),'r_snare',P('r_engineering','精密工學','rune',{cdr:.005}),P('r_patience','伏擊耐性','eye',{skillDuration:.01}),'r_barbs',P('r_salvager','機動補給','heart',{manaRegen:.3}),P('r_ambush','機關伏擊','target',{skillDmg:.03,cdr:.004})]),
 skillPage([P('r_agility','靈巧身法','boot',{speedPct:.015}),P('r_alertness','警覺','eye',{resist:.008}),'r_dash',P('r_wind','風行遊擊','wind',{speedPct:.01,haste:.015}),'r_hunt','r_snipe',P('r_focus','致命洞悉','eye',{crit:.011}),'r_mark','r_clone',P('r_bond','幻影連結','eye',{summonDamage:.025,summonLife:.025})])];
Object.assign(synergySources,{r_volley:['r_fletching','r_rain'],r_poisonarrow:['r_toxin','r_venom'],r_ricochet:['r_piercing','r_volley'],r_trap:['r_mechanics','r_engineering'],r_mine:['r_payload','r_mechanics'],r_snare:['r_mechanics','r_patience'],r_venom:['r_toxin','r_poisonarrow'],r_hunt:['r_alertness','r_bond'],r_clone:['r_bond','r_mark'],m_fireball:['m_coldcraft','m_blizzard'],m_flamethrower:['m_coldcraft','m_permafrost'],m_meteor:['m_mastery','m_chain']});
CLASSES.mage.title='冰霜與雷霆';CLASSES.mage.branches=['冰霜秘法','雷電秘法','元素召喚'];CLASSES.ranger.branches=['弓箭與毒霧','陷阱機關','幻影遊擊'];
for(const cls of ['mage','ranger'])for(const n of TREES[cls].flat())if(n.ability)n.synergies=summonSynergies[n.id]??(synergySources[n.id]??[]).map((id,i)=>auraLink(id,i===0?.04:.03,'damage','技能傷害'));
TREES.mage[0].find(n=>n.id==='m_icecone').synergies=[auraLink('m_permafrost',.04,'damage','冰錐傷害'),auraLink('m_glacial',.03,'damage','冰錐傷害')];
TREES.ranger.flat().find(n=>n.id==='r_clone').synergies=[auraLink('r_mark',.01,'cloneManaRegen','分身回魔速度')];
for(const [id,desc] of Object.entries({r_bond:'每點召喚傷害與生命+2.5%，只套用於分身一次，不改變繼承倍率。',r_mark:ABILITIES.r_mark.desc+' 每個投入硬點另使分身回魔速度+1%。'})){const n=TREES.ranger.flat().find(n=>n.id===id)??TREES.mage.flat().find(n=>n.id===id);n.desc=desc;}
// The condensed trees keep original unlock levels and move removed passives
// into surviving nodes. These aliases describe effect ownership, not learnable IDs.
const mergedSkillOwners={m_icearmor:'m_frostarmor',m_permafrost:'m_blizzard',m_crystal:'m_coldcraft',m_kindling:'m_conduit',m_convergence:'m_conduit',m_embers:'m_mastery',m_attunement:'m_spiritlore',m_bond:'m_invocation',m_pact:'m_manifest',m_flow:'m_channel',m_confluence:'m_transcend',m_relay:'m_sovereign',r_toxin:'r_venom',r_piercing:'r_ricochet',r_quiver:'r_ballistics',r_payload:'r_mine',r_engineering:'r_snare',r_patience:'r_ambush',r_salvager:'r_mechanics',r_alertness:'r_agility',r_wind:'r_dash',r_focus:'r_snipe'};
TREES.mage[1].push(auraNode({...P('m_manawell','秘能之泉','rune',{mana:8,manaRegenPct:.05}),desc:'每點增加8點魔力上限與5%回魔速度。回魔速度與其他加成相加，總上限為+200%。'},1,0,2));
const compactPages={mage:[['m_fireball','m_nova','m_flamethrower','m_icecone','m_frostarmor','m_blizzard','m_coldcraft','m_glacial'],['m_spark','m_chain','m_meteor','m_aegis','m_conduit','m_overload','m_mastery','m_manawell'],['m_golem','m_spirit','m_thorn','m_warder','m_avatar','m_icegod','m_spiritlore','m_invocation','m_channel','m_manifest','m_transcend','m_sovereign']],ranger:[['r_volley','r_poisonarrow','r_ricochet','r_venom','r_rain','r_fletching','r_ballistics'],['r_trap','r_mine','r_snare','r_barbs','r_mechanics','r_ambush'],['r_dash','r_hunt','r_snipe','r_mark','r_clone','r_agility','r_bond']]};
for(const [cls,pages] of Object.entries(compactPages)){
 const before=new Map(TREES[cls].flat().map(n=>[n.id,n])),keep=new Set(pages.flat());
 for(const [removed,owner] of Object.entries(mergedSkillOwners)){if(!before.has(removed)||!before.has(owner))continue;const target=before.get(owner);target.mods={...(target.mods??{})};for(const [key,value] of Object.entries(before.get(removed).mods??{}))target.mods[key]=(target.mods[key]??0)+value;}
 const ancestor=id=>keep.has(id)?[id]:(before.get(id)?.prevs??[]).flatMap(ancestor);
 for(const id of keep){const n=before.get(id);n.prevs=[...new Set(n.prevs.flatMap(ancestor))];n.prev=n.prevs[0]??null;const links=new Map();for(const link of n.synergies??[]){let owner=mergedSkillOwners[link.id]??link.id;if(owner===id)owner=({r_ricochet:'r_rain',r_venom:'r_rain',r_mine:'r_ambush'}[id]??null);if(!owner||!keep.has(owner))continue;const key=owner+':'+(link.effect??'damage'),prior=links.get(key);links.set(key,{...link,id:owner,perRank:(prior?.perRank??0)+link.perRank});}if(n.synergies)n.synergies=[...links.values()];}
 TREES[cls]=pages.map(ids=>[...before.values()].filter(n=>ids.includes(n.id)));
}
for(const [id,description] of Object.entries({m_frostarmor:'每硬點另永久增加護甲1.5。',m_blizzard:'每硬點另增加最大生命1.5%與凍結效果0.05，並強化霜晶爆球、冰霜新星、極寒光束與冰錐術。',r_venom:'每硬點另增加毒素傷害2%與技能傷害1.5%，並強化毒霧箭。',r_ricochet:'每硬點另增加技能傷害2.5%；暴風箭雨硬點亦強化本技能。',r_mine:'每硬點另增加毒素傷害2%；機關伏擊硬點亦強化本技能。',r_snare:'每硬點另增加冷卻縮減0.5%，並強化連弩砲塔。',r_dash:'每硬點另永久增加移動速度1%與攻擊速度1.5%。'})){ABILITIES[id].desc+=' '+description;const n=TREES[ABILITIES[id].cls].flat().find(node=>node.id===id);n.desc=ABILITIES[id].desc;}
for(const [id,description] of Object.entries({m_coldcraft:'每點技能傷害+2%、全抗性+0.8%，並以硬點強化霜晶爆球及極寒光束。',m_conduit:'每點技能傷害+4.5%、冷卻縮減+0.4%、施法速度+1%、每秒回魔+0.3，並強化連鎖閃電。',m_mastery:'每點技能傷害+3%、攻擊傷害+1.5%、閃電傷害+2%，並以硬點強化雷暴天幕。',r_ballistics:'每點攻擊傷害+2.5%、暴擊率+0.4%、攻擊速度+2%，並強化暴風箭雨。',r_mechanics:'每點技能傷害+2%、每秒回魔+0.3，機關額外傷害+2%；另以硬點強化連弩、毒雷與絆索。',r_ambush:'每點技能傷害+3%、冷卻縮減+0.4%、持續時間+1%、機關存續時間另+2%；硬點亦強化毒爆地雷與絆索機關。',r_agility:'每點移動速度+1.5%、全抗性+0.8%，並以硬點強化獵團光環。'})){const n=TREES.mage.flat().find(node=>node.id===id)??TREES.ranger.flat().find(node=>node.id===id);n.desc=description;}
TREES.mage[2].find(n=>n.id==='m_spiritlore').summonCapacityThreshold={every:3,amount:1,max:6};
const hardSkillRank=(c,id)=>{const owner=TREES[c.cls]?.flat().some(n=>n.id===id)?id:mergedSkillOwners[id]??id;return Math.max(0,Math.min(skillNode(c.cls,owner)?.max??10,Math.floor(c.talents?.[owner]||0)));};
function rangerSupportStats(c){return {poisonBurst:0,poisonBurstRadius:100,poisonSpreadTargets:c.talents.r_spread?2:0,poisonSpreadDuration:3,cloudDamage:.25,cloudDuration:3,cloudRadius:90,trapDamage:0,trapDuration:0};}
const MAGE_SUMMON_IDS=['m_golem','m_spirit','m_thorn','m_warder','m_avatar','m_icegod'];
function summonSupportStats(c){
 const has=id=>hardSkillRank(c,id)>0;
 return {ritualShield:has('m_invocation')?.1:0,commandDuration:has('m_channel')?5:0,confluence:has('m_transcend')?.08:0,relay:has('m_sovereign')?.15:0,rescue:has('m_transcend')?{health:.12,invuln:1,cooldown:8}:null,focus:has('m_sovereign')?.02:0};
}
const summonSupportDescriptions={
 m_attunement:'每點最大魔力 +6、召喚生命 +2%；土傀儡每硬點額外生命 +2.5%。',
 m_spiritlore:'每點召喚傷害 +3%；每5硬點容量 +1，最多 +4。硬點亦提高土傀儡減傷與霜衛凍結。',
 m_invocation:'每點召喚傷害 +4%、攻速 +0.5%；每5硬點，C新召的單位獲6秒5%生命護盾，最多20%。霧冰傷害與霧雷連鎖另有硬點支持。',
 m_bond:'每點召喚生命 +4%、召喚減傷 +0.3%。',
 m_pact:'每點召喚傷害 +4%、生命 +1%；每硬點霧雷雲額外傷害 +3%，並強化冰岩、霜衛、霜晶與雷霆生命或傷害。',
 m_flow:'每點回魔速度 +3%、每秒回魔 +0.15；靈織護盾每硬點 +0.3百分點。',
 m_channel:'每點召喚傷害 +4%、移速 +1.2%；C後全隊攻速 +10%、移速 +20%，持續4秒，每5硬點延長1秒，最多8秒；每硬點霧雷雲生命另 +2.5%。',
 m_confluence:'每點召喚傷害 +3%；命中同帶冰冷緩速或冰凍、且感電的敵人時，每硬點追加原始未爆擊傷害0.5%閃電，最多10%，同敵冷卻1.5秒，不再觸發感電或連鎖。',
 m_manifest:'每點召喚傷害 +5%、召喚範圍 +1%；每5硬點召喚有效等級 +1，最多 +4。5硬點解鎖哥雷姆100半徑範圍攻擊、最多5目標；10／15／20硬點半徑110／120／130，裝備等級不解鎖。',
 m_relay:'每點召喚攻速 +1%；每第4次單位攻擊，每硬點追加原始攻擊基準1%的協同弧光，最多20%，不再觸發。',
 m_transcend:'每點召喚傷害 +5%、生命 +3%；5硬點起救援致死召喚，恢復10／12／14／16%生命並免傷1秒，全隊共用8秒冷卻。',
 m_sovereign:'每點召喚傷害 +4%、召喚魔耗降低0.3%；單一技能來源編隊攻擊同目標至多5層，每層每硬點增傷1%，總計最多100%，換目標清空。'
};
Object.assign(summonSupportDescriptions,{
 m_spiritlore:'每點召喚傷害+3%、最大魔力+6、召喚生命+2%；每3硬點召喚容量+1，最多+6。硬點亦強化哥雷姆生命與減傷。',
 m_invocation:'每點召喚傷害+4%、生命+4%、攻速+0.5%、減傷+0.3%；每5硬點C新召單位獲6秒5%生命護盾，最多20%。支持冰霧傷害、冰神生命與雷鏈保留傷害。',
 m_channel:'每點召喚傷害+4%、移速+1.2%、回魔速度+3%、每秒回魔+0.15。C後全隊攻速+10%、移速+20%，持續4秒，每5硬點延長1秒、最多8秒；支持霧雷生命、冰霧緩速時間與靈織護盾。',
 m_manifest:'每點召喚傷害+9%、生命+1%、範圍+1%；每5硬點召喚有效等級+1，最多+4。5硬點解鎖哥雷姆100半徑範圍攻擊、最多5目標；10／15／20硬點半徑110／120／130。硬點亦支持冰雷召喚傷害與生命，裝備等級不解鎖。',
 m_transcend:'每點召喚傷害+8%、生命+3%；命中同帶冰冷緩速或冰凍、且感電的敵人，每硬點追加0.5%原始未爆擊閃電、最高10%，同敵冷卻1.5秒且不連鎖。5硬點起致死救援恢復10／12／14／16%生命、免傷1秒，全隊共用8秒冷卻。',
 m_sovereign:'每點召喚傷害+4%、攻速+1%、魔耗降低0.3%；每第4次單位攻擊，每硬點追加原始攻擊1%協同弧光，最多20%，不再觸發。編隊同源攻擊同目標至多5層，每層每硬點增傷1%、總計最多100%，換目標清空。'
});
for(const n of TREES.mage[2])if(summonSupportDescriptions[n.id]&&!n.ability)n.desc=summonSupportDescriptions[n.id];
export function summonSupportDetails(c,id=null){
 const rows=Object.entries(Mastery.SUPPORTS).map(([key,spec])=>({id:key,name:spec.name,rank:hardSkillRank(c,key),description:spec.description,targets:[...MAGE_SUMMON_IDS],active:hardSkillRank(c,key)>0,threshold:1,nextThreshold:hardSkillRank(c,key)>0?null:1}));
 return id?rows.filter(row=>MAGE_SUMMON_IDS.includes(id)?row.targets.includes(id):row.id===id):rows;
}
// Retained only for one-time import validation, never consulted during combat.
const skillRulesV1Trees=structuredClone(TREES);
for(const [cls,pages]of Object.entries(TREES)){
 const before=new Map(pages.flat().map(n=>[n.id,n])),keep=new Set([...before.values()].filter(n=>n.ability||Object.hasOwn(Mastery.SUPPORTS,n.id)).map(n=>n.id));
 const ancestors=(id,seen=new Set())=>{if(seen.has(id))return [];seen=new Set([...seen,id]);return keep.has(id)?[id]:(before.get(id)?.prevs??[]).flatMap(parent=>ancestors(parent,seen));};
 TREES[cls]=pages.map(page=>page.filter(n=>keep.has(n.id)).map(node=>{
  const n={...node,max:node.ability?10:1,prevs:[...new Set(node.prevs.flatMap(id=>ancestors(id)))]};n.prev=n.prevs[0]??null;
  delete n.mods;delete n.summonCapacityThreshold;delete n.summonSkillThreshold;
  n.synergies=(n.synergies??[]).filter(link=>keep.has(link.id)&&(link.effect??'damage')!=='damage');
  if(!n.ability){const spec=Mastery.SUPPORTS[n.id];n.name=spec.name;n.desc=spec.description;n.mechanicSummary=spec.summary;summonSupportDescriptions[n.id]=spec.description;}
  else {const a=ABILITIES[n.ability];a.desc=a.desc.replace(/ 每硬點另[\s\S]*$/,'');if(a.id==='r_clone')a.desc=a.desc.replace('1級繼承30%，20級100%，30級150%封頂','1級繼承40%，10級100%，裝備加成最高13級130%');if(a.type==='projectile'&&!a.chain&&!a.explosionRadius)a.desc+=' 同次施放對每名敵人最多命中一次，多重投射物用於覆蓋敵群。';n.desc=a.desc;}
  return n;
 }));
}
const skillRulesV2Trees=structuredClone(TREES);
installClassData(CLASSES,ABILITIES,TREES);installBasicAttackData(CLASSES,TREES);
Object.assign(ABILITIES.r_poisonarrow,{poisonFraction:.32,poisonDuration:4});
ABILITIES.r_poisonarrow.desc='毒箭命中疊加獨立計時毒素，基礎5層、天賦最多12層。毒霧另計且重疊取強；霧爆箭提前結算40%剩餘箭毒。額外投射物增加箭數，同輪每名敵人只疊一次毒。';
for(const id of ['m_golem','m_spirit','m_thorn','m_avatar','m_icegod'])if(ABILITIES[id]?.summon)ABILITIES[id].summon.attackMult*=.5;
// Nonenumerable entries keep legacy catalog iteration and migrations unchanged.
const supportSummonSkills=Object.values(ABILITIES).filter(def=>def.summon?.support).map(def=>({...def,ability:def.id,reqLevel:1,prevs:[],max:10}));
const ringBowSkills=BOW_SKILLS.map(({id,name,icon,desc,mana,cooldown,projectile})=>{
 ABILITIES[id]=ability(id,'ranger',name,icon,desc,'projectile',mana,cooldown,projectile);
 return {id,name,icon,desc,ability:id,reqLevel:1,prevs:[],max:10};
});
const ringBowSkillIds=new Set(ringBowSkills.map(node=>node.id));
const ringSkillNodes=[...Object.values(TREES).flat(2),...supportSummonSkills,...ringBowSkills];
const ringSkillsById=new Map(ringSkillNodes.map(node=>[node.id,node]));
Object.defineProperty(CLASSES,'wanderer',{value:{
 name:'旅人',title:'燼脈圖',color:'#d7c094',hp:230,atk:24,armor:8,icon:'rune',skills:[],branches:[],sets:[],desc:'從燼脈中心發展自己的能力。'
}});
Object.defineProperty(TREES,'wanderer',{value:[ringSkillNodes]});
export const RING_TREE=RingTree.createRingTree(TREES,PassiveTree.PASSIVE_NODES,ABILITIES);
const LEGACY_RING_TREE=RingTree.createRingTree(TREES,PassiveTree.PASSIVE_NODES,ABILITIES,{legacy:true});
const PREVIOUS_RING_TREE=RingTree.createRingTree(TREES,PassiveTree.PASSIVE_NODES,ABILITIES,{previous:true});
let ringWithShadowStrike,resourceLegacyRing,resourceLegacyShadowRing,uniformRing,uniformShadowRing;
function economyLegacyRing(){return resourceLegacyRing??=RingTree.createRingTree(TREES,PassiveTree.PASSIVE_NODES,ABILITIES,{economyLegacy:true});}
function validationRing(){
 if(validatingResourceLegacy)return economyLegacyRing();
 if(validatingUniformRing)return uniformRing??=RingTree.createRingTree(TREES,PassiveTree.PASSIVE_NODES,ABILITIES,{uniformUtility:true});
 return RING_TREE;
}
function oldShadowStrikeRing(){
 if(validatingResourceLegacy)return resourceLegacyShadowRing??=RingTree.createRingTree(TREES,PassiveTree.PASSIVE_NODES,ABILITIES,{includeShadowStrike:true,economyLegacy:true});
 if(validatingUniformRing)return uniformShadowRing??=RingTree.createRingTree(TREES,PassiveTree.PASSIVE_NODES,ABILITIES,{includeShadowStrike:true,uniformUtility:true});
 return ringWithShadowStrike??=RingTree.createRingTree(TREES,PassiveTree.PASSIVE_NODES,ABILITIES,{includeShadowStrike:true});
}
export const isRingHero=c=>c?.cls==='wanderer';
const ringHas=(c,id)=>isRingHero(c)&&c.ring?.[id]===1;
const ringBenefitCaches=new WeakMap();
function ringBenefits(c){
 const tree=validationRing();let cache=ringBenefitCaches.get(tree);
 if(!cache){cache=new WeakMap();ringBenefitCaches.set(tree,cache);}
 let value=cache.get(c.ring);
 if(!value){value=RingTree.ringDerived(tree,c.ring);cache.set(c.ring,value);}
 return value;
}
export function ringBudget(c){return RingTree.ringPointBudget(c,Progression.ringAchievementPoints(c));}
export function ringPoints(c){return ringBudget(c)-RingTree.ringSpent(c.ring);}
const starterWeaponFor={melee:'sword',spell:'wand',bow:'bow',dagger:'dagger'};
export function ringNodeState(c,id){
 const rule=RingTree.ringState(RING_TREE,c,id,Progression.ringAchievementPoints(c)),ability=rule.node?.ability;
 if(!rule.ok||c.level!==1||rule.rank||!RING_TREE.starters.includes(id)||skillWeaponCompatible(c,ability))return rule;
 const weapon=c.equipment.weapon, starterWeapon=starterWeaponFor[requiredSkillWeapon(ability)];
 if(starterWeapon&&weapon?.id==='starter-'+c.id&&weapon.level===1&&weapon.rarity===0&&
    !weapon.upgrade&&!weapon.locked&&!weapon.sockets.length&&!c.equipment.offhand){
  return {...rule,starterWeapon,starterWeaponName:'旅人'+WEAPON_TYPES[starterWeapon].name};
 }
 return {...rule,ok:false,reason:skillWeaponFailure(c,ability)};
}
function setRing(c,allocation,id){
 c.ring=allocation;
 c.talents={...ringBenefits(c).talents};
 if(id)c.lastRingNode=id;else delete c.lastRingNode;
}
const ringOffhandFull='背包與待拾區已滿，請先清出一格副手空間。';
const ringOffhandDestination=c=>c.bag.length<150?c.bag:c.pendingLoot.length<150?c.pendingLoot:null;
function stowRingOffhand(c){
 const off=c.equipment.offhand;
 if(supportForClass('wanderer',c.equipment.weapon,off))return true;
 const destination=ringOffhandDestination(c);
 if(!destination)return false;
 destination.push(off);
 delete c.equipment.offhand;
 return true;
}
export function allocateRing(c,id){
 if(!isRingHero(c))return {ok:false,reason:'此角色尚未轉入燼脈圖。'};
 const result=ringNodeState(c,id);
 if(!result.ok)return {ok:false,reason:result.reason};
 if(result.starterWeapon)c.equipment.weapon=makeWandererStarterWeapon(c.equipment.weapon.id,result.starterWeapon,()=>.55);
 if(!Object.keys(c.ring).length)c.ringOrigin=id;
 setRing(c,{...c.ring,[id]:result.nextRank},id);
 const ability=result.rank===0?result.node.ability:null;
 if(ability){
  if(skillCategory(ability)==='movement'&&!c.movementSkill)c.movementSkill=ability;
  fillGrantedSkills(c,[ability]);
 }
 reconcileSkillLoadouts(c);
 if(ability&&skillCategory(ability)==='summon'&&!Object.keys(c.summonSkills).length)setSummonCount(c,ability,1);
 return {ok:true};
}
export function resetRing(c){
 if(!isRingHero(c)||!Object.keys(c.ring).length)return {ok:false,reason:'沒有已投入的節點。'};
 if(!stowRingOffhand(c))return {ok:false,reason:ringOffhandFull};
 setRing(c,{});
 delete c.ringOrigin;
 delete c.ringGrandfathered;
 delete c.ringRetainedV84;
 reconcileSkillLoadouts(c);
 return {ok:true};
}
export function convertToRing(c){
 if(isRingHero(c))return {ok:false,reason:'此角色已使用燼脈圖。'};
 if(!stowRingOffhand(c))return {ok:false,reason:ringOffhandFull};
 const credit=Progression.legacyRingCredits(c);
 if(Object.values(credit).some(Boolean))c.ringLegacyCredit=credit;
 c.cls='wanderer';
 c.points=0;
 c.passives={};
 c.skillRulesVersion=2;
 c.talentRulesVersion=2;
 delete c.lastPassiveNode;
 delete c.skillRefundNotice;
 setRing(c,{});
 reconcileSkillLoadouts(c);
 return {ok:true};
}
const oldAchievementSkillPoints=c=>(c.achievements?.claimed??[]).reduce((sum,id)=>sum+(/^boss:[123]$/.test(id)?2:/^(jailer|priest|nest):[123]$/.test(id)?1:0),0);
const oldPointBudget=c=>Math.max(1,Math.min(100,Math.floor(c.level||1)))+oldAchievementSkillPoints(c);
export const skillPointBudget=c=>1+Math.floor(Math.max(1,Math.min(100,Math.floor(c.level||1)))/3)+Progression.achievementSkillPoints(c);
const pointBudget=c=>c.skillRulesVersion===2?skillPointBudget(c):oldPointBudget(c);
export function skillNode(cls,id){return (cls==='wanderer'?ringSkillsById.get(id):TREES[cls]?.flat().find(n=>n.id===id))??null;}
export function learningState(c,id){if(isRingHero(c))return {ok:false,reason:'請在燼脈圖投入點數。',maxRank:0};const n=skillNode(c.cls,id);if(!n||c.shadowStrikeRetired&&id==='a_stab')return {ok:false,reason:'此職業沒有這項技能。',maxRank:0};const maxRank=Math.max(0,Math.min(n.max,c.level-n.reqLevel+1)),rank=c.talents?.[id]??0;if(c.level<n.reqLevel)return {ok:false,reason:`需要角色等級 ${n.reqLevel}。`,maxRank};const missing=n.prevs.filter(p=>!(c.talents?.[p]>0)&&!(c.shadowStrikeRetired&&p==='a_stab'));if(missing.length)return {ok:false,reason:'需要前置技能：'+missing.map(p=>skillNode(c.cls,p).name).join('、')+'（至少 1 硬點）。',maxRank};if(rank>=maxRank)return {ok:false,reason:rank>=n.max?`已達 ${n.max} 點上限。`:'需提升角色等級才能繼續投入。',maxRank};if(c.points<1)return {ok:false,reason:'沒有可分配技能點。',maxRank};return {ok:true,reason:'可投入 1 點。',maxRank};}
export function equipmentSkills(c){return [...new Set(SLOTS.map(slot=>c.equipment?.[slot]?.grantedSkill).filter(id=>typeof id==='string'&&Object.hasOwn(ABILITIES,id)))];}
export function availableSkills(c){return [...new Set([...TREES[c.cls].flat().filter(n=>n.ability&&(c.talents?.[n.id]??0)>0).map(n=>n.ability),...equipmentSkills(c),...(setBonuses(c).active.includes('court')?['m_titan']:[])])];}
function fillGrantedSkills(c,skills=equipmentSkills(c)){const slots=skillLoadout(c),available=new Set(manualSkills(c));for(const id of skills){if(!available.has(id)||slots.includes(id)||autoSkill(c)===id)continue;const empty=slots.indexOf(null);if(empty<0)break;slots[empty]=id;}c.skillSlots=slots;}
const abilityElement=id=>ABILITIES[id]?.damageType??null;
function effectiveAbility(c,id,rank,s=stats(c),investedRank=rank){
 const a=ABILITIES[id];if(!a)return null;
 if(id==='m_titan'){investedRank=0;const levels=Object.values(c.equipment??{}).filter(i=>i.set==='court').map(i=>i.level);rank=Math.min(10,1+Math.floor(Math.min(...levels)/10));}
 const node=skillNode(c.cls,id);
 const hardRank=validatingBinaryRing&&isRingHero(c)&&node?.ability===id&&investedRank>0
  ?RingTree.ringSkillMasteryRank(id)
  :Math.max(0,Math.min(validatingLegacyCapacity?20:10,Math.floor(investedRank||0)));
 const categoryRank=s.skillCategoryLevels?.[skillCategory(a)]??0;
 const powerRank=Math.max(1,Math.min(validatingLegacyCapacity?20:10,Math.floor(rank||0))),bonusRank=Math.min(validatingLegacyCapacity?40:3,s.allSkills+(s.elementalSkills?.[abilityElement(id)]??0)+(a.summon?s.summonSkillLevels??0:0)+categoryRank),level=Math.min(validatingLegacyCapacity?40:13,powerRank+bonusRank),links=node?.synergies??[],linkBonus=effect=>links.filter(link=>(link.effect??'damage')===effect).reduce((total,link)=>total+Math.max(0,Math.min(skillNode(c.cls,link.id)?.max??10,Math.floor(c.talents?.[link.id]||0)))*link.perRank,0),synergyBonus=linkBonus('damage'),potency=(1+.1*(level-1))*(1+synergyBonus),out={...a,hardRank,bonusRank,level,synergyBonus,potency};
 // Aura support has its own multiplier; cap its damage synergy before combining them.
 if(a.damage!==undefined)out.damage=a.type==='aura'?a.damage*(1+.1*(level-1))*(1+Math.min(.7,synergyBonus))*(1+s.auraDamage):a.damage*potency;
 const rankArea=isRingHero(c)&&!validatingBinaryRing?1+.02*Math.max(0,hardRank-1):1;
 if(a.summon){
  const spec=a.summon,typed=Object.hasOwn(summonSynergies,id),rankPotency=1+.1*(level-1),controlGentle=1+.035*(level-1);
  out.summon={...spec,count:Math.min(spec.maxCount??8,spec.count+(validatingLegacyCapacity?Math.floor((level-1)/5):0)),hpMult:spec.hpMult*(typed?rankPotency*(1+linkBonus('summonLife')):potency),attackMult:spec.attackMult*potency};
  if(spec.support){
   const ward=spec.support.kind==='ward',area=(1+Math.max(0,(s.skillArea||0)+(s.summonArea||0)+(ward?s.auraArea||0:0)))*rankArea;
   const effect=controlGentle*(ward?1+(s.skillAuraEffect||0):1);
   out.summon.support={...spec.support,radius:Math.min(ward?260:240,spec.support.radius*area),strength:Math.min(ward?.13:.18,spec.support.strength*effect)};
  }
  if(id==='r_clone'){out.summon={...spec,count:1,maxCount:1,hpMult:.65,attackMult:1,manaRegenBonus:linkBonus('cloneManaRegen'),inheritance:Math.min(1.3,level<=10?.4+.04*(level-1):.76+.1*(level-10))};}
  if(typed){
   const area=(1+Math.min(1.5,s.skillArea+(s.summonArea??0)))*rankArea,duration=1+s.skillDuration;
   if(spec.attackRadius!==undefined)out.summon.attackRadius=Math.min(150,spec.attackRadius*area);
   if(spec.maxTargets!==undefined)out.summon.maxTargets=Math.min(5,spec.maxTargets);
   if(id==='m_golem'){
    const hard=hardSkillRank(c,'m_manifest');
    out.summon.attackRadius=hard>0?120:0;out.summon.maxTargets=hard>0?5:1;
    if(isRingHero(c)&&c.level<20)out.summon.attackMult*=1+.35*(20-c.level)/19;
   }
   if(spec.reduce!==undefined)out.summon.reduce=Math.min(.3,spec.reduce+linkBonus('summonReduce'));
   if(spec.tauntRadius!==undefined)out.summon.tauntRadius=Math.min(200,spec.tauntRadius*area*(1+linkBonus('tauntArea')));
   if(spec.slow!==undefined)out.summon.slow=Math.min(.4,(spec.slow+linkBonus('summonSlow'))*controlGentle);
   if(spec.slowDuration!==undefined)out.summon.slowDuration=Math.min(6,spec.slowDuration*duration*(1+linkBonus('summonSlowDuration')));
   if(spec.freezeChance!==undefined)out.summon.freezeChance=Math.min(.3,(spec.freezeChance+linkBonus('summonFreezeChance'))*controlGentle);
   if(spec.freezeDuration!==undefined)out.summon.freezeDuration=Math.min(1.5,spec.freezeDuration*controlGentle*(1+linkBonus('summonFreezeDuration')));
   if(spec.burnFraction!==undefined)out.summon.burnFraction=Math.min(.35,spec.burnFraction+linkBonus('summonBurn'));
   if(spec.burnDuration!==undefined)out.summon.burnDuration=Math.min(6,spec.burnDuration*duration*(1+linkBonus('summonBurnDuration')));
   if(spec.poisonFraction!==undefined)out.summon.poisonFraction=Math.min(.3,spec.poisonFraction+linkBonus('summonPoison'));
   if(spec.poisonDuration!==undefined)out.summon.poisonDuration=Math.min(4,spec.poisonDuration+linkBonus('summonPoisonDuration'));
   if(spec.shieldRatio!==undefined){out.summon.shieldRatio=Math.min(.2,spec.shieldRatio+level*.002+linkBonus('summonShield'));out.summon.shieldRadius=spec.shieldRadius*area;}
   if(spec.chain)out.summon.chain={jumps:Math.min(id==='m_avatar'?6:4,spec.chain.jumps+Math.min(2,Math.floor(linkBonus('summonChainJumps')))),range:Math.min(300,spec.chain.range*area*(1+linkBonus('summonChainRange'))),falloff:Math.min(.8,spec.chain.falloff+linkBonus('summonChainFalloff'))};
  }
 }
 if(a.trap){out.trap={...a.trap,duration:Math.min(20,a.trap.duration*(1+(s.rangerSupport?.trapDuration??0)))};out.damage*=1+(s.rangerSupport?.trapDamage??0);}
 const gentle=1+.035*(level-1)+synergyBonus*.5;
 if(a.type==='dash'&&level>1&&!validatingBinaryRing&&(isRingHero(c)||categoryRank>0)){
  const recovery=1+.02*(level-1);
  if(a.recharge)out.recharge=a.recharge/recovery;
  else if(a.cooldown)out.cooldown=a.cooldown/recovery;
 }
 if(a.buff)out.buff=Object.fromEntries(Object.entries(a.buff).map(([k,v])=>[k,v*gentle]));
 if(a.shield)out.shield=a.shield*gentle;
 if(a.duration&&a.type!=='channel')out.duration=Math.min(a.maxDuration??Infinity,a.duration*(1+.0125*(level-1))*(1+s.skillDuration)*(a.type==='summon'?1+s.summonDuration:1));
 if(a.type==='curse'){out.duration=Math.min(25,out.duration);out.debuff=Object.fromEntries(Object.entries(a.debuff??{}).map(([key,value])=>[key,Math.min(key==='slow'?.5:key==='armorShred'?.45:.3,value*gentle)]));}
 if(a.freeze)out.freeze=a.freeze*(1+.015*(level-1));if(a.leech)out.leech=a.leech*(1+.02*(level-1));if(a.burn)out.burn=a.burn*potency;
 out.mana=a.type==='channel'||id==='m_titan'?a.mana:a.mana*(1+.045*(level-1));
 if(a.drain)out.drain=a.drain*(1+.025*(level-1));
 const area=(1+Math.max(0,Math.min(1.5,s.skillArea||0)))*rankArea,projectiles=Math.max(0,Math.min(6,Math.floor(s.extraProjectiles||0)));
 if(a.rangerPoison)out.poisonStackLimit=s.poisonStackLimit;
 if(id==='r_poisonarrow')out.poisonCloudRadius=Math.min(240,90*area);
 if(a.radius!==undefined&&a.type!=='projectile')out.radius=a.type==='aura'?Math.min(300,a.radius*(area+s.auraArea)*(1+.012*(level-1))):Math.min(a.maxRadius??400,a.radius*area);
 if(a.type==='aura'){
  if(a.debuff)out.debuff=Object.fromEntries(Object.entries(a.debuff).map(([key,value])=>[key,Math.min(key==='slow'?.6:key==='armorShred'?.45:.35,value*gentle)]));
  if(a.manaRestore)out.manaRestore=Math.min(10,a.manaRestore+.22*(level-1)+Math.min(.7,synergyBonus*.5));
  const effect=1+s.skillAuraEffect;
  if(a.buff)out.buff=Object.fromEntries(Object.entries(out.buff).map(([key,value])=>[key,value*effect]));
  if(a.cls==='warrior'){
   const strength=(1+.025*(level-1))*effect;
   if(a.buff)out.buff=Object.fromEntries(Object.entries(a.buff).map(([key,value])=>[key,value*strength*(1+linkBonus('buffEffect'))]));
   if(id==='w_banner'&&linkBonus('haste'))out.buff.haste=linkBonus('haste')*effect;
   if(id==='w_haste'&&linkBonus('crit'))out.buff.crit=linkBonus('crit')*effect;
   if(id==='w_warcry'){out.buff.reduce=Math.min(.2,out.buff.reduce);out.buff.allResist=Math.min(.25,out.buff.allResist);}
   if(id==='w_crit'){out.buff.crit=Math.min(.2,out.buff.crit);out.buff.critDamageBonus=Math.min(.45,out.buff.critDamageBonus);}
   if(a.burn)out.burn=Math.min(.6,a.burn*(1+.05*(level-1))*(1+Math.min(.7,synergyBonus))*(1+s.auraDamage)*effect);
   if(a.burnDuration)out.burnDuration=Math.min(6,a.burnDuration*(1+.0125*(level-1))*(1+linkBonus('burnDuration'))*effect);
   if(a.debuff)out.debuff={slow:Math.min(.5,a.debuff.slow*strength)};
   if(a.freezeChance)out.freezeChance=Math.min(.3,(a.freezeChance*(1+.015*(level-1))+linkBonus('freezeChance'))*effect);
   if(a.freezeDuration)out.freezeDuration=Math.min(2,a.freezeDuration*strength);
   if(a.lifeRestorePct)out.lifeRestorePct=Math.min(.035,a.lifeRestorePct*(1+.025*(level-1))*(1+linkBonus('healing'))*effect);
   if(a.manaRestorePct)out.manaRestorePct=Math.min(.025,a.manaRestorePct*(1+.015*(level-1))*effect);
   if(a.infusion)out.infusion={fire:Math.min(.2,a.infusion.fire*strength),cold:Math.min(.2,a.infusion.cold*strength),burn:Math.min(.3,a.infusion.burn*strength*(1+linkBonus('infusionBurn'))),burnDuration:Math.min(6,a.infusion.burnDuration*strength),slow:Math.min(.3,a.infusion.slow*strength),freezeChance:Math.min(.2,(a.infusion.freezeChance*(1+.015*(level-1))+linkBonus('infusionFreeze'))*effect),freezeDuration:Math.min(1.5,a.infusion.freezeDuration*strength)};
   if(a.elementalBoost)out.elementalBoost={damage:Math.min(.35,a.elementalBoost.damage*strength),frequency:Math.min(.45,a.elementalBoost.frequency*(1+.04*(level-1)))};
  }
 }
 if(a.explosionRadius!==undefined)out.explosionRadius=Math.min(a.maxExplosionRadius??280,a.explosionRadius*area);if(a.chain)out.chain={...a.chain,jumps:Math.min(10,a.chain.jumps+(id==='m_spark'?projectiles:0)),range:Math.min(400,a.chain.range*area)};if(a.length!==undefined)out.length=Math.min(a.maxLength??460,a.length*area);if(a.width!==undefined)out.width=Math.min(a.maxWidth??160,a.width*area);if(a.type==='projectile'||a.type==='chain')out.extraProjectiles=a.type==='chain'?0:projectiles;
 if(skillCategory(a)==='warcry'&&s.warcryEffect>0){if(out.buff)out.buff=Object.fromEntries(Object.entries(out.buff).map(([key,value])=>[key,value*(1+Math.min(.3,s.warcryEffect))]));if(out.shield)out.shield=Math.min(.4,out.shield*(1+Math.min(.3,s.warcryEffect)));}
 if(isRingHero(c)){
  out.ringBloodSpell=(a.attackTag??(a.cls==='mage'?'spell':'attack'))==='spell'&&skillCategory(a)==='damage';
  if(out.summon&&!out.summon.support&&!['r_clone','a_clone'].includes(id)){
   const elite=(out.summon.capacityCost??1)>1;
   if(ringHas(c,'x:summonarmy'))out.summon.count=Math.min(10,out.summon.count+(elite?1:2));
   if(ringHas(c,'x:summonelite')){
    out.summon.capacityCost=(out.summon.capacityCost??1)+1;
    out.summon.hpMult*=1.3;
    out.summon.attackMult*=1.35;
   }
  }
 }
 if(a.bloodBuildV81)out.bloodBuildScaling={damage:1+Math.max(0,s.auraDamage||0),area:1+Math.min(1.5,Math.max(0,s.skillArea||0)+Math.max(0,s.auraArea||0)),effect:1+Math.max(0,s.skillAuraEffect||0)};
 return validatingLegacyCapacity?out:Mastery.applyMastery(out,hardRank,c.talents,isRingHero(c)&&!validatingBinaryRing);
}
export function abilityFor(c,id){return availableSkills(c).includes(id)?effectiveAbility(c,id,skillNode(c.cls,id)?c.talents?.[id]??0:0):null;}
export function previewAbility(c,id,rank=(c.talents?.[id]??0)+1){return effectiveAbility(c,id,rank);}
export function manualSkills(c){return availableSkills(c).filter(id=>['damage','curse','warcry'].includes(skillCategory(id)));}
export function skillLoadout(c){const known=new Set(manualSkills(c)),used=new Set();return Array.from({length:3},(_,i)=>{const id=c.skillSlots?.[i];if(typeof id!=='string'||!known.has(id)||used.has(id))return null;used.add(id);return id;});}
const offensiveSkill=id=>skillCategory(id)==='damage';
export function autoSkill(c){const id=c.autoSkill;return typeof id==='string'&&offensiveSkill(id)&&availableSkills(c).includes(id)&&!c.skillSlots?.includes(id)?id:null;}
// Legacy getter remains for validating old saves. Active skills are manual-only.
export function assignAutoSkill(c,id){if(id!==null)return false;c.autoSkill=null;return true;}
function reconcileAutoSkill(c){const id=autoSkill(c);c.autoSkill=null;if(id){const slots=skillLoadout(c),empty=slots.indexOf(null);if(!slots.includes(id)&&empty>=0)slots[empty]=id;c.skillSlots=slots;}}

export function assignSkill(c,slot,id){if(!Number.isInteger(slot)||slot<0||slot>2||id!==null&&(!manualSkills(c).includes(id)||autoSkill(c)===id))return false;const slots=skillLoadout(c);if(id!==null&&slots.some((s,i)=>i!==slot&&s===id))return false;slots[slot]=id;c.skillSlots=slots;return true;}
export function auraLoadout(c){const known=new Set(availableSkills(c));return [...new Set((Array.isArray(c.auraSkills)?c.auraSkills:[]).filter(id=>known.has(id)&&skillCategory(id)==='aura'))];}
export function assignAura(c,id,enabled){if(typeof enabled!=='boolean'||skillCategory(id)!=='aura'||!availableSkills(c).includes(id))return false;const ids=auraLoadout(c);c.auraSkills=enabled?ids.includes(id)?ids:[...ids,id]:ids.filter(a=>a!==id);return true;}
export function movementSkill(c){const id=c.movementSkill;return typeof id==='string'&&skillCategory(id)==='movement'&&availableSkills(c).includes(id)?id:null;}
export function assignMovement(c,id){if(id!==null&&(skillCategory(id)!=='movement'||!availableSkills(c).includes(id)))return false;c.movementSkill=id;return true;}
export function summonCapacity(c,s=stats(c)){return Math.max(0,Math.min(ringHas(c,'x:summonarmy')?22:18,Math.floor(Number.isFinite(s.summonCapacity)?s.summonCapacity:4)));}
export function summonLevelCapacity(c){return Math.min(6,Math.floor(Math.max(1,Math.min(100,Number.isFinite(c?.level)?c.level:1))/10));}
export function summonUnitResourceCost(def,s){const count=ABILITIES[def?.id]?.summon?.count;if(!count)return {mana:0,life:0,rage:0};const cost=resourceCost(def,s);return {mana:cost.mana>0?Math.max(1,Math.ceil(cost.mana/count)):0,life:cost.life/count,rage:cost.rage/count};}
export function summonUnitMana(def,s){return summonUnitResourceCost(def,s).mana;}
const configObject=value=>!!value&&typeof value==='object'&&!Array.isArray(value);
function summonDefinitions(c,s){const defs=new Map();for(const id of availableSkills(c))if(skillCategory(id)==='summon')defs.set(id,effectiveAbility(c,id,c.talents?.[id]??0,s));return defs;}
function planFrom(c,configuration,s,defs=summonDefinitions(c,s)){
 const rows=[],capacity=summonCapacity(c,s),maxMana=s.mana,maxLife=s.hp;let count=0,reason='';
 if(!configObject(configuration))reason='召喚編隊格式無效。';
 else for(const [id,n] of Object.entries(configuration)){const def=defs.get(id);if(!def){reason||='尚未學會這項召喚技能。';continue;}const limit=def.summon.count,unitResourceCost=summonUnitResourceCost(def,s),cost={mana:unitResourceCost.mana*n,life:unitResourceCost.life*n,rage:unitResourceCost.rage*n},capacityCost=def.summon.capacityCost??1;rows.push({id,count:n,limit,unitMana:unitResourceCost.mana,unitLife:unitResourceCost.life,unitResourceCost,cost:cost.mana,manaCost:cost.mana,lifeCost:cost.life,resourceCost:cost,capacityCost,def});if(!Number.isInteger(n)||n<1)reason||='召喚數量必須為正整數。';if(n>limit)reason||='超過此技能的召喚上限。';count+=n*capacityCost;}
 const cost=sumResourceCosts(rows.map(row=>row.resourceCost));if(count>capacity)reason||='超過角色召喚容量。';if(cost.mana>maxMana)reason||='整隊耗魔超過最大魔力。';if(cost.life>Math.max(0,maxLife-1))reason||='整隊生命成本超過可支付生命。';if(cost.rage>100)reason||='整隊狂怒成本超過上限。';return {rows,count,physicalCount:rows.reduce((sum,row)=>sum+row.count,0),capacity,manaCost:cost.mana,lifeCost:cost.life,resourceCost:cost,maxMana,maxLife,resourceClass:s.resourceClass,valid:!reason,reason};
}
export function summonPlan(c,s=stats(c)){return planFrom(c,c.summonSkills,s);}
export function setSummonCount(c,id,count){if(!Number.isInteger(count)||count<0||skillCategory(id)!=='summon'||!availableSkills(c).includes(id))return false;const next={...(configObject(c.summonSkills)?c.summonSkills:{})};if(count)next[id]=count;else delete next[id];const s=stats(c);if(!planFrom(c,next,s).valid)return false;c.summonSkills=next;return true;}
// Plans and the living army have separate budgets: changing a plan never summons or dismisses allies.
export function reconcileSkillLoadouts(c){
 reconcileBasicAttack(c);
 c.skillSlots=skillLoadout(c);reconcileAutoSkill(c);c.auraSkills=auraLoadout(c);c.movementSkill=movementSkill(c);
 const s=stats(c),defs=summonDefinitions(c,s),capacity=summonCapacity(c,s),next={};let count=0,paid={mana:0,life:0,rage:0};
 const fits=cost=>paid.mana+cost.mana<=s.mana+1e-8&&paid.life+cost.life<=s.hp-1+1e-8&&paid.rage+cost.rage<=100;
 for(const [id,value] of Object.entries(configObject(c.summonSkills)?c.summonSkills:{})){const def=defs.get(id);if(!def||!Number.isInteger(value)||value<=0)continue;const unit=summonUnitResourceCost(def,s),step=def.summon.capacityCost??1;let n=0;while(n<Math.min(value,def.summon.count)&&count+step<=capacity&&fits(unit)){n++;count+=step;paid=sumResourceCosts([paid,unit]);}if(n)next[id]=n;}
 c.summonSkills=next;const survivors=[],bySkill={};paid={mana:0,life:0,rage:0};
 for(const unit of Array.isArray(c.summonState)?c.summonState:[]){const def=defs.get(unit?.skill);if(!def||!Number.isFinite(unit.hp)||unit.hp<=0||unit.hp>1e9||survivors.reduce((sum,u)=>sum+(defs.get(u.skill)?.summon.capacityCost??1),0)+(def.summon.capacityCost??1)>capacity||(bySkill[unit.skill]??0)>=def.summon.count)continue;const cost=summonUnitResourceCost(def,s);if(!fits(cost))continue;survivors.push({skill:unit.skill,hp:unit.hp});bySkill[unit.skill]=(bySkill[unit.skill]??0)+1;paid=sumResourceCosts([paid,cost]);}
 c.summonState=survivors;for(const key of ['covenant','evolution'])if(c.setOptions?.[key]&&!setOptionChoices(c,key).some(o=>o.id===c.setOptions[key]))c.setOptions[key]=null;return c;
}

export const SLOTS=['weapon','offhand','helm','chest','hands','feet','charm','ring_left','ring_right','cloak'];
export const ITEM_SLOTS=['weapon','offhand','helm','chest','hands','feet','charm','ring','cloak'];
export const SLOT_NAMES={weapon:'武器',offhand:'副手',helm:'頭盔',chest:'胸甲',hands:'護手',feet:'靴子',charm:'護符',ring:'戒指',ring_left:'左戒指',ring_right:'右戒指',cloak:'披風'};
export const SLOT_ICONS={weapon:EQUIPMENT_ICONS.sword,offhand:EQUIPMENT_ICONS.shield,helm:EQUIPMENT_ICONS.helm,chest:EQUIPMENT_ICONS.chest,hands:EQUIPMENT_ICONS.hands,feet:EQUIPMENT_ICONS.feet,charm:EQUIPMENT_ICONS.charm,ring:EQUIPMENT_ICONS.ring,ring_left:EQUIPMENT_ICONS.ring,ring_right:EQUIPMENT_ICONS.ring,cloak:EQUIPMENT_ICONS.cloak};
const BASE_WEAPON_WHITE_POWER=8;
export const WEAPON_TYPES={
 dagger:{name:'匕首',slot:'weapon',hands:1,kind:'melee',interval:.34,range:95,damageMult:.92,powerMult:.9,...MELEE_PROFILES.dagger},
 axe:{name:'單手斧',slot:'weapon',hands:1,kind:'melee',interval:.5,range:120,damageMult:1.08,powerMult:1.1,...MELEE_PROFILES.axe},
 greataxe:{name:'雙手斧',slot:'weapon',hands:2,kind:'melee',interval:.55,range:150,damageMult:1.1,powerMult:1.75,...MELEE_PROFILES.greataxe},
 sword:{name:'刀劍',slot:'weapon',hands:1,kind:'melee',interval:.44,range:115,damageMult:1,powerMult:1,...MELEE_PROFILES.sword},
 wand:{name:'短杖',slot:'weapon',hands:1,kind:'spell',interval:.52,range:620,speed:480,damageMult:1,powerMult:1},
 greatsword:{name:'雙手劍',slot:'weapon',hands:2,kind:'melee',interval:.45,range:145,damageMult:1,powerMult:1.65,...MELEE_PROFILES.greatsword},
 staff:{name:'長法杖',slot:'weapon',hands:2,kind:'spell',interval:.5,range:680,speed:450,damageMult:1,powerMult:1.8},
 bow:{name:'弓',slot:'weapon',hands:1,kind:'ranged',interval:.49,range:700,speed:600,damageMult:1.1,powerMult:1.18},
 ...SHIELDS,
 quiver:{name:'箭袋',slot:'offhand',hands:1,kind:'quiver',haste:.12},
 tome:{name:'法書',slot:'offhand',hands:1,kind:'tome',castSpeed:.12,mana:20}
};
export function weaponDefinition(item,cls='warrior'){const type=item?.weaponType??UNIQUES[item?.uniqueID]?.weaponType??(STARTING_WEAPONS[cls]?.type??'sword');return WEAPON_TYPES[type]??WEAPON_TYPES.sword;}
const SET_SLOTS=['weapon','offhand','helm','chest','hands','feet','charm','ring','cloak'];
export function setEquipmentTypes(id,slot){
 const bases=SET_EQUIPMENT_BASES[id];
 return (slot==='weapon'?bases?.[0]:slot==='offhand'?bases?.[1]:null)??[];
}
function setDropSlots(id){
 return SET_SLOTS.filter(slot=>!['weapon','offhand'].includes(slot)||setEquipmentTypes(id,slot).length);
}
export const SETS=Object.fromEntries([
 ['wrath','血誓',4,['物理傷害 +12%','攻速 +8%','裂地旋渦：旋風斬每秒拉近至多6敵，施加4秒物理易傷10%；Boss免拉。']],
 ['iron','不朽',4,['生命 +12%','持盾格擋率 +5%','蓄勢反擊：格擋儲存阻止傷害40%，4秒內下次直接命中附加物理傷害；冷卻4秒。']],
 ['wind','逐風',4,['攻速 +8%','移速 +8%','返航箭：傷害類弓箭到達射程後返航一次，造成50%傷害。']],
 ['hunt','獵魂',4,['爆擊率 +5%','命中回魔 +1','爆擊升格：直接命中爆擊後20%機率倍率+1，最高4倍。']],
 ['flame','霜晶',4,['冰傷 +15%','魔力再生 +15%','寒霜彈坑：霜晶爆球留下3秒冰冷領域，每秒15%未爆擊傷害；至多2片，同敵取最強。']],
 ['frost','永霜',4,['冰傷 +15%','冰抗 +15%','碎冰回響：直接擊殺冰凍敵人對160範圍至多5敵造成30%冰傷；冷卻0.5秒。']],
 ['soul','群魂',4,['召喚傷害 +15%','召喚生命 +20%','地裂守衛：土傀儡每第3擊改為160×60震波，至多4敵各120%傷害。']],
 ['codex','星典傳承',5,['最大魔力 +12%','施法速度 +8%','萬法通識：所有已學技能、裝備技能及已學被動有效等級+3，硬點連攜不變。']],
 ['covenant','無聲聖約',5,['光環範圍 +15%','光環耗魔降低8%','聖約常駐：選已學光環，免配置及持續耗魔，以60%強度自動常駐；同源取強。']],
 ['court','萬靈王庭',5,['召喚傷害 +15%','召喚容量 +1','荒原泰坦：授予1隻永久泰坦，占3容量、基礎90MP；每第3擊震擊至多5敵。']],
 ['evolution','元素造物',5,['召喚攻速 +10%','召喚生命 +15%','元素進化：選擇已擁有哥雷姆、霧冰精靈、霧雷雲、雷神或冰神進化；冰霧濺射、雷鏈或每第三擊冰冷範圍，不增數量。']],
 ['fate','命運斷章',5,['爆擊率 +6%','攻速、施法速度 +6%','三重爆擊：直接傷害爆擊後20%機率固定6倍，不多次命中、不影響召喚及持續傷。']],
 ['drift','游離軌跡',4,['移速 +8%','冷卻縮減 +6%','位移或閃避在起點留下2秒雷印，每0.5秒以30%攻擊基準打擊至多5敵，冷卻2秒。']],
 ['rotcycle','蝕刻契約',4,['火、毒傷害各 +10%','持續時間 +10%','擊殺帶有效持續傷害或詛咒敵人，傳播最強一份至160範圍最多3敵，最多4秒且不再傳播。']],
 ['huntmark','獵印協定',4,['攻速、施法速度各 +6%','最大魔力 +10%','每3次直接命中留下2秒獵印，下次不同投射物或召喚命中以最大魔力20%雷傷引爆，冷卻1秒。']],
 ['manavessel','奧能容器',5,['最大魔力 +15%','魔力再生 +20%','受傷25%以魔力承擔，最多儲存最大魔力50%；下次付費傷害技能釋放1.5倍能量脈衝，冷卻2秒。']],
 ['convergence','群星共振',5,['召喚傷害 +12%','召喚生命 +15%','至少3種來源存活每6秒發射至多4枚45%召喚攻擊基準共鳴彈，治療全隊5%生命。']],
 ['singularity','守命主宰',5,['召喚生命 +20%','召喚傷害 +15%','編隊及存活皆僅1單位時生命×2.5、攻擊×2，替玩家承擔25%最終傷害，失去條件即失效。']],
 ['rifts','斷界行者',5,['物理傷害 +15%','移速 +8%','迴旋殘像：旋風斬持續1秒後每2秒留下2秒殘像，以30%傷害打擊至多5敵；至多1個。']]
].map(([id,name,rarity,effects])=>[id,{name,rarity,color:rarity===5?'#f0a04f':'#ee7975',effects,thresholds:[2,3,5],slots:setDropSlots(id)}]));
for(const set of ARCHETYPE_SETS)SETS[set.id]={...set,color:set.rarity===5?'#f0a04f':'#ee7975',thresholds:[2,3,5],slots:setDropSlots(set.id)};
export function equipmentDiscoveryKey(item){
 if(item?.uniqueID&&Object.hasOwn(UNIQUES,item.uniqueID))return 'u:'+item.uniqueID;
 if(!Object.hasOwn(SETS,item?.set)||!SET_SLOTS.includes(item.slot))return null;
 const piece=item.slot==='ring'?item.setPiece??'ring:a':item.slot;
 return item.slot==='ring'&&!['ring:a','ring:b'].includes(piece)?null:`s:${item.set}:${piece}`;
}
function validGearCollection(entries){
 if(entries===undefined)return true;
 const max=Object.keys(UNIQUES).length+Object.keys(SETS).length*(SET_SLOTS.length+1);
 if(!Array.isArray(entries)||entries.length>max||new Set(entries).size!==entries.length)return false;
 return entries.every(key=>{
  if(typeof key!=='string'||key.length>90)return false;
  const [kind,id,slot,ring]=key.split(':');
  if(kind==='u')return equipmentDiscoveryKey({uniqueID:id})===key;
  return kind==='s'&&equipmentDiscoveryKey({set:id,slot,setPiece:ring?'ring:'+ring:undefined})===key;
 });
}
export function recordEquipmentDiscovery(profile,item){
 const key=equipmentDiscoveryKey(item);
 if(!key||profile.gearCollection?.includes(key))return false;
 (profile.gearCollection??=[]).push(key);
 return true;
}
export function collectOwnedEquipment(profile){
 const found=new Set(profile.gearCollection);
 const discover=item=>{const key=equipmentDiscoveryKey(item);if(key)found.add(key);};
 profile.stash.forEach(discover);
 for(const hero of Object.values(profile.characters)){
  hero.bag.forEach(discover);
  hero.pendingLoot?.forEach(discover);
  Object.values(hero.equipment).forEach(discover);
 }
 if(found.size>(profile.gearCollection?.length??0))profile.gearCollection=[...found];
 return profile;
}
export const RARITIES=[{name:'白色・普通',color:'#deded6',mult:1},{name:'藍色・魔法',color:'#70aeef',mult:1.25},{name:'黃色・稀有',color:'#e1c766',mult:1.6},{name:'紫色・史詩',color:'#bd8ae2',mult:2.05},{name:'紅色・傳說',color:'#ee7975',mult:2.65},{name:'橘色・神話',color:'#f0a04f',mult:2.65}];
export function setBonuses(c){const counts={},seen=new Set(),dual=dualState(c).dual;for(const [slot,i] of Object.entries(c.equipment??{})){if(!Object.hasOwn(SETS,i.set))continue;const piece=dual&&i.slot==='weapon'?slot:i.setPiece??(i.slot==='ring'?'ring:a':i.slot),key=i.set+':'+piece;if(seen.has(key))continue;seen.add(key);counts[i.set]=(counts[i.set]??0)+(twoHanded(i)&&!dual?2:1);}return {counts,active:Object.keys(counts).filter(id=>counts[id]>=5)};}

export function setOptionChoices(c,key){if(key==='covenant')return TREES[c.cls].flat().filter(n=>n.ability&&c.talents?.[n.id]>0&&skillCategory(n)==='aura').map(n=>({id:n.ability,name:n.name}));if(key==='evolution')return availableSkills(c).filter(id=>['m_golem','m_frostgolem','m_spirit','m_thorn','m_avatar','m_icegod'].includes(id)).map(id=>({id,name:ABILITIES[id].name}));return [];}
export function configureSetOption(c,key,value){if(!['covenant','evolution'].includes(key)||value!==null&&!setOptionChoices(c,key).some(a=>a.id===value))return {ok:false,reason:'請選擇已擁有的合法技能。'};c.setOptions??={covenant:null,evolution:null};c.setOptions[key]=value;return {ok:true};}
export const DIFFICULTIES={
 1:{name:DIFFICULTY_NAMES[1],hp:1,damage:1,loot:{normal:.025,elite:.25,boss:.25},quality:[.58,.3,.1,.018,.002,0]},
 2:{name:DIFFICULTY_NAMES[2],hp:2.0,damage:1.65,loot:{normal:.03,elite:.3,boss:.3},quality:[.46,.35,.155,.032,.0026,.0004]},
 3:{name:DIFFICULTY_NAMES[3],hp:3.9,damage:2.65,loot:{normal:.035,elite:.35,boss:.35},quality:[.35,.37,.225,.05,.0042,.0008]}
};
// Timed shrine effects are applied once by the engine, never baked into model stats.
export const SHRINES={
 restoration:{name:'復甦神殿',icon:'heart',color:'#87c59d',description:'立即恢復全部生命與魔力。',instant:'restore'},
 flasks:{name:'煉金神殿',icon:'flask',color:'#ddbd79',description:'立即補滿所有藥水充能。',instant:'flasks'},
 experience:{name:'智慧神殿',icon:'eye',color:'#b3a1e0',description:'180 秒內經驗值獲取 +30%。',duration:180000,buff:{experienceGain:.3}},
 power:{name:'力量神殿',icon:'sword',color:'#ef9a77',description:'180 秒內造成的傷害 +20%。',duration:180000,buff:{damageBonus:.2}},
 guard:{name:'壁壘神殿',icon:'shield',color:'#d5c08b',description:'180 秒內護甲 +25%、承受傷害降低 10%。',duration:180000,buff:{armorPct:.25,reduce:.1}},
 resistance:{name:'抗性神殿',icon:'rune',color:'#8dc4d3',description:'180 秒內所有元素抗性 +20%。',duration:180000,buff:{allResist:.2}},
 fortune:{name:'幸運神殿',icon:'ring',color:'#d9b96e',description:'180 秒內裝備掉落率 +15%、裝備稀有度 +30%。',duration:180000,buff:{drop:.15,rarityFind:.3}}
};
function validShrineBuff(buff){return !!buff&&typeof buff==='object'&&!Array.isArray(buff)&&Object.keys(buff).length===2&&typeof buff.type==='string'&&Object.hasOwn(SHRINES,buff.type)&&!!SHRINES[buff.type].buff&&Number.isSafeInteger(buff.expiresAt)&&buff.expiresAt>0;}
export const ROOMS=Routes.CHAPTER_ROOMS;
export const ROOM_TYPES=Routes.ROOM_TYPES,MINIBOSSES=ALL_MINIBOSSES;
export const createRoute=Routes.createRoute,routeNode=Routes.routeNode,routeChoices=Routes.routeChoices;
let seq=0;
export function newCharacter(cls,name='無名旅人'){if(cls==='wanderer')return newWanderer(name);if(!Object.hasOwn(CLASSES,cls))throw new Error('Invalid class');const id='hero-'+(globalThis.crypto?.randomUUID?.()??Date.now().toString(36)+'-'+(++seq));if(typeof name!=='string')name='無名旅人';let weapon={...generatedBase('weapon',0,1,STARTING_WEAPONS[cls].type),id:'starter-'+id,name:STARTING_WEAPONS[cls].name,affixCount:1,affixRulesVersion:19,affixes:[],naturalSockets:0,sockets:[],...(cls==='mage'?{grantedSkill:'m_golem',starterGrant:true}:{})};if(cls!=='mage')weapon.affixes=rollAffixes(0,1,Math.random,weapon);const hero={id,name,skillRulesVersion:2,expansionVersion:1,talentRulesVersion:2,achievements:Progression.newAchievements(),passives:{},setOptions:{covenant:null,evolution:null},sellRarities:[0,1],autoLootActions:Array(6).fill('keep'),buildVersion:7,equipmentSkillVersion:1,autoSkill:null,autoEnabled:true,skillSlots:[null,null,null],auraSkills:[],summonSkills:cls==='mage'?{m_golem:1}:{},movementSkill:null,summonState:[],difficulty:1,progress:{'1':[],'2':[],'3':[]},flasks:cls==='berserker'?['life','hybrid','speed']:['life','mana','speed'],cls,level:1,xp:0,points:1,talents:{},equipment:{weapon},bag:[],pendingLoot:[],groundLoot:[],gold:0,shards:0,kills:0,clears:0,best:0,expeditionSeconds:0};if(['berserker','assassin'].includes(cls))hero.equipment.offhand={...structuredClone(weapon),id:'starter-off-'+id,name:cls==='assassin'?'旅人副匕':'裂木副斧'};normalizeFlaskGear(hero);CampaignProgress.ensureCampaign(hero);return hero;}
export const MAX_CHARACTERS=12;
const heroID=id=>typeof id==='string'&&/^hero-[a-zA-Z0-9-]{1,100}$/.test(id);
const nameKey=name=>name.normalize('NFKC').toLocaleLowerCase();
function cleanName(name){if(typeof name!=='string')return null;name=name.trim().normalize('NFC');return [...name].length>=1&&[...name].length<=12&&!/[\u0000-\u001f\u007f<>]/.test(name)?name:null;}
export const PROFILE_KEY='emberfall-profile-v4';
export function newSave(){return {version:4,rulesVersion:23,resourceRulesVersion:2,ringRankVersion:1,gearRulesVersion:1,rifts:RiftModel.newRifts(),active:null,characters:{},stash:[],materials:{chisel:0,ascend:0,reforge:0,reroll:0,enhance:0,respec:0},gems:{},marks:{'1':0,'2':0,'3':0},weaponChoices:{'1':0,'2':0,'3':0},rewards:{firstClear:false,firstClears:{'1':false,'2':false,'3':false}}};}
export const RING_START_WEAPONS=['sword','axe','dagger','wand','greatsword','greataxe','staff','bow'];
function makeWandererStarterWeapon(id,weaponType,random=Math.random){
 const weapon={...generatedBase('weapon',0,1,weaponType),id,
  name:'旅人'+WEAPON_TYPES[weaponType].name,affixCount:1,affixRulesVersion:19,affixes:[],naturalSockets:0,sockets:[]};
 weapon.affixes=rollAffixes(0,1,random,weapon);
 return weapon;
}
export function newWanderer(name='無名旅人',weaponType='sword'){
 if(!RING_START_WEAPONS.includes(weaponType))throw new Error('Invalid starting weapon');
 const hero=newCharacter('warrior',name);
 convertToRing(hero);
 hero.equipment.weapon=makeWandererStarterWeapon(hero.equipment.weapon.id,weaponType);
 return hero;
}
export function createCharacter(state,name,cls,weaponType='sword',gender='male'){
 let cleaned=cleanName(name);
 if(typeof name==='string'&&!name.trim()){const used=new Set(Object.values(state.characters).map(c=>nameKey(c.name)));let serial=1;cleaned='無名旅人';while(used.has(nameKey(cleaned)))cleaned='無名旅人'+(++serial);}
 if(!cleaned)return {ok:false,error:'角色名稱須為 1–12 個字，且不能包含控制字元或 < >。'};
 if(!Object.hasOwn(CLASSES,cls)||cls==='wanderer'&&!RING_START_WEAPONS.includes(weaponType))return {ok:false,error:'請選擇有效的起始武器。'};
 if(!validHeroAppearance(gender))return {ok:false,error:'請選擇角色外觀。'};
 if(Object.keys(state.characters).length>=MAX_CHARACTERS)return {ok:false,error:'角色欄位已滿，最多可建立 12 位角色。'};
 if(Object.values(state.characters).some(c=>nameKey(c.name)===nameKey(cleaned)))return {ok:false,error:'此角色名稱已使用，請換一個名字。'};
 const character=cls==='wanderer'?newWanderer(cleaned,weaponType):newCharacter(cls,cleaned);character.gender=gender;state.characters[character.id]=character;state.active=character.id;
 return {ok:true,character};
}
export function selectCharacter(state,id){if(!heroID(id)||!Object.hasOwn(state.characters,id))return false;state.active=id;return true;}
export function deleteCharacter(state,id){
 if(!heroID(id)||!Object.hasOwn(state.characters,id))return {ok:false,error:'找不到這位角色。'};
 if(state.rifts?.activeRun)return {ok:false,error:'請先結算或離開目前的裂隙。'};
 delete state.characters[id];
 if(state.active===id)state.active=Object.keys(state.characters)[0]??null;
 return {ok:true};
}
export function renameCharacter(state,id,name){const cleaned=cleanName(name);if(!heroID(id)||!Object.hasOwn(state.characters,id))return {ok:false,error:'找不到這位角色。'};if(!cleaned)return {ok:false,error:'角色名稱須為 1–12 個字，且不能包含控制字元或 < >。'};if(Object.values(state.characters).some(c=>c.id!==id&&nameKey(c.name)===nameKey(cleaned)))return {ok:false,error:'此角色名稱已使用，請換一個名字。'};state.characters[id].name=cleaned;return {ok:true};}
function validAffix(a){if(!a||!Object.hasOwn(AFFIXES,a.key)||!Number.isFinite(a.value)||a.value<0||a.value>10000)return false;if(AFFIXES[a.key].skillCategory)return !validatingBinaryRing&&a.value===1;if(a.key==='summonCapacity')return Number.isInteger(a.value)&&a.value>=1&&a.value<=2;if(AFFIXES[a.key].aura)return Number.isInteger(a.value)&&a.value>=1&&a.value<=3;if(Object.hasOwn(TRIGGERS,a.key))return a.value>0&&a.value<=1;return true;}
function validUnique(i){
 if(i.uniqueID===undefined)return i.uniqueLevelVersion===undefined;
 if(!Object.hasOwn(UNIQUES,i.uniqueID))return false;
 const u=UNIQUES[i.uniqueID],legacy=legacyUniqueAffixes[i.uniqueID];
 if(i.uniqueLevelVersion===undefined?!legacy:i.uniqueLevelVersion!==1||i.level!==u.itemLevel)return false;
 const lists=i.uniqueLevelVersion===1?[u.affixes]:[u.affixes,legacy];
 return (i.weaponType===undefined||i.weaponType===u.weaponType)&&(!u.armorWeight||i.armorWeight===u.armorWeight)&&
  (!u.implicitAura||i.implicitAura===u.implicitAura)&&i.slot===u.slot&&i.rarity===4&&!i.set&&i.level>=u.minLevel&&i.level<=100&&
  i.requiredLevel===Math.max(u.minLevel,i.level-6)&&i.grantedSkill===undefined&&Array.isArray(i.affixes)&&
  lists.some(keys=>i.affixes.length===keys.length&&keys.every(key=>i.affixes.some(a=>a?.key===key)));
}
function validItem(i){
 if(i?.rewardProtected!==undefined&&typeof i.rewardProtected!=='boolean')return false;
 if(!i||typeof i.id!=='string'||!i.id.length||i.id.length>200||!ITEM_SLOTS.includes(i.slot)||!Number.isInteger(i.level)||i.level<1||i.level>100||!Number.isInteger(i.rarity)||i.rarity<0||i.rarity>5||!['power','hp','armor','crit'].every(k=>Number.isFinite(i[k])&&i[k]>=0&&i[k]<1e7)||i.crit>1||!Number.isInteger(i.upgrade)||i.upgrade<0||i.upgrade>20||['charm','ring'].includes(i.slot)&&i.upgrade!==0||typeof i.name!=='string'||!i.name.length||i.name.length>100||typeof i.locked!=='boolean'||!validUnique(i))return false;
 if(['weapon','offhand'].includes(i.slot)?!Object.hasOwn(WEAPON_TYPES,i.weaponType)||WEAPON_TYPES[i.weaponType].slot!==i.slot:i.weaponType!==undefined)return false;
 if(i.armorWeight!==undefined&&(!Object.hasOwn(ARMOR_SHARES,i.slot)||!Object.hasOwn(ARMOR_WEIGHTS,i.armorWeight)))return false;
 if(i.slot==='cloak'?(i.rarity<3||!['clarity','war','ward','hunt'].includes(i.implicitAura)):i.implicitAura!==undefined)return false;
 if(i.baseTier!==undefined&&(!Number.isInteger(i.baseTier)||i.baseTier<0||i.baseTier>6))return false;
 if(!Number.isInteger(i.requiredLevel)||i.requiredLevel<1||i.requiredLevel>100||i.set&&!Object.hasOwn(SETS,i.set)||i.set&&(SETS[i.set].rarity!==i.rarity||i.setPiece!==(i.slot==='ring'?'ring:a':i.slot)&&i.setPiece!==(i.slot==='ring'?'ring:b':i.slot))||i.rarity===5&&(!i.set||i.level<50))return false;
 if(['charm','ring'].includes(i.slot)&&['power','hp','armor','crit'].some(k=>i[k]!==0))return false;
 if(!Number.isInteger(i.socketCap)||i.socketCap!==socketLimit(i)||!Number.isInteger(i.naturalSockets)||i.naturalSockets<0||i.naturalSockets>i.socketCap||typeof i.socketCrafted!=='boolean'||!Array.isArray(i.sockets)||i.sockets.length!==i.naturalSockets+(i.socketCrafted?1:0)||i.sockets.length>i.socketCap)return false;
 const families=new Set();for(const g of i.sockets){if(g===null)continue;if(!makeGem(g?.key,g?.tier)||!canSocketGem(i,g))return false;const family=GEMS[g.key].family;if(families.has(family))return false;families.add(family);}
 if(!Array.isArray(i.affixes)||!i.affixes.every(validAffix)||new Set(i.affixes.map(a=>a.key)).size!==i.affixes.length)return false;
 if(i.grantedSkill!==undefined&&(!Object.hasOwn(ABILITIES,i.grantedSkill)||i.grantedSkill==='m_titan'||i.slot==='ring'))return false;
 if(i.affixRulesVersion!==19||!Number.isInteger(i.affixCount)||!COUNT_OPTIONS[i.rarity].includes(i.affixCount)||i.affixes.length+(i.grantedSkill?1:0)!==i.affixCount||i.starterGrant&&(!i.id.startsWith('starter-hero-')||i.slot!=='weapon'||i.weaponType!=='wand'||i.level!==1||i.grantedSkill!=='m_golem'))return false;
 if(!i.uniqueID&&!legalAffixes(i,i.affixes))return false;if(i.uniqueID){const sides={prefix:0,suffix:0},families=new Set();let core=0;for(const a of i.affixes){const d=AFFIXES[a.key];if(families.has(d.family))return false;families.add(d.family);sides[d.side]++;if(d.core)core++;}if(core>2||sides.prefix>Math.ceil(i.affixCount/2)||sides.suffix>Math.ceil(i.affixCount/2))return false;}for(const a of i.affixes){if(!Number.isInteger(a.tier)||!legalTiers(a.key,i).includes(a.tier))return false;const r=affixRange(a.key,i.level,i,a.tier);if(!r||a.value<r.min||a.value>r.max)return false;}if(i.affixes.filter(a=>a.tier===1&&!AFFIXES[a.key].core).length<(i.rarity===5?3:i.rarity===4?2:0))return false;
 return true;
}
function validPointLedger(c,rules){
 if(!Number.isInteger(c.points)||c.points<0||!c.talents)return false;
 if(isRingHero(c))return rules===23&&c.points===0;
 return c.points+Object.values(c.talents).reduce((a,b)=>a+b,0)===pointBudget(c)-(rules===19?1:0);
}
function validCharacter(c,k,rules=21){if(!c||c.skillRulesVersion!==undefined&&c.skillRulesVersion!==2||![5,6,7].includes(c.buildVersion)||c.equipmentSkillVersion!==1||typeof c.autoEnabled!=='boolean'||!validPointLedger(c,rules)||!validFlaskGear(c)||c.cls!==k||!Object.hasOwn(CLASSES,k)||!Number.isInteger(c.level)||c.level<1||c.level>100||!Array.isArray(c.bag)||c.bag.length>150||!c.bag.every(validItem)||!Array.isArray(c.pendingLoot)||c.pendingLoot.length>150+(c.equipmentStowIDs??[]).filter(id=>c.pendingLoot.some(item=>item.id===id)).length||!c.pendingLoot.every(validItem)||!Array.isArray(c.groundLoot)||c.groundLoot.length>150||!c.groundLoot.every(validItem)||!c.equipment||typeof c.equipment!=='object'||Array.isArray(c.equipment)||!Object.entries(c.equipment).every(([slot,i])=>SLOTS.includes(slot)&&validItem(i)&&classWeaponAllowed(c,i)&&(slot.startsWith('ring_')?i.slot==='ring':slot==='offhand'&&i.slot==='weapon'?legalDualPair(c,c.equipment.weapon,i):slot===i.slot)))return false;if(c.equipment.offhand?.slot==='weapon'&&!legalDualPair(c,c.equipment.weapon,c.equipment.offhand))return false;if(c.equipment.offhand?.slot==='offhand'&&!supportForClass(c.cls,c.equipment.weapon,c.equipment.offhand))return false;const rings=[c.equipment.ring_left,c.equipment.ring_right].filter(Boolean);if(rings.length===2&&(rings[0].id===rings[1].id||rings[0].uniqueID&&rings[0].uniqueID===rings[1].uniqueID))return false;return validSystems(c,rules)&&(c.expeditionSeconds===undefined||Number.isFinite(c.expeditionSeconds)&&c.expeditionSeconds>=0&&c.expeditionSeconds<=1e12)&&['xp','gold','shards','kills','clears','best'].every(f=>Number.isFinite(c[f])&&c[f]>=0&&c[f]<=1e12);}
function validHero(c,id,rules=21){if(!validBasicAttack(c))return false;if(!validInventoryPages(c?.inventoryPages))return false;if(!validAppearance(c?.appearance)||!validHeroAppearance(c?.gender))return false;if(c?.inventoryOrder!==undefined&&(!Array.isArray(c.inventoryOrder)||c.inventoryOrder.length>512||c.inventoryOrder.some(id=>typeof id!=='string'||!id.length||id.length>200)||new Set(c.inventoryOrder).size!==c.inventoryOrder.length))return false;return heroID(id)&&c?.id===id&&typeof c.name==='string'&&cleanName(c.name)===c.name&&[1,2,3].includes(c.difficulty)&&validCharacter(c,c.cls,rules);}
function validMaterials(materials,rules){
 if(!configObject(materials))return false;
 const required=Object.keys(MATERIALS).filter(key=>key!=='respec'&&(rules>=21||key!=='enhance'));
 // Older profiles and paid checkpoints omit the stone until one is earned.
 const hasStone=Object.hasOwn(materials,'respec');
 return Object.keys(materials).length===required.length+Number(hasStone)&&
  required.every(key=>Object.hasOwn(materials,key)&&safeCount(materials[key]))&&
  (!hasStone||safeCount(materials.respec)&&(rules>=23||materials.respec===0));
}
function validResources(p,rules=21){return validMaterials(p.materials,rules)&&p.gems&&typeof p.gems==='object'&&!Array.isArray(p.gems)&&Object.entries(p.gems).every(([id,n])=>{const [key,tier,...rest]=id.split(':');return !rest.length&&!!makeGem(key,Number(tier))&&String(Number(tier))===tier&&safeCount(n);})&&p.weaponChoices&&typeof p.weaponChoices==='object'&&!Array.isArray(p.weaponChoices)&&Object.keys(p.weaponChoices).length===3&&['1','2','3'].every(d=>[0,1].includes(p.weaponChoices[d]))&&p.marks&&Object.keys(p.marks).length===3&&['1','2','3'].every(d=>safeCount(p.marks[d]))&&p.rewards&&typeof p.rewards.firstClear==='boolean'&&p.rewards.firstClears&&['1','2','3'].every(d=>typeof p.rewards.firstClears[d]==='boolean');}
function validProfile(p,rules=23){if(!validGearCollection(p?.gearCollection)||p?.ringRankVersion!==1&&(!validatingBinaryRing||p?.ringRankVersion!==undefined))return false;const version=p?.resourceRulesVersion;if(validatingResourceLegacy?version!==undefined:validatingUniformRing?version!==1:version!==2)return false;if(p?.flaskStash!==undefined&&(!Array.isArray(p.flaskStash)||p.flaskStash.length+(p.stash?.length??0)>STASH_CAPACITY||!p.flaskStash.every(validFlaskItem)))return false;if(p?.writeRevision!==undefined&&(!Number.isSafeInteger(p.writeRevision)||p.writeRevision<0))return false;if(rules<21&&p?.characters&&[...(p.stash??[]),...Object.values(p.characters).flatMap(c=>[...(c.bag??[]),...(c.pendingLoot??[]),...(c.groundLoot??[]),...Object.values(c.equipment??{})])].some(i=>i?.upgrade>10))return false;if(!RiftModel.validRifts(p,{hero:(c,id)=>validHero(c,id,rules),resources:r=>validResources(r,rules),ability:id=>!!ABILITIES[id]}))return false;if(!p||p.version!==4||p.rulesVersion!==rules||!p.characters||typeof p.characters!=='object'||Array.isArray(p.characters)||!validResources(p,rules)||!Array.isArray(p.stash)||p.stash.length>STASH_CAPACITY||!p.stash.every(validItem))return false;const entries=Object.entries(p.characters);return entries.length<=MAX_CHARACTERS&&entries.every(([id,c])=>validHero(c,id,rules))&&new Set(entries.map(([,c])=>nameKey(c.name))).size===entries.length&&(entries.length?heroID(p.active)&&Object.hasOwn(p.characters,p.active):p.active===null)&&uniqueOwnedItems(p)&&validStashSlots(p,STASH_CAPACITY);}
export function readSave(raw){return importSave(raw)??newSave();}
// Validation uses the authentic graph only during this synchronous import transaction.
// No legacy state or compatibility branch enters combat or frame updates.
function migrateRules19(p){
 const currentPage=TREES.mage[2];let valid=false;
 try{TREES.mage[2]=oldMageSummonPage;valid=validProfile(p,19);}finally{TREES.mage[2]=currentPage;}
 if(!valid)return false;
 for(const c of Object.values(p.characters)){
  c.points+=1;let refunded=0;
  if(c.cls==='mage')for(const n of oldMageSummonPage){refunded+=c.talents[n.id]??0;delete c.talents[n.id];}
  let orphaned;do{orphaned=false;for(const [id,rank] of Object.entries(c.talents)){const node=skillNode(c.cls,id);if(rank>0&&node&&!node.prevs.every(parent=>c.talents[parent]>0)){refunded+=rank;delete c.talents[id];orphaned=true;}}}while(orphaned);
  c.points+=refunded;if(refunded)c.skillRefundNotice={points:refunded,version:20};
  if(c.progress)for(const d of ['1','2','3'])if(c.progress[d].length===5)c.progress[d]=ROOMS.map((_,i)=>i);
  if(c.buildVersion===7)reconcileSkillLoadouts(c);
 }
 p.rulesVersion=20;return true;
}
function migrateRules21(p){
 const currentTrees={...TREES},currentAbilities={...ABILITIES},spent={},previousCapacityValidation=validatingLegacyCapacity;let valid=false;
 try{
  validatingLegacyCapacity=true;
  for(const cls of Object.keys(TREES))TREES[cls]=rules20Trees[cls];for(const id of Object.keys(ABILITIES))delete ABILITIES[id];Object.assign(ABILITIES,rules20Abilities);
  for(const [id,c] of Object.entries(p.characters??{}))spent[id]=Object.values(c.talents??{}).reduce((a,b)=>a+b,0);
  if(p.rulesVersion===19&&!migrateRules19(p))return null;
  valid=validProfile(p,20);
 }finally{validatingLegacyCapacity=previousCapacityValidation;Object.assign(TREES,currentTrees);for(const id of Object.keys(ABILITIES))delete ABILITIES[id];Object.assign(ABILITIES,currentAbilities);}
 if(!valid)return null;
 p.materials.enhance=0;p.rulesVersion=21;
 const mappedSkill=id=>({r_wolf:'r_clone',r_pack:'r_clone',m_frostgolem:'m_spirit'}[id]??id);
 const remapItem=item=>{if(item.grantedSkill)item.grantedSkill=mappedSkill(item.grantedSkill);};
 for(const c of Object.values(p.characters)){
  c.autoLootActions=Array(6).fill('keep');
  for(const item of [...c.bag,...c.pendingLoot,...c.groundLoot,...Object.values(c.equipment)])remapItem(item);
  c.skillSlots=c.skillSlots.map(mappedSkill);c.autoSkill=mappedSkill(c.autoSkill);
  const mappedPlan={};for(const [id,count] of Object.entries(configObject(c.summonSkills)?c.summonSkills:{})){const key=mappedSkill(id);mappedPlan[key]=(mappedPlan[key]??0)+count;}c.summonSkills=mappedPlan;
  c.summonState=(Array.isArray(c.summonState)?c.summonState:[]).map(unit=>({...unit,skill:mappedSkill(unit.skill)}));
  // Several old wolf sources converge on one clone. Keep the most injured
  // living unit first so enforcing the new cap cannot heal the surviving ally.
  const clones=c.summonState.filter(unit=>unit.skill==='r_clone').sort((a,b)=>a.hp-b.hp);let cloneIndex=0;
  c.summonState=c.summonState.map(unit=>unit.skill==='r_clone'?clones[cloneIndex++]:unit);
  c.setOptions=Object.fromEntries(Object.entries(c.setOptions).map(([key,id])=>[key,mappedSkill(id)]));
  if(['mage','ranger'].includes(c.cls)){
   c.points=pointBudget(c);c.talents={};c.buildVersion=7;c.skillSlots=[null,null,null];c.autoSkill=null;c.auraSkills=[];c.movementSkill=null;c.summonSkills={};c.summonState=[];c.setOptions={covenant:null,evolution:null};
   if(spent[c.id])c.skillRefundNotice={points:spent[c.id],version:21};
  }
  // Build5/6 still have four legacy slots; their existing dedicated migration
  // reconciles after conversion. Every current dedicated build reconciles now.
  if(c.buildVersion===7)reconcileSkillLoadouts(c);
 }
 for(const item of p.stash)remapItem(item);
 return importSave(JSON.stringify(p));
}
function migrateSkillRules(p){
 for(const c of Object.values(p.characters??{})){
  if(c.skillRulesVersion===2)continue;if(![5,6,7].includes(c.buildVersion)||c.skillRulesVersion!==undefined||!Object.hasOwn(skillRulesV1Trees,c.cls)||!c.talents||typeof c.talents!=='object'||Array.isArray(c.talents)||!Number.isInteger(c.points)||c.points<0)return false;
  let spent=0;for(const [id,rank]of Object.entries(c.talents)){
   const graph=c.cls==='warrior'&&c.buildVersion===5?[...skillRulesV1Trees.warrior[0],...skillRulesV1Trees.warrior[1],...oldWarriorAuraPage]:skillRulesV1Trees[c.cls].flat(),n=graph.find(n=>n.id===id);if(!n||!Number.isInteger(rank)||rank<0||rank>Math.max(0,Math.min(20,c.level-n.reqLevel+1))||rank>0&&!n.prevs.every(id=>c.talents[id]>0))return false;spent+=rank;
  }
  if(c.points+spent!==oldPointBudget(c))return false;
  if(!Array.isArray(c.skillSlots)||![3,4].includes(c.skillSlots.length)||c.skillSlots.some(id=>id!==null&&!Object.hasOwn(ABILITIES,id)))return false;
  c.skillRulesVersion=2;c.points=skillPointBudget(c);c.talents={};c.skillSlots=[null,null,null];c.autoSkill=null;c.auraSkills=[];c.movementSkill=null;c.summonSkills={};c.summonState=[];c.setOptions={covenant:null,evolution:null};c.buildVersion=7;
  c.skillRefundNotice={points:c.points,version:27};
 }
 return true;
}
function migrateExpansion(p){
 const mappings={r_clone:'a_clone',r_trap:'a_sentry',r_mine:'a_mine',r_snare:'a_blades',r_barbs:'a_mark',r_venom:'r_burst'};
 for(const c of Object.values(p.characters||{})){
  if(c.expansionVersion===1)continue;
  if(!Object.hasOwn(skillRulesV2Trees,c.cls)||!Number.isInteger(c.points)||!c.talents||typeof c.talents!=='object'||Array.isArray(c.talents))return false;
  let spent=0;for(const [id,rank]of Object.entries(c.talents)){const n=skillRulesV2Trees[c.cls].flat().find(n=>n.id===id);if(!n||!Number.isInteger(rank)||rank<0||rank>n.max||rank>c.level-n.reqLevel+1||rank>0&&!n.prevs.every(pre=>c.talents[pre]>0))return false;spent+=rank;}
  if(c.points+spent!==skillPointBudget(c)||!PassiveTree.validLegacyPassives(c))return false;
  c.passives={};c.talentRulesVersion=2;c.expansionVersion=1;
  if(c.cls==='ranger'){c.talents={};c.points=skillPointBudget(c);c.skillRefundNotice={points:c.points,version:29};}
  for(const item of [...(c.bag||[]),...(c.pendingLoot||[]),...(c.groundLoot||[]),...Object.values(c.equipment||{})])if(mappings[item.grantedSkill])item.grantedSkill=mappings[item.grantedSkill];
  c.autoSkill=mappings[c.autoSkill]||c.autoSkill;c.skillSlots=c.skillSlots.map(id=>mappings[id]||id);c.summonSkills={};c.summonState=[];c.setOptions={covenant:null,evolution:null};reconcileSkillLoadouts(c);
 }
 for(const item of p.stash||[])if(mappings[item.grantedSkill])item.grantedSkill=mappings[item.grantedSkill];return true;
}
function migrateGear(p){
 if(p.gearRulesVersion===1)return true;
 if(p.gearRulesVersion!==undefined)return false;
 for(const item of [...(p.stash??[]),...Object.values(p.characters??{}).flatMap(c=>[...(c.bag??[]),...(c.pendingLoot??[]),...(c.groundLoot??[]),...Object.values(c.equipment??{})])]){
  const u=UNIQUES[item?.uniqueID];if(u?.armorWeight&&item.armorWeight===undefined)item.armorWeight=u.armorWeight;
  if(item?.uniqueID==='tide_shield'&&item.weaponType==='shield')item.weaponType='towerShield';
  if(item?.weaponType!=='bow'||item.slot!=='weapon')continue;
  const oldCap=item.level>=35?4:2,newCap=socketLimit(item);if(item.socketCap!==oldCap||oldCap===newCap)continue;
  if(!Array.isArray(item.sockets)||!Number.isInteger(item.naturalSockets)||item.naturalSockets<0||item.naturalSockets>oldCap||item.sockets.length!==item.naturalSockets+(item.socketCrafted?1:0)||item.sockets.length>oldCap)return false;
  for(const affix of item.affixes??[]){let oldRange;try{validatingLegacyCapacity=true;oldRange=affixRange(affix.key,item.level,item,affix.tier);}finally{validatingLegacyCapacity=false;}
   if(!oldRange||affix.value<oldRange.min||affix.value>oldRange.max)return false;
   const tier=legalTiers(affix.key,item).includes(affix.tier)?affix.tier:legalTiers(affix.key,item)[0],range=affixRange(affix.key,item.level,item,tier);if(!range)return false;
   const f=oldRange.max===oldRange.min?1:(affix.value-oldRange.min)/(oldRange.max-oldRange.min),precision=AFFIXES[affix.key].percent?1000:['manaRegen','lifeRegen'].includes(affix.key)?10:1;
   affix.tier=tier;affix.value=Math.max(range.min,Math.min(range.max,Math.round((range.min+f*(range.max-range.min))*precision)/precision));
  }
  item.socketCap=newCap;item.naturalSockets=Math.min(newCap,item.naturalSockets);item.socketCrafted=!!item.socketCrafted&&item.naturalSockets<newCap;
  const keep=item.naturalSockets+(item.socketCrafted?1:0);
  for(const gem of item.sockets.slice(keep))if(gem){if(!makeGem(gem.key,gem.tier)||!p.gems)return false;const key=gem.key+':'+gem.tier;p.gems[key]=(p.gems[key]??0)+1;}
  item.sockets=item.sockets.slice(0,keep);
 }
 p.gearRulesVersion=1;return true;
}
function migrateClassEquipment(c){
 if(!c||c.cls!=='berserker'||!c.equipment||!Array.isArray(c.bag)||!Array.isArray(c.pendingLoot)||!Array.isArray(c.groundLoot))return true;
 const slots=['weapon','offhand'].filter(slot=>c.equipment[slot]&&(!classWeaponAllowed(c,c.equipment[slot])||slot==='offhand'&&!legalDualPair(c,c.equipment.weapon,c.equipment[slot])));
 if(!slots.length)return true;
 const knownBefore=new Set(availableSkills(c));for(const slot of slots){const list=[c.bag,c.pendingLoot,c.groundLoot].find(list=>list.length<150);if(list)list.push(c.equipment[slot]);else{c.equipmentStowIDs=(c.equipmentStowIDs||[]).filter(id=>c.pendingLoot.some(item=>item.id===id));if(c.equipmentStowIDs.length>=2)return false;c.equipmentStowIDs.push(c.equipment[slot].id);c.pendingLoot.push(c.equipment[slot]);}delete c.equipment[slot];}
 const knownAfter=new Set(availableSkills(c)),removed=new Set([...knownBefore].filter(id=>!knownAfter.has(id)));if(removed.size){if(Array.isArray(c.skillSlots))c.skillSlots=c.skillSlots.map(id=>removed.has(id)?null:id);if(Array.isArray(c.auraSkills))c.auraSkills=c.auraSkills.filter(id=>!removed.has(id));if(removed.has(c.autoSkill))c.autoSkill=null;if(removed.has(c.movementSkill))c.movementSkill=null;if(configObject(c.summonSkills))for(const id of removed)delete c.summonSkills[id];if(Array.isArray(c.summonState))c.summonState=c.summonState.filter(unit=>!removed.has(unit.skill));}return true;
}
function validCurrentRing(c,bonus,tree=RING_TREE){if(tree===RING_TREE)tree=validationRing();return RingTree.validRing(tree,c,bonus,LEGACY_RING_TREE,PREVIOUS_RING_TREE,validatingBinaryRing);}
function matchingRingTalents(actual,expected){
 return configObject(actual)&&Object.keys(actual).length===Object.keys(expected).length&&
  Object.entries(expected).every(([id,rank])=>Object.hasOwn(actual,id)&&actual[id]===rank);
}
function migrateRingAllocation(c){
 if(!isRingHero(c)||c.ringRetainedV84!==undefined)return true;
 const bonus=Progression.ringAchievementPoints(c);
 const tree=c.ring?.['s:a_stab']===1?oldShadowStrikeRing():RING_TREE;
 if(validCurrentRing(c,bonus,tree))return true;
 if(c.ringOrigin!==undefined)return false;
 const previous={...c};
 if(!RingTree.validRing(PREVIOUS_RING_TREE,previous,bonus,LEGACY_RING_TREE)){
  if(previous.ringGrandfathered!==undefined||!RingTree.validRing(LEGACY_RING_TREE,previous,bonus))return false;
  previous.ringGrandfathered=Object.keys(previous.ring);
  if(!RingTree.validRing(PREVIOUS_RING_TREE,previous,bonus,LEGACY_RING_TREE))return false;
 }
 if(!matchingRingTalents(c.talents,RingTree.ringDerived(PREVIOUS_RING_TREE,c.ring).talents))return false;

 const oldIds=Object.keys(c.ring),retainedIds=oldIds.filter(id=>!id.startsWith('u:'));
 const refunded=oldIds.length!==retainedIds.length;
 if(refunded&&(!validBasicAttack(c)||c.buildVersion===7&&!validDedicatedLoadouts(c)))return false;
 const projected={...previous,ring:Object.fromEntries(retainedIds.map(id=>[id,1]))};
 if(c.lastRingNode?.startsWith('u:')){
  const learned='s:'+PREVIOUS_RING_TREE.byId[c.lastRingNode].talentId;
  projected.lastRingNode=Object.hasOwn(projected.ring,learned)?learned:undefined;
 }
 if(!validCurrentRing(projected,bonus,tree)){
  projected.ringRetainedV84={ids:oldIds};
  if(previous.ringGrandfathered!==undefined)projected.ringRetainedV84.inherited=previous.ringGrandfathered;
  delete projected.ringGrandfathered;
  if(!validCurrentRing(projected,bonus,tree))return false;
 }

 if(projected.ringGrandfathered!==undefined)c.ringGrandfathered=projected.ringGrandfathered;
 else delete c.ringGrandfathered;
 if(projected.ringRetainedV84)c.ringRetainedV84=projected.ringRetainedV84;
 if(refunded){
  setRing(c,projected.ring,projected.lastRingNode);
  if(c.buildVersion===7)reconcileSkillLoadouts(c);
 }
 return true;
}
function retireRingShadowStrike(c){
 if(!isRingHero(c)||!Object.hasOwn(c.ring??{},'s:a_stab'))return true;
 const bonus=Progression.ringAchievementPoints(c);
 if(!validCurrentRing(c,bonus,oldShadowStrikeRing())||
    !matchingRingTalents(c.talents,ringBenefits(c).talents)||
    c.buildVersion===7&&!validDedicatedLoadouts(c))return false;
 const ring={...c.ring};
 delete ring['s:a_stab'];
 setRing(c,ring,c.lastRingNode==='s:a_stab'?undefined:c.lastRingNode);
 if(c.buildVersion===7)reconcileSkillLoadouts(c);
 return true;
}
function retireLegacyShadowStrike(c){
 if(c.cls!=='assassin')return false;
 c.shadowStrikeRetired=true;
 if(!Object.hasOwn(c.talents,'a_stab'))return false;
 c.points+=c.talents.a_stab;
 delete c.talents.a_stab;
 return true;
}
function replaceShadowStrikeGrant(item){
 if(item.grantedSkill!=='a_stab')return false;
 delete item.grantedSkill;
 item.affixes=completeAffixes(item,item.affixes,RiftModel.seededRng('retire-shadow-strike:'+item.id));
 return true;
}
export function importSave(raw){
 if(validatingBinaryRing)return importProfile(raw);
 let input;try{input=JSON.parse(raw);}catch{return null;}
 const version=input?.resourceRulesVersion,rankVersion=input?.ringRankVersion;
 if(rankVersion!==undefined&&rankVersion!==1||version!==undefined&&version!==1&&version!==2)return null;
 if(version===2&&rankVersion===1){const profile=importProfile(raw);return profile?collectOwnedEquipment(normalizeCampaignCheckpoints(profile)):null;}
 let p;validatingResourceLegacy=version===undefined;validatingUniformRing=version===1;
 validatingBinaryRing=true;
 try{p=importProfile(raw);}finally{validatingResourceLegacy=false;validatingUniformRing=false;validatingBinaryRing=false;}
 if(!p)return null;
 p.resourceRulesVersion=2;
 p.ringRankVersion=1;
 const checkpoint=p.rifts?.activeRun?.checkpoint;
 const needsReconcile=hero=>hero?.buildVersion===7&&(version!==2||isRingHero(hero));
 for(const hero of Object.values(p.characters))if(needsReconcile(hero))reconcileSkillLoadouts(hero);
 if(needsReconcile(checkpoint?.hero)){
  const old=checkpoint.hero.summonState;
  reconcileSkillLoadouts(checkpoint.hero);
  // Reconciliation retains a stable subsequence. Debt indices must follow the
  // retained unit rather than another ally that happened to inherit its slot.
  const retained=new Map();let cursor=0;
  checkpoint.hero.summonState.forEach((unit,index)=>{
   while(cursor<old.length&&(old[cursor].skill!==unit.skill||old[cursor].hp!==unit.hp))cursor++;
   if(cursor<old.length)retained.set(cursor++,index);
  });
  if(checkpoint.combat?.blood)checkpoint.combat.blood.debts=checkpoint.combat.blood.debts.flatMap(debt=>debt.ally===null?[debt]:retained.has(debt.ally)?[{...debt,ally:retained.get(debt.ally)}]:[]);
 }
 return validProfile(p)?collectOwnedEquipment(normalizeCampaignCheckpoints(p)):null;
}
function importProfile(raw){try{
 const p=JSON.parse(raw),paidCheckpoint=p?.rifts?.activeRun?.checkpoint;
 const heroes=[...Object.values(p?.characters??{}),paidCheckpoint?.hero].filter(Boolean);
 for(const hero of heroes)migrateLegacyFlaskBelt(hero);
 if(p?.rulesVersion===23){
  for(const hero of heroes){
   if(!migrateClassEquipment(hero))return null;
   migrateShadowAura(hero);
   if(!migrateRingAllocation(hero)||!retireRingShadowStrike(hero))return null;
  }
 }
 if([19,20].includes(p?.rulesVersion))return migrateRules21(p);if(!p||!migrateGear(p))return null;if(p?.rulesVersion===21){if(!migrateSkillRules(p)||!migrateExpansion(p)||!validProfile(p,21))return null;for(const c of Object.values(p.characters))CampaignProgress.ensureCampaign(c);p.rulesVersion=23;}else if(p?.rulesVersion===23){for(const c of Object.values(p.characters??{})){if(!CampaignProgress.validCampaign(c))return null;CampaignProgress.ensureCampaign(c);}}if(!validProfile(p))return null;for(const c of Object.values(p.characters)){
 if(c.buildVersion===5){if(c.cls==='warrior'){for(const n of oldWarriorAuraPage){c.points+=c.talents[n.id]??0;delete c.talents[n.id];}}c.buildVersion=6;}
 if(c.buildVersion===6){const legacy=c.skillSlots.slice(),known=new Set(availableSkills(c));c.skillSlots=[null,null,null];c.auraSkills=[];c.summonSkills={};c.movementSkill=null;c.summonState=[];
  for(const [index,id] of legacy.entries()){if(!id||!known.has(id))continue;const category=skillCategory(id);if(['damage','curse','warcry'].includes(category)){const slot=index<3?index:c.skillSlots.indexOf(null);if(slot>=0)c.skillSlots[slot]=id;}else if(category==='aura')c.auraSkills.push(id);else if(category==='movement'&&!c.movementSkill)c.movementSkill=id;else if(category==='summon')c.summonSkills[id]=abilityFor(c,id).summon.count;}
  c.buildVersion=7;reconcileSkillLoadouts(c);
 }
 }
 // Retired equipment protections must not leave existing gear unusable without an unlock control.
 for(const c of heroes){
  let reconcile=retireLegacyShadowStrike(c);
  for(const item of [...c.bag,...c.pendingLoot,...c.groundLoot,...Object.values(c.equipment)]){
   if(replaceShadowStrikeGrant(item))reconcile=true;
   if(item.locked)item.locked=false;
   delete item.rewardProtected;
  }
  if((reconcile||c.autoSkill!==null)&&c.buildVersion===7)reconcileSkillLoadouts(c);
 }
 for(const item of p.stash){replaceShadowStrikeGrant(item);if(item.locked)item.locked=false;delete item.rewardProtected;}
 if(!validProfile(p))return null;
 migrateFlaskCheckpoint(paidCheckpoint);
 return p;}catch{return null;}}
export function loadProfile(storage){return readSave(storage.getItem(PROFILE_KEY));}
export function saveProfile(storage,state,{replace=false}={}){if(!validProfile(state))throw new Error('存檔格式無效。');const raw=storage.getItem?.(PROFILE_KEY),old=raw?JSON.parse(raw):null,oldRevision=old?.writeRevision||0;if(!replace&&old){if((state.writeRevision||0)!==oldRevision)throw new Error('另一個視窗已有較新的進度。');const run=old.rifts?.activeRun;if(run&&run.id!==state.rifts?.activeRun?.id&&!(state.rifts?.recent?.includes(run.id)&&state.rifts?.lastResult?.runId===run.id))throw new Error('另一個視窗有未結算遠征。');if(state.rifts?.activeRun&&old.rifts?.recent?.includes(state.rifts.activeRun.id))throw new Error('此遠征已結算。');}const revision=oldRevision+1;storage.setItem(PROFILE_KEY,JSON.stringify({...state,writeRevision:revision}));state.writeRevision=revision;}

export function xpNeed(c){return Math.round(70+c.level*45+18*Math.pow(Math.max(0,c.level-40),1.7));}
export function addXP(c,n){c.xp+=n;let gained=0;while(c.xp>=xpNeed(c)&&c.level<100){c.xp-=xpNeed(c);const before=pointBudget(c);c.level++;if(!isRingHero(c))c.points+=pointBudget(c)-before;gained++;}return gained;}
export function learn(c,id){if(!learningState(c,id).ok)return false;const n=skillNode(c.cls,id);c.talents[id]=(c.talents[id]||0)+1;c.points--;if(n.ability&&['damage','curse','warcry'].includes(skillCategory(n))){const slots=skillLoadout(c);if(!slots.includes(n.ability)&&autoSkill(c)!==n.ability){const empty=slots.indexOf(null);if(empty>=0)slots[empty]=n.ability;}c.skillSlots=slots;}reconcileSkillLoadouts(c);return true;}
export function refund(c){if(isRingHero(c))return false;const off=c.equipment.offhand;if(off?.slot==='weapon'&&!legalDualPair(c,c.equipment.weapon,off)){if(c.bag.length<150)c.bag.push(off);else if(c.pendingLoot.length<150)c.pendingLoot.push(off);else return false;delete c.equipment.offhand;}c.points=pointBudget(c);c.talents={};reconcileSkillLoadouts(c);return true;}
function equipmentAuraEffect(c){return Math.max(0,Math.min(1,Object.values(c.equipment??{}).reduce((n,i)=>n+itemAffixes(i).filter(a=>a.key==='auraEffect').reduce((n,a)=>n+a.value,0),0)));}
function applyTypedAffix(v,a){const key=a.key,type=key.replace(/(Damage|Resist|Pen|Skills)$/,''),category=AFFIXES[key]?.skillCategory;if(category){v.skillCategoryLevels[category]=(v.skillCategoryLevels[category]??0)+a.value;return true;}if(key==='soulBond'){v.summonReduce+=.08*a.value;return true;}if(key==='dotDamage'){v.dotDamage=(v.dotDamage??0)+a.value;return true;}const shared=/^flat(Fire|Cold|Lightning|Poison)$/.exec(key);if(shared){const element=shared[1].toLowerCase();v.flatAttackDamage[element]+=a.value;v.flatSpellDamage[element]+=a.value;return true;}if(key==='allResist'){for(const t of Object.keys(v.resistances))v.resistances[t]+=a.value;return true;}if(key.endsWith('Damage')&&Object.hasOwn(v.damageIncreases,type)){v.damageIncreases[type]+=a.value;return true;}if(key.endsWith('Resist')&&Object.hasOwn(v.resistances,type)){v.resistances[type]+=a.value;return true;}if(key.endsWith('Pen')&&Object.hasOwn(v.penetrations,type)){v.penetrations[type]+=a.value;return true;}if(key!=='allSkills'&&key.endsWith('Skills')&&Object.hasOwn(v.elementalSkills,type)){v.elementalSkills[type]+=a.value;return true;}const m=/^flat(Attack|Spell)(Physical|Fire|Cold|Lightning|Poison)$/.exec(key);if(m){v[m[1]==='Attack'?'flatAttackDamage':'flatSpellDamage'][m[2].toLowerCase()]+=a.value;return true;}return false;}
export function stats(c){const stance=dualState(c),lifeGrowth=c.cls==='mage'?18:22,baseLife=CLASSES[c.cls].hp+(c.level-1)*lifeGrowth;let gearAtkPct=0,mainWhite=0,offWhite=0,sharedWhite=0;let b=CLASSES[c.cls],v={resourceClass:c.cls,resourceLifeScale:stance.lifeScale,manaShield:0,dotDamage:0,lifeCostReduction:0,lowLifeDamage:0,trapDamage:0,trapSetup:0,movementRecovery:0,projectileDamage:0,bleedDamage:0,poisonDotDamage:0,poisonStacks:0,poisonStackLimit:5,hp:baseLife,atk:b.atk+(c.level-1)*3,armor:b.armor,resourceLevel:validatingResourceLegacy?1:c.level,mana:baseMana(c.cls,c.level,validatingResourceLegacy),manaRegen:baseManaRegen(c.cls,validatingResourceLegacy),manaRegenPct:0,flatManaCost:0,manaLeech:0,manaOnHit:0,manaOnKill:0,lifeRegen:0,lifeRegenPct:0,allSkills:0,experienceGain:0,damageBonus:0,auraDamage:0,auraArea:0,auraManaCost:0,skillAuraEffect:0,drop:0,rarityFind:0,resist:0,manaCost:0,chargeGain:0,crit:.05,critDmg:2,skillArea:0,extraProjectiles:0,skillDuration:0,castSpeed:1,evasion:c.cls==='assassin'?.08:c.cls==='ranger'?.03:0,block:0,blockReduction:WEAPON_TYPES.shield.blockReduction,haste:c.cls==='assassin'?1.1:1,speed:c.cls==='assassin'?225:210,cdr:0,skillMult:1,leech:0,killHeal:0,reduce:0,pierce:0,freeze:0,burn:0,thorns:0,extraArrows:0,summonCapacity:4+(validatingLegacyCapacity?0:summonLevelCapacity(c)),summonDamage:1,summonLife:1,summonHaste:1,summonSpeed:1,summonArea:0,summonManaCost:0,summonSkillLevels:0,roomLootMultiplier:1,roomRarityBonus:0,damageIncreases:{physical:0,fire:0,cold:0,lightning:0,poison:0},resistances:{fire:0,cold:0,lightning:0,poison:0},penetrations:{fire:0,cold:0,lightning:0,poison:0},flatAttackDamage:{physical:0,fire:0,cold:0,lightning:0,poison:0},flatSpellDamage:{physical:0,fire:0,cold:0,lightning:0,poison:0},elementalSkills:{fire:0,cold:0,lightning:0,poison:0},skillCategoryLevels:{},attackDamage:0,spellDamage:0,physicalReduce:0,auraEffect:0,summonDuration:0,summonReduce:0,bossMana:0,sets:{},whirl:1,meteor:1,snipe:1};for(const i of Object.values(c.equipment)){let u=1+(i.upgrade||0)*.12,white=equipmentWhiteValues(i);const wp=white.power*u*(i.slot==='weapon'?stance.whiteScale:1);if(i===c.equipment.offhand&&i.slot==='weapon')offWhite+=wp;else{v.atk+=wp;if(i.slot==='weapon')mainWhite+=wp;else sharedWhite+=wp;}v.hp+=white.hp*u;v.armor+=white.armor*u;v.crit+=white.crit;if(i.slot==='offhand'&&isShield(i)){v.block+=WEAPON_TYPES[i.weaponType].block;v.blockReduction=WEAPON_TYPES[i.weaponType].blockReduction;}else if(i.slot==='offhand'&&i.weaponType==='tome'){v.mana+=20*equipmentBase(i.level).mult;v.castSpeed+=.12;}for(const a of effectiveEquippedAffixes(c,i)){if(applyTypedAffix(v,a))continue;if(a.key==='critDmg')continue;if(a.key==='critMultiplier'){if(UNIQUES[i.uniqueID]?.affixes.includes('critMultiplier')&&a.value===3)v.critDmg=3;continue;}if(a.key==='atkPct')gearAtkPct+=a.value;else if(a.key==='hpPct')v.hp+=baseLife*a.value;else if(a.key==='speedPct')v.speed+=210*a.value;else if(a.key==='skillDmg')v.skillMult+=a.value;else if(a.key==='allSkills')v.allSkills+=validatingLegacyCapacity?a.value:Math.min(1,a.value);else if(Object.hasOwn(v,a.key)&&typeof v[a.key]==='number')v[a.key]+=a.value;}}
 if(c.equipment.weapon?.weaponType==='bow'&&c.equipment.offhand?.weaponType==='quiver')v.haste+=WEAPON_TYPES.quiver.haste;
 if(c.talents.a_evasion)v.evasion+=.18;v.evasion=Math.max(0,Math.min(.8,v.evasion));
 v.atk*=1+gearAtkPct;
 for(const aura of equipmentAuras(c))for(const [key,value] of Object.entries(aura.buff)){if(key==='atkPct')v.atk*=1+value;else if(key==='speedPct')v.speed*=1+value;else if(Object.hasOwn(v,key)&&typeof v[key]==='number')v[key]+=value;}
 const bonuses=setBonuses(c);v.sets=bonuses.counts;v.setEffects=Object.fromEntries(Object.keys(SETS).map(id=>[id,bonuses.active.includes(id)]));if(v.setEffects.codex)v.allSkills+=3;

 if(validatingLegacyCapacity){const mods={};for(const node of TREES[c.cls].flat()){const rank=c.talents[node.id]||0;if(node.summonSkillThreshold){const t=node.summonSkillThreshold;v.summonSkillLevels+=Math.min(t.max,Math.floor(hardSkillRank(c,node.id)/t.every));}if(node.summonCapacityThreshold){const threshold=node.summonCapacityThreshold;v.summonCapacity+=Math.min(threshold.max,Math.floor(Math.max(0,Math.min(20,rank))/threshold.every)*threshold.amount);}if(!node.mods||!rank)continue;for(const [key,value] of Object.entries(node.mods))mods[key]=(mods[key]||0)+value*(rank+(v.setEffects.codex?3:0));}for(const [key,value] of Object.entries(mods)){if(applyTypedAffix(v,{key,value}))continue;if(key==='critDmg'||key==='critMultiplier')continue;if(key==='atkPct')v.atk*=1+value;else if(key==='hpPct')v.hp*=1+value;else if(key==='speedPct')v.speed*=1+value;else if(key==='skillDmg')v.skillMult+=value;else if(Object.hasOwn(v,key)&&typeof v[key]==='number')v[key]+=value;}}

 for(const [key,value] of Object.entries(isRingHero(c)?ringBenefits(c).mods:PassiveTree.passiveModifiers(c))){if(applyTypedAffix(v,{key,value}))continue;if(key==='atkPct')v.atk*=1+value;else if(key==='hpPct')v.hp*=1+value;else if(key==='speedPct')v.speed*=1+value;else if(key==='skillDmg')v.skillMult+=value;else v[key]=(v[key]||0)+value;}
 for(const [id,n] of Object.entries(v.sets)){if(n<2)continue;if(id==='wrath')v.damageIncreases.physical+=.12;if(id==='iron')v.hp*=1.12;if(id==='wind')v.haste+=.08;if(id==='hunt')v.crit+=.05;if(id==='flame')v.damageIncreases.cold+=.15;if(id==='frost')v.damageIncreases.cold+=.15;if(['soul','court'].includes(id))v.summonDamage+=.15;if(id==='codex')v.mana*=1.12;if(id==='covenant')v.auraArea+=.15;if(id==='evolution')v.summonHaste+=.1;if(id==='fate')v.crit+=.06;if(id==='rifts')v.damageIncreases.physical+=.15;if(id==='drift')v.speed+=210*.08;if(id==='rotcycle'){v.damageIncreases.fire+=.1;v.damageIncreases.poison+=.1;}if(id==='huntmark'){v.haste+=.06;v.castSpeed+=.06;}if(id==='manavessel')v.mana*=1.15;if(id==='convergence')v.summonDamage+=.12;if(id==='singularity')v.summonLife+=.2;if(n>=3){if(id==='wrath')v.haste+=.08;if(id==='iron'&&isShield(c.equipment.offhand))v.block+=.05;if(['wind','rifts'].includes(id))v.speed+=210*.08;if(id==='hunt')v.manaOnHit+=1;if(id==='flame')v.manaRegenPct+=.15;if(id==='frost')v.resistances.cold+=.15;if(id==='soul')v.summonLife+=.2;if(id==='codex')v.castSpeed+=.08;if(id==='covenant')v.auraManaCost+=.08;if(id==='court')v.summonCapacity+=1;if(id==='evolution')v.summonLife+=.15;if(id==='fate'){v.haste+=.06;v.castSpeed+=.06;}if(id==='drift')v.cdr+=.06;if(id==='rotcycle')v.skillDuration+=.1;if(id==='huntmark')v.mana*=1.1;if(id==='manavessel')v.manaRegenPct+=.2;if(id==='convergence')v.summonLife+=.15;if(id==='singularity')v.summonDamage+=.15;}}

 for(const set of ARCHETYPE_SETS)for(let n=0;n<2;n++)if((v.sets[set.id]??0)>=[2,3][n])for(const [key,value] of Object.entries(set.bonuses[n])){if(applyTypedAffix(v,{key,value}))continue;if(key==='armorPct')v.armor*=1+value;else if(key==='manaPct')v.mana*=1+value;else if(key==='hpPct')v.hp*=1+value;else if(key==='speedPct')v.speed+=210*value;else if(key==='shieldBlock'){if(isShield(c.equipment.offhand))v.block+=value;}else v[key]=(v[key]??0)+value;}
 if(isShield(c.equipment.offhand)){v.block+=v.shieldBlock||0;v.blockReduction+=v.shieldBlockReduction||0;}v.lifeRegen+=(v.lifeRegenPct||0)*v.hp;v.lifeCostReduction=Math.min(.4,v.lifeCostReduction||0);v.summonSupport=summonSupportStats(c);v.rangerSupport=rangerSupportStats(c);v.poisonStackLimit=Math.min(12,5+(c.talents.r_spread?3:0)+(v.poisonStacks||0));v.summonArea=Math.max(0,Math.min(1.5,v.summonArea));v.summonManaCost=Math.max(0,Math.min(.4,v.summonManaCost));
 if(isRingHero(c)){
  if(ringHas(c,'x:summonarmy')){v.summonCapacity+=4;v.summonManaCost=(v.summonManaCost??0)+.35;}
  if(ringHas(c,'x:manashield'))v.manaShield=Math.max(v.manaShield,.3);
  if(ringHas(c,'x:bloodzero'))v.resourceClass='blood';
  v.bloodSpell=ringHas(c,'x:bloodspell');
  v.bloodAura=ringHas(c,'x:bloodaura');
  v.spellDual=stance.spellDual;
  v.spellDualDamageScale=stance.damageScale;
 }
 v.summonCapacity=Math.max(0,Math.min(ringHas(c,'x:summonarmy')?22:18,Math.floor(v.summonCapacity)));v.auraManaCost=Math.max(0,Math.min(.35,v.auraManaCost));v.skillAuraEffect=Math.max(0,Math.min(1,v.skillAuraEffect));v.auraDamage=Math.max(0,Math.min(2,v.auraDamage));v.auraArea=Math.max(0,Math.min(1,v.auraArea));v.physicalReduce=Math.max(0,Math.min(.2,v.physicalReduce));v.summonReduce=Math.max(0,Math.min(.75,v.summonReduce));v.auraEffect=Math.max(0,Math.min(1,v.auraEffect));v.skillArea=Math.max(0,Math.min(1.5,v.skillArea));v.skillDuration=Math.max(0,Math.min(2,v.skillDuration));v.extraProjectiles=Math.max(0,Math.min(6,Math.floor(v.extraProjectiles)));v.castSpeed=Math.max(.1,Math.min(4,v.castSpeed));v.blockCap=SHIELDS[c.equipment.offhand?.weaponType]?.blockCap??.5;v.block=Math.max(0,Math.min(v.blockCap,v.block));v.blockReduction=Math.max(.25,Math.min(.85,v.blockReduction));v.allSkills=Math.max(0,Math.min(validatingLegacyCapacity?20:3,Math.floor(v.allSkills)));v.hp=Math.round(v.hp);v.atk=Math.ceil(v.atk);v.crit=Math.min(.8,v.crit);v.cdr=Math.min(.65,v.cdr);v.resist=Math.min(.6,v.resist);v.reduce=Math.min(.6,v.reduce);v.manaCost=Math.min(.6,v.manaCost);v.manaLeech=Math.min(.12,v.manaLeech);v.manaRegenPct=Math.min(2,v.manaRegenPct);v.manaRegen*=1+v.manaRegenPct;v.mana=Math.round(v.mana);const implicit=implicitModifiers(c);v.speed*=1+implicit.move;v.haste*=1+implicit.attack;v.castSpeed*=1+implicit.cast;v.dodgeCDMultiplier=Math.max(.5,1+implicit.dodge);const shared=b.atk+(c.level-1)*3+sharedWhite;v.offhandAtk=stance.dual?Math.ceil(v.atk*(shared+offWhite)/Math.max(1,shared+mainWhite)):0;v.summonAttackBase=stance.dual?(v.atk+v.offhandAtk)/2:v.atk;v.haste*=1+stance.hasteBonus;v.castSpeed=Math.min(4,v.castSpeed*(1+stance.castBonus));v.speed*=stance.moveScale;v.weaponDamageScale=stance.damageScale*(1+stance.weaponDamageBonus+(v.dualDamage||0));if(c.equipment.offhand?.uniqueID==='storm_quiver'&&c.equipment.weapon?.weaponType==='bow')v.pierce+=1;if(Object.values(c.equipment).some(i=>i.uniqueID==='silkstep')){v.dodgeCDMultiplier*=.85;v.blockCap=.35;v.block=Math.min(.35,v.block);}v.weaponStance=stance.mode;
 // A level-based reference covers most of a weak weapon's shortfall through Normal gear levels.
 const referencePower=Math.round(BASE_WEAPON_WHITE_POWER*WEAPON_TYPES.staff.powerMult*Campaign.whiteLevelMultiplier(Math.min(c.level,Campaign.equipmentDropCap(1))));
 const weaponPower=stance.dual?(mainWhite+offWhite)/2:mainWhite;
 v.summonAttackBase+=Math.max(0,referencePower-weaponPower)*.8;
 if(v.resourceClass==='blood'){
 v.ringMirrorMana=v.mana;
 v.ringMirrorRegen=v.manaRegen;
 }
 if(v.resourceClass==='berserker'||v.resourceClass==='blood'){v.mana=0;v.manaRegen=0;}return v;
}
export const ITEM_BASES=[
 {id:0,name:'粗製',minLevel:1,mult:1},{id:1,name:'制式',minLevel:10,mult:1.45},{id:2,name:'精鋼',minLevel:20,mult:2.1},{id:3,name:'符紋',minLevel:35,mult:3.1},{id:4,name:'祕銀',minLevel:50,mult:4.5},{id:5,name:'遠古',minLevel:70,mult:6.6},{id:6,name:'星鑄',minLevel:90,mult:9}
];
export function equipmentBase(level){level=itemLevel(level);return {...ITEM_BASES.findLast(b=>level>=b.minLevel)};}
export const UNIQUES=Object.fromEntries([
 {id:'star_cleaver',name:'斷星巨刃',slot:'weapon',weaponType:'greatsword',itemLevel:99,minLevel:40,affixes:['physicalDamage','crit','critMultiplier','skillArea','haste'],description:'斷星之刃將爆擊傷害固定為三倍。'},
 {id:'focus_codex',name:'焦點秘典',slot:'offhand',weaponType:'tome',itemLevel:89,minLevel:32,affixes:['spellDamage','skillArea','critMultiplier','manaCost','castSpeed'],description:'凝聚秘法，將爆擊傷害固定為三倍。'},
 {id:'tide_heart',name:'潮汐之心',slot:'charm',itemLevel:8,minLevel:8,affixes:['manaRegen','mana','manaCost','auraClarity','summonDamage'],description:'潮汐迴響凝成靜心之力，持續補充魔力。'},
 {id:'soul_edge',name:'靈噬',slot:'weapon',weaponType:'sword',itemLevel:18,minLevel:18,affixes:['attackDamage','manaLeech','flatAttackFire','haste','procFireball'],description:'每次斬擊汲取魔力，偶爾迸發熾焰。'},
 {id:'thunder_shell',name:'返雷之殼',slot:'chest',itemLevel:32,minLevel:28,affixes:['hpPct','armor','procNova','auraWard','allResist'],description:'守護符紋在受創時釋出寒霜。'},
 {id:'soul_crown',name:'眾魂王冠',slot:'helm',itemLevel:41,minLevel:38,affixes:['summonDamage','summonLife','summonHaste','manaRegen','auraWar'],description:'眾魂響應戰意，強化身邊的召喚物。'},
 {id:'storm_weaver',name:'織電者',slot:'hands',itemLevel:98,minLevel:50,affixes:['skillDmg','manaCost','flatSpellLightning','procChain','procMeteor'],description:'編織雷電與星火，使施法更加從容。'},
 {id:'ember_loop',name:'餘燼指環',slot:'ring',itemLevel:48,minLevel:45,socketCap:1,affixes:['fireDamage','fireResist','mana','manaOnHit'],description:'持有者的灼燒對火焰免疫敵人仍保留20%效力。固定一孔上限。'},
 {id:'hunt_step',name:'逐獵之足',slot:'feet',itemLevel:24,minLevel:22,affixes:['speedPct','haste','physicalDamage','hpPct','auraHunt'],description:'隨獵風前行，收割戰場殘存的魔力。'}
].map(u=>[u.id,u]));
export function socketLimit(item){if(item?.uniqueID&&UNIQUES[item.uniqueID]?.socketCap!==undefined)return UNIQUES[item.uniqueID].socketCap;const level=itemLevel(item?.level),slot=item?.slot;if(slot==='ring')return 0;if(slot==='weapon')return twoHanded(item)?level>=35?4:2:level>=35?2:1;if(slot==='offhand')return level>=35?2:1;if(slot==='helm')return level>=20?2:1;if(slot==='chest')return level>=50?3:level>=20?2:1;return ['hands','feet','charm','cloak'].includes(slot)?1:0;}
function generatedBase(slot,rarity,level,weaponType=slot==='weapon'?'sword':slot==='offhand'?'shield':undefined){
 const base=equipmentBase(level),mult=Campaign.whiteLevelMultiplier(level)*RARITIES[rarity].mult;
 const campaignBoost=rarity>0?Math.max(0,Math.min(1,(51-level)/30)):0;
 const jewelry=['charm','ring'].includes(slot),utilityOffhand=['tome','quiver'].includes(weaponType);
 const power=slot==='weapon'?BASE_WEAPON_WHITE_POWER*(WEAPON_TYPES[weaponType]?.powerMult??1):slot==='offhand'?(weaponType==='tome'?1.6:weaponType==='quiver'?2.2:.8):slot==='hands'?2:0;
 const hp=jewelry||slot==='weapon'?0:slot==='chest'?25:slot==='offhand'?(utilityOffhand?6:14):10;
 const armor=jewelry||slot==='weapon'?0:slot==='chest'?5:slot==='offhand'?(utilityOffhand?1:7):2;
 const item={id:'item-'+(globalThis.crypto?.randomUUID?.()??Date.now().toString(36)+'-'+(++seq)),locked:false,
  baseRulesVersion:12,slot,...(weaponType?{weaponType}:{}),rarity,level,baseTier:base.id,requiredLevel:Math.max(1,level-6),
  power:Math.round(power*mult*(1+.42*campaignBoost)),hp:Math.round(hp*mult*(1+.2*campaignBoost)),
  armor:Math.round(armor*mult*(1+.18*campaignBoost)),crit:0,upgrade:0,set:null,naturalSockets:0,socketCrafted:false,sockets:[]};
 item.socketCap=socketLimit(item);
 return item;
}
function rollSockets(item,rand){const r=randomUnit(rand);let n=0;while(n<item.socketCap&&r<Math.pow(.35,n+1))n++;item.naturalSockets=n;item.sockets=Array(n).fill(null);return item;}
export function makeUnique(id,availableLevel,rand=Math.random){
 if(!Object.hasOwn(UNIQUES,id)||!Number.isFinite(availableLevel)||availableLevel<UNIQUES[id].minLevel)return null;
 const u=UNIQUES[id],level=u.itemLevel;
 const item={...generatedBase(u.slot,4,level,u.weaponType),name:u.name,uniqueID:id,uniqueLevelVersion:1,
  affixCount:u.affixes.length,affixRulesVersion:19,requiredLevel:Math.max(u.minLevel,level-6)};
 if(Object.hasOwn(ARMOR_SHARES,item.slot))item.armorWeight=u.armorWeight??'medium';
 if(item.slot==='cloak')item.implicitAura=u.implicitAura??'ward';
 item.socketCap=socketLimit(item);
 let guarantees=2;
 item.affixes=u.affixes.map(key=>{
  const tier=guarantees&&!AFFIXES[key].core&&legalTiers(key,item).includes(1)?(guarantees--,1):undefined;
  return rollAffix(key,level,rand,item,tier);
 });
 if(guarantees)throw Error('Unique needs two ordinary T1 families');
 return rollSockets(item,rand);
}
for(const u of [...NEW_UNIQUES,...ARCHETYPE_UNIQUES])UNIQUES[u.id]={...u,affixes:[...u.affixes]};
UNIQUES.tide_shield.weaponType='towerShield';UNIQUES.tide_shield.name='誓潮大盾';
UNIQUES.thunder_shell.armorWeight='heavy';UNIQUES.blood_furnace.armorWeight='heavy';UNIQUES.shadow_mantle.armorWeight='light';UNIQUES.device_mail.armorWeight='medium';
// Keep authentic owned unique layouts legal; new constructors use shared elemental keys.
// Their original records retain their own ranges, tiers and narrow attack/spell effects.
const legacyUniqueAffixes=Object.fromEntries(Object.values(UNIQUES).map(u=>[u.id,[...u.affixes]]));
for(const u of Object.values(UNIQUES))u.affixes=u.affixes.map(key=>key.replace(/^flat(?:Attack|Spell)(Fire|Cold|Lightning|Poison)$/,'flat$1'));
for(const u of EARLY_UNIQUES)UNIQUES[u.id]={...u,affixes:[...u.affixes]};

function rollUnique({min,max},rand,ids=Object.keys(UNIQUES)){
 const eligible=ids.filter(id=>UNIQUES[id].itemLevel>=min&&UNIQUES[id].itemLevel<=max);
 if(!eligible.length)return null;
 const id=eligible[Math.floor(randomUnit(rand)*eligible.length)];
 return makeUnique(id,UNIQUES[id].itemLevel,rand);
}
const QUALITY_TABLES={1:{normal:[58,30,10,1.8,.2,0],elite:[15,45,32,7,1,0],boss:[0,20,60,17,3,0]},2:{normal:[46,35,15.5,3.2,.26,.04],elite:[9,38,40,11.5,1.3,.2],boss:[0,10,62,24.2,3.2,.6]},3:{normal:[35,37,22.5,5,.42,.08],elite:[5,30,44.75,18,2,.25],boss:[0,5,59,30.3,4.8,.9]}};
export const CAMPAIGN_CHAPTERS=Campaign.CAMPAIGN_CHAPTERS;
export const equipmentDropCap=Campaign.equipmentDropCap;
export const equipmentDropBand=Campaign.equipmentDropBand;
export const rollDropLevel=Campaign.rollDropLevel;
export function areaLevel(c,diff=1,room=0,chapter=1){return Campaign.equipmentDropBand(diff,room,chapter).monsterLevel;}
export function lootQuality(diff,source,R=0,level=1,guaranteed=false){const table=QUALITY_TABLES[diff]??QUALITY_TABLES[1],weights=(table[source==='miniboss'?'boss':source]??table.normal).slice(),r=Number.isFinite(R)?Math.max(0,R):0,E=1.5*r/(r+150),coeff=[0,.25,.75,1,1.5,2];if(Number(diff)===1||level<50){weights[4]+=weights[5];weights[5]=0;}if(guaranteed){weights[0]=0;weights[1]=0;}const adjusted=weights.map((w,i)=>w*(1+E*coeff[i])),sum=adjusted.reduce((a,b)=>a+b,0);return adjusted.map(w=>w/sum);}
// Average conditional quality over the real room-level distribution, including source bias.
export function roomLootQuality(diff,source,R=0,room=0,guaranteed=false,chapter=1){
 const band=equipmentDropBand(diff,room,chapter),count=band.max-band.min+1,out=RARITIES.map(()=>0);
 for(let n=0;n<count;n++){
  const level=rollDropLevel(diff,room,source,()=>(n+.5)/count,chapter),weights=lootQuality(diff,source,R,level,guaranteed);
  weights.forEach((value,i)=>out[i]+=value/count);
 }
 return out;
}
export function rewardItemLevel(c,diff){return Math.min(areaLevel(c,diff,ROOMS.length-1),itemLevel(c.level)+6);}
export function makeItem(c,diff=1,rand=Math.random,options=false){
 const legacy=options===true,o=options&&typeof options==='object'?options:{},tier=Object.hasOwn(DIFFICULTIES,diff)?Number(diff):1,source=o.source==='miniboss'?'boss':['normal','elite','boss'].includes(o.source)?o.source:'normal',room=Math.max(0,Math.min(ROOMS.length-1,Math.floor(o.room)||0)),level=o.level!==undefined?itemLevel(o.level):Campaign.rollDropLevel(tier,room,source,rand,o.chapter??1),quality=lootQuality(tier,source,((o.lootStats?.rarityFind??(c.equipment&&c.talents&&CLASSES[c.cls]?stats(c).rarityFind:0))+Math.max(0,Math.min(.25,Number.isFinite(o.lootStats?.roomRarityBonus)?o.lootStats.roomRarityBonus:0)))*100,level,!!o.guaranteed);
 const minimum=Number.isInteger(o.minimumRarity)?Math.max(0,Math.min(5,o.minimumRarity)):0;if(minimum){for(let i=0;i<minimum;i++)quality[i]=0;const sum=quality.reduce((a,b)=>a+b,0);if(sum)for(let i=0;i<quality.length;i++)quality[i]/=sum;}
 let rarity=legacy?4:Number.isInteger(o.rarity)?Math.max(0,Math.min(5,o.rarity)):weightedPick([0,1,2,3,4,5],quality,rand),set=o.setID??null;
 if(o.slot==='cloak')rarity=Math.max(3,rarity);
 if(rarity===5&&level<50)throw Error('Orange requires ilvl50');
 if(rarity===5||legacy){const ids=Object.keys(SETS).filter(id=>SETS[id].rarity===rarity);set??=ids[Math.floor(randomUnit(rand)*ids.length)];}
 else if(rarity===4&&!o.rarity){
  const category=weightedPick(['normal','set','unique'],source==='boss'?[.35,.4,.25]:source==='elite'?[.45,.35,.2]:[.6,.25,.15],rand);
  if(category==='set'){
   const ids=Object.keys(SETS).filter(id=>SETS[id].rarity===4);
   set=ids[Math.floor(randomUnit(rand)*ids.length)];
  }else if(category==='unique'){
   const unique=rollUnique(o.dropBand??{min:level,max:level},rand);
   if(unique)return unique;
  }
 }
 const weights=[...(rarity>=3?[['cloak',2]]:[]),['weapon',25],['offhand',12],['helm',10],['chest',10],['hands',10],['feet',10],...(rarity>0?[['charm',8],['ring',15]]:[])].filter(([slot])=>!set||SETS[set].slots.includes(slot));
 const slot=o.slot&&(!set||SETS[set].slots.includes(o.slot))?o.slot:weightedPick(weights.map(([slot])=>slot),weights.map(([,w])=>w),rand);
 const forms=set?setEquipmentTypes(set,slot):slot==='weapon'?['sword','greatsword','bow','wand','staff','dagger','axe','greataxe']:slot==='offhand'?['shield','towerShield','tome','quiver']:[];
 const weaponType=o.weaponType!==undefined&&(!set||forms.includes(o.weaponType))?o.weaponType:
  forms.length?forms[Math.floor(randomUnit(rand)*forms.length)]:undefined;
 const item={...generatedBase(slot,rarity,level,weaponType),affixRulesVersion:19,set};
 if(slot==='cloak'){item.rarity=rarity=Math.max(3,rarity);item.implicitAura=o.implicitAura??['clarity','war','ward','hunt'][Math.floor(randomUnit(rand)*4)];}
 if(Object.hasOwn(ARMOR_SHARES,slot))item.armorWeight=o.armorWeight??(o.source?['light','medium','heavy'][Math.floor(randomUnit(rand)*3)]:'medium');
 // Constructors may still represent historical white jewellery; live drops filter it below.
 if(set)item.setPiece=slot==='ring'?'ring:'+(o.ringPiece??(randomUnit(rand)<.5?'a':'b')):slot;item.affixCount=rollAffixCount(item,rand);
 if(rarity>=2&&slot!=='ring'&&randomUnit(rand)<[0,0,.025,.04,.06,.06][rarity]){
  const skills=Object.keys(ABILITIES).filter(id=>!ringBowSkillIds.has(id)&&!ABILITIES[id].summon?.support&&!['a_stab','m_titan','r_wolf','r_pack','m_frostgolem'].includes(id)&&
   (!isRingHero(c)||!RING_TREE.byId['s:'+id]?.retired));
  item.grantedSkill=skills[Math.floor(randomUnit(rand)*skills.length)];
 }
 item.affixes=completeAffixes(item,[],rand);const names={weapon:WEAPON_TYPES[weaponType]?.name,offhand:WEAPON_TYPES[weaponType]?.name,helm:'面甲',chest:'戰衣',hands:'護手',feet:'長靴',charm:'護符',ring:'戒指',cloak:'披風'},prefix=set?SETS[set].name:item.affixes.length?AFFIXES[item.affixes[0].key].name:RARITIES[rarity].name;item.name=prefix+'之'+names[slot];return rollSockets(item,rand);
}
// Explicit makeItem(level) is a constructor; all live drops pass through this boundary.
export function rollItemDrop(c,diff=1,rand=Math.random,options={}){
 const o=options&&typeof options==='object'?options:{},chapter=Number(o.chapter??1);
 if(!Object.hasOwn(CAMPAIGN_CHAPTERS,chapter)||!CAMPAIGN_CHAPTERS[chapter].available)throw Error('章節尚未開放。');
 if(o.specialMap&&o.context?.kind!=='endgame')throw Error('特殊地圖需要合法終局上下文。');
 const source=o.source??'normal',room=o.room??o.context?.room??0,band=lootLevelBand(diff,room,chapter,o.context);
 const level=Campaign.rollBandLevel(band,o.context?.kind==='endgame'?'normal':source,rand);
 return makeItem(c,diff,rand,{...o,source,chapter,level,dropBand:band});
}
export function rollEquipmentLoot(c,diff,source,room,rand=Math.random,lootStats=stats(c),context={chapter:1}){if(!['normal','elite','miniboss','boss'].includes(source))return [];const loot=DIFFICULTIES[diff]?.loot??DIFFICULTIES[1].loot,out=[],generate=guaranteed=>rollItemDrop(c,diff,rand,{source,room,guaranteed,lootStats,chapter:context.chapter??1,context});if(source==='boss'||source==='miniboss')out.push(generate(true));for(let n=0;n<(source==='boss'?2:1);n++)if(randomUnit(rand)<dropChance(lootStats,loot[source==='miniboss'?'elite':source]))out.push(generate(false));return out;}
export function addBossMarks(profile,diff){if(![1,2,3].includes(diff)||!profile.marks||!safeCount(profile.marks[String(diff)])||!safeCount(profile.marks[String(diff)]+diff))return null;profile.marks[String(diff)]+=diff;return {difficulty:diff,amount:diff};}
export function redeemSet(profile,heroID,{setID,slot,weaponType,difficulty,ringPiece='a'}={},rand=Math.random){const c=profile.characters?.[heroID],set=SETS[setID],fail=reason=>({ok:false,reason});if(!c||!set||![1,2,3].includes(difficulty)||!set.slots.includes(slot))return fail('兌換選項無效。');if(c.bag.length>=150)return fail('背包已滿。');if(['weapon','offhand'].includes(slot)&&(weaponType!==undefined&&!setEquipmentTypes(setID,slot).includes(weaponType)))return fail('此底材不屬於選擇的套裝。');if(slot==='ring'&&!['a','b'].includes(ringPiece))return fail('戒指部件無效。');if(set.rarity===5&&(difficulty!==3||c.level<50||!Object.values(profile.characters).some(hero=>progressFor(hero,3).length===ROOMS.length)))return fail(`橘套需通關${DIFFICULTIES[3].name}且角色50級。`);const amount=set.rarity===5?48:[0,8,12,16][difficulty],balance=profile.marks?.[String(difficulty)];if(!safeCount(balance)||balance<amount)return fail('此難度印記不足。');let item;try{item=makeItem(c,difficulty,rand,{rarity:set.rarity,setID,slot,weaponType,ringPiece,room:ROOMS.length-1,level:rewardItemLevel(c,difficulty)});if(!validItem(item))return fail('無法建立合法裝備。');}catch{return fail('兌換未完成，未扣除印記。');}profile.marks[String(difficulty)]-=amount;c.bag.push(item);recordEquipmentDiscovery(profile,item);return {ok:true,item,cost:{difficulty,amount}};}

function supportForClass(cls,main,off){
 if(!supportCompatible(main,off))return false;
 if(cls!=='wanderer'||!off)return true;
 if(!main)return false;
 return off.weaponType!=='towerShield'||['sword','axe','dagger'].includes(main.weaponType);
}
function equipTarget(c,item,target){if(item.slot==='weapon'&&target==='offhand')return legalDualPair(c,c.equipment.weapon,item)?'offhand':null;if(item.slot!=='ring')return target===null||target===item.slot?item.slot:null;if(target!==null)return ['ring_left','ring_right'].includes(target)?target:null;return !c.equipment.ring_left?'ring_left':!c.equipment.ring_right?'ring_right':null;}
export function equipRequirement(c,item,targetSlot=null){
 if(!classWeaponAllowed(c,item))return {ok:false,reason:'狂戰士只能持握近戰武器，不能使用盾牌、法器或箭袋。'};const required=item.requiredLevel??1;if(c.level<required)return {ok:false,reason:`需要角色等級 ${required}。`};if(!ITEM_SLOTS.includes(item.slot)||item.weaponType!==undefined&&(!Object.hasOwn(WEAPON_TYPES,item.weaponType)||WEAPON_TYPES[item.weaponType].slot!==item.slot))return {ok:false,reason:'裝備類型不符。'};
 if(isRingHero(c)&&item.slot==='weapon'&&targetSlot==='offhand'&&!legalDualPair(c,c.equipment.weapon,item))return {ok:false,reason:'需要相容的主手武器及燼脈圖的對應雙持節點。'};
 const target=equipTarget(c,item,targetSlot);if(!target)return {ok:false,reason:item.slot==='ring'?'請選擇要替換的左／右戒指。':'裝備部位不符。'};
 if(Object.values(c.equipment).some(i=>i.id===item.id))return {ok:false,reason:'此物品已穿戴。'};
 if(item.slot==='ring'&&item.uniqueID&&['ring_left','ring_right'].some(k=>k!==target&&c.equipment[k]?.uniqueID===item.uniqueID))return {ok:false,reason:'同種獨特戒指只能穿戴一枚。'};
 if(item.slot==='offhand'&&!supportForClass(c.cls,c.equipment.weapon,item)){
  if(item.weaponType==='quiver')return {ok:false,reason:'箭袋需要搭配弓。'};
  if(c.equipment.weapon?.weaponType==='bow')return {ok:false,reason:'弓只能搭配箭袋。'};
  return {ok:false,reason:item.weaponType==='towerShield'&&isRingHero(c)?'大盾需要搭配單手近戰武器。':'需單手武器。'};
 }
 const stow=target==='weapon'&&c.equipment.offhand&&(c.equipment.offhand.slot==='weapon'?!legalDualPair(c,item,c.equipment.offhand):!supportForClass(c.cls,item,c.equipment.offhand))?1:0,capacity=c.bag.length-(c.bag.some(i=>i.id===item.id)?1:0)+(c.equipment[target]?1:0)+stow;return capacity>150?{ok:false,reason:'背包已滿，無法收回替換裝備。'}:{ok:true,reason:'',targetSlot:target};
}
export function grantedSkillPreview(c,item){
 if(!item||item.slot==='ring'||!Object.hasOwn(ABILITIES,item.grantedSkill))return null;
 const prospective=structuredClone(c),equipped=Object.entries(prospective.equipment).find(([,i])=>i.id===item.id);
 if(!equipped){const req=equipRequirement(prospective,item);if(!req.ok)return null;if(item.slot==='weapon'&&prospective.equipment.offhand&&(prospective.equipment.offhand.slot==='weapon'?!legalDualPair(prospective,item,prospective.equipment.offhand):!supportForClass(prospective.cls,item,prospective.equipment.offhand)))delete prospective.equipment.offhand;prospective.equipment[req.targetSlot]=structuredClone(item);}
 return abilityFor(prospective,item.grantedSkill);
}
export function equip(c,id,targetSlot=null){const index=c.bag.findIndex(i=>i.id===id);if(index<0)return false;const item=c.bag[index],req=equipRequirement(c,item,targetSlot);if(!req.ok)return false;const target=req.targetSlot,old=c.equipment[target],offhand=target==='weapon'&&c.equipment.offhand&&(c.equipment.offhand.slot==='weapon'?!legalDualPair(c,item,c.equipment.offhand):!supportForClass(c.cls,item,c.equipment.offhand))?c.equipment.offhand:null;c.bag.splice(index,1);if(old)c.bag.splice(index,0,old);if(offhand){c.bag.push(offhand);delete c.equipment.offhand;}c.equipment[target]=item;reconcileSkillLoadouts(c);fillGrantedSkills(c,item.grantedSkill?[item.grantedSkill]:[]);c.equipmentSkillVersion=1;return true;}
export function unequip(c,slot){if(!SLOTS.includes(slot)||!Object.hasOwn(c.equipment,slot))return false;const dependent=slot==='weapon'&&(c.equipment.offhand?.slot==='weapon'||c.equipment.offhand?.weaponType==='quiver'||isRingHero(c)&&!!c.equipment.offhand);if(c.bag.length+(dependent?2:1)>150)return false;c.bag.push(c.equipment[slot]);delete c.equipment[slot];if(dependent){c.bag.push(c.equipment.offhand);delete c.equipment.offhand;}reconcileSkillLoadouts(c);return true;}

export function reorderBag(c,id,beforeId=null){const index=c.bag.findIndex(i=>i.id===id);if(index<0||beforeId===id||beforeId!==null&&!c.bag.some(i=>i.id===beforeId))return false;const [item]=c.bag.splice(index,1);const target=beforeId===null?c.bag.length:c.bag.findIndex(i=>i.id===beforeId);c.bag.splice(target,0,item);return true;}
export function salvage(c,id){let index=c.bag.findIndex(i=>i.id===id);if(index<0||c.bag[index].locked||c.bag[index].sockets?.some(Boolean))return false;let [it]=c.bag.splice(index,1);c.shards+=2+it.rarity*3;return true;}
export function upgradeCost(i){return 12+(i.upgrade||0)*8;}
export function setAutoLootActions(c,actions){return GearRules.setAutoLootActions(c,actions);}
export function autoLootPolicy(c){return GearRules.autoLootPolicy(c);}
export function setAutoLootPolicy(c,policy){return GearRules.setAutoLootPolicy(c,policy);}
export function autoLootPreview(c,item){return GearRules.autoLootPreview(c,item,itemSellValue);}
export function applyAutoLoot(c,item){return GearRules.applyAutoLoot(c,item,itemSellValue);}
export function enhancementPreview(profile,c,slot,stones=1){return GearRules.enhancementPreview(profile,c,slot,stones);}
export function enhanceEquipment(profile,c,slot,stones=1,rand=Math.random){return GearRules.enhanceEquipment(profile,c,slot,stones,rand);}
export function upgrade(c,slot){let i=c.equipment[slot];if(!i||i.locked||c.inCombat||['charm','ring'].includes(i.slot)||(i.upgrade||0)>=10||c.shards<upgradeCost(i))return false;c.shards-=upgradeCost(i);i.upgrade=(i.upgrade||0)+1;return true;}
export function itemScore(i){const white=equipmentWhiteValues(i);return Math.round((white.power*4+white.hp*.15+white.armor*2+white.crit*100+(i.affixes??[]).reduce((n,a)=>n+(AFFIXES[a.key]?.percent?a.value*90:a.value),0))*(1+(i.upgrade||0)*.12));}


export const STASH_CAPACITY=120;
export const FLASKS={
 life:{name:'赤晶生命瓶',short:'生命',color:'#dc625e',icon:'heart',cost:20,duration:3,desc:'立即恢復 10% 生命，再於 3 秒內恢復 35% 生命。',hp:.35,instantHP:.1},
 mana:{name:'蒼藍魔力瓶',short:'魔力',color:'#6aace8',icon:'rune',cost:15,duration:3,desc:'立即恢復 20% 魔力，再於 3 秒內恢復 60% 魔力。',mp:.6,instantMP:.2},
 hybrid:{name:'暮光複合瓶',short:'複合',color:'#c291db',icon:'potion',cost:25,duration:4,desc:'4 秒內恢復 30% 生命與 45% 魔力。',hp:.3,mp:.45},
 speed:{name:'逐風水銀瓶',short:'迅捷',color:'#9ac79a',icon:'wind',cost:25,duration:5,desc:'5 秒內移動速度 +30%、攻擊速度 +15%。',buff:{speedPct:.3,haste:.15}},
 iron:{name:'玄鐵守護瓶',short:'護甲',color:'#c8b68b',icon:'shield',cost:25,duration:5,desc:'5 秒內護甲 +60、受到傷害減少 15%。',buff:{armor:60,reduce:.15}},
 diamond:{name:'稜光獵殺瓶',short:'爆擊',color:'#d39cc1',icon:'target',cost:25,duration:5,desc:'5 秒內爆擊率 +20%、攻擊與施法速度 +15%。',buff:{crit:.2,haste:.15,castSpeed:.15}},
 fortune:{name:'琥珀尋寶瓶',short:'掉寶',color:'#d1b468',icon:'coin',cost:25,duration:8,desc:'8 秒內裝備掉落率 +20%、裝備稀有度 +40%。',buff:{drop:.2,rarityFind:.4}}
};
for(const [type,flask] of Object.entries(FLASKS))flask.icon=FLASK_ICONS[type];
export const AFFIX_GRADES={
 common:{name:'常見',label:'常見家族',color:'#deded6',weight:12,minRarity:0},
 uncommon:{name:'精良',label:'精良家族',color:'#70aeef',weight:6,minRarity:1},
 rare:{name:'稀有',label:'稀有家族',color:'#e1c766',weight:3,minRarity:2},
 epic:{name:'史詩',label:'史詩家族',color:'#bd8ae2',weight:1,minRarity:3},
 legendary:{name:'傳說',label:'傳說家族',color:'#ee7975',weight:.35,minRarity:4}
};
export const AURAS={
 clarity:{name:'靜心光環',icon:'rune',color:'#70aeef',buff:{manaRegen:2.5,manaRegenPct:.12}},
 war:{name:'戰意光環',icon:'flag',color:'#e1c766',buff:{atkPct:.06,haste:.04,summonDamage:.04}},
 ward:{name:'守護光環',icon:'shield',color:'#87bda1',buff:{armor:10,reduce:.02,summonLife:.08}},
 hunt:{name:'獵風光環',icon:'eye',color:'#87bda1',buff:{crit:.025,speedPct:.05}}
};
// New core suffixes use the existing rarity, prefix/suffix and item-level budgets.
const EXTRA_TRIGGER_AFFIXES=[
 ['procCleave','attack','w_cleave',.6,'裂響','rare',.04,.09,['sword','greatsword'],['hands','shield','charm']],
 ['procIceCone','attack','m_icecone',.55,'冰棘','rare',.04,.09,['wand','staff','tome'],['hands','charm']],
 ['procSnipe','attack','r_snipe',.4,'穿心','epic',.03,.07,['bow'],['hands','charm']],
 ['procRain','attack','r_rain',.45,'落羽','epic',.03,.07,['bow'],['hands','tome','charm']],
 ['procPoisonArrow','attack','r_poisonarrow',.55,'瘴矢','rare',.04,.09,['bow','hands'],['charm']],
 ['procThunder','attack','m_chain',.45,'雷湧','epic',.03,.07,['staff','tome'],['wand','charm']],
 ['procSlam','damaged','w_slam',.5,'震返','rare',.04,.09,['shield','chest'],['hands','helm']],
 ['procFrostArmor','damaged','m_frostarmor',.55,'霜衛','rare',.04,.09,['helm','chest','tome'],['shield','charm']],
 ['procCurse','damaged','r_barbs',.6,'厄印','epic',.03,.07,['shield','charm','helm'],['chest','hands']],
 ['procSanctuary','damaged','m_sanctuary',.4,'庇護','legendary',.02,.04,['shield','charm'],['chest','tome']]
];
export const TRIGGERS={
 procFireball:{event:'attack',skill:'m_fireball',cooldown:.1,scale:.65},
 procChain:{event:'attack',skill:'m_spark',cooldown:.1,scale:.65},
 procNova:{event:'damaged',skill:'m_nova',cooldown:.1,scale:.6},
 procGuard:{event:'damaged',skill:'w_guard',cooldown:.1,scale:.65},
 procMeteor:{event:'attack',skill:'m_meteor',cooldown:.1,scale:.5}
};
for(const [key,event,skill,scale]of EXTRA_TRIGGER_AFFIXES)TRIGGERS[key]={event,skill,scale,cooldown:.1};
export const AFFIXES={
 skillArea:{name:'廣域',label:'技能範圍',min:.05,max:.15,percent:true,grade:'uncommon'},extraProjectiles:{name:'分裂',label:'額外投射物',min:1,max:2,grade:'rare'},skillDuration:{name:'延續',label:'技能持續時間',min:.06,max:.16,percent:true,grade:'uncommon'},castSpeed:{name:'迅法',label:'施法速度',min:.04,max:.12,percent:true,grade:'uncommon'},
 summonDamage:{name:'統御',label:'召喚物傷害',min:.08,max:.22,percent:true,grade:'uncommon'},summonLife:{name:'靈契',label:'召喚物生命',min:.1,max:.28,percent:true,grade:'uncommon'},summonHaste:{name:'狂獸',label:'召喚物攻擊速度',min:.05,max:.14,percent:true,grade:'uncommon'},summonSpeed:{name:'追獵',label:'召喚物移動速度',min:.06,max:.18,percent:true,grade:'uncommon'},
 allSkills:{name:'啟悟',label:'全部技能等級',min:1,max:3,grade:'legendary'},
 atkPct:{name:'殘暴',label:'攻擊提高',min:.04,max:.12,percent:true,grade:'common'},hpPct:{name:'巨人',label:'生命提高',min:.04,max:.12,percent:true,grade:'common'},
 mana:{name:'睿智',label:'最大魔力',min:10,max:35,grade:'common',weight:14},manaRegen:{name:'泉湧',label:'每秒回魔',min:2,max:6,grade:'common',weight:18},manaRegenPct:{name:'流泉',label:'魔力再生提高',min:.15,max:.35,percent:true,grade:'common',weight:14},manaCost:{name:'節制',label:'魔力消耗降低',min:.04,max:.12,percent:true,grade:'uncommon',weight:12},flatManaCost:{name:'凝神',label:'技能魔力消耗減少',min:2,max:5,grade:'uncommon',weight:9},manaLeech:{name:'噬魔',label:'魔力偷取',min:.01,max:.03,percent:true,grade:'uncommon',weight:7},manaOnHit:{name:'汲能',label:'命中回魔',min:1,max:3,grade:'uncommon',weight:8},manaOnKill:{name:'收魂',label:'擊殺回魔',min:2,max:5,grade:'common',weight:10},
 crit:{name:'精準',label:'爆擊率',min:.02,max:.06,percent:true,grade:'uncommon'},critDmg:{name:'毀滅',label:'爆擊加成（停用）',min:.1,max:.3,percent:true,grade:'rare',legacyOnly:true},critMultiplier:{name:'斷星',label:'爆擊倍率',min:3,max:3,grade:'legendary',uniqueOnly:true},haste:{name:'疾攻',label:'攻擊速度',min:.04,max:.12,percent:true,grade:'uncommon'},speedPct:{name:'風行',label:'移動速度',min:.03,max:.09,percent:true,grade:'common'},cdr:{name:'靈巧',label:'冷卻縮減',min:.02,max:.07,percent:true,grade:'rare'},leech:{name:'汲血',label:'生命偷取',min:.003,max:.012,percent:true,grade:'rare'},drop:{name:'貪婪',label:'裝備掉寶加成',min:.05,max:.18,percent:true,grade:'uncommon'},armor:{name:'堅韌',label:'額外護甲',min:4,max:14,grade:'common'},lifeRegen:{name:'再生',label:'每秒回血',min:.3,max:1.2,grade:'common'},skillDmg:{name:'秘法',label:'技能傷害',min:.05,max:.16,percent:true,grade:'rare'},resist:{name:'抗魔',label:'法術減傷',min:.02,max:.07,percent:true,grade:'uncommon'},chargeGain:{name:'煉金',label:'藥水充能獲取',min:.08,max:.2,percent:true,grade:'uncommon'},
 auraClarity:{name:'靜心',label:'靜心光環',aura:'clarity',min:1,max:3,grade:'rare'},auraWar:{name:'戰意',label:'戰意光環',aura:'war',min:1,max:3,grade:'epic'},auraWard:{name:'守護',label:'守護光環',aura:'ward',min:1,max:3,grade:'epic'},auraHunt:{name:'獵風',label:'獵風光環',aura:'hunt',min:1,max:3,grade:'epic'},
 procFireball:{name:'熾焰',label:'攻擊觸發火球',min:.04,max:.09,percent:true,grade:'rare'},procChain:{name:'連雷',label:'攻擊觸發連鎖閃電',min:.04,max:.09,percent:true,grade:'epic'},procNova:{name:'霜返',label:'受傷觸發冰霜新星',min:.04,max:.09,percent:true,grade:'rare'},procGuard:{name:'鐵衛',label:'受傷觸發鋼鐵姿態',min:.04,max:.09,percent:true,grade:'epic'},procMeteor:{name:'星隕',label:'攻擊觸發隕火',min:.02,max:.04,percent:true,grade:'legendary'}
};
for(const [key,event,skill,scale,name,grade,min,max]of EXTRA_TRIGGER_AFFIXES)AFFIXES[key]={name,grade,min,max,percent:true,weight:1};
for(const [key,trigger]of Object.entries(TRIGGERS))AFFIXES[key].label=(trigger.event==='attack'?'命中觸發':'受擊觸發')+ABILITIES[trigger.skill].name;
// Ordinary pools are explicit by form. Fixed uniques deliberately retain their listed exceptions.
const typedAffix=(name,label,min,max,extra={})=>({name,label,min,max,percent:true,grade:'uncommon',...extra});
Object.assign(AFFIXES,{
 lifeCostReduction:typedAffix('血契節流','生命成本降低',.03,.07,{grade:'rare'}),lowLifeDamage:typedAffix('赤血','低生命直接傷害',.05,.12,{grade:'rare'}),trapDamage:typedAffix('機關','陷阱傷害',.06,.14),trapSetup:typedAffix('疾設','陷阱佈置速度',.04,.1),movementRecovery:typedAffix('迅影','位移充能恢復',.03,.08,{grade:'rare'}),projectileDamage:typedAffix('遠射','投射物傷害',.06,.14),bleedDamage:typedAffix('割裂','流血傷害',.08,.16),poisonDotDamage:typedAffix('腐蝕','毒素持續傷害',.08,.16),
 evasion:typedAffix('幻步','閃避率',.015,.03,{grade:'rare',family:'evasion'}),
 block:typedAffix('格擋','格擋率',.03,.08),blockReduction:typedAffix('堅盾','格擋減傷',.05,.12,{grade:'rare'}),
 physicalDamage:typedAffix('鋒銳','物理傷害提高',.13,.19),attackDamage:typedAffix('戰鬥','攻擊傷害提高',.13,.19),spellDamage:typedAffix('奧秘','法術傷害提高',.13,.19),physicalReduce:typedAffix('厚甲','額外物理減傷',.02,.05),allResist:typedAffix('稜光','全屬性抗性',.04,.07,{grade:'rare'}),
 dotDamage:typedAffix('蝕骨','持續傷害提高',.06,.14),
 summonManaCost:typedAffix('召令節流','召喚耗魔降低',.06,.15),
 auraManaCost:typedAffix('光域節流','光環耗魔降低',.05,.12),
 summonCapacity:{name:'統軍',label:'召喚容量',min:1,max:2,integer:true,grade:'rare'},soulBond:{name:'繫魂',label:'靈魂繫帶：召喚物減傷 8%',min:1,max:1,grade:'epic',core:true},bossMana:{name:'汲王',label:'直接命中首領回魔（每秒一次）',min:2,max:4,grade:'rare',core:true},auraEffect:typedAffix('共鳴','裝備光環效果提高',.15,.25,{grade:'epic',core:true})
});
for(const [type,name] of Object.entries({fire:'火焰',cold:'冰霜',lightning:'閃電',poison:'毒素'})){
 const title=type[0].toUpperCase()+type.slice(1);
 AFFIXES[type+'Damage']=typedAffix(name,name+'傷害提高',.07,.12);
 AFFIXES[type+'Resist']=typedAffix('抗'+name,name+'抗性',.1,.16);
 AFFIXES[type+'Pen']=typedAffix('穿'+name,name+'抗性穿透',.035,.065,{grade:'rare'});
 AFFIXES['flatAttack'+title]={name:name+'之刃',label:'攻擊追加'+name+'傷害',min:2,max:7,grade:'uncommon'};
 AFFIXES['flatSpell'+title]={name:name+'之咒',label:'法術追加'+name+'傷害',min:3,max:8,grade:'uncommon'};
 AFFIXES['flat'+title]={name:name+'灌注',label:'追加'+name+'傷害',min:2,max:8,grade:'uncommon',family:'flat'+title};
 AFFIXES[type+'Skills']={name:name+'專注',label:name+'技能等級',min:1,max:1,grade:'epic',core:true,family:'skillLevels'};
}
AFFIXES.atkPct.legacyOnly=true;AFFIXES.resist.legacyOnly=true;
for(const key of ['skillDmg','manaRegenPct','flatManaCost',...['Fire','Cold','Lightning','Poison'].flatMap(t=>['flatAttack'+t,'flatSpell'+t])])AFFIXES[key].legacyOnly=true;
AFFIXES.manaRegenPct.label='回魔速度提高（舊制）';AFFIXES.flatManaCost.label='技能魔力消耗減少（舊制）';AFFIXES.skillDmg.label='技能傷害提高（舊制）';
AFFIXES.drop.label='裝備掉落率';AFFIXES.drop.family='treasure';AFFIXES.drop.weight=2;AFFIXES.drop.grade='rare';
AFFIXES.rarityFind=typedAffix('識寶','裝備稀有度',.04,.48,{family:'treasure',weight:4});
AFFIXES.lifeRegen.legacyOnly=true;AFFIXES.lifeRegen.label='每秒回血（舊制）';
AFFIXES.lifeRegenPct={name:'生生不息',label:'每秒生命再生',min:.002,max:.008,percent:true,grade:'common',weight:12};
const pools={
 evasion:[['feet','cloak'],['helm','chest','hands','ring','charm']],
 lifeCostReduction:[['chest','charm'],['hands','ring']],lowLifeDamage:[['weapon','hands','charm'],['helm','ring']],trapDamage:[['hands','charm'],['helm','ring','dagger','bow','wand']],trapSetup:[['hands'],['charm','dagger']],movementRecovery:[['feet'],['charm','ring']],projectileDamage:[['bow','wand','staff','hands'],['charm','ring']],bleedDamage:[['sword','greatsword','axe','greataxe','dagger','hands'],['charm','ring']],poisonDotDamage:[['bow','dagger','hands'],['charm','ring']],
 block:[['shield'],[]],blockReduction:[['shield'],[]],
 summonCapacity:[['helm','charm','staff','tome'],['wand']],skillArea:[['wand','staff','tome'],['hands','charm']],extraProjectiles:[['bow','wand','staff'],['tome','charm']],skillDuration:[['helm','charm'],['tome','hands']],castSpeed:[['hands'],['wand','staff','tome']],summonDamage:[['helm','staff','tome'],['charm']],summonLife:[['helm','chest'],['tome','charm']],summonHaste:[['hands','helm'],['staff','tome','charm']],summonSpeed:[['feet','helm'],['charm']],allSkills:[['charm'],['helm','staff','tome']],physicalDamage:[['sword','greatsword','bow'],['hands']],attackDamage:[['sword','greatsword','bow'],['hands']],spellDamage:[['wand','staff','tome'],['charm']],hpPct:[['chest'],['helm','hands','feet','shield','charm','ring']],mana:[['helm','wand','staff','tome'],['chest','charm','ring']],manaRegen:[['helm','tome','charm'],['staff','shield','ring']],manaRegenPct:[['helm','tome','charm'],['staff','shield','ring']],manaCost:[['tome','charm'],['hands','helm','ring']],flatManaCost:[['charm'],['hands','wand','tome']],manaLeech:[['sword','greatsword','bow','wand','staff','hands'],['tome','charm']],manaOnHit:[['hands'],['sword','greatsword','bow','wand','staff','tome','charm','ring']],manaOnKill:[['sword','greatsword','bow','wand','staff','helm','charm'],['hands','feet','ring']],crit:[['sword','greatsword','bow','wand','staff','hands'],['tome','charm','ring']],haste:[['hands'],['sword','greatsword','bow']],speedPct:[['feet'],[]],cdr:[['helm','charm'],['tome','shield','hands']],leech:[['sword','greatsword','bow','hands'],['charm']],drop:[['charm'],['helm','hands','feet','ring']],armor:[['chest','shield'],['helm','hands','feet']],lifeRegen:[['chest','shield'],['helm','feet','charm','ring']],skillDmg:[['wand','staff','tome'],['helm','charm']],chargeGain:[['hands','charm'],['feet']],auraClarity:[['tome','charm'],['helm','staff']],auraWar:[['helm','charm'],['shield','greatsword']],auraWard:[['shield','chest'],['helm','charm']],auraHunt:[['bow','charm'],['helm']],procFireball:[['wand','staff','tome'],['hands','charm']],procChain:[['wand','staff','tome'],['hands','charm']],procNova:[['chest','shield'],['helm']],procGuard:[['shield','chest'],['helm']],procMeteor:[['staff','charm'],['tome']],physicalReduce:[['chest','shield'],[]],allResist:[['charm','chest','shield'],['helm','feet','ring']],soulBond:[['charm'],[]],bossMana:[['charm'],[]],auraEffect:[['charm'],[]]
};
pools.lifeRegenPct=pools.lifeRegen.map(a=>[...a]);pools.leech[0].push('wand','staff');pools.leech[1].push('tome','ring');pools.manaLeech[1].push('ring');
for(const [key,event,skill,scale,name,grade,min,max,primary,secondary]of EXTRA_TRIGGER_AFFIXES)pools[key]=[primary,secondary];
for(const type of ['fire','cold','lightning','poison']){const cap=type[0].toUpperCase()+type.slice(1);pools[type+'Damage']=[['wand','staff','tome'],['charm','ring']];pools[type+'Resist']=[['shield','chest','feet','ring'],['helm','hands','charm']];pools[type+'Pen']=[['wand','staff','tome','charm'],[]];pools['flatAttack'+cap]=[['sword','greatsword','bow'],['hands','ring']];pools['flatSpell'+cap]=[['wand','staff','tome'],['charm','ring']];pools[type+'Skills']=[['charm'],[]];}
for(const type of ['Fire','Cold','Lightning','Poison'])pools['flat'+type]=[['sword','greatsword','bow','wand','staff','tome','hands','ring','charm'],[]];
pools.dotDamage=[['dagger','bow','wand','staff','hands','charm'],['ring']];
pools.manaRegen[0].push('wand');pools.manaCost[1].push('wand','staff');
pools.summonManaCost=[['wand','staff','tome','helm','charm'],[]];
pools.auraManaCost=[['charm','tome','cloak'],['helm','ring']];
 const skillWeapons=['dagger','sword','axe','greatsword','greataxe','bow','wand','staff'];
 const categorySkillAffixes=[
  ['damage','攻術','傷害',skillWeapons,['hands','charm']],
  ['basic','精武','普攻',['hands'],skillWeapons],
  ['summon','引靈','召喚',['staff','tome','helm'],['charm']],
  ['aura','環域','光環',['tome','cloak'],['charm']],
  ['curse','咒典','詛咒',['wand','tome','charm'],['helm']],
  ['warcry','號令','戰吼',['chest','shield'],['helm','charm']],
  ['movement','疾行','位移',['feet'],['hands','cloak']],
 ];
 for(const [category,name,label,primary,secondary] of categorySkillAffixes){
  const key=category+'Skills';
  AFFIXES[key]={name,label:label+'技能等級',min:1,max:1,grade:'rare',core:true,weight:3,skillCategory:category,minItemLevel:20};
  pools[key]=[[...primary],[...secondary]];
 }
// Offensive bonuses may roll on every form; original primary forms keep their higher weight.
export const OFFENSIVE_AFFIXES=['crit','haste','castSpeed','speedPct','summonDamage','summonHaste','summonSpeed','physicalDamage','attackDamage','spellDamage','dotDamage','lowLifeDamage','trapDamage','projectileDamage','bleedDamage','poisonDotDamage',...['fire','cold','lightning','poison'].flatMap(type=>{const cap=type[0].toUpperCase()+type.slice(1);return [type+'Damage',type+'Pen','flat'+cap];})];
const equipmentForms=[...Object.keys(WEAPON_TYPES),'helm','chest','hands','feet','charm','ring','cloak'];
pools.drop=[['hands','feet','ring','charm'],[]];pools.rarityFind=[['helm','hands','ring','charm'],[]];
for(const key of ['physicalDamage','attackDamage','manaLeech','manaOnHit','manaOnKill','leech'])for(const form of ['dagger','axe','greataxe'])if(!pools[key][0].includes(form))pools[key][0].push(form);
for(const key of [...OFFENSIVE_AFFIXES,'skillDmg',...['Fire','Cold','Lightning','Poison'].flatMap(t=>['flatAttack'+t,'flatSpell'+t])]){const [primary,secondary]=pools[key];secondary.push(...equipmentForms.filter(form=>!primary.includes(form)&&!secondary.includes(form)));}
for(const pool of Object.values(pools))for(const group of pool){if(group.includes('shield')&&!group.includes('towerShield'))group.push('towerShield');if(group.includes('bow')&&!group.includes('quiver'))group.push('quiver');if(group.includes('charm')&&!group.includes('cloak'))group.push('cloak');}
const prefixKeys=new Set(['blockReduction','skillArea','summonDamage','summonLife','physicalDamage','attackDamage','spellDamage','dotDamage','hpPct','mana','armor','skillDmg','physicalReduce',...['fire','cold','lightning','poison'].flatMap(t=>[t+'Damage','flat'+t[0].toUpperCase()+t.slice(1),'flatAttack'+t[0].toUpperCase()+t.slice(1),'flatSpell'+t[0].toUpperCase()+t.slice(1)])]);
for(const [key,d] of Object.entries(AFFIXES)){d.side=prefixKeys.has(key)?'prefix':'suffix';d.core=!!d.core||key==='summonCapacity'||key==='critMultiplier'||key==='allSkills'||key==='extraProjectiles'||!!d.aura||Object.hasOwn(TRIGGERS,key);if(key==='manaRegen'||key==='manaRegenPct')d.family='manaRegen';else if(key==='allSkills'||key.endsWith('Skills'))d.family='skillLevels';else d.family??=key;}
const itemForm=i=>typeof i==='string'?i:i?.weaponType??i?.slot;
const asItem=(i,level=1,rarity=4)=>typeof i==='object'&&i?i:{slot:WEAPON_TYPES[i]?.slot??i??'weapon',weaponType:Object.hasOwn(WEAPON_TYPES,i)?i:undefined,level,rarity};
const twoHanded=i=>i?.slot==='weapon'&&(WEAPON_TYPES[i.weaponType]?.hands===2||validatingLegacyCapacity&&i.weaponType==='bow');
export function affixGrade(key){return AFFIX_GRADES[AFFIXES[key]?.grade]??null;}
const itemLevel=level=>Math.max(1,Math.min(100,Math.floor(Number(level)||1)));
const randomUnit=rand=>{const n=Number(rand());if(!Number.isFinite(n))throw new Error('Invalid random value');return Math.max(0,Math.min(.999999999999,n));};
export function affixPool(item){const i=asItem(item),form=itemForm(i);return Object.keys(pools).filter(key=>{const d=AFFIXES[key];return !d.legacyOnly&&!d.uniqueOnly&&(!d.minItemLevel||i.level>=d.minItemLevel)&&pools[key].some(p=>p.includes(form))&&(i.slot!=='ring'||!d.core)&&!(key==='allResist'&&i.slot==='ring'&&i.level<70);});}
// Existing equipment is validated against its original families without rewriting
// records in character bags, stash or paid-run checkpoint snapshots.
function ownedAffixPool(item){const i=asItem(item),form=itemForm(i);return Object.keys(pools).filter(key=>{const d=AFFIXES[key];return !d.uniqueOnly&&pools[key].some(p=>p.includes(form))&&(i.slot!=='ring'||!d.core)&&!(key==='allResist'&&i.slot==='ring'&&i.level<70);});}
const COUNT_OPTIONS=[[1],[2,3],[3,4,5],[3,4,5,6],[4,5,6,7,8],[5,6,7,8,9]],COUNT_WEIGHTS=[[1],[.65,.35],[.5,.35,.15],[.35,.3,.25,.1],[.35,.3,.2,.1,.05],[.35,.3,.2,.1,.05]],TIER_WEIGHTS=[[0,0,.2,.35,.45],[0,.1,.3,.35,.25],[0,.2,.45,.25,.1],[.1,.35,.35,.15,.05],[.15,.45,.25,.1,.05],[.25,.45,.2,.08,.02]],TIER_FRACTIONS={1:[.9,1],2:[.75,.89],3:[.6,.74],4:[.45,.59],5:[.3,.44]};
function weightedPick(values,weights,rand){let roll=randomUnit(rand)*weights.reduce((n,w)=>n+w,0);for(let n=0;n<values.length;n++){roll-=weights[n];if(roll<0)return values[n];}return values.at(-1);}
function rollAffixCount(i,rand){return weightedPick(COUNT_OPTIONS[i.rarity],twoHanded(i)?COUNT_WEIGHTS[i.rarity].slice().reverse():COUNT_WEIGHTS[i.rarity],rand);}
export function affixCount(itemOrRarity,item){const i=typeof itemOrRarity==='object'?itemOrRarity:asItem(item,1,itemOrRarity),r=Math.max(0,Math.min(5,Math.floor(i.rarity)||0));return i.affixCount??COUNT_OPTIONS[r][0];}
function coreLimit(i){return [0,0,1,1,2,2][i.rarity]+(i.starterGrant&&i.rarity<2?1:0);}
function legalAffixes(i,affixes){const pool=ownedAffixPool(i),families=new Set(),keys=new Set(affixes.map(a=>a.key));let core=i.grantedSkill?1:0;const sides={prefix:i.grantedSkill?1:0,suffix:0},cap=Math.ceil(affixCount(i)/2);for(const a of affixes){const d=AFFIXES[a.key];if(!d||!pool.includes(a.key)||affixGrade(a.key).minRarity>i.rarity)return false;const shared=/^flat(Fire|Cold|Lightning|Poison)$/.exec(a.key);if(shared&&(keys.has('flatAttack'+shared[1])||keys.has('flatSpell'+shared[1])))return false;const family=d.family;if(families.has(family))return false;families.add(family);if(d.core)core++;sides[d.side]++;}return core<=coreLimit(i)&&sides.prefix<=cap&&sides.suffix<=cap;}
const charmRanges={lifeRegenPct:[.009,.016],mana:[60,100],manaRegen:[6,10],manaCost:[.1,.16],flatManaCost:[3,6],skillDuration:[.18,.28],skillArea:[.14,.22],summonDamage:[.26,.42],summonLife:[.35,.55],hpPct:[.1,.16],crit:[.07,.11],cdr:[.06,.1],allResist:[.1,.16],manaRegenPct:[.25,.45],manaLeech:[.015,.03],manaOnHit:[2,3],manaOnKill:[4,7],summonHaste:[.12,.2],summonSpeed:[.1,.18],skillDmg:[.15,.25],leech:[.006,.014],drop:[.18,.32],lifeRegen:[1.5,3],chargeGain:[.2,.3]};
function affixBudget(key,level,slotOrItem){const d=AFFIXES[key];if(!d)return null;level=itemLevel(level);const i=asItem(slotOrItem,level),slot=i.slot,precision=d.percent?1000:['lifeRegen','manaRegen'].includes(key)?10:1;
 if(key==='summonCapacity')return {min:1,max:2};if(key==='critMultiplier')return {min:3,max:3};if(key==='soulBond')return {min:1,max:1};if(key==='bossMana')return {min:2,max:4};if(key==='auraEffect')return {min:.15,max:.25};if(key.endsWith('Skills')&&key!=='allSkills')return {min:1,max:1};
 if(key==='allSkills'||key==='extraProjectiles'){const max=key==='allSkills'?((twoHanded(i)&&level>=70||slot==='charm'&&level>=70)?2:1):(twoHanded(i)&&level>=70?2:1);return {min:1,max};}if(d.aura)return {min:1,max:level<35?1:level<70?2:3};
 let range=slot==='charm'?charmRanges[key]:null;
 if(slot==='charm'&&key.endsWith('Pen'))range=[.06,.1];
 if(slot==='ring'){if(key==='mana')range=[25,45];else if(key==='manaOnHit')range=[1,2];else if(key==='hpPct')range=[.05,.09];else if(key.endsWith('Damage'))range=[.08,.14];else if(key.endsWith('Resist'))range=key==='allResist'?[.04,.07]:[.15,.25];}
 const scale=range?(.5+.01*level):(.72+.017*level),budget=(range?.[1]??d.max)*scale*(twoHanded(i)&&!d.core?1.5:1);return {min:0,max:Math.round(budget*precision)/precision};
}
function discreteTiers(key,level,i){if(key==='critMultiplier')return {1:3};if(key==='soulBond')return {2:1};if(key==='summonCapacity')return level>=70?{3:1,1:2}:{3:1};if(key==='allSkills'||key==='extraProjectiles'){const b=affixBudget(key,level,i).max;return b===2?{3:1,1:2}:{3:1};}if(key.endsWith('Skills'))return {3:1};if(AFFIXES[key]?.aura){return level>=70?{3:1,2:2,1:3}:level>=35?{3:1,1:2}:{3:1};}return null;}
export function affixRange(key,level,slotOrItem,tier){const d=AFFIXES[key];if(!d)return null;level=itemLevel(level);if(d.minItemLevel&&level<d.minItemLevel)return null;const i=asItem(slotOrItem,level),discrete=discreteTiers(key,level,i);if(discrete){if(tier!==undefined)return discrete[tier]===undefined?null:{min:discrete[tier],max:discrete[tier]};const values=Object.values(discrete);return {min:Math.min(...values),max:Math.max(...values)};}
 const band=level<25?0:level<50?1:level<75?2:3,findBudgets={drop:{hands:[8,10,12,14],feet:[8,10,12,14],ring:[6,8,10,12],charm:[10,14,18,22]},rarityFind:{helm:[14,20,28,36],hands:[10,16,22,28],ring:[12,18,24,30],charm:[20,28,38,48]}},B=findBudgets[key]?.[i.slot]?.[band]/100||affixBudget(key,level,i).max,precision=d.percent?1000:['lifeRegen','manaRegen'].includes(key)?10:1;
 if(tier===undefined)return {min:Math.ceil(B*.3*precision-1e-8)/precision,max:Math.floor(B*precision+1e-8)/precision};const f=TIER_FRACTIONS[tier];if(!f)return null;const min=Math.ceil(B*f[0]*precision-1e-8)/precision,max=Math.floor(B*f[1]*precision+1e-8)/precision;return min>max?null:{min,max};}
function legalTiers(key,i){return [1,2,3,4,5].filter(t=>TIER_WEIGHTS[i.rarity][t-1]>0&&affixRange(key,i.level,i,t));}
function rollAffix(key,level,rand,item,tier){const i=asItem(item,level);tier??=weightedPick(legalTiers(key,i),legalTiers(key,i).map(t=>TIER_WEIGHTS[i.rarity??4][t-1]),rand);const d=AFFIXES[key],r=affixRange(key,level,i,tier);if(!r)throw Error('No legal affix tier');const precision=d.percent?1000:['lifeRegen','manaRegen'].includes(key)?10:1,steps=Math.round((r.max-r.min)*precision);return {key,value:Math.round((r.min+Math.floor(randomUnit(rand)*(steps+1))/precision)*precision)/precision,tier};}
function completeAffixes(i,existing,rand){const out=existing.map(a=>({...a})),target=affixCount(i)-(i.grantedSkill?1:0),required=i.rarity===5?3:i.rarity===4?2:0;let missing=Math.max(0,required-out.filter(a=>a.tier===1&&!AFFIXES[a.key].core).length);
 // Upgrade existing ordinary families first when ascending, preserving their within-tier percentile.
 for(let n=0;n<out.length&&missing;n++){const a=out[n],d=AFFIXES[a.key];if(a.tier===1||d.core||!affixRange(a.key,i.level,i,1))continue;const from=affixRange(a.key,i.level,i,a.tier),to=affixRange(a.key,i.level,i,1),percentile=from.max===from.min?0:(a.value-from.min)/(from.max-from.min),p=d.percent?1000:['lifeRegen','manaRegen'].includes(a.key)?10:1;out[n]={...a,tier:1,value:Math.min(to.max,Math.max(to.min,Math.round((to.min+(to.max-to.min)*percentile)*p)/p))};missing--;}
 while(out.length<target){
  const mustT1=missing>0;
  const pool=affixPool(i).filter(key=>legalAffixes(i,[...out,{key,value:1}])&&legalTiers(key,i).length&&(!mustT1||!AFFIXES[key].core&&legalTiers(key,i).includes(1)));
  if(!pool.length)throw Error('No legal affix available');
  const foundation=out.length===0?pool.filter(key=>!AFFIXES[key].core&&campaignAffixWeight(i,key)>1&&legalTiers(key,i).some(tier=>tier<=3)):[];
  const candidates=foundation.length?foundation:pool;
  const weight=key=>{const d=AFFIXES[key],main=pools[key][0].includes(itemForm(i));return (d.weight??affixGrade(key).weight)*(main?10:3)*(key==='allResist'&&i.slot==='ring'?.2:1)*(i.level<=50&&['manaRegen','manaLeech','manaCost'].includes(key)?1.35:1)*campaignAffixWeight(i,key);};
  const key=weightedPick(candidates,candidates.map(weight),rand);
  const tiers=foundation.length?legalTiers(key,i).filter(tier=>tier<=3):[];
  const tier=mustT1?1:tiers.length?weightedPick(tiers,tiers.map(t=>TIER_WEIGHTS[i.rarity][t-1]),rand):undefined;
  out.push(rollAffix(key,i.level,rand,i,tier));
  if(mustT1)missing--;
 }
 if(missing)throw Error('T1 guarantee cannot be fulfilled');return out;}
export function rollAffixes(rarity,level,rand=Math.random,slotOrItem){const i={...asItem(slotOrItem,level,rarity),rarity,level};i.affixCount??=rollAffixCount(i,rand);return completeAffixes(i,[],rand);}
export function equipmentAuras(c){const levels={},chorus=setBonuses(c),chorusEffect=(chorus.counts.chorus??0)>=2?.15:0;for(const item of Object.values(c.equipment??{}))for(const a of effectiveEquippedAffixes(c,item)){const id=AFFIXES[a.key]?.aura;if(id&&a.value>0)levels[id]=Math.max(levels[id]??0,Math.min(3,Math.floor(a.value)));}if(c.equipment.cloak?.implicitAura&&chorus.active.includes('chorus')){const key=c.equipment.cloak.implicitAura,item=c.equipment.cloak,base=1+(item.level>=70?1:0)+(UNIQUES[item.uniqueID]?.auraLevelBonus??0);levels[key]=Math.max(levels[key]??0,Math.min(3,base+1));}return Object.entries(levels).filter(([,level])=>level>0).map(([id,level])=>{const d=AURAS[id];return {id,name:d.name,icon:d.icon,color:d.color,level,buff:Object.fromEntries(Object.entries(d.buff).map(([key,value])=>[key,value*level*(1+Math.min(1,equipmentAuraEffect(c)+chorusEffect))]))};});}
export function equipmentTriggers(c){const found=new Map();for(const item of Object.values(c.equipment??{}))for(const a of effectiveEquippedAffixes(c,item)){const d=TRIGGERS[a.key];if(!d||a.value<=0)continue;const level=Math.min(15,Math.max(1,Math.ceil((Number(item.level)||1)/8))),prev=found.get(a.key);found.set(a.key,{key:a.key,...d,chance:Math.min(.45,(prev?.chance??0)+a.value),level:Math.max(level,prev?.level??1)});}return [...found.values()];}
export function triggerAbility(c,id,level){if(!Object.values(TRIGGERS).some(t=>t.skill===id))return null;const ability=effectiveAbility(c,id,Math.max(1,Math.min(10,Math.floor(level)||1)),stats(c),0);return ability?{...ability,freeResource:true,cooldown:0,...(id==='r_poisonarrow'?{poisonCloud:true}:{}),...(ability.type==='charge'?{type:'projectile'}:{})}:null;}
export function skillManaCost(def,s){return resourceCost(def,s).mana;}
export function affixText(a){const d=AFFIXES[a.key];if(!d)return '';if(a.key==='allSkills')return d.label+' +'+Math.min(1,a.value);if(d.skillCategory)return d.label+' +'+a.value;if(a.key==='soulBond')return d.label;if(d.aura){const buffs=Object.entries(AURAS[d.aura].buff).map(([key,value])=>{const label=(AFFIXES[key]?.label??({reduce:'受到傷害減少'}[key]??key)).replace('（舊制）','');return `${label} +${AFFIXES[key]?.percent||key==='reduce'?Math.round(value*a.value*100)+'%':Math.round(value*a.value*10)/10}`;});return `${d.label} 等級 ${a.value}（穿戴生效：${buffs.join('、')}）`;}const t=TRIGGERS[a.key];if(t)return `${t.event==='attack'?'攻擊命中':'受到傷害'} ${Math.round(a.value*1000)/10}% 機率施放${ABILITIES[t.skill].name}（免費觸發，效果 ${Math.round(t.scale*100)}%）`;return `${d.label} +${d.percent?Math.round(a.value*1000)/10+'%':a.value}`;}
export function itemColor(item){return RARITIES[Math.min(5,item.rarity)]?.color??'#deded6';}
export const progressFor=CampaignProgress.progressFor,canDifficulty=CampaignProgress.canDifficulty,completeZone=CampaignProgress.completeZone;
export function setDifficulty(c,d){if(!canDifficulty(c,d))return false;c.difficulty=d;return true;}
export function dropChance(s,base=.025){const raw=s?.drop??0;if(!Number.isFinite(base)||!Number.isFinite(raw)||base<=0)return 0;const q=Math.max(0,raw);return Math.min(1,base*(1+q/(1+q))*Math.max(0,Math.min(1.4,Number.isFinite(s?.roomLootMultiplier)?s.roomLootMultiplier:1)));}
export function deposit(state,heroID,itemID,targetSlot=null){
 const c=state.characters[heroID];
 if(!c||state.stash.length+(state.flaskStash?.length??0)>=STASH_CAPACITY||state.stash.some(i=>i.id===itemID))return false;
 const index=c.bag.findIndex(i=>i.id===itemID);
 if(index<0)return false;
 const slots=stashSlots(state,STASH_CAPACITY),slot=targetSlot??slots.indexOf(null);
 if(!validStashSlot(slot,STASH_CAPACITY)||slots[slot]!==null)return false;
 state.stash.push(c.bag.splice(index,1)[0]);
 slots[slot]=itemID;
 saveStashSlots(state,slots);
 return true;
}
export function withdraw(state,heroID,itemID){
 const c=state.characters[heroID];
 if(!c||c.bag.length>=150||c.bag.some(i=>i.id===itemID)||Object.values(c.equipment).some(i=>i.id===itemID))return false;
 const index=state.stash.findIndex(i=>i.id===itemID);
 if(index<0)return false;
 const slots=stashSlots(state,STASH_CAPACITY),slot=slots.indexOf(itemID);
 if(slot<0)return false;
 c.bag.push(state.stash.splice(index,1)[0]);
 if(slot>=0)slots[slot]=null;
 saveStashSlots(state,slots);
 return true;
}
export function equipmentWhiteValues(i){return {power:['weapon','offhand','hands'].includes(i.slot)?i.power:0,hp:['charm','ring'].includes(i.slot)?0:i.hp,armor:['charm','ring'].includes(i.slot)?0:i.armor*armorMultiplier(i),crit:['charm','ring'].includes(i.slot)?0:(i.crit||0)};}
function validDedicatedLoadouts(c){
 if(!Array.isArray(c.skillSlots)||c.skillSlots.length!==3||c.skillSlots.some((id,i)=>id!==skillLoadout(c)[i]))return false;
 if(!Array.isArray(c.auraSkills)||c.auraSkills.length>Object.keys(ABILITIES).length||c.auraSkills.length!==auraLoadout(c).length)return false;
 if(!Object.hasOwn(c,'movementSkill')||c.movementSkill!==movementSkill(c))return false;
 if(!Object.hasOwn(c,'autoSkill')||c.autoSkill!==autoSkill(c))return false;
 if(!configObject(c.summonSkills)||Object.keys(c.summonSkills).length>Object.keys(ABILITIES).length)return false;
 const s=stats(c),defs=summonDefinitions(c,s);if(!planFrom(c,c.summonSkills,s,defs).valid)return false;
 if(!Array.isArray(c.summonState)||c.summonState.length>(ringHas(c,'x:summonarmy')?22:18))return false;const living={};
 for(const unit of c.summonState){if(!configObject(unit)||Object.keys(unit).length!==2||!Object.hasOwn(unit,'skill')||!Object.hasOwn(unit,'hp')||typeof unit.skill!=='string'||!Number.isFinite(unit.hp)||unit.hp<=0||unit.hp>1e9)return false;living[unit.skill]=(living[unit.skill]??0)+1;}
 return planFrom(c,living,s,defs).valid;
}
function validSystems(c,rules=21){
 if(c.equipmentStowIDs!==undefined&&(!Array.isArray(c.equipmentStowIDs)||c.equipmentStowIDs.length>2||new Set(c.equipmentStowIDs).size!==c.equipmentStowIDs.length||c.equipmentStowIDs.some(id=>typeof id!=='string'||!id.length||id.length>200)))return false;
 if(!Progression.validAchievements(c)||!PassiveTree.validPassiveNavigation(c)||!(validatingLegacyCapacity?PassiveTree.validLegacyPassives(c):PassiveTree.validPassives(c))||rules>=23&&!CampaignProgress.validCampaign(c))return false;
 if(rules>=21&&!GearRules.validAutoLootActions(c.autoLootActions))return false;
 if(rules>=21&&!GearRules.validAutoLootPolicy(c))return false;
 if(!c.setOptions||Object.keys(c.setOptions).length!==2||!['covenant','evolution'].every(k=>c.setOptions[k]===null||typeof c.setOptions[k]==='string'&&setOptionChoices(c,k).some(o=>o.id===c.setOptions[k])))return false;
 if(c.shrineBuff!==undefined&&!validShrineBuff(c.shrineBuff))return false;
 if(c.autoEnabled!==undefined&&typeof c.autoEnabled!=='boolean')return false;
 if(c.autoSkill!==undefined&&c.autoSkill!==null&&(typeof c.autoSkill!=='string'||!offensiveSkill(c.autoSkill)||c.skillSlots?.includes(c.autoSkill)))return false;
 if(c.pickupRarities!==undefined&&!validSaleRarities(c.pickupRarities))return false;
 if(c.sellRarities!==undefined&&!validSaleRarities(c.sellRarities))return false;
 if(c.equipmentSkillVersion!==undefined&&c.equipmentSkillVersion!==1)return false;
 if(c.buildVersion>=5&&!validTalents(c,rules))return false;
 if(c.buildVersion!==undefined&&(!Number.isInteger(c.buildVersion)||c.buildVersion<1||c.buildVersion>7))return false;
 if(c.buildVersion===7){if(!validDedicatedLoadouts(c))return false;}
 else if(c.buildVersion>=4){if(!Array.isArray(c.skillSlots)||c.skillSlots.length!==4||!c.skillSlots.every(id=>id===null||typeof id==='string'&&Object.hasOwn(ABILITIES,id)))return false;const ids=c.skillSlots.filter(id=>id!==null);if(new Set(ids).size!==ids.length)return false;}
 if(c.progress!==undefined){if(!c.progress||typeof c.progress!=='object'||Array.isArray(c.progress))return false;for(const d of ['1','2','3']){const a=c.progress[d];if(!Array.isArray(a)||a.length>(rules===19?5:ROOMS.length)||new Set(a).size!==a.length||!a.every(r=>Number.isInteger(r)&&r>=0&&r<(rules===19?5:ROOMS.length)))return false;}}
 return true;
}

function uniqueOwnedItems(state){
 const ownedBy=c=>[...c.bag,...c.pendingLoot,...c.groundLoot,...Object.values(c.equipment),...c.flaskItems.filter(Boolean),...c.flaskBag];
 const checkpoint=state.rifts?.activeRun?.checkpoint?.hero;
 const shared=[...state.stash,...(state.flaskStash??[])],other=[];
 for(const c of Object.values(state.characters)){
  if(c.id===checkpoint?.id)continue;
  other.push(...ownedBy(c));
 }
 const all=[...shared,...other];
 const unique=items=>new Set(items.map(item=>item.id)).size===items.length;
 return checkpoint
  ?unique([...all,...ownedBy(state.characters[checkpoint.id])])&&unique([...all,...ownedBy(checkpoint)])
  :unique(all);
}

function validTalents(c,rules=21){if(!c.talents||typeof c.talents!=='object'||Array.isArray(c.talents))return false;
 if(isRingHero(c)){
  if(Object.keys(c.passives??{}).length||c.lastPassiveNode!==undefined||!Progression.validRingLegacyCredits(c)||!validCurrentRing(c,Progression.ringAchievementPoints(c)))return false;
  return matchingRingTalents(c.talents,ringBenefits(c).talents);
 }
 if(c.ringOrigin!==undefined)return false;
 if(c.ring!==undefined||c.lastRingNode!==undefined||c.ringLegacyCredit!==undefined||c.ringGrandfathered!==undefined||c.ringRetainedV84!==undefined)return false;let spent=0;for(const [id,rank] of Object.entries(c.talents)){const n=c.buildVersion===5&&c.cls==='warrior'?[...TREES.warrior[0],...TREES.warrior[1],...oldWarriorAuraPage].find(n=>n.id===id):skillNode(c.cls,id);if(!n||c.shadowStrikeRetired&&id==='a_stab'||!Number.isInteger(rank)||rank<0||rank>Math.max(0,Math.min(n.max,c.level-n.reqLevel+1))||rank>0&&!n.prevs.every(p=>c.talents[p]>0||c.shadowStrikeRetired&&p==='a_stab'))return false;spent+=rank;}return spent<=pointBudget(c)-(rules===19?1:0);}

function validSaleRarities(rarities){return Array.isArray(rarities)&&rarities.length<=6&&new Set(rarities).size===rarities.length&&rarities.every(r=>Number.isInteger(r)&&r>=0&&r<=5);}
export function setSellRarities(c,rarities){if(!validSaleRarities(rarities))return false;c.sellRarities=[...rarities];return true;}
export function setItemLocked(profile,heroID,itemID,locked){const c=profile.characters[heroID];if(!c||typeof locked!=='boolean')return false;const item=[...c.bag,...Object.values(c.equipment),...(profile.stash??[])].find(i=>i.id===itemID);if(!item)return false;item.locked=locked;return true;}
export function itemSellValue(item){return Math.max(1,Math.round(6+item.level*2+item.rarity*10+(item.upgrade||0)*8));}
export function sell(c,id){const index=c.bag.findIndex(i=>i.id===id);if(index<0||c.bag[index].locked||c.bag[index].sockets?.some(Boolean))return false;const [item]=c.bag.splice(index,1);c.gold+=itemSellValue(item);return true;}
export function salePreview(c,rarities=c.sellRarities??[0,1],includeValuable=false){if(!validSaleRarities(rarities))return null;const result={count:0,gold:0,skippedLocked:0,skippedSocketed:0,skippedValuable:0};for(const item of c.bag)if(rarities.includes(item.rarity)){if(item.locked)result.skippedLocked++;else if(item.sockets?.some(Boolean))result.skippedSocketed++;else if(!includeValuable&&(item.rarity>=4||item.set||item.uniqueID))result.skippedValuable++;else{result.count++;result.gold+=itemSellValue(item);}}return result;}
export function sellByRarity(c,rarities=c.sellRarities??[0,1],includeValuable=false){const result=salePreview(c,rarities,includeValuable);if(!result)return null;c.bag=c.bag.filter(item=>item.locked||item.sockets?.some(Boolean)||!rarities.includes(item.rarity)||!includeValuable&&(item.rarity>=4||item.set||item.uniqueID));c.gold+=result.gold;return result;}

// Flask equipment remains separate from armor and only supplies effects while used.
export const FLASK_PREFIXES={
 efficient:{name:'節儉',label:'充能消耗降低',min:.15,max:.3,percent:true,modifier:'cost'},
 enduring:{name:'悠長',label:'持續時間提高',min:.2,max:.4,percent:true,modifier:'duration'},
 potent:{name:'強效',label:'藥水基礎效果提高',min:.15,max:.3,percent:true,modifier:'effect'},
 ample:{name:'豐盈',label:'最大充能',min:10,max:20,integer:true,modifier:'maxCharges'}
};
export const FLASK_SUFFIXES={
 celerity:{name:'迅法',label:'攻擊與施法速度',min:.08,max:.16,percent:true,buff:{haste:1,castSpeed:1}},
 ward:{name:'護甲',label:'護甲',min:20,max:45,integer:true,buff:{armor:1}},
 focus:{name:'專注',label:'魔力消耗降低',min:.08,max:.15,percent:true,buff:{manaCost:1}},
 summoner:{name:'統御',label:'召喚物傷害',min:.15,max:.3,percent:true,buff:{summonDamage:1}},
 clarity:{name:'清明',label:'每秒回魔',min:2,max:5,buff:{manaRegen:1}},
 guardian:{name:'堅守',label:'受到傷害降低',min:.06,max:.11,percent:true,buff:{reduce:1}},
 arcana:{name:'秘法',label:'法術傷害提高',min:.10,max:.18,percent:true,buff:{spellDamage:1}},
 assault:{name:'猛攻',label:'攻擊傷害提高',min:.10,max:.18,percent:true,buff:{attackDamage:1}},
 warding:{name:'抗魔',label:'法術減傷',min:.08,max:.16,percent:true,buff:{resist:1}}
};
function flaskRollRange(def,level){const scale=def.modifier==='maxCharges'?1:.8+.004*level,precision=def.integer?1:def.percent?1000:10;return {min:Math.round(def.min*scale*precision)/precision,max:Math.round(def.max*scale*precision)/precision,precision};}
function rollFlaskAffix(definitions,level,rand){const keys=Object.keys(definitions),key=keys[Math.floor(randomUnit(rand)*keys.length)],r=flaskRollRange(definitions[key],level);return {key,value:Math.round((r.min+(r.max-r.min)*randomUnit(rand))*r.precision)/r.precision};}
function starterFlask(owner,type,position){return {id:`flask-${owner}-${position}-${type}`,type,level:1,quality:0,rarity:0,prefix:null,suffix:null,locked:false};}
const flaskType=item=>item?.type??null;
function normalizeFlaskGear(hero){
 const types=hero.flasks;
 hero.flaskItems=Array.from({length:FLASK_SLOT_COUNT},(_,index)=>types[index]?starterFlask(hero.id,types[index],'belt-'+index):null);
 hero.flasks=hero.flaskItems.map(flaskType);
 hero.flaskBag=Object.keys(FLASKS).filter(type=>!types.includes(type)).slice(0,4).map(type=>starterFlask(hero.id,type,'collection'));
}
function migrateLegacyFlaskBelt(hero){
 const {flaskItems,flasks}=hero;
 if(!Array.isArray(flaskItems)||!Array.isArray(flasks)||flaskItems.length!==LEGACY_FLASK_SLOT_COUNT||
   flasks.length!==LEGACY_FLASK_SLOT_COUNT||!flaskItems.every((item,index)=>validFlaskItem(item)&&item.type===flasks[index]))return;
 flaskItems.push(null);flasks.push(null);
}
function validFlaskGear({flaskItems,flasks,flaskBag}){
 if(!Array.isArray(flaskItems)||flaskItems.length!==FLASK_SLOT_COUNT||!Array.isArray(flasks)||flasks.length!==FLASK_SLOT_COUNT||
   !Array.isArray(flaskBag)||flaskBag.length>36||!flaskBag.every(validFlaskItem))return false;
 for(const [index,item] of flaskItems.entries()){
  if((item!==null&&!validFlaskItem(item))||flasks[index]!==flaskType(item))return false;
 }
 return true;
}
export function makeFlask(type,level=1,rand=Math.random,magic=true){if(!Object.hasOwn(FLASKS,type))return null;level=itemLevel(level);return {id:'flask-'+(globalThis.crypto?.randomUUID?.()??Date.now().toString(36)+'-'+(++seq)),type,level,quality:0,rarity:magic?1:0,prefix:magic?rollFlaskAffix(FLASK_PREFIXES,level,rand):null,suffix:magic?rollFlaskAffix(FLASK_SUFFIXES,level,rand):null,locked:false};}
export function flaskForItem(item){
 if(!item||!Object.hasOwn(FLASKS,item.type))return null;
 const base=FLASKS[item.type],quality=Math.max(0,Math.min(20,item.quality??0)),prefix=item.prefix,suffix=item.suffix,potency=1+(prefix?.key==='potent'?prefix.value:0),recovery=base.hp!==undefined||base.mp!==undefined;
 const def={...base,item,id:item.id,type:item.type,name:[prefix?FLASK_PREFIXES[prefix.key]?.name:null,base.name,suffix?'之'+FLASK_SUFFIXES[suffix.key]?.name:null].filter(Boolean).join(''),level:item.level,quality,rarity:item.rarity,cost:Math.max(1,Math.ceil(base.cost*(1-(prefix?.key==='efficient'?prefix.value:0)))),duration:base.duration*(1+(prefix?.key==='enduring'?prefix.value:0))*(recovery?1:1+quality/100),maxCharges:60+(prefix?.key==='ample'?prefix.value:0),buff:Object.fromEntries(Object.entries(base.buff??{}).map(([key,value])=>[key,value*potency]))};
 def.baseBuff={...def.buff};def.suffixBuff={};def.suffixKey=suffix?.key??null;
 for(const key of ['hp','mp','instantHP','instantMP'])if(base[key]!==undefined)def[key]=base[key]*potency*(1+quality/100);
 if(suffix&&FLASK_SUFFIXES[suffix.key])for(const [key,mult] of Object.entries(FLASK_SUFFIXES[suffix.key].buff)){def.suffixBuff[key]=suffix.value*mult;def.buff[key]=(def.buff[key]??0)+def.suffixBuff[key];}
 delete def.buff.critDmg;return def;
}
export function flaskDefinition(c,index){return isFlaskSlot(index)?flaskForItem(c.flaskItems?.[index]):null;}
export function findFlask(c,id){return [...(c.flaskItems??[]),...(c.flaskBag??[])].find(i=>i&&i.id===id)??null;}
export function equipFlask(c,id,slot){
 if(!isFlaskSlot(slot)||!Array.isArray(c.flaskItems)||c.flaskItems.length!==FLASK_SLOT_COUNT||!Array.isArray(c.flaskBag))return false;
 const index=c.flaskBag.findIndex(i=>i.id===id);
 if(index<0)return false;
 const old=c.flaskItems[slot];
 c.flaskItems[slot]=c.flaskBag[index];
 if(old)c.flaskBag[index]=old;
 else c.flaskBag.splice(index,1);
 c.flasks=c.flaskItems.map(flaskType);
 return true;
}
export function upgradeFlask(c,id){const item=findFlask(c,id);if(!item||item.quality>=20||c.shards<8)return false;c.shards-=8;item.quality=Math.min(20,item.quality+5);return true;}
export function rerollFlask(c,id,rand=Math.random){const item=findFlask(c,id);if(!item||item.locked||c.shards<15)return false;let prefix,suffix;try{prefix=rollFlaskAffix(FLASK_PREFIXES,item.level,rand);suffix=rollFlaskAffix(FLASK_SUFFIXES,item.level,rand);}catch{return false;}c.shards-=15;item.rarity=1;item.prefix=prefix;item.suffix=suffix;return true;}
export function setFlaskLocked(c,id,locked){const item=findFlask(c,id);if(!item||typeof locked!=='boolean')return false;item.locked=locked;return true;}
export function salvageFlask(c,id){const index=c.flaskBag?.findIndex(i=>i.id===id)??-1;if(index<0||c.flaskBag[index].locked)return false;const [item]=c.flaskBag.splice(index,1);c.shards+=4+item.rarity*4+Math.floor(item.quality/5);return true;}
export function flaskSalePreview(c,ids){
 if(!Array.isArray(ids)||Array.from(ids).some(id=>typeof id!=='string')||new Set(ids).size!==ids.length)return null;
 const selected=new Set(ids),equipped=new Set((c.flaskItems??[]).filter(Boolean).map(item=>item.id));
 const sale=(c.flaskBag??[]).filter(item=>selected.has(item.id)&&!item.locked&&!equipped.has(item.id));
 return {count:sale.length,gold:sale.reduce((sum,item)=>sum+itemSellValue(item)+item.quality,0),ids:sale.map(item=>item.id)};
}
export function sellFlasks(c,ids){
 const sale=flaskSalePreview(c,ids);
 if(!sale?.count||c.gold+sale.gold>1e12)return null;
 const sold=new Set(sale.ids);
 c.flaskBag=c.flaskBag.filter(item=>!sold.has(item.id));
 c.gold+=sale.gold;
 return sale;
}
function validFlaskAffix(affix,definitions,level){if(!affix||typeof affix!=='object'||!Object.hasOwn(definitions,affix.key)||!Number.isFinite(affix.value))return false;const def=definitions[affix.key],range=flaskRollRange(def,level);return affix.value>=range.min&&affix.value<=range.max&&(!def.integer||Number.isInteger(affix.value));}
function validFlaskItem(item){return item&&typeof item==='object'&&typeof item.id==='string'&&item.id.length>0&&item.id.length<=200&&Object.hasOwn(FLASKS,item.type)&&Number.isInteger(item.level)&&item.level>=1&&item.level<=100&&Number.isInteger(item.quality)&&item.quality>=0&&item.quality<=20&&[0,1].includes(item.rarity)&&typeof item.locked==='boolean'&&(item.rarity===0?item.prefix===null&&item.suffix===null:validFlaskAffix(item.prefix,FLASK_PREFIXES,item.level)&&validFlaskAffix(item.suffix,FLASK_SUFFIXES,item.level));}
export function salvagePreview(c,rarities=c.sellRarities??[0,1],includeValuable=false){if(!validSaleRarities(rarities))return null;const result={count:0,shards:0,skippedLocked:0,skippedSocketed:0,skippedValuable:0};for(const item of c.bag)if(rarities.includes(item.rarity)){if(item.locked)result.skippedLocked++;else if(item.sockets?.some(Boolean))result.skippedSocketed++;else if(!includeValuable&&(item.rarity>=4||item.set||item.uniqueID))result.skippedValuable++;else{result.count++;result.shards+=2+item.rarity*3;}}return result;}
export function salvageByRarity(c,rarities=c.sellRarities??[0,1],includeValuable=false){const result=salvagePreview(c,rarities,includeValuable);if(!result)return null;c.bag=c.bag.filter(item=>item.locked||item.sockets?.some(Boolean)||!rarities.includes(item.rarity)||!includeValuable&&(item.rarity>=4||item.set||item.uniqueID));c.shards+=result.shards;return result;}

export const MATERIALS={enhance:{name:'強化石',description:'+11至+20強化使用；額外每顆提高5百分點成功率。'},chisel:{name:'打孔鑿',description:'每件一生一次，確定增加一孔。'},ascend:{name:'升華石',description:'提升一色，保留原詞條並增加合法詞條。'},reforge:{name:'重鑄石',description:'重抽普通詞條種類與數值，保留底材、技能及孔。'},reroll:{name:'重塑砂',description:'只重擲既有詞條的數值，可能變差。'},respec:{name:'返脈石',description:`在營地消耗一顆，退回已投入的天賦點。通關${DIFFICULTIES[1].name}${chapterDefinition(2).name}後可向印記收藏家兌換。`}};
const gemDef=(name,description,family,slots)=>({name,description,family,slots,maxTier:3,minLevels:[1,20,50]});
export const GEMS={
 obsidian:gemDef('黑曜石','武器／手套：物理提高；防具／盾：護甲。','obsidian',['weapon','offhand','helm','chest','hands','feet']),
 fire:gemDef('火焰石','武器／法書／手套：追加火傷；防具／盾：火抗。','fire',['weapon','offhand','helm','chest','hands','feet']),
 cold:gemDef('冰霜石','武器／法書／手套：追加冰傷；防具／盾：冰抗。','cold',['weapon','offhand','helm','chest','hands','feet']),
 lightning:gemDef('閃電石','武器／法書／手套：追加雷傷；防具／盾：雷抗。','lightning',['weapon','offhand','helm','chest','hands','feet']),
 poison:gemDef('毒素石','武器／法書／手套：追加毒傷；防具／盾：毒抗。','poison',['weapon','offhand','helm','chest','hands','feet']),
 clarity:gemDef('澄明石','最大魔力與每秒回魔。','clarity',['weapon','offhand','helm','chest','hands','feet','charm']),
 soul:gemDef('靈魂石','召喚物傷害與生命。','soul',['helm','chest','charm','offhand','weapon']),
 wind:gemDef('疾風石','角色移動速度；只能鑲於鞋子。','wind',['feet']),
 agility:gemDef('靈巧攻石','攻擊速度；限近戰武器、弓、手套。','agility',['weapon','hands']),
 casting:gemDef('靈巧法石','施法速度；限短杖、長法杖、法書、手套。','agility',['weapon','offhand','hands'])
};
for(const gem of Object.values(GEMS))if(gem.slots.includes('chest'))gem.slots.push('cloak');GEMS.agility.slots.push('offhand');
const safeCount=n=>Number.isSafeInteger(n)&&n>=0&&n<=1e9;
export function makeGem(key,tier=1){return Object.hasOwn(GEMS,key)&&Number.isInteger(tier)&&tier>=1&&tier<=GEMS[key].maxTier?{key,tier}:null;}
export function canSocketGem(item,gem){const d=GEMS[gem?.key],specialRing=item?.slot==='ring'&&!!UNIQUES[item.uniqueID]?.socketCap&&['fire','cold','lightning','poison','clarity'].includes(gem?.key);if(!d||!makeGem(gem.key,gem.tier)||(!d.slots.includes(item.slot)&&!specialRing)||item.level<d.minLevels[gem.tier-1])return false;if(item.slot==='charm'&&!['clarity','soul'].includes(gem.key))return false;if(gem.key==='agility'&&item.slot!=='hands'&&!['dagger','axe','greataxe','sword','greatsword','bow','quiver'].includes(item.weaponType))return false;if(gem.key==='casting'&&item.slot!=='hands'&&!['wand','staff','tome'].includes(item.weaponType))return false;if(gem.key==='soul'&&['weapon','offhand'].includes(item.slot)&&!['staff','tome'].includes(item.weaponType))return false;const pool=affixPool(item);return baseGemEffects(item,gem).some(a=>pool.includes(a.key));}
function baseGemEffects(item,gem){const scale=[1,1.5,2.2,3.2,4.5][gem.tier-1],a=(key,value)=>({key,value:Math.round(value*scale*1000)/1000}),offense=item.slot==='weapon'||item.slot==='hands'||['tome','quiver'].includes(item.weaponType);if(['fire','cold','lightning','poison'].includes(gem.key))return [a(offense?'flat'+gem.key[0].toUpperCase()+gem.key.slice(1):gem.key+'Resist',offense?4:.06)];if(gem.key==='obsidian')return [a(offense?'physicalDamage':'armor',offense?.06:8)];if(gem.key==='clarity')return [a('mana',10),a('manaRegen',.5)];if(gem.key==='soul')return [a('summonDamage',.07),a('summonLife',.09)];return [a(gem.key==='wind'?'speedPct':gem.key==='agility'?'haste':'castSpeed',gem.key==='wind'?.04:.05)];}
export function gemEffects(item,gem){if(!canSocketGem(item,gem))return [];const pool=affixPool(item);return baseGemEffects(item,gem).filter(a=>pool.includes(a.key));}
const DUAL_OFFENSE=new Set(['atkPct','haste','castSpeed','crit','leech','manaLeech','manaOnHit','skillDmg','attackDamage','spellDamage','summonDamage','summonHaste','summonCrit','damageBonus','auraDamage','skillArea','extraProjectiles','pierce']);
export function effectiveEquippedAffixes(c,item){const stance=dualState(c);if(!stance.dual||item.slot!=='weapon')return itemAffixes(item);const raw=itemAffixes({...item,sockets:(item.sockets||[]).slice(0,stance.socketLimitPerWeapon)}),scale=item===c.equipment.offhand?stance.offhandAffixScale:stance.affixScale;return raw.map(a=>DUAL_OFFENSE.has(a.key)||/^(flat|proc)/.test(a.key)||/(Damage|Pen)$/.test(a.key)?{...a,value:a.value*scale}:a);}
export function itemAffixes(item){const intrinsic=item.slot==='cloak'&&item.implicitAura?[{key:{clarity:'auraClarity',war:'auraWar',ward:'auraWard',hunt:'auraHunt'}[item.implicitAura],value:Math.min(3,1+(item.level>=70?1:0)+(UNIQUES[item.uniqueID]?.auraLevelBonus??0))}]:[];return [...intrinsic,...(item.affixes??[]),...(item.sockets??[]).filter(Boolean).flatMap(g=>gemEffects(item,g))];}
export function findCraftItem(profile,heroID,itemID){const c=profile.characters?.[heroID];return c?[...c.bag,...Object.values(c.equipment),...(profile.stash??[])].find(i=>i.id===itemID)??null:null;}
const emptyCost=()=>({gold:0,shards:0,material:null,amount:0});
export function craftPreview(profile,heroID,itemID,action,options={}){
 const c=profile.characters?.[heroID],i=findCraftItem(profile,heroID,itemID),cost=emptyCost(),fail=reason=>({ok:false,reason,cost,description:''});if(!c||!i)return fail('找不到此裝備。');if(i.locked)return fail('請先解除裝備鎖定。');let description='';
 if(action==='socket'){if(i.socketCrafted)return fail('此裝備已使用過打孔鑿。');if(i.sockets.length>=i.socketCap)return fail('已達孔數上限。');Object.assign(cost,{gold:50+i.level*5,material:'chisel',amount:1});description=`確定增加 1 孔：${i.sockets.length} → ${i.sockets.length+1}；此後不可再次打孔。`;}
 else if(action==='ascend'){if(i.uniqueID||i.set||i.rarity>=4)return fail('只能升華未達紅色的普通裝備。');Object.assign(cost,{gold:(i.rarity+1)*100+i.level*8,material:'ascend',amount:[1,3,8,20][i.rarity]});const base=generatedBase(i.slot,i.rarity+1,i.level,i.weaponType),range=COUNT_OPTIONS[i.rarity+1];description=`升為${RARITIES[i.rarity+1].name}；威力 ${i.power} → ${base.power}、生命 ${i.hp} → ${base.hp}、護甲 ${i.armor} → ${base.armor}；保留原詞條，新色總數 ${Math.max(i.affixCount,range[0])}–${range.at(-1)} 條；履行新色T1保底。`;}
 else if(action==='reforge'){if(i.uniqueID)return fail('獨特裝備不可重鑄。');Object.assign(cost,{gold:50+i.level*3,material:'reforge',amount:1});description='重新抽取全部普通詞條種類及數值；保留底材、授予技能、套裝與所有孔及寶石。';}
 else if(action==='reroll'){if(!i.affixes.length)return fail('此裝備沒有可重塑詞條。');Object.assign(cost,{gold:30+i.level*2,material:'reroll',amount:1});description='只重擲現有詞條的數值，種類與數量不變，結果可能變差。';}
 else if(action==='insert'){const gem=makeGem(options.gemKey,options.tier),index=options.socketIndex;if(!Number.isInteger(index)||index<0||index>=i.sockets.length||i.sockets[index]!==null)return fail('請選擇空孔。');if(!gem||!canSocketGem(i,gem))return fail('寶石部位或裝備等級不符。');if(i.sockets.some(g=>g&&GEMS[g.key].family===GEMS[gem.key].family))return fail('同件裝備不能重複寶石家族。');if(!(profile.gems?.[gem.key+':'+gem.tier]>0))return fail('沒有這顆寶石。');description=`鑲入${GEMS[gem.key].name} ${gem.tier} 級，確定取得所列效果。`;}
 else if(action==='remove'){const index=options.socketIndex;if(!Number.isInteger(index)||index<0||index>=i.sockets.length||!i.sockets[index])return fail('請選擇已有寶石的孔。');cost.shards=2+i.sockets[index].tier;description='完整拆回此寶石，保留孔與打孔使用紀錄。';}
 else return fail('未知的製作操作。');
 if(c.gold<cost.gold)return fail('金幣不足。');if(c.shards<cost.shards)return fail('碎晶不足。');if(cost.material&&(profile.materials?.[cost.material]??0)<cost.amount)return fail(`${MATERIALS[cost.material].name}不足。`);return {ok:true,reason:'',cost,description};
}
export function craftItem(profile,heroID,itemID,action,options={},rand=Math.random){const preview=craftPreview(profile,heroID,itemID,action,options);if(!preview.ok)return {ok:false,reason:preview.reason};const c=profile.characters[heroID],item=findCraftItem(profile,heroID,itemID),next=structuredClone(item),gems={...profile.gems};try{
 if(action==='socket'){next.socketCrafted=true;next.sockets.push(null);}
 else if(action==='ascend'){next.rarity++;next.affixCount=Math.max(next.affixCount,rollAffixCount(next,rand));const base=generatedBase(next.slot,next.rarity,next.level,next.weaponType);for(const k of ['power','hp','armor','crit'])next[k]=base[k];next.affixes=completeAffixes(next,next.affixes,rand);}
 else if(action==='reforge')next.affixes=rollAffixes(next.rarity,next.level,rand,next);
 else if(action==='reroll')next.affixes=next.affixes.map(a=>rollAffix(a.key,next.level,rand,next,a.tier));
 else if(action==='insert'){const gem=makeGem(options.gemKey,options.tier);gems[gem.key+':'+gem.tier]--;next.sockets[options.socketIndex]=gem;}
 else if(action==='remove'){const gem=next.sockets[options.socketIndex],key=gem.key+':'+gem.tier;if(!safeCount((gems[key]??0)+1))throw Error('Resource overflow');gems[key]=(gems[key]??0)+1;next.sockets[options.socketIndex]=null;}
 }catch{return {ok:false,reason:'製作未完成，未扣除任何資源。'};}
 const cost=preview.cost;c.gold-=cost.gold;c.shards-=cost.shards;if(cost.material)profile.materials[cost.material]-=cost.amount;profile.gems=gems;Object.assign(item,next);reconcileSkillLoadouts(c);return {ok:true,reason:''};}
export function combineGems(profile,key,tier,heroID){const gem=makeGem(key,tier),c=profile.characters?.[heroID],id=key+':'+tier,next=key+':'+(tier+1),gold=50*tier*tier;if(!gem||tier>=GEMS[key].maxTier||!c)return {ok:false,reason:'無法合成此寶石。'};if((profile.gems[id]??0)<3)return {ok:false,reason:'需要三顆同級寶石。'};if(c.gold<gold)return {ok:false,reason:'金幣不足。'};if(!safeCount((profile.gems[next]??0)+1))return {ok:false,reason:'寶石數量超過上限。'};c.gold-=gold;profile.gems[id]-=3;profile.gems[next]=(profile.gems[next]??0)+1;return {ok:true,reason:''};}
export function rollResourceLoot(type,level=1,diff=1,rand=Math.random,summoned=false){if(summoned)return {gold:0,materials:[],gems:[]};const kind=type==='boss'?'boss':type==='miniboss'?'miniboss':type==='elite'?'elite':'normal',ranges={normal:[3,8],elite:[12,20],miniboss:[40,60],boss:[100,140]},[lo,hi]=ranges[kind],gold=Math.round((lo+Math.floor(randomUnit(rand)*(hi-lo+1)))*(1+(itemLevel(level)-1)*.04)*({1:1,2:1.3,3:1.6}[diff]??1)),materials=[],gems=[];
 const material=()=>{const r=randomUnit(rand),key=kind==='miniboss'?(r<.3?'reforge':r<.6?'reroll':r<.9?'chisel':'ascend'):(r<.45?'reforge':r<.8?'reroll':r<.95?'chisel':'ascend');const entry=materials.find(m=>m.key===key);if(entry)entry.count++;else materials.push({key,count:1});};
 const difficultyMult=({1:1,2:1.2,3:1.4}[diff]??1);if(kind==='miniboss')material();else if(kind==='boss'){material();if(randomUnit(rand)<.25*difficultyMult)material();}else if(randomUnit(rand)<(kind==='elite'?.08:.008)*difficultyMult)material();
 if(randomUnit(rand)<(kind==='miniboss'?.25:({normal:.0025,elite:.03,boss:.2}[kind])*difficultyMult)){const keys=Object.keys(GEMS),key=keys[Math.floor(randomUnit(rand)*keys.length)];gems.push({key,tier:kind==='miniboss'&&diff>1?2:1,count:1});}if(kind==='boss'||kind==='miniboss'||randomUnit(rand)<Math.min(1,(kind==='elite'?.15:.02)*difficultyMult))materials.push({key:'enhance',count:kind==='boss'?2+Math.floor(randomUnit(rand)*3):kind==='miniboss'?1+Math.floor(randomUnit(rand)*2):1});return {gold,materials,gems};}
export function addResourceLoot(profile,reward){const materials={...profile.materials},gems={...profile.gems};for(const m of reward?.materials??[]){if(!Object.hasOwn(MATERIALS,m.key)||!safeCount(m.count)||!safeCount((materials[m.key]??0)+m.count))return false;materials[m.key]=(materials[m.key]??0)+m.count;}for(const g of reward?.gems??[]){if(!makeGem(g.key,g.tier)||!safeCount(g.count))return false;const key=g.key+':'+g.tier;if(!safeCount((gems[key]??0)+g.count))return false;gems[key]=(gems[key]??0)+g.count;}profile.materials=materials;profile.gems=gems;return true;}
export function claimFirstClearReward(profile,c,diff=c?.difficulty??1){if(!c||![1,2,3].includes(diff)||profile.rewards?.firstClears?.[String(diff)]||profile.weaponChoices?.[String(diff)]!==0)return false;const type=weaponDefinition(c.equipment?.weapon,c.cls).kind,gem=type==='spell'?'clarity':type==='ranged'?'fire':'obsidian',reward={gold:0,materials:[{key:'chisel',count:1}],gems:[{key:gem,tier:1,count:1}]};if(!addResourceLoot(profile,reward))return false;profile.rewards.firstClears??={'1':false,'2':false,'3':false};profile.rewards.firstClears[String(diff)]=true;profile.rewards.firstClear=true;profile.weaponChoices[String(diff)]=1;return reward;}

export function claimPendingLoot(c,id=null){const fail=reason=>({ok:false,count:0,reason});if(!Array.isArray(c?.pendingLoot)||!Array.isArray(c.bag))return fail('待領裝備格式無效。');const owned=[...c.bag,...Object.values(c.equipment??{}),...c.pendingLoot,...(c.groundLoot??[])];if(new Set(owned.map(i=>i.id)).size!==owned.length||!c.pendingLoot.every(validItem))return fail('待領裝備有重複或無效物品。');const room=150-c.bag.length;if(room<=0)return fail('背包已滿。');const selected=id===null?c.pendingLoot.slice(0,room):c.pendingLoot.filter(i=>i.id===id);if(!selected.length)return fail('沒有可領取的裝備。');const ids=new Set(selected.map(i=>i.id));c.bag.push(...selected);c.pendingLoot=c.pendingLoot.filter(i=>!ids.has(i.id));return {ok:true,count:selected.length};}

export function claimFirstClearWeapon(profile,heroID,diff,weaponType,rand=Math.random){const fail=reason=>({ok:false,reason}),c=profile.characters?.[heroID];if(!c||![1,2,3].includes(diff)||!['sword','greatsword','bow','wand','staff'].includes(weaponType))return fail('武器選擇無效。');if(profile.weaponChoices?.[String(diff)]!==1)return fail('此難度沒有待選首通武器。');if(c.bag.length>=150)return fail('背包已滿，請先整理。');let item;try{item=makeItem(c,diff,rand,{rarity:2,slot:'weapon',weaponType,room:ROOMS.length-1,level:rewardItemLevel(c,diff)});if(!validItem(item))return fail('無法建立合法武器。');}catch{return fail('武器未領取，選擇次數已保留。');}profile.weaponChoices[String(diff)]=0;c.bag.push(item);return {ok:true,item};}

// Independent character progression: achievements grant skill points, passives spend a separate level budget.
export const ACHIEVEMENTS=Progression.ACHIEVEMENTS;
export const PASSIVE_NODES=PassiveTree.PASSIVE_NODES;
export const PASSIVE_BRANCHES=PassiveTree.PASSIVE_BRANCHES;
export const PASSIVE_MOD_NAMES=PassiveTree.PASSIVE_MOD_NAMES;
export function achievementList(c){
 const rows=Progression.achievementList(c);
 if(!isRingHero(c))return rows;
 const before=Progression.ringAchievementPoints(c);
 return rows.filter(row=>!/^skill_(triad|chapter):/.test(row.id)).map(row=>{
  const {skillPoints,talentPoints,...reward}=row.reward;
  if(/^(boss|c2:boss|c3:boss):[123]$/.test(row.id)&&!row.claimed){
   const hypothetical={...c,achievements:{...c.achievements,claimed:[...(c.achievements?.claimed??[]),row.id]}};
   reward.talentPoints=Progression.ringAchievementPoints(hypothetical)-before;
  }
  return {...row,reward};
 });
}
export function recordAchievementKill(c,enemy,difficulty,room,chapter=1,options){return Progression.recordAchievementKill(c,enemy,difficulty,room,chapter,options);}
export function recordAchievementShrine(c){return Progression.recordAchievementShrine(c);}
export function preferredPassiveNode(c){return PassiveTree.preferredPassiveNode(c);}
export function passivePoints(c){return PassiveTree.passivePoints(c);}
export function passiveState(c,id){return PassiveTree.passiveState(c,id);}
export function allocatePassive(c,id){if(isRingHero(c)||!PassiveTree.allocatePassive(c,id))return false;reconcileSkillLoadouts(c);return true;}
export function resetPassives(c){if(isRingHero(c)||!PassiveTree.resetPassives(c))return false;reconcileSkillLoadouts(c);return true;}

export const RESPEC_STONE_COST=4;
function respecContextError(profile,heroID,mode){
 if(mode!=='camp')return '請返回營地操作返脈石。';
 if(profile?.rifts?.activeRun)return '請先結束目前的裂隙遠征。';
 if(!profile?.characters?.[heroID]||profile.active!==heroID)return '請先選擇角色。';
 try{if(validProfile(profile))return '';}catch{}
 return '存檔資料無效。';
}
export function respecStonePreview(profile,heroID,mode){
 const cost=RESPEC_STONE_COST,stoneBalance=profile?.materials?.respec,markBalance=profile?.marks?.['1'];
 const count=safeCount(stoneBalance)?stoneBalance:0,marks=safeCount(markBalance)?markBalance:0;
 const blocked=respecContextError(profile,heroID,mode);
 if(blocked)return {ok:false,reason:blocked,cost,count,marks,canUse:false,useReason:blocked};

 const hero=profile.characters[heroID],ring=isRingHero(hero);
 let reason='',useReason='';
 if(progressFor(hero,1,2).length!==chapterDefinition(2).rooms.length)reason=`此角色需先通關${DIFFICULTIES[1].name}${chapterDefinition(2).name}。`;
 else if(marks<cost)reason=`需要 ${cost} 枚${DIFFICULTIES[1].name}印記。`;
 else if(!safeCount(count+1))reason='返脈石已達上限。';

 if(!Object.keys((ring?hero.ring:hero.passives)??{}).length)useReason='沒有已投入的天賦點。';
 else if(count<1)useReason='需要一顆返脈石。';
 else if(ring&&!supportForClass('wanderer',hero.equipment.weapon,hero.equipment.offhand)&&!ringOffhandDestination(hero))useReason=ringOffhandFull;
 return {ok:!reason,reason,cost,count,marks,canUse:!useReason,useReason};
}
export function redeemRespecStone(profile,heroID,mode){
 const {ok,reason,cost,count}=respecStonePreview(profile,heroID,mode);
 if(!ok)return {ok,reason};
 profile.marks['1']-=cost;
 profile.materials.respec=count+1;
 return {ok:true,reason:''};
}
export function useRespecStone(profile,heroID,mode){
 const {canUse,useReason,count}=respecStonePreview(profile,heroID,mode);
 if(!canUse)return {ok:false,reason:useReason};
 const hero=profile.characters[heroID];
 const reset=isRingHero(hero)?resetRing(hero):{ok:resetPassives(hero),reason:'沒有已投入的天賦點。'};
 if(!reset.ok)return reset;
 profile.materials.respec=count-1;
 return {ok:true,reason:''};
}
export function claimAchievement(profile,heroID,id){
 const c=profile?.characters?.[heroID];if(!c)return {ok:false,reason:'找不到角色。'};
 const result=Progression.achievementClaim(c,id);if(!result.ok)return result;
 const points=isRingHero(c)?0:result.reward.skillPoints||0;if(!Number.isInteger(c.points)||c.points<0||c.points+points>43)return {ok:false,reason:'技能點資料無效。'};
 if(!addResourceLoot(profile,result.reward))return {ok:false,reason:'素材或寶石數量已達上限，獎勵仍可領取。'};
 c.points+=points;Progression.finishAchievementClaim(c,id);return {ok:true,id,reward:result.reward};
}

export function claimAchievements(profile,heroID,ids){
 const hero=profile?.characters?.[heroID];
 if(!hero)return {ok:false,reason:'找不到角色。'};
 if(!Array.isArray(ids)||!ids.length||ids.length>Progression.ACHIEVEMENTS.length||new Set(ids).size!==ids.length)return {ok:false,reason:'沒有可批次領取的成就。'};
 const draftHero={...hero},draft={characters:{[heroID]:draftHero},materials:profile.materials,gems:profile.gems};
 for(const id of ids){
  const claim=claimAchievement(draft,heroID,id);
  if(!claim.ok)return claim;
 }
 profile.materials=draft.materials;
 profile.gems=draft.gems;
 hero.achievements=draftHero.achievements;
 hero.points=draftHero.points;
 return {ok:true,count:ids.length};
}

export function paidBossEquipment(c,run){
 const kind=run.final?'final':run.kind,chapter=run.chapterTier??run.chapter,context=run.chapterTier?RiftModel.runContext(run):run;
 const rand=RiftModel.seededRng(run.seed+':settlement'),count=kind==='final'?4:run.theme==='vault'||run.theme==='royal'?3:2;
 const lootStats={...stats(c),roomRarityBonus:run.riskVersion===1?Math.min(.07,(run.modifiers?.length||0)*.015):(run.challenge-1)*.05};
 const family=RiftModel.GEAR_FAMILIES[run.target],band=lootLevelBand(run.difficulty,3,chapter,context),items=[];
 for(let n=0;n<count;n++){
   const level=Campaign.rollBandLevel(band,kind==='rift'?'boss':'normal',rand);
   let item=makeItem(c,run.difficulty,rand,{level,source:'boss',minimumRarity:2,lootStats,dropBand:band});
   if(family&&item.rarity>=4&&rand()<.55){
    if(run.targetType==='unique')item=rollUnique(band,rand,family.uniques)??item;
    else{
     const ids=family.sets.filter(id=>SETS[id]?.rarity===item.rarity);
     if(ids.length)item=makeItem(c,run.difficulty,rand,{level,rarity:item.rarity,setID:ids[Math.floor(rand()*ids.length)]});
    }
   }
   items.push(item);
 }
 return items;
}

export function settlePaidRun(profile,outcome='abandoned'){
 const result=RiftModel.closeRunCandidate(profile,outcome);if(!result.ok)return result;const {run,profile:p}=result;
 const items=outcome==='won'&&!run.bossEquipment?paidBossEquipment(p.characters[run.heroId],run):[];
 if(outcome==='won'){
  const c=p.characters[run.heroId];
  for(const item of items){
   if(c.bag.length<150)c.bag.push(item);else if(c.pendingLoot.length<150)c.pendingLoot.push(item);else return {ok:false,reason:'請先騰出背包空間。'};
   recordEquipmentDiscovery(p,item);
  }
  const amount=run.theme==='forge'?6:run.kind==='final'?8:2;
  if(!addResourceLoot(p,{materials:[{key:'enhance',count:amount},{key:'reforge',count:run.theme==='forge'?3:1}],gems:run.theme==='royal'?[{key:'clarity',tier:3,count:1}]:[]}))return {ok:false,reason:'共享材料已達上限。'};
 }
 return {...result,items};
}

const RIFT_ACHIEVEMENTS=[
 {id:'rift_first',name:'踏入裂隙',need:1,progress:r=>r.clears,description:'強化石 ×5、重鑄石 ×1',reward:{materials:[{key:'enhance',count:5},{key:'reforge',count:1}]}},
 {id:'rift_ten',name:'裂隙行者',need:10,progress:r=>r.clears,description:`${DIFFICULTIES[3].name}裂隙門票 ×1`,reward:{ticket:1}},
 {id:'guardian_triad',name:'破界三冠',need:3,progress:r=>Object.values(r.guardians||{}).filter(n=>n>0).length,description:'破界鑰匙 ×1',reward:{endKey:1}},
 {id:'heart_first',name:'封閉界隙',need:1,progress:r=>r.finalClears,description:'強化石 ×10、澄明石 3級 ×1',reward:{materials:[{key:'enhance',count:10}],gems:[{key:'clarity',tier:3,count:1}]}},
 {id:'heart_three',name:'界隙征服者',need:3,progress:r=>r.finalClears,description:'破界鑰匙 ×2',reward:{endKey:2}}
];
export function riftAchievementList(profile){const r=profile.rifts||RiftModel.newRifts();return RIFT_ACHIEVEMENTS.map(a=>({...a,progress:a.progress(r),claimed:(r.claimed||[]).includes(a.id),claimable:a.progress(r)>=a.need&&!(r.claimed||[]).includes(a.id)}));}
export function claimRiftAchievement(profile,id){const a=riftAchievementList(profile).find(a=>a.id===id);if(!a?.claimable||profile.rifts?.activeRun)return {ok:false,reason:'尚未達成或已領取。'};const p=structuredClone(profile),r=RiftModel.ensureRifts(p);if(!addResourceLoot(p,a.reward))return {ok:false,reason:'材料已達上限。'};if(!safeCount(r.endKeys+(a.reward.endKey||0))||!safeCount(r.tickets[3]+(a.reward.ticket||0)))return {ok:false,reason:'入場道具已達上限。'};r.endKeys+=a.reward.endKey||0;r.tickets[3]+=a.reward.ticket||0;r.claimed=[...(r.claimed||[]),id];Object.assign(profile,p);return {ok:true,reward:a.reward};}
