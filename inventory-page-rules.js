export const PAGE_IDS=Object.freeze([1,2,3,4,5]);
export const MAX_PAGE_NAME=16;
export const MAX_PAGE_ASSIGNMENTS=512;
const legacyDefaults=['equipment','flask','enhancement'];
const legacyOptional=['gem','entry'];
const record=value=>!!value&&typeof value==='object'&&!Array.isArray(value);

export function cleanPageName(value){
 if(typeof value!=='string')return null;
 const name=value.trim().normalize('NFC');
 return [...name].length<=MAX_PAGE_NAME&&!/[\u0000-\u001f\u007f<>]/.test(name)?name:null;
}
export function validPages(value){
 if(value===undefined)return true;
 if(Array.isArray(value)){
  return value.length>=legacyDefaults.length&&value.length<=PAGE_IDS.length&&
   legacyDefaults.every((id,index)=>value[index]===id)&&value.slice(legacyDefaults.length).every(id=>legacyOptional.includes(id))&&
   new Set(value).size===value.length;
 }
 if(!record(value)||Object.keys(value).length!==2||!record(value.names)||!record(value.items))return false;
 const names=Object.entries(value.names),items=Object.entries(value.items);
 return names.every(([id,name])=>PAGE_IDS.some(page=>String(page)===id)&&!!name&&name===cleanPageName(name))&&
  items.length<=MAX_PAGE_ASSIGNMENTS&&items.every(([id,page])=>id.length>0&&id.length<=200&&page!==1&&PAGE_IDS.includes(page));
}
