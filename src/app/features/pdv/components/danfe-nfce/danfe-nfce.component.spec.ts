import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DanfeNfceComponent } from './danfe-nfce.component';

describe('DanfeNfceComponent', () => {
  let fixture: ComponentFixture<DanfeNfceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DanfeNfceComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DanfeNfceComponent);
    fixture.componentInstance.danfe = {
      nfceUuid: 'nfce-uuid',
      vendaUuid: 'venda-hub-uuid',
      status: 'AUTORIZADA',
      via: 'CONSUMIDOR',
      viaTexto: 'Via Consumidor',
      imprimivel: true,
      motivoNaoImprimivel: '',
      ambiente: 'HOMOLOGACAO',
      homologacao: true,
      contingencia: false,
      emitente: { razaoSocial: 'Empresa Teste Ltda', nomeFantasia: 'Sysvar', cnpj: '00000000000123', inscricaoEstadual: '123', endereco: 'Rua Teste, 1' },
      documento: {
        modelo: '65',
        serie: 7,
        numero: 10,
        emitidaEm: '20/09/2026 10:00:00',
        emitidaEmIso: '2026-09-20T10:00:00-03:00',
        ambiente: '2',
        tipoEmissao: '1',
        chaveAcesso: '35260900000000000123650070000000101000000010',
        chaveAcessoFormatada: '3526 0900 0000 0000 1236 5007 0000 0001 0100 0000 010',
        urlConsulta: 'https://sefaz.example.test',
      },
      itens: [{ numero: 1, codigo: '001', descricao: 'Calça Jeans', quantidade: '1.000', unidade: 'UN', valorUnitario: '199.90', valorBruto: '199.90', desconto: '10.00', valorLiquido: '189.90' }],
      totais: { quantidadeItens: 1, valorProdutos: '199.90', desconto: '10.00', valorTotal: '189.90', pis: '0.00', cofins: '0.00', icms: '0.00' },
      pagamentos: [{ codigoFiscal: '01', descricao: 'Dinheiro', valor: '189.90' }],
      troco: '0.00',
      consumidor: { identificado: false, tipoDocumento: '', nome: '', documento: '' },
      mensagens: ['Consulte pela chave de acesso'],
      protocolo: { numero: '135260000000001', autorizadaEm: '20/09/2026 10:00:05', codigoRetorno: '100', mensagemRetorno: 'Autorizado o uso da NF-e' },
      qrCodePayload: 'https://sefaz.example.test/qrcode',
      qrCodeDataUri: 'data:image/svg+xml;base64,AAAA',
    };
    fixture.detectChanges();
  });

  it('renderiza campos do DANFE NFC-e recebido do backend', () => {
    const host: HTMLElement = fixture.nativeElement;

    expect(host.textContent).toContain('Empresa Teste Ltda');
    expect(host.textContent).toContain('NFC-e n. 10 serie 7');
    expect(host.textContent).toContain('Calça Jeans');
    expect(host.textContent).toContain('Consumidor nao identificado');
    expect(host.textContent).toContain('189.90');
    expect(host.textContent).toContain('3526 0900');
    expect(host.textContent).toContain('Protocolo 135260000000001');
    expect(host.querySelector('img')?.getAttribute('src')).toBe('data:image/svg+xml;base64,AAAA');
  });
});
