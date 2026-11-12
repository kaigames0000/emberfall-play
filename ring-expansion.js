import {specializeRingNeighborhoods} from './ring-neighborhoods.js?v=108';
import {MANA_SIPHON_RATE} from './mana-economy.js?v=108';
import {appendOuterTalents} from './ring-outer.js?v=108';
import {BOW_SKILLS} from './bow-skills.js?v=123';
const UTILITY_KEYS=new Set('hpPct armor allResist reduce physicalReduce speedPct slowResistance evasion mana manaRegen manaRegenPct manaCost cdr skillArea skillDuration lifeRegenPct lifeRegen leech skillLeech basicLeech manaLeech manaOnHit manaOnKill haste castSpeed crit movementRecovery bossDamage'.split(' '));
const neutral=n=>n.kind==='passive'&&!n.optional&&!n.requires&&Object.keys(n.mods||{}).length&&Object.entries(n.mods).every(([k,v])=>UTILITY_KEYS.has(k)&&v>=0);
const UTILITY=[
 ['穩固呼吸',{hpPct:.02,mana:6}],['護身步調',{armor:3,allResist:.012}],
 ['輕裝應變',{speedPct:.012,slowResistance:.025}],['靜心回流',{manaRegen:.25,mana:5}],
 ['延展手法',{skillArea:.025,skillDuration:.02}],['收放自如',{haste:.012,castSpeed:.012}],
 ['韌性修復',{hpPct:.018,lifeRegenPct:.0006}],['餘力調息',{manaCost:.012,mana:5}],
 ['轉身卸力',{evasion:.012,armor:2}],['元素護持',{allResist:.016,hpPct:.012}],
 ['靈活整備',{movementRecovery:.025,speedPct:.01}],['續戰心法',{manaRegen:.2,lifeRegen:.25}],
 ['危局判斷',{physicalReduce:.012,slowResistance:.025}],['廣域維持',{skillArea:.025,manaCost:.009}],
 ['蓄勢待發',{mana:8,hpPct:.012}],['專注節奏',{cdr:.012,skillDuration:.02}]
];
const SPECIALIZATIONS={
 blade:[['重刃延伸',{attackDamage:.028,skillArea:.025}],['刃口回生',{basicLeech:.004,hpPct:.018}],['兵器連奏',{haste:.018,basicDamage:.025}],['近身破甲',{physicalDamage:.03,armor:3}],['精準斬勢',{crit:.006,attackDamage:.025}],['刀鋒回流',{manaLeech:.002,skillLeech:.003}],['雙刃磨合',{dualDamage:.035,hpPct:.018}],['重擊擴鋒',{skillArea:.035,physicalDamage:.025}]],
 bastion:[['盾面折射',{shieldBlock:.012,shieldBlockReduction:.018}],['重甲回生',{armor:4,lifeRegenPct:.0007}],['元素盾陣',{allResist:.02,shieldBlock:.009}],['抗震守勢',{physicalReduce:.012,hpPct:.02}],['不退之身',{hpPct:.024,armor:3}],['反震磨礪',{shieldBlockReduction:.025,physicalDamage:.02}],['防線復甦',{lifeRegenPct:.0008,reduce:.008}],['沉穩步伐',{slowResistance:.03,armor:3}]],
 domain:[['微光護持',{auraArea:.035,hpPct:.02}],['領域節流',{auraManaCost:.018,manaRegen:.18}],['灼域迴響',{auraDamage:.04,skillArea:.02}],['祝禱共振',{skillAuraEffect:.025,skillDuration:.025}],['戰意綿延',{warcryEffect:.03,skillDuration:.025}],['共鳴護層',{allResist:.018,auraArea:.03}],['聖火節律',{auraDamage:.035,auraManaCost:.012}],['不息祝福',{skillAuraEffect:.02,mana:7}]],
 legion:[['軍勢鋒刃',{summonDamage:.045,summonHaste:.015}],['協同包圍',{summonArea:.035,summonSpeed:.025}],['獸群韌性',{summonLife:.055,hpPct:.018}],['整隊調息',{summonManaCost:.025,mana:8}],['靈體要害',{summonCrit:.018,summonDamage:.025}],['軍勢擴編',{summonCapacity:1,summonDamage:-.025}],['行軍護持',{summonReduce:.012,allResist:.012}],['靈火擴散',{summonArea:.035,summonDamage:.035}]],
 pact:[['靈契堅軀',{summonLife:.065,summonResist:.015}],['共生護持',{hpPct:.02,summonReduce:.012}],['靈體修復',{summonHealing:.04,lifeRegenPct:.0006}],['送葬波紋',{summonDeathNova:.025,summonArea:.025}],['契約節流',{summonManaCost:.025,manaRegen:.18}],['強靈搏擊',{summonDamage:.045,summonLife:.04}],['靈契回響',{summonArea:.03,skillDuration:.02}],['守契之心',{summonResist:.02,hpPct:.018}]],
 arcane:[['霜雷調和',{coldDamage:.025,lightningDamage:.025}],['秘泉拓深',{mana:12,manaRegen:.25}],['法術展域',{spellDamage:.03,skillArea:.03}],['冰晶護層',{coldResist:.035,hpPct:.02}],['雷脈疾行',{castSpeed:.025,lightningDamage:.025}],['元素研磨',{coldPen:.012,lightningPen:.012}],['節能術式',{manaCost:.018,mana:8}],['術式回生',{skillLeech:.004,spellDamage:.025}]],
 affliction:[['咒痕延展',{skillDuration:.035,skillArea:.025}],['災厄護持',{hpPct:.02,ailmentDuration:.035}],['蝕能脈動',{dotDamage:.035,manaRegen:.2}],['弱化延展',{skillArea:.025,skillDuration:.03}],['長咒餘波',{skillArea:.035,ailmentDuration:.03}],['詛咒蓄勢',{manaCost:.015,skillDuration:.03}],['災傷回流',{lifeRegenPct:.0007,dotDamage:.025}],['異常覆蓋',{ailmentDuration:.04,allResist:.012}]],
 venom:[['毒鏃凝煉',{poisonDotDamage:.04,projectileDamage:.025}],['腐毒滲透',{poisonPen:.012,ailmentDuration:.025}],['霧域延伸',{skillArea:.035,dotDamage:.025}],['毒中復甦',{lifeRegenPct:.0008,hpPct:.02}],['淬毒節奏',{haste:.018,poisonDamage:.025}],['餘毒封喉',{poisonDotDamage:.035,skillDuration:.025}],['潛毒護層',{poisonResist:.035,evasion:.012}],['積毒精研',{poisonStacks:1,poisonDotDamage:.02}]],
 ballistics:[['長弦勁射',{projectileDamage:.035,haste:.015}],['遠射調息',{manaLeech:.002,projectileDamage:.025}],['貫矢掌控',{projectileRange:.035,projectileDamage:.025}],['彈道拓寬',{skillArea:.03,hpPct:.018}],['遠距破綻',{farDamage:.035,crit:.006}],['返身引弓',{evasion:.012,speedPct:.015}],['散射精研',{extraProjectiles:1,projectileDamage:-.025}],['蓄勢破軍',{bossDamage:.03,projectileDamage:.025}]],
 precision:[['連式磨礪',{basicDamage:.04,haste:.015}],['弱點刻印',{crit:.008,basicDamage:.025}],['命中回流',{manaLeech:.002,basicLeech:.004}],['守勢輪替',{hpPct:.018,basicDamage:.03}],['首領破口',{bossDamage:.035,focusDamage:.025}],['不息輪奏',{haste:.02,mana:7}],['節拍延展',{skillArea:.025,basicDamage:.03}],['近遠合拍',{basicDamage:.03,speedPct:.012}]],
 devices:[['巧械增幅',{trapDamage:.04,trapSetup:.025}],['廣域機關',{skillArea:.035,trapDuration:.03}],['暗器調速',{projectileDamage:.03,haste:.018}],['伏器護身',{hpPct:.02,trapSetup:.02}],['重佈節奏',{trapDuration:.04,manaCost:.012}],['哨機研磨',{trapDamage:.04,projectileDamage:.02}],['預備退路',{movementRecovery:.03,evasion:.012}],['致命裝填',{trapDamage:.035,crit:.006}]],
 celerity:[['穿陣反擊',{evasion:.016,attackDamage:.025}],['相位調息',{movementRecovery:.035,mana:8}],['餘影護身',{evasion:.015,hpPct:.02}],['疾行施法',{speedPct:.012,castSpeed:.02}],['避鋒回生',{lifeRegenPct:.0007,slowResistance:.03}],['步法收放',{movementRecovery:.04,skillDuration:.025}],['身形無滯',{slowResistance:.04,speedPct:.012}],['迴避蓄勢',{evasion:.014,bossDamage:.025}]],
 blood:[['血費回收',{lifeCostReduction:.018,lifeRegenPct:.0008}],['赤刃回生',{skillLeech:.004,basicLeech:.004}],['低血護持',{hpPct:.025,lowLifeDamage:.03}],['凝血鎧甲',{armor:4,lifeRegenPct:.0006}],['血契延展',{skillArea:.025,lifeCostReduction:.015}],['血戰蓄勢',{lowLifeDamage:.035,hpPct:.018}],['止血意志',{lifeRegenPct:.001,allResist:.012}],['血潮相續',{skillLeech:.003,lifeRegenPct:.0006}]]
};
export const ADVANCED_PASSIVES={
 arcane:{id:'manaoverdrive',name:'秘能超載',icon:'rune',description:'技能魔力消耗增加18%；魔力高於50%時，本體主動法術直接命中傷害提高14%。追加、觸發與普攻不適用。',mods:{skillCostPenalty:.18}},
 bastion:{id:'guardreservoir',name:'盾返秘泉',icon:'shield',description:`成功格擋後恢復最大魔力的2%，每1秒最多一次，與吸魔共用每秒${MANA_SIPHON_RATE*100}%最大魔力的預算。`},
 domain:{id:'aurabulwark',name:'共鳴壁壘',icon:'shield',description:'每個正在持續耗費資源的光環提供2%額外減傷，最多8%；不計裝備免費光環。',mods:{skillCostPenalty:.08}},
 legion:{id:'packward',name:'軍勢護主',icon:'heart',description:'每個存活的實體召喚物提供2%額外減傷，最多8%；不計分身。與共鳴壁壘合計最多12%。'},
 affliction:{id:'hexsiphon',name:'咒印汲能',icon:'rune',description:'本體直接命中仍有主動詛咒的敵人時，恢復最大魔力的1.5%，每1秒最多一次，與吸魔共用預算。觸發、光環與召喚不適用。'},
 celerity:{id:'evasivebreath',name:'避鋒調息',icon:'wind',description:'成功閃避後恢復最大生命的1%，每1.5秒最多一次；不產生無敵或刷新閃避。'}
};

