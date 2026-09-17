import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { Subject, of, throwError } from 'rxjs';

import { CaixaFechamentoResumoSnapshot, SessaoCaixaHubResumo } from '../../../../core/models/caixa.models';
import { ClienteHubResumo } from '../../../../core/models/cliente.models';
import { ResumoCaixa } from '../../../../core/models/resumo-caixa.models';
import { VendedorHubResumo } from '../../../../core/models/vendedor.models';
import { CaixaSessionService } from '../../../caixa/services/caixa-session.service';
import { HubMovimentacoesCaixaService } from '../../../caixa/services/hub-movimentacoes-caixa.service';
import { HubResumoCaixaService } from '../../../caixa/services/hub-resumo-caixa.service';
import { HubTiposDespesaPdvService } from '../../../caixa/services/hub-tipos-despesa-pdv.service';
import { ClienteSessionExpiredError, ClienteSessionService } from '../../../cliente/services/cliente-session.service';
import { OperatorSessionService } from '../../../operador/services/operator-session.service';
import { VendaSessionService } from '../../../venda/services/venda-session.service';
import { clientePreselecionadoStub, sessaoCaixaAbertaStub, vendedorStub, vendaAbertaStub } from '../../../../testing/terminal-test-data';
import { VendedorSessionExpiredError, VendedorSessionService } from '../../../vendedor/services/vendedor-session.service';
import { PdvCatalogoConsulta, PdvProdutoConsulta } from '../../models/pdv-produto-consulta.model';
import { PdvHubFacade } from '../../services/pdv-hub.facade';
import { PdvPageComponent } from './pdv-page.component';

const produtoVendavel: PdvProdutoConsulta = {
  produtoId: 2050,
  skuId: 10825,
  tipoProduto: '1',
  referencia: '27-01-01001',
  codigo: '7892701000013',
  ean13: '7892701000013',
  codigoItemRef: '00001',
  descricao: 'Calça Jeans Reta Aurora',
  descricaoReduzida: 'Calça Jeans Reta Aurora',
  cor: 'Jeans',
  tamanho: '34',
  unidade: 'UN',
  preco: '199.9000',
  precoPromocional: null,
  precoVenda: '199.9000',
  estoqueFisico: '4.000',
  reserva: '0.000',
  estoqueDisponivel: '4.000',
  vendavel: true,
  motivosBloqueio: [],
};

const produtoSemEstoque: PdvProdutoConsulta = {
  ...produtoVendavel,
  skuId: 10826,
  codigo: '00002',
  ean13: null,
  estoqueFisico: '0.000',
  estoqueDisponivel: '0.000',
  vendavel: false,
  motivosBloqueio: ['SEM_ESTOQUE'],
};

const produtoSemPreco: PdvProdutoConsulta = {
  ...produtoVendavel,
  skuId: 10827,
  codigo: '00003',
  preco: null,
  precoVenda: null,
  vendavel: false,
  motivosBloqueio: ['SEM_PRECO'],
};

const clienteAtivo: ClienteHubResumo = {
  clienteUuid: 'cliente-uuid',
  retaguardaId: 123,
  origem: 'RETAGUARDA',
  tipoPessoa: 'PF',
  documento: '12345678901',
  clientePadrao: false,
  nomeCliente: 'Maria Silva',
  apelido: '',
  telefone1: '21999990000',
  telefone2: '',
  email: 'maria@example.com',
  aniversario: null,
  endereco: '',
  numero: '',
  complemento: '',
  cep: '',
  bairro: '',
  cidade: 'Rio de Janeiro',
  estado: 'RJ',
  bloqueio: false,
  motivoBloqueio: null,
  ativo: true,
  presenteRetaguarda: true,
  pendenteSincronizacao: false,
};

const resumoCaixaStub: ResumoCaixa = {
  sessao: {
    uuid: 'sessao-caixa-uuid',
    status: 'ABERTO',
    valorAbertura: '100.00',
    abertoEm: '2026-09-17T09:00:00',
    fechadoEm: null,
    caixa: { id: 29, codigo: 'CX-01', descricao: 'Caixa 01', ativo: true },
    terminalAbertura: { uuid: 'terminal-uuid', codigo: 'PDV-01', nome: 'PDV 01' },
    operadorAbertura: { usuarioId: 99, codigo: 'caixa.barra', nome: 'Juliana Rocha', tipo: 'Caixa', perfil: null },
    terminalFechamento: null,
    operadorFechamento: null,
  },
  vendas: {
    quantidade: 3,
    total: '599.70',
    valorRecebido: '600.00',
    troco: '0.30',
  },
  pagamentos: {
    formas: [
      { id: 1, codigo: 'DIN', descricao: 'Dinheiro', tipo: 'DINHEIRO', quantidade: 2, valor: '300.00' },
      { id: 2, codigo: 'PIX', descricao: 'Pix', tipo: 'PIX', quantidade: 1, valor: '199.90' },
      { id: 3, codigo: 'VIS', descricao: 'Visa', tipo: 'CARTAO', quantidade: 1, valor: '100.00' },
    ],
    dinheiroBruto: '300.00',
    troco: '0.30',
    dinheiroLiquido: '299.70',
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
      ocorridoEm: '2026-09-17T10:00:00',
      caixa: { id: 29, codigo: 'CX-01', descricao: 'Caixa 01', ativo: true },
      sessaoCaixaUuid: 'sessao-caixa-uuid',
      terminal: { uuid: 'terminal-uuid', codigo: 'PDV-01', nome: 'PDV 01' },
      operador: { usuarioId: 99, codigo: 'caixa.barra', nome: 'Juliana Rocha', tipo: 'Caixa', perfil: null },
      tipoDespesa: null,
    }],
  },
  dinheiro: {
    valorAbertura: '100.00',
    vendasDinheiroBruto: '300.00',
    troco: '0.30',
    vendasDinheiroLiquido: '299.70',
    suprimentos: '30.00',
    sangrias: '20.00',
    despesas: '10.00',
    esperado: '399.70',
  },
};

const fechamentoResumoSnapshotStub: CaixaFechamentoResumoSnapshot = {
  valorAbertura: '100.00',
  quantidadeVendas: 3,
  totalVendas: '599.70',
  valorRecebido: '600.00',
  troco: '0.30',
  formasPagamento: [
    { id: 1, codigo: 'DIN', descricao: 'Dinheiro', tipo: 'DINHEIRO', quantidade: 2, valor: '300.00' },
    { id: 2, codigo: 'PIX', descricao: 'Pix', tipo: 'PIX', quantidade: 1, valor: '199.90' },
  ],
  dinheiroBruto: '300.00',
  dinheiroLiquido: '299.70',
  despesas: '10.00',
  sangrias: '20.00',
  suprimentos: '30.00',
  dinheiroEsperado: '399.70',
};

@Component({
  standalone: true,
  template: '',
})
class EmptyRouteComponent {}

