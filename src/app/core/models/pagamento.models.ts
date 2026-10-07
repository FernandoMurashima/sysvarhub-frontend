export type DecimalString = string;

export interface FormaPagamentoParcelaApi {
  ordem: number;
  dias: number;
  percentual: DecimalString | null;
  valor_fixo: DecimalString | null;
}

export interface FormaPagamentoApi {
  id: number;
  retaguarda_id: number;
  codigo: string;
  descricao: string;
  tipo: string;
  num_parcelas: number;
  tef_habilitado: boolean;
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

export interface FormaPagamento {
  id: number;
  retaguardaId: number;
  codigo: string;
  descricao: string;
  tipo: string;
  numParcelas: number;
  tefHabilitado: boolean;
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
    tefHabilitado: forma.tef_habilitado,
    parcelas: forma.parcelas.map((parcela) => ({
      ordem: parcela.ordem,
      dias: parcela.dias,
      percentual: parcela.percentual,
      valorFixo: parcela.valor_fixo,
    })),
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
    parcelas: prazo.parcelas.map((parcela) => ({
      ordem: parcela.ordem,
      dias: parcela.dias,
      percentual: parcela.percentual,
      valorFixo: parcela.valor_fixo,
    })),
  };
}
