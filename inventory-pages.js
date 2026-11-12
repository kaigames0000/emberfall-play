import * as M from './model.js?v=140';
import {list} from './inventory-items.js?v=144';
import {PAGE_IDS,MAX_PAGE_NAME,MAX_PAGE_ASSIGNMENTS,cleanPageName,validPages} from './inventory-page-rules.js?v=125';
export {PAGE_IDS,MAX_PAGE_NAME,cleanPageName,validPages};

// A legacy category array has no custom labels or placements.
const preferences=hero=>hero?.inventoryPages?.names?hero.inventoryPages:{names:{},items:{}};

export function pages(hero){
 const {names}=preferences(hero);
 return PAGE_IDS.map(id=>({id,name:names[id]??('分頁 '+id),customName:names[id]??''}));
}
export function pageForItem(hero,id){
 const {items}=preferences(hero);
 return Object.hasOwn(items,id)?items[id]:1;
}
export function groupedEntries(profile,heroId){
 const hero=profile.characters?.[heroId],groups=Object.fromEntries(PAGE_IDS.map(id=>[id,[]]));
 if(!hero)return groups;
 const {items}=preferences(hero);
 for(const entry of list(profile,heroId)){
  const page=Object.hasOwn(items,entry.id)?items[entry.id]:1;
  (groups[page]??groups[1]).push(entry);
 }
 return groups;
}
export function entriesForPage(profile,heroId,id){
 return PAGE_IDS.includes(id)?groupedEntries(profile,heroId)[id]:[];
}
export function renamePage(hero,id,value){
 const name=cleanPageName(value);
 if(!hero||!PAGE_IDS.includes(id)||name===null)return false;
 const current=preferences(hero),names={...current.names};
 if(name)names[id]=name;else delete names[id];
 hero.inventoryPages={...current,names};
 return true;
}

function knownSupply(id){
 const [scope,kind,key,tier,...extra]=id.split(':');
 if(scope!=='supply'||extra.length)return false;
 if(kind==='gem')return !!M.makeGem(key,Number(tier));
 if(tier!==undefined)return false;
 if(kind==='material')return Object.hasOwn(M.MATERIALS,key);
 if(kind==='key')return key==='endgame';
 return ['fragment','ticket','emblem','voucher'].includes(kind)&&['1','2','3'].includes(key);
}
export function pruneAssignments(hero){
 const current=hero.inventoryPages;
 if(!current?.items)return;
 const owned=new Set([
  ...hero.bag,...(hero.flaskBag??[]),...Object.values(hero.equipment),...(hero.flaskItems??[]),...(hero.pendingLoot??[])
 ].filter(Boolean).map(item=>item.id));
 const entries=Object.entries(current.items),items=entries.filter(([id])=>owned.has(id)||knownSupply(id));
 if(items.length!==entries.length)hero.inventoryPages={...current,items:Object.fromEntries(items)};
}
export function moveToPage(profile,heroId,itemId,target){
 const hero=profile.characters?.[heroId];
 if(!hero||!PAGE_IDS.includes(target)||pageForItem(hero,itemId)===target||!list(profile,heroId).some(entry=>entry.id===itemId))return false;
 pruneAssignments(hero);
 const current=preferences(hero),items={...current.items};
 if(target===1)delete items[itemId];
 else{
  if(!Object.hasOwn(items,itemId)&&Object.keys(items).length>=MAX_PAGE_ASSIGNMENTS)return false;
  // Object spread with a computed key also handles imported IDs such as __proto__.
  hero.inventoryPages={...current,items:{...items,[itemId]:target}};
  return true;
 }
 hero.inventoryPages={...current,items};
 return true;
}
