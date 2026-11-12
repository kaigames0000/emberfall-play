// Class identity grants equipment permission; skill points improve its mechanics.
const melee=new Set(['sword','axe','dagger','greatsword','greataxe']);
const shortMelee=new Set(['sword','axe','dagger']);
const heavyMelee=new Set(['greatsword','greataxe']);
const spells=new Set(['wand','staff']);
export function classWeaponAllowed(c,item){return c.cls!=='berserker'||!['weapon','offhand'].includes(item?.slot)||item.slot==='weapon'&&melee.has(item.weaponType);}
export function legalDualPair(c,main,off){
 if(main?.slot!=='weapon'||off?.slot!=='weapon')return false;
 const a=main.weaponType,b=off.weaponType;
 if(c.cls==='wanderer'){
  const ring=c.ring??{};
  if(heavyMelee.has(a)&&heavyMelee.has(b))return ring['x:greatdual']===1;
  if(a==='staff'&&b==='staff')return ring['x:staffdual']===1;
  if(a==='wand'&&b==='wand')return ring['x:wanddual']===1;
  if(shortMelee.has(a)&&shortMelee.has(b))return ring['x:dual']===1;
  return ring['x:mixed']===1&&(a==='wand'&&shortMelee.has(b)||b==='wand'&&shortMelee.has(a));
 }
 if(c.cls==='assassin')return a==='dagger'&&b==='dagger';
 return c.cls==='berserker'&&melee.has(a)&&melee.has(b);
}
export function dualState(c){
 const main=c.equipment?.weapon,off=c.equipment?.offhand,dual=legalDualPair(c,main,off),titan=dual&&[main.weaponType,off.weaponType].some(type=>['greatsword','greataxe'].includes(type));
 const spellDual=dual&&[main.weaponType,off.weaponType].some(type=>spells.has(type));
 const heavySpell=spellDual&&main.weaponType==='staff',heavy=titan||heavySpell;
 const daggers=dual&&(c.cls==='assassin'||c.cls==='wanderer'&&main.weaponType==='dagger'&&off.weaponType==='dagger');
 const mode=dual?(heavySpell?'dual-staff':spellDual?'dual-spell':titan?'dual-titan':daggers?'dual-daggers':'dual-onehand'):['greatsword','greataxe','staff'].includes(main?.weaponType)?'single-twohand':'single-onehand';
 return {mode,dual,titan,spellDual,
  whiteScale:heavy?.8:1,affixScale:heavy?.65:1,offhandAffixScale:heavy?.65:.7,damageScale:heavy?.9:1,hasteBonus:dual&&!spellDual?(titan?.12:.15):0,
  castBonus:spellDual?(heavySpell?0:.1):0,moveScale:heavy?.92:1,lifeScale:titan?1.15:1,socketLimitPerWeapon:heavy?2:Infinity,weaponDamageBonus:dual&&!spellDual?.08:0};
}
export const STANCE_NAMES={'single-onehand':'單手持握','single-twohand':'雙手重握','dual-onehand':'雙持連斬','dual-daggers':'雙匕追影','dual-titan':'泰坦雙持','dual-spell':'術器並用','dual-staff':'雙長杖'};
export function stanceSkillInfo(c,id){
 const s=dualState(c),row={
 b_cleave:{'single-onehand':'命中獲得短暫血盾；格擋後下一斬反擊。','single-twohand':'擴大斬擊範圍，外圍震波只命中未受主斬的敵人。','dual-onehand':'主副手交替連斬；三次施放後強化下一次重擊。','dual-titan':'雙劍交叉斬；三次施放後的重擊附帶震地。'},
 b_flurry:{'single-onehand':'快速定向連斬，命中逐步維持小型血盾。','single-twohand':'降低出手頻率，擴大範圍並提高單次傷害。','dual-onehand':'更快交替兩手攻擊，生命按持續時間支付。','dual-titan':'重型交叉斬，較寬範圍並支付額外生命。'},
 b_execute:{'single-onehand':'單點處決；消耗血盾強化此擊。','single-twohand':'遠距離處決震波。','dual-onehand':'雙手分段處決；連斬節奏完成時消耗節奏強化。','dual-titan':'十字處決；完整節奏追加一次有限震地。'},
 b_leap:{'single-onehand':'落地獲得血盾。','single-twohand':'落地產生大範圍重擊。','dual-onehand':'落地雙斬，建立一層連斬節奏。','dual-titan':'落地交叉震擊，範圍擴大。'}
 }[id];
 return row?{mode:s.mode,name:STANCE_NAMES[s.mode],text:row[s.mode]||row['single-onehand']}:null;
}
