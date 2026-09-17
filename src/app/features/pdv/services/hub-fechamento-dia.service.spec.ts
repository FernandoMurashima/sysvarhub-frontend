import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { HubFechamentoDiaService } from './hub-fechamento-dia.service';

describe('HubFechamentoDiaService', () => {
  let service: HubFechamentoDiaService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [HubFechamentoDiaService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(HubFechamentoDiaService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('obtem previa no endpoint local e mapeia snake_case para camelCase', (done) => {
    service.obterPrevia('2026-09-17').subscribe((preview) => {
      expect(preview.dataOperacional).toBe('2026-09-17');
      expect(preview.vendas.total).toBe('100.00');
      expect(preview.caixas.valorEsperado).toBe('90.00');
      expect(preview.movimentacoes.suprimentos).toBe('5.00');
      expect(preview.formasPagamento[0].valorSistema).toBe('100.00');
      expect(preview.formasPagamento[0].detalhes[0].retaguardaFormaPagamentoId).toBe(1);
      done();
    });

    const request = httpMock.expectOne('/api/terminal/fechamento-dia/?data=2026-09-17');
    expect(request.request.method).toBe('GET');
    request.flush({
      data_operacional: '2026-09-17',
      fechado: false,
      vendas: { quantidade: 1, total: '100.00', troco: '0.00' },
      formas_pagamento: [{
        tipo: 'PIX',
        descricao: 'PIX',
        quantidade: 1,
        valor_sistema: '100.00',
        detalhes: [{
          retaguarda_forma_pagamento_id: 1,
          codigo: 'PIX',
          descricao: 'Pix Loja',
          tipo: 'PIX',
          adquirente: null,
          quantidade: 1,
          valor: '100.00',
        }],
      }],
      caixas: { sessoes: 1, abertos: 0, fechados: 1, valor_esperado: '90.00', valor_contado: '90.00', diferenca: '0.00' },
      movimentacoes: { despesas: '1.00', sangrias: '2.00', suprimentos: '5.00' },
      consistencia: { ok: true, total_vendas: '100.00', total_formas: '100.00', diferenca: '0.00' },
      pode_fechar: true,
      impedimentos: [],
    });
  });

  it('fecha dia no endpoint local com payload snake_case', (done) => {
    service.fechar({
      dataOperacional: '2026-09-17',
      observacao: 'Conferido',
      formasPagamento: [{ tipo: 'PIX', valorConferido: '100.00' }],
    }).subscribe((fechamento) => {
      expect(fechamento.uuid).toBe('fechamento-uuid');
      expect(fechamento.totalConferido).toBe('100.00');
      expect(fechamento.formasPagamento[0].valorConferido).toBe('100.00');
      done();
    });

    const request = httpMock.expectOne('/api/terminal/fechamento-dia/');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      data_operacional: '2026-09-17',
      observacao: 'Conferido',
      formas_pagamento: [{ tipo: 'PIX', valor_conferido: '100.00' }],
    });
    request.flush({
      status: 'ok',
      fechamento: {
        uuid: 'fechamento-uuid',
        data_operacional: '2026-09-17',
        quantidade_vendas: 1,
        total_vendas: '100.00',
        total_sistema: '100.00',
        total_conferido: '100.00',
        diferenca_total: '0.00',
        situacao: 'OK',
        operador_fechamento: { usuario_id: 99, codigo: 'caixa', nome: 'Caixa', tipo: 'Caixa', perfil: null },
        terminal_fechamento: { uuid: 'terminal-uuid', codigo: 'PDV-01', nome: 'PDV 01' },
        fechado_em: '2026-09-17T20:00:00',
        observacao: 'Conferido',
        formas_pagamento: [{
          tipo: 'PIX',
          descricao: 'PIX',
          quantidade: 1,
          valor_sistema: '100.00',
          valor_conferido: '100.00',
          diferenca: '0.00',
          situacao: 'OK',
          detalhes: [],
        }],
      },
    });
  });
});
