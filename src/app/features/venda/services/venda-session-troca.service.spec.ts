import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';

import { VendaAtualResponse, VendaDevolucaoConsulta, VendaDevolucaoResultado } from '../../../core/models/venda.models';
import { clientePreselecionadoStub, vendedorStub, vendaAbertaStub, vendaAtualSemVendaStub } from '../../../testing/terminal-test-data';
import { OperatorSessionService } from '../../operador/services/operator-session.service';
import { HubVendaService } from './hub-venda.service';
import { VendaSessionService } from './venda-session.service';

const documentoTecnico = 'VT-HUB-0123456789abcdef0123';

function origemStub(): VendaDevolucaoConsulta {
  return { uuid: 'venda-original', documento: 'VE0110000001', total: '100.00',
    cliente: { id: 123, uuid: 'cliente-uuid', nome: 'Maria Silva' }, itens: [] };
}

function devolucaoStub(): VendaDevolucaoResultado {
  return { uuid: 'devolucao-uuid', venda_uuid: 'venda-original', documento: 'DEV01100001',
    valor_total: '100.00', finalizada_em: '2026-10-14', venda_troca_uuid: null,
    vale_troca: { documento: '', documento_tecnico: documentoTecnico, saldo: '100.00', provisorio: true, valor_consumido: '0.00' } };
}

function vendaTroca(total = '95.00', credito?: string): VendaAtualResponse {
  const valor = Number(credito || 0);
  return { ...vendaAtualSemVendaStub, venda: { ...vendaAbertaStub.venda!, uuid: 'nova-venda',
    cliente: clientePreselecionadoStub, vendedor: vendedorStub, subtotal: total, total,
    totalPago: valor.toFixed(2), pendente: (Number(total) - valor).toFixed(2), troco: '0.00',
    pagamentos: credito ? [{ uuid: 'pagamento-troca', formaPagamentoId: null, formaRetaguardaId: null, codigo: 'VT',
      descricao: 'Vale-Troca', tipo: 'VALE_TROCA', numParcelas: 1, valor: credito, autorizacao: documentoTecnico,
      valeTrocaDocumento: documentoTecnico, devolucaoUuid: 'devolucao-uuid', origemCaptura: 'MANUAL', criadoEm: '2026-10-14' }] : [] } };
}

