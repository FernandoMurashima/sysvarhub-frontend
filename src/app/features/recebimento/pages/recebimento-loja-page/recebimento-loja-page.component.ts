import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { forkJoin, map, of } from 'rxjs';

import { OperatorSessionService } from '../../../operador/services/operator-session.service';
import { TerminalSessionService } from '../../../terminal/services/terminal-session.service';
import {
  HubRecebimentoService,
  RecebimentoFinalizarItemRequest,
  RecebimentoItem,
  RecebimentoLoja,
  RecebimentoPessoa,
  RecebimentoStatusLocal,
} from '../../services/hub-recebimento.service';

interface RecebimentoItemForm {
  item: RecebimentoItem;
  quantidadeRecebida: number | null;
}

type StatusVisual = 'pendente' | 'conferido' | 'recebido' | 'divergente' | 'conflito';
type RecebimentoContrato = Record<string, unknown>;

@Component({
  selector: 'app-recebimento-loja-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './recebimento-loja-page.component.html',
  styleUrl: './recebimento-loja-page.component.scss',
})
export class RecebimentoLojaPageComponent implements OnInit {
  private readonly service = inject(HubRecebimentoService);
  private readonly terminalSession = inject(TerminalSessionService);
  private readonly operatorSession = inject(OperatorSessionService);

  readonly contexto = this.terminalSession.contexto;
  readonly operador = this.operatorSession.operador;
  readonly loja = computed(() => this.contexto()?.loja.apelido || this.contexto()?.loja.nome || '-');
  readonly terminal = computed(() => this.contexto()?.terminal.nome || this.contexto()?.terminal.codigo || '-');

  recebimentos: RecebimentoLoja[] = [];
  selecionado: RecebimentoLoja | null = null;
  itens: RecebimentoItemForm[] = [];
  observacaoDivergencia = '';
  mensagem = '';
  sucesso = '';
  carregandoLista = false;
  carregandoDetalhe = false;
  finalizando = false;

  ngOnInit(): void {
    this.carregar();
  }

  carregar(): void {
    this.carregandoLista = true;
    this.mensagem = '';
    this.service.listar().subscribe({
      next: (response) => {
        this.aplicarLista(response.recebimentos || []);
        this.enriquecerResumoRecebidos(this.recebimentos);
      },
      error: (erro) => {
        this.mensagem = erro.error?.detail || 'Falha ao carregar recebimentos da loja.';
        this.carregandoLista = false;
      },
    });
  }

  selecionar(recebimento: RecebimentoLoja): void {
    this.selecionado = recebimento;
    this.carregandoDetalhe = true;
    this.mensagem = '';
    this.sucesso = '';
    const recebimentoId = this.recebimentoLocalId(recebimento);
    if (!recebimentoId) {
      this.mensagem = 'Recebimento sem identificador local. Não foi possível consultar detalhes.';
      this.itens = [];
      this.carregandoDetalhe = false;
      return;
    }
    this.service.detalhar(recebimentoId).subscribe({
      next: (response) => {
        this.aplicarDetalhe(response.recebimento);
        this.carregandoDetalhe = false;
      },
      error: (erro) => {
        this.mensagem = erro.error?.detail || 'Falha ao carregar detalhe do recebimento.';
        this.carregandoDetalhe = false;
      },
    });
  }

  voltarDocumentos(): void {
    this.selecionado = null;
    this.itens = [];
    this.observacaoDivergencia = '';
    this.mensagem = '';
    this.sucesso = '';
    this.carregandoDetalhe = false;
  }

  tudoRecebido(): void {
    if (!this.podeConferir()) return;
    this.itens = this.itens.map((form) => ({ ...form, quantidadeRecebida: this.quantidadeEsperadaItem(form.item) }));
  }

  zerar(): void {
    if (!this.podeConferir()) return;
    this.itens = this.itens.map((form) => ({ ...form, quantidadeRecebida: 0 }));
  }

