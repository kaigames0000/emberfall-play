export const ELEMENTS=['fire','cold','lightning','poison'];
export const HERO_RESISTANCE_PENALTY={1:0,2:.20,3:.40};
export const MAX_BURN_STACKS=8;
export const MAX_AILMENT_DURATION=6;

const FAMILY_RESISTANCE={
 melee:{},shield:{cold:.1},elite:{fire:.05,cold:.05,lightning:.05,poison:.05},
 summoner:{poison:.16,fire:-.05},skeleton:{poison:.2,fire:-.12},
 skirmisher:{lightning:.08,cold:-.08},bomber:{fire:.26,cold:-.1},
 wraith:{cold:.22,lightning:-.08},caster:{fire:.2,lightning:-.08},
 archer:{poison:.1},charger:{lightning:.12,cold:-.05}
};
const VARIANT_RESISTANCE={
 salt:{poison:.24,fire:-.12},pools:{poison:.34,fire:-.12},
 rod:{lightning:.3,cold:-.1},icearrow:{cold:.22,fire:-.1},
 crystal:{cold:.35,fire:-.15},spear:{lightning:.28,cold:-.1},
 star:{lightning:.32,poison:-.08},mirror:{cold:.2,lightning:-.12}
};
const BOSS_AFFINITIES={
 fire:{fire:.20,cold:.1,lightning:.1,poison:.1},
 cold:{fire:-.05,cold:.26,lightning:.1,poison:.1},
 lightning:{fire:.1,cold:.1,lightning:.26,poison:-.05},
 poison:{fire:-.05,cold:.1,lightning:.1,poison:.26},
 physical:{fire:.1,cold:.1,lightning:.1,poison:.1}
};
const ELITE_ELEMENT={ember:'fire',frost:'cold',storm:'lightning',wind:'poison'};

export function setEnemyDefense(enemy,difficulty,affinity){
 const boss=enemy.type==='boss'||enemy.type==='miniboss';
 const base=boss?(BOSS_AFFINITIES[affinity]||BOSS_AFFINITIES.physical):(VARIANT_RESISTANCE[enemy.variant]||FAMILY_RESISTANCE[enemy.type]||{});
 enemy.resistances=Object.fromEntries(ELEMENTS.map(type=>{
  const amount=base[type]||0;
  const bonus=amount>0?(difficulty-1)*(boss ? .14 : .07):0;
  return [type,Math.min(.65,amount+bonus)];
 }));
 enemy.immunities=[];
 enemy.statusImmunities=[];
 if(difficulty>=2&&(enemy.type==='wraith'||affinity==='cold'&&boss))enemy.statusImmunities.push('freeze');
 if(difficulty>=2&&affinity==='lightning'&&boss)enemy.statusImmunities.push('shock');
 if(difficulty===3&&enemy.variant==='pools'&&!boss)enemy.immunities.push('poison');
 return enemy;
}

export function strengthenEliteDefense(enemy,difficulty){
 const element=ELITE_ELEMENT[enemy.elite?.key];
 if(!element)return;
 enemy.resistances[element]=Math.max(enemy.resistances[element]||0,[0,.2,.38,.55][difficulty]||.2);
 if(difficulty>=2&&element==='cold'&&!enemy.statusImmunities.includes('freeze'))enemy.statusImmunities.push('freeze');
 if(difficulty>=2&&element==='lightning'&&!enemy.statusImmunities.includes('shock'))enemy.statusImmunities.push('shock');
 if(difficulty===3&&!enemy.immunities.length)enemy.immunities.push(element);
}

export function immuneToStatus(enemy,status){
 const element=status==='freeze'?'cold':status==='shock'?'lightning':null;
 return !!(enemy.statusImmunities?.includes(status)||element&&enemy.immunities?.includes(element));
}

function syncShock(enemy,layers){
 enemy.shock=0;
 enemy.shockCritTaken=0;
 enemy.shockCritDamage=0;
 for(const layer of layers){
  enemy.shock=Math.max(enemy.shock,layer.time);
  enemy.shockCritTaken=Math.max(enemy.shockCritTaken,layer.critTaken);
  enemy.shockCritDamage=Math.max(enemy.shockCritDamage,layer.critDamage);
 }
}

export function applyShock(enemy,time,critTaken=.1,critDamage=.2){
 if(!(time>0)||immuneToStatus(enemy,'shock'))return;
 critTaken=Math.max(0,Math.min(.15,critTaken));
 critDamage=Math.max(0,Math.min(.3,critDamage));
 const layers=enemy.shockLayers??=[];
 // Skills and equipment procs have fixed strengths. Only identical strengths refresh one another.
 const old=layers.find(layer=>layer.critTaken===critTaken&&layer.critDamage===critDamage);
 if(old)old.time=Math.max(old.time,time);
 else layers.push({time,critTaken,critDamage});
 syncShock(enemy,layers);
}

export function advanceShock(enemy,dt){
 if(enemy.shockLayers){
  const layers=enemy.shockLayers.filter(layer=>(layer.time-=dt)>1e-8);
  syncShock(enemy,layers);
  if(layers.length)enemy.shockLayers=layers;
  else delete enemy.shockLayers;
 }else{
  enemy.shock=Math.max(0,(enemy.shock||0)-dt);
  if(!enemy.shock){enemy.shockCritTaken=0;enemy.shockCritDamage=0;}
 }
}
