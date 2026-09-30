import { Component, Injector, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { DevolucaoCliente, DevolucaoClienteVenda, VendaDevolucaoConsulta, VendaDevolucaoResultado } from '../../../../core/models/venda.models';
import { OperatorSessionService } from '../../../operador/services/operator-session.service';
import { CentralConnectivityService } from '../../../terminal/services/central-connectivity.service';
import { TerminalSessionService } from '../../../terminal/services/terminal-session.service';
import { HubVendaService } from '../../../venda/services/hub-venda.service';

type HubModuleKey = 'devolucao-troca' | 'consulta-vendas' | 'vale-troca' | 'pendencias-sincronizacao';

const MODULE_CONTENT: Record<HubModuleKey, { title: string; eyebrow: string; description: string }> = {
  'devolucao-troca': {
    title: 'Devolução / Troca',
    eyebrow: 'Módulo operacional',
    description: 'Estrutura dedicada ao fluxo de devoluções e trocas da loja.',
  },
  'consulta-vendas': {
    title: 'Consulta de Vendas',
    eyebrow: 'Módulo operacional',
    description: 'Base para localização e acompanhamento de vendas realizadas no Hub.',
  },
  'vale-troca': {
    title: 'Vale-Troca',
    eyebrow: 'Módulo operacional',
    description: 'Área reservada ao acompanhamento de vales-troca da operação local.',
  },
  'pendencias-sincronizacao': {
    title: 'Pendências de Sincronização',
    eyebrow: 'Monitor operacional',
    description: 'Base visual para acompanhar eventos locais pendentes de envio ou tratamento.',
  },
};

@Component({
  selector: 'app-hub-module-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './hub-module-page.component.html',
  styleUrl: './hub-module-page.component.scss',
})
export class HubModulePageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly terminalSession = inject(TerminalSessionService);
  private readonly operatorSession = inject(OperatorSessionService);
  private readonly centralConnectivity = inject(CentralConnectivityService);
  private readonly injector = inject(Injector);

  readonly contexto = this.terminalSession.contexto;
  readonly operador = this.operatorSession.operador;
  readonly moduleKey = this.route.snapshot.data['moduleKey'] as HubModuleKey | undefined;
  readonly content = computed(() => MODULE_CONTENT[this.moduleKey || 'devolucao-troca']);
  readonly loja = computed(() => this.contexto()?.loja.apelido || this.contexto()?.loja.nome || '-');
  readonly terminal = computed(() => this.contexto()?.terminal.nome || this.contexto()?.terminal.codigo || '-');
  readonly operadorPerfil = computed(() => this.operador()?.perfil?.nome || this.operador()?.tipo || '-');
  readonly centralStatus = this.centralConnectivity.status;
  readonly centralUltimoContato = this.centralConnectivity.lastContactLabel;
  readonly centralResumo = computed(() => this.centralUltimoContato() ? `${this.centralStatus()} · ${this.centralUltimoContato()}` : this.centralStatus());
  modoBusca: 'cupom' | 'cliente' = 'cupom';
  documentoBusca = '';
  clienteBusca = '';
  motivo = '';
  venda: VendaDevolucaoConsulta | null = null;
  clientes: DevolucaoCliente[] = [];
  clienteSelecionado: DevolucaoCliente | null = null;
  vendasCliente: DevolucaoClienteVenda[] = [];
  quantidades: Record<string, number> = {};
  confirmando = false;
  carregando = false;
  mensagem = '';
  resultado: VendaDevolucaoResultado | null = null;

  ngOnInit(): void {
    this.centralConnectivity.startPolling();
  }

  buscarCupom(): void {
    if (this.centralStatus() !== 'ONLINE') {
      this.mensagem = 'Central OFFLINE. A contingência offline será tratada em etapa posterior.';
      return;
    }
    if (!this.documentoBusca.trim()) {
      this.mensagem = 'Informe a venda ou cupom.';
      return;
    }
    this.carregando = true;
    this.vendaService().consultarDevolucao(this.documentoBusca.trim()).subscribe({
      next: (response) => this.aplicarVenda(response.venda),
      error: (erro) => this.aplicarErro(erro, 'Venda/cupom não encontrado.'),
    });
  }

  pesquisarCliente(): void {
    if (this.centralStatus() !== 'ONLINE') {
      this.mensagem = 'Central OFFLINE. A pesquisa online ficará disponível quando a Central retornar.';
      return;
    }
    if (!this.clienteBusca.trim()) {
      this.mensagem = 'Informe CPF/documento ou nome da cliente.';
      return;
    }
    this.carregando = true;
    this.vendaService().pesquisarClientesDevolucao(this.clienteBusca.trim()).subscribe({
      next: (response) => {
        this.clientes = response.clientes;
        this.carregando = false;
        this.mensagem = response.clientes.length ? '' : 'Cliente não encontrada.';
      },
      error: (erro) => this.aplicarErro(erro, 'Falha ao pesquisar cliente.'),
    });
  }

  selecionarCliente(cliente: DevolucaoCliente): void {
    this.clienteSelecionado = cliente;
    this.carregando = true;
    this.vendaService().listarVendasClienteDevolucao(cliente.id).subscribe({
      next: (response) => {
        this.vendasCliente = response.vendas;
        this.carregando = false;
        this.mensagem = response.vendas.length ? '' : 'Cliente sem vendas finalizadas para devolução.';
      },
      error: (erro) => this.aplicarErro(erro, 'Falha ao carregar vendas da cliente.'),
    });
  }

  selecionarVendaCliente(venda: DevolucaoClienteVenda): void {
    this.carregando = true;
    this.vendaService().consultarDevolucaoPorVendaId(venda.id).subscribe({
      next: (response) => this.aplicarVenda(response.venda),
      error: (erro) => this.aplicarErro(erro, 'Falha ao carregar produtos da venda.'),
    });
  }

  totalCredito(): number {
    return (this.venda?.itens || []).reduce((total, item) => {
      const key = this.itemKey(item);
      const qtd = Number(this.quantidades[key] || 0);
      const disponivel = Number(item.quantidade_disponivel ?? item.quantidade);
      const base = Number(item.valor_liquido_disponivel || item.total_item || 0);
      return total + (disponivel > 0 ? (base / disponivel) * qtd : 0);
    }, 0);
  }

  finalizar(): void {
    if (!this.venda?.id) {
      this.mensagem = 'Venda inválida para finalização online.';
      return;
    }
    const itens = this.venda.itens
      .map((item) => ({ venda_item: item.id, quantidade: Number(this.quantidades[this.itemKey(item)] || 0) }))
      .filter((item) => item.venda_item && item.quantidade > 0);
    if (!itens.length) {
      this.mensagem = 'Selecione ao menos um produto com quantidade maior que zero.';
      return;
    }
    this.carregando = true;
    this.vendaService().finalizarDevolucao('', itens, this.motivo, this.uuid(), this.venda.id).subscribe({
      next: (response) => {
        this.resultado = response.devolucao;
        this.confirmando = false;
        this.carregando = false;
        this.mensagem = 'Devolução concluída.';
      },
      error: (erro) => this.aplicarErro(erro, 'Falha ao finalizar devolução.'),
    });
  }

  itemKey(item: { id?: number; item_uuid?: string }): string {
    return String(item.id ?? item.item_uuid ?? '');
  }

  ajustarQuantidade(key: string, max: number): void {
    const valor = Math.max(0, Math.min(Number(this.quantidades[key] || 0), Number(max || 0)));
    this.quantidades[key] = valor;
  }

  formatarMoeda(valor: string | number | undefined): string {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(valor || 0));
  }

  private aplicarVenda(venda: VendaDevolucaoConsulta): void {
    this.venda = venda;
    this.quantidades = {};
    this.confirmando = false;
    this.resultado = null;
    this.carregando = false;
    this.mensagem = '';
  }

  private aplicarErro(erro: { error?: { detail?: string } }, fallback: string): void {
    this.mensagem = erro.error?.detail || fallback;
    this.carregando = false;
  }

  private uuid(): string {
    return globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
  }

  private vendaService(): HubVendaService {
    return this.injector.get(HubVendaService);
  }
}
