import {enemyImpactDamage} from './combat-balance.js?v=108';
import {enemyMeleeDamage} from './enemy-combat.js?v=123';

const HEAVY_HEALTH_FRACTION=.2;
const meleeIntents=new Set(['melee','brace','melee-followup']);
const boss=enemy=>enemy?.type==='boss'||enemy?.type==='miniboss';
const scale=enemy=>enemy.damageScale*(1-(enemy.auraWeaken||0));
const heavy=(game,damage)=>game.s?.hp>0&&damage>=game.s.hp*HEAVY_HEALTH_FRACTION;

// Routine volleys have traveling projectiles as their cue. Authored boss patterns
// and severe direct hits also get a warning before the impact.
export function majorEnemyIntent(game,enemy){
 const intent=enemy.intent;
 if(!intent||intent.t<=0)return false;
 if(intent.kind.startsWith('boss-')||intent.kind==='legacy-commit'&&boss(enemy))return true;
 if(!meleeIntents.has(intent.kind))return false;
 const damage=enemyMeleeDamage(enemy,intent,scale(enemy));
 return heavy(game,enemyImpactDamage(game,damage,intent.damageType,intent.damageType?'projectile':null));
}

export function majorEnemyCharge(game,enemy){
 const charge=enemy.charge;
 return !!charge&&charge.t>0&&(boss(enemy)||heavy(game,charge.damage??25*scale(enemy)));
}

function fieldExposure(game,field){
 if(!field)return 0;
 const interval=field.interval||.5;
 const duration=Math.min(1,field.duration??field.max??field.t??1);
 const ticks=Math.floor((duration+1e-8)/interval);
 return ticks*enemyImpactDamage(game,field.damage??0,field.damageType,'field');
}

// Areas with no attacking actor are authored room/expedition mechanics.
// Other areas use their burst plus the first second of persistent damage.
export function majorEnemyArea(game,area,persistent=false){
 if(area.friendly||area.t<=0)return false;
 if(!area.attacker||boss(area.attacker))return true;
 const burst=persistent?0:enemyImpactDamage(game,area.damage??0,area.damageType,'burst');
 return heavy(game,burst+fieldExposure(game,persistent?area:area.fieldOnExpire));
}
