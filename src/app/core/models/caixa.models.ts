import {
  mapOperador,
  OperadorHubPublico,
  OperadorHubPublicoApi,
} from './operador.models';

export type CaixaSessionStatus = 'inicializando' | 'fechado' | 'aberto' | 'erro';
export type CaixaFechamentoSituacao = 'OK' | 'SOBRA' | 'FALTA';

export interface CaixaHubResumo {
  id: number;
  codigo: string;
  descricao: string;
  ativo: boolean;
}

export interface TerminalCaixaResumo {
  uuid: string;
  codigo: string;
  nome: string;
}

export interface SessaoCaixaHubResumo {
  uuid: string;
  status: 'ABERTO' | 'FECHADO';
  valorAbertura: string;
  abertoEm: string;
  fechadoEm: string | null;
  caixa: CaixaHubResumo;
  terminalAbertura: TerminalCaixaResumo;
  operadorAbertura: OperadorHubPublico;
  terminalFechamento: TerminalCaixaResumo | null;
  operadorFechamento: OperadorHubPublico | null;
  valorEsperadoFechamento?: string | null;
  valorContadoFechamento?: string | null;
  diferencaFechamento?: string | null;
  situacaoFechamento?: CaixaFechamentoSituacao | '' | null;
  observacaoFechamento?: string | null;
}

export interface CaixaStatusResponse {
  caixa: CaixaHubResumo;
  aberto: boolean;
  sessao: SessaoCaixaHubResumo | null;
}

export interface CaixaAbrirRequest {
  valor_abertura: string;
}

export interface CaixaFechamentoRequest {
  valor_contado: string;
  observacao: string;
}

export interface CaixaFechamentoFormaPagamento {
  id: number;
  codigo: string;
  descricao: string;
  tipo: string;
  quantidade: number;
  valor: string;
}

export interface CaixaFechamentoResumoSnapshot {
  valorAbertura: string;
  quantidadeVendas: number;
  totalVendas: string;
  valorRecebido: string;
  troco: string;
  formasPagamento: CaixaFechamentoFormaPagamento[];
  dinheiroBruto: string;
  dinheiroLiquido: string;
  despesas: string;
  sangrias: string;
  suprimentos: string;
  dinheiroEsperado: string;
}

export interface CaixaFechamentoResultado {
  valorEsperado: string;
  valorContado: string;
  diferenca: string;
  situacao: CaixaFechamentoSituacao;
  resumo: CaixaFechamentoResumoSnapshot;
}

export interface CaixaFecharResultado {
  ok: boolean;
  detail?: string;
  sessao?: SessaoCaixaHubResumo;
  fechamento?: CaixaFechamentoResultado;
}

export interface CaixaHubResumoApi {
  id: number;
  codigo: string;
  descricao: string;
  ativo: boolean;
}

export interface TerminalCaixaResumoApi {
  uuid: string;
  codigo: string;
  nome: string;
}

export interface SessaoCaixaHubResumoApi {
  uuid: string;
  status: 'ABERTO' | 'FECHADO';
  valor_abertura: string;
  aberto_em: string;
  fechado_em: string | null;
  caixa: CaixaHubResumoApi;
  terminal_abertura: TerminalCaixaResumoApi;
  operador_abertura: OperadorHubPublicoApi;
  terminal_fechamento: TerminalCaixaResumoApi | null;
  operador_fechamento: OperadorHubPublicoApi | null;
  valor_esperado_fechamento?: string | null;
  valor_contado_fechamento?: string | null;
  diferenca_fechamento?: string | null;
  situacao_fechamento?: CaixaFechamentoSituacao | '' | null;
  observacao_fechamento?: string | null;
}

export interface CaixaFechamentoResultadoApi {
  valor_esperado: string;
  valor_contado: string;
  diferenca: string;
  situacao: CaixaFechamentoSituacao;
  resumo: CaixaFechamentoResumoSnapshotApi;
}

export interface CaixaFechamentoFormaPagamentoApi {
  id: number;
  codigo: string;
  descricao: string;
  tipo: string;
  quantidade: number;
  valor: string;
}

export interface CaixaFechamentoResumoSnapshotApi {
  valor_abertura: string;
  quantidade_vendas: number;
  total_vendas: string;
  valor_recebido: string;
  troco: string;
  formas_pagamento: CaixaFechamentoFormaPagamentoApi[];
  dinheiro_bruto: string;
  dinheiro_liquido: string;
  despesas: string;
  sangrias: string;
  suprimentos: string;
  dinheiro_esperado: string;
}

export interface CaixaFechamentoResponseApi {
  status: 'ok';
  sessao: SessaoCaixaHubResumoApi;
  fechamento: CaixaFechamentoResultadoApi;
}

export interface CaixaStatusResponseApi {
  caixa: CaixaHubResumoApi;
  aberto: boolean;
  sessao: SessaoCaixaHubResumoApi | null;
}

export function mapCaixaResumo(api: CaixaHubResumoApi): CaixaHubResumo {
  return {
    id: api.id,
    codigo: api.codigo,
    descricao: api.descricao,
    ativo: api.ativo,
  };
}

export function mapTerminalCaixaResumo(api: TerminalCaixaResumoApi): TerminalCaixaResumo {
  return {
    uuid: api.uuid,
    codigo: api.codigo,
    nome: api.nome,
  };
}

export function mapSessaoCaixa(api: SessaoCaixaHubResumoApi): SessaoCaixaHubResumo {
  return {
    uuid: api.uuid,
    status: api.status,
    valorAbertura: api.valor_abertura,
    abertoEm: api.aberto_em,
    fechadoEm: api.fechado_em,
    caixa: mapCaixaResumo(api.caixa),
    terminalAbertura: mapTerminalCaixaResumo(api.terminal_abertura),
    operadorAbertura: mapOperador(api.operador_abertura),
    terminalFechamento: api.terminal_fechamento ? mapTerminalCaixaResumo(api.terminal_fechamento) : null,
    operadorFechamento: api.operador_fechamento ? mapOperador(api.operador_fechamento) : null,
    valorEsperadoFechamento: api.valor_esperado_fechamento ?? null,
    valorContadoFechamento: api.valor_contado_fechamento ?? null,
    diferencaFechamento: api.diferenca_fechamento ?? null,
    situacaoFechamento: api.situacao_fechamento ?? null,
    observacaoFechamento: api.observacao_fechamento ?? null,
  };
}

export function mapCaixaFechamentoResumoSnapshot(api: CaixaFechamentoResumoSnapshotApi): CaixaFechamentoResumoSnapshot {
  return {
    valorAbertura: api.valor_abertura,
    quantidadeVendas: api.quantidade_vendas,
    totalVendas: api.total_vendas,
    valorRecebido: api.valor_recebido,
    troco: api.troco,
    formasPagamento: api.formas_pagamento.map((forma) => ({ ...forma })),
    dinheiroBruto: api.dinheiro_bruto,
    dinheiroLiquido: api.dinheiro_liquido,
    despesas: api.despesas,
    sangrias: api.sangrias,
    suprimentos: api.suprimentos,
    dinheiroEsperado: api.dinheiro_esperado,
  };
}

export function mapCaixaStatus(api: CaixaStatusResponseApi): CaixaStatusResponse {
  return {
    caixa: mapCaixaResumo(api.caixa),
    aberto: api.aberto,
    sessao: api.sessao ? mapSessaoCaixa(api.sessao) : null,
  };
}
