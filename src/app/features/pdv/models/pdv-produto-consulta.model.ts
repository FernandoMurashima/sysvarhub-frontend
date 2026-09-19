import { DecimalString } from '../../../core/models/catalogo.models';

export interface PdvProdutoConsulta {
  produtoId: number;
  skuId: number;
  tipoProduto: string;
  referencia: string;
  codigo: string;
  ean13: string | null;
  codigoItemRef: string;
  descricao: string;
  descricaoReduzida: string;
  cor: string;
  tamanho: string;
  unidade: string;
  preco: DecimalString | null;
  precoPromocional: DecimalString | null;
  precoVenda: DecimalString | null;
  estoqueFisico: DecimalString;
  reserva: DecimalString;
  estoqueDisponivel: DecimalString;
  vendavel: boolean;
  motivosBloqueio: string[];
  imagemUrl?: string | null;
}

export interface PdvCatalogoConsulta {
  catalogoVersao: number | null;
  catalogoSincronizadoEm: string | null;
  tabelaPrecoCodigo: string;
  tabelaPrecoNome: string;
  q: string;
  total: number;
  limit: number;
  itens: PdvProdutoConsulta[];
}
