import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { HubResumoCaixaService } from './hub-resumo-caixa.service';

describe('HubResumoCaixaService', () => {
  let service: HubResumoCaixaService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(HubResumoCaixaService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('consulta resumo local com GET e mapeia o contrato', (done) => {
    service.obter().subscribe((resumo) => {
      expect(resumo.sessao.valorAbertura).toBe('100.00');
      expect(resumo.vendas.valorRecebido).toBe('600.00');
      expect(resumo.pagamentos.dinheiroBruto).toBe('300.00');
      expect(resumo.movimentacoes.itens[0].ocorridoEm).toBe('2026-09-17T10:00:00');
      expect(resumo.dinheiro.vendasDinheiroLiquido).toBe('299.70');
      done();
    });

    const request = httpMock.expectOne('/api/terminal/caixa/resumo/');
    expect(request.request.method).toBe('GET');
    request.flush({
      sessao: {
        uuid: 'sessao',
        status: 'ABERTO',
        valor_abertura: '100.00',
        aberto_em: '2026-09-17T09:00:00',
        fechado_em: null,
        caixa: { id: 29, codigo: 'CX-01', descricao: 'Caixa 01', ativo: true },
        terminal_abertura: { uuid: 'terminal', codigo: 'PDV-01', nome: 'PDV 01' },
        operador_abertura: { usuario_id: 99, codigo: '001', nome: 'Operador', tipo: 'Caixa', perfil: null },
        terminal_fechamento: null,
        operador_fechamento: null,
      },
      vendas: { quantidade: 3, total: '599.70', valor_recebido: '600.00', troco: '0.30' },
      pagamentos: {
        formas: [{ id: 1, codigo: 'DIN', descricao: 'Dinheiro', tipo: 'DINHEIRO', quantidade: 2, valor: '300.00' }],
        dinheiro_bruto: '300.00',
        troco: '0.30',
        dinheiro_liquido: '299.70',
      },
      movimentacoes: {
        despesas: { quantidade: 1, total: '10.00' },
        sangrias: { quantidade: 1, total: '20.00' },
        suprimentos: { quantidade: 1, total: '30.00' },
        itens: [{
          uuid: 'mov-1',
          tipo: 'SANGRIA',
          status: 'EFETIVA',
          valor: '20.00',
          documento: 'SANG-1',
          historico: 'Retirada',
          ocorrido_em: '2026-09-17T10:00:00',
          caixa: { id: 29, codigo: 'CX-01', descricao: 'Caixa 01', ativo: true },
          sessao_caixa_uuid: 'sessao',
          terminal: { uuid: 'terminal', codigo: 'PDV-01', nome: 'PDV 01' },
          operador: { usuario_id: 99, codigo: '001', nome: 'Operador', tipo: 'Caixa', perfil: null },
          tipo_despesa: null,
        }],
      },
      dinheiro: {
        valor_abertura: '100.00',
        vendas_dinheiro_bruto: '300.00',
        troco: '0.30',
        vendas_dinheiro_liquido: '299.70',
        suprimentos: '30.00',
        sangrias: '20.00',
        despesas: '10.00',
        esperado: '399.70',
      },
    });
  });
});
