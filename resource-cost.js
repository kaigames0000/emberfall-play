import {manaLevelFactor} from './mana-economy.js?v=108';
const clamp=(value,min,max)=>Math.max(min,Math.min(max,Number.isFinite(value)?value:0));
const positive=value=>Math.max(0,Number.isFinite(value)?value:0);
// One shared quote for both display and payment. A zero-cost aura stays free.
export function resourceCost(def={},stats={},seconds=1){
 const zero={mana:0,life:0,rage:0};if(!def||def.freeResource)return zero;
 seconds=positive(seconds);const raw=positive(def.mana),global=clamp(stats.manaCost,0,.6),aura=def.type==='aura'?clamp(stats.auraManaCost,0,.35):0,summon=def.type==='summon'?clamp(stats.summonManaCost,0,.4):0;
 const factor=(1+clamp(stats.skillCostPenalty,0,.5))*(1-global)*(1-aura)*(1-summon),discounted=raw>0?Math.max(def.resourceDrain?0:Math.min(1,raw),raw*factor-(def.resourceDrain?0:positive(stats.flatManaCost))):0;
 const native=positive(def.lifeCost??def.lifePerSecond),blood=stats.resourceClass==='berserker'||stats.resourceClass==='blood'||stats.bloodSpell&&def.ringBloodSpell||stats.bloodAura&&def.type==='aura'&&def.damage>0,hp=positive(stats.hp),lifeScale=Math.max(1,positive(stats.resourceLifeScale)||1),lifeReduction=1-clamp(stats.lifeCostReduction,0,.4);
 const lifeRatio=native>0?native*(raw>0?discounted/raw:factor):blood?Math.min(.2,discounted*.0008):0;
 return {mana:blood||native>0?0:discounted*manaLevelFactor(def,stats)*seconds,life:hp*Math.min(.25,lifeRatio*lifeScale*lifeReduction)*seconds,rage:positive(def.rageCost)*seconds};
}
export function sumResourceCosts(costs){return costs.reduce((sum,cost)=>({mana:sum.mana+positive(cost?.mana),life:sum.life+positive(cost?.life),rage:sum.rage+positive(cost?.rage)}),{mana:0,life:0,rage:0});}
