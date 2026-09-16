export type ClienteOrigem = 'RETAGUARDA' | 'LOCAL';
export type ClienteTipoPessoa = 'PF' | 'PJ';

export interface ClienteHubResumo {
  clienteUuid: string;
  retaguardaId: number | null;
  origem: ClienteOrigem;
  tipoPessoa: ClienteTipoPessoa;
  documento: string | null;
  clientePadrao: boolean;
  nomeCliente: string;
  apelido: string;
  telefone1: string;
  telefone2: string;
  email: string;
  aniversario: string | null;
  endereco: string;
  numero: string;
  complemento: string;
  cep: string;
  bairro: string;
  cidade: string;
  estado: string;
  bloqueio: boolean;
  motivoBloqueio: string | null;
  ativo: boolean;
  presenteRetaguarda: boolean;
  pendenteSincronizacao: boolean;
}

export interface ClientesConsultaResponse {
  clientesVersao: number | null;
  clientesSincronizadoEm: string | null;
  q: string;
  total: number;
  limit: number;
  clientes: ClienteHubResumo[];
}

export interface ClienteHubResumoApi {
  cliente_uuid: string;
  retaguarda_id: number | null;
  origem: ClienteOrigem;
  tipo_pessoa: ClienteTipoPessoa;
  documento: string | null;
  cliente_padrao: boolean;
  nome_cliente: string;
  apelido: string;
  telefone1: string;
  telefone2?: string;
  email: string;
  aniversario?: string | null;
  endereco?: string;
  numero?: string;
  complemento?: string;
  cep?: string;
  bairro?: string;
  cidade: string;
  estado: string;
  bloqueio: boolean;
  motivo_bloqueio: string | null;
  ativo: boolean;
  presente_retaguarda: boolean;
  pendente_sincronizacao?: boolean;
}

export interface ClientesConsultaApiResponse {
  clientes_versao: number | null;
  clientes_sincronizado_em: string | null;
  q: string;
  total: number;
  limit: number;
  clientes: ClienteHubResumoApi[];
}

export interface ClienteCadastroRequest {
  tipo_pessoa: ClienteTipoPessoa;
  documento: string;
  nome_cliente: string;
  apelido?: string;
  telefone1?: string;
  telefone2?: string;
  email?: string;
  aniversario?: string;
  endereco?: string;
  numero?: string;
  complemento?: string;
  cep?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
}

export interface ClienteCadastroApiResponse {
  cliente: ClienteHubResumoApi;
}

export function mapCliente(cliente: ClienteHubResumoApi): ClienteHubResumo {
  return {
    clienteUuid: cliente.cliente_uuid,
    retaguardaId: cliente.retaguarda_id,
    origem: cliente.origem,
    tipoPessoa: cliente.tipo_pessoa,
    documento: cliente.documento,
    clientePadrao: cliente.cliente_padrao,
    nomeCliente: cliente.nome_cliente,
    apelido: cliente.apelido,
    telefone1: cliente.telefone1,
    telefone2: cliente.telefone2 || '',
    email: cliente.email,
    aniversario: cliente.aniversario || null,
    endereco: cliente.endereco || '',
    numero: cliente.numero || '',
    complemento: cliente.complemento || '',
    cep: cliente.cep || '',
    bairro: cliente.bairro || '',
    cidade: cliente.cidade,
    estado: cliente.estado,
    bloqueio: cliente.bloqueio,
    motivoBloqueio: cliente.motivo_bloqueio,
    ativo: cliente.ativo,
    presenteRetaguarda: cliente.presente_retaguarda,
    pendenteSincronizacao: Boolean(cliente.pendente_sincronizacao),
  };
}

export function mapClientes(response: ClientesConsultaApiResponse): ClientesConsultaResponse {
  return {
    clientesVersao: response.clientes_versao,
    clientesSincronizadoEm: response.clientes_sincronizado_em,
    q: response.q,
    total: response.total,
    limit: response.limit,
    clientes: response.clientes.map(mapCliente),
  };
}

export function formatarDocumentoCliente(tipoPessoa: ClienteTipoPessoa, documento: string | null): string {
  if (!documento) return 'Sem documento';
  if (tipoPessoa === 'PF' && /^\d{11}$/.test(documento)) {
    return `${documento.slice(0, 3)}.${documento.slice(3, 6)}.${documento.slice(6, 9)}-${documento.slice(9)}`;
  }
  if (tipoPessoa === 'PJ' && /^\d{14}$/.test(documento)) {
    return `${documento.slice(0, 2)}.${documento.slice(2, 5)}.${documento.slice(5, 8)}/${documento.slice(8, 12)}-${documento.slice(12)}`;
  }
  return documento;
}
