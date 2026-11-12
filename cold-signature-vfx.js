import {drawBplus} from './bplus-art.js?v=124';
import {drawSkillSprite} from './skill-sprites.js?v=125';

// Ice spells retain their own silhouette and motion, including when sprite art is loading.
const TURN=Math.PI*2;
const clamp=value=>Math.max(0,Math.min(1,value));
const fract=value=>value-Math.floor(value);
const sourceId=value=>value.visualAbility??value.ability??value.source??value.id;
const motion=(clock,options)=>(clock??0)*(options.reducedMotion?.24:1);
const detail=options=>options.detail!=='low';
const phase=effect=>1-clamp((effect.t??1)/(effect.max||1));
const fieldAge=field=>Number.isFinite(field.remaining)?field.remaining:field.t;

function polygon(c,points){
 c.beginPath();
 c.moveTo(...points[0]);
 for(let i=1;i<points.length;i++)c.lineTo(...points[i]);
 c.closePath();
 c.fill();
}

function softColor(c,x1,y1,x2,y2,stops){
 const gradient=c.createLinearGradient?.(x1,y1,x2,y2);
 if(!gradient?.addColorStop)return stops[Math.floor(stops.length/2)][1];
 for(const [position,color] of stops)gradient.addColorStop(position,color);
 return gradient;
}

function windBand(c,x,y,radius,start,length,width,clock){
 const steps=18,scale=.86;
 const end=start+length,paint=c.fillStyle;
 c.fillStyle=softColor(c,x+Math.cos(start)*radius,y+Math.sin(start)*radius*scale,
  x+Math.cos(end)*radius,y+Math.sin(end)*radius*scale,[[0,'transparent'],[.36,paint],[.73,paint],[1,'transparent']]);
 c.beginPath();
 for(let i=0;i<=steps;i++){
  const u=i/steps,a=start+length*u;
  const r=radius+width*Math.sin(Math.PI*u)+Math.sin(a*3+clock)*width*.32;
  const px=x+Math.cos(a)*r,py=y+Math.sin(a)*r*scale;
  if(i===0)c.moveTo(px,py);else c.lineTo(px,py);
 }
 for(let i=steps;i>=0;i--){
  const u=i/steps,a=start+length*u;
  const r=radius-width*.34*Math.sin(Math.PI*u)+Math.sin(a*3+clock)*width*.32;
  c.lineTo(x+Math.cos(a)*r,y+Math.sin(a)*r*scale);
 }
 c.closePath();
 c.fill();
 c.fillStyle=paint;
}

function frostHaze(c,x,y,radius,opacity,color='132, 203, 228'){
 if(!(radius>0&&opacity>0))return;
 const gradient=c.createRadialGradient?.(x,y,0,x,y,radius);
 if(!gradient?.addColorStop)return;
 gradient.addColorStop(0,`rgba(${color}, ${opacity})`);
 gradient.addColorStop(.48,`rgba(${color}, ${opacity*.62})`);
 gradient.addColorStop(1,'transparent');
 c.fillStyle=gradient;
 c.fillRect(x-radius,y-radius,radius*2,radius*2);
}

