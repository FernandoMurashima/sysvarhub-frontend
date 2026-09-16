import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { HubTiposDespesaPdvService } from './hub-tipos-despesa-pdv.service';

describe('HubTiposDespesaPdvService', () => {
  let service: HubTiposDespesaPdvService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(HubTiposDespesaPdvService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('carrega tipos de despesa do endpoint local e mapeia contrato', () => {
    service.listar().subscribe((response) => {
      expect(response.total).toBe(1);
      expect(response.tipos[0].id).toBe(123);
      expect(response.tipos[0].exigeDocumento).toBeTrue();
      expect(response.tipos[0].natureza.movimentaFinanceiro).toBeTrue();
    });

    const request = httpMock.expectOne('/api/terminal/tipos-despesa-pdv/');
    expect(request.request.method).toBe('GET');
    request.flush({
      tipos_despesa_pdv_versao: 1,
      tipos_despesa_pdv_sincronizado_em: '2026-09-16T10:00:00',
      total: 1,
      tipos_despesa_pdv: [{
        id: 123,
        codigo: 'LAN',
        descricao: 'Lanche',
        exige_documento: true,
        natureza: {
          id: 456,
          codigo: '3301',
          descricao: 'Lanche',
          categoria_principal: 'Loja',
          subcategoria: 'Equipe',
          tipo: 'DESPESA',
          status: 'ATIVO',
          tipo_natureza: 'DEBITO',
          natureza_operacao: 'DESPESA',
          categoria_gerencial: 'Operacional',
          movimenta_financeiro: true,
          entra_dre: true,
        },
      }],
    });
  });
});
