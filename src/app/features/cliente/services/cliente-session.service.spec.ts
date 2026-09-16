import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { ClienteHubResumo, ClientesConsultaResponse } from '../../../core/models/cliente.models';
import { TERMINAL_CREDENTIAL_STORE, TerminalCredentialStore } from '../../../core/auth/terminal-credential-store';
import { OperatorSessionService } from '../../operador/services/operator-session.service';
import { ClienteCadastroComunicacaoIncertError, ClienteSessionExpiredError, ClienteSessionService } from './cliente-session.service';
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

  const cliente: ClienteHubResumo = {
    clienteUuid: 'cliente-uuid',
    retaguardaId: null,
    origem: 'LOCAL',
    tipoPessoa: 'PF',
    documento: '12345678901',
    clientePadrao: false,
    nomeCliente: 'Maria Silva',
    apelido: '',
    telefone1: '',
    telefone2: '',
    email: '',
    aniversario: null,
    endereco: '',
    numero: '',
    complemento: '',
    cep: '',
    bairro: '',
    cidade: '',
    estado: '',
    bloqueio: false,
    motivoBloqueio: null,
    ativo: true,
    presenteRetaguarda: false,
    pendenteSincronizacao: true,
  };

  beforeEach(() => {
    hubClienteService = jasmine.createSpyObj<HubClienteService>('HubClienteService', ['listar', 'cadastrar']);
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

  it('cadastro 401 invalida operador e navega operador sem limpar Terminal', (done) => {
    hubClienteService.cadastrar.and.returnValue(throwError(() => new HttpErrorResponse({ status: 401 })));

    service.cadastrar({ tipo_pessoa: 'PF', documento: '12345678901', nome_cliente: 'Maria Silva' }).subscribe({
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

  it('cadastro 403 invalida operador e navega operador sem limpar Terminal', (done) => {
    hubClienteService.cadastrar.and.returnValue(throwError(() => new HttpErrorResponse({ status: 403 })));

    service.cadastrar({ tipo_pessoa: 'PF', documento: '12345678901', nome_cliente: 'Maria Silva' }).subscribe({
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

  it('erro incerto do POST nao repete POST e faz somente um GET de reconciliacao', (done) => {
    hubClienteService.cadastrar.and.returnValue(throwError(() => new HttpErrorResponse({ status: 0 })));
    hubClienteService.listar.and.returnValue(of({ ...response, clientes: [cliente] }));

    service.cadastrar({ tipo_pessoa: 'PF', documento: '123.456.789-01', nome_cliente: 'Maria Silva' }).subscribe((resultado) => {
      expect(resultado).toBe(cliente);
      expect(hubClienteService.cadastrar).toHaveBeenCalledTimes(1);
      expect(hubClienteService.listar).toHaveBeenCalledOnceWith('12345678901');
      done();
    });
  });

  it('GET de reconciliacao sem documento exato retorna erro', (done) => {
    hubClienteService.cadastrar.and.returnValue(throwError(() => new HttpErrorResponse({ status: 0 })));
    hubClienteService.listar.and.returnValue(of({ ...response, clientes: [{ ...cliente, documento: '00000000000' }] }));

    service.cadastrar({ tipo_pessoa: 'PF', documento: '12345678901', nome_cliente: 'Maria Silva' }).subscribe({
      error: (error) => {
        expect(error instanceof ClienteCadastroComunicacaoIncertError).toBeTrue();
        expect(hubClienteService.cadastrar).toHaveBeenCalledTimes(1);
        expect(hubClienteService.listar).toHaveBeenCalledTimes(1);
        done();
      },
    });
  });

  it('GET de reconciliacao com status 0 retorna erro de comunicacao incerta sem repetir chamadas', (done) => {
    hubClienteService.cadastrar.and.returnValue(throwError(() => new HttpErrorResponse({ status: 0 })));
    hubClienteService.listar.and.returnValue(throwError(() => new HttpErrorResponse({ status: 0 })));

    service.cadastrar({ tipo_pessoa: 'PF', documento: '12345678901', nome_cliente: 'Maria Silva' }).subscribe({
      error: (error) => {
        expect(error instanceof ClienteCadastroComunicacaoIncertError).toBeTrue();
        expect(hubClienteService.cadastrar).toHaveBeenCalledTimes(1);
        expect(hubClienteService.listar).toHaveBeenCalledTimes(1);
        done();
      },
    });
  });

  it('GET de reconciliacao 401/403 invalida operador', (done) => {
    hubClienteService.cadastrar.and.returnValue(throwError(() => new HttpErrorResponse({ status: 0 })));
    hubClienteService.listar.and.returnValue(throwError(() => new HttpErrorResponse({ status: 403 })));

    service.cadastrar({ tipo_pessoa: 'PF', documento: '12345678901', nome_cliente: 'Maria Silva' }).subscribe({
      error: (error) => {
        expect(error instanceof ClienteSessionExpiredError).toBeTrue();
        expect(operatorSession.invalidarSessao).toHaveBeenCalled();
        expect(router.navigateByUrl).toHaveBeenCalledWith('/operador');
        expect(router.navigateByUrl).not.toHaveBeenCalledWith('/pareamento');
        done();
      },
    });
  });
});
