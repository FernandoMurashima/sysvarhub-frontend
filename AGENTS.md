# AGENTS.md — Sysvar Hub Frontend

Aplicação Angular 17 operacional da loja, servida pelo Hub e acessada pelos terminais na LAN. O PDV é um módulo do Hub (`/pdv`). Rotas e decisões estruturais estão no `README.md` deste repositório; leia-o antes de mexer em navegação, sessão ou pareamento.

Repositórios relacionados: `sysvarhub-backend` (fonte operacional da venda e do caixa), `sysvarbackend` (Central).

## Comandos

```text
npx.cmd tsc -p tsconfig.app.json --noEmit
npx.cmd ng build --configuration development
npm.cmd test -- --watch=false --browsers=ChromeHeadless
npm start          # usa proxy.conf.json para /api → Backend Hub local
```

Para testes direcionados, use `--include=src/app/.../arquivo.spec.ts` quando aplicável. Caso o ChromeHeadless não esteja disponível, reporte a limitação; não altere a configuração global de testes só para contorná-la.

## Cuidados deste repositório

- Chamar somente `/api` relativo (same origin). Não versionar host, IP de cliente, token ou segredo.
- **Não chamar a Central diretamente.** Fluxos que dependem da Central passam pelo Backend Hub.
- **Operador, Terminal e Caixa são distintos.** Login não abre caixa; entrar no PDV consulta o caixa real e não cria sessão financeira; sair do PDV não fecha caixa, não encerra operador e não cancela venda.
- A venda ativa vem do Backend Hub; ao voltar ao PDV, reconciliar com a venda aberta persistida.
- **Alterações de tela:** preservar a operação offline, a sessão autenticada do operador, a identidade do terminal e a venda aberta, sem cancelar operações ou alterar o fluxo de contingência inadvertidamente.
- Senha não é persistida; só o token de sessão em `sessionStorage`. `localStorage` só como cache da identidade do terminal.
- Não copiar a estrutura administrativa da Central para o Hub.

## Documentação oficial do Sysvar

A documentação oficial (regras de negócio, decisões, riscos, homologações) fica no cofre:

- local: `C:\Takeshi\takeshi\10 Projetos\Sysvar`
- repositório: `FernandoMurashima/sysvar-vault` (`main`)

A skill `sysvar-contexto` centraliza o procedimento detalhado de recuperação das fontes do projeto; não duplique seu roteiro neste arquivo.

Antes de alterar código:

1. Use a skill `sysvar-contexto`, se estiver instalada e disponível, para localizar as fontes vigentes do módulo.
2. Se indisponível, consulte no cofre somente os documentos pertinentes e existentes; não crie documentos ausentes para completar um padrão.
3. Leia o código atual relacionado antes de criar qualquer coisa.

Não leia as notas gerais grandes (`Sysvar.md`, `Riscos e Cuidados.md`, `Mapa Técnico.md`) inteiras: busque nelas o trecho do módulo.

## Regras de trabalho

- **Pré-verificação:** antes de alterar, confira branch, HEAD e `git status --short`. Preserve alterações preexistentes; nunca sobrescreva trabalho alheio.
- **Tarefa somente de análise:** auditorias, levantamentos e diagnósticos não autorizam editar arquivos, criar commits ou fazer push.
- **Reaproveitar → refatorar → estender → criar.** Não construa do zero o que já existe. Antes de criar model, endpoint, serializer, service, componente ou helper, procure um equivalente.
- **Não invente regra de negócio.** Se houver dúvida que o prompt, a documentação e o código não resolvem, preserve o comportamento atual e registre a dúvida no relatório final.
- **Hierarquia de fontes:** decisão aprovada no prompt > documentação vigente > código atual > inferência. Seções datadas e checkpoints são histórico.
- **Escopo fechado.** Altere só o que a tarefa pede. Correção pequena não vira refatoração.
- **Backend é a autoridade** de validações, cálculos e permissões. O frontend pode antecipar, nunca substituir.
- **Multiempresa:** todo acesso a dados respeita tenant, empresa e loja no backend.
- **Testes proporcionais ao escopo**, incluindo o caso negativo da regra alterada. Execute testes direcionados por padrão; suíte completa somente se a abrangência da mudança justificar ou a tarefa solicitar. Proibido: `skip` sem necessidade, comentar teste, enfraquecer assert, mudar regra aprovada para o teste passar.
- **Segredos:** não versionar nem copiar `.env`, tokens, XML de cliente, dumps, logs ou filas SQLite.

## Encerramento de toda tarefa

1. Em tarefas com alterações autorizadas, executar somente os testes, verificações e builds pertinentes; não rodar a suíte completa por padrão. Em auditorias e diagnósticos, não executar validações invasivas sem solicitação.
2. Somente quando a tarefa autorizar modificações e versionamento: revisar o diff, executar `git add` apenas dos arquivos intencionais, criar `git commit` com resumo curto, imperativo, em português (ex.: `Corrige exibicao de credito na troca do Hub`) e executar `git push origin main` se autorizado. Nunca incluir modificações preexistentes não relacionadas.
3. Sem mensagens intermediárias. Entregar um único relatório final com: resumo; documentação consultada; código reaproveitado; arquivos alterados; migrations; testes e builds pertinentes (ou motivo da não execução); SHA e confirmação do push quando houver; `git status` final; pendências reais e dúvidas de negócio. Em tarefas somente de leitura, informar expressamente que não houve alterações nem commit/push.
