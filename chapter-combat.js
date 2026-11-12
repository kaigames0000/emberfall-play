import {chapterDefinition} from './chapter-data.js?v=108';
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
export class ChapterCombat{
 constructor(g){this.g=g;this.spawnCounts={};this.timer=3;}
 decorate(e){const g=this.g,ch=g.chapter||1,def=chapterDefinition(ch);e.chapter=ch;if(ch===1)return e;if(e.type==='boss'){e.name=def.boss.name;e.storyStage=0;e.storyAdds=0;e.storyPhases=new Set();return e;}const candidates=def.enemies.filter(x=>x.type===e.type);if(candidates.length){const i=this.spawnCounts[e.type]||0;this.spawnCounts[e.type]=i+1;const v=candidates[i%candidates.length];e.name=v.name;e.variant=v.pattern;e.attackElement=v.element;}return e;}
 owns(e){return (this.g.chapter||1)>1&&(e.type==='boss'||e.type==='miniboss'||!!e.variant);}
 warn(x,y,r,damage,type='physical',delay=.9,field=null,attacker=null){const g=this.g;if(g.hazards.filter(h=>!h.friendly).length>=2)return;g.hazard(x,y,r,damage,Math.max(.7,delay),type,attacker);if(field&&g.hazards.length)g.hazards.at(-1).fieldOnExpire=field;}
 adds(e,count=4){const g=this.g;for(let i=0;i<count&&(e.storyAdds||0)<8&&g.enemies.length<48;i++){const a=g.addEnemy(i%2?'archer':'melee',350+i*130,200,true);if(a){a.damageScale*=.6;e.storyAdds=(e.storyAdds||0)+1;}}}
 updateEnemy(e,target,dt){const g=this.g,d=dist(e,target)||1,angle=e.tactics?.releaseOrigin?.angle??Math.atan2(target.y-e.y,target.x-e.x),boss=['boss','miniboss'].includes(e.type),damage=e.damageScale*(1-(e.auraWeaken||0)),speed=e.speed*(1-(e.auraSlow||0));
  if(boss){const thresholds=g.chapter===2?[.65,.3]:[.7,.4];for(let i=0;i<thresholds.length;i++)if(e.hp<=e.maxHp*thresholds[i]&&!e.storyPhases?.has(i)){e.storyPhases??=new Set();e.storyPhases.add(i);e.storyStage=i+1;g.hazards=g.hazards.filter(h=>h.friendly);g.enemyFields=[];if(e.type==='boss')this.adds(e,4);else if(!e.storyAdds)this.adds(e,2);g.fx(e.x,e.y,150,'#c8a0c8','ring',.6);}}
  const ranged=!boss&&['salt','crossbow','rod','pools','icearrow','crystal','star'].includes(e.variant),desired=boss?190:ranged?270:55;if(d>desired)g.approachActor(e,target,speed*dt,desired);
  else if(ranged&&d<170)g.moveActor(e,-Math.cos(angle)*speed*dt,-Math.sin(angle)*speed*dt);
  Object.assign(e,g.clampWorldPoint(e.x,e.y));
  if(e.cd>0)return;e.phase++;e.cd=boss?2.5-(e.storyStage||0)*.2:ranged?2.7:1.6;const key=e.minibossKey||e.variant||(g.chapter===2?'tideboss':'starboss');
  if(['anchor','gatekeeper','tideboss','starboss'].includes(key)){
   if(e.phase%3===0){const count=key==='starboss'?6:5;for(let i=0;i<count;i++)g.shoot(e.tactics?.releaseOrigin?.x??e.x,e.tactics?.releaseOrigin?.y??e.y,angle+(i-(count-1)/2)*.24,155,20*damage,key==='starboss'?'#a4cbe4':'#d0aa7d',0,7,true,{damageType:e.storyStage===2?'lightning':'physical',attacker:e});}
   else{this.warn(target.x,target.y,75,24*damage,e.storyStage===1?'cold':e.storyStage===2?'lightning':'physical',1,null,e);if((e.storyStage||0)>0)this.warn(target.x+130,target.y-100,65,20*damage,'lightning',1.5,null,e);}return;
  }
  if(['pools','tidalpriest'].includes(key)){this.warn(target.x,target.y,65,12*damage,'poison',1.1,{duration:3,damage:7*damage,damageType:'poison',color:'#91a36a',slow:.1},e);return;}
  if(['rod','foreman','thunderhunter','star'].includes(key)){if(key==='thunderhunter'){const x=target.x+150*Math.cos(e.phase),y=target.y+150*Math.sin(e.phase);g.placeActor(e,x,y);this.warn(e.x,e.y,50,16*damage,'lightning',1,null,e);}this.warn(target.x-80,target.y,60,18*damage,'lightning',.9,null,e);this.warn(target.x+80,target.y,60,18*damage,'lightning',1.4,null,e);return;}
  if(['icemirror','icearrow','crystal'].includes(key)){for(let i=0;i<3;i++)g.shoot(e.tactics?.releaseOrigin?.x??e.x,e.tactics?.releaseOrigin?.y??e.y,angle+(i-1)*.2,190,13*damage,'#95cde6',0,6,true,{damageType:'cold',attacker:e});if(key==='icemirror'&&e.phase%3===0)this.warn(target.x,target.y,100,19*damage,'cold',1.2,null,e);return;}
  if(['salt','crossbow'].includes(key)){for(let i=0;i<(key==='crossbow'?3:1);i++)g.shoot(e.tactics?.releaseOrigin?.x??e.x,e.tactics?.releaseOrigin?.y??e.y,angle+(i-1)*.12,245,14*damage,key==='salt'?'#a3be8b':'#d0b581',0,5,true,{damageType:e.attackElement,attacker:e});return;}
  if(key==='mirror'){const x=target.x-Math.cos(angle)*80,y=target.y-Math.sin(angle)*80;g.placeActor(e,x,y);this.warn(e.x,e.y,55,14*damage,'physical',.9,null,e);return;}
  if(key==='spear'){this.warn(target.x,target.y,55,17*damage,'lightning',.9,null,e);return;}
  if(d<90)this.warn(target.x,target.y,45,12*damage,e.attackElement||'physical',.7,null,e);
 }
 enterRoom({combatDone=false}={}){const g=this.g;g.objectives=[];g.blockers=[];this.timer=3;if((g.chapter||1)===2&&g.room===5){g.objectives=[{id:'gate-a',kind:'watergate',name:'左水門',x:390,y:410,used:false},{id:'gate-b',kind:'watergate',name:'右水門',x:730,y:410,used:false}];}if(combatDone)return;if(g.chapter===3&&g.room===2)for(let i=0;i<2&&g.enemies.length<48;i++){const e=g.addEnemy('melee',410+i*300,340,true);if(e){e.name='裂晶核心';e.staticObject=true;e.hp*=1.5;e.maxHp=e.hp;e.r=24;}}if(g.chapter===3&&g.room===4)for(let i=0;i<2&&g.enemies.length<48;i++){const e=g.addEnemy('wraith',360+i*380,300,true);if(e){e.name='鏡界殘影';e.variant='mirror';e.hp*=.45;e.maxHp=e.hp;e.damageScale*=.5;}}}
 nearbyObjective(){return this.g.objectives?.find(o=>!o.used&&dist(o,this.g.player)<90)||null;}
 activateObjective(target=null){const o=target||this.nearbyObjective();if(!o||o.used||!this.g.objectives.includes(o)||dist(o,this.g.player)>=90||this.g.paused||this.g.transition)return false;o.used=true;this.g.fx(o.x,o.y,65,'#8cc8cc','shock',.4);this.g.emit('objective',{id:o.id});return true;}
 roomReady(){return !this.g.objectives?.some(o=>!o.used);}
 updateRoom(dt){const g=this.g;if((g.chapter||1)===1||g.training||g.cleared)return;this.timer-=dt;if(this.timer>0)return;this.timer=g.enemyCombat?.encounterInterval(4)??4;const scale=(g.diff||1)*(1+g.room*.12);if(g.chapter===2&&[0,5,6].includes(g.room)){const x=200+((Math.floor(g.elapsed/4)%3)*300);this.warn(x,410,85,15*scale,'physical',1.2);}if(g.chapter===3&&g.enemies.some(e=>e.staticObject))this.warn(g.player.x,g.player.y,65,15*scale,'cold',1.1);if(g.chapter===3&&g.room===5)this.warn(280+(Math.floor(g.elapsed/4)%3)*280,420,90,16*scale,'lightning',1.1);}
}
