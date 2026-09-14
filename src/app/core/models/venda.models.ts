import { mapOperador, OperadorHubPublico, OperadorHubPublicoApi } from './operador.models';

export type VendaSessionStatus = 'inicializando' | 'sem-venda' | 'aberta' | 'erro';

export interface VendaItemHubResumo {
  uuid: string;
  produtoId: number;
  skuId: number;
  ean13: string | null;
  referencia: string;
  codigoItemRef: string;
  descricao: string;
  descricaoReduzida: string;
  cor: string;
  tamanho: string;
  unidade: string;
  quantidade: number;
  precoUnitario: string;
  desconto: string;
  totalItem: string;
}

export interface VendaHubResumo {
  uuid: string;
  status: 'ABERTA' | 'FINALIZADA' | 'CANCELADA';
  criadaEm: string;
  subtotal: string;
  descontoItens: string;
  descontoGeral: string;
  total: string;
  totalPago: string;
  pendente: string;
  troco: string;
  operadorCriacao: OperadorHubPublico;
  itens: VendaItemHubResumo[];
  pagamentos: VendaPagamentoHubResumo[];
}

export interface VendaPagamentoHubResumo {
  uuid: string;
  formaPagamentoId: number;
  formaRetaguardaId: number;
  codigo: string;
  descricao: string;
  tipo: string;
  numParcelas: number;
  valor: string;
  autorizacao: string;
  origemCaptura: string;
  criadoEm: string;
}

export interface VendaAtualResponse {
  venda: VendaHubResumo | null;
}

export interface VendaItemAdicionarRequest {
  sku_id: number;
  quantidade: number;
}

export interface VendaQuantidadeRequest {
  quantidade: number;
}

export interface VendaItemHubResumoApi {
  uuid: string;
  produto_id: number;
  sku_id: number;
  ean13: string | null;
  referencia: string;
  codigo_item_ref: string;
  descricao: string;
  descricao_reduzida: string;
  cor: string;
  tamanho: string;
  unidade: string;
  quantidade: number;
  preco_unitario: string;
  desconto: string;
  total_item: string;
}

export interface VendaHubResumoApi {
  uuid: string;
  status: 'ABERTA' | 'FINALIZADA' | 'CANCELADA';
  criada_em: string;
  subtotal: string;
  desconto_itens: string;
  desconto_geral: string;
  total: string;
  total_pago?: string;
  pendente?: string;
  troco?: string;
  operador_criacao: OperadorHubPublicoApi;
  itens: VendaItemHubResumoApi[];
  pagamentos?: VendaPagamentoHubResumoApi[];
}

export interface VendaPagamentoHubResumoApi {
  uuid: string;
  forma_pagamento_id: number;
  forma_retaguarda_id: number;
  codigo: string;
  descricao: string;
  tipo: string;
  num_parcelas: number;
  valor: string;
  autorizacao: string;
  origem_captura: string;
  criado_em: string;
}

export interface VendaApiResponse {
  venda: VendaHubResumoApi | null;
}

export function mapVendaAtual(response: VendaApiResponse): VendaAtualResponse {
  return {
    venda: response.venda ? mapVenda(response.venda) : null,
  };
}

export function mapVenda(venda: VendaHubResumoApi): VendaHubResumo {
  return {
    uuid: venda.uuid,
    status: venda.status,
    criadaEm: venda.criada_em,
    subtotal: venda.subtotal,
    descontoItens: venda.desconto_itens,
    descontoGeral: venda.desconto_geral,
    total: venda.total,
    totalPago: venda.total_pago ?? '0.00',
    pendente: venda.pendente ?? venda.total,
    troco: venda.troco ?? '0.00',
    operadorCriacao: mapOperador(venda.operador_criacao),
    itens: venda.itens.map(mapVendaItem),
    pagamentos: (venda.pagamentos ?? []).map(mapVendaPagamento),
  };
}

export function mapVendaItem(item: VendaItemHubResumoApi): VendaItemHubResumo {
  return {
    uuid: item.uuid,
    produtoId: item.produto_id,
    skuId: item.sku_id,
    ean13: item.ean13,
    referencia: item.referencia,
    codigoItemRef: item.codigo_item_ref,
    descricao: item.descricao,
    descricaoReduzida: item.descricao_reduzida,
    cor: item.cor,
    tamanho: item.tamanho,
    unidade: item.unidade,
    quantidade: item.quantidade,
    precoUnitario: item.preco_unitario,
    desconto: item.desconto,
    totalItem: item.total_item,
  };
}

export function mapVendaPagamento(pagamento: VendaPagamentoHubResumoApi): VendaPagamentoHubResumo {
  return {
    uuid: pagamento.uuid,
    formaPagamentoId: pagamento.forma_pagamento_id,
    formaRetaguardaId: pagamento.forma_retaguarda_id,
    codigo: pagamento.codigo,
    descricao: pagamento.descricao,
    tipo: pagamento.tipo,
    numParcelas: pagamento.num_parcelas,
    valor: pagamento.valor,
    autorizacao: pagamento.autorizacao,
    origemCaptura: pagamento.origem_captura,
    criadoEm: pagamento.criado_em,
  };
}
