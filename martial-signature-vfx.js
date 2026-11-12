import {drawSkillSprite} from './skill-sprites.js?v=125';

const TAU=Math.PI*2;
const QUARTER=Math.PI/2;
const clamp=value=>Math.max(0,Math.min(1,value));
const polar=(angle,radius,height=1)=>[Math.cos(angle)*radius,Math.sin(angle)*radius*height];
const contour=(lobes,depth,phase,toothed,height)=>Array.from({length:48},(_,i)=>{
 const angle=i*TAU/48;
 const wave=(1+Math.sin(angle*lobes+phase))*.5;
 return polar(angle,1-depth*.48*(toothed?Math.pow(wave,3):wave),height);
});

const CRIES=new Map([
 ['w_guard',{rim:'#c8a681',core:'#f0d6a9',shadow:'#585044',lobes:4,depth:.16,phase:.1,toothed:true,height:.85,echo:.19}],
 ['b_guardcry',{rim:'#a68bb4',core:'#dac4e1',shadow:'#504651',lobes:5,depth:.23,phase:.8,toothed:true,height:.81,echo:.25}],
 ['b_rally',{rim:'#c78184',core:'#efd0bd',shadow:'#634d53',lobes:3,depth:.17,phase:1.2,toothed:false,height:.9,echo:.14}],
 ['b_frenzycry',{rim:'#d19c72',core:'#f1c898',shadow:'#6a514a',lobes:10,depth:.18,phase:.2,toothed:true,height:.87,echo:.095}],
 ['b_ironcry',{rim:'#93adbc',core:'#d8e3dc',shadow:'#555667',lobes:6,depth:.13,phase:.5,toothed:true,height:.86,echo:.21}],
 ['b_dread',{rim:'#a98cae',core:'#dfbed7',shadow:'#504158',lobes:7,depth:.28,phase:.9,toothed:true,height:.82,echo:.17}],
 ['b_ritual',{rim:'#bc8193',core:'#efc2c6',shadow:'#5c4758',lobes:6,depth:.16,phase:1.4,toothed:false,height:.86,echo:.22}],
 ['b_avatar',{rim:'#d89074',core:'#f6caa5',shadow:'#634b49',lobes:4,depth:.26,phase:2.1,toothed:true,height:.88,echo:.12}],
 ['m_sanctuary',{rim:'#929dbf',core:'#d4dce8',shadow:'#53566a',lobes:8,depth:.09,phase:.1,toothed:false,height:.92,echo:.22}],
 ['a_veil',{rim:'#9d8eb9',core:'#d5c5de',shadow:'#4b465d',lobes:2,depth:.24,phase:.3,toothed:false,height:.83,echo:.29}],
].map(([id,cry])=>[id,{...cry,edge:contour(cry.lobes,cry.depth,cry.phase,cry.toothed,cry.height)}]));

const CRY_ACCENTS={
 w_guard:[[.76,-.13],[.9,-.12],[.96,0],[.9,.12],[.76,.13]],
 b_guardcry:[[.55,-.08],[.82,-.15],[.96,0],[.82,.15],[.55,.08]],
 b_rally:[[.61,-.12],[.84,-.15],[.95,0],[.84,.15],[.61,.12],[.75,0]],
 b_frenzycry:[[.53,-.13],[.95,-.05],[.81,.01],[.98,.1]],
 b_ironcry:[[.7,-.16],[.9,-.17],[.96,-.07],[.96,.07],[.9,.17],[.7,.16]],
 b_dread:[[.65,-.14],[.83,-.06],[.78,-.03],[.96,.1],[.78,.09],[.86,.16]],
 b_ritual:[[.64,0],[.79,-.09],[.96,0],[.79,.09],[.64,0]],
 b_avatar:[[.68,-.2],[.94,-.08],[.77,-.02],[.97,.16],[.7,.09]],
 m_sanctuary:[[.7,-.07],[.81,-.07],[.81,-.15],[.96,0],[.81,.15],[.81,.07],[.7,.07]],
 a_veil:[[.66,-.12],[.74,-.17],[.9,-.12],[.96,.05],[.87,.14],[.75,.12]],
};

