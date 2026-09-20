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
      via: 'CONSUMIDOR',
      imprimivel: true,
      motivoNaoImprimivel: '',
      contingencia: false,
      emitente: { razaoSocial: 'Empresa Teste Ltda', nomeFantasia: 'Sysvar', cnpj: '00000000000123', inscricaoEstadual: '123', endereco: 'Rua Teste, 1' },
      nfce: { numero: 123, serie: 1, emitidaEm: '2026-09-20T10:00:00', ambiente: 'HOMOLOGACAO', status: 'AUTORIZADA' },
      itens: [{ codigo: '001', descricao: 'Calça Jeans', quantidade: '1.000', unidade: 'UN', valorUnitario: '199.90', valorTotal: '199.90' }],
      totais: { subtotal: '199.90', desconto: '0.00', total: '199.90' },
      pagamentos: [{ descricao: 'Dinheiro', valor: '199.90' }],
      troco: '0.00',
      consumidor: { nome: 'Maria Silva', documento: '12345678901' },
      mensagens: ['Consulte pela chave de acesso'],
      qrCodeDataUri: 'data:image/png;base64,AAAA',
      chaveAcesso: '35260900000000000123650010000001231000001234',
      urlConsulta: 'https://sefaz.example.test',
      protocoloAutorizacao: '135260000000001',
    };
    fixture.detectChanges();
  });

  it('renderiza campos do DANFE NFC-e recebido do backend', () => {
    const host: HTMLElement = fixture.nativeElement;

    expect(host.textContent).toContain('Empresa Teste Ltda');
    expect(host.textContent).toContain('NFC-e n. 123 serie 1');
    expect(host.textContent).toContain('Calça Jeans');
    expect(host.textContent).toContain('Maria Silva');
    expect(host.textContent).toContain('Protocolo 135260000000001');
    expect(host.querySelector('img')?.getAttribute('src')).toBe('data:image/png;base64,AAAA');
  });
});