function blizzard(c,field,clock,options){
 const {x,y,r}=field,full=detail(options),alpha=c.globalAlpha;
 const time=motion(clock,options),fade=clamp((fieldAge(field)??1)*2.5);
 c.save();
 const turn=-time*2.24+x*.006+y*.009;
 c.save();
 c.translate(x,y);c.scale(1,.84);
 frostHaze(c,0,0,r,fade*.26);
 c.rotate(turn);
 c.imageSmoothingEnabled=true;
 const painted=drawSkillSprite(c,'iceField',0,0,r*1.92,r*1.92,{clock:time,opacity:.78*fade,blend:true});
 if(painted&&full){
  c.rotate(1.9);
  drawSkillSprite(c,'iceField',0,0,r*1.6,r*1.6,{clock:time+.41,opacity:.37*fade,blend:true});
 }
 c.restore();
 c.fillStyle='#a7dce9';c.globalAlpha=alpha*(painted?.33:.52)*fade;
 windBand(c,x,y,r*.92,turn,1.79,r*.024,time*2.5);
 windBand(c,x,y,r*.94,turn+2.3,1.48,r*.022,time*2.5);
 windBand(c,x,y,r*.95,turn+4.66,1.21,r*.019,time*2.5);
 c.fillStyle='#dcf2f8';c.globalAlpha=alpha*.42*fade;
 windBand(c,x,y,r*.92,turn+.17,1.26,r*.009,time*2.5);
 windBand(c,x,y,r*.94,turn+2.54,1.08,r*.009,time*2.5);
 if(!painted){
  c.fillStyle='#acd9ec';c.globalAlpha=alpha*.30*fade;
  windBand(c,x,y,r*.54,turn*1.52,2.36,r*.054,time*3);
  windBand(c,x,y,r*.67,turn*1.31+2.65,2.17,r*.047,time*2.5);
 }
 c.strokeStyle='#ecf9ff';c.lineWidth=full?1.32:1.15;c.lineCap='round';
 c.globalAlpha=alpha*.63*fade;c.beginPath();
 const snow=full?36:23;
 for(let i=0;i<snow;i++){
  const drift=fract(time*.73+i*.618034),a=i*2.39996+turn*(1.3+(i%3)*.32);
  const rr=r*(.19+.72*drift),px=x+Math.cos(a)*rr,py=y+Math.sin(a)*rr*.86;
  const len=(2+i%4)*(.52+.82*drift);
  c.moveTo(px+Math.sin(a)*len,py-Math.cos(a)*len*.86);
  c.lineTo(px-Math.sin(a)*len,py+Math.cos(a)*len*.86);
  if(i%4===0){
   c.moveTo(px-Math.cos(a)*2.6,py-Math.sin(a)*2.6);c.lineTo(px+Math.cos(a)*2.6,py+Math.sin(a)*2.6);
   c.moveTo(px-1.9,py+1.9);c.lineTo(px+1.9,py-1.9);
  }
 }
 c.stroke();
 c.restore();
}

function crownPillars(c,x,y,r,clock,p,options,persistent=false){
 const alpha=c.globalAlpha,time=motion(clock,options);
 const count=detail(options)?8:5;
 c.save();
 frostHaze(c,x,y,r*.78,persistent?.24:.2*(1-p),'167, 181, 233');
 for(let i=0;i<count;i++){
  const a=-Math.PI/2+i*TURN/count,rr=r*(persistent?.7:.25+.64*p);
  const px=x+Math.cos(a)*rr,py=y+Math.sin(a)*rr*.74;
  const wave=.53+.47*Math.sin(time*4.6+i*1.56);
  const h=(persistent?17+wave*31:Math.sin(p*Math.PI)*r*.42+7)*(i%2===0?1:.72),w=5+h*.18;
  c.fillStyle=softColor(c,px-w,py-h*.82,px+w,py+3,[[0,'#c9dbf8'],[.52,i%2===0?'#8f9ccd':'#87c2df'],[1,'#3e6482']]);
  c.globalAlpha=alpha*.65;
  polygon(c,[[px-w,py],[px-w*.66,py-h*.65],[px+w*.11,py-h],[px+w,py-h*.54],[px+w*.69,py+3]]);
  c.fillStyle='#d5ebff';c.globalAlpha=alpha*.64;
  polygon(c,[[px-w*.66,py-h*.65],[px+w*.11,py-h],[px+w*.21,py-2],[px-w*.13,py-1]]);
  c.fillStyle='#f5faff';c.globalAlpha=alpha*(.33+wave*.23);
  c.fillRect(px+w*.19,py-h*.7,Math.max(1.2,w*.14),Math.max(1.5,h*.09));
 }
 c.restore();
}

function frozenPool(c,field,clock,options,evolved){
 const {x,y,r}=field,alpha=c.globalAlpha,time=motion(clock,options);
 const fade=clamp((fieldAge(field)??1)*2.5),count=evolved?7:5;
 c.save();
 frostHaze(c,x,y,r,fade*.20,evolved?'147, 167, 215':'121, 197, 208');
 c.fillStyle=evolved?'#a4b0e6':'#90dddc';
 c.globalAlpha=alpha*.11*fade;
 const points=Array.from({length:count},(_,i)=>{
  const a=-Math.PI/2+i*TURN/count,rr=r*(i%2?.83:.96);
  return [x+Math.cos(a)*rr,y+Math.sin(a)*rr*.7];
 });
 polygon(c,points);
 c.strokeStyle=evolved?'#c9bbff':'#c3edf0';c.lineWidth=1.5;
 c.globalAlpha=alpha*.59*fade;c.lineCap='round';
 c.beginPath();
 for(let i=0;i<count;i++){
  const [px,py]=points[i],[ex,ey]=points[(i+1)%count];
  const t=fract(time*.86+i*.32),mx=px+(ex-px)*t,my=py+(ey-py)*t;
  c.moveTo(px,py);c.lineTo(mx,my);
  c.moveTo(x,y);c.lineTo(mx,my);
 }
 c.stroke();c.restore();
}

