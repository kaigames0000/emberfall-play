import {resourceCost} from './model.js?v=140';
import {skillCue} from './combat-vfx.js?v=123';
const CORE='b_bloodaura',WARD='bloodward',installed=Symbol.for('emberfall.blood-build.v81'),paidHook=Symbol('blood-build-paid');
const clamp=(value,min,max)=>Math.max(min,Math.min(max,Number.isFinite(value)?value:0));
const live=g=>g.mode==='playing'&&!g.paused&&!g.transition&&!g.training?.finished&&g.hp>0;
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const auraQuote=(def,stats,seconds)=>resourceCost({...def,resourceDrain:true,mana:def.drain||0,lifeCost:undefined,lifePerSecond:def.lifePerSecond||0,rageCost:0},stats,seconds);

export class BerserkerBloodBuild{
 constructor(game){this.g=game;this.hero=game.c.id;this.paidSeconds=0;this.lastPulse=0;this.lastWard=-99;this.releaseAt=-99;this.signature=game.skillStamp(CORE);}
 get active(){return this.hero===this.g.c.id&&this.g.auraIds.has(CORE)&&!!this.g.ability(CORE)?.bloodBuildV81;}
 get heat(){const rules=this.g.ability(CORE)?.heatRules;return rules?clamp(Math.floor((this.paidSeconds+1e-8)/rules.secondsPerStack),0,rules.max):0;}
 details(){const def=this.g.ability(CORE),heat=this.heat,oath=def?.bloodOath;return {active:this.active,heat,paidSeconds:this.paidSeconds,drainMultiplier:1+heat*(def?.heatRules?.drainPerStack||0),ward:this.g.minionCombat?.playerShields?.[WARD]?.remaining||0,releaseReady:!!(this.active&&live(this.g)&&oath&&heat>=oath.minimumHeat&&this.paidSeconds>=oath.minimumSeconds-1e-8&&(this.g.gameplay?.time||0)>=this.releaseAt)};}
 clear(){this.paidSeconds=0;this.lastPulse=0;this.lastWard=-99;if(this.g.minionCombat?.playerShields)delete this.g.minionCombat.playerShields[WARD];}
 refresh(){const signature=this.g.skillStamp(CORE);if(this.hero!==this.g.c.id||signature!==this.signature||!this.active){this.clear();this.hero=this.g.c.id;this.signature=signature;return true;}return false;}
 // Integrate at the five heat boundaries. This makes upkeep independent of FPS
 // and uses the same discounted quote for both payment and the one-second preview.
 cost(def,stats,seconds=1){
  const dt=Math.max(0,Number.isFinite(seconds)?seconds:0),rules=def.heatRules;if(!rules||!dt)return auraQuote(def,stats,dt);
  let elapsed=this.active?this.paidSeconds:0,left=dt,weighted=0;
  for(let i=0;left>1e-10&&i<=rules.max;i++){
   const heat=clamp(Math.floor((elapsed+1e-8)/rules.secondsPerStack),0,rules.max),next=heat<rules.max?Math.max(1e-9,(heat+1)*rules.secondsPerStack-elapsed):left,part=Math.min(left,next);
   weighted+=part*(1+heat*rules.drainPerStack);elapsed+=part;left-=part;
  }
  if(left>0)weighted+=left*(1+rules.max*rules.drainPerStack);
  return auraQuote({...def,lifePerSecond:def.lifePerSecond*weighted/dt},stats,dt);
 }
 paid(def,seconds){if(!this.active||!live(this.g))return;const heat=this.heat;this.paidSeconds=Math.min(1e12,this.paidSeconds+Math.max(0,seconds));if(this.heat!==heat)this.g.applyBuffs();}
 apply(stats){if(!this.active)return;const def=this.g.ability(CORE),tempo=def?.bloodTempo,heat=this.heat;stats.haste=Math.min(4,stats.haste+heat*((def?.heatRules?.hastePerStack||0)+(tempo?.hastePerStack||0)));stats.damageBonus+=heat*(def?.heatRules?.damagePerStack||0);if(tempo){stats.castSpeed=Math.min(4,stats.castSpeed+heat*tempo.castPerStack);stats.speed*=1+heat*tempo.speedPerStack;}}
 targets(radius,max){return this.g.enemies.filter(e=>e.hp>0&&!e.worldProp&&distance(e,this.g.player)<=radius+(e.r||0)).sort((a,b)=>distance(a,this.g.player)-distance(b,this.g.player)).slice(0,max);}
 hitTargets(targets,damage,{echo=false,finisher=false}={}){
  const g=this.g;let contacts=0;for(const enemy of targets){if(!live(g))break;const hp=enemy.hp;g.hit(enemy,damage,true,{ability:CORE,damageType:'physical',tag:'attack',aura:true,periodic:true,indirect:true,setSecondary:true,noCrit:echo,bloodBuildPulse:!finisher&&!echo,bloodBuildEcho:echo,bloodBuildFinisher:finisher});if(enemy.hp<hp)contacts++;}return contacts;
 }
 pulse(def){
  const g=this.g,pulse=def.bloodPulse;if(!this.active||!live(g)||!pulse||this.paidSeconds-this.lastPulse<pulse.interval-1e-8)return false;
  this.lastPulse=this.paidSeconds;const contacts=this.hitTargets(this.targets(pulse.radius,pulse.maxTargets),g.s.atk*pulse.damage*(1+this.heat*pulse.heatDamage));
  g.fx(g.player.x,g.player.y,pulse.radius,def.color,'ring',.25,skillCue(def,'pulse'));
  if(contacts&&def.bloodWard&&this.paidSeconds-this.lastWard>=1-1e-8){this.lastWard=this.paidSeconds;const ward=def.bloodWard,max=g.s.hp*ward.cap,old=g.minionCombat.playerShields[WARD];g.minionCombat.playerShields[WARD]={ratio:ward.cap,max,remaining:Math.min(max,(old?.remaining||0)+g.s.hp*ward.perPulse),t:ward.duration};}
  const runtime=g.gameplay;
  if(contacts&&def.bloodResonance&&runtime.blood.rage>=80&&runtime.time>=runtime.resonanceAt){runtime.blood.rage-=10;runtime.resonanceAt=runtime.time+1;this.hitTargets(this.targets(Math.min(135,pulse.radius),6),g.s.atk*.25,{echo:true});}
  return contacts>0;
 }
 release(def){const oath=def?.bloodOath;if(!oath||!live(this.g)||this.heat<oath.minimumHeat||this.paidSeconds<oath.minimumSeconds-1e-8||(this.g.gameplay?.time||0)<this.releaseAt)return false;this.releaseAt=(this.g.gameplay?.time||0)+oath.cooldown;const g=this.g;this.hitTargets(this.targets(oath.radius,oath.maxTargets),g.s.atk*oath.damage*(1+this.heat*oath.heatDamage),{finisher:true});g.fx(g.player.x,g.player.y,oath.radius,def.color,'shock',.4,skillCue(def,'release'));return true;}
}

