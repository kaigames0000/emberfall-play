const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const GUARDIANS={1:{name:'焚界守衛・燼冠',type:'fire',counter:'環形預警保留內圈安全區'},2:{name:'沉淵守衛・潮鐐',type:'poison',counter:'毒潮與冰潮交錯，保留潮線缺口'},3:{name:'裂星守衛・雷鏡',type:'lightning',counter:'雷陣交替左右落下'}};
export class EndgameCombat{
 constructor(g){this.g=g;this.timer=3;this.stage=1;this.seen=new Set();}
 decorate(e){const x=this.g.runContext;if(x?.kind!=='endgame')return e;const risk=clamp(x.challenge||1,1,3);e.hp=e.maxHp*=([0,1.1,1.4,1.75][risk]);e.damageScale*=([0,1.05,1.18,1.32][risk]);if(e.type==='boss'){const d=GUARDIANS[x.guardian]||GUARDIANS[3];e.name=x.final?'界隙之心':d.name;e.defenseAffinity=d.type;e.endGuardian=true;if(x.final){e.hp=e.maxHp*=1.6;e.damageScale*=1.1;}}return e;}
 update(dt){const g=this.g,x=g.runContext;if(x?.kind!=='endgame'||g.cleared||g.mode!=='playing')return;const boss=g.enemies.find(e=>e.endGuardian&&e.hp>0);if(!boss)return;const phase=boss.hp/boss.maxHp<.33?3:boss.hp/boss.maxHp<.66?2:1;this.stage=phase;
  if(x.final&&phase>1&&!this.seen.has(phase)){this.seen.add(phase);for(let n=0;n<3&&g.enemies.length<12;n++){const e=g.addEnemy(phase===2?'shield':'caster',330+n*230,230);e.summoned=true;}g.float(boss.x,boss.y-60,'界隙・'+phase+'相','#c6a3df');}
  this.timer-=dt;if(this.timer>0)return;this.timer=Math.max(2.4,5-(phase-1)*.6-(x.challenge-1)*.3);const type=x.final?(phase===1?1:phase===2?2:3):x.guardian||3,d=GUARDIANS[type],damage=boss.damageScale*22*(1-(boss.auraWeaken||0));
  if(type===1){const p={...g.player};for(let n=0;n<8&&g.hazards.length<56;n++){const a=n*Math.PI/4;g.hazard(p.x+Math.cos(a)*135,p.y+Math.sin(a)*135,48,damage,1.05,d.type);}}
  if(type===2){const gap=Math.floor(g.rand()*4);for(let row=0;row<2;row++)for(let col=0;col<5&&g.hazards.length<56;col++){if(col===gap)continue;g.hazard(160+col*190,300+row*170,62,damage,1.25+row*.5,row?'cold':d.type);}}
  if(type===3){this.left=!this.left;for(let n=0;n<4&&g.hazards.length<56;n++)g.hazard(this.left?270:850,210+n*135,75,damage,1.1,d.type);}
 }
}
