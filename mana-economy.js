const clampLevel=level=>Math.max(1,Math.min(100,Math.floor(Number.isFinite(level)?level:1)));
export function baseMana(cls,level,legacy=false){
 const base={warrior:85,ranger:110,mage:190,assassin:115,berserker:0,wanderer:115}[cls]??115;
 return base+(clampLevel(level)-1)*(cls==='berserker'?0:cls==='mage'?(legacy?5:1.8):(legacy?3:1));
}
export const baseManaRegen=(cls,legacy=false)=>((legacy?{warrior:2,ranger:2.5,mage:4,assassin:3,berserker:0,wanderer:3}:{warrior:1.6,ranger:2,mage:3,assassin:2.2,berserker:0,wanderer:2})[cls]??2);
export const MANA_SIPHON_RATE=.06;
export const manaSiphonBudget=stats=>Math.max(0,stats?.mana||0)*MANA_SIPHON_RATE;
export function restoreSiphonedMana(game,wanted){
 if(game.mode!=='playing'||game.training||!Number.isFinite(wanted)||wanted<=0)return 0;
 const amount=Math.max(0,Math.min(wanted,game.manaLeechAllowance||0,game.s.mana-game.mana));
 game.mana+=amount;game.manaLeechAllowance-=amount;return amount;
}
export function manaLevelFactor(def,stats){
 const rate=def.type==='summon'||def.resourceDrain?.004:def.type==='aura'?.006:.008;
 return 1+(clampLevel(stats?.resourceLevel)-1)*rate;
}
