// Each drawing is authored on a nine-by-nine grid. The separator starts a new stroke.
const designs = [
 // Melee strikes, dashes and channels.
 ['w_cleave','#ffbb73',3,1.1,'03 25 43 55 82|43 32 41|55 57 78'],
 ['w_slam','#f1d5a7',4,.9,'12 72 66 48 26 12|34 54 56 36 34'],
 ['w_whirl','#f4928d',3,2.1,'26 46 64 62 41 21|62 73 75 66'],
 ['w_charge','#efd590',3,1.4,'02 83 44 84 04|23 43 24'],
 ['w_blitz','#b4c4ff',4,1.7,'01 51 33 83 36 37 14 31 01'],
 ['a_stab','#d0abd7',2,1.6,'06 76 82 45 06|27 65'],
 ['a_execute','#e09bb0',4,1.2,'01 76 85 36 17|22 81'],
 ['a_mirrorstrike','#c1b5f4',3,1.1,'20 62 67 28 20|31 52 54 35 31'],
 ['a_flurry','#cd9cca',5,1.75,'04 35 64|16 48 85|21 52 82'],
 ['a_storm','#d3bbf8',6,1.3,'20 45 80|02 44 86|07 45 78'],
 ['b_cleave','#e37d77',3,1.05,'03 32 63 80 74 45 23 03'],
 ['b_execute','#f28769',4,.8,'20 42 64 84 56 34 12 20|45 47 58'],
 ['b_flurry','#f28792',5,1.85,'02 42 82|24 44 64|06 46 86'],
 ['m_nova','#b2edff',6,1.15,'40 54 81 65 86 55 48 35 06 25 01 34 40'],
 ['m_flamethrower','#bcf4ff',4,1.75,'02 31 60 84 64 51|06 35 66 84 65 56|04 44 74'],
 ['r_dash','#b7dd99',2,1.55,'03 36 83 64 46 26 03'],
 ['a_blink','#d6a8f4',3,1.7,'10 61 68 18 10|23 43 46 26 23|53 73'],
 ['b_leap','#f29170',4,1.05,'05 26 36 51 70 75 55 39|27 57'],
 // Defense, recovery and vocal skills.
 ['w_guard','#f0c984',3,1,'12 41 72 66 47 26 12|44 74'],
 ['m_sanctuary','#7adfd5',4,.8,'31 51 73 76 58 38 16 13 31|34 54 46 34'],
 ['m_frostarmor','#98dfff',4,1,'40 72 76 48 16 12 40|22 46 62'],
 ['b_ritual','#ee786d',4,1,'40 62 76 48 16 22 40|33 55 46 33'],
 ['b_avatar','#f49862',4,1.25,'10 33 40 53 80 66 47 26 10'],
 ['b_guardcry','#d98c81',3,.9,'30 52 64 57 37 24 30|22 02|64 84'],
 ['a_veil','#bea2f1',3,.75,'80 40 12 06 37 74 45 33 80'],
 ['b_rally','#f58d81',4,1.15,'03 24 41 64 83|26 45 66|18 78'],
 ['b_frenzycry','#ffac60',5,1.55,'02 23 42 64 83|04 25 44 66 85'],
 ['b_ironcry','#d9c1ac',4,.8,'12 62 85 66 15 12|33 63 54 36 33'],
 ['b_dread','#d291d5',5,1.2,'00 21 44 61 80 67 43 27 00'],
 // Active aura activation marks. The persistent layers use separate artwork.
 ['w_banner','#edc97a',3,1,'18 10 62 73 44 14|43 45'],
 ['w_haste','#abdce4',4,1.5,'02 32 52 61|04 84|06 56 65'],
 ['w_warcry','#dfd7a8',4,.85,'20 60 73 66 48 26 13 20|34 54 56 36'],
 ['w_knight','#ff9a61',5,1.35,'07 22 44 61 76 58 28 07|28 44 58'],
 ['w_order','#9fe0fa',4,1,'40 43 25 04|43 64 84|43 45 47|23 63'],
 ['w_renewal','#9ed8ae',4,.95,'40 43 26 48 66 43 40|17 38|57 77'],
 ['w_crit','#f3b388',4,1.15,'40 54 83 65 67 45 27 24 03 35 40'],
 ['w_elemental','#dcb1e8',4,1.1,'20 52 44 15 20|64 78 48 44 64'],
 ['r_hunt','#b3db8d',3,1.3,'21 42 61 74 56 37 15 21|33 56'],
 ['m_ward','#86e6d3',3,.85,'12 63 75 56 48 27 12|44 45 46'],
 ['m_aegis','#92cfff',4,.8,'42 73 64 46 24 13 42|44 38 58 44'],
 ['b_bloodaura','#f18184',5,1.25,'41 63 75 68 38 15 31 41|43 54 45 43'],
 ['a_dancer','#c6a2ec',4,1.45,'10 54 23 68 84 51 10|24 65'],
 // Projectiles and their individual impact motifs.
 ['r_volley','#d7d293',4,1.3,'02 33 04|22 76 43 22|04 37 05'],
 ['m_fireball','#9bddff',5,1.15,'20 53 80 76 48 24 03 20|34 53 65 46 34'],
 ['m_chain','#f3d889',4,1.7,'00 71 44 84 28 43 05 00|22 42'],
 ['r_poisonarrow','#ade777',4,1.15,'04 23 62 84 63 26 04|14 46 25'],
 ['r_ricochet','#fac681',3,1.7,'03 34 70 84 45 57 03'],
 ['m_icecone','#c7f5ff',4,1.3,'07 26 41 83 75 57 07|36 83|48 75'],
 ['r_pierce','#eeceaa',3,1.1,'02 51 84 54 03 02|14 62 84'],
 ['r_burst','#c5e577',5,1.25,'00 64 84 63 18 36 24 00|35 55 46'],
 ['a_shuriken','#e4b5e4',4,2.2,'42 61 64 86 57 37 27 24 02 32 42'],
 ['a_kunai','#d0b4e5',3,1.65,'02 23 54 85 54 36 04 02|24 34'],
 ['r_snipe','#fde3a2',3,1.2,'00 13 54 81 85 54 15 00|41 47'],
 ['r_icearrow','#a8e7ff',4,1.35,'04 33 63 80 86 65 35 04|32 25|53 58'],
 ['r_explosivearrow','#ffad65',5,1.6,'02 42 61 84 67 46 06 02|33 56 63 33'],
 ['r_homingarrow','#e3c4ff',3,1.8,'01 33 62 84 56 27 08 36 54 33 01'],
 ['m_spark','#ffe098',4,1.7,'11 63 44 76 47 28 44 11|25 43 62'],
 // Persistent target areas and devices.
 ['r_rain','#dbbc89',5,1.4,'00 24 14|22 56 43|40 74 65|64 87 76'],
 ['r_venom','#a4d574',5,.75,'10 32 51 63 85 67 37 18 07 10|25 45 35'],
 ['m_meteor','#e8cd9f',5,1.45,'00 31 43 62 82 67 47 35 15 00|42 34 56'],
 ['m_blizzard','#bbeeff',6,1.25,'10 42 61 82 75 57 36 17 06 10|34 44 65'],
 ['r_trap','#dcb989',3,1.05,'02 42 82 63 45 63|41 46 28 68'],
 ['r_mine','#b4d86c',4,1.3,'03 40 83 66 48 26 03|34 53 65 46 34'],
 ['r_snare','#c8cc91',3,.85,'01 32 44 72 80|02 35 48 74 83'],
 ['a_blades','#d6a5dc',4,1.55,'02 31 42 30|64 82 84 74|65 47 28 17'],
 ['a_mine','#ec9cad',4,1.15,'03 21 51 84 67 28 03|34 50 66 46 34'],
 ['a_sentry','#c7a9ef',3,1.35,'02 62 83 44 64 15|31 53 35'],
 // Curses.
 ['r_mark','#e8ce96',3,1.05,'10 61 82 76 38 14 10|32 54 33|45 47'],
 ['r_barbs','#b6ce84',4,1.15,'04 34 43 62 83|31 44 37|51 64 57'],
 ['a_mark','#d6acf0',4,1.1,'10 23 42 64 80 77 58 38 17 10|34 46 55'],
 // A different summoning sigil for each creature.
 ['r_wolf','#a6d4b8',4,1.3,'00 23 41 62 80 75 55 47 35 15 00'],
 ['r_pack','#b1bce4',5,1.2,'00 13 35 40 66 74 80 85 58 36 17 04 00'],
 ['m_golem','#d6b883',4,.75,'21 62 74 65 68 38 25 14 21|24 63'],
 ['m_frostgolem','#a8e2ff',4,.8,'22 40 64 86 58 26 05 22|34 52 55 34'],
 ['m_spirit','#adebff',5,1.45,'40 62 73 56 47 38 17 23 40|24 54 46'],
 ['m_avatar','#eee18f',5,1.6,'20 62 81 74 64 67 45 28 34 16 20'],
 ['m_thorn','#d9bffc',4,1.2,'14 22 32 41 54 64 75 66 35 14|43 27'],
 ['m_warder','#b1ddf2',3,.95,'40 82 65 48 16 02 40|42 54 45 32 42'],
 ['m_titan','#e8c793',5,.75,'02 40 82 74 76 56 48 28 26 14 02'],
 ['m_wardlantern','#a5edd5',4,1,'40 54 76 57 48 37 16 34 40|24 64'],
 ['m_hexidol','#dda4ee',5,1.15,'11 62 82 76 55 43 38 27 11|31 54 44'],
 ['r_clone','#c4e1af',4,1.25,'01 30 61 62 45 16 06 01|25 53 76 55 37 25'],
 ['m_icegod','#c8f2ff',6,1.05,'40 72 76 68 48 28 16 12 40|25 40 65|34 54'],
 ['a_clone','#d6b0f7',4,1.55,'03 31 62 83 57 47 36 15 03|34 44 63 52'],
 ['r_bear','#d9bd95',4,.9,'01 20 31 51 70 81 75 66 47 26 15 01|34 64'],
 ['r_eagle','#f0daa0',5,1.65,'00 42 80 67 55 48 35 27 00|42 44'],
 // Basic attack variants.
 ['m_basic_firebolt','#fbb273',3,1.5,'04 23 42 83 74 57 36 04|31 21'],
 ['m_basic_homing','#c3b1fd',3,1.45,'02 41 72 85 55 26 06 02|33 64 35'],
 ['m_basic_volley','#dbc3ff',4,1.55,'20 34 50|13 37 53|44 68 83'],
 ['m_basic_arc','#f9e39d',3,1.85,'00 42 25 64 48 84|21 23|46 67'],
 ['a_basic_twin','#e4aed9',2,1.6,'03 62 73 54 03|06 65 76 57 06'],
 ['a_basic_daggers','#d8b7ed',3,1.7,'03 32 62 83 65 36 03|15 37 56'],
 ['a_basic_rope','#e0b6d7',4,1.5,'02 24 42 54 73 86 63 54'],
 ['w_basic_sweep','#e7c9a3',3,1.25,'02 13 45 66 80 73 53 21 02'],
 ['w_basic_thrust','#f9dfac',2,1.45,'03 42 82 43 46 86 46 04'],
 ['w_basic_counter','#b4dcf7',3,1,'01 44 81 76 48 16 01|38 64'],
 ['r_basic_split','#efe0ab',4,1.5,'04 35 72|05 85|06 37 78'],
 ['r_basic_pierce','#f2ce93',2,1.45,'04 42 85 46 04|23 25'],
 ['r_basic_venom','#b7dd77',3,1.25,'04 32 65 86 45 26 04|25 47'],
 ['b_basic_alternate','#e1a6a2',3,1.55,'03 25 54 80|17 36 58 85'],
 ['b_basic_rage','#f19f89',4,1.35,'03 33 42 61 82 55 48 15 03|44 25'],
 ['b_basic_blood','#f48185',4,1.1,'00 33 56 86 75 44 26 17 00|23 42'],
];

