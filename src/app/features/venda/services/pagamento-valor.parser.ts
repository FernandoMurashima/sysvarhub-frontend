const MAX_INTEIRO = '9999999999999999';

export function normalizarValorPagamento(input: string | null | undefined): string | null {
  if (input === null || input === undefined) return null;
  const texto = input.trim();
  if (!texto || texto.startsWith('-') || /e/i.test(texto)) return null;
  if (!/^\d+([,.]\d{0,2})?$/.test(texto)) return null;

  const [inteiroRaw, decimalRaw = ''] = texto.replace(',', '.').split('.');
  const inteiro = inteiroRaw.replace(/^0+(?=\d)/, '') || '0';
  const decimal = decimalRaw.padEnd(2, '0');
  if (decimal.length > 2) return null;
  if (inteiro === '0' && decimal === '00') return null;
  if (inteiro.length > MAX_INTEIRO.length || (inteiro.length === MAX_INTEIRO.length && inteiro > MAX_INTEIRO)) {
    return null;
  }
  return `${inteiro}.${decimal}`;
}

export function formatarMoedaString(valor: string | null | undefined): string {
  const normalizado = (valor || '0.00').replace(',', '.');
  const [inteiroRaw, decimalRaw = '00'] = normalizado.split('.');
  const sinal = inteiroRaw.startsWith('-') ? '-' : '';
  const inteiro = inteiroRaw.replace('-', '').replace(/^0+(?=\d)/, '') || '0';
  const comMilhar = inteiro.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${sinal}R$ ${comMilhar},${decimalRaw.padEnd(2, '0').slice(0, 2)}`;
}

export function somarMoedasString(...valores: Array<string | null | undefined>): string {
  const totalCentavos = valores.reduce((total, valor) => total + paraCentavos(valor || '0.00'), 0n);
  const sinal = totalCentavos < 0n ? '-' : '';
  const absoluto = totalCentavos < 0n ? -totalCentavos : totalCentavos;
  const inteiro = absoluto / 100n;
  const centavos = String(absoluto % 100n).padStart(2, '0');
  return `${sinal}${inteiro}.${centavos}`;
}

function paraCentavos(valor: string): bigint {
  const [inteiroRaw, decimalRaw = '00'] = valor.replace(',', '.').split('.');
  const sinal = inteiroRaw.startsWith('-') ? -1n : 1n;
  const inteiro = BigInt(inteiroRaw.replace('-', '') || '0');
  const centavos = BigInt(decimalRaw.padEnd(2, '0').slice(0, 2));
  return sinal * (inteiro * 100n + centavos);
}
