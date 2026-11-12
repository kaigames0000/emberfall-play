import {drawSkillSprite} from './skill-sprites.js?v=125';
import {drawColdBolt} from './cold-signature-vfx.js?v=125';
import {drawSignatureBolt} from './skill-signature-vfx.js?v=135';
import {drawNamedPaintedBolt} from './named-painted-vfx.js?v=126';

const TAU = Math.PI * 2;
const INK = '#201a2c';
const PALETTES = {
 physical:{body:'#e6ae79',light:'#fff0cf',shadow:'#87594f'},
 blood:{body:'#e06c77',light:'#ffc1aa',shadow:'#7d394f'},
 fire:{body:'#f8a052',light:'#ffe6a1',shadow:'#ae4938'},
 cold:{body:'#86d1e6',light:'#e8fbff',shadow:'#416f9f'},
 lightning:{body:'#dfbe77',light:'#fff3bf',shadow:'#6955a8'},
 poison:{body:'#9dce73',light:'#eff8a7',shadow:'#487e52'},
 support:{body:'#80cabb',light:'#fcf2be',shadow:'#497d7e'},
 summon:{body:'#7ec9bb',light:'#def5bd',shadow:'#477f7c'},
 shield:{body:'#7ecbd9',light:'#d9f7ff',shadow:'#416c8d'},
 curse:{body:'#b99be0',light:'#ecd8ff',shadow:'#67477e'},
 warcry:{body:'#e6b36f',light:'#fff2bd',shadow:'#895547'},
 danger:{body:'#f39961',light:'#ffdec1',shadow:'#993f45'},
};
const SUPPORT_ROLES = {summon:'summon','summon-circle':'summon',shield:'shield',ward:'shield',curse:'curse',warcry:'warcry',aura:'support'};
const SUPPORT_SYMBOLS = {
 summon:[0,-1,.76,0,0,1,-.76,0],
 shield:[-.8,-.76,.8,-.76,.64,.27,0,.94,-.64,.27],
 curse:[0,-1,.31,-.33,.86,-.59,.45,.06,.66,.65,0,.36,-.66,.65,-.45,.06,-.86,-.59,-.31,-.33],
 warcry:[-1,.55,-.71,-.32,-.32,-.14,0,-1,.32,-.14,.71,-.32,1,.55,.42,.29,0,.72,-.42,.29],
 support:[0,-.8,.24,-.25,.77,0,.24,.25,0,.8,-.24,.25,-.77,0,-.24,-.25],
};
const IMPACT_ART = {cold:'iceImpact',fire:'fireImpact',lightning:'lightningImpact',poison:'poisonImpact'};
const BOLT_ART = {cold:'coldBolt',fire:'fireBolt',lightning:'lightningBolt',poison:'poisonBolt'};
const RING_ART = {...IMPACT_ART,summon:'summon',shield:'shield',curse:'curse',warcry:'warcry'};
const IMPACT_FLASH = [0,-1,.23,-.26,.78,-.49,.53,-.03,1,.23,.29,.24,.15,.82,-.16,.39,-.81,.61,-.46,.15,-1,-.23,-.23,-.29];
const BEAM_SHAPE = [0,-.07,.23,-.25,.31,-.15,.5,-.49,.52,-.3,.72,-.65,.74,-.45,.88,-.58,1,0,.86,.51,.78,.39,.6,.61,.63,.35,.41,.48,.47,.22,.15,.23,0,.08];
const FLAME_BEAM_CELS = [
 BEAM_SHAPE,
 [0,-.07,.14,-.28,.26,-.16,.43,-.56,.51,-.3,.66,-.49,.78,-.27,.94,-.61,1,0,.88,.46,.71,.32,.58,.65,.53,.36,.32,.52,.35,.23,.12,.28,0,.08],
 [0,-.07,.21,-.23,.34,-.44,.45,-.2,.62,-.56,.67,-.36,.81,-.72,.93,-.34,1,0,.86,.6,.81,.39,.64,.52,.56,.28,.42,.44,.44,.19,.17,.25,0,.08],
 [0,-.07,.17,-.25,.27,-.17,.47,-.47,.51,-.27,.68,-.64,.75,-.38,.91,-.49,1,0,.87,.58,.79,.29,.66,.62,.6,.35,.41,.42,.43,.2,.15,.25,0,.08],
];
const THRUST_SHAPE = [0,-.03,.54,-.22,.62,-.13,.84,-.45,.79,-.22,1,0,.8,.24,.86,.44,.56,.19,.42,.23,0,.05];
const DAMAGE_FAMILIES = ['physical','fire','cold','lightning','poison'];
const PROJECTILE_FORMS = new Set(['arrow','dagger','feather']);
const SPRITE_ELEMENTS = {
 'frost-projectile':'cold','frost-impact':'cold','flame-burst':'fire',
 lightning:'lightning','poison-cloud':'poison',
};
const HOSTILE_FORMS = {
 physical:{color:'#e3a083',points:[1.22,0,.2,-.53,-.78,-.57,-1.04,-.04,-.61,.52,.23,.44]},
 fire:{color:'#eca17a',points:[1.34,0,.39,-.48,-.71,-.63,-.46,-.19,-1.04,.07,-.44,.24,-.56,.55,.49,.39]},
 cold:{color:'#b6c9d5',points:[1.29,-.04,.04,-.69,-.89,-.32,-.69,.32,.05,.55]},
 lightning:{color:'#e1bd88',points:[1.25,-.34,.38,-.63,.19,-.2,-.99,-.23,-.64,.08,-.92,.51,.44,.17,.14,.61]},
 poison:{color:'#bbc18b',points:[1.2,0,.36,-.58,-.33,-.66,-.88,-.28,-.87,.26,-.28,.58,.39,.45]},
};
const SLASH_TONES = {
 physical:{body:'#b8b6ad',light:'#eee8dc',shadow:'#91a0ad'},
 blood:{body:'#bf949a',light:'#ecd0cc',shadow:'#936f83'},
};
const TRAILS = {
 hostile:[-3.12,.12,-1.75,-.03,-.57,-.4,.11,.03,-.67,.32,-1.68,.21],
 low:[-2.65,.08,-.57,-.41,.16,.02,-.45,.36],
 full:[-3.65,.12,-.66,-.4,.16,.02,-.48,.36],
 release:[-4.18,.12,-.66,-.4,.16,.02,-.48,.36],
};
const HEADS = {
 physical:[1,0,.04,-.73,-.77,-.55,-.99,.02,-.66,.54,.13,.71],
 blood:[1,0,.26,-.86,-.68,-.65,-.28,-.16,-.98,.15,-.64,.57,.22,.78],
 fire:[1,0,.11,-.89,-.64,-.78,-.36,-.34,-.99,-.14,-.67,.74,.18,.77],
 cold:[1,0,.18,-.9,-.64,-.63,-.97,0,-.6,.68,.21,.84],
 lightning:[1,-.13,.24,-.85,.04,-.44,-.94,-.19,-.32,.14,-.52,.75,.22,.42],
 poison:[1,0,.42,-.72,-.28,-.78,-.92,-.18,-.76,.51,-.08,.9,.55,.51],
 support:[1,0,.09,-.96,-.74,-.62,-.89,0,-.74,.62,.09,.96],
 arrow:[1,0,-.39,-.83,-.23,-.28,-.8,-.28,-.8,.28,-.23,.28,-.39,.83],
 dagger:[1,0,-.49,-.74,-.9,-.33,-.48,.08,-.78,.64,-.24,.51],
 feather:[1,0,-.12,-.84,-.96,-.53,-.58,0,-.96,.52,-.12,.84],
};
const MOTIFS = {
 physical:[.85,0,-.25,-.35,-.75,0,-.22,.35],
 blood:[.94,-.25,-.21,-.37,-.88,.22,-.06,.15,.2,.5],
 fire:[1,-.2,.1,-.48,.23,-.11,-.84,-.19,-.59,.42,.26,.42],
 cold:[1,0,.15,-.39,-.66,-.26,-.88,0,-.66,.26,.15,.39],
 lightning:[1,-.36,.22,-.29,.12,-.53,-.88,.25,-.21,.21,-.02,.5],
 poison:[.83,0,.24,-.39,-.41,-.39,-.78,0,-.38,.42,.27,.42],
 support:[.75,0,0,-.45,-.75,0,0,.45],
 summon:[.91,0,0,-.53,-.91,0,0,.53],
 shield:[.75,-.51,.72,.51,-.64,0,-.35,-.09,.19,0,-.35,.09],
 curse:[.61,-.43,.49,-.04,-.62,.38,-.25,-.08],
 warcry:[1,0,-.76,-.16,-.9,0,-.76,.16],
 danger:[1,0,-.51,-.52,-.51,.52],
};

