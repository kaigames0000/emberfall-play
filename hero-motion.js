const clamp=value=>Math.min(1,Math.max(0,value));
const lerp=(from,to,t)=>from+(to-from)*t;
const TAU=Math.PI*2;
const AIR_START=.16,TOUCHDOWN=.76,REAPPEAR=.60;

export function movementTiming(id,dashTime=0){
 if(id==='b_leap'){
  const duration=.43;
  return {duration,travelDelay:duration*AIR_START,landingDelay:duration*TOUCHDOWN};
 }
 if(id==='a_blink'){
  const duration=.30;
  return {duration,travelDelay:duration*.24,landingDelay:duration*REAPPEAR};
 }
 const roll=id==='r_dash'||id==='dodge';
 const duration=Math.max(roll ? .29 : .2,dashTime);
 return {duration,travelDelay:0,landingDelay:duration};
}

export const leapAirProgress=progress=>clamp((progress-AIR_START)/(TOUCHDOWN-AIR_START));

export function sampleHeroMovement(cue,actor,{reducedMotion=false}={}){
 const progress=clamp((cue.max-cue.t)/cue.motionDuration);
 const id=cue.ability;
 const dx=cue.x2-cue.x,dy=cue.y2-cue.y;
 const angle=Math.hypot(dx,dy)>1?Math.atan2(dy,dx):cue.angle??actor.angle;
 const facing=Math.cos(angle)<0?-1:1;
 const pose={x:actor.x,y:actor.y,angle,alpha:1,height:0,stretchX:1,stretchY:1,rotation:0,tuck:0,shadow:1};
 if(id==='a_blink'){
  const departing=progress<.43,after=clamp((progress-REAPPEAR)/(1-REAPPEAR));
  const visible=departing?1-clamp(progress/.22):after;
  pose.x=departing?cue.x:lerp(cue.x2,actor.x,after);
  pose.y=departing?cue.y:lerp(cue.y2,actor.y,after);
  pose.alpha=visible*visible;
  pose.stretchX=reducedMotion?1:.65+.35*visible;
  pose.stretchY=reducedMotion?1:1.17-.17*visible;
  return pose;
 }
 if(id==='b_leap'){
  const air=leapAirProgress(progress);
  const settle=clamp((progress-TOUCHDOWN)/(1-TOUCHDOWN));
  pose.x=lerp(lerp(cue.x,cue.x2,air),actor.x,settle);
  pose.y=lerp(lerp(cue.y,cue.y2,air),actor.y,settle);
  const arc=Math.sin(air*Math.PI);
  const crouch=progress<AIR_START?Math.sin(progress/AIR_START*Math.PI):Math.sin(settle*Math.PI);
  pose.height=arc*(reducedMotion?24:56);
  pose.stretchX=1+crouch*.17;
  pose.stretchY=1+arc*.08-crouch*.25;
  pose.rotation=facing*arc*(reducedMotion?.06:.20);
  pose.tuck=.5*arc;
  pose.shadow=1-.36*arc;
  return pose;
 }
 if(id==='r_dash'||id==='dodge'){
  const roll=clamp((progress-.10)/.80),curl=Math.sin(roll*Math.PI);
  const load=Math.sin(progress*Math.PI);
  pose.rotation=facing*(reducedMotion?.48*curl:TAU*roll);
  pose.height=4*curl;
  pose.stretchX=1-.23*curl;
  pose.stretchY=1-.39*load;
  pose.tuck=.9*load;
  return pose;
 }
 const load=Math.sin(progress*Math.PI);
 pose.rotation=facing*load*(id==='w_charge'?.32:.21)*(reducedMotion?.5:1);
 pose.stretchY=1-load*.12;
 pose.tuck=.26*load;
 return pose;
}

export function activeHeroMovement(effects,actor,options){
 for(let i=effects.length-1;i>=0;i--){
  const cue=effects[i];
  if(cue.motionDuration>0&&cue.max-cue.t<cue.motionDuration)return sampleHeroMovement(cue,actor,options);
 }
 return null;
}

// The body turns around its center while its shadow stays on the ground.
export function applyHeroBodyPose(ctx,pose){
 if(!pose)return;
 ctx.translate(0,-pose.height-30);
 ctx.rotate(pose.rotation);
 ctx.scale(pose.stretchX,pose.stretchY);
 ctx.translate(0,30);
}
