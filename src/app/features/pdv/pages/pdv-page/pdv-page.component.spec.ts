import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';

import { SessaoCaixaHubResumo } from '../../../../core/models/caixa.models';
import { CaixaSessionService } from '../../../caixa/services/caixa-session.service';
import { OperatorSessionService } from '../../../operador/services/operator-session.service';
import { VendaSessionService } from '../../../venda/services/venda-session.service';
import { sessaoCaixaAbertaStub, vendaAbertaStub } from '../../../../testing/terminal-test-data';
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

@Component({
  standalone: true,
  template: '',
})
class EmptyRouteComponent {}

describe('PdvPageComponent', () => {
  let fixture: ComponentFixture<PdvPageComponent>;
  let facade: jasmine.SpyObj<PdvHubFacade>;
  let operatorSession: jasmine.SpyObj<OperatorSessionService>;
  let caixaSession: jasmine.SpyObj<CaixaSessionService>;
  let vendaSession: jasmine.SpyObj<VendaSessionService>;
  let caixaStatusSignal = signal<'inicializando' | 'fechado' | 'aberto' | 'erro'>('aberto');
  let sessaoCaixaSignal = signal<SessaoCaixaHubResumo | null>(sessaoCaixaAbertaStub);
  let vendaSignal = signal(vendaAbertaStub.venda);
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
    caixaStatusSignal = signal<'inicializando' | 'fechado' | 'aberto' | 'erro'>('aberto');
    sessaoCaixaSignal = signal(sessaoCaixaAbertaStub);
    caixaSession = jasmine.createSpyObj<CaixaSessionService>('CaixaSessionService', ['bootstrap', 'abrir'], {
      status: caixaStatusSignal.asReadonly(),
      sessao: sessaoCaixaSignal.asReadonly(),
    });
    caixaSession.bootstrap.and.returnValue(of(true));
    caixaSession.abrir.and.returnValue(of({ ok: true }));
    vendaSignal = signal(vendaAbertaStub.venda);
    vendaStatusSignal = signal<'inicializando' | 'sem-venda' | 'aberta' | 'erro'>('aberta');
    vendaLoadingSignal = signal(false);
    vendaSession = jasmine.createSpyObj<VendaSessionService>('VendaSessionService', ['bootstrap', 'adicionarItem', 'alterarQuantidade', 'removerItem', 'cancelarVenda', 'limparEstado'], {
      venda: vendaSignal.asReadonly(),
      status: vendaStatusSignal.asReadonly(),
      loadingOperacao: vendaLoadingSignal.asReadonly(),
    });
    vendaSession.bootstrap.and.returnValue(of(true));
    vendaSession.adicionarItem.and.returnValue(of({ ok: true }));
    vendaSession.alterarQuantidade.and.returnValue(of({ ok: true }));
    vendaSession.removerItem.and.returnValue(of({ ok: true }));
    vendaSession.cancelarVenda.and.returnValue(of({ ok: true }));

    await TestBed.configureTestingModule({
      imports: [PdvPageComponent, RouterTestingModule.withRoutes([{ path: 'operador', component: EmptyRouteComponent }])],
      providers: [
        { provide: PdvHubFacade, useValue: facade },
        { provide: OperatorSessionService, useValue: operatorSession },
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

  it('preco null nao ganha fallback', () => {
    const component = fixture.componentInstance;

    component.selecionarProduto(produtoSemPreco);
    fixture.detectChanges();

    expect(component.formatarPreco(produtoSemPreco.precoVenda)).toBe('-');
    expect(fixture.nativeElement.textContent).toContain('SEM_PRECO');
    expect(fixture.nativeElement.textContent).not.toContain('399,90');
  });

  it('mantem F2-F10 visuais e recurso pendente nao chama API inexistente', () => {
    const component = fixture.componentInstance;
    const text = fixture.nativeElement.textContent;

    ['F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10'].forEach((atalho) => {
      expect(text).toContain(atalho);
    });

    component.abrirAtalho(new Event('click'), 'pagamentos');

    expect(component.mensagem).toBe('Pagamento será habilitado na próxima etapa.');
    expect(facade.buscarCatalogo).not.toHaveBeenCalled();
  });
});