export const SKILL_SIGNATURES = Object.freeze(Object.fromEntries(designs.map(([id,color,facets,pace,drawing])=>[id,{
 color,facets,pace,drawing,
 strokes:drawing.split('|').map(stroke=>stroke.split(' ').map(pair=>[(Number(pair[0])-4)*.25,(Number(pair[1])-4)*.25]))
}])));

const TAU=Math.PI*2;
const clamp=(n,min,max)=>Math.min(max,Math.max(min,n));
const fraction=n=>n-Math.floor(n);

function artFor(source){
 return SKILL_SIGNATURES[source.visualAbility]||SKILL_SIGNATURES[source.ability]||SKILL_SIGNATURES[source.source]||SKILL_SIGNATURES[source.id];
}
function mark(ctx,art,x,y,r,angle=0,flat=1){
 ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.scale(r,r*flat);
 const alpha=ctx.globalAlpha;
 ctx.beginPath();
 for(const points of art.strokes)for(let i=0;i<points.length;i++){
  const [px,py]=points[i];
  if(i)ctx.lineTo(px,py);else ctx.moveTo(px,py);
 }
 ctx.lineWidth=Math.max(.18,2.5/r);ctx.globalAlpha=alpha*.22;ctx.stroke();
 ctx.lineWidth=Math.max(.062,1.25/r);ctx.globalAlpha=alpha*.76;ctx.stroke();
 ctx.restore();
}

