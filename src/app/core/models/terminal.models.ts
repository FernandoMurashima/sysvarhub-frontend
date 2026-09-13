export type TerminalSessionStatus =
  | 'inicializando'
  | 'nao-pareado'
  | 'pareado'
  | 'contexto-carregado'
  | 'erro';

export interface HubTerminal {
  uuid: string;
  codigo: string;
  nome: string;
  hostname: string;
  ativo: boolean;
}

export interface HubEmpresa {
  id: number;
  nome: string;
}

export interface HubLoja {
  id: number;
  nome: string;
  apelido: string;
  estado: string;
}

export interface HubCaixa {
  id: number;
  codigo: string;
  descricao: string;
  ativo: boolean;
}

export interface TerminalContexto {
  terminal: HubTerminal;
  caixa: HubCaixa | null;
  loja: HubLoja;
  empresa: HubEmpresa;
}

export interface PareamentoRequest {
  codigo: string;
  hostname?: string;
}

export interface PareamentoResponse {
  token: string;
  terminal: HubTerminal;
  caixa: HubCaixa | null;
  loja: HubLoja;
  empresa: HubEmpresa;
}

export interface HeartbeatRequest {
  hostname?: string;
}

export interface HeartbeatResponse {
  status: 'ok';
  terminal_uuid: string;
  servidor_em: string;
}
