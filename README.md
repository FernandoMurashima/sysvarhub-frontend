# Sysvar Hub Frontend

Aplicacao operacional local do Sysvar Hub, servida pelo proprio Hub e acessada pelos terminais da loja pela LAN.

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
- O PDV real sera migrado em etapa propria para `/pdv`.
- A migracao do `PdvDesktopComponent` deve passar por uma camada operacional `PdvHubFacade`.
- Servicos administrativos do Central devem ser analisados um a um antes de qualquer reaproveitamento.
- Nao usar Electron, SQLite ou IndexedDB de catalogo neste passo.
