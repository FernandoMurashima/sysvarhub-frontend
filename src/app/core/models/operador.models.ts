export type OperatorSessionStatus = 'inicializando' | 'nao-autenticado' | 'autenticado' | 'erro';

export interface OperadorPerfil {
  id: number;
  nome: string;
}

export interface OperadorHubPublico {
  usuarioId: number;
  codigo: string;
  nome: string;
  tipo: string;
  perfil: OperadorPerfil | null;
}

export interface SessaoOperadorResumo {
  uuid: string;
  iniciadaEm: string;
  ultimaAtividadeEm?: string;
}

export interface OperadorLoginRequest {
  codigo: string;
  senha: string;
}

export interface OperadorLoginResponse {
  sessaoToken: string;
  sessao: SessaoOperadorResumo;
  operador: OperadorHubPublico;
}

export interface OperadorContextoResponse {
  sessao: SessaoOperadorResumo;
  operador: OperadorHubPublico;
}

export interface OperadorPerfilApi {
  id: number;
  nome: string;
}

export interface OperadorHubPublicoApi {
  usuario_id: number;
  codigo: string;
  nome: string;
  tipo: string;
  perfil: OperadorPerfilApi | null;
}

export interface SessaoOperadorResumoApi {
  uuid: string;
  iniciada_em: string;
  ultima_atividade_em?: string;
}

export interface OperadorLoginResponseApi {
  sessao_token: string;
  sessao: SessaoOperadorResumoApi;
  operador: OperadorHubPublicoApi;
}

export interface OperadorContextoResponseApi {
  sessao: SessaoOperadorResumoApi;
  operador: OperadorHubPublicoApi;
}

export function mapOperador(api: OperadorHubPublicoApi): OperadorHubPublico {
  return {
    usuarioId: api.usuario_id,
    codigo: api.codigo,
    nome: api.nome,
    tipo: api.tipo,
    perfil: api.perfil ? { id: api.perfil.id, nome: api.perfil.nome } : null,
  };
}

export function mapSessaoOperador(api: SessaoOperadorResumoApi): SessaoOperadorResumo {
  return {
    uuid: api.uuid,
    iniciadaEm: api.iniciada_em,
    ultimaAtividadeEm: api.ultima_atividade_em,
  };
}

export function mapOperadorLoginResponse(api: OperadorLoginResponseApi): OperadorLoginResponse {
  return {
    sessaoToken: api.sessao_token,
    sessao: mapSessaoOperador(api.sessao),
    operador: mapOperador(api.operador),
  };
}

export function mapOperadorContextoResponse(api: OperadorContextoResponseApi): OperadorContextoResponse {
  return {
    sessao: mapSessaoOperador(api.sessao),
    operador: mapOperador(api.operador),
  };
}
