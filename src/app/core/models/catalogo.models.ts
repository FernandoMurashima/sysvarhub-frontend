export type DecimalString = string;

export interface CatalogoCor {
  id: number | null;
  descricao: string | null;
}

export interface CatalogoTamanho {
  id: number | null;
  descricao: string | null;
}

export interface CatalogoUnidade {
  id: number | null;
  codigo: string | null;
  descricao: string | null;
}

export interface CatalogoItem {
  produto_id: number;
  sku_id: number;
  tipo_produto: string;
  referencia: string;
  descricao: string;
  descricao_reduzida: string | null;
  ean13: string | null;
  codigo_item_ref: string | null;
  cor: CatalogoCor | null;
  tamanho: CatalogoTamanho | null;
  unidade: CatalogoUnidade | null;
  preco: DecimalString;
  preco_promocional: DecimalString | null;
  preco_venda: DecimalString;
  estoque_fisico: DecimalString;
  reserva: DecimalString;
  estoque_disponivel: DecimalString;
  vendavel: boolean;
  motivos_bloqueio: string[];
  fiscal: unknown;
}

export interface CatalogoResponse {
  catalogo_versao: string | number | null;
  catalogo_sincronizado_em: string | null;
  tabela_preco: string | null;
  q: string | null;
  total: number;
  limit: number;
  itens: CatalogoItem[];
}
