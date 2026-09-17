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

  it('fechar com sucesso muda status para fechado e retorna resultado', (done) => {
    hubCaixaService.fechar.and.returnValue(of({
      status: 'ok',
      sessao: { ...sessaoCaixaAbertaStub, status: 'FECHADO', valorEsperadoFechamento: '249.90', valorContadoFechamento: '249.90', diferencaFechamento: '0.00', situacaoFechamento: 'OK' },
      fechamento: { valorEsperado: '249.90', valorContado: '249.90', diferenca: '0.00', situacao: 'OK', resumo: {
        sessao: sessaoCaixaAbertaStub,
        vendas: { quantidade: 0, total: '0.00', valorRecebido: '0.00', troco: '0.00' },
        pagamentos: { formas: [], dinheiroBruto: '0.00', troco: '0.00', dinheiroLiquido: '0.00' },
        movimentacoes: { despesas: { quantidade: 0, total: '0.00' }, sangrias: { quantidade: 0, total: '0.00' }, suprimentos: { quantidade: 0, total: '0.00' }, itens: [] },
        dinheiro: { valorAbertura: '100.00', vendasDinheiroBruto: '0.00', troco: '0.00', vendasDinheiroLiquido: '0.00', suprimentos: '0.00', sangrias: '0.00', despesas: '0.00', esperado: '100.00' },
      } },
    }));

    service.fechar('249.90', '').subscribe((resultado) => {
      expect(resultado.ok).toBeTrue();
      expect(resultado.fechamento?.situacao).toBe('OK');
      expect(service.status()).toBe('fechado');
      expect(service.sessao()?.status).toBe('FECHADO');
      done();
    });
  });

  it('fechar envia valor contado e observacao ao Hub local', (done) => {
    hubCaixaService.fechar.and.returnValue(of({
      status: 'ok',
      sessao: { ...sessaoCaixaAbertaStub, status: 'FECHADO' },
      fechamento: { valorEsperado: '100.00', valorContado: '110.00', diferenca: '10.00', situacao: 'SOBRA', resumo: {
        sessao: sessaoCaixaAbertaStub,
        vendas: { quantidade: 0, total: '0.00', valorRecebido: '0.00', troco: '0.00' },
        pagamentos: { formas: [], dinheiroBruto: '0.00', troco: '0.00', dinheiroLiquido: '0.00' },
        movimentacoes: { despesas: { quantidade: 0, total: '0.00' }, sangrias: { quantidade: 0, total: '0.00' }, suprimentos: { quantidade: 0, total: '0.00' }, itens: [] },
        dinheiro: { valorAbertura: '100.00', vendasDinheiroBruto: '0.00', troco: '0.00', vendasDinheiroLiquido: '0.00', suprimentos: '0.00', sangrias: '0.00', despesas: '0.00', esperado: '100.00' },
      } },
    }));

    service.fechar('110.00', 'Sobra conferida').subscribe(() => {
      expect(hubCaixaService.fechar).toHaveBeenCalledOnceWith('110.00', 'Sobra conferida');
      done();
    });
  });

  it('409 em fechar retorna detail e nao transforma em sucesso', (done) => {
    hubCaixaService.fechar.and.returnValue(throwError(() => new HttpErrorResponse({
      status: 409,
      error: { detail: 'Existe venda em andamento neste caixa.' },
    })));

    service.fechar('100.00').subscribe((resultado) => {
      expect(resultado.ok).toBeFalse();
      expect(resultado.detail).toBe('Existe venda em andamento neste caixa.');
      expect(service.status()).toBe('inicializando');
      done();
    });
  });

  it('status 0 em fechar retorna falha do Hub local', (done) => {
    hubCaixaService.fechar.and.returnValue(throwError(() => new HttpErrorResponse({ status: 0 })));

    service.fechar('100.00').subscribe((resultado) => {
      expect(resultado.ok).toBeFalse();
      expect(resultado.detail).toBe('Falha de comunicação com o Hub local.');
      expect(operatorSession.invalidarSessao).not.toHaveBeenCalled();
      done();
    });
  });

  it('401 em fechar invalida somente operador e navega para operador', (done) => {
    carregarEstadoAberto();
    hubCaixaService.fechar.and.returnValue(throwError(() => new HttpErrorResponse({ status: 401 })));

    service.fechar('100.00').subscribe((resultado) => {
      expect(resultado.ok).toBeFalse();
      expect(operatorSession.invalidarSessao).toHaveBeenCalled();
      expect(service.status()).toBe('inicializando');
      expect(router.navigateByUrl).toHaveBeenCalledOnceWith('/operador');
      expect(router.navigateByUrl).not.toHaveBeenCalledWith('/pareamento');
      done();
    });
  });

  it('403 em fechar invalida somente operador e navega para operador', (done) => {
    carregarEstadoAberto();
    hubCaixaService.fechar.and.returnValue(throwError(() => new HttpErrorResponse({ status: 403 })));

    service.fechar('100.00').subscribe((resultado) => {
      expect(resultado.ok).toBeFalse();
      expect(operatorSession.invalidarSessao).toHaveBeenCalled();
      expect(service.status()).toBe('inicializando');
      expect(router.navigateByUrl).toHaveBeenCalledOnceWith('/operador');
      expect(router.navigateByUrl).not.toHaveBeenCalledWith('/pareamento');
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
