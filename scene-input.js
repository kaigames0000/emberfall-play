import {CAMP_STATIONS} from './camp.js?v=108';
import {campStationArt,FIELD_EXIT,PROP_FRAME} from './bplus-scene.js?v=124';
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
export const NAVIGATION_KEYS=Object.freeze({b:'inventory',k:'talents',t:'passives',p:'stats',o:'settings',l:'achievements'});
export const ACTIVE_SKILL_KEYS=Object.freeze(['1','2','3']);
export const ACTIVE_SKILL_LABELS=Object.freeze(['1／左鍵','2／右鍵','3／Q']);
export const FLASK_KEYS=Object.freeze(['4','5','6','7']);
export const DODGE_KEY=' ';
export const DODGE_LABEL='空白';
export const manualSkillSlot=key=>key==='q'?2:ACTIVE_SKILL_KEYS.indexOf(key);
export const flaskKeySlot=key=>FLASK_KEYS.indexOf(key);
export function navigationPanel(event){
 if(event.ctrlKey||event.altKey||event.metaKey||event.isComposing||event.defaultPrevented)return null;
 const field=event.target?.closest?.('input,textarea,select,[contenteditable]');
 if(field&&(field.tagName!=='INPUT'||!['checkbox','radio','button','submit','range'].includes(field.type)))return null;
 return NAVIGATION_KEYS[String(event.key??'').toLowerCase()]??null;
}
function spriteBounds({w,h,offsetY=0}){
 return {left:w/2,right:w/2,top:Math.ceil(h*.94-offsetY),bottom:Math.max(18,h*.06+offsetY)};
}
function withinBounds(point,origin,{left,right,top,bottom}){
 return point.x>=origin.x-left&&point.x<=origin.x+right&&point.y>=origin.y-top&&point.y<=origin.y+bottom;
}
function targets(g,prompt=false){
 if(g.mode==='camp')return CAMP_STATIONS.map(entity=>{
  const art=campStationArt[entity.id];
  const bounds=art.npc?{left:52,right:52,top:82,bottom:48}:spriteBounds(art);
  return {kind:'npc',entity,range:86,...bounds};
 });
 if(g.mode!=='playing')return [];
 return [
  ...(g.worldObjects?.props??[]).filter(p=>p.kind==='chest'&&!p.used).map(entity=>({kind:'chest',entity,range:88,...spriteBounds(PROP_FRAME.chest)})),
  ...(g.shrines??[]).filter(p=>!p.used).map(entity=>({kind:'shrine',entity,range:90,...spriteBounds(PROP_FRAME.shrine)})),
  ...(g.objectives??[]).filter(p=>!p.used).map(entity=>({kind:'objective',entity,range:90,...spriteBounds(PROP_FRAME[entity.kind]??PROP_FRAME.crystal)})),
  ...(prompt?[]:(g.drops??[]).map(entity=>({kind:'pickup',entity,range:65,left:24,right:24,top:26,bottom:28}))),
  ...(prompt?[]:(g.worldObjects?.pickups??[]).map(entity=>({kind:'energy',entity,range:50,left:16,right:16,top:16,bottom:16}))),
  ...(g.cleared&&!g.training?[{kind:'exit',entity:g,point:FIELD_EXIT,range:60,...spriteBounds(PROP_FRAME.exit)}]:[])
 ];
}
const position=target=>target.point||target.entity;
export function sceneTargetAt(g,point){if(!point||!Number.isFinite(point.x)||!Number.isFinite(point.y))return null;return targets(g).filter(t=>withinBounds(point,position(t),t)).sort((a,b)=>distance(position(a),point)-distance(position(b),point))[0]??null;}
export function leftClickAction(g,point,hasSkill,stationary=false){
 if(stationary&&g.mode==='playing')return {kind:'cast',stationary:true};
 const interactive=sceneTargetAt(g,point);
 if(interactive&&!['pickup','energy'].includes(interactive.kind))return {kind:'interact',target:interactive};
 if(g.mode==='playing'&&hasSkill){
  const enemy=g.damageables().filter(actor=>{
   if(actor.hp<=0)return false;
   if(actor.worldProp&&PROP_FRAME[actor.kind])return withinBounds(point,actor,spriteBounds(PROP_FRAME[actor.kind]));
   const radius=actor.r||16;
   const height=actor.worldProp?radius*2:Math.max(58,radius*2.6);
   return Math.abs(actor.x-point.x)<=radius+9&&point.y>=actor.y-height&&point.y<=actor.y+radius*.5;
  }).sort((a,b)=>distance(a,point)-distance(b,point))[0];
  if(enemy)return {kind:'cast',target:enemy};
 }
 return interactive?{kind:'interact',target:interactive}:{kind:'move'};
}
export class SceneInteraction{
 constructor(g,openPanel){this.g=g;this.openPanel=openPanel;this.pending=null;}
 usable(){const g=this.g;return !g.paused&&!g.transition&&!g.training?.finished&&['camp','playing'].includes(g.mode);}
 clear(cancel=true){this.pending=null;if(cancel)this.g.cancelMoveTarget();}
 activate(target){const g=this.g;this.clear();if(target.kind==='npc'){this.openPanel(target.entity.panel,target.entity);return true;}if(target.kind==='exit'){this.openPanel('quests',target.entity);return true;}if(target.kind==='chest')return g.worldObjects.interact(target.entity);if(target.kind==='shrine')return g.activateShrine(target.entity);if(target.kind==='objective')return g.chapterCombat.activateObjective(target.entity);if(target.kind==='pickup')return g.pickup(target.entity);if(target.kind==='energy'){g.worldObjects.update(0);return true;}return false;}
 nearby(target){return distance(this.g.player,position(target))<target.range&&this.g.walkVisible(this.g.player,position(target));}
 click(point){if(!this.usable())return false;const target=sceneTargetAt(this.g,point);if(!target)return false;this.pending=target;if(this.nearby(target))this.activate(target);else{const p=position(target);this.g.setMoveTarget(p.x,p.y);}return true;}
 nearestInteraction(prompt=false){if(!this.usable())return null;return targets(this.g,prompt).filter(t=>this.nearby(t))
  .sort((a,b)=>distance(this.g.player,position(a))-distance(this.g.player,position(b)))[0]??null;}
 interactNearest(){const target=this.nearestInteraction(true)||this.nearestInteraction();return target?this.activate(target):false;}
 update(){if(!this.pending)return;const g=this.g,target=this.pending;if(!this.usable()||Math.hypot(g.input.x,g.input.y)>.1||!targets(g).some(t=>t.kind===target.kind&&t.entity===target.entity)){this.clear();return;}if(this.nearby(target))this.activate(target);else if(!g.moveTarget){const p=position(target);g.setMoveTarget(p.x,p.y);}}
}
export class CursorMovement{
 constructor(actions){this.actions=actions;this.held=null;this.client=null;this.timer=0;}
 press(button,x,y){if(!this.actions.enabled()||!Number.isFinite(x)||!Number.isFinite(y))return false;this.held=button;this.client={x,y};this.timer=.08;this.flush();return true;}
 movePointer(x,y,buttons){if(this.held!==null&&Number.isInteger(buttons)&&!(buttons&(this.held===0?1:4))){this.release(this.held);return;}if(this.held!==null&&Number.isFinite(x)&&Number.isFinite(y))this.client={x,y};}
 flush(){if(!this.client)return;const p=this.actions.worldPoint(this.client.x,this.client.y);this.actions.move(p.x,p.y);}
 update(dt){if(this.held===null)return;if(!this.actions.enabled()){this.clear();return;}this.timer-=Math.max(0,Number.isFinite(dt)?dt:0);if(this.timer<=0){this.timer=.08;this.flush();}}
 release(button){if(this.held===button){this.held=null;this.client=null;}}
 clear(){this.held=null;this.client=null;this.timer=0;this.actions.cancel();}
}
