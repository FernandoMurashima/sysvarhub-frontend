import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { DanfeNfce } from '../../../../core/models/danfe-nfce.models';
import { ConsultaVendasPaginada, VendaConsultaDetalhe } from '../../../../core/models/venda.models';
import { operadorLoginResponseStub, terminalContextoStub } from '../../../../testing/terminal-test-data';
import { OperatorSessionService } from '../../../operador/services/operator-session.service';
import { CentralConnectivityService } from '../../../terminal/services/central-connectivity.service';
import { TerminalSessionService } from '../../../terminal/services/terminal-session.service';
import { HubVendaService } from '../../services/hub-venda.service';
import { ConsultaVendasPageComponent } from './consulta-vendas-page.component';

describe('ConsultaVendasPageComponent', () => {
  let fixture: ComponentFixture<ConsultaVendasPageComponent>;
  let service: jasmine.SpyObj<HubVendaService>;
  const centralStatus = signal<'ONLINE' | 'OFFLINE' | 'VERIFICANDO'>('OFFLINE');

  async function montar() {
    service = jasmine.createSpyObj<HubVendaService>('HubVendaService', [
      'listarVendas',
      'detalharVenda',
      'listarFormasPagamento',
      'obterDanfeNfce',
    ]);
    service.listarVendas.and.returnValue(of(listagemStub()));
    service.detalharVenda.and.returnValue(of(detalheStub()));
    service.listarFormasPagamento.and.returnValue(of({
      versao: 1,
      sincronizadoEm: null,
      prazos: [],
      formas: [{
        id: 1,
        retaguardaId: 10,
        codigo: 'DIN',
        descricao: 'Dinheiro',
        tipo: 'DINHEIRO',
        numParcelas: 1,
        permiteParcelamento: false,
        tefHabilitado: false,
        condicoesParcelamento: [],
        parcelas: [],
      }],
    }));
    service.obterDanfeNfce.and.returnValue(of(danfeStub()));

    await TestBed.configureTestingModule({
      imports: [ConsultaVendasPageComponent],
      providers: [
        provideRouter([]),
        { provide: HubVendaService, useValue: service },
        { provide: TerminalSessionService, useValue: { contexto: signal(terminalContextoStub).asReadonly() } },
        { provide: OperatorSessionService, useValue: { operador: signal(operadorLoginResponseStub.operador).asReadonly() } },
        {
          provide: CentralConnectivityService,
          useValue: {
            status: centralStatus.asReadonly(),
            startPolling: jasmine.createSpy('startPolling'),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ConsultaVendasPageComponent);
    fixture.detectChanges();
  }

  it('abre consultando hoje e renderiza venda, total e sincronizacao', async () => {
    await montar();

    const hoje = fixture.componentInstance.hoje;
    expect(service.listarVendas).toHaveBeenCalledWith(jasmine.objectContaining({
      dataIni: hoje,
      dataFim: hoje,
      status: 'FINALIZADA',
      page: 1,
      pageSize: 20,
    }));
    const texto = fixture.nativeElement.textContent;
    expect(texto).toContain('Consulta de Vendas');
    expect(texto).toContain('VE0050000002');
    expect(texto).toContain('100,00');
    expect(texto).toContain('Sincronizado');
    expect(texto).toContain('Central OFFLINE');
  });

  it('envia filtros, volta pagina para 1 e limpar retorna para hoje', async () => {
    await montar();
    const component = fixture.componentInstance;

    component.filtros.page = 3;
    component.filtros.dataIni = '2026-10-01';
    component.filtros.dataFim = '2026-10-09';
    component.filtros.documento = 'VE005';
    component.filtros.cliente = 'Maria';
    component.filtros.formaPagamento = 'DIN';
    component.aoAlterarFiltro();
    component.buscar();

    expect(component.filtros.page).toBe(1);
    expect(service.listarVendas).toHaveBeenCalledWith(jasmine.objectContaining({
      dataIni: '2026-10-01',
      dataFim: '2026-10-09',
      documento: 'VE005',
      cliente: 'Maria',
      formaPagamento: 'DIN',
      page: 1,
    }));

    component.limpar();
    expect(component.filtros.dataIni).toBe(component.hoje);
    expect(component.filtros.dataFim).toBe(component.hoje);
    expect(component.filtros.documento).toBe('');
    expect(component.filtros.page).toBe(1);
  });

  it('carrega detalhe com itens, pagamentos, parcelas, NFC-e, sincronizacao e DANFE', async () => {
    await montar();
    const venda = fixture.componentInstance.resposta!.results[0];

    fixture.componentInstance.selecionar(venda);
    fixture.detectChanges();

    expect(service.detalharVenda).toHaveBeenCalledWith('venda-uuid');
    const texto = fixture.nativeElement.textContent;
    expect(texto).toContain('Calça Jeans');
    expect(texto).toContain('DIN - Dinheiro');
    expect(texto).toContain('1x 0d');
    expect(texto).toContain('NFC-e');
    expect(texto).toContain('123456789');
    expect(texto).toContain('NFC-e atualizada');

    fixture.componentInstance.visualizarDanfe();
    expect(service.obterDanfeNfce).toHaveBeenCalledWith('venda-uuid', 'CONSUMIDOR');
  });
});

function listagemStub(): ConsultaVendasPaginada {
  return {
    count: 1,
    page: 1,
    pageSize: 20,
    totalPages: 1,
    results: [{
      vendaUuid: 'venda-uuid',
      documento: 'VE0050000002',
      status: 'FINALIZADA',
      finalizadaEm: '2026-10-09T10:00:00-03:00',
      total: '100.00',
      subtotal: '100.00',
      descontoGeral: '0.00',
      cliente: { nome: 'Maria Silva', documento: '12345678901', clienteUuid: 'cliente-uuid', retaguardaId: 10 },
      vendedor: { id: 77, retaguardaId: 77, matricula: 'V077', nome: 'Ana Vendedora', apelido: 'Ana' },
      terminal: { codigo: 'PDV-01', nome: 'PDV 01' },
      caixa: { codigo: 'CX-01', descricao: 'Caixa 01', nome: 'Caixa 01' },
      pagamentos: [{ codigo: 'DIN', descricao: 'Dinheiro', tipo: 'DINHEIRO', valor: '100.00' }],
      nfce: { numero: 123, serie: 1, status: 'AUTORIZADA' },
      sincronizacao: { status: 'SINCRONIZADO', ultimoErro: '', tentativas: 1, sincronizadoEm: '2026-10-09T10:01:00-03:00' },
    }],
  };
}

function detalheStub(): VendaConsultaDetalhe {
  return {
    ...listagemStub().results[0],
    criadaEm: '2026-10-09T09:55:00-03:00',
    valorRecebido: '100.00',
    troco: '0.00',
    hub: { hubUuid: 'hub-uuid', empresaId: 1, empresaNome: 'Empresa', lojaId: 2, lojaNome: 'Loja Barra', lojaApelido: 'Filial 1' },
    loja: { hubUuid: 'hub-uuid', empresaId: 1, empresaNome: 'Empresa', lojaId: 2, lojaNome: 'Loja Barra', lojaApelido: 'Filial 1' },
    operadorFinalizacao: { id: 99, codigo: 'caixa', nome: 'Juliana Rocha' },
    itens: [{
      itemUuid: 'item-uuid',
      ean: '789',
      referencia: 'REF',
      codigoItemRef: '001',
      descricao: 'Calça Jeans',
      cor: 'Jeans',
      tamanho: '34',
      quantidade: 1,
      precoUnitario: '100.0000',
      desconto: '0.00',
      totalItem: '100.00',
      promocao: null,
    }],
    pagamentos: [{
      pagamentoUuid: 'pagamento-uuid',
      codigo: 'DIN',
      descricao: 'Dinheiro',
      tipo: 'DINHEIRO',
      valor: '100.00',
      autorizacao: '',
      prazo: { codigo: '', descricao: '', retaguardaId: null },
      numParcelas: 1,
      taxaPercentual: '0.0000',
      taxaFixa: '0.00',
      parcelas: [{ ordem: 1, dias: 0, percentual: '100.000000', valorFixo: null }],
      valeTroca: null,
    }],
    nfce: {
      nfceUuid: 'nfce-uuid',
      modelo: '65',
      serie: 1,
      numero: 123,
      status: 'AUTORIZADA',
      chaveAcesso: '123456789',
      protocolo: 'PROTO123',
      tipoEmissao: '1',
      retornoCodigo: '100',
      retornoMensagem: 'Autorizado',
      emitidaEm: '2026-10-09T10:00:00-03:00',
      autorizadaEm: '2026-10-09T10:00:05-03:00',
    },
    sincronizacao: {
      vendaFinalizada: { status: 'SINCRONIZADO', ultimoErro: '', tentativas: 1, sincronizadoEm: '2026-10-09T10:01:00-03:00' },
      nfceAtualizada: { status: 'PENDENTE', ultimoErro: '', tentativas: 0, sincronizadoEm: null },
    },
  };
}

function danfeStub(): DanfeNfce {
  return {
    nfceUuid: 'nfce-uuid',
    vendaUuid: 'venda-uuid',
    status: 'AUTORIZADA',
    via: 'CONSUMIDOR',
    viaTexto: 'Via consumidor',
    imprimivel: true,
    motivoNaoImprimivel: '',
    ambiente: 'HOMOLOGACAO',
    homologacao: true,
    contingencia: false,
    emitente: { razaoSocial: 'Empresa', nomeFantasia: 'Sysvar', cnpj: '000', inscricaoEstadual: '123', endereco: 'Rua 1' },
    documento: { modelo: '65', serie: 1, numero: 123, emitidaEm: '09/10/2026 10:00', emitidaEmIso: '2026-10-09T10:00:00-03:00', ambiente: '2', tipoEmissao: '1', chaveAcesso: '123', chaveAcessoFormatada: '123', urlConsulta: '' },
    consumidor: { identificado: false, tipoDocumento: '', documento: '', nome: '' },
    itens: [],
    totais: { quantidadeItens: 0, valorProdutos: '0.00', desconto: '0.00', valorTotal: '0.00', pis: '0.00', cofins: '0.00', icms: '0.00' },
    pagamentos: [],
    troco: '0.00',
    mensagens: [],
    protocolo: null,
    qrCodePayload: '',
    qrCodeDataUri: '',
  };
}
