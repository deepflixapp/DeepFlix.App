import crypto from 'node:crypto';
import { Buffer } from 'node:buffer';

const hashToken = value => crypto.createHash('sha256').update(value).digest('hex');
const publicUser = user => ({ id: user.id, username: user.username, name: user.name });
const cookie = (value, age) => `deepflix_session=${value}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${age}`;
const json = (value, status = 200, headers = {}) => Response.json(value, { status, headers: { 'Cache-Control': 'no-store', ...headers } });
const fail = (message, status = 400) => { throw Object.assign(new Error(message), { status }); };

export async function passwordHash(password, salt) {
  const material = await crypto.webcrypto.subtle.importKey('raw', Buffer.from(password), 'PBKDF2', false, ['deriveBits']);
  return Buffer.from(await crypto.webcrypto.subtle.deriveBits({ name:'PBKDF2', hash:'SHA-256', salt:Buffer.from(salt, 'hex'), iterations:100000 }, material, 256)).toString('hex');
}

export function validateEntry(body, collection) {
  if (!body || !['filme','serie','anime','dorama','desenho','novela','canais'].includes(body.kind) ||
      typeof body.itemId !== 'string' || !/^[\w.:-]{1,160}$/.test(body.itemId) || (collection === 'history' && body.kind === 'canais')) fail('Título inválido.');
  const entry = { kind:body.kind, itemId:body.itemId, key:`${body.kind}:${body.itemId}`, updatedAt:new Date().toISOString() };
  for (const field of ['title','poster','backdrop','year','episodeTitle','serverLabel','audio','category']) if (body[field] != null) entry[field] = String(body[field]).slice(0, ['poster','backdrop'].includes(field) ? 2000 : 200);
  for (const field of ['season','episode','optionIndex','currentTime','duration','vote_average']) if (body[field] != null) entry[field] = Math.max(0, Math.min(10000000, Number(body[field]) || 0));
  if(collection==='history' && Array.isArray(body.watchedEpisodes))entry.watchedEpisodes=body.watchedEpisodes.filter(item=>Number.isInteger(item?.season) && item.season>0 && Number.isInteger(item?.episode) && item.episode>0).slice(-1000).map(item=>({season:item.season,episode:item.episode}));
  return entry;
}

