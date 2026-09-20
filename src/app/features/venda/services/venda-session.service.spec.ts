import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { FormasPagamentoResponse } from '../../../core/models/pagamento.models';
import { VendaAtualResponse } from '../../../core/models/venda.models';
import { vendedorStub, vendaAbertaStub, vendaAtualComClientePreselecionadoStub, vendaAtualComVendedorPreselecionadoStub, vendaAtualSemVendaStub } from '../../../testing/terminal-test-data';
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
      'iniciarVenda',
      'adicionarItem',
      'alterarQuantidade',
      'removerItem',
      'cancelar',
      'listarFormasPagamento',
      'selecionarCliente',
      'removerCliente',
      'selecionarVendedor',
      'removerVendedor',
      'finalizarVenda',
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
      expect(service.clientePreselecionado()).toBeNull();
      done();
    });
  });

  it('bootstrap sem venda com cliente preselecionado mantem status sem-venda', (done) => {
    hubVendaService.atual.and.returnValue(of(vendaAtualComClientePreselecionadoStub));

    service.bootstrap().subscribe(() => {
      expect(service.status()).toBe('sem-venda');
      expect(service.venda()).toBeNull();
      expect(service.clientePreselecionado()?.clienteUuid).toBe('cliente-uuid');
      done();
    });
  });

  it('venda aberta vira aberta e adicionar atualiza venda', (done) => {
    hubVendaService.adicionarItem.and.returnValue(of(vendaAbertaStub));

    service.adicionarItem(10825).subscribe((resultado) => {
      expect(resultado.ok).toBeTrue();
      expect(service.status()).toBe('aberta');
      expect(service.venda()?.itens[0].descricao).toBe('Calça Jeans Reta Aurora');
      expect(service.clientePreselecionado()).toBeNull();
      done();
    });
  });

  it('iniciar venda com 201 define venda aberta e limpa pre-selecao', (done) => {
    hubVendaService.atual.and.returnValue(of(vendaAtualComClientePreselecionadoStub));
    hubVendaService.iniciarVenda.and.returnValue(of({
      venda: { ...vendaAbertaStub.venda!, cliente: vendaAtualComClientePreselecionadoStub.clientePreselecionado },
      clientePreselecionado: null,
      vendedorPreselecionado: null,
    }));

    service.bootstrap().subscribe(() => {
      service.iniciarVenda().subscribe((resultado) => {
        expect(resultado.ok).toBeTrue();
        expect(service.status()).toBe('aberta');
        expect(service.venda()?.cliente?.clienteUuid).toBe('cliente-uuid');
        expect(service.clientePreselecionado()).toBeNull();
        done();
      });
    });
  });

  it('iniciar venda com 200 tem mesmo comportamento de sucesso', (done) => {
    hubVendaService.iniciarVenda.and.returnValue(of(vendaAbertaStub));

    service.iniciarVenda().subscribe((resultado) => {
      expect(resultado.ok).toBeTrue();
      expect(service.status()).toBe('aberta');
      expect(service.venda()).toEqual(vendaAbertaStub.venda);
      expect(service.clientePreselecionado()).toBeNull();
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

  it('finalizar venda retorna venda finalizada com fiscal e limpa estado atual', (done) => {
    const vendaFinalizada = {
      ...vendaAbertaStub.venda!,
      status: 'FINALIZADA' as const,
      totalPago: '199.90',
      pendente: '0.00',
      fiscal: {
        emiteNfce: true,
        nfceUuid: 'nfce-uuid',
        status: 'AUTORIZADA' as const,
        numero: 123,
        serie: 1,
        chaveAcesso: '35260900000000000123650010000001231000001234',
        protocoloAutorizacao: '135260000000001',
        motivo: 'Autorizado o uso da NF-e',
      },
    };
    hubVendaService.adicionarItem.and.returnValue(of(vendaAbertaStub));
    hubVendaService.finalizarVenda.and.returnValue(of({ venda: vendaFinalizada, clientePreselecionado: null, vendedorPreselecionado: null }));

    service.adicionarItem(10825).subscribe(() => {
      service.finalizarVenda('venda-hub-uuid').subscribe((resultado) => {
        expect(resultado.ok).toBeTrue();
        expect(resultado.vendaFinalizada?.fiscal.nfceUuid).toBe('nfce-uuid');
        expect(service.venda()).toBeNull();
        expect(service.status()).toBe('sem-venda');
        done();
      });
    });
  });

  it('selecionar, trocar e remover cliente atualizam venda pela resposta do backend', (done) => {
    const vendaComCliente: VendaAtualResponse = {
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
      clientePreselecionado: null,
      vendedorPreselecionado: null,
    };
    const vendaComOutroCliente: VendaAtualResponse = {
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
      clientePreselecionado: null,
      vendedorPreselecionado: null,
    };
    hubVendaService.selecionarCliente.and.returnValues(of(vendaComCliente), of(vendaComOutroCliente));
    hubVendaService.removerCliente.and.returnValue(of({ venda: { ...vendaAbertaStub.venda!, cliente: null }, clientePreselecionado: null, vendedorPreselecionado: null }));

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

  it('selecionar cliente pre-venda faz refresh canonico sem abrir venda', (done) => {
    hubVendaService.selecionarCliente.and.returnValue(of(vendaAtualSemVendaStub));
    hubVendaService.atual.and.returnValue(of(vendaAtualComClientePreselecionadoStub));

    service.selecionarCliente('cliente-uuid').subscribe((resultado) => {
      expect(resultado.ok).toBeTrue();
      expect(hubVendaService.atual).toHaveBeenCalledTimes(1);
      expect(service.status()).toBe('sem-venda');
      expect(service.venda()).toBeNull();
      expect(service.clientePreselecionado()?.clienteUuid).toBe('cliente-uuid');
      done();
    });
  });

  it('trocar cliente pre-venda substitui pre-selecao pelo estado canonico', (done) => {
    const outroCliente = {
      venda: null,
      clientePreselecionado: {
        clienteUuid: 'outro-cliente',
        retaguardaId: null,
        tipoPessoa: 'PF' as const,
        documento: null,
        clientePadrao: false,
        nomeCliente: 'Cliente Local',
      },
      vendedorPreselecionado: null,
    };
    hubVendaService.selecionarCliente.and.returnValues(of(vendaAtualSemVendaStub), of(vendaAtualSemVendaStub));
    hubVendaService.atual.and.returnValues(of(vendaAtualComClientePreselecionadoStub), of(outroCliente));

    service.selecionarCliente('cliente-uuid').subscribe(() => {
      service.selecionarCliente('outro-cliente').subscribe(() => {
        expect(service.status()).toBe('sem-venda');
        expect(service.venda()).toBeNull();
        expect(service.clientePreselecionado()?.clienteUuid).toBe('outro-cliente');
        done();
      });
    });
  });

  it('remover cliente pre-venda limpa pre-selecao pelo GET canonico', (done) => {
    hubVendaService.atual.and.returnValues(of(vendaAtualComClientePreselecionadoStub), of(vendaAtualSemVendaStub));
    hubVendaService.removerCliente.and.returnValue(of(vendaAtualSemVendaStub));

    service.bootstrap().subscribe(() => {
      service.removerCliente().subscribe((resultado) => {
        expect(resultado.ok).toBeTrue();
        expect(service.status()).toBe('sem-venda');
        expect(service.venda()).toBeNull();
        expect(service.clientePreselecionado()).toBeNull();
        done();
      });
    });
  });

  it('iniciar venda transforma estado para venda aberta e limpa pre-selecao', (done) => {
    hubVendaService.atual.and.returnValue(of(vendaAtualComClientePreselecionadoStub));
    hubVendaService.iniciarVenda.and.returnValue(of({
      venda: { ...vendaAbertaStub.venda!, cliente: vendaAtualComClientePreselecionadoStub.clientePreselecionado },
      clientePreselecionado: null,
      vendedorPreselecionado: null,
    }));

    service.bootstrap().subscribe(() => {
      service.iniciarVenda().subscribe((resultado) => {
        expect(resultado.ok).toBeTrue();
        expect(service.status()).toBe('aberta');
        expect(service.venda()?.cliente?.clienteUuid).toBe('cliente-uuid');
        expect(service.clientePreselecionado()).toBeNull();
        done();
      });
    });
  });

  it('Ctrl+F5 bootstrap restaura pre-selecao do Hub sem storage', (done) => {
    localStorage.clear();
    sessionStorage.clear();
    hubVendaService.atual.and.returnValue(of(vendaAtualComClientePreselecionadoStub));

    service.bootstrap().subscribe(() => {
      expect(service.venda()).toBeNull();
      expect(service.clientePreselecionado()?.nomeCliente).toBe('Maria Silva');
      expect(localStorage.length).toBe(0);
      expect(sessionStorage.length).toBe(0);
      done();
    });
  });

  it('bootstrap sem venda recupera vendedor preselecionado', (done) => {
    hubVendaService.atual.and.returnValue(of(vendaAtualComVendedorPreselecionadoStub));

    service.bootstrap().subscribe(() => {
      expect(service.vendedorPreselecionado()?.id).toBe(501);
      expect(service.venda()).toBeNull();
      done();
    });
  });

  it('selecionar vendedor pre-venda nao cria venda no estado', (done) => {
    hubVendaService.selecionarVendedor.and.returnValue(of(vendaAtualSemVendaStub));
    hubVendaService.atual.and.returnValue(of(vendaAtualComVendedorPreselecionadoStub));

    service.selecionarVendedor(501).subscribe((resultado) => {
      expect(resultado.ok).toBeTrue();
      expect(service.venda()).toBeNull();
      expect(service.vendedorPreselecionado()?.id).toBe(501);
      done();
    });
  });

  it('selecionar vendedor em venda mantem uuid', (done) => {
    const vendaComVendedor = { venda: { ...vendaAbertaStub.venda!, vendedor: vendedorStub }, clientePreselecionado: null, vendedorPreselecionado: null };
    hubVendaService.selecionarVendedor.and.returnValue(of(vendaComVendedor));

    service.selecionarVendedor(501).subscribe((resultado) => {
      expect(resultado.ok).toBeTrue();
      expect(service.venda()?.uuid).toBe(vendaAbertaStub.venda?.uuid);
      expect(service.venda()?.vendedor?.id).toBe(501);
      done();
    });
  });

  it('remover vendedor limpa somente vendedor', (done) => {
    const vendaComClienteVendedor = {
      venda: {
        ...vendaAbertaStub.venda!,
        cliente: vendaAtualComClientePreselecionadoStub.clientePreselecionado,
        vendedor: vendedorStub,
      },
      clientePreselecionado: null,
      vendedorPreselecionado: null,
    };
    hubVendaService.atual.and.returnValue(of(vendaComClienteVendedor));
    hubVendaService.removerVendedor.and.returnValue(of({
      venda: { ...vendaComClienteVendedor.venda, vendedor: null },
      clientePreselecionado: null,
      vendedorPreselecionado: null,
    }));

    service.bootstrap().subscribe(() => {
      service.removerVendedor().subscribe((resultado) => {
        expect(resultado.ok).toBeTrue();
        expect(service.venda()?.cliente?.clienteUuid).toBe('cliente-uuid');
        expect(service.venda()?.vendedor).toBeNull();
        done();
      });
    });
  });

  it('falha incerta de vendedor reconcilia com GET sem repetir PUT', (done) => {
    hubVendaService.selecionarVendedor.and.returnValue(throwError(() => new HttpErrorResponse({ status: 0 })));
    hubVendaService.atual.and.returnValue(of({ venda: { ...vendaAbertaStub.venda!, vendedor: vendedorStub }, clientePreselecionado: null, vendedorPreselecionado: null }));

    service.selecionarVendedor(501).subscribe((resultado) => {
      expect(resultado.ok).toBeTrue();
      expect(hubVendaService.selecionarVendedor).toHaveBeenCalledTimes(1);
      expect(hubVendaService.atual).toHaveBeenCalledTimes(1);
      done();
    });
  });

  it('falha incerta de vendedor sem confirmacao informa falha', (done) => {
    hubVendaService.selecionarVendedor.and.returnValue(throwError(() => new HttpErrorResponse({ status: 0 })));
    hubVendaService.atual.and.returnValue(of(vendaAtualSemVendaStub));

    service.selecionarVendedor(501).subscribe((resultado) => {
      expect(resultado.ok).toBeFalse();
      expect(resultado.detail).toBe('Não foi possível confirmar a alteração do vendedor.');
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

  it('erro de rede ao iniciar nao repete POST e reconcilia com GET', (done) => {
    hubVendaService.iniciarVenda.and.returnValue(throwError(() => new HttpErrorResponse({ status: 0 })));
    hubVendaService.atual.and.returnValue(of(vendaAbertaStub));

    service.iniciarVenda().subscribe((resultado) => {
      expect(resultado.ok).toBeTrue();
      expect(hubVendaService.iniciarVenda).toHaveBeenCalledTimes(1);
      expect(hubVendaService.atual).toHaveBeenCalledTimes(1);
      expect(service.status()).toBe('aberta');
      expect(service.venda()).toEqual(vendaAbertaStub.venda);
      done();
    });
  });

  it('erro de rede ao iniciar com GET sem venda mantem sem-venda', (done) => {
    hubVendaService.iniciarVenda.and.returnValue(throwError(() => new HttpErrorResponse({ status: 0 })));
    hubVendaService.atual.and.returnValue(of(vendaAtualSemVendaStub));

    service.iniciarVenda().subscribe((resultado) => {
      expect(resultado.ok).toBeFalse();
      expect(resultado.detail).toBe('Não foi possível confirmar o início da venda. Tente novamente.');
      expect(service.status()).toBe('sem-venda');
      expect(service.venda()).toBeNull();
      done();
    });
  });

  it('erro de rede ao iniciar com GET falhando informa comunicacao sem inventar venda', (done) => {
    hubVendaService.iniciarVenda.and.returnValue(throwError(() => new HttpErrorResponse({ status: 0 })));
    hubVendaService.atual.and.returnValue(throwError(() => new HttpErrorResponse({ status: 0 })));

    service.iniciarVenda().subscribe((resultado) => {
      expect(resultado.ok).toBeFalse();
      expect(resultado.detail).toBe('Falha de comunicação com o Hub local.');
      expect(service.venda()).toBeNull();
      done();
    });
  });

  [401, 403].forEach((status) => {
    it(`erro de rede ao iniciar com GET ${status} invalida operador sem desparear terminal`, (done) => {
      hubVendaService.iniciarVenda.and.returnValue(throwError(() => new HttpErrorResponse({ status: 0 })));
      hubVendaService.atual.and.returnValue(throwError(() => new HttpErrorResponse({ status })));

      service.iniciarVenda().subscribe((resultado) => {
        expect(resultado.ok).toBeFalse();
        expect(resultado.detail).toBe('Sessão de operador expirada.');
        expect(operatorSession.invalidarSessao).toHaveBeenCalled();
        expect(router.navigateByUrl).toHaveBeenCalledOnceWith('/operador');
        expect(router.navigateByUrl).not.toHaveBeenCalledWith('/pareamento');
        expect(hubVendaService.iniciarVenda).toHaveBeenCalledTimes(1);
        expect(hubVendaService.atual).toHaveBeenCalledTimes(1);
        done();
      });
    });
  });

  it('401 ao iniciar invalida somente operador e navega operador', (done) => {
    hubVendaService.iniciarVenda.and.returnValue(throwError(() => new HttpErrorResponse({ status: 401 })));

    service.iniciarVenda().subscribe((resultado) => {
      expect(resultado.ok).toBeFalse();
      expect(operatorSession.invalidarSessao).toHaveBeenCalled();
      expect(router.navigateByUrl).toHaveBeenCalledOnceWith('/operador');
      expect(router.navigateByUrl).not.toHaveBeenCalledWith('/pareamento');
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
