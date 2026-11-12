import {drawCharacter} from './character-model.js?v=130';
import {paintSprite} from './pixel-surface.js?v=108';

const INK='#171723',STEEL='#9eabc3';
const variants={
 artisan:{body:'#795860',dark:'#4c3544',trim:'#e6be87',cloth:'#a96959',helmet:'cap',weapon:'axe',armor:'medium',friendly:true},
 guide:{body:'#5b6389',dark:'#343354',trim:'#cbbedf',cloth:'#8884af',helmet:'hood',weapon:'staff',off:'tome',armor:'robe',friendly:true},
 melee:{body:'#635766',dark:'#322c3b',trim:'#b89b8f',cloth:'#98534d',helmet:'hood',weapon:'sword'},
 shield:{body:'#76758b',dark:'#38354a',trim:'#dfb77e',cloth:'#a57253',helmet:'visor',weapon:'sword',off:'towerShield',armor:'heavy'},
 elite:{body:'#777895',dark:'#38354a',trim:'#ecc38a',cloth:'#ac6258',helmet:'visor',weapon:'greatsword',off:'shield',armor:'heavy'},
 archer:{body:'#996943',dark:'#483332',trim:'#efbf82',cloth:'#cfa368',helmet:'hood',weapon:'bow',off:'quiver',bone:true},
 caster:{body:'#745d87',dark:'#372946',trim:'#caa4e4',cloth:'#ac72ca',helmet:'hat',weapon:'wand',armor:'robe',bone:true},
 summoner:{body:'#6b497e',dark:'#39263d',trim:'#e3a1ee',cloth:'#a45fca',helmet:'hood',weapon:'staff',off:'tome',armor:'robe',bone:true},
 charger:{body:'#944e4a',dark:'#4e2b39',trim:'#ffba7e',cloth:'#c65e52',helmet:'horns',weapon:'greataxe',armor:'heavy'},
 skirmisher:{body:'#4b596d',dark:'#2d3445',trim:'#b8a4cd',cloth:'#8f6aa7',helmet:'hood',weapon:'dagger',off:'dagger'},
 bomber:{body:'#8c6238',dark:'#3e2c2c',trim:'#ffc782',cloth:'#bc7848',helmet:'hood',weapon:'wand'},
 wraith:{body:'#456e91',dark:'#1b3653',trim:'#92deee',cloth:'#66b8d5',helmet:'hood',weapon:'dagger',armor:'robe',bone:true},
 skeleton:{body:'#74626b',dark:'#40313c',trim:'#efd3a6',cloth:'#9b7168',helmet:'none',weapon:'axe',bone:true},
 boss:{body:'#65536a',dark:'#32243e',trim:'#ffd29c',cloth:'#bb4554',helmet:'crown',weapon:'greatsword',armor:'heavy',bone:true},
 knight:{body:'#668a94',dark:'#304552',trim:'#d4ece4',cloth:'#85aeae',helmet:'visor',weapon:'sword',off:'shield',armor:'heavy'},
};
const miniTypes={jailer:'elite',priest:'summoner',anchor:'shield',tidalpriest:'summoner',foreman:'caster',icemirror:'wraith',thunderhunter:'charger',gatekeeper:'elite'};
const palettes=[
 ['#616079','#bd4554','#ffd29c'],
 ['#416a79','#3d9697','#c3e3d3'],
 ['#525588','#7562a5','#e1c5f4']
];
const phase=(n)=>((Math.floor(n)%4)+4)%4;
const forgeWeapon=(type,trim,gem)=>type?{type,trim,color:['bow','staff','wand'].includes(type)?'#b48760':STEEL,gem}:null;

function enemyLook(kind,chapter){
 const base=variants[kind]||variants.melee;
 const [body,cloth,trim]=palettes[(chapter||1)-1]||palettes[0];
 const spec=kind==='boss'?{...base,body,cloth,trim}:base;
 return {
  armor:spec.armor||'light',helmet:spec.helmet,helmetColor:spec.body,helmetTrim:spec.trim,
  dark:spec.dark,body:spec.body,trim:spec.trim,cloth:spec.cloth,boots:spec.dark,gloves:spec.body,
  cloak:{visible:kind!=='skeleton',color:spec.cloth,trim:spec.dark},amulet:kind==='summoner'||kind==='boss',
  head:spec.friendly?'hero':spec.bone?'bone':'shade',eye:spec.friendly?'#54405b':kind==='knight'?'#d4fff4':kind==='wraith'?'#9aefff':'#ff7c76',
  main:forgeWeapon(spec.weapon,spec.trim,kind==='summoner'?'#d59cf8':spec.cloth),
  off:forgeWeapon(spec.off,spec.trim,spec.cloth)
 };
}