const fade = progress => 1 - Math.max(0, Math.min(1, Number.isFinite(progress) ? progress : 0));
const detailed = options => options?.detail !== 'low' && options?.reducedMotion !== true;
const moving = options => options?.reducedMotion !== true;
const boltRadius = bolt => Number.isFinite(bolt.r) && bolt.r > 0 ? bolt.r : 4;
const hostileBolt = bolt => bolt.hostile || bolt.friendly === false;

function effectFamily(effect, fallback='physical') {
 if (effect.friendly === false) return 'danger';
 if (Object.hasOwn(SUPPORT_ROLES,effect.visual)) return SUPPORT_ROLES[effect.visual];
 if (Object.hasOwn(SUPPORT_ROLES,effect.sprite)) return SUPPORT_ROLES[effect.sprite];
 const type = effect.visualDamageType ?? effect.damageType;
 if (Object.hasOwn(PALETTES, type) && type !== 'physical') return type;
 const id = effect.visualAbility || effect.ability || effect.basicAttack || effect.id;
 if (effect.bloodSkill || typeof id === 'string' && id.startsWith('b_')) return 'blood';
 if (type === 'physical') return type;
 if (effect.damageTypes) {
  let strongest = 0, family = fallback;
  for (const key of DAMAGE_FAMILIES) {
   const weight = effect.damageTypes[key];
   if (weight > strongest) { strongest = weight; family = key; }
  }
  if (strongest > 0) return family;
 }
 if (Object.hasOwn(SPRITE_ELEMENTS,effect.sprite)) return SPRITE_ELEMENTS[effect.sprite];
 return effect.type === 'frost' ? 'cold' : fallback;
}

