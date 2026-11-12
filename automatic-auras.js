import {auraLoadout,assignAura,resourceCost} from './model.js?v=140';

// Remember handled selections, not affordability. A depleted aura must remain off
// until selected again; regeneration must never cause a start/stop loop.
export function installAutomaticAuras(Game){
 const P=Game.prototype,old={reset:P.reset,update:P.update,updateAuras:P.updateAuras,toggleAura:P.toggleAura,toggleAuras:P.toggleAuras};
 P.reset=function(...args){this._handledAuras=new Set();this._auraConfigStamp='';return old.reset.apply(this,args);};
 P.syncConfiguredAuras=function(){
  const stamp=this.c.id+':'+JSON.stringify(this.c.auraSkills);if(stamp===this._auraConfigStamp)return;
  const selected=auraLoadout(this.c),known=this._handledAuras??=new Set();
  for(const id of [...known])if(!selected.includes(id))known.delete(id);
  let changed=false;
  for(const id of selected){
   if(known.has(id))continue;known.add(id);if(this.auraIds.has(id))continue;
   const def=this.ability(id),drain=this.auraResourceCost(def),cost=resourceCost(def,this.s),floor=drain.life>0?this.s.hp*.2:1;
   if(!this.payResourceCost(cost,{floor,aura:true})){assignAura(this.c,id,false);known.delete(id);this.emit('auraConfigOff',{id,reason:cost.life>0?'life':'mana'});continue;}
   this.auraIds.add(id);this.auraTimers[id]=this.auraPulseInterval(def);this.auraIntervals[id]=this.auraTimers[id];this.auraCue(def);changed=true;
  }
  if(changed)this.applyBuffs();this._auraConfigStamp=this.c.id+':'+JSON.stringify(this.c.auraSkills);
 };
 P.update=function(dt){if(!this.paused&&!this.transition&&this.hp>0&&['camp','playing'].includes(this.mode))this.syncConfiguredAuras();return old.update.call(this,dt);};
 // Kept for scripted encounters and legacy APIs. The player UI uses selection.
 for(const name of ['toggleAura','toggleAuras'])P[name]=function(...args){this._handledAuras=new Set(auraLoadout(this.c));return old[name].apply(this,args);};
 P.updateAuras=function(dt){
  const before=[...this.auraIds],result=old.updateAuras.call(this,dt);
  for(const id of before)if(!this.auraIds.has(id)&&auraLoadout(this.c).includes(id)){assignAura(this.c,id,false);this._handledAuras?.delete(id);this._auraConfigStamp='';this.emit('auraConfigOff',{id,reason:this.auraResourceCost(id).life>0?'life':'mana'});}
  return result;
 };
}
