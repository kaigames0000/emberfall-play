import {decorateRank} from './enemy-rarity.js?v=108';
import {chapterDefinition} from './chapter-data.js?v=108';

export const HORDE_RULES=Object.freeze({equipment:.18,reward:.20,whiteHP:.25,whiteDamage:.6,blueHP:.5,blueDamage:.85,maxQueue:320,actorCap:64});
const difficultyDensity=[1,1,1.25,1.5],challengeDensity=[1,1,1.1,1.2];
export function hordeDensity(difficulty,challenge=1){
 return (difficultyDensity[difficulty]??1)*(challengeDensity[challenge]??1);
}
const roomRules={
 normal:{base:72,depth:8,eliteChance:.04},
 elite:{base:64,depth:8,eliteChance:.10},
 welfare:{base:56,depth:6,eliteChance:.02},
 trial:{base:88,depth:9,eliteChance:.08},
 mystery:{base:80,depth:8,eliteChance:.06},
 treasure:{base:36,depth:4,eliteChance:.025},
 miniboss:{base:30,depth:4,eliteChance:.025},
 boss:{base:34,depth:4,eliteChance:.03},
};
export function hordeReward(enemy){return enemy?.hordeFodder?HORDE_RULES.reward:1;}
export function hordeLootStats(stats,enemy){return enemy?.hordeFodder?{...stats,roomLootMultiplier:(stats.roomLootMultiplier??1)*HORDE_RULES.equipment}:stats;}
export function openingGolemSplash(g,ally,target){
 if(ally.source!=='m_golem'||!target.hordeFodder||g.c.cls!=='wanderer'||g.c.level>=20||
    g.chapter!==1||g.diff!==1||!g.horde.active||g.training)return [];
 const targets=[];
 for(const enemy of g.enemies){
  if(enemy===target||enemy.hp<=0||!enemy.hordeFodder)continue;
  const dx=enemy.x-target.x,dy=enemy.y-target.y,radius=76+enemy.r;
  if(dx*dx+dy*dy>radius*radius||!g.walkVisible(target,enemy))continue;
  targets.push(enemy);
  if(targets.length===3)break;
 }
 return targets;
}
export function scaleHordeResource(reward,enemy,rand){
 if(!enemy?.hordeFodder)return reward;
 const out={...reward,gold:Math.floor(reward.gold*HORDE_RULES.reward)};
 if((out.materials.length||out.gems.length)&&rand()>=HORDE_RULES.reward){out.materials=[];out.gems=[];}
 return out;
}

