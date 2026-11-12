import {RELEASE_NOTES} from './release-notes.mjs?v=147';
import {renderReleaseHistory,upcomingReleaseNote} from './release-history.js?v=134';

// Browser/PWA only. The portable edition omits this module and keeps its saves.
if(['http:','https:'].includes(location.protocol)){
 const dialog=document.querySelector('#install-help'),tools=document.querySelector('.game-top-tools');
 if(dialog&&tools){
  const version=document.querySelector('meta[name="emberfall-version"]')?.content||'未知';
  const revision=Number(document.querySelector('meta[name="emberfall-release"]')?.content||0);
  const supported=window.isSecureContext&&'serviceWorker'in navigator;
  let registration=null,waiting=null,latest=null,phase='idle',message='連線時會自動檢查更新。';
  let checking=null,lastCheck=0,applying=false,reloaded=false,activationTimer=null;
  let renderedNote;
  const observed=new WeakSet();
  const style=document.createElement('style');style.textContent=`
   #install-help{max-height:90dvh;overflow-y:auto;width:min(520px,calc(100vw - 32px))}
   #install-help[data-mode=updates]>p{display:none}
   .game-update-section{margin:0 12px 12px;padding-top:10px;border-top:1px solid #43503b;display:grid;gap:8px}
   .game-update-version{display:flex;justify-content:space-between;gap:8px;font-size:11px;color:#aaa98f}
   #game-update-status{font-size:12px;line-height:1.5;color:#c8cebd}
   .game-update-actions{display:flex;gap:6px;flex-wrap:wrap}
   .game-update-actions button{min-height:32px;padding:5px 10px;font-size:12px;border:1px solid #6b6246}
   .game-update-actions button:disabled{opacity:.5;cursor:default}
   .game-update-actions button[hidden],#game-update-indicator[hidden]{display:none}
   #game-update-indicator{width:auto;min-width:40px;padding:0 8px;color:#e4c788;font-size:11px;border-color:#bba063}
  `;document.head.append(style);
  const section=document.createElement('section');section.className='game-update-section';section.setAttribute('aria-label','版本更新');
  section.innerHTML='<div class="game-update-version"><span id="game-update-current"></span><span id="game-update-latest"></span></div><div id="game-update-status" role="status" aria-live="polite"></div><div class="game-update-actions"><button type="button" id="game-update-check">檢查更新</button><button type="button" id="game-update-apply" hidden>儲存並更新</button></div><section class="game-update-history" aria-labelledby="game-update-history-heading"><h3 id="game-update-history-heading">更新紀錄</h3><div class="release-history" id="game-update-history"></div></section>';
  dialog.append(section);
  const indicator=document.createElement('button');indicator.id='game-update-indicator';indicator.type='button';indicator.hidden=true;indicator.textContent='新版';indicator.title='新版已下載，查看更新';indicator.setAttribute('aria-label','新版已下載，查看更新');tools.prepend(indicator);
  const current=section.querySelector('#game-update-current'),latestLabel=section.querySelector('#game-update-latest');
  const status=section.querySelector('#game-update-status'),checkButton=section.querySelector('#game-update-check'),applyButton=section.querySelector('#game-update-apply');
  const history=section.querySelector('#game-update-history');
  current.textContent='目前 v'+version;
  const validRelease=value=>value?.schema===1&&/^\d+\.\d+\.\d+$/.test(value.version)&&Number.isSafeInteger(value.revision)&&value.revision>0&&/^[a-f0-9]{20}$/.test(value.build);
  function render(){
   status.textContent=message;status.dataset.state=phase;
   checkButton.disabled=!!checking||applying||!supported;
   checkButton.textContent=checking?'檢查中…':'檢查更新';
   applyButton.hidden=!waiting;applyButton.disabled=applying||!!checking;
   applyButton.textContent=applying?'正在更新…':'儲存並更新';
   indicator.hidden=false;
   indicator.textContent=waiting?'新版可更新':'版本與更新';
   indicator.title=waiting?'新版已下載，查看更新':'查看版本與檢查更新';
   indicator.setAttribute('aria-label',indicator.title);
   document.querySelector('#settings')?.classList.toggle('has-update',!!waiting);
   dialog.querySelector('.modal-close').disabled=applying;
   latestLabel.textContent=latest?'最新 v'+latest.version:'';
   const incoming=upcomingReleaseNote(latest,revision),noteStamp=JSON.stringify(incoming);
   if(renderedNote!==noteStamp){
    renderReleaseHistory(history,RELEASE_NOTES,incoming);
    renderedNote=noteStamp;
   }
  }
  function setStatus(next,text){phase=next;message=text;render();}
  function request(worker,type,timeout=5000){
   return new Promise((resolve,reject)=>{
    if(!worker){reject(Error('worker-unavailable'));return;}
    const channel=new MessageChannel();
    const finish=(error,value)=>{clearTimeout(timer);channel.port1.close();channel.port2.close();error?reject(error):resolve(value);};
    const timer=setTimeout(()=>finish(Error('worker-timeout')),timeout);
    channel.port1.onmessage=event=>finish(null,event.data);
    try{worker.postMessage({type},[channel.port2]);}catch(error){finish(error);}
   });
  }
  function withDeadline(promise,timeout){
   return new Promise((resolve,reject)=>{
    const timer=setTimeout(()=>reject(Error('update-timeout')),timeout);
    promise.then(value=>{clearTimeout(timer);resolve(value);},error=>{clearTimeout(timer);reject(error);});
   });
  }
  async function findWaiting(){
   const candidate=registration?.waiting;
   if(!candidate||candidate.state!=='installed'){waiting=null;return false;}
   try{
    const response=await request(candidate,'EMBERFALL_RELEASE');
    if(candidate!==registration?.waiting||!response.ok||!validRelease(response.release))return false;
    waiting=candidate;latest=response.release;
    setStatus('ready','新版已下載。回到營地後，可儲存進度並更新。');return true;
   }catch{return false;}
  }
  function observe(reg){
   if(!reg||observed.has(reg))return;
   registration=reg;observed.add(reg);
   const watch=()=>{
    const worker=reg.installing;
    if(worker)worker.addEventListener('statechange',()=>{
     if(worker.state==='installed')void findWaiting();
     if(worker.state==='redundant'&&!waiting)setStatus('error','新版下載未完成，仍可繼續目前版本；稍後再試。');
    });
   };
   reg.addEventListener('updatefound',watch);watch();void findWaiting();
  }
  async function check(manual=false){
   if(checking)return checking;
   if(!supported){setStatus('unsupported','請使用 HTTPS 網址開啟，才能檢查及安裝更新。');return;}
   if(!manual&&(document.hidden||Date.now()-lastCheck<60000))return;
   lastCheck=Date.now();
   checking=(async()=>{
    setStatus('checking','正在檢查版本…');
    try{
     const reg=registration||await navigator.serviceWorker.getRegistration(new URL('./',import.meta.url));observe(reg);
     if(!registration)throw Error('registration-unavailable');
     if(navigator.onLine===false)throw Error('offline');
     // This file is deliberately outside the service worker's cached shell.
     const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),10000);
     let remote;
     try{
      const url=new URL('./version.json',import.meta.url);url.searchParams.set('check',String(Date.now()));
      const response=await fetch(url,{cache:'no-store',signal:controller.signal});
      if(!response.ok)throw Error('version-unavailable');remote=await response.json();
      if(!validRelease(remote))throw Error('invalid-release');
     }finally{clearTimeout(timer);}
     latest=remote;
     await withDeadline(registration.update(),12000);
     if(await findWaiting())return;
     if(registration.installing){setStatus('downloading','發現新版，正在下載完整遊戲內容；完成後會顯示更新按鈕。');return;}
     const active=await request(navigator.serviceWorker.controller||registration.active,'EMBERFALL_RELEASE');
     if(active?.release?.build===remote.build&&remote.revision===revision)setStatus('current','目前已是最新版本。');
     else setStatus('pending','版本正在發布，尚未取得完整新版；可繼續遊玩，稍後再檢查。');
    }catch{
     if(!await findWaiting())setStatus('error','目前無法連線檢查版本。原有遊戲與存檔仍可使用，連線後再試。');
    }
   })();
   render();try{await checking;}finally{checking=null;render();}
  }
  function open(){
   dialog.dataset.mode='updates';
   if(!dialog.open){dialog.showModal();dialog.scrollTop=0;}
   window.dispatchEvent(new CustomEvent('emberfall:pwa-overlay',{detail:{open:true}}));
   void check(true);
  }
  checkButton.addEventListener('click',()=>void check(true));
  dialog.addEventListener('close',()=>delete dialog.dataset.mode);
  dialog.addEventListener('cancel',event=>{if(applying)event.preventDefault();});
  indicator.addEventListener('click',open);
  window.addEventListener('emberfall:updates-open',open);
  window.addEventListener('emberfall:pwa-registration',event=>{observe(event.detail?.registration);});
  applyButton.addEventListener('click',async()=>{
   if(applying||!waiting)return;
   const result={ok:false,reason:'遊戲尚未準備完成，請稍後再試。'};
   applying=true;setStatus('saving','正在儲存進度…');
   window.dispatchEvent(new CustomEvent('emberfall:update-save',{detail:result}));
   try{if(result.pending)await withDeadline(result.pending,15000);}catch{result.ok=false;result.reason='儲存尚未完成，已取消更新。';}
   if(!result.ok){applying=false;setStatus('blocked',result.reason);return;}
   if(!navigator.serviceWorker.controller){applying=false;setStatus('blocked','請關閉所有遊戲視窗再重新開啟，完成首次安裝。');return;}
   applying=true;setStatus('applying','進度已儲存，正在套用新版…');
   try{
    const response=await request(waiting,'EMBERFALL_APPLY_UPDATE');
    if(!response.ok)throw Error(response.reason);
    activationTimer=setTimeout(()=>{applying=false;setStatus('error','更新未能完成，請關閉所有遊戲視窗後重新開啟。');},12000);
   }catch(error){
    applying=false;setStatus('blocked',error.message==='other-windows'?'請先關閉其他遊戲分頁或安裝版視窗，再按「儲存並更新」。':'暫時無法套用更新。進度已保存，可稍後重試。');
   }
  });
  if(supported){
   navigator.serviceWorker.addEventListener('controllerchange',()=>{
    if(!applying||reloaded)return;reloaded=true;clearTimeout(activationTimer);location.reload();
   });
   navigator.serviceWorker.getRegistration(new URL('./',import.meta.url)).then(observe).catch(()=>{});
   setTimeout(()=>void check(),3000);
   setInterval(()=>{if(!document.hidden)void check();},600000);
   window.addEventListener('focus',()=>void check());
   window.addEventListener('online',()=>void check());
   document.addEventListener('visibilitychange',()=>{if(!document.hidden)void check();});
  }else setStatus('unsupported','請使用 HTTPS 網址開啟，才能檢查及安裝更新。');
  render();
 }
}