export async function handleAuth(request, env, migrateEntries = async entries => entries) {
  if (!env.DB) return json({ error:'Sincronização indisponível: banco D1 ainda não configurado.' }, 503);
  const db = env.DB;
  const url = new URL(request.url);
  try {
    if (!['GET','POST','DELETE'].includes(request.method)) return json({error:'Método não permitido.'},405);
    if (request.method !== 'GET' && request.headers.get('origin') !== url.origin) return json({ error:'Origem inválida.' },403);
    const readBody = async () => {
      if (Number(request.headers.get('content-length') || 0) > 1048576) fail('Dados muito grandes.',413);
      const text = await request.text();
      if (Buffer.byteLength(text) > 1048576) fail('Dados muito grandes.',413);
      try { return JSON.parse(text || '{}'); } catch { fail('JSON inválido.'); }
    };
    const token = request.headers.get('cookie')?.match(/(?:^|;\s*)deepflix_session=([A-Za-z0-9_-]+)/)?.[1];
    const user = token ? await db.prepare('SELECT u.* FROM users u JOIN sessions s ON s.user_id=u.id WHERE s.token_hash=? AND s.expires_at>?').bind(hashToken(token), Date.now()).first() : null;
    const path = url.pathname;
    if (path === '/api/auth/me' && request.method === 'GET') return json({ user:user ? publicUser(user) : null });
    const expectedAccount=request.headers.get('X-Deepflix-Account');
    if(expectedAccount && (!user || user.id!==expectedAccount))return json({error:'A conta ativa mudou. Atualize a página para sincronizar.'},409);
    if (path === '/api/auth/logout' && request.method === 'POST') {
      if (token) await db.prepare('DELETE FROM sessions WHERE token_hash=?').bind(hashToken(token)).run();
      return json({ok:true},200,{'Set-Cookie':cookie('',0)});
    }
    if (['/api/auth/login','/api/auth/register'].includes(path) && request.method === 'POST') {
      const body = await readBody();
      const username = String(body.username || '').trim().toLowerCase();
      const password = String(body.password || '');
      if (!/^[a-z0-9_.-]{3,32}$/.test(username) || password.length < 8 || password.length > 128) fail('Use um usuário de 3 a 32 caracteres e senha de 8 a 128 caracteres.');
      const ip = request.headers.get('CF-Connecting-IP') || 'local';
      for (const key of [hashToken(`ip:${ip}`), hashToken(`user:${username}`)]) {
        await db.prepare('INSERT INTO auth_attempts(key,count,reset_at) VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET count=CASE WHEN reset_at<=? THEN 1 ELSE count+1 END, reset_at=CASE WHEN reset_at<=? THEN excluded.reset_at ELSE reset_at END').bind(key,Date.now()+900000,Date.now(),Date.now()).run();
        const attempt = await db.prepare('SELECT count FROM auth_attempts WHERE key=?').bind(key).first();
        if (attempt.count > 10) fail('Muitas tentativas. Aguarde 15 minutos.',429);
      }
      let account = await db.prepare('SELECT * FROM users WHERE username=?').bind(username).first();
      if (path.endsWith('/register')) {
        if (account) fail('Este usuário já está cadastrado.',409);
        const salt = crypto.randomBytes(16).toString('hex');
        account = {id:crypto.randomUUID(),username,name:String(body.name || username).trim().slice(0,80) || username,salt,hash:await passwordHash(password,salt)};
        try { await db.prepare('INSERT INTO users(id,username,name,salt,hash) VALUES (?,?,?,?,?)').bind(account.id,username,account.name,salt,account.hash).run(); }
        catch { fail('Este usuário já está cadastrado.',409); }
      } else {
        const hash = await passwordHash(password,account?.salt || '0'.repeat(32));
        if (!account || !crypto.timingSafeEqual(Buffer.from(hash,'hex'),Buffer.from(account.hash,'hex'))) fail('Usuário ou senha incorretos.',401);
      }
      const session = crypto.randomBytes(32).toString('base64url');
      await db.batch([
        db.prepare('DELETE FROM sessions WHERE expires_at<=?').bind(Date.now()),
        db.prepare('DELETE FROM auth_attempts WHERE reset_at<=?').bind(Date.now()),
        db.prepare('INSERT INTO sessions(token_hash,user_id,expires_at) VALUES (?,?,?)').bind(hashToken(session),account.id,Date.now()+604800000)
      ]);
      return json({user:publicUser(account)},200,{'Set-Cookie':cookie(session,604800)});
    }
    if (!user) return json({error:'Entre na sua conta primeiro.'},401);
    if (path === '/api/auth/import' && request.method === 'POST') {
      const body = await readBody();
      if (user.imported) return json({ok:true});
      const statements = [];
      let unmatched = 0;
      for (const collection of ['history','favorites']) {
        const entries = body[collection];
        if (entries != null && !Array.isArray(entries)) fail('Lista inválida.');
        const migrated = await migrateEntries((entries || []).slice(0,collection === 'history' ? 300 : 500));
        unmatched += migrated.filter(item => !item).length;
        const normalized=migrated.filter(Boolean).map(item=>validateEntry(item,collection));
        if(normalized.length)statements.push(db.prepare("INSERT OR IGNORE INTO user_items(user_id,collection,key,data,updated_at) SELECT ?,?,json_extract(value,'$.key'),value,? FROM json_each(?) WHERE (SELECT imported FROM users WHERE id=?)=0").bind(user.id,collection,Date.now(),JSON.stringify(normalized),user.id));
      }
      statements.push(db.prepare('UPDATE users SET imported=1 WHERE id=?').bind(user.id));
      await db.batch(statements);
      return json({ok:true,unmatched});
    }
    const collection = path === '/api/history' ? 'history' : path === '/api/favorites' ? 'favorites' : null;
    if (!collection) return json({error:'Rota não encontrada.'},404);
    if (request.method === 'GET') {
      const result = await db.prepare('SELECT data FROM user_items WHERE user_id=? AND collection=? ORDER BY updated_at DESC LIMIT ?').bind(user.id,collection,collection === 'history' ? 300 : 500).all();
      const results = result.results.map(row => JSON.parse(row.data));
      return json({results,total:results.length});
    }
    if (request.method === 'DELETE') {
      const key = url.searchParams.get('key');
      const sql = 'DELETE FROM user_items WHERE user_id=? AND collection=?' + (key ? ' AND key=?' : '');
      await db.prepare(sql).bind(...(key ? [user.id,collection,key] : [user.id,collection])).run();
      return json({ok:true});
    }
    const entry = validateEntry(await readBody(),collection);
    await db.batch([
      db.prepare('INSERT INTO user_items(user_id,collection,key,data,updated_at) VALUES (?,?,?,?,?) ON CONFLICT(user_id,collection,key) DO UPDATE SET data=excluded.data,updated_at=excluded.updated_at').bind(user.id,collection,entry.key,JSON.stringify(entry),Date.now()),
      db.prepare('DELETE FROM user_items WHERE user_id=? AND collection=? AND key IN (SELECT key FROM user_items WHERE user_id=? AND collection=? ORDER BY updated_at DESC LIMIT -1 OFFSET ?)').bind(user.id,collection,user.id,collection,collection === 'history' ? 300 : 500)
    ]);
    return json({item:entry});
  } catch (error) { return json({error:error.status ? error.message : 'Não foi possível concluir a sincronização.'},error.status || 500); }
}