function polygon(ctx, vertices, color, outline, width=1) {
 ctx.beginPath();
 ctx.moveTo(vertices[0], vertices[1]);
 for (let i = 2; i < vertices.length; i += 2) ctx.lineTo(vertices[i], vertices[i+1]);
 ctx.closePath();
 ctx.fillStyle = color;
 ctx.fill();
 if (outline) {
  ctx.strokeStyle = outline;
  ctx.lineWidth = width;
  ctx.stroke();
 }
}

function arc(ctx, radius, from, to, color, width) {
 ctx.beginPath();
 ctx.arc(0, 0, radius, from, to);
 ctx.strokeStyle = color;
 ctx.lineWidth = width;
 ctx.stroke();
}

function line(ctx, x, y, x2, y2, color, width) {
 ctx.beginPath();
 ctx.moveTo(x, y);
 ctx.lineTo(x2, y2);
 ctx.strokeStyle = color;
 ctx.lineWidth = width;
 ctx.stroke();
}

function paintMotifs(ctx, family, radius, size, count, angle, step, color) {
 const vertices = MOTIFS[family];
 if (!count || !size) return;
 ctx.beginPath();
 for (let n = 0; n < count; n++) {
  const phase = angle + step * n, cos = Math.cos(phase), sin = Math.sin(phase);
  const reach = radius * (.62 + (n%3)*.18);
  for (let i = 0; i < vertices.length; i += 2) {
   const forward = reach + size * vertices[i], side = size * vertices[i+1];
   const x = forward * cos - side * sin, y = forward * sin + side * cos;
   if (i) ctx.lineTo(x,y); else ctx.moveTo(x,y);
  }
  ctx.closePath();
 }
 ctx.fillStyle = color;
 ctx.fill();
}

function supportSymbol(ctx, family, radius, paint) {
 if (!Object.hasOwn(SUPPORT_SYMBOLS,family)) return;
 const size = Math.min(23,radius*.34);
 ctx.save();
 ctx.scale(size,size);
 polygon(ctx,SUPPORT_SYMBOLS[family],paint.shadow,paint.body,.11);
 if (family === 'summon') line(ctx,0,-.58,0,.58,paint.body,.14);
 else if (family === 'shield') {
  ctx.beginPath();
  ctx.moveTo(-.43,-.2);
  ctx.lineTo(0,.32);
  ctx.lineTo(.43,-.2);
  ctx.strokeStyle=paint.light;
  ctx.lineWidth=.11;
  ctx.stroke();
 }
 ctx.restore();
}

