import crypto from 'node:crypto';

export const CATALOG_KINDS = ['filme','serie','anime','dorama','desenho','novela'];
export const CATALOG_ALL_KINDS = [...CATALOG_KINDS,'canais'];
export const normalizeCatalogText = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
const escapeLike = value => value.replace(/[\\%_]/g,match=>'\\'+match);
function releaseSort(item) {
  const value=String(item.date || '');
  const br=value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (br) return `${br[3]}-${br[2].padStart(2,'0')}-${br[1].padStart(2,'0')}`;
  return /^\d{4}-\d{2}-\d{2}/.test(value) ? value.slice(0,10) : `${item.year || '0000'}-00-00`;
}

export function catalogDatabase(db) {
  const readyCache=new Map();
  async function ready(kinds=CATALOG_KINDS) {
    if (!db) return false;
    if (kinds.some(kind=>!readyCache.has(kind))) {
      try {
        const rows=await db.prepare('SELECT kind,total FROM catalog_state WHERE kind IN (SELECT value FROM json_each(?))').bind(JSON.stringify(kinds)).all();
        for (const kind of kinds) readyCache.set(kind,rows.results.some(row=>row.kind===kind && Number(row.total)>0));
      } catch {return false;}
    }
    return kinds.every(kind=>readyCache.get(kind));
  }
  async function find(kind,id,title='') {
    if (!await ready([kind])) return null;
    const exact=await db.prepare('SELECT data FROM catalog_entries WHERE kind=? AND id=?').bind(kind,String(id)).first();
    if (exact) return JSON.parse(exact.data);
    if (/^(filme|serie|anime|dorama|desenho|novela)_\d+$/.test(id)) {
      if (title) {
        const titled=await db.prepare('SELECT data FROM catalog_entries WHERE kind=? AND title_norm=? LIMIT 1').bind(kind,normalizeCatalogText(title)).first();
        if (titled) return JSON.parse(titled.data);
      }
      const alias=await db.prepare("SELECT data FROM catalog_entries WHERE kind=? AND EXISTS (SELECT 1 FROM json_each(catalog_entries.data,'$.aliases') WHERE value=?) LIMIT 1").bind(kind,String(id)).first();
      return alias?JSON.parse(alias.data):null;
    }
    return null;
  }
  async function byTmdb(ids,kinds=CATALOG_KINDS) {
    if (!ids.length) return [];
    const result=await db.prepare(`SELECT data FROM catalog_entries WHERE kind IN (SELECT value FROM json_each(?)) AND json_extract(data,'$.tmdb_id') IN (SELECT value FROM json_each(?))`).bind(JSON.stringify(kinds),JSON.stringify(ids.map(String))).all();
    return result.results.map(row=>JSON.parse(row.data));
  }
  async function findMany(entries) {
    const keys=JSON.stringify(entries.map(entry=>`${entry.kind}:${entry.itemId}`));
    const titles=JSON.stringify(entries.filter(entry=>entry.title).map(entry=>`${entry.kind}:${normalizeCatalogText(entry.title)}`));
    const rows=await db.prepare(`SELECT data FROM catalog_entries WHERE (kind || ':' || id) IN (SELECT value FROM json_each(?)) OR (kind || ':' || title_norm) IN (SELECT value FROM json_each(?)) OR EXISTS (SELECT 1 FROM json_each(catalog_entries.data,'$.aliases') WHERE (catalog_entries.kind || ':' || value) IN (SELECT value FROM json_each(?)))`).bind(keys,titles,keys).all();
    return rows.results.map(row=>JSON.parse(row.data));
  }
  async function channels() {
    const [rows,config]=await db.batch([
      db.prepare("SELECT data FROM catalog_entries WHERE kind='canais' ORDER BY title_norm"),
      db.prepare("SELECT data FROM catalog_config WHERE key='iptv'"),
    ]);
    return {channels:rows.results.map(row=>JSON.parse(row.data)),iptvConfig:config.results[0]?JSON.parse(config.results[0].data):{hosts:{},users:{}}};
  }
  async function platformReady(platform) {
    try{return Boolean(await db.prepare('SELECT platform FROM catalog_platforms WHERE platform=? AND ready=1').bind(platform).first());}catch{return false;}
  }
  async function list(options={}) {
    const {category='pesquisa',query='',year='',genre='',sort='recent',page=1,limit=50,restrictIds=null}=options;
    const specific=CATALOG_KINDS.includes(category)?[category]:CATALOG_KINDS;
    const kinds=CATALOG_KINDS.includes(options.kind)?[options.kind]:specific;
    const clauses=['kind IN (SELECT value FROM json_each(?))'];
    const values=[JSON.stringify(kinds)];
    if(query){clauses.push("(title_norm LIKE ? ESCAPE '\\' OR original_norm LIKE ? ESCAPE '\\')");const q=`%${escapeLike(normalizeCatalogText(query))}%`;values.push(q,q);}
    if(year){clauses.push('year=?');values.push(String(year));}
    if(genre && genre!=='cinema'){clauses.push("genres_norm LIKE ? ESCAPE '\\'");values.push(`%${escapeLike(normalizeCatalogText(genre).replace(/-/g,' '))}%`);}
    if(category==='documentarios') clauses.push("genres_norm LIKE '%documentario%'");
    if(category==='shows') clauses.push("genres_norm LIKE '%musica%'");
    if(category==='programas') clauses.push("(genres_norm LIKE '%reality%' OR genres_norm LIKE '%talk%' OR genres_norm LIKE '%politica%' OR title_norm LIKE '%masterchef%' OR title_norm LIKE '%bbb%' OR title_norm LIKE '%fazenda%' OR title_norm LIKE '%power couple%' OR title_norm LIKE '%de ferias com%')");
    if(restrictIds!==null){clauses.push("(kind || ':' || id) IN (SELECT value FROM json_each(?))");values.push(JSON.stringify(restrictIds));}
    if(options.platform){clauses.push("(kind || ':' || id) IN (SELECT value FROM json_each((SELECT data FROM catalog_platforms WHERE platform=? AND ready=1)))");values.push(options.platform);}
    if(options.cinema)clauses.push("(kind || ':' || id) IN (SELECT value FROM json_each((SELECT data FROM catalog_platforms WHERE platform='cinema' AND ready=1)))");
    const orders={recent:'release_sort DESC,title_norm ASC',az:'title_norm ASC',rating:"CAST(json_extract(data,'$.vote_average') AS REAL) DESC,title_norm ASC",popular:"CAST(COALESCE(json_extract(data,'$.popularity'),json_extract(data,'$.vote_average'),0) AS REAL) DESC,title_norm ASC"};
    const where=clauses.join(' AND ');
    const [count,rows]=await db.batch([
      db.prepare(`SELECT COUNT(*) AS total FROM catalog_entries WHERE ${where}`).bind(...values),
      db.prepare(`SELECT data FROM catalog_entries WHERE ${where} ORDER BY ${orders[sort] || orders.recent} LIMIT ? OFFSET ?`).bind(...values,limit,(page-1)*limit),
    ]);
    const total=Number(count.results[0].total);
    return {results:rows.results.map(row=>JSON.parse(row.data)),total,page,hasMore:page*limit<total};
  }
  async function map(options={}) {
    const clauses=[],values=[];
    if(CATALOG_ALL_KINDS.includes(options.kind)){clauses.push('kind=?');values.push(options.kind);}
    if(options.query){clauses.push("title_norm LIKE ? ESCAPE '\\'");values.push(`%${escapeLike(normalizeCatalogText(options.query))}%`);}
    if(options.year){clauses.push('year=?');values.push(options.year==='sem-ano'?'':options.year);}
    if(options.letter){clauses.push(options.letter==='0-9'?"substr(title_norm,1,1) NOT BETWEEN 'a' AND 'z'":"substr(title_norm,1,1)=?");if(options.letter!=='0-9')values.push(options.letter.toLowerCase());}
    const where=clauses.length?'WHERE '+clauses.join(' AND '):'';
    const order=options.sort==='year_asc'?'year ASC,title_norm ASC':options.sort==='year_desc'?'year DESC,title_norm ASC':options.sort==='za'?'title_norm DESC':'title_norm ASC';
    const limit=options.limit || 500,page=options.page || 1;
    const [count,rows,counts,years]=await db.batch([
      db.prepare(`SELECT COUNT(*) AS total FROM catalog_entries ${where}`).bind(...values),
      db.prepare(`SELECT kind,id,COALESCE(json_extract(data,'$.title'),json_extract(data,'$.name')) AS title,year FROM catalog_entries ${where} ORDER BY ${order} LIMIT ? OFFSET ?`).bind(...values,limit,(page-1)*limit),
      db.prepare('SELECT kind,COUNT(*) AS total FROM catalog_entries GROUP BY kind'),
      db.prepare("SELECT DISTINCT year FROM catalog_entries WHERE year<>'' ORDER BY year DESC"),
    ]);
    return {total:Number(count.results[0].total),rows:rows.results,counts:Object.fromEntries(counts.results.map(row=>[row.kind,Number(row.total)])),years:years.results.map(row=>row.year)};
  }
  return {ready,find,findMany,channels,platformReady,byTmdb,list,map};
}

