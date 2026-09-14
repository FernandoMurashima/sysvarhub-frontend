import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { ClientesConsultaResponse } from '../../../core/models/cliente.models';
import { TERMINAL_CREDENTIAL_STORE, TerminalCredentialStore } from '../../../core/auth/terminal-credential-store';
import { OperatorSessionService } from '../../operador/services/operator-session.service';
import { ClienteSessionExpiredError, ClienteSessionService } from './cliente-session.service';
import { HubClienteService } from './hub-cliente.service';

describe('ClienteSessionService', () => {
  let service: ClienteSessionService;
  let hubClienteService: jasmine.SpyObj<HubClienteService>;
  let operatorSession: jasmine.SpyObj<OperatorSessionService>;
  let terminalStore: jasmine.SpyObj<TerminalCredentialStore>;
  let router: jasmine.SpyObj<Router>;

  const response: ClientesConsultaResponse = {
    clientesVersao: 1,
    clientesSincronizadoEm: null,
    q: '',
    total: 0,
    limit: 50,
    clientes: [],
  };

  beforeEach(() => {
    hubClienteService = jasmine.createSpyObj<HubClienteService>('HubClienteService', ['listar']);
    operatorSession = jasmine.createSpyObj<OperatorSessionService>('OperatorSessionService', ['invalidarSessao']);
    terminalStore = jasmine.createSpyObj<TerminalCredentialStore>('TerminalCredentialStore', ['getToken', 'setToken', 'clearToken', 'hasToken']);
    router = jasmine.createSpyObj<Router>('Router', ['navigateByUrl']);
    router.navigateByUrl.and.resolveTo(true);

    TestBed.configureTestingModule({
      providers: [
        ClienteSessionService,
        { provide: HubClienteService, useValue: hubClienteService },
        { provide: OperatorSessionService, useValue: operatorSession },
        { provide: TERMINAL_CREDENTIAL_STORE, useValue: terminalStore },
        { provide: Router, useValue: router },
      ],
    });
    service = TestBed.inject(ClienteSessionService);
  });

  it('sucesso devolve clientes', (done) => {
    hubClienteService.listar.and.returnValue(of(response));

    service.listar('maria').subscribe((resultado) => {
      expect(resultado).toBe(response);
      expect(hubClienteService.listar).toHaveBeenCalledWith('maria');
      done();
    });
  });

  it('401 invalida operador e navega operador sem limpar Terminal', (done) => {
    hubClienteService.listar.and.returnValue(throwError(() => new HttpErrorResponse({ status: 401 })));

    service.listar().subscribe({
      error: (error) => {
        expect(error instanceof ClienteSessionExpiredError).toBeTrue();
        expect(operatorSession.invalidarSessao).toHaveBeenCalled();
        expect(router.navigateByUrl).toHaveBeenCalledWith('/operador');
        expect(router.navigateByUrl).not.toHaveBeenCalledWith('/pareamento');
        expect(terminalStore.clearToken).not.toHaveBeenCalled();
        done();
      },
    });
  });

  it('403 invalida operador e navega operador sem limpar Terminal', (done) => {
    hubClienteService.listar.and.returnValue(throwError(() => new HttpErrorResponse({ status: 403 })));

    service.listar().subscribe({
      error: (error) => {
        expect(error instanceof ClienteSessionExpiredError).toBeTrue();
        expect(operatorSession.invalidarSessao).toHaveBeenCalled();
        expect(router.navigateByUrl).toHaveBeenCalledWith('/operador');
        expect(router.navigateByUrl).not.toHaveBeenCalledWith('/pareamento');
        expect(terminalStore.clearToken).not.toHaveBeenCalled();
        done();
      },
    });
  });

  it('erro de rede nao invalida operador nem navega pareamento', (done) => {
    const erro = new HttpErrorResponse({ status: 0 });
    hubClienteService.listar.and.returnValue(throwError(() => erro));

    service.listar().subscribe({
      error: (error) => {
        expect(error).toBe(erro);
        expect(operatorSession.invalidarSessao).not.toHaveBeenCalled();
        expect(router.navigateByUrl).not.toHaveBeenCalled();
        expect(terminalStore.clearToken).not.toHaveBeenCalled();
        done();
      },
    });
  });
});
