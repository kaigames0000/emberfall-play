export const AUDIO_SAMPLES = Object.freeze({
 hit:'hit.ogg', block:'block.ogg', chest:'chest.ogg', click:'click.ogg',
 'foot-stone':'foot-stone.ogg', 'foot-wood':'foot-wood.ogg'
});

// Each layer describes start, duration, pitch (or noise cutoff), level, and ending pitch.
const tone=(at,length,from,level,to=from,edge=.24)=>({at,length,from,to,level,edge});
const noise=(at,length,from,level,to=from)=>({...tone(at,length,from,level,to),noise:true});
const recipes={
 swing:[noise(0,.17,1150,.56,6100),tone(.055,.09,220,.12,90)],
 stab:[noise(0,.105,2650,.46,950),tone(.025,.08,410,.15,180)],
 arrow:[noise(0,.125,4700,.39,1250),tone(.004,.17,336,.21,142,.55)],
 'ice-arrow':[noise(0,.12,5400,.32,2400),tone(.035,.21,980,.21,440,.6)],
 'fire-arrow':[noise(0,.18,780,.58,2200),tone(.045,.13,214,.13,98)],
 'poison-arrow':[noise(0,.21,1450,.37,670),tone(.04,.2,330,.21,210,.52)],
 'magic-shot':[tone(0,.2,300,.33,650),noise(.018,.13,3300,.21,900)],
 cast:[tone(0,.22,250,.33,720),tone(.04,.22,510,.15,860),noise(.03,.2,2400,.2,6100)],
 cleave:[tone(0,.33,117,.58,42,.48),noise(.02,.43,2400,.67,350),noise(.115,.35,1800,.39,480),noise(.21,.25,4400,.31,890)],
 slam:[tone(0,.36,158,.59,52,.32),noise(.019,.29,2800,.54,620),tone(.07,.28,628,.12,220,.63)],
 ice:[noise(0,.31,6700,.64,1450),tone(.01,.31,1560,.29,1120,.44),tone(.053,.35,2190,.2,1600),tone(.13,.24,2700,.12,2200)],
 blizzard:[noise(0,.55,1900,.47,5250),noise(.12,.48,5650,.32,1200),tone(.095,.54,770,.2,415)],
 lightning:[noise(0,.20,7300,.74,1800),tone(0,.11,173,.3,49,.7),noise(.068,.21,4900,.47,1440)],
 fire:[noise(0,.32,570,.71,2200),tone(.01,.27,140,.34,62),noise(.13,.27,3700,.32,1040)],
 poison:[noise(0,.34,1100,.42,720),tone(.018,.15,196,.24,82,.56),tone(.12,.19,210,.2,86,.61)],
 beam:[noise(0,.36,5100,.42,2600),tone(.025,.39,630,.31,260,.35)],
 whirl:[noise(0,.30,850,.56,3950),tone(.05,.27,130,.35,58)],
 hit:[noise(0,.095,2300,.51,630),tone(0,.115,161,.33,72)],
 'hit-fire':[tone(0,.19,125,.56,53,.46),noise(0,.205,1400,.65,450),noise(.035,.20,3700,.35,1200)],
 'hit-cold':[noise(0,.09,6500,.58,2500),tone(.01,.24,1900,.29,1720,.43),tone(.039,.24,2630,.21,2190),tone(.084,.19,3170,.14,2890)],
 'hit-lightning':[noise(0,.045,8500,.72,2100),noise(.037,.063,7600,.61,2700),noise(.081,.097,6000,.47,900),tone(0,.13,316,.38,121,.88)],
 'hit-poison':[noise(0,.205,830,.41,510),tone(0,.12,141,.41,74,.67),tone(.058,.13,165,.31,81,.56),noise(.102,.17,2800,.27,900)],
 crit:[tone(0,.15,196,.42,71),noise(.014,.16,5700,.54,1550),tone(.025,.25,1040,.25,590,.6)],
 'minion-hit':[tone(0,.1,123,.26,54),noise(.018,.11,2200,.27,800)],
 block:[tone(0,.26,1170,.36,870,.54),tone(0,.32,1960,.22,1370,.44),noise(0,.14,6600,.45,1700)],
 ward:[tone(0,.23,288,.29,392),tone(.04,.31,442,.23,570),tone(.11,.32,661,.16,790)],
 hurt:[tone(0,.23,124,.51,57,.65),noise(.014,.19,1000,.57,510)],
 roll:[noise(0,.24,1850,.46,500),tone(.11,.12,145,.21,71)],
 blink:[tone(0,.145,620,.32,230,.58),noise(.055,.19,3100,.32,1070),tone(.113,.16,330,.27,760)],
 leap:[noise(0,.24,920,.37,2900),tone(.05,.22,134,.25,294)],
 land:[tone(0,.22,135,.47,48),noise(.016,.2,1450,.47,540)],
 warcry:[tone(0,.4,111,.45,88,.64),tone(.037,.4,224,.35,175,.34),noise(.03,.4,840,.46,480)],
 curse:[tone(0,.4,326,.35,114,.58),tone(.07,.32,219,.25,128,.44),noise(.03,.3,1700,.24,530)],
 summon:[tone(0,.38,131,.44,212),tone(.09,.41,261,.29,326),noise(.08,.37,1600,.31,680)],
 aura:[tone(0,.21,392,.25,540),tone(.055,.25,587,.18,660),tone(.1,.28,784,.15,930)],
 'aura-off':[tone(0,.18,474,.21,231),tone(.05,.16,321,.14,168)],
 trap:[tone(0,.11,670,.23,294,.63),noise(0,.14,3650,.38,1020),tone(.096,.17,320,.22,186)],
 flask:[tone(0,.16,268,.24,510),tone(.065,.22,355,.27,686),tone(.14,.23,610,.16,940)],
 loot:[tone(0,.15,534,.26,730),tone(.045,.16,830,.16,1046)],
 'rare-drop':[tone(0,.25,415,.33),tone(.075,.31,622,.27),tone(.15,.46,830,.28),tone(.26,.48,1244,.19)],
 'set-drop':[tone(0,.24,392,.3),tone(.08,.26,494,.26),tone(.16,.32,659,.28),tone(.24,.44,784,.26),tone(.29,.49,1175,.19)],
 chest:[noise(0,.29,1300,.38,650),tone(.105,.15,292,.26,147),tone(.22,.19,620,.18,785)],
 shrine:[tone(0,.4,247,.28),tone(.11,.4,370,.22),tone(.21,.5,494,.19)],
 portal:[noise(0,.45,690,.34,2700),tone(0,.49,125,.32,260),tone(.19,.37,450,.19,710)],
 clear:[tone(0,.23,294,.25),tone(.09,.24,440,.21),tone(.19,.36,587,.26)],
 level:[tone(0,.23,392,.27),tone(.075,.26,494,.25),tone(.15,.34,587,.22),tone(.225,.41,784,.27)],
 victory:[tone(0,.3,330,.35),tone(.12,.31,440,.28),tone(.25,.39,554,.28),tone(.41,.53,660,.24)],
 dead:[tone(0,.5,199,.39,103),tone(.17,.51,142,.28,54)],
 'boss-warning':[tone(0,.34,90,.52,134,.51),tone(.052,.41,244,.32,171,.35),tone(.24,.23,90,.42,116,.47),noise(.02,.37,740,.22,1720)],
 'low-health':[tone(0,.11,105,.36,54),tone(.16,.15,91,.31,45)],
 click:[noise(0,.06,4900,.29,1850),tone(.004,.06,391,.11,305)],
 error:[tone(0,.15,246,.27,132,.58)],
 'foot-stone':[noise(0,.096,1950,.33,580),tone(.016,.11,115,.22,61)],
 'foot-wood':[noise(0,.11,1080,.36,320),tone(.01,.12,152,.24,59,.6)],
};

