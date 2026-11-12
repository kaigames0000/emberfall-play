const TAU=Math.PI*2;
const colors={physical:'#c8c9bf',fire:'#d99378',cold:'#8ed6e5',lightning:'#e2c56d',poison:'#95b273'};
export function projectilePattern(pattern,step=0,difficulty=1){
 let angles=[0],speed=170,damage=9,type='fire';
 if(pattern.startsWith('arrow')){
  type=pattern==='arrow-split'&&step%2?'cold':pattern==='arrow-weave'?['poison','cold','lightning'][step%3]:'physical';speed=pattern==='arrow'?200:pattern==='arrow-fan'?195:pattern==='arrow-split'?190:185;damage=pattern==='arrow'?11:10;
  angles=pattern==='arrow'?[0]:pattern==='arrow-fan'?[-.18,0,.18]:pattern==='arrow-split'?[-.42,-.16,.16,.42].map(a=>a+step*.16):[-.48,-.24,0,.24,.48].map(a=>a+step*.22);
 }else if(['cross','cross-shift','cold-cross'].includes(pattern)){
  type=pattern==='cold-cross'?'cold':'lightning';speed=type==='cold'?140:155;damage=type==='cold'?8:10;
  angles=Array.from({length:4},(_,i)=>i*Math.PI/2+(pattern==='cold-cross'?Math.PI/4:pattern==='cross-shift'?step*Math.PI/4:0));
 }else if(['gap-ring','spiral-gap','frost-orbit'].includes(pattern)){
  type=pattern==='frost-orbit'?'cold':'lightning';speed=type==='cold'?135:145;damage=type==='cold'?8:9;const rotation=pattern==='spiral-gap'?step*.35:0;
  angles=Array.from({length:10},(_,i)=>i/10*TAU).filter(a=>Math.abs(Math.atan2(Math.sin(a-rotation),Math.cos(a-rotation)))>=.55);
 }else if(pattern.startsWith('poison')){
  type='poison';speed=145;damage=8;angles=pattern==='poison'?[0]:pattern==='poison-fork'?[-.18,.18]:pattern==='poison-cross'?[-.45,0,.45]:[-.6,-.3,0,.3,.6];
 }else{
  type=pattern.startsWith('cold')?'cold':'fire';speed=type==='cold'?145:170;damage=type==='cold'?8:9;const count=pattern==='cold-shift'||difficulty===3?5:3;
  angles=Array.from({length:count},(_,i)=>(i-(count-1)/2)*.24+(pattern==='cold-shift'?(step%2?.22:-.22):0));
 }
 return {angles,speed,damage,type,color:colors[type]};
}
