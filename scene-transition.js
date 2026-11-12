const chapterThemes=['ember','tide','star'];

function themeFor(game){
 if(game.mode==='camp')return 'camp';
 if(game.runContext&&game.runContext.kind!=='campaign')return 'rift';
 return chapterThemes[game.chapter-1]||'ember';
}

function ease(progress){
 const x=Math.max(0,Math.min(1,progress));
 return x*x*(3-2*x);
}

export function createSceneTransition(overlay){
 const veil=overlay.querySelector('.travel-veil');
 let lastProgress=-1;

 function clear(){
  if(!overlay.dataset.phase)return;
  overlay.classList.add('hidden');
  delete overlay.dataset.phase;
 }

 function frame(transition){
  if(!transition||overlay.dataset.phase!=='travel')return;
  const progress=1-transition.t/transition.max;
  if(progress===lastProgress)return;
  lastProgress=progress;
  const edge=Math.min(progress,1-progress);
  const ink=ease(edge/.4);
  veil.style.opacity=ink;
  veil.style.setProperty('--travel-ink-progress',ink);
 }

 function start(game){
  overlay.dataset.theme=themeFor(game);
  overlay.dataset.phase='travel';
  lastProgress=-1;
  frame(game.transition);
  overlay.classList.remove('hidden');
 }

 function reveal(game){
  overlay.dataset.theme=themeFor(game);
  overlay.dataset.phase='reveal';
  overlay.classList.remove('hidden');
 }

 veil.addEventListener('animationend',()=>{
  if(overlay.dataset.phase==='reveal')clear();
 });
 return {start,frame,reveal,clear};
}
