import {basicAttackSummary} from './basic-attacks.js?v=129';
import {ACTOR_STATUSES,GROUND_STATUSES,actorStatusIconMarkup} from './status-effects.js?v=130';
// Presentation only: no stat, skill-rank or combat mutations.
export const DAMAGE_LABELS={physical:'物理',fire:'火焰',cold:'冰霜',lightning:'閃電',poison:'毒素',all:'全元素'};
const escape=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const span=(type,text,format=escape)=>Object.hasOwn(DAMAGE_LABELS,type)?`<span class="damage-type damage-${type}" data-damage-type="${type}">${format(text)}</span>`:format(text);
const termTypes={全元素抗性:'all',元素抗性:'all',全抗性:'all',全元素:'all',物理:'physical',火焰:'fire',燃燒:'fire',灼傷:'fire',灼燒:'fire',火抗:'fire',冰霜:'cold',冰冷:'cold',寒冷:'cold',冰凍:'cold',凍結:'cold',冰抗:'cold',閃電:'lightning',雷電:'lightning',感電:'lightning',雷抗:'lightning',毒素:'poison',毒霧:'poison',中毒:'poison',毒傷:'poison',毒抗:'poison'};
const terms=new RegExp(Object.keys(termTypes).sort((a,b)=>b.length-a.length).join('|')+'|火(?=／)|冰(?=光環|附傷|傷害|／)','g');
export function colorTerms(text,format=escape){
 const value=String(text??'');let out='',start=0;
 for(const match of value.matchAll(terms)){out+=format(value.slice(start,match.index))+span(termTypes[match[0]]||(match[0]==='火'?'fire':'cold'),match[0],format);start=match.index+match[0].length;}
 return out+format(value.slice(start));
}
function typesFor(def,composition){
 if(!def||def.summon?.support||def.summon?.kind==='mirror_clone')return [];
 const declared=def.damageType??def.summon?.damageType;
 return Object.entries(composition??def.damageTypes??(declared?{[declared]:1}:{physical:1})).filter(([key,value])=>value>0&&key!=='all'&&Object.hasOwn(DAMAGE_LABELS,key)).map(([key])=>key);
}
export function typeBadges(def,composition){
 if(!def||(!def.damage&&!def.summon&&!def.burn&&!def.bloodPulse&&!def.bloodOath))return '';
 return typesFor(def,composition).map(type=>`<span class="damage-badge">${span(type,DAMAGE_LABELS[type]+'傷害')}</span>`).join('');
}
export function effectMarkup(label,value,def,composition,format=escape){
 const named=[...new Set([...String(label).matchAll(terms)].map(match=>termTypes[match[0]]||(match[0]==='火'?'fire':'cold')))];
 const damage=/傷害|每隻攻擊/.test(label)&&!/頻率|繼承|魔力|減益/.test(label);
 const types=named.length?named:damage?typesFor(def,composition):[];
 return types.length===1?span(types[0],value,format):colorTerms(value,format);
}

