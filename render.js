import {drawPixelEnemy,drawPixelSummon} from './pixel-actors.js?v=127';
import {drawAnimeUnit,drawAnimeProp,drawAnimePickup,warmAnimeArt} from './anime-art.js?v=125';
import {drawAnimeBolt,projectilePaintMargin} from './anime-effects.js?v=126';
import {combatVisualOptions,drawCombatField,drawCombatEffect,fieldInView,DANGER_RIM} from './field-effects.js?v=135';
import {majorEnemyArea,majorEnemyCharge,majorEnemyIntent} from './enemy-warnings.js?v=108';
import {roomView} from './world-space.js?v=108';
import {drawHero} from './character-model.js?v=130';
import {activeHeroMovement} from './hero-motion.js?v=127';
import {summonStrikePose} from './summon-pose.js?v=127';
import {RARITIES,ABILITIES,abilityFor,equipmentAuras,SHRINES} from './model.js?v=140';
import {paintChapterBackdrop,paintChapterAmbient,paintRoomTerrain} from './chapter-scenes.js?v=108';
import {paintCampBackdrop,paintCampFocus,paintCampLabels} from './camp.js?v=108';
import {drawFieldProp, drawSceneSprite, FIELD_EXIT, paintRoomDressing, prepareSceneArt, sceneArtRevision, scenePickup} from './bplus-scene.js?v=124';
import {equipmentArt} from './equipment-visuals.js?v=124';
import {drawRareGear,rareGearDesign} from './rare-gear-art.js?v=108';
import {ACTOR_DEFENSES,ACTOR_STATUSES,actorStatusShape,enemyStatusEffects} from './status-effects.js?v=130';
import {drawAuraFootprint} from './aura-vfx.js?v=127';
import {drawSignatureMark} from './skill-signature-vfx.js?v=135';
import {paintHitMarks} from './combat-hit-feedback.js?v=123';
const PI=Math.PI,TAU=PI*2;
const COMBAT_CAMERA_SCALE=.92,COMBAT_BODY_SCALE=.9;
export class Renderer{
 constructor(canvas,game){this.canvas=canvas;this.ctx=canvas.getContext('2d');this.g=game;this.w=0;this.h=0;this.scale=1;this.cx=560;this.cy=430;this.reducedMotion=globalThis.matchMedia?.('(prefers-reduced-motion: reduce)');warmAnimeArt();prepareSceneArt();}
 worldPoint(clientX,clientY){
  const box=this.canvas.getBoundingClientRect();
  return {x:this.cx+(clientX-box.left-box.width/2-(this.shakeX||0))/this.scale,y:this.cy+(clientY-box.top-box.height/2-(this.shakeY||0))/this.scale};
 }
 screenPoint(x,y){
  return {x:this.w/2+(x-this.cx)*this.scale+(this.shakeX||0),y:this.h/2+(y-this.cy)*this.scale+(this.shakeY||0)};
 }
 moveDestination(){
  const target=this.g.moveTarget;
  if(!target||!['camp','playing'].includes(this.g.mode))return;
  const c=this.ctx,ring=12+Math.sin(this.g.clock*5)*2;
  c.save();c.globalAlpha=.85;c.setLineDash([4,4]);
  this.circle(target.x,target.y,ring,null,'#d0deb1');c.setLineDash([]);
  this.path([[target.x,target.y-5],[target.x+5,target.y],[target.x,target.y+5],[target.x-5,target.y]],'#bcd4a7','#e7e4c9');
  c.restore();
 }
 resize(){let r=this.canvas.getBoundingClientRect(),d=Math.min(globalThis.devicePixelRatio||1,2);if(this.canvas.width!==Math.round(r.width*d)||this.canvas.height!==Math.round(r.height*d)){this.canvas.width=Math.round(r.width*d);this.canvas.height=Math.round(r.height*d);}this.w=r.width;this.h=r.height;this.dpr=d;}
 path(points,fill,stroke){let c=this.ctx;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.stroke();}}
 circle(x,y,r,fill,stroke){let c=this.ctx;c.beginPath();c.arc(x,y,r,0,TAU);if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.stroke();}}
 line(points,color,width=1){let c=this.ctx;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.strokeStyle=color;c.lineWidth=width;c.stroke();c.lineWidth=1;}
 glow(x,y,r,color){let c=this.ctx,gr=c.createRadialGradient(x,y,0,x,y,r);gr.addColorStop(0,color);gr.addColorStop(1,'transparent');c.fillStyle=gr;c.fillRect(x-r,y-r,r*2,r*2);}
 torch(x,y,t){let c=this.ctx;this.glow(x,y,115,'rgba(197,113,49,.16)');this.path([[x-10,y+24],[x+10,y+24],[x+6,y+12],[x-6,y+12]],'#373630','#69604d');this.line([[x,y+18],[x,y-5]],'#75634b',5);let f=Math.sin(t*8+x)*3;this.path([[x-8,y],[x-4,y-13-f],[x,y-23-f],[x+4,y-11],[x+9,y],[x+1,y+5]],'#d39854');this.path([[x-3,y],[x,y-12-f],[x+4,y+1]],'#f1d59e');this.glow(x,y-4,22,'rgba(238,166,78,.15)');}
 column(x,y){let c=this.ctx;this.path([[x-28,y+14],[x,y+26],[x+28,y+13],[x,y]],'#0d1112');this.path([[x-22,y-74],[x,y-64],[x,y+13],[x-22,y+3]],'#333a39','#464c47');this.path([[x,y-64],[x+22,y-74],[x+22,y+3],[x,y+13]],'#242b2b','#3b423e');this.path([[x-26,y-83],[x,y-95],[x+26,y-83],[x,y-71]],'#4a4c44','#606054');this.path([[x-26,y-83],[x,y-71],[x,y-61],[x-26,y-73]],'#343a36');this.path([[x,y-71],[x+26,y-83],[x+26,y-73],[x,y-61]],'#242c2a');this.line([[x-14,y-68],[x-14,y-4]],'#485047');this.line([[x+9,y-63],[x+9,y+6]],'#343e38');}
 tomb(x,y){this.path([[x-25,y-45],[x,y-57],[x+28,y-44],[x+28,y+12],[x,y+26],[x-25,y+12]],'#1a201f','#3c433d');this.path([[x-23,y-48],[x,y-60],[x+26,y-47],[x+2,y-34]],'#42483e','#575b4d');this.line([[x,y-45],[x,y-16]],'#8e8462',2);this.line([[x-9,y-33],[x+9,y-33]],'#8e8462',2);}
 room() {
  const g = this.g;
  const training = !!g.training;
  const camp = g.mode === 'camp';
  const chapter = camp || training ? 1 : g.chapter || 1;
  const layer = camp || training ? 0 : g.currentRoom?.()?.layer ?? g.room ?? 0;
  const terrain = camp || training ? null : g.terrain;
  const view=roomView(terrain),factor=terrain?.scale??1;
  const key = (camp ? 'camp' : training ? 'training' : chapter+':'+layer+':'+(terrain?.material||'open')+':'+factor)+':'+sceneArtRevision();
  if (this.backdropKey !== key) {
   if (!this.chapterBackdrop) {
    this.chapterBackdrop = document.createElement('canvas');
    this.chapterBackdrop.width = Math.ceil(view.width);
    this.chapterBackdrop.height = Math.ceil(view.height);
   }
   if(this.chapterBackdrop.width!==Math.ceil(view.width)||this.chapterBackdrop.height!==Math.ceil(view.height)){this.chapterBackdrop.width=Math.ceil(view.width);this.chapterBackdrop.height=Math.ceil(view.height);}
   const foreground = this.ctx;
   this.ctx = this.chapterBackdrop.getContext('2d', {alpha:false});
   try {
    this.ctx.setTransform(factor,0,0,factor,0,0);
    if(camp) paintCampBackdrop(this);
    else if(training) this.trainingRoom();
    else {
     paintChapterBackdrop(this,chapter,layer);
     this.ctx.setTransform(1,0,0,1,-view.left,-view.top);
     paintRoomTerrain(this,terrain);
     paintRoomDressing(this,terrain,chapter,layer);
    }
    this.ctx.setTransform(1,0,0,1,0,0);
    this.backdropKey = key;
   } finally {
    this.ctx = foreground;
   }
  }
  this.ctx.save();
  this.ctx.imageSmoothingEnabled=true;
  this.ctx.drawImage(this.chapterBackdrop,view.left,view.top,view.width,view.height);
  this.ctx.restore();
  if (camp) {
   paintCampFocus(this, g.player);
   return;
  }
  if (training) return;
  this.ctx.save();
  this.ctx.translate(560*(1-factor),430*(1-factor));
  this.ctx.scale(factor,factor);
  paintChapterAmbient(this, chapter, g.clock);
  this.ctx.restore();
  if (g.cleared) {
   const {x,y}=FIELD_EXIT;
   this.glow(x,y-13,125,'rgba(141,179,145,.22)');
   if (!drawFieldProp(this.ctx,'exit',x,y)) {
    this.circle(x,y,43,'#283c31','#b7c59b');
    this.line([[x-17,y+4],[x,y-13],[x+17,y+4]],'#d6dfb9',3);
   }
  }
  this.roomObjectives();
 }
 roomObjectives(){
  const c=this.ctx;
  for(const {x,y,name,kind,used} of this.g.objectives??[]){
   if(!drawFieldProp(c,kind??'crystal',x,y,used)) this.circle(x,y,30,used?'#375b50':'#39707a','#b6d2c2');
   c.save();
   c.fillStyle=used?'#aeb3bb':'#f0e8d0';
   c.strokeStyle='#1a2029';
   c.lineWidth=3;
   c.font='13px "Cubic 11", sans-serif';
   c.textAlign='center';
   const label=used?'已開':name;
   c.strokeText(label,x,y+20);
   c.fillText(label,x,y+20);
   c.restore();
  }
 }
 worldObjects(){
  const objects=this.g.worldObjects,c=this.ctx;
  if(!objects)return;
  for(const prop of objects.props)
   if(!drawFieldProp(c,prop.kind,prop.x,prop.y,prop.used)) drawAnimeProp(c,prop);
  for(const pickup of objects.pickups){
   const y=pickup.y+Math.sin(this.g.clock*3+pickup.x)*2;
   if(drawSceneSprite(c,scenePickup(pickup.kind),pickup.x,y+7,22,21)) continue;
   const color=pickup.kind==='gold'?'#efc16c':pickup.kind==='flask'?'#b3e6ad':'#8bdbfc';
   drawAnimePickup(c,pickup.x,y,color);
  }
 }
 trainingRoom(){
  const c=this.ctx;
  paintChapterBackdrop(this,1,0);
  paintRoomDressing(this,null,1,0);
  c.save();
  c.setLineDash([6,12]);
  for (const radius of [112,175,230]) this.circle(560,410,radius,null,'#c4ae747a');
  c.setLineDash([]);
  this.line([[280,410],[840,410]],'#c4ae744c');
  this.line([[560,205],[560,660]],'#c4ae744c');
  c.font='18px "Cubic 11", sans-serif';
  c.textAlign='center';
  c.fillStyle='#efdba3';
  c.fillText('DPS 訓練場',560,171);
  c.restore();
 }
 startHitPose(actor,options){
  const g=this.g,c=this.ctx,pose=g.hitFeedback?.pose(actor,g.clock,options?.reducedMotion);
  if(!pose)return false;
  const tint=pose.tint>.025&&typeof c.filter==='string'&&(actor===g.player||this.hitTintBudget>0);
  if(!tint&&!pose.dx&&!pose.dy)return false;
  c.save();
  if(pose.dx||pose.dy)c.translate(pose.dx,pose.dy);
  if(tint){
   if(actor!==g.player)this.hitTintBudget--;
   c.filter='brightness('+Number((1+pose.tint*1.05).toFixed(2))+')';
  }
  return true;
 }
 trainingDummy(enemy,options){
  const c=this.ctx,{x,y,trainingPrimary:primary}=enemy;
  const color=primary?'#f4d49b':'#a5d7cc';
  c.save();
  this.circle(x,y+7,enemy.r+10,'#171a2688',color+'76');
  const reacted=this.startHitPose(enemy,options);
  if(!drawFieldProp(c,'dummy',x,y)) this.circle(x,y-23,19,'#6e4c49',color);
  if(reacted)c.restore();
  c.textAlign='center';
  c.fillStyle=color;
  c.font=(primary?'12':'10')+'px "Cubic 11", sans-serif';
  c.fillText(this.g.training?.options.targets>1?(primary?'主靶 1':'靶 '+(enemy.trainingIndex+1)):enemy.name,x,y-76);
  if(primary){
   c.font='10px "Cubic 11", sans-serif';
   c.fillStyle='#ded8c6';
   const reference=Number.isFinite(enemy.referenceHp)?enemy.referenceHp.toLocaleString('zh-TW',{maximumFractionDigits:1}):'—';
   c.fillText('參考生命 '+reference+' · 不會死亡',x,y-90);
   c.fillText('基礎護甲 '+Math.round(enemy.armor||0),x,y+48);
  }
  c.restore();
 }
 supportFields(view,options){
  const g=this.g,c=this.ctx;
  if(g.mode!=='playing'&&g.mode!=='camp')return;
  for(const ally of g.summons??[]){
   const support=ally.summonSpec?.support;
   if(!support||ally.hp<=0)continue;
   const color=support.kind==='ward'?'#8bdccc':'#c9a0f0';
   if(fieldInView({x:ally.x,y:ally.y,r:62},view)){
    const id=ally.source??(support.kind==='ward'?'m_wardlantern':'m_hexidol');
    drawAuraFootprint(c,ally.x,ally.y,[{id,color}],g.clock,options);
   }
  }
 }
 summon(ally,bodyScale=1,options={}){
  const c=this.ctx,g=this.g,{x,y,kind}=ally,col=ally.color||'#8cdbd3';
  c.save();c.globalAlpha=.4;c.setLineDash([5,4]);this.circle(x,y+10,23,null,col);c.restore();
  const clone=['mirror_clone','shadow_clone'].includes(kind);
  const strike=summonStrikePose(ally,g.clock,options.reducedMotion);
  const reacted=this.startHitPose(ally,options);
  if(strike){
   c.save();
   c.translate(x+strike.x*bodyScale,y+(strike.y-22)*bodyScale);
   c.rotate(strike.rotation);
   c.scale(strike.stretchX,strike.stretchY);
   c.translate(-x,-y+22*bodyScale);
  }
  if(ally.summonSpec?.support)drawPixelSummon(c,ally,g.clock,false,bodyScale);
  else if(clone){
   const angle=ally.angle??0;
   const weaponAngle=strike?.style==='weapon'?angle+Math.cos(strike.swing*Math.PI)*.8*(Math.cos(angle)<0?-1:1):angle;
   drawHero(c,g.c,{x,y,angle,weaponAngle,time:g.clock,moving:!strike,attacking:!!strike,alpha:.65,scale:bodyScale});
  }else{
   const figure=strike?{...ally,followTarget:undefined}:ally;
   if(!drawAnimeUnit(c,figure,g.clock,true,g.chapter,bodyScale))drawPixelSummon(c,figure,g.clock,true,bodyScale);
  }
  if(strike)c.restore();
  if(reacted)c.restore();
  if(ally.singleMode){
   c.save();c.setLineDash([5,3]);this.circle(x,y+10,30,null,'#e6c388');c.restore();
  }
  if(Object.values(ally.passiveShields||{}).some(shield=>shield.remaining>0)||ally.supportShield>0){
   c.save();c.globalAlpha=.65;this.circle(x,y-15,32,null,'#98d5ef');c.restore();
  }
  const hpOffset=clone?84:kind==='titan'?98:kind.endsWith('_god')?91:['earth_golem','frost_golem','mist_ice','frost_spirit'].includes(kind)?72:64;
  const hpY=y-hpOffset*bodyScale;
  c.fillStyle='#1a1b2a';c.fillRect(x-20,hpY-1,40,6);
  c.fillStyle=col;c.fillRect(x-19,hpY,38*Math.max(0,ally.hp/ally.maxHp),4);
  if(clone&&ally.maxMana>0){
   c.fillStyle='#18212e';c.fillRect(x-19,hpY+5,38,3);
   c.fillStyle='#87b9e8';c.fillRect(x-19,hpY+5,38*Math.max(0,Math.min(1,ally.mana/ally.maxMana)),3);
  }
  c.save();c.font='10px "Cubic 11", sans-serif';c.textAlign='center';c.fillStyle='#e1e9ed';
  c.fillText(ABILITIES[ally.source]?.name||'永久盟友',x,hpY-5);c.restore();
  this.summonStatus(ally);
 }
 miniboss(enemy,options){
  const c=this.ctx,g=this.g;
  const reacted=this.startHitPose(enemy,options);
  if(!drawAnimeUnit(c,enemy,g.clock,false,g.chapter))drawPixelEnemy(c,enemy,g.chapter,g.clock,true);
  if(reacted)c.restore();
 }
 setFields(view,options){
  const g=this.g;
  for(const field of g.setCombat?.fields||[]){
   if(!fieldInView(field,view))continue;
   const damageType=field.damageType??{flame:'cold',evolution:'cold',drift:'lightning'}[field.owner];
   drawCombatField(this.ctx,{...field,damageType},{...options,clock:g.clock});
  }
 }
 playerFields(view,options=combatVisualOptions(this.g),pose=null){
  const c=this.ctx,g=this.g,p=pose??g.player;
  if(!this.auraGear||this.auraGearHero!==g.c||this.auraStats!==g.baseS){
   this.auraGear=equipmentAuras(g.c);
   this.auraGearHero=g.c;
   this.auraStats=g.baseS;
  }
  const active=g.setCombat?.auraDefinitions()??[...(g.auraIds??[])].map(id=>g.ability?.(id)||abilityFor(g.c,id)).filter(Boolean);
  const hasAura=active.length>0||this.auraGear.length>0;
  if(hasAura&&p.alpha!==0&&fieldInView({x:p.x,y:p.y,r:68},view)){
   const layers=active.map(def=>{
    const timer=g.auraTimers?.[def.id],interval=g.auraPulseInterval?.(def)||def.interval||1;
    const phase=def.damage&&Number.isFinite(timer)?1-timer/interval:undefined;
    return {id:def.id,color:def.color,phase};
   });
   drawAuraFootprint(c,p.x,p.y,layers.concat(this.auraGear),g.clock,{...options,opacity:p.alpha??1});
  }
  const guard=(g.skillEffects??[]).find(effect=>effect.shield>0&&ABILITIES[effect.id]?.type==='guard')??
   (g.skillEffects??[]).find(effect=>ABILITIES[effect.id]?.type==='guard');
  if(guard&&p.alpha!==0){
   const def=ABILITIES[guard.id],field={x:p.x,y:p.y-10,r:guard.shield>0?34:29,color:def.color,ability:guard.id,friendly:true};
   drawCombatField(c,field,{...options,kind:'ward',clock:g.clock,phase:guard.t/guard.max});
  }
  const frost=(g.skillEffects??[]).find(effect=>effect.id==='m_frostarmor'&&effect.shield>0);
  if(frost&&frost!==guard&&p.alpha!==0)drawCombatField(c,{x:p.x,y:p.y-10,r:34,ability:frost.id,friendly:true},{...options,kind:'ward',clock:g.clock});
  return hasAura;
 }
 shrine({x,y,type,used}){
  const c=this.ctx,def=SHRINES?.[type],color=def?.color||'#d5c28b';
  c.save();
  if(!used){
   this.glow(x,y-37,76,color+'3c');
   this.circle(x,y+4,42+Math.sin(this.g.clock*2),null,color+'82');
  }
  if(!drawFieldProp(c,'shrine',x,y,used)){
   this.path([[x,y-56],[x+20,y-31],[x+25,y+7],[x-25,y+7],[x-20,y-31]],used?'#424759':'#575760',color);
  }
  c.font='12px "Cubic 11", sans-serif';
  c.textAlign='center';
  c.fillStyle=used?'#aeb3bb':color;
  c.strokeStyle='#1a2029';
  c.lineWidth=3;
  const label=used?'恩賜已領取':def?.name||'神壇';
  c.strokeText(label,x,y+29);
  c.fillText(label,x,y+29);
  c.restore();
 }
 hostileFields(view,options=combatVisualOptions(this.g)){
  for(const field of this.g.enemyFields??[]){
   if(fieldInView(field,view))drawCombatField(this.ctx,field,{...options,kind:majorEnemyArea(this.g,field,true)?'danger':'ground',clock:this.g.clock});
  }
 }
 statusIcons(x,y,statuses,owner){
  const c=this.ctx,size=22,gap=3,width=statuses.length*(size+gap)-gap;
  let timers;
  if(owner){
   this.actorStatusTimers??=new WeakMap();
   if(!this.actorStatusTimers.has(owner))this.actorStatusTimers.set(owner,new Map());
   timers=this.actorStatusTimers.get(owner);
   for(const id of timers.keys())if(!statuses.some(s=>s.id===id&&s.remaining>0))timers.delete(id);
  }
  c.save();c.lineWidth=1.4;
  for(let i=0;i<statuses.length;i++){
   const status=statuses[i],xx=x-width/2+i*(size+gap)+size/2,yy=y+size/2,color=status.color||'#b9ccab';
   c.fillStyle='#101b17ed';c.fillRect(xx-size/2,yy-size/2,size,size);
   c.strokeStyle=color;c.strokeRect(xx-size/2,yy-size/2,size,size);
   c.save();c.translate(xx,yy-(status.remaining>0?2:0));c.scale(.8,.8);
   for(const {points,width,closed} of actorStatusShape(status.icon)){
    if(closed){c.lineWidth=width;this.path(points,null,color);}
    else this.line(points,color,width);
   }
   if(status.immune)this.line([[-8,8],[8,-8]],'#f0dfce',2);
   if(status.resistant){c.fillStyle=color;c.fillRect(-6,5,12,2);}
   c.restore();
   if(status.remaining>0){
    const prior=timers?.get(status.id),duration=status.duration||
     Math.max(status.remaining,prior?.key===status.timerKey?(prior?.duration||0):0);
    timers?.set(status.id,{key:status.timerKey,duration});
    const ratio=Math.min(1,status.remaining/duration),left=xx-size/2+1,top=yy-size/2+1;
    c.fillStyle='#101826';c.fillRect(left,yy+3,size-2,7);
    c.fillStyle=color;c.fillRect(left,top,(size-2)*ratio,2);
    c.font='bold 8px "Cubic 11", sans-serif';c.textAlign='center';c.fillStyle='#eee8df';
    c.fillText(Math.ceil(status.remaining)+'s',xx,yy+9);
   }
   if(status.stacks>1){
    const right=xx+size/2-1,baseline=status.remaining>0?yy-2:yy+size/2-2;
    c.font='bold 8px "Cubic 11", sans-serif';c.textAlign='right';
    c.fillStyle='#101826';c.fillRect(right-13,baseline-7,13,8);
    c.fillStyle='#ffe4a7';c.fillText('×'+status.stacks,right,baseline);
   }
  }
  c.restore();
 }
 summonStatus(ally){
  const statuses=[],shielded=ally.ownShield>0||ally.supportShield>0||Object.values(ally.passiveShields||{}).some(pool=>pool.remaining>0)||Object.values(ally.teamShields||{}).some(pool=>pool.remaining>0&&pool.effect?.t>0);
  if(shielded||this.g.minionCombat?.protectionAt?.(ally)>0)statuses.push(ACTOR_STATUSES.shield);
  if(Object.values(this.g.minionAura||{}).some(value=>value>0))statuses.push(ACTOR_STATUSES.aura);
  for(const effect of ally.effects||[])if(effect.t>0)statuses.push({id:effect.id,icon:ABILITIES[effect.id]?.icon||'rune',color:ABILITIES[effect.id]?.color||'#b6c6e5',remaining:effect.t,stacks:effect.stacks,timerKey:effect});
  if(statuses.length)this.statusIcons(ally.x,ally.y+26,statuses,ally);
 }
 enemyStatus(e){
  const c=this.ctx,x=e.x,y=e.y,statuses=[];
  for(const type of e.immunities||[])if(ACTOR_DEFENSES[type])statuses.push({...ACTOR_DEFENSES[type],immune:true});
  for(const status of e.statusImmunities||[]){
   if(e.immunities?.includes(status==='freeze'?'cold':'lightning')||!ACTOR_DEFENSES[status])continue;
   statuses.push({...ACTOR_DEFENSES[status],immune:true});
  }
  const affinity=e.immunities?.length||e.trainingDummy?null:Object.entries(e.resistances||{}).filter(([type,value])=>ACTOR_DEFENSES[type]&&value>=.2).sort((a,b)=>b[1]-a[1])[0];
  if(affinity)statuses.push({...ACTOR_DEFENSES[affinity[0]],resistant:true});
  const frozen=(e.frozen||0)>0,slow=Math.max(e.auraSlow||0,e.slow||0);
  statuses.push(...enemyStatusEffects(e,this.g.gameplay?.assassin?.time||0));
  if(frozen||slow>0){
   c.save();c.globalAlpha=frozen?.85:.45;c.lineWidth=frozen?2.5:1.5;this.circle(x,y+5,e.r+9,null,frozen?'#c1edff':'#78bdcf');
   if(frozen)for(let i=0;i<6;i++){const angle=i/6*TAU,rr=e.r+9;this.line([[x+Math.cos(angle)*rr,y+5+Math.sin(angle)*rr],[x+Math.cos(angle)*(rr+6),y+5+Math.sin(angle)*(rr+6)]],'#d5f4ff',2);}
   c.restore();
  }
  if(statuses.length)this.statusIcons(x,y+e.r+10,statuses,e);
  if(e.eliteIntent){const intent=e.eliteIntent,progress=Math.max(0,Math.min(1,1-intent.t/(intent.max||1))),color=e.elite?.color||'#e5b780';c.save();c.font='bold 11px "Cubic 11", sans-serif';c.textAlign='center';const label=intent.label||'菁英蓄力',width=Math.max(78,c.measureText(label).width+14),yy=y-e.r-86;c.fillStyle='rgba(25,16,12,.95)';c.fillRect(x-width/2,yy-13,width,23);c.strokeStyle=color;c.strokeRect(x-width/2,yy-13,width,23);c.fillStyle=color;c.fillText(label,x,yy);c.fillRect(x-width/2,yy+7,width*progress,3);c.restore();}}
 enemyIntent(enemy){
  const intent=enemy.intent;if(!intent||intent.t<=0)return;
  const c=this.ctx,color=intent.color||'#e5a67d',progress=Math.max(0,Math.min(1,1-intent.t/intent.max));
  const sector=(x,y,r,angle,halfArc)=>{
   c.beginPath();c.moveTo(x,y);c.arc(x,y,r,angle-halfArc,angle+halfArc);c.closePath();
   c.fillStyle=color;c.globalAlpha=.09+progress*.1;c.fill();
   c.strokeStyle=DANGER_RIM;c.globalAlpha=.88;c.lineWidth=1.7;c.setLineDash([8,5]);c.stroke();c.setLineDash([]);
  };
  c.save();
  if(intent.kind==='legacy-commit'){
   // The boss is winding up, but the committed sector is not its damage shape.
   // The actual attack supplies its own circles or readable projectiles.
   c.globalAlpha=.82;
   this.circle(enemy.x,enemy.y,8+progress*6,null,DANGER_RIM);
   c.restore();
   return;
  }
  if(intent.shape==='sector')sector(intent.x,intent.y,intent.range,intent.angle,intent.halfArc);
  else if(intent.shape==='ring'){
   const start=intent.gapAngle+intent.gapHalfArc,end=intent.gapAngle+TAU-intent.gapHalfArc;
   c.strokeStyle=color;c.globalAlpha=.3;c.lineWidth=15;
   c.beginPath();c.arc(intent.x,intent.y,intent.range,start,end);c.stroke();
   c.strokeStyle=DANGER_RIM;c.globalAlpha=.9;c.lineWidth=2;c.beginPath();c.arc(intent.x,intent.y,intent.range,start,end);c.stroke();
   for(const angle of [start,end])this.line([[intent.x,intent.y],[intent.x+Math.cos(angle)*intent.range,intent.y+Math.sin(angle)*intent.range]],color,1);
  }else if(intent.shape==='circle'){
   const angle=intent.angle+PI/2;
   const centers=intent.warningCircles||[-1,0,1].map(side=>({x:intent.targetX+Math.cos(angle)*side*140,y:intent.targetY+Math.sin(angle)*side*140}));
   for(const {x,y}of centers)drawCombatField(c,{x,y,r:intent.range,color,t:intent.t,max:intent.max},{kind:'warning',detail:'low'});
  }else{
   const cross=intent.kind.includes('cross'),fan=intent.kind.includes('fan');
   const count=intent.rayAngles?.length??(cross?4:fan?(this.g.diff===3?5:3):1);
   for(let i=0;i<count;i++){
    const angle=intent.rayAngles?.[i]??intent.angle+(cross?i*PI/2+(intent.kind==='cold-cross'?PI/4:0):fan?(i-(count-1)/2)*.24:0);
    c.globalAlpha=.22;this.line([[intent.x,intent.y],[intent.x+Math.cos(angle)*intent.range,intent.y+Math.sin(angle)*intent.range]],color,9);
    c.globalAlpha=.92;c.setLineDash([7,9]);this.line([[intent.x,intent.y],[intent.x+Math.cos(angle)*intent.range,intent.y+Math.sin(angle)*intent.range]],DANGER_RIM,1.5);c.setLineDash([]);
   }
  }
  c.globalAlpha=.8;this.circle(intent.x,intent.y,8+progress*6,null,DANGER_RIM);
  c.restore();
 }
 chargeWarning(e){
  const target=e.charge;
  drawCombatField(this.ctx,{x:target.x,y:target.y,r:target.r||90,t:target.t,max:target.max,color:'#e68864'},{kind:'warning',detail:'low'});
 }
 enemyWarnings(view,options=combatVisualOptions(this.g)){
  const g=this.g;
  for(const enemy of g.enemies){
   if(majorEnemyCharge(g,enemy))this.chargeWarning(enemy);
   if(majorEnemyIntent(g,enemy))this.enemyIntent(enemy);
  }
  for(const zone of g.hazards){
   if(majorEnemyArea(g,zone)&&fieldInView(zone,view))drawCombatField(this.ctx,zone,{...options,kind:'warning',clock:g.clock});
  }
 }
 enemyIdentity(e){
  const c=this.ctx,x=e.x,y=e.y;
  if(e.type==='shield'){c.save();c.strokeStyle='#d6ce9a';c.lineWidth=3;c.globalAlpha=.6;c.beginPath();c.arc(x,y+6,25,e.angle-Math.PI*.4,e.angle+Math.PI*.4);c.stroke();c.restore();}
  if(e.summonCast){const progress=1-e.summonCast.t/e.summonCast.max;this.circle(x,y+8,35,null,'#cb9bd3');this.circle(x,y+8,35*progress,null,'#e2bce6');c.font='11px "Cubic 11", sans-serif';c.textAlign='center';c.fillStyle='#e2bce6';c.fillText('召喚中',x,y-55);}
 }
 eliteLabel(enemy,view){
  const {x:anchor,y:feet,r}=enemy;
  if(anchor<view.left||anchor>view.right||feet<view.top||feet>view.bottom)return;
  const c=this.ctx,mini=enemy.type==='miniboss',key=enemy.minibossKey;
  const color=enemy.rankColor||enemy.elite?.color||(key==='nest'?'#abc86a':key==='priest'?'#d399ce':'#d9ba76');
  const label=mini?enemy.name||'小首領':(enemy.rankLabel||'稀有')+' '+enemy.name;
  const trait=mini?(key==='nest'?'毒素 · 毒池／孢子':key==='priest'?'火雷 · 落焰／禁書':'物理 · 衝鋒／地裂'):
   [enemy.rankAura?.name,enemy.elite?.trait,...(enemy.rankTraits||[])].filter(Boolean).join(' · ')||'重甲騎士・蓄力重擊';
  const labelFont='bold 11px "Cubic 11", sans-serif',traitFont='10px "Cubic 11", sans-serif';
  const preferredY=feet-r-(mini?73:45),height=mini?40:32;
  const y=preferredY-13>=view.top?preferredY:feet+r+32;
  if(y-13+height>view.bottom)return;
  c.save();
  c.font=labelFont;
  const labelWidth=c.measureText(label).width;
  c.font=traitFont;
  const width=Math.min(235,view.right-view.left,Math.max(122,labelWidth+18,c.measureText(trait).width+18));
  const x=Math.max(view.left+width/2,Math.min(view.right-width/2,anchor));
  c.fillStyle='rgba(10,17,15,.9)';
  c.fillRect(x-width/2,y-13,width,height);
  c.strokeStyle=color;c.globalAlpha=.65;c.strokeRect(x-width/2,y-13,width,height);c.globalAlpha=1;
  c.textAlign='center';c.font=labelFont;c.fillStyle=color;c.fillText(label,x,y,width-12);
  c.font=traitFont;c.fillStyle='#ded7bc';c.fillText(trait,x,y+13,width-12);
  if(mini){
   c.fillStyle='#171827';c.fillRect(x-width/2+6,y+19,width-12,4);
   c.fillStyle=color;c.fillRect(x-width/2+6,y+19,(width-12)*Math.max(0,enemy.hp/enemy.maxHp),4);
  }
  c.restore();
 }

 rangerFields(view,options){
  const c=this.ctx,g=this.g;
  for(const cloud of g.rangerCombat?.clouds??[]){
   const field={...cloud,damageType:'poison'};
   if(!fieldInView(field,view))continue;
   drawCombatField(c,field,{...options,clock:g.clock});
  }
  for(const trap of g.rangerCombat?.traps??[]){
   const {x,y}=trap,turret=trap.mode==='turret',color=trap.armed?(trap.color||'#efcf8b'):'#9caec4';
   if(!fieldInView({x,y,r:36},view))continue;
   const arming=trap.armed?1:Math.min(1,trap.age/(trap.spec.armTime||.4));
   const pulse=options.reducedMotion?.5:.5+.5*Math.sin(g.clock*8+x*.024+y*.015);
   const alpha=c.globalAlpha*Math.min(1,trap.t*5);
   c.save();
   c.globalAlpha=alpha;
   c.translate(x,y);
   this.path([[-21,5],[-14,-10],[14,-10],[21,5],[14,15],[-14,15]],'#172231','#6c798a');
   this.line([[-14,10],[14,10]],'#aab2ba',1);
   if(turret){
    const height=3+arming*13,interval=trap.spec.interval||.75;
    const recoil=trap.shots?Math.max(0,Math.min(1,1-(interval-trap.tick)*9)):0;
    this.path([[-10,5],[-6,-height],[6,-height],[10,5]],'#394752','#aab2ba');
    c.save();c.translate(0,-height);c.rotate(trap.visualAngle??-PI/2);
    const reach=6+arming*13,kick=recoil*5;
    this.path([[-12-kick,-3],[16-kick,-3],[16-kick,3],[-12-kick,3]],'#526371','#d4c2a5');
    this.line([[1-kick,-reach],[9-kick,0],[1-kick,reach]],color,2);
    this.line([[1-kick,-reach],[-5-kick,0],[1-kick,reach]],'#c5d7e3');
    if(trap.armed)this.line([[6-kick,0],[16+recoil*11,0]],'#fff1ca',1+pulse);
    c.restore();
   }else{
    const opening=3+arming*6+pulse*2,lift=arming*5+pulse*3;
    this.path([[-15,1],[-opening,-8],[-opening,6],[-10,9]],'#433f4c',color);
    this.path([[15,1],[opening,-8],[opening,6],[10,9]],'#433f4c',color);
    this.path([[0,-7-lift],[4,1-lift],[0,5-lift],[-4,1-lift]],trap.armed?color:'#80909e','#d1dfec');
    if(options.detail==='full'&&!options.reducedMotion&&trap.armed){
     c.globalAlpha*=pulse*.65;
     this.line([[0,-9-lift],[0,-14-lift]],color,1.5);
    }
   }
   c.globalAlpha=alpha;
   drawSignatureMark(c,trap.source,0,6,12,g.clock,options);
   for(let tick=0;tick<4;tick++){
    c.fillStyle=arming*4>tick?color:'#3a4351';
    c.fillRect(-13+tick*7,19,5,2);
   }
   c.restore();
  }
 }
 chargeCue(options){
  const g=this.g,channel=g.channel,def=channel&&g.ability(channel.id);
  if(def?.type!=='charge')return;
  const c=this.ctx,p=g.player,angle=g.aim(def);
  const progress=Math.min(1,(channel.charge||0)/(g.abilityInterval(def)||.9));
  const range=28+progress*22,color=progress>=1?'#fff0ae':def.color||'#d6d59b';
  c.save();
  c.translate(p.x,p.y);
  c.rotate(angle);
  c.globalAlpha=options.reducedMotion ? .63 : .82;
  this.line([[17,0],[range,0]],color,2);
  this.path([[range,-4],[range+5,0],[range,4],[range-4,0]],null,color);
  c.restore();
 }
 heroAnimation(bodyScale=1,pose=null){
  const g=this.g,p=g.player,prior=this.lastHeroPosition,dx=p.x-(prior?.x??p.x),dy=p.y-(prior?.y??p.y);
  this.lastHeroPosition={x:p.x,y:p.y};
  const moving=Math.hypot(dx,dy)>.12&&!g.transition;
  if(moving)this.heroTravelAngle=Math.atan2(dy,dx);
  const attacking=!!g.channel||g.dashTime>0||g.effects.some(f=>['slash','burst'].includes(f.type)&&f.t>f.max*.52&&Math.hypot(f.x-p.x,f.y-p.y)<12);
  drawHero(this.ctx,g.c,{x:pose?.x??p.x,y:pose?.y??p.y,angle:pose?.angle??p.angle,time:g.clock,
   moving:!pose&&moving,attacking:!pose&&attacking,movementAngle:this.heroTravelAngle??p.angle,scale:bodyScale,alpha:pose?.alpha??1,pose});
 }
 draw(){
  this.resize();
  const {ctx:c,g,w,h}=this;
  if(!w||!h)return;
  c.setTransform(this.dpr,0,0,this.dpr,0,0);c.fillStyle='#101817';c.fillRect(0,0,w,h);
  const combat=g.mode!=='camp'&&!g.training,bodyScale=combat?COMBAT_BODY_SCALE:1;
  const options=combatVisualOptions(g,this.reducedMotion?.matches??false);
  const pose=g.mode==='playing'?activeHeroMovement(g.effects,g.player,options):null;
  const heroPoint=pose??g.player;
  const baseScale=w<600?Math.max(.62,w/640):Math.max(w/1180,h/850);
  this.scale=baseScale*(combat?COMBAT_CAMERA_SCALE:1);
  const viewW=w/this.scale,viewH=h/this.scale,bounds=roomView(combat?g.terrain:null);
  this.cx=viewW>=bounds.width?bounds.left+bounds.width/2:Math.max(bounds.left+viewW/2,Math.min(bounds.left+bounds.width-viewW/2,heroPoint.x));
  this.cy=viewH>=bounds.height?bounds.top+bounds.height/2:Math.max(bounds.top+viewH/2,Math.min(bounds.top+bounds.height-viewH/2,heroPoint.y-35));
  this.hitTintBudget=options.detail==='full'?14:7;
  c.save();
  this.shakeX=options.reducedMotion?0:(Math.random()-.5)*g.shake;
  this.shakeY=options.reducedMotion?0:(Math.random()-.5)*g.shake;
  const left=this.cx-(w/2+this.shakeX)/this.scale,top=this.cy-(h/2+this.shakeY)/this.scale;
  const right=left+viewW,bottom=top+viewH,view={left,top,right,bottom};
  c.translate(w/2+this.shakeX,h/2+this.shakeY);c.scale(this.scale,this.scale);c.translate(-this.cx,-this.cy);
  this.room();this.worldObjects();for(const shrine of g.shrines??[])this.shrine(shrine);
  this.hostileFields(view,options);this.setFields(view,options);
  const playerHasAura=this.playerFields(view,options,pose);
  this.rangerFields(view,options);this.supportFields(view,options);this.moveDestination();
  for(const zone of g.hazards)if(zone.friendly&&fieldInView(zone,view))drawCombatField(c,zone,{...options,clock:g.clock});
 for(const e of g.enemies)if(e.elite||e.type==='elite'||e.enemyRank==='blue'){const color=e.rankColor||e.elite?.color||'#d9ba76';if(e.rankAura){c.save();c.globalAlpha=.12;this.circle(e.x,e.y,210,null,color);c.restore();}this.circle(e.x,e.y+8,e.r+10,color+'15',color);this.circle(e.x,e.y+8,e.r+14,null,color+'66');}
 for(const {item,x,y} of g.drops){
  const color=RARITIES[item.rarity].color;
  this.glow(x,y,35,color+'40');
  c.fillStyle=color+'70';
  c.fillRect(x-1,y-48,2,37);
  if(!drawRareGear(c,rareGearDesign(item),x,y+9,28)&&!drawSceneSprite(c,equipmentArt(item),x,y+9,29,28))drawAnimePickup(c,x,y,color,9);
  c.font='11px "Cubic 11", sans-serif';
  c.textAlign='center';
  c.lineWidth=3;
  c.strokeStyle='#1a2029';
  c.strokeText(item.name,x,y+21);
  c.fillStyle=color;
  c.fillText(item.name,x,y+21);
  c.lineWidth=1;
 }
 // Sprites can extend above their feet. Leave room for boss art and actor labels.
 const visibleActor=actor=>actor.x>=left-160&&actor.x<=right+160&&actor.y>=top-96&&actor.y<=bottom+160;
 const actors=[];
 for(const e of g.enemies)if(visibleActor(e))actors.push({e,y:e.y});
 for(const ally of g.summons??[])if(visibleActor(ally))actors.push({ally,y:ally.y});
 if(heroPoint.alpha!==0)actors.push({p:true,y:heroPoint.y});
 actors.sort((a,b)=>a.y-b.y);
 for(const a of actors){
  if(a.p){
   if(g.gameplay?.assassin.veiled())c.globalAlpha=.35;
   if(g.invuln>0&&!options.reducedMotion&&Math.floor(g.clock*20)%2===0)c.globalAlpha*=.78;
   if(!playerHasAura)this.circle(heroPoint.x,heroPoint.y+7,26,null,'#a69167');
   const reacted=this.startHitPose(g.player,options);
   this.heroAnimation(bodyScale,pose);
   if(reacted)c.restore();
   if(Object.values(g.minionCombat?.playerShields||{}).some(shield=>shield.remaining>0))
    drawCombatField(c,{x:heroPoint.x,y:heroPoint.y-15-(pose?.height??0),r:35,color:'#98d5ef'},{...options,kind:'ward',clock:g.clock});
   c.globalAlpha=1;
  }else if(a.ally)this.summon(a.ally,bodyScale,options);
  else{
   const e=a.e;
   if(e.trainingDummy){this.trainingDummy(e,options);this.enemyStatus(e);continue;}
   if(e.type==='miniboss'){this.miniboss(e,options);this.enemyStatus(e);continue;}
   const scale=e.type==='boss'?1:bodyScale;
   const reacted=this.startHitPose(e,options);
   if(!drawAnimeUnit(c,e,g.clock,false,g.chapter,scale))drawPixelEnemy(c,e,g.chapter,g.clock,true,scale);
   if(reacted)c.restore();
   this.enemyIdentity(e);this.enemyStatus(e);
   if(e.stun>0)this.circle(e.x,e.y+3,e.r+4,null,'#8fc4cf');
   if((e.hp<e.maxHp||e.elite||e.type==='elite')&&e.type!=='boss'){
    const hpY=e.y-66*(e.staticObject?1:scale);
    c.fillStyle='#171827';c.fillRect(e.x-22,hpY,44,4);
    c.fillStyle=e.elite?.color||(e.type==='elite'?'#b9a073':'#9d6353');c.fillRect(e.x-22,hpY,44*e.hp/e.maxHp,4);
   }
  }
 }
 const labelView={left:Math.max(left,bounds.left),top:Math.max(top,bounds.top),
  right:Math.min(right,bounds.left+bounds.width),bottom:Math.min(bottom,bounds.top+bounds.height)};
 for(const enemy of g.enemies)if(enemy.hp>0&&(enemy.type==='miniboss'||enemy.type==='elite'||enemy.elite))this.eliteLabel(enemy,labelView);
 for(const effect of g.effects)drawCombatEffect(c,effect,g.clock,options,view);
 this.chargeCue(options);
 for(const hostile of [false,true])for(const bullet of g.bullets){
  if(!!bullet.hostile===hostile&&fieldInView({x:bullet.x,y:bullet.y,r:projectilePaintMargin(bullet)},view))drawAnimeBolt(c,bullet,options);
 }
 paintHitMarks(c,g.hitFeedback,g.clock,view,options);
 this.enemyWarnings(view,options);
 c.textAlign='center';for(let n of g.numbers){c.globalAlpha=Math.min(1,n.t*2);c.font='bold 17px "Cubic 11", sans-serif';c.fillStyle='#101512';c.fillText(n.text,n.x+1,n.y+1);c.fillStyle=n.color;c.fillText(n.text,n.x,n.y);}c.globalAlpha=1;
 c.restore();
 if(!this.vignette||this.vignetteWidth!==w||this.vignetteHeight!==h||this.vignetteDpr!==this.dpr){
  const vignette=c.createRadialGradient(w/2,h/2,Math.min(w,h)*.22,w/2,h/2,Math.max(w,h)*.7);
  vignette.addColorStop(0,'transparent');vignette.addColorStop(1,'rgba(10,12,23,.50)');
  this.vignette=vignette;this.vignetteWidth=w;this.vignetteHeight=h;this.vignetteDpr=this.dpr;
 }
 c.fillStyle=this.vignette;c.fillRect(0,0,w,h);
 if(!options.reducedMotion)for(let i=0;i<25;i++){
  const x=(Math.sin(i*321)*.5+.5)*w,y=(Math.cos(i*22)*h*.5+h*.5-g.clock*(4+i%8)+h*100)%h;
  c.fillStyle=i%3?'rgba(196,161,101,.18)':'rgba(214,131,64,.42)';c.fillRect(x,y,1.4,1.4);
 }
 if(g.mode==='camp')paintCampLabels(this);
 }
}

