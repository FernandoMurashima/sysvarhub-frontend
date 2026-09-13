import { normalizarValorAbertura } from './caixa-valor.parser';

describe('normalizarValorAbertura', () => {
  it('normaliza valores aceitos', () => {
    expect(normalizarValorAbertura('0')).toBe('0.00');
    expect(normalizarValorAbertura('0,00')).toBe('0.00');
    expect(normalizarValorAbertura('100')).toBe('100.00');
    expect(normalizarValorAbertura('100,00')).toBe('100.00');
    expect(normalizarValorAbertura('100.00')).toBe('100.00');
    expect(normalizarValorAbertura('9999999999.99')).toBe('9999999999.99');
  });

  it('rejeita valores invalidos', () => {
    expect(normalizarValorAbertura('')).toBeNull();
    expect(normalizarValorAbertura('-1')).toBeNull();
    expect(normalizarValorAbertura('1.001')).toBeNull();
    expect(normalizarValorAbertura('1e2')).toBeNull();
    expect(normalizarValorAbertura('10000000000.00')).toBeNull();
  });
});