function renderLoop(key,rate){
 const spin=key==='whirl',length=Math.round(rate*.6),out=new Float32Array(length);
 for(let i=0;i<length;i++){
  const u=i/length*Math.PI*2;
  const carrier=Math.sin(u*(spin?48:144))+.22*Math.sin(u*(spin?85:367));
  const air=Math.sin(u*71)*Math.sin(u*153)+.44*Math.sin(u*591)*Math.sin(u*257);
  out[i]=(.12+Math.sin(u*(spin?3:2))*.065)*carrier+air*.058;
 }
 return out;
}

export function renderSound(key,rate){
 if(key==='beam-loop'||key==='whirl-loop')return renderLoop(key==='whirl-loop'?'whirl':'beam',rate);
 const layers=recipes[key];
 if(!layers)return null;
 const samples=new Float32Array(Math.ceil(rate*Math.max(...layers.map(layer=>layer.at+layer.length))));
 let seed=36969;
 for(const layer of layers){
  const start=Math.round(rate*layer.at),length=Math.min(samples.length-start,Math.round(rate*layer.length));
  let phase=0,low=0;
  for(let i=0;i<length;i++){
   const p=i/length,frequency=layer.from*(layer.to/layer.from)**p;
   const envelope=Math.min(1,i/(rate*(layer.noise?.006:.008)))*(1-p)**(layer.noise?1.5:2.2);
   let wave;
   if(layer.noise){
    seed=(Math.imul(seed,1664525)+1013904223)>>>0;
    const white=seed/2147483648-1;
    low+=(white-low)*Math.min(.86,frequency*6.283/rate);
    wave=low*.85+(white-low)*Math.min(.55,frequency/6800);
   }else{
    phase+=frequency*6.283185307/rate;
    wave=Math.sin(phase)+layer.edge*(Math.sin(phase*2)*.62+Math.sin(phase*3)*.38);
   }
   samples[start+i]+=wave*layer.level*envelope;
  }
 }
 return samples.map(sample=>Math.tanh(sample));
}
