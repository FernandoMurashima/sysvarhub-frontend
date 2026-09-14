import { formatarMoedaString, normalizarValorPagamento, somarMoedasString } from './pagamento-valor.parser';

describe('pagamento valor parser', () => {
  it('normaliza virgula, ponto e inteiro', () => {
    expect(normalizarValorPagamento('199,90')).toBe('199.90');
    expect(normalizarValorPagamento('199.90')).toBe('199.90');
    expect(normalizarValorPagamento('199')).toBe('199.00');
    expect(normalizarValorPagamento('199,9')).toBe('199.90');
  });

  it('rejeita entradas invalidas e limite acima de 18,2', () => {
    ['1.999', '-1.00', '0.00', '1e3', 'abc', '10000000000000000.00'].forEach((valor) => {
      expect(normalizarValorPagamento(valor)).toBeNull();
    });
    expect(normalizarValorPagamento('9999999999999999.99')).toBe('9999999999999999.99');
  });

  it('formata e soma sem Number', () => {
    expect(formatarMoedaString('1234567.80')).toBe('R$ 1.234.567,80');
    expect(somarMoedasString('1.20', '2.35')).toBe('3.55');
  });
});
