import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { HubCaixaService } from './hub-caixa.service';

describe('HubCaixaService', () => {
  let service: HubCaixaService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(HubCaixaService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('status usa endpoint relativo correto', (done) => {
    service.status().subscribe((response) => {
      expect(response.aberto).toBeFalse();
      done();
    });

    const request = httpMock.expectOne('/api/terminal/caixa/status/');
    expect(request.request.method).toBe('GET');
    request.flush({ caixa: { id: 29, codigo: 'CX-BARRA', descricao: 'Caixa Loja Barra', ativo: true }, aberto: false, sessao: null });
  });

  it('abrir usa endpoint relativo correto e body string', (done) => {
    service.abrir('100.00').subscribe((sessao) => {
      expect(sessao.valorAbertura).toBe('100.00');
      done();
    });

    const request = httpMock.expectOne('/api/terminal/caixa/abrir/');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ valor_abertura: '100.00' });
    request.flush({
      uuid: 'sessao',
      status: 'ABERTO',
      valor_abertura: '100.00',
      aberto_em: '2026-09-13T12:00:00',
      fechado_em: null,
      caixa: { id: 29, codigo: 'CX-BARRA', descricao: 'Caixa Loja Barra', ativo: true },
      terminal_abertura: { uuid: 'terminal', codigo: 'PDV-01', nome: 'PDV 01' },
      operador_abertura: { usuario_id: 90, codigo: 'caixa.barra', nome: 'Juliana Rocha', tipo: 'Caixa', perfil: null },
      terminal_fechamento: null,
      operador_fechamento: null,
    });
  });

  it('fechar existe e usa endpoint correto', () => {
    service.fechar().subscribe();

    const request = httpMock.expectOne('/api/terminal/caixa/fechar/');
    expect(request.request.method).toBe('POST');
    request.flush({
      status: 'ok',
      sessao: {
        uuid: 'sessao',
        status: 'FECHADO',
        valor_abertura: '100.00',
        aberto_em: '2026-09-13T12:00:00',
        fechado_em: '2026-09-13T13:00:00',
        caixa: { id: 29, codigo: 'CX-BARRA', descricao: 'Caixa Loja Barra', ativo: true },
        terminal_abertura: { uuid: 'terminal', codigo: 'PDV-01', nome: 'PDV 01' },
        operador_abertura: { usuario_id: 90, codigo: 'caixa.barra', nome: 'Juliana Rocha', tipo: 'Caixa', perfil: null },
        terminal_fechamento: null,
        operador_fechamento: null,
      },
    });
  });
});