  finalizar(): void {
    if (!this.selecionado || this.finalizarDesabilitado()) return;
    const recebimentoId = this.recebimentoLocalId(this.selecionado);
    if (!recebimentoId) {
      this.mensagem = 'Recebimento sem identificador local. Não foi possível finalizar a conferência.';
      return;
    }
    this.finalizando = true;
    this.mensagem = '';
    this.sucesso = '';
    this.service.finalizar(recebimentoId, this.montarPayload()).subscribe({
      next: (response) => {
        this.aplicarDetalhe(response.recebimento);
        this.atualizarLista(response.recebimento);
        this.sucesso = 'Conferência registrada. A liberação do estoque aguardará confirmação da Central.';
        this.finalizando = false;
      },
      error: (erro) => {
        this.mensagem = erro.error?.detail || 'Falha ao finalizar conferência do recebimento.';
        this.finalizando = false;
      },
    });
  }

  podeConferir(): boolean {
    return this.selecionado?.status_local === 'PENDENTE' && !this.carregandoDetalhe && !this.finalizando;
  }

  finalizarDesabilitado(): boolean {
    return !this.podeConferir() || !this.recebimentoLocalId(this.selecionado) || this.itens.length === 0 || this.temQuantidadeInvalida() || this.observacaoObrigatoriaPendente();
  }

  temDivergencia(): boolean {
    return this.itens.some((form) => this.diferenca(form) !== 0);
  }

  diferenca(form: RecebimentoItemForm): number {
    return this.numero(form.quantidadeRecebida) - this.quantidadeEsperadaItem(form.item);
  }

  statusVisual(recebimento: RecebimentoLoja | null): StatusVisual {
    const statusCentral = (recebimento?.status_retaguarda || '').toUpperCase();
    if (recebimento?.status_local === 'CONFLITO') return 'conflito';
    if (statusCentral.includes('DIVERG')) return 'divergente';
    if (recebimento?.status_local === 'SINCRONIZADO') return 'recebido';
    if (recebimento?.status_local === 'CONFERIDO') return 'conferido';
    return 'pendente';
  }

  statusLabel(recebimento: RecebimentoLoja | null): string {
    const labels: Record<StatusVisual, string> = {
      pendente: 'Pendente',
      conferido: 'Conferido',
      recebido: 'Recebido',
      divergente: 'Divergente',
      conflito: 'Conflito',
    };
    return labels[this.statusVisual(recebimento)];
  }

  statusHint(recebimento: RecebimentoLoja): string {
    const hints: Record<StatusVisual, string> = {
      pendente: 'Documento aguardando conferência.',
      conferido: 'Conferência encerrada localmente, aguardando confirmação da Central.',
      recebido: 'Conferência confirmada pela Central e processamento local concluído.',
      divergente: 'Documento com divergência confirmada no fluxo da Central.',
      conflito: 'Processamento rejeitado pela Central.',
    };
    return hints[this.statusVisual(recebimento)];
  }

  numero(valor: string | number | null | undefined): number {
    const normalizado = typeof valor === 'string' ? valor.replace(',', '.') : valor;
    const numero = Number(normalizado ?? 0);
    return Number.isFinite(numero) ? numero : 0;
  }

