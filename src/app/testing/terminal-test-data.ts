import { CatalogoResponse } from '../core/models/catalogo.models';
import { TerminalContexto } from '../core/models/terminal.models';

export const terminalContextoStub: TerminalContexto = {
  terminal: { id: 1, codigo: 'PDV-01', nome: 'PDV-01' },
  caixa: { id: 7, codigo: 'CX-01', descricao: 'Caixa 01' },
  loja: { id: 2, codigo: 'LJ-01', nome_loja: 'Filial 1' },
  empresa: { id: 3, razao_social: 'Empresa Teste Ltda' },
};

export const catalogoResponseStub: CatalogoResponse = {
  catalogo_versao: '2026-09-13T10:00:00',
  catalogo_sincronizado_em: '2026-09-13T10:01:00',
  tabela_preco: 'Varejo',
  q: '7892701000013',
  total: 1,
  limit: 20,
  itens: [
    {
      produto_id: 2050,
      sku_id: 10825,
      tipo_produto: 'PRODUTO',
      referencia: '27-01-01001',
      descricao: 'Calca Jeans Reta Aurora',
      descricao_reduzida: 'Calca Aurora',
      ean13: '7892701000013',
      codigo_item_ref: '27-01-01001-34',
      cor: { id: 1, descricao: 'Jeans' },
      tamanho: { id: 34, descricao: '34' },
      unidade: { id: 1, codigo: 'UN', descricao: 'Unidade' },
      preco: '199.9000',
      preco_promocional: null,
      preco_venda: '199.9000',
      estoque_fisico: '4.000',
      reserva: '0.000',
      estoque_disponivel: '4.000',
      vendavel: true,
      motivos_bloqueio: [],
      fiscal: {},
    },
  ],
};