export class HordeTrial{
 constructor(game){this.g=game;this.active=false;this.queue=[];this.gold=0;this.goldTimer=0;this.numberTokens=6;this.deathTokens=4;}
 get pending(){return this.queue.length;}
 enterRoom(room){
  this.flushGold();this.queue=[];this.cooldown=0;
  const g=this.g;this.active=!!g.hordeTrialEnabled&&!g.training&&Object.hasOwn(roomRules,room.type);
  this.room=room;this.activeCap=Math.min(56,48+room.layer*2);
 }
 beginWave(){
  const g=this.g,room=this.room,rules=roomRules[room.type];
  const base=Math.ceil((rules.base+room.layer*rules.depth)*hordeDensity(g.diff,g.runContext?.challenge));
  const total=g.expeditionRisk?.packCount(base,HORDE_RULES.maxQueue)??Math.min(base,HORDE_RULES.maxQueue);
  const chapterTypes=chapterDefinition(g.chapter||1).enemies.map(enemy=>enemy.type);
  const ranged=chapterTypes.filter(type=>type==='archer'||type==='caster');
  const frontline=chapterTypes.filter(type=>!ranged.includes(type)&&type!=='summoner');
  const rareTypes=chapterTypes.length?[...frontline,...ranged]:['charger','shield','skirmisher',...(room.layer>=2?['caster']:[])];
  const abbeyRanged=room.layer>=2?['archer','bomber','caster','wraith']:['archer','bomber'];
  const roll=n=>Math.min(n-1,Math.floor(g.rand()*n));
  this.queue=Array.from({length:total},(_,i)=>{
   const guaranteed=room.type==='elite'&&(i===0||i===Math.floor(total/2));
   if(guaranteed||g.rand()<rules.eliteChance)return {type:rareTypes[roll(rareTypes.length)],elite:true};
   let type;
   if(chapterTypes.length){
    const roles=i%4===2?ranged:frontline;
    type=i%23===22?'summoner':roles[roll(roles.length)];
   }else if(room.layer>=2&&i===total-8)type='summoner';
   else if(i%12===11&&room.layer>0)type='shield';
   else if(i%10===7)type='charger';
   else if(i%8===5)type=abbeyRanged[roll(abbeyRanged.length)];
   else type=i%3===1?'skirmisher':'melee';
   return {type,blue:i%13===12};
  });
  this.nextPack=0;this.cooldown=.55;
  this.spawnBatch(Math.min(Math.floor(this.activeCap*.88),Math.ceil(total*.65)));
  const guard=room.type==='boss'||room.type==='miniboss';
  g.encounter={...g.encounter,name:room.name+(guard?' · 前哨守衛':' · 敵潮'),desc:(guard?'前哨守衛 ':'本波 ')+total+' 隻，敵群從地圖各處增援。'};
  g.emit('wave');return true;
 }
 spawnRegions(){
  const g=this.g,b=g.worldBounds(),x=(b.left+b.right)/2,y=(b.top+b.bottom)/2;
  const regions=[
   {left:b.left+24,right:x,top:b.top+24,bottom:y},
   {left:x,right:b.right-24,top:b.top+24,bottom:y},
   {left:b.left+24,right:x,top:y,bottom:b.bottom-24},
   {left:x,right:b.right-24,top:y,bottom:b.bottom-24},
  ];
  // Keep one diagonal spread out so a batch cannot bunch at the map center.
  const upper=g.rand()<.5?0:1,lower=3-upper;
  const xGap=(b.right-b.left)*.14,yGap=(b.bottom-b.top)*.14;
  regions[upper].bottom-=yGap;
  regions[lower].top+=yGap;
  regions[upper===0?upper:lower].right-=xGap;
  regions[upper===0?lower:upper].left+=xGap;
  for(let i=regions.length-1;i>0;i--){
   const j=Math.min(i,Math.floor(g.rand()*(i+1)));
   [regions[i],regions[j]]=[regions[j],regions[i]];
  }
  return regions;
 }
 packAnchor(b,anchors){
  const g=this.g,width=b.right-b.left,height=b.bottom-b.top;
  let best=null,gap=-1;
  function consider(x,y){
   if(!g.canLand(x,y))return false;
   let clearance=anchors.reduce((n,p)=>Math.min(n,Math.hypot(x-p.x,y-p.y)),Infinity);
   for(const p of g.enemies)clearance=Math.min(clearance,4*Math.hypot(x-p.x,y-p.y));
   if(clearance>gap){best={x,y};gap=clearance;}
   return clearance>=152;
  }
  for(let i=0;i<16;i++)if(consider(b.left+g.rand()*width,b.top+g.rand()*height))return best;
  for(let y=1;y<=4;y++)for(let x=1;x<=5;x++)if(consider(b.left+width*x/6,b.top+height*y/5))return best;
  return best??g.clampWorldPoint(b.left+width/2,b.top+height/2,20);
 }
 packMember(anchor,region){
  const g=this.g;
  const tryPoint=(angle,radius)=>{
   const x=anchor.x+Math.cos(angle)*radius,y=anchor.y+Math.sin(angle)*radius;
   return x>=region.left&&x<=region.right&&y>=region.top&&y<=region.bottom&&
    g.canLand(x,y)&&g.enemies.every(p=>Math.hypot(x-p.x,y-p.y)>=28)?{x,y}:null;
  };
  for(let i=0;i<12;i++){
   const p=tryPoint(g.rand()*Math.PI*2,18+Math.sqrt(g.rand())*46);if(p)return p;
  }
  for(const radius of [30,48,64])for(let i=0;i<14;i++){
   const p=tryPoint(i*Math.PI/7,radius);if(p)return p;
  }
  return this.packAnchor(region,[anchor]);
 }
 spawnBatch(limit){
  const g=this.g,size=Math.min(limit,this.pending,this.activeCap-g.enemies.length);
  if(size<=0)return;
  const regions=this.spawnRegions(),packs=Math.min(size,size>24?8:4),anchors=[],elites=[];
  for(let i=0;i<packs;i++){
   const region=regions[i%regions.length],anchor=this.packAnchor(region,anchors),pack=this.nextPack++;
   anchors.push(anchor);
   const count=Math.floor(size/packs)+Number(i<size%packs);
   g.fx(anchor.x,anchor.y,64,'#91a4c5','ring',.65);
   for(let j=0;j<count;j++){
    const ticket=this.queue[0],point=j===0?anchor:this.packMember(anchor,region);
    const enemy=g.addEnemy(ticket.type,point.x,point.y);if(!enemy)break;
    this.queue.shift();
    enemy.hordePack=pack;
    enemy.stun=Math.max(enemy.stun||0,.6);
    if(ticket.elite){
     g.promoteElite(enemy);elites.push(enemy);
     g.fx(point.x,point.y,36,'#e0b86d','ring',.65);
    }else{
     if(ticket.blue){enemy._rankBase={hp:enemy.maxHp,damage:enemy.damageScale,speed:enemy.speed,armor:enemy.armor,r:enemy.r,attackSpeed:enemy.attackSpeed};decorateRank(enemy,'blue');}
     enemy.hordeFodder=true;enemy.hp*=ticket.blue?HORDE_RULES.blueHP:HORDE_RULES.whiteHP;enemy.maxHp=enemy.hp;enemy.damageScale*=ticket.blue?HORDE_RULES.blueDamage:HORDE_RULES.whiteDamage;enemy.armor*=.55;enemy.r=14;enemy.speed*=1.05;
    }
   }
  }
  if(elites.length)g.emit('elites',{names:elites.map(e=>e.name),traits:[...new Set(elites.map(e=>e.elite.trait))]});
 }
 update(dt){
  const g=this.g;if(!this.active||g.mode!=='playing'||g.paused||g.transition||g.training||g.cleared)return;
  this.numberTokens=Math.min(6,this.numberTokens+dt*30);this.deathTokens=Math.min(4,this.deathTokens+dt*10);
  this.goldTimer-=dt;if(this.gold&&this.goldTimer<=0)this.flushGold();
  const batch=Math.min(8,this.pending);
  this.cooldown-=dt;if(batch&&this.cooldown<=0&&g.enemies.length<=this.activeCap-batch){this.spawnBatch(batch);this.cooldown=.55;}
 }
 allowNumber(){if(!this.active)return true;if(this.numberTokens<1)return false;this.numberTokens--;return true;}
 allowDeathFx(){if(!this.active)return true;if(this.deathTokens<1)return false;this.deathTokens--;return true;}
 addGold(amount,point){this.gold+=amount;this.goldPoint={x:point.x,y:point.y-14};if(this.goldTimer<=0)this.goldTimer=.25;}
 flushGold(){if(this.gold&&this.goldPoint)this.g.float(this.goldPoint.x,this.goldPoint.y,'+'+this.gold+' 金','#d2b771');this.gold=0;}
}