function armor(c,x,y,r,clock,options,p){
 const alpha=c.globalAlpha,time=motion(clock,options),count=detail(options)?6:4;
 const spread=Number.isFinite(p)?.24+.76*Math.sin(p*Math.PI*.5):1;
 c.save();
 for(let i=0;i<count;i++){
  const a=i*TURN/count+time*1.42;
  const px=x+Math.cos(a)*r*.7*spread,py=y+Math.sin(a)*r*.39*spread;
  const height=r*(.43+(i%3)*.065)*spread;
  const w=r*.2*spread;
  c.fillStyle=softColor(c,px-w,py-height,px+w,py+height*.85,[[0,'#b4e7f1'],[.54,i%2===0?'#6aabd0':'#8ec7df'],[1,'rgba(57, 92, 119, .18)']]);
  c.globalAlpha=alpha*(.32+.30*(.5+.5*Math.sin(a)));
  polygon(c,[[px-w,py-height],[px,py-height*1.18],[px+w,py-height*.77],[px+w*.78,py+height*.55],[px,py+height*.85],[px-w*.86,py+height*.32]]);
  c.fillStyle='#e2f4f8';c.globalAlpha=alpha*.56;
  polygon(c,[[px-w*.89,py-height*.96],[px,py-height*1.18],[px+w*.05,py-height*.36],[px-w*.24,py-height*.18]]);
  c.fillStyle='#f5fbff';c.globalAlpha=alpha*(.31+.21*Math.sin(a)**2);
  c.fillRect(px+w*.26,py-height*.39,1.5,Math.max(1.5,height*.11));
 }
 c.restore();
}

function beamRibbon(c,length,halfWidth,time,mix,strength,slices){
 const width=u=>halfWidth*Math.sin(Math.PI*u)**.48*(.51+u*.49)*strength;
 const side=u=>halfWidth*mix*Math.sin(u*16-time*13)*Math.sin(Math.PI*u);
 c.beginPath();
 c.moveTo(0,0);
 for(let i=1;i<=slices;i++){
  const u=i/slices;
  c.lineTo(u*length,side(u)-width(u));
 }
 for(let i=slices-1;i>=0;i--){
  const u=i/slices;
  c.lineTo(u*length,side(u)+width(u));
 }
 c.closePath();c.fill();
}

function coldBeam(c,{x,y,a,length,width},clock,options,p){
 if(!(length>0&&width>0))return false;
 const alpha=c.globalAlpha,time=motion(clock,options),full=detail(options),w=width*.5;
 const envelope=1-p*.32;
 c.save();c.translate(x,y);c.rotate(a??0);
 c.imageSmoothingEnabled=true;
 c.fillStyle=softColor(c,0,-w*.57,0,w*.57,[[0,'transparent'],[.3,'rgba(92, 151, 198, .19)'],[.5,'rgba(162, 222, 241, .58)'],[.7,'rgba(92, 151, 198, .19)'],[1,'transparent']]);
 c.globalAlpha=alpha*.54*envelope;
 beamRibbon(c,length,w,time,.046,.57,20);
 c.globalAlpha=alpha;
 const painted=drawSkillSprite(c,'beam',0,0,length*1.025,width*1.47,{clock:time,opacity:.86*envelope,blend:true});
 if(!painted){
  c.fillStyle=softColor(c,0,-w*.22,0,w*.22,[[0,'transparent'],[.5,'#b6dff0'],[1,'transparent']]);
  c.globalAlpha=alpha*.8*envelope;
  beamRibbon(c,length,w,time,.055,.22,23);
 }
 c.strokeStyle=softColor(c,0,0,length,0,[[0,'#daf7ff'],[.42,'#d9f2f8'],[.82,'#f6fcff'],[1,'transparent']]);
 c.lineWidth=full?1.75:1.35;c.lineCap='round';c.globalAlpha=alpha*(painted?.53:.8)*envelope;
 c.beginPath();c.moveTo(0,0);
 const count=full?22:15;
 for(let i=1;i<=count;i++){
  const u=i/count;
  c.lineTo(length*u,Math.sin(u*17-time*14)*Math.sin(Math.PI*u)*w*.075);
 }
 c.stroke();
 c.fillStyle='#e6f5fd';c.globalAlpha=alpha*.72*envelope;c.beginPath();
 const particles=full?20:12,velocity=440/length;
 for(let i=0;i<particles;i++){
  const u=fract(time*velocity+i*.618034),px=u*length;
  const py=Math.sin(i*2.39996+time*8+u*12)*w*Math.sin(Math.PI*u)*.61;
  const trail=Math.min(px,5+i%6*2.6);
  c.moveTo(Math.min(length,px+2.8),py);
  c.lineTo(px-trail,py+1.1);c.lineTo(px-trail*.57,py-1.7);c.closePath();
 }
 c.fill();
 c.globalAlpha=alpha;
 frostHaze(c,7,0,Math.min(24,w*.55),.24*envelope,'173, 222, 246');
 c.restore();return true;
}

