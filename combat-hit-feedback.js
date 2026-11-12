const MAX_MARKS=24;
const IMPACT_COLORS={
 physical:'#ffe4ae',fire:'#ffba81',cold:'#c2f1ff',lightning:'#ece0ff',poison:'#d7efa0',
};
const sides={enemy:1,ally:3,player:4};
const clamp=value=>Math.max(0,Math.min(1,value));

function contactDirection(actor,origin,velocity){
 const vx=velocity?.vx,vy=velocity?.vy,speed=Math.hypot(vx,vy);
 if(speed>0)return {dx:vx/speed,dy:vy/speed};
 const x=actor.x-origin?.x,y=actor.y-origin?.y,distance=Math.hypot(x,y);
 if(distance>0)return {dx:x/distance,dy:y/distance};
 return {dx:0,dy:.75};
}

// All reactions live outside actor and save data. Their clock only drives presentation.
export class CombatHitFeedback{
 constructor(){this.clear();}
 clear(){this.reactions=new WeakMap();this.marks=[];}
 record(actor,at,{loss=0,absorbed=0,maxHp=actor?.maxHp,side='enemy',origin,velocity,type,crit=false,periodic=false,dot=false}={}){
  if(dot||!(loss>0||absorbed>0)||!Number.isFinite(actor?.x)||!Number.isFinite(actor?.y))return false;
  const guard=!(loss>0),heavy=!periodic&&!guard&&(crit||!actor.hordeFodder&&loss>=maxHp*.14);
  const priority=Math.max(sides[side]??1,heavy?2:1),old=this.reactions.get(actor);
  if(old&&(periodic?at-old.at<.36:at-old.at<.065&&old.priority>=priority&&(!heavy||old.heavy)))return false;
  const {dx,dy}=contactDirection(actor,origin,velocity);
  const duration=heavy?.245:periodic?.12:.175;
  const distance=guard||periodic||actor.staticObject?0:heavy?9:4.5;
  this.reactions.set(actor,{at,duration,dx,dy,distance,priority,heavy,guard});
  if(periodic)return true;
  const r=Number.isFinite(actor.r)?actor.r:17;
  const edge=Math.min(16,r*.63),height=Math.min(47,16+r*.64);
  const mark={x:actor.x-dx*edge,y:actor.y-height-dy*edge*.48,dx,dy,at,duration,priority,heavy,guard,side,
   color:guard?'#aceaff':side!=='enemy'?'#ffc5ad':heavy?'#ffe58f':IMPACT_COLORS[type]??IMPACT_COLORS.physical};
  if(this.marks.length>=MAX_MARKS){
   const replace=this.marks.findIndex(m=>at-m.at>=m.duration||m.priority<=priority);
   if(replace<0)return true;
   this.marks.splice(replace,1);
  }
  this.marks.push(mark);
  return true;
 }
 pose(actor,clock,reducedMotion=false){
  const effect=this.reactions.get(actor);
  if(!effect||clock-effect.at>=effect.duration)return null;
  const age=Math.max(0,clock-effect.at),phase=age/effect.duration;
  const recoil=reducedMotion?0:effect.distance*Math.pow(1-phase,1.8)*Math.min(1,.62+age*18);
  const tint=clamp(1-age/(effect.heavy?.145:.095))*(effect.guard?.64:effect.heavy?1:.8)*(reducedMotion?.63:1);
  return {dx:recoil?effect.dx*recoil:0,dy:recoil?effect.dy*recoil:0,tint};
 }
}

function paintMark(ctx,mark,clock,full,reducedMotion){
 const age=clock-mark.at,phase=clamp(age/mark.duration),life=1-phase;
 const count=reducedMotion?2:mark.heavy&&full?6:mark.guard||mark.heavy?4:2;
 const travel=reducedMotion?.3:.14+phase*.86,reach=mark.heavy?30:mark.guard?21:17;
 const alpha=ctx.globalAlpha;
 const angle=Math.atan2(mark.dy,mark.dx)+(mark.guard?Math.PI/2:Math.PI);
 ctx.beginPath();
 for(let i=0;i<count;i++){
  const a=angle+(i/(count-1)-.5)*(mark.guard?Math.PI:1.65),dx=Math.cos(a),dy=Math.sin(a);
  const distance=(.76+(i%3)*.12)*reach*travel,length=(mark.heavy?11:7)*(1-(reducedMotion?.27:phase)*.45);
  ctx.moveTo(mark.x+dx*distance,mark.y+dy*distance);
  ctx.lineTo(mark.x+dx*(distance+length),mark.y+dy*(distance+length));
 }
 ctx.lineWidth=mark.heavy?5:3.7;
 ctx.strokeStyle='#332438';
 ctx.globalAlpha=alpha*life*.7;
 ctx.stroke();
 ctx.lineWidth=mark.heavy?2.6:1.8;
 ctx.strokeStyle=mark.color;
 ctx.globalAlpha=alpha*life*(reducedMotion?.65:.95);
 ctx.stroke();
 ctx.globalAlpha=alpha;
}

export function paintHitMarks(ctx,feedback,clock,view,{detail='full',reducedMotion=false}={}){
 const marks=feedback?.marks;
 if(!marks?.length)return;
 const full=detail==='full',limit=full?18:8;
 let drawn=0;
 ctx.save();
 ctx.lineCap='round';
 for(const important of [true,false]){
  for(let i=marks.length-1;i>=0&&drawn<limit;i--){
   const mark=marks[i];
   if((mark.priority>1)!==important||clock-mark.at>=mark.duration)continue;
   if(view&&(mark.x<view.left-34||mark.x>view.right+34||mark.y<view.top-34||mark.y>view.bottom+34))continue;
   paintMark(ctx,mark,clock,full,reducedMotion);
   drawn++;
  }
 }
 ctx.restore();
}
