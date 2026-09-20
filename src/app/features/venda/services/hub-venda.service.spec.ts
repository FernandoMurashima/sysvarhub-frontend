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
      expect(danfe.emitente.inscricaoEstadual).toBe('123456789');
      expect(danfe.documento.numero).toBe(10);
      expect(danfe.itens[0].valorLiquido).toBe('189.90');
      expect(danfe.totais.valorTotal).toBe('189.90');
      expect(danfe.protocolo?.numero).toBe('135260000000001');
      expect(danfe.qrCodeDataUri).toBe('data:image/svg+xml;base64,AAAA');
    });

    const request = httpMock.expectOne('/api/terminal/venda/venda-uuid/danfe-nfce/?via=CONSUMIDOR');
    expect(request.request.method).toBe('GET');
    request.flush({
      nfce_uuid: 'nfce-uuid',
      venda_uuid: 'venda-uuid',
      status: 'AUTORIZADA',
      via: 'CONSUMIDOR',
      via_texto: 'Via Consumidor',
      imprimivel: true,
      motivo_nao_imprimivel: '',
      ambiente: 'HOMOLOGACAO',
      homologacao: true,
      contingencia: false,
      emitente: { razao_social: 'Empresa Teste Ltda', nome_fantasia: 'Sysvar', cnpj: '00000000000123', ie: '123456789', endereco: 'Rua Teste, 1' },
      documento: {
        modelo: '65',
        serie: 7,
        numero: 10,
        emitida_em: '20/09/2026 10:00:00',
        emitida_em_iso: '2026-09-20T10:00:00-03:00',
        ambiente: '2',
        tipo_emissao: '1',
        chave_acesso: '35260900000000000123650070000000101000000010',
        chave_acesso_formatada: '3526 0900 0000 0000 1236 5007 0000 0001 0100 0000 010',
        url_consulta: 'https://sefaz.example.test',
      },
      consumidor: { identificado: false, tipo_documento: '', documento: '', nome: '' },
      itens: [{ numero: 1, codigo: '001', descricao: 'Produto', quantidade: '1.000', unidade: 'UN', valor_unitario: '199.90', valor_bruto: '199.90', desconto: '10.00', valor_liquido: '189.90' }],
      totais: { quantidade_itens: 1, vProd: '199.90', vDesc: '10.00', vNF: '189.90', vPIS: '0.00', vCOFINS: '0.00', vICMS: '0.00' },
      pagamentos: [{ tPag: '01', descricao: 'Dinheiro', valor: '189.90' }],
      troco: '0.00',
      mensagens: [],
      protocolo: { numero: '135260000000001', autorizada_em: '20/09/2026 10:00:05', codigo_retorno: '100', mensagem_retorno: 'Autorizado o uso da NF-e' },
      qr_code_payload: 'https://sefaz.example.test/qrcode',
      qr_code_data_uri: 'data:image/svg+xml;base64,AAAA',
    });
  });

  it('consulta beneficios de cliente para cashback e vale-troca', () => {
    service.consultarBeneficiosCliente('cliente-uuid').subscribe((response) => {
      expect(response.cashback.saldo).toBe('30.00');
      expect(response.vales_troca[0].documento).toBe('VT-1');
    });

    const request = httpMock.expectOne('/api/terminal/clientes/cliente-uuid/beneficios/');
    expect(request.request.method).toBe('GET');
    request.flush({
      cashback: {
        saldo: '30.00',
        saldo_retaguarda: '80.00',
        saldo_offline_utilizavel: '30.00',
        limite_uso_percentual: '50.0000',
        valor_minimo_uso: '1.00',
      },
      vales_troca: [{ documento: 'VT-1', saldo: '40.00', validade: null, utilizavel_offline: true }],
    });
  });

  it('consulta e finaliza devolucao tipada', () => {
    service.consultarDevolucao('venda-uuid').subscribe((response) => {
      expect(response.venda.itens[0].quantidade_disponivel).toBe(1);
    });
    const consulta = httpMock.expectOne('/api/terminal/devolucoes/vendas/?documento=venda-uuid');
    expect(consulta.request.method).toBe('GET');
    consulta.flush({
      venda: {
        uuid: 'venda-uuid',
        cliente: { id: 10, uuid: 'cliente-uuid', nome: 'Cliente' },
        total: '199.90',
        itens: [{ item_uuid: 'item-uuid', sku_id: 1, descricao: 'Produto', quantidade: 1, quantidade_devolvida: 0, quantidade_disponivel: 1, preco_unitario: '199.9000', total_item: '199.90' }],
      },
    });

    service.finalizarDevolucao('venda-uuid', [{ item_uuid: 'item-uuid', quantidade: 1 }], 'Troca').subscribe((response) => {
      expect(response.devolucao.vale_troca?.documento).toBe('VT-HUB');
    });
    const finalizar = httpMock.expectOne('/api/terminal/devolucoes/finalizar/');
    expect(finalizar.request.method).toBe('POST');
    expect(finalizar.request.body).toEqual({
      venda_uuid: 'venda-uuid',
      itens: [{ item_uuid: 'item-uuid', quantidade: 1 }],
      motivo: 'Troca',
    });
    finalizar.flush({
      devolucao: {
        uuid: 'dev-uuid',
        venda_uuid: 'venda-uuid',
        valor_total: '199.90',
        finalizada_em: '2026-09-20T10:00:00',
        vale_troca: { documento: 'VT-HUB', saldo: '199.90' },
      },
    });
  });
});