function polygon(ctx,points){
 ctx.moveTo(...points[0]);
 for(let i=1;i<points.length;i++)ctx.lineTo(...points[i]);
 ctx.closePath();
}

function drawStroke(ctx,color,width,opacity){
 ctx.strokeStyle=color;
 ctx.lineWidth=width;
 ctx.globalAlpha=opacity;
 ctx.stroke();
}

const FRACTURES=Array.from({length:7},(_,i)=>{
 const angle=-1.38+i*TAU/7+Math.sin(i*2.6)*.17;
 return [0,.19,.36,.59,.78,1].map((at,j)=>polar(angle+(j%2?.16:-.12)*Math.min(1,j*.4),at,.78));
});

function crackPaths(ctx,radius,growth,full){
 ctx.beginPath();
 for(let i=0;i<FRACTURES.length;i+=full?1:2){
  const points=FRACTURES[i],reach=growth*(points.length-1);
  ctx.moveTo(0,0);
  for(let j=1;j<points.length&&j<=Math.ceil(reach);j++){
   const end=Math.min(1,reach-j+1),[x,y]=points[j],[px,py]=points[j-1];
   ctx.lineTo(radius*(px+(x-px)*end),radius*(py+(y-py)*end));
  }
  if(growth>.38){
   const [x,y]=points[2],turn=(growth-.38)*.44;
   ctx.moveTo(x*radius,y*radius);
   ctx.lineTo((x+turn*(x-y))*radius,(y+turn*(x+y))*radius);
  }
 }
}

function groundChips(ctx,radius,progress,alpha,count,colors){
 const launch=clamp((progress-.08)*1.22);
 if(!launch)return;
 ctx.beginPath();
 for(let i=0;i<count;i++){
  const angle=i*2.39996,reach=radius*(.16+launch*(.4+.25*(i%3)/2));
  const [x,ground]=polar(angle,reach,.77),lift=Math.sin(launch*Math.PI)*Math.min(12,radius*.12);
  const size=Math.min(4.2,radius*.05)*(1-launch*.56)*(.65+.22*(i%4));
  const y=ground-lift;
  polygon(ctx,[[x-size*.83,y-size*.16],[x-size*.22,y-size*.68],[x+size*.54,y-size*.4],
   [x+size,y+size*.12],[x+size*.1,y+size*.49]]);
 }
 ctx.globalAlpha=alpha*.54*(1-launch*.5);
 ctx.fillStyle=colors[0];
 ctx.fill();
 ctx.beginPath();
 for(let i=0;i<count+5;i++){
  const angle=i*2.39996+.34,reach=radius*(.22+launch*(.33+.23*(i%4)/3));
  const [x,y]=polar(angle,reach,.8),size=.8+(i%4)*.48;
  ctx.moveTo(x,y);ctx.lineTo(x+size,y-(i%2)*.8);
 }
 drawStroke(ctx,colors[1],1.05,alpha*.49*(1-launch*.6));
}

function drawFissure(ctx,effect,progress,alpha,full,still){
 const {r}=effect;
 ctx.globalAlpha=Math.min(ctx.globalAlpha,alpha*1.24);
 const painted=drawSkillSprite(ctx,'cleave',0,0,r*2.02,r*1.52,{progress,opacity:1,reducedMotion:still});
 const growth=.13+.87*Math.min(1,progress*1.56);
 if(!painted){
  crackPaths(ctx,r,growth,full);
  drawStroke(ctx,'#30272a',Math.min(4.2,r*.047),alpha*.85);
  drawStroke(ctx,'#b59476',Math.min(2.45,r*.026),alpha*.76);
 }
 if(progress<.58){
  crackPaths(ctx,r*.54,Math.min(.42,growth*.61),false);
  drawStroke(ctx,'#efbd83',1.1,alpha*.73*(1-progress/.58));
 }
 groundChips(ctx,r,progress,alpha,full?12:6,['#8c7b71','#d2b397']);
}