  formatarQuantidade(valor: string | number | null | undefined): string {
    return this.numero(valor).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 3 });
  }

  documento(recebimento: RecebimentoLoja | null): string {
    const fiscal = recebimento?.documento_fiscal;
    if (!fiscal) return '-';
    const serie = fiscal.serie ? `/${fiscal.serie}` : '';
    return fiscal.numero ? `${fiscal.numero}${serie}` : fiscal.chave_acesso || '-';
  }

  origem(recebimento: RecebimentoLoja | null): string {
    if (!recebimento) return '-';
    return this.nomeUnidadeOrigem(recebimento) || recebimento.fornecedor?.nome || recebimento.documento_fiscal?.emitente_nome || this.origemLabel(recebimento.origem);
  }

  origemLabel(origem: string | undefined): string {
    const labels: Record<string, string> = {
      DISTRIBUICAO: 'Distribuição',
      FORNECEDOR: 'Fornecedor',
    };
    return labels[(origem || '').toUpperCase()] || origem || '-';
  }

  fornecedor(recebimento: RecebimentoLoja | null): string {
    return recebimento?.fornecedor?.nome || recebimento?.documento_fiscal?.emitente_nome || '-';
  }

  destino(recebimento: RecebimentoLoja | null): string {
    return recebimento?.loja?.nome || '-';
  }

  pedido(recebimento: RecebimentoLoja | null): string {
    const pedido = recebimento?.pedidos?.[0];
    if (pedido === undefined || pedido === null) return '-';
    if (typeof pedido === 'number' || typeof pedido === 'string') return String(pedido);
    return String(pedido.numero || pedido.codigo || pedido.documento || pedido.id || '-');
  }

  dataDocumento(recebimento: RecebimentoLoja | null): string {
    return this.formatarData(recebimento?.documento_fiscal?.dh_emissao || recebimento?.documento_fiscal?.emitida_em || recebimento?.conferido_em || recebimento?.confirmado_central_em);
  }

  formatarData(valor: string | null | undefined): string {
    if (!valor) return '-';
    const data = new Date(valor);
    if (Number.isNaN(data.getTime())) return valor;
    return data.toLocaleDateString('pt-BR');
  }

  quantidadeSkus(recebimento: RecebimentoLoja | null): number {
    const resumo = recebimento?.resumo?.quantidade_skus ?? recebimento?.resumo?.quantidade_itens;
    if (typeof resumo === 'number' && resumo > 0) return resumo;
    return recebimento?.itens?.length || this.itens.length || 0;
  }

  quantidadeEsperada(recebimento: RecebimentoLoja | null): number {
    if (!recebimento) return 0;
    const resumo = this.numero(recebimento.resumo?.quantidade_esperada_total ?? recebimento.resumo?.quantidade_enviada_total);
    const itens = this.totalItens(recebimento, 'esperada');
    return resumo > 0 || itens === 0 ? resumo : itens;
  }

  quantidadeRecebida(recebimento: RecebimentoLoja | null): number {
    if (!recebimento) return 0;
    const resumo = this.numero(recebimento.resumo?.quantidade_recebida_total);
    const itens = this.totalItens(recebimento, 'recebida');
    return resumo > 0 || itens === 0 ? resumo : itens;
  }

  acaoDocumento(recebimento: RecebimentoLoja): string {
    return recebimento.status_local === 'PENDENTE' ? 'Conferir' : 'Consultar';
  }

  private aplicarDetalhe(recebimento: RecebimentoLoja): void {
    this.selecionado = recebimento;
    this.observacaoDivergencia = recebimento.observacao_divergencia || '';
    this.itens = (recebimento.itens || []).map((item) => ({
      item,
      quantidadeRecebida: this.numero(item.quantidade_recebida),
    }));
  }

  private aplicarLista(recebimentos: RecebimentoLoja[]): void {
    this.recebimentos = this.ordenarRecebimentos(recebimentos);
    const atual = this.selecionado?.local_id;
    const atualizado = atual ? this.recebimentos.find((item) => item.local_id === atual) : null;
    if (this.selecionado && atualizado) {
      this.selecionado = { ...this.selecionado, ...atualizado };
    } else if (this.selecionado && !atualizado) {
      this.voltarDocumentos();
    }
    this.carregandoLista = false;
  }

  private enriquecerResumoRecebidos(recebimentos: RecebimentoLoja[]): void {
    const pendentes = recebimentos.filter((recebimento) => this.precisaDetalheParaResumo(recebimento));
    if (!pendentes.length) return;
    forkJoin(
      pendentes.map((recebimento) => {
        const id = this.recebimentoLocalId(recebimento);
        return id ? this.service.detalhar(id).pipe(map((response) => response.recebimento)) : of(recebimento);
      }),
    ).subscribe({
      next: (detalhes) => {
        const porLocalId = new Map(detalhes.map((recebimento) => [recebimento.local_id, recebimento]));
        this.recebimentos = this.ordenarRecebimentos(this.recebimentos.map((recebimento) => porLocalId.get(recebimento.local_id) || recebimento));
        if (this.selecionado) {
          const detalhe = porLocalId.get(this.selecionado.local_id);
          if (detalhe) this.selecionado = { ...this.selecionado, ...detalhe };
        }
      },
      error: () => undefined,
    });
  }

  private precisaDetalheParaResumo(recebimento: RecebimentoLoja): boolean {
    return recebimento.status_local !== 'PENDENTE' && this.numero(recebimento.resumo?.quantidade_recebida_total) === 0 && this.quantidadeEsperada(recebimento) > 0 && !recebimento.itens?.length;
  }

  private recebimentoLocalId(recebimento: RecebimentoLoja | null): number | null {
    const id = recebimento?.id ?? recebimento?.local_id;
    return typeof id === 'number' && Number.isFinite(id) && id > 0 ? id : null;
  }

  private atualizarLista(recebimento: RecebimentoLoja): void {
    this.recebimentos = this.ordenarRecebimentos(this.recebimentos.map((item) => (item.local_id === recebimento.local_id ? { ...item, ...recebimento } : item)));
  }

  private montarPayload(): { itens: RecebimentoFinalizarItemRequest[]; observacao_divergencia?: string } {
    const payload = {
      itens: this.itens.map((form) => ({
        conferencia_item_id: form.item.conferencia_item_id,
        sku_retaguarda_id: form.item.sku_retaguarda_id,
        ean: form.item.ean,
        quantidade_recebida: this.quantidadePayload(form.quantidadeRecebida),
      })),
      observacao_divergencia: this.observacaoDivergencia.trim() || undefined,
    };
    return payload;
  }

  private quantidadePayload(valor: number | null): string {
    return String(this.numero(valor));
  }

  private nomeUnidadeOrigem(recebimento: RecebimentoLoja): string {
    const origem = recebimento.unidade_origem || recebimento.loja_origem || this.objetoContrato(recebimento.contrato_retorno, 'unidade_origem') || this.objetoContrato(recebimento.contrato_retorno, 'loja_origem');
    return this.nomePessoaContrato(origem);
  }

  private objetoContrato(contrato: unknown, chave: string): RecebimentoContrato | null {
    if (!this.isContrato(contrato)) return null;
    const valor = contrato[chave];
    return this.isContrato(valor) ? valor : null;
  }

  private nomePessoaContrato(valor: RecebimentoPessoa | RecebimentoContrato | null | undefined): string {
    if (!valor) return '';
    const nome = 'nome' in valor ? valor.nome : undefined;
    const apelido = 'apelido' in valor ? valor.apelido : undefined;
    return String(apelido || nome || '').trim();
  }

  private isContrato(valor: unknown): valor is RecebimentoContrato {
    return !!valor && typeof valor === 'object' && !Array.isArray(valor);
  }

  quantidadeEsperadaItem(item: RecebimentoItem): number {
    const esperada = this.numero(item.quantidade_esperada);
    const enviada = this.numero(item.quantidade_enviada);
    return esperada > 0 || enviada === 0 ? esperada : enviada;
  }

  private totalItens(recebimento: RecebimentoLoja, tipo: 'esperada' | 'recebida'): number {
    if (this.selecionado?.local_id === recebimento.local_id && this.itens.length) {
      return this.itens.reduce((total, form) => total + (tipo === 'esperada' ? this.quantidadeEsperadaItem(form.item) : this.numero(form.quantidadeRecebida)), 0);
    }
    return (recebimento.itens || []).reduce((total, item) => total + (tipo === 'esperada' ? this.quantidadeEsperadaItem(item) : this.numero(item.quantidade_recebida)), 0);
  }

  private ordenarRecebimentos(recebimentos: RecebimentoLoja[]): RecebimentoLoja[] {
    const prioridade: Record<RecebimentoStatusLocal, number> = {
      PENDENTE: 0,
      CONFERIDO: 1,
      SINCRONIZADO: 2,
      CONFLITO: 3,
    };
    return [...recebimentos].sort((a, b) => {
      const prioridadeA = prioridade[a.status_local] ?? 9;
      const prioridadeB = prioridade[b.status_local] ?? 9;
      if (prioridadeA !== prioridadeB) return prioridadeA - prioridadeB;
      return this.documento(a).localeCompare(this.documento(b), 'pt-BR');
    });
  }

  private temQuantidadeInvalida(): boolean {
    return this.itens.some((form) => form.quantidadeRecebida === null || !Number.isFinite(form.quantidadeRecebida) || form.quantidadeRecebida < 0);
  }

  private observacaoObrigatoriaPendente(): boolean {
    return this.temDivergencia() && !this.observacaoDivergencia.trim();
  }
}
