export type DecimalString = string;

export interface FormaPagamentoParcelaApi {
  ordem: number;
  dias: number;
  percentual: DecimalString | null;
  valor_fixo: DecimalString | null;
}

export interface FormaPagamentoCondicaoApi {
  id: number;
  retaguarda_id: number;
  prazo_pagamento_id: number;
  prazo_retaguarda_id: number;
  prazo_codigo: string;
  prazo_descricao: string;
  prazo_num_parcelas: number;
  prazo_intervalo_dias: number | null;
  taxa_percentual: DecimalString;
  taxa_fixa: DecimalString;
  parcelas: FormaPagamentoParcelaApi[];
}

export interface FormaPagamentoApi {
  id: number;
  retaguarda_id: number;
  codigo: string;
  descricao: string;
  tipo: string;
  num_parcelas: number;
  permite_parcelamento?: boolean;
  tef_habilitado: boolean;
  condicoes_parcelamento?: FormaPagamentoCondicaoApi[];
  parcelas: FormaPagamentoParcelaApi[];
}

export interface PrazoPagamentoApi {
  id: number;
  retaguarda_id: number;
  codigo: string;
  descricao: string;
  num_parcelas: number;
  intervalo_dias: number | null;
  parcelas: FormaPagamentoParcelaApi[];
}

export interface FormasPagamentoApiResponse {
  versao: number | null;
  sincronizado_em: string | null;
  formas: FormaPagamentoApi[];
  prazos?: PrazoPagamentoApi[];
}

export interface FormaPagamentoParcela {
  ordem: number;
  dias: number;
  percentual: DecimalString | null;
  valorFixo: DecimalString | null;
}

export interface FormaPagamentoCondicao {
  id: number;
  retaguardaId: number;
  prazoPagamentoId: number;
  prazoRetaguardaId: number;
  prazoCodigo: string;
  prazoDescricao: string;
  prazoNumParcelas: number;
  prazoIntervaloDias: number | null;
  taxaPercentual: DecimalString;
  taxaFixa: DecimalString;
  parcelas: FormaPagamentoParcela[];
}

export interface FormaPagamento {
  id: number;
  retaguardaId: number;
  codigo: string;
  descricao: string;
  tipo: string;
  numParcelas: number;
  permiteParcelamento: boolean;
  tefHabilitado: boolean;
  condicoesParcelamento: FormaPagamentoCondicao[];
  parcelas: FormaPagamentoParcela[];
}

export interface PrazoPagamento {
  id: number;
  retaguardaId: number;
  codigo: string;
  descricao: string;
  numParcelas: number;
  intervaloDias: number | null;
  parcelas: FormaPagamentoParcela[];
}

export interface FormasPagamentoResponse {
  versao: number | null;
  sincronizadoEm: string | null;
  formas: FormaPagamento[];
  prazos: PrazoPagamento[];
}

export interface AdicionarPagamentoRequest {
  vendaUuid: string;
  operacaoUuid: string;
  formaPagamentoId: number;
  prazoPagamentoId?: number | null;
  valor: DecimalString;
  autorizacao: string;
}

export interface ValeTrocaOnline {
  id: number;
  documento: string;
  cliente: { id: number; nome: string; documento: string };
  valor_original: DecimalString;
  saldo_contabil: DecimalString;
  saldo_reservado: DecimalString;
  saldo_disponivel: DecimalString;
  status: string;
  validade: string | null;
  loja_origem: { id: number; nome: string };
  devolucao_origem: { id: number; documento: string } | null;
  provisorio?: boolean;
  rotulo?: string;
}

export interface ValeTrocaConsultaResponse {
  vale_troca: ValeTrocaOnline;
}

export interface ValesTrocaDisponiveisResponse {
  vales_troca: ValeTrocaOnline[];
}

export function mapFormasPagamento(response: FormasPagamentoApiResponse): FormasPagamentoResponse {
  return {
    versao: response.versao,
    sincronizadoEm: response.sincronizado_em,
    formas: response.formas.map(mapFormaPagamento),
    prazos: (response.prazos ?? []).map(mapPrazoPagamento),
  };
}

export function mapFormaPagamento(forma: FormaPagamentoApi): FormaPagamento {
  return {
    id: forma.id,
    retaguardaId: forma.retaguarda_id,
    codigo: forma.codigo,
    descricao: forma.descricao,
    tipo: forma.tipo,
    numParcelas: forma.num_parcelas,
    permiteParcelamento: forma.permite_parcelamento ?? false,
    tefHabilitado: forma.tef_habilitado,
    condicoesParcelamento: (forma.condicoes_parcelamento ?? []).map(mapFormaPagamentoCondicao),
    parcelas: forma.parcelas.map(mapFormaPagamentoParcela),
  };
}

export function mapPrazoPagamento(prazo: PrazoPagamentoApi): PrazoPagamento {
  return {
    id: prazo.id,
    retaguardaId: prazo.retaguarda_id,
    codigo: prazo.codigo,
    descricao: prazo.descricao,
    numParcelas: prazo.num_parcelas,
    intervaloDias: prazo.intervalo_dias,
    parcelas: prazo.parcelas.map(mapFormaPagamentoParcela),
  };
}

export function mapFormaPagamentoCondicao(condicao: FormaPagamentoCondicaoApi): FormaPagamentoCondicao {
  return {
    id: condicao.id,
    retaguardaId: condicao.retaguarda_id,
    prazoPagamentoId: condicao.prazo_pagamento_id,
    prazoRetaguardaId: condicao.prazo_retaguarda_id,
    prazoCodigo: condicao.prazo_codigo,
    prazoDescricao: condicao.prazo_descricao,
    prazoNumParcelas: condicao.prazo_num_parcelas,
    prazoIntervaloDias: condicao.prazo_intervalo_dias,
    taxaPercentual: condicao.taxa_percentual,
    taxaFixa: condicao.taxa_fixa,
    parcelas: condicao.parcelas.map(mapFormaPagamentoParcela),
  };
}

function mapFormaPagamentoParcela(parcela: FormaPagamentoParcelaApi): FormaPagamentoParcela {
  return {
    ordem: parcela.ordem,
    dias: parcela.dias,
    percentual: parcela.percentual,
    valorFixo: parcela.valor_fixo,
  };
}
