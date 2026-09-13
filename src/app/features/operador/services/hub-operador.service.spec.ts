import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { OPERATOR_SESSION_STORE, OperatorSessionStore } from '../../../core/auth/operator-session-store';
import { HubOperadorService } from './hub-operador.service';

describe('HubOperadorService', () => {
  let service: HubOperadorService;
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
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: OPERATOR_SESSION_STORE, useValue: sessionStore },
      ],
    });

    service = TestBed.inject(HubOperadorService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('login chama endpoint correto e salva sessao_token', (done) => {
    service.login('caixa.barra', 'credencial-digitada').subscribe((response) => {
      expect(response.sessaoToken).toBe('sessao-operador-ficticia');
      expect(response.operador.usuarioId).toBe(99);
      expect(response.operador.nome).toBe('Juliana Rocha');
      expect(response.operador.perfil?.nome).toBe('Operador de Caixa');
      done();
    });

    const request = httpMock.expectOne('/api/terminal/operador/login/');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ codigo: 'caixa.barra', senha: 'credencial-digitada' });
    request.flush({
      sessao_token: 'sessao-operador-ficticia',
      sessao: { uuid: 'sessao-operador-uuid', iniciada_em: '2026-09-13T10:30:00' },
      operador: {
        usuario_id: 99,
        codigo: 'caixa.barra',
        nome: 'Juliana Rocha',
        tipo: 'Caixa',
        perfil: { id: 4, nome: 'Operador de Caixa' },
      },
    });

    expect(sessionStore.setToken).toHaveBeenCalledWith('sessao-operador-ficticia');
  });

  it('contexto usa endpoint correto e adapta snake_case', (done) => {
    service.contexto().subscribe((response) => {
      expect(response.sessao.ultimaAtividadeEm).toBe('2026-09-13T10:35:00');
      expect(response.operador.codigo).toBe('caixa.barra');
      done();
    });

    const request = httpMock.expectOne('/api/terminal/operador/contexto/');
    expect(request.request.method).toBe('GET');
    request.flush({
      sessao: {
        uuid: 'sessao-operador-uuid',
        iniciada_em: '2026-09-13T10:30:00',
        ultima_atividade_em: '2026-09-13T10:35:00',
      },
      operador: {
        usuario_id: 99,
        codigo: 'caixa.barra',
        nome: 'Juliana Rocha',
        tipo: 'Caixa',
        perfil: null,
      },
    });
  });

  it('logout usa endpoint correto', (done) => {
    service.logout().subscribe((response) => {
      expect(response.status).toBe('ok');
      done();
    });

    const request = httpMock.expectOne('/api/terminal/operador/logout/');
    expect(request.request.method).toBe('POST');
    request.flush({ status: 'ok' });
  });
});
