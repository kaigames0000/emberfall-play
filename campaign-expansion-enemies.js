const COLORS = {
  physical:'#d9ba76',fire:'#db8057',cold:'#8ed6e5',lightning:'#bfa3ed',poison:'#a2b95a',
};

export const EXPANDED_ENEMIES = {
  1:[
    {key:'cinder-lancer',type:'charger',name:'斷廊戟衛',element:'physical',pattern:'aisle-thrust',range:94,cooldown:2.7},
    {key:'cinder-acolyte',type:'bomber',name:'拋燼侍僧',element:'fire',pattern:'cinder-pool',range:220,cooldown:3.6},
    {key:'cinder-crossbow',type:'archer',name:'焦羽弩手',element:'fire',pattern:'cinder-fork',range:250,cooldown:2.9},
    {key:'cinder-shield',type:'shield',name:'灰誓熔盾',element:'fire',pattern:'ember-wall',range:82,cooldown:3.3},
  ],
  2:[
    {key:'breakwater-crossbow',type:'archer',name:'破浪弩兵',element:'physical',pattern:'broadside',range:260,cooldown:3.1},
    {key:'backwash-hook',type:'charger',name:'淤泥拖鉤手',element:'cold',pattern:'backwash',range:101,cooldown:3.4},
    {key:'foam-weaver',type:'caster',name:'潮沫織術師',element:'cold',pattern:'foam-pools',range:235,cooldown:3.7},
    {key:'mooring-shield',type:'shield',name:'泊鐵鎮衛',element:'physical',pattern:'anchor-slam',range:73,cooldown:2.8},
  ],
  3:[
    {key:'rift-scout',type:'skirmisher',name:'裂步斥候',element:'lightning',pattern:'rift-step',range:142,cooldown:3.3},
    {key:'dusk-sniper',type:'archer',name:'黯星狙手',element:'lightning',pattern:'star-fan',range:275,cooldown:3.2},
    {key:'rift-crystallizer',type:'caster',name:'隙晶封術師',element:'cold',pattern:'crystal-cross',range:245,cooldown:3.6},
    {key:'orbit-adept',type:'summoner',name:'失軌司儀',element:'lightning',pattern:'orbit-fork',range:220,cooldown:3.7},
  ],
};

const minibosses = [
  {key:'ash-breaker',chapter:1,name:'熔痕斷戒者',element:'fire',pattern:'altar-break',hpMultiplier:6.2,speed:66,range:115,cooldown:3.3,
    trait:'火焰 · 燼線／扇射',desc:'依序引爆前方燼線，間歇扇射火矢；從線路兩側繞過。'},
  {key:'ash-censer',chapter:1,name:'焚香執事',element:'fire',pattern:'censer-sweep',hpMultiplier:5.8,speed:52,range:215,cooldown:3.6,
    trait:'火焰 · 焚香／餘燼',desc:'在點名位置留下一團餘燼，再封鎖一側退路；輪替移動避免踩進舊火。'},
  {key:'ash-warden',chapter:1,name:'封龕詠守',element:'physical',pattern:'seal-guard',hpMultiplier:6.5,speed:59,range:120,cooldown:3.1,
    trait:'物理 · 封龕／僕從',desc:'交替以近身重擊和兩翼震盪逼退敵人；半血時召出一次護衛。',reinforcement:'skeleton'},
  {key:'tide-artillerist',chapter:2,name:'斷桅弩長',element:'physical',pattern:'deck-broadside',hpMultiplier:6.0,speed:58,range:255,cooldown:3.3,
    trait:'物理 · 排箭／落錨',desc:'射出成列的弩矢，間歇以落錨牽制移動；可從弩矢的射線之間穿過。'},
  {key:'tide-lockmaster',chapter:2,name:'漲潮掌閘者',element:'cold',pattern:'sluice-squeeze',hpMultiplier:6.5,speed:47,range:205,cooldown:3.7,
    trait:'冰冷 · 合潮／退潮',desc:'先讓兩側的潮水合攏，再淹沒中央；留意引爆時差，沿側邊脫離。'},
  {key:'tide-conductor',chapter:2,name:'礁雷引流者',element:'lightning',pattern:'reef-current',hpMultiplier:6.1,speed:65,range:170,cooldown:3.3,
    trait:'閃電 · 礁雷／換向',desc:'雷擊沿著鎖定方向或其直交方向先後落下，半血後延伸至更遠處。'},
  {key:'star-duelist',chapter:3,name:'折界刃將',element:'physical',pattern:'folding-blade',hpMultiplier:6.7,speed:78,range:136,cooldown:3.5,
    trait:'物理 · 折界／雙刃',desc:'在兩翼交替落腳，再預警刃擊；正面突進可避開側翼交鋒。'},
  {key:'star-bowmaster',chapter:3,name:'殘星弦師',element:'lightning',pattern:'broken-orbit',hpMultiplier:6.0,speed:63,range:255,cooldown:3.4,
    trait:'閃電 · 殘星／環射',desc:'每次環射都會換一處缺口，間歇改用星矢扇面；依照地面射線換位。'},
  {key:'star-jailer',chapter:3,name:'空庭鎖星者',element:'cold',pattern:'star-prison',hpMultiplier:6.4,speed:50,range:196,cooldown:3.7,
    trait:'冰冷 · 裂晶／僕從',desc:'裂晶在點名位置留下短暫冰域，再於另一側突起；半血時召出一次護衛。',reinforcement:'skeleton'},
];

