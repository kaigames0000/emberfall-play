import {RangerBeastCombat} from './ranger-beast-combat.js?v=108';
import {SummonRoaming} from './summon-roaming.js?v=108';
import {skillCue} from './combat-vfx.js?v=123';
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const clamp=(n,low,high)=>Math.max(low,Math.min(high,n));
const goldenAngle=2.399963229728653;
function supportAt(source,target,property='strength'){
 if(!source||source.hp<=0)return 0;
 const support=source.summonSpec.support,dx=source.x-target.x,dy=source.y-target.y;
 return dx*dx+dy*dy<=support.radius*support.radius?(support[property]??0):0;
}

// Support values are cached on character refresh. Combat never scans the tree.
export class MinionCombat{
 constructor(game){this.g=game;this.time=0;this.commandUntil=0;this.rescueReady=0;this.wardTimer=6;this.playerShields={};this.targetClaims=new Map();this.beasts=new RangerBeastCombat(game);this.roaming=new SummonRoaming(game);this.refresh();}
 refresh(){this.support={...this.g.baseS.summonSupport};this.beasts.refresh();if(!this.support.commandDuration)this.commandUntil=0;this.clampShields(this.g.player,this.g.s?.hp||this.g.baseS.hp,this.playerShields);for(const ally of this.g.summons||[])this.clampShields(ally,ally.maxHp,ally.passiveShields);}
 clampShields(target,hp,pools){for(const [key,pool]of Object.entries(pools||{})){const ratio=key==='ritual'?Math.min(pool.ratio,this.support.ritualShield||0):pool.ratio;pool.ratio=ratio;pool.max=Math.max(0,hp*ratio);pool.remaining=Math.min(pool.remaining,pool.max);if(!pool.max)delete pools[key];}}
 commandHaste(){return this.commandUntil>this.time?.1:0;}
 commandSpeed(){return this.commandUntil>this.time?.2:0;}
 reconcileSupportSources(){
  const previousHex=this.hex;
  this.ward=this.hex=null;
  for(const ally of this.g.summons){
   if(ally.hp<=0)continue;
   const kind=ally.summonSpec?.support?.kind;
   if(kind==='ward')this.ward=ally;
   if(kind==='hex')this.hex=ally;
  }
  if(previousHex||this.hex)this.refreshHexCoverage();
 }
 refreshHexCoverage(){for(const enemy of this.g.enemies||[])this.g.aggregateAuraDebuffs(enemy);}
 protectionAt(target){return this.g.mode==='dead'?0:supportAt(this.ward,target);}
 hexEffect(enemy,property,bossMultiplier){
  if(this.g.mode!=='playing'||enemy.staticObject)return 0;
  const strength=supportAt(this.hex,enemy,property);
  return enemy.type==='boss'||enemy.type==='miniboss'?strength*bossMultiplier:strength;
 }
 weakeningAt(enemy){return this.hexEffect(enemy,'strength',this.hex?.summonSpec.support.bossMultiplier??.5);}
 slowingAt(enemy){return this.hexEffect(enemy,'slow',.5);}
 onAllyDeath(ally){
  if(ally===this.ward)this.ward=null;
  if(ally===this.hex){this.hex=null;this.refreshHexCoverage();}
 }
 onOwnerDeath(){if(this.hex)this.refreshHexCoverage();}
 beginMovement(){
  this.targetClaims.clear();const g=this.g;
  for(let i=0;i<g.summons.length;i++){const ally=g.summons[i];if(!Number.isInteger(ally.formationIndex))ally.formationIndex=i;const target=ally.followTarget;if(ally.hp>0&&target?.hp>0&&g.enemies.includes(target))this.targetClaims.set(target,(this.targetClaims.get(target)||0)+1);}
 }
 movementTarget(ally,dt){
  if(ally.summonSpec?.support?.kind==='ward')return null;
  const g=this.g,old=ally.followTarget;ally.targetWait=Math.max(0,(ally.targetWait||0)-dt);
  if(old?.hp>0&&g.enemies.includes(old)&&ally.targetWait>0)return old;
  if(this.targetClaims.has(old))this.targetClaims.set(old,Math.max(0,this.targetClaims.get(old)-1));
  let nearest=Infinity;for(const e of g.enemies)if(e.hp>0)nearest=Math.min(nearest,distance(ally,e));
  let chosen=null,best=Infinity;for(const e of g.enemies){if(e.hp<=0)continue;const d=distance(ally,e);if(d>nearest+120)continue;const score=d+(this.targetClaims.get(e)||0)*60-(e===old?20:0)-this.beasts.targetPreference(ally,e);if(score<best){best=score;chosen=e;}}
  ally.followTarget=chosen;ally.targetWait=.6+(ally.formationIndex*.137% .25);
  if(chosen)this.targetClaims.set(chosen,(this.targetClaims.get(chosen)||0)+1);return chosen;
 }
 move(ally,target,dt){
  const g=this.g,bounds=g.worldBounds(),{left,right,top,bottom}=bounds,index=ally.formationIndex||0,slot=index%7,ring=Math.floor(index/7);let x,y;
  const speed=255*(g.s.speed/210)*(g.s.summonSpeed||1)*(1+(g.minionAura?.speedPct||0)+this.commandSpeed());
  const guarding=ally.summonSpec?.support?.kind==='ward'&&g.mode==='playing'&&g.enemies.some(enemy=>enemy.hp>0);
  if(!target&&!guarding){this.roaming.move(ally,dt,Math.max(0,speed),bounds);return;}
  if(target){
   const bearing=Math.atan2(g.player.y-target.y,g.player.x-target.x),fan=Math.ceil(slot/2)*(slot%2?-1:1)*.24;
   const angle=bearing+(ally.ranged?fan:index*goldenAngle),radius=ally.summonSpec?.support?.kind==='hex'?95:ally.ranged?205+ring*36:Math.max(40,Math.min(52,(target.r||22)+18));
   x=target.x+Math.cos(angle)*radius;y=target.y+Math.sin(angle)*radius;
  }else{const angle=index*goldenAngle+Math.PI/2,radius=65+ring*40;x=g.player.x+Math.cos(angle)*radius;y=g.player.y+Math.sin(angle)*radius;}
  let goal={x:clamp(x,left,right),y:clamp(y,top,bottom)};
  if(g.terrain&&(!target||!ally.ranged)&&!g.walkVisible(target||g.player,goal))goal=target||g.player;
  if(distance(ally,goal)>3)g.approachActor(ally,goal,Math.max(0,speed)*dt);ally.x=clamp(ally.x,left,right);ally.y=clamp(ally.y,top,bottom);
 }
 separate(dt){
  // At most 18 units: bounded pair relaxation also handles exact overlap and walls.
  const {left,right,top,bottom}=this.g.worldBounds(),army=this.g.summons.filter(a=>a.hp>0),strength=Math.min(1,Math.max(0,dt)*24);
  for(let pass=0;pass<4;pass++)for(let i=0;i<army.length;i++)for(let j=i+1;j<army.length;j++){
   const a=army[i],b=army[j],minimum=(a.r||17)+(b.r||17)+3;let dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy);if(d>=minimum)continue;
   if(d<.0001){const angle=(i+j*7)*goldenAngle;dx=Math.cos(angle);dy=Math.sin(angle);d=1;}else{dx/=d;dy/=d;}
   const push=(minimum-d)*.5*strength;this.g.moveActor(a,clamp(a.x-dx*push,left,right)-a.x,clamp(a.y-dy*push,top,bottom)-a.y);
   this.g.moveActor(b,clamp(b.x+dx*push,left,right)-b.x,clamp(b.y+dy*push,top,bottom)-b.y);
  }
 }
 idle(dt){this.beginMovement();for(const ally of this.g.summons)if(ally.hp>0)this.move(ally,null,dt);this.separate(dt);}
 onArmyCreated(army,cost){this.reconcileSupportSources();this.beasts.syncDefense();const paid=typeof cost==='number'?cost:Object.values(cost||{}).reduce((n,value)=>n+(Number.isFinite(value)?Math.max(0,value):0),0);if(!army.length||paid<=0)return;const ratio=this.support.ritualShield||0;if(ratio>0)for(const ally of army){ally.passiveShields??={};ally.passiveShields.ritual={remaining:ally.maxHp*ratio,max:ally.maxHp*ratio,ratio,t:6};}if(this.support.commandDuration>0)this.commandUntil=this.time+this.support.commandDuration;}
 absorbShields(target,amount){const pools=target===this.g.player?this.playerShields:target.passiveShields;for(const pool of Object.values(pools||{})){if(pool.t<=0)continue;const spent=Math.min(amount,pool.remaining);pool.remaining-=spent;amount-=spent;}return amount;}
 immune(ally){return (ally.supportInvulnerableUntil||0)>this.time;}
 rescue(ally){const rule=this.support.rescue;if(this.g.training||!rule||ally.hp<=0||this.time+1e-8<this.rescueReady)return false;this.rescueReady=this.time+rule.cooldown;ally.hp=ally.maxHp*rule.health;ally.supportInvulnerableUntil=this.time+rule.invuln;this.g.fx(ally.x,ally.y,55,'#d7d9ad','shock',.6,skillCue({id:ally.source},'shield',{sprite:'shield'}));return true;}
 singleEligible(population){const plan=this.g.armyPlan;return !!this.g.setCombat.flags.singularity&&plan?.rows?.reduce((n,row)=>n+row.count,0)===1&&population===1;}
 transferDamage(amount,type='physical'){const army=this.g.summons.filter(a=>a.hp>0);if(!this.singleEligible(army.length)||!army[0]?.singleMode)return amount;this.g.damageAlly(army[0],amount*.25,type);return amount*.75;}
 beforeAttack(ally,target,damage,options){
  const focus=this.support.focus||0;if(focus&&this.g.armyPlan.rows.length===1){if(ally.focusTarget!==target){ally.focusTarget=target;ally.focusStacks=1;ally.focusAt=this.time;}else if(this.time-(ally.focusAt||0)>=.4-1e-8){ally.focusStacks=Math.min(5,(ally.focusStacks||0)+1);ally.focusAt=this.time;}options.summonFocusBonus=focus*(ally.focusStacks||1);}else{ally.focusTarget=null;ally.focusStacks=0;}
  ally.supportAttacks=(ally.supportAttacks||0)+1;if(this.support.relay>0&&ally.supportAttacks%4===0)this.g.shoot(ally.x,ally.y,Math.atan2(target.y-ally.y,target.x-ally.x),470,damage*this.support.relay,'#b4d3ee',0,5,false,{skill:true,minion:true,damageType:'lightning',ability:ally.source,source:'link:m_relay',noCrit:true,indirect:true,setSecondary:true});
  this.beasts.beforeAttack(ally,target,options);
 }
 onHit(enemy,amount,options,uncriticalTotal){
  this.beasts.onHit(enemy,options,uncriticalTotal);
  if(!options.minion||options.dot||options.periodic||options.indirect||options.setSecondary)return;
  if(options.minionPoisonFraction>0){const raw=amount*((this.g.s.summonDamage??1)+(this.g.s.damageBonus||0)+(options.summonFocusBonus||0))*options.minionPoisonFraction,rate=this.g.mitigateDot(raw,'poison',enemy,{minion:true}),key='poison:'+(options.ability||'summon');if(rate>0){enemy.dots??={};const old=enemy.dots[key];if(!old||raw>=old.rawRate)enemy.dots[key]={damageType:'poison',rawRate:raw,rate,time:options.poisonDuration||3,source:options.ability,minion:true};}}
  const shocked=enemy.shock>0,chilled=enemy.auraSlow>0||enemy.frozen>0;
  if(uncriticalTotal>0&&this.support.confluence>0&&shocked&&chilled&&(enemy.confluenceReady||0)<=this.time){enemy.confluenceReady=this.time+1.5;this.g.hit(enemy,uncriticalTotal*this.support.confluence,true,{minion:true,damageType:'lightning',preScaled:true,noCrit:true,indirect:true,setSecondary:true,ability:options.ability,source:'link:m_confluence'});}
 }
 update(dt){
  this.beasts.update(dt);
  this.time+=dt;const army=this.g.summons.filter(a=>a.hp>0);for(const pools of [this.playerShields,...army.map(a=>a.passiveShields)])for(const [key,pool]of Object.entries(pools||{})){pool.t-=dt;if(pool.t<=0)delete pools[key];}
  this.wardTimer-=dt;if(this.wardTimer>1e-8)return;this.wardTimer=6;const warders=army.filter(a=>a.summonSpec?.shieldRatio>0);if(!warders.length)return;
  for(const recipient of [this.g.player,...army]){let ratio=0,duration=4;for(const source of warders)if(distance(source,recipient)<=source.summonSpec.shieldRadius&&source.summonSpec.shieldRatio>ratio){ratio=source.summonSpec.shieldRatio;duration=source.summonSpec.shieldDuration||4;}if(!ratio)continue;const hp=recipient===this.g.player?this.g.s.hp:recipient.maxHp,pools=recipient===this.g.player?this.playerShields:(recipient.passiveShields??={});pools.warder={remaining:hp*ratio*(recipient===this.g.player?1:1+(this.g.s.summonHealing||0)),max:hp*ratio*(recipient===this.g.player?1:1+(this.g.s.summonHealing||0)),ratio,t:duration};}
 }
}
