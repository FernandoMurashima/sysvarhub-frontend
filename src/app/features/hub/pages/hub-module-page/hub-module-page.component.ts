import { Component, Injector, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { DevolucaoCliente, DevolucaoClienteVenda, VendaDevolucaoConsulta, VendaDevolucaoItem, VendaDevolucaoResultado } from '../../../../core/models/venda.models';
import { OperatorSessionService } from '../../../operador/services/operator-session.service';
import { CentralConnectivityService } from '../../../terminal/services/central-connectivity.service';
import { TerminalSessionService } from '../../../terminal/services/terminal-session.service';
import { HubVendaService } from '../../../venda/services/hub-venda.service';

type HubModuleKey = 'devolucao-troca' | 'consulta-vendas' | 'pendencias-sincronizacao';

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
  private resultadoLocal = false;
  private tentativaDevolucao: { assinatura: string; uuid: string } | null = null;

  ngOnInit(): void {
    this.centralConnectivity.startPolling();
  }

  buscarCupom(): void {
    if (this.carregando) return;
    if (!this.documentoBusca.trim()) {
      this.mensagem = 'Informe a venda ou cupom.';
      return;
    }
    this.limparVenda();
    this.carregando = true;
    this.vendaService().consultarDevolucao(this.documentoBusca.trim()).subscribe({
      next: (response) => this.aplicarVenda(response.venda),
      error: (erro) => {
        if (erro.status === 404 && this.centralStatus() !== 'ONLINE') {
          this.mensagem = 'Venda finalizada não encontrada nesta loja. Não é possível devolver offline sem a venda original registrada no Hub. Confira o cupom/documento ou aguarde a conexão com a Central.';
          this.carregando = false;
        } else {
          this.aplicarErro(erro, 'Venda/cupom não encontrado.');
        }
      },
    });
  }

  pesquisarCliente(): void {
    if (this.carregando) return;
    if (this.centralStatus() !== 'ONLINE') {
      this.mensagem = 'Pesquisa por cliente disponível somente online. Localize a venda original pelo cupom/documento para devolver offline.';
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
    if (this.carregando || !this.exigirPesquisaOnline()) return;
    this.limparVenda();
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
    if (this.carregando || !this.exigirPesquisaOnline()) return;
    this.limparVenda();
    this.carregando = true;
    this.vendaService().consultarDevolucaoPorVendaId(venda.id).subscribe({
      next: (response) => this.aplicarVenda(response.venda),
      error: (erro) => this.aplicarErro(erro, 'Falha ao carregar produtos da venda.'),
    });
  }

  vendaLocal(): boolean {
    return !!this.venda?.uuid && !this.venda.id;
  }

  creditoItem(item: VendaDevolucaoItem): number {
    const qtd = Number(this.quantidades[this.itemKey(item)] ?? 0);
    if (!this.quantidadeValida(item, qtd)) return 0;
    const divisor = Number(this.vendaLocal() ? item.quantidade : (item.quantidade_disponivel ?? item.quantidade));
    const base = Number(this.vendaLocal() ? item.total_item : (item.valor_liquido_disponivel ?? item.total_item));
    const valor = divisor > 0 ? (base / divisor) * qtd : 0;
    return this.vendaLocal() ? Math.round((valor + Number.EPSILON) * 100) / 100 : valor;
  }

  totalCredito(): number {
    return (this.venda?.itens || []).reduce((total, item) => total + this.creditoItem(item), 0);
  }

  itensSelecionados(): VendaDevolucaoItem[] {
    return (this.venda?.itens || []).filter((item) => Number(this.quantidades[this.itemKey(item)] ?? 0) > 0);
  }

  podeFinalizar(): boolean {
    return !this.carregando && !this.resultado && !!this.venda
      && (this.vendaLocal() || (!!this.venda.id && this.centralStatus() === 'ONLINE'))
      && this.venda.itens.every((item) => this.quantidadeValida(item, Number(this.quantidades[this.itemKey(item)] ?? 0)))
      && this.itensSelecionados().length > 0 && this.totalCredito() > 0;
  }

  abrirConfirmacao(): void {
    if (this.podeFinalizar()) this.confirmando = true;
  }

  finalizar(): void {
    if (this.carregando || this.resultado) return;
    const venda = this.venda;
    const local = this.vendaLocal();
    if (!venda || (!local && !venda.id)) {
      this.mensagem = 'Localize uma venda finalizada para devolução.';
      return;
    }
    if (!local && this.centralStatus() !== 'ONLINE') {
      this.mensagem = 'Esta venda foi consultada na Central. Aguarde a conexão para finalizar ou localize a venda original registrada neste Hub pelo cupom/documento.';
      return;
    }
    if (!venda.itens.every((item) => this.quantidadeValida(item, Number(this.quantidades[this.itemKey(item)] ?? 0)))) {
      this.mensagem = 'Informe quantidades inteiras entre zero e o saldo disponível.';
      return;
    }
    const selecionados = this.itensSelecionados();
    if (!selecionados.length || this.totalCredito() <= 0) {
      this.mensagem = 'Selecione ao menos um produto com quantidade maior que zero.';
      return;
    }
    const itens = selecionados.map((item) => local
      ? { item_uuid: item.item_uuid, quantidade: Number(this.quantidades[this.itemKey(item)]) }
      : { venda_item: item.id, quantidade: Number(this.quantidades[this.itemKey(item)]) });
    const assinatura = JSON.stringify([local ? venda.uuid : venda.id, itens, this.motivo]);
    if (this.tentativaDevolucao?.assinatura !== assinatura) {
      this.tentativaDevolucao = { assinatura, uuid: this.uuid() };
    }
    this.carregando = true;
    this.vendaService().finalizarDevolucao(local ? venda.uuid : '', itens, this.motivo, this.tentativaDevolucao.uuid, local ? undefined : venda.id).subscribe({
      next: (response) => {
        if (!response?.devolucao?.uuid) {
          this.aplicarErro({}, 'Resposta de confirmação inválida. Tente novamente para consultar o resultado da mesma operação.');
          return;
        }
        this.resultado = response.devolucao;
        this.resultadoLocal = local;
        this.tentativaDevolucao = null;
        this.confirmando = false;
        this.carregando = false;
        this.mensagem = this.resultadoProvisorio() ? 'Devolução registrada no Hub. Sincronização pendente com a Central.' : 'Devolução concluída.';
      },
      error: (erro) => this.aplicarErro(erro, 'Falha ao finalizar devolução. Tente novamente para repetir a mesma operação.'),
    });
  }

  resultadoProvisorio(): boolean {
    const vale = this.resultado?.vale_troca;
    return !!this.resultado && (this.resultadoLocal || !!vale?.provisorio || /^VT-HUB(?:-|$)/i.test(vale?.documento || ''));
  }

  itemKey(item: { id?: number; item_uuid?: string }): string {
    return String(this.vendaLocal() ? (item.item_uuid ?? '') : (item.id ?? ''));
  }

  ajustarQuantidade(key: string, max: number): void {
    const valor = Number(this.quantidades[key] ?? 0);
    this.quantidades[key] = Number.isFinite(valor) ? Math.max(0, Math.min(Math.floor(valor), Number(max || 0))) : 0;
  }

  novaDevolucao(): void {
    if (this.carregando) return;
    this.limparVenda();
    this.tentativaDevolucao = null;
    this.documentoBusca = '';
    this.motivo = '';
    this.mensagem = '';
  }

  private quantidadeValida(item: VendaDevolucaoItem, quantidade: number): boolean {
    const identificador = this.vendaLocal() ? item.item_uuid : item.id;
    return !!identificador && Number.isInteger(quantidade) && quantidade >= 0
      && quantidade <= Number(item.quantidade_disponivel ?? item.quantidade);
  }

  private exigirPesquisaOnline(): boolean {
    if (this.centralStatus() === 'ONLINE') return true;
    this.mensagem = 'Pesquisa por cliente disponível somente online. Localize a venda original pelo cupom/documento para devolver offline.';
    return false;
  }

  private limparVenda(): void {
    this.venda = null;
    this.quantidades = {};
    this.confirmando = false;
    this.resultado = null;
    this.resultadoLocal = false;
  }

  formatarMoeda(valor: string | number | undefined): string {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(valor || 0));
  }

  private aplicarVenda(venda: VendaDevolucaoConsulta): void {
    if (!venda || (!venda.id && !venda.uuid)) {
      this.limparVenda();
      this.aplicarErro({}, 'Venda inválida. Localize a venda original pelo cupom/documento.');
      return;
    }
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
    if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (letra) => {
      const valor = Math.floor(Math.random() * 16);
      return (letra === 'x' ? valor : (valor & 3) | 8).toString(16);
    });
  }

  private vendaService(): HubVendaService {
    return this.injector.get(HubVendaService);
  }
}
