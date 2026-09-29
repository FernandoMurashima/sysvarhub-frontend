# Sysvar Hub Frontend

Aplicacao operacional local do Sysvar Hub, servida pelo proprio Hub e acessada pelos terminais da loja pela LAN.

O Sysvar Hub representa a aplicacao operacional da loja. O PDV e um modulo desse Hub, acessivel pela Home e preservado tambem em `/pdv` para compatibilidade operacional.

## Estrutura operacional

- `/` abre a Home do Sysvar Hub com contexto de empresa, loja, terminal, caixa e estado local disponivel.
- `/pdv` abre o modulo PDV existente.
- `/devolucao-troca` abre a area propria de Devolucao / Troca.
- `/consulta-vendas` abre a area propria de Consulta de Vendas.
- `/vale-troca` abre a area propria de Vale-Troca.
- `/pendencias-sincronizacao` abre a area propria de Pendencias de Sincronizacao.

As areas fora do PDV foram estruturadas para evolucao funcional posterior, sem antecipar regras de negocio.

## Arquitetura de API

Em producao, o frontend chama somente caminhos relativos em same origin:

- `/api/terminal/parear/`
- `/api/terminal/recuperar-local/`
- `/api/terminal/contexto/`
- `/api/terminal/heartbeat/`
- `/api/terminal/catalogo/`

Nao ha host, IP, token ou segredo versionado no frontend. Durante desenvolvimento, `npm start` usa `proxy.conf.json` para encaminhar `/api` para `http://127.0.0.1:8100`.

## Identidade do terminal

A identidade persistente do terminal pertence ao Hub local. No pareamento, o backend guarda o token operacional em forma cifrada e mantem o hash para autenticacao normal das chamadas `Authorization: Terminal ...`.

O navegador usa `localStorage` apenas como cache da credencial para enviar as requisicoes autenticadas. Se o navegador for fechado, recriado ou perder o storage, o frontend tenta `/api/terminal/recuperar-local/` antes de redirecionar para `/pareamento`.

A recuperacao local so acontece quando existe terminal ativo, pareado, com pareamento usado nao revogado e credencial cifrada valida no Hub. Terminal nunca pareado, inativo, revogado ou com credencial invalida continua exigindo novo pareamento pelo fluxo administrativo normal.

## Decisoes

- O Hub Frontend nao copia a estrutura administrativa do Sysvar Central.
- O PDV real permanece em `/pdv` como modulo do Sysvar Hub.
- Devolucao / Troca, Consulta de Vendas, Vale-Troca e Pendencias de Sincronizacao sao modulos proprios preparados para evolucao posterior.
- A migracao do `PdvDesktopComponent` deve passar por uma camada operacional `PdvHubFacade`.
- Servicos administrativos do Central devem ser analisados um a um antes de qualquer reaproveitamento.
- Nao usar Electron, SQLite ou IndexedDB de catalogo neste passo.
