import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { OperatorSessionService } from '../../../operador/services/operator-session.service';
import { TerminalSessionService } from '../../../terminal/services/terminal-session.service';
import {
  HubRecebimentoService,
  RecebimentoFinalizarItemRequest,
  RecebimentoItem,
  RecebimentoLoja,
  RecebimentoStatusLocal,
} from '../../services/hub-recebimento.service';

interface RecebimentoItemForm {
  item: RecebimentoItem;
  quantidadeRecebida: number | null;
}

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
        this.recebimentos = response.recebimentos || [];
        const atual = this.selecionado?.local_id;
        const proximo = atual ? this.recebimentos.find((item) => item.local_id === atual) : this.recebimentos[0];
        this.carregandoLista = false;
        if (proximo) {
          this.selecionar(proximo);
        } else {
          this.selecionado = null;
          this.itens = [];
        }
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
    const recebimentoId = this.recebimentoCentralId(recebimento);
    if (!recebimentoId) {
      this.mensagem = 'Recebimento sem identificador da Central. Não foi possível consultar detalhes.';
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

  tudoRecebido(): void {
    if (!this.podeConferir()) return;
    this.itens = this.itens.map((form) => ({ ...form, quantidadeRecebida: this.numero(form.item.quantidade_esperada) }));
  }

  zerar(): void {
    if (!this.podeConferir()) return;
    this.itens = this.itens.map((form) => ({ ...form, quantidadeRecebida: 0 }));
  }

  finalizar(): void {
    if (!this.selecionado || this.finalizarDesabilitado()) return;
    const recebimentoId = this.recebimentoCentralId(this.selecionado);
    if (!recebimentoId) {
      this.mensagem = 'Recebimento sem identificador da Central. Não foi possível finalizar a conferência.';
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
    return !this.podeConferir() || !this.recebimentoCentralId(this.selecionado) || this.itens.length === 0 || this.temQuantidadeInvalida() || this.observacaoObrigatoriaPendente();
  }

  temDivergencia(): boolean {
    return this.itens.some((form) => this.diferenca(form) !== 0);
  }

  diferenca(form: RecebimentoItemForm): number {
    return this.numero(form.quantidadeRecebida) - this.numero(form.item.quantidade_esperada);
  }

  statusLabel(status: string | undefined): string {
    const labels: Record<string, string> = {
      PENDENTE: 'Pendente',
      CONFERIDO: 'Conferido localmente',
      SINCRONIZADO: 'Confirmado pela Central',
      CONFLITO: 'Conflito',
    };
    return labels[status || ''] || status || '-';
  }

  statusHint(recebimento: RecebimentoLoja): string {
    const hints: Record<RecebimentoStatusLocal, string> = {
      PENDENTE: 'Aguardando conferência local.',
      CONFERIDO: 'Conferido no Hub. Estoque ainda não liberado para venda.',
      SINCRONIZADO: 'Confirmado pela Central. Estoque liberado conforme retorno central.',
      CONFLITO: 'Rejeitado pela Central. Não liberar mercadoria para venda.',
    };
    return hints[recebimento.status_local] || '-';
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

  fornecedor(recebimento: RecebimentoLoja | null): string {
    return recebimento?.fornecedor?.nome || recebimento?.documento_fiscal?.emitente_nome || '-';
  }

  private aplicarDetalhe(recebimento: RecebimentoLoja): void {
    this.selecionado = recebimento;
    this.observacaoDivergencia = recebimento.observacao_divergencia || '';
    this.itens = (recebimento.itens || []).map((item) => ({
      item,
      quantidadeRecebida: this.numero(item.quantidade_recebida),
    }));
  }

  private recebimentoCentralId(recebimento: RecebimentoLoja | null): number | null {
    const id = recebimento?.id;
    return typeof id === 'number' && Number.isFinite(id) && id > 0 ? id : null;
  }

  private atualizarLista(recebimento: RecebimentoLoja): void {
    this.recebimentos = this.recebimentos.map((item) => (item.local_id === recebimento.local_id ? { ...item, ...recebimento } : item));
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

  private temQuantidadeInvalida(): boolean {
    return this.itens.some((form) => form.quantidadeRecebida === null || !Number.isFinite(form.quantidadeRecebida) || form.quantidadeRecebida < 0);
  }

  private observacaoObrigatoriaPendente(): boolean {
    return this.temDivergencia() && !this.observacaoDivergencia.trim();
  }
}