const catalogStatuses={
 凍結:ACTOR_STATUSES.frozen,冰凍:ACTOR_STATUSES.frozen,暈眩:{icon:'rune',color:'#e8cd92'},
 緩速:ACTOR_STATUSES.slow,感電:ACTOR_STATUSES.shock,釘刃:ACTOR_STATUSES.pin,
 燃燒:ACTOR_STATUSES.burn,灼傷:ACTOR_STATUSES.burn,灼燒:ACTOR_STATUSES.burn,
 中毒:ACTOR_STATUSES.poison,箭毒:ACTOR_STATUSES.poison,毒霧:GROUND_STATUSES.poison,
 流血:ACTOR_STATUSES.bleed,破綻:ACTOR_STATUSES.shadow,詛咒:ACTOR_STATUSES.curse,
 嘲諷:{icon:'flag',color:'#e7b77c'},
 護甲削弱:ACTOR_STATUSES.armor,護甲降低:ACTOR_STATUSES.armor,
 傷害削弱:ACTOR_STATUSES.weaken,敵人傷害降低:ACTOR_STATUSES.weaken
};
const catalogNumberPattern='[+＋−-]?\\d+(?:,\\d{3})*(?:\\.\\d+)?[%％°]?';
const catalogNumberTokens=new RegExp(catalogNumberPattern,'g');
const catalogTokens=new RegExp(Object.keys(catalogStatuses).join('|')+'|'+catalogNumberPattern,'g');
function catalogInline(text,tokens){
 const value=String(text??'');let out='',start=0;
 for(const match of value.matchAll(tokens)){
  const word=match[0],status=catalogStatuses[word];
  out+=escape(value.slice(start,match.index));
  out+=status?`<span class="skill-catalog-status" style="--skill-status-color:${status.color}">${actorStatusIconMarkup(status)}${escape(word)}</span>`
   :`<strong class="skill-catalog-number">${escape(word)}</strong>`;
  start=match.index+word.length;
 }
 return out+escape(value.slice(start));
}
export function catalogText(text){
 return colorTerms(text,value=>catalogInline(value,catalogTokens));
}
export function catalogValue(label,value,def,composition){
 return effectMarkup(label,value,def,composition,text=>catalogInline(text,catalogNumberTokens));
}
const modifierLabels={
 poisonStacks:'毒素層數上限',dotDamage:'持續傷害',atk:'攻擊',atkPct:'攻擊',hp:'生命上限',hpPct:'生命上限',armor:'護甲',armorPct:'護甲',mana:'魔力上限',manaShield:'魔力抵傷比例',manaRegen:'回魔速度',manaRegenPct:'回魔速度',lifeRegen:'生命回復',
 speedPct:'移動速度',haste:'攻擊速度',castSpeed:'施法速度',crit:'爆擊率',critDmg:'爆擊傷害',critDamageBonus:'爆擊傷害',skillDmg:'技能傷害',skillMult:'技能傷害',damageBonus:'傷害',
 reduce:'減傷',physicalReduce:'物理減傷',resist:'法術減傷',allResist:'全元素抗性',cdr:'冷卻回復速度',skillArea:'技能範圍',skillDuration:'技能持續時間',extraProjectiles:'技能投射物數量',extraArrows:'箭矢數量',
 summonDamage:'召喚物傷害',summonLife:'召喚物生命',summonHaste:'召喚物攻擊速度',summonSpeed:'召喚物移動速度',summonArea:'召喚物範圍',summonReduce:'召喚物減傷',summonCapacity:'召喚容量',summonSkillLevels:'召喚技能等級',
 auraArea:'光環範圍',auraDamage:'光環傷害',skillAuraEffect:'光環效果',auraEffect:'裝備光環效果',freeze:'冰凍效果',burn:'持續傷害',thorns:'反傷',block:'格擋率',blockReduction:'格擋減傷',drop:'裝備掉落率',rarityFind:'裝備稀有度',allSkills:'技能等級',experienceGain:'經驗獲取',chargeGain:'藥水充能',killHeal:'擊殺回血',manaOnHit:'命中回魔',manaOnKill:'擊殺回魔'
};
function modifierEffect(key,value){
 if(!value)return null;
 const reductions={manaCost:'魔力消耗降低',flatManaCost:'魔力消耗降低',auraManaCost:'光環魔力消耗降低',summonManaCost:'召喚魔力消耗降低'};
 if(reductions[key])return reductions[key];if(key==='cdr')return '冷卻時間縮短';
 if(key==='leech')return '攻擊吸血';if(key==='manaLeech')return '攻擊吸取魔力';if(key==='critMultiplier')return '爆擊傷害倍率提升';
 const added=/^flat(?:Attack|Spell)?(Fire|Cold|Lightning|Poison)$/.exec(key);if(added)return '追加'+DAMAGE_LABELS[added[1].toLowerCase()]+'傷害';
 const typed=/^(physical|fire|cold|lightning|poison)(Damage|Resist|Pen)$/.exec(key);
 if(typed)return DAMAGE_LABELS[typed[1]]+({Damage:'傷害',Resist:'抗性',Pen:'抗性穿透'}[typed[2]])+(value<0?'降低':'增加');
 const label=modifierLabels[key];return label?label+(value<0?'降低':'增加'):null;
}