function impactFlash(ctx, size, paint) {
 ctx.save();
 ctx.scale(size,size);
 polygon(ctx,IMPACT_FLASH,paint.shadow,paint.body,.085);
 ctx.scale(.51,.51);
 polygon(ctx,IMPACT_FLASH,paint.light);
 ctx.restore();
}

// Culling includes the longest trail and the elemental projectile cels.
export const projectilePaintMargin = bolt => boltRadius(bolt) * (hostileBolt(bolt) ? 3.35 : 4.65) + 2;

function boltShape(bolt, family) {
 if (PROJECTILE_FORMS.has(bolt.visual)) return bolt.visual;
 if (bolt.visual === 'orb' || bolt.visual === 'bolt') return family;
 const id = bolt.visualAbility ?? bolt.ability ?? bolt.basicAttack;
 if (id === 'a_basic_daggers') return 'dagger';
 if (id === 'r_eagle') return 'feather';
 const arrow = id === 'r_snipe' || bolt.cls === 'ranger' || (!id && bolt.tag === 'attack');
 return arrow ? 'arrow' : family;
}

export function drawAnimeBolt(ctx, bolt, options) {
 const radius = boltRadius(bolt), hostile = hostileBolt(bolt), high = detailed(options);
 const clock = options?.clock??0;
 if(!hostile&&(drawNamedPaintedBolt(ctx,bolt,clock,options)||drawColdBolt(ctx,bolt,clock,options)||drawSignatureBolt(ctx,bolt,clock,options)))return;
 const phase = moving(options)&&clock>0 ? (clock*8+(bolt.x+bolt.y)*.007)%1 : 0;
 ctx.save();
 ctx.translate(bolt.x,bolt.y);
 ctx.rotate(Math.atan2(bolt.vy||0,bolt.vx||0));
 ctx.scale(radius,radius);
 const alpha = ctx.globalAlpha;
 let trailLight='#ffdec1';
 if (hostile) {
  const type=bolt.visualDamageType??bolt.damageType;
  const form=Object.hasOwn(HOSTILE_FORMS,type)?HOSTILE_FORMS[type]:HOSTILE_FORMS.fire;
  ctx.globalAlpha=alpha*(high ? .67 : .56);
  ctx.save();
  ctx.scale(1+phase*.055,1-phase*.16);
  polygon(ctx,TRAILS.hostile,'#a24f57');
  ctx.restore();
  ctx.globalAlpha=alpha*.93;
  polygon(ctx,form.points,form.color,'#673843',.16);
  ctx.globalAlpha=alpha*.89;
  line(ctx,-.51,.1,.8,-.07,'#ffdec1',.2);
 } else {
  const family = effectFamily(bolt), paint = PALETTES[family], shape = boltShape(bolt,family);
  trailLight=paint.light;
  ctx.globalAlpha = alpha * (high ? .49 : .36);
  const trail = high ? (bolt.visual==='release' ? TRAILS.release : TRAILS.full) : TRAILS.low;
  ctx.save();
  ctx.scale(1+phase*.055,1-phase*.22);
  polygon(ctx,trail,paint.shadow);
  ctx.restore();
  ctx.globalAlpha = alpha*.92;
  const painted = high && BOLT_ART[shape] && drawSkillSprite(ctx,BOLT_ART[shape],-1.12,0,6.3,2.57,
   {clock:clock+Math.abs(bolt.x+bolt.y)*.003,opacity:.98,reducedMotion:options?.reducedMotion});
  if(!painted){
   polygon(ctx,HEADS[shape]??HEADS.support,paint.body,INK,.14);
   line(ctx,-.48,.13,.74,-.06,paint.light,.19);
  }
  if (high && shape === 'arrow') line(ctx,-2.35,0,-.57,0,paint.body,.13);
 }
 if(phase>0){
  const tail=-.9-1.9*phase,side=(hostile?-.21:.24)*(1+phase);
  ctx.globalAlpha=alpha*(high?.6:.46)*Math.sin(Math.PI*phase);
  line(ctx,tail,side,tail+.57,side*.62,trailLight,.14);
 }
 ctx.restore();
}

