# Sysvar Hub Frontend

Aplicação operacional local do Sysvar Hub, servida pelo próprio Hub e acessada pelos terminais da loja pela LAN.

O Sysvar Hub representa a aplicação operacional da loja. O PDV é um módulo desse Hub, acessível pela Home e preservado também em `/pdv`.

## Estrutura operacional

- `/` — Home do Sysvar Hub com contexto operacional local.
- `/pdv` — módulo PDV.
- `/devolucao-troca` — Devolução / Troca.
- `/consulta-vendas` — Consulta de Vendas.
- `/vale-troca` — Vale-Troca.
- `/pendencias-sincronizacao` — Pendências de Sincronização.
- `/operador` — autenticação da sessão pessoal do operador.
- `/pareamento` — fluxo de pareamento/recuperação da identidade do terminal quando necessário.

Os módulos devem refletir o estado funcional real do backend Hub e da Central. Não tratar Devolução/Troca ou Vale-Troca como simples placeholders quando os fluxos já estiverem implementados.

## Sessão do operador

A Home pode permanecer acessível com empresa, loja e terminal identificados mesmo sem operador autenticado.

Operador é a sessão pessoal autenticada no Hub. O frontend guarda apenas o token de sessão em `sessionStorage`; senha não é persistida.

Módulos protegidos exigem sessão ativa do operador. Quando necessário, o usuário é enviado para `/operador` e retorna ao módulo solicitado após autenticação válida.

PDV é um módulo protegido. Caixa é a sessão financeira do PDV e permanece separada da autenticação pessoal do operador.

Login do operador não abre caixa automaticamente.

Entrar no PDV consulta a situação real do caixa e não cria sessão financeira sozinho. Sair do PDV para a Home ou para outros módulos não deve fechar caixa, encerrar operador ou cancelar venda em andamento.

A venda ativa tem como fonte operacional o Backend Hub local. Ao retornar ao PDV, a tela reconcilia o estado com a venda aberta persistida do terminal.

## Arquitetura de API

Em produção, o frontend chama somente caminhos relativos em same origin sob `/api`.

Durante desenvolvimento, `npm start` usa `proxy.conf.json` para encaminhar `/api` ao Backend Hub local.

Não versionar host operacional, IP de cliente, token ou segredo no frontend.

## Identidade do terminal

A identidade persistente do terminal pertence ao Hub local.

No pareamento, o backend mantém a credencial operacional protegida localmente e o navegador usa `localStorage` somente como cache necessário às chamadas autenticadas.

Se o navegador perder o storage, o frontend tenta recuperar a identidade local antes de exigir novo pareamento.

Terminal inativo, revogado ou com credencial inválida deve retornar ao fluxo administrativo de pareamento/configuração apropriado.

## Relação com a Central

O frontend do Hub não chama diretamente APIs web/JWT da Central para executar regras corporativas. Fluxos que dependem da Central passam pelo Backend Hub, que utiliza a autenticação e os contratos de integração próprios do Hub.

Isso vale especialmente para operações como sincronização, consulta online, devolução/troca, Vale-Troca e demais fluxos que atravessem a fronteira Hub ↔ Central.

## Decisões estruturais

- O Hub Frontend não copia a estrutura administrativa do Sysvar Central.
- O PDV permanece em `/pdv` como módulo do Sysvar Hub.
- Operador, Terminal e Caixa são conceitos distintos.
- A venda operacional local deve continuar reconciliável com o estado persistido no Backend Hub.
- Serviços administrativos da Central devem ser analisados antes de qualquer reaproveitamento no Hub.
- Não expor credenciais do Hub ao navegador.

## Documentação

A documentação central do Projeto Sysvar fica em:

`FernandoMurashima/sysvar-vault`

Pasta principal:

`takeshi/10 Projetos/Sysvar`

Contexto específico do Hub:

`takeshi/10 Projetos/Sysvar/Contexto do Projeto/Sysvar Hub.md`

Este README deve permanecer como referência técnica curta do repositório. Regras funcionais transversais, decisões arquiteturais, homologações e runbooks pertencem ao `sysvar-vault`.
