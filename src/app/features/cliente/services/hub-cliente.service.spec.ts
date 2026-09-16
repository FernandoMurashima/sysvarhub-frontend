import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { HubClienteService } from './hub-cliente.service';

describe('HubClienteService', () => {
  let service: HubClienteService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [HubClienteService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(HubClienteService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('consulta clientes sem q', () => {
    service.listar().subscribe((response) => expect(response.clientes.length).toBe(0));
    const request = httpMock.expectOne('/api/terminal/clientes/');

    expect(request.request.method).toBe('GET');
    expect(request.request.params.has('q')).toBeFalse();
    request.flush({ clientes_versao: 1, clientes_sincronizado_em: null, q: '', total: 0, limit: 50, clientes: [] });
  });

  it('consulta clientes com q encoded e mapeia resposta', () => {
    service.listar(' Maria Silva ').subscribe((response) => {
      expect(response.q).toBe('Maria Silva');
      expect(response.clientes[0].nomeCliente).toBe('Maria Silva');
    });
    const request = httpMock.expectOne((req) => req.url === '/api/terminal/clientes/' && req.params.get('q') === 'Maria Silva');

    expect(request.request.method).toBe('GET');
    request.flush({
      clientes_versao: 1,
      clientes_sincronizado_em: '2026-09-14T10:00:00',
      q: 'Maria Silva',
      total: 1,
      limit: 50,
      clientes: [{
        cliente_uuid: 'cliente-uuid',
        retaguarda_id: 123,
        origem: 'RETAGUARDA',
        tipo_pessoa: 'PF',
        documento: '12345678901',
        cliente_padrao: false,
        nome_cliente: 'Maria Silva',
        apelido: '',
        telefone1: '',
        email: '',
        cidade: '',
        estado: '',
        bloqueio: false,
        motivo_bloqueio: null,
        ativo: true,
        presente_retaguarda: true,
      }],
    });
  });

  it('faz POST correto para cadastrar cliente com body permitido e mapeia resposta 201', () => {
    const payload = {
      tipo_pessoa: 'PF' as const,
      documento: '12345678901',
      nome_cliente: 'Maria Silva',
      telefone1: '21999990000',
      estado: 'RJ',
    };

    service.cadastrar(payload).subscribe((cliente) => {
      expect(cliente.clienteUuid).toBe('novo-cliente');
      expect(cliente.nomeCliente).toBe('Maria Silva');
      expect(cliente.pendenteSincronizacao).toBeTrue();
    });

    const request = httpMock.expectOne('/api/terminal/clientes/');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(payload);
    expect(Object.keys(request.request.body).sort()).toEqual(['documento', 'estado', 'nome_cliente', 'telefone1', 'tipo_pessoa']);
    request.flush({
      cliente: {
        cliente_uuid: 'novo-cliente',
        retaguarda_id: null,
        origem: 'LOCAL',
        tipo_pessoa: 'PF',
        documento: '12345678901',
        cliente_padrao: false,
        nome_cliente: 'Maria Silva',
        apelido: '',
        telefone1: '21999990000',
        telefone2: '',
        email: '',
        aniversario: null,
        endereco: '',
        numero: '',
        complemento: '',
        cep: '',
        bairro: '',
        cidade: '',
        estado: 'RJ',
        bloqueio: false,
        motivo_bloqueio: null,
        ativo: true,
        presente_retaguarda: false,
        pendente_sincronizacao: true,
      },
    }, { status: 201, statusText: 'Created' });
  });
});
