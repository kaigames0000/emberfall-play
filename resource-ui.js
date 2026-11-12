const POOLS=['mana','life','rage'];
const amount=value=>Math.max(0,Number(value)||0);
const number=(value,digits=1)=>Number(value.toFixed(digits)).toLocaleString('zh-TW');

export function costText(cost={},digits=1){
 return POOLS.filter(key=>amount(cost[key])>0).map(key=>number(amount(cost[key]),digits)+' '+({mana:'MP',life:'HP',rage:'狂怒'}[key])).join(' ＋ ')||'免費';
}
export function sumCosts(costs){return Object.fromEntries(POOLS.map(key=>[key,costs.reduce((n,cost)=>n+amount(cost?.[key]),0)]));}
export function scaleCost(cost={},factor=1){return Object.fromEntries(POOLS.map(key=>[key,amount(cost[key])*factor]));}

// Projection only: runtime availability remains responsible for payment eligibility.
export function sustainBudget({startup={},drain={},regen={},current={},minimumLife=1}={}){
 const net=Object.fromEntries(POOLS.map(key=>[key,amount(regen[key])-amount(drain[key])]));
 let seconds=Infinity;
 for(const key of POOLS){
  const spendable=amount(current[key])-(key==='life'?amount(minimumLife):0)-amount(startup[key]);
  if(amount(startup[key])>0&&spendable<0)seconds=0;
  if(net[key]<0)seconds=Math.min(seconds,Math.max(0,spendable)/-net[key]);
 }
 return {net,seconds};
}
export function availabilityView(state){
 return {unavailable:!state.usable,reason:state.usable?'':state.reason||'目前無法使用',cooldown:Math.max(0,Number(state.cooldown)||0)};
}