export const EXPANDED_MINIBOSSES = Object.fromEntries(minibosses.map(def=>[def.key,{...def,color:COLORS[def.element]}]));
const enemiesByKey = Object.fromEntries(Object.values(EXPANDED_ENEMIES).flat().map(def=>[def.key,def]));

function expandedDefinition(enemy) {
  return EXPANDED_MINIBOSSES[enemy.minibossKey] ?? enemiesByKey[enemy.campaignEnemyKey];
}

export function decorateExpandedEnemy(g,enemy) {
  const def=EXPANDED_ENEMIES[g.chapter||1]?.find(candidate=>candidate.type===enemy.type);
  if(!def)return false;
  Object.assign(enemy,{campaignEnemyKey:def.key,name:def.name,attackElement:def.element});
  if(enemy.type==='shield')enemy.braceActive=false;
  return true;
}

const difficultyOf=g=>Math.max(1,Math.min(3,Number(g.diff)||1));
const fan=(count,gap,tilt=0)=>Array.from({length:count},(_,i)=>tilt+(i-(count-1)/2)*gap);
const TAU=Math.PI*2;

function brokenOrbit(difficulty,phase) {
  const count=7+2*difficulty,tilt=phase*.45;
  return Array.from({length:count},(_,i)=>i*TAU/count)
    .filter(angle=>angle>.72&&angle<TAU-.72)
    .map(angle=>angle+tilt);
}

function projectileAttack(pattern,phase,difficulty) {
  switch(pattern) {
    case 'cinder-fork':return {angles:difficulty===1?[-.14,.14]:fan(3,.19),speed:180,damage:9};
    case 'broadside':return {angles:fan(difficulty===3?5:3,.28),speed:192,damage:13};
    case 'star-fan':return {angles:fan(difficulty===1?3:5,.21,phase%2?.14:-.14),speed:163,damage:8};
    case 'orbit-fork':return {angles:[-.67,-.35,.35,.67].map(angle=>angle+(phase%2?.16:-.16)),speed:143,damage:8};
    case 'altar-break':return phase%2?{angles:fan(3+2*(difficulty-1),.22),speed:166,damage:16}:null;
    case 'deck-broadside':return phase%3!==1?{angles:fan(3+2*difficulty,phase%3===0?.19:.3),speed:181,damage:19}:null;
    case 'broken-orbit':return phase%3===2
      ? {angles:fan(3+2*difficulty,.18),speed:169,damage:16}
      : {angles:brokenOrbit(difficulty,phase),speed:145,damage:14};
    default:return null;
  }
}