function expandingSpears(c,effect,p,options){
 const {x,y,r}=effect,alpha=c.globalAlpha,full=detail(options),count=full?16:11;
 const travel=1-(1-p)**2,rr=r*(.13+.83*travel);
 c.save();c.globalAlpha=alpha*(1-p)*.85;
 frostHaze(c,x,y,rr,Math.sin(Math.PI*p)*.33);
 if(p<.56){
  const sparkRadius=Math.min(50,r*.27)*(.36+p*1.45),sparkFade=1-p/.56;
  frostHaze(c,x,y,sparkRadius,.59*sparkFade,'180, 225, 246');
  c.fillStyle='#def4fa';c.globalAlpha=alpha*sparkFade*.78;
  c.beginPath();
  for(let i=0;i<9;i++){
   const angle=i*2.39996+p*.29,reach=sparkRadius*(.33+(i%4)*.16);
   const px=x+Math.cos(angle)*reach,py=y+Math.sin(angle)*reach*.84;
   c.moveTo(px-1.3,py);
   c.lineTo(px+Math.cos(angle)*(4+i%3),py+Math.sin(angle)*(4+i%3));
   c.lineTo(px,py+1.4);c.closePath();
  }
  c.fill();
  c.globalAlpha=alpha*(1-p)*.85;
 }
 c.fillStyle='#a1d7df';
 windBand(c,x,y,rr,-.8+p*.21,2.47,r*.023,p*3.8);
 windBand(c,x,y,rr,2.33+p*.17,2.18,r*.017,p*3.8);
 for(let i=0;i<count;i++){
  const angle=-Math.PI/2+i*TURN/count+Math.sin(i*2.49)*.05;
  const localRadius=rr*(.97+Math.sin(i*2.13)*.025);
  const px=x+Math.cos(angle)*localRadius,py=y+Math.sin(angle)*localRadius*.87;
  const h=(r*.12+4)*(i%2?.72:1)*Math.sin(Math.PI*Math.min(1,p*.88+.1));
  c.fillStyle=softColor(c,px,py-h,px+3,py+4,[[0,'#d5f4f6'],[.52,i%2?'#73b7ca':'#98ceda'],[1,'rgba(79, 131, 154, .3)']]);
  polygon(c,[[px-5,py+2],[px-3,py-h*.61],[px+3,py-h],[px+5,py+1],[px,py+5]]);
  c.fillStyle='#dcf1f4';
  polygon(c,[[px-2,py-h*.62],[px+3,py-h],[px+.8,py-h*.27],[px-1,py-h*.15]]);
  if(i%3===0){
   c.fillStyle='#f4fdff';
   c.fillRect(px-6-p*5,py-h*.77,1.6,1.6);
   c.fillRect(px+5+p*8,py-h*.56,1.2,1.8);
  }
 }
 c.restore();
}