export function drawSignatureMark(ctx,id,x,y,r,clock,{reducedMotion=false}={}){
 const art=SKILL_SIGNATURES[id];
 if(!art)return false;
 const phase=clock*art.pace*(reducedMotion?.3:1),alpha=ctx.globalAlpha;
 ctx.save();
 ctx.strokeStyle=art.color;ctx.lineJoin='round';ctx.lineCap='round';
 mark(ctx,art,x,y+Math.sin(phase*4)*r*.12,r,Math.sin(phase*2)*.15);
 ctx.globalAlpha=alpha*.45;ctx.strokeStyle='#fff1da';
 mark(ctx,art,x,y-r*.08,r*.57,-Math.sin(phase*2)*.16);
 ctx.restore();
 return true;
}

function echoLine(ctx,x,y,distance,angle,width){
 ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+Math.cos(angle)*distance,y+Math.sin(angle)*distance);
 ctx.lineWidth=width;ctx.stroke();
}
function fleck(ctx,x,y,angle,length,width){
 const dx=Math.cos(angle),dy=Math.sin(angle);
 ctx.moveTo(x+dx*length,y+dy*length);
 ctx.lineTo(x-dx*length*.38+dy*width,y-dy*length*.38-dx*width);
 ctx.lineTo(x-dx*length*.7,y-dy*length*.7);
 ctx.lineTo(x-dx*length*.28-dy*width*.54,y-dy*length*.28+dx*width*.54);
 ctx.closePath();
}

