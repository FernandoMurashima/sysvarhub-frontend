import { Component, HostListener, inject, OnDestroy, OnInit } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';

import { ClienteCadastroRequest, ClienteHubResumo, ClienteTipoPessoa, formatarDocumentoCliente } from '../../../../core/models/cliente.models';
import { FormaPagamento } from '../../../../core/models/pagamento.models';
import { VendaClienteResumo, VendaItemHubResumo } from '../../../../core/models/venda.models';
import { CaixaSessionService } from '../../../caixa/services/caixa-session.service';
import { ClienteCadastroComunicacaoIncertError, ClienteSessionExpiredError, ClienteSessionService } from '../../../cliente/services/cliente-session.service';
import { normalizarValorAbertura } from '../../../caixa/services/caixa-valor.parser';
import { OperatorSessionService } from '../../../operador/services/operator-session.service';
import { VendaSessionService } from '../../../venda/services/venda-session.service';
import { formatarMoedaString, normalizarValorPagamento, somarMoedasString } from '../../../venda/services/pagamento-valor.parser';
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

type ClienteModalModo = 'busca' | 'cadastro';

interface ClienteCadastroForm {
  tipoPessoa: ClienteTipoPessoa;
  documento: string;
  nomeCliente: string;
  apelido: string;
  telefone1: string;
  telefone2: string;
  email: string;
  aniversario: string;
  cep: string;
  endereco: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
}

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
  private readonly clienteSession = inject(ClienteSessionService);
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
  formasPagamento: FormaPagamento[] = [];
  formaPagamentoSelecionada: FormaPagamento | null = null;
  filtroPagamento: 'TODAS' | 'DINHEIRO' | 'CARTAO' | 'PIX' | 'OUTRAS' = 'TODAS';
  valorPagamento = '';
  autorizacaoPagamento = '';
  carregandoFormasPagamento = false;
  confirmandoFinalizacao = false;
  carregandoBusca = false;
  buscaCliente = '';
  clientesEncontrados: ClienteHubResumo[] = [];
  clienteListaSelecionado: ClienteHubResumo | null = null;
  carregandoClientes = false;
  erroClientes = '';
  clienteModalModo: ClienteModalModo = 'busca';
  clienteCadastro: ClienteCadastroForm = this.criarClienteCadastroForm();
  erroCadastroCliente = '';
  salvandoCliente = false;
  tabelaPreco = '-';
  catalogoVersao: number | null = null;
  catalogoSincronizadoEm: string | null = null;
  valorAbertura = '0,00';
  erroAbertura = '';
  abrindoCaixa = false;
  readonly vendedor = '-';
  private buscaTimer: ReturnType<typeof setTimeout> | null = null;
  private buscaClienteTimer: ReturnType<typeof setTimeout> | null = null;
  private buscaSubscription: Subscription | null = null;
  private clientesSubscription: Subscription | null = null;
  private cadastroClienteSubscription: Subscription | null = null;

  readonly loja = this.facade.loja;
  readonly caixa = this.facade.caixa;
  readonly terminal = this.facade.terminal;
  readonly empresa = this.facade.empresa;
  readonly operador = this.operatorSession.operador;
  readonly caixaStatus = this.caixaSession.status;
  readonly sessaoCaixa = this.caixaSession.sessao;
  readonly vendaStatus = this.vendaSession.status;
  readonly venda = this.vendaSession.venda;
  readonly clientePreselecionado = this.vendaSession.clientePreselecionado;
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
    if (this.buscaClienteTimer) clearTimeout(this.buscaClienteTimer);
    this.buscaSubscription?.unsubscribe();
    this.clientesSubscription?.unsubscribe();
    this.cadastroClienteSubscription?.unsubscribe();
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

  @HostListener('document:keydown.escape', ['$event'])
  atalhoEscape(event: KeyboardEvent): void {
    if (!this.modalAtalho) return;
    event.preventDefault();
    this.fecharAtalho();
  }

  @HostListener('document:keydown.enter', ['$event'])
  atalhoEnter(event: KeyboardEvent): void {
    if (this.modalAtalho !== 'cliente') return;
    if (this.clienteModalModo !== 'busca') return;
    const target = event.target as HTMLElement | null;
    if (target?.tagName?.toLowerCase() === 'input') return;
    event.preventDefault();
    this.confirmarClienteSelecionado();
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
    if (!produto || this.temPagamentoAtivo()) return;
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
      if (this.temPagamentoAtivo()) {
        this.mensagem = 'Remova os pagamentos antes de alterar a venda.';
        return;
      }
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
      if (this.temPagamentoAtivo()) {
        this.mensagem = 'Remova os pagamentos antes de cancelar a venda.';
        return;
      }
      this.modalAtalho = 'cancelar-venda';
      return;
    }

    if (atalho === 'pagamentos') {
      this.abrirPagamentos('TODAS');
      return;
    }

    if (atalho === 'cliente') {
      this.abrirCliente();
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
    this.limparEstadoClienteModal();
  }

  abrirCliente(): void {
    this.modalAtalho = 'cliente';
    this.mensagem = '';
    this.buscaCliente = '';
    this.clienteListaSelecionado = null;
    this.clienteModalModo = 'busca';
    this.consultarClientes('');
  }

  aoDigitarBuscaCliente(): void {
    if (this.buscaClienteTimer) clearTimeout(this.buscaClienteTimer);
    this.buscaClienteTimer = setTimeout(() => this.consultarClientes(this.buscaCliente), 250);
  }

  selecionarClienteLista(cliente: ClienteHubResumo): void {
    this.clienteListaSelecionado = cliente;
  }

  confirmarClienteSelecionado(): void {
    const cliente = this.clienteListaSelecionado;
    if (!cliente || this.clienteSelecaoBloqueada(cliente) || this.temPagamentoAtivo()) return;

    const clienteAnterior = this.clienteOperacional()?.clienteUuid || null;
    this.vendaSession.selecionarCliente(cliente.clienteUuid).subscribe((resultado) => {
      if (!resultado.ok) {
        this.mensagem = resultado.detail || 'Falha ao selecionar cliente.';
        return;
      }
      this.fecharAtalho();
      this.mensagem = clienteAnterior && clienteAnterior !== cliente.clienteUuid ? 'Cliente alterado.' : 'Cliente selecionado.';
    });
  }

  abrirCadastroCliente(): void {
    if (this.temPagamentoAtivo()) {
      this.erroClientes = 'Remova os pagamentos antes de alterar o cliente.';
      return;
    }
    this.clienteModalModo = 'cadastro';
    this.erroCadastroCliente = '';
  }

  voltarBuscaCliente(): void {
    this.clienteModalModo = 'busca';
    this.erroCadastroCliente = '';
  }

  aoTrocarTipoPessoaCliente(tipoPessoa: ClienteTipoPessoa): void {
    this.clienteCadastro.tipoPessoa = tipoPessoa;
    this.clienteCadastro.documento = '';
    this.erroCadastroCliente = '';
  }

  labelDocumentoCadastro(): string {
    return this.clienteCadastro.tipoPessoa === 'PF' ? 'CPF' : 'CNPJ';
  }

  labelNomeCadastro(): string {
    return this.clienteCadastro.tipoPessoa === 'PF' ? 'Nome' : 'Razão Social';
  }

  salvarClienteCadastro(event?: Event): void {
    event?.preventDefault();
    if (this.salvandoCliente) return;
    if (this.temPagamentoAtivo()) {
      this.erroCadastroCliente = 'Remova os pagamentos antes de alterar o cliente.';
      return;
    }

    const payload = this.montarPayloadClienteCadastro();
    const erroValidacao = this.validarPayloadClienteCadastro(payload);
    if (erroValidacao) {
      this.erroCadastroCliente = erroValidacao;
      return;
    }

    this.salvandoCliente = true;
    this.erroCadastroCliente = '';
    this.cadastroClienteSubscription?.unsubscribe();
    this.cadastroClienteSubscription = this.clienteSession.cadastrar(payload).subscribe({
      next: (cliente) => this.selecionarClienteAposCadastro(cliente),
      error: (error: unknown) => {
        this.salvandoCliente = false;
        if (error instanceof ClienteSessionExpiredError) {
          this.modalAtalho = '';
          this.limparEstadoClienteModal();
          return;
        }
        if (error instanceof ClienteCadastroComunicacaoIncertError) {
          this.erroCadastroCliente = 'Falha de comunicação com o Hub local.';
          return;
        }
        this.erroCadastroCliente = this.detailErroHttp(error) || 'Falha ao cadastrar cliente.';
      },
    });
  }

  removerClienteVenda(): void {
    if (this.temPagamentoAtivo()) return;
    const removendoClienteVenda = Boolean(this.venda());
    this.vendaSession.removerCliente().subscribe((resultado) => {
      if (!resultado.ok) {
        this.mensagem = resultado.detail || 'Falha ao remover cliente.';
        return;
      }
      this.fecharAtalho();
      this.mensagem = removendoClienteVenda ? 'Cliente removido da venda.' : 'Cliente pré-selecionado removido.';
    });
  }

  clienteSelecaoBloqueada(cliente: ClienteHubResumo): boolean {
    return !cliente.ativo || cliente.bloqueio;
  }

  formatarDocumentoCliente(cliente: ClienteHubResumo | VendaClienteResumo | null | undefined): string {
    if (!cliente) return 'Sem documento';
    return formatarDocumentoCliente(cliente.tipoPessoa || 'PF', cliente.documento);
  }

  clienteCodigoResumo(cliente: VendaClienteResumo | null | undefined): string {
    if (!cliente) return 'Consumidor não identificado';
    return cliente.retaguardaId === null ? 'LOCAL' : `Código ${cliente.retaguardaId}`;
  }

  clienteOperacional(): VendaClienteResumo | null {
    const venda = this.venda();
    return venda ? venda.cliente : this.clientePreselecionado();
  }

  clienteCidadeUf(cliente: ClienteHubResumo): string {
    const cidade = cliente.cidade.trim();
    const estado = cliente.estado.trim();
    if (cidade && estado) return `${cidade} / ${estado}`;
    return cidade || estado || '-';
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
      this.mensagem = 'Caixa aberto. Inicie a venda para incluir produtos.';
      this.vendaSession.bootstrap().subscribe();
    });
  }

  iniciarVenda(): void {
    if (this.caixaStatus() !== 'aberto') {
      this.mensagem = 'Abra o caixa antes de iniciar uma venda.';
      return;
    }
    if (this.venda()) return;

    this.vendaSession.iniciarVenda().subscribe((resultado) => {
      this.tratarResultadoOperacao(resultado, 'Venda iniciada.');
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
    return formatarMoedaString(valor);
  }

  totalDescontos(): string {
    const venda = this.venda();
    if (!venda) return '0.00';
    return somarMoedasString(venda.descontoItens, venda.descontoGeral);
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
    if (this.temPagamentoAtivo()) {
      this.mensagem = 'Remova os pagamentos antes de alterar a venda.';
      return;
    }
    this.alterarQuantidadeItem(item, item.quantidade + 1);
  }

  diminuirItem(item: VendaItemHubResumo): void {
    if (this.temPagamentoAtivo()) {
      this.mensagem = 'Remova os pagamentos antes de alterar a venda.';
      return;
    }
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
    if (this.temPagamentoAtivo()) {
      this.mensagem = 'Remova os pagamentos antes de alterar a venda.';
      return;
    }
    this.itemOperandoUuid = item.uuid;
    this.vendaSession.removerItem(item.uuid).subscribe((resultado) => {
      this.itemOperandoUuid = null;
      if (this.itemSelecionadoUuid === item.uuid) this.itemSelecionadoUuid = null;
      this.tratarResultadoOperacao(resultado, 'Item removido.');
    });
  }

  cancelarVendaConfirmada(): void {
    if (this.temPagamentoAtivo()) {
      this.fecharAtalho();
      this.mensagem = 'Remova os pagamentos antes de cancelar a venda.';
      return;
    }
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

  abrirPagamentos(filtro: 'TODAS' | 'DINHEIRO' | 'CARTAO' | 'PIX' | 'OUTRAS', event?: Event): void {
    event?.preventDefault();
    const venda = this.venda();
    if (!venda || !venda.itens.length) {
      this.mensagem = 'Inclua itens na venda antes de adicionar pagamento.';
      return;
    }
    this.modalAtalho = 'pagamentos';
    this.filtroPagamento = filtro;
    this.carregarFormasPagamento(filtro);
  }

  formasPagamentoFiltradas(): FormaPagamento[] {
    if (this.filtroPagamento === 'TODAS') return this.formasPagamento;
    if (this.filtroPagamento === 'DINHEIRO') return this.formasPagamento.filter((forma) => forma.tipo === 'DINHEIRO');
    if (this.filtroPagamento === 'PIX') return this.formasPagamento.filter((forma) => forma.tipo === 'PIX');
    if (this.filtroPagamento === 'CARTAO') {
      return this.formasPagamento.filter((forma) => ['DEBITO', 'CREDITO_ROTATIVO', 'CREDITO_PARCELADO'].includes(forma.tipo));
    }
    return this.formasPagamento.filter((forma) => !['DINHEIRO', 'PIX', 'DEBITO', 'CREDITO_ROTATIVO', 'CREDITO_PARCELADO'].includes(forma.tipo));
  }

  selecionarFormaPagamento(forma: FormaPagamento): void {
    this.formaPagamentoSelecionada = forma;
    this.valorPagamento = this.venda()?.pendente || '';
  }

  adicionarPagamento(): void {
    const venda = this.venda();
    const forma = this.formaPagamentoSelecionada;
    if (!venda || !forma) return;
    if (forma.tefHabilitado) {
      this.mensagem = 'Esta forma exige integração TEF.';
      return;
    }
    const valor = normalizarValorPagamento(this.valorPagamento);
    if (!valor) {
      this.mensagem = 'Valor de pagamento inválido.';
      return;
    }
    this.vendaSession.adicionarPagamento(venda.uuid, forma.id, valor, this.autorizacaoPagamento.trim()).subscribe((resultado) => {
      if (resultado.ok) {
        this.valorPagamento = this.venda()?.pendente || '';
        this.autorizacaoPagamento = '';
        this.mensagem = 'Pagamento adicionado.';
        return;
      }
      this.mensagem = resultado.detail || 'Falha ao adicionar pagamento.';
    });
  }

  removerPagamento(pagamentoUuid: string): void {
    this.vendaSession.removerPagamento(pagamentoUuid).subscribe((resultado) => {
      this.mensagem = resultado.ok ? 'Pagamento removido.' : resultado.detail || 'Falha ao remover pagamento.';
    });
  }

  abrirConfirmacaoFinalizacao(): void {
    const venda = this.venda();
    if (!venda || !venda.itens.length || !venda.pagamentos.length || venda.pendente !== '0.00') {
      this.mensagem = 'Finalize somente após itens e pagamento completo.';
      return;
    }
    this.confirmandoFinalizacao = true;
  }

  finalizarVendaConfirmada(): void {
    const venda = this.venda();
    if (!venda) return;
    this.vendaSession.finalizarVenda(venda.uuid).subscribe((resultado) => {
      this.confirmandoFinalizacao = false;
      if (!resultado.ok) {
        this.mensagem = resultado.detail || 'Falha ao finalizar venda.';
        return;
      }
      const troco = venda.troco !== '0.00' ? ` Troco: ${this.formatarMoeda(venda.troco)}.` : '';
      this.fecharAtalho();
      this.itemSelecionadoUuid = null;
      this.busca = '';
      this.produtos = [];
      this.produtoSelecionado = null;
      this.mensagem = `Venda finalizada com sucesso.${troco}`;
    });
  }

  temPagamentoAtivo(): boolean {
    return Boolean(this.venda()?.pagamentos.length);
  }

  categoriaDisponivel(categoria: 'DINHEIRO' | 'CARTAO' | 'PIX' | 'OUTRAS'): boolean {
    return this.formasPorCategoria(categoria).length > 0;
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
    if (!this.venda()) {
      this.mensagem = 'Inicie a venda antes de incluir produtos.';
      return;
    }
    if (this.temPagamentoAtivo()) {
      this.mensagem = 'Remova os pagamentos antes de alterar a venda.';
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

  private carregarFormasPagamento(filtro: 'TODAS' | 'DINHEIRO' | 'CARTAO' | 'PIX' | 'OUTRAS'): void {
    this.carregandoFormasPagamento = true;
    this.vendaSession.listarFormasPagamento().subscribe({
      next: (response) => {
        this.formasPagamento = response.formas;
        this.carregandoFormasPagamento = false;
        const formas = filtro === 'TODAS' ? response.formas : this.formasPorCategoria(filtro);
        this.formaPagamentoSelecionada = formas[0] || response.formas[0] || null;
        this.valorPagamento = this.venda()?.pendente || '';
      },
      error: () => {
        this.carregandoFormasPagamento = false;
        this.mensagem = 'Falha ao carregar formas de pagamento.';
      },
    });
  }

  private formasPorCategoria(categoria: 'DINHEIRO' | 'CARTAO' | 'PIX' | 'OUTRAS'): FormaPagamento[] {
    const anteriores = this.filtroPagamento;
    this.filtroPagamento = categoria;
    const formas = this.formasPagamentoFiltradas();
    this.filtroPagamento = anteriores;
    return formas;
  }

  private consultarClientes(termo: string): void {
    this.clientesSubscription?.unsubscribe();
    this.carregandoClientes = true;
    this.erroClientes = '';
    this.clientesSubscription = this.clienteSession.listar(termo).subscribe({
      next: (resultado) => {
        this.clientesEncontrados = resultado.clientes;
        this.clienteListaSelecionado = resultado.clientes[0] || null;
        this.carregandoClientes = false;
      },
      error: (error: unknown) => {
        if (error instanceof ClienteSessionExpiredError) {
          this.modalAtalho = '';
          this.limparEstadoClienteModal();
          return;
        }
        this.clientesEncontrados = [];
        this.clienteListaSelecionado = null;
        this.carregandoClientes = false;
        this.erroClientes = 'Falha de comunicação com o Hub local.';
      },
    });
  }

  private limparEstadoClienteModal(): void {
    if (this.buscaClienteTimer) clearTimeout(this.buscaClienteTimer);
    this.clientesSubscription?.unsubscribe();
    this.cadastroClienteSubscription?.unsubscribe();
    this.buscaCliente = '';
    this.clientesEncontrados = [];
    this.clienteListaSelecionado = null;
    this.carregandoClientes = false;
    this.erroClientes = '';
    this.clienteModalModo = 'busca';
    this.clienteCadastro = this.criarClienteCadastroForm();
    this.erroCadastroCliente = '';
    this.salvandoCliente = false;
  }

  private selecionarClienteAposCadastro(cliente: ClienteHubResumo): void {
    this.vendaSession.selecionarCliente(cliente.clienteUuid).subscribe((resultado) => {
      this.salvandoCliente = false;
      if (!resultado.ok) {
        this.erroCadastroCliente = 'Cliente cadastrado, mas não foi possível selecioná-lo.';
        return;
      }
      const tinhaVenda = Boolean(this.venda());
      this.fecharAtalho();
      this.mensagem = tinhaVenda ? 'Cliente cadastrado e selecionado.' : 'Cliente cadastrado e pré-selecionado.';
    });
  }

  private criarClienteCadastroForm(): ClienteCadastroForm {
    return {
      tipoPessoa: 'PF',
      documento: '',
      nomeCliente: '',
      apelido: '',
      telefone1: '',
      telefone2: '',
      email: '',
      aniversario: '',
      cep: '',
      endereco: '',
      numero: '',
      complemento: '',
      bairro: '',
      cidade: '',
      estado: '',
    };
  }

  private montarPayloadClienteCadastro(): ClienteCadastroRequest {
    const form = this.clienteCadastro;
    const payload: ClienteCadastroRequest = {
      tipo_pessoa: form.tipoPessoa,
      documento: this.apenasDigitos(form.documento),
      nome_cliente: form.nomeCliente.trim(),
    };
    this.adicionarCampoOpcional(payload, 'apelido', form.apelido.trim());
    this.adicionarCampoOpcional(payload, 'telefone1', this.apenasDigitos(form.telefone1));
    this.adicionarCampoOpcional(payload, 'telefone2', this.apenasDigitos(form.telefone2));
    this.adicionarCampoOpcional(payload, 'email', form.email.trim());
    this.adicionarCampoOpcional(payload, 'aniversario', form.aniversario.trim());
    this.adicionarCampoOpcional(payload, 'cep', this.apenasDigitos(form.cep));
    this.adicionarCampoOpcional(payload, 'endereco', form.endereco.trim());
    this.adicionarCampoOpcional(payload, 'numero', form.numero.trim());
    this.adicionarCampoOpcional(payload, 'complemento', form.complemento.trim());
    this.adicionarCampoOpcional(payload, 'bairro', form.bairro.trim());
    this.adicionarCampoOpcional(payload, 'cidade', form.cidade.trim());
    this.adicionarCampoOpcional(payload, 'estado', form.estado.trim().toUpperCase());
    return payload;
  }

  private validarPayloadClienteCadastro(payload: ClienteCadastroRequest): string {
    const tamanhoDocumento = payload.tipo_pessoa === 'PF' ? 11 : 14;
    if (!payload.documento || payload.documento.length !== tamanhoDocumento) return `Informe um ${payload.tipo_pessoa === 'PF' ? 'CPF' : 'CNPJ'} válido.`;
    if (!payload.nome_cliente) return payload.tipo_pessoa === 'PF' ? 'Informe o nome do cliente.' : 'Informe a razão social.';
    if (payload.estado && payload.estado.length > 2) return 'UF deve ter no máximo 2 caracteres.';
    if (payload.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) return 'E-mail inválido.';
    return '';
  }

  private adicionarCampoOpcional(payload: ClienteCadastroRequest, campo: keyof ClienteCadastroRequest, valor: string): void {
    if (valor) {
      (payload as unknown as Record<string, string>)[campo] = valor;
    }
  }

  private apenasDigitos(valor: string): string {
    return valor.replace(/\D/g, '');
  }

  private detailErroHttp(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      const body = error.error as { detail?: string } | null;
      return body?.detail || error.message;
    }
    return '';
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
