export interface TipoDespesaPdvNatureza {
  id: number;
  codigo: string;
  descricao: string;
  categoriaPrincipal: string;
  subcategoria: string;
  tipo: string;
  status: string;
  tipoNatureza: string;
  naturezaOperacao: string;
  categoriaGerencial: string;
  movimentaFinanceiro: boolean;
  entraDre: boolean;
}

export interface TipoDespesaPdv {
  id: number;
  codigo: string;
  descricao: string;
  exigeDocumento: boolean;
  natureza: TipoDespesaPdvNatureza;
}

export interface TiposDespesaPdvResponse {
  tiposDespesaPdvVersao: number | null;
  tiposDespesaPdvSincronizadoEm: string | null;
  total: number;
  tipos: TipoDespesaPdv[];
}

export interface TipoDespesaPdvNaturezaApi {
  id: number;
  codigo: string;
  descricao: string;
  categoria_principal: string;
  subcategoria: string;
  tipo: string;
  status: string;
  tipo_natureza: string;
  natureza_operacao: string;
  categoria_gerencial: string;
  movimenta_financeiro: boolean;
  entra_dre: boolean;
}

export interface TipoDespesaPdvApi {
  id: number;
  codigo: string;
  descricao: string;
  exige_documento: boolean;
  natureza: TipoDespesaPdvNaturezaApi;
}

export interface TiposDespesaPdvApiResponse {
  tipos_despesa_pdv_versao: number | null;
  tipos_despesa_pdv_sincronizado_em: string | null;
  total: number;
  tipos_despesa_pdv: TipoDespesaPdvApi[];
}

export function mapTiposDespesaPdvResponse(api: TiposDespesaPdvApiResponse): TiposDespesaPdvResponse {
  return {
    tiposDespesaPdvVersao: api.tipos_despesa_pdv_versao,
    tiposDespesaPdvSincronizadoEm: api.tipos_despesa_pdv_sincronizado_em,
    total: api.total,
    tipos: api.tipos_despesa_pdv.map(mapTipoDespesaPdv),
  };
}

export function mapTipoDespesaPdv(api: TipoDespesaPdvApi): TipoDespesaPdv {
  return {
    id: api.id,
    codigo: api.codigo,
    descricao: api.descricao,
    exigeDocumento: api.exige_documento,
    natureza: {
      id: api.natureza.id,
      codigo: api.natureza.codigo,
      descricao: api.natureza.descricao,
      categoriaPrincipal: api.natureza.categoria_principal,
      subcategoria: api.natureza.subcategoria,
      tipo: api.natureza.tipo,
      status: api.natureza.status,
      tipoNatureza: api.natureza.tipo_natureza,
      naturezaOperacao: api.natureza.natureza_operacao,
      categoriaGerencial: api.natureza.categoria_gerencial,
      movimentaFinanceiro: api.natureza.movimenta_financeiro,
      entraDre: api.natureza.entra_dre,
    },
  };
}