function attach(g){const blood=g.gameplay?.blood;if(!blood||blood[paidHook])return;blood[paidHook]=true;const original=blood.aura;blood.aura=function(def,dt){if(def.id!==CORE)return original.call(this,def,dt);if(!live(g))return true;const quote=g.auraResourceCost(def,dt),paid=original.call(this,def,dt);if(paid&&(quote.life>0||quote.mana>0))g.bloodBuild.paid(def,dt);return paid;};}

export function installBerserkerBloodCombat(Game){
 const P=Game.prototype;if(P[installed])return;Object.defineProperty(P,installed,{value:true});
 const old=Object.fromEntries(['reset','refresh','applyBuffs','skillStamp','auraResourceCost','auraPulseInterval','pulseAura','toggleAura','toggleAuras','updateAuras','emit'].map(key=>[key,P[key]]));
 P.skillStamp=function(id){const stamp=old.skillStamp.call(this,id);if(id!==CORE||!stamp)return stamp;const def=this.ability(id);return stamp+'|'+JSON.stringify([def.bloodPulse,def.bloodTempo,def.bloodWard,def.bloodResonance,def.bloodOath]);};
 P.reset=function(...args){this.bloodBuild=null;const result=old.reset.apply(this,args);this.bloodBuild=new BerserkerBloodBuild(this);attach(this);return result;};
 P.refresh=function(...args){const result=old.refresh.apply(this,args);if(this.bloodBuild?.refresh())this.applyBuffs();attach(this);return result;};
 P.applyBuffs=function(...args){const result=old.applyBuffs.apply(this,args);this.bloodBuild?.apply(this.s);return result;};
 P.auraResourceCost=function(value,seconds=1,statsOverride=null){const def=typeof value==='string'?this.ability(value):value;if(!def)return {life:0,mana:0,rage:0};if(def.id===CORE&&def.bloodBuildV81&&this.bloodBuild)return this.bloodBuild.cost(def,statsOverride||this.s,seconds);return statsOverride?auraQuote(def,statsOverride,seconds):old.auraResourceCost.call(this,def,seconds);};
 P.auraPulseInterval=function(value){const def=typeof value==='string'?this.ability(value):value;return def?.id===CORE&&def.bloodPulse?def.bloodPulse.interval:old.auraPulseInterval.call(this,value);};
 P.pulseAura=function(def){return def?.id===CORE&&def.bloodBuildV81?this.bloodBuild?.pulse(def):old.pulseAura.call(this,def);};
 for(const method of ['toggleAura','toggleAuras'])P[method]=function(...args){const build=this.bloodBuild,active=build?.active,def=active?this.ability(CORE):null,relevant=method==='toggleAuras'||args[0]?.id===CORE,result=old[method].apply(this,args);if(result&&active&&relevant&&!build.active){build.release(def);build.clear();}return result;};
 P.emit=function(name,...args){if(name==='dead'&&this.bloodBuild?.active){this.auraIds.delete(CORE);delete this.auraTimers[CORE];delete this.auraIntervals[CORE];this.bloodBuild.clear();this.applyBuffs();}return old.emit.call(this,name,...args);};
 P.updateAuras=function(dt){if(this.paused||this.transition||this.training?.finished)return;const result=old.updateAuras.call(this,dt);if(this.bloodBuild&&!this.bloodBuild.active)this.bloodBuild.clear();return result;};
}
