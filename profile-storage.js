import * as M from './model.js?v=140';

const DB_NAME='emberfall-saves',TABLE='profiles',KEY=M.PROFILE_KEY,RECOVERY_PREFIX='emberfall-recovery-v1-';
const MAX_BACKUP_BYTES=32*1024*1024;
const legacyKey=key=>/^emberfall-(?:profile|save|roster)-v\d+$/.test(key);
function guard(profile){const run=profile.rifts?.activeRun;return {writeRevision:profile.writeRevision||0,rifts:{activeRun:run?{id:run.id}:null,recent:profile.rifts?.recent??[],lastResult:profile.rifts?.lastResult??null}};}
function revision(record){return record?.guard?.writeRevision??0;}
function token(){return globalThis.crypto?.randomUUID?.()??`${Date.now()}-${Math.random().toString(36).slice(2)}`;}
function codedError(code,message,cause){return Object.assign(new Error(message,{cause}),{code});}
function writeConflict(){return codedError('PROFILE_WRITE_CONFLICT','另一個視窗已有較新的進度，請重新載入角色。');}
function idbSnapshot(value){return value===undefined?null:{source:'IndexedDB',value,envelope:value};}
function localSnapshot(value){
 if(value===null)return null;
 let parsed;try{parsed=JSON.parse(value);}catch{}
 const compressed=parsed&&typeof parsed==='object'&&(Object.hasOwn(parsed,'payload64')||Object.hasOwn(parsed,'format')&&!Object.hasOwn(parsed,'version'));
 return {source:'localStorage',value,envelope:compressed?parsed:null,legacyRevision:compressed?undefined:parsed?.writeRevision};
}
function sameRecord(current,expected){
 if(Object.is(current,expected))return true;
 if(!current||!expected||typeof current!=='object'||typeof expected!=='object')return false;
 return Object.is(revision(current),revision(expected))&&['writeId','savedAt','format','codec','jsonBytes','storedBytes'].every(key=>Object.is(current[key],expected[key]));
}
async function encode(raw){
 const plain=new Blob([raw],{type:'application/json'});
 if(typeof CompressionStream==='function'&&typeof DecompressionStream==='function'){
  const zipped=await new Response(plain.stream().pipeThrough(new CompressionStream('gzip'))).blob();
  if(zipped.size<plain.size)return {codec:'gzip',payload:zipped,jsonBytes:plain.size,storedBytes:zipped.size};
 }
 return {codec:'json',payload:plain,jsonBytes:plain.size,storedBytes:plain.size};
}
async function encodeProfileBackup(profile){
 const {codec,payload}=await encode(JSON.stringify(profile));
 return codec==='gzip'
  ? {blob:new Blob([payload],{type:'application/gzip'}),filename:'emberfall-save.json.gz'}
  : {blob:payload,filename:'emberfall-save.json'};
}
async function decodeProfileBackup(file){
 const tooLarge=()=>codedError('BACKUP_TOO_LARGE','存檔超過 32 MB，無法匯入。');
 if(file.size>MAX_BACKUP_BYTES)throw tooLarge();
 const [first,second]=new Uint8Array(await file.slice(0,2).arrayBuffer());
 if(first!==0x1f||second!==0x8b)return file.text();
 if(typeof DecompressionStream!=='function')throw codedError('UNSUPPORTED_CODEC','此瀏覽器無法解壓縮存檔。');
 const reader=file.stream().pipeThrough(new DecompressionStream('gzip')).getReader();
 const decoder=new TextDecoder(),chunks=[];
 let total=0;
 try{
  for(let chunk=await reader.read();!chunk.done;chunk=await reader.read()){
   total+=chunk.value.byteLength;
   if(total>MAX_BACKUP_BYTES){
    await reader.cancel();
    throw tooLarge();
   }
   chunks.push(decoder.decode(chunk.value,{stream:true}));
  }
  chunks.push(decoder.decode());
  return chunks.join('');
 }finally{reader.releaseLock();}
}
export {encodeProfileBackup,decodeProfileBackup};
async function base64(blob){
 const bytes=new Uint8Array(await blob.arrayBuffer());let binary='';
 for(let n=0;n<bytes.length;n+=8192)binary+=String.fromCharCode(...bytes.subarray(n,n+8192));
 return btoa(binary);
}
async function makeRecord(raw,profile){return {format:1,...await encode(raw),guard:guard(profile),savedAt:Date.now(),writeId:token()};}
async function decode(snapshot){
 const {source,value,envelope:record}=snapshot;
 if(source==='localStorage'&&!record)return value;
 if(record?.format!==1)throw Error('存檔資料格式無效。');
 let payload=record.payload;
 if(source==='localStorage'){
  if(typeof record.payload64!=='string')throw Error('存檔資料格式無效。');
  payload=Uint8Array.from(atob(record.payload64),char=>char.charCodeAt(0));
 }
 if(payload==null)throw Error('存檔資料格式無效。');
 const blob=payload instanceof Blob?payload:new Blob([payload]);
 if(record.codec==='json')return blob.text();
 if(record.codec!=='gzip'||typeof DecompressionStream!=='function')throw codedError('UNSUPPORTED_CODEC','此瀏覽器無法解壓縮存檔。');
 return new Response(blob.stream().pipeThrough(new DecompressionStream('gzip'))).text();
}
async function inspect(snapshot){
 if(!snapshot)return {};
 let raw;
 try{raw=await decode(snapshot);}catch(error){return {reason:error.code==='UNSUPPORTED_CODEC'?'unsupported-codec':'corrupt'};}
 const profile=M.importSave(raw);
 if(profile)return {raw,profile};
 try{JSON.parse(raw);}catch{return {reason:'corrupt'};}
 return {reason:'incompatible'};
}
function makeBackup({source,value},reason){return {id:RECOVERY_PREFIX+token(),savedAt:Date.now(),source,reason,value};}
async function commit(driver,record,previous,backups){
 try{await driver.commit(record,previous,backups);}catch(error){
  if(!backups.length||error.code==='PROFILE_WRITE_CONFLICT')throw error;
  throw codedError('RECOVERY_BACKUP_FAILED','無法保留復原備份，原存檔仍在此裝置。',error);
 }
}
function openDatabase(factory){return new Promise((resolve,reject)=>{
 if(!factory){reject(Error('IndexedDB unavailable'));return;}
 const request=factory.open(DB_NAME,1);
 request.onupgradeneeded=()=>{if(!request.result.objectStoreNames.contains(TABLE))request.result.createObjectStore(TABLE);};
 request.onsuccess=()=>{const db=request.result;db.onversionchange=()=>db.close();resolve(db);};
 request.onerror=()=>reject(request.error);request.onblocked=()=>reject(Error('請關閉其他遊戲視窗後再試。'));
});}
function idbRead(db,method,key){return new Promise((resolve,reject)=>{
 const request=db.transaction(TABLE,'readonly').objectStore(TABLE)[method](key);
 request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);
});}
function idbDriver(db){
 return {kind:'IndexedDB',read:async()=>idbSnapshot(await idbRead(db,'get',KEY)),
  readBackup:id=>idbRead(db,'get',id),
  listBackups:()=>idbRead(db,'getAll',IDBKeyRange.bound(RECOVERY_PREFIX,RECOVERY_PREFIX+'\uffff')),
  commit:(record,expected,backups)=>new Promise((resolve,reject)=>{
   let tx;try{tx=db.transaction(TABLE,'readwrite',{durability:'strict'});}catch{tx=db.transaction(TABLE,'readwrite');}
   const store=tx.objectStore(TABLE),request=store.get(KEY);let failure;
   request.onsuccess=()=>{
    try{
     if(!sameRecord(request.result,expected?expected.value:undefined))throw writeConflict();
     for(const backup of backups)store.add(backup,backup.id);
     store.put(record,KEY);
    }catch(error){failure=error;tx.abort();}
   };
   tx.oncomplete=()=>resolve();tx.onabort=()=>reject(failure??tx.error??Error('存檔寫入未完成。'));
  }),close:()=>db.close()};
}
function storageKeys(storage){const keys=[];for(let n=0;n<storage.length;n++){const key=storage.key(n);if(key!==null)keys.push(key);}return keys;}
function localBackup(storage,id){
 const raw=storage?.getItem(id);if(!raw)return null;
 try{return JSON.parse(raw);}catch{return null;}
}
function localBackups(storage){return storageKeys(storage).filter(key=>key.startsWith(RECOVERY_PREFIX)).map(key=>localBackup(storage,key)).filter(Boolean);}
function localDriver(storage){
 return {kind:'compressed-localStorage',read:async()=>localSnapshot(storage.getItem(KEY)),
  readBackup:async id=>localBackup(storage,id),listBackups:async()=>localBackups(storage),
  commit:async(record,expected,backups)=>{
   const {payload,...metadata}=record,raw=JSON.stringify({...metadata,payload64:await base64(payload)});
   const previous=expected?.value??null,written=[];
   if(storage.getItem(KEY)!==previous)throw writeConflict();
   try{
    for(const backup of backups){
     if(storage.getItem(backup.id)!==null)throw Error('復原備份已存在。');
     storage.setItem(backup.id,JSON.stringify(backup));written.push(backup.id);
    }
    if(storage.getItem(KEY)!==previous)throw writeConflict();
    storage.setItem(KEY,raw);
   }catch(error){
    for(const id of written)try{storage.removeItem(id);}catch{}
    throw error;
   }
 },close:()=>{}};
}
function safeLocal(){try{return globalThis.localStorage;}catch{return null;}}
function cleanupLegacy(storage,legacy,migrated){
 if(!storage)return;
 try{
  if(legacy){if(storage.getItem(KEY)!==legacy.value)return;storage.removeItem(KEY);}
  if(migrated)for(const key of storageKeys(storage))if(key!==KEY&&legacyKey(key))storage.removeItem(key);
 }catch{}
}
async function originalBackup(backup){
 const {value}=backup;
 if(backup.source==='localStorage')return new Blob([value],{type:'text/plain'});
 if(value instanceof Blob||value instanceof ArrayBuffer||ArrayBuffer.isView(value))return new Blob([value]);
 const payload=value?.payload;
 if(payload instanceof Blob||payload instanceof ArrayBuffer||ArrayBuffer.isView(payload)){
  const {payload:bytes,...metadata}=value,blob=bytes instanceof Blob?bytes:new Blob([bytes]);
  return new Blob([JSON.stringify({...metadata,payload64:await base64(blob),payloadType:blob.type})],{type:'application/json'});
 }
 return new Blob([JSON.stringify(value)],{type:'application/json'});
}

