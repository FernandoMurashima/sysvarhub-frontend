import { CatalogoResponse } from '../core/models/catalogo.models';
import { TerminalContexto } from '../core/models/terminal.models';

export const terminalContextoStub: TerminalContexto = {
  terminal: {
    uuid: 'terminal-uuid-ficticio',
    codigo: 'PDV-01',
    nome: 'PDV-01',
    hostname: 'PDV-BARRA-01',
    ativo: true,
  },
  caixa: { id: 7, codigo: 'CX-01', descricao: 'Caixa 01', ativo: true },
  loja: { id: 2, nome: 'Loja Barra', apelido: 'Filial 1', estado: 'RJ' },
  empresa: { id: 3, nome: 'Empresa Teste Ltda' },
};

export const catalogoResponseStub: CatalogoResponse = {
  catalogo_versao: 1,
  catalogo_sincronizado_em: '2026-09-13T10:01:00',
  tabela_preco: {
    codigo: 'PADRAO',
    nome: 'Tabela Padrão',
  },
  q: '7892701000013',
  total: 1,
  limit: 40,
  itens: [
    {
      produto_id: 2050,
      sku_id: 10825,
      tipo_produto: '1',
      referencia: '27-01-01001',
      descricao: 'Calça Jeans Reta Aurora',
      descricao_reduzida: 'Calça Jeans Reta Aurora',
      ean13: '7892701000013',
      codigo_item_ref: '00001',
      cor: { id: 113, descricao: 'Jeans' },
      tamanho: { id: 147, descricao: '34' },
      unidade: { id: 47, codigo: 'UN', descricao: 'Un' },
      preco: '199.9000',
      preco_promocional: null,
      preco_venda: '199.9000',
      estoque_fisico: '4.000',
      reserva: '0.000',
      estoque_disponivel: '4.000',
      vendavel: true,
      motivos_bloqueio: [],
      fiscal: { ncm: '62034200' },
    },
  ],
};
