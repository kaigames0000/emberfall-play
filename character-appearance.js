import {armorClass} from './gear-archetypes.js?v=108';
import {rareGearDesign} from './rare-gear-art.js?v=108';

export const HERO_APPEARANCES=Object.freeze({male:'深髮旅人',female:'銀髮旅人'});
export function validHeroAppearance(gender){
 return gender===undefined||typeof gender==='string'&&Object.hasOwn(HERO_APPEARANCES,gender);
}

const LEGACY_STYLES=new Set(['wayfarer','vanguard','arcanist','nightfall','bloodbound','moon-lantern']);
const LEGACY_KEYS=new Set(['mode','style','showHelmet','showCloak','showOutfit']);
// Older saves may retain a costume selection. Rendering uses worn equipment.
export function validAppearance(value){
 return value===undefined||!!value&&typeof value==='object'&&!Array.isArray(value)&&
  Object.keys(value).every(key=>LEGACY_KEYS.has(key))&&['equipment','cosmetic'].includes(value.mode)&&
  LEGACY_STYLES.has(value.style)&&typeof value.showHelmet==='boolean'&&typeof value.showCloak==='boolean'&&
  (!Object.hasOwn(value,'showOutfit')||typeof value.showOutfit==='boolean');
}

const PALETTES={
 warrior:{body:'#68757d',dark:'#35424c',trim:'#d1c39c',cloth:'#6f4650',hair:'#47344d',hairLight:'#826070'},
 ranger:{body:'#416456',dark:'#223e33',trim:'#b8c8a0',cloth:'#4e7359',hair:'#5f3946',hairLight:'#ae775f'},
 mage:{body:'#625782',dark:'#342f50',trim:'#b5b4e3',cloth:'#7e70a8',hair:'#9e9cc0',hairLight:'#dedbf2'},
 assassin:{body:'#3f4a62',dark:'#252d41',trim:'#b6a2ce',cloth:'#69718e',hair:'#403a5d',hairLight:'#7d72a0'},
 berserker:{body:'#754d45',dark:'#3d2d2d',trim:'#dea77a',cloth:'#9d5750',hair:'#56364b',hairLight:'#a96a61'},
};
const WEAPON_PALETTE={sword:'warrior',greatsword:'warrior',axe:'berserker',greataxe:'berserker',dagger:'assassin',bow:'ranger',wand:'mage',staff:'mage'};
const ARMOR_COLORS={
 light:{body:'#4e6256',dark:'#293e33',cloth:'#6b7f60'},
 medium:{body:'#796d53',dark:'#423e32',cloth:'#9d8760'},
 heavy:{body:'#6e7b80',dark:'#37464e',cloth:'#8c9293'},
};
const RARITY_COLORS=['#c4c7b9','#85b4d9','#d5bd6e','#ba91d4','#d79079','#e5a35e'];
const SLOTS=['weapon','offhand','helm','chest','hands','feet','cloak','charm','ring_left','ring_right'];
const WEAPONS=new Set(['sword','greatsword','dagger','axe','greataxe','wand','staff','bow','shield','towerShield','tome','quiver']);
const cache=new WeakMap();

function equipmentTrim(item,fallback){
 return item?RARITY_COLORS[item.rarity]??fallback:fallback;
}
function weapon(item,trim){
 if(!item||!WEAPONS.has(item.weaponType))return null;
 const design=rareGearDesign(item);
 return {type:item.weaponType,color:design?.palette[1]??(['wand','staff','bow'].includes(item.weaponType)?'#9a7957':'#d5dad5'),trim:design?.palette[2]??trim,gem:design?.palette[3]??equipmentTrim(item,trim),design};
}
function snapshot(hero){
 return [hero.cls,hero.gender,...SLOTS.flatMap(slot=>{
  const item=hero.equipment?.[slot];
  return [item,item?.weaponType,item?.armorWeight,item?.rarity,item?.set,item?.uniqueID,item?.setPiece];
 })];
}

export function resolveAppearance(hero){
 const signature=snapshot(hero),previous=cache.get(hero);
 if(previous&&previous.signature.every((value,index)=>value===signature[index]))return previous.visual;
 const gear=hero.equipment??{};
 const palette=PALETTES[hero.cls]??PALETTES[WEAPON_PALETTE[gear.weapon?.weaponType]??'ranger'];
 const weight=armorClass(gear.chest)??'light';
 const base=gear.chest?ARMOR_COLORS[weight]:palette;
 const chest=rareGearDesign(gear.chest),helm=rareGearDesign(gear.helm),cloak=rareGearDesign(gear.cloak);
 const hands=rareGearDesign(gear.hands),feet=rareGearDesign(gear.feet),charm=rareGearDesign(gear.charm);
 const trim=chest?.palette[2]??equipmentTrim(gear.chest,palette.trim);
 const visual={
  ...base,...(chest?{body:chest.palette[1],dark:chest.palette[0],cloth:chest.palette[2]}:{}),
  trim,hair:palette.hair,hairLight:palette.hairLight,mode:'equipment',style:null,
  gender:hero.gender==='female'?'female':'male',armor:weight,garment:gear.chest?weight:'base',
  helmet:gear.helm?({light:'hood',medium:'cap',heavy:'visor'}[armorClass(gear.helm)]??'cap'):'none',
  helmetColor:ARMOR_COLORS[armorClass(gear.helm)??'medium'].body,
  helmetTrim:equipmentTrim(gear.helm,trim),
  cloak:{visible:!!gear.cloak,color:cloak?.palette[1]??equipmentTrim(gear.cloak,'#5d6270'),trim:cloak?.palette[2]??equipmentTrim(gear.cloak,trim),design:cloak},
  gloves:hands?.palette[1]??(gear.hands?ARMOR_COLORS[armorClass(gear.hands)??'medium'].body:'#b99f87'),
  boots:feet?.palette[1]??(gear.feet?ARMOR_COLORS[armorClass(gear.feet)??'medium'].dark:'#4a433b'),
  gloveGear:!!gear.hands,bootGear:!!gear.feet,amulet:!!gear.charm,
  rare:{chest,helm,hands,feet,charm,rings:[rareGearDesign(gear.ring_left),rareGearDesign(gear.ring_right)]},
  main:weapon(gear.weapon,equipmentTrim(gear.weapon,trim)),
  off:weapon(gear.offhand,equipmentTrim(gear.offhand,trim)),
 };
 cache.set(hero,{signature,visual});
 return visual;
}
