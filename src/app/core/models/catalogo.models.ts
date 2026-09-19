export type DecimalString = string;

export interface CatalogoCor {
  id: number | null;
  descricao: string;
}

export interface CatalogoTamanho {
  id: number | null;
  descricao: string;
}

export interface CatalogoUnidade {
  id: number | null;
  codigo: string;
  descricao: string;
}

export interface CatalogoTabelaPreco {
  codigo: string;
  nome: string;
}

export interface CatalogoItem {
  produto_id: number;
  sku_id: number;
  tipo_produto: string;
  referencia: string;
  descricao: string;
  descricao_reduzida: string;
  ean13: string | null;
  codigo_item_ref: string;
  cor: CatalogoCor;
  tamanho: CatalogoTamanho;
  unidade: CatalogoUnidade;
  preco: DecimalString | null;
  preco_promocional: DecimalString | null;
  preco_venda: DecimalString | null;
  estoque_fisico: DecimalString;
  reserva: DecimalString;
  estoque_disponivel: DecimalString;
  vendavel: boolean;
  motivos_bloqueio: string[];
  fiscal: unknown;
  imagem_url?: string | null;
}

export interface CatalogoResponse {
  catalogo_versao: number | null;
  catalogo_sincronizado_em: string | null;
  tabela_preco: CatalogoTabelaPreco;
  q: string;
  total: number;
  limit: number;
  itens: CatalogoItem[];
}
