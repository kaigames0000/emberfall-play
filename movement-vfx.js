import {leapAirProgress} from './hero-motion.js?v=127';

const TAU=Math.PI*2;
const clamp=(value,min,max)=>Math.min(max,Math.max(min,value));

function ribbon(ctx,length,spread,bow,color){
 const paint=ctx.createLinearGradient(0,0,length,0);
 paint.addColorStop(0,color+'00');
 paint.addColorStop(.62,color+'76');
 paint.addColorStop(1,color+'ec');
 ctx.fillStyle=paint;
 ctx.beginPath();
 ctx.moveTo(0,0);
 ctx.bezierCurveTo(length*.23,bow,length*.74,bow+spread,length,0);
 ctx.bezierCurveTo(length*.68,bow-spread*.44,length*.30,bow*.41,0,0);
 ctx.fill();
}

function charge(ctx,length,fade){
 ctx.globalAlpha*=fade;
 for(const side of [-1,1]){
  ctx.save();ctx.translate(0,side*8);ctx.rotate(side*.045);
  ribbon(ctx,length,10,side*5,'#ffc680');ctx.restore();
 }
 ribbon(ctx,length,4,-1,'#fff0c7');
}

function blitz(ctx,length,fade,phase,full){
 ctx.globalAlpha*=fade;
 ctx.lineJoin='round';
 const count=full?8:5;
 ctx.beginPath();ctx.moveTo(0,0);
 for(let i=1;i<count;i++)ctx.lineTo(i*length/count,Math.sin(i*2.6+phase)*(7+i%3*4));
 ctx.lineTo(length,0);
 ctx.strokeStyle='#6c8aff88';ctx.lineWidth=8;ctx.stroke();
 ctx.strokeStyle='#cbdfff';ctx.lineWidth=2.1;ctx.stroke();
 ctx.beginPath();
 for(let i=2;i<count;i+=2){
  const x=i*length/count,y=Math.sin(i*2.6+phase)*(7+i%3*4);
  ctx.moveTo(x,y);ctx.lineTo(x-7,y+Math.sign(y||1)*13);ctx.lineTo(x+6,y+Math.sign(y||1)*19);
 }
 ctx.strokeStyle='#a8b7f1cc';ctx.lineWidth=1.1;ctx.stroke();
}

function wind(ctx,length,fade,phase,full){
 ctx.globalAlpha*=fade;
 ctx.save();ctx.translate(0,5+Math.sin(phase)*2);
 ribbon(ctx,length,9,-16,'#83d9ba');ctx.restore();
 ctx.save();ctx.translate(length*.20,-5);
 ribbon(ctx,length*.8,5,11,'#d1f3d1');ctx.restore();
 if(full)ribbon(ctx,length*.73,3,12,'#9be3cc');
}

function blink(ctx,length,fade,phase,full){
 const alpha=ctx.globalAlpha;
 const count=full?5:3;
 for(let i=0;i<count;i++){
  const x=length*i/(count-1),size=5+i%3*2;
  ctx.save();ctx.translate(x,Math.sin(phase+i)*3);
  ctx.globalAlpha=alpha*fade*(.36+.43*i/(count-1));
  ribbon(ctx,Math.min(25,length*.35),size,-7,'#c79bed');
  ctx.restore();
 }
}

function leap(ctx,length,fade,phase,full,dy){
 ctx.globalAlpha*=fade;
 ctx.translate(0,-4);
 ctx.rotate(-Math.atan2(dy,Math.sqrt(Math.max(0,length*length-dy*dy))||.001)*.14);
 const lift=-Math.min(65,length*.31);
 ribbon(ctx,length,12,lift,'#e67580');
 if(full)ribbon(ctx,length*.92,4,lift+12,'#ffba9d');
}

function dodge(ctx,length,fade){
 ctx.globalAlpha*=fade*.62;
 ctx.translate(0,3);ribbon(ctx,length,6,6,'#c9c3ad');
}

function shadowMist(ctx,radius,fade,landing){
 ctx.save();ctx.scale(1,.54);
 const haze=ctx.createRadialGradient(0,0,0,0,0,radius);
 haze.addColorStop(0,landing?'#d9aff8bd':'#b17edca0');
 haze.addColorStop(.37,'#6f49926a');
 haze.addColorStop(1,'#38244a00');
 ctx.globalAlpha*=fade;ctx.fillStyle=haze;
 ctx.beginPath();ctx.arc(0,0,radius,0,TAU);ctx.fill();
 ctx.restore();
}

function leapCracks(ctx,radius,fade,full){
 ctx.globalAlpha*=fade*.83;
 ctx.strokeStyle='#fba6a0';ctx.lineWidth=2;
 for(let i=0;i<(full?7:4);i++){
  const angle=i*2.399+.31,dx=Math.cos(angle)*radius,dy=Math.sin(angle)*radius*.48;
  ctx.beginPath();ctx.moveTo(dx*.18,dy*.18);
  ctx.lineTo(dx*.48+dy*.19,dy*.47-dx*.095);
  ctx.lineTo(dx*.66,dy*.65);ctx.lineTo(dx,dy);ctx.stroke();
 }
}

