# DEEPFLIX web: Worker + D1

A aplicação web usa `worker/index.mjs` e os arquivos estáticos de `web/`. O app Flutter permanece independente. O backend é uma adaptação dos parsers e resolvedores do DEEPFLIX anterior, sem servidor Node em produção.

## Desenvolvimento e prévia local

1. Execute `npm ci` (Node 22 ou superior).
2. Copie `.dev.vars.example` para `.dev.vars.preview`. Configure `PROXY_SECRET` com um segredo aleatório de pelo menos 32 caracteres, `TMDB_READ_TOKEN` e `BRAZUCA_RESOLVER_TOKEN`. Esses arquivos são ignorados pelo Git.
3. Execute `npm run db:local` para criar as tabelas no D1 local.
4. Execute `npm run dev` e acesse `http://127.0.0.1:4174`.

O ambiente `preview` usa um banco separado de produção. O comando de desenvolvimento usa D1 local; os comandos com `--remote` acessam a Cloudflare.

## Validação

```powershell
npm run check
npm test
npm run build
node test-web/live-smoke.mjs
```

`npm test` executa testes determinísticos com fontes simuladas e integração real com o runtime workerd e D1 efêmero. Nenhum usuário é criado em produção. A suíte cobre todos os cinco resolvedores, catálogo completo, filtros antes da paginação, aliases, capítulos, proxy HLS, cadastro, sessão, importação idempotente, isolamento e exclusões. O smoke é opt-in, exige uma URL local, lê pequenas amostras de mídia das origens reais e grava `docs/live-smoke.json` sem links assinados ou credenciais.

## Prévia remota e produção

1. Autentique o Wrangler na conta Cloudflare correta (`npx wrangler login`).
2. Crie bancos separados: `npx wrangler d1 create deepflix-preview` e `npx wrangler d1 create deepflix`. Substitua os dois UUIDs zero em `wrangler.toml` pelos IDs retornados, cada um em seu ambiente.
3. Aplique `worker/schema.sql` ao banco de prévia: `npx wrangler d1 execute DB --env preview --remote --file worker/schema.sql`.
4. Configure os três segredos com `npx wrangler secret put NOME --env preview`. Use um `PROXY_SECRET` exclusivo da prévia. Nunca coloque credenciais no TOML, no JavaScript público nem em logs.
5. Publique apenas a prévia: `npm run deploy:preview`. Repita os testes de interface e reprodução nessa URL, incluindo HTTPS, cookies, cabeçalhos de mídia e duas sessões independentes. O comportamento da origem pode diferir entre a rede local e os pontos de presença da Cloudflare.
6. Somente depois de aprovar os fluxos críticos, aplique o mesmo schema ao banco de produção, configure segredos exclusivos e execute `npm run deploy:production`. Os scripts bloqueiam a publicação com o identificador de banco zero.

As tabelas iniciais são aditivas (`CREATE TABLE IF NOT EXISTS`). Alterações futuras de schema devem usar migrações aditivas, compatíveis com a versão anterior durante o rollout. Antes da primeira publicação, registre a versão atual com `npx wrangler deployments list` e mantenha um export do D1. Em caso de regressão, use `npx wrangler rollback ID_DA_VERSAO` e preserve o banco; rollback do código não reverte dados.

## Contratos e comportamento

- Catálogo e mapa: `/api/lista`, `/api/mapa` e `/sitemap.xml`. Os filtros são aplicados antes da paginação; canais são devolvidos integralmente porque a interface usa uma lista sem páginas.
- Detalhes e reprodução: `/api/movie/:id`, `/api/series/:id?kind=...&season=...` e `/api/play`. Só episódios realmente encontrados nos provedores são apresentados. Uma solicitação inválida não reproduz outro título nem o primeiro episódio por engano.
- Vídeo: `/api/proxy?token=...`. Tokens autenticados e criptografados expiram após uma hora. O proxy valida URLs e redirecionamentos, reescreve playlists/chaves/legendas e transmite binários sem acumular o arquivo em memória. Reabra o player para renovar um link expirado.
- Contas: `/api/auth/register`, `/login`, `/logout`, `/me` e `/import`. Usuário tem 3–32 caracteres (`a-z`, números, ponto, hífen e sublinhado); senha tem 8–128. Senhas usam PBKDF2-SHA256, salt aleatório e 100 mil iterações compatíveis com workerd; sessões opacas expiram em sete dias, com cookie `HttpOnly`, `Secure`, `SameSite=Lax`. Escritas exigem a origem da aplicação; tentativas são limitadas no D1 por IP e usuário.
- Histórico e favoritos: GET/POST/DELETE em `/api/history` e `/api/favorites`. O servidor é autoritativo após a importação inicial. Cache e fila de escritas são separados por conta. A fila persiste localmente e é repetida em reconexão; alterações inválidas não devem ser tratadas como sincronizadas. Registros antigos identificáveis são convertidos para IDs estáveis durante a importação, e os originais locais são preservados.

## Operação

O catálogo normalizado fica no D1 para que buscas e ordenação não precisem interpretar todos os XMLs no limite de CPU de uma requisição. Após configurar o schema e os segredos, carregue os dados de cada ambiente:

```powershell
npm run catalog:preview
npm run platforms:preview
node scripts/sync-platforms.mjs --preview --cinema
# Depois da validação na prévia:
npm run catalog:production
npm run platforms:production
node scripts/sync-platforms.mjs --production --apply-only --cinema
```

Esses comandos são manutenção manual: não há atualização automática por cron. Reexecute o catálogo quando as listas de origem mudarem e os índices de plataformas quando a disponibilidade mudar. A indexação completa do cinema pode demorar bastante; `--apply-only` reaproveita o SQL validado da prévia em `.wrangler/`. Não versionar esses arquivos, pois o diretório também contém configuração privada. Para atualizar apenas canais após publicar o Worker: `node scripts/sync-catalog.mjs --production --kind=canais`. A lista Pluto é consultada pelo Worker para preservar os canais da região atendida pelo site.

O catálogo indexado não garante que todos os links estejam ativos. Uma origem que recusa acesso precisa ser substituída ou corrigida pelo fornecedor; a aplicação apresenta o erro e permite tentar outra opção.

`/api/health` informa versão e presença dos bindings/segredos, sem revelar valores. Falhas de origem são retornadas como erro de reprodução, não como sucesso. A lista de canais pode ser agrupada por rede, com região/qualidade preservadas nos servidores; portanto o total de canais agrupados pode ser menor que o total de variantes na origem.

Uma reprodução só é aprovada quando o vídeo avança no navegador. Uma API que retorna uma URL ou um player que apenas abre não comprovam reprodução. Respostas 403 e indisponibilidade de IPTV devem ser resolvidas/validadas na origem antes de liberar produção.
