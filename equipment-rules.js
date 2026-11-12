const actions=new Set(['keep','sell','salvage']);
const enhancementSlots=new Set(['weapon','offhand','helm','chest','hands','feet','cloak']);
const highChances=[.85,.78,.70,.62,.54,.46,.38,.30,.22,.15];
const count=n=>Number.isSafeInteger(n)&&n>=0;

export function validAutoLootActions(value){return Array.isArray(value)&&value.length===6&&Array.from(value).every(action=>actions.has(action));}
export function setAutoLootActions(c,value){if(!c||!validAutoLootActions(value))return false;c.autoLootActions=[...value];delete c.autoLootPolicy;return true;}
function policyShape(value){return !!value&&typeof value==='object'&&!Array.isArray(value)&&Object.keys(value).length===3&&typeof value.enabled==='boolean'&&['sell','salvage'].includes(value.action)&&Array.isArray(value.rarities)&&value.rarities.length<=6&&new Set(value.rarities).size===value.rarities.length&&Array.from(value.rarities).every(n=>Number.isInteger(n)&&n>=0&&n<=5);}
function policyActions(policy){return Array.from({length:6},(_,i)=>policy.enabled&&policy.rarities.includes(i)?policy.action:'keep');}
export function validAutoLootPolicy(c){return c.autoLootPolicy===undefined||policyShape(c.autoLootPolicy)&&validAutoLootActions(c.autoLootActions)&&policyActions(c.autoLootPolicy).every((action,i)=>action===c.autoLootActions[i]);}
export function autoLootPolicy(c){
 if(c.autoLootPolicy&&validAutoLootPolicy(c))return {...c.autoLootPolicy,rarities:[...c.autoLootPolicy.rarities],legacyMixed:false};
 const current=validAutoLootActions(c.autoLootActions)?c.autoLootActions:Array(6).fill('keep'),rarities=current.flatMap((action,i)=>action==='keep'?[]:[i]),kinds=new Set(current.filter(action=>action!=='keep'));
 return {enabled:rarities.length>0,rarities:rarities.length?rarities:[0,1],action:kinds.size>1?null:kinds.values().next().value||'salvage',legacyMixed:kinds.size>1};
}
export function setAutoLootPolicy(c,policy){if(!c||!policyShape(policy))return false;c.autoLootPolicy={enabled:policy.enabled,rarities:[...policy.rarities].sort((a,b)=>a-b),action:policy.action};c.autoLootActions=policyActions(c.autoLootPolicy);return true;}
export function autoLootPreview(c,item,sellValue){
 const keep={action:'keep',gold:0,shards:0,protected:false,reason:''};
 if(!item||!Number.isInteger(item.rarity)||item.rarity<0||item.rarity>5)return {...keep,protected:true,reason:'物品資料無效'};
 if(item.locked||item.set||item.uniqueID||item.grantedSkill||(item.upgrade||0)>0||item.sockets?.some(Boolean))return {...keep,protected:true,reason:'鎖定、套裝、獨特、技能、強化與已鑲嵌裝備保留'};
 const action=validAutoLootActions(c?.autoLootActions)?c.autoLootActions[item.rarity]:'keep';
 if(action==='sell'){const gold=sellValue(item);if(!count(gold))return {...keep,protected:true,reason:'出售價格無效'};return {...keep,action,gold};}
 if(action==='salvage')return {...keep,action,shards:2+item.rarity*3};
 return keep;
}
export function applyAutoLoot(c,item,sellValue){const result=autoLootPreview(c,item,sellValue);if(result.action==='keep')return result;const key=result.action==='sell'?'gold':'shards',total=c[key]+result[key];if(!count(c[key])||!count(total)||total>1e12)return {...result,action:'keep',gold:0,shards:0,protected:true,reason:'資源超過上限'};c[key]=total;return result;}

function enhancementItem(c,target){
 return c.equipment?.[target]??c.bag?.find(item=>item.id===target);
}

export function enhancementPreview(profile,c,slot,stones=1){
 const fail=reason=>({ok:false,reason});
 if(!c||profile?.characters?.[c.id]!==c)return fail('角色與存檔不符。');
 const item=enhancementItem(c,slot);if(!item||!enhancementSlots.has(item.slot))return fail('此部位沒有可強化的裝備白值。');
 if(item.locked)return fail('請先解除裝備鎖定。');
 const before=item.upgrade;if(!count(before)||before>20)return fail('強化等級無效。');if(before===20)return fail('已達強化上限 +20。');
 const high=before>=10;if(high&&(!Number.isInteger(stones)||stones<1||stones>20))return fail('請選擇 1～20 顆強化石。');
 const cost={shards:12+before*8,stones:high?stones:0},chance=high?Math.min(1,Math.round((highChances[before-10]+.05*(stones-1))*100)/100):1;
 const preview={ok:true,reason:'',cost,chance,before,target:before+1,failureLevel:high?Math.max(10,before-1):before};
 if(!count(c.shards)||c.shards<cost.shards)return {...preview,ok:false,reason:'碎晶不足。'};
 if(high&&(!count(profile.materials?.enhance)||profile.materials.enhance<stones))return {...preview,ok:false,reason:'強化石不足。'};
 return preview;
}
export function enhanceEquipment(profile,c,slot,stones=1,rand=Math.random){
 const preview=enhancementPreview(profile,c,slot,stones);if(!preview.ok)return preview;
 let roll=0;if(preview.chance<1){try{roll=rand();}catch{return {ok:false,reason:'無法完成強化抽選，資源已保留。'};}if(!Number.isFinite(roll)||roll<0||roll>=1)return {ok:false,reason:'強化抽選無效，資源已保留。'};}
 const success=roll<preview.chance,after=success?preview.target:preview.failureLevel;
 c.shards-=preview.cost.shards;if(preview.cost.stones)profile.materials.enhance-=preview.cost.stones;enhancementItem(c,slot).upgrade=after;
 return {...preview,success,after};
}
