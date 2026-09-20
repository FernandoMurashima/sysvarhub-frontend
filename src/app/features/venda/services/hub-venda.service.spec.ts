import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { HubVendaService } from './hub-venda.service';

describe('HubVendaService', () => {
  let service: HubVendaService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [HubVendaService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(HubVendaService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('consulta venda atual em URL relativa', () => {
    service.atual().subscribe();
    const request = httpMock.expectOne('/api/terminal/venda/atual/');

    expect(request.request.method).toBe('GET');
    request.flush({ venda: null });
  });

  it('adiciona item enviando somente sku_id e quantidade', () => {
    service.adicionarItem(10825, 1).subscribe();
    const request = httpMock.expectOne('/api/terminal/venda/item/');

    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ sku_id: 10825, quantidade: 1 });
    expect(request.request.body.preco).toBeUndefined();
    request.flush({ venda: null });
  });

  it('inicia venda com POST e body vazio', () => {
    service.iniciarVenda().subscribe();
    const request = httpMock.expectOne('/api/terminal/venda/iniciar/');

    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({});
    request.flush({ venda: null });
  });

  it('altera, remove e cancela venda', () => {
    service.alterarQuantidade('item', 2).subscribe();
    const patch = httpMock.expectOne('/api/terminal/venda/item/item/');
    expect(patch.request.body).toEqual({ quantidade: 2 });
    patch.flush({ venda: null });

    service.removerItem('item').subscribe();
    const remove = httpMock.expectOne('/api/terminal/venda/item/item/');
    expect(remove.request.method).toBe('DELETE');
    remove.flush({ venda: null });

    service.cancelar().subscribe();
    const cancelar = httpMock.expectOne('/api/terminal/venda/cancelar/');
    expect(cancelar.request.method).toBe('POST');
    cancelar.flush({ venda: null });
  });

  it('seleciona e remove cliente da venda', () => {
    service.selecionarCliente('cliente-uuid').subscribe((response) => expect(response.venda?.cliente?.clienteUuid).toBe('cliente-uuid'));
    const selecionar = httpMock.expectOne('/api/terminal/venda/cliente/');
    expect(selecionar.request.method).toBe('PUT');
    expect(selecionar.request.body).toEqual({ cliente_uuid: 'cliente-uuid' });
    selecionar.flush({
      venda: {
        uuid: 'venda',
        status: 'ABERTA',
        criada_em: '2026-09-14T10:00:00',
        subtotal: '0.00',
        desconto_itens: '0.00',
        desconto_geral: '0.00',
        total: '0.00',
        cliente: {
          cliente_uuid: 'cliente-uuid',
          retaguarda_id: null,
          tipo_pessoa: 'PF',
          documento: null,
          cliente_padrao: false,
          nome_cliente: 'Cliente Local',
        },
        operador_criacao: { usuario_id: 1, codigo: '001', nome: 'Operador', tipo: 'Caixa', perfil: null },
        itens: [],
        pagamentos: [],
      },
    });

    service.removerCliente().subscribe((response) => expect(response.venda).toBeNull());
    const remover = httpMock.expectOne('/api/terminal/venda/cliente/');
    expect(remover.request.method).toBe('DELETE');
    expect(remover.request.body).toBeNull();
    remover.flush({ venda: null });
  });

  it('seleciona e remove vendedor da venda', () => {
    service.selecionarVendedor(501).subscribe((response) => expect(response.venda?.vendedor?.id).toBe(501));
    const selecionar = httpMock.expectOne('/api/terminal/venda/vendedor/');
    expect(selecionar.request.method).toBe('PUT');
    expect(selecionar.request.body).toEqual({ vendedor_id: 501 });
    selecionar.flush({
      venda: {
        uuid: 'venda',
        status: 'ABERTA',
        criada_em: '2026-09-14T10:00:00',
        subtotal: '0.00',
        desconto_itens: '0.00',
        desconto_geral: '0.00',
        total: '0.00',
        cliente: null,
        vendedor: {
          id: 501,
          matricula: '000501',
          nome: 'Ana Vendedora',
          apelido: 'Ana',
          cargo: null,
          comissionado: true,
          comissao_percentual: '3.00',
        },
        operador_criacao: { usuario_id: 1, codigo: '001', nome: 'Operador', tipo: 'Caixa', perfil: null },
        itens: [],
        pagamentos: [],
      },
    });

    service.removerVendedor().subscribe();
    const remover = httpMock.expectOne('/api/terminal/venda/vendedor/');
    expect(remover.request.method).toBe('DELETE');
    remover.flush({ venda: null });
  });

  it('lista formas e opera pagamentos/finalizacao', () => {
    service.listarFormasPagamento().subscribe((response) => expect(response.formas[0].codigo).toBe('DIN'));
    const formas = httpMock.expectOne('/api/terminal/formas-pagamento/');
    expect(formas.request.method).toBe('GET');
    formas.flush({
      versao: 1,
      sincronizado_em: null,
      formas: [{
        id: 1,
        retaguarda_id: 10,
        codigo: 'DIN',
        descricao: 'Dinheiro',
        tipo: 'DINHEIRO',
        num_parcelas: 1,
        tef_habilitado: false,
        parcelas: [],
      }],
    });

    service.adicionarPagamento({
      vendaUuid: 'venda',
      operacaoUuid: 'op',
      formaPagamentoId: 1,
      valor: '199.90',
      autorizacao: '',
    }).subscribe();
    const pagamento = httpMock.expectOne('/api/terminal/venda/pagamento/');
    expect(pagamento.request.method).toBe('POST');
    expect(pagamento.request.body).toEqual({
      venda_uuid: 'venda',
      operacao_uuid: 'op',
      forma_pagamento_id: 1,
      valor: '199.90',
      autorizacao: '',
    });
    pagamento.flush({ venda: null });

    service.removerPagamento('pag').subscribe();
    const removerPagamento = httpMock.expectOne('/api/terminal/venda/pagamento/pag/');
    expect(removerPagamento.request.method).toBe('DELETE');
    removerPagamento.flush({ venda: null });
  });

  it('finaliza venda por uuid', () => {
    service.finalizarVenda('venda').subscribe();
    const request = httpMock.expectOne('/api/terminal/venda/finalizar/');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ venda_uuid: 'venda' });
    request.flush({ venda: null });
  });

  it('consulta DANFE NFC-e por venda e via', () => {
    service.obterDanfeNfce('venda-uuid', 'CONSUMIDOR').subscribe((danfe) => {
      expect(danfe.via).toBe('CONSUMIDOR');
      expect(danfe.emitente.razaoSocial).toBe('Empresa Teste Ltda');
      expect(danfe.qrCodeDataUri).toBe('data:image/png;base64,AAAA');
    });

    const request = httpMock.expectOne('/api/terminal/venda/venda-uuid/danfe-nfce/?via=CONSUMIDOR');
    expect(request.request.method).toBe('GET');
    request.flush({
      via: 'CONSUMIDOR',
      imprimivel: true,
      emitente: { razao_social: 'Empresa Teste Ltda', cnpj: '00000000000123' },
      nfce: { numero: 123, serie: 1, status: 'AUTORIZADA' },
      itens: [{ codigo: '001', descricao: 'Produto', quantidade: '1.000', unidade: 'UN', valor_unitario: '10.00', valor_total: '10.00' }],
      totais: { subtotal: '10.00', total: '10.00' },
      pagamentos: [{ descricao: 'Dinheiro', valor: '10.00' }],
      troco: '0.00',
      mensagens: [],
      qr_code_data_uri: 'data:image/png;base64,AAAA',
      chave_acesso: '35260900000000000123650010000001231000001234',
      url_consulta: 'https://sefaz.example.test',
    });
  });
});
