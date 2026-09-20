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
        total_pago: '100.00',
        pendente: '99.90',
        troco: '0.00',
        cliente: {
          cliente_uuid: 'cliente-uuid',
          retaguarda_id: 123,
          tipo_pessoa: 'PF',
          documento: '12345678901',
          cliente_padrao: false,
          nome_cliente: 'Cliente Teste',
        },
        vendedor: {
          id: 501,
          matricula: '000501',
          nome: 'Ana Vendedora',
          apelido: 'Ana',
          cargo: { id: 5, codigo: 'VENDEDOR', descricao: 'Vendedor' },
          comissionado: true,
          comissao_percentual: '3.00',
        },
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
        pagamentos: [{
          uuid: 'pag',
          forma_pagamento_id: 1,
          forma_retaguarda_id: 10,
          codigo: 'DIN',
          descricao: 'Dinheiro',
          tipo: 'DINHEIRO',
          num_parcelas: 1,
          valor: '100.00',
          autorizacao: '',
          origem_captura: 'MANUAL',
          criado_em: '2026-09-13T12:01:00',
        }],
        fiscal: {
          emite_nfce: true,
          nfce_uuid: 'nfce-uuid',
          status: 'AUTORIZADA',
          numero: 123,
          serie: 1,
          chave_acesso: '35260900000000000123650010000001231000001234',
          protocolo_autorizacao: '135260000000001',
          motivo: 'Autorizado o uso da NF-e',
        },
      },
    };

    const venda = mapVendaAtual(api).venda;

    expect(venda?.subtotal).toBe('199.90');
    expect(venda?.descontoItens).toBe('0.00');
    expect(venda?.operadorCriacao.codigo).toBe('caixa.barra');
    expect(venda?.itens[0].skuId).toBe(10825);
    expect(venda?.itens[0].quantidade).toBe(2);
    expect(venda?.itens[0].precoUnitario).toBe('199.9000');
    expect(venda?.totalPago).toBe('100.00');
    expect(venda?.pendente).toBe('99.90');
    expect(venda?.troco).toBe('0.00');
    expect(venda?.cliente?.clienteUuid).toBe('cliente-uuid');
    expect(venda?.cliente?.retaguardaId).toBe(123);
    expect(venda?.cliente?.nomeCliente).toBe('Cliente Teste');
    expect(venda?.vendedor?.id).toBe(501);
    expect(venda?.vendedor?.comissaoPercentual).toBe('3.00');
    expect(venda?.pagamentos[0].formaPagamentoId).toBe(1);
    expect(venda?.fiscal.emiteNfce).toBeTrue();
    expect(venda?.fiscal.nfceUuid).toBe('nfce-uuid');
    expect(venda?.fiscal.status).toBe('AUTORIZADA');
    expect(venda?.fiscal.chaveAcesso).toBe('35260900000000000123650010000001231000001234');
  });

  it('mapeia venda com cliente null', () => {
    const venda = mapVendaAtual({
      venda: {
        uuid: 'venda',
        status: 'ABERTA',
        criada_em: '2026-09-13T12:00:00',
        subtotal: '0.00',
        desconto_itens: '0.00',
        desconto_geral: '0.00',
        total: '0.00',
        cliente: null,
        vendedor: null,
        operador_criacao: { usuario_id: 99, codigo: 'caixa.barra', nome: 'Juliana', tipo: 'Caixa', perfil: null },
        itens: [],
      },
    }).venda;

    expect(venda?.cliente).toBeNull();
    expect(venda?.vendedor).toBeNull();
    expect(venda?.fiscal.emiteNfce).toBeFalse();
  });

  it('mapeia venda null com cliente_preselecionado e vendedor_preselecionado', () => {
    const response = mapVendaAtual({
      venda: null,
      cliente_preselecionado: {
        cliente_uuid: 'cliente-uuid',
        retaguarda_id: 123,
        tipo_pessoa: 'PF',
        documento: '12345678901',
        cliente_padrao: false,
        nome_cliente: 'Cliente Teste',
      },
      vendedor_preselecionado: {
        id: 501,
        matricula: '000501',
        nome: 'Ana Vendedora',
        apelido: 'Ana',
        cargo: null,
        comissionado: true,
        comissao_percentual: '3.00',
      },
    });

    expect(response.venda).toBeNull();
    expect(response.clientePreselecionado?.clienteUuid).toBe('cliente-uuid');
    expect(response.clientePreselecionado?.nomeCliente).toBe('Cliente Teste');
    expect(response.vendedorPreselecionado?.id).toBe(501);
    expect(response.vendedorPreselecionado?.cargo).toBeNull();
  });

  it('mapeia venda existente com cliente_preselecionado null', () => {
    const response = mapVendaAtual({
      venda: {
        uuid: 'venda',
        status: 'ABERTA',
        criada_em: '2026-09-13T12:00:00',
        subtotal: '0.00',
        desconto_itens: '0.00',
        desconto_geral: '0.00',
        total: '0.00',
        cliente: null,
        vendedor: null,
        operador_criacao: { usuario_id: 99, codigo: 'caixa.barra', nome: 'Juliana', tipo: 'Caixa', perfil: null },
        itens: [],
      },
      cliente_preselecionado: null,
      vendedor_preselecionado: null,
    });

    expect(response.venda?.uuid).toBe('venda');
    expect(response.clientePreselecionado).toBeNull();
    expect(response.vendedorPreselecionado).toBeNull();
  });
});
