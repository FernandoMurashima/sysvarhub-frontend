import { mapOperador, OperadorHubPublico, OperadorHubPublicoApi } from './operador.models';
import { mapVendedor, VendedorHubResumo, VendedorHubResumoApi } from './vendedor.models';

export type VendaSessionStatus = 'inicializando' | 'sem-venda' | 'aberta' | 'erro';
export type VendaFiscalStatus = 'GERADA' | 'CONTINGENCIA' | 'AUTORIZADA' | 'REJEITADA' | 'ERRO_GERACAO' | 'PENDENTE_TRANSMISSAO';
export type VendaConsultaStatus = 'ABERTA' | 'FINALIZADA' | 'CANCELADA';
export type VendaSincronizacaoStatus = 'PENDENTE' | 'PROCESSANDO' | 'SINCRONIZADO' | 'ERRO' | 'CONFLITO' | 'SEM_EVENTO';

export interface ConsultaVendasFiltros {
  dataIni: string;
  dataFim: string;
  documento?: string;
  cliente?: string;
  vendedor?: string;
  formaPagamento?: string;
  nfce?: string;
  status?: VendaConsultaStatus;
  page?: number;
  pageSize?: number;
}

export interface ConsultaVendasPaginada {
  count: number;
  page: number;
  pageSize: number;
  totalPages: number;
  results: VendaConsultaResumo[];
}

export interface VendaConsultaCliente {
  nome: string;
  documento: string;
  clienteUuid?: string | null;
  retaguardaId?: number | null;
}

export interface VendaConsultaVendedor {
  id: number | null;
  retaguardaId: number | null;
  matricula: string;
  nome: string;
  apelido: string;
}

export interface VendaConsultaTerminal {
  codigo: string;
  nome: string;
}

export interface VendaConsultaCaixa {
  codigo: string;
  descricao: string;
  nome: string;
}

export interface VendaConsultaPagamentoResumo {
  codigo: string;
  descricao: string;
  tipo: string;
  valor: string;
}

export interface VendaConsultaPagamentoDetalhe extends VendaConsultaPagamentoResumo {
  pagamentoUuid: string;
  autorizacao: string;
  prazo: {
    codigo: string;
    descricao: string;
    retaguardaId: number | null;
  };
  numParcelas: number;
  taxaPercentual: string;
  taxaFixa: string;
  parcelas: VendaConsultaParcela[];
  valeTroca: {
    documento: string;
    retaguardaId: number | null;
    reservaId: number | null;
    valorReservado: string;
  } | null;
}

export interface VendaConsultaParcela {
  ordem: number;
  dias: number;
  percentual: string | null;
  valorFixo: string | null;
}

export interface VendaConsultaNfceResumo {
  numero: number;
  serie: number;
  status: string;
}

export interface VendaConsultaNfceDetalhe extends VendaConsultaNfceResumo {
  nfceUuid: string;
  modelo: string;
  chaveAcesso: string;
  protocolo: string;
  tipoEmissao: string;
  retornoCodigo: string;
  retornoMensagem: string;
  emitidaEm: string | null;
  autorizadaEm: string | null;
}

export interface VendaConsultaSincronizacao {
  status: VendaSincronizacaoStatus;
  ultimoErro: string;
  tentativas: number;
  sincronizadoEm: string | null;
  tipo?: string;
}

export interface VendaConsultaResumo {
  vendaUuid: string;
  documento: string | null;
  status: VendaConsultaStatus;
  finalizadaEm: string | null;
  total: string;
  subtotal: string;
  descontoGeral: string;
  cliente: VendaConsultaCliente;
  vendedor: VendaConsultaVendedor | null;
  terminal: VendaConsultaTerminal | null;
  caixa: VendaConsultaCaixa | null;
  pagamentos: VendaConsultaPagamentoResumo[];
  nfce: VendaConsultaNfceResumo | null;
  sincronizacao: VendaConsultaSincronizacao;
}

