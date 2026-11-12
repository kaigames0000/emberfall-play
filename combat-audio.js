import {AUDIO_SAMPLES,renderSound} from './sound-recipes.js?v=137';
export {renderSound};

const SIGNATURES={
 w_cleave:'cleave',w_slam:'slam',w_whirl:'whirl',m_fireball:'ice',m_flamethrower:'beam',
 m_blizzard:'blizzard',m_chain:'lightning',r_dash:'roll',a_blink:'blink',b_leap:'leap',
 w_blitz:'blink',r_icearrow:'ice-arrow',r_explosivearrow:'fire-arrow',r_poisonarrow:'poison-arrow',
 r_homingarrow:'magic-shot',a_kunai:'stab',a_shuriken:'stab',a_execute:'stab',b_execute:'slam'
};
const elements={cold:'ice',fire:'fire',lightning:'lightning',poison:'poison'};
const byType={summon:'summon',aura:'aura',guard:'ward',curse:'curse',trap:'trap',dash:'roll',channel:'whirl'};
const movement=id=>SIGNATURES[id]??'roll';
const damageSounds=Object.entries({
 physical:'hit',fire:'hit-fire',cold:'hit-cold',lightning:'hit-lightning',poison:'hit-poison'
});

export function soundForDamage(byType){
 let sound=null,highest=0;
 for(const [type,key] of damageSounds){
  const amount=byType?.[type];
  if(Number.isFinite(amount)&&amount>highest){highest=amount;sound=key;}
 }
 return sound;
}

export function soundForSkill(def={}){
 const {id,type,damageType,cls,style}=def;
 if(SIGNATURES[id])return SIGNATURES[id];
 if(type==='guard'&&!def.shield)return 'warcry';
 if(byType[type])return byType[type];
 if(cls==='ranger'&&(type==='projectile'||type==='charge'||style)){
  return {cold:'ice-arrow',fire:'fire-arrow',poison:'poison-arrow'}[damageType]??'arrow';
 }
 if(elements[damageType])return elements[damageType];
 if(type==='projectile'||cls==='mage')return 'cast';
 return cls==='assassin'?'stab':'swing';
}

const effectSounds={melee:'swing',thrust:'stab',cast:'cast',charge:'cast',release:'cast',
 field:'cast',trap:'trap',warcry:'warcry',shield:'ward',curse:'curse',chain:'lightning'};
export function soundForEffect(effect,def){
 const {ability,visual}=effect;
 if(!visual||effect.hostile||effect.friendly===false||def?.type==='summon')return null;
 if(visual==='travel')return movement(ability);
 if(visual==='aura'&&effect.sprite==='aura')return 'aura';
 if(visual==='landing'&&ability==='b_leap')return 'land';
 if(visual==='impact'){
  if(ability==='w_cleave')return 'cleave';
  if(ability==='w_slam')return 'slam';
  if(ability==='m_fireball'&&effect.type==='meteor')return 'ice';
  if(ability==='m_nova')return 'ice';
  return def?.type==='nova'?soundForSkill(def):null;
 }
 if(!effectSounds[visual])return null;
 if(visual==='chain')return 'lightning';
 if((visual==='cast'||visual==='release')&&def?.type==='projectile')return null;
 if(visual==='thrust'&&effect.type==='channel-flame'&&!ability?.includes('_basic_'))return null;
 return def?soundForSkill(def):effectSounds[visual];
}

const busFor={
 hit:['impact',.085,1,.37],crit:['impact',.14,2,.48],'minion-hit':['minion',.24,0,.21],
 swing:['weapon',.075,1,.46],stab:['weapon',.073,1,.44],
 arrow:['projectile',.11,1,.48],'ice-arrow':['projectile',.11,1,.47],
 'fire-arrow':['projectile',.11,1,.48],'poison-arrow':['projectile',.11,1,.42],'magic-shot':['projectile',.095,1,.45],
 lightning:['lightning',.17,2,.52],ice:['spell',.12,2,.55],
 'boss-warning':['danger',.9,5,.69],'low-health':['health',1.4,4,.61],
 block:['player-hit',.14,3,.51],ward:['ward',.16,2,.48],hurt:['player-hit',.2,3,.51],
 loot:['pickup',.18,1,.37],'rare-drop':['rare',.32,4,.58],'set-drop':['rare',.32,5,.61],
 'foot-stone':['foot',.18,0,.17],'foot-wood':['foot',.18,0,.17],click:['ui',.085,1,.30],
 aura:['aura',.32,1,.42],'aura-off':['aura',.24,1,.35],
 clear:['milestone',.23,3,.55],level:['level',.55,4,.55],
 victory:['result',.5,5,.61],dead:['result',.5,5,.54]
};
const eventSounds={summonArmy:'summon',auraOff:'aura-off',auraConfigOff:'aura-off',flask:'flask',shrine:'shrine',
 transition:'portal',start:'portal',objective:'ward',clear:'clear',level:'level',victory:'victory',dead:'dead',noMana:'error'};

const limitVolume=value=>Number.isFinite(value)?Math.max(0,Math.min(1,value)):.45;
const voiceLimit=12;
const settingsKey='emberfall-sfx-volume-v1';
export function savedVolume(){
 try{const value=globalThis.localStorage?.getItem(settingsKey);return value==null?.45:limitVolume(Number(value));}
 catch{return .45;}
}
export function storeVolume(value){
 try{globalThis.localStorage?.setItem(settingsKey,String(limitVolume(value)));}catch{}
}

