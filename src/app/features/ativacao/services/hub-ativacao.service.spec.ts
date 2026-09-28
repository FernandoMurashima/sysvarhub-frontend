import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { HubAtivacaoService } from './hub-ativacao.service';

describe('HubAtivacaoService', () => {
  let service: HubAtivacaoService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(HubAtivacaoService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('GET de status chama endpoint local', (done) => {
    service.status().subscribe((status) => {
      expect(status.ativado).toBeFalse();
      expect(status.retaguarda_url).toBe('http://central.test');
      done();
    });

    const request = httpMock.expectOne('/api/hub/ativacao/');
    expect(request.request.method).toBe('GET');
    request.flush({
      ativado: false,
      possui_credencial: false,
      hub_uuid: null,
      nome: 'Sysvar Hub',
      empresa_id: null,
      empresa_nome: '',
      loja_id: null,
      loja_nome: '',
      retaguarda_url: 'http://central.test',
      ativado_em: null,
    });
  });

  it('POST de ativacao envia somente url e codigo', (done) => {
    service.ativar({ codigo: 'ABCD-EFGH-IJKL', retaguarda_url: 'http://central.test' }).subscribe((status) => {
      expect(status.ativado).toBeTrue();
      expect(JSON.stringify(status)).not.toContain('TOKEN');
      done();
    });

    const request = httpMock.expectOne('/api/hub/ativacao/');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ codigo: 'ABCD-EFGH-IJKL', retaguarda_url: 'http://central.test' });
    expect(request.request.body.token).toBeUndefined();
    request.flush({
      ativado: true,
      possui_credencial: true,
      hub_uuid: 'hub-uuid',
      nome: 'Sysvar Hub',
      empresa_id: 3,
      empresa_nome: 'Empresa',
      loja_id: 7,
      loja_nome: 'Loja',
      retaguarda_url: 'http://central.test',
      ativado_em: '2026-09-28T08:00:00-03:00',
    });
  });
});
