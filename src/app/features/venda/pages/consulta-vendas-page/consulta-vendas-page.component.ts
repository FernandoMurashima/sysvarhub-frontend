import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { DanfeNfce, DanfeVia } from '../../../../core/models/danfe-nfce.models';
import { FormaPagamento } from '../../../../core/models/pagamento.models';
import {
  ConsultaVendasFiltros,
  ConsultaVendasPaginada,
  VendaConsultaDetalhe,
  VendaConsultaPagamentoResumo,
  VendaConsultaResumo,
  VendaConsultaStatus,
  VendaSincronizacaoStatus,
} from '../../../../core/models/venda.models';
import { DanfeNfceComponent } from '../../../pdv/components/danfe-nfce/danfe-nfce.component';
import { OperatorSessionService } from '../../../operador/services/operator-session.service';
import { CentralConnectivityService } from '../../../terminal/services/central-connectivity.service';
import { TerminalSessionService } from '../../../terminal/services/terminal-session.service';
import { HubVendaService } from '../../services/hub-venda.service';

type StatusOpcao = { valor: VendaConsultaStatus; label: string };

@Component({
  selector: 'app-consulta-vendas-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, DanfeNfceComponent],
  templateUrl: './consulta-vendas-page.component.html',
  styleUrl: './consulta-vendas-page.component.scss',
})
export class ConsultaVendasPageComponent implements OnInit {
  private readonly vendaService = inject(HubVendaService);
  private readonly terminalSession = inject(TerminalSessionService);
  private readonly operatorSession = inject(OperatorSessionService);
  private readonly centralConnectivity = inject(CentralConnectivityService);

  readonly contexto = this.terminalSession.contexto;
  readonly operador = this.operatorSession.operador;
  readonly centralStatus = this.centralConnectivity.status;
  readonly loja = computed(() => this.contexto()?.loja.apelido || this.contexto()?.loja.nome || '-');
  readonly terminal = computed(() => this.contexto()?.terminal.nome || this.contexto()?.terminal.codigo || '-');
  readonly statusOpcoes: StatusOpcao[] = [
    { valor: 'FINALIZADA', label: 'Finalizada' },
    { valor: 'ABERTA', label: 'Aberta' },
    { valor: 'CANCELADA', label: 'Cancelada' },
  ];

  readonly hoje = this.dataHoje();
  filtros = this.filtrosIniciais();
  resposta: ConsultaVendasPaginada | null = null;
  formasPagamento: FormaPagamento[] = [];
  selecionada: VendaConsultaResumo | null = null;
  detalhe: VendaConsultaDetalhe | null = null;
  carregando = false;
  carregandoDetalhe = false;
  carregandoDanfe = false;
  mensagem = '';
  mensagemDetalhe = '';
  erroDanfe = '';
  danfe: DanfeNfce | null = null;
  pageSize = 20;

  ngOnInit(): void {
    this.centralConnectivity.startPolling();
    this.carregarFormasPagamento();
    this.carregar();
  }

  buscar(): void {
    this.filtros.page = 1;
    this.carregar();
  }

  limpar(): void {
    this.filtros = this.filtrosIniciais();
    this.pageSize = 20;
    this.carregar();
  }

  aoAlterarFiltro(): void {
    this.filtros.page = 1;
  }

  alterarPageSize(): void {
    this.filtros.pageSize = this.pageSize;
    this.buscar();
  }

  pagina(delta: number): void {
    const total = this.resposta?.totalPages || 1;
    this.filtros.page = Math.min(total, Math.max(1, (this.resposta?.page || this.filtros.page || 1) + delta));
    this.carregar();
  }

  carregar(): void {
    this.carregando = true;
    this.mensagem = '';
    this.detalhe = null;
    this.mensagemDetalhe = '';
    this.vendaService.listarVendas({ ...this.filtros, pageSize: this.pageSize }).subscribe({
      next: (response) => {
        this.resposta = response;
        this.selecionada = response.results.find((venda) => venda.vendaUuid === this.selecionada?.vendaUuid) || null;
        this.carregando = false;
      },
      error: (erro) => {
        this.resposta = null;
        this.selecionada = null;
        this.mensagem = erro.error?.detail || 'Falha ao consultar vendas.';
        this.carregando = false;
      },
    });
  }

  selecionar(venda: VendaConsultaResumo): void {
    this.selecionada = venda;
    this.detalhe = null;
    this.mensagemDetalhe = '';
    this.danfe = null;
    this.erroDanfe = '';
    this.carregandoDetalhe = true;
    this.vendaService.detalharVenda(venda.vendaUuid).subscribe({
      next: (detalhe) => {
        this.detalhe = detalhe;
        this.carregandoDetalhe = false;
      },
      error: (erro) => {
        this.mensagemDetalhe = erro.error?.detail || 'Falha ao carregar detalhe da venda.';
        this.carregandoDetalhe = false;
      },
    });
  }

  visualizarDanfe(via: DanfeVia = 'CONSUMIDOR'): void {
    if (!this.detalhe?.nfce) return;
    this.carregandoDanfe = true;
    this.erroDanfe = '';
    this.danfe = null;
    this.vendaService.obterDanfeNfce(this.detalhe.vendaUuid, via).subscribe({
      next: (danfe) => {
        this.danfe = danfe;
        this.carregandoDanfe = false;
      },
      error: (erro) => {
        this.erroDanfe = erro.error?.detail || 'Não foi possível carregar o DANFE.';
        this.carregandoDanfe = false;
      },
    });
  }

  fecharDanfe(): void {
    this.danfe = null;
    this.erroDanfe = '';
  }

  pagamentoResumo(pagamentos: VendaConsultaPagamentoResumo[]): string {
    if (!pagamentos.length) return '-';
    return pagamentos.map((pagamento) => pagamento.codigo || pagamento.descricao).join(' + ');
  }

  parcelasResumo(pagamento: { parcelas: { ordem: number; dias: number }[]; numParcelas: number }): string {
    if (!pagamento.parcelas.length) return `${pagamento.numParcelas}x`;
    return pagamento.parcelas.map((parcela) => `${parcela.ordem}x ${parcela.dias}d`).join(' · ');
  }

  statusLabel(status: VendaSincronizacaoStatus | string): string {
    const labels: Record<string, string> = {
      PENDENTE: 'Pendente',
      PROCESSANDO: 'Processando',
      SINCRONIZADO: 'Sincronizado',
      ERRO: 'Erro',
      CONFLITO: 'Conflito',
      SEM_EVENTO: 'Sem evento',
    };
    return labels[status] || status;
  }

  formatarMoeda(valor: string | number | null | undefined): string {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(valor || 0));
  }

  formatarData(valor: string | null | undefined): string {
    if (!valor) return '-';
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(valor)).replace(',', '');
  }

  private carregarFormasPagamento(): void {
    this.vendaService.listarFormasPagamento().subscribe({
      next: (response) => {
        this.formasPagamento = response.formas;
      },
      error: () => {
        this.formasPagamento = [];
      },
    });
  }

  private filtrosIniciais(): ConsultaVendasFiltros {
    return {
      dataIni: this.hoje,
      dataFim: this.hoje,
      documento: '',
      cliente: '',
      vendedor: '',
      formaPagamento: '',
      nfce: '',
      status: 'FINALIZADA',
      page: 1,
      pageSize: 20,
    };
  }

  private dataHoje(): string {
    const agora = new Date();
    const local = new Date(agora.getTime() - agora.getTimezoneOffset() * 60_000);
    return local.toISOString().slice(0, 10);
  }
}
