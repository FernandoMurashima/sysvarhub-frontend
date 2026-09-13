import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { catalogoResponseStub } from '../../../testing/terminal-test-data';
import { HubCatalogoService } from './hub-catalogo.service';

describe('HubCatalogoService', () => {
  let service: HubCatalogoService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(HubCatalogoService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('usa /api/terminal/catalogo/ com q e limit opcionais', () => {
    service.buscar('jeans', 10).subscribe();

    const request = httpMock.expectOne('/api/terminal/catalogo/?q=jeans&limit=10');
    expect(request.request.method).toBe('GET');
    request.flush(catalogoResponseStub);
  });

  it('busca sem q', () => {
    service.buscar(undefined, 5).subscribe();

    const request = httpMock.expectOne('/api/terminal/catalogo/?limit=5');
    expect(request.request.method).toBe('GET');
    request.flush(catalogoResponseStub);
  });

  it('preserva decimal string, vendavel e motivos_bloqueio', (done) => {
    const response = {
      ...catalogoResponseStub,
      itens: [
        {
          ...catalogoResponseStub.itens[0],
          preco_venda: '199.9000',
          estoque_disponivel: '4.000',
          vendavel: false,
          motivos_bloqueio: ['SEM_ESTOQUE'],
        },
      ],
    };

    service.buscar('7892701000013').subscribe((result) => {
      const item = result.itens[0];
      expect(item.preco_venda).toBe('199.9000');
      expect(item.estoque_disponivel).toBe('4.000');
      expect(item.vendavel).toBeFalse();
      expect(item.motivos_bloqueio).toEqual(['SEM_ESTOQUE']);
      done();
    });

    httpMock.expectOne('/api/terminal/catalogo/?q=7892701000013').flush(response);
  });
});
