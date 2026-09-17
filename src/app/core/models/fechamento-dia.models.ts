import { OperadorHubPublico, OperadorHubPublicoApi, mapOperador } from './operador.models';

export type FechamentoDiaSituacao = 'OK' | 'DIVERGENTE';
export type FechamentoDiaFormaSituacao = 'OK' | 'SOBRA' | 'FALTA';

export interface FechamentoDiaVendas {
  quantidade: number;
  total: string;
  troco: string;
}

export interface FechamentoDiaCaixas {
  sessoes: number;
  abertos: number;
  fechados: number;
  valorEsperado: string;
  valorContado: string;
  diferenca: string;
}

export interface FechamentoDiaMovimentacoes {
  despesas: string;
  sangrias: string;
  suprimentos: string;
}

export interface FechamentoDiaFormaDetalhe {
  retaguardaFormaPagamentoId: number;
  codigo: string;
  descricao: string;
  tipo: string;
  adquirente: string | null;
  quantidade: number;
  valor: string;
}

export interface FechamentoDiaForma {
  tipo: string;
  descricao: string;
  quantidade: number;
  valorSistema: string;
  detalhes: FechamentoDiaFormaDetalhe[];
}

export interface FechamentoDiaConsistencia {
  ok: boolean;
  totalVendas: string;
  totalFormas: string;
  diferenca: string;
}

export interface FechamentoDiaPrevia {
  dataOperacional: string;
  fechado: boolean;
  vendas: FechamentoDiaVendas;
  formasPagamento: FechamentoDiaForma[];
  caixas: FechamentoDiaCaixas;
  movimentacoes: FechamentoDiaMovimentacoes;
  consistencia: FechamentoDiaConsistencia | null;
  podeFechar: boolean;
  impedimentos: string[];
  fechamento: FechamentoDiaRegistro | null;
}

export interface FechamentoDiaTerminal {
  uuid: string;
  codigo: string;
  nome: string;
}

export interface FechamentoDiaFormaRegistro extends FechamentoDiaForma {
  valorConferido: string;
  diferenca: string;
  situacao: FechamentoDiaFormaSituacao;
}

export interface FechamentoDiaRegistro {
  uuid: string;
  dataOperacional: string;
  quantidadeVendas: number;
  totalVendas: string;
  totalSistema: string;
  totalConferido: string;
  diferencaTotal: string;
  situacao: FechamentoDiaSituacao;
  operadorFechamento: OperadorHubPublico;
  terminalFechamento: FechamentoDiaTerminal;
  fechadoEm: string;
  observacao: string;
  formasPagamento: FechamentoDiaFormaRegistro[];
}

export interface FechamentoDiaPayload {
  dataOperacional: string;
  formasPagamento: Array<{
    tipo: string;
    valorConferido: string;
  }>;
  observacao: string;
}

export interface FechamentoDiaVendasApi {
  quantidade: number;
  total: string;
  troco: string;
}

export interface FechamentoDiaCaixasApi {
  sessoes: number;
  abertos: number;
  fechados: number;
  valor_esperado: string;
  valor_contado: string;
  diferenca: string;
}

export interface FechamentoDiaMovimentacoesApi {
  despesas: string;
  sangrias: string;
  suprimentos: string;
}

export interface FechamentoDiaFormaDetalheApi {
  retaguarda_forma_pagamento_id: number;
  codigo: string;
  descricao: string;
  tipo: string;
  adquirente: string | null;
  quantidade: number;
  valor: string;
}

export interface FechamentoDiaFormaApi {
  tipo: string;
  descricao: string;
  quantidade: number;
  valor_sistema: string;
  detalhes: FechamentoDiaFormaDetalheApi[];
}

export interface FechamentoDiaConsistenciaApi {
  ok: boolean;
  total_vendas: string;
  total_formas: string;
  diferenca: string;
}

export interface FechamentoDiaPreviaApi {
  data_operacional: string;
  fechado: boolean;
  vendas: FechamentoDiaVendasApi;
  formas_pagamento: FechamentoDiaFormaApi[];
  caixas: FechamentoDiaCaixasApi;
  movimentacoes: FechamentoDiaMovimentacoesApi;
  consistencia?: FechamentoDiaConsistenciaApi | null;
  pode_fechar: boolean;
  impedimentos: string[];
  fechamento?: FechamentoDiaRegistroApi | null;
}

export interface FechamentoDiaTerminalApi {
  uuid: string;
  codigo: string;
  nome: string;
}

