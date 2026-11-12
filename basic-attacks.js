import {skillWeaponCompatible} from './skill-weapon-rules.js?v=129';

// Equipped basic skills rotate on one attack timer; they never occupy manual slots.
const melee=['dagger','sword','axe','greatsword','greataxe'];
const definitions=[
 ['m_basic_firebolt','mage','爆裂火矢',0,2,0,[],['wand','staff'],'firebolt','fire',.68,'火矢命中後小範圍爆裂，最多命中5名敵人。'],
 ['m_basic_homing','mage','追蹤秘彈',1,2,0,[],['wand','staff'],'homing','lightning',.64,'秘彈有限轉向追蹤一名敵人。'],
 ['m_basic_volley','mage','群星追彈',1,2,1,[],['wand','staff'],'volley','lightning',.48,'發射3枚追蹤秘彈；每輪對同一敵人只結算一次。'],
 ['m_basic_arc','mage','躍動電弧',1,2,2,[],['wand','staff'],'arc','lightning',.58,'電弧跳向最多3名不同敵人，後續傷害逐次降低。'],
 ['a_basic_twin','assassin','雙重刺擊',0,1,0,[],['dagger'],'twin','physical',1.06,'近身連刺2次，短暫間隔後完成；雙持時逐輪交替主副手。'],
 ['a_basic_daggers','assassin','飛擲匕首',2,1,0,[],['dagger'],'daggers','physical',.58,'擲出2枚匕首；每輪對同一敵人只結算一次。'],
 ['a_basic_rope','assassin','繩刃橫掃',2,1,1,[],['dagger'],'rope','physical',.6,'以繩刃掃過前方較遠扇形，最多命中5名敵人。'],
 ['w_basic_sweep','warrior','橫掃普攻',0,2,0,[],melee,'sweep','physical',.64,'擴大前方扇形，最多命中5名敵人。'],
 ['w_basic_thrust','warrior','貫穿突刺',0,2,1,[],melee,'thrust','physical',.72,'沿前方直線突刺，最多貫穿4名敵人。'],
 ['w_basic_counter','warrior','盾衛反擊',1,2,0,[],['dagger','sword','axe'],'counter','physical',.62,'持盾普攻；格擋後2秒內的下一擊提高傷害。'],
 ['r_basic_split','ranger','分裂箭',1,2,0,[],['bow'],'split','physical',.55,'射出3支分裂箭；每輪對同一敵人只結算一次。'],
 ['r_basic_pierce','ranger','穿透箭',0,2,0,[],['bow'],'pierce','physical',.68,'箭矢額外穿透2名敵人。'],
 ['r_basic_venom','ranger','淬毒箭',1,1,0,[],['bow'],'venom','poison',.58,'箭矢造成毒素傷害並留下2秒弱毒；可疊加獨立中毒，與毒箭共用層數上限。'],
 ['b_basic_alternate','berserker','交替斬擊',0,2,0,[],melee,'alternate','physical',.68,'前方近戰斬擊；雙持時逐輪交替主副手。'],
 ['b_basic_rage','berserker','積怒揮擊',1,2,1,[],melee,'rage','physical',.6,'每輪首次命中獲得3點狂怒，上限100點。'],
 ['b_basic_blood','berserker','重血斬',0,2,2,[],melee,'blood','physical',1.6,'攻擊間隔延長35%的重斬，每輪支付1%最大生命（受血費減免與持握影響）；生命不足時改為弱化斬擊。']
];
const colors={physical:'#dedbd4',fire:'#e69a61',lightning:'#edcf76',poison:'#9ec979'};
export const BASIC_ATTACKS=Object.freeze(Object.fromEntries(definitions.map(([id,cls,name,page,col,row,prevs,weapons,style,damageType,damage,effect])=>[id,Object.freeze({id,cls,name,page,col,row,reqLevel:[1,6,12,18,24,30][row],prevs:Object.freeze(prevs),weapons:Object.freeze([...weapons]),style,damageType,damage,effect,color:colors[damageType],tag:cls==='mage'?'spell':'attack',requiresShield:style==='counter',range:({rope:190,thrust:210,daggers:560,arc:620,firebolt:620,homing:650,volley:650,split:700,pierce:700,venom:700})[style]||null})])));
const shieldNames=new Set(['shield','towerShield']);
const learned=(c,id)=>typeof id==='string'&&Object.hasOwn(BASIC_ATTACKS,id)&&(BASIC_ATTACKS[id].cls===c?.cls||c?.cls==='wanderer')&&Number.isInteger(c.talents?.[id])&&c.talents[id]>=1&&c.talents[id]<=10;
export function installBasicAttackData(classes,trees){
 for(const def of Object.values(BASIC_ATTACKS)){
  if(!classes[def.cls]||!trees[def.cls]?.[def.page])continue;
  if(trees[def.cls].flat().some(node=>node.id===def.id))continue;
  trees[def.cls][def.page].push({id:def.id,name:def.name,max:10,reqLevel:def.reqLevel,col:def.col,row:def.row,prevs:[...def.prevs],prev:def.prevs[0]??null,icon:def.requiresShield?'shield':def.tag==='spell'?'rune':'sword',basicAttack:def.id,desc:basicAttackSummary(def.id),mechanicSummary:[def.effect,'普攻技能依配置順序輪替，不佔手動技能欄；不消耗魔力。'],basicMasteries:basicMasteries(def)});
 }
}
export function basicAttackOptions(c){return Object.values(BASIC_ATTACKS).filter(def=>learned(c,def.id));}
export function basicAttackCompatible(c,id){const def=typeof id==='string'&&BASIC_ATTACKS[id];return !!def&&(def.cls===c?.cls||c?.cls==='wanderer')&&(def.tag==='spell'?skillWeaponCompatible(c,def):def.weapons.includes(c.equipment?.weapon?.weaponType))&&(!def.requiresShield||shieldNames.has(c.equipment?.offhand?.weaponType));}
export function basicSlotCapacity(c){return c?.ring?.['x:basicchorus']===1?4:c?.ring?.['x:basicweave']===1?3:2;}
export function basicLoadout(c){const used=new Set(),raw=Array.isArray(c?.basicSkills)?c.basicSkills:[c?.basicAttack];return Array.from({length:basicSlotCapacity(c)},(_,i)=>{const id=raw[i];if(!learned(c,id)||used.has(id))return null;used.add(id);return id;});}
export function basicSequence(c){return basicLoadout(c).filter(id=>id&&basicAttackCompatible(c,id)).map(id=>effectiveBasicAttack(c,id));}
export function validBasicAttack(c){if(!(c?.basicAttack===undefined||c?.basicAttack===null||learned(c,c.basicAttack)))return false;if(c?.basicSkills===undefined)return true;const a=c.basicSkills;if(!Array.isArray(a)||a.length!==basicSlotCapacity(c))return false;const ids=a.filter(id=>id!==null);return ids.every(id=>learned(c,id))&&new Set(ids).size===ids.length&&c.basicAttack===(ids[0]??null);}
export function selectedBasicAttack(c){return basicSequence(c)[0]??null;}
export function assignBasicSlot(c,index,id){if(!Number.isInteger(index)||index<0||index>=basicSlotCapacity(c)||id!==null&&!learned(c,id))return false;const slots=basicLoadout(c);if(id&&slots.some((other,i)=>other===id&&i!==index))return false;slots[index]=id;c.basicSkills=slots;c.basicAttack=slots.find(Boolean)??null;return true;}
export function assignBasicAttack(c,id){if(id!==null&&!learned(c,id))return false;c.basicAttack=id;if(c.basicSkills!==undefined)c.basicSkills=Array.from({length:basicSlotCapacity(c)},(_,i)=>i===0?id:null);return true;}
export function reconcileBasicAttack(c){if(c?.basicSkills!==undefined){c.basicSkills=basicLoadout(c);c.basicAttack=c.basicSkills.find(Boolean)??null;}else if(!validBasicAttack(c))c.basicAttack=null;return c.basicAttack??null;}
export function basicAttackSummary(id,{compact=false}={}){
 const def=typeof id==='string'?(Object.hasOwn(BASIC_ATTACKS,id)?BASIC_ATTACKS[id]:null):id;if(!def)return '';
 if(compact)return ({firebolt:'普攻變為火焰爆裂',homing:'普攻變為追蹤秘彈',volley:'普攻發射多重追蹤彈',arc:'普攻改為跳躍電弧',twin:'普攻改為連續雙刺',daggers:'普攻改為遠程飛刀',rope:'普攻變為大範圍繩刃掃擊',sweep:'擴大普攻扇形範圍',thrust:'普攻改為直線貫穿',counter:'格擋強化下次普攻',split:'普攻發射分裂箭',pierce:'普攻箭矢增加穿透',venom:'普攻變為毒箭並附帶中毒',alternate:'普攻交替使用主副手',rage:'普攻命中累積狂怒',blood:'普攻消耗生命換取更強重斬'})[def.style]||def.name;
 const names={dagger:'匕首',sword:'刀劍',axe:'單手斧',greatsword:'雙手劍',greataxe:'雙手斧',wand:'短杖',staff:'長法杖',bow:'弓'};
 return `${def.effect} 基礎傷害為武器普攻的${Math.round(def.damage*100)}%。需要${def.weapons.map(type=>names[type]).join('／')}${def.requiresShield?'及盾牌':''}；不消耗魔力。`;
}

