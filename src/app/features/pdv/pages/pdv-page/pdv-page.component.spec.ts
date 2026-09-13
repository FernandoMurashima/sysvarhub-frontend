import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { signal } from '@angular/core';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';

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

describe('PdvPageComponent', () => {
  let fixture: ComponentFixture<PdvPageComponent>;
  let facade: jasmine.SpyObj<PdvHubFacade>;

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

    await TestBed.configureTestingModule({
      imports: [PdvPageComponent, RouterTestingModule],
      providers: [{ provide: PdvHubFacade, useValue: facade }],
    }).compileComponents();

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

  it('nao mostra fallback FERNANDO nem tabela VAREJO hardcoded', () => {
    const text = fixture.nativeElement.textContent;

    expect(text).toContain('Operador não identificado');
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
    expect(text).toContain('Venda será habilitada após abertura do caixa');
    expect(component.carrinho.length).toBe(0);
  });

  it('ENTER com resultado exato seleciona produto', () => {
    const component = fixture.componentInstance;

    component.busca = '7892701000013';
    component.aoEnterBusca(new KeyboardEvent('keydown', { key: 'Enter' }));

    expect(component.produtoSelecionado?.skuId).toBe(10825);
    expect(component.carrinho.length).toBe(0);
  });

  it('preco null nao ganha fallback', () => {
    const component = fixture.componentInstance;

    component.selecionarProduto(produtoSemPreco);
    fixture.detectChanges();

    expect(component.formatarPreco(produtoSemPreco.precoVenda)).toBe('-');
    expect(fixture.nativeElement.textContent).toContain('SEM_PRECO');
    expect(fixture.nativeElement.textContent).not.toContain('199,90');
    expect(fixture.nativeElement.textContent).not.toContain('399,90');
  });

  it('mantem F2-F10 visuais e recurso pendente nao chama API inexistente', () => {
    const component = fixture.componentInstance;
    const text = fixture.nativeElement.textContent;

    ['F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10'].forEach((atalho) => {
      expect(text).toContain(atalho);
    });

    component.abrirAtalho(new Event('click'), 'pagamentos');

    expect(component.mensagem).toBe('Recurso ainda não integrado ao Hub.');
    expect(facade.buscarCatalogo).not.toHaveBeenCalled();
  });
});