// Uses the same phase and projectile offsets as release, with the angle locked by EnemyCombat.
export function expandedEnemyIntent(g,enemy,angle) {
  const def=expandedDefinition(enemy);
  if(!def)return null;
  const shot=projectileAttack(def.pattern,enemy.phase||0,difficultyOf(g));
  if(!shot)return null;
  return {campaignPattern:true,shape:'lane',range:shot.speed*3,color:COLORS[def.element],rayAngles:shot.angles.map(offset=>angle+offset)};
}

function offsetPoint(point,angle,forward,side=0) {
  const dx=Math.cos(angle),dy=Math.sin(angle);
  return {x:point.x+dx*forward-dy*side,y:point.y+dy*forward+dx*side};
}

const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);

function warn(g,enemy,def,point,radius,damage,delay,field=null) {
  const warnings=g.hazards;
  let total=0,owned=0,activeFields=0;
  for(const warning of warnings) {
    if(warning.friendly||warning.t<=0)continue;
    total++;
    if(warning.attacker===enemy)owned++;
    if(field&&warning.fieldOnExpire&&expandedDefinition(warning.attacker??{}))activeFields++;
  }
  if(total>=[0,12,16,20][difficultyOf(g)]||owned>=5)return;
  const center=g.clampWorldPoint(point.x,point.y,12);
  if(distance(center,point)>radius*.8)return;
  if(warnings.some(warning=>warning.attacker===enemy&&warning.t>0&&distance(warning,center)<radius*.5))return;

  const count=warnings.length;
  g.hazard(center.x,center.y,radius,damage,delay,def.element,enemy);
  if(!field||warnings.length===count)return;
  for(const active of g.enemyFields??[])if(expandedDefinition(active.attacker??{}))activeFields++;
  if(activeFields<5)warnings.at(-1).fieldOnExpire={...field,damageType:def.element,color:COLORS[def.element]};
}

function reinforce(g,enemy,def,difficulty) {
  if(!def.reinforcement||enemy.campaignReinforced||enemy.hp>enemy.maxHp*.5)return;
  enemy.campaignReinforced=true;
  const count=difficulty===3?3:2;
  for(let i=0;i<count&&g.enemies.length<48;i++) {
    const point=offsetPoint(enemy,enemy.angle||0,48,(i-(count-1)/2)*64);
    const add=g.addEnemy(def.reinforcement,point.x,point.y,true);
    if(add) {
      add.damageScale*=.55;
      add.cd=Math.max(add.cd,1.4+i*.25);
    }
  }
  g.fx(enemy.x,enemy.y,80,COLORS[def.element],'ring',.55);
}

function flank(g,enemy,target,angle,side,reach) {
  const point=offsetPoint(target,angle,-48,side*reach);
  const landing=g.clampWorldPoint(point.x,point.y,18);
  if(distance(landing,point)>48||distance(landing,target)<80||distance(landing,enemy)>410)return;
  const color=COLORS[enemy.attackElement]??COLORS.physical;
  g.fx(enemy.x,enemy.y,34,color,'ring',.45);
  g.placeActor(enemy,landing.x,landing.y);
}

