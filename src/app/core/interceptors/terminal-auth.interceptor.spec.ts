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

  beforeEach(() => {
    credentialStore = jasmine.createSpyObj<TerminalCredentialStore>('TerminalCredentialStore', [
      'getToken',
      'setToken',
      'clearToken',
      'hasToken',
    ]);

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([terminalAuthInterceptor])),
        provideHttpClientTesting(),
        { provide: TERMINAL_CREDENTIAL_STORE, useValue: credentialStore },
        { provide: Router, useValue: jasmine.createSpyObj<Router>('Router', ['navigateByUrl']) },
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
});
