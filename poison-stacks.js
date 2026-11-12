const live=stack=>stack.time>1e-8&&stack.rate>0;
export const MAX_POISON_STACKS=12;
export const MAX_POISON_FIELDS=12;

export function syncPoison(dot){
 dot.stacks=dot.stacks.filter(live);
 dot.rate=dot.stacks.reduce((sum,s)=>sum+s.rate,0);
 dot.rawRate=dot.stacks.reduce((sum,s)=>sum+s.rawRate,0);
 dot.time=Math.max(0,...dot.stacks.map(s=>s.time));
 return dot;
}
export function poisonBudget(dot,raw=false){
 if(dot.fogLayers)return fogTicks(dot.fogLayers,Infinity).reduce((total,tick)=>total+(raw?tick.raw:tick.damage),0);
 const key=raw?'rawRate':'rate';
 return dot.stacks?dot.stacks.reduce((sum,s)=>sum+s[key]*Math.max(0,s.time),0):
  (dot[key]??dot.rate)*Math.max(0,dot.time);
}
export function addPoisonStack(enemy,key,stack,limit=5,metadata={}){
 if(!live(stack)||!Number.isFinite(stack.rate)||!Number.isFinite(stack.time)||!Number.isFinite(stack.rawRate))return false;
 enemy.dots??={};
 const all=[];
 for(const [id,dot]of Object.entries(enemy.dots))if(dot.stacks){
  syncPoison(dot);
  for(const value of dot.stacks)all.push({id,dot,value});
 }
 const cap=Math.max(1,Math.min(MAX_POISON_STACKS,Math.floor(limit)||5));
 while(all.length>=cap){
  let index=0;
  for(let i=1;i<all.length;i++)if(all[i].value.rate*all[i].value.time<all[index].value.rate*all[index].value.time)index=i;
  const weakest=all[index];
  if(all.length===cap&&stack.rate*stack.time<weakest.value.rate*weakest.value.time)return false;
  weakest.dot.stacks.splice(weakest.dot.stacks.indexOf(weakest.value),1);
  syncPoison(weakest.dot);if(!weakest.dot.stacks.length)delete enemy.dots[weakest.id];
  all.splice(index,1);
 }
 const dot=enemy.dots[key]??={...metadata,damageType:'poison',stacks:[]};
 dot.stacks.push({...stack});syncPoison(dot);
 return true;
}

function syncPoisonFog(dot){
 const strongest=dot.fogLayers[0];
 dot.rate=strongest?.rate??0;
 dot.rawRate=strongest?.rawRate??0;
 dot.time=dot.fogLayers.at(-1)?.time??0;
}

export function addPoisonFog(enemy,key,layer){
 const dot=enemy.dots[key]??={...layer,fogLayers:[]};
 const layers=[...dot.fogLayers.filter(live),layer].sort((a,b)=>b.rate-a.rate);
 // A weaker dose can only contribute after the stronger doses expire.
 let covered=0;
 dot.fogLayers=layers.filter(dose=>{
  if(dose.time<=covered)return false;
  covered=dose.time;
  return true;
 }).slice(0,MAX_POISON_FIELDS);
 syncPoisonFog(dot);
 return true;
}

function fogTicks(layers,dt){
 const ticks=[];
 let covered=0;
 for(const layer of layers){
  const until=Math.min(dt,layer.time);
  if(until<=covered)continue;
  const elapsed=until-covered;
  ticks.push({damage:layer.rate*elapsed,raw:layer.rawRate*elapsed,effect:layer});
  covered=until;
 }
 return ticks;
}

// Shared with ordinary dots so fractional last ticks and expiry are identical.
export function advanceDot(dot,dt){
 if(dot.fogLayers){
  const parts=fogTicks(dot.fogLayers,dt);
  for(const layer of dot.fogLayers)layer.time-=dt;
  dot.fogLayers=dot.fogLayers.filter(live);
  syncPoisonFog(dot);
  return {parts};
 }
 let damage=0,raw=0;
 for(const stack of dot.stacks??[dot]){
  const tick=Math.min(Math.max(0,dt),Math.max(0,stack.time));
  damage+=stack.rate*tick;raw+=(stack.rawRate??stack.rate)*tick;stack.time-=tick;
 }
 if(dot.stacks)syncPoison(dot);
 return {damage,raw};
}
export function consumePoison(enemy,fraction=.4){
 let damage=0;
 for(const dot of Object.values(enemy.dots??{})){
  if(!dot.rangerPoison||dot.inherited||dot.triggerKey||dot.poisonFog)continue;
  damage+=poisonBudget(dot)*fraction;
  for(const stack of dot.stacks??[dot])stack.time*=1-fraction;
  if(dot.stacks)syncPoison(dot);
 }
 return damage;
}