describe('PdvPageComponent', () => {
  let fixture: ComponentFixture<PdvPageComponent>;
  let facade: jasmine.SpyObj<PdvHubFacade>;
  let operatorSession: jasmine.SpyObj<OperatorSessionService>;
  let clienteSession: jasmine.SpyObj<ClienteSessionService>;
  let vendedorSession: jasmine.SpyObj<VendedorSessionService>;
  let caixaSession: jasmine.SpyObj<CaixaSessionService>;
  let tiposDespesaService: jasmine.SpyObj<HubTiposDespesaPdvService>;
  let movimentacoesCaixaService: jasmine.SpyObj<HubMovimentacoesCaixaService>;
  let resumoCaixaService: jasmine.SpyObj<HubResumoCaixaService>;
  let vendaSession: jasmine.SpyObj<VendaSessionService>;
  let caixaStatusSignal = signal<'inicializando' | 'fechado' | 'aberto' | 'erro'>('aberto');
  let sessaoCaixaSignal = signal<SessaoCaixaHubResumo | null>(sessaoCaixaAbertaStub);
  let vendaSignal = signal(vendaAbertaStub.venda);
  let clientePreselecionadoSignal = signal(null as typeof clientePreselecionadoStub | null);
  let vendedorPreselecionadoSignal = signal(null as VendedorHubResumo | null);
  let vendaStatusSignal = signal<'inicializando' | 'sem-venda' | 'aberta' | 'erro'>('aberta');
  let vendaLoadingSignal = signal(false);
  let router: Router;

  function catalogo(itens: PdvProdutoConsulta[]): PdvCatalogoConsulta {
    return {
      catalogoVersao: 1,
      catalogoSincronizadoEm: '2026-09-13T10:01:00',
      tabelaPrecoCodigo: 'PADRAO',
      tabelaPrecoNome: 'Tabela Padrão',
      q: '7892701000013',
      total: itens.length,
      limit: 40,
      itens,
    };
  }

  function textoClienteAtual(): string {
    return fixture.nativeElement.querySelector('.current-client')?.textContent || '';
  }

  beforeEach(async () => {
    facade = jasmine.createSpyObj<PdvHubFacade>('PdvHubFacade', ['buscarCatalogo'], {
      loja: signal('Filial 1').asReadonly(),
      caixa: signal('Caixa 01').asReadonly(),
      terminal: signal('PDV-01').asReadonly(),
      empresa: signal('Empresa Teste Ltda').asReadonly(),
    });
    facade.buscarCatalogo.and.returnValue(of(catalogo([produtoVendavel])));
    operatorSession = jasmine.createSpyObj<OperatorSessionService>('OperatorSessionService', ['logout', 'invalidarSessao'], {
      operador: signal({
        usuarioId: 99,
        codigo: 'caixa.barra',
        nome: 'Juliana Rocha',
        tipo: 'Caixa',
        perfil: null,
      }).asReadonly(),
    });
    operatorSession.logout.and.returnValue(of(true));
    clienteSession = jasmine.createSpyObj<ClienteSessionService>('ClienteSessionService', ['listar', 'cadastrar']);
    clienteSession.listar.and.returnValue(of({
      clientesVersao: 1,
      clientesSincronizadoEm: '2026-09-14T10:00:00',
      q: '',
      total: 1,
      limit: 50,
      clientes: [clienteAtivo],
    }));
    clienteSession.cadastrar.and.returnValue(of({ ...clienteAtivo, clienteUuid: 'novo-cliente', nomeCliente: 'Cliente Novo' }));
    vendedorSession = jasmine.createSpyObj<VendedorSessionService>('VendedorSessionService', ['listar']);
    vendedorSession.listar.and.returnValue(of({
      vendedoresVersao: 1,
      vendedoresSincronizadoEm: '2026-09-16T10:00:00',
      q: '',
      total: 1,
      limit: 50,
      vendedores: [vendedorStub],
    }));
    caixaStatusSignal = signal<'inicializando' | 'fechado' | 'aberto' | 'erro'>('aberto');
    sessaoCaixaSignal = signal(sessaoCaixaAbertaStub);
    caixaSession = jasmine.createSpyObj<CaixaSessionService>('CaixaSessionService', ['bootstrap', 'abrir', 'fechar'], {
      status: caixaStatusSignal.asReadonly(),
      sessao: sessaoCaixaSignal.asReadonly(),
    });
    caixaSession.bootstrap.and.returnValue(of(true));
    caixaSession.abrir.and.returnValue(of({ ok: true }));
    caixaSession.fechar.and.returnValue(of({
      ok: true,
      sessao: { ...sessaoCaixaAbertaStub, status: 'FECHADO', valorEsperadoFechamento: '399.70', valorContadoFechamento: '399.70', diferencaFechamento: '0.00', situacaoFechamento: 'OK' },
      fechamento: { valorEsperado: '399.70', valorContado: '399.70', diferenca: '0.00', situacao: 'OK', resumo: fechamentoResumoSnapshotStub },
    }));
    tiposDespesaService = jasmine.createSpyObj<HubTiposDespesaPdvService>('HubTiposDespesaPdvService', ['listar']);
    tiposDespesaService.listar.and.returnValue(of({
      tiposDespesaPdvVersao: 1,
      tiposDespesaPdvSincronizadoEm: '2026-09-16T10:00:00',
      total: 1,
      tipos: [{
        id: 123,
        codigo: 'LAN',
        descricao: 'Lanche',
        exigeDocumento: false,
        natureza: {
          id: 456,
          codigo: '3301',
          descricao: 'Lanche',
          categoriaPrincipal: 'Loja',
          subcategoria: 'Equipe',
          tipo: 'DESPESA',
          status: 'ATIVO',
          tipoNatureza: 'DEBITO',
          naturezaOperacao: 'DESPESA',
          categoriaGerencial: 'Operacional',
          movimentaFinanceiro: true,
          entraDre: true,
        },
      }],
    }));
    movimentacoesCaixaService = jasmine.createSpyObj<HubMovimentacoesCaixaService>('HubMovimentacoesCaixaService', ['registrar']);
    movimentacoesCaixaService.registrar.and.returnValue(of({
      uuid: 'mov-uuid',
      tipo: 'SANGRIA',
      status: 'EFETIVA',
      valor: '10.00',
      documento: 'SANG-1',
      historico: 'Sangria PDV',
      ocorridoEm: '2026-09-16T10:00:00',
      caixa: { id: 29, codigo: 'CX', descricao: 'Caixa', ativo: true },
      sessaoCaixaUuid: 'sessao-caixa',
      terminal: { uuid: 'terminal-uuid', codigo: 'PDV-01', nome: 'PDV 01' },
      operador: { usuarioId: 99, codigo: 'caixa.barra', nome: 'Juliana Rocha', tipo: 'Caixa', perfil: null },
      tipoDespesa: null,
    }));
    resumoCaixaService = jasmine.createSpyObj<HubResumoCaixaService>('HubResumoCaixaService', ['obter']);
    resumoCaixaService.obter.and.returnValue(of(resumoCaixaStub));
    vendaSignal = signal(vendaAbertaStub.venda);
    clientePreselecionadoSignal = signal(null as typeof clientePreselecionadoStub | null);
    vendedorPreselecionadoSignal = signal(null as VendedorHubResumo | null);
    vendaStatusSignal = signal<'inicializando' | 'sem-venda' | 'aberta' | 'erro'>('aberta');
    vendaLoadingSignal = signal(false);
    vendaSession = jasmine.createSpyObj<VendaSessionService>('VendaSessionService', ['bootstrap', 'iniciarVenda', 'adicionarItem', 'alterarQuantidade', 'removerItem', 'cancelarVenda', 'limparEstado', 'listarFormasPagamento', 'adicionarPagamento', 'removerPagamento', 'finalizarVenda', 'selecionarCliente', 'removerCliente', 'selecionarVendedor', 'removerVendedor'], {
      venda: vendaSignal.asReadonly(),
      clientePreselecionado: clientePreselecionadoSignal.asReadonly(),
      vendedorPreselecionado: vendedorPreselecionadoSignal.asReadonly(),
      status: vendaStatusSignal.asReadonly(),
      loadingOperacao: vendaLoadingSignal.asReadonly(),
    });
    vendaSession.bootstrap.and.returnValue(of(true));
    vendaSession.iniciarVenda.and.returnValue(of({ ok: true }));
    vendaSession.adicionarItem.and.returnValue(of({ ok: true }));
    vendaSession.alterarQuantidade.and.returnValue(of({ ok: true }));
    vendaSession.removerItem.and.returnValue(of({ ok: true }));
    vendaSession.cancelarVenda.and.returnValue(of({ ok: true }));
    vendaSession.listarFormasPagamento.and.returnValue(of({ versao: 1, sincronizadoEm: null, formas: [] }));
    vendaSession.adicionarPagamento.and.returnValue(of({ ok: true }));
    vendaSession.removerPagamento.and.returnValue(of({ ok: true }));
    vendaSession.finalizarVenda.and.returnValue(of({ ok: true }));
    vendaSession.selecionarCliente.and.returnValue(of({ ok: true }));
    vendaSession.removerCliente.and.returnValue(of({ ok: true }));
    vendaSession.selecionarVendedor.and.returnValue(of({ ok: true }));
    vendaSession.removerVendedor.and.returnValue(of({ ok: true }));

    await TestBed.configureTestingModule({
      imports: [PdvPageComponent, RouterTestingModule.withRoutes([{ path: 'operador', component: EmptyRouteComponent }])],
      providers: [
        { provide: PdvHubFacade, useValue: facade },
        { provide: OperatorSessionService, useValue: operatorSession },
        { provide: ClienteSessionService, useValue: clienteSession },
        { provide: VendedorSessionService, useValue: vendedorSession },
        { provide: CaixaSessionService, useValue: caixaSession },
        { provide: HubTiposDespesaPdvService, useValue: tiposDespesaService },
        { provide: HubMovimentacoesCaixaService, useValue: movimentacoesCaixaService },
        { provide: HubResumoCaixaService, useValue: resumoCaixaService },
        { provide: VendaSessionService, useValue: vendaSession },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    spyOn(router, 'navigateByUrl').and.resolveTo(true);
    fixture = TestBed.createComponent(PdvPageComponent);
    fixture.detectChanges();
  });

  it('renderiza a identidade visual principal do PDV real', () => {
    const text = fixture.nativeElement.textContent;

    expect(text).toContain('sysvar');
    expect(text).toContain('PDV');
    expect(text).toContain('INFORMAÇÕES DA VENDA');
    expect(text).toContain('ITENS DE VENDA');
    expect(text).toContain('PRODUTO SELECIONADO');
  });

  it('mostra Loja, Caixa e Terminal do contexto Hub', () => {
    const text = fixture.nativeElement.textContent;

    expect(text).toContain('Filial 1');
    expect(text).toContain('Caixa 01');
    expect(text).toContain('PDV-01');
  });

  it('consulta status do caixa ao entrar e mostra caixa aberto', () => {
    const text = fixture.nativeElement.textContent;

    expect(caixaSession.bootstrap).toHaveBeenCalled();
    expect(vendaSession.bootstrap).toHaveBeenCalled();
    expect(text).toContain('CAIXA ABERTO');
    expect(text).toContain('Fundo R$ 100,00');
  });

  it('mostra operador real sem fallback hardcoded', () => {
    const text = fixture.nativeElement.textContent;

    expect(text).toContain('Juliana Rocha');
    expect(text).toContain('caixa.barra');
    expect(text).not.toContain('Operador não identificado');
    expect(text).not.toContain('FERNANDO');
    expect(text).not.toContain('VAREJO');
  });

  it('busca produtos com debounce e limit 40', fakeAsync(() => {
    const component = fixture.componentInstance;

    component.busca = '7892701000013';
    component.aoDigitarBusca();
    tick(249);
    expect(facade.buscarCatalogo).not.toHaveBeenCalled();

    tick(1);
    expect(facade.buscarCatalogo).toHaveBeenCalledWith('7892701000013', 40);
    expect(component.produtos[0].ean13).toBe('7892701000013');
  }));

  it('exibe resultado real, preco e estoque preservados', fakeAsync(() => {
    const component = fixture.componentInstance;

    component.busca = '7892701000013';
    component.aoDigitarBusca();
    tick(250);
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Calça Jeans Reta Aurora');
    expect(text).toContain('27-01-01001');
    expect(text).toContain('4');
    expect(component.produtos[0].precoVenda).toBe('199.9000');
    expect(component.produtos[0].estoqueDisponivel).toBe('4.000');
  }));

  it('mantem vendavel false visivel com SEM_ESTOQUE e SEM_PRECO', fakeAsync(() => {
    facade.buscarCatalogo.and.returnValue(of(catalogo([produtoSemEstoque, produtoSemPreco])));
    const component = fixture.componentInstance;

    component.busca = 'calca';
    component.aoDigitarBusca();
    tick(250);
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('SEM_ESTOQUE');
    expect(text).toContain('SEM_PRECO');
    expect(component.produtos.length).toBe(2);
  }));

  it('seleciona produto e atualiza painel direito sem colocar no carrinho', () => {
    const component = fixture.componentInstance;

    component.selecionarProduto(produtoVendavel);
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Calça Jeans Reta Aurora');
    expect(text).toContain('7892701000013');
    expect(text).toContain('199,90');
    expect(text).toContain('Produto selecionado. Pressione ENTER no código exato ou use Adicionar.');
    expect(component.venda()?.itens.length).toBe(1);
  });

  it('troca operador limpa sessao operacional sem mexer no carrinho', () => {
    const component = fixture.componentInstance;

    component.trocarOperador();

    expect(operatorSession.logout).toHaveBeenCalled();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/operador');
    expect(component.carrinho.length).toBe(0);
  });

  it('fechado mostra modal bloqueante com contexto e abre caixa', () => {
    caixaStatusSignal.set('fechado');
    sessaoCaixaSignal.set(null);
    fixture.detectChanges();
    const component = fixture.componentInstance;

    expect(fixture.nativeElement.textContent).toContain('ABERTURA DE CAIXA');
    expect(fixture.nativeElement.textContent).toContain('Filial 1');
    expect(fixture.nativeElement.textContent).toContain('Caixa 01');
    expect(fixture.nativeElement.textContent).toContain('PDV-01');
    expect(fixture.nativeElement.textContent).toContain('Juliana Rocha');

    component.valorAbertura = '100,00';
    component.abrirCaixa(new Event('submit'));

    expect(caixaSession.abrir).toHaveBeenCalledWith('100.00');
  });

  it('modal mostra erro 400 e loading de abertura', () => {
    caixaStatusSignal.set('fechado');
    sessaoCaixaSignal.set(null);
    caixaSession.abrir.and.returnValue(of({ ok: false, detail: 'Valor de abertura inválido.' }));
    const component = fixture.componentInstance;

    component.valorAbertura = '100,00';
    component.abrirCaixa(new Event('submit'));
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Valor de abertura inválido.');
  });

  it('aberto nao mostra modal de abertura', () => {
    caixaStatusSignal.set('aberto');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).not.toContain('ABERTURA DE CAIXA');
  });

  it('F10 abre fechamento e consulta resumo local', () => {
    const component = fixture.componentInstance;

    component.atalhoF10(new KeyboardEvent('keydown', { key: 'F10' }));

    expect(component.modalAtalho).toBe('fechamento');
    expect(resumoCaixaService.obter).toHaveBeenCalled();
    expect(caixaSession.fechar).not.toHaveBeenCalled();
  });

  it('botao F10 abre fechamento', () => {
    const button = Array.from(fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>)
      .find((item): item is HTMLButtonElement => item.textContent?.includes('Fechar Caixa') ?? false);

    button?.click();

    expect(fixture.componentInstance.modalAtalho).toBe('fechamento');
  });

  it('F10 mostra resumo essencial e composicao do dinheiro', () => {
    fixture.componentInstance.abrirFechamentoCaixa();
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent;

    expect(text).toContain('FECHAMENTO DE CAIXA · F10');
    expect(fixture.nativeElement.textContent).toContain('DINHEIRO ESPERADO');
    expect(fixture.nativeElement.textContent).toContain('R$ 399,70');
    expect(fixture.nativeElement.textContent).toContain('+ Vendas em dinheiro');
    expect(fixture.nativeElement.textContent).toContain('+ Suprimentos');
    expect(fixture.nativeElement.textContent).toContain('- Sangrias');
    expect(fixture.nativeElement.textContent).toContain('- Despesas');
  });

  it('F10 mostra estado de carregamento enquanto consulta resumo', () => {
    const resumoSubject = new Subject<ResumoCaixa>();
    resumoCaixaService.obter.and.returnValue(resumoSubject.asObservable());

    fixture.componentInstance.abrirFechamentoCaixa();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Carregando...');
    resumoSubject.next(resumoCaixaStub);
    resumoSubject.complete();
  });

  it('valor contado e obrigatorio antes da confirmacao', () => {
    const component = fixture.componentInstance;
    component.abrirFechamentoCaixa();

    component.prepararFechamentoCaixa(new Event('submit'));

    expect(component.erroFechamentoCaixa).toBe('Informe o valor contado em dinheiro.');
    expect(component.confirmandoFechamentoCaixa).toBeFalse();
    expect(caixaSession.fechar).not.toHaveBeenCalled();
  });

  it('primeiro passo pede confirmacao e voltar nao faz POST', () => {
    const component = fixture.componentInstance;
    component.abrirFechamentoCaixa();
    component.valorContadoFechamento = '399,70';

    component.prepararFechamentoCaixa(new Event('submit'));
    expect(component.confirmandoFechamentoCaixa).toBeTrue();
    component.voltarConfirmacaoFechamento();

    expect(component.confirmandoFechamentoCaixa).toBeFalse();
    expect(caixaSession.fechar).not.toHaveBeenCalled();
  });

  it('confirmar envia exatamente um fechamento com string decimal e observacao', () => {
    const component = fixture.componentInstance;
    component.abrirFechamentoCaixa();
    component.valorContadoFechamento = '399,70';
    component.observacaoFechamento = 'Conferencia final';
    component.prepararFechamentoCaixa(new Event('submit'));

    component.confirmarFechamentoCaixa();
    component.confirmarFechamentoCaixa();

    expect(caixaSession.fechar).toHaveBeenCalledTimes(1);
    expect(caixaSession.fechar).toHaveBeenCalledWith('399.70', 'Conferencia final');
  });

  it('fechamento com sucesso mostra valores oficiais do backend e limpa venda', () => {
    const component = fixture.componentInstance;
    component.abrirFechamentoCaixa();
    component.valorContadoFechamento = '409,70';
    caixaSession.fechar.and.callFake(() => {
      caixaStatusSignal.set('fechado');
      sessaoCaixaSignal.set({ ...sessaoCaixaAbertaStub, status: 'FECHADO' });
      return of({
      ok: true,
      sessao: { ...sessaoCaixaAbertaStub, status: 'FECHADO' },
      fechamento: { valorEsperado: '399.70', valorContado: '409.70', diferenca: '10.00', situacao: 'SOBRA', resumo: fechamentoResumoSnapshotStub },
      });
    });

    component.prepararFechamentoCaixa(new Event('submit'));
    component.confirmarFechamentoCaixa();
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent;
    expect(component.caixaEncerradoNestaSessao).toBeTrue();
    expect(text).toContain('CAIXA FECHADO COM SUCESSO');
    expect(text).toContain('R$ 399,70');
    expect(text).toContain('R$ 409,70');
    expect(text).toContain('R$ 10,00');
    expect(text).toContain('SOBRA');
    expect(text).not.toContain('ABERTURA DE CAIXA');
    expect(vendaSession.limparEstado).toHaveBeenCalled();
  });

  it('resultado FALTA preserva sinal negativo visual', () => {
    const component = fixture.componentInstance;
    component.abrirFechamentoCaixa();
    caixaSession.fechar.and.returnValue(of({
      ok: true,
      sessao: { ...sessaoCaixaAbertaStub, status: 'FECHADO' },
      fechamento: { valorEsperado: '399.70', valorContado: '389.70', diferenca: '-10.00', situacao: 'FALTA', resumo: fechamentoResumoSnapshotStub },
    }));

    component.valorContadoFechamento = '389,70';
    component.prepararFechamentoCaixa(new Event('submit'));
    component.confirmarFechamentoCaixa();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('-R$ 10,00');
    expect(fixture.nativeElement.textContent).toContain('FALTA');
  });

  it('400, 409 e status 0 mostram detail sem fechar modal', () => {
    const component = fixture.componentInstance;
    component.abrirFechamentoCaixa();
    component.valorContadoFechamento = '399,70';
    caixaSession.fechar.and.returnValues(
      of({ ok: false, detail: 'Valor contado inválido.' }),
      of({ ok: false, detail: 'Existe venda em andamento neste caixa.' }),
      of({ ok: false, detail: 'Falha de comunicação com o Hub local.' }),
    );

    component.prepararFechamentoCaixa(new Event('submit'));
    component.confirmarFechamentoCaixa();
    expect(component.erroFechamentoCaixa).toBe('Valor contado inválido.');
    expect(component.modalAtalho).toBe('fechamento');

    component.prepararFechamentoCaixa(new Event('submit'));
    component.confirmarFechamentoCaixa();
    expect(component.erroFechamentoCaixa).toBe('Existe venda em andamento neste caixa.');

    component.prepararFechamentoCaixa(new Event('submit'));
    component.confirmarFechamentoCaixa();
    expect(component.erroFechamentoCaixa).toBe('Falha de comunicação com o Hub local.');
  });

  it('concluir fecha resultado sem reabrir caixa', () => {
    const component = fixture.componentInstance;
    component.abrirFechamentoCaixa();
    component.valorContadoFechamento = '399,70';
    caixaSession.fechar.and.callFake(() => {
      caixaStatusSignal.set('fechado');
      sessaoCaixaSignal.set({ ...sessaoCaixaAbertaStub, status: 'FECHADO' });
      return of({
        ok: true,
        sessao: { ...sessaoCaixaAbertaStub, status: 'FECHADO' },
        fechamento: { valorEsperado: '399.70', valorContado: '399.70', diferenca: '0.00', situacao: 'OK', resumo: fechamentoResumoSnapshotStub },
      });
    });
    component.prepararFechamentoCaixa(new Event('submit'));
    component.confirmarFechamentoCaixa();

    component.concluirFechamentoCaixa();
    fixture.detectChanges();

    expect(component.modalAtalho).toBe('');
    expect(component.caixaEncerradoNestaSessao).toBeTrue();
    expect(fixture.nativeElement.textContent).toContain('ITENS DE VENDA');
    expect(fixture.nativeElement.textContent).toContain('CAIXA FECHADO');
    expect(fixture.nativeElement.textContent).not.toContain('ABERTURA DE CAIXA');
    expect(caixaSession.abrir).not.toHaveBeenCalled();
    expect(caixaSession.fechar).toHaveBeenCalledTimes(1);
  });

  it('nova instancia com caixa fechado e flag inicial false mostra abertura normalmente', () => {
    caixaStatusSignal.set('fechado');
    sessaoCaixaSignal.set(null);

    const novaFixture = TestBed.createComponent(PdvPageComponent);
    novaFixture.detectChanges();

    expect(novaFixture.componentInstance.caixaEncerradoNestaSessao).toBeFalse();
    expect(novaFixture.nativeElement.textContent).toContain('ABERTURA DE CAIXA');
  });

  it('ENTER com resultado exato seleciona produto', () => {
    const component = fixture.componentInstance;

    component.busca = '7892701000013';
    component.aoEnterBusca(new KeyboardEvent('keydown', { key: 'Enter' }));

    expect(component.produtoSelecionado?.skuId).toBe(10825);
    expect(vendaSession.adicionarItem).toHaveBeenCalledWith(10825, 1);
  });

  it('botao INICIAR VENDA aparece com caixa aberto e sem venda', () => {
    vendaSignal.set(null);
    vendaStatusSignal.set('sem-venda');
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Selecione um cliente, se necessário, e inicie a venda.');
    expect(text).toContain('INICIAR VENDA');
    expect(text).not.toContain(['Bipe ou digite um produto', 'para iniciar a venda'].join(' '));
  });

  it('botao INICIAR VENDA nao aparece como ativo quando venda existe', () => {
    vendaSignal.set(vendaAbertaStub.venda);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Venda em andamento · venda-hu');
    expect(fixture.nativeElement.textContent).not.toContain('INICIAR VENDA');
  });

  it('clicar INICIAR VENDA chama sessao e mostra sucesso', () => {
    const component = fixture.componentInstance;
    vendaSignal.set(null);
    vendaStatusSignal.set('sem-venda');
    vendaSession.iniciarVenda.and.callFake(() => {
      vendaSignal.set({ ...vendaAbertaStub.venda!, cliente: clientePreselecionadoStub });
      clientePreselecionadoSignal.set(null);
      vendaStatusSignal.set('aberta');
      return of({ ok: true });
    });

    component.iniciarVenda();
    fixture.detectChanges();

    expect(vendaSession.iniciarVenda).toHaveBeenCalled();
    expect(component.mensagem).toBe('Venda iniciada.');
    expect(fixture.nativeElement.textContent).toContain('Venda em andamento · venda-hu');
    expect(component.clienteOperacional()?.clienteUuid).toBe('cliente-uuid');
  });

  it('clicar INICIAR VENDA com caixa fechado nao chama API', () => {
    const component = fixture.componentInstance;
    caixaStatusSignal.set('fechado');
    vendaSignal.set(null);

    component.iniciarVenda();

    expect(vendaSession.iniciarVenda).not.toHaveBeenCalled();
    expect(component.mensagem).toBe('Abra o caixa antes de iniciar uma venda.');
  });

  it('caixa fechado bloqueia movimentacao F8 no frontend', () => {
    const component = fixture.componentInstance;
    caixaStatusSignal.set('fechado');

    component.abrirAtalho(new Event('click'), 'despesa');

    expect(component.modalAtalho).not.toBe('despesa');
    expect(tiposDespesaService.listar).not.toHaveBeenCalled();
    expect(component.mensagem).toBe('Abra o caixa antes de registrar movimentação.');
  });

  it('sem venda inclusao de produto nao chama adicionarItem', () => {
    const component = fixture.componentInstance;
    vendaSignal.set(null);
    vendaStatusSignal.set('sem-venda');

    component.tentarAdicionarProduto(produtoVendavel);

    expect(vendaSession.adicionarItem).not.toHaveBeenCalled();
    expect(component.mensagem).toBe('Inicie a venda antes de incluir produtos.');
  });

  it('sem venda ENTER com produto exato consulta mas nao inclui item', () => {
    const component = fixture.componentInstance;
    vendaSignal.set(null);
    vendaStatusSignal.set('sem-venda');

    component.busca = '7892701000013';
    component.aoEnterBusca(new KeyboardEvent('keydown', { key: 'Enter' }));

    expect(component.produtoSelecionado?.skuId).toBe(10825);
    expect(vendaSession.adicionarItem).not.toHaveBeenCalled();
    expect(component.mensagem).toBe('Inicie a venda antes de incluir produtos.');
  });

  it('preco null nao ganha fallback', () => {
    const component = fixture.componentInstance;

    component.selecionarProduto(produtoSemPreco);
    fixture.detectChanges();

    expect(component.formatarPreco(produtoSemPreco.precoVenda)).toBe('-');
    expect(fixture.nativeElement.textContent).toContain('SEM_PRECO');
    expect(fixture.nativeElement.textContent).not.toContain('399,90');
  });

  it('mantem F2-F10 visuais e F9 abre pagamentos locais', () => {
    const component = fixture.componentInstance;
    const text = fixture.nativeElement.textContent;
    vendaSignal.set({ ...vendaAbertaStub.venda!, vendedor: vendedorStub });

    ['F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10'].forEach((atalho) => {
      expect(text).toContain(atalho);
    });

    component.abrirAtalho(new Event('click'), 'pagamentos');

    expect(component.modalAtalho).toBe('pagamentos');
    expect(vendaSession.listarFormasPagamento).toHaveBeenCalled();
    expect(facade.buscarCatalogo).not.toHaveBeenCalled();
  });

  it('F4 teclado abre resumo e consulta endpoint pelo service', () => {
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'F4' }));
    fixture.detectChanges();

    expect(fixture.componentInstance.modalAtalho).toBe('resumo');
    expect(resumoCaixaService.obter).toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('RESUMO DO CAIXA · F4');
  });

  it('botao F4 abre resumo', () => {
    const botoes = Array.from(fixture.nativeElement.querySelectorAll('button')) as HTMLButtonElement[];
    const botaoF4 = botoes.find((botao) => botao.textContent?.includes('F4'));

    botaoF4?.click();
    fixture.detectChanges();

    expect(fixture.componentInstance.modalAtalho).toBe('resumo');
    expect(resumoCaixaService.obter).toHaveBeenCalled();
  });

  it('resumo mostra carregando enquanto consulta esta pendente', () => {
    const subject = new Subject<ResumoCaixa>();
    resumoCaixaService.obter.and.returnValue(subject.asObservable());

    fixture.componentInstance.abrirAtalho(new Event('click'), 'resumo');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Carregando...');
    subject.next(resumoCaixaStub);
    subject.complete();
  });

  it('renderiza dados completos do resumo do caixa', () => {
    fixture.componentInstance.abrirAtalho(new Event('click'), 'resumo');
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent;

    expect(text).toContain('CX-01 · Caixa 01');
    expect(text).toContain('Juliana Rocha');
    expect(text).toContain('ABERTURA');
    expect(text).toContain('R$ 100,00');
    expect(text).toContain('Quantidade');
    expect(text).toContain('3');
    expect(text).toContain('R$ 599,70');
    expect(text).toContain('R$ 600,00');
    expect(text).toContain('R$ 0,30');
    expect(text).toContain('Dinheiro');
    expect(text).toContain('DINHEIRO');
    expect(text).toContain('Pix');
    expect(text).toContain('Visa');
    expect(text).toContain('Dinheiro bruto');
    expect(text).toContain('Dinheiro líquido');
    expect(text).toContain('DESPESAS');
    expect(text).toContain('SANGRIAS');
    expect(text).toContain('SUPRIMENTOS');
    expect(text).toContain('DINHEIRO ESPERADO');
    expect(text).toContain('R$ 399,70');
    expect(text).toContain('SANG-1');
    expect(text).toContain('Retirada');
  });

  it('resumo trata formas e movimentacoes vazias', () => {
    resumoCaixaService.obter.and.returnValue(of({
      ...resumoCaixaStub,
      pagamentos: { ...resumoCaixaStub.pagamentos, formas: [] },
      movimentacoes: { ...resumoCaixaStub.movimentacoes, itens: [] },
    }));

    fixture.componentInstance.abrirAtalho(new Event('click'), 'resumo');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Nenhum pagamento registrado nesta sessão.');
    expect(fixture.nativeElement.textContent).toContain('Nenhuma movimentação de caixa nesta sessão.');
  });

  it('botao Atualizar executa nova consulta sem fechar modal', () => {
    fixture.componentInstance.abrirAtalho(new Event('click'), 'resumo');
    fixture.detectChanges();
    const botaoAtualizar = Array.from(fixture.nativeElement.querySelectorAll('button'))
      .find((botao) => (botao as HTMLButtonElement).textContent?.includes('ATUALIZAR')) as HTMLButtonElement;

    botaoAtualizar.click();
    fixture.detectChanges();

    expect(resumoCaixaService.obter).toHaveBeenCalledTimes(2);
    expect(fixture.componentInstance.modalAtalho).toBe('resumo');
  });

  it('resumo exibe detail de erro 400 e 409', () => {
    resumoCaixaService.obter.and.returnValue(throwError(() => new HttpErrorResponse({ status: 409, error: { detail: 'Caixa não está aberto.' } })));
    fixture.componentInstance.abrirAtalho(new Event('click'), 'resumo');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Caixa não está aberto.');

    resumoCaixaService.obter.and.returnValue(throwError(() => new HttpErrorResponse({ status: 400, error: { detail: 'Caixa inativo.' } })));
    fixture.componentInstance.atualizarResumoCaixa();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Caixa inativo.');
  });

  it('resumo com 401/403 invalida somente operador, fecha modal e navega operador', () => {
    resumoCaixaService.obter.and.returnValue(throwError(() => new HttpErrorResponse({ status: 401 })));

    fixture.componentInstance.abrirAtalho(new Event('click'), 'resumo');

    expect(operatorSession.invalidarSessao).toHaveBeenCalled();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/operador');
    expect(fixture.componentInstance.modalAtalho).toBe('');
  });

  it('resumo com status 0 mostra falha do Hub local', () => {
    resumoCaixaService.obter.and.returnValue(throwError(() => new HttpErrorResponse({ status: 0 })));

    fixture.componentInstance.abrirAtalho(new Event('click'), 'resumo');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Falha de comunicação com o Hub local.');
  });

  it('fechar e ESC limpam estado do resumo', () => {
    fixture.componentInstance.abrirAtalho(new Event('click'), 'resumo');
    expect(fixture.componentInstance.resumoCaixa).not.toBeNull();

    fixture.componentInstance.fecharAtalho();
    expect(fixture.componentInstance.resumoCaixa).toBeNull();
    expect(fixture.componentInstance.erroResumoCaixa).toBe('');

    fixture.componentInstance.abrirAtalho(new Event('click'), 'resumo');
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(fixture.componentInstance.modalAtalho).toBe('');
    expect(fixture.componentInstance.resumoCaixa).toBeNull();
  });

  it('resumo nao aciona operacoes mutaveis do PDV', () => {
    fixture.componentInstance.abrirAtalho(new Event('click'), 'resumo');

    expect(movimentacoesCaixaService.registrar).not.toHaveBeenCalled();
    expect(vendaSession.adicionarPagamento).not.toHaveBeenCalled();
    expect(vendaSession.finalizarVenda).not.toHaveBeenCalled();
    expect(vendaSession.cancelarVenda).not.toHaveBeenCalled();
  });

  it('F8 abre modal de movimentacao iniciando em DESPESA e carrega tipos locais', () => {
    const component = fixture.componentInstance;

    component.abrirAtalho(new Event('click'), 'despesa');
    fixture.detectChanges();

    expect(component.modalAtalho).toBe('despesa');
    expect(component.movimentacaoCaixaForm.tipo).toBe('DESPESA');
    expect(tiposDespesaService.listar).toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('Movimentação de Caixa');
    expect(fixture.nativeElement.textContent).toContain('Tipo de despesa');
  });

  it('DESPESA valida tipo documento obrigatorio e envia tipo_despesa_id com valor decimal', () => {
    const component = fixture.componentInstance;
    tiposDespesaService.listar.and.returnValue(of({
      tiposDespesaPdvVersao: 1,
      tiposDespesaPdvSincronizadoEm: null,
      total: 1,
      tipos: [{
        id: 777,
        codigo: 'DOC',
        descricao: 'Despesa com doc',
        exigeDocumento: true,
        natureza: {
          id: 1,
          codigo: '3301',
          descricao: 'Natureza',
          categoriaPrincipal: '',
          subcategoria: '',
          tipo: 'DESPESA',
          status: 'ATIVO',
          tipoNatureza: 'DEBITO',
          naturezaOperacao: 'DESPESA',
          categoriaGerencial: '',
          movimentaFinanceiro: true,
          entraDre: true,
        },
      }],
    }));

    component.abrirAtalho(new Event('click'), 'despesa');
    component.movimentacaoCaixaForm.valor = '25,9';
    component.registrarMovimentacaoCaixa();
    expect(component.erroMovimentacaoCaixa).toBe('Documento obrigatório para este tipo de despesa.');

    component.movimentacaoCaixaForm.documento = 'NF-123';
    component.registrarMovimentacaoCaixa();

    expect(movimentacoesCaixaService.registrar).toHaveBeenCalledWith({
      tipo: 'DESPESA',
      valor: '25.90',
      documento: 'NF-123',
      historico: '',
      tipo_despesa_id: 777,
    });
  });

  it('SANGRIA e SUPRIMENTO nao enviam tipo_despesa_id e sucesso fecha modal com mensagem', () => {
    const component = fixture.componentInstance;

    component.abrirAtalho(new Event('click'), 'despesa');
    component.aoTrocarTipoMovimentacao('SANGRIA');
    component.movimentacaoCaixaForm.tipoDespesaId = 123;
    component.movimentacaoCaixaForm.valor = '100';
    component.registrarMovimentacaoCaixa();

    expect(movimentacoesCaixaService.registrar).toHaveBeenCalledWith({
      tipo: 'SANGRIA',
      valor: '100.00',
      documento: '',
      historico: '',
    });
    expect(component.modalAtalho).toBe('');
    expect(component.mensagem).toBe('Sangria registrada.');

    component.abrirAtalho(new Event('click'), 'despesa');
    component.aoTrocarTipoMovimentacao('SUPRIMENTO');
    component.movimentacaoCaixaForm.valor = '50';
    component.registrarMovimentacaoCaixa();

    expect(movimentacoesCaixaService.registrar).toHaveBeenCalledWith({
      tipo: 'SUPRIMENTO',
      valor: '50.00',
      documento: '',
      historico: '',
    });
    expect(component.mensagem).toBe('Suprimento registrado.');
  });

  it('F2 e botao Cliente abrem modal e carregam clientes locais', () => {
    const component = fixture.componentInstance;

    component.atalhoF2(new KeyboardEvent('keydown', { key: 'F2' }));
    fixture.detectChanges();

    expect(component.modalAtalho).toBe('cliente');
    expect(clienteSession.listar).toHaveBeenCalledWith('');
    expect(fixture.nativeElement.textContent).toContain('CLIENTE · F2');
    expect(fixture.nativeElement.textContent).toContain('Maria Silva');
    expect(fixture.nativeElement.textContent).not.toContain('Recurso ainda não integrado ao Hub');
  });

  it('ENTER no modo busca continua confirmando cliente selecionado', () => {
    const component = fixture.componentInstance;

    component.abrirCliente();
    fixture.detectChanges();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));

    expect(component.clienteModalModo).toBe('busca');
    expect(vendaSession.selecionarCliente).toHaveBeenCalledWith('cliente-uuid');
  });

  it('ENTER no modo cadastro nao seleciona cliente antigo nem fecha modal', () => {
    const component = fixture.componentInstance;

    component.abrirCliente();
    expect(component.clienteListaSelecionado?.clienteUuid).toBe('cliente-uuid');
    component.abrirCadastroCliente();
    fixture.detectChanges();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));

    expect(vendaSession.selecionarCliente).not.toHaveBeenCalled();
    expect(component.modalAtalho).toBe('cliente');
    expect(component.clienteModalModo).toBe('cadastro');
  });

  it('ENTER sobre SALVAR CLIENTE nao seleciona cliente antigo pelo listener global', () => {
    const component = fixture.componentInstance;

    component.abrirCliente();
    component.abrirCadastroCliente();
    fixture.detectChanges();
    const botaoSalvar = Array.from(fixture.nativeElement.querySelectorAll('button')).find((button) =>
      (button as HTMLButtonElement).textContent?.includes('SALVAR CLIENTE'),
    ) as HTMLButtonElement;

    botaoSalvar.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));

    expect(vendaSession.selecionarCliente).not.toHaveBeenCalled();
    expect(component.modalAtalho).toBe('cliente');
  });

  it('ENTER sobre PF/PJ nao seleciona cliente antigo pelo listener global', () => {
    const component = fixture.componentInstance;

    component.abrirCliente();
    component.abrirCadastroCliente();
    fixture.detectChanges();
    const botaoPessoaJuridica = Array.from(fixture.nativeElement.querySelectorAll('button')).find((button) =>
      (button as HTMLButtonElement).textContent?.includes('Pessoa Jurídica'),
    ) as HTMLButtonElement;

    botaoPessoaJuridica.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));

    expect(vendaSession.selecionarCliente).not.toHaveBeenCalled();
    expect(component.modalAtalho).toBe('cliente');
    expect(component.clienteModalModo).toBe('cadastro');
  });

  it('busca cliente com debounce', fakeAsync(() => {
    const component = fixture.componentInstance;
    component.abrirCliente();
    clienteSession.listar.calls.reset();

    component.buscaCliente = 'maria';
    component.aoDigitarBuscaCliente();
    tick(249);
    expect(clienteSession.listar).not.toHaveBeenCalled();
    tick(1);

    expect(clienteSession.listar).toHaveBeenCalledWith('maria');
  }));

  it('erro comum em F2 mostra falha local', () => {
    clienteSession.listar.and.returnValue(throwError(() => new Error('rede')));
    const component = fixture.componentInstance;

    component.abrirCliente();
    fixture.detectChanges();

    expect(component.erroClientes).toBe('Falha de comunicação com o Hub local.');
    expect(fixture.nativeElement.textContent).toContain('Falha de comunicação com o Hub local.');
  });

  it('sessao expirada em F2 limpa modal sem erro generico', () => {
    clienteSession.listar.and.returnValue(throwError(() => new ClienteSessionExpiredError()));
    const component = fixture.componentInstance;

    component.abrirCliente();
    fixture.detectChanges();

    expect(component.modalAtalho).toBe('');
    expect(component.erroClientes).toBe('');
    expect(fixture.nativeElement.textContent).not.toContain('Falha de comunicação com o Hub local.');
  });

  it('inativo e bloqueado aparecem mas nao podem confirmar', () => {
    const component = fixture.componentInstance;
    const inativo = { ...clienteAtivo, clienteUuid: 'inativo', ativo: false };
    const bloqueado = { ...clienteAtivo, clienteUuid: 'bloqueado', bloqueio: true };

    component.abrirCliente();
    component.clientesEncontrados = [inativo, bloqueado];
    component.selecionarClienteLista(inativo);
    component.confirmarClienteSelecionado();
    fixture.detectChanges();

    expect(vendaSession.selecionarCliente).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('INATIVO');
    expect(fixture.nativeElement.textContent).toContain('BLOQUEADO');
  });

  it('cliente padrao e LOCAL podem ser selecionados', () => {
    const component = fixture.componentInstance;
    const local = { ...clienteAtivo, clienteUuid: 'local', retaguardaId: null, origem: 'LOCAL' as const };
    const padrao = { ...clienteAtivo, clienteUuid: 'padrao', clientePadrao: true };

    component.abrirCliente();
    component.selecionarClienteLista(local);
    component.confirmarClienteSelecionado();
    component.abrirCliente();
    component.selecionarClienteLista(padrao);
    component.confirmarClienteSelecionado();

    expect(vendaSession.selecionarCliente).toHaveBeenCalledWith('local');
    expect(vendaSession.selecionarCliente).toHaveBeenCalledWith('padrao');
  });

  it('selecao fecha modal e atualiza informacoes da venda', () => {
    const component = fixture.componentInstance;
    vendaSignal.set({
      ...vendaAbertaStub.venda!,
      cliente: {
        clienteUuid: 'cliente-uuid',
        retaguardaId: 123,
        tipoPessoa: 'PF',
        documento: '12345678901',
        clientePadrao: false,
        nomeCliente: 'Maria Silva',
      },
    });

    component.abrirCliente();
    component.selecionarClienteLista(clienteAtivo);
    component.confirmarClienteSelecionado();
    fixture.detectChanges();

    expect(component.modalAtalho).toBe('');
    expect(component.mensagem).toBe('Cliente selecionado.');
    expect(fixture.nativeElement.textContent).toContain('Maria Silva');
    expect(fixture.nativeElement.textContent).toContain('Código 123');
  });

  it('F2 sem item mostra cliente preselecionado sem venda iniciada', () => {
    const component = fixture.componentInstance;
    vendaSignal.set(null);
    vendaStatusSignal.set('sem-venda');
    clientePreselecionadoSignal.set(clientePreselecionadoStub);

    component.abrirCliente();
    fixture.detectChanges();

    expect(textoClienteAtual()).toContain('Cliente pré-selecionado');
    expect(textoClienteAtual()).not.toContain('Cliente da venda');
    expect(textoClienteAtual()).toContain('Maria Silva');
    expect(fixture.nativeElement.textContent).toContain('Cliente pré-selecionado');
    expect(fixture.nativeElement.textContent).not.toContain('Cliente da venda');
    expect(fixture.nativeElement.textContent).toContain('Venda ainda não iniciada');
    expect(fixture.nativeElement.textContent).not.toContain('Venda em andamento · venda-hu');
    expect(component.venda()).toBeNull();
  });

  it('F2 sem venda e sem cliente mostra nenhum cliente preselecionado', () => {
    const component = fixture.componentInstance;
    vendaSignal.set(null);
    vendaStatusSignal.set('sem-venda');
    clientePreselecionadoSignal.set(null);

    component.abrirCliente();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Cliente pré-selecionado');
    expect(fixture.nativeElement.textContent).toContain('Nenhum cliente pré-selecionado');
    expect(fixture.nativeElement.textContent).not.toContain('Cliente da venda');
  });

  it('troca cliente preselecionado usa mensagem Cliente alterado', () => {
    const component = fixture.componentInstance;
    vendaSignal.set(null);
    vendaStatusSignal.set('sem-venda');
    clientePreselecionadoSignal.set({ ...clientePreselecionadoStub, clienteUuid: 'cliente-anterior' });
    vendaSession.selecionarCliente.and.returnValue(of({ ok: true }));

    component.abrirCliente();
    component.selecionarClienteLista(clienteAtivo);
    component.confirmarClienteSelecionado();

    expect(component.mensagem).toBe('Cliente alterado.');
  });

  it('cliente da VendaHub prevalece visualmente sobre pre-selecao', () => {
    const component = fixture.componentInstance;
    vendaSignal.set({
      ...vendaAbertaStub.venda!,
      cliente: {
        clienteUuid: 'cliente-venda',
        retaguardaId: 456,
        tipoPessoa: 'PF',
        documento: null,
        clientePadrao: false,
        nomeCliente: 'Cliente da Venda',
      },
    });
    clientePreselecionadoSignal.set(clientePreselecionadoStub);
    component.abrirCliente();
    fixture.detectChanges();

    expect(textoClienteAtual()).toContain('Cliente da venda');
    expect(textoClienteAtual()).toContain('Cliente da Venda');
    expect(textoClienteAtual()).not.toContain('Maria Silva');
  });

  it('venda existente sem cliente nao faz fallback para pre-selecao', () => {
    const component = fixture.componentInstance;
    vendaSignal.set({ ...vendaAbertaStub.venda!, cliente: null });
    clientePreselecionadoSignal.set(clientePreselecionadoStub);

    component.abrirCliente();
    fixture.detectChanges();

    expect(component.clienteOperacional()).toBeNull();
    expect(textoClienteAtual()).toContain('Cliente da venda');
    expect(textoClienteAtual()).toContain('Venda sem cliente selecionado');
    expect(textoClienteAtual()).not.toContain('Maria Silva');
  });

  it('remocao limpa cliente sem cancelar venda', () => {
    const component = fixture.componentInstance;
    vendaSignal.set({ ...vendaAbertaStub.venda!, cliente: { clienteUuid: 'cliente-uuid', retaguardaId: 123, tipoPessoa: 'PF', documento: null, clientePadrao: false, nomeCliente: 'Maria Silva' } });
    vendaSession.removerCliente.and.callFake(() => {
      vendaSignal.set({ ...vendaAbertaStub.venda!, cliente: null });
      return of({ ok: true });
    });

    component.abrirCliente();
    component.removerClienteVenda();
    fixture.detectChanges();

    expect(vendaSession.removerCliente).toHaveBeenCalled();
    expect(component.mensagem).toBe('Cliente removido da venda.');
    expect(fixture.nativeElement.textContent).toContain('Consumidor não identificado');
  });

  it('remocao de cliente preselecionado mantem venda nao iniciada', () => {
    const component = fixture.componentInstance;
    vendaSignal.set(null);
    vendaStatusSignal.set('sem-venda');
    clientePreselecionadoSignal.set(clientePreselecionadoStub);
    vendaSession.removerCliente.and.callFake(() => {
      clientePreselecionadoSignal.set(null);
      return of({ ok: true });
    });

    component.abrirCliente();
    component.removerClienteVenda();
    fixture.detectChanges();

    expect(vendaSession.removerCliente).toHaveBeenCalled();
    expect(component.mensagem).toBe('Cliente pré-selecionado removido.');
    expect(fixture.nativeElement.textContent).toContain('Venda ainda não iniciada');
    expect(fixture.nativeElement.textContent).toContain('Consumidor não identificado');
  });

  it('pagamento ativo bloqueia alterar cliente no modal', () => {
    const component = fixture.componentInstance;
    vendaSignal.set({ ...vendaAbertaStub.venda!, pagamentos: [{ uuid: 'pag', formaPagamentoId: 1, formaRetaguardaId: 10, codigo: 'DIN', descricao: 'Dinheiro', tipo: 'DINHEIRO', numParcelas: 1, valor: '199.90', autorizacao: '', origemCaptura: 'MANUAL', criadoEm: '2026-09-14' }] });

    component.abrirCliente();
    component.selecionarClienteLista(clienteAtivo);
    component.confirmarClienteSelecionado();
    fixture.detectChanges();

    expect(vendaSession.selecionarCliente).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('Remova os pagamentos antes de alterar o cliente.');
  });

  it('botao NOVO CLIENTE aparece no F2 e abre formulario com campos obrigatorios', () => {
    const component = fixture.componentInstance;

    component.abrirCliente();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('NOVO CLIENTE');

    component.abrirCadastroCliente();
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Pessoa Física');
    expect(text).toContain('CPF *');
    expect(text).toContain('Nome *');
    expect(text).toContain('SALVAR CLIENTE');
    expect(text).toContain('VOLTAR');
    expect(fixture.nativeElement.querySelector('input[name="telefoneCadastro"]')).toBeNull();
    expect(fixture.nativeElement.querySelector('input[name="telefone2Cadastro"]')).toBeNull();
    expect(fixture.nativeElement.querySelectorAll('.client-create-form .client-form-row').length).toBe(7);
  });

  it('VOLTAR retorna a busca de clientes', () => {
    const component = fixture.componentInstance;

    component.abrirCliente();
    component.abrirCadastroCliente();
    component.voltarBuscaCliente();
    fixture.detectChanges();

    expect(component.clienteModalModo).toBe('busca');
    expect(fixture.nativeElement.textContent).toContain('NOVO CLIENTE');
    expect(fixture.nativeElement.textContent).not.toContain('SALVAR CLIENTE');
  });

  it('alternancia PF/PJ troca CPF/CNPJ e Nome/Razao Social', () => {
    const component = fixture.componentInstance;

    component.abrirCliente();
    component.abrirCadastroCliente();
    component.aoTrocarTipoPessoaCliente('PJ');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('CNPJ *');
    expect(fixture.nativeElement.textContent).toContain('Razão Social *');
  });

  it('salvar fica desabilitado durante processamento', () => {
    const cadastro$ = new Subject<ClienteHubResumo>();
    clienteSession.cadastrar.and.returnValue(cadastro$);
    const component = fixture.componentInstance;

    component.abrirCliente();
    component.abrirCadastroCliente();
    component.clienteCadastro.documento = '12345678901';
    component.clienteCadastro.nomeCliente = 'Maria Silva';
    component.salvarClienteCadastro();
    fixture.detectChanges();

    const botaoSalvar = Array.from(fixture.nativeElement.querySelectorAll('button')).find((button) =>
      (button as HTMLButtonElement).textContent?.includes('SALVANDO...'),
    ) as HTMLButtonElement;
    expect(component.salvandoCliente).toBeTrue();
    expect(botaoSalvar.disabled).toBeTrue();
  });

  it('HTTP 400 mantem modal aberto e mostra detail', () => {
    clienteSession.cadastrar.and.returnValue(throwError(() => new HttpErrorResponse({ status: 400, error: { detail: 'CPF inválido.' } })));
    const component = fixture.componentInstance;

    component.abrirCliente();
    component.abrirCadastroCliente();
    component.clienteCadastro.documento = '12345678901';
    component.clienteCadastro.nomeCliente = 'Maria Silva';
    component.salvarClienteCadastro();
    fixture.detectChanges();

    expect(component.modalAtalho).toBe('cliente');
    expect(component.erroCadastroCliente).toBe('CPF inválido.');
    expect(fixture.nativeElement.textContent).toContain('CPF inválido.');
  });

  it('HTTP 409 mantem modal aberto e mostra detail sem selecionar conflito', () => {
    clienteSession.cadastrar.and.returnValue(throwError(() => new HttpErrorResponse({ status: 409, error: { detail: 'Já existe um cliente com este CPF/CNPJ.', cliente_uuid: 'existente' } })));
    const component = fixture.componentInstance;

    component.abrirCliente();
    component.abrirCadastroCliente();
    component.clienteCadastro.documento = '12345678901';
    component.clienteCadastro.nomeCliente = 'Maria Silva';
    component.salvarClienteCadastro();

    expect(component.modalAtalho).toBe('cliente');
    expect(component.erroCadastroCliente).toBe('Já existe um cliente com este CPF/CNPJ.');
    expect(vendaSession.selecionarCliente).not.toHaveBeenCalledWith('existente');
  });

  it('cadastro bem-sucedido sem venda seleciona cliente sem iniciar venda e fecha modal', () => {
    const component = fixture.componentInstance;
    vendaSignal.set(null);
    vendaStatusSignal.set('sem-venda');

    component.abrirCliente();
    component.abrirCadastroCliente();
    component.clienteCadastro.documento = '12345678901';
    component.clienteCadastro.nomeCliente = 'Maria Silva';
    component.salvarClienteCadastro();

    expect(clienteSession.cadastrar).toHaveBeenCalled();
    expect(vendaSession.selecionarCliente).toHaveBeenCalledWith('novo-cliente');
    expect(vendaSession.iniciarVenda).not.toHaveBeenCalled();
    expect(component.modalAtalho).toBe('');
    expect(component.mensagem).toBe('Cliente cadastrado e pré-selecionado.');
  });

  it('cadastro bem-sucedido com venda mantem mesma venda e seleciona cliente', () => {
    const component = fixture.componentInstance;
    const vendaAtual = vendaAbertaStub.venda;
    vendaSignal.set(vendaAtual);

    component.abrirCliente();
    component.abrirCadastroCliente();
    component.clienteCadastro.documento = '12345678901';
    component.clienteCadastro.nomeCliente = 'Maria Silva';
    component.salvarClienteCadastro();

    expect(vendaSession.selecionarCliente).toHaveBeenCalledWith('novo-cliente');
    expect(component.venda()).toBe(vendaAtual);
    expect(component.mensagem).toBe('Cliente cadastrado e selecionado.');
  });

  it('falha na selecao depois do POST nao executa segundo POST', () => {
    vendaSession.selecionarCliente.and.returnValue(of({ ok: false, detail: 'Falha ao selecionar cliente.' }));
    const component = fixture.componentInstance;

    component.abrirCliente();
    component.abrirCadastroCliente();
    component.clienteCadastro.documento = '12345678901';
    component.clienteCadastro.nomeCliente = 'Maria Silva';
    component.salvarClienteCadastro();

    expect(clienteSession.cadastrar).toHaveBeenCalledTimes(1);
    expect(component.erroCadastroCliente).toBe('Cliente cadastrado, mas não foi possível selecioná-lo.');
    expect(component.modalAtalho).toBe('cliente');
  });

  it('pagamento ativo bloqueia cadastro antes do POST', () => {
    const component = fixture.componentInstance;
    vendaSignal.set({ ...vendaAbertaStub.venda!, pagamentos: [{ uuid: 'pag', formaPagamentoId: 1, formaRetaguardaId: 10, codigo: 'DIN', descricao: 'Dinheiro', tipo: 'DINHEIRO', numParcelas: 1, valor: '199.90', autorizacao: '', origemCaptura: 'MANUAL', criadoEm: '2026-09-14' }] });

    component.abrirCliente();
    component.abrirCadastroCliente();
    component.salvarClienteCadastro();

    expect(clienteSession.cadastrar).not.toHaveBeenCalled();
    expect(component.erroClientes || component.erroCadastroCliente).toBe('Remova os pagamentos antes de alterar o cliente.');
  });

  it('ESC fecha modal de cliente e bootstrap restaura cliente da venda', () => {
    const component = fixture.componentInstance;
    vendaSignal.set({ ...vendaAbertaStub.venda!, cliente: { clienteUuid: 'cliente-uuid', retaguardaId: 123, tipoPessoa: 'PF', documento: '12345678901', clientePadrao: false, nomeCliente: 'Maria Silva' } });

    component.abrirCliente();
    component.atalhoEscape(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();

    expect(component.modalAtalho).toBe('');
    expect(fixture.nativeElement.textContent).toContain('Maria Silva');
  });

  it('remove entrada redundante lateral de adicionar pagamento e preserva atalhos de pagamento', () => {
    const host: HTMLElement = fixture.nativeElement;
    const text = host.textContent || '';

    expect(host.querySelector('.payment-entry')).toBeNull();
    expect(host.querySelector('.right-panel input[placeholder="Valor"]')).toBeNull();
    expect(text).not.toContain('Adicionar pagamento');
    expect(text).toContain('F9');
    ['DINHEIRO', 'CARTÃO', 'PIX', 'OUTRAS', 'FINALIZAR'].forEach((rotulo) => {
      expect(text).toContain(rotulo);
    });
  });

  it('mantem mensagem operacional em regiao propria acima dos botoes de pagamento', () => {
    const component = fixture.componentInstance;
    component.mensagem = 'Venda finalizada com sucesso. Troco: R$ 10,10.';
    fixture.detectChanges();
    const host: HTMLElement = fixture.nativeElement;
    const mensagem = host.querySelector('.operational-message');
    const pagamentos = host.querySelector('.payments');

    expect(mensagem?.textContent).toContain('Venda finalizada com sucesso. Troco: R$ 10,10.');
    expect(mensagem?.compareDocumentPosition(pagamentos as Node) || 0).toBeTruthy();
    expect((mensagem?.compareDocumentPosition(pagamentos as Node) || 0) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('mantem Suporte no header fora do grupo NFC-e e TEF', () => {
    const host: HTMLElement = fixture.nativeElement;
    const indicadores = host.querySelector('.operation-indicators');
    const suporte = host.querySelector('.top-actions .home-button');
    const topActions = host.querySelector('.top-actions');

    expect(indicadores?.textContent).toContain('NFC-e');
    expect(indicadores?.textContent).toContain('TEF');
    expect(indicadores?.textContent).not.toContain('Suporte');
    expect(suporte?.textContent).toContain('Suporte');
    expect(suporte?.tagName.toLowerCase()).toBe('a');
    expect(topActions?.textContent).toContain('Suporte');
  });

  it('F3 abre modal e consulta vendedores sem autoselecionar operador', fakeAsync(() => {
    const component = fixture.componentInstance;

    component.atalhoF3(new KeyboardEvent('keydown', { key: 'F3' }));
    tick();
    fixture.detectChanges();

    expect(component.modalAtalho).toBe('vendedor');
    expect(vendedorSession.listar).toHaveBeenCalledWith('');
    expect(fixture.nativeElement.textContent).toContain('VENDEDOR - F3');
    expect(fixture.nativeElement.textContent).toContain('Ana Vendedora');
    expect(component.vendedorOperacional()).toBeNull();
    expect(fixture.nativeElement.textContent).not.toContain('Juliana Rocha Vendedora');
  }));

  it('busca vendedor por matricula nome ou apelido com debounce', fakeAsync(() => {
    const component = fixture.componentInstance;

    component.abrirVendedor();
    component.buscaVendedor = '000501';
    component.aoDigitarBuscaVendedor();
    tick(249);
    expect(vendedorSession.listar).toHaveBeenCalledTimes(1);
    tick(1);

    expect(vendedorSession.listar).toHaveBeenCalledWith('000501');
  }));

  it('fecha modal F3 quando sessao de vendedor expira', () => {
    const component = fixture.componentInstance;
    vendedorSession.listar.and.returnValue(throwError(() => new VendedorSessionExpiredError()));

    component.abrirVendedor();

    expect(component.modalAtalho).toBe('');
    expect(component.erroVendedores).toBe('');
  });

  it('erro comum de consulta F3 mostra falha de comunicacao', () => {
    const component = fixture.componentInstance;
    vendedorSession.listar.and.returnValue(throwError(() => new Error('rede')));

    component.abrirVendedor();

    expect(component.modalAtalho).toBe('vendedor');
    expect(component.erroVendedores).toBe('Falha de comunicação com o Hub local.');
  });

  it('seleciona vendedor pre-venda e mostra mensagem de pre-selecao', () => {
    const component = fixture.componentInstance;
    vendaSignal.set(null);

    component.abrirVendedor();
    component.selecionarVendedorLista(vendedorStub);
    component.confirmarVendedorSelecionado();

    expect(vendaSession.selecionarVendedor).toHaveBeenCalledWith(501);
    expect(component.modalAtalho).toBe('');
    expect(component.mensagem).toBe('Vendedor pré-selecionado.');
  });

  it('seleciona vendedor com venda aberta mantendo venda cliente itens e totais', () => {
    const component = fixture.componentInstance;
    vendaSignal.set({ ...vendaAbertaStub.venda!, cliente: clientePreselecionadoStub, vendedor: null });

    component.abrirVendedor();
    component.selecionarVendedorLista(vendedorStub);
    component.confirmarVendedorSelecionado();

    expect(vendaSession.selecionarVendedor).toHaveBeenCalledWith(501);
    expect(vendaSignal()?.uuid).toBe('venda-hub-uuid');
    expect(vendaSignal()?.cliente?.clienteUuid).toBe('cliente-uuid');
    expect(vendaSignal()?.itens[0].skuId).toBe(10825);
    expect(vendaSignal()?.total).toBe('199.90');
    expect(component.mensagem).toBe('Vendedor selecionado.');
  });

  it('remove vendedor operacional', () => {
    const component = fixture.componentInstance;
    vendaSignal.set({ ...vendaAbertaStub.venda!, vendedor: vendedorStub });

    component.abrirVendedor();
    component.removerVendedorVenda();

    expect(vendaSession.removerVendedor).toHaveBeenCalled();
    expect(component.mensagem).toBe('Vendedor removido.');
  });

  it('pagamento ativo bloqueia alterar vendedor', () => {
    const component = fixture.componentInstance;
    vendaSignal.set({ ...vendaAbertaStub.venda!, vendedor: vendedorStub, pagamentos: [{ uuid: 'pag', formaPagamentoId: 1, formaRetaguardaId: 10, codigo: 'DIN', descricao: 'Dinheiro', tipo: 'DINHEIRO', numParcelas: 1, valor: '199.90', autorizacao: '', origemCaptura: 'MANUAL', criadoEm: '2026-09-14' }] });

    component.abrirVendedor();
    component.selecionarVendedorLista(vendedorStub);
    component.confirmarVendedorSelecionado();

    expect(vendaSession.selecionarVendedor).not.toHaveBeenCalled();
  });

  it('F9 sem vendedor bloqueia pagamentos', () => {
    const component = fixture.componentInstance;
    vendaSignal.set({ ...vendaAbertaStub.venda!, vendedor: null });

    component.abrirPagamentos('TODAS');

    expect(component.modalAtalho).not.toBe('pagamentos');
    expect(component.mensagem).toBe('Selecione um vendedor antes de registrar pagamentos.');
  });

  it('F9 com vendedor mantem fluxo atual', () => {
    const component = fixture.componentInstance;
    vendaSignal.set({ ...vendaAbertaStub.venda!, vendedor: vendedorStub });

    component.abrirPagamentos('TODAS');

    expect(component.modalAtalho).toBe('pagamentos');
    expect(vendaSession.listarFormasPagamento).toHaveBeenCalled();
  });
});