export function drawPixelEnemy(ctx,enemy,chapter,time,smooth=false,bodyScale=1){
 const boss=enemy.type==='boss',mini=enemy.type==='miniboss';
 const kind=mini?(miniTypes[enemy.minibossKey]||'elite'):enemy.type;
 const facing=Math.cos(enemy.angle||0)<0?-1:1,back=Math.sin(enemy.angle||0)<-.7;
 const step=phase(time*5+enemy.x*.03);
 const flash=enemy.flash>0,scale=(boss?1.72:mini?1.37:1)*bodyScale;
 if(enemy.staticObject){
  paintSprite(ctx,'enemy:crystal:'+flash,enemy.x,enemy.y,1.15,c=>{
   shadow(c);
   crystal(c,-12,-18,9,18,'#7576b8','#b0ccfa');
   crystal(c,13,-16,9,17,'#6269a9','#a0c6ef');
   crystal(c,0,-28,13,29,flash?'#d9f7ff':'#8b9eda','#c8f2ff');
  },smooth?false:undefined);
  return;
 }
 if(enemy.minibossKey==='nest'){
  paintSprite(ctx,'enemy:nest:'+step,enemy.x,enemy.y,1.35,c=>creature(c,'nest',step),smooth?false:undefined);
  return;
 }
 paintSprite(ctx,'enemy:'+kind+':'+chapter+':'+facing+':'+back+':'+step+':'+flash,enemy.x,enemy.y,scale,c=>{
  const v=enemyLook(kind,chapter);
  if(flash){v.trim='#fff3dc';v.eye='#fff3dc';}
  drawCharacter(c,v,{angle:back?(facing>0?-.84:-2.30):(facing>0?-.3:3.44),time:step*.19,moving:true});
 },smooth?false:undefined);
}

function poly(c,points,color,outline=INK){
 c.beginPath();
 for(const [index,[x,y]] of points.entries())index?c.lineTo(x,y):c.moveTo(x,y);
 c.closePath();c.fillStyle=color;c.fill();
 if(outline){c.strokeStyle=outline;c.lineWidth=3;c.stroke();}
}
function box(c,x,y,w,h,color){c.fillStyle=color;c.fillRect(x,y,w,h);}
function crystal(c,x,y,w,h,color,light){
 poly(c,[[x,y-h],[x+w,y-3],[x+w*.56,y+h*.7],[x,y+h],[x-w,y+3]],color);
 poly(c,[[x,y-h+3],[x+w*.47,y-2],[x,y+h-3],[x-w*.28,y+3]],light,null);
}
function shadow(c,w=26){
 box(c,-w,11,w*2,7,'#12122177');box(c,-w+5,8,(w-5)*2,13,'#12122177');
}

function golem(c,kind,step){
 shadow(c,31);
 const ice=kind==='frost_golem',l=ice?'#a5e0f4':'#bdb0b8',m=ice?'#5d8fa7':'#827982',d=ice?'#375470':'#4d475d',glow=ice?'#e0fbff':'#65ded6';
 for(const side of [-1,1]){
  const y=side*(step===1?3:step===3?-3:0);
  c.save();c.scale(side,1);
  poly(c,[[7,-8],[20,-10],[22,0+y],[17,7+y],[20,15+y],[7,16+y],[4,9+y]],m);
  poly(c,[[9,1+y],[18,1+y],[15,8+y],[8,10+y]],l,null);
  poly(c,[[14,-42],[26,-43],[33,-31],[29,-19],[34,-13],[29,-2],[18,-5],[14,-15],[18,-27]],m);
  poly(c,[[17,-39],[24,-40],[30,-32],[24,-25],[16,-28]],l,null);
  poly(c,[[24,-23],[29,-19],[25,-11],[29,-7],[24,-5],[19,-9]],d,null);
  c.restore();
 }
 poly(c,[[-19,-39],[-10,-46],[11,-45],[20,-38],[20,-22],[11,-12],[-12,-11],[-20,-23]],m);
 poly(c,[[-16,-37],[-8,-42],[-2,-29],[-7,-17],[-16,-23]],l,null);
 poly(c,[[14,-36],[18,-29],[13,-17],[5,-13],[2,-28]],d,null);
 crystal(c,1,-29,9,12,glow,ice?'#b8efff':'#ddfff0');
 poly(c,[[-12,-44],[-15,-55],[-7,-63],[9,-62],[15,-54],[10,-45],[7,-41],[-7,-41]],m);
 poly(c,[[-10,-54],[-5,-60],[8,-59],[10,-55],[-1,-54]],l,null);
 box(c,-9,-51,19,5,d);box(c,-7,-50,5,2,glow);box(c,3,-50,5,2,glow);
 if(kind==='titan')for(const x of [-24,0,24])crystal(c,x,-51,4,11,'#bea7dc','#f2daff');
}