function shardBurst(c,effect,p,options,kind){
 const {x,y,r}=effect,alpha=c.globalAlpha,full=detail(options);
 const count=kind==='orb'?(full?16:10):kind==='cone'?5:kind==='golem'?7:6;
 const travel=1-(1-p)**2;
 c.save();c.globalAlpha=alpha*(1-p)*.95;
 let painted=false;
 if(kind==='orb'){
  frostHaze(c,x,y,r,Math.sin(Math.PI*p)*.41,'155, 214, 242');
  painted=drawSkillSprite(c,'iceImpact',x,y,r*1.89,r*1.64,{progress:p,opacity:.91});
  if(!painted){
   const q=Math.max(2,r*(.29-.25*p));
   c.fillStyle=softColor(c,x-q,y-q,x+q,y+q,[[0,'#e6f7fb'],[.5,'#8dc4db'],[1,'rgba(90, 133, 177, .28)']]);
   polygon(c,[[x-q,y-q*.43],[x-q*.27,y-q],[x+q*.87,y-q*.56],[x+q,y+q*.45],[x+q*.2,y+q*.93],[x-q*.73,y+q*.71]]);
   c.fillStyle='#e6f5fb';
   polygon(c,[[x-q*.27,y-q],[x+q*.87,y-q*.56],[x+q*.18,y+q*.26],[x-q*.63,y-q*.05]]);
  }
 }
 for(let i=0;i<(painted?Math.ceil(count*.55):count);i++){
  const a=kind==='cone'&&Number.isFinite(effect.angle)?effect.angle+(i-(count-1)*.5)*.38:i*2.39996+(effect.angle??0);
  const size=r*(kind==='cone'?.21:kind==='golem'?.17:.13)*(1-i/count*.43);
  const reach=r*(.2+.76*travel)*(i%3===0?.61:.92);
  const px=x+Math.cos(a)*reach,py=y+Math.sin(a)*reach*.85-(kind==='golem'?0:Math.sin(p*Math.PI)*r*.13);
  c.save();c.translate(px,py);c.rotate(a+p*(i%2===0?1:-1));
  c.fillStyle=softColor(c,size,-size*.53,-size*.8,size*.47,[[0,'#d5f1fa'],[.48,kind==='golem'?'#73a2bf':kind==='spirit'?'#9fc7e4':'#7ea7c6'],[1,'rgba(72, 113, 142, .2)']]);
  if(kind==='golem')polygon(c,[[size*.83,-size*.39],[size*.26,size*.39],[-size*.9,size*.28],[-size*.67,-size*.6]]);
  else if(kind==='spirit')polygon(c,[[size*.93,0],[size*.12,size*.22],[-size*.33,size*.7],[-size*.47,size*.18],[-size*.93,0],[-size*.47,-size*.18],[-size*.33,-size*.7],[size*.12,-size*.22]]);
  else polygon(c,[[size*1.34,0],[-size*.37,size*.37],[-size*.8,0],[-size*.33,-size*.39]]);
  c.fillStyle='#def3fa';
  polygon(c,[[size*1.19,0],[-size*.13,size*.18],[-size*.18,0]]);
  c.restore();
 }
 c.restore();
}

function spellMuzzle(c,effect,p,kind){
 const {x,y,r}=effect,alpha=c.globalAlpha,s=r*(.45+p*.62),count=kind==='cone'?3:5;
 c.save();c.translate(x,y);c.rotate(effect.angle??0);
 c.globalAlpha=alpha*(1-p);c.strokeStyle=kind==='cone'?'#d7f1ff':'#c5f8ff';c.lineWidth=2.4;c.beginPath();
 for(let i=0;i<count;i++){
  const a=(i-(count-1)/2)*.25;
  c.moveTo(4,0);c.lineTo(Math.cos(a)*s,Math.sin(a)*s);
 }
 c.stroke();c.restore();
}

function spiritArrival(c,effect,p,clock,options){
 const {x,y,r}=effect,time=motion(clock,options),alpha=c.globalAlpha;
 const count=6,spin=time*3.2+p*1.9,s=r*(.17+.64*p);
 c.save();
 c.strokeStyle='#e0f4ff';c.lineWidth=2.3;c.globalAlpha=alpha*(1-p)*.9;c.beginPath();
 for(let i=0;i<count;i++){
  const a=i*TURN/count+spin,dx=Math.cos(a)*s,dy=Math.sin(a)*s;
  c.moveTo(x,y-7-p*9);c.lineTo(x+dx,y-7-p*9+dy);
  c.lineTo(x+dx*.69-dy*.15,y-7-p*9+dy*.69+dx*.15);
  c.moveTo(x+dx,y-7-p*9+dy);c.lineTo(x+dx*.69+dy*.15,y-7-p*9+dy*.69-dx*.15);
 }
 c.stroke();c.restore();
}

