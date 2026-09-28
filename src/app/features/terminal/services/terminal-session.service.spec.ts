import { HttpErrorResponse } from '@angular/common/http';
import { discardPeriodicTasks, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { TERMINAL_CREDENTIAL_STORE, TerminalCredentialStore } from '../../../core/auth/terminal-credential-store';
import { terminalContextoStub } from '../../../testing/terminal-test-data';
import { HubTerminalService } from './hub-terminal.service';
import { TerminalSessionService } from './terminal-session.service';

describe('TerminalSessionService', () => {
  let credentialStore: jasmine.SpyObj<TerminalCredentialStore>;
  let hubTerminalService: jasmine.SpyObj<HubTerminalService>;
  let service: TerminalSessionService;

  beforeEach(() => {
    credentialStore = jasmine.createSpyObj<TerminalCredentialStore>('TerminalCredentialStore', [
      'getToken',
      'setToken',
      'clearToken',
      'hasToken',
    ]);
    hubTerminalService = jasmine.createSpyObj<HubTerminalService>('HubTerminalService', [
      'parear',
      'contexto',
      'heartbeat',
    ]);

    TestBed.configureTestingModule({
      providers: [
        TerminalSessionService,
        { provide: TERMINAL_CREDENTIAL_STORE, useValue: credentialStore },
        { provide: HubTerminalService, useValue: hubTerminalService },
      ],
    });

    service = TestBed.inject(TerminalSessionService);
    hubTerminalService.heartbeat.and.returnValue(of({
      status: 'ok',
      terminal_uuid: terminalContextoStub.terminal.uuid,
      servidor_em: '2026-09-28T10:00:00Z',
    }));
  });

  afterEach(() => {
    service.invalidarSessao();
  });

  it('sem token fica nao pareado', (done) => {
    credentialStore.hasToken.and.returnValue(false);

    service.bootstrap().subscribe((valid) => {
      expect(valid).toBeFalse();
      expect(service.status()).toBe('nao-pareado');
      expect(service.contexto()).toBeNull();
      done();
    });
  });

  it('token valido carrega contexto', (done) => {
    credentialStore.hasToken.and.returnValue(true);
    hubTerminalService.contexto.and.returnValue(of(terminalContextoStub));

    service.bootstrap().subscribe((valid) => {
      expect(valid).toBeTrue();
      expect(service.status()).toBe('contexto-carregado');
      expect(service.contexto()).toEqual(terminalContextoStub);
      done();
    });
  });

  it('autenticacao invalida limpa credencial', (done) => {
    credentialStore.hasToken.and.returnValue(true);
    hubTerminalService.contexto.and.returnValue(
      throwError(() => new HttpErrorResponse({ status: 401 })),
    );

    service.bootstrap().subscribe((valid) => {
      expect(valid).toBeFalse();
      expect(credentialStore.clearToken).toHaveBeenCalled();
      expect(service.status()).toBe('nao-pareado');
      done();
    });
  });

  it('mantem contexto Terminal/Caixa/Loja/Empresa', (done) => {
    credentialStore.hasToken.and.returnValue(true);
    hubTerminalService.contexto.and.returnValue(of(terminalContextoStub));

    service.bootstrap().subscribe(() => {
      const contexto = service.contexto();

      expect(contexto?.terminal.uuid).toBe('terminal-uuid-ficticio');
      expect(contexto?.terminal.codigo).toBe('PDV-01');
      expect(contexto?.terminal.nome).toBe('PDV-01');
      expect(contexto?.terminal.hostname).toBe('PDV-BARRA-01');
      expect(contexto?.terminal.ativo).toBeTrue();
      expect(contexto?.caixa?.codigo).toBe('CX-01');
      expect(contexto?.loja.apelido).toBe('Filial 1');
      expect(contexto?.loja.estado).toBe('RJ');
      expect(contexto?.empresa.nome).toBe('Empresa Teste Ltda');
      done();
    });
  });

  it('contexto carregado com token presente continua valido sem nova requisicao', (done) => {
    credentialStore.hasToken.and.returnValue(true);
    hubTerminalService.contexto.and.returnValue(of(terminalContextoStub));

    service.bootstrap().subscribe(() => {
      hubTerminalService.contexto.calls.reset();

      service.bootstrap().subscribe((valid) => {
        expect(valid).toBeTrue();
        expect(service.status()).toBe('contexto-carregado');
        expect(hubTerminalService.contexto).not.toHaveBeenCalled();
        done();
      });
    });
  });

  it('contexto carregado com token removido deixa de ser valido', (done) => {
    credentialStore.hasToken.and.returnValue(true);
    hubTerminalService.contexto.and.returnValue(of(terminalContextoStub));

    service.bootstrap().subscribe(() => {
      credentialStore.hasToken.and.returnValue(false);

      service.bootstrap().subscribe((valid) => {
        expect(valid).toBeFalse();
        expect(service.contexto()).toBeNull();
        expect(service.status()).toBe('nao-pareado');
        expect(credentialStore.clearToken).toHaveBeenCalled();
        done();
      });
    });
  });

  it('aceita contexto com caixa null', (done) => {
    credentialStore.hasToken.and.returnValue(true);
    hubTerminalService.contexto.and.returnValue(of({ ...terminalContextoStub, caixa: null }));

    service.bootstrap().subscribe((valid) => {
      expect(valid).toBeTrue();
      expect(service.contexto()?.caixa).toBeNull();
      done();
    });
  });

  it('mantem heartbeat ativo a cada 15 segundos apos contexto valido', fakeAsync(() => {
    credentialStore.hasToken.and.returnValue(true);
    hubTerminalService.contexto.and.returnValue(of(terminalContextoStub));
    hubTerminalService.heartbeat.and.returnValue(of({
      status: 'ok',
      terminal_uuid: terminalContextoStub.terminal.uuid,
      servidor_em: '2026-09-28T10:00:00Z',
    }));

    let valid = false;
    service.bootstrap().subscribe((resultado) => {
      valid = resultado;
    });
    tick();

    expect(valid).toBeTrue();
    expect(hubTerminalService.heartbeat).toHaveBeenCalledTimes(1);

    tick(15_000);
    expect(hubTerminalService.heartbeat).toHaveBeenCalledTimes(2);

    tick(15_000);
    expect(hubTerminalService.heartbeat).toHaveBeenCalledTimes(3);

    discardPeriodicTasks();
  }));

  it('nao duplica heartbeat quando bootstrap roda novamente com contexto carregado', fakeAsync(() => {
    credentialStore.hasToken.and.returnValue(true);
    hubTerminalService.contexto.and.returnValue(of(terminalContextoStub));
    hubTerminalService.heartbeat.and.returnValue(of({
      status: 'ok',
      terminal_uuid: terminalContextoStub.terminal.uuid,
      servidor_em: '2026-09-28T10:00:00Z',
    }));

    service.bootstrap().subscribe();
    tick();
    service.bootstrap().subscribe();
    tick(15_000);

    expect(hubTerminalService.contexto).toHaveBeenCalledTimes(1);
    expect(hubTerminalService.heartbeat).toHaveBeenCalledTimes(2);

    discardPeriodicTasks();
  }));

  it('heartbeat com autenticacao invalida limpa sessao e encerra ciclo', fakeAsync(() => {
    credentialStore.hasToken.and.returnValue(true);
    hubTerminalService.contexto.and.returnValue(of(terminalContextoStub));
    hubTerminalService.heartbeat.and.returnValue(
      throwError(() => new HttpErrorResponse({ status: 403 })),
    );

    service.bootstrap().subscribe();
    tick();

    expect(credentialStore.clearToken).toHaveBeenCalled();
    expect(service.status()).toBe('nao-pareado');

    hubTerminalService.heartbeat.calls.reset();
    tick(15_000);
    expect(hubTerminalService.heartbeat).not.toHaveBeenCalled();
  }));
});
