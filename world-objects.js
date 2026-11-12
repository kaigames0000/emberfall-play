import {seededRng} from './rift-model.js?v=140';
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
export class WorldObjects{
 constructor(g){this.g=g;this.props=[];this.pickups=[];this.roomKey=null;}
 enterRoom(){
  const g=this.g;if(g.training||g.mode!=='playing'){this.props=[];this.pickups=[];this.roomKey=null;return;}
  const key=String(g.expedition?.graph?.seed??g._expeditionSeq??0)+':'+(g.expedition?.currentID??g.room);
  if(this.roomKey===key)return;this.collectAll();this.props=[];this.pickups=[];this.roomKey=key;this.draws=0;const rng=seededRng(key+':objects');this.rand=()=>{this.draws++;return rng();};
  if(g.currentRoom().type==='recovery')return;
  const count=3+Math.floor(this.rand()*4),chests=Math.floor(this.rand()*3),bounds=g.worldBounds(),entry=g.clampWorldPoint(560,650),shrine=g.clampWorldPoint(560,580);
  for(let i=0;i<count+chests;i++)for(let attempt=0;attempt<90;attempt++){
   const x=bounds.left+45+this.rand()*(bounds.right-bounds.left-90),y=bounds.top+45+this.rand()*(bounds.bottom-bounds.top-90),p={x,y};
   if(!g.canLand(x,y)||distance(p,entry)<145||distance(p,{x:560,y:138})<110||this.props.some(q=>distance(p,q)<105)||(g.objectives??[]).some(q=>distance(p,q)<110)||distance(p,shrine)<100||(g.terrain?.bridges??[]).some(b=>x>b.left-30&&x<b.right+30&&y>b.top-30&&y<b.bottom+30))continue;
   const kind=i>=count?'chest':['barrel','crate','urn'][Math.floor(this.rand()*3)];this.props.push({id:key+':'+i,worldProp:true,kind,x,y,r:kind==='chest'?23:18,hp:1,maxHp:1,used:false});break;
  }
 }
 damageables(){return this.props.filter(p=>p.kind!=='chest'&&!p.used&&p.hp>0);}
 nearby(){const g=this.g;if(g.mode!=='playing'||g.paused||g.transition||g.training)return null;return this.props.find(p=>p.kind==='chest'&&!p.used&&distance(p,g.player)<88)||null;}
 interact(p=this.nearby()){const g=this.g;if(!p||p.kind!=='chest'||p.used||!this.props.includes(p)||distance(p,g.player)>=88||g.mode!=='playing'||g.paused||g.transition||g.training)return false;return this.open(p);}
 hit(p,amount){if(!p?.worldProp||p.kind==='chest'||p.used||!(amount>0)||!this.props.includes(p)||this.g.mode!=='playing'||this.g.paused||this.g.transition||this.g.training)return false;return this.open(p);}
 drop(kind,amount,p){if(this.pickups.length>=32)return;this.pickups.push({kind,amount,x:p.x+(this.rand()-.5)*28,y:p.y+(this.rand()-.5)*28,t:0});}
 open(p){
  const g=this.g;if(p.used)return false;p.used=true;p.hp=0;const chest=p.kind==='chest',rand=this.rand??g.rand;
  this.rand??=rand;this.drop('gold',chest?(5+Math.floor(rand()*8)+g.room*2)*g.diff:(1+Math.floor(rand()*3)+Math.floor(g.room/3))*g.diff,p);
  if(rand()<.55)this.drop(rand()<.65?'flask':'mana',chest?12:7,p);
  g.fx(p.x,p.y,chest?42:28,chest?'#dfbc68':'#aa916c','burst',.35);g.emit('worldLoot',{kind:p.kind});return true;
 }
 take(p){const g=this.g;if(p.kind==='gold'){g.c.gold+=p.amount;g.runGold+=p.amount;g.float(p.x,p.y-18,'+'+p.amount+' 金','#e1c677');}else if(p.kind==='flask'){g.refillFlasks(p.amount);g.float(p.x,p.y-18,'藥水充能 +'+p.amount,'#a8dda7');}else if(p.kind==='mana'){g.mana=Math.min(g.s.mana,g.mana+g.s.mana*p.amount/100);g.float(p.x,p.y-18,'魔力恢復','#93cce8');}g.emit('worldPickup',{kind:p.kind});}
 update(dt){const g=this.g;if(g.mode!=='playing'||g.paused||g.transition||g.training)return;const remaining=[];for(const p of this.pickups){p.t=(p.t||0)+dt;if(distance(p,g.player)<62)this.take(p);else remaining.push(p);}this.pickups=remaining;}
 collectAll(){for(const p of this.pickups)this.take(p);this.pickups=[];}
 discard(){this.pickups=[];this.props=[];}
 snapshot(){return {opened:this.props.flatMap((p,i)=>p.used?[i]:[]),pickups:this.pickups.map(p=>({kind:p.kind,amount:p.amount,x:p.x,y:p.y,t:Math.min(3600,p.t||0)})),draws:this.draws||0};}
 restore(record){this.enterRoom();if(!record){for(const p of this.props){p.used=true;p.hp=0;}return;}for(const i of record.opened)if(this.props[i]){this.props[i].used=true;this.props[i].hp=0;}this.pickups=record.pickups.map(p=>({...p}));for(let i=this.draws||0;i<record.draws&&i<10000;i++)this.rand();}
}
