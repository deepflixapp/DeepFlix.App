import test from 'node:test';
import assert from 'node:assert/strict';
import '../web/account-sync.js';
const AccountSync=globalThis.DeepflixAccountSync;
const storage=()=>{const map=new Map();return {getItem:key=>map.get(key) ?? null,setItem:(key,value)=>map.set(key,value)};};
const entry={kind:'filme',itemId:'603',key:'filme:603',title:'Matrix'};

test('guest data is preserved; each signed-in account has its own cache',()=>{
  const local=storage();local.setItem('deepflix_local_favorites_v1',JSON.stringify([entry]));
  const sync=new AccountSync({storage:local,request:async()=>{}});
  sync.activate({id:'a'});sync.save('favorites',[{...entry,title:'Conta A'}]);
  assert.equal(sync.activate({id:'b'}).favorites.length,0);
  sync.save('favorites',[]);assert.equal(sync.activate({id:'a'}).favorites[0].title,'Conta A');
  assert.equal(sync.activate(null).favorites[0].title,'Matrix');
});

test('offline deletion survives reload and is applied before pulling remote data',async()=>{
  const local=storage();let online=false,remote=[entry];
  const request=async(path,options={})=>{
    if(!online)throw new Error('offline');
    assert.equal(options.accountId,'a');
    if(options.method==='DELETE'){remote=[];return {ok:true};}
    return {results:path==='/api/favorites'?structuredClone(remote):[]};
  };
  const first=new AccountSync({storage:local,request});first.activate({id:'a'});first.save('favorites',[]);
  await assert.rejects(first.enqueue('/api/favorites?key=filme%3A603','DELETE'));
  const afterReload=new AccountSync({storage:local,request});afterReload.activate({id:'a'});online=true;
  assert.equal((await afterReload.pull()).favorites.length,0);assert.equal(afterReload.pending().length,0);
});

test('queued writes never move to a different active account',async()=>{
  const local=storage();const writes=[];let online=false;
  const sync=new AccountSync({storage:local,request:async(path,options)=>{if(!online)throw new Error('offline');writes.push(options.accountId);return {};}});
  sync.activate({id:'a'});await assert.rejects(sync.enqueue('/api/favorites','POST',entry));
  sync.activate({id:'b'});online=true;await sync.flush();assert.deepEqual(writes,[]);assert.equal(sync.pending('a').length,1);
  sync.activate({id:'a'});await sync.flush();assert.deepEqual(writes,['a']);assert.equal(sync.pending('a').length,0);
});

test('a remote pull cannot overwrite a local edit made while its response was in flight',async()=>{
  const local=storage();let releaseRead,readStarted;const started=new Promise(resolve=>{readStarted=resolve;});let releaseWrite;
  const sync=new AccountSync({storage:local,request:async(path,options={})=>{
    if(options.method==='POST')return new Promise(resolve=>{releaseWrite=resolve;});
    if(path==='/api/favorites'){readStarted();return new Promise(resolve=>{releaseRead=resolve;});}
    return {results:[]};
  }});
  sync.activate({id:'a'});const pull=sync.pull();await started;
  const write=sync.enqueue('/api/favorites','POST',entry);
  releaseRead({results:[]});assert.equal((await pull).favorites[0].itemId,'603');
  releaseWrite({ok:true});await write;
});
