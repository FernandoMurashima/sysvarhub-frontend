import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { TERMINAL_CREDENTIAL_STORE, TerminalCredentialStore } from '../../../core/auth/terminal-credential-store';
import { terminalContextoStub } from '../../../testing/terminal-test-data';
import { HubTerminalService } from './hub-terminal.service';

describe('HubTerminalService', () => {
  let service: HubTerminalService;
  let httpMock: HttpTestingController;
  let credentialStore: jasmine.SpyObj<TerminalCredentialStore>;

  beforeEach(() => {
    credentialStore = jasmine.createSpyObj<TerminalCredentialStore>('TerminalCredentialStore', [
      'getToken',
      'setToken',
      'clearToken',
      'hasToken',
    ]);

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: TERMINAL_CREDENTIAL_STORE, useValue: credentialStore },
      ],
    });

    service = TestBed.inject(HubTerminalService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('pareamento usa endpoint correto, contrato real e persiste credencial pela abstracao', (done) => {
    service.parear({ codigo: 'XXXX-XXXX-XXXX', hostname: 'PDV-BARRA-01' }).subscribe((response) => {
      expect(response.token).toBe('token-ficticio');
      expect(response.terminal.uuid).toBe('terminal-uuid-ficticio');
      expect(response.caixa?.codigo).toBe('CX-01');
      expect(response.loja.apelido).toBe('Filial 1');
      expect(response.empresa.nome).toBe('Empresa Teste Ltda');
      done();
    });

    const request = httpMock.expectOne('/api/terminal/parear/');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ codigo: 'XXXX-XXXX-XXXX', hostname: 'PDV-BARRA-01' });
    expect(request.request.body.codigo_pareamento).toBeUndefined();
    request.flush({ token: 'token-ficticio', ...terminalContextoStub });

    expect(credentialStore.setToken).toHaveBeenCalledWith('token-ficticio');
  });

  it('contexto usa endpoint correto e contrato real', (done) => {
    service.contexto().subscribe((contexto) => {
      expect(contexto.terminal.uuid).toBe('terminal-uuid-ficticio');
      expect(contexto.terminal.codigo).toBe('PDV-01');
      expect(contexto.terminal.nome).toBe('PDV-01');
      expect(contexto.terminal.hostname).toBe('PDV-BARRA-01');
      expect(contexto.terminal.ativo).toBeTrue();
      expect(contexto.caixa?.ativo).toBeTrue();
      expect(contexto.loja.apelido).toBe('Filial 1');
      expect(contexto.loja.estado).toBe('RJ');
      done();
    });

    const request = httpMock.expectOne('/api/terminal/contexto/');
    expect(request.request.method).toBe('GET');
    request.flush(terminalContextoStub);
  });

  it('contexto aceita caixa null', (done) => {
    service.contexto().subscribe((contexto) => {
      expect(contexto.caixa).toBeNull();
      done();
    });

    const request = httpMock.expectOne('/api/terminal/contexto/');
    request.flush({ ...terminalContextoStub, caixa: null });
  });

  it('heartbeat usa endpoint correto e contrato real', (done) => {
    service.heartbeat({ hostname: 'PDV-BARRA-01' }).subscribe((response) => {
      expect(response.status).toBe('ok');
      expect(response.terminal_uuid).toBe('terminal-uuid-ficticio');
      expect(response.servidor_em).toBe('2026-09-13T10:20:00Z');
      done();
    });

    const request = httpMock.expectOne('/api/terminal/heartbeat/');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ hostname: 'PDV-BARRA-01' });
    request.flush({
      status: 'ok',
      terminal_uuid: 'terminal-uuid-ficticio',
      servidor_em: '2026-09-13T10:20:00Z',
    });
  });
});
