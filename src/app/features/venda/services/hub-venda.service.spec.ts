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
});
