# Sysvar Hub Frontend

Aplicacao operacional local do Sysvar Hub, servida pelo proprio Hub e acessada pelos terminais da loja pela LAN.

## Arquitetura de API

Em producao, o frontend chama somente caminhos relativos em same origin:

- `/api/terminal/parear/`
- `/api/terminal/contexto/`
- `/api/terminal/heartbeat/`
- `/api/terminal/catalogo/`

Nao ha host, IP, token ou segredo versionado no frontend. Durante desenvolvimento, `npm start` usa `proxy.conf.json` para encaminhar `/api` para `http://127.0.0.1:8100`.

## Decisoes

- O Hub Frontend nao copia a estrutura administrativa do Sysvar Central.
- O PDV real sera migrado em etapa propria para `/pdv`.
- A migracao do `PdvDesktopComponent` deve passar por uma camada operacional `PdvHubFacade`.
- Servicos administrativos do Central devem ser analisados um a um antes de qualquer reaproveitamento.
- Nao usar Electron, SQLite ou IndexedDB de catalogo neste passo.