export class ProfileStore{
 constructor(driver,storage){this.driver=driver;this.legacy=storage;this.queue=Promise.resolve();this.info={backend:driver.kind,jsonBytes:0,storedBytes:0,migrated:false,resetIncompatible:false};}
 async initialize(){
  const current=await this.driver.read(),record=current?.envelope;let legacy=null;
  if(this.driver.kind==='IndexedDB'&&this.legacy)try{legacy=localSnapshot(this.legacy.getItem(KEY));}catch{}
  const [currentResult,legacyResult]=await Promise.all([inspect(current),inspect(legacy)]);
  const adoptedLegacy=!!legacyResult.profile&&(!currentResult.profile||(legacyResult.profile.writeRevision??0)>(currentResult.profile.writeRevision??0));
  const profile=adoptedLegacy?legacyResult.profile:currentResult.profile;
  const migrated=adoptedLegacy||!!(currentResult.profile&&!record),backups=[];
  if(currentResult.reason)backups.push(makeBackup(current,currentResult.reason));
  if(legacyResult.reason){
   // A tab may close after IndexedDB commits but before the local key is removed.
   const saved=await this.driver.listBackups();
   if(!saved.some(backup=>backup.source==='localStorage'&&backup.value===legacy.value))backups.push(makeBackup(legacy,legacyResult.reason));
  }
  if(profile&&record&&!adoptedLegacy&&!backups.length&&JSON.stringify(record.guard)===JSON.stringify(guard(profile))&&currentResult.raw===JSON.stringify(profile)){
   Object.assign(this.info,{jsonBytes:record.jsonBytes,storedBytes:record.storedBytes});
   cleanupLegacy(this.legacy,legacy,!!legacyResult.profile);return profile;
  }
  const reset=!profile&&!!(currentResult.reason||legacyResult.reason),next=profile??M.newSave();
  if(reset){
   const revisions=[revision(record),current?.legacyRevision,revision(legacy?.envelope),legacy?.legacyRevision];
   next.writeRevision=1+Math.max(0,...revisions.filter(n=>Number.isSafeInteger(n)&&n>=0&&n<Number.MAX_SAFE_INTEGER-1));
  }
  const envelope=await makeRecord(JSON.stringify(next),next);
  try{await commit(this.driver,envelope,current,backups);}catch(error){
   if(error.code!=='PROFILE_WRITE_CONFLICT')throw error;
   // Two tabs can migrate together; use the winner instead of deleting either save.
   const winner=await this.driver.read(),restored=(await inspect(winner)).profile;if(!restored)throw error;
   Object.assign(this.info,{jsonBytes:winner.envelope?.jsonBytes,storedBytes:winner.envelope?.storedBytes});return restored;
  }
  Object.assign(this.info,{jsonBytes:envelope.jsonBytes,storedBytes:envelope.storedBytes,migrated,resetIncompatible:reset});
  cleanupLegacy(this.legacy,legacy,migrated||!!legacyResult.profile);return next;
 }
 save(profile,options={}){
  const copy=structuredClone(profile);
  const operation=async()=>{
   const previous=await this.driver.read(),before=previous?.envelope?.guard??null;let raw;
   const adapter={getItem:()=>before?JSON.stringify(before):null,setItem:(_key,value)=>{raw=value;}};
   M.saveProfile(adapter,copy,options);
   const record=await makeRecord(raw,copy),backups=options.replace&&previous?[makeBackup(previous,'before-replace')]:[];
   await commit(this.driver,record,previous,backups);
   profile.writeRevision=copy.writeRevision;Object.assign(this.info,{jsonBytes:record.jsonBytes,storedBytes:record.storedBytes});return copy;
  };
  const result=this.queue.then(operation);this.queue=result.catch(()=>{});return result;
 }
 async load(){await this.queue;const current=await this.driver.read();if(!current)throw Error('找不到本機存檔。');const {profile}=await inspect(current);if(!profile)throw Error('本機存檔無法讀取，請重新載入以保留復原備份。');return profile;}
 async listRecoveryBackups(){
  await this.queue;const backups=await this.driver.listBackups();
  if(this.driver.kind==='IndexedDB'&&this.legacy)try{backups.push(...localBackups(this.legacy));}catch{}
  return backups.map(({id,savedAt,source,reason})=>({id,savedAt,source,reason})).sort((a,b)=>b.savedAt-a.savedAt);
 }
 async exportRecoveryBackup(id,{original=false}={}){
  if(typeof id!=='string'||!id.startsWith(RECOVERY_PREFIX))throw Error('找不到復原備份。');
  await this.queue;
  let backup=await this.driver.readBackup(id);
  if(!backup&&this.driver.kind==='IndexedDB')backup=localBackup(this.legacy,id);
  if(!backup)throw Error('找不到復原備份。');
  if(!original&&backup.reason!=='corrupt')try{
   const raw=await decode(backup.source==='IndexedDB'?idbSnapshot(backup.value):localSnapshot(backup.value));
   return {blob:new Blob([raw],{type:'application/json'}),filename:id+'.json'};
  }catch{}
  const blob=await originalBackup(backup),extension=blob.type==='application/json'?'.json':blob.type==='text/plain'?'.txt':'.bin';
  return {blob,filename:id+'-original'+extension};
 }
 flush(){return this.queue;}
 close(){this.driver.close();}
}
export function openProfileStore({indexedDB=globalThis.indexedDB,localStorage=safeLocal()}={}){
 return (async()=>{let driver;try{driver=idbDriver(await openDatabase(indexedDB));}catch{if(!localStorage)throw Error('此瀏覽器不允許儲存遊戲進度。');driver=localDriver(localStorage);}
  const store=new ProfileStore(driver,localStorage);
  try{store.profile=await store.initialize();return store;}catch(error){store.close();throw error;}
 })();
}
