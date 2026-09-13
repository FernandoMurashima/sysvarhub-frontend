import { Component, HostListener, inject, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';

import { VendaItemHubResumo } from '../../../../core/models/venda.models';
import { CaixaSessionService } from '../../../caixa/services/caixa-session.service';
import { normalizarValorAbertura } from '../../../caixa/services/caixa-valor.parser';
import { OperatorSessionService } from '../../../operador/services/operator-session.service';
import { VendaSessionService } from '../../../venda/services/venda-session.service';
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
  private readonly vendaSession = inject(VendaSessionService);
  private readonly router = inject(Router);

  busca = '';
  buscaModal = '';
  produtos: PdvProdutoConsulta[] = [];
  produtosPreco: PdvProdutoConsulta[] = [];
  produtoSelecionado: PdvProdutoConsulta | null = null;
  carrinho: PdvProdutoConsulta[] = [];
  itemSelecionadoUuid: string | null = null;
  itemOperandoUuid: string | null = null;
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
  readonly vendaStatus = this.vendaSession.status;
  readonly venda = this.vendaSession.venda;
  readonly vendaLoading = this.vendaSession.loadingOperacao;

  ngOnInit(): void {
    this.caixaSession.bootstrap().subscribe((aberto) => {
      if (aberto) {
        this.vendaSession.bootstrap().subscribe();
      } else {
        this.vendaSession.limparEstado();
      }
    });
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
    if (!produto) return;
    this.adicionarProduto(produto);
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

    if (atalho === 'cancelar-item') {
      const item = this.venda()?.itens.find((linha) => linha.uuid === this.itemSelecionadoUuid);
      if (!item) {
        this.mensagem = 'Selecione um item para cancelar.';
        return;
      }
      this.removerItem(item);
      return;
    }

    if (atalho === 'cancelar-venda') {
      if (!this.venda()) {
        this.mensagem = 'Nenhuma venda em andamento.';
        return;
      }
      this.modalAtalho = 'cancelar-venda';
      return;
    }

    if (atalho === 'pagamentos') {
      this.mensagem = 'Pagamento será habilitado na próxima etapa.';
      return;
    }

    if (atalho === 'fechamento') {
      this.mensagem = 'Fechamento de caixa será integrado em etapa posterior.';
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
      this.mensagem = 'Caixa aberto. Venda local pronta para bipagem.';
      this.vendaSession.bootstrap().subscribe();
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

  totalDescontos(): string {
    const venda = this.venda();
    if (!venda) return '0.00';
    const descontoItens = Number(venda.descontoItens || '0');
    const descontoGeral = Number(venda.descontoGeral || '0');
    return (descontoItens + descontoGeral).toFixed(2);
  }

  motivos(produto: PdvProdutoConsulta): string {
    return produto.motivosBloqueio.length ? produto.motivosBloqueio.join(', ') : '-';
  }

  codigoItemVenda(item: VendaItemHubResumo): string {
    return item.ean13 || item.codigoItemRef || item.referencia || '-';
  }

  selecionarItemVenda(item: VendaItemHubResumo): void {
    this.itemSelecionadoUuid = item.uuid;
  }

  aumentarItem(item: VendaItemHubResumo): void {
    this.alterarQuantidadeItem(item, item.quantidade + 1);
  }

  diminuirItem(item: VendaItemHubResumo): void {
    if (item.quantidade <= 1) {
      this.mensagem = 'Use remover para excluir item com quantidade 1.';
      return;
    }
    this.alterarQuantidadeItem(item, item.quantidade - 1);
  }

  alterarQuantidadeItem(item: VendaItemHubResumo, quantidade: number): void {
    this.itemOperandoUuid = item.uuid;
    this.vendaSession.alterarQuantidade(item.uuid, quantidade).subscribe((resultado) => {
      this.itemOperandoUuid = null;
      this.tratarResultadoOperacao(resultado, 'Quantidade atualizada.');
    });
  }

  removerItem(item: VendaItemHubResumo): void {
    this.itemOperandoUuid = item.uuid;
    this.vendaSession.removerItem(item.uuid).subscribe((resultado) => {
      this.itemOperandoUuid = null;
      if (this.itemSelecionadoUuid === item.uuid) this.itemSelecionadoUuid = null;
      this.tratarResultadoOperacao(resultado, 'Item removido.');
    });
  }

  cancelarVendaConfirmada(): void {
    this.vendaSession.cancelarVenda().subscribe((resultado) => {
      this.fecharAtalho();
      if (resultado.ok) {
        this.itemSelecionadoUuid = null;
        this.produtoSelecionado = null;
        this.mensagem = 'Venda cancelada.';
        return;
      }
      this.tratarResultadoOperacao(resultado, 'Venda cancelada.');
    });
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
            if (exato.vendavel) {
              this.adicionarProduto(exato);
            }
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
      ? 'Produto selecionado. Pressione ENTER no código exato ou use Adicionar.'
      : 'Produto selecionado para consulta. Venda será habilitada após abertura do caixa.';
  }

  private adicionarProduto(produto: PdvProdutoConsulta): void {
    this.produtoSelecionado = produto;
    if (this.caixaStatus() !== 'aberto') {
      this.mensagem = 'Operação de venda será habilitada após abertura do caixa.';
      return;
    }
    if (!produto.vendavel) {
      this.mensagem = `Produto bloqueado: ${this.motivos(produto)}`;
      return;
    }

    this.vendaSession.adicionarItem(produto.skuId, 1).subscribe((resultado) => {
      this.tratarResultadoOperacao(resultado, 'Item adicionado.');
      if (resultado.ok) {
        this.produtos = [];
        this.busca = '';
      }
    });
  }

  private tratarResultadoOperacao(resultado: { ok: boolean; detail?: string; estoqueDisponivel?: string }, sucesso: string): void {
    if (resultado.ok) {
      this.mensagem = sucesso;
      return;
    }
    if (resultado.detail === 'Saldo disponível insuficiente.' && resultado.estoqueDisponivel) {
      this.mensagem = `Saldo disponível insuficiente. Disponível para nova inclusão: ${this.formatarQuantidade(resultado.estoqueDisponivel)}.`;
      return;
    }
    if (resultado.detail === 'Caixa não está aberto.') {
      this.caixaSession.bootstrap().subscribe();
    }
    this.mensagem = resultado.detail || 'Falha de comunicação com o Hub local.';
  }
}
