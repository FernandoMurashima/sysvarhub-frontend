import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
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

      expect(contexto?.terminal.codigo).toBe('PDV-01');
      expect(contexto?.caixa.codigo).toBe('CX-01');
      expect(contexto?.loja.nome_loja).toBe('Filial 1');
      expect(contexto?.empresa.razao_social).toBe('Empresa Teste Ltda');
      done();
    });
  });
});
