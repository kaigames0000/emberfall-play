export class CombatInput{
 constructor(actions){this.actions=actions;this.held=new Map();this.timer=0;}
 press(token,slot){
  if(!this.actions.enabled()||this.held.has(token)||!Number.isInteger(slot)||slot<0||slot>2)return;
  const shared=[...this.held.values()].includes(slot);this.held.set(token,slot);
  if(!shared){this.timer=.08;this.actions.cast(slot,true,false);}
 }
 release(token){
  if(!this.held.has(token))return;const slot=this.held.get(token);this.held.delete(token);
  if(![...this.held.values()].includes(slot))this.actions.release(slot,false);
 }
 clear(){const slots=new Set(this.held.values());this.held.clear();this.timer=0;for(const slot of slots)this.actions.release(slot,true);}
 update(dt){
  if(!this.held.size)return;if(!this.actions.enabled()){this.clear();return;}
  this.timer-=Math.max(0,Number.isFinite(dt)?dt:0);if(this.timer>1e-8)return;this.timer=.08;
  for(const slot of new Set(this.held.values())){if(!this.actions.enabled()){this.clear();break;}if(this.actions.repeatable(slot))this.actions.cast(slot,true,true);}
 }
}
