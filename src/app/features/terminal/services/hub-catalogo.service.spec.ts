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

  it('preserva contrato real de tabela, versao, strings decimais e objetos do item', (done) => {
    service.buscar('7892701000013', 40).subscribe((result) => {
      const item = result.itens[0];

      expect(result.catalogo_versao).toBe(1);
      expect(result.tabela_preco.codigo).toBe('PADRAO');
      expect(result.tabela_preco.nome).toBe('Tabela Padrão');
      expect(result.q).toBe('7892701000013');
      expect(result.limit).toBe(40);
      expect(item.tipo_produto).toBe('1');
      expect(item.ean13).toBe('7892701000013');
      expect(item.codigo_item_ref).toBe('00001');
      expect(item.cor).toEqual({ id: 113, descricao: 'Jeans' });
      expect(item.tamanho).toEqual({ id: 147, descricao: '34' });
      expect(item.unidade).toEqual({ id: 47, codigo: 'UN', descricao: 'Un' });
      expect(item.preco_venda).toBe('199.9000');
      expect(item.estoque_disponivel).toBe('4.000');
      expect(item.vendavel).toBeTrue();
      done();
    });

    httpMock.expectOne('/api/terminal/catalogo/?q=7892701000013&limit=40').flush(catalogoResponseStub);
  });

  it('aceita item sem preco sem converter decimais', (done) => {
    const response = {
      ...catalogoResponseStub,
      itens: [
        {
          ...catalogoResponseStub.itens[0],
          ean13: null,
          preco: null,
          preco_promocional: null,
          preco_venda: null,
          vendavel: false,
          motivos_bloqueio: ['SEM_PRECO'],
        },
      ],
    };

    service.buscar('7892701000013').subscribe((result) => {
      const item = result.itens[0];
      expect(item.ean13).toBeNull();
      expect(item.preco).toBeNull();
      expect(item.preco_promocional).toBeNull();
      expect(item.preco_venda).toBeNull();
      expect(item.vendavel).toBeFalse();
      expect(item.motivos_bloqueio).toEqual(['SEM_PRECO']);
      done();
    });

    httpMock.expectOne('/api/terminal/catalogo/?q=7892701000013').flush(response);
  });
});
