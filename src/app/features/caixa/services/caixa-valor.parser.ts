const MAX_INTEIRO = '9999999999';

export function normalizarValorAbertura(valor: string): string | null {
  const texto = valor.trim();
  if (!texto || texto.startsWith('-') || /e/i.test(texto)) return null;
  if (!/^\d+([,.]\d{1,2})?$/.test(texto)) return null;

  const [inteiroRaw, decimalRaw = ''] = texto.replace(',', '.').split('.');
  const inteiro = inteiroRaw.replace(/^0+(?=\d)/, '') || '0';
  if (inteiro.length > MAX_INTEIRO.length || (inteiro.length === MAX_INTEIRO.length && inteiro > MAX_INTEIRO)) {
    return null;
  }

  const decimal = decimalRaw.padEnd(2, '0');
  return `${inteiro}.${decimal}`;
}
