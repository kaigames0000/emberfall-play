const recoveryRows=[
 ['instantHP','立即回復生命','pct'],['hp','持續回復生命','pct'],
 ['instantMP','立即回復魔力','pct'],['mp','持續回復魔力','pct']
];
const buffRows=[
 ['reduce','減傷','pct'],['resist','法術減傷','pct'],['armor','護甲','flat'],
 ['manaRegen','每秒回魔','flat'],['manaCost','魔耗降低','pct'],
 ['spellDamage','法術傷害','pct'],['attackDamage','攻擊傷害','pct'],['summonDamage','召喚物傷害','pct'],
 ['speedPct','移動速度','pct'],['haste','攻擊速度','pct'],['castSpeed','施法速度','pct'],
 ['crit','爆擊率','pct'],['drop','裝備掉落率','pct'],['rarityFind','裝備稀有度','pct']
];
const gearRows=[
 ['cost','每次耗用','charges'],['maxCharges','最大充能','charges'],['duration','持續時間','seconds']
];

export function flaskStatValue(value,unit){
 if(unit==='pct')return `${Number((value*100).toFixed(1))}%`;
 const amount=Number(value.toFixed(1));
 return unit==='seconds'?`${amount} 秒`:String(amount);
}

export function flaskComparisonRows(selected,current){
 const selectedValues={...selected,...selected.buff};
 const currentValues={...current,...current?.buff};
 return [...gearRows,...recoveryRows,...buffRows].flatMap(([key,label,unit])=>{
  if(selectedValues[key]===undefined&&currentValues[key]===undefined)return [];
  return [{key,label,unit,selected:selectedValues[key],current:currentValues[key]}];
 });
}

export function flaskCardSummary(def){
 const summary=[];
 for(const [instant,overTime,label] of [['instantHP','hp','生命'],['instantMP','mp','魔力']]){
  if(def[instant]||def[overTime]){
   const amount=[def[instant],def[overTime]].filter(Boolean).map(value=>flaskStatValue(value,'pct')).join('＋');
   summary.push(`${label} ${amount}`);
  }
 }
 const buffs=buffRows.filter(([key])=>def.buff?.[key]);
 const suffix=buffs.find(([key])=>def.suffixBuff?.[key]);
 const featured=[...new Set([...(suffix?[suffix]:[]),...buffs])].slice(0,Math.max(1,2-summary.length));
 for(const [key,label,unit] of featured)summary.push(`${label} +${flaskStatValue(def.buff[key],unit)}`);
 return summary;
}
