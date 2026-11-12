import {bplusImage,drawBplus} from './bplus-art.js?v=124';
import {warmSkillSprites} from './skill-sprites.js?v=125';

export function warmAnimeArt(){
 for(const sprite of ['artisan','collector','guide','registrar','ash-infantry','shield-knight','bone-caster','golem','ice-spirit','storm-cloud'])bplusImage('units/'+sprite+'.webp');
 warmSkillSprites();
}
function shadow(c,x,y,w){
 c.save();c.beginPath();c.ellipse(x,y+4,w,w*.27,0,0,Math.PI*2);c.fillStyle='#11172072';c.fill();c.restore();
}

const figures={
 melee:['ash-infantry',62],skirmisher:['ash-infantry',56,'hue-rotate(20deg)'],
 charger:['shield-knight',68,'sepia(.18) saturate(1.3)'],shield:['shield-knight',65],
 elite:['shield-knight',74],summoner:['bone-caster',69],caster:['bone-caster',62,'hue-rotate(17deg)'],
 knight:['shield-knight',64,'hue-rotate(24deg)'],bomber:['ash-infantry',59,'sepia(.28)'],
 archer:['ash-archer',63],wraith:['wraith',64],skeleton:['skeleton',57],
 earth_golem:['golem',69],frost_golem:['golem',70,'hue-rotate(80deg)'],
 titan:['titan',91],frost_spirit:['ice-spirit',66],mist_ice:['ice-spirit',66],
 ice_god:['ice-god',86],fire_spirit:['ice-spirit',65,'hue-rotate(190deg) saturate(1.2)'],
 thorn_construct:['golem',61,'hue-rotate(326deg)'],
 mist_thunder:['storm-cloud',62],lightning_blade:['storm-cloud',63],
 storm_blade:['storm-cloud',63],storm_spirit:['storm-cloud',62],
 ward_spirit:['floating-ward',55],wolf:['wolf',54],bear:['bear',65],
 eagle:['eagle',57],hawk:['eagle',57],thunder_god:['thunder-god',86]
};
const minibosses={
 jailer:['shield-knight',92],priest:['bone-caster',92],nest:['spore-nest',89],
 anchor:['shield-knight',92,'hue-rotate(120deg)'],tidalpriest:['bone-caster',93,'hue-rotate(130deg)'],
 foreman:['ash-archer',90,'sepia(.24)'],icemirror:['ice-god',91],
 thunderhunter:['thunder-god',91],gatekeeper:['shield-knight',94,'hue-rotate(220deg)']
};
const bosses=[['crowned-boss',106],['harbor-king',109],['astral-monarch',108]];
const npcSprites=new Set(['artisan','collector','guide','registrar']);

export function paintBplusNPC(c,id,x,y,size){
 if(!npcSprites.has(id))return false;
 return drawBplus(c,'units/'+id+'.webp',x,y,size*1.25,size);
}

export function drawAnimeUnit(c,actor,time,ally=false,chapter=1,bodyScale=1){
 if(actor.staticObject)return drawBplus(c,'props/interact-crystal.webp',actor.x,actor.y+5,54,67);
 const type=actor.kind??actor.type;
 const figure=type==='boss'?bosses[chapter-1]??bosses[0]:type==='miniboss'?minibosses[actor.minibossKey]??minibosses.jailer:figures[type];
 if(!figure)return false;
 const [sprite,height,tone]=figure,path='units/'+sprite+'.webp';
 if(!bplusImage(path))return false;
 const direction=ally&&actor.followTarget?actor.followTarget.x-actor.x:Math.cos(actor.angle||0);
 const motion=Math.sin(time*(ally?4:6))*Math.min(1.8,height*.025);
 const size=height*bodyScale;
 c.save();
 c.imageSmoothingEnabled=true;
 if(tone)c.filter=typeof c.filter==='string'&&c.filter!=='none'?`${tone} ${c.filter}`:tone;
 const drawn=drawBplus(c,path,actor.x,actor.y+motion*bodyScale,size*1.5,size,{flip:direction<0});
 c.restore();
 return drawn;
}

export function drawAnimePickup(c,x,y,color,size=7){
 c.save();c.translate(x,y);
 c.beginPath();c.moveTo(0,-size);c.lineTo(size*.72,0);c.lineTo(0,size);c.lineTo(-size*.72,0);c.closePath();
 c.fillStyle=color;c.fill();c.lineWidth=1;c.strokeStyle='#fff9e9';c.stroke();
 c.beginPath();c.moveTo(0,-size*.58);c.lineTo(0,size*.35);c.stroke();
 c.restore();
}

export function drawAnimeProp(c,prop){
 const {x,y,kind,used}=prop;
 c.save();c.translate(x,y);c.globalAlpha*=used?.35:1;shadow(c,0,6,23);
 const grad=c.createLinearGradient(-18,-19,13,12);
 grad.addColorStop(0,'#b69479');grad.addColorStop(.44,'#6c514c');grad.addColorStop(1,'#332837');
 c.fillStyle=grad;c.strokeStyle='#d2b297';c.lineWidth=1.3;
 if(kind==='chest'||kind==='crate'){
  c.beginPath();c.roundRect(-19,-17,38,27,[5,5,2,2]);c.fill();c.stroke();
  c.beginPath();c.moveTo(-19,-6);c.lineTo(19,-6);c.moveTo(-13,-16);c.lineTo(-13,9);c.moveTo(13,-16);c.lineTo(13,9);c.stroke();
  if(kind==='chest'){c.fillStyle='#ebc692';c.fillRect(-4,-8,8,8);c.fillStyle='#43323b';c.fillRect(-1,-6,2,4);}
 }else{
  c.beginPath();c.moveTo(-10,-18);c.lineTo(10,-18);c.bezierCurveTo(21,-3,17,11,0,12);c.bezierCurveTo(-17,11,-21,-3,-10,-18);c.fill();c.stroke();
  c.beginPath();c.ellipse(0,-16,10,4,0,0,Math.PI*2);c.fill();c.stroke();
 }
 c.restore();
}
