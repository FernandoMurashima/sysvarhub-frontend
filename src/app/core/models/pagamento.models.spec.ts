import { mapFormasPagamento } from './pagamento.models';

describe('pagamento models', () => {
  it('mapeia formas e parcelas preservando decimais como string', () => {
    const response = mapFormasPagamento({
      versao: 1,
      sincronizado_em: '2026-09-14T10:00:00',
      prazos: [],
      formas: [{
        id: 1,
        retaguarda_id: 10,
        codigo: 'DIN',
        descricao: 'Dinheiro',
        tipo: 'DINHEIRO',
        num_parcelas: 1,
        permite_parcelamento: true,
        tef_habilitado: false,
        condicoes_parcelamento: [{
          id: 90,
          retaguarda_id: 900,
          prazo_pagamento_id: 5,
          prazo_retaguarda_id: 50,
          prazo_codigo: '30D',
          prazo_descricao: '30 dias',
          prazo_num_parcelas: 1,
          prazo_intervalo_dias: 30,
          taxa_percentual: '1.5000',
          taxa_fixa: '0.25',
          parcelas: [{ ordem: 1, dias: 30, percentual: '1.000000', valor_fixo: null }],
        }],
        parcelas: [{ ordem: 1, dias: 0, percentual: '1.000000', valor_fixo: null }],
      }],
    });

    expect(response.sincronizadoEm).toBe('2026-09-14T10:00:00');
    expect(response.formas[0].retaguardaId).toBe(10);
    expect(response.formas[0].numParcelas).toBe(1);
    expect(response.formas[0].permiteParcelamento).toBeTrue();
    expect(response.formas[0].tefHabilitado).toBeFalse();
    expect(response.formas[0].parcelas[0].percentual).toBe('1.000000');
    expect(response.formas[0].condicoesParcelamento[0].prazoPagamentoId).toBe(5);
    expect(response.formas[0].condicoesParcelamento[0].prazoRetaguardaId).toBe(50);
    expect(response.formas[0].condicoesParcelamento[0].taxaPercentual).toBe('1.5000');
    expect(response.formas[0].condicoesParcelamento[0].parcelas[0].dias).toBe(30);
  });
});
