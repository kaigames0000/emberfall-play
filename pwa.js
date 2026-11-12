// Kept separate from gameplay and omitted from the portable single-file edition.
if(['https:','http:'].includes(location.protocol)){
 let offlineStatus='離線內容尚未準備完成，請保持連線遊玩。',refreshStatus=()=>{};
 const host=document.querySelector('.game-top-tools');
 if(host){
  const style=document.createElement('style');style.textContent=`
   #install-game{width:auto;min-width:40px;padding:0 9px;font-size:11px;color:#d3bc86;white-space:nowrap}
   #install-game:focus-visible,#install-help button:focus-visible{outline:2px solid #d3bc86;outline-offset:3px}
   #install-help{width:min(400px,calc(100vw - 32px));padding:0;color:#c8cebd;background:#111c16;border:1px solid #8c7853;border-radius:4px}
   #install-help::backdrop{background:#0009}#install-help h2{font-size:14px;margin:0;color:#d3bc86}
   #install-help p{font-size:12px;line-height:1.6;margin:0;padding:12px}
   @media(max-width:600px){#install-game{padding:0 6px;font-size:10px;min-width:32px}}
  `;document.head.append(style);
  const button=document.createElement('button');button.id='install-game';button.type='button';button.setAttribute('aria-haspopup','dialog');host.prepend(button);
  const dialog=document.createElement('dialog');dialog.id='install-help';dialog.setAttribute('aria-labelledby','install-heading');
  const heading=document.createElement('h2');heading.id='install-heading';heading.textContent='安裝與更新';
  const text=document.createElement('p'),close=document.createElement('button'),header=document.createElement('div');
  header.className='dialog-header compact-sheet-header';close.type='button';close.className='modal-close';close.setAttribute('aria-label','關閉安裝與更新');close.title='關閉安裝與更新';close.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 5 14 14M5 19 19 5"/></svg>';close.addEventListener('click',()=>dialog.close());header.append(heading,close);dialog.append(header,text);document.body.append(dialog);
  let installPrompt=null,nativePromptOpen=false,wasInstalled=false,helpMessage='';
  const display=matchMedia('(display-mode: standalone)');
  const installed=()=>wasInstalled||display.matches||navigator.standalone===true;
  function overlay(){window.dispatchEvent(new CustomEvent('emberfall:pwa-overlay',{detail:{open:nativePromptOpen||dialog.open}}));}
  function refresh(){button.textContent=installed()?'已安裝':'安裝';button.setAttribute('aria-label',installed()?'裂界遺火已安裝':'安裝裂界遺火');button.title=offlineStatus;text.textContent=helpMessage+' '+offlineStatus;}
  function help(message){helpMessage=message;refresh();dialog.showModal();overlay();}
  refreshStatus=refresh;
  dialog.addEventListener('close',overlay);
  dialog.addEventListener('cancel',()=>setTimeout(overlay,0));
  window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();installPrompt=event;refresh();});
  window.addEventListener('appinstalled',()=>{installPrompt=null;wasInstalled=true;refresh();});
  display.addEventListener?.('change',refresh);
  button.addEventListener('click',async()=>{
   if(installed()||button.textContent==='已安裝'){help('裂界遺火已安裝。從主畫面或應用程式列表開啟，即可繼續冒險。');return;}
   if(installPrompt){
    const prompt=installPrompt;installPrompt=null;nativePromptOpen=true;overlay();
    try{await prompt.prompt();await prompt.userChoice;}catch{help('請從瀏覽器選單選擇「安裝應用程式」或「加入主畫面」。');}finally{nativePromptOpen=false;overlay();}
    refresh();return;
   }
   help(/iPad|iPhone|iPod/.test(navigator.userAgent)?'在 Safari 點選「分享」，再選「加入主畫面」。':'請在瀏覽器選單尋找「安裝裂界遺火」、「安裝應用程式」或「加入主畫面」。若未出現，請以最新版 Chrome、Edge 或 Safari 開啟此頁。');
  });
  refresh();
 }
 if(window.isSecureContext&&'serviceWorker'in navigator){
  navigator.serviceWorker.register(new URL('./sw.js',import.meta.url),{scope:'./',updateViaCache:'none'})
   .then(registration=>{window.dispatchEvent(new CustomEvent('emberfall:pwa-registration',{detail:{registration}}));return navigator.serviceWorker.ready;})
   .then(registration=>{if(registration.active){offlineStatus='離線內容準備完成，下次開啟即可離線遊玩。';refreshStatus();}})
   .catch(()=>{offlineStatus='暫時無法準備離線內容，請保持連線遊玩；稍後重新開啟可再試一次。';refreshStatus();});
 }
}
