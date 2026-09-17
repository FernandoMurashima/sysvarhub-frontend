import { mapSessaoCaixa, SessaoCaixaHubResumo, SessaoCaixaHubResumoApi } from './caixa.models';
import { mapMovimentacaoCaixa, MovimentacaoCaixa, MovimentacaoCaixaApi } from './movimentacao-caixa.models';

export interface ResumoCaixaVendas {
  quantidade: number;
  total: string;
  valorRecebido: string;
  troco: string;
}

export interface ResumoCaixaFormaPagamento {
  id: number;
  codigo: string;
  descricao: string;
  tipo: string;
  quantidade: number;
  valor: string;
}

export interface ResumoCaixaPagamentos {
  formas: ResumoCaixaFormaPagamento[];
  dinheiroBruto: string;
  troco: string;
  dinheiroLiquido: string;
}

export interface ResumoCaixaTotalMovimentacao {
  quantidade: number;
  total: string;
}

export interface ResumoCaixaMovimentacoes {
  despesas: ResumoCaixaTotalMovimentacao;
  sangrias: ResumoCaixaTotalMovimentacao;
  suprimentos: ResumoCaixaTotalMovimentacao;
  itens: MovimentacaoCaixa[];
}

export interface ResumoCaixaDinheiro {
  valorAbertura: string;
  vendasDinheiroBruto: string;
  troco: string;
  vendasDinheiroLiquido: string;
  suprimentos: string;
  sangrias: string;
  despesas: string;
  esperado: string;
}

export interface ResumoCaixa {
  sessao: SessaoCaixaHubResumo;
  vendas: ResumoCaixaVendas;
  pagamentos: ResumoCaixaPagamentos;
  movimentacoes: ResumoCaixaMovimentacoes;
  dinheiro: ResumoCaixaDinheiro;
}

export interface ResumoCaixaVendasApi {
  quantidade: number;
  total: string;
  valor_recebido: string;
  troco: string;
}

export interface ResumoCaixaFormaPagamentoApi {
  id: number;
  codigo: string;
  descricao: string;
  tipo: string;
  quantidade: number;
  valor: string;
}

export interface ResumoCaixaPagamentosApi {
  formas: ResumoCaixaFormaPagamentoApi[];
  dinheiro_bruto: string;
  troco: string;
  dinheiro_liquido: string;
}

export interface ResumoCaixaTotalMovimentacaoApi {
  quantidade: number;
  total: string;
}

export interface ResumoCaixaMovimentacoesApi {
  despesas: ResumoCaixaTotalMovimentacaoApi;
  sangrias: ResumoCaixaTotalMovimentacaoApi;
  suprimentos: ResumoCaixaTotalMovimentacaoApi;
  itens: MovimentacaoCaixaApi[];
}

export interface ResumoCaixaDinheiroApi {
  valor_abertura: string;
  vendas_dinheiro_bruto: string;
  troco: string;
  vendas_dinheiro_liquido: string;
  suprimentos: string;
  sangrias: string;
  despesas: string;
  esperado: string;
}

export interface ResumoCaixaApi {
  sessao: SessaoCaixaHubResumoApi;
  vendas: ResumoCaixaVendasApi;
  pagamentos: ResumoCaixaPagamentosApi;
  movimentacoes: ResumoCaixaMovimentacoesApi;
  dinheiro: ResumoCaixaDinheiroApi;
}

export function mapResumoCaixa(api: ResumoCaixaApi): ResumoCaixa {
  return {
    sessao: mapSessaoCaixa(api.sessao),
    vendas: {
      quantidade: api.vendas.quantidade,
      total: api.vendas.total,
      valorRecebido: api.vendas.valor_recebido,
      troco: api.vendas.troco,
    },
    pagamentos: {
      formas: api.pagamentos.formas.map((forma) => ({ ...forma })),
      dinheiroBruto: api.pagamentos.dinheiro_bruto,
      troco: api.pagamentos.troco,
      dinheiroLiquido: api.pagamentos.dinheiro_liquido,
    },
    movimentacoes: {
      despesas: api.movimentacoes.despesas,
      sangrias: api.movimentacoes.sangrias,
      suprimentos: api.movimentacoes.suprimentos,
      itens: api.movimentacoes.itens.map(mapMovimentacaoCaixa),
    },
    dinheiro: {
      valorAbertura: api.dinheiro.valor_abertura,
      vendasDinheiroBruto: api.dinheiro.vendas_dinheiro_bruto,
      troco: api.dinheiro.troco,
      vendasDinheiroLiquido: api.dinheiro.vendas_dinheiro_liquido,
      suprimentos: api.dinheiro.suprimentos,
      sangrias: api.dinheiro.sangrias,
      despesas: api.dinheiro.despesas,
      esperado: api.dinheiro.esperado,
    },
  };
}
