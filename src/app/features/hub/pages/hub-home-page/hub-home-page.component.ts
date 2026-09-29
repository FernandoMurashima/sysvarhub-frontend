import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { TerminalSessionService } from '../../../terminal/services/terminal-session.service';

interface HubModuleLink {
  title: string;
  route: string;
  description: string;
  state: string;
  primary?: boolean;
}

@Component({
  selector: 'app-hub-home-page',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './hub-home-page.component.html',
  styleUrl: './hub-home-page.component.scss',
})
export class HubHomePageComponent {
  private readonly terminalSession = inject(TerminalSessionService);

  readonly contexto = this.terminalSession.contexto;
  readonly sessionStatus = this.terminalSession.status;

  readonly empresaNome = computed(() => this.contexto()?.empresa.nome || 'Sysvar Hub');
  readonly lojaNome = computed(() => this.contexto()?.loja.apelido || this.contexto()?.loja.nome || '-');
  readonly terminalNome = computed(() => this.contexto()?.terminal.nome || this.contexto()?.terminal.codigo || '-');
  readonly caixaNome = computed(() => this.contexto()?.caixa?.descricao || this.contexto()?.caixa?.codigo || 'Sem caixa vinculado');
  readonly hubEstado = computed(() => this.sessionStatus() === 'contexto-carregado' ? 'Operacional' : 'Carregando contexto');
  readonly comunicacaoCentral = computed(() => this.sessionStatus() === 'contexto-carregado' ? 'Heartbeat local ativo' : 'Não avaliada');

  readonly modules: HubModuleLink[] = [
    {
      title: 'PDV',
      route: '/pdv',
      description: 'Venda, pagamentos, NFC-e e fechamento de caixa do terminal.',
      state: 'Operacional',
      primary: true,
    },
    {
      title: 'Devolução / Troca',
      route: '/devolucao-troca',
      description: 'Área própria para evolução do fluxo de devoluções e trocas.',
      state: 'Estrutura pronta',
    },
    {
      title: 'Consulta de Vendas',
      route: '/consulta-vendas',
      description: 'Base de navegação para localizar vendas da loja.',
      state: 'Estrutura pronta',
    },
    {
      title: 'Vale-Troca',
      route: '/vale-troca',
      description: 'Base dedicada aos vales emitidos e consumidos pela loja.',
      state: 'Estrutura pronta',
    },
    {
      title: 'Pendências de Sincronização',
      route: '/pendencias-sincronizacao',
      description: 'Área reservada para acompanhamento operacional da fila local.',
      state: 'Estrutura pronta',
    },
  ];
}