const SLAM_EDGE=contour(8,.07,.35,true,.81);
const WAVE_SPANS=[[0,7],[8,13],[15,22],[24,28],[29,37],[39,42],[43,47]];

function wavePath(ctx,edge,radius,phase,full){
 ctx.beginPath();
 for(const [start,end] of WAVE_SPANS){
  for(let i=start;i<=end;i+=full?1:2){
   const [x,y]=edge[(i+phase)%edge.length];
   if(i===start)ctx.moveTo(x*radius,y*radius);
   else ctx.lineTo(x*radius,y*radius);
  }
 }
}

function waveGrain(ctx,edge,radius,phase,count){
 ctx.beginPath();
 for(let i=0;i<count;i++){
  const [x,y]=edge[(i*17+phase)%edge.length],distance=radius*(.86+.11*(i%5)/4);
  const length=1+(i%4)*.45;
  ctx.moveTo(x*distance,y*distance);
  ctx.lineTo(x*distance-y*length,y*distance+x*length);
 }
}

function drawShieldSlam(ctx,effect,progress,alpha,full){
 const {r}=effect;
 const radius=r*(.11+.85*Math.pow(progress,.7));
 const phase=4+Math.floor(progress*9);
 wavePath(ctx,SLAM_EDGE,radius,phase,full);
 drawStroke(ctx,'#716c6e',Math.min(9,r*.085),alpha*.28);
 drawStroke(ctx,'#c1ac99',Math.min(4.8,r*.043),alpha*.65);
 drawStroke(ctx,'#e7d7be',1.25,alpha*.65);
 const echo=clamp((progress-.15)/.85);
 if(echo>0){
  wavePath(ctx,SLAM_EDGE,r*(.1+.72*Math.pow(echo,.84)),phase+11,full);
  drawStroke(ctx,'#a1a0a7',2.4,alpha*.32);
 }
 waveGrain(ctx,SLAM_EDGE,radius,phase,full?31:14);
 drawStroke(ctx,'#e7d2b7',1.25,alpha*.69);
 const size=Math.min(32,r*.25)*(1+.09*progress),seal=alpha*(1-progress*.47);
 ctx.beginPath();
 polygon(ctx,[[-size*.86,-size*.48],[0,-size*.72],[size*.86,-size*.48],[size*.66,size*.25],
  [0,size*.68],[-size*.66,size*.25]]);
 ctx.fillStyle='#393847';
 ctx.globalAlpha=seal*.78;
 ctx.fill();
 drawStroke(ctx,'#7e6a5c',4,seal*.85);
 drawStroke(ctx,'#d7b895',1.45,seal*.93);
 ctx.beginPath();
 polygon(ctx,[[-size*.64,-size*.36],[0,-size*.52],[size*.02,size*.49],[-size*.52,size*.19]]);
 ctx.fillStyle='#9b8a8b';
 ctx.globalAlpha=seal*.44;
 ctx.fill();
 ctx.beginPath();
 ctx.moveTo(-size*.43,-size*.13);
 ctx.lineTo(0,-size*.28);
 ctx.lineTo(size*.43,-size*.13);
 ctx.moveTo(0,-size*.28);
 ctx.lineTo(0,size*.37);
 drawStroke(ctx,'#e0cab0',1.8,seal*.88);
 groundChips(ctx,r,progress,alpha,full?9:4,['#777786','#bcacaa']);
}

