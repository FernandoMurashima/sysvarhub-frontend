export type TerminalSessionStatus =
  | 'inicializando'
  | 'nao-pareado'
  | 'pareado'
  | 'contexto-carregado'
  | 'erro';

export interface HubTerminal {
  id?: number;
  codigo?: string;
  nome?: string;
  hostname?: string;
}

export interface HubEmpresa {
  id?: number;
  nome?: string;
  razao_social?: string;
}

export interface HubLoja {
  id?: number;
  codigo?: string;
  nome?: string;
  nome_loja?: string;
}

export interface HubCaixa {
  id?: number;
  codigo?: string;
  descricao?: string;
  nome?: string;
}

export interface TerminalContexto {
  terminal: HubTerminal;
  caixa: HubCaixa;
  loja: HubLoja;
  empresa: HubEmpresa;
}

export interface PareamentoRequest {
  codigo_pareamento: string;
  hostname?: string;
}

export interface PareamentoResponse {
  token: string;
  contexto?: TerminalContexto;
}

export interface HeartbeatRequest {
  status?: string;
  versao_app?: string;
}

export interface HeartbeatResponse {
  ok: boolean;
  recebido_em?: string;
}
