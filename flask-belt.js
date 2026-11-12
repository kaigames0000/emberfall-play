export const FLASK_SLOT_COUNT=4;
export const LEGACY_FLASK_SLOT_COUNT=3;

export function isFlaskSlot(index){return Number.isInteger(index)&&index>=0&&index<FLASK_SLOT_COUNT;}

const bounded=(value,max)=>Number.isFinite(value)&&value>=0&&value<=max;

export function validFlaskCheckpoint(flasks){
 if(!Array.isArray(flasks)||![LEGACY_FLASK_SLOT_COUNT,FLASK_SLOT_COUNT].includes(flasks.length))return false;
 const ids=new Set();
 for(const slot of flasks){
  if(slot===null&&flasks.length===FLASK_SLOT_COUNT)continue;
  if(!slot||typeof slot.id!=='string'||!slot.id.length||slot.id.length>200||ids.has(slot.id)||
    !bounded(slot.charges,500)||!bounded(slot.cooldown,60))return false;
  ids.add(slot.id);
 }
 return true;
}

export function migrateFlaskCheckpoint(checkpoint){
 if(checkpoint?.flasks?.length===LEGACY_FLASK_SLOT_COUNT&&validFlaskCheckpoint(checkpoint.flasks))checkpoint.flasks.push(null);
}

export function snapshotFlaskBelt(flasks){
 return flasks.map(({id,charges,cooldown})=>id===null?null:{id,charges,cooldown});
}

export function restoreFlaskBelt(flasks,snapshot){
 if(!Array.isArray(snapshot))return;
 for(const slot of flasks){
  if(!slot.def)continue;
  // Camp can move a bottle to a different hotkey before the campaign resumes.
  const saved=snapshot.find(entry=>entry?.id===slot.id);
  if(saved){slot.charges=Math.max(0,Math.min(slot.def.maxCharges,saved.charges));slot.cooldown=Math.max(0,saved.cooldown||0);}
 }
}