function drawWhirl(ctx,effect,clock,alpha,still){
 const {r,ability}=effect;
 const edge=r*.94,band=Math.min(6.4,r*.096),blood=ability==='b_flurry';
 const palette=blood?['#73566f','#b68094','#efcab9']:['#737384','#b7b0b8','#f4dfbd'];
 ctx.rotate(clock*(still?1.45:11.8));
 ctx.beginPath();
 for(let i=0;i<4;i++){
  const end=i*QUARTER+.44,start=end-1.32+(i%2)*.14;
  ctx.moveTo(...polar(start,edge));
  ctx.arc(0,0,edge,start,end);
  for(let segment=6;segment>=0;segment--){
   const t=segment/6,angle=start+(end-start)*t;
   const inset=band*Math.sin(t*Math.PI)*(.45+t*.53);
   ctx.lineTo(...polar(angle,edge-inset));
  }
  ctx.closePath();
 }
 ctx.fillStyle=palette[1];
 ctx.globalAlpha=alpha*.55;
 ctx.fill();
 ctx.beginPath();
 for(let i=0;i<4;i++){
  const end=i*QUARTER+.44,start=end-.65;
  ctx.moveTo(...polar(start,edge-band*.14));
  ctx.arc(0,0,edge-band*.14,start,end);
 }
 drawStroke(ctx,palette[2],Math.min(2,band*.31),alpha*.86);
 ctx.beginPath();
 for(let i=0;i<4;i++){
  const end=i*QUARTER+.19,start=end-1.05+(i%2)*.2,inner=edge-band*(1.4+(i%2)*.36);
  ctx.moveTo(...polar(start,inner));
  ctx.arc(0,0,inner,start,end);
 }
 drawStroke(ctx,palette[0],Math.min(3.2,band*.58),alpha*.48);
}

function whirlRibbon(ctx,tip,span,radius,sweep,width,steps){
 const point=(index,inside)=>{
  const progress=index/steps;
  const edge=radius-sweep*(1-progress)**2;
  const taper=Math.sin(Math.PI*progress)**.84*(.49+progress*.76);
  return polar(tip-span*(1-progress),edge-(inside?width*taper:0));
 };
 ctx.moveTo(...point(0,false));
 for(let i=1;i<=steps;i++)ctx.lineTo(...point(i,false));
 for(let i=steps-1;i>0;i--)ctx.lineTo(...point(i,true));
 ctx.closePath();
}

function drawBloodBladeWhirl(ctx,effect,clock,alpha,full,still){
 const {r}=effect,spin=still?0:clock*9.7;
 const edge=r*.97,width=Math.min(19,r*.145),steps=full?16:9;
 ctx.scale(1,.76);
 ctx.rotate(spin);

 // A broad, dark wake behind each sharp blade leaves the center readable.
 ctx.beginPath();
 for(let i=0;i<4;i++)whirlRibbon(ctx,i*QUARTER+.48,1.95+(i%2)*.28,
  edge-r*.035*(i%2),r*.30,width*1.26,steps);
 ctx.fillStyle='#843345';
 ctx.globalAlpha=alpha*.28;
 ctx.fill();

 ctx.beginPath();
 for(let i=0;i<4;i++)whirlRibbon(ctx,i*QUARTER+.48,1.2+(i%2)*.24,
  edge-r*.035*(i%2),r*.16,width*(.68+(i%2)*.23),steps);
 ctx.fillStyle='#c56955';
 ctx.globalAlpha=alpha*.55;
 ctx.fill();

 ctx.beginPath();
 for(let i=0;i<4;i++){
  const tip=i*QUARTER+.48,radius=edge-r*.035*(i%2);
  const start=tip-.46;
  ctx.moveTo(...polar(start,radius));
  ctx.arc(0,0,radius,start,tip);
 }
 drawStroke(ctx,'#ffdab0',Math.min(2.8,width*.18),alpha*.88);

 ctx.beginPath();
 for(let i=0;i<3;i++)whirlRibbon(ctx,i*TAU/3-.18-spin*.27,1.02+(i%2)*.30,
  edge*(.73+.045*i),r*.20,width*.46,steps);
 ctx.fillStyle='#da8682';
 ctx.globalAlpha=alpha*.29;
 ctx.fill();

 ctx.beginPath();
 const count=still?8:full?22:12;
 for(let i=0;i<count;i++){
  const age=still?.52:(clock*1.52+i*.618034)%1;
  const angle=i*2.39996+age*.91-spin*.38;
  const distance=r*(.53+age*.39),length=Math.min(8,r*.067)*(1-age*.69);
  const [x,y]=polar(angle,distance),[tailX,tailY]=polar(angle-.065,distance-length);
  ctx.moveTo(tailX,tailY);
  ctx.lineTo(x,y);
 }
 drawStroke(ctx,'#f0a16e',Math.min(2,width*.13),alpha*.74);
}