export interface VendaConsultaHubLoja {
  hubUuid: string;
  empresaId: number | null;
  empresaNome: string;
  lojaId: number | null;
  lojaNome: string;
  lojaApelido: string;
}

export interface VendaConsultaOperador {
  id: number | null;
  codigo: string;
  nome: string;
}

export interface VendaConsultaItem {
  itemUuid: string;
  ean: string;
  referencia: string;
  codigoItemRef: string;
  descricao: string;
  cor: string;
  tamanho: string;
  quantidade: number;
  precoUnitario: string;
  desconto: string;
  totalItem: string;
  promocao: {
    id: number;
    nome: string;
    tipo: string;
    valor: string;
  } | null;
}

export interface VendaConsultaDetalhe extends Omit<VendaConsultaResumo, 'sincronizacao'> {
  criadaEm: string;
  valorRecebido: string;
  troco: string;
  hub: VendaConsultaHubLoja;
  loja: VendaConsultaHubLoja;
  operadorFinalizacao: VendaConsultaOperador | null;
  itens: VendaConsultaItem[];
  pagamentos: VendaConsultaPagamentoDetalhe[];
  nfce: VendaConsultaNfceDetalhe | null;
  sincronizacao: {
    vendaFinalizada: VendaConsultaSincronizacao;
    nfceAtualizada: VendaConsultaSincronizacao | null;
  };
}

export interface ConsultaVendasPaginadaApi {
  count: number;
  page: number;
  page_size: number;
  total_pages: number;
  results: VendaConsultaResumoApi[];
}

export interface VendaConsultaClienteApi {
  nome: string;
  documento: string;
  cliente_uuid?: string | null;
  retaguarda_id?: number | null;
}

export interface VendaConsultaVendedorApi {
  id: number | null;
  retaguarda_id: number | null;
  matricula: string;
  nome: string;
  apelido: string;
}

export interface VendaConsultaTerminalApi {
  codigo: string;
  nome: string;
}

export interface VendaConsultaCaixaApi {
  codigo: string;
  descricao: string;
  nome: string;
}

export interface VendaConsultaPagamentoResumoApi {
  codigo: string;
  descricao: string;
  tipo: string;
  valor: string;
}

export interface VendaConsultaPagamentoDetalheApi extends VendaConsultaPagamentoResumoApi {
  pagamento_uuid: string;
  autorizacao: string;
  prazo: {
    codigo: string;
    descricao: string;
    retaguarda_id: number | null;
  };
  num_parcelas: number;
  taxa_percentual: string;
  taxa_fixa: string;
  parcelas: VendaConsultaParcelaApi[];
  vale_troca: {
    documento: string;
    retaguarda_id: number | null;
    reserva_id: number | null;
    valor_reservado: string;
  } | null;
}

export interface VendaConsultaParcelaApi {
  ordem: number;
  dias: number;
  percentual: string | null;
  valor_fixo: string | null;
}

export interface VendaConsultaNfceResumoApi {
  numero: number;
  serie: number;
  status: string;
}

export interface VendaConsultaNfceDetalheApi extends VendaConsultaNfceResumoApi {
  nfce_uuid: string;
  modelo: string;
  chave_acesso: string;
  protocolo: string;
  tipo_emissao: string;
  retorno_codigo: string;
  retorno_mensagem: string;
  emitida_em: string | null;
  autorizada_em: string | null;
}

export interface VendaConsultaSincronizacaoApi {
  status: VendaSincronizacaoStatus;
  ultimo_erro: string;
  tentativas: number;
  sincronizado_em: string | null;
  tipo?: string;
}

export interface VendaConsultaResumoApi {
  venda_uuid: string;
  documento: string | null;
  status: VendaConsultaStatus;
  finalizada_em: string | null;
  total: string;
  subtotal: string;
  desconto_geral: string;
  cliente: VendaConsultaClienteApi;
  vendedor: VendaConsultaVendedorApi | null;
  terminal: VendaConsultaTerminalApi | null;
  caixa: VendaConsultaCaixaApi | null;
  pagamentos: VendaConsultaPagamentoResumoApi[];
  nfce: VendaConsultaNfceResumoApi | null;
  sincronizacao: VendaConsultaSincronizacaoApi;
}

