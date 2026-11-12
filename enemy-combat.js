import {projectilePattern} from './enemy-patterns.js?v=108';
import {enemySkillTier} from './combat-balance.js?v=108';
import {circleInSector,circleIntersects} from './combat-geometry.js?v=108';

const TAU=Math.PI*2;
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const RANGED=new Set(['archer','caster','wraith','bomber','summoner']);
const MELEE={melee:[12,1.25],shield:[13,1.5],elite:[22,1.8],skeleton:[5,1.6],skirmisher:[9,1.1],charger:[12,1.25]};
export const enemyMeleeDamage=(enemy,intent,scale)=>(MELEE[enemy.type]?.[0]||12)*scale*(intent.damageMultiplier??1);

// Cooldowns remain on the actor for existing encounters, debuggers and saves.
// Tactical state holds only transient commitments, never character progression.
export class EnemyCombat{
 constructor(g){this.g=g;this.sequence=0;this.tokens=4;this.frameEvents=0;}
 get skillTier(){return enemySkillTier(this.g);}
 get difficulty(){return clamp(this.g.diff||1,1,3);}
 get projectileLimit(){return [0,80,112,144][this.difficulty];}
 get frameLimit(){return [0,4,5,6][this.difficulty];}
 get eventRate(){return [0,8,11,14][this.difficulty];}
 get cadence(){return [0,.96,.88,.8][this.difficulty];}
 decorate(e){
  const seed=++this.sequence,stagger=(seed*.61803398875)%1;
  e.tactics={seed,side:seed%2?1:-1,moveClock:stagger*3,recovery:0,volley:null,attacks:0,summonedCount:0};
  e.intent=null;if(e.type==='shield')e.braceActive=true;
  e.cd+=stagger*(e.type==='summoner'?.45:.65);
  return e;
 }
 beginFrame(dt){
  this.frameEvents=0;
  if(this.g.mode!=='playing'||this.g.paused||this.g.training||this.g.transition)return;
  this.tokens=Math.min(this.frameLimit,this.tokens+Math.max(0,Math.min(.25,dt))*this.eventRate);
 }
 claimEvent(){if(this.frameEvents>=this.frameLimit||this.tokens<1)return false;this.tokens--;this.frameEvents++;return true;}
 allowProjectile(){let count=0;for(const b of this.g.bullets)if(b.hostile&&b.t>0&&++count>=this.projectileLimit)return false;return true;}
 encounterInterval(base){return base*[0,.96,.85,.74][this.difficulty];}
 cancel(e){
  e.intent=null;e.charge=null;e.summonCast=null;e.braceActive=false;
  if(e.tactics){e.tactics.volley=null;e.tactics.legacyReady=false;e.tactics.releaseOrigin=null;e.tactics.recovery=Math.max(e.tactics.recovery,.25);}
 }
 cooldown(e,base){return base*this.cadence*(.96+((e.tactics.seed*.38196601125)%1)*.08);}
 warning(x,y,r,damage,delay,type='physical',attacker=null){
  const g=this.g,limit=[0,14,20,26][this.difficulty];
  if(g.hazards.filter(h=>!h.friendly&&h.t>0).length>=limit)return;
  g.hazard(x,y,r,damage,Math.max(.85,delay),type,attacker);
 }
 beginIntent(e,kind,angle,duration,extra={}){
  e.intent={kind,shape:'sector',x:e.x,y:e.y,angle,range:62,halfArc:.7,width:22,t:duration,max:duration,color:'#e5a67d',...extra};
  e.angle=angle;e.tactics.attacks++;
 }
 move(e,target,dt){
  const g=this.g,s=e.tactics,d=distance(e,target)||1,angle=Math.atan2(target.y-e.y,target.x-e.x),speed=e.speed*(1-(e.auraSlow||0)),step=speed*dt;
  s.moveClock+=dt;
  const visible=!g.terrain||g.walkVisible(e,target);
  if(e.type==='shield')e.braceActive=false;
  if(!visible){g.approachActor(e,target,step,0);return;}
  if(RANGED.has(e.type)){
   const desired=e.type==='summoner'?300:260;
   if(d>desired+20)g.approachActor(e,target,step,desired);
   else if(d<175){const side=s.side*.35;g.moveActor(e,(-Math.cos(angle)-Math.sin(angle)*side)*step,(-Math.sin(angle)+Math.cos(angle)*side)*step);}
   else if(s.moveClock%2.8<.65)g.moveActor(e,-Math.sin(angle)*step*.5*s.side,Math.cos(angle)*step*.5*s.side);
  }else if(e.type==='skirmisher'&&d>88){
   const flank={x:target.x-Math.sin(angle)*80*s.side,y:target.y+Math.cos(angle)*80*s.side};
   g.approachActor(e,flank,step,44);
  }else g.approachActor(e,target,step,e.type==='boss'?185:e.type==='shield'?42:34);
 }
 strike(e,intent,scale){
  const g=this.g,amount=enemyMeleeDamage(e,intent,scale);
  if(circleInSector(intent,intent.angle,intent.range,intent.halfArc,g.player,16)){
   const landed=g.damage(amount,intent.damageType||'physical',intent.damageType?'projectile':null,e,intent);if(landed!==false&&g.s.thorns)g.hit(e,g.s.atk*g.s.thorns,true,{indirect:true});
  }
  for(const ally of g.summons)if(ally.hp>0&&circleInSector(intent,intent.angle,intent.range,intent.halfArc,ally,16))g.damageAlly(ally,amount,'physical',{origin:intent});
  g.fx(intent.x,intent.y,intent.range,'#b86851','slash',.22,{angle:intent.angle,halfArc:intent.halfArc});
 }
 shot(e,angle,speed,damage,color,type,r=5,origin=e){this.g.shoot(origin.x,origin.y,angle,speed,damage,color,0,r,true,{damageType:type,attacker:e});}
 volleyIntent(e,volley,duration){
  const pattern=volley.pattern,ring=pattern.includes('ring')||pattern==='spiral-gap'||pattern==='frost-orbit',shift=pattern==='cross-shift'?volley.step*Math.PI/4:pattern==='arrow-weave'?volley.step*.22:pattern==='arrow-split'?volley.step*.16:pattern==='spiral-gap'?volley.step*.35:0;
  const attacks=e.tactics.attacks;
  this.beginIntent(e,e.type==='archer'?'volley':pattern,volley.angle+shift,duration,{shape:ring?'ring':'lane',x:volley.x,y:volley.y,range:ring?155:e.type==='archer'?390:310,halfArc:ring?Math.PI:.95,gapAngle:volley.angle+shift,gapHalfArc:.55,color:e.type==='wraith'?'#8ed6e5':e.type==='archer'?'#c8c9bf':e.type==='summoner'?'#95b273':'#e2a077',rayAngles:projectilePattern(pattern,volley.step,this.difficulty).angles.map(a=>volley.angle+a)});if(volley.step)e.tactics.attacks=attacks;
 }
 firePattern(e,volley,scale){
  const spec=projectilePattern(volley.pattern,volley.step,this.difficulty);
  for(const offset of spec.angles)this.shot(e,volley.angle+offset,spec.speed,spec.damage*scale,spec.color,spec.type,6,volley);
  if(volley.step===0&&this.g.hazards.filter(h=>!h.friendly).length<6){
   if(volley.pattern==='frost-orbit')this.warning(volley.targetX,volley.targetY,48,8*scale,1.4,'cold',e);
   else if(volley.pattern.startsWith('poison')&&this.skillTier>=2)this.warning(volley.targetX,volley.targetY,50,8*scale,1.5,'poison',e);
  }
 }
 startVolley(e,angle,scale){
  const tier=this.skillTier,type=e.type,alternate=(e.phase+e.tactics.seed)%2;
  const pattern=type==='archer'?['arrow','arrow-fan','arrow-split','arrow-weave'][tier]:type==='summoner'?['poison','poison-fork','poison-cross','poison-cage'][tier]:type==='wraith'?(tier>=2?['cold-shift','frost-orbit'][tier-2]:alternate?'cold-cross':'cold-fan'):tier?['','cross-shift','gap-ring','spiral-gap'][tier]:(alternate?'cross':'fan');
  const count=type==='summoner'?1:type==='archer'&&tier===3?3:2,interval=tier>=2?.68:type==='archer'?.42:.55,windup=[.5,.65,.8,.95][tier];
  const volley={x:e.x,y:e.y,angle,pattern,remaining:count,t:windup,interval,step:0,targetX:this.g.player.x,targetY:this.g.player.y};
  this.volleyIntent(e,volley,windup);e.phase++;e.tactics.volley=volley;e.cd=this.cooldown(e,type==='archer'?2.5:type==='summoner'?3:type==='wraith'?3:2.9);
 }
 lockCharge(e){
  if(!e.charge)return;
  const q=e.charge,point={x:e.x,y:e.y};const goal=this.g.clampWorldPoint(q.x,q.y);this.g.moveActor(point,goal.x-e.x,goal.y-e.y,false);q.x=point.x;q.y=point.y;
 }
 charge(e,target,dt,scale){
  const g=this.g,q=e.charge;q.t-=dt;if(q.t>0)return;
  // A terrain-clipped endpoint must match both the warning and impact.
  const radius=q.r||90,amount=q.damage??25*scale;g.moveActor(e,q.x-e.x,q.y-e.y,false);g.fx(q.x,q.y,radius,'#d78e63','shock');
  if(circleIntersects(q,radius,g.player,16))g.damage(amount,'physical',null,e,q);
  for(const ally of g.summons)if(ally.hp>0&&circleIntersects(q,radius,ally,16))g.damageAlly(ally,amount,'physical',{origin:q});
  if(q.remaining>1){const d=distance(e,target)||1,range=Math.min(200,d);e.charge={x:e.x+(target.x-e.x)/d*range,y:e.y+(target.y-e.y)/d*range,t:1.05,r:60,damage:amount,remaining:q.remaining-1};this.lockCharge(e);}
  else {e.charge=null;e.tactics.recovery=.4;}
 }
 summon(e,dt){
  e.summonCast.t-=dt;if(e.summonCast.t>0)return;e.summonCast=null;const g=this.g;
  let living=g.enemies.filter(a=>a.hp>0&&a.summoned&&(a.type==='skeleton'||a.summonerOwner!==undefined)).length;
  for(let i=0;i<2&&living<12;i++){
   const type=this.skillTier===3?(i?'caster':'shield'):'skeleton',add=g.addEnemy(type,e.x+(i?26:-26),e.y+34,true);if(add&&type!=='skeleton')add.damageScale*=.6;
   if(add){add.cd=Math.max(add.cd,1.6+i*.3);add.summonerOwner=e.tactics.seed;e.tactics.summonedCount++;living++;}
  }
  g.fx(e.x,e.y,55,'#bb80be','shock');e.tactics.recovery=.5;
 }
 resolveBoss(e,intent,scale){
  const rage=e.rage,damage=(rage?31:24)*scale;
  if(intent.kind==='boss-ring'){
   const count=this.difficulty===1?(rage?14:12):this.difficulty===2?16:20;
   for(let i=0;i<count;i++){const angle=intent.angle+i/count*TAU,delta=Math.abs(Math.atan2(Math.sin(angle-intent.gapAngle),Math.cos(angle-intent.gapAngle)));if(delta<intent.gapHalfArc)continue;this.shot(e,angle,rage?150:135,damage,'#d99361','fire',7,intent);}
  }else if(intent.kind==='boss-fan'){
   const count=this.difficulty===1?5:this.difficulty===2?7:9;
   for(let i=0;i<count;i++)this.shot(e,intent.angle+(i-(count-1)/2)*.2,165,damage,'#d99361','fire',7,intent);
  }else if(intent.kind==='boss-crossfire'){for(const [x,y]of [[-120,0],[120,0],[0,-120],[0,120]])this.warning(intent.targetX+x,intent.targetY+y,45,damage,1.25,'fire',e);}
  else for(let i=0;i<3;i++){
   const side=i-1;this.warning(intent.targetX+Math.cos(intent.angle+Math.PI/2)*side*140,intent.targetY+Math.sin(intent.angle+Math.PI/2)*side*140,60,damage,1.05+i*.25,'fire',e);
  }
 }
 boss(e,target,angle,scale){
  if(e.hp<e.maxHp*.5&&!e.rage){e.rage=true;e.speed=85*(this.g.expeditionRisk?.conditions.enemyMove??1);e.cd=Math.min(e.cd,.5);this.g.bossAdds=1;this.g.bossRage=true;this.g.emit('rage');this.g.fx(e.x,e.y,200,'#d36440','shock',1);}
  if(e.cd>0||!this.claimEvent())return;
  const pattern=e.phase++%(this.skillTier>=2?4:3),kind=['boss-ring','boss-fan','boss-barrage','boss-crossfire'][pattern];
  this.beginIntent(e,kind,angle,this.skillTier>=2?1:pattern===0?.65:.55,{shape:pattern===0?'ring':pattern===1?'sector':'circle',range:pattern===0?165:pattern===1?360:pattern===3?45:60,halfArc:pattern===1?(.4+(this.difficulty-1)*.2):Math.PI,gapAngle:angle,gapHalfArc:.58,targetX:target.x,targetY:target.y,warningCircles:pattern===3?[[-120,0],[120,0],[0,-120],[0,120]].map(([x,y])=>({x:target.x+x,y:target.y+y})):null,color:'#e1a278'});
  e.cd=this.cooldown(e,e.rage?2.05:2.65);
 }
 legacy(e,target,dt,chapter){
  const s=e.tactics;
  if(e.cd<=0&&!s.legacyReady){
   if(!this.claimEvent()){e.cd=.12;return;}
   const angle=Math.atan2(target.y-e.y,target.x-e.x),boss=['boss','miniboss'].includes(e.type);
   this.beginIntent(e,'legacy-commit',angle,boss?1:.75,{shape:'sector',range:boss?300:350,halfArc:.8,targetX:target.x,targetY:target.y,legacyChapter:chapter});return;
  }
  s.legacyReady=false;
  const phase=e.phase;if(chapter)this.g.chapterCombat.updateEnemy(e,target,dt);else this.g.expedition.updateMiniBoss(e,target,dt);
  if(e.phase!==phase){s.attacks++;e.cd*=this.cadence;s.recovery=.45;if(e.charge)this.lockCharge(e);
   const tier=this.skillTier,g=this.g;
   if(tier>0&&!e.charge){
    if(['boss','miniboss'].includes(e.type)&&g.hazards.filter(h=>!h.friendly).length<8){
     const type=e.attackElement||(g.chapter===2?'cold':'lightning'),count=tier===3?2:1;
     const damage=10*e.damageScale*(1-(e.auraWeaken||0));
     for(let i=0;i<count;i++)this.warning(target.x+(i?125:-125),target.y+(e.phase%2?90:-90),48,damage,1.5+i*.4,type,e);
    }else if(RANGED.has(e.type)){
     const pattern=e.type==='archer'?['','arrow-fan','arrow-split','arrow-weave'][tier]:e.type==='wraith'?tier===3?'frost-orbit':'cold-shift':e.type==='summoner'?tier===3?'poison-cage':'poison-fork':tier===3?'spiral-gap':tier===2?'gap-ring':'cross-shift';
     s.volley={x:e.x,y:e.y,angle:Math.atan2(target.y-e.y,target.x-e.x),pattern,remaining:1,t:.85,interval:.7,step:0,targetX:target.x,targetY:target.y};const attacks=s.attacks;this.volleyIntent(e,s.volley,.85);s.attacks=attacks;
    }else if(MELEE[e.type])this.beginIntent(e,'melee-followup',Math.atan2(target.y-e.y,target.x-e.x),.8,{range:78,halfArc:.75,followup:true,damageMultiplier:.8});
   }
  }
 }
 update(e,target,dt){
  const g=this.g,s=e.tactics||this.decorate(e).tactics;
  if(g.mode!=='playing'||g.paused||g.training||g.transition||e.trainingDummy||e.staticObject)return;
  if(e.hp<=0||e.stun>0){this.cancel(e);return;}
  const d=distance(e,target)||1,angle=Math.atan2(target.y-e.y,target.x-e.x),scale=e.damageScale*(1-(e.auraWeaken||0));
  e.angle=e.intent?.angle??angle;e.cd-=dt*Math.min(1.5,e.attackSpeed||1);e.specialCD-=dt;s.recovery=Math.max(0,s.recovery-dt);
  if(e.summonCast){this.summon(e,dt);return;}
  if(e.charge){this.charge(e,target,dt,scale);return;}
  if(s.volley){
   const volley=s.volley;volley.t-=dt;if(e.intent)e.intent.t=Math.max(0,e.intent.t-dt);
   if(volley.t<=0){this.firePattern(e,volley,scale);volley.step++;volley.remaining--;volley.t+=volley.interval;if(!volley.remaining){s.volley=null;e.intent=null;s.recovery=.6;}else this.volleyIntent(e,volley,volley.interval);}
   return;
  }
  if(e.intent){
   const intent=e.intent;intent.t-=dt;if(intent.t>0)return;
   e.intent=null;if(intent.kind==='legacy-commit'){s.legacyReady=true;s.releaseOrigin={x:intent.x,y:intent.y,angle:intent.angle};this.legacy(e,{x:intent.targetX,y:intent.targetY},0,intent.legacyChapter);s.releaseOrigin=null;return;}if(intent.kind.startsWith('boss-'))this.resolveBoss(e,intent,scale);else{this.strike(e,intent,scale);if(this.skillTier>=1&&!intent.followup&&['melee','elite','shield','skirmisher'].includes(e.type)&&s.attacks%(this.skillTier===3?2:3)===0){this.beginIntent(e,'melee-followup',intent.angle+s.side*.45,.75,{range:intent.range+10,halfArc:.8,followup:true,damageMultiplier:.8,damageType:this.skillTier>=2?(e.type==='shield'?'cold':e.type==='skirmisher'?'poison':e.type==='elite'?'lightning':null):null});return;}}
   e.braceActive=false;s.recovery=e.type==='elite'?.7:e.type==='shield'?.75:.38;return;
  }
  if(s.recovery>0)return;
  if(!['boss','miniboss'].includes(e.type)&&target===g.player&&g.gameplay?.assassin.veiled()){this.move(e,g.gameplay.assassin.hidePoint||target,dt);return;}
  if(g.chapterCombat?.owns(e)){this.legacy(e,target,dt,true);return;}
  if(e.type==='miniboss'){this.legacy(e,target,dt,false);return;}
  if(e.elite&&e.eliteCD-dt<=0&&!this.claimEvent())e.eliteCD=Math.max(0,e.eliteCD-dt);
  else {g.updateElite(e,target,dt);if(e.charge){this.lockCharge(e);return;}}
  if(e.type==='elite'&&e.specialCD<=0&&this.claimEvent()){e.specialCD=this.encounterInterval(7);this.warning(target.x,target.y,80,18*scale,1.4,'physical',e);g.fx(e.x,e.y,45,'#d7b97d','ring',.6);}
  // Commit the stationary attack before movement; the warning origin stays fixed.
  if(e.type==='boss'){this.boss(e,target,angle,scale);if(!e.intent)this.move(e,target,dt);return;}
  if(e.cd<=0){
   if(e.type==='summoner'&&e.chargesLeft>0){if(!this.claimEvent())return;e.chargesLeft--;e.cd=this.cooldown(e,7.5);e.summonCast={t:1.4,max:1.4};s.attacks++;g.fx(e.x,e.y,45,'#bb80be','ring',1.4);return;}
   if(e.type==='bomber'){if(!this.claimEvent())return;this.warning(target.x,target.y,52,13*scale,1.4,'fire',e);if(this.skillTier>=1&&e.phase%2)this.warning(target.x+125*s.side,target.y,44,9*scale,1.8,'fire',e);if(this.skillTier>=2&&g.hazards.filter(h=>!h.friendly).length<8)this.warning(target.x-125*s.side,target.y+75,44,9*scale,2.1,'fire',e);if(this.skillTier===3&&g.hazards.filter(h=>!h.friendly).length<8)this.warning(target.x+75,target.y-125,42,8*scale,2.4,'fire',e);e.phase++;s.attacks++;e.cd=this.cooldown(e,3.15);s.recovery=.45;return;}
   if(RANGED.has(e.type)){if(!this.claimEvent())return;this.startVolley(e,angle,scale);return;}
   if(e.type==='charger'&&d<380){if(!this.claimEvent())return;e.cd=this.cooldown(e,3.8);s.attacks++;e.charge={x:target.x,y:target.y,t:1.1,r:65,damage:17*scale,remaining:this.skillTier>=2?2:1};this.lockCharge(e);return;}
   if(d<(e.type==='elite'?90:e.type==='shield'?75:67)&&this.claimEvent()){
    const shield=e.type==='shield';e.braceActive=shield;
    this.beginIntent(e,shield?'brace':'melee',angle,e.type==='elite'?.72:shield?.6:e.type==='skirmisher'?.5:.55,{range:e.type==='elite'?82:shield?70:58,halfArc:e.type==='skirmisher'?.52:.7});
    e.cd=this.cooldown(e,MELEE[e.type]?.[1]||1.25);return;
   }
  }
  this.move(e,target,dt);
 }
}
