# Verificação do site publicado — 25/10/2026

## Atualização publicada após a rodada inicial

Versão Cloudflare: `9ebbaf10-6b33-41dc-bad0-ad11b119a6d9`, saúde `20261025-v7`. Os registros abaixo da seção "Rodada inicial" descrevem a versão anterior, preservados como diagnóstico.

### Aprovado nesta atualização

- 37 testes automatizados, incluindo workerd e D1 real efêmero; sintaxe e build aprovados. A primeira execução restrita bloqueou sockets locais (EACCES); repetição com acesso ao runtime local passou integralmente.
- Produção: 18 requisições concorrentes em três rodadas, todas HTTP 200, sem timeout: filmes, séries, busca geral, busca com tipo, capítulos e resolução de Matrix. Evidência: `production-concurrency.json`.
- Produção: Matrix reproduzindo no navegador, `readyState=4`, tempo 24,43 segundos. Evidência: `fixed-matrix-production.jpg`.
- Prévia: Matrix reproduziu, pausou e retomou após recarregar. 24 Horas reproduziu T1:E1, avançou para T1:E2 (20,58 s) e trocou para T2:E1 (21,69 s); voltar restaurou o catálogo.
- Prévia: cadastro pelo formulário com usuário, favorito adicionado e removido sem reaparecer após recarga; logout restaurou os dados locais. Teste remoto com duas sessões confirmou cookies seguros, importação única, exclusões e isolamento (`remote-preview-check.json`).
- Produção: 285 canais retornados integralmente; busca Matrix com ano 2026 retornou zero; categoria 1999 retornou registros; filtro Netflix retornou registros e sitemap XML contém índice real.
- Catálogos e índices de oito plataformas e cinema carregados em D1 separado para prévia e produção.

### Pendências e limites

- IPTV continua indisponível nas fontes atuais: o Worker observou HTTP 403, 526 e respostas sem HLS. O usuário informou precisar obter uma fonte atualizada. Listar 285 canais não comprova que os 285 reproduzem.
- A reprodução de todas as integrações externas, todas as opções de áudio/legendas, tela cheia e troca de servidor ainda precisa de uma nova rodada completa. Não declarar o site 100% aprovado.
- A tentativa de emulação móvel não alterou a largura DOM (permaneceu 1265 px); a imagem `fixed-mobile-production.jpg` não comprova celular. Validação em dispositivo móvel permanece pendente.
- O catálogo D1 tem atualização manual pelos comandos documentados em `CLOUDFLARE.md`; não há cron de atualização automática.
- Rollback de código para a versão anterior: `8ad2211f-854f-4831-bdc3-d92b74744b05`. Preservar o D1; o schema novo é aditivo.

### Continuação da validação

Correções de teclado e layout publicadas em produção: `e7f9773a-dfbe-48a1-adf6-db0db82b26f2` (health permanece `20261025-v7`; assets app v10, CSS v2, PWA v14).

- Prévia: 009-1 T1:E1 reproduziu (`readyState=4`, 11,87 s), 1 Litro de Lágrimas T1:E1 reproduziu (20,29 s), A Bíblia T1:E1 reproduziu (39,60 s) e Bob Esponja T1:E1 reproduziu (42,41 s). Evidências: `preview-anime-playing.jpg`, `preview-dorama-playing.jpg`, `preview-novela-playing.jpg`, `preview-cartoon-playing.jpg`.
- O novo relatório `remote-media.json` substitui a tentativa antiga reprovada: mídia respondeu para seis categorias e Pluto, usando exclusivamente APIs/proxy do Worker. Algumas opções retornaram 403, mas houve alternativa; Globo permaneceu 502.
- Corrigido salto duplicado das setas quando o vídeo tem foco. Com pausa, o teste na prévia mediu 86,922655 para 96,922655 segundos: exatamente +10 s. Espaço continua usando o controle nativo do vídeo.
- Emulação móvel passou a aplicar largura real de 375 px quando a aba de teste está visível. Catálogo, filtro de ano 1999 e menu funcionaram sem transbordamento. Player móvel reproduziu 24 Horas T1:E2 e abriu a lista completa. Corrigido transbordamento pelos seletores: antes 442 px, depois `clientWidth=scrollWidth=375`, vídeo ativo em 20,87 s. Evidências: `preview-mobile-films.jpg`, `preview-mobile-watch.jpg`.
- O comando de tela cheia não ativou `document.fullscreenElement` no navegador incorporado. Esse item continua sem aprovação; áudio foi desmutado por comando, sem comprovação auditiva de todas as faixas.

## Rodada inicial (versão anterior, diagnóstico histórico)

Endereço: https://deepflix.deepflix-app.workers.dev/

**Resultado: aprovação parcial. Há falhas intermitentes e fluxos reprovados.** Esta verificação foi feita no site principal; não foi apenas teste local ou da prévia.

## Confirmado

- Saúde HTTP 200, versão `20261025-v6`.
- Catálogo de filmes: a consulta exata da interface retornou 50 registros de 17.966; uma consulta anterior com ordenação expirou.
- Canais: HTTP 200 e 284 entradas agrupadas.
- Série 24 Horas: depois de recarregar, o navegador mostrou temporadas e capítulos e reproduziu T1:E1 (`readyState=4`, tempo 15 s). Próximo abriu T1:E2 e o vídeo avançou para 29 s. Voltar ao catálogo restaurou a página de séries.
- Pluto TV Drama: vídeo ativo, `readyState=4`, tempo 29 s.

## Reprovado ou pendente

- Busca geral por Matrix: não exibiu resultados no navegador durante a observação. Consultas de busca geral e com tipo explícito falharam/expiraram; a busca específica da categoria filme retornou resultados.
- Página de filmes: inicialmente ficou com zero itens. A API respondeu em uma repetição, sem comprovar estabilidade do fluxo da interface.
- Filtro de ano das categorias: o seletor só apresentou Todos os anos.
- 24 Horas: a primeira abertura informou Título não encontrado, embora uma consulta posterior retornasse 24 episódios e seis fontes. O recarregamento recuperou a reprodução.
- Matrix: no navegador, a reprodução informou erro HTTP 503 e não criou vídeo. Em uma consulta posterior, a API retornou HTTP 200 e nove opções. A causa do 503 não foi determinada; não atribuir à origem ou ao runtime sem mais evidência.
- Globo: resolução pelo Worker retornou HTTP 502, Nenhum servidor ativo respondeu para este canal.
- Troca de canal: o comando alterou a seleção, mas a reprodução do segundo canal não foi acompanhada até confirmação.
- Não foram repetidos nesta rodada todos os dispositivos, plataformas, cadastro e sincronização da interface, legendas, áudio e tela cheia; os testes anteriores não equivalem à certificação de toda a produção.

## Evidências

- `production-series.jpg`: reprodução da série.
- `production-pluto.jpg`: canal Pluto.
- `production-matrix-error.jpg`: erro 503 no filme.

Nenhuma correção de código ou nova publicação foi feita durante esta rodada de verificação. Prioridade seguinte: estabilizar catálogo/busca e a resolução na primeira abertura, preencher o filtro de ano e corrigir as fontes IPTV.