function slashRibbon(ctx,r,start,end,width,steps,color){
 ctx.beginPath();
 ctx.arc(0,0,r,start,end);
 for(let i=steps-1;i>0;i--){
  const t=i/steps,angle=start+(end-start)*t;
  const inset=r-width*Math.sin(t*Math.PI)*(.68+.32*t);
  ctx.lineTo(Math.cos(angle)*inset,Math.sin(angle)*inset);
 }
 ctx.closePath();
 ctx.fillStyle=color;
 ctx.fill();
}

export function drawAnimeSlash(ctx, effect, opacity=1, options) {
 const { x, y, r } = effect;
 const halfArc = Math.min(Math.PI, Math.abs(effect.halfArc??1.25));
 if (!(r>0 && halfArc>0 && opacity>0)) return;
 const family=effectFamily(effect),paint=SLASH_TONES[family]??PALETTES[family],high=detailed(options);
 const band=Math.min(17,r*.18,r*halfArc*.51),steps=high?11:7;
 const paintedArc=family==='physical'&&halfArc>=.65&&halfArc<=1.85;
 const progress=1-opacity;
 const sweep=paintedArc&&moving(options)?(Math.min(1,1.5*progress)-.45)*Math.min(.42,halfArc*.27):0;
 ctx.save();
 ctx.translate(x,y);
 ctx.rotate((effect.angle??effect.a??0)+sweep);
 const alpha=ctx.globalAlpha*Math.min(1,opacity);
 ctx.globalAlpha=alpha;
 const painted=paintedArc&&drawSkillSprite(ctx,'slash',r*.045,0,r*1.92,r*1.72*Math.min(1,halfArc/1.3),
  {progress,opacity:.71,reducedMotion:options?.reducedMotion});
 if(!painted){
  ctx.globalAlpha=alpha*.26;
  slashRibbon(ctx,r,-halfArc,halfArc,band,steps,paint.body);
  ctx.globalAlpha=alpha*.32;
  slashRibbon(ctx,r-band*.13,-halfArc*.83,halfArc*.9,band*.39,steps,paint.light);
 }
 const head=moving(options)?-.54+Math.min(1,progress*1.65)*1.36:.74;
 ctx.globalAlpha=alpha*(painted?.42:.58);
 arc(ctx,r-band*.13,Math.max(-1,head-.65)*halfArc,head*halfArc,paint.light,Math.min(1.55,band*.16));
 if (high&&!painted) {
  ctx.globalAlpha=alpha*.27;
  arc(ctx,r-band*.92,-halfArc*.86,halfArc*.21,paint.shadow,Math.min(1.35,band*.14));
 }
 ctx.restore();
}

export function drawAnimeCast(ctx,effect,progress,options) {
 const life=fade(progress),size=Math.min(effect.visual==='charge'?18:23,effect.r||12);
 const paint=PALETTES[effectFamily(effect)];
 const release=effect.visual==='release',charge=effect.visual==='charge';
 const animate=moving(options);
 const spread=animate?charge?1-.42*progress:.48+.52*Math.min(1,progress*2.4):.68;
 ctx.save();
 ctx.translate(effect.x,effect.y);
 ctx.rotate(effect.angle??0);
 if(animate&&release)ctx.translate(progress*size*.9,0);
 ctx.scale(size*spread,size*(release?.48:.7));
 const alpha=ctx.globalAlpha*life;
 ctx.globalAlpha=alpha*.54;
 polygon(ctx,[-.67,.18,.2,-.45,1.15,-.07,.4,.3,-.22,.36],paint.shadow);
 ctx.globalAlpha=alpha*.8;
 polygon(ctx,[-.34,.09,.25,-.22,.93,-.07,.26,.14],paint.light);
 if(animate){
  const fleck=charge?.85-progress*1.24:.22+progress*.8;
  ctx.globalAlpha=alpha*.57;
  line(ctx,fleck,-.42,fleck+.26,-.27,paint.body,.07);
  if(detailed(options))line(ctx,fleck-.2,.38,fleck+.02,.27,paint.light,.065);
 }
 ctx.restore();
}