export function configurationDescription(text){return String(text??'').split(/(?<=[。；])/u).filter(part=>!/硬點|實投|門檻/.test(part)).join('').trim();}
export function synergySummary(link){
 if(link.effect==='summonChainJumps')return '連鎖跳躍增加';
 const label=String(link.label||({summonLife:'召喚物生命',summonReduce:'召喚物減傷',haste:'攻擊速度',manaCost:'魔力消耗降低',summonChainJumps:'連鎖目標',duration:'持續時間'}[link.effect])||'傷害');
 if(/[\d%＋+]/.test(label))return ({damage:'傷害增加',summonLife:'召喚物生命增加',summonReduce:'召喚物減傷增加',duration:'持續時間延長'}[link.effect])||'技能效果增強';
 return /增加|降低|減少|提升|強化|延長|縮短/.test(label)?label:label+'增加';
}
export function skillSummary(def,node={}){
 if(def?.summon?.support)return def.summon.support.kind==='ward'?['跟隨角色','降低範圍內友軍受到的傷害']:['靠近敵群','降低範圍內敵人造成的傷害','對首領效果減半'];
 if(def?.bloodBuildV81&&def.id==='b_bloodaura')return ['持續耗血強化攻勢','付費累積血熱',...(def.bloodPulse?['血熱強化物理脈衝']:[]),...(def.bloodTempo?['血熱提升攻擊、施法與移動速度']:[]),...(def.bloodWard?['脈衝命中轉為短暫護盾']:[]),...(def.bloodResonance?['脈衝消耗狂怒追加後震']:[]),...(def.bloodOath?['蓄熱後手動關閉釋放血爆']:[])];
 if(def?.bloodBuildV81){const effect=({b_rally:'戰吼提供短暫攻擊吸血',b_frenzycry:'戰吼提高攻擊、施法與移動速度',b_ironcry:'戰吼提高全元素抗性與減傷'})[def.id];if(effect)return [effect,'自身與召喚物共享增益'];}
 if(def?.beastV80)return [({r_wolf:'召喚近戰灰狼',r_bear:'召喚前排巨熊',r_eagle:'召喚遠程巡獵鷹'})[def.id],'物理傷害',...(def.id==='r_bear'?['嘲諷敵人','範圍橫掃']:def.id==='r_eagle'?['標記敵人並降低護甲']:['追擊標記目標'])];
 if(node.basicAttack)return [basicAttackSummary(node.basicAttack,{compact:true})];
 if(def?.arsenalV79)return def.id==='a_shuriken'?['扇射物理飛刃','留下釘刃，連動陷阱增傷']:['穿透物理苦無','消耗釘刃強化命中',...(def.m6?['滿層收割回魔']:[]),...(def.m10?['滿層收割施加流血']:[])];
 if(def?.shadowV70){const summaries={a_veil:['隱身','提高閃避與減傷','破隱後伏擊增傷'],a_dancer:['持續耗魔的殘影光環','提高閃避與減傷',...(def.m3?['強化召喚攻速']:[]),...(def.m6?['閃避回魔']:[])],a_flurry:['連續物理攻擊單一敵人','降低護甲與攻擊','末擊連動破綻'],a_storm:['依序瞬移攻擊多名敵人','可重擊單一敵人','建立破綻後收割']};return summaries[def.id]??['特殊技能效果'];}
 if(def?.id==='r_venom')return ['持續地面毒霧','重疊毒霧取最強','與箭毒分開計算'];
 if(def?.id==='a_execute')return ['攻擊前方單一敵人','消耗破綻強化傷害'];
 const effects=[],add=text=>{if(text&&!effects.includes(text))effects.push(text);};
 const addModifiers=mods=>{for(const [key,value] of Object.entries(mods||{}))add(modifierEffect(key,value));};
 if(def){
  const spec=def.summon,type=typesFor(def).map(key=>DAMAGE_LABELS[key]).join('與')||'物理';
  if(spec?.kind==='mirror_clone'){add('召喚分身');add('繼承武器傷害與光環');add('複製支援的已配置技能');}
  else if(spec){
   add('召喚'+(spec.ranged?'遠程':'近戰')+'盟友');add(type+'傷害');
   if(spec.attackMode==='cone')add('發射扇形冰箭');if(spec.chain)add('連鎖閃電傷害');if(spec.storm)add('召喚暴風雪');
   if(spec.maxTargets>1&&spec.attackRadius)add('增加範圍傷害');if(spec.tauntRadius)add('嘲諷附近敵人');if(spec.shieldRatio)add('為友軍提供護盾');if(def.id==='m_titan')add('週期施放範圍震擊');
  }else if(def.type==='trap'){
   add(def.trap?.mode==='turret'?'設置自動攻擊陷阱':'敵人踩踏時引爆');add(type+'傷害');if(def.trap?.mode!=='turret')add('增加範圍傷害');
  }else if(def.type==='curse'){
   add('對敵人施加詛咒');
   for(const [key,value] of Object.entries(def.debuff||{}))if(value)add({slow:'降低敵人移動速度',armorShred:'降低敵人護甲',weaken:'降低敵人傷害'}[key]);
  }else if(def.type==='aura'){
   add('持續光環效果');if(def.damage)add('週期造成範圍'+type+'傷害');
  }else if(def.type==='guard'){add('為自己與召喚物提供增益');}
  else if(def.type==='dash'){add('快速位移');if(def.damage)add((def.id==='b_leap'?'落地造成範圍':'沿路造成')+type+'傷害');}
  else if(def.type==='channel'){add(def.mode==='whirl'?'持續旋轉攻擊':'持續引導攻擊');add(type+'傷害');if(def.mode==='whirl')add('增加範圍傷害');}
  else if(def.chain){add(type==='閃電'?'連鎖閃電傷害':type+'彈射傷害');if(def.type==='chain')add('電弧即時命中');if(def.id==='r_ricochet')add('命中後箭矢轉向飛行');}
  else if(def.type==='ground'){add('持續造成範圍'+type+'傷害');}
  else {add(type+'傷害');if(def.type==='projectile')add((def.arrows||1)+(def.extraProjectiles||0)>1?'發射多重投射物':'發射投射物');}
  if(def.explosionRadius||def.type==='nova')add('增加範圍傷害');
   if(def.homing)add('箭矢在命中前追蹤目標');
   if(def.impactBonus)add('直擊目標受到額外傷害');
   if(def.coldExposure)add('降低敵人冰抗');
   if(def.allowsBasic)add('引導時可普攻');
  if(def.poisonFraction||spec?.poisonFraction)add(def.rangerPoison?'疊加獨立計時毒素':'造成持續毒素傷害');if(def.poisonCloud||def.trap?.cloud)add('產生毒霧');
  if(def.rangerPoison)add('中毒敵人死亡時傳播毒素');
  if(def.burn||spec?.burnFraction||def.infusion?.burn)add('施加可疊加灼燒');
  if(def.slow||spec?.slow||def.infusion?.slow)add('施加緩速');
  if(def.freezeChance||spec?.freezeChance||def.infusion?.freezeChance)add('有機率冰凍敵人');
  if(def.shock||spec?.shock)add('施加感電，提高敵人受到的爆擊機率與傷害');
  if(def.freeze)add(type.includes('冰霜')?'冰凍敵人':'暈眩敵人');if(def.stun)add('暈眩敵人');if(def.leech)add('傷害吸血');
  for(const [key,value] of Object.entries(def.debuff||{}))if(value)add({slow:'降低敵人移動速度',armorShred:'降低敵人護甲',weaken:'降低敵人傷害'}[key]);
  if(def.pierce||spec?.pierce)add('穿透敵人');
  if(def.lightningVariance||spec?.lightningVariance)add('閃電傷害波動較大');
  if(def.lightningCritBonus||spec?.lightningCritBonus)add('閃電技能爆擊機率增加');
  if(def.shield)add('提供護盾');if(def.heal||def.lifeRestorePct)add('回復生命');
  if(def.manaRestorePct||def.manaRestore)add('持續回復魔力');
  if(def.infusion){if(def.infusion.fire)add('主動技能附加火焰傷害');if(def.infusion.cold)add('主動技能附加冰霜傷害');}
  if(def.elementalBoost)add('提高火焰與冰霜光環傷害及頻率');
  addModifiers(def.buff);
 }
 for(const text of node.mechanicSummary||[])add(text);
 for(const milestone of def?.masteries||[])if(milestone.active)add(milestone.label);
 addModifiers(node.mods);
 if(node.summonCapacityThreshold)add('召喚容量提升');if(node.summonSkillThreshold)add('召喚技能等級提升');

 return effects;
}

export function effectDisplay(effect,abilities={}){return abilities[effect.id]||{icon:'shield',name:effect.name||({'b_weapon_guard':'血刃護勢','unique:echo_seal':'殘響聖印'})[effect.id]||'狀態增益'};}
