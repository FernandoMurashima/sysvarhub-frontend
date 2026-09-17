import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { HubCaixaService } from './hub-caixa.service';

describe('HubCaixaService', () => {
  let service: HubCaixaService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(HubCaixaService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('status usa endpoint relativo correto', (done) => {
    service.status().subscribe((response) => {
      expect(response.aberto).toBeFalse();
      done();
    });

    const request = httpMock.expectOne('/api/terminal/caixa/status/');
    expect(request.request.method).toBe('GET');
    request.flush({ caixa: { id: 29, codigo: 'CX-BARRA', descricao: 'Caixa Loja Barra', ativo: true }, aberto: false, sessao: null });
  });

  it('abrir usa endpoint relativo correto e body string', (done) => {
    service.abrir('100.00').subscribe((sessao) => {
      expect(sessao.valorAbertura).toBe('100.00');
      done();
    });

    const request = httpMock.expectOne('/api/terminal/caixa/abrir/');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ valor_abertura: '100.00' });
    request.flush({
      uuid: 'sessao',
      status: 'ABERTO',
      valor_abertura: '100.00',
      aberto_em: '2026-09-13T12:00:00',
      fechado_em: null,
      caixa: { id: 29, codigo: 'CX-BARRA', descricao: 'Caixa Loja Barra', ativo: true },
      terminal_abertura: { uuid: 'terminal', codigo: 'PDV-01', nome: 'PDV 01' },
      operador_abertura: { usuario_id: 90, codigo: 'caixa.barra', nome: 'Juliana Rocha', tipo: 'Caixa', perfil: null },
      terminal_fechamento: null,
      operador_fechamento: null,
    });
  });

  it('fechar envia valor contado e observacao e mapeia resposta', (done) => {
    service.fechar('249.90', 'Conferencia final').subscribe((response) => {
      expect(response.status).toBe('ok');
      expect(response.sessao.status).toBe('FECHADO');
      expect(response.fechamento.valorEsperado).toBe('249.90');
      expect(response.fechamento.valorContado).toBe('249.90');
      expect(response.fechamento.diferenca).toBe('0.00');
      expect(response.fechamento.situacao).toBe('OK');
      expect(response.fechamento.resumo.dinheiro.esperado).toBe('249.90');
      done();
    });

    const request = httpMock.expectOne('/api/terminal/caixa/fechar/');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ valor_contado: '249.90', observacao: 'Conferencia final' });
    request.flush({
      status: 'ok',
      sessao: {
        uuid: 'sessao',
        status: 'FECHADO',
        valor_abertura: '100.00',
        aberto_em: '2026-09-13T12:00:00',
        fechado_em: '2026-09-13T13:00:00',
        caixa: { id: 29, codigo: 'CX-BARRA', descricao: 'Caixa Loja Barra', ativo: true },
        terminal_abertura: { uuid: 'terminal', codigo: 'PDV-01', nome: 'PDV 01' },
        operador_abertura: { usuario_id: 90, codigo: 'caixa.barra', nome: 'Juliana Rocha', tipo: 'Caixa', perfil: null },
        terminal_fechamento: null,
        operador_fechamento: null,
        valor_esperado_fechamento: '249.90',
        valor_contado_fechamento: '249.90',
        diferenca_fechamento: '0.00',
        situacao_fechamento: 'OK',
        observacao_fechamento: 'Conferencia final',
      },
      fechamento: {
        valor_esperado: '249.90',
        valor_contado: '249.90',
        diferenca: '0.00',
        situacao: 'OK',
        resumo: {
          sessao: {
            uuid: 'sessao',
            status: 'ABERTO',
            valor_abertura: '100.00',
            aberto_em: '2026-09-13T12:00:00',
            fechado_em: null,
            caixa: { id: 29, codigo: 'CX-BARRA', descricao: 'Caixa Loja Barra', ativo: true },
            terminal_abertura: { uuid: 'terminal', codigo: 'PDV-01', nome: 'PDV 01' },
            operador_abertura: { usuario_id: 90, codigo: 'caixa.barra', nome: 'Juliana Rocha', tipo: 'Caixa', perfil: null },
            terminal_fechamento: null,
            operador_fechamento: null,
          },
          vendas: { quantidade: 1, total: '249.90', valor_recebido: '249.90', troco: '0.00' },
          pagamentos: { formas: [], dinheiro_bruto: '249.90', troco: '0.00', dinheiro_liquido: '249.90' },
          movimentacoes: { despesas: { quantidade: 0, total: '0.00' }, sangrias: { quantidade: 0, total: '0.00' }, suprimentos: { quantidade: 0, total: '0.00' }, itens: [] },
          dinheiro: { valor_abertura: '0.00', vendas_dinheiro_bruto: '249.90', troco: '0.00', vendas_dinheiro_liquido: '249.90', suprimentos: '0.00', sangrias: '0.00', despesas: '0.00', esperado: '249.90' },
        },
      },
    });
  });
});
