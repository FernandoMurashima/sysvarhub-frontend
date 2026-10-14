# AGENTS.md — Sysvar Hub Frontend

Aplicação Angular 17 operacional da loja, servida pelo Hub e acessada pelos terminais na LAN. O PDV é um módulo do Hub (`/pdv`). Rotas e decisões estruturais estão no `README.md` deste repositório; leia-o antes de mexer em navegação, sessão ou pareamento.

Repositórios relacionados: `sysvarhub-backend` (fonte operacional da venda e do caixa), `sysvarbackend` (Central).

## Comandos

```text
npx.cmd tsc -p tsconfig.app.json --noEmit
npx.cmd ng build --configuration development
npm test
npm start          # usa proxy.conf.json para /api → Backend Hub local
```

## Cuidados deste repositório

- Chamar somente `/api` relativo (same origin). Não versionar host, IP de cliente, token ou segredo.
- **Não chamar a Central diretamente.** Fluxos que dependem da Central passam pelo Backend Hub.
- **Operador, Terminal e Caixa são distintos.** Login não abre caixa; entrar no PDV consulta o caixa real e não cria sessão financeira; sair do PDV não fecha caixa, não encerra operador e não cancela venda.
- A venda ativa vem do Backend Hub; ao voltar ao PDV, reconciliar com a venda aberta persistida.
- Senha não é persistida; só o token de sessão em `sessionStorage`. `localStorage` só como cache da identidade do terminal.
- Não copiar a estrutura administrativa da Central para o Hub.

## Documentação oficial do Sysvar

A documentação oficial (regras de negócio, decisões, riscos, homologações) fica no cofre:

- local: `C:\Takeshi\takeshi\10 Projetos\Sysvar`
- repositório: `FernandoMurashima/sysvar-vault` (`main`)

Antes de alterar código:

1. Se a skill `sysvar-contexto` estiver disponível, use-a para montar o contexto do módulo.
2. Se não estiver, leia em `Contexto do Projeto/`, para o módulo da tarefa: `Estado Atual - <Área>`, `Workflows - <Área> - <Submódulo>` e `Riscos e Cuidados - <Área> - <Submódulo>`. Em `Homologações/`, leia a homologação do módulo quando existir.
3. Leia o código atual relacionado antes de criar qualquer coisa.

Não leia as notas gerais grandes (`Sysvar.md`, `Riscos e Cuidados.md`, `Mapa Técnico.md`) inteiras: busque nelas o trecho do módulo.

## Regras de trabalho

- **Reaproveitar → refatorar → estender → criar.** Não construa do zero o que já existe. Antes de criar model, endpoint, serializer, service, componente ou helper, procure um equivalente.
- **Não invente regra de negócio.** Se houver dúvida que o prompt, a documentação e o código não resolvem, preserve o comportamento atual e registre a dúvida no relatório final.
- **Hierarquia de fontes:** decisão aprovada no prompt > documentação vigente > código atual > inferência. Seções datadas e checkpoints são histórico.
- **Escopo fechado.** Altere só o que a tarefa pede. Correção pequena não vira refatoração.
- **Backend é a autoridade** de validações, cálculos e permissões. O frontend pode antecipar, nunca substituir.
- **Multiempresa:** todo acesso a dados respeita tenant, empresa e loja no backend.
- **Testes proporcionais ao escopo**, incluindo o caso negativo da regra alterada. Proibido: `skip` sem necessidade, comentar teste, enfraquecer assert, mudar regra aprovada para o teste passar.
- **Segredos:** não versionar nem copiar `.env`, tokens, XML de cliente, dumps, logs ou filas SQLite.

## Encerramento de toda tarefa

1. Rodar os testes e o build relevantes (seção Comandos acima).
2. `git add` só dos arquivos alterados intencionalmente; `git commit` com resumo curto, imperativo, em português (ex.: `Corrige escopo multiempresa da devolucao Hub`); `git push origin main`.
3. Sem mensagens intermediárias. Entregar um único relatório final com: resumo; documentação consultada; código reaproveitado; arquivos alterados; migrations; testes e builds com resultado; commit SHA; confirmação do push; pendências reais e dúvidas de negócio.
