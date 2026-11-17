import {CHAPTERS} from './chapter-data.js?v=108';
const diffs=[1,2,3],chapters=[1,2,3],array=a=>Array.isArray(a)&&a.length<=8&&new Set(a).size===a.length&&a.every(n=>Number.isInteger(n)&&n>=0&&n<8);
export const EXPANDED_CAMPAIGN_LAYERS=25;

function validExpandedProgress(progress){
 const hasKeys=(value,keys)=>!!value&&typeof value==='object'&&!Array.isArray(value)&&
  Object.keys(value).length===keys.length&&keys.every(key=>Object.hasOwn(value,key));
 return hasKeys(progress,diffs)&&diffs.every(d=>hasKeys(progress[d],chapters)&&chapters.every(ch=>{
  const layers=progress[d][ch];
  return Array.isArray(layers)&&layers.length<=EXPANDED_CAMPAIGN_LAYERS&&
   Array.from(layers).every((layer,index)=>layer===index);
 }));
}

export function validCampaign(c){const a=c.campaign;return !!a&&a.version===1&&a.progress&&diffs.every(d=>a.progress[d]&&chapters.every(ch=>array(a.progress[d][ch])))&&Array.isArray(a.unlockedDifficulties)&&a.unlockedDifficulties.includes(1)&&new Set(a.unlockedDifficulties).size===a.unlockedDifficulties.length&&a.unlockedDifficulties.every(d=>diffs.includes(d))&&(a.expandedProgress===undefined||validExpandedProgress(a.expandedProgress));}
export function ensureCampaign(c){
 if(!c.campaign){const raw=Object.getOwnPropertyDescriptor(c,'progress')?.value,legacy=raw||Object.fromEntries(diffs.map(d=>[d,c.best>=d?[0,1,2,3,4,5,6,7]:[]]));c.campaign={version:1,progress:Object.fromEntries(diffs.map(d=>[d,Object.fromEntries(chapters.map(ch=>[ch,ch===1?[...(legacy[d]||[])]:[]]))])),unlockedDifficulties:diffs.filter(d=>d===1||legacy[d-1]?.length===8)};}
 const view={};for(const d of diffs)Object.defineProperty(view,String(d),{enumerable:true,get(){return c.campaign?.progress[d][1]||[];},set(value){if(array(value))c.campaign.progress[d][1]=value;}});
 Object.defineProperty(c,'progress',{configurable:true,enumerable:false,get(){return view;},set(value){if(!this.campaign){delete this.progress;this.progress=value;ensureCampaign(this);return;}for(const d of diffs)if(array(value?.[d])){this.campaign.progress[d][1]=value[d];view[d]=value[d];}}});return c.campaign;
}
export function progressFor(c,d=1,ch=1){if(!diffs.includes(Number(d))||!chapters.includes(Number(ch)))return [];return c.campaign?.progress[d]?.[ch]??(Number(ch)===1?c.progress?.[d]??[]:[]);}
export function expandedProgressFor(c,d=1,ch=1){
 if(!diffs.includes(Number(d))||!chapters.includes(Number(ch)))return [];
 return c.campaign?.expandedProgress?.[d]?.[ch]??[];
}
export function canDifficulty(c,d){return diffs.includes(d)&&(d===1||c.campaign?.unlockedDifficulties.includes(d)||Object.values(CHAPTERS).filter(x=>x.available).every(ch=>progressFor(c,d-1,ch.id).length===8));}
export function canChapter(c,d,ch){return !!CHAPTERS[ch]?.available&&canDifficulty(c,d)&&(ch===1||progressFor(c,d,ch-1).length===8);}
function unlockFollowingDifficulty(c,d){
 if(d<3&&Object.values(CHAPTERS).filter(ch=>ch.available).every(ch=>progressFor(c,d,ch.id).length===8)&&
   !c.campaign.unlockedDifficulties.includes(d+1))c.campaign.unlockedDifficulties.push(d+1);
}
export function completeZone(c,d,room,ch=1){if(!diffs.includes(d)||!chapters.includes(ch)||!Number.isInteger(room)||room<0||room>7)return false;ensureCampaign(c);const a=c.campaign.progress[d][ch];if(!a.includes(room))a.push(room);a.sort((a,b)=>a-b);unlockFollowingDifficulty(c,d);return true;}

export function completeExpandedLayer(c,d,layer,ch=1){
 if(!diffs.includes(d)||!chapters.includes(ch)||!Number.isInteger(layer)||layer<0||layer>=EXPANDED_CAMPAIGN_LAYERS)return false;
 const completed=expandedProgressFor(c,d,ch).length;
 if(layer>completed)return false;
 if(layer<completed)return true;
 const campaign=ensureCampaign(c);
 campaign.expandedProgress??=Object.fromEntries(diffs.map(difficulty=>[difficulty,
  Object.fromEntries(chapters.map(chapter=>[chapter,[]]))]));
 campaign.expandedProgress[d][ch].push(layer);
 if(layer===EXPANDED_CAMPAIGN_LAYERS-1){
  const legacy=campaign.progress[d][ch];
  legacy.splice(0,legacy.length,0,1,2,3,4,5,6,7);
  unlockFollowingDifficulty(c,d);
 }
 return true;
}
