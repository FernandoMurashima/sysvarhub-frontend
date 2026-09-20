import { mapOperador, OperadorHubPublico, OperadorHubPublicoApi } from './operador.models';
import { mapVendedor, VendedorHubResumo, VendedorHubResumoApi } from './vendedor.models';

export type VendaSessionStatus = 'inicializando' | 'sem-venda' | 'aberta' | 'erro';
export type VendaFiscalStatus = 'GERADA' | 'CONTINGENCIA' | 'AUTORIZADA' | 'REJEITADA' | 'ERRO_GERACAO' | 'PENDENTE_TRANSMISSAO';

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
  promocao: VendaItemPromocaoResumo | null;
}

export interface VendaItemPromocaoResumo {
  id: number;
  nome: string;
  tipo: string;
  valor: string;
  acumulaCashback: boolean;
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
  cliente: VendaClienteResumo | null;
  vendedor: VendedorHubResumo | null;
  operadorCriacao: OperadorHubPublico;
  itens: VendaItemHubResumo[];
  pagamentos: VendaPagamentoHubResumo[];
  fiscal: VendaFiscalResumo;
}

export interface VendaFiscalResumo {
  emiteNfce: boolean;
  nfceUuid: string | null;
  status: VendaFiscalStatus | null;
  numero: number | null;
  serie: number | null;
  chaveAcesso: string | null;
  tipoEmissao: string;
  contingencia: boolean;
  mensagem: string;
}

export interface VendaClienteResumo {
  clienteUuid: string;
  retaguardaId: number | null;
  tipoPessoa: 'PF' | 'PJ' | '';
  documento: string | null;
  clientePadrao: boolean;
  nomeCliente: string;
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
  valeTrocaDocumento: string;
  origemCaptura: string;
  criadoEm: string;
}

export interface VendaAtualResponse {
  venda: VendaHubResumo | null;
  clientePreselecionado: VendaClienteResumo | null;
  vendedorPreselecionado: VendedorHubResumo | null;
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
  promocao?: VendaItemPromocaoResumoApi | null;
}

export interface VendaItemPromocaoResumoApi {
  id: number;
  nome: string;
  tipo: string;
  valor: string;
  acumula_cashback: boolean;
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
  cliente?: VendaClienteResumoApi | null;
  vendedor?: VendedorHubResumoApi | null;
  operador_criacao: OperadorHubPublicoApi;
  itens: VendaItemHubResumoApi[];
  pagamentos?: VendaPagamentoHubResumoApi[];
  fiscal?: VendaFiscalResumoApi | null;
}

export interface VendaFiscalResumoApi {
  emite_nfce: boolean;
  nfce_uuid?: string | null;
  status?: VendaFiscalStatus | null;
  numero?: number | null;
  serie?: number | null;
  chave_acesso?: string | null;
  tipo_emissao?: string | null;
  contingencia?: boolean;
  mensagem?: string | null;
}

export interface VendaClienteResumoApi {
  cliente_uuid: string;
  retaguarda_id: number | null;
  tipo_pessoa: 'PF' | 'PJ' | '';
  documento: string | null;
  cliente_padrao: boolean;
  nome_cliente: string;
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
  vale_troca_documento?: string;
  origem_captura: string;
  criado_em: string;
}

export interface VendaApiResponse {
  venda: VendaHubResumoApi | null;
  cliente_preselecionado?: VendaClienteResumoApi | null;
  vendedor_preselecionado?: VendedorHubResumoApi | null;
}

export function mapVendaAtual(response: VendaApiResponse): VendaAtualResponse {
  const venda = response.venda ? mapVenda(response.venda) : null;
  return {
    venda,
    clientePreselecionado: venda ? null : response.cliente_preselecionado ? mapVendaCliente(response.cliente_preselecionado) : null,
    vendedorPreselecionado: venda ? null : response.vendedor_preselecionado ? mapVendedor(response.vendedor_preselecionado) : null,
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
    cliente: venda.cliente ? mapVendaCliente(venda.cliente) : null,
    vendedor: venda.vendedor ? mapVendedor(venda.vendedor) : null,
    operadorCriacao: mapOperador(venda.operador_criacao),
    itens: venda.itens.map(mapVendaItem),
    pagamentos: (venda.pagamentos ?? []).map(mapVendaPagamento),
    fiscal: mapVendaFiscal(venda.fiscal),
  };
}

export function mapVendaFiscal(fiscal: VendaFiscalResumoApi | null | undefined): VendaFiscalResumo {
  return {
    emiteNfce: Boolean(fiscal?.emite_nfce),
    nfceUuid: fiscal?.nfce_uuid ?? null,
    status: fiscal?.status ?? null,
    numero: fiscal?.numero ?? null,
    serie: fiscal?.serie ?? null,
    chaveAcesso: fiscal?.chave_acesso ?? null,
    tipoEmissao: fiscal?.tipo_emissao ?? '',
    contingencia: Boolean(fiscal?.contingencia),
    mensagem: fiscal?.mensagem ?? '',
  };
}

export function mapVendaCliente(cliente: VendaClienteResumoApi): VendaClienteResumo {
  return {
    clienteUuid: cliente.cliente_uuid,
    retaguardaId: cliente.retaguarda_id,
    tipoPessoa: cliente.tipo_pessoa,
    documento: cliente.documento,
    clientePadrao: cliente.cliente_padrao,
    nomeCliente: cliente.nome_cliente,
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
    promocao: item.promocao ? {
      id: item.promocao.id,
      nome: item.promocao.nome,
      tipo: item.promocao.tipo,
      valor: item.promocao.valor,
      acumulaCashback: item.promocao.acumula_cashback,
    } : null,
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
    valeTrocaDocumento: pagamento.vale_troca_documento ?? '',
    origemCaptura: pagamento.origem_captura,
    criadoEm: pagamento.criado_em,
  };
}
