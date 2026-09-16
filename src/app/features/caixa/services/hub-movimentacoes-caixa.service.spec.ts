import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { HubMovimentacoesCaixaService } from './hub-movimentacoes-caixa.service';

describe('HubMovimentacoesCaixaService', () => {
  let service: HubMovimentacoesCaixaService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(HubMovimentacoesCaixaService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('registra despesa enviando tipo_despesa_id canonico e valor string', () => {
    service.registrar({
      tipo: 'DESPESA',
      valor: '25.90',
      tipo_despesa_id: 123,
      documento: 'NF-123',
      historico: 'Compra emergencial',
    }).subscribe((movimentacao) => {
      expect(movimentacao.tipo).toBe('DESPESA');
      expect(movimentacao.valor).toBe('25.90');
      expect(movimentacao.tipoDespesa?.id).toBe(123);
    });

    const request = httpMock.expectOne('/api/terminal/caixa/movimentacoes/');
    expect(request.request.method).toBe('POST');
    expect(request.request.body.valor).toBe('25.90');
    expect(request.request.body.tipo_despesa_id).toBe(123);
    request.flush(responseApi('DESPESA'));
  });

  it('registra sangria sem tipo_despesa_id', () => {
    service.registrar({ tipo: 'SANGRIA', valor: '100.00', documento: '', historico: 'Retirada' }).subscribe();

    const request = httpMock.expectOne('/api/terminal/caixa/movimentacoes/');
    expect(request.request.body.tipo).toBe('SANGRIA');
    expect(request.request.body.tipo_despesa_id).toBeUndefined();
    request.flush(responseApi('SANGRIA', null));
  });

  it('registra suprimento sem tipo_despesa_id', () => {
    service.registrar({ tipo: 'SUPRIMENTO', valor: '50.00', documento: '', historico: 'Reforço' }).subscribe();

    const request = httpMock.expectOne('/api/terminal/caixa/movimentacoes/');
    expect(request.request.body.tipo).toBe('SUPRIMENTO');
    expect(request.request.body.tipo_despesa_id).toBeUndefined();
    request.flush(responseApi('SUPRIMENTO', null));
  });

  it('lista movimentacoes do caixa aberto', () => {
    service.listar().subscribe((response) => {
      expect(response.sessaoCaixaUuid).toBe('22222222-2222-4222-8222-222222222222');
      expect(response.total).toBe(1);
      expect(response.movimentacoes[0].tipo).toBe('DESPESA');
    });

    const request = httpMock.expectOne('/api/terminal/caixa/movimentacoes/');
    expect(request.request.method).toBe('GET');
    request.flush({
      sessao_caixa_uuid: '22222222-2222-4222-8222-222222222222',
      total: 1,
      movimentacoes: [responseApi('DESPESA').movimentacao],
    });
  });
});

function responseApi(tipo: 'DESPESA' | 'SANGRIA' | 'SUPRIMENTO', tipoDespesa: unknown = tipoDespesaApi()) {
  return {
    movimentacao: {
      uuid: '11111111-1111-4111-8111-111111111111',
      tipo,
      status: 'EFETIVA',
      valor: tipo === 'DESPESA' ? '25.90' : '100.00',
      documento: 'DOC',
      historico: 'Histórico',
      ocorrido_em: '2026-09-16T10:00:00',
      caixa: { id: 29, codigo: 'CX', descricao: 'Caixa', ativo: true },
      sessao_caixa_uuid: '22222222-2222-4222-8222-222222222222',
      terminal: { uuid: '33333333-3333-4333-8333-333333333333', codigo: 'PDV-01', nome: 'PDV 01' },
      operador: { usuario_id: 1, codigo: '001', nome: 'Operador', tipo: 'VENDEDOR', perfil: null },
      tipo_despesa: tipoDespesa,
    },
  };
}

function tipoDespesaApi() {
  return {
    id: 123,
    codigo: 'LAN',
    descricao: 'Lanche',
    exige_documento: false,
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
  };
}
