import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { Miniflare, convertV4MiniflareOptions } from 'miniflare';
import { build } from 'esbuild';

let mf;
before(async()=>{
  const bundled=await build({entryPoints:['worker/index.mjs'],bundle:true,format:'esm',platform:'browser',external:['node:*'],write:false});
  mf=new Miniflare(convertV4MiniflareOptions({modules:true,script:bundled.outputFiles[0].text,compatibilityDate:'2026-10-25',compatibilityFlags:['nodejs_compat'],d1Databases:['DB'],bindings:{PROXY_SECRET:'local-test-only-'.repeat(4)}}));
  const db=await mf.getD1Database('DB');
  await db.exec((await readFile('worker/schema.sql','utf8')).replace(/\n/g,' '));
});
after(async()=>{await mf?.dispose();});
const call = async(path,body,session,method=body?'POST':'GET',origin='https://deepflix.test')=>{
  const headers={Origin:origin,'CF-Connecting-IP':'192.0.2.1'};
  if(session) headers.Cookie=session;
  if(body) headers['Content-Type']='application/json';
  return mf.dispatchFetch('https://deepflix.test'+path,{method,headers,body:body?JSON.stringify(body):undefined});
};
const entry={kind:'filme',itemId:'123',title:'Teste',currentTime:120,duration:600};

test('real workerd: credentials, sessions, D1 isolation, import once, persistence and deletions',async()=>{
  const register=await call('/api/auth/register',{username:'usuario-a',password:'SenhaDeTeste123',name:'Teste A'});
  assert.equal(register.status,200,await register.clone().text());
  const a=register.headers.get('set-cookie').split(';')[0];
  assert.match(register.headers.get('set-cookie'),/HttpOnly/); assert.match(register.headers.get('set-cookie'),/Secure/);
  const bRes=await call('/api/auth/register',{username:'usuario-b',password:'OutraSenha123',name:'Teste B'});
  assert.equal(bRes.status,200); const b=bRes.headers.get('set-cookie').split(';')[0];
  assert.equal((await call('/api/auth/login',{username:'usuario-a',password:'SenhaErrada123'})).status,401);
  assert.equal((await call('/api/auth/register',{username:'usuario-a',password:'SenhaDeTeste123'})).status,409);
  assert.equal((await call('/api/auth/register',{username:'x',password:'short'})).status,400);
  assert.equal((await call('/api/auth/import',{history:[entry],favorites:[entry]},a)).status,200);
  assert.equal((await (await call('/api/history',null,a)).json()).results.length,1);
  assert.equal((await (await call('/api/history',null,b)).json()).results.length,0);
  assert.equal((await call('/api/history',null,null)).status,401);
  assert.equal((await call('/api/history',null,a,'DELETE')).status,200);
  assert.equal((await call('/api/auth/import',{history:[entry],favorites:[entry]},a)).status,200);
  assert.equal((await (await call('/api/history',null,a)).json()).results.length,0,'import must not resurrect deleted history');
  const write=await call('/api/history',{...entry,season:2,episode:4,currentTime:140},a);
  assert.equal(write.status,200); assert.equal((await write.json()).item.currentTime,140);
  assert.equal((await call('/api/favorites',{...entry,itemId:'bad/id'},a)).status,400);
  assert.equal((await call('/api/favorites',entry,a,'POST','https://evil.test')).status,403);
  assert.equal((await call('/api/favorites?key=filme:123',null,a,'DELETE')).status,200);
  assert.equal((await (await call('/api/favorites',null,a)).json()).results.length,0);
  const login=await call('/api/auth/login',{username:'usuario-a',password:'SenhaDeTeste123'});
  assert.equal(login.status,200); const second=login.headers.get('set-cookie').split(';')[0];
  assert.equal((await (await call('/api/history',null,second)).json()).results[0].currentTime,140);
  assert.equal((await call('/api/auth/logout',{},a)).status,200);
  assert.equal((await (await call('/api/auth/me',null,a)).json()).user,null);
  assert.equal((await (await call('/api/auth/me',null,second)).json()).user.username,'usuario-a');
  const db=await mf.getD1Database('DB');
  await db.prepare('UPDATE sessions SET expires_at=0').run();
  assert.equal((await (await call('/api/auth/me',null,second)).json()).user,null);
});
test('login attempts are rate limited in persistent D1, not isolate memory',async()=>{
  for(let i=0;i<11;i++) {
    const response=await call('/api/auth/login',{username:'unknown-user',password:'WrongPassword123'});
    if(i===10) assert.equal(response.status,429);
  }
});