function sweepBrush(ctx,r,start,end,width,steps){
 ctx.beginPath();
 for(let i=0;i<=steps;i++){
  const u=i/steps,a=start+(end-start)*u;
  const radius=r+Math.sin(u*Math.PI)*width*.2;
  if(i)ctx.lineTo(Math.cos(a)*radius,Math.sin(a)*radius);
  else ctx.moveTo(Math.cos(a)*radius,Math.sin(a)*radius);
 }
 for(let i=steps-1;i>0;i--){
  const u=i/steps,a=start+(end-start)*u;
  const radius=r-Math.sin(u*Math.PI)**1.5*width;
  ctx.lineTo(Math.cos(a)*radius,Math.sin(a)*radius);
 }
 ctx.closePath();ctx.fill();
}

function drawBowShaft(ctx,id,r,phase,alpha){
 const pulse=Math.sin(phase*2),trail=fraction(phase*.54);
 ctx.globalAlpha=alpha*.88;ctx.strokeStyle='#faf0d8';
 echoLine(ctx,-r*2.5,0,r*3.22,0,Math.max(1,r*.21));
 if(id==='r_icearrow'){
  ctx.strokeStyle='#9fe9ff';ctx.globalAlpha=alpha*.93;ctx.beginPath();
  ctx.moveTo(-r*.7,-r*.46);ctx.lineTo(r*1.43,0);ctx.lineTo(-r*.7,r*.46);
  ctx.moveTo(-r*.36,-r*.28);ctx.lineTo(-r*.9,-r*(.66+trail*.38));
  ctx.moveTo(-r*.36,r*.28);ctx.lineTo(-r*.9,r*(.66+trail*.38));
  ctx.lineWidth=2;ctx.stroke();
 }else if(id==='r_explosivearrow'){
  ctx.fillStyle='#d74c40';ctx.beginPath();ctx.arc(r*.3,0,r*(.72+pulse*.08),0,TAU);ctx.fill();
  ctx.fillStyle='#ffe8a5';ctx.beginPath();ctx.arc(r*.36,-r*.17,r*.34,0,TAU);ctx.fill();
  ctx.strokeStyle='#ffce7a';
  echoLine(ctx,-r*(.58+trail*.8),-r*.54,r*.72,-.53,1.7);
 }else{
  ctx.strokeStyle='#dfc7ff';ctx.beginPath();
  ctx.moveTo(-r*.37,-r*.49);ctx.lineTo(r*.84,0);ctx.lineTo(-r*.37,r*.49);
  ctx.moveTo(-r*2.7,-r*(.52+trail*.4));
  ctx.quadraticCurveTo(-r*1.51,r*.64*pulse,-r*.75,-r*.23);
  ctx.moveTo(-r*2.7,r*(.52+trail*.4));
  ctx.quadraticCurveTo(-r*1.51,-r*.64*pulse,-r*.75,r*.23);
  ctx.lineWidth=2.1;ctx.stroke();
 }
}

