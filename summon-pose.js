const clamp=value=>Math.min(1,Math.max(0,value));
const flying=new Set(['eagle','hawk']);
const lunging=new Set(['wolf','bear']);
const heavy=new Set(['earth_golem','frost_golem','titan','thorn_construct']);
const clones=new Set(['mirror_clone','shadow_clone']);

export function summonStrike(actor,target,time,style){
 const angle=Math.atan2(target.y-actor.y,target.x-actor.x);
 actor.angle=angle;
 actor.attackPose={at:time,angle,style:style??(clones.has(actor.kind)?'weapon':
  flying.has(actor.kind)?'dive':lunging.has(actor.kind)?'pounce':
  heavy.has(actor.kind)?'slam':actor.ranged?'cast':'weapon')};
}

export function summonStrikePose(actor,time,reducedMotion=false){
 const strike=actor.attackPose;
 if(!strike)return null;
 const {style,angle}=strike;
 const duration=style==='slam'?.39:style==='dive'?.34:.30;
 const progress=(time-strike.at)/duration;
 if(progress<0||progress>=1)return null;
 const load=Math.sin(clamp(progress*3)*Math.PI)*(1-clamp(progress-.27));
 const hit=Math.sin(clamp((progress-.20)/.80)*Math.PI);
 const side=Math.cos(angle)<0?-1:1,scale=reducedMotion?.40:1;
 const advance=(style==='cast'?-5:style==='slam'?8:style==='weapon'?8:16)*hit*scale;
 const lift=(style==='dive'?16*load-5*hit:style==='slam'?9*load:style==='pounce'?10*hit:style==='cast'?4*hit:0)*scale;
 return {
  x:Math.cos(angle)*advance,y:Math.sin(angle)*advance-lift,
  angle,rotation:side*(hit*(style==='slam'?.44:.24)-load*(style==='slam'?.29:.19))*scale,
  stretchX:1+hit*.13*scale,stretchY:1+(style==='cast'?hit*.12:-hit*.15)*scale,
  swing:progress,style
 };
}
