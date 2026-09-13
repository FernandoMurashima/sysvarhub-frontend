import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { OPERATOR_SESSION_STORE, OperatorSessionStore } from '../auth/operator-session-store';
import { operatorSessionInterceptor } from './operator-session.interceptor';

describe('operatorSessionInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let sessionStore: jasmine.SpyObj<OperatorSessionStore>;

  beforeEach(() => {
    sessionStore = jasmine.createSpyObj<OperatorSessionStore>('OperatorSessionStore', [
      'getToken',
      'setToken',
      'clearToken',
      'hasToken',
    ]);

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([operatorSessionInterceptor])),
        provideHttpClientTesting(),
        { provide: OPERATOR_SESSION_STORE, useValue: sessionStore },
      ],
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('nao envia header no login do operador', () => {
    sessionStore.getToken.and.returnValue('sessao-operador-ficticia');

    http.post('/api/terminal/operador/login/', {}).subscribe();
    const request = httpMock.expectOne('/api/terminal/operador/login/');

    expect(request.request.headers.has('X-Sysvar-Operador-Session')).toBeFalse();
    request.flush({});
  });

  it('envia header em contexto e logout do operador', () => {
    sessionStore.getToken.and.returnValue('sessao-operador-ficticia');

    http.get('/api/terminal/operador/contexto/').subscribe();
    http.post('/api/terminal/operador/logout/', {}).subscribe();

    const contexto = httpMock.expectOne('/api/terminal/operador/contexto/');
    const logout = httpMock.expectOne('/api/terminal/operador/logout/');

    expect(contexto.request.headers.get('X-Sysvar-Operador-Session')).toBe('sessao-operador-ficticia');
    expect(logout.request.headers.get('X-Sysvar-Operador-Session')).toBe('sessao-operador-ficticia');
    contexto.flush({});
    logout.flush({});
  });

  it('envia header em endpoints de caixa', () => {
    sessionStore.getToken.and.returnValue('sessao-operador-ficticia');

    http.get('/api/terminal/caixa/status/').subscribe();
    http.post('/api/terminal/caixa/abrir/', {}).subscribe();

    const status = httpMock.expectOne('/api/terminal/caixa/status/');
    const abrir = httpMock.expectOne('/api/terminal/caixa/abrir/');

    expect(status.request.headers.get('X-Sysvar-Operador-Session')).toBe('sessao-operador-ficticia');
    expect(abrir.request.headers.get('X-Sysvar-Operador-Session')).toBe('sessao-operador-ficticia');
    status.flush({});
    abrir.flush({});
  });

  it('nao envia header em pareamento nem URL externa', () => {
    sessionStore.getToken.and.returnValue('sessao-operador-ficticia');

    http.post('/api/terminal/parear/', {}).subscribe();
    http.get('https://example.com/api/terminal/operador/contexto/').subscribe();

    const pareamento = httpMock.expectOne('/api/terminal/parear/');
    const externa = httpMock.expectOne('https://example.com/api/terminal/operador/contexto/');

    expect(pareamento.request.headers.has('X-Sysvar-Operador-Session')).toBeFalse();
    expect(externa.request.headers.has('X-Sysvar-Operador-Session')).toBeFalse();
    pareamento.flush({});
    externa.flush({});
  });
});
