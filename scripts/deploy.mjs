import { readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
const preview = process.argv.includes('--preview');
const config = await readFile(new URL('../wrangler.toml',import.meta.url),'utf8');
const section = preview ? config.slice(config.indexOf('[env.preview]')) : config.split('[env.preview]')[0];
if (!section.match(/database_id\s*=\s*"(?!00000000-0000-0000-0000-000000000000)[0-9a-f-]{36}"/i)) {
  throw new Error(`Configure o ID real do D1 de ${preview ? 'prévia' : 'produção'} antes de publicar. Consulte docs/CLOUDFLARE.md.`);
}
const args = ['node_modules/wrangler/bin/wrangler.js','deploy',...(preview ? ['--env','preview'] : [])];
const result = spawnSync(process.execPath,args,{cwd:new URL('..',import.meta.url),stdio:'inherit'});
process.exit(result.status ?? 1);
