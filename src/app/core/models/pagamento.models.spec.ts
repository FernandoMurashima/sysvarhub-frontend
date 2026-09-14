import { mapFormasPagamento } from './pagamento.models';

describe('pagamento models', () => {
  it('mapeia formas e parcelas preservando decimais como string', () => {
    const response = mapFormasPagamento({
      versao: 1,
      sincronizado_em: '2026-09-14T10:00:00',
      formas: [{
        id: 1,
        retaguarda_id: 10,
        codigo: 'DIN',
        descricao: 'Dinheiro',
        tipo: 'DINHEIRO',
        num_parcelas: 1,
        tef_habilitado: false,
        parcelas: [{ ordem: 1, dias: 0, percentual: '1.000000', valor_fixo: null }],
      }],
    });

    expect(response.sincronizadoEm).toBe('2026-09-14T10:00:00');
    expect(response.formas[0].retaguardaId).toBe(10);
    expect(response.formas[0].numParcelas).toBe(1);
    expect(response.formas[0].tefHabilitado).toBeFalse();
    expect(response.formas[0].parcelas[0].percentual).toBe('1.000000');
  });
});
