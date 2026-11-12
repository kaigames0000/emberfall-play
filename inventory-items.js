import * as M from './model.js?v=140';
import {isFlaskSlot} from './flask-belt.js?v=108';
import {saveStashSlots,stashSlots,validStashSlot} from './stash-slots.js';

// Quantity maps are the backing stores of resource stacks. Never duplicate a balance
// into a second item array: crafting, rewards and paid tickets must share one count.
export const CATEGORIES={all:'全部道具',equipment:'裝備',flask:'藥水',material:'製作材料',gem:'寶石',entry:'遠征道具'};
export const BAG_CAPACITIES=Object.freeze({equipment:150,flask:36});
export const STASH_PAGE_SIZE=40;
export function discardBackpackGear(profile,heroId,ids,mode){
 const hero=profile.characters?.[heroId],selected=new Set(ids);
 if(mode!=='playing'||!hero||!selected.size)return false;
 const remaining=hero.bag.filter(item=>!selected.has(item.id));
 if(hero.bag.length-remaining.length!==selected.size)return false;
 hero.bag=remaining;
 if(hero.inventoryOrder)hero.inventoryOrder=hero.inventoryOrder.filter(id=>!selected.has(id));

 const checkpoint=profile.rifts?.activeRun?.checkpoint?.hero;
 if(checkpoint?.id===heroId){
  checkpoint.bag=checkpoint.bag.filter(item=>!selected.has(item.id));
  if(checkpoint.groundLoot)checkpoint.groundLoot=checkpoint.groundLoot.filter(item=>!selected.has(item.id));
  if(checkpoint.inventoryOrder)checkpoint.inventoryOrder=checkpoint.inventoryOrder.filter(id=>!selected.has(id));
 }
 return true;
}
const currencyKinds=new Set(['gold','shard','mark']);
const resourceColors={gold:'#d8b568',shard:'#b5a1db',material:'#bda0d2',mark:'#dfc184',fragment:'#9bced3',ticket:'#91d7c5',key:'#e8a579',emblem:'#dbb2ee',voucher:'#d2b771'};
const gemColors={fire:'#e99e65',cold:'#8dd4e1',lightning:'#e3d281',poison:'#9acb7b',clarity:'#95bbdf',soul:'#bda3db',obsidian:'#b2b7bd',wind:'#a0d4c0',agility:'#ccb98b',casting:'#b3a6df'};
export function isFlask(item){return !!item&&!item.slot&&Object.hasOwn(M.FLASKS,item.type);}
function ownedEntry(item,from){const flask=isFlask(item),def=flask?M.flaskForItem(item):null;return {id:item.id,kind:flask?'flask':'equipment',from,item,name:flask?def.name:item.name,quantity:1,shared:from==='stash'||from==='flask-stash',color:flask?def.color:M.itemColor(item),icon:flask?def.icon:M.SLOT_ICONS[item.slot],description:flask?M.FLASKS[item.type].description||'充能藥水，可配置在腰帶藥水槽。':M.SLOT_NAMES[item.slot]};}
function stack(kind,key,quantity,name,description,extra={}){return {id:`supply:${kind}:${key}`,kind,key,from:'resource',item:null,name,description,quantity,shared:true,color:resourceColors[kind]||'#cdbd91',icon:'item-'+kind,usePanel:'quests',...extra};}
export function currencies(profile,heroId){
 const c=profile.characters?.[heroId],entries=[];
 if(c)entries.push(stack('gold',c.id,c.gold,'金幣','購買、強化、合成與製作時消耗。',{shared:false,usePanel:'merchant'}),stack('shard',c.id,c.shards,'碎晶','強化裝備、拆卸寶石與提升藥水品質時消耗。',{shared:false,usePanel:'forge'}));
 for(const d of [1,2,3])entries.push(stack('mark',String(d),profile.marks?.[d]??0,`${M.DIFFICULTIES[d].name}印記`,'交給營地印記收藏家兌換返脈石。',{difficulty:d,usePanel:'sets'}));
 return entries;
}
export function resourceEntries(profile,heroId,{includePersonal=true}={}){
 const r=profile.rifts??{},entries=currencies(profile,includePersonal?heroId:null);
 for(const [key,def] of Object.entries(M.MATERIALS))entries.push(stack('material',key,profile.materials?.[key]??0,def.name,def.description,key==='respec'?{icon:'rune',usePanel:'talents'}:{icon:'item-'+key,usePanel:'forge'}));
 for(const [id,quantity] of Object.entries(profile.gems??{})){const [key,rawTier]=id.split(':'),tier=Number(rawTier),def=M.GEMS[key];if(!def)continue;entries.push(stack('gem',id,quantity,`${def.name} ${tier}級`,def.description,{gemKey:key,tier,icon:'item-gem',color:gemColors[key],usePanel:'forge'}));}
 for(const d of [1,2,3]){
  const difficulty=M.DIFFICULTIES[d].name;
  entries.push(stack('fragment',String(d),r.fragments?.[d]??0,`${difficulty}裂隙碎片`,`3枚合成同難度裂隙門票；10枚${M.DIFFICULTIES[3].name}碎片可合成破界鑰匙。`,{difficulty:d}));
  entries.push(stack('ticket',String(d),r.tickets?.[d]??0,`${difficulty}裂隙門票`,'由營地遠征傳送門進入裂隙時消耗1張。',{difficulty:d}));
  entries.push(stack('emblem',String(d),r.emblems?.[d]??0,`${difficulty}守衛徽記`,'破界守衛的憑證；集齊三種各1枚可挑戰最終界隙。',{difficulty:d}));
  entries.push(stack('voucher',String(d),profile.weaponChoices?.[d]??0,`${difficulty}武器憑證`,'既有存檔的待領武器憑證。',{difficulty:d,usePanel:'sets'}));
 }
 entries.push(stack('key','endgame',r.endKeys??0,'破界鑰匙','由營地傳送門進入破界狩獵場時消耗1把。'));
 return entries.filter(e=>Number.isFinite(e.quantity)&&e.quantity>0);
}
export function list(profile,heroId,{includeShared=true}={}){
 const c=profile.characters?.[heroId];if(!c)return [];
 const entries=[...c.bag.map(i=>ownedEntry(i,'bag')),...(c.flaskBag??[]).map(i=>ownedEntry(i,'flask-bag')),...resourceEntries(profile,heroId).filter(e=>!currencyKinds.has(e.kind)&&(includeShared||!e.shared))];
 const order=new Map((c.inventoryOrder??[]).map((id,index)=>[id,index]));
 return entries.sort((a,b)=>(order.get(a.id)??Infinity)-(order.get(b.id)??Infinity));
}
export function stashCount(profile){return (profile.stash?.length??0)+(profile.flaskStash?.length??0);}
function storedEntries(profile){return [...(profile.stash??[]).map(i=>ownedEntry(i,'stash')),...(profile.flaskStash??[]).map(i=>ownedEntry(i,'flask-stash'))];}
export function stashEntries(profile){return [...storedEntries(profile),...resourceEntries(profile,null,{includePersonal:false}).filter(e=>!currencyKinds.has(e.kind))];}
export function stashSlotIds(profile){return stashSlots(profile,M.STASH_CAPACITY);}
export function stashGrid(profile){
 const entries=new Map(storedEntries(profile).map(entry=>[entry.id,entry]));
 return stashSlotIds(profile).map(id=>entries.get(id)??null);
}
export function moveStashSlot(profile,id,target,mode){
 if(mode!=='camp'||!validStashSlot(target,M.STASH_CAPACITY))return false;
 const slots=stashSlots(profile,M.STASH_CAPACITY),source=slots.indexOf(id);
 if(source<0||source===target)return false;
 [slots[source],slots[target]]=[slots[target],slots[source]];
 saveStashSlots(profile,slots);
 return true;
}
export function sortStashPage(profile,page,mode){
 if(mode!=='camp'||!Number.isInteger(page)||page<0||page*STASH_PAGE_SIZE>=M.STASH_CAPACITY)return false;
 const start=page*STASH_PAGE_SIZE,grid=stashGrid(profile),end=Math.min(start+STASH_PAGE_SIZE,grid.length);
 const occupied=grid.slice(start,end).filter(Boolean);
 if(occupied.length<2)return false;
 occupied.sort((a,b)=>b.item.rarity-a.item.rarity||
  (b.item.level??0)-(a.item.level??0)||a.name.localeCompare(b.name,'zh-Hant'));
 let next=0;
 const slots=grid.map((entry,index)=>entry&&index>=start&&index<end?occupied[next++].id:entry?.id??null);
 saveStashSlots(profile,slots);
 return true;
}
export function sortEquipment(items){items.sort((a,b)=>b.rarity-a.rarity||M.itemScore(b)-M.itemScore(a));}
export function sortStash(profile){
 sortEquipment(profile.stash);
 profile.flaskStash?.sort((a,b)=>b.rarity-a.rarity||b.quality-a.quality||b.level-a.level);
}
export function find(profile,heroId,id,from){
 const c=profile.characters?.[heroId];if(!c)return null;
 if(from==='flask-equipped'){const item=c.flaskItems.find(i=>i&&i.id===id);return item?ownedEntry(item,from):null;}
 return [...list(profile,heroId),...stashEntries(profile),...resourceEntries(profile,heroId)].find(e=>e.id===id&&(!from||e.from===from))??null;
}
export function filter(entries,query='',category='all'){
 const words=query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
 return entries.filter(e=>{if(category!=='all'&&!(category==='entry'?['ticket','fragment','key','mark','emblem','voucher'].includes(e.kind):category==='currency'?['gold','shard'].includes(e.kind):e.kind===category))return false;const text=[e.name,e.description,e.shared?'共用':'角色',e.item?.type&&M.FLASKS[e.item.type]?.name].join(' ').toLocaleLowerCase();return words.every(w=>text.includes(w));});
}
export function reorder(profile,heroId,id,before=null){const c=profile.characters?.[heroId],entries=list(profile,heroId),ids=entries.map(e=>e.id);if(!c||!ids.includes(id)||before!==null&&!ids.includes(before)||id===before)return false;ids.splice(ids.indexOf(id),1);ids.splice(before===null?ids.length:ids.indexOf(before),0,id);c.inventoryOrder=ids;return true;}
export function preserveReplacedPositions(previous,next){
 if(!Array.isArray(next.inventoryOrder))return;
 const before=new Set([...(previous.bag??[]),...(previous.flaskBag??[])].map(i=>i.id)),after=new Set([...(next.bag??[]),...(next.flaskBag??[])].map(i=>i.id)),replacements=new Map();
 for(const key of ['bag','flaskBag'])for(const [index,item] of (previous[key]??[]).entries()){const replacement=next[key]?.[index];if(!after.has(item.id)&&replacement&&!before.has(replacement.id))replacements.set(item.id,replacement.id);}
 if(replacements.size)next.inventoryOrder=[...new Set(next.inventoryOrder.map(id=>replacements.get(id)??id))];
}
export function equipPotion(profile,heroId,id,slot,mode){
 const c=profile.characters?.[heroId],fail=reason=>({ok:false,reason});
 if(mode!=='camp')return fail('請回營地替換藥水。');
 if(!Array.isArray(c?.flaskItems)||c.flaskItems.length!==M.FLASK_SLOT_COUNT||!isFlaskSlot(slot))return fail('藥水位置無效。');
 const equipped=c.flaskItems.findIndex(i=>i&&i.id===id);
 if(equipped>=0){if(equipped===slot)return fail('已配置在此位置。');[c.flaskItems[equipped],c.flaskItems[slot]]=[c.flaskItems[slot],c.flaskItems[equipped]];c.flasks=c.flaskItems.map(i=>i?.type??null);return {ok:true};}
 const previous={...c,flaskBag:c.flaskBag.slice()};if(!M.equipFlask(c,id,slot))return fail('找不到背包內的藥水。');preserveReplacedPositions(previous,c);return {ok:true};
}
export function transferPotion(profile,heroId,id,direction,mode,targetSlot=null){
 const c=profile.characters?.[heroId],fail=reason=>({ok:false,reason});if(mode!=='camp'||!c)return fail('請在營地倉庫存取藥水。');
 if(!['deposit','withdraw'].includes(direction))return fail('存取方向無效。');
 const source=direction==='deposit'?c.flaskBag:profile.flaskStash??[],index=source.findIndex(i=>i.id===id);
 if(index<0)return fail('找不到這瓶藥水。');
 if(direction==='deposit'&&stashCount(profile)>=M.STASH_CAPACITY)return fail('倉庫已滿。');
 if(direction==='withdraw'&&c.flaskBag.length>=BAG_CAPACITIES.flask)return fail(`藥水背包已滿（${BAG_CAPACITIES.flask}瓶）。`);
 const slots=stashSlots(profile,M.STASH_CAPACITY);
 const slot=direction==='deposit'?(targetSlot??slots.indexOf(null)):slots.indexOf(id);
 if(!validStashSlot(slot,M.STASH_CAPACITY)||direction==='deposit'&&slots[slot]!==null)return fail('該倉庫格無法存放。');
 const target=direction==='deposit'?(profile.flaskStash??=[]):c.flaskBag;
 target.push(source.splice(index,1)[0]);
 slots[slot]=direction==='deposit'?id:null;
 saveStashSlots(profile,slots);
 return {ok:true};
}
