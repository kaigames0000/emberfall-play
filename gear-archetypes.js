// Implicits are computed at equipment refresh and never occupy random affix slots.
export const ARMOR_WEIGHTS=Object.freeze({
 light:{name:'輕甲',armor:.65,move:.16,attack:.12,cast:.12,dodge:-.2},
 medium:{name:'中甲',armor:1.6,move:0,attack:0,cast:0,dodge:0},
 heavy:{name:'重甲',armor:3.6,move:-.2,attack:-.12,cast:-.14,dodge:.35}
});
export const ARMOR_SHARES=Object.freeze({helm:.2,chest:.4,hands:.2,feet:.2});
export const SHIELDS=Object.freeze({
 shield:{name:'小盾',slot:'offhand',hands:1,kind:'shield',block:.22,blockReduction:.45,armorMult:1,blockCap:.55},
 towerShield:{name:'大盾',slot:'offhand',hands:1,kind:'shield',block:.35,blockReduction:.72,armorMult:2.4,blockCap:.65}
});
export const MELEE_PROFILES=Object.freeze({
 dagger:{interval:.32,range:82,halfArc:.65,maxTargets:2,damageMult:.88,powerMult:.86},
 sword:{interval:.46,range:122,halfArc:1.05,maxTargets:3,damageMult:1,powerMult:1},
 axe:{interval:.56,range:112,halfArc:1.4,maxTargets:4,damageMult:1.18,powerMult:1.14},
 greatsword:{interval:.68,range:172,halfArc:1.45,maxTargets:5,damageMult:1.5,powerMult:1.75},
 greataxe:{interval:.82,range:158,halfArc:1.75,maxTargets:6,damageMult:1.8,powerMult:1.85}
});
export function armorClass(item){return Object.hasOwn(ARMOR_SHARES,item?.slot)?item.armorWeight??'medium':null;}
export function isShield(item){return Object.hasOwn(SHIELDS,item?.weaponType);}
export function supportCompatible(main,off){
 if(!off)return true;
 if(off.slot==='weapon')return false; // Dual weapons have their own learned permission.
 if(off.weaponType==='quiver')return main?.weaponType==='bow';
 if(main?.weaponType==='bow')return false;
 return !['greatsword','greataxe','staff'].includes(main?.weaponType);
}
export function armorMultiplier(item){const weight=armorClass(item);return weight?ARMOR_WEIGHTS[weight]?.armor??1:SHIELDS[item?.weaponType]?.armorMult??1;}
export function implicitModifiers(c){
 const out={move:0,attack:0,cast:0,dodge:0};
 const soften=Object.values(c.equipment??{}).some(i=>i.uniqueID==='mountain_heart')?.65:1;
 for(const item of Object.values(c.equipment??{})){
  const weight=ARMOR_WEIGHTS[armorClass(item)],share=ARMOR_SHARES[item.slot]??0;
  if(weight)for(const key of Object.keys(out))out[key]+=weight[key]*share*((key==='dodge'?weight[key]>0:weight[key]<0)?soften:1);
  if(item.weaponType==='towerShield'){out.move-=.06;out.attack-=.03;out.cast-=.05;out.dodge+=.08;}
 }
 return out;
}
