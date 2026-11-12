import {animeMaterialSymbols} from './anime-materials.js?v=124';
import * as M from './model.js?v=140';
import {FLASK_KEYS} from './scene-input.js?v=108';
const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

export function inventoryIconSymbols(){return animeMaterialSymbols();}
export function currencyCountersMarkup(entries){return entries.map(entry=>`<span class="inventory-currency currency-${esc(entry.kind)}" title="${esc(entry.name)}" aria-label="${esc(entry.name)}，${entry.quantity}"><svg aria-hidden="true"><use href="#i-${esc(entry.icon)}"/></svg><small>${esc(entry.name)}</small><b>${entry.quantity.toLocaleString('zh-TW')}</b></span>`).join('');}

function equipmentRolls(item){
 return (item?.affixes??[]).map(affix=>{
  const def=M.AFFIXES[affix.key],value=affix.key==='allSkills'?Math.min(1,affix.value):affix.value;
  const amount=affix.key==='soulBond'?null:def.percent?Math.round(value*1000)/10:value;
  const label=def.label??def.name,unit=def.percent?'%':'';
  const text=amount===null?'有':def.aura?'Lv.'+amount:affix.key==='critMultiplier'?'×'+amount:amount+unit;
  const type=/^(?:flat(?:Attack|Spell)?)?(physical|fire|cold|lightning|poison)/i.exec(affix.key)?.[1].toLowerCase();
  return {key:affix.key,tier:affix.tier,label,amount,text,unit,type,description:M.affixText(affix)};
 });
}

export function compareEquipmentAffixes(item,equipped){
 const current=new Map(equipmentRolls(equipped).map(roll=>[roll.key,roll]));
 const shared=[],candidateOnly=[];
 for(const candidate of equipmentRolls(item)){
  const worn=current.get(candidate.key);
  if(!worn){candidateOnly.push(candidate);continue;}
  current.delete(candidate.key);
  const diff=candidate.amount===null?0:Number((candidate.amount-worn.amount).toFixed(2));
  const delta=diff?{text:(diff>0?'+':'−')+Math.abs(diff)+candidate.unit,direction:diff>0?'gain':'loss'}:null;
  shared.push({candidate,current:worn,delta});
 }
 return {shared,candidateOnly,currentOnly:[...current.values()]};
}

function equipmentRollCell(roll,delta){
 const tier=roll.tier?`<small class="gear-roll-tier" data-tier="${roll.tier}">T${roll.tier}</small>`:'';
 return `<div class="gear-roll" title="${esc(roll.description)}"><span class="gear-roll-name${roll.type?' damage-'+roll.type:''}">${esc(roll.label)}</span><span class="gear-roll-values">${tier}<b class="gear-roll-value">${esc(roll.text)}</b>${delta?`<small class="gear-delta ${delta.direction}" aria-label="換裝差值 ${delta.text}">${delta.text}</small>`:''}</span></div>`;
}

export function equipmentAffixesMarkup(item,equipped){
 const {shared,candidateOnly,currentOnly}=compareEquipmentAffixes(item,equipped);
 const independent=rolls=>rolls.length?rolls.map(roll=>equipmentRollCell(roll)).join(''):'<small class="gear-no-rolls">—</small>';
 return `<div class="gear-rolls" aria-label="裝備詞條">${shared.length?`<small class="gear-group-label">相同詞條</small>${shared.map(({candidate,current,delta})=>`<div class="gear-affix-pair gear-columns has-comparison" data-affix="${esc(candidate.key)}">${equipmentRollCell(candidate,delta)}${equipmentRollCell(current)}</div>`).join('')}`:''}${candidateOnly.length||currentOnly.length?`<small class="gear-group-label">${equipped?'各自詞條':'詞條'}</small><div class="gear-columns ${equipped?'has-comparison':''}"><div>${independent(candidateOnly)}</div>${equipped?`<div>${independent(currentOnly)}</div>`:''}</div>`:shared.length?'':'<small class="gear-no-rolls">無額外詞條</small>'}</div>`;
}

export function itemCell(entry,{selected=false,draggable=true,flaskSlot=null,stashSlot=null}={}){
 const {id,from,kind,name,color,quantity,shared,icon}=entry;
 const drop=stashSlot!==null?`data-stash-slot="${stashSlot}"`:flaskSlot!==null?`data-flask-equip="${flaskSlot}"`:from==='flask-equipped'||from==='flask-stash'?'':`data-bag-drop="${esc(id)}"`;
 const label=kind==='flask'?M.FLASKS[entry.item.type].short:name;
 return `<button type="button" class="inventory-cell carried-item kind-${kind} ${from==='flask-equipped'?'worn-cell ':''}${selected?'selected':''}" data-inventory-item="${esc(id)}" data-inventory-from="${from}" ${drop} draggable="${draggable}" style="--item-color:${color}" aria-label="${esc(name)}${kind==='flask'?`，等級${entry.item.level}，品質${entry.item.quality}%`:`，數量${quantity}`}${shared?'，帳號共用':''}" aria-pressed="${selected}"><svg aria-hidden="true"><use href="#i-${icon}"/></svg>${shared?'<span class="cell-shared" title="帳號共用">共</span>':''}${entry.tier?`<span class="cell-item-tier">${entry.tier}級</span>`:''}<span class="cell-item-label">${esc(label)}</span>${kind!=='flask'?`<b class="cell-stack-count" title="${quantity}">${quantity.toLocaleString('zh-TW')}</b>`:`<span class="cell-potion-level">Lv.${entry.item.level}${entry.item.quality?' ＋'+entry.item.quality+'%':''}</span>`}${flaskSlot!==null?`<kbd class="potion-shortcut">${FLASK_KEYS[flaskSlot]}</kbd>`:''}<span class="cell-quality"></span></button>`;
}
