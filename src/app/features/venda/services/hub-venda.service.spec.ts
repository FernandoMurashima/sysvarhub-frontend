import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { HubVendaService } from './hub-venda.service';

describe('HubVendaService', () => {
  let service: HubVendaService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [HubVendaService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(HubVendaService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('consulta venda atual em URL relativa', () => {
    service.atual().subscribe();
    const request = httpMock.expectOne('/api/terminal/venda/atual/');

    expect(request.request.method).toBe('GET');
    request.flush({ venda: null });
  });

  it('adiciona item enviando somente sku_id e quantidade', () => {
    service.adicionarItem(10825, 1).subscribe();
    const request = httpMock.expectOne('/api/terminal/venda/item/');

    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ sku_id: 10825, quantidade: 1 });
    expect(request.request.body.preco).toBeUndefined();
    request.flush({ venda: null });
  });

  it('altera, remove e cancela venda', () => {
    service.alterarQuantidade('item', 2).subscribe();
    const patch = httpMock.expectOne('/api/terminal/venda/item/item/');
    expect(patch.request.body).toEqual({ quantidade: 2 });
    patch.flush({ venda: null });

    service.removerItem('item').subscribe();
    const remove = httpMock.expectOne('/api/terminal/venda/item/item/');
    expect(remove.request.method).toBe('DELETE');
    remove.flush({ venda: null });

    service.cancelar().subscribe();
    const cancelar = httpMock.expectOne('/api/terminal/venda/cancelar/');
    expect(cancelar.request.method).toBe('POST');
    cancelar.flush({ venda: null });
  });

  it('lista formas e opera pagamentos/finalizacao', () => {
    service.listarFormasPagamento().subscribe((response) => expect(response.formas[0].codigo).toBe('DIN'));
    const formas = httpMock.expectOne('/api/terminal/formas-pagamento/');
    expect(formas.request.method).toBe('GET');
    formas.flush({
      versao: 1,
      sincronizado_em: null,
      formas: [{
        id: 1,
        retaguarda_id: 10,
        codigo: 'DIN',
        descricao: 'Dinheiro',
        tipo: 'DINHEIRO',
        num_parcelas: 1,
        tef_habilitado: false,
        parcelas: [],
      }],
    });

    service.adicionarPagamento({
      vendaUuid: 'venda',
      operacaoUuid: 'op',
      formaPagamentoId: 1,
      valor: '199.90',
      autorizacao: '',
    }).subscribe();
    const pagamento = httpMock.expectOne('/api/terminal/venda/pagamento/');
    expect(pagamento.request.method).toBe('POST');
    expect(pagamento.request.body).toEqual({
      venda_uuid: 'venda',
      operacao_uuid: 'op',
      forma_pagamento_id: 1,
      valor: '199.90',
      autorizacao: '',
    });
    pagamento.flush({ venda: null });

    service.removerPagamento('pag').subscribe();
    const removerPagamento = httpMock.expectOne('/api/terminal/venda/pagamento/pag/');
    expect(removerPagamento.request.method).toBe('DELETE');
    removerPagamento.flush({ venda: null });
  });

  it('finaliza venda por uuid', () => {
    service.finalizarVenda('venda').subscribe();
    const request = httpMock.expectOne('/api/terminal/venda/finalizar/');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ venda_uuid: 'venda' });
    request.flush({ venda: null });
  });
});
