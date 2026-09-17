import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';

import { TERMINAL_CREDENTIAL_STORE, TerminalCredentialStore } from '../auth/terminal-credential-store';
import { terminalAuthInterceptor } from './terminal-auth.interceptor';

describe('terminalAuthInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let credentialStore: jasmine.SpyObj<TerminalCredentialStore>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    credentialStore = jasmine.createSpyObj<TerminalCredentialStore>('TerminalCredentialStore', [
      'getToken',
      'setToken',
      'clearToken',
      'hasToken',
    ]);
    router = jasmine.createSpyObj<Router>('Router', ['navigateByUrl']);

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([terminalAuthInterceptor])),
        provideHttpClientTesting(),
        { provide: TERMINAL_CREDENTIAL_STORE, useValue: credentialStore },
        { provide: Router, useValue: router },
      ],
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('adiciona Terminal token em rota autenticada', () => {
    credentialStore.getToken.and.returnValue('token-ficticio');

    http.get('/api/terminal/contexto/').subscribe();
    const request = httpMock.expectOne('/api/terminal/contexto/');

    expect(request.request.headers.get('Authorization')).toBe('Terminal token-ficticio');
    request.flush({});
  });

  it('nao adiciona token em /parear/', () => {
    credentialStore.getToken.and.returnValue('token-ficticio');

    http.post('/api/terminal/parear/', {}).subscribe();
    const request = httpMock.expectOne('/api/terminal/parear/');

    expect(request.request.headers.has('Authorization')).toBeFalse();
    request.flush({});
  });

  it('nao adiciona token em URL externa', () => {
    credentialStore.getToken.and.returnValue('token-ficticio');

    http.get('https://example.com/api/terminal/contexto/').subscribe();
    const request = httpMock.expectOne('https://example.com/api/terminal/contexto/');

    expect(request.request.headers.has('Authorization')).toBeFalse();
    request.flush({});
  });

  it('funciona sem token', () => {
    credentialStore.getToken.and.returnValue(null);

    http.get('/api/terminal/contexto/').subscribe();
    const request = httpMock.expectOne('/api/terminal/contexto/');

    expect(request.request.headers.has('Authorization')).toBeFalse();
    request.flush({});
  });

  it('401 remove token e redireciona para pareamento', () => {
    credentialStore.getToken.and.returnValue('token-ficticio');

    http.get('/api/terminal/contexto/').subscribe({ error: () => undefined });
    const request = httpMock.expectOne('/api/terminal/contexto/');
    request.flush({}, { status: 401, statusText: 'Unauthorized' });

    expect(credentialStore.clearToken).toHaveBeenCalled();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/pareamento');
  });

  it('403 remove token e redireciona para pareamento', () => {
    credentialStore.getToken.and.returnValue('token-ficticio');

    http.post('/api/terminal/heartbeat/', { hostname: 'PDV-BARRA-01' }).subscribe({ error: () => undefined });
    const request = httpMock.expectOne('/api/terminal/heartbeat/');
    request.flush({}, { status: 403, statusText: 'Forbidden' });

    expect(credentialStore.clearToken).toHaveBeenCalled();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/pareamento');
  });

  it('400 no login do operador nao limpa Terminal', () => {
    credentialStore.getToken.and.returnValue('token-ficticio');

    http.post('/api/terminal/operador/login/', {}).subscribe({ error: () => undefined });
    const request = httpMock.expectOne('/api/terminal/operador/login/');
    request.flush({ detail: 'Operador ou credencial inválidos.' }, { status: 400, statusText: 'Bad Request' });

    expect(request.request.headers.get('Authorization')).toBe('Terminal token-ficticio');
    expect(credentialStore.clearToken).not.toHaveBeenCalled();
    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });

  it('401 no contexto do operador nao limpa Terminal', () => {
    credentialStore.getToken.and.returnValue('token-ficticio');

    http.get('/api/terminal/operador/contexto/').subscribe({ error: () => undefined });
    const request = httpMock.expectOne('/api/terminal/operador/contexto/');
    request.flush({}, { status: 401, statusText: 'Unauthorized' });

    expect(request.request.headers.get('Authorization')).toBe('Terminal token-ficticio');
    expect(credentialStore.clearToken).not.toHaveBeenCalled();
    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });

  it('403 no logout do operador nao limpa Terminal', () => {
    credentialStore.getToken.and.returnValue('token-ficticio');

    http.post('/api/terminal/operador/logout/', {}).subscribe({ error: () => undefined });
    const request = httpMock.expectOne('/api/terminal/operador/logout/');
    request.flush({}, { status: 403, statusText: 'Forbidden' });

    expect(credentialStore.clearToken).not.toHaveBeenCalled();
    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });

  it('401 em endpoint de caixa nao limpa Terminal', () => {
    credentialStore.getToken.and.returnValue('token-ficticio');

    http.get('/api/terminal/caixa/resumo/').subscribe({ error: () => undefined });
    const request = httpMock.expectOne('/api/terminal/caixa/resumo/');
    request.flush({}, { status: 401, statusText: 'Unauthorized' });

    expect(request.request.headers.get('Authorization')).toBe('Terminal token-ficticio');
    expect(credentialStore.clearToken).not.toHaveBeenCalled();
    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });

  it('401 em endpoint de venda nao limpa Terminal nem navega pareamento', () => {
    credentialStore.getToken.and.returnValue('token-ficticio');

    http.get('/api/terminal/venda/atual/').subscribe({ error: () => undefined });
    const request = httpMock.expectOne('/api/terminal/venda/atual/');
    request.flush({}, { status: 401, statusText: 'Unauthorized' });

    expect(request.request.headers.get('Authorization')).toBe('Terminal token-ficticio');
    expect(credentialStore.clearToken).not.toHaveBeenCalled();
    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });

  it('401 em formas de pagamento nao limpa Terminal nem navega pareamento', () => {
    credentialStore.getToken.and.returnValue('token-ficticio');

    http.get('/api/terminal/formas-pagamento/').subscribe({ error: () => undefined });
    const request = httpMock.expectOne('/api/terminal/formas-pagamento/');
    request.flush({}, { status: 401, statusText: 'Unauthorized' });

    expect(request.request.headers.get('Authorization')).toBe('Terminal token-ficticio');
    expect(credentialStore.clearToken).not.toHaveBeenCalled();
    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });

  it('401 em clientes nao limpa Terminal nem navega pareamento', () => {
    credentialStore.getToken.and.returnValue('token-ficticio');

    http.get('/api/terminal/clientes/').subscribe({ error: () => undefined });
    const request = httpMock.expectOne('/api/terminal/clientes/');
    request.flush({}, { status: 401, statusText: 'Unauthorized' });

    expect(request.request.headers.get('Authorization')).toBe('Terminal token-ficticio');
    expect(credentialStore.clearToken).not.toHaveBeenCalled();
    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });

  it('401 no login do operador pode limpar Terminal', () => {
    credentialStore.getToken.and.returnValue('token-ficticio');

    http.post('/api/terminal/operador/login/', {}).subscribe({ error: () => undefined });
    const request = httpMock.expectOne('/api/terminal/operador/login/');
    request.flush({}, { status: 401, statusText: 'Unauthorized' });

    expect(credentialStore.clearToken).toHaveBeenCalled();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/pareamento');
  });
});
