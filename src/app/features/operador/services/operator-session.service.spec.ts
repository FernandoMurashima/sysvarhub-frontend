import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { OPERATOR_SESSION_STORE, OperatorSessionStore } from '../../../core/auth/operator-session-store';
import { operadorContextoResponseStub, operadorLoginResponseStub } from '../../../testing/terminal-test-data';
import { HubOperadorService } from './hub-operador.service';
import { OperatorSessionService } from './operator-session.service';

describe('OperatorSessionService', () => {
  let sessionStore: jasmine.SpyObj<OperatorSessionStore>;
  let hubOperadorService: jasmine.SpyObj<HubOperadorService>;
  let service: OperatorSessionService;

  beforeEach(() => {
    sessionStore = jasmine.createSpyObj<OperatorSessionStore>('OperatorSessionStore', [
      'getToken',
      'setToken',
      'clearToken',
      'hasToken',
    ]);
    hubOperadorService = jasmine.createSpyObj<HubOperadorService>('HubOperadorService', [
      'login',
      'contexto',
      'logout',
    ]);

    TestBed.configureTestingModule({
      providers: [
        OperatorSessionService,
        { provide: OPERATOR_SESSION_STORE, useValue: sessionStore },
        { provide: HubOperadorService, useValue: hubOperadorService },
      ],
    });

    service = TestBed.inject(OperatorSessionService);
  });

  it('sem operator token fica nao autenticado', (done) => {
    sessionStore.hasToken.and.returnValue(false);

    service.bootstrap().subscribe((valid) => {
      expect(valid).toBeFalse();
      expect(service.status()).toBe('nao-autenticado');
      expect(service.operador()).toBeNull();
      done();
    });
  });

  it('token valido restaura contexto', (done) => {
    sessionStore.hasToken.and.returnValue(true);
    hubOperadorService.contexto.and.returnValue(of(operadorContextoResponseStub));

    service.bootstrap().subscribe((valid) => {
      expect(valid).toBeTrue();
      expect(service.status()).toBe('autenticado');
      expect(service.operador()?.nome).toBe('Juliana Rocha');
      expect(service.sessao()?.ultimaAtividadeEm).toBe('2026-09-13T10:35:00');
      done();
    });
  });

  it('contexto 401 limpa somente operador', (done) => {
    sessionStore.hasToken.and.returnValue(true);
    hubOperadorService.contexto.and.returnValue(throwError(() => new HttpErrorResponse({ status: 401 })));

    service.bootstrap().subscribe((valid) => {
      expect(valid).toBeFalse();
      expect(sessionStore.clearToken).toHaveBeenCalled();
      expect(service.status()).toBe('nao-autenticado');
      done();
    });
  });

  it('erro de rede nao inventa sessao', (done) => {
    sessionStore.hasToken.and.returnValue(true);
    hubOperadorService.contexto.and.returnValue(throwError(() => new HttpErrorResponse({ status: 0 })));

    service.bootstrap().subscribe((valid) => {
      expect(valid).toBeFalse();
      expect(sessionStore.clearToken).not.toHaveBeenCalled();
      expect(service.status()).toBe('erro');
      expect(service.operador()).toBeNull();
      done();
    });
  });

  it('login sucesso carrega operador', (done) => {
    hubOperadorService.login.and.returnValue(of(operadorLoginResponseStub));

    service.login('caixa.barra', 'credencial-digitada').subscribe((valid) => {
      expect(valid).toBeTrue();
      expect(hubOperadorService.login).toHaveBeenCalledWith('caixa.barra', 'credencial-digitada');
      expect(service.operador()?.codigo).toBe('caixa.barra');
      expect(service.status()).toBe('autenticado');
      done();
    });
  });

  it('logout limpa sessao operacional mesmo com falha remota controlada', (done) => {
    hubOperadorService.logout.and.returnValue(throwError(() => new HttpErrorResponse({ status: 500 })));

    service.logout().subscribe((ok) => {
      expect(ok).toBeFalse();
      expect(sessionStore.clearToken).toHaveBeenCalled();
      expect(service.status()).toBe('nao-autenticado');
      done();
    });
  });
});