export class CombatAudio{
 constructor({createContext=()=>new (globalThis.AudioContext??globalThis.webkitAudioContext)(),
  assetBase='./audio/',volume=.45,loadSample=url=>fetch(url).then(response=>response.ok?response.arrayBuffer():null),random=Math.random}={}){
  Object.assign(this,{createContext,assetBase,loadSample,random,volume:limitVolume(volume)});
  this.buffers=new Map();
  this.last=new Map();
  this.voices=new Set();
 }
 get ready(){return this.context?.state==='running'&&this.volume>0;}
 async unlock(){
  try{
   if(!this.context){
    this.context=this.createContext();
    this.master=this.context.createGain();
    this.master.gain.value=this.volume;
    const limiter=this.context.createDynamicsCompressor?.();
    if(limiter){limiter.threshold.value=-13;limiter.ratio.value=5;this.master.connect(limiter);limiter.connect(this.context.destination);}
    else this.master.connect(this.context.destination);
    for(const [key,file] of Object.entries(AUDIO_SAMPLES))void this.prepareSample(key,file);
   }
   if(this.context.state!=='running')await this.context.resume();
   return this.context.state==='running';
  }catch{return false;}
 }
 async prepareSample(key,file){
  try{
   const data=await this.loadSample(globalThis.emberfallSoundAssets?.[file]??this.assetBase+file);
   if(data)this.buffers.set(key,await this.context.decodeAudioData(data));
  }catch{/* Use the synthesized version when the recording cannot be decoded. */}
 }
 setVolume(value){
  this.volume=limitVolume(value);
  if(this.master)this.master.gain.value=this.volume;
  if(!this.volume)this.silence();
  return this.volume;
 }
 buffer(key){
  if(this.buffers.has(key))return this.buffers.get(key);
  const rate=this.context.sampleRate,signal=renderSound(key,rate);
  if(!signal)return null;
  const buffer=this.context.createBuffer(1,signal.length,rate);
  buffer.copyToChannel(signal,0);
  this.buffers.set(key,buffer);
  return buffer;
 }
 source(buffer,level,rate,pan=0){
  const source=this.context.createBufferSource(),gain=this.context.createGain();
  source.buffer=buffer;source.playbackRate&&(source.playbackRate.value=rate);
  gain.gain.value=level;source.connect(gain);
  const stereo=pan?this.context.createStereoPanner?.():null;
  if(stereo){
   stereo.pan.value=Math.max(-.75,Math.min(.75,pan));
   gain.connect(stereo);stereo.connect(this.master);
  }else gain.connect(this.master);
  source.onended=()=>{source.disconnect();gain.disconnect();stereo?.disconnect();};
  return source;
 }
 play(key,{pan=0,volume=1,bus,rateScale=1}={}){
  if(!this.ready)return false;
  const [group,gap,priority,level]=bus??busFor[key]??[key,.13,2,.47];
  const now=this.context.currentTime,previous=this.last.get(group);
  if(previous&&now-previous.at<gap&&priority<=previous.priority)return false;
  for(const voice of this.voices)if(voice.endAt<=now)this.voices.delete(voice);
  if(this.voices.size>=voiceLimit){
   const lowest=[...this.voices].reduce((best,voice)=>voice.priority<best.priority?voice:best);
   if(lowest.priority>=priority)return false;
   lowest.source.stop();this.voices.delete(lowest);
  }
  const buffer=this.buffer(key);
  if(!buffer)return false;
  const rate=(priority>=4?1:.93+this.random()*.14)*rateScale;
  const warning=this.last.get('danger');
  const duck=priority<4&&warning&&now-warning.at<.38?.48:1;
  const source=this.source(buffer,level*volume*duck,rate,pan);
  const voice={source,priority,endAt:now+buffer.duration/rate};
  const ended=source.onended;
  source.onended=()=>{ended();this.voices.delete(voice);};
  if(key==='boss-warning')for(const active of this.voices)if(active.priority<=1){active.source.stop();this.voices.delete(active);}
  source.start();
  this.voices.add(voice);
  this.last.set(group,{at:now,priority});
  return true;
 }
 damage(byType,{pan=0,crit=false,minion=false,periodic=false,incoming=false}={}){
  let key=soundForDamage(byType);
  if(!key)return false;
  if(incoming){
   if(key==='hit')key='hurt';
   const bus=periodic?['incoming-field',.65,2,.30]:busFor.hurt;
   return this.play(key,{pan,bus,rateScale:.89});
  }
  if(periodic)return this.play(key,{pan,bus:['periodic-'+key,.65,0,minion?.13:.17],rateScale:.92});
  if(minion)return this.play(key,{pan,bus:busFor['minion-hit'],rateScale:crit?1.08:1});
  if(crit&&key==='hit')return this.play('crit',{pan});
  return this.play(key,{pan,bus:crit?busFor.crit:busFor.hit,rateScale:crit?1.1:1});
 }
 setChannel(key){
  if(!this.ready||!['beam','whirl'].includes(key))key=null;
  if(key===this.loopKey)return;
  this.loopSource?.stop();this.loopSource=null;this.loopKey=key;
  if(!key)return;
  this.play(key);
  const source=this.source(this.buffer(key+'-loop'),.27,1);
  source.loop=true;source.start();this.loopSource=source;
 }
 silence(){
  this.setChannel(null);
  for(const voice of this.voices)voice.source.stop();
  this.voices.clear();
  this.last.clear();
 }
 event(type,data={}){
  if(!this.ready)return;
  let key=eventSounds[type];
  if(type==='drop')key=data.rarity>=5?'set-drop':data.rarity===4?'rare-drop':null;
  if(type==='loot'||type==='lootOverflow')key=(data.item??data).rarity>=4?null:'loot';
  if(type==='flaskLoot'||type==='worldPickup')key='loot';
  if(type==='worldLoot')key=data.kind==='chest'?'chest':'hit';
  if(type==='auraToggle'||type==='aurasToggle')key=data.active?'aura':'aura-off';
  if(key)this.play(key);
 }
}