export function drawSignatureBolt(ctx,bolt,clock=0,options={}){
 if(bolt.hostile||bolt.friendly===false)return false;
 const art=artFor(bolt);
 if(!art)return false;
 const r=clamp(bolt.r??6,3,36);
 const phase=clock*art.pace*(options.reducedMotion?.35:1)*3+(bolt.age||0);
 ctx.save();ctx.translate(bolt.x,bolt.y);ctx.rotate(Math.atan2(bolt.vy||0,bolt.vx||0));
 ctx.lineCap='round';ctx.lineJoin='round';const alpha=ctx.globalAlpha;
 const width=r*(.18+Math.sin(phase)*.055);
 ctx.globalAlpha=alpha*.45;ctx.strokeStyle=art.color;
 const chargeTail=bolt.visual==='release'?r*.85:0;
 for(let lane=0;lane<2;lane++){
  const travel=fraction(phase*.45+lane*.47),side=(lane-.5)*r*.86;
  echoLine(ctx,-r*(.75+travel*2.1)-chargeTail,side*(.6+travel),r*(1.6-travel*.55)+chargeTail,side*.008,width+1);
 }
 ctx.globalAlpha=alpha*.92;
 const id=bolt.visualAbility??bolt.ability;
 if(id==='r_icearrow'||id==='r_explosivearrow'||id==='r_homingarrow')drawBowShaft(ctx,id,r,phase,alpha);
 else mark(ctx,art,r*.13,0,r*(.93+Math.sin(phase*2)*.07),Math.sin(phase)*.13,.82);
 ctx.strokeStyle='#fff4dd';ctx.globalAlpha=alpha*.66;
 echoLine(ctx,-r*.3,0,r*(.62+.34*fraction(phase)),0,Math.max(1,r*.12));
 ctx.restore();
 return true;
}

function drawLink(ctx,effect,art,progress,clock,detail){
 const {x,y,x2,y2}=effect,length=Math.hypot(x2-x,y2-y);
 if(length<=1)return;
 const alpha=ctx.globalAlpha,phase=clock*art.pace*8+progress*4;
 ctx.translate(x,y);ctx.rotate(Math.atan2(y2-y,x2-x));
 ctx.strokeStyle=art.color;ctx.lineJoin='round';ctx.lineCap='round';
 ctx.beginPath();ctx.moveTo(0,0);
 const segments=detail==='full'?9:6;
 for(let i=1;i<segments;i++){
  const t=i/segments,shift=Math.sin(i*2.45+phase)*(4+art.facets)*Math.sin(t*Math.PI);
  ctx.lineTo(t*length,shift);
 }
 ctx.lineTo(length,0);ctx.globalAlpha=alpha*.19*(1-progress);ctx.lineWidth=7;ctx.stroke();
 ctx.strokeStyle='#f2e0be';ctx.globalAlpha=alpha*.8*(1-progress);ctx.lineWidth=1.65;ctx.stroke();
 ctx.fillStyle=art.color;ctx.globalAlpha=alpha*.69*(1-progress);ctx.beginPath();
 for(let i=0;i<2;i++){
  const u=fraction(clock*art.pace*1.9+i*.5);
  fleck(ctx,length*u,Math.sin(phase+i)*4,phase*.13,7+art.facets,2.1);
 }
 ctx.fill();
}