export function drawColdField(c,field,clock,options={}){
 if(field.friendly===false)return false;
 const id=sourceId(field),r=field.r??field.radius;
 if(!(r>0))return false;
 if(id==='m_blizzard')blizzard(c,{...field,r},clock,options);
 else if(id==='m_icegod')crownPillars(c,field.x,field.y,r,clock,0,options,true);
 else if(id==='m_frostarmor')armor(c,field.x,field.y,r,clock,options);
 else if(field.owner==='flame'||field.owner==='evolution')frozenPool(c,{...field,r},clock,options,field.owner==='evolution');
 else return false;
 return true;
}

export function drawColdEffect(c,effect,clock,options={}){
 if(effect.friendly===false)return false;
 const id=sourceId(effect),p=phase(effect);
 if(id==='m_flamethrower'&&effect.visual!=='thrust')return coldBeam(c,effect,clock,options,p);
 const r=effect.r??effect.radius;
 if(!(r>0))return false;
 if(id==='m_blizzard'){
  // The active field carries the storm. Each damage tick adds a burst of blown snow.
  const alpha=c.globalAlpha;
  c.save();c.fillStyle='#d8f7ff';c.globalAlpha=alpha*(1-p)*.31;
  windBand(c,effect.x,effect.y,r*(.38+.5*p),motion(clock,options)*-2.8+p*.9,2.25,r*.026,p);
  c.restore();
 }else if(id==='m_nova')expandingSpears(c,{...effect,r},p,options);
 else if(id==='m_frostarmor')armor(c,effect.x,effect.y,r*.58,clock,options,p);
 else if(id==='m_icegod')crownPillars(c,effect.x,effect.y,r,clock,p,options);
 else if(id==='m_spirit'&&effect.visual==='summon')spiritArrival(c,{...effect,r},p,clock,options);
 else if((id==='m_fireball'||id==='m_icecone')&&['cast','release','charge'].includes(effect.visual))
  spellMuzzle(c,{...effect,r},p,id==='m_icecone'?'cone':'orb');
 else{
  const kind=({m_fireball:'orb',m_icecone:'cone',m_frostgolem:'golem',m_spirit:'spirit','set:frost':'cone','set:frostmirror':'orb'})[id];
  if(!kind)return false;
  if(id==='m_fireball'&&effect.type==='burst'){
   // Its paired meteor already owns the shatter. This is the thin refracted wake.
   const alpha=c.globalAlpha;
   c.save();c.fillStyle='#9ee4f8';c.globalAlpha=alpha*(1-p)*.49;
   windBand(c,effect.x,effect.y,r*(.34+.63*p),-.76+p*2,4.4,r*.042,p);
   c.restore();
  }else shardBurst(c,{...effect,r},p,options,kind);
 }
 return true;
}