export interface VendaConsultaHubLojaApi {
  hub_uuid: string;
  empresa_id: number | null;
  empresa_nome: string;
  loja_id: number | null;
  loja_nome: string;
  loja_apelido: string;
}

export interface VendaConsultaOperadorApi {
  id: number | null;
  codigo: string;
  nome: string;
}

export interface VendaConsultaItemApi {
  item_uuid: string;
  ean: string;
  referencia: string;
  codigo_item_ref: string;
  descricao: string;
  cor: string;
  tamanho: string;
  quantidade: number;
  preco_unitario: string;
  desconto: string;
  total_item: string;
  promocao: {
    id: number;
    nome: string;
    tipo: string;
    valor: string;
  } | null;
}

export interface VendaConsultaDetalheApi extends Omit<VendaConsultaResumoApi, 'sincronizacao'> {
  criada_em: string;
  valor_recebido: string;
  troco: string;
  hub: VendaConsultaHubLojaApi;
  loja: VendaConsultaHubLojaApi;
  operador_finalizacao: VendaConsultaOperadorApi | null;
  itens: VendaConsultaItemApi[];
  pagamentos: VendaConsultaPagamentoDetalheApi[];
  nfce: VendaConsultaNfceDetalheApi | null;
  sincronizacao: {
    venda_finalizada: VendaConsultaSincronizacaoApi;
    nfce_atualizada: VendaConsultaSincronizacaoApi | null;
  };
}

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
  promocao?: VendaItemPromocaoResumo | null;
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
  valeTrocaDocumento?: string;
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

export interface BeneficiosClienteResponse {
  cashback: {
    saldo: string;
    saldo_retaguarda: string;
    saldo_offline_utilizavel: string;
    limite_uso_percentual: string;
    valor_minimo_uso: string;
  };
  vales_troca: ValeTrocaDisponivel[];
}

export interface ValeTrocaDisponivel {
  documento: string;
  saldo: string;
  validade: string | null;
  utilizavel_offline: boolean;
}

export interface VendaDevolucaoConsultaResponse {
  venda: VendaDevolucaoConsulta;
}

export interface VendaDevolucaoConsulta {
  id?: number;
  uuid: string;
  documento?: string;
  data_venda?: string;
  loja_nome?: string;
  loja_origem?: { id: number; nome: string };
  cliente: { id: number | null; uuid?: string | null; nome: string; documento?: string };
  situacao?: string;
  nfce?: { numero?: number; chave_acesso?: string; status?: string } | null;
  total: string;
  itens: VendaDevolucaoItem[];
}

export interface VendaDevolucaoItem {
  id?: number;
  item_uuid: string;
  sku_id?: number;
  sku?: number;
  ean?: string;
  referencia?: string;
  cor?: string;
  tamanho?: string;
  descricao: string;
  quantidade: number;
  quantidade_devolvida?: number;
  quantidade_disponivel?: number;
  preco_unitario: string;
  desconto?: string;
  total_item: string;
  valor_liquido_disponivel?: string;
}

export interface DevolucaoCliente {
  id: number;
  nome: string;
  documento: string;
}

export interface DevolucaoClientesResponse {
  clientes: DevolucaoCliente[];
}

export interface DevolucaoClienteVenda {
  id: number;
  documento: string;
  data_venda: string;
  loja: { id: number; nome: string };
  total: string;
  quantidade_itens: number;
  nfce?: { numero?: number; chave_acesso?: string; status?: string } | null;
}

export interface DevolucaoClienteVendasResponse {
  cliente: DevolucaoCliente;
  vendas: DevolucaoClienteVenda[];
}

