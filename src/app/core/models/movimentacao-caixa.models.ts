import { CaixaHubResumo, CaixaHubResumoApi, mapCaixaResumo } from './caixa.models';
import { mapOperador, OperadorHubPublico, OperadorHubPublicoApi } from './operador.models';
import { TipoDespesaPdv, TipoDespesaPdvApi, mapTipoDespesaPdv } from './tipo-despesa-pdv.models';

export type TipoMovimentacaoCaixa = 'DESPESA' | 'SANGRIA' | 'SUPRIMENTO';

export interface RegistrarMovimentacaoCaixaRequest {
  tipo: TipoMovimentacaoCaixa;
  valor: string;
  tipo_despesa_id?: number;
  documento?: string;
  historico?: string;
}

export interface MovimentacaoCaixa {
  uuid: string;
  tipo: TipoMovimentacaoCaixa;
  status: string;
  valor: string;
  documento: string;
  historico: string;
  ocorridoEm: string;
  caixa: CaixaHubResumo;
  sessaoCaixaUuid: string;
  terminal: { uuid: string; codigo: string; nome: string };
  operador: OperadorHubPublico;
  tipoDespesa: TipoDespesaPdv | null;
}

export interface MovimentacaoCaixaApi {
  uuid: string;
  tipo: TipoMovimentacaoCaixa;
  status: string;
  valor: string;
  documento: string;
  historico: string;
  ocorrido_em: string;
  caixa: CaixaHubResumoApi;
  sessao_caixa_uuid: string;
  terminal: { uuid: string; codigo: string; nome: string };
  operador: OperadorHubPublicoApi;
  tipo_despesa: TipoDespesaPdvApi | null;
}

export interface MovimentacaoCaixaResponseApi {
  movimentacao: MovimentacaoCaixaApi;
}

export interface MovimentacoesCaixaResponseApi {
  sessao_caixa_uuid: string;
  total: number;
  movimentacoes: MovimentacaoCaixaApi[];
}

export interface MovimentacoesCaixaResponse {
  sessaoCaixaUuid: string;
  total: number;
  movimentacoes: MovimentacaoCaixa[];
}

export function mapMovimentacaoCaixa(api: MovimentacaoCaixaApi): MovimentacaoCaixa {
  return {
    uuid: api.uuid,
    tipo: api.tipo,
    status: api.status,
    valor: api.valor,
    documento: api.documento,
    historico: api.historico,
    ocorridoEm: api.ocorrido_em,
    caixa: mapCaixaResumo(api.caixa),
    sessaoCaixaUuid: api.sessao_caixa_uuid,
    terminal: api.terminal,
    operador: mapOperador(api.operador),
    tipoDespesa: api.tipo_despesa ? mapTipoDespesaPdv(api.tipo_despesa) : null,
  };
}

export function mapMovimentacoesCaixaResponse(api: MovimentacoesCaixaResponseApi): MovimentacoesCaixaResponse {
  return {
    sessaoCaixaUuid: api.sessao_caixa_uuid,
    total: api.total,
    movimentacoes: api.movimentacoes.map(mapMovimentacaoCaixa),
  };
}