export function drawAnimeBurst(ctx, effect, progress, spokes=6, options) {
 if (spokes && typeof spokes === 'object') { options=spokes;spokes=6; }
 const { x, y, r } = effect, life = fade(progress);
 if (!(r>0 && life>0)) return;
 const high = detailed(options), family = effectFamily(effect), paint = PALETTES[family];
 const radius = r * (moving(options) ? .51 + .4 * (1-life*life) : .77);
 const count = Math.max(0,Math.min(high?6:3,Math.floor(spokes)));
 ctx.save();
 ctx.translate(x,y);
 const alpha = ctx.globalAlpha * life;
 ctx.globalAlpha = alpha;
 const sprite = IMPACT_ART[family];
 const painted = !!sprite && r>=28 && drawSkillSprite(ctx,sprite,0,0,r*2.03,r*1.74,
  {progress,opacity:.86,reducedMotion:options?.reducedMotion});
 if(!painted){
  const flash=Math.min(18,radius*.4)*(moving(options)?1-.49*progress:1);
  impactFlash(ctx,flash,paint);
 }
 if(!painted||moving(options)&&progress>.09){
  ctx.globalAlpha = alpha*(painted ? .57 : .88);
  paintMotifs(ctx,family,radius*.93,Math.min(13,r*.24)*(1-.43*progress),count,
   -Math.PI/4+(moving(options)?progress*.68:0),TAU/Math.max(1,count),paint.body);
 }
 ctx.restore();
}

export function drawAnimeRing(ctx, effect, progress, options) {
 const { x, y, r } = effect, life = fade(progress);
 if (!(r>0 && life>0)) return;
 const high = detailed(options), animate = moving(options);
 const family = effectFamily(effect), paint = PALETTES[family];
 const radius = r*(animate ? .45+(1-life)*.46 : .68);
 const phase = animate ? (1-life)*.9 : 0;
 ctx.save();
 ctx.translate(x,y);
 const alpha = ctx.globalAlpha*life;
 ctx.globalAlpha = alpha;
 const spriteDrawn = (high||animate) && drawSkillSprite(ctx,RING_ART[family],0,0,Math.min(178,r*1.52),Math.min(150,r*1.28),
  {progress,opacity:high?.76:.64,reducedMotion:options?.reducedMotion});
 if (!spriteDrawn) supportSymbol(ctx,family,radius*(animate?1-.45*progress:1),paint);
 const count = family==='warcry' ? (high?6:4) : high ? 5 : 2;
 const size = Math.min(12,r*.13)*(animate?1-.44*progress:1);
 const motifRadius = Math.min(radius,92);
 ctx.globalAlpha=alpha*(spriteDrawn?.58:.85);
 paintMotifs(ctx,family,motifRadius,size,count,phase-Math.PI/2,TAU/count,paint.body);
 ctx.restore();
}

export function drawAnimeLightning(ctx, effect, progress, clock=0, options) {
 const { x, y, x2, y2 } = effect;
 const length = Math.hypot(x2-x,y2-y), life = fade(progress);
 if (!(length>0 && life>0)) return;
 const travel = effect.visual === 'travel', high = detailed(options);
 const family = effectFamily(effect,travel?'physical':'lightning'), paint = PALETTES[family];
 ctx.save();
 ctx.translate(x,y);
 ctx.rotate(Math.atan2(y2-y,x2-x));
 ctx.globalAlpha *= life;
 if (travel) {
  const width = Math.min(11,Math.max(3,(effect.width??10)*.43));
  const start=moving(options)?length*Math.min(.56,progress*.72):0;
  const alpha=ctx.globalAlpha;
  ctx.globalAlpha=alpha*.55;
  polygon(ctx,[start,0,length*.59,-width*.45,length*.86,-width*.24,length,0,length*.81,width*.48,length*.54,width*.38],paint.shadow);
  ctx.globalAlpha=alpha*.78;
  line(ctx,start,0,length,0,paint.body,Math.max(1.25,width*.26));
  if (high) line(ctx,length*.7,-width*.08,length,0,paint.light,1.15);
 } else {
  const jagged = family === 'lightning' || (family === 'danger' && (effect.visualDamageType??effect.damageType)==='lightning');
  const steps = jagged ? (high?6:4) : 2;
  const amplitude = jagged ? Math.min(9,length*.085) : Math.min(2.4,length*.035);
  const phase = moving(options) ? Math.floor(clock*14)*.79 : 0;
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(0,0);
  for (let i = 1; i < steps; i++) {
   const offset = amplitude * (i%2 ? -1 : 1) * (.57 + .34*Math.sin(i*2.4+phase));
   ctx.lineTo(length*i/steps,offset);
  }
  ctx.lineTo(length,0);
  ctx.strokeStyle = INK;
  ctx.lineWidth = 5;
  ctx.stroke();
  ctx.strokeStyle = paint.body;
  ctx.lineWidth = 3.2;
  ctx.stroke();
  if (high) {
   ctx.strokeStyle = paint.light;
   ctx.lineWidth = 1.15;
   ctx.stroke();
   if(family==='lightning')drawSkillSprite(ctx,'lightningImpact',length,0,33,28,
    {progress,opacity:.61,reducedMotion:options?.reducedMotion});
  }
 }
 ctx.restore();
}

