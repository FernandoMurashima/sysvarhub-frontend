export interface VendedorCargoResumo {
  id: number;
  codigo: string;
  descricao: string;
}

export interface VendedorHubResumo {
  id: number;
  matricula: string;
  nome: string;
  apelido: string;
  cargo: VendedorCargoResumo | null;
  comissionado: boolean;
  comissaoPercentual: string;
}

export interface VendedoresResponse {
  vendedoresVersao: number | null;
  vendedoresSincronizadoEm: string | null;
  q: string;
  total: number;
  limit: number;
  vendedores: VendedorHubResumo[];
}

export interface VendedorCargoResumoApi {
  id: number;
  codigo: string;
  descricao: string;
}

export interface VendedorHubResumoApi {
  id: number;
  matricula: string;
  nome: string;
  apelido: string;
  cargo: VendedorCargoResumoApi | null;
  comissionado: boolean;
  comissao_percentual: string;
}

export interface VendedoresApiResponse {
  vendedores_versao: number | null;
  vendedores_sincronizado_em: string | null;
  q: string;
  total: number;
  limit: number;
  vendedores: VendedorHubResumoApi[];
}

export function mapVendedor(vendedor: VendedorHubResumoApi): VendedorHubResumo {
  return {
    id: vendedor.id,
    matricula: vendedor.matricula,
    nome: vendedor.nome,
    apelido: vendedor.apelido,
    cargo: vendedor.cargo ? {
      id: vendedor.cargo.id,
      codigo: vendedor.cargo.codigo,
      descricao: vendedor.cargo.descricao,
    } : null,
    comissionado: vendedor.comissionado,
    comissaoPercentual: vendedor.comissao_percentual,
  };
}

export function mapVendedores(response: VendedoresApiResponse): VendedoresResponse {
  return {
    vendedoresVersao: response.vendedores_versao,
    vendedoresSincronizadoEm: response.vendedores_sincronizado_em,
    q: response.q,
    total: response.total,
    limit: response.limit,
    vendedores: response.vendedores.map(mapVendedor),
  };
}
