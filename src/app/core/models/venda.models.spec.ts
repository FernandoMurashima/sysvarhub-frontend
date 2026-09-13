import { mapVendaAtual, VendaApiResponse } from './venda.models';

describe('venda models', () => {
  it('mapeia snake_case para camelCase preservando monetarios como string', () => {
    const api: VendaApiResponse = {
      venda: {
        uuid: 'venda',
        status: 'ABERTA',
        criada_em: '2026-09-13T12:00:00',
        subtotal: '199.90',
        desconto_itens: '0.00',
        desconto_geral: '0.00',
        total: '199.90',
        operador_criacao: { usuario_id: 99, codigo: 'caixa.barra', nome: 'Juliana', tipo: 'Caixa', perfil: null },
        itens: [{
          uuid: 'item',
          produto_id: 2050,
          sku_id: 10825,
          ean13: '7892701000013',
          referencia: '27-01-01001',
          codigo_item_ref: '00001',
          descricao: 'Calça Jeans',
          descricao_reduzida: 'Calça',
          cor: 'Jeans',
          tamanho: '34',
          unidade: 'UN',
          quantidade: 2,
          preco_unitario: '199.9000',
          desconto: '0.00',
          total_item: '399.80',
        }],
      },
    };

    const venda = mapVendaAtual(api).venda;

    expect(venda?.subtotal).toBe('199.90');
    expect(venda?.descontoItens).toBe('0.00');
    expect(venda?.operadorCriacao.codigo).toBe('caixa.barra');
    expect(venda?.itens[0].skuId).toBe(10825);
    expect(venda?.itens[0].quantidade).toBe(2);
    expect(venda?.itens[0].precoUnitario).toBe('199.9000');
  });
});