export interface FechamentoDiaFormaRegistroApi extends FechamentoDiaFormaApi {
  valor_conferido: string;
  diferenca: string;
  situacao: FechamentoDiaFormaSituacao;
}

export interface FechamentoDiaRegistroApi {
  uuid: string;
  data_operacional: string;
  quantidade_vendas: number;
  total_vendas: string;
  total_sistema: string;
  total_conferido: string;
  diferenca_total: string;
  situacao: FechamentoDiaSituacao;
  operador_fechamento: OperadorHubPublicoApi;
  terminal_fechamento: FechamentoDiaTerminalApi;
  fechado_em: string;
  observacao: string;
  formas_pagamento: FechamentoDiaFormaRegistroApi[];
}

export interface FechamentoDiaResponseApi {
  status: 'ok';
  fechamento: FechamentoDiaRegistroApi;
}

export interface FechamentoDiaConflictApi {
  detail: string;
  preview?: FechamentoDiaPreviaApi;
  fechamento?: FechamentoDiaRegistroApi;
}

export function mapFechamentoDiaPrevia(api: FechamentoDiaPreviaApi): FechamentoDiaPrevia {
  return {
    dataOperacional: api.data_operacional,
    fechado: api.fechado,
    vendas: {
      quantidade: api.vendas.quantidade,
      total: api.vendas.total,
      troco: api.vendas.troco,
    },
    formasPagamento: api.formas_pagamento.map(mapFechamentoDiaForma),
    caixas: {
      sessoes: api.caixas.sessoes,
      abertos: api.caixas.abertos,
      fechados: api.caixas.fechados,
      valorEsperado: api.caixas.valor_esperado,
      valorContado: api.caixas.valor_contado,
      diferenca: api.caixas.diferenca,
    },
    movimentacoes: {
      despesas: api.movimentacoes.despesas,
      sangrias: api.movimentacoes.sangrias,
      suprimentos: api.movimentacoes.suprimentos,
    },
    consistencia: api.consistencia ? {
      ok: api.consistencia.ok,
      totalVendas: api.consistencia.total_vendas,
      totalFormas: api.consistencia.total_formas,
      diferenca: api.consistencia.diferenca,
    } : null,
    podeFechar: api.pode_fechar,
    impedimentos: [...api.impedimentos],
    fechamento: api.fechamento ? mapFechamentoDiaRegistro(api.fechamento) : null,
  };
}

export function mapFechamentoDiaRegistro(api: FechamentoDiaRegistroApi): FechamentoDiaRegistro {
  return {
    uuid: api.uuid,
    dataOperacional: api.data_operacional,
    quantidadeVendas: api.quantidade_vendas,
    totalVendas: api.total_vendas,
    totalSistema: api.total_sistema,
    totalConferido: api.total_conferido,
    diferencaTotal: api.diferenca_total,
    situacao: api.situacao,
    operadorFechamento: mapOperador(api.operador_fechamento),
    terminalFechamento: { ...api.terminal_fechamento },
    fechadoEm: api.fechado_em,
    observacao: api.observacao,
    formasPagamento: api.formas_pagamento.map((forma) => ({
      ...mapFechamentoDiaForma(forma),
      valorConferido: forma.valor_conferido,
      diferenca: forma.diferenca,
      situacao: forma.situacao,
    })),
  };
}

export function mapFechamentoDiaPayload(payload: FechamentoDiaPayload): {
  data_operacional: string;
  formas_pagamento: Array<{ tipo: string; valor_conferido: string }>;
  observacao: string;
} {
  return {
    data_operacional: payload.dataOperacional,
    formas_pagamento: payload.formasPagamento.map((forma) => ({
      tipo: forma.tipo,
      valor_conferido: forma.valorConferido,
    })),
    observacao: payload.observacao,
  };
}

function mapFechamentoDiaForma(api: FechamentoDiaFormaApi): FechamentoDiaForma {
  return {
    tipo: api.tipo,
    descricao: api.descricao,
    quantidade: api.quantidade,
    valorSistema: api.valor_sistema,
    detalhes: api.detalhes.map((detalhe) => ({
      retaguardaFormaPagamentoId: detalhe.retaguarda_forma_pagamento_id,
      codigo: detalhe.codigo,
      descricao: detalhe.descricao,
      tipo: detalhe.tipo,
      adquirente: detalhe.adquirente,
      quantidade: detalhe.quantidade,
      valor: detalhe.valor,
    })),
  };
}