function drawDirectional(ctx,effect,art,progress,clock,detail){
 const length=effect.length||effect.r||90,angle=effect.angle??effect.a??0;
 const alpha=ctx.globalAlpha;
 ctx.translate(effect.x,effect.y);ctx.rotate(angle);ctx.lineCap='round';
 const isLine=effect.visual==='thrust'||effect.type==='channel-flame';
 const lanes=detail==='full'?3:2;
 for(let lane=0;lane<lanes;lane++){
  const drift=fraction(clock*art.pace*.9+lane/lanes),swing=(drift-.5)*.8;
  ctx.strokeStyle=lane===0?'#eee3ca':art.color;ctx.globalAlpha=alpha*(1-progress)*(lane===0?.79:.48);
  if(isLine){
   const lateral=(lane-(lanes-1)*.5)*Math.min(13,(effect.width??38)*.17);
   echoLine(ctx,length*drift*.62,lateral,length*(.32+.24*(1-drift)),0,Math.max(2,5-lane));
   mark(ctx,art,length*(.18+.62*drift),lateral,Math.min(16,length*.14),0,.57);
  }else{
   const halfArc=Math.min(Math.PI,Math.abs(effect.halfArc??1.32)),r=length*(.6+lane*.15+progress*.09);
   const start=-halfArc+progress*.44+swing*.25;
   const end=Math.min(halfArc,start+halfArc*(.95+drift*.35)),steps=detail==='full'?11:6;
   ctx.fillStyle=lane===0?'#eee3ca':art.color;
   sweepBrush(ctx,r,start,end,Math.max(3,Math.min(12,length*.075-lane*1.2)),steps);
   const tip=-halfArc+2*halfArc*drift;
   ctx.beginPath();fleck(ctx,Math.cos(tip)*r,Math.sin(tip)*r,tip+.85,Math.min(8,length*.11),2.1);ctx.fill();
  }
 }
 if(!isLine){
  ctx.strokeStyle=art.color;ctx.globalAlpha=alpha*(1-progress)*.63;
  mark(ctx,art,length*.68,0,Math.min(13,length*.15),Math.sin(clock*6)*.17,.62);
 }
}