export function drawColdBolt(c,bolt,clock,options={}){
 if(bolt.hostile||bolt.friendly===false)return false;
 const id=sourceId(bolt),r=bolt.r;
 if(!['m_fireball','m_icecone','m_spirit','m_icegod'].includes(id)||!(r>0))return false;
 const t=motion(clock,options),a=Math.atan2(bolt.vy??0,bolt.vx??1),alpha=c.globalAlpha;
 c.save();c.translate(bolt.x,bolt.y);c.rotate(a);
 if(id==='m_fireball'){
  const edge=Math.sin(t*13)*r*.56;
  const size=1+.035*Math.sin(t*16);
  c.imageSmoothingEnabled=true;
  c.globalAlpha=alpha*.96;
  const painted=drawBplus(c,'vfx/frost-projectile.webp',0,edge*.08,r*5.22*size,r*2.63*size,{anchorX:.765,anchorY:.5});
  if(!painted){
   c.fillStyle=softColor(c,-r*4.4,0,r,0,[[0,'transparent'],[.57,'#9ac4de'],[1,'#a7dbe8']]);c.globalAlpha=alpha*.61;
   polygon(c,[[-r*4.4,edge*.8],[-r*.7,-r*.79],[r*.28,0],[-r*.7,r*.73]]);
   c.fillStyle=softColor(c,r,-r,-r,r,[[0,'#bbdfec'],[.57,'#76badf'],[1,'#547b9f']]);c.globalAlpha=alpha*.96;
   polygon(c,[[-r,-r*.66],[r*.1,-r*1.14],[r*1.19,-r*.32],[r*1.03,r*.72],[0,r*1.16],[-r*.9,r*.65]]);
   c.fillStyle='#dfedf5';
   polygon(c,[[-r,-r*.66],[r*.1,-r*1.14],[r*1.19,-r*.32],[edge,r*.61],[-r*.42,r*.14]]);
   c.fillStyle='#9bc8dd';
   polygon(c,[[r*.1,-r*1.14],[r*1.19,-r*.32],[edge,r*.61],[edge-r*.3,-r*.21]]);
  }
  c.fillStyle='#d9f2f8';c.globalAlpha=alpha*.74;
  for(let i=0;i<4;i++){
   const q=fract(t*3+i*.236),distance=r*(1.1+q*3.16),lift=r*Math.sin(t*11+i*2.4)*(.39+q*.57);
   c.fillRect(-distance,lift,Math.max(1.1,r*.14),Math.max(1.1,r*.09));
  }
 }else if(id==='m_icecone'){
  const spin=.52+.48*Math.sin(t*16);
  c.fillStyle=softColor(c,-r*5,0,r*.4,0,[[0,'transparent'],[.62,'#72a0c5'],[1,'#a5cfdf']]);c.globalAlpha=alpha*.60;
  polygon(c,[[-r*5.1,r*.17],[-r*.81,-r*.62],[r*.5,0],[-r*.81,r*.6]]);
  c.fillStyle=softColor(c,r*1.5,-r*.65,-r*1.44,r*.68,[[0,'#e4f2fa'],[.55,'#9fbbda'],[1,'#4c7a9f']]);c.globalAlpha=alpha;
  polygon(c,[[r*1.85,0],[-r*.8,-r*.76],[-r*1.47,-r*.32],[-r*1.47,r*.33],[-r*.8,r*.77]]);
  c.fillStyle='#e4f4fc';c.globalAlpha=alpha*.81;
  polygon(c,[[r*1.73,0],[-r*.8,-r*.69],[-r*.76,-r*.51+spin*r*.50],[-r*1.31,r*.21]]);
  c.fillRect(-r*.34,-r*.16,Math.max(1.2,r*.19),1);
 }else if(id==='m_spirit'){
  const swing=Math.sin(t*19)*r*.38;
  c.fillStyle=softColor(c,-r*2.4,r*.3,r*1.3,0,[[0,'transparent'],[.55,'#9fb8d9'],[1,'#b0def2']]);c.globalAlpha=alpha*.84;
  polygon(c,[[r*1.25,0],[-r*.26,-r*.45],[-r*1.12,-r*1.18+swing],[-r*2.33,-r*.27],[-r*.8,0],[-r*2.31,r*.41],[-r*1.15,r*1.14+swing],[-r*.22,r*.43]]);
  c.fillStyle='#dceaf9';c.globalAlpha=alpha;
  polygon(c,[[r*1.25,0],[-r*.78,-r*.31],[-r*1.24,r*.05],[-r*.59,r*.34]]);
 }else{
  const wake=Math.sin(t*18)*r*.35;
  c.fillStyle=softColor(c,-r*4.1,0,r*.4,0,[[0,'transparent'],[.56,'#9a9ad7'],[1,'#b6c4ed']]);c.globalAlpha=alpha*.73;
  polygon(c,[[r*.33,-r*.14],[-r*.76,-r*1.29+wake],[-r*4.1,-r*.82],[-r*.93,-r*.42],[r*.38,0]]);
  polygon(c,[[r*.33,r*.14],[-r*.76,r*1.29-wake],[-r*4.1,r*.82],[-r*.93,r*.42],[r*.38,0]]);
  c.fillStyle=softColor(c,r*1.83,0,-r*1.57,r*.55,[[0,'#ecf5ff'],[.54,'#b5cef5'],[1,'#748bad']]);c.globalAlpha=alpha;
  polygon(c,[[r*1.83,0],[-r*.22,-r*.82],[-r*1.57,0],[-r*.22,r*.83]]);
  c.fillStyle='#a3c9fe';
  polygon(c,[[r*1.83,0],[-r*.22,r*.83],[-r*1.57,0],[-r*.22,r*.14]]);
 }
 c.restore();return true;
}
