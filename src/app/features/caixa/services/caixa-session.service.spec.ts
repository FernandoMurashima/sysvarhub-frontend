import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { caixaStatusAbertoStub, caixaStatusFechadoStub, sessaoCaixaAbertaStub } from '../../../testing/terminal-test-data';
import { OperatorSessionService } from '../../operador/services/operator-session.service';
import { HubCaixaService } from './hub-caixa.service';
import { CaixaSessionService } from './caixa-session.service';

describe('CaixaSessionService', () => {
  let service: CaixaSessionService;
  let hubCaixaService: jasmine.SpyObj<HubCaixaService>;
  let operatorSession: jasmine.SpyObj<OperatorSessionService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    hubCaixaService = jasmine.createSpyObj<HubCaixaService>('HubCaixaService', ['status', 'abrir', 'fechar']);
    operatorSession = jasmine.createSpyObj<OperatorSessionService>('OperatorSessionService', ['invalidarSessao']);
    router = jasmine.createSpyObj<Router>('Router', ['navigateByUrl']);
    router.navigateByUrl.and.resolveTo(true);

    TestBed.configureTestingModule({
      providers: [
        CaixaSessionService,
        { provide: HubCaixaService, useValue: hubCaixaService },
        { provide: OperatorSessionService, useValue: operatorSession },
        { provide: Router, useValue: router },
      ],
    });
    service = TestBed.inject(CaixaSessionService);
  });

  function carregarEstadoAberto(): void {
    hubCaixaService.status.and.returnValue(of(caixaStatusAbertoStub));
    service.carregarStatus().subscribe();
    expect(service.status()).toBe('aberto');
    hubCaixaService.status.calls.reset();
  }

  it('fechado muda status para fechado', (done) => {
    hubCaixaService.status.and.returnValue(of(caixaStatusFechadoStub));

    service.carregarStatus().subscribe((aberto) => {
      expect(aberto).toBeFalse();
      expect(service.status()).toBe('fechado');
      expect(service.caixa()?.codigo).toBe('CX-BARRA');
      expect(service.sessao()).toBeNull();
      done();
    });
  });

  it('aberto muda status para aberto', (done) => {
    hubCaixaService.status.and.returnValue(of(caixaStatusAbertoStub));

    service.carregarStatus().subscribe((aberto) => {
      expect(aberto).toBeTrue();
      expect(service.status()).toBe('aberto');
      expect(service.sessao()?.valorAbertura).toBe('100.00');
      done();
    });
  });

  it('abrir 201 muda para aberto', (done) => {
    hubCaixaService.abrir.and.returnValue(of(sessaoCaixaAbertaStub));

    service.abrir('100.00').subscribe((resultado) => {
      expect(resultado.ok).toBeTrue();
      expect(service.status()).toBe('aberto');
      done();
    });
  });

  it('abrir 409 com sessao recupera estado aberto', (done) => {
    hubCaixaService.abrir.and.returnValue(throwError(() => new HttpErrorResponse({
      status: 409,
      error: {
        detail: 'Caixa já está aberto.',
        sessao: {
          uuid: 'sessao-caixa-uuid',
          status: 'ABERTO',
          valor_abertura: '100.00',
          aberto_em: '2026-09-13T12:00:00',
          fechado_em: null,
          caixa: { id: 29, codigo: 'CX-BARRA', descricao: 'Caixa Loja Barra', ativo: true },
          terminal_abertura: { uuid: 'terminal', codigo: 'PDV-01', nome: 'PDV 01' },
          operador_abertura: { usuario_id: 90, codigo: 'caixa.barra', nome: 'Juliana Rocha', tipo: 'Caixa', perfil: null },
          terminal_fechamento: null,
          operador_fechamento: null,
        },
      },
    })));

    service.abrir('100.00').subscribe((resultado) => {
      expect(resultado.ok).toBeTrue();
      expect(service.status()).toBe('aberto');
      expect(service.sessao()?.valorAbertura).toBe('100.00');
      expect(router.navigateByUrl).not.toHaveBeenCalled();
      done();
    });
  });

  it('400 nao apaga operador', (done) => {
    hubCaixaService.abrir.and.returnValue(throwError(() => new HttpErrorResponse({
      status: 400,
      error: { detail: 'Valor de abertura inválido.' },
    })));

    service.abrir('10000000000.00').subscribe((resultado) => {
      expect(resultado.ok).toBeFalse();
      expect(resultado.detail).toBe('Valor de abertura inválido.');
      expect(operatorSession.invalidarSessao).not.toHaveBeenCalled();
      expect(router.navigateByUrl).not.toHaveBeenCalled();
      done();
    });
  });

  it('401 em carregarStatus invalida operador, limpa caixa e navega para operador', (done) => {
    carregarEstadoAberto();
    hubCaixaService.status.and.returnValue(throwError(() => new HttpErrorResponse({ status: 401 })));

    service.carregarStatus().subscribe(() => {
      expect(operatorSession.invalidarSessao).toHaveBeenCalled();
      expect(service.status()).toBe('inicializando');
      expect(service.caixa()).toBeNull();
      expect(service.sessao()).toBeNull();
      expect(router.navigateByUrl).toHaveBeenCalledOnceWith('/operador');
      expect(router.navigateByUrl).not.toHaveBeenCalledWith('/pareamento');
      done();
    });
  });

  it('403 em carregarStatus invalida operador, limpa caixa e navega para operador', (done) => {
    carregarEstadoAberto();
    hubCaixaService.status.and.returnValue(throwError(() => new HttpErrorResponse({ status: 403 })));

    service.carregarStatus().subscribe(() => {
      expect(operatorSession.invalidarSessao).toHaveBeenCalled();
      expect(service.status()).toBe('inicializando');
      expect(service.caixa()).toBeNull();
      expect(service.sessao()).toBeNull();
      expect(router.navigateByUrl).toHaveBeenCalledOnceWith('/operador');
      expect(router.navigateByUrl).not.toHaveBeenCalledWith('/pareamento');
      done();
    });
  });

  it('401 em abrir invalida somente operador e navega para operador', (done) => {
    carregarEstadoAberto();
    hubCaixaService.abrir.and.returnValue(throwError(() => new HttpErrorResponse({ status: 401 })));

    service.abrir('100.00').subscribe((resultado) => {
      expect(resultado.ok).toBeFalse();
      expect(operatorSession.invalidarSessao).toHaveBeenCalled();
      expect(service.status()).toBe('inicializando');
      expect(service.caixa()).toBeNull();
      expect(service.sessao()).toBeNull();
      expect(router.navigateByUrl).toHaveBeenCalledOnceWith('/operador');
      expect(router.navigateByUrl).not.toHaveBeenCalledWith('/pareamento');
      done();
    });
  });

  it('403 em abrir invalida somente operador e navega para operador', (done) => {
    carregarEstadoAberto();
    hubCaixaService.abrir.and.returnValue(throwError(() => new HttpErrorResponse({ status: 403 })));

    service.abrir('100.00').subscribe((resultado) => {
      expect(resultado.ok).toBeFalse();
      expect(operatorSession.invalidarSessao).toHaveBeenCalled();
      expect(service.status()).toBe('inicializando');
      expect(service.caixa()).toBeNull();
      expect(service.sessao()).toBeNull();
      expect(router.navigateByUrl).toHaveBeenCalledOnceWith('/operador');
      expect(router.navigateByUrl).not.toHaveBeenCalledWith('/pareamento');
      done();
    });
  });

  it('erro de rede muda para erro', (done) => {
    hubCaixaService.status.and.returnValue(throwError(() => new HttpErrorResponse({ status: 0 })));

    service.carregarStatus().subscribe(() => {
      expect(service.status()).toBe('erro');
      expect(operatorSession.invalidarSessao).not.toHaveBeenCalled();
      expect(router.navigateByUrl).not.toHaveBeenCalled();
      done();
    });
  });

  it('nao usa storage de browser', () => {
    localStorage.clear();
    sessionStorage.clear();
    service.limparEstado();

    expect(localStorage.length).toBe(0);
    expect(sessionStorage.length).toBe(0);
  });
});
