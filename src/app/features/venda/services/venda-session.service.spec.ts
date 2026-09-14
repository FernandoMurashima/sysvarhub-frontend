import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { FormasPagamentoResponse } from '../../../core/models/pagamento.models';
import { vendaAbertaStub, vendaAtualSemVendaStub } from '../../../testing/terminal-test-data';
import { OperatorSessionService } from '../../operador/services/operator-session.service';
import { HubVendaService } from './hub-venda.service';
import { VendaSessionService } from './venda-session.service';

describe('VendaSessionService', () => {
  let service: VendaSessionService;
  let hubVendaService: jasmine.SpyObj<HubVendaService>;
  let operatorSession: jasmine.SpyObj<OperatorSessionService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    hubVendaService = jasmine.createSpyObj<HubVendaService>('HubVendaService', [
      'atual',
      'adicionarItem',
      'alterarQuantidade',
      'removerItem',
      'cancelar',
      'listarFormasPagamento',
      'selecionarCliente',
      'removerCliente',
    ]);
    operatorSession = jasmine.createSpyObj<OperatorSessionService>('OperatorSessionService', ['invalidarSessao']);
    router = jasmine.createSpyObj<Router>('Router', ['navigateByUrl']);
    router.navigateByUrl.and.resolveTo(true);

    TestBed.configureTestingModule({
      providers: [
        VendaSessionService,
        { provide: HubVendaService, useValue: hubVendaService },
        { provide: OperatorSessionService, useValue: operatorSession },
        { provide: Router, useValue: router },
      ],
    });
    service = TestBed.inject(VendaSessionService);
  });

  it('venda null vira sem-venda', (done) => {
    hubVendaService.atual.and.returnValue(of(vendaAtualSemVendaStub));

    service.carregarAtual().subscribe(() => {
      expect(service.status()).toBe('sem-venda');
      expect(service.venda()).toBeNull();
      done();
    });
  });

  it('venda aberta vira aberta e adicionar atualiza venda', (done) => {
    hubVendaService.adicionarItem.and.returnValue(of(vendaAbertaStub));

    service.adicionarItem(10825).subscribe((resultado) => {
      expect(resultado.ok).toBeTrue();
      expect(service.status()).toBe('aberta');
      expect(service.venda()?.itens[0].descricao).toBe('Calça Jeans Reta Aurora');
      done();
    });
  });

  it('cancelar limpa venda', (done) => {
    hubVendaService.cancelar.and.returnValue(of(vendaAbertaStub));

    service.cancelarVenda().subscribe((resultado) => {
      expect(resultado.ok).toBeTrue();
      expect(service.status()).toBe('sem-venda');
      expect(service.venda()).toBeNull();
      done();
    });
  });

  it('selecionar, trocar e remover cliente atualizam venda pela resposta do backend', (done) => {
    const vendaComCliente = {
      venda: {
        ...vendaAbertaStub.venda!,
        cliente: {
          clienteUuid: 'cliente-uuid',
          retaguardaId: 123,
          tipoPessoa: 'PF' as const,
          documento: '12345678901',
          clientePadrao: false,
          nomeCliente: 'Cliente Teste',
        },
      },
    };
    const vendaComOutroCliente = {
      venda: {
        ...vendaAbertaStub.venda!,
        cliente: {
          clienteUuid: 'outro-cliente',
          retaguardaId: null,
          tipoPessoa: 'PF' as const,
          documento: null,
          clientePadrao: false,
          nomeCliente: 'Cliente Local',
        },
      },
    };
    hubVendaService.selecionarCliente.and.returnValues(of(vendaComCliente), of(vendaComOutroCliente));
    hubVendaService.removerCliente.and.returnValue(of({ venda: { ...vendaAbertaStub.venda!, cliente: null } }));

    service.selecionarCliente('cliente-uuid').subscribe((primeiro) => {
      expect(primeiro.ok).toBeTrue();
      expect(service.venda()?.cliente?.clienteUuid).toBe('cliente-uuid');
      service.selecionarCliente('outro-cliente').subscribe((segundo) => {
        expect(segundo.ok).toBeTrue();
        expect(service.venda()?.cliente?.clienteUuid).toBe('outro-cliente');
        service.removerCliente().subscribe((terceiro) => {
          expect(terceiro.ok).toBeTrue();
          expect(service.venda()?.cliente).toBeNull();
          done();
        });
      });
    });
  });

  it('cliente pode criar venda vazia e deixa sessao ativa', (done) => {
    hubVendaService.selecionarCliente.and.returnValue(of({ venda: { ...vendaAbertaStub.venda!, itens: [] } }));

    service.selecionarCliente('cliente-uuid').subscribe((resultado) => {
      expect(resultado.ok).toBeTrue();
      expect(service.status()).toBe('aberta');
      expect(service.venda()?.itens).toEqual([]);
      done();
    });
  });

  it('400 e 409 de cliente usam detail do backend', (done) => {
    hubVendaService.selecionarCliente.and.returnValues(
      throwError(() => new HttpErrorResponse({ status: 400, error: { detail: 'Cliente inválido.' } })),
      throwError(() => new HttpErrorResponse({ status: 409, error: { detail: 'Cliente bloqueado.' } })),
    );

    service.selecionarCliente('cliente').subscribe((primeiro) => {
      expect(primeiro.detail).toBe('Cliente inválido.');
      service.selecionarCliente('cliente').subscribe((segundo) => {
        expect(segundo.detail).toBe('Cliente bloqueado.');
        done();
      });
    });
  });

  it('401 de cliente invalida operador e navega operador', (done) => {
    hubVendaService.selecionarCliente.and.returnValue(throwError(() => new HttpErrorResponse({ status: 401 })));

    service.selecionarCliente('cliente').subscribe((resultado) => {
      expect(resultado.ok).toBeFalse();
      expect(operatorSession.invalidarSessao).toHaveBeenCalled();
      expect(router.navigateByUrl).toHaveBeenCalledWith('/operador');
      done();
    });
  });

  it('falha de rede em cliente reconcilia com GET uma vez sem repetir escrita', (done) => {
    hubVendaService.selecionarCliente.and.returnValue(throwError(() => new HttpErrorResponse({ status: 0 })));
    hubVendaService.atual.and.returnValue(of(vendaAbertaStub));

    service.selecionarCliente('cliente').subscribe((resultado) => {
      expect(resultado.detail).toBe('Não foi possível confirmar a alteração do cliente. O estado da venda foi atualizado.');
      expect(hubVendaService.selecionarCliente).toHaveBeenCalledTimes(1);
      expect(hubVendaService.atual).toHaveBeenCalledTimes(1);
      done();
    });
  });

  it('401 invalida operador e navega operador sem pareamento', (done) => {
    hubVendaService.atual.and.returnValue(throwError(() => new HttpErrorResponse({ status: 401 })));

    service.carregarAtual().subscribe(() => {
      expect(operatorSession.invalidarSessao).toHaveBeenCalled();
      expect(router.navigateByUrl).toHaveBeenCalledOnceWith('/operador');
      expect(router.navigateByUrl).not.toHaveBeenCalledWith('/pareamento');
      done();
    });
  });

  it('409 saldo preserva venda anterior', (done) => {
    hubVendaService.adicionarItem.and.returnValues(
      of(vendaAbertaStub),
      throwError(() => new HttpErrorResponse({
        status: 409,
        error: { detail: 'Saldo disponível insuficiente.', estoque_disponivel: '1.000' },
      })),
    );

    service.adicionarItem(10825).subscribe(() => {
      service.adicionarItem(10825).subscribe((resultado) => {
        expect(resultado.ok).toBeFalse();
        expect(resultado.estoqueDisponivel).toBe('1.000');
        expect(service.venda()).toEqual(vendaAbertaStub.venda);
        done();
      });
    });
  });

  it('erro de rede preserva venda e tenta recuperar com GET', (done) => {
    hubVendaService.adicionarItem.and.returnValues(of(vendaAbertaStub), throwError(() => new HttpErrorResponse({ status: 0 })));
    hubVendaService.atual.and.returnValue(of(vendaAbertaStub));

    service.adicionarItem(10825).subscribe(() => {
      service.adicionarItem(10825).subscribe((resultado) => {
        expect(resultado.ok).toBeFalse();
        expect(hubVendaService.atual).toHaveBeenCalled();
        expect(service.venda()).toEqual(vendaAbertaStub.venda);
        done();
      });
    });
  });

  it('listarFormasPagamento retorna formas com sucesso', (done) => {
    const formas: FormasPagamentoResponse = {
      versao: 1,
      sincronizadoEm: '2026-09-14T12:00:00Z',
      formas: [
        {
          id: 1,
          retaguardaId: 10,
          codigo: 'DIN',
          descricao: 'Dinheiro',
          tipo: 'DINHEIRO',
          tefHabilitado: false,
          numParcelas: 1,
          parcelas: [],
        },
      ],
    };
    hubVendaService.listarFormasPagamento.and.returnValue(of(formas));

    service.listarFormasPagamento().subscribe((resultado) => {
      expect(resultado).toEqual(formas);
      expect(operatorSession.invalidarSessao).not.toHaveBeenCalled();
      expect(router.navigateByUrl).not.toHaveBeenCalled();
      done();
    });
  });

  it('listarFormasPagamento com 401 invalida operador, limpa estado e navega operador sem desparear terminal', (done) => {
    hubVendaService.adicionarItem.and.returnValue(of(vendaAbertaStub));
    hubVendaService.listarFormasPagamento.and.returnValue(throwError(() => new HttpErrorResponse({ status: 401 })));

    service.adicionarItem(10825).subscribe(() => {
      service.listarFormasPagamento().subscribe({
        error: () => {
          expect(operatorSession.invalidarSessao).toHaveBeenCalled();
          expect(service.status()).toBe('sem-venda');
          expect(service.venda()).toBeNull();
          expect(router.navigateByUrl).toHaveBeenCalledOnceWith('/operador');
          expect(router.navigateByUrl).not.toHaveBeenCalledWith('/pareamento');
          done();
        },
      });
    });
  });

  it('listarFormasPagamento com 403 invalida operador, limpa estado e navega operador sem desparear terminal', (done) => {
    hubVendaService.adicionarItem.and.returnValue(of(vendaAbertaStub));
    hubVendaService.listarFormasPagamento.and.returnValue(throwError(() => new HttpErrorResponse({ status: 403 })));

    service.adicionarItem(10825).subscribe(() => {
      service.listarFormasPagamento().subscribe({
        error: () => {
          expect(operatorSession.invalidarSessao).toHaveBeenCalled();
          expect(service.status()).toBe('sem-venda');
          expect(service.venda()).toBeNull();
          expect(router.navigateByUrl).toHaveBeenCalledOnceWith('/operador');
          expect(router.navigateByUrl).not.toHaveBeenCalledWith('/pareamento');
          done();
        },
      });
    });
  });

  it('listarFormasPagamento propaga erro nao-auth sem invalidar operador', (done) => {
    const erro = new HttpErrorResponse({ status: 500 });
    hubVendaService.listarFormasPagamento.and.returnValue(throwError(() => erro));

    service.listarFormasPagamento().subscribe({
      error: (resultado) => {
        expect(resultado).toBe(erro);
        expect(operatorSession.invalidarSessao).not.toHaveBeenCalled();
        expect(router.navigateByUrl).not.toHaveBeenCalled();
        done();
      },
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
