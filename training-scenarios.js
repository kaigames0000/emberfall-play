const scenarios={dummy:'不死木樁',pack:'密集敵群',spread:'分散敵群',counter:'反擊測試',elements:'元素承傷'};
const installed=Symbol.for('emberfall.training-scenarios.v80');
export function installTrainingScenarios(Game){
 const P=Game.prototype;if(P[installed])return;Object.defineProperty(P,installed,{value:true});
 const old=Object.fromEntries(['trainingPreview','resetTraining','kill','update','emit','trainingSummary'].map(k=>[k,P[k]]));
 P.trainingPreview=function(options={}){const base=old.trainingPreview.call(this,options);return {...base,scenario:Object.hasOwn(scenarios,options.scenario)?options.scenario:'dummy'};};
 P.resetTraining=function(options){const result=old.resetTraining.call(this,options);if(!result)return result;const t=this.training,s=t.options.scenario;t.simulatedKills=0;t.incoming=0;t.attackClock=1.5;t.elementIndex=0;this.drops=[];this.worldObjects.props=[];if(s==='pack'||s==='spread'){
  this.enemies=[];for(let i=0;i<8;i++){const angle=i/8*Math.PI*2,r=s==='spread'?260:65,e=this.spawn('melee',560+Math.cos(angle)*r,400+Math.sin(angle)*r);Object.assign(e,{trainingDummy:true,dummy:true,trainingFinite:true,trainingPrimary:i===0,hp:t.options.referenceHp,maxHp:t.options.referenceHp,name:'模擬敵群 '+(i+1),armor:t.options.armor,resistances:{...t.options.resistances},speed:0,cd:1e9});this.enemies.push(e);}
 }this.encounter.name='訓練 · '+scenarios[s];return result;};
 P.kill=function(e){const t=this.training;if(!t||!e.trainingFinite)return old.kill.call(this,e);if(!this.enemies.includes(e)||e._simulatedKilled)return;e._simulatedKilled=true;this.enemyCombat.cancel(e);this.rangerCombat.onKill(e);this.gameplay.onKill(e);this.enemies=this.enemies.filter(x=>x!==e);t.simulatedKills++;if(!this.enemies.length)this.finishTraining();};
 P.update=function(dt){const result=old.update.call(this,dt),t=this.training;if(!t||t.finished||this.mode!=='playing'||this.paused||this.transition||!['counter','elements'].includes(t.options.scenario))return result;t.attackClock-=dt;if(t.attackClock<=0){t.attackClock+=2;const type=t.options.scenario==='counter'?'physical':['fire','cold','lightning','poison'][t.elementIndex++%4],before=this.hp;this.damage(this.s.hp*(type==='physical'?.08:.18),type,'training');t.incoming+=Math.max(0,before-this.hp);}return result;};
 P.emit=function(name,...args){if(name==='dead'&&this.training){this.training.defeated=true;this.mode='playing';this.hp=1;this.finishTraining();return;}return old.emit.call(this,name,...args);};
 P.trainingSummary=function(){const result=old.trainingSummary.call(this);return result?{...result,simulatedKills:this.training.simulatedKills||0,incoming:this.training.incoming||0,defeated:!!this.training.defeated}:result;};
}
