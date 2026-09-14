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

export interface FormasPagamentoApiResponse {
  versao: number | null;
  sincronizado_em: string | null;
  formas: FormaPagamentoApi[];
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

export interface FormasPagamentoResponse {
  versao: number | null;
  sincronizadoEm: string | null;
  formas: FormaPagamento[];
}

export interface AdicionarPagamentoRequest {
  vendaUuid: string;
  operacaoUuid: string;
  formaPagamentoId: number;
  valor: DecimalString;
  autorizacao: string;
}

export function mapFormasPagamento(response: FormasPagamentoApiResponse): FormasPagamentoResponse {
  return {
    versao: response.versao,
    sincronizadoEm: response.sincronizado_em,
    formas: response.formas.map(mapFormaPagamento),
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
