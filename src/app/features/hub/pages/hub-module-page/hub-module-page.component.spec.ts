import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { of, Subject, throwError } from 'rxjs';

import { VendaDevolucaoConsulta, VendaDevolucaoResultadoResponse } from '../../../../core/models/venda.models';
import { HubVendaService } from '../../../venda/services/hub-venda.service';

import { operadorLoginResponseStub, terminalContextoStub } from '../../../../testing/terminal-test-data';
import { OperatorSessionService } from '../../../operador/services/operator-session.service';
import { CentralConnectivityService } from '../../../terminal/services/central-connectivity.service';
import { TerminalSessionService } from '../../../terminal/services/terminal-session.service';
import { HubModulePageComponent } from './hub-module-page.component';

describe('HubModulePageComponent', () => {
  let fixture: ComponentFixture<HubModulePageComponent>;
  let component: HubModulePageComponent;
  let vendaService: jasmine.SpyObj<HubVendaService>;
  let centralConnectivity: jasmine.SpyObj<CentralConnectivityService>;
  const centralStatusSignal = signal<'VERIFICANDO' | 'ONLINE' | 'OFFLINE'>('OFFLINE');
  const centralUltimoContatoSignal = signal('');

  beforeEach(async () => {
    vendaService = jasmine.createSpyObj<HubVendaService>('HubVendaService', [
      'consultarDevolucao', 'consultarDevolucaoPorVendaId', 'pesquisarClientesDevolucao',
      'listarVendasClienteDevolucao', 'finalizarDevolucao',
    ]);
    vendaService.consultarDevolucao.and.returnValue(of({ venda: vendaLocalStub() }));
    vendaService.finalizarDevolucao.and.returnValue(of(resultadoStub()));
    centralStatusSignal.set('OFFLINE');
    centralUltimoContatoSignal.set('');
    centralConnectivity = jasmine.createSpyObj<CentralConnectivityService>('CentralConnectivityService', ['startPolling'], {
      status: centralStatusSignal.asReadonly(),
      lastContactLabel: centralUltimoContatoSignal.asReadonly(),
    });

    await TestBed.configureTestingModule({
      imports: [HubModulePageComponent],
      providers: [
        provideRouter([]),
        { provide: HubVendaService, useValue: vendaService },
        { provide: ActivatedRoute, useValue: { snapshot: { data: { moduleKey: 'devolucao-troca' } } } },
        { provide: TerminalSessionService, useValue: { contexto: signal(terminalContextoStub).asReadonly() } },
        { provide: OperatorSessionService, useValue: { operador: signal(operadorLoginResponseStub.operador).asReadonly() } },
        { provide: CentralConnectivityService, useValue: centralConnectivity },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HubModulePageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('mostra o estado da Central e orienta a consulta local offline', () => {
    expect(fixture.nativeElement.textContent).toContain('Devolução / Troca');
    expect(fixture.nativeElement.textContent).toContain('Central');
    expect(fixture.nativeElement.textContent).toContain('OFFLINE');
    expect(centralConnectivity.startPolling).toHaveBeenCalled();

    centralStatusSignal.set('ONLINE');
    centralUltimoContatoSignal.set('10:20:30');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('ONLINE · 10:20:30');
  });

  function localizarLocal(): void {
    component.documentoBusca = 'VE 011 0000001';
    component.buscarCupom();
    component.quantidades['item-local'] = 1;
  }

  function localizarCentral(): void {
    centralStatusSignal.set('ONLINE');
    vendaService.consultarDevolucao.and.returnValue(of({ venda: vendaCentralStub() }));
    localizarLocal();
    component.quantidades = { '91': 1 };
  }

  it('busca VE offline pelo endpoint existente e habilita a venda local encontrada', () => {
    fixture.detectChanges();
    const input: HTMLInputElement = fixture.nativeElement.querySelector('.search-row input');
    const localizar: HTMLButtonElement = fixture.nativeElement.querySelector('.search-row button');
    expect(input.disabled).toBeFalse();
    expect(localizar.disabled).toBeFalse();
    localizarLocal();
    expect(vendaService.consultarDevolucao).toHaveBeenCalledOnceWith('VE 011 0000001');
    expect(component.venda?.documento).toBe('VE0110000001');
    expect(component.vendaLocal()).toBeTrue();
    expect(component.podeFinalizar()).toBeTrue();
  });

  it('calcula credito local pelo total e quantidade originais apos devolucao parcial', () => {
    localizarLocal();
    expect(component.venda?.itens[0].quantidade).toBe(4);
    expect(component.venda?.itens[0].quantidade_disponivel).toBe(2);
    expect(component.totalCredito()).toBe(25);
    component.quantidades['item-local'] = 2;
    expect(component.totalCredito()).toBe(50);
  });

  it('envia UUIDs locais sem IDs da Central mesmo quando conectividade indica ONLINE', () => {
    centralStatusSignal.set('ONLINE');
    localizarLocal();
    component.motivo = 'Tamanho';
    component.finalizar();
    const [vendaUuid, itens, motivo, devolucaoUuid, vendaId] = vendaService.finalizarDevolucao.calls.mostRecent().args;
    expect(vendaUuid).toBe('venda-local');
    expect(itens).toEqual([{ item_uuid: 'item-local', quantidade: 1 }]);
    expect(motivo).toBe('Tamanho');
    expect(devolucaoUuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    expect(vendaId).toBeUndefined();
  });

  it('preserva IDs e valores liquidos do contrato online', () => {
    localizarCentral();
    expect(component.totalCredito()).toBe(20);
    component.finalizar();
    const [vendaUuid, itens, , devolucaoUuid, vendaId] = vendaService.finalizarDevolucao.calls.mostRecent().args;
    expect(vendaUuid).toBe('');
    expect(vendaId).toBe(51);
    expect(itens).toEqual([{ venda_item: 91, quantidade: 1 }]);
    expect(devolucaoUuid).toBeTruthy();
  });

  it('bloqueia finalizacao de venda da Central quando a conexao cai', () => {
    localizarCentral();
    centralStatusSignal.set('OFFLINE');
    expect(component.podeFinalizar()).toBeFalse();
    component.finalizar();
    expect(vendaService.finalizarDevolucao).not.toHaveBeenCalled();
    expect(component.mensagem).toContain('Aguarde a conexão');
  });

  it('restringe toda a pesquisa por cliente ao modo online', () => {
    component.clienteBusca = 'Cliente';
    component.pesquisarCliente();
    component.selecionarCliente({ id: 1, nome: 'Cliente', documento: '123' });
    component.selecionarVendaCliente({ id: 51, documento: 'VE0110000001', data_venda: '', loja: { id: 11, nome: 'Loja' }, total: '100.00', quantidade_itens: 1 });
    expect(vendaService.pesquisarClientesDevolucao).not.toHaveBeenCalled();
    expect(vendaService.listarVendasClienteDevolucao).not.toHaveBeenCalled();
    expect(vendaService.consultarDevolucaoPorVendaId).not.toHaveBeenCalled();
    expect(component.mensagem).toContain('cupom/documento');
    component.modoBusca = 'cliente';
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.search-row input').placeholder).toContain('Documento VE');
  });

  it('preserva pesquisa, listagem e selecao de venda por cliente online', () => {
    centralStatusSignal.set('ONLINE');
    const cliente = { id: 1, nome: 'Cliente', documento: '123' };
    const venda = { id: 51, documento: 'VE0110000001', data_venda: '', loja: { id: 11, nome: 'Loja' }, total: '100.00', quantidade_itens: 1 };
    vendaService.pesquisarClientesDevolucao.and.returnValue(of({ clientes: [cliente] }));
    vendaService.listarVendasClienteDevolucao.and.returnValue(of({ cliente, vendas: [venda] }));
    vendaService.consultarDevolucaoPorVendaId.and.returnValue(of({ venda: vendaCentralStub() }));
    component.clienteBusca = 'Cliente';
    component.pesquisarCliente();
    component.selecionarCliente(cliente);
    component.selecionarVendaCliente(venda);
    expect(vendaService.pesquisarClientesDevolucao).toHaveBeenCalledOnceWith('Cliente');
    expect(vendaService.listarVendasClienteDevolucao).toHaveBeenCalledOnceWith(1);
    expect(vendaService.consultarDevolucaoPorVendaId).toHaveBeenCalledOnceWith(51);
    expect(component.venda?.id).toBe(51);
    expect(component.vendaLocal()).toBeFalse();
  });

  it('preserva devolucao_uuid no retry apos falha de comunicacao', () => {
    localizarLocal();
    vendaService.finalizarDevolucao.and.returnValues(
      throwError(() => new HttpErrorResponse({ status: 0 })), of(resultadoStub()),
    );
    component.finalizar();
    expect(component.carregando).toBeFalse();
    component.finalizar();
    expect(vendaService.finalizarDevolucao.calls.count()).toBe(2);
    expect(vendaService.finalizarDevolucao.calls.argsFor(1)).toEqual(vendaService.finalizarDevolucao.calls.argsFor(0));
    expect(component.resultado?.uuid).toBe('devolucao-local');
  });

  it('preserva devolucao_uuid se a resposta de confirmacao for invalida', () => {
    localizarLocal();
    vendaService.finalizarDevolucao.and.returnValues(of({} as VendaDevolucaoResultadoResponse), of(resultadoStub()));
    component.finalizar();
    expect(component.resultado).toBeNull();
    expect(component.mensagem).toContain('Resposta de confirmação inválida');
    component.finalizar();
    expect(vendaService.finalizarDevolucao.calls.argsFor(1)).toEqual(vendaService.finalizarDevolucao.calls.argsFor(0));
  });

  it('impede duplo clique durante envio e apos sucesso', () => {
    localizarLocal();
    const envio = new Subject<VendaDevolucaoResultadoResponse>();
    vendaService.finalizarDevolucao.and.returnValue(envio);
    component.abrirConfirmacao();
    component.finalizar();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.confirm-box button:last-child').disabled).toBeTrue();
    component.finalizar();
    expect(vendaService.finalizarDevolucao).toHaveBeenCalledTimes(1);
    envio.next(resultadoStub());
    envio.complete();
    component.finalizar();
    expect(vendaService.finalizarDevolucao).toHaveBeenCalledTimes(1);
  });

  it('limpa selecao anterior e bloqueia devolucao de venda inexistente ou de outra loja', () => {
    localizarLocal();
    component.abrirConfirmacao();
    vendaService.consultarDevolucao.and.returnValue(throwError(() => new HttpErrorResponse({ status: 404, error: { detail: 'Venda finalizada não encontrada no Hub.' } })));
    component.documentoBusca = 'VE0120000001';
    component.buscarCupom();
    expect(component.venda).toBeNull();
    expect(component.confirmando).toBeFalse();
    expect(component.quantidades).toEqual({});
    expect(component.podeFinalizar()).toBeFalse();
    component.finalizar();
    expect(vendaService.finalizarDevolucao).not.toHaveBeenCalled();
  });

  it('orienta a aguardar a Central quando nao existe venda local elegivel', () => {
    vendaService.consultarDevolucao.and.returnValue(throwError(() => new HttpErrorResponse({ status: 404 })));
    component.documentoBusca = 'VE0120000001';
    component.buscarCupom();
    expect(component.mensagem).toContain('não encontrada nesta loja');
    expect(component.mensagem).toContain('aguarde a conexão');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.sale-detail')).toBeNull();
  });

  it('bloqueia quantidades negativas, fracionarias, acima do saldo ou nao finitas', () => {
    localizarLocal();
    for (const qtd of [-1, 0.5, 3, NaN, Infinity]) {
      component.quantidades['item-local'] = qtd;
      expect(component.podeFinalizar()).withContext(String(qtd)).toBeFalse();
      component.finalizar();
    }
    expect(vendaService.finalizarDevolucao).not.toHaveBeenCalled();
    expect(component.mensagem).toContain('quantidades inteiras');
  });

  it('normaliza entrada de quantidade para inteiro entre zero e saldo', () => {
    localizarLocal();
    for (const [entrada, esperado] of [[-1, 0], [0.5, 0], [1.5, 1], [3, 2], [NaN, 0]]) {
      component.quantidades['item-local'] = entrada;
      component.ajustarQuantidade('item-local', 2);
      expect(component.quantidades['item-local']).toBe(esperado);
    }
  });

  it('nao permite confirmar sem itens ou com saldo esgotado', () => {
    localizarLocal();
    component.quantidades = {};
    component.abrirConfirmacao();
    expect(component.confirmando).toBeFalse();
    component.quantidades['item-local'] = 1;
    component.venda!.itens[0].quantidade_disponivel = 0;
    component.finalizar();
    expect(component.podeFinalizar()).toBeFalse();
    expect(vendaService.finalizarDevolucao).not.toHaveBeenCalled();
  });

  it('confirma documento cliente itens quantidades valor previsto e operacao offline', () => {
    localizarLocal();
    component.abrirConfirmacao();
    fixture.detectChanges();
    const texto = fixture.nativeElement.querySelector('.confirm-box').textContent;
    for (const esperado of ['VE0110000001', 'Cliente Teste', 'Produto local', '1 unidade(s)', '25,00', 'OFFLINE', 'Crédito previsto']) {
      expect(texto).toContain(esperado);
    }
  });

  it('mostra credito provisorio e sincronizacao pendente sem apresentar VT-HUB como Vale oficial', () => {
    localizarLocal();
    component.finalizar();
    fixture.detectChanges();
    const texto = fixture.nativeElement.querySelector('.result-box').textContent;
    expect(texto).toContain('registrada no Hub');
    expect(texto).toContain('sincronização pendente');
    expect(texto).toContain('Crédito provisório técnico');
    expect(texto).toContain('Não está disponível como saldo livre para outras vendas offline');
    expect(texto).not.toContain('VT-HUB-');
  });

  it('exibe apenas o documento oficial retornado para a devolucao online', () => {
    localizarCentral();
    const resposta = resultadoStub();
    resposta.devolucao.vale_troca = { documento: 'VT0110000001', saldo: '20.00', provisorio: false };
    vendaService.finalizarDevolucao.and.returnValue(of(resposta));
    component.finalizar();
    fixture.detectChanges();
    const texto = fixture.nativeElement.querySelector('.result-box').textContent;
    expect(texto).toContain('Vale-Troca VT0110000001');
    expect(texto).not.toContain('Crédito provisório técnico');
  });

  it('oculta VT-HUB mesmo quando a resposta nao identifica o credito como provisorio', () => {
    localizarCentral();
    const resposta = resultadoStub();
    resposta.devolucao.vale_troca!.provisorio = false;
    vendaService.finalizarDevolucao.and.returnValue(of(resposta));
    component.finalizar();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.result-box').textContent).not.toContain('VT-HUB-');
    expect(component.resultadoProvisorio()).toBeTrue();
  });

});


function vendaLocalStub(): VendaDevolucaoConsulta {
  return {
    uuid: 'venda-local', documento: 'VE0110000001', total: '100.00',
    cliente: { id: 12, uuid: 'cliente-local', nome: 'Cliente Teste' },
    itens: [{ item_uuid: 'item-local', descricao: 'Produto local', quantidade: 4,
      quantidade_devolvida: 2, quantidade_disponivel: 2, preco_unitario: '25.0000', total_item: '100.00' }],
  };
}

function vendaCentralStub(): VendaDevolucaoConsulta {
  const venda = vendaLocalStub();
  return { ...venda, id: 51, uuid: '', itens: [{ ...venda.itens[0], id: 91, item_uuid: '', valor_liquido_disponivel: '40.00' }] };
}

function resultadoStub(): VendaDevolucaoResultadoResponse {
  return { devolucao: {
    uuid: 'devolucao-local', venda_uuid: 'venda-local', documento: 'DEV01100001', venda_documento: 'venda-local',
    valor_total: '25.00', finalizada_em: '2026-10-14T12:00:00-03:00',
    vale_troca: { documento: 'VT-HUB-TECNICO', documento_tecnico: 'VT-HUB-TECNICO', saldo: '25.00', provisorio: true },
  } };
}