export function drawSignatureEffect(ctx,effect,clock=0,{detail='full',reducedMotion=false}={}){
 if(effect.friendly===false||effect.hostile)return false;
 const art=artFor(effect);
 if(!art||!Number.isFinite(effect.x)||!Number.isFinite(effect.y))return false;
 const progress=clamp(1-(effect.t??.2)/(effect.max||.2),0,1);
 const motion=clock*(reducedMotion?.36:1);
 ctx.save();
 const alpha=ctx.globalAlpha;
 if(effect.ability==='r_explosivearrow'&&effect.visual==='impact'){
  const {x,y,r}=effect,spread=Math.max(7,r||36),fade=(1-progress)**1.1;
  ctx.strokeStyle='#eba36d';ctx.lineCap='round';
  for(let wave=0;wave<2;wave++){
   const u=Math.max(0,progress-wave*.18),radius=spread*(.16+.83*u);
   ctx.beginPath();
   for(let i=0;i<4;i++){
    const from=i*TAU/4+progress*.4+wave*.2;
    ctx.moveTo(x+Math.cos(from)*radius,y+Math.sin(from)*radius*.74);
    ctx.ellipse(x,y,radius,radius*.74,0,from,from+1.05);
   }
   ctx.globalAlpha=alpha*fade*(wave?.27:.62);ctx.lineWidth=(wave?3:5)*fade+.5;ctx.stroke();
  }
  ctx.strokeStyle='#fff0bc';ctx.globalAlpha=alpha*fade*.95;
  const count=detail==='full'?11:7;
  for(let i=0;i<count;i++){
   const a=i*TAU/count+.17,radius=spread*(.14+progress*(.46+(i%3)*.1));
   echoLine(ctx,x+Math.cos(a)*radius,y+Math.sin(a)*radius*.8,Math.max(3,18*fade),a,2+2*fade);
  }
 }else if(Number.isFinite(effect.x2)&&Number.isFinite(effect.y2))drawLink(ctx,effect,art,progress,motion,detail);
 else if(effect.type==='slash'||effect.visual==='melee'&&effect.type==='channel-whirl'||effect.visual==='thrust'||effect.type==='channel-flame')
  drawDirectional(ctx,effect,art,progress,motion,detail);
 else{
  const {x,y}=effect,reach=clamp(effect.r||30,10,420);
  const local=['cast','charge','release'].includes(effect.visual);
  const rise=local?progress*10:progress*5;
  const size=clamp(reach*(local?.52:.22)*(1.25+.35*Math.sin(progress*Math.PI)),10,52);
  const fade=Math.min(1,(1-progress)*2.4),width=progress*(local?0:reach*.65);
  const spin=motion*art.pace*(local?1.4:.65);
  ctx.lineJoin='round';ctx.lineCap='round';
  ctx.strokeStyle=art.color;ctx.globalAlpha=alpha*fade*.93;
  mark(ctx,art,x,y-rise,size,Math.sin(spin*3)*.23,local?.83:.72);
  const count=detail==='full'?art.facets:Math.min(3,art.facets);
  ctx.fillStyle=art.color;ctx.globalAlpha=alpha*fade*.64;ctx.beginPath();
  for(let i=0;i<count;i++){
   const a=spin+i*TAU/count,travel=fraction(progress+.21*i);
   const r=size*.7+width*(.4+travel*.6),px=x+Math.cos(a)*r,py=y+Math.sin(a)*r*.69-rise;
   fleck(ctx,px,py,a,3+travel*6,1.4+travel*.6);
  }
  ctx.fill();
 }
 ctx.restore();
 return true;
}

export function drawSignatureField(ctx,field,clock=0,{detail='full',reducedMotion=false}={}){
 if(field.friendly===false||field.hostile)return false;
 const art=artFor(field),r=field.r??field.radius;
 if(!art||!(r>0))return false;
 const {x,y}=field,alpha=ctx.globalAlpha,motion=clock*art.pace*(reducedMotion?.32:1);
 const count=detail==='full'?art.facets+3:art.facets;
 const life=Number.isFinite(field.t)?clamp((field.t+(field.remaining||0))*3,.18,1):1;
 ctx.save();ctx.lineCap='round';ctx.lineJoin='round';
 const isRain=field.ability==='r_rain',isStorm=field.ability==='m_meteor',fog=field.damageType==='poison';
 for(let i=0;i<count;i++){
  const t=fraction(motion*.87+i/count),a=i*2.39996+motion*.6;
  const offset=r*(.18+.66*fraction(i*.618));
  const px=x+Math.cos(a)*offset,py=y+Math.sin(a)*offset*.8;
  const lift=(1-t)*(isRain?70:isStorm?48:18);
  ctx.strokeStyle=art.color;ctx.globalAlpha=alpha*life*(.1+.61*Math.sin(t*Math.PI));
  if(isRain||isStorm)echoLine(ctx,px,py-lift,Math.min(35,12+r*.07),isRain?1.93:1.43,isStorm?3:1.7);
  if(fog){
   const grow=r*(.18+t*.16),haze=ctx.createRadialGradient(px,py-lift,0,px,py-lift,grow);
   haze.addColorStop(0,art.color);haze.addColorStop(1,'transparent');
   ctx.fillStyle=haze;ctx.globalAlpha=alpha*life*(1-t)*.18;
   ctx.fillRect(px-grow,py-lift-grow,grow*2,grow*2);
   continue;
  }
  ctx.fillStyle=art.color;ctx.globalAlpha=alpha*life*(.24+.46*Math.sin(t*Math.PI));
  ctx.beginPath();fleck(ctx,px,py-lift, isRain?1.93:isStorm?1.43:a,4+t*6,1.65);ctx.fill();
 }
 ctx.restore();
 return true;
}

