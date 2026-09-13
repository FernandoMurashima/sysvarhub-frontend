import { Component, HostListener, inject, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';

import { CaixaSessionService } from '../../../caixa/services/caixa-session.service';
import { normalizarValorAbertura } from '../../../caixa/services/caixa-valor.parser';
import { OperatorSessionService } from '../../../operador/services/operator-session.service';
import { PdvProdutoConsulta } from '../../models/pdv-produto-consulta.model';
import { PdvHubFacade } from '../../services/pdv-hub.facade';

type PdvAtalho =
  | 'cliente'
  | 'vendedor'
  | 'resumo'
  | 'cancelar-item'
  | 'cancelar-venda'
  | 'preco'
  | 'despesa'
  | 'pagamentos'
  | 'fechamento';

@Component({
  selector: 'app-pdv-page',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './pdv-page.component.html',
  styleUrl: './pdv-page.component.scss',
})
export class PdvPageComponent implements OnInit, OnDestroy {
  readonly facade = inject(PdvHubFacade);
  private readonly operatorSession = inject(OperatorSessionService);
  private readonly caixaSession = inject(CaixaSessionService);
  private readonly router = inject(Router);

  busca = '';
  buscaModal = '';
  produtos: PdvProdutoConsulta[] = [];
  produtosPreco: PdvProdutoConsulta[] = [];
  produtoSelecionado: PdvProdutoConsulta | null = null;
  carrinho: PdvProdutoConsulta[] = [];
  mensagem = '';
  mensagemAlerta = '';
  modalAtalho: PdvAtalho | '' = '';
  carregandoBusca = false;
  tabelaPreco = '-';
  catalogoVersao: number | null = null;
  catalogoSincronizadoEm: string | null = null;
  valorAbertura = '0,00';
  erroAbertura = '';
  abrindoCaixa = false;
  readonly vendedor = '-';
  private buscaTimer: ReturnType<typeof setTimeout> | null = null;
  private buscaSubscription: Subscription | null = null;

  readonly loja = this.facade.loja;
  readonly caixa = this.facade.caixa;
  readonly terminal = this.facade.terminal;
  readonly empresa = this.facade.empresa;
  readonly operador = this.operatorSession.operador;
  readonly caixaStatus = this.caixaSession.status;
  readonly sessaoCaixa = this.caixaSession.sessao;

  ngOnInit(): void {
    this.caixaSession.bootstrap().subscribe();
  }

  get hora(): string {
    return new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(new Date());
  }

  get data(): string {
    return new Intl.DateTimeFormat('pt-BR').format(new Date());
  }

  ngOnDestroy(): void {
    if (this.buscaTimer) clearTimeout(this.buscaTimer);
    this.buscaSubscription?.unsubscribe();
  }

  @HostListener('document:keydown.f2', ['$event'])
  atalhoF2(event: KeyboardEvent): void {
    this.abrirAtalho(event, 'cliente');
  }

  @HostListener('document:keydown.f3', ['$event'])
  atalhoF3(event: KeyboardEvent): void {
    this.abrirAtalho(event, 'vendedor');
  }

  @HostListener('document:keydown.f4', ['$event'])
  atalhoF4(event: KeyboardEvent): void {
    this.abrirAtalho(event, 'resumo');
  }

  @HostListener('document:keydown.f5', ['$event'])
  atalhoF5(event: KeyboardEvent): void {
    this.abrirAtalho(event, 'cancelar-item');
  }

  @HostListener('document:keydown.f6', ['$event'])
  atalhoF6(event: KeyboardEvent): void {
    this.abrirAtalho(event, 'cancelar-venda');
  }

  @HostListener('document:keydown.f7', ['$event'])
  atalhoF7(event: KeyboardEvent): void {
    this.abrirAtalho(event, 'preco');
  }

  @HostListener('document:keydown.f8', ['$event'])
  atalhoF8(event: KeyboardEvent): void {
    this.abrirAtalho(event, 'despesa');
  }

  @HostListener('document:keydown.f9', ['$event'])
  atalhoF9(event: KeyboardEvent): void {
    this.abrirAtalho(event, 'pagamentos');
  }

  @HostListener('document:keydown.f10', ['$event'])
  atalhoF10(event: KeyboardEvent): void {
    this.abrirAtalho(event, 'fechamento');
  }

  aoDigitarBusca(): void {
    if (this.buscaTimer) clearTimeout(this.buscaTimer);

    const termo = this.busca.trim();
    if (termo.length < 2) {
      this.produtos = [];
      this.carregandoBusca = false;
      return;
    }

    this.carregandoBusca = true;
    this.buscaTimer = setTimeout(() => this.consultarProdutos(termo), 250);
  }

  aoEnterBusca(event: Event): void {
    event.preventDefault();
    const termo = this.busca.trim();
    if (termo) this.consultarProdutos(termo, true);
  }

  selecionarProduto(produto: PdvProdutoConsulta): void {
    this.produtoSelecionado = produto;
    this.mensagem = produto.vendavel
      ? this.mensagemVendaPendente()
      : `Produto bloqueado: ${this.motivos(produto)}`;
  }

  tentarAdicionarProduto(produto: PdvProdutoConsulta | null): void {
    if (produto) this.selecionarProduto(produto);
    this.mensagem = this.caixaStatus() === 'aberto'
      ? 'Caixa aberto. Integração da venda será habilitada na próxima etapa.'
      : 'Operação de venda será habilitada após abertura do caixa.';
  }

  limpar(): void {
    this.produtoSelecionado = null;
    this.produtos = [];
    this.busca = '';
    this.mensagem = '';
  }

  abrirAtalho(event: Event, atalho: PdvAtalho): void {
    event.preventDefault();
    event.stopPropagation();

    if (atalho === 'preco') {
      this.modalAtalho = 'preco';
      this.buscaModal = this.busca;
      this.produtosPreco = this.produtos;
      return;
    }

    this.modalAtalho = atalho;
    this.mensagem = 'Recurso ainda não integrado ao Hub.';
  }

  fecharAtalho(): void {
    this.modalAtalho = '';
    this.buscaModal = '';
    this.produtosPreco = [];
  }

  selecionarValorAbertura(event: Event): void {
    const input = event.target as HTMLInputElement;
    input.select();
  }

  abrirCaixa(event?: Event): void {
    event?.preventDefault();
    if (this.abrindoCaixa) return;

    const valor = normalizarValorAbertura(this.valorAbertura);
    if (!valor) {
      this.erroAbertura = 'Valor de abertura inválido.';
      return;
    }

    this.abrindoCaixa = true;
    this.erroAbertura = '';
    this.caixaSession.abrir(valor).subscribe((resultado) => {
      this.abrindoCaixa = false;
      if (!resultado.ok) {
        this.erroAbertura = resultado.detail || 'Falha de comunicação com o Hub local.';
        return;
      }
      this.valorAbertura = '0,00';
      this.mensagem = 'Caixa aberto. Integração da venda será habilitada na próxima etapa.';
    });
  }

  trocarOperador(): void {
    this.operatorSession.logout().subscribe(() => {
      void this.router.navigateByUrl('/operador');
    });
  }

  buscarPrecoAtalho(): void {
    const termo = this.buscaModal.trim();
    if (termo.length < 2) {
      this.produtosPreco = [];
      return;
    }

    this.facade.buscarCatalogo(termo, 40).subscribe({
      next: (resultado) => {
        this.atualizarMetadadosCatalogo(resultado.tabelaPrecoNome, resultado.catalogoVersao, resultado.catalogoSincronizadoEm);
        this.produtosPreco = resultado.itens;
      },
      error: () => {
        this.produtosPreco = [];
        this.mensagem = 'Falha de comunicação com o Hub local.';
      },
    });
  }

  formatarPreco(valor: string | null): string {
    if (valor === null) return '-';
    const numero = Number(valor);
    if (Number.isNaN(numero)) return valor;
    return numero.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  formatarQuantidade(valor: string | null | undefined): string {
    if (!valor) return '-';
    const numero = Number(valor);
    if (Number.isNaN(numero)) return valor;
    return numero.toLocaleString('pt-BR', { maximumFractionDigits: 3 });
  }

  formatarDataHora(valor: string | null | undefined): string {
    if (!valor) return '-';
    return new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(new Date(valor));
  }

  formatarMoeda(valor: string | null | undefined): string {
    if (!valor) return 'R$ 0,00';
    const normalizado = valor.replace(',', '.');
    const [inteiro, decimal = '00'] = normalizado.split('.');
    return `R$ ${Number(inteiro).toLocaleString('pt-BR')},${decimal.padEnd(2, '0').slice(0, 2)}`;
  }

  motivos(produto: PdvProdutoConsulta): string {
    return produto.motivosBloqueio.length ? produto.motivosBloqueio.join(', ') : '-';
  }

  private consultarProdutos(termo: string, selecionarExato = false): void {
    this.buscaSubscription?.unsubscribe();
    this.carregandoBusca = true;
    this.buscaSubscription = this.facade.buscarCatalogo(termo, 40).subscribe({
      next: (resultado) => {
        this.atualizarMetadadosCatalogo(resultado.tabelaPrecoNome, resultado.catalogoVersao, resultado.catalogoSincronizadoEm);
        this.produtos = resultado.itens;
        this.carregandoBusca = false;

        if (selecionarExato) {
          const exato = this.encontrarProdutoExato(termo, resultado.itens);
          if (exato) {
            this.selecionarProduto(exato);
            this.produtos = [];
            this.busca = '';
          }
        }
      },
      error: () => {
        this.carregandoBusca = false;
        this.produtos = [];
        this.mensagem = 'Falha de comunicação com o Hub local.';
      },
    });
  }

  private encontrarProdutoExato(termo: string, produtos: PdvProdutoConsulta[]): PdvProdutoConsulta | null {
    const normalizado = termo.trim().toLowerCase();
    const exatos = produtos.filter((produto) =>
      [produto.ean13, produto.codigoItemRef, produto.referencia]
        .filter(Boolean)
        .some((valor) => String(valor).toLowerCase() === normalizado),
    );

    return exatos.length === 1 ? exatos[0] : null;
  }

  private atualizarMetadadosCatalogo(tabela: string, versao: number | null, sincronizadoEm: string | null): void {
    this.tabelaPreco = tabela || '-';
    this.catalogoVersao = versao;
    this.catalogoSincronizadoEm = sincronizadoEm;
  }

  private mensagemVendaPendente(): string {
    return this.caixaStatus() === 'aberto'
      ? 'Caixa aberto. Integração da venda será habilitada na próxima etapa.'
      : 'Produto selecionado para consulta. Venda será habilitada após abertura do caixa.';
  }
}
