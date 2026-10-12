import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { OperatorSessionService } from '../../../operador/services/operator-session.service';
import { TerminalSessionService } from '../../../terminal/services/terminal-session.service';
import { PendenciaSyncEvento, PendenciasSyncResponse, PendenciasSyncService } from '../../services/pendencias-sync.service';

type PayloadTecnico = Record<string, unknown>;

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

  tipoLabel(tipo: string | null | undefined): string {
    const labels: Record<string, string> = {
      DISTRIBUICAO_LOJA_CONFERIDA: 'Recebimento de distribuição',
      RECEBIMENTO_LOJA_CONFERIDO: 'Recebimento de loja',
      NFCE_ATUALIZADA: 'NFC-e atualizada',
      VENDA_FINALIZADA: 'Venda finalizada',
      DEVOLUCAO_FINALIZADA: 'Devolução finalizada',
    };
    const normalizado = String(tipo || '').toUpperCase();
    return labels[normalizado] || this.humanizarCodigo(normalizado || '-');
  }

  documentoLabel(evento: PendenciaSyncEvento): string {
    const payload = this.payload(evento);
    const tipo = String(evento.tipo || '').toUpperCase();
    if (tipo === 'DISTRIBUICAO_LOJA_CONFERIDA') {
      return this.primeiroTexto([
        this.comPrefixo('NF-e', payload['nfe_numero']),
        this.comPrefixo('Pedido', payload['pedido_distribuicao_id']),
        this.comChaveAcesso(payload['nfe_chave']),
        evento.documento,
      ]) || 'Recebimento de distribuição';
    }
    if (tipo === 'RECEBIMENTO_LOJA_CONFERIDO') {
      return this.primeiroTexto([
        this.comPrefixo('Recebimento', payload['recebimento_id']),
        this.comPrefixo('NF-e', payload['nfe_numero']),
        evento.documento,
      ]) || 'Recebimento de loja';
    }
    if (tipo === 'NFCE_ATUALIZADA') {
      return this.primeiroTexto([
        this.comPrefixo('NFC-e', payload['numero']),
        this.comPrefixo('Venda', payload['venda_uuid'], 8),
        evento.documento,
      ]) || 'NFC-e';
    }
    if (tipo === 'VENDA_FINALIZADA') {
      return this.primeiroTexto([
        String(payload['documento'] || ''),
        this.comPrefixo('Venda', payload['venda_uuid'], 8),
        evento.documento,
      ]) || 'Venda';
    }
    if (tipo === 'DEVOLUCAO_FINALIZADA') {
      const vale = this.objeto(payload['vale_troca']);
      return this.primeiroTexto([
        String(payload['documento'] || ''),
        String(payload['documento_venda'] || ''),
        String(vale?.['documento'] || ''),
        this.comPrefixo('Devolução', payload['devolucao_uuid'], 8),
        evento.documento,
      ]) || 'Devolução';
    }
    return this.documentoSeguro(evento.documento, this.tipoLabel(evento.tipo));
  }

  documentoTecnico(evento: PendenciaSyncEvento | null): string {
    if (!evento) return '-';
    return evento.documento || evento.evento_uuid || '-';
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

  private payload(evento: PendenciaSyncEvento): PayloadTecnico {
    return this.objeto(evento.payload_tecnico) || {};
  }

  private objeto(valor: unknown): PayloadTecnico | null {
    return valor && typeof valor === 'object' && !Array.isArray(valor) ? valor as PayloadTecnico : null;
  }

  private primeiroTexto(valores: Array<string | null | undefined>): string {
    return valores.map((valor) => this.documentoSeguro(valor || '', '')).find(Boolean) || '';
  }

  private documentoSeguro(valor: string, fallback: string): string {
    const texto = String(valor || '').trim();
    if (!texto || this.pareceUuid(texto)) return fallback;
    return texto;
  }

  private comPrefixo(prefixo: string, valor: unknown, limite?: number): string {
    const texto = String(valor || '').trim();
    if (!texto) return '';
    const reduzido = limite ? texto.slice(0, limite) : texto;
    return `${prefixo} ${reduzido}`;
  }

  private comChaveAcesso(valor: unknown): string {
    const texto = String(valor || '').trim();
    return texto ? `Chave ${texto.slice(-8)}` : '';
  }

  private pareceUuid(valor: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(valor.trim());
  }

  private humanizarCodigo(codigo: string): string {
    return codigo
      .toLowerCase()
      .split('_')
      .filter(Boolean)
      .map((parte, index) => index === 0 ? parte.charAt(0).toUpperCase() + parte.slice(1) : parte)
      .join(' ');
  }
}