function spirit(c,kind,step){
 shadow(c,22);
 const bob=[0,-3,-6,-3][step];
 c.translate(0,bob);
 if(kind==='ward_spirit'){
  for(const [x,y] of [[-20,-16],[18,-32],[23,-4]])crystal(c,x,y,4,8,'#57aabe','#b7f5ff');
  poly(c,[[0,-52],[21,-40],[17,-12],[0,7],[-17,-12],[-21,-40]],'#547f9f');
  poly(c,[[0,-46],[16,-37],[13,-15],[0,0],[-13,-15],[-16,-37]],'#80c4db','#acdbe1');
  box(c,-2,-37,4,27,'#eff0bc');box(c,-11,-27,22,4,'#fff5c3');
  return;
 }
 if(['mist_thunder','storm_spirit','storm_blade','lightning_blade'].includes(kind)){
  poly(c,[[-26,-20],[-27,-32],[-17,-38],[-11,-48],[3,-51],[13,-45],[21,-44],[28,-35],[28,-24],[21,-17],[7,-17],[-4,-13],[-16,-15]],'#584b82');
  poly(c,[[-24,-30],[-15,-37],[-9,-45],[3,-48],[12,-42],[20,-40],[23,-36],[13,-37],[5,-34],[-6,-39],[-11,-30]],'#897ab1',null);
  poly(c,[[-15,-25],[-5,-21],[0,-23],[9,-20],[18,-29],[14,-19],[3,-16],[-5,-18]],'#f8c879',null);
  poly(c,[[4,-19],[-6,-3],[1,-4],[-4,12],[11,-8],[3,-7],[10,-19]],'#f7cb6b','#a36151');
  box(c,19,-52,3,7,'#ffdf99');box(c,-23,-48,3,7,'#f3d7a9');return;
 }
 const ice=kind!=='fire_spirit',god=kind==='ice_god'||kind==='thunder_god',thunder=kind==='thunder_god';
 const color=thunder?'#9a7ec9':ice?'#61a4d2':'#c76855',dark=thunder?'#49396e':ice?'#344f85':'#663647',pale=thunder?'#ffe0a0':ice?'#d7f7ff':'#ffdd91';
 for(const [x,y] of [[-25,-25],[25,-16],[20,-48],[-22,-49]])if(god||Math.abs(x)===25)crystal(c,x,y,god?5:4,god?14:9,color,pale);
 poly(c,[[-18,4],[-14,-18],[-18,-39],[-14,-51],[0,-57],[14,-52],[20,-41],[15,-19],[22,4],[12,10],[6,2],[0,15],[-8,3],[-14,10]],dark);
 poly(c,[[-13,-35],[-7,-37],[-3,-23],[-12,-11],[-15,0],[-7,1],[0,-8],[6,2],[15,1],[10,-15],[5,-26],[10,-40]],color,null);
 poly(c,[[-12,-44],[-8,-51],[8,-51],[13,-43],[9,-34],[-7,-34]],'#f4d0c4');
 poly(c,[[-15,-46],[-12,-55],[2,-59],[13,-55],[16,-46],[9,-50],[7,-44],[3,-49],[-2,-44],[-5,-51],[-10,-42]],pale);
 box(c,-7,-43,3,4,dark);box(c,3,-43,3,4,dark);box(c,-5,-42,1,1,'#fff6df');box(c,4,-42,1,1,'#fff6df');
 crystal(c,0,-24,6,10,color,pale);crystal(c,0,-58,god?4:3,god?16:10,color,pale);
 if(god)for(const x of [-11,11])crystal(c,x,-55,4,10,color,pale);
}
function creature(c,kind,step){
 if(kind==='nest'){
  shadow(c,29);
  for(const sign of [-1,1])for(let i=0;i<3;i++){
   const x=sign*(14+i*5),y=-14+i*8;
   poly(c,[[x,y],[x+sign*17,y-7],[x+sign*23,y+5+step],[x+sign*12,y+2],[x,y+8]],'#78814d');
  }
  poly(c,[[-26,-15],[-21,-41],[-11,-52],[0,-46],[14,-55],[23,-36],[27,-12],[11,7],[-13,7]],'#69744b');
  for(const [x,y] of [[-13,-23],[3,-37],[13,-13]])crystal(c,x,y,7,11,'#9aaa5d','#d9efab');
  return;
 }
 const bird=kind==='eagle'||kind==='hawk',bear=kind==='bear',wolf=!bird&&!bear;
 shadow(c,bear?31:23);
 if(bird){
  const wing=step===0?-12:step===2?12:0;
  poly(c,[[-10,-26],[-22,-32-wing],[-42,-39-wing],[-35,-15-wing],[-17,-11],[-4,-17],[13,-14],[19,-19],[25,-18],[21,-27],[12,-30]],'#885c48');
  poly(c,[[-33,-31-wing],[-23,-30-wing],[-13,-23],[-9,-18],[-21,-19-wing],[-30,-21-wing]],'#cda678',null);
  box(c,17,-24,4,2,'#f9dc96');return;
 }
 const body=bear?'#88634e':'#62738b',light=bear?'#c39773':'#a9bdc9',dark=bear?'#533c3d':'#3e526b';
 poly(c,[[-24,0],[-30,-15],[-23,-22],[-22,-26],[-10,-32],[3,-32],[10,-40],[17,-39],[24,-35],[26,-26],[34,-23],[29,-14],[21,-13],[17,7],[9,11],[6,-3],[-12,-3],[-14,9],[-23,10]],body);
 poly(c,[[-23,-24],[-12,-30],[3,-30],[9,-23],[-8,-15],[-19,-13]],light,null);
 poly(c,[[10,-36],[18,-37],[25,-29],[26,-22],[32,-21],[25,-16],[17,-21]],light,null);
 box(c,18,-30,4,3,'#e9f4cf');box(c,27,-23,5,3,INK);
 if(wolf)poly(c,[[8,-36],[8,-50],[17,-39],[23,-45],[24,-34]],body);
 poly(c,[[-12,-1],[-11,9],[-17,10],[-19,1]],dark,null);
}