export interface VendaDevolucaoResultadoResponse {
  devolucao: VendaDevolucaoResultado;
}

export interface VendaDevolucaoResultado {
  uuid: string;
  venda_uuid: string;
  documento?: string;
  venda_documento?: string;
  loja_origem?: string;
  loja_recebimento?: string;
  valor_total: string;
  finalizada_em: string;
  vale_troca: { documento: string; documento_tecnico?: string; saldo: string; valor_original?: string; status?: string; provisorio?: boolean; rotulo?: string } | null;
  fiscal?: { status: string; modelo?: string; numero?: number; serie?: number; chave_acesso?: string; mensagem?: string } | null;
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

export function mapConsultaVendas(response: ConsultaVendasPaginadaApi): ConsultaVendasPaginada {
  return {
    count: response.count,
    page: response.page,
    pageSize: response.page_size,
    totalPages: response.total_pages,
    results: response.results.map(mapVendaConsultaResumo),
  };
}

export function mapVendaConsultaResumo(venda: VendaConsultaResumoApi): VendaConsultaResumo {
  return {
    vendaUuid: venda.venda_uuid,
    documento: venda.documento,
    status: venda.status,
    finalizadaEm: venda.finalizada_em,
    total: venda.total,
    subtotal: venda.subtotal,
    descontoGeral: venda.desconto_geral,
    cliente: mapVendaConsultaCliente(venda.cliente),
    vendedor: venda.vendedor ? mapVendaConsultaVendedor(venda.vendedor) : null,
    terminal: venda.terminal ? mapVendaConsultaTerminal(venda.terminal) : null,
    caixa: venda.caixa ? mapVendaConsultaCaixa(venda.caixa) : null,
    pagamentos: venda.pagamentos.map(mapVendaConsultaPagamentoResumo),
    nfce: venda.nfce ? mapVendaConsultaNfceResumo(venda.nfce) : null,
    sincronizacao: mapVendaConsultaSincronizacao(venda.sincronizacao),
  };
}

export function mapVendaConsultaDetalhe(venda: VendaConsultaDetalheApi): VendaConsultaDetalhe {
  return {
    ...mapVendaConsultaResumo({
      ...venda,
      sincronizacao: venda.sincronizacao.venda_finalizada,
    }),
    criadaEm: venda.criada_em,
    valorRecebido: venda.valor_recebido,
    troco: venda.troco,
    hub: mapVendaConsultaHubLoja(venda.hub),
    loja: mapVendaConsultaHubLoja(venda.loja),
    operadorFinalizacao: venda.operador_finalizacao ? {
      id: venda.operador_finalizacao.id,
      codigo: venda.operador_finalizacao.codigo,
      nome: venda.operador_finalizacao.nome,
    } : null,
    itens: venda.itens.map((item) => ({
      itemUuid: item.item_uuid,
      ean: item.ean,
      referencia: item.referencia,
      codigoItemRef: item.codigo_item_ref,
      descricao: item.descricao,
      cor: item.cor,
      tamanho: item.tamanho,
      quantidade: item.quantidade,
      precoUnitario: item.preco_unitario,
      desconto: item.desconto,
      totalItem: item.total_item,
      promocao: item.promocao,
    })),
    pagamentos: venda.pagamentos.map(mapVendaConsultaPagamentoDetalhe),
    nfce: venda.nfce ? {
      ...mapVendaConsultaNfceResumo(venda.nfce),
      nfceUuid: venda.nfce.nfce_uuid,
      modelo: venda.nfce.modelo,
      chaveAcesso: venda.nfce.chave_acesso,
      protocolo: venda.nfce.protocolo,
      tipoEmissao: venda.nfce.tipo_emissao,
      retornoCodigo: venda.nfce.retorno_codigo,
      retornoMensagem: venda.nfce.retorno_mensagem,
      emitidaEm: venda.nfce.emitida_em,
      autorizadaEm: venda.nfce.autorizada_em,
    } : null,
    sincronizacao: {
      vendaFinalizada: mapVendaConsultaSincronizacao(venda.sincronizacao.venda_finalizada),
      nfceAtualizada: venda.sincronizacao.nfce_atualizada ? mapVendaConsultaSincronizacao(venda.sincronizacao.nfce_atualizada) : null,
    },
  };
}

function mapVendaConsultaCliente(cliente: VendaConsultaClienteApi): VendaConsultaCliente {
  return {
    nome: cliente.nome,
    documento: cliente.documento,
    clienteUuid: cliente.cliente_uuid,
    retaguardaId: cliente.retaguarda_id,
  };
}

function mapVendaConsultaVendedor(vendedor: VendaConsultaVendedorApi): VendaConsultaVendedor {
  return {
    id: vendedor.id,
    retaguardaId: vendedor.retaguarda_id,
    matricula: vendedor.matricula,
    nome: vendedor.nome,
    apelido: vendedor.apelido,
  };
}

function mapVendaConsultaTerminal(terminal: VendaConsultaTerminalApi): VendaConsultaTerminal {
  return {
    codigo: terminal.codigo,
    nome: terminal.nome,
  };
}

function mapVendaConsultaCaixa(caixa: VendaConsultaCaixaApi): VendaConsultaCaixa {
  return {
    codigo: caixa.codigo,
    descricao: caixa.descricao,
    nome: caixa.nome,
  };
}

function mapVendaConsultaPagamentoResumo(pagamento: VendaConsultaPagamentoResumoApi): VendaConsultaPagamentoResumo {
  return {
    codigo: pagamento.codigo,
    descricao: pagamento.descricao,
    tipo: pagamento.tipo,
    valor: pagamento.valor,
  };
}

function mapVendaConsultaPagamentoDetalhe(pagamento: VendaConsultaPagamentoDetalheApi): VendaConsultaPagamentoDetalhe {
  return {
    ...mapVendaConsultaPagamentoResumo(pagamento),
    pagamentoUuid: pagamento.pagamento_uuid,
    autorizacao: pagamento.autorizacao,
    prazo: {
      codigo: pagamento.prazo.codigo,
      descricao: pagamento.prazo.descricao,
      retaguardaId: pagamento.prazo.retaguarda_id,
    },
    numParcelas: pagamento.num_parcelas,
    taxaPercentual: pagamento.taxa_percentual,
    taxaFixa: pagamento.taxa_fixa,
    parcelas: pagamento.parcelas.map((parcela) => ({
      ordem: parcela.ordem,
      dias: parcela.dias,
      percentual: parcela.percentual,
      valorFixo: parcela.valor_fixo,
    })),
    valeTroca: pagamento.vale_troca ? {
      documento: pagamento.vale_troca.documento,
      retaguardaId: pagamento.vale_troca.retaguarda_id,
      reservaId: pagamento.vale_troca.reserva_id,
      valorReservado: pagamento.vale_troca.valor_reservado,
    } : null,
  };
}

function mapVendaConsultaNfceResumo(nfce: VendaConsultaNfceResumoApi): VendaConsultaNfceResumo {
  return {
    numero: nfce.numero,
    serie: nfce.serie,
    status: nfce.status,
  };
}

function mapVendaConsultaSincronizacao(sync: VendaConsultaSincronizacaoApi): VendaConsultaSincronizacao {
  return {
    status: sync.status,
    ultimoErro: sync.ultimo_erro,
    tentativas: sync.tentativas,
    sincronizadoEm: sync.sincronizado_em,
    tipo: sync.tipo,
  };
}

function mapVendaConsultaHubLoja(hub: VendaConsultaHubLojaApi): VendaConsultaHubLoja {
  return {
    hubUuid: hub.hub_uuid,
    empresaId: hub.empresa_id,
    empresaNome: hub.empresa_nome,
    lojaId: hub.loja_id,
    lojaNome: hub.loja_nome,
    lojaApelido: hub.loja_apelido,
  };
}