const SUPPORT_SUMMON_NODES=[
 ['domain','m_wardlantern',[390,84]],
 ['affliction','m_hexidol',[470,80]]
];

export function expandRing({nodes,byId,themes,abilities,add,link,describe,uniformUtility=false,includeOuter=false}){
 const routes=themes.map((_,sector)=>nodes.filter(n=>n.sector===sector&&n.routeStep).sort((a,b)=>a.routeStep-b.routeStep));
 const bySector=[],shared=[];
 for(const [sector,[theme]]of themes.entries()){
  const route=routes[sector];
  for(const step of [2,4,8,10,16]){
   const n=route[step-1],mana=['arcane','pact','domain','affliction'].includes(theme);
   const [name,mods]=step===2?[mana?'靜心整備':'穩固整備',mana?{mana:8,manaRegen:.18}:{hpPct:.02,mana:5}]:
    step===4?['護持步調',{hpPct:.018,allResist:.012}]:step===8?['手法延展',{skillArea:.025,skillDuration:.025}]:
    step===10?['續戰蓄勢',{hpPct:.018,lifeRegenPct:.0006}]:['餘勢流轉',{skillDuration:.025,cdr:.012}];
   Object.assign(n,{name,mods,description:describe(mods),effectDescription:'',shared:true});
  }
  const local=nodes.filter(n=>n.sector===sector),eligible=local.filter(neutral),extra=44-local.length,need=Math.max(0,16-eligible.length);
  if(extra<need)throw new Error('Insufficient shared utility in '+theme);
  for(let i=0;i<extra;i++){
   const common=i<need,signature=!common&&i===need?ADVANCED_PASSIVES[theme]:null;
   const [name,mods]=common?UTILITY[(i+sector*3)%UTILITY.length]:SPECIALIZATIONS[theme][(i-need-Number(!!ADVANCED_PASSIVES[theme])+SPECIALIZATIONS[theme].length)%SPECIALIZATIONS[theme].length];
   const data=signature?{id:'x:'+signature.id,name:signature.name,kind:'mechanic',major:true,icon:signature.icon,mods:signature.mods||{},description:signature.description,effectDescription:signature.description}:
    {id:'p:branch:'+theme+':'+(i+1),name:name+'・'+(i+1),kind:'passive',medium:i%3===2,mods,description:describe(mods),effectDescription:'',...(common?{shared:true}:{})};
   add(sector,Math.min(9,3+Math.floor(i/3)),{...data,expansion:true,pocket:Math.floor(i/3),pocketIndex:i%3,anchorStep:5+Math.floor(i/3)*2});
  }
  const all=nodes.filter(n=>n.sector===sector),extras=all.filter(n=>n.expansion);
  for(let pocket=0;pocket<=Math.max(...extras.map(n=>n.pocket));pocket++){
   const group=extras.filter(n=>n.pocket===pocket),anchor=route[group[0].anchorStep-1];
   link(anchor,group[0]);for(let i=1;i<group.length;i++)link(group[i-1],group[i]);
   link(group.at(-1),route[group[0].anchorStep]);
  }
  bySector[sector]=all;
  shared[sector]=all.filter(n=>n.shared||neutral(n)).sort((a,b)=>Number(b.shared)-Number(a.shared)).slice(0,16);
  for(const n of shared[sector])n.shared=true;
 }
 const borders=[];
 for(let sector=0;sector<themes.length;sector++)for(const [index,step]of [10,16].entries()){
  const next=(sector+1)%themes.length,mods=index?{skillArea:.035,skillDuration:.03}:{hpPct:.02,mana:8};
  const id='p:bridge:'+sector+':'+index;add(sector,index?8:5,{id,name:index?'共通延展':'共通續戰',kind:'passive',medium:true,shared:true,bridge:true,bridgeBetween:[sector,next],anchorStep:step,mods,description:describe(mods),effectDescription:''});
  const n=byId[id];link(routes[sector][step-1],n);link(n,routes[next][step-1]);borders.push(n);
 }
 // Generate the same IDs, edges and sharing membership as v102 before
 // applying the new values; the original values are used only for imports.
 if(!uniformUtility)specializeRingNeighborhoods({themes,routes,bySector,borders,describe});
 if(includeOuter)for(const [sector,[theme]]of themes.entries()){
  bySector[sector].push(...appendOuterTalents({theme,sector,route:routes[sector],byId,add,link,describe}));
 }
 if(includeOuter)for(const [theme,ability,position] of SUPPORT_SUMMON_NODES){
  const sector=themes.findIndex(([name])=>name===theme),anchor=routes[sector][2],def=abilities[ability],id='s:'+ability;
  add(sector,anchor.ring,{id,kind:'skill',talentId:ability,ability,name:def.name,icon:def.icon,description:def.desc,outerPosition:Object.freeze(position)});
  link(anchor,byId[id]);
  bySector[sector].push(byId[id]);
 }
 if(includeOuter){
  const sector=themes.findIndex(([theme])=>theme==='ballistics');
  for(const {id:ability,routeStep,position} of BOW_SKILLS){
   const anchor=routes[sector][routeStep-1],def=abilities[ability],id='s:'+ability;
   add(sector,anchor.ring,{id,kind:'skill',talentId:ability,ability,name:def.name,icon:def.icon,description:def.desc,outerPosition:Object.freeze(position)});
   link(anchor,byId[id]);bySector[sector].push(byId[id]);
  }
 }
 return Object.freeze(Object.fromEntries(themes.map((_,s)=>[s,Object.freeze([...bySector[s],...shared[(s+12)%13],...shared[(s+1)%13],...borders.filter(n=>n.bridgeBetween.includes(s))].map(n=>n.id))])));
}