function drawCry(ctx,effect,progress,alpha,full,profile){
 const {r,ability}=effect;
 const radiusAt=stage=>r*(.12+.86*(1-Math.pow(1-stage,1.18)));
 const radius=radiusAt(progress),phase=Math.floor(profile.phase*7+progress*6);
 wavePath(ctx,profile.edge,radius,phase,full);
 drawStroke(ctx,profile.shadow,Math.min(6.1,r*.07),alpha*.27);
 drawStroke(ctx,profile.rim,Math.min(3.8,r*.042),alpha*.72);
 drawStroke(ctx,profile.core,1.15,alpha*.57);
 const echo=clamp((progress-profile.echo)/(1-profile.echo));
 if(echo>0){
  wavePath(ctx,profile.edge,radiusAt(echo)*.91,phase+11,full);
  drawStroke(ctx,profile.rim,1.6,alpha*.46);
 }
 waveGrain(ctx,profile.edge,radius,phase,full?16:8);
 drawStroke(ctx,profile.core,1,alpha*.46);
 const rays=full?profile.lobes:Math.min(4,profile.lobes);
 const accent=CRY_ACCENTS[ability];
 ctx.beginPath();
 for(let i=0;i<rays;i++){
  const angle=profile.phase+i*TAU/rays,c=Math.cos(angle),s=Math.sin(angle);
  for(let point=0;point<accent.length;point++){
   const [forward,side]=accent[point];
   const x=(c*(.63+forward*.29)-s*side*.67)*radius,y=(s*(.63+forward*.29)+c*side*.67)*radius*profile.height;
   if(point)ctx.lineTo(x,y);
   else ctx.moveTo(x,y);
  }
 }
 drawStroke(ctx,profile.core,1.1,alpha*.57*(1-progress*.65));
}

export function drawMartialSignature(ctx,effect,clock=0,options={}){
 const {ability,type,visual,x,y,r,t,max}=effect;
 if(effect.friendly===false||!(r>0)||!Number.isFinite(x)||!Number.isFinite(y)||!(t>0))return false;
 const cleave=ability==='w_cleave'&&(visual==='impact'||type==='whirl');
 const slam=ability==='w_slam'&&visual==='impact';
 const whirl=type==='channel-whirl';
 const cry=CRIES.get(ability);
 const cryCast=cry&&(visual==='warcry'||visual==='shield'||ability==='b_dread'&&visual==='curse');
 if(!cleave&&!slam&&!whirl&&!cryCast)return false;
 const progress=1-clamp(t/(max||1));
 const alpha=ctx.globalAlpha*(whirl?Math.min(1,(1-progress)*2.8):Math.pow(1-progress,.65));
 const full=options.detail!=='low'&&!options.reducedMotion;
 ctx.save();
 ctx.translate(x,y);
 ctx.lineCap='round';
 ctx.lineJoin='round';
 if(cleave)drawFissure(ctx,effect,progress,alpha,full,options.reducedMotion);
 else if(slam)drawShieldSlam(ctx,effect,progress,alpha,full);
 else if(whirl&&ability==='w_whirl')drawBloodBladeWhirl(ctx,effect,clock,alpha,full,options.reducedMotion);
 else if(whirl)drawWhirl(ctx,effect,clock,alpha,options.reducedMotion);
 else drawCry(ctx,effect,progress,alpha,full,cry);
 ctx.restore();
 return true;
}
