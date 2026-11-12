import * as M from './model.js?v=140';
import {playerAimAngle} from './aiming.js?v=108';
import {skillCue} from './combat-vfx.js?v=123';
import {circleInSector} from './combat-geometry.js?v=108';
export class WeaponCombat{
 constructor(g,runtime){this.g=g;this.runtime=runtime;this.nextHand='main';this.followups=[];this.rhythm=0;this.rhythmUntil=0;this.counterUntil=0;this.shadowRhythm=0;}
 attack(){
  const g=this.g,state=M.dualState(g.c);if(!state.dual)return null;
  if(!this.runtime.usable()||g.channelBlocksBasic()||g.attackCD>0)return false;
  const hand=this.nextHand;this.nextHand=hand==='main'?'off':'main';const w=M.weaponDefinition(g.c.equipment[hand==='main'?'weapon':'offhand'],g.c.cls);
  if(state.spellDual)return this.runtime.originalAttack(w,hand==='off'?g.s.offhandAtk:g.s.atk,hand);
  g.attackCD=w.interval/Math.max(.25,g.s.haste);this.sweep({x:g.player.x,y:g.player.y},g.aim(),w.range,(hand==='off'?g.s.offhandAtk:g.s.atk)*w.damageMult,false,{tag:'attack',hand},w.maxTargets??3,w.halfArc??1.3);return true;
 }
 queue(task){if(this.followups.length>=24)this.followups.shift();this.followups.push(task);}
 sweep(center,angle,radius,damage,skill,options,max=5,arc=1.5,exclude=null){
  const g=this.g,hits=new Set();
  for(const e of this.runtime.targets(radius,center,Infinity)){
   if(hits.size>=max)break;
   if(exclude?.has(e)||!circleInSector(center,angle,radius,arc,e))continue;
   hits.add(e);g.hit(e,damage,skill,options);
  }
  g.fx(center.x,center.y,radius,options.color||'#e3b77c','slash',.22,skillCue({id:'weapon-basic',...options},'melee',{angle,halfArc:arc}));return hits;
 }
 strike(def,options,center=this.g.player,{channel=false,landing=false}={}){
  const g=this.g,state=M.dualState(g.c),angle=playerAimAngle(g,options,center),p={x:center.x,y:center.y};
  center.angle=angle;
  let radius=def.radius||120,mult=1,arc=def.id==='b_cleave'&&this.runtime.comboUntil>this.runtime.time?(def.m10?2.4:def.m3?1.6:1.25):1.25,max=def.id==='b_execute'?3:6;
  if(state.mode==='single-twohand'){radius*=landing?1.35:1.25;mult=channel?1.3:1.08;}
  if(state.titan)radius*=1.15;
  let finisher=false;if(def.id==='b_execute'&&state.dual&&g.c.talents.b_dual&&this.rhythm>=3){finisher=true;mult*=1.25;this.rhythm=0;}
  if(def.id==='b_execute'&&state.mode==='single-onehand'){const shield=g.skillEffects.find(e=>e.id==='b_weapon_guard'&&e.t>0);if(shield){mult*=1+Math.min(.25,shield.shield/g.s.hp*6.25);shield.shield=0;}}
  if(def.id==='b_cleave'&&this.counterUntil>this.runtime.time&&state.mode==='single-onehand'){mult*=1.3;this.counterUntil=0;}
  if(state.dual&&!channel){
   this.sweep(p,angle,radius,g.s.atk*def.damage*mult*.5,true,{...options,hand:'main'},max,arc);
   this.queue({t:.085,center:p,angle,radius,damage:g.s.offhandAtk*def.damage*mult*.5,max,arc,options:{...options,hand:'off',dualFollowup:true}});
   if(g.c.talents.b_dual&&(def.id==='b_cleave'||landing)){this.rhythm=Math.min(3,this.rhythm+1);this.rhythmUntil=this.runtime.time+4;}
  }else{
   const hand=state.dual?this.nextHand:'main';if(state.dual)this.nextHand=hand==='main'?'off':'main';
   const damage=(hand==='off'?g.s.offhandAtk:g.s.atk)*def.damage*mult,hits=this.sweep(p,angle,radius,damage,true,{...options,hand},max,channel?Math.PI:arc);
   if(channel&&def.m10&&g.c.talents.b_execute){this.flurryTicks=(this.flurryTicks||0)+1;if(this.flurryTicks%4===0)this.sweep(p,angle,radius+40,damage*.3,true,{...options,indirect:true,setSecondary:true,noCrit:true},4,.7,hits);}
   if(state.mode==='single-twohand'&&!channel){this.sweep(p,angle,radius+65,damage*.35,true,{...options,indirect:true,setSecondary:true,noCrit:true},6,1.1,hits);}
  }
  if(finisher&&state.titan&&g.c.talents.b_titan_grip){const hits=this.runtime.targets(radius,p,8);for(const e of hits)this.runtime.secondary(e,(g.s.atk+g.s.offhandAtk)*.08,'physical',def.id);g.fx(p.x,p.y,radius,def.color,'shock',.25,skillCue(def,'impact'));}
  return true;
 }
 guard(){const g=this.g,old=g.skillEffects.find(e=>e.id==='b_weapon_guard');if(old){old.shield=Math.max(old.shield||0,g.s.hp*.035);old.t=1.5;}else g.skillEffects.push({id:'b_weapon_guard',shield:g.s.hp*.035,t:1.5,buff:{}});}
 onBlock(){if(M.dualState(this.g.c).mode==='single-onehand')this.counterUntil=this.runtime.time+2;}
 afterHit(e,o){if(o.dualFollowup||o.indirect||o.minion||o.triggered||o.dot)return;const id=o.id||o.ability,state=M.dualState(this.g.c);
  if(state.mode==='single-onehand'&&['b_cleave','b_flurry','b_leap'].includes(id)&&this.runtime.oncePer('weapon-guard',o.castId))this.guard();
  if(state.mode==='dual-daggers'&&this.g.c.talents.a_dual&&id==='a_stab'&&this.runtime.oncePer('dagger-rhythm',o.castId)){this.shadowRhythm=(this.shadowRhythm+1)%3;if(!this.shadowRhythm){const g=this.g;this.queue({t:.085,center:{x:g.player.x,y:g.player.y},angle:Math.atan2(e.y-g.player.y,e.x-g.player.x),radius:115,damage:g.s.offhandAtk*.35,max:1,options:{ability:id,hand:'off',damageType:'physical',indirect:true,setSecondary:true,noCrit:true,color:'#b19bce'}});}}
 }
 update(dt){if(this.rhythmUntil<this.runtime.time)this.rhythm=0;const due=[];this.followups=this.followups.filter(f=>{f.t-=dt;if(f.t<=0){due.push(f);return false;}return true;});if(this.g.mode!=='playing')return;for(const f of due)this.sweep(f.center,f.angle,f.radius,f.damage,true,f.options,f.max,f.arc||1.5);}
}