function groundAttack(g,enemy,def,target,origin,angle,phase,difficulty,scale) {
  const circle=(point,radius,base,delay,field)=>warn(g,enemy,def,point,radius,base*scale,delay,field);
  const aimed=(forward,side=0)=>offsetPoint(origin,angle,forward,side);
  const mark=(forward,side=0)=>offsetPoint(target,angle,forward,side);
  const side=phase%2?-1:1,d=distance(origin,target);

  switch(def.pattern) {
    case 'aisle-thrust':
      circle(aimed(Math.min(104,d)),42,15,.9);
      if(difficulty>=2)circle(aimed(Math.min(104,d)+91),39,12,1.22);
      break;
    case 'cinder-pool':
      circle(target,48,10,1.15,{duration:2.25,damage:3*scale});
      break;
    case 'ember-wall':
      circle(aimed(Math.min(105,d)),46,12,.97);
      circle(aimed(Math.min(105,d)+83,phase%2?40:-40),43,10,1.26);
      break;
    case 'backwash':
      circle(mark(0,-61),44,10,.9);
      circle(mark(0,61),44,10,.9);
      if(difficulty>=2||phase%2)circle(target,43,12,1.48);
      break;
    case 'foam-pools':
      circle(target,50,9,1.12,{duration:2.35,damage:2.5*scale,slow:.12});
      break;
    case 'anchor-slam':
      circle(aimed(Math.min(105,d)),61,19,1.08);
      break;
    case 'rift-step':
      flank(g,enemy,target,angle,side,128);
      circle(enemy,48,11,.9);
      circle(mark(-28),42,10,1.32);
      break;
    case 'crystal-cross':
      circle(mark(55,58*side),46,10,1.02);
      circle(mark(-55,-58*side),46,10,1.33);
      if(difficulty===3)circle(target,42,11,1.65);
      break;
    case 'altar-break':{
      const reach=Math.min(d,125);
      for(let i=0;i<3;i++)circle(aimed(reach+i*94),53,18,1.04+i*.3);
      break;
    }
    case 'censer-sweep':
      circle(target,63,16,1.14,{duration:3.25,damage:4*scale});
      circle(mark(-60,92*side),53,15,1.63);
      if(difficulty===3)circle(mark(62,92*side),46,13,1.9);
      break;
    case 'seal-guard':
      if(phase%2) {
        circle(aimed(Math.min(125,d)),73,25,1.15);
      } else {
        circle(mark(0,-85),56,22,1.05);
        circle(mark(0,85),56,22,1.28);
      }
      break;
    case 'deck-broadside':
      circle(target,62,24,1.12);
      circle(mark(-97,77*side),51,18,1.54);
      break;
    case 'sluice-squeeze':
      circle(mark(0,-98),72,16,1.07);
      circle(mark(0,98),72,16,1.27);
      circle(target,60,19,1.72);
      break;
    case 'reef-current':{
      const line=angle+phase%2*Math.PI/2;
      for(let i=0;i<3;i++)circle(offsetPoint(target,line,(i-1)*106),51,17,1.02+i*.27);
      if(enemy.hp<enemy.maxHp*.5)circle(offsetPoint(target,line,212),46,16,1.9);
      break;
    }
    case 'folding-blade':
      flank(g,enemy,target,angle,side,158);
      circle(enemy,71,23,1.04);
      circle(mark(-32,-52*side),61,24,1.45);
      break;
    case 'star-prison':
      circle(target,60,14,1.22,{duration:2.75,damage:3.25*scale,slow:.16});
      circle(mark(78,-78*side),58,16,1.59);
      if(difficulty>=2)circle(mark(-78,78*side),50,15,1.86);
      break;
  }
}

export function updateExpandedEnemy(g,enemy,target,dt) {
  const def=expandedDefinition(enemy);
  if(!def)return false;
  if(enemy.hp<=0)return true;

  const release=enemy.tactics?.releaseOrigin;
  const origin=release??enemy;
  const angle=release?.angle??Math.atan2(target.y-enemy.y,target.x-enemy.x);
  const d=distance(enemy,target),step=enemy.speed*(1-(enemy.auraSlow||0))*dt;
  if(enemy.type==='shield')enemy.braceActive=false;
  if(d>def.range)g.approachActor(enemy,target,step,def.range);
  else if(d<def.range*.65&&def.range>=170)g.moveActor(enemy,-Math.cos(angle)*step,-Math.sin(angle)*step);
  if(enemy.cd>0)return true;

  const phase=enemy.phase||0,difficulty=difficultyOf(g),scale=enemy.damageScale*(1-(enemy.auraWeaken||0));
  enemy.phase=phase+1;
  enemy.cd=def.cooldown;
  reinforce(g,enemy,def,difficulty);

  const shot=projectileAttack(def.pattern,phase,difficulty);
  if(shot) {
    for(const offset of shot.angles)g.shoot(origin.x,origin.y,angle+offset,shot.speed,shot.damage*scale,COLORS[def.element],0,def.hpMultiplier?7:5,true,{damageType:def.element,attacker:enemy});
  } else {
    groundAttack(g,enemy,def,target,origin,angle,phase,difficulty,scale);
  }
  return true;
}
