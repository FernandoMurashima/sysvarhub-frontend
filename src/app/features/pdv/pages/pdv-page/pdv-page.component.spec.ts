import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { Subject, of, throwError } from 'rxjs';

import { SessaoCaixaHubResumo } from '../../../../core/models/caixa.models';
import { ClienteHubResumo } from '../../../../core/models/cliente.models';
import { CaixaSessionService } from '../../../caixa/services/caixa-session.service';
import { ClienteSessionExpiredError, ClienteSessionService } from '../../../cliente/services/cliente-session.service';
import { OperatorSessionService } from '../../../operador/services/operator-session.service';
import { VendaSessionService } from '../../../venda/services/venda-session.service';
import { clientePreselecionadoStub, sessaoCaixaAbertaStub, vendaAbertaStub } from '../../../../testing/terminal-test-data';
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
  let caixaSession: jasmine.SpyObj<CaixaSessionService>;
  let vendaSession: jasmine.SpyObj<VendaSessionService>;
  let caixaStatusSignal = signal<'inicializando' | 'fechado' | 'aberto' | 'erro'>('aberto');
  let sessaoCaixaSignal = signal<SessaoCaixaHubResumo | null>(sessaoCaixaAbertaStub);
  let vendaSignal = signal(vendaAbertaStub.venda);
  let clientePreselecionadoSignal = signal(null as typeof clientePreselecionadoStub | null);
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
    operatorSession = jasmine.createSpyObj<OperatorSessionService>('OperatorSessionService', ['logout'], {
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
    caixaStatusSignal = signal<'inicializando' | 'fechado' | 'aberto' | 'erro'>('aberto');
    sessaoCaixaSignal = signal(sessaoCaixaAbertaStub);
    caixaSession = jasmine.createSpyObj<CaixaSessionService>('CaixaSessionService', ['bootstrap', 'abrir'], {
      status: caixaStatusSignal.asReadonly(),
      sessao: sessaoCaixaSignal.asReadonly(),
    });
    caixaSession.bootstrap.and.returnValue(of(true));
    caixaSession.abrir.and.returnValue(of({ ok: true }));
    vendaSignal = signal(vendaAbertaStub.venda);
    clientePreselecionadoSignal = signal(null as typeof clientePreselecionadoStub | null);
    vendaStatusSignal = signal<'inicializando' | 'sem-venda' | 'aberta' | 'erro'>('aberta');
    vendaLoadingSignal = signal(false);
    vendaSession = jasmine.createSpyObj<VendaSessionService>('VendaSessionService', ['bootstrap', 'iniciarVenda', 'adicionarItem', 'alterarQuantidade', 'removerItem', 'cancelarVenda', 'limparEstado', 'listarFormasPagamento', 'adicionarPagamento', 'removerPagamento', 'finalizarVenda', 'selecionarCliente', 'removerCliente'], {
      venda: vendaSignal.asReadonly(),
      clientePreselecionado: clientePreselecionadoSignal.asReadonly(),
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

    await TestBed.configureTestingModule({
      imports: [PdvPageComponent, RouterTestingModule.withRoutes([{ path: 'operador', component: EmptyRouteComponent }])],
      providers: [
        { provide: PdvHubFacade, useValue: facade },
        { provide: OperatorSessionService, useValue: operatorSession },
        { provide: ClienteSessionService, useValue: clienteSession },
        { provide: CaixaSessionService, useValue: caixaSession },
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

  it('F10 nao chama fechamento de caixa', () => {
    const component = fixture.componentInstance;

    component.atalhoF10(new KeyboardEvent('keydown', { key: 'F10' }));

    expect(component.mensagem).toBe('Fechamento de caixa será integrado em etapa posterior.');
    expect(caixaSession.abrir).not.toHaveBeenCalled();
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

    ['F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10'].forEach((atalho) => {
      expect(text).toContain(atalho);
    });

    component.abrirAtalho(new Event('click'), 'pagamentos');

    expect(component.modalAtalho).toBe('pagamentos');
    expect(vendaSession.listarFormasPagamento).toHaveBeenCalled();
    expect(facade.buscarCatalogo).not.toHaveBeenCalled();
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
});
