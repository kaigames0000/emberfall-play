import {BOW_SKILLS} from './bow-skills.js?v=123';

const requiredWeapons=new Map([
 ['r_pierce','bow'],['r_volley','bow'],['r_ricochet','bow'],['r_snipe','bow'],
 ['r_poisonarrow','bow'],['r_burst','bow'],['r_rain','bow'],
 ...BOW_SKILLS.map(({id})=>[id,'bow']),
 ['a_stab','dagger'],['a_execute','dagger'],['a_mirrorstrike','dagger'],
 ['a_flurry','dagger'],['a_storm','dagger'],['a_shuriken','dagger'],['a_kunai','dagger'],
 ['a_blades','dagger'],['a_mine','dagger'],['a_sentry','dagger'],['a_mark','dagger']
]);

const meleeWeapons=new Set(['dagger','sword','axe','greatsword','greataxe']);
const meleeSkills=new Set(['w_cleave','w_whirl','w_charge','w_blitz','w_slam','b_cleave','b_flurry','b_execute','b_leap']);
const spells=new Set(['m_flamethrower','m_fireball','m_meteor','m_nova','m_blizzard','m_spark','m_chain',
 'm_sanctuary','m_frostarmor','m_icecone']);
const requirementLabels={
 bow:'主手裝備弓',
 dagger:'主手裝備匕首',
 melee:'主手裝備近戰武器',
 spell:'主手裝備短杖或長杖，或副手裝備法書'
};

export function requiredSkillWeapon(defOrId){
 const id=typeof defOrId==='string'?defOrId:defOrId?.id;
 return requiredWeapons.get(id)??(meleeSkills.has(id)?'melee':spells.has(id)||typeof id==='string'&&id.startsWith('m_basic_')?'spell':null);
}

export function skillWeaponRequirement(defOrId){
 return requirementLabels[requiredSkillWeapon(defOrId)]??'';
}

export function skillWeaponCompatible(hero,defOrId){
 const required=requiredSkillWeapon(defOrId),main=hero?.equipment?.weapon?.weaponType;
 if(required==='melee')return meleeWeapons.has(main);
 if(required==='spell')return main==='wand'||main==='staff'||hero?.equipment?.offhand?.weaponType==='tome';
 return required===null||main===required;
}

export function skillWeaponFailure(hero,defOrId){
 if(skillWeaponCompatible(hero,defOrId))return '';
 return '需要'+skillWeaponRequirement(defOrId)+'。';
}
