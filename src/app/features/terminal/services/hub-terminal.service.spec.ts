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

  it('pareamento usa endpoint correto e persiste credencial pela abstracao', () => {
    service.parear({ codigo_pareamento: 'ABC123', hostname: 'PDV-01' }).subscribe();

    const request = httpMock.expectOne('/api/terminal/parear/');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ codigo_pareamento: 'ABC123', hostname: 'PDV-01' });
    request.flush({ token: 'token-ficticio' });

    expect(credentialStore.setToken).toHaveBeenCalledWith('token-ficticio');
  });

  it('contexto usa endpoint correto', () => {
    service.contexto().subscribe();

    const request = httpMock.expectOne('/api/terminal/contexto/');
    expect(request.request.method).toBe('GET');
    request.flush(terminalContextoStub);
  });

  it('heartbeat usa endpoint correto', () => {
    service.heartbeat({ status: 'online' }).subscribe();

    const request = httpMock.expectOne('/api/terminal/heartbeat/');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ status: 'online' });
    request.flush({ ok: true });
  });
});