describe('VendaSessionService credito desta troca', () => {
  let service: VendaSessionService;
  let hub: jasmine.SpyObj<HubVendaService>;

  beforeEach(() => {
    hub = jasmine.createSpyObj<HubVendaService>('HubVendaService', [
      'atual', 'iniciarVenda', 'cancelar', 'finalizarVenda', 'adicionarPagamentoValeTroca', 'adicionarPagamento',
    ]);
    hub.atual.and.returnValue(of(vendaAtualSemVendaStub));
    TestBed.configureTestingModule({ providers: [
      VendaSessionService, { provide: HubVendaService, useValue: hub },
      { provide: OperatorSessionService, useValue: jasmine.createSpyObj('OperatorSessionService', ['invalidarSessao']) },
      { provide: Router, useValue: jasmine.createSpyObj('Router', ['navigateByUrl']) },
    ] });
    service = TestBed.inject(VendaSessionService);
  });

  function preparar(total = '95.00'): void {
    service.prepararTroca(devolucaoStub(), origemStub()).subscribe((r) => expect(r.ok).toBeTrue());
    hub.iniciarVenda.and.returnValue(of(vendaTroca(total)));
    service.iniciarVenda().subscribe();
  }

  it('transfere apenas o contexto do Hub sem iniciar cancelar ou consumir venda', () => {
    service.prepararTroca(devolucaoStub(), origemStub()).subscribe();
    expect(service.troca()?.documentoTecnico).toBe(documentoTecnico);
    expect(service.troca()?.credito).toBe('100.00');
    expect(service.troca()?.cliente).toEqual(origemStub().cliente);
    expect(service.troca()?.vendaUuid).toBeNull();
    expect(hub.iniciarVenda).not.toHaveBeenCalled();
    expect(hub.cancelar).not.toHaveBeenCalled();
    service.adicionarCreditoTroca('95.00').subscribe((r) => expect(r.ok).toBeFalse());
    expect(hub.adicionarPagamentoValeTroca).not.toHaveBeenCalled();
  });

  it('preserva venda preexistente e exige nova venda iniciada pelo operador', () => {
    hub.atual.and.returnValue(of({ ...vendaTroca(), venda: { ...vendaTroca().venda!, uuid: 'anterior' } }));
    service.prepararTroca(devolucaoStub(), origemStub()).subscribe();
    service.bootstrap().subscribe();
    expect(service.venda()?.uuid).toBe('anterior');
    expect(service.troca()?.vendaUuid).toBeNull();
    expect(service.erroCreditoTroca()).toContain('venda anterior');
    hub.cancelar.and.returnValue(of(vendaAtualSemVendaStub));
    service.cancelarVenda().subscribe();
    expect(service.troca()).not.toBeNull();
    hub.iniciarVenda.and.returnValue(of(vendaTroca()));
    service.iniciarVenda().subscribe();
    expect(service.troca()?.vendaUuid).toBe('nova-venda');
    expect(service.erroCreditoTroca()).toBe('');
  });

  for (const [total, credito, pendente] of [['95.00', '95.00', '0.00'], ['100.00', '100.00', '0.00'], ['105.00', '100.00', '5.00']]) {
    it(`devolucao 100 e venda ${total} sugere ${credito} sem troco e atualiza o pendente ${pendente}`, () => {
      preparar(total);
      expect(service.sugestaoCreditoTroca()).toBe(credito);
      hub.adicionarPagamentoValeTroca.and.returnValue(of(vendaTroca(total, credito)));
      service.adicionarCreditoTroca(credito).subscribe((r) => expect(r.ok).toBeTrue());
      expect(hub.adicionarPagamentoValeTroca).toHaveBeenCalledWith('nova-venda', jasmine.any(String), documentoTecnico, credito, 'devolucao-uuid');
      expect(service.venda()?.pendente).toBe(pendente);
      expect(service.venda()?.troco).toBe('0.00');
      expect(service.venda()?.pagamentos[0].valor).toBe(credito);
      service.adicionarCreditoTroca('1.00').subscribe((r) => expect(r.ok).toBeFalse());
      expect(hub.adicionarPagamentoValeTroca).toHaveBeenCalledTimes(1);
    });
  }

  it('permite pagar a diferenca pelas formas normais existentes', () => {
    preparar('105.00');
    hub.adicionarPagamentoValeTroca.and.returnValue(of(vendaTroca('105.00', '100.00')));
    service.adicionarCreditoTroca('100.00').subscribe();
    const paga = vendaTroca('105.00', '100.00');
    paga.venda = { ...paga.venda!, totalPago: '105.00', pendente: '0.00' };
    hub.adicionarPagamento.and.returnValue(of(paga));
    service.adicionarPagamento('nova-venda', 1, '5.00').subscribe((r) => expect(r.ok).toBeTrue());
    expect(hub.adicionarPagamento).toHaveBeenCalledWith(jasmine.objectContaining({ vendaUuid: 'nova-venda', formaPagamentoId: 1, valor: '5.00' }));
    expect(service.venda()?.pendente).toBe('0.00');
  });

  it('bloqueia sem devolucao vinculada', () => {
    service.adicionarCreditoTroca('1.00').subscribe((r) => expect(r.detail).toContain('Não há devolução'));
    expect(hub.adicionarPagamentoValeTroca).not.toHaveBeenCalled();
  });

  it('bloqueia cliente diferente por UUID ou identidade da Central', () => {
    preparar();
    for (const cliente of [
      { ...clientePreselecionadoStub, clienteUuid: 'outro-cliente' },
      { ...clientePreselecionadoStub, retaguardaId: 999 },
    ]) {
      hub.atual.and.returnValue(of({ ...vendaTroca(), venda: { ...vendaTroca().venda!, cliente } }));
      service.carregarAtual().subscribe();
      service.adicionarCreditoTroca('95.00').subscribe((r) => expect(r.detail).toContain('mesmo cliente'));
    }
    expect(hub.adicionarPagamentoValeTroca).not.toHaveBeenCalled();
  });

  it('aceita cliente local identificado exclusivamente por UUID', () => {
    const origem = origemStub();
    origem.cliente.id = null;
    service.prepararTroca(devolucaoStub(), origem).subscribe();
    const venda = vendaTroca();
    venda.venda!.cliente = { ...clientePreselecionadoStub, retaguardaId: null };
    hub.iniciarVenda.and.returnValue(of(venda));
    service.iniciarVenda().subscribe();
    expect(service.erroCreditoTroca()).toBe('');
  });

  it('nao transfere contexto para venda diferente', () => {
    preparar();
    hub.atual.and.returnValue(of({ ...vendaTroca(), venda: { ...vendaTroca().venda!, uuid: 'outra-venda' } }));
    service.carregarAtual().subscribe();
    expect(service.troca()).toBeNull();
    service.adicionarCreditoTroca('95.00').subscribe((r) => expect(r.ok).toBeFalse());
    expect(hub.adicionarPagamentoValeTroca).not.toHaveBeenCalled();
  });

  it('bloqueia documento tecnico invalido consumo anterior e contexto divergente', () => {
    for (const modificar of [
      (d: VendaDevolucaoResultado) => { d.vale_troca!.documento_tecnico = 'VT0000001'; },
      (d: VendaDevolucaoResultado) => { d.vale_troca!.valor_consumido = '5.00'; },
      (d: VendaDevolucaoResultado) => { d.venda_troca_uuid = 'outra-venda'; },
      (d: VendaDevolucaoResultado) => { d.venda_uuid = 'outra-origem'; },
    ]) {
      const devolucao = devolucaoStub();
      modificar(devolucao);
      service.prepararTroca(devolucao, origemStub()).subscribe((r) => expect(r.ok).toBeFalse());
    }
    expect(service.troca()).toBeNull();
  });

  it('bloqueia valor invalido insuficiente ou acima do pendente', () => {
    preparar('105.00');
    for (const valor of ['-1', '0', '1.001', '101.00']) {
      service.adicionarCreditoTroca(valor).subscribe((r) => expect(r.ok).toBeFalse());
    }
    hub.atual.and.returnValue(of(vendaTroca()));
    service.carregarAtual().subscribe();
    service.adicionarCreditoTroca('96.00').subscribe((r) => expect(r.detail).toContain('saldo pendente'));
    expect(hub.adicionarPagamentoValeTroca).not.toHaveBeenCalled();
  });

  it('bloqueia venda encerrada sem produtos ou sem vendedor', () => {
    preparar();
    for (const alteracoes of [{ itens: [] }, { vendedor: null }]) {
      hub.atual.and.returnValue(of({ ...vendaTroca(), venda: { ...vendaTroca().venda!, ...alteracoes } }));
      service.carregarAtual().subscribe();
      service.adicionarCreditoTroca('95.00').subscribe((r) => expect(r.ok).toBeFalse());
    }
    hub.atual.and.returnValue(of({ ...vendaTroca(), venda: { ...vendaTroca().venda!, status: 'FINALIZADA' } }));
    service.carregarAtual().subscribe();
    service.adicionarCreditoTroca('95.00').subscribe((r) => expect(r.ok).toBeFalse());
    expect(hub.adicionarPagamentoValeTroca).not.toHaveBeenCalled();
  });

  it('retry de falha de comunicacao preserva contexto e operacao_uuid', () => {
    preparar();
    hub.atual.and.returnValue(throwError(() => new HttpErrorResponse({ status: 0 })));
    hub.adicionarPagamentoValeTroca.and.returnValues(throwError(() => new HttpErrorResponse({ status: 0 })), of(vendaTroca('95.00', '95.00')));
    service.adicionarCreditoTroca('95.00').subscribe((r) => expect(r.ok).toBeFalse());
    expect(service.troca()?.vendaUuid).toBe('nova-venda');
    service.adicionarCreditoTroca('95.00').subscribe((r) => expect(r.ok).toBeTrue());
    expect(hub.adicionarPagamentoValeTroca.calls.argsFor(1)).toEqual(hub.adicionarPagamentoValeTroca.calls.argsFor(0));
    expect(service.loadingOperacao()).toBeFalse();
  });

  it('reconcilia pagamento aceito cuja resposta se perdeu sem novo envio', () => {
    preparar();
    hub.adicionarPagamentoValeTroca.and.returnValue(throwError(() => new HttpErrorResponse({ status: 0 })));
    hub.atual.and.returnValue(of(vendaTroca('95.00', '95.00')));
    service.adicionarCreditoTroca('95.00').subscribe((r) => expect(r.ok).toBeTrue());
    service.adicionarCreditoTroca('95.00').subscribe((r) => expect(r.ok).toBeFalse());
    expect(hub.adicionarPagamentoValeTroca).toHaveBeenCalledTimes(1);
    expect(service.venda()?.pagamentos.length).toBe(1);
  });

  it('resposta invalida permite retry da mesma operacao e bloqueia alterar valor incerto', () => {
    preparar();
    hub.atual.and.returnValue(throwError(() => new HttpErrorResponse({ status: 0 })));
    hub.adicionarPagamentoValeTroca.and.returnValues(of(vendaTroca()), of(vendaTroca('95.00', '95.00')));
    service.adicionarCreditoTroca('95.00').subscribe((r) => expect(r.ok).toBeFalse());
    service.adicionarCreditoTroca('90.00').subscribe((r) => expect(r.detail).toContain('sem alterar os dados'));
    service.adicionarCreditoTroca('95.00').subscribe((r) => expect(r.ok).toBeTrue());
    expect(hub.adicionarPagamentoValeTroca.calls.argsFor(1)).toEqual(hub.adicionarPagamentoValeTroca.calls.argsFor(0));
  });

  it('duplo clique envia um unico pagamento', () => {
    preparar();
    const request = new Subject<VendaAtualResponse>();
    hub.adicionarPagamentoValeTroca.and.returnValue(request);
    service.adicionarCreditoTroca('95.00').subscribe();
    service.adicionarCreditoTroca('95.00').subscribe((r) => expect(r.ok).toBeFalse());
    expect(hub.adicionarPagamentoValeTroca).toHaveBeenCalledTimes(1);
    expect(service.loadingOperacao()).toBeTrue();
    request.next(vendaTroca('95.00', '95.00'));
    request.complete();
    expect(service.loadingOperacao()).toBeFalse();
  });

  it('informa que a devolucao ja foi enviada a Central e impede novo consumo local', () => {
    preparar();
    const detail = 'Devolução já enviada à Central. Aguarde o Vale-Troca oficial para realizar a troca online.';
    hub.adicionarPagamentoValeTroca.and.returnValue(throwError(() => new HttpErrorResponse({ status: 409, error: { detail } })));
    service.adicionarCreditoTroca('95.00').subscribe((r) => expect(r.detail).toBe(detail));
    expect(service.erroCreditoTroca()).toBe(detail);
    service.adicionarCreditoTroca('95.00').subscribe((r) => expect(r.ok).toBeFalse());
    expect(hub.adicionarPagamentoValeTroca).toHaveBeenCalledTimes(1);
  });

  for (const acao of ['finalizar', 'cancelar']) {
    it(`limpa contexto depois de ${acao} a venda vinculada e impede usar o restante em outra venda`, () => {
      preparar();
      if (acao === 'finalizar') {
        hub.finalizarVenda.and.returnValue(of({ ...vendaTroca('95.00', '95.00'), venda: { ...vendaTroca('95.00', '95.00').venda!, status: 'FINALIZADA' } }));
        service.finalizarVenda('nova-venda').subscribe();
      } else {
        hub.cancelar.and.returnValue(of(vendaAtualSemVendaStub));
        service.cancelarVenda().subscribe();
      }
      expect(service.troca()).toBeNull();
      hub.iniciarVenda.and.returnValue(of({ ...vendaTroca(), venda: { ...vendaTroca().venda!, uuid: 'outra-venda' } }));
      service.iniciarVenda().subscribe();
      service.adicionarCreditoTroca('5.00').subscribe((r) => expect(r.ok).toBeFalse());
      expect(hub.adicionarPagamentoValeTroca).not.toHaveBeenCalled();
    });
  }

  it('preserva contexto e UUID pendente ao reinicializar apenas a tela e reconciliar a venda', () => {
    preparar();
    hub.atual.and.returnValue(throwError(() => new HttpErrorResponse({ status: 0 })));
    hub.adicionarPagamentoValeTroca.and.returnValues(throwError(() => new HttpErrorResponse({ status: 0 })), of(vendaTroca('95.00', '95.00')));
    service.adicionarCreditoTroca('95.00').subscribe();
    service.limparEstado();
    expect(service.troca()?.vendaUuid).toBe('nova-venda');
    hub.atual.and.returnValue(of(vendaTroca()));
    service.bootstrap().subscribe();
    service.adicionarCreditoTroca('95.00').subscribe((r) => expect(r.ok).toBeTrue());
    expect(hub.adicionarPagamentoValeTroca.calls.argsFor(1)).toEqual(hub.adicionarPagamentoValeTroca.calls.argsFor(0));
  });

  it('compara sugestao e limites em centavos sem perder precisao monetaria', () => {
    const devolucao = devolucaoStub();
    devolucao.vale_troca!.saldo = '9999999999999999.99';
    service.prepararTroca(devolucao, origemStub()).subscribe();
    const venda = vendaTroca();
    venda.venda = { ...venda.venda!, total: '9999999999999999.98', pendente: '9999999999999999.98' };
    hub.iniciarVenda.and.returnValue(of(venda));
    service.iniciarVenda().subscribe();
    expect(service.sugestaoCreditoTroca()).toBe('9999999999999999.98');
    service.adicionarCreditoTroca('9999999999999999.99').subscribe((r) => expect(r.detail).toContain('saldo pendente'));
    expect(hub.adicionarPagamentoValeTroca).not.toHaveBeenCalled();
  });

});