export function drawAnimeChannelBeam(ctx, effect, progress, clock=0, options) {
 const { x, y, length, width } = effect;
 const life = Math.min(1,fade(progress)*2.5);
 if (!(length>0 && width>0 && life>0)) return;
 const family = effectFamily(effect,effect.color==='#9cd8e9'?'cold':'fire'), paint = PALETTES[family];
 const thrust = effect.visual === 'thrust';
 const sprite = thrust && family!=='danger' ? 'thrust' : family==='cold' ? 'beam' : null;
 ctx.save();
 ctx.translate(x,y);
 ctx.rotate(effect.a??effect.angle??0);
 const alpha = ctx.globalAlpha*life;
 ctx.globalAlpha=alpha;
 const painted=sprite&&drawSkillSprite(ctx,sprite,0,0,length,width,
  {progress,clock,blend:detailed(options)&&!thrust,reducedMotion:options?.reducedMotion});
 if(!painted){
  ctx.save();
  ctx.scale(length,width*.5);
  const shape=thrust?THRUST_SHAPE:
   family==='fire'&&moving(options)?FLAME_BEAM_CELS[Math.floor(clock*13)%FLAME_BEAM_CELS.length]:BEAM_SHAPE;
  ctx.globalAlpha=alpha*.36;
  polygon(ctx,shape,paint.shadow);
  ctx.scale(1,.68);
  ctx.globalAlpha=alpha*.84;
  polygon(ctx,shape,paint.body);
  ctx.scale(1,.23);
  ctx.globalAlpha=alpha*.9;
  polygon(ctx,shape,paint.light);
  ctx.restore();
 }
 if(moving(options)&&(!thrust||!painted)){
  const count=detailed(options)?4:2;
  ctx.globalAlpha=alpha*.68;
  ctx.strokeStyle=paint.light;
  ctx.lineWidth=1.5;
  ctx.beginPath();
  for(let i=0;i<count;i++){
   const phase=(thrust?progress:(clock*2.9+i/count)%1);
   const start=length*(.09+phase*.8),y=(i%2?1:-1)*width*(.13+Math.sin(phase*Math.PI)*.2);
   ctx.moveTo(start,y);
   ctx.lineTo(start+length*.052,y*.76);
   ctx.lineTo(start+length*.071,y*.69);
  }
  ctx.stroke();
 }
 ctx.restore();
}

export function drawAnimeChannelWhirl(ctx, effect, progress, clock=0, options) {
 const { x, y, r } = effect;
 const life = Math.min(1,fade(progress)*2.5);
 if (!(r>0 && life>0)) return;
 const family=effectFamily(effect),paint=PALETTES[family],high=detailed(options);
 const phase = moving(options) ? clock*7 : .4;
 const width = Math.min(5,Math.max(1.8,r*.035));
 ctx.save();
 ctx.translate(x,y);
 ctx.rotate(phase);
 ctx.globalAlpha*=life;
 const painted=family==='physical'&&drawSkillSprite(ctx,'whirl',r*.06,0,r*1.92,r*1.62,
  {clock,opacity:.82,blend:high,reducedMotion:options?.reducedMotion});
 if(!painted){
  arc(ctx,r-width,-.91,1.18,paint.body,width);
  arc(ctx,r-width,-.51,.86,paint.light,Math.min(2.2,width*.48));
 }
 if(high){
  ctx.globalAlpha*=.64;
  paintMotifs(ctx,family,r*.68,Math.min(11,r*.08),4,1.5,.43,paint.body);
 }
 ctx.restore();
}