function supportSpirit(c,kind,step){
 shadow(c,20);
 c.translate(0,[0,-3,-5,-3][step]);
 if(kind==='ward_lantern'){
  poly(c,[[-7,-45],[-7,-50],[7,-50],[7,-45],[4,-45],[4,-47],[-4,-47],[-4,-45]],'#d2e5bd');
  poly(c,[[-13,-42],[13,-42],[20,-29],[14,-12],[8,-7],[-8,-7],[-14,-12],[-20,-29]],'#617f81');
  poly(c,[[-12,-37],[12,-37],[15,-27],[10,-14],[-10,-14],[-15,-27]],'#98c7a7',null);
  poly(c,[[-8,-28],[0,-32],[8,-28],[6,-20],[0,-16],[-6,-20]],'#e0efb7','#608783');
  box(c,-9,-12,18,4,'#bfc18f');
 }else{
  poly(c,[[-15,-39],[-10,-45],[10,-45],[15,-39],[21,-29],[12,-20],[15,-8],[-15,-8],[-12,-20],[-21,-29]],'#634d83');
  poly(c,[[-13,-37],[0,-41],[13,-37],[10,-25],[0,-19],[-10,-25]],'#8f74b2',null);
  box(c,-9,-32,5,3,'#e9b8fa');box(c,4,-32,5,3,'#e9b8fa');
  poly(c,[[-5,-17],[5,-17],[0,-11]],'#db95f1',null);
  box(c,-16,-8,32,4,'#997ab4');
 }
}

export function drawPixelSummon(ctx,ally,time,smooth=false,bodyScale=1){
 const {kind,x,y}=ally,step=phase(time*6+x*.035);
 const size=(kind==='titan'?1.34:kind.endsWith('_god')?1.17:1)*bodyScale;
 const facing=(ally.followTarget?ally.followTarget.x-x:Math.cos(ally.angle??0))<0?-1:1;
 paintSprite(ctx,'summon:'+kind+':'+step+':'+facing,x,y,size,c=>{
  c.scale(facing,1);
  if(kind==='ward_lantern'||kind==='hex_idol')supportSpirit(c,kind,step);
  else if(['earth_golem','frost_golem','titan'].includes(kind))golem(c,kind,step);
  else if(kind==='knight')drawCharacter(c,enemyLook('knight',1),{angle:.25,time:step*.19,moving:true});
  else if(kind.includes('wolf')||kind.includes('bear')||kind.includes('eagle')||kind.includes('hawk')){
   creature(c,kind.includes('wolf')?'wolf':kind.includes('bear')?'bear':'eagle',step);
  }else spirit(c,kind,step);
 },smooth?false:undefined);
}
