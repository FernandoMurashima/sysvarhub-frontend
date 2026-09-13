import {
  mapOperador,
  OperadorHubPublico,
  OperadorHubPublicoApi,
} from './operador.models';

export type CaixaSessionStatus = 'inicializando' | 'fechado' | 'aberto' | 'erro';

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
}

export interface CaixaStatusResponse {
  caixa: CaixaHubResumo;
  aberto: boolean;
  sessao: SessaoCaixaHubResumo | null;
}

export interface CaixaAbrirRequest {
  valor_abertura: string;
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
  };
}

export function mapCaixaStatus(api: CaixaStatusResponseApi): CaixaStatusResponse {
  return {
    caixa: mapCaixaResumo(api.caixa),
    aberto: api.aberto,
    sessao: api.sessao ? mapSessaoCaixa(api.sessao) : null,
  };
}
