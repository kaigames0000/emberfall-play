const TAU=Math.PI*2;
const FLATTEN=.52;
const GLOW='#aecfd7';
const SHINE='#deeeeb';

// Shape, tooth count and angular offset. Layers with the same shape share one contour.
const patterns={
 w_banner:['wave',5,.11],w_haste:['wave',7,.36],w_warcry:['saw',9,.22],
 w_knight:['briar',8,.03],w_order:['rays',8,.31],w_renewal:['wave',4,.18],
 w_crit:['saw',7,.07],w_elemental:['rays',11,.44],r_hunt:['briar',7,.53],
 m_ward:['saw',10,.59],m_aegis:['rays',6,.72],b_bloodaura:['briar',11,.87],
 a_dancer:['briar',6,.46],clarity:['wave',6,.83],war:['saw',8,.64],
 ward:['saw',11,.68],hunt:['briar',9,.96],m_wardlantern:['rays',9,.77],m_hexidol:['rays',13,.93],
};
export const AURA_VFX_IDS=Object.freeze(Object.keys(patterns));

function lightBand(ctx,radius,opacity,width){
 ctx.save();
 ctx.scale(1,FLATTEN);
 const glow=ctx.createRadialGradient(0,0,Math.max(0,radius-width),0,0,radius+width);
 glow.addColorStop(0,'transparent');
 glow.addColorStop(.32,'#9cbdc72a');
 glow.addColorStop(.55,'#c8e0e78c');
 glow.addColorStop(1,'transparent');
 ctx.globalAlpha*=opacity;
 ctx.fillStyle=glow;
 ctx.beginPath();ctx.arc(0,0,radius+width,0,TAU);ctx.fill();
 ctx.restore();
}

function profileFor(layers){
 const identities=new Set(),shapes=new Map();
 let phase=0;
 for(const layer of layers){
  if(identities.has(layer.id))continue;
  identities.add(layer.id);
  const [shape,points,offset]=Object.hasOwn(patterns,layer.id)?patterns[layer.id]:patterns.clarity;
  const current=shapes.get(shape)??{shape,count:0,points:0,offset:1};
  current.count++;
  current.points+=points;
  current.offset=Math.min(offset,current.offset);
  shapes.set(shape,current);
  if(Number.isFinite(layer.phase))phase=Math.max(phase,Math.min(1,layer.phase));
 }
 return {profiles:[...shapes.values()].sort((a,b)=>a.shape.localeCompare(b.shape)),count:identities.size,phase};
}

function deform(profile,angle){
 const a=angle*profile.teeth+profile.offset*TAU;
 if(profile.shape==='briar'){
  return 8.7*Math.max(0,Math.cos(a))**7-1.8+Math.sin(angle*2)*1.2;
 }
 if(profile.shape==='saw'){
  const part=a/TAU-Math.floor(a/TAU);
  return 6*(part<.30?part/.30:(1-part)/.70)-2.8;
 }
 if(profile.shape==='rays')return 1.35*Math.sin(a);
 return 3.9*Math.sin(a)+.65*Math.sin(2*a);
}

function contour(ctx,radius,profiles,spin,steps){
 ctx.beginPath();
 for(let i=0;i<=steps;i++){
  const a=i/steps*TAU;
  let amplitude=0;
  for(const profile of profiles)amplitude+=deform(profile,a-spin);
  const r=radius+amplitude/Math.sqrt(profiles.length);
  const x=Math.cos(a)*r,y=Math.sin(a)*r*FLATTEN;
  if(i)ctx.lineTo(x,y);else ctx.moveTo(x,y);
 }
 ctx.closePath();
}

function spokes(ctx,radius,profile,spin,pulse){
 ctx.beginPath();
 for(let i=0;i<profile.teeth;i++){
  const a=spin+(i+.45)/profile.teeth*TAU;
  const p=(pulse+i%3*.22)%1,from=radius+2+p*7,to=from+2+Math.sin(p*Math.PI)*10;
  const dx=Math.cos(a),dy=Math.sin(a)*FLATTEN;
  ctx.moveTo(dx*from,dy*from);
  ctx.quadraticCurveTo(dx*(from+to)*.5-dy*2,dy*(from+to)*.5+dx*1.8,dx*to,dy*to);
 }
}

export function drawAuraFootprint(ctx,x,y,layers,clock=0,{detail='full',reducedMotion=false,scale=1,opacity=1}={}){
 if(!layers.length||opacity<=0)return;
 const {profiles,count,phase}=profileFor(layers);
 for(const profile of profiles)profile.teeth=Math.round(profile.points/profile.count);
 const ray=profiles.find(profile=>profile.shape==='rays');
 const time=reducedMotion?0:clock;
 const spin=time*.78,pulse=(time*.66)%1;
 const breath=.5+.5*Math.sin(clock*(reducedMotion?.55:1.85)+profiles[0].offset*TAU);
 const radius=29+Math.min(4,count-1)*1.2;
 ctx.save();
 ctx.translate(x,y+8*scale);
 ctx.scale(scale,scale);
 const alpha=ctx.globalAlpha*opacity;
 ctx.globalAlpha=alpha;
 ctx.lineJoin='round';
 ctx.lineCap='round';
 lightBand(ctx,radius,.38+breath*.20,8);
 contour(ctx,radius,profiles,spin,detail==='full'?132:84);
 ctx.strokeStyle=GLOW;
 ctx.globalAlpha=alpha*(.16+breath*.08);ctx.lineWidth=5.8;ctx.stroke();
 ctx.globalAlpha=alpha*(.53+breath*.16+phase*.10);ctx.lineWidth=1.3;ctx.strokeStyle=SHINE;ctx.stroke();
 ctx.globalAlpha=alpha*.49;
 ctx.lineWidth=2.3;
 ctx.beginPath();
 const accent=spin+profiles[0].offset*TAU;
 const accentRadius=radius-4;
 for(const [angle,length] of [[accent,.68],[accent+Math.PI,.46]]){
  ctx.moveTo(Math.cos(angle)*accentRadius,Math.sin(angle)*accentRadius*FLATTEN);
  ctx.ellipse(0,0,accentRadius,accentRadius*FLATTEN,0,angle,angle+length);
 }
 ctx.stroke();
 if(ray){
  spokes(ctx,radius,ray,spin,pulse);
  ctx.strokeStyle=GLOW;ctx.globalAlpha=alpha*(.38+breath*.27);
  ctx.lineWidth=1.35;ctx.stroke();
 }
 ctx.restore();
}

export function drawAuraPulse(ctx,x,y,progress,reducedMotion){
 const radius=34+progress*(reducedMotion?4:21);
 ctx.save();
 ctx.translate(x,y+8);
 lightBand(ctx,radius,(1-progress)**2*.25,5);
 ctx.restore();
}