// Ingestion runs outside interactive requests (CLI or scheduled events).
export async function saveCatalog(db,kind,items,chunkSize=500) {
  if (!CATALOG_ALL_KINDS.includes(kind) || !items.length) throw new Error('Catálogo vazio ou categoria inválida.');
  const rows=items.map(item=>{
    const data=JSON.stringify(item);
    return {kind,id:String(item.id),data,title:normalizeCatalogText(item.title || item.name),original:normalizeCatalogText(item.original_title),year:String(item.year || ''),release:releaseSort(item),genres:normalizeCatalogText((item.genres || []).join(' ')).replace(/-/g,' '),hash:crypto.createHash('sha256').update(data).digest('hex')};
  });
  for(let offset=0;offset<rows.length;offset+=chunkSize) {
    const data=rows.slice(offset,offset+chunkSize);
    await db.prepare(`INSERT INTO catalog_entries(kind,id,data,title_norm,original_norm,year,release_sort,genres_norm,source_hash)
      SELECT json_extract(value,'$.kind'),json_extract(value,'$.id'),json_extract(value,'$.data'),json_extract(value,'$.title'),json_extract(value,'$.original'),json_extract(value,'$.year'),json_extract(value,'$.release'),json_extract(value,'$.genres'),json_extract(value,'$.hash') FROM json_each(?) WHERE true
      ON CONFLICT(kind,id) DO UPDATE SET data=excluded.data,title_norm=excluded.title_norm,original_norm=excluded.original_norm,year=excluded.year,release_sort=excluded.release_sort,genres_norm=excluded.genres_norm,source_hash=excluded.source_hash WHERE catalog_entries.source_hash<>excluded.source_hash`).bind(JSON.stringify(data)).run();
  }
  await db.batch([
    db.prepare('DELETE FROM catalog_entries WHERE kind=? AND id NOT IN (SELECT value FROM json_each(?))').bind(kind,JSON.stringify(rows.map(row=>row.id))),
    db.prepare('INSERT INTO catalog_state(kind,total,updated_at) VALUES (?,?,?) ON CONFLICT(kind) DO UPDATE SET total=excluded.total,updated_at=excluded.updated_at').bind(kind,rows.length,Date.now()),
  ]);
  return rows.length;
}
