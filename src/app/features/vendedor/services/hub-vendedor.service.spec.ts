import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { HUB_TERMINAL_API_PATH } from '../../../core/api/api.config';
import { HubVendedorService } from './hub-vendedor.service';

describe('HubVendedorService', () => {
  let service: HubVendedorService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [HubVendedorService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(HubVendedorService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('consulta vendedores sem q', (done) => {
    service.consultar().subscribe((response) => {
      expect(response.vendedores[0].id).toBe(501);
      done();
    });

    const req = httpMock.expectOne(`${HUB_TERMINAL_API_PATH}/vendedores/`);
    expect(req.request.method).toBe('GET');
    req.flush({
      vendedores_versao: 1,
      vendedores_sincronizado_em: '2026-09-16T10:00:00',
      q: '',
      total: 1,
      limit: 50,
      vendedores: [{
        id: 501,
        matricula: '000501',
        nome: 'Ana Vendedora',
        apelido: 'Ana',
        cargo: null,
        comissionado: true,
        comissao_percentual: '3.00',
      }],
    });
  });

  it('consulta vendedores com q', () => {
    service.consultar('Ana').subscribe();

    const req = httpMock.expectOne(`${HUB_TERMINAL_API_PATH}/vendedores/?q=Ana`);
    expect(req.request.method).toBe('GET');
    req.flush({ vendedores_versao: 1, vendedores_sincronizado_em: null, q: 'Ana', total: 0, limit: 50, vendedores: [] });
  });
});
