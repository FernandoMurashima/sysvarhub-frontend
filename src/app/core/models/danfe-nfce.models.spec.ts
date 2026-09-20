import { DanfeNfceApi, mapDanfeNfce } from './danfe-nfce.models';

export const danfeNfceApiRealStub: DanfeNfceApi = {
  nfce_uuid: 'nfce-uuid',
  venda_uuid: 'venda-hub-uuid',
  status: 'AUTORIZADA',
  imprimivel: true,
  motivo_nao_imprimivel: '',
  via: 'CONSUMIDOR',
  via_texto: 'Via Consumidor',
  ambiente: 'HOMOLOGACAO',
  homologacao: true,
  contingencia: false,
  emitente: {
    razao_social: 'Empresa Teste Ltda',
    nome_fantasia: 'Sysvar',
    cnpj: '00000000000123',
    ie: '123456789',
    endereco: 'Rua Teste, 1',
  },
  documento: {
    modelo: '65',
    serie: 7,
    numero: 10,
    emitida_em: '20/09/2026 10:00:00',
    emitida_em_iso: '2026-09-20T10:00:00-03:00',
    ambiente: '2',
    tipo_emissao: '1',
    chave_acesso: '35260900000000000123650070000000101000000010',
    chave_acesso_formatada: '3526 0900 0000 0000 1236 5007 0000 0001 0100 0000 010',
    url_consulta: 'https://sefaz.example.test',
  },
  consumidor: {
    identificado: false,
    tipo_documento: '',
    documento: '',
    nome: '',
  },
  itens: [{
    numero: 1,
    codigo: '001',
    descricao: 'Calça Jeans',
    quantidade: '1.000',
    unidade: 'UN',
    valor_unitario: '199.90',
    valor_bruto: '199.90',
    desconto: '10.00',
    valor_liquido: '189.90',
  }],
  totais: {
    quantidade_itens: 1,
    vProd: '199.90',
    vDesc: '10.00',
    vNF: '189.90',
    vPIS: '0.00',
    vCOFINS: '0.00',
    vICMS: '0.00',
  },
  pagamentos: [{ tPag: '01', descricao: 'Dinheiro', valor: '189.90' }],
  troco: '0.00',
  mensagens: ['Consulte pela chave de acesso'],
  protocolo: {
    numero: '135260000000001',
    autorizada_em: '20/09/2026 10:00:05',
    codigo_retorno: '100',
    mensagem_retorno: 'Autorizado o uso da NF-e',
  },
  qr_code_payload: 'https://sefaz.example.test/qrcode',
  qr_code_data_uri: 'data:image/svg+xml;base64,AAAA',
};

describe('danfe nfce models', () => {
  it('mapeia contrato real do backend para DTO camelCase', () => {
    const danfe = mapDanfeNfce(danfeNfceApiRealStub);

    expect(danfe.nfceUuid).toBe('nfce-uuid');
    expect(danfe.documento.numero).toBe(10);
    expect(danfe.documento.serie).toBe(7);
    expect(danfe.documento.chaveAcessoFormatada).toContain('3526 0900');
    expect(danfe.emitente.inscricaoEstadual).toBe('123456789');
    expect(danfe.itens[0].valorBruto).toBe('199.90');
    expect(danfe.itens[0].desconto).toBe('10.00');
    expect(danfe.itens[0].valorLiquido).toBe('189.90');
    expect(danfe.totais.valorProdutos).toBe('199.90');
    expect(danfe.totais.desconto).toBe('10.00');
    expect(danfe.totais.valorTotal).toBe('189.90');
    expect(danfe.pagamentos[0].codigoFiscal).toBe('01');
    expect(danfe.consumidor.identificado).toBeFalse();
    expect(danfe.protocolo?.numero).toBe('135260000000001');
    expect(danfe.qrCodePayload).toContain('qrcode');
    expect(danfe.qrCodeDataUri).toBe('data:image/svg+xml;base64,AAAA');
  });
});
