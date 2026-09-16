import { mapVendedor, mapVendedores } from './vendedor.models';

describe('vendedor models', () => {
  it('mapeia vendedor snake_case para camelCase', () => {
    const vendedor = mapVendedor({
      id: 501,
      matricula: '000501',
      nome: 'Ana Vendedora',
      apelido: 'Ana',
      cargo: { id: 5, codigo: 'VENDEDOR', descricao: 'Vendedor' },
      comissionado: true,
      comissao_percentual: '3.00',
    });

    expect(vendedor.id).toBe(501);
    expect(vendedor.cargo?.descricao).toBe('Vendedor');
    expect(vendedor.comissaoPercentual).toBe('3.00');
    expect(typeof vendedor.comissaoPercentual).toBe('string');
  });

  it('mapeia cargo null', () => {
    const vendedor = mapVendedor({
      id: 501,
      matricula: '000501',
      nome: 'Ana Vendedora',
      apelido: '',
      cargo: null,
      comissionado: false,
      comissao_percentual: '0.00',
    });

    expect(vendedor.cargo).toBeNull();
  });

  it('mapeia resposta de consulta', () => {
    const response = mapVendedores({
      vendedores_versao: 1,
      vendedores_sincronizado_em: '2026-09-16T10:00:00',
      q: '',
      total: 1,
      limit: 50,
      vendedores: [{
        id: 501,
        matricula: '000501',
        nome: 'Ana Vendedora',
        apelido: 'Ana',
        cargo: null,
        comissionado: true,
        comissao_percentual: '3.00',
      }],
    });

    expect(response.vendedoresVersao).toBe(1);
    expect(response.vendedores[0].nome).toBe('Ana Vendedora');
  });
});