const movement={
 w_charge:{trail:charge,color:'#ffd391',size:31,reach:64,sparks:7},
 w_blitz:{trail:blitz,color:'#9cb9ff',size:26,reach:43,sparks:8},
 r_dash:{trail:wind,color:'#a5dfc4',size:22,reach:49,sparks:4},
 a_blink:{trail:blink,color:'#c3a3e4',size:20,reach:36,sparks:5},
 b_leap:{trail:leap,color:'#f29695',size:37,reach:71,sparks:9},
 dodge:{trail:dodge,color:'#d6c7aa',size:18,reach:28,sparks:4},
 a_storm:{trail:blink,color:'#d29ce7',size:15,reach:26,sparks:4},
};

export const MOVEMENT_VFX_IDS=Object.freeze(Object.keys(movement));

function endpoint(ctx,id,art,progress,landing,full){
 const alpha=ctx.globalAlpha,fade=1-progress;
 const radius=(landing?art.reach:art.size)*(.22+.78*progress);
 ctx.lineCap='round';
 if(id==='a_blink')shadowMist(ctx,radius+13,fade,landing);
 if(id==='b_leap'&&landing){
  ctx.save();leapCracks(ctx,radius,fade,full);ctx.restore();
 }
 if(id==='r_dash'||id==='w_charge'){
  ctx.beginPath();ctx.ellipse(0,3,radius,radius*.38,0,landing?.06:Math.PI*.85,landing?Math.PI*.93:Math.PI*1.94);
  ctx.globalAlpha=alpha*fade*.65;ctx.strokeStyle=art.color;ctx.lineWidth=landing?3:2;ctx.stroke();
 }
 if(id==='r_dash'&&landing){
  ctx.globalAlpha=alpha*fade*.8;
  ctx.beginPath();ctx.moveTo(-radius*.48,6);
  ctx.bezierCurveTo(radius*.8,11,radius*.96,-11,radius*.11,-5);
  ctx.strokeStyle='#daffe6';ctx.lineWidth=1.3;ctx.stroke();
 }
 const count=full?art.sparks:Math.min(4,art.sparks);
 for(let i=0;i<count;i++){
  const angle=id==='a_blink'?i*TAU/count+.36:landing?i*TAU/count+.18:Math.PI+(i/(count-1)-.5)*2.3;
  const dx=Math.cos(angle),dy=Math.sin(angle),travel=radius*(.6+i%3*.17);
  const x=dx*travel,y=dy*travel*.53-(id==='a_blink'?11:4)*progress;
  const length=(landing?15:10)*(1-progress*.54);
  ctx.globalAlpha=alpha*fade*(i%2?.84:.58);
  ctx.beginPath();
  ctx.moveTo(x,y);
  if(id==='w_blitz'){ctx.lineTo(x+dx*length*.43-dy*4,y+dy*length*.38);ctx.lineTo(x+dx*length,y+dy*length*.63);}
  else ctx.quadraticCurveTo(x+dx*length*.43,y+dy*length*.25-5,x+dx*length,y+dy*length*.63);
  ctx.strokeStyle=i%2?art.color:art.color+'a8';ctx.lineWidth=landing?2.2:1.4;ctx.stroke();
 }
}

export function drawMovementEffect(ctx,effect,clock,{detail='full',reducedMotion=false}={}){
 const id=effect.ability,art=Object.hasOwn(movement,id)?movement[id]:null;
 if(!art||effect.friendly===false||effect.hostile)return false;
 if(id==='b_leap'&&effect.visual==='melee')return true;
 if(!['cast','travel','landing'].includes(effect.visual))return false;
 const {x,y,x2,y2}=effect,travel=effect.visual==='travel';
 const age=effect.max-effect.t,delay=effect.delay??0;
 if(age<delay)return true;
 const progress=clamp((age-delay)/(effect.max-delay),0,1),fade=Math.min(1,(1-progress)*2.4);
 ctx.save();ctx.translate(x,y);
 if(travel&&Number.isFinite(x2)&&Number.isFinite(y2)){
  const revealed=id==='b_leap'&&effect.motionDuration?leapAirProgress(age/effect.motionDuration):1;
  const dx=(x2-x)*revealed,dy=(y2-y)*revealed,length=Math.hypot(dx,dy);
  if(length>1){
   ctx.rotate(Math.atan2(dy,dx));
   art.trail(ctx,length,fade*(reducedMotion?.62:1),reducedMotion?0:clock*18,detail==='full',dy);
  }
 }else{
  ctx.rotate(effect.angle??0);
  endpoint(ctx,id,art,reducedMotion?progress*.65:progress,effect.visual==='landing',detail==='full');
 }
 ctx.restore();
 return true;
}
