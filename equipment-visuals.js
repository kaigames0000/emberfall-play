import {bplusAsset} from './bplus-art.js?v=124';
import {rareGearIcon,rareGearSymbols} from './rare-gear-art.js?v=108';

const GEAR_ART = {
 sword:'sword', greatsword:'greatsword', dagger:'dagger', axe:'axe', greataxe:'greataxe',
 wand:'wand', staff:'staff', bow:'bow', shield:'shield', tome:'grimoire', helm:'helmet',
 chest:'light-tunic', hands:'gauntlets', feet:'boots', charm:'amulet', ring:'ring',
 cloak:'cloak', towerShield:'tower-shield', quiver:'quiver', heavyChest:'heavy-chest',
};

export const EQUIPMENT_ICONS = Object.freeze(Object.fromEntries(Object.keys(GEAR_ART).map(key => [key, 'gear-' + key])));
export const FLASK_ICONS = Object.freeze(Object.fromEntries(['life','mana','hybrid','speed','iron','diamond','fortune'].map(key => [key, 'flask-' + key])));
export const STARTING_WEAPONS = Object.freeze(Object.fromEntries(Object.entries({
 warrior:{type:'sword',name:'旅人長劍'},
 ranger:{type:'bow',name:'白木獵弓'},
 mage:{type:'wand',name:'微光短杖'},
 assassin:{type:'dagger',name:'旅人匕首'},
 berserker:{type:'axe',name:'裂木手斧'},
}).map(([cls, data]) => [cls, Object.freeze({...data,icon:EQUIPMENT_ICONS[data.type]})])));

function baseEquipmentIcon(item, fallback) {
 if (item.slot === 'weapon') return EQUIPMENT_ICONS[item.weaponType || fallback] || EQUIPMENT_ICONS.sword;
 if (item.slot === 'offhand') return EQUIPMENT_ICONS[item.weaponType || 'shield'] || EQUIPMENT_ICONS.shield;
 if (item.slot === 'chest' && item.armorWeight === 'heavy') return EQUIPMENT_ICONS.heavyChest;
 return EQUIPMENT_ICONS[item.slot?.startsWith('ring_') ? 'ring' : item.slot] || 'bag';
}

export function equipmentIcon(item = {}, fallback = 'sword', {silhouette = false} = {}) {
 return rareGearIcon(item,fallback,silhouette) ?? baseEquipmentIcon(item,fallback);
}

export function equipmentArt(item = {}, fallback = 'sword') {
 const key = baseEquipmentIcon(item, fallback).slice('gear-'.length);
 const asset = GEAR_ART[key];
 return asset ? 'gear/' + asset + '.webp' : null;
}

function iconSymbol(id, asset) {
 const href = bplusAsset('gear/' + asset + '.webp');
 return '<symbol id="i-' + id + '" viewBox="0 0 32 32"><image x="1" y="1" width="30" height="30" href="' + href + '"/></symbol>';
}

export function equipmentIconSymbols() {
 const gear = Object.entries(GEAR_ART).map(([key, asset]) => iconSymbol(EQUIPMENT_ICONS[key], asset));
 const flasks = Object.entries(FLASK_ICONS).map(([key, id]) => iconSymbol(id, key + '-potion'));
 return gear.concat(flasks).join('') + rareGearSymbols();
}
