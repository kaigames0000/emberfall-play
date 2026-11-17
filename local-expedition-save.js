import {settlePaidRun} from './model.js?v=158';
export {clearCampaignCheckpoints} from './campaign-checkpoint.js?v=158';

export function settleInterruptedPaidRun(profile){
 const run=profile.rifts?.activeRun;
 if(!run)return null;
 const outcome=run.status==='won'?'won':'abandoned',result=settlePaidRun(profile,outcome);
 if(result.ok&&outcome==='won'){
  // A previously won room may still have banked gold on the floor.
  const gold=(run.checkpoint?.worldObjects?.pickups??[]).filter(p=>p.kind==='gold').reduce((sum,p)=>sum+p.amount,0);
  const hero=result.profile.characters[run.heroId];
  hero.gold=Math.min(1e12,hero.gold+gold);
 }
 return result;
}

export function takePaidRunLock(locks,{wait=false,signal}={}){
 return new Promise((resolve,reject)=>{
  const options=wait&&signal?{signal}:{ifAvailable:!wait};
  Promise.resolve(locks.request('emberfall-paid-run',options,lock=>{
   if(!lock){resolve(null);return;}
   return new Promise(release=>resolve(release));
  })).catch(reject);
 });
}
