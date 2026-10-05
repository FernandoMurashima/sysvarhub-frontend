import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { OperatorSessionService } from '../../../operador/services/operator-session.service';
import { TerminalSessionService } from '../../../terminal/services/terminal-session.service';
import { PendenciaSyncEvento, PendenciasSyncResponse, PendenciasSyncService } from '../../services/pendencias-sync.service';

@Component({
  selector: 'app-pendencias-sincronizacao-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './pendencias-sincronizacao-page.component.html',
  styleUrl: './pendencias-sincronizacao-page.component.scss',
})
export class PendenciasSincronizacaoPageComponent implements OnInit {
  private readonly service = inject(PendenciasSyncService);
  private readonly terminalSession = inject(TerminalSessionService);
  private readonly operatorSession = inject(OperatorSessionService);

  readonly contexto = this.terminalSession.contexto;
  readonly operador = this.operatorSession.operador;
  readonly loja = computed(() => this.contexto()?.loja.apelido || this.contexto()?.loja.nome || '-');
  readonly terminal = computed(() => this.contexto()?.terminal.nome || this.contexto()?.terminal.codigo || '-');

  resposta: PendenciasSyncResponse | null = null;
  selecionado: PendenciaSyncEvento | null = null;
  carregando = false;
  mensagem = '';
  status = '';
  tipo = '';
  busca = '';
  somenteProblemas = false;
  page = 1;
  pageSize = 20;
  readonly atalhos = [
    { label: 'Todos', status: '' },
    { label: 'Pendentes', status: 'PENDENTE' },
    { label: 'Erros', status: 'ERRO' },
    { label: 'Conflitos', status: 'CONFLITO' },
    { label: 'Sincronizados', status: 'SINCRONIZADO' },
  ];

  ngOnInit(): void {
    this.carregar();
  }

  carregar(): void {
    this.carregando = true;
    this.mensagem = '';
    this.service
      .listar({ status: this.status, tipo: this.tipo, q: this.busca, problemas: this.somenteProblemas, page: this.page, pageSize: this.pageSize })
      .subscribe({
        next: (response) => {
          this.resposta = response;
          this.selecionado = response.eventos.find((evento) => evento.id === this.selecionado?.id) || response.eventos[0] || null;
          this.carregando = false;
        },
        error: (erro) => {
          this.mensagem = erro.error?.detail || 'Falha ao carregar pendências de sincronização.';
          this.carregando = false;
        },
      });
  }

  aplicarAtalho(status: string): void {
    this.status = status;
    this.page = 1;
    this.carregar();
  }

  pesquisar(): void {
    this.page = 1;
    this.carregar();
  }

  selecionar(evento: PendenciaSyncEvento): void {
    this.selecionado = evento;
  }

  retry(evento: PendenciaSyncEvento): void {
    if (!evento.acoes.retry_permitido) return;
    if (this.centralOffline()) {
      this.mensagem = 'Central OFFLINE. A ação ficará disponível quando a Central retornar.';
      return;
    }
    this.carregando = true;
    this.service.retry(evento.id).subscribe({
      next: () => this.carregar(),
      error: (erro) => {
        this.mensagem = erro.error?.detail || 'Retry não permitido para este evento.';
        if (erro.error?.evento) this.selecionado = erro.error.evento;
        this.carregando = false;
      },
    });
  }

  pagina(delta: number): void {
    const total = this.resposta?.paginacao.pages || 1;
    this.page = Math.min(total, Math.max(1, this.page + delta));
    this.carregar();
  }

  statusLabel(status: string): string {
    const labels: Record<string, string> = {
      PENDENTE: 'Pendente',
      PROCESSANDO: 'Processando',
      SINCRONIZADO: 'Sincronizado',
      ERRO: 'Erro',
      CONFLITO: 'Conflito',
      AGUARDANDO_DEPENDENCIA: 'Aguardando dependência',
    };
    return labels[status] || status;
  }

  json(valor: unknown): string {
    return JSON.stringify(valor || {}, null, 2);
  }

  centralOffline(): boolean {
    return this.resposta?.central?.status === 'OFFLINE';
  }

  retryDesabilitado(evento: PendenciaSyncEvento): boolean {
    return this.carregando || this.centralOffline() || !evento.acoes.retry_permitido;
  }
}