export function basicAttackRank(c,id=c?.basicAttack){return learned(c,id)?Math.min(10,c.talents[id]):0;}
const masteryLabels={
 firebolt:['擴大火矢爆裂半徑','再次擴大爆裂半徑','爆裂範圍擴展至最高階'],
 homing:['提高秘彈轉向速度','秘彈可更快修正方向','秘彈以最快速度追蹤'],
 volley:['僅有一個可見目標時收束成強化單發','提高追彈轉向速度','單體收束傷害再提高'],
 arc:['增加電弧跳躍距離','增加一個跳躍目標','再增加一個跳躍目標'],
 twin:['提高第二刺傷害','縮短兩次刺擊的間隔','第二刺附加短暫緩速'],
 daggers:['飛刀扇面更寬','每枚飛刀額外穿透一名敵人','多擲一枚飛刀'],
 rope:['外圈命中提高傷害','增加繩刃最遠距離','橫掃多命中一名敵人'],
 sweep:['擴大橫掃扇面','增加橫掃最遠距離','橫掃多命中一名敵人'],
 thrust:['拓寬貫穿路徑','突刺更遠並多貫穿一名敵人','再次拓寬貫穿路徑'],
 counter:['格擋後的反擊命中回復生命','提高格擋後的反擊傷害','格擋後的反擊命中回復魔力'],
 split:['擴大分裂箭扇面','追加一支分裂箭','再追加一支分裂箭'],
 pierce:['提高穿透箭飛行速度','多穿透一名敵人','再多穿透一名敵人'],
 venom:['延長箭毒一秒','提高箭毒每秒傷害','延長箭毒並提高每秒傷害'],
 alternate:['擴大交替斬擊扇面','增加斬擊距離','斬擊多命中一名敵人'],
 rage:['每輪首次命中取得4狂怒','每輪首次命中取得5狂怒','每輪首次命中取得6狂怒'],
 blood:['降低重血斬生命成本','縮短重血斬攻擊間隔','成功支付血費時提高重斬傷害'],
};
export function basicMasteries(def){
 const style=typeof def==='string'?BASIC_ATTACKS[def]?.style:def?.style;
 return masteryLabels[style]?.map((label,index)=>({rank:[3,6,10][index],label}))??[];
}
export function previewBasicAttack(c,id,rank=basicAttackRank(c,id)+1){
 if(!Object.hasOwn(BASIC_ATTACKS,id))return null;
 const def=BASIC_ATTACKS[id];
 if(c.cls!==def.cls&&c.cls!=='wanderer')return null;
 const hardRank=Math.max(0,Math.min(10,Math.floor(rank)||0));
 let equipmentRanks=0;
 for(const item of Object.values(c.equipment??{}))for(const affix of item.affixes??[]){
  if(affix.key==='allSkills'||affix.key==='basicSkills')equipmentRanks+=Math.min(1,affix.value);
 }
 const bonusRank=Math.max(0,Math.min(3,Math.floor(equipmentRanks)));
 return {...def,rank:hardRank,hardRank,bonusRank,level:Math.max(1,hardRank)+bonusRank,
  areaScale:1+.015*Math.max(0,hardRank-1),
  damage:def.damage*(1+.065*Math.max(0,hardRank-1)+.025*bonusRank),
  m3:hardRank>=3,m6:hardRank>=6,m10:hardRank>=10,masteries:basicMasteries(def).map(m=>({...m,active:hardRank>=m.rank}))};
}
export function effectiveBasicAttack(c,id){const rank=basicAttackRank(c,id);return rank?previewBasicAttack(c,id,rank):null;}
